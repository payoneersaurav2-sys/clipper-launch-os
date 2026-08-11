import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { Webhook } from 'npm:svix';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const ACCESS_GRANTING_STATUSES = new Set(['active', 'trialing', 'past_due', 'completed']);

type Membership = {
  id: string;
  user_id?: string | null;
  plan_id: string;
  status: string;
  current_period_end?: string | null;
};

type WhopEvent = {
  id?: string;
  type?: string;
  data?: {
    id?: string;
    plan?: { id?: string | null } | null;
    user?: { id?: string | null } | null;
    membership?: { id?: string | null } | null;
    passthrough?: string | null;
    custom_fields?: { user_id?: string | null } | null;
    metadata?: { user_id?: string | null } | null;
    usd_total?: number | null;
  };
};


async function getMembership(whopApiKey: string, membershipId: string) {
  const response = await fetch(`https://api.whop.com/api/v1/memberships/${encodeURIComponent(membershipId)}`, {
    headers: { Authorization: `Bearer ${whopApiKey}` },
  });
  if (!response.ok) throw new Error('Membership lookup failed');
  return await response.json() as Membership;
}

async function syncMembership(admin: ReturnType<typeof createClient>, membership: Membership, whopApiKey?: string, explicitUserId?: string | null) {
  if (!membership.user_id) return;
  const { data: mapping, error: mappingError } = await admin
    .from('whop_plan_mappings').select('tier').eq('whop_plan_id', membership.plan_id).maybeSingle();
  if (mappingError) throw new Error('Plan mapping lookup failed');
  // This webhook can receive events for other Whop products. Never revoke access
  // or change a CreatorOS plan merely because an unrelated plan is unmapped.
  if (!mapping?.tier) return;

  const active = ACCESS_GRANTING_STATUSES.has(membership.status);

  let profileId: string | null = null;

  if (explicitUserId) {
    const { data: directProfile, error: directProfileError } = await admin.from('users').select('id').eq('id', explicitUserId).maybeSingle();
    if (directProfileError) throw new Error('Direct passthrough profile lookup failed');
    if (directProfile?.id) {
      profileId = directProfile.id;
      const { error: whopUpdateError } = await admin.from('users').update({
        whop_id: membership.user_id,
        updated_at: new Date().toISOString(),
      }).eq('id', profileId);
      if (whopUpdateError) throw new Error('Passthrough profile update failed');
    }
  }

  const { data: whopProfile, error: whopProfileError } = await admin.from('users').select('id').eq('whop_id', membership.user_id).maybeSingle();
  if (whopProfileError) throw new Error('Profile lookup failed');

  if (!profileId) profileId = whopProfile?.id ?? null;

  if (!profileId && whopApiKey) {
    try {
      const profileResponse = await fetch(`https://api.whop.com/api/v2/users/${encodeURIComponent(membership.user_id)}`, {
        headers: { Authorization: `Bearer ${whopApiKey}` },
      });
      if (profileResponse.ok) {
        const remoteProfile = await profileResponse.json();
        const remoteEmail = String(remoteProfile?.email ?? '').trim().toLowerCase();
        if (remoteEmail) {
          const { data: userList, error: listError } = await admin.auth.admin.listUsers({ perPage: 1000 });
          if (listError) throw new Error('User directory lookup failed');
          const matchingAuth = userList.users.find((user) => String(user.email ?? '').trim().toLowerCase() === remoteEmail);
          if (matchingAuth) {
            profileId = matchingAuth.id;
            const { error: profileUpsertError } = await admin.from('users').upsert({
              id: matchingAuth.id,
              whop_id: membership.user_id,
              full_name: remoteProfile?.username ?? remoteProfile?.name ?? matchingAuth.email?.split('@')[0] ?? 'Whop User',
              updated_at: new Date().toISOString(),
            }, { onConflict: 'id' });
            if (profileUpsertError) throw new Error('Profile upsert failed');
          }
        }
      }
    } catch {
      // Leave the resolution to the whop_id-only case; we do not want one
      // lookup failure to poison the whole webhook replay.
    }
  }

  if (!profileId) throw new Error('CreatorOS profile is not available yet');

  const { error: updateError } = await admin.from('users').update({
    membership_status: active ? membership.status : 'inactive',
    subscription_tier: active ? mapping.tier : 'free',
    whop_membership_id: membership.id,
    whop_plan_id: membership.plan_id,
    membership_expires_at: membership.current_period_end ?? null,
    entitlement_updated_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }).eq('id', profileId);
  if (updateError) throw new Error('Profile synchronization failed');

  if (active) {
    const { error: grantError } = await admin.rpc('grant_creator_os_subscription_credits', {
      p_user_id: profileId,
      p_tier: mapping.tier,
      p_membership_id: membership.id,
      p_period_end: membership.current_period_end ?? null,
    });
    if (grantError) throw new Error('Subscription credit grant failed');
  }
}

