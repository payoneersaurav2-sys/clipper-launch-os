import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
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
    usd_total?: number | null;
  };
};

const toBase64 = (bytes: Uint8Array) => {
  let value = '';
  for (const byte of bytes) value += String.fromCharCode(byte);
  return btoa(value);
};

function equalConstantTime(left: string, right: string) {
  if (left.length !== right.length) return false;
  let difference = 0;
  for (let index = 0; index < left.length; index += 1) difference |= left.charCodeAt(index) ^ right.charCodeAt(index);
  return difference === 0;
}

async function verifyWebhook(request: Request, body: string, secret: string) {
  const id = request.headers.get('webhook-id') ?? '';
  const timestamp = request.headers.get('webhook-timestamp') ?? '';
  const signature = request.headers.get('webhook-signature') ?? '';
  const requestAge = Math.abs(Date.now() - Number(timestamp) * 1000);
  if (!id || !timestamp || !signature || !Number.isFinite(requestAge) || requestAge > 5 * 60_000) return false;

  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const calculated = toBase64(new Uint8Array(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`${id}.${timestamp}.${body}`))));
  return signature.split(' ').flatMap((entry) => entry.split(',')).some((entry) => entry.startsWith('v1,') && equalConstantTime(entry.slice(3), calculated));
}

async function getMembership(whopApiKey: string, membershipId: string) {
  const response = await fetch(`https://api.whop.com/api/v1/memberships/${encodeURIComponent(membershipId)}`, {
    headers: { Authorization: `Bearer ${whopApiKey}` },
  });
  if (!response.ok) throw new Error('Membership lookup failed');
  return await response.json() as Membership;
}

async function syncMembership(admin: ReturnType<typeof createClient>, membership: Membership, whopApiKey?: string) {
  if (!membership.user_id) return;
  const { data: mapping, error: mappingError } = await admin
    .from('whop_plan_mappings').select('tier').eq('whop_plan_id', membership.plan_id).maybeSingle();
  if (mappingError) throw new Error('Plan mapping lookup failed');
  // This webhook can receive events for other Whop products. Never revoke access
  // or change a CreatorOS plan merely because an unrelated plan is unmapped.
  if (!mapping?.tier) return;

  const active = ACCESS_GRANTING_STATUSES.has(membership.status);
  const { data: whopProfile, error: whopProfileError } = await admin.from('users').select('id').eq('whop_id', membership.user_id).maybeSingle();
  if (whopProfileError) throw new Error('Profile lookup failed');

  let profileId = whopProfile?.id ?? null;

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

  const body = await request.text();
  if (!(await verifyWebhook(request, body, secret))) return new Response('Invalid webhook signature', { status: 401 });
  let event: WhopEvent;
  try { event = JSON.parse(body); } catch { return new Response('Invalid JSON', { status: 400 }); }
  if (!event.id || !event.type || !event.data?.id) return new Response('OK', { status: 200 });

  const admin = createClient(supabaseUrl, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } });
  const { data: priorEvent, error: priorEventError } = await admin.from('whop_webhook_events').select('id').eq('id', event.id).maybeSingle();
  if (priorEventError) return new Response('Webhook persistence failed', { status: 500 });
  if (priorEvent) return new Response('OK', { status: 200 });

  try {
    if (event.type.startsWith('membership.')) {
      await syncMembership(admin, await getMembership(whopApiKey, event.data.id), whopApiKey);
    } else if (event.type === 'payment.succeeded') {
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
        await syncMembership(admin, await getMembership(whopApiKey, event.data.membership.id), whopApiKey);
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
