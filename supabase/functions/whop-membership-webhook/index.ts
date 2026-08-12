import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { Webhook } from 'npm:svix';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const ACCESS_GRANTING_STATUSES = new Set(['active', 'trialing', 'past_due', 'completed']);

async function resolveMappedTier(admin: ReturnType<typeof createClient>, planId: string) {
  if (!planId) return undefined;
  const { data, error } = await admin
    .from('whop_plan_mappings')
    .select('tier')
    .eq('whop_plan_id', planId)
    .maybeSingle();

  if (error) {
    console.error('Whop plan mapping lookup failed:', error);
    throw error;
  }

  return data?.tier;
}

function normalize(value: unknown): string {
  return String(value ?? '').trim();
}

serve(async (request) => {
  if (request.method !== 'POST') return new Response('Method not allowed', { status: 405 });

  const rawSecret = Deno.env.get('WHOP_WEBHOOK_SECRET');
  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

  if (!rawSecret || !supabaseUrl || !serviceRoleKey) {
    return new Response('Webhook is not configured', { status: 503 });
  }

  const svixFormattedSecret = btoa(rawSecret);
  const payload = await request.text();

  const headers = {
    'webhook-id': request.headers.get('webhook-id') || '',
    'webhook-timestamp': request.headers.get('webhook-timestamp') || '',
    'webhook-signature': request.headers.get('webhook-signature') || '',
  };

  const wh = new Webhook(svixFormattedSecret);

  try {
    wh.verify(payload, headers);
  } catch (err) {
    console.error('Signature verification failed:', err instanceof Error ? err.message : err);
    return new Response(
      JSON.stringify({ body: 'Invalid webhook signature', status: 401, success: false }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const body = JSON.parse(payload);
  const data = body.data ?? body;
  const membership = data.membership ?? data;

  const userEmail = normalize(data.user?.email || data.email || membership.user?.email);
  const whopUserId = normalize(membership.user?.id || data.user?.id || data.user_id || data.userId || '');
  const planId = normalize(membership.plan?.id || membership.plan_id || data.plan_id || data.plan?.id || '');
  const whopMembershipId = normalize(membership.id || data.id || data.membership_id || membership.membership?.id);
  const status = normalize(membership.status || data.status || '');
  const expiresAt = normalize(membership.current_period_end || membership.current_period_end_at || membership.expires_at || membership.expiry || '');
  const passthroughId = normalize(data.passthrough || data.passthrough_id || body.passthrough || '');

  const admin = createClient(supabaseUrl, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } });
  const isActive = ACCESS_GRANTING_STATUSES.has(status.toLowerCase());
  const selectedTier = await resolveMappedTier(admin, planId);

  if (!passthroughId && !userEmail && !whopUserId) {
    console.log('No user identity found in webhook payload. Skipping.');
    return new Response(JSON.stringify({ message: 'No user target' }), { status: 200 });
  }

  let profileId: string | null = null;

  if (passthroughId) {
    const { data: existing, error: lookupError } = await admin
      .from('users')
      .select('id')
      .eq('id', passthroughId)
      .maybeSingle();

    if (lookupError) {
      console.error('Supabase passthrough lookup error:', lookupError);
      return new Response(JSON.stringify({ error: lookupError.message }), { status: 500 });
    }

    if (!existing?.id) {
      console.log('Passthrough identity did not resolve to an existing Creator OS profile.');
      return new Response(JSON.stringify({ message: 'No user target' }), { status: 200 });
    }

    profileId = existing.id;
  }

  if (!profileId && userEmail) {
    const { data: authUsers, error: listError } = await admin.auth.admin.listUsers({ perPage: 1000 });
    if (listError) {
      console.error('User directory lookup error:', listError);
      return new Response(JSON.stringify({ error: listError.message }), { status: 500 });
    }

    const matchingAuth = authUsers.users.find((entry) => String(entry.email ?? '').trim().toLowerCase() === userEmail);
    if (!matchingAuth?.id) {
      console.log('Email identity did not resolve to an auth.user row. Skipping.');
      return new Response(JSON.stringify({ message: 'No user target' }), { status: 200 });
    }

    const { data: profile, error: profileError } = await admin
      .from('users')
      .select('id')
      .eq('id', matchingAuth.id)
      .maybeSingle();

    if (profileError) {
      console.error('Supabase profile lookup error:', profileError);
      return new Response(JSON.stringify({ error: profileError.message }), { status: 500 });
    }

    if (!profile?.id) {
      console.log('Email identity resolved to auth user but no Creator OS profile row exists.');
      return new Response(JSON.stringify({ message: 'No user target' }), { status: 200 });
    }

    profileId = profile.id;
  }

  if (!profileId && whopUserId) {
    const { data: profile, error: profileError } = await admin
      .from('users')
      .select('id')
      .eq('whop_id', whopUserId)
      .maybeSingle();

    if (profileError) {
      console.error('Supabase whop_id lookup error:', profileError);
      return new Response(JSON.stringify({ error: profileError.message }), { status: 500 });
    }

    if (profile?.id) {
      profileId = profile.id;
    }
  }

  if (!profileId) {
    console.log('No Creator OS profile found for the webhook identity.');
    return new Response(JSON.stringify({ message: 'No user target' }), { status: 200 });
  }

  const updatePayload: Record<string, unknown> = {
    membership_status: isActive ? 'active' : 'inactive',
    updated_at: new Date().toISOString(),
  };

  if (selectedTier) {
    updatePayload.subscription_tier = isActive ? selectedTier : 'free';
  } else if (!isActive) {
    updatePayload.subscription_tier = 'free';
  }

  if (whopUserId) updatePayload.whop_id = whopUserId;
  if (whopMembershipId) updatePayload.whop_membership_id = whopMembershipId;
  if (planId) updatePayload.whop_plan_id = planId;
  updatePayload.membership_expires_at = isActive ? (expiresAt || null) : null;

  const { data: updated, error } = await admin
    .from('users')
    .update(updatePayload)
    .eq('id', profileId)
    .select();

  if (error) {
    console.error('Supabase update error:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  // When the membership is active and we resolved a mapped tier, grant
  // subscription credits according to the plan limits. This ensures paid
  // users receive their monthly credit allotment on successful webhook.
  try {
    if (isActive && selectedTier) {
      await admin.rpc('grant_creator_os_subscription_credits', {
        p_user_id: profileId,
        p_tier: selectedTier,
        p_membership_id: whopMembershipId || null,
        p_period_end: expiresAt || null,
      });
    }
  } catch (rpcErr) {
    console.error('Failed to grant subscription credits:', rpcErr instanceof Error ? rpcErr.message : rpcErr);
    // Do not fail the webhook — credit grants are best-effort and can be
    // retried from server-side maintenance if needed.
  }

  console.log('Profile successfully updated:', updated);
  return new Response(JSON.stringify({ success: true }), { status: 200 });
});