serve(async (request) => {
  if (request.method !== 'POST') return new Response('Method not allowed', { status: 405 });

  const secret = Deno.env.get('WHOP_WEBHOOK_SECRET') ?? '';
  const whopApiKey = Deno.env.get('WHOP_API_KEY') ?? '';
  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
  if (!secret || !whopApiKey || !supabaseUrl || !serviceRoleKey) return new Response('Webhook is not configured', { status: 503 });

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
  let event;

  try {
    event = wh.verify(payload, headers);
  } catch (err) {
    console.error('Signature verification failed:', err instanceof Error ? err.message : err);
    return new Response(
      JSON.stringify({ body: 'Invalid webhook signature', status: 401, success: false }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const body = JSON.parse(payload);
  let parsedEvent: WhopEvent;
  try { parsedEvent = body; } catch { return new Response('Invalid JSON', { status: 400 }); }
  if (!parsedEvent.id || !parsedEvent.type || !parsedEvent.data?.id) return new Response('OK', { status: 200 });

  event = parsedEvent;

  const admin = createClient(supabaseUrl, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } });
  const { data: priorEvent, error: priorEventError } = await admin.from('whop_webhook_events').select('id').eq('id', event.id).maybeSingle();
  if (priorEventError) return new Response('Webhook persistence failed', { status: 500 });
  if (priorEvent) return new Response('OK', { status: 200 });

  const normalizedType = String(event.type ?? '').toLowerCase();
  const isMembership = normalizedType.startsWith('membership.') || normalizedType.startsWith('membership_');
  const isPaymentSucceeded = normalizedType === 'payment.succeeded' || normalizedType === 'payment_succeeded';

  try {
    const explicitUserId = typeof event.data?.passthrough === 'string' && event.data.passthrough.trim().length > 0
      ? event.data.passthrough.trim()
      : event.data?.custom_fields?.user_id ?? event.data?.metadata?.user_id ?? null;

    if (isMembership) {
      await syncMembership(admin, await getMembership(whopApiKey, event.data.id), whopApiKey, explicitUserId);
    } else if (isPaymentSucceeded) {
      const planId = event.data.plan?.id ?? '';
      const whopUserId = event.data.user?.id ?? '';
      if (!planId || !whopUserId) return new Response('Payment payload is incomplete', { status: 400 });

      const { data: pack, error: packError } = await admin
        .from('creator_os_credit_pack_mappings').select('credits, usd_price').eq('whop_plan_id', planId).eq('active', true).maybeSingle();
      if (packError) throw new Error('Credit-pack mapping lookup failed');

      if (pack) {
        const { data: profile, error: profileError } = await admin.from('users').select('id').eq('whop_id', whopUserId).maybeSingle();
        if (profileError) throw new Error('Profile lookup failed');
        if (!profile) throw new Error('CreatorOS profile is not available yet');
        const { error: grantError } = await admin.rpc('grant_creator_os_credits', {
          p_user_id: profile.id,
          p_amount: pack.credits,
          p_transaction_type: 'credit_purchase',
          p_source: 'purchased',
          p_reference_id: event.data.id,
          p_expires_at: null,
          p_metadata: { whopPaymentId: event.data.id, whopPlanId: planId, usdTotal: event.data.usd_total ?? null },
        });
        if (grantError) throw new Error('Purchased-credit grant failed');
      } else if (event.data.membership?.id) {
        // Subscription renewal payments are also a reliable opportunity to grant
        // the next allocation. The grant reference makes replays harmless.
        await syncMembership(admin, await getMembership(whopApiKey, event.data.membership.id), whopApiKey, explicitUserId);
      }
    }
  } catch (error) {
    console.error('Whop synchronization failed', error);
    return new Response('Webhook processing failed', { status: 500 });
  }

  // Persist the event only after all authoritative state changes succeed. Each
  // underlying grant is idempotent as an additional replay safeguard.
  const { error: insertError } = await admin.from('whop_webhook_events').insert({ id: event.id, event_type: event.type });
  if (insertError && insertError.code !== '23505') return new Response('Webhook persistence failed', { status: 500 });
  return new Response('OK', { status: 200 });
});
