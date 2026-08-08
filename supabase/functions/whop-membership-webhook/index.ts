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

  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const calculated = toBase64(new Uint8Array(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`${id}.${timestamp}.${body}`))));
  return signature
    .split(' ')
    .flatMap((entry) => entry.split(','))
    .some((entry) => entry.startsWith('v1,') && equalConstantTime(entry.slice(3), calculated));
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

  let event: { id?: string; type?: string; data?: { id?: string } };
  try {
    event = JSON.parse(body);
  } catch {
    return new Response('Invalid JSON', { status: 400 });
  }
  if (!event.id || !event.type || !event.data?.id || !event.type.startsWith('membership.')) return new Response('OK', { status: 200 });

  const admin = createClient(supabaseUrl, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } });
  const { error: insertedEventError } = await admin
    .from('whop_webhook_events')
    .insert({ id: event.id, event_type: event.type });
  if (insertedEventError) {
    if (insertedEventError.code === '23505') return new Response('OK', { status: 200 });
    return new Response('Webhook persistence failed', { status: 500 });
  }

  const membershipResponse = await fetch(`https://api.whop.com/api/v1/memberships/${encodeURIComponent(event.data.id)}`, {
    headers: { Authorization: `Bearer ${whopApiKey}` },
  });
  if (!membershipResponse.ok) return new Response('Membership lookup failed', { status: 502 });
  const membership = await membershipResponse.json() as Membership;
  if (!membership.user_id) return new Response('OK', { status: 200 });

  const { data: mapping, error: mappingError } = await admin
    .from('whop_plan_mappings')
    .select('tier')
    .eq('whop_plan_id', membership.plan_id)
    .maybeSingle();
  if (mappingError) return new Response('Plan mapping lookup failed', { status: 500 });

  const active = ACCESS_GRANTING_STATUSES.has(membership.status) && Boolean(mapping?.tier);
  const { error: updateError } = await admin
    .from('users')
    .update({
      membership_status: active ? membership.status : 'inactive',
      subscription_tier: active ? mapping!.tier : 'free',
      whop_membership_id: membership.id,
      whop_plan_id: membership.plan_id,
      membership_expires_at: membership.current_period_end ?? null,
      entitlement_updated_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('whop_id', membership.user_id);
  if (updateError) return new Response('Profile synchronization failed', { status: 500 });

  return new Response('OK', { status: 200 });
});
