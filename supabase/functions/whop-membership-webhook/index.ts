import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { Webhook } from 'npm:svix';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const PLAN_MAP: Record<string, { tier: string; interval: string }> = {
  'plan_x36ZUqtqy8DUf': { tier: 'creator', interval: 'monthly' },
  // Add your other plan IDs here
};

serve(async (request) => {
  if (request.method !== 'POST') return new Response('Method not allowed', { status: 405 });

  const secret = Deno.env.get('WHOP_WEBHOOK_SECRET') ?? '';
  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

  if (!secret || !supabaseUrl || !serviceRoleKey) {
    return new Response('Webhook is not configured', { status: 503 });
  }

  const rawSecret = Deno.env.get('WHOP_WEBHOOK_SECRET');
  if (!rawSecret) {
    console.error('WHOP_WEBHOOK_SECRET is missing in environment.');
    return new Response('Server Configuration Error', { status: 500 });
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
  const data = body.data || body;

  const userEmail = String(data.user?.email || data.email || '').trim().toLowerCase();
  const whopUserId = String(data.user?.id || data.user_id || body.whopUserId || '').trim();
  const planId = String(data.plan_id || body.planId || data.plan?.id || '').trim();
  const passthroughId = String(data.passthrough || body.passthrough || '').trim();

  const selectedPlan = PLAN_MAP[planId] || { tier: 'creator', interval: 'monthly' };

  const admin = createClient(supabaseUrl, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } });

  if (!passthroughId && !userEmail) {
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
  } else if (userEmail) {
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

  if (!profileId) {
    console.log('No Creator OS profile found for the webhook identity.');
    return new Response(JSON.stringify({ message: 'No user target' }), { status: 200 });
  }

  const { data: updated, error } = await admin
    .from('users')
    .update({
      subscription_tier: selectedPlan.tier,
      membership_status: 'active',
      whop_id: whopUserId || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', profileId)
    .select();

  if (error) {
    console.error('Supabase update error:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  console.log('Profile successfully updated:', updated);
  return new Response(JSON.stringify({ success: true }), { status: 200 });
});
