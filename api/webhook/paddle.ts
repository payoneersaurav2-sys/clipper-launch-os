/**
 * Paddle webhook handler — Vercel Edge Function.
 *
 * Route: POST /api/webhook/paddle
 *
 * Environment variables required (Vercel server-only):
 *   PADDLE_API_KEY                    – sandbox: "pdl_sdbx_..."  |  live: "pdl_live_..."
 *   PADDLE_NOTIFICATION_WEBHOOK_SECRET – from Paddle dashboard > Notifications > destination secret
 *   SUPABASE_URL                      – your Supabase project URL
 *   SUPABASE_SERVICE_ROLE_KEY or SUPABASE_SECRET_KEY – server-only Supabase admin key
 *
 * Paddle docs: https://developer.paddle.com/webhooks/overview
 */

import { Paddle, Environment, EventName } from '@paddle/paddle-node-sdk';
import { createClient } from '@supabase/supabase-js';
import { getPaddleUserBindingSecret, verifyPaddleUserBinding } from '../paddle-user-binding';

export const config = { runtime: 'edge' };

const environment = () => (globalThis as unknown as { process?: { env?: Record<string, string | undefined> } }).process?.env ?? {};

export function validatePaddleServerConfig(
  env: Record<string, string | undefined> = environment(),
): { ok: boolean; errors: string[] } {
  const errors: string[] = [];
  const mode = (env.PADDLE_ENV ?? 'sandbox').toLowerCase();
  const apiKey = env.PADDLE_API_KEY ?? '';
  const secret = env.PADDLE_NOTIFICATION_WEBHOOK_SECRET ?? '';

  if (!['sandbox', 'production'].includes(mode)) {
    errors.push('PADDLE_ENV must be "sandbox" or "production".');
  }

  if (!apiKey) {
    errors.push('PADDLE_API_KEY is required.');
  } else if (!/^pdl_(sdbx|live)_/.test(apiKey)) {
    errors.push('PADDLE_API_KEY must use a Paddle sandbox or live key prefix.');
  } else if (mode === 'sandbox' && apiKey.startsWith('pdl_live_')) {
    errors.push('Sandbox mode cannot use a live Paddle API key.');
  } else if (mode === 'production' && apiKey.startsWith('pdl_sdbx_')) {
    errors.push('Production mode cannot use a sandbox Paddle API key.');
  }

  if (!secret) {
    errors.push('PADDLE_NOTIFICATION_WEBHOOK_SECRET is required.');
  }

  const bindingSecret = env.PADDLE_CUSTOM_DATA_SECRET;
  if (bindingSecret && bindingSecret.length < 32) {
    errors.push('PADDLE_CUSTOM_DATA_SECRET must be at least 32 characters.');
  } else if (!bindingSecret && secret.length < 32) {
    errors.push('PADDLE_NOTIFICATION_WEBHOOK_SECRET must be at least 32 characters when PADDLE_CUSTOM_DATA_SECRET is not set.');
  }

  const pricePairs = [
    ['PADDLE_PRICE_CREATOR_MONTHLY', 'VITE_PADDLE_PRICE_CREATOR_MONTHLY'],
    ['PADDLE_PRICE_CREATOR_ANNUAL', 'VITE_PADDLE_PRICE_CREATOR_ANNUAL'],
    ['PADDLE_PRICE_PRO_MONTHLY', 'VITE_PADDLE_PRICE_PRO_MONTHLY'],
    ['PADDLE_PRICE_PRO_ANNUAL', 'VITE_PADDLE_PRICE_PRO_ANNUAL'],
    ['PADDLE_PRICE_AGENCY_MONTHLY', 'VITE_PADDLE_PRICE_AGENCY_MONTHLY'],
    ['PADDLE_PRICE_AGENCY_ANNUAL', 'VITE_PADDLE_PRICE_AGENCY_ANNUAL'],
  ] as const;

  for (const [serverKey, clientKey] of pricePairs) {
    const serverValue = env[serverKey];
    const clientValue = env[clientKey];

    if (serverValue && !serverValue.startsWith('pri_')) {
      errors.push(`${serverKey} must be a Paddle price ID starting with "pri_".`);
    }
    if (clientValue && !clientValue.startsWith('pri_')) {
      errors.push(`${clientKey} must be a Paddle price ID starting with "pri_".`);
    }
    if (serverValue && clientValue && serverValue !== clientValue) {
      errors.push(`${serverKey} and ${clientKey} must match to avoid sandbox/live mismatches.`);
    }
  }

  return { ok: errors.length === 0, errors };
}

// ─── helpers ──────────────────────────────────────────────────────────────────

// ─── live ip allowlist ────────────────────────────────────────────────────────
let cachedAllowedCidrs: { cidrs: string[]; expiresAt: number } | null = null;

async function getPaddleAllowedCidrs(): Promise<string[]> {
  const now = Date.now();
  if (cachedAllowedCidrs && cachedAllowedCidrs.expiresAt > now) {
    return cachedAllowedCidrs.cidrs;
  }
  try {
    const res = await fetch('https://api.paddle.com/ips', {
      headers: { 'User-Agent': 'CreatorOS-Webhook/1.0' },
    });
    if (res.ok) {
      const data = await res.json();
      const cidrs: string[] = data?.data?.ipv4_cidrs || [];
      if (cidrs.length > 0) {
        cachedAllowedCidrs = { cidrs, expiresAt: now + 24 * 60 * 60 * 1000 };
        return cidrs;
      }
    }
  } catch (err) {
    console.error('[paddle-webhook] Failed to fetch live Paddle IPs:', err);
  }
  return cachedAllowedCidrs?.cidrs || [];
}

function ipMatchesCidr(ip: string, cidr: string): boolean {
  const [range, bitsStr] = cidr.split('/');
  const bits = bitsStr ? parseInt(bitsStr, 10) : 32;
  if (bits === 32) return ip === range;
  const ipParts = ip.split('.').map((p) => parseInt(p, 10));
  const rangeParts = range.split('.').map((p) => parseInt(p, 10));
  if (ipParts.length !== 4 || rangeParts.length !== 4) return false;
  const ipNum = ((ipParts[0] << 24) | (ipParts[1] << 16) | (ipParts[2] << 8) | ipParts[3]) >>> 0;
  const rangeNum = ((rangeParts[0] << 24) | (rangeParts[1] << 16) | (rangeParts[2] << 8) | rangeParts[3]) >>> 0;
  const mask = bits === 0 ? 0 : (~0 << (32 - bits)) >>> 0;
  return (ipNum & mask) === (rangeNum & mask);
}


function getPaddleEnv(): Environment {
  const env = environment();
  return (env.PADDLE_ENV ?? 'sandbox') === 'production'
    ? Environment.production
    : Environment.sandbox;
}

function getSupabaseAdmin() {
  const env = environment();
  const url = env.SUPABASE_URL || env.VITE_SUPABASE_URL;
  const key = env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SECRET_KEY;
  if (!url || !key) throw new Error('Missing SUPABASE_URL or Supabase server-side admin key');
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

/**
 * Maps a Paddle subscription status to the Creator OS membership_status vocabulary.
 * Normalizes Paddle subscription status to Creator OS membership_status.
 */
function toMembershipStatus(paddleStatus: string): string {
  switch (paddleStatus) {
    case 'active':     return 'active';
    case 'trialing':   return 'trialing';
    case 'past_due':   return 'past_due';
    case 'paused':     return 'inactive';
    case 'canceled':   return 'inactive';
    default:           return 'inactive';
  }
}

/**
 * Maps a Paddle price ID to a Creator OS subscription tier.
 * Replace placeholder values with real IDs from your Paddle dashboard.
 */
function tierFromPriceId(priceId: string): string | null {
  const env = environment();
  const PRICE_TIER_MAP: Record<string, string> = {
    // ── Creator ────────────────────────────────────────────────────────
    [env.PADDLE_PRICE_CREATOR_MONTHLY ?? 'REPLACE_creator_monthly']: 'creator',
    [env.PADDLE_PRICE_CREATOR_ANNUAL  ?? 'REPLACE_creator_annual']:  'creator',
    // ── Pro ────────────────────────────────────────────────────────────
    [env.PADDLE_PRICE_PRO_MONTHLY ?? 'REPLACE_pro_monthly']: 'pro',
    [env.PADDLE_PRICE_PRO_ANNUAL  ?? 'REPLACE_pro_annual']:  'pro',
    // ── Agency ─────────────────────────────────────────────────────────
    [env.PADDLE_PRICE_AGENCY_MONTHLY ?? 'REPLACE_agency_monthly']: 'agency',
    [env.PADDLE_PRICE_AGENCY_ANNUAL  ?? 'REPLACE_agency_annual']:  'agency',
  };
  return PRICE_TIER_MAP[priceId] ?? null;
}

// ─── handler ──────────────────────────────────────────────────────────────────

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  const env = environment();
  const configValidation = validatePaddleServerConfig(env);
  if (!configValidation.ok) {
    console.error('[paddle-webhook] Invalid Paddle configuration:', configValidation.errors.join(' '));
    return new Response('Server misconfiguration', { status: 500 });
  }

  const secret = env.PADDLE_NOTIFICATION_WEBHOOK_SECRET;
  const apiKey = env.PADDLE_API_KEY;
  if (!secret || !apiKey) {
    console.error('[paddle-webhook] Missing PADDLE_NOTIFICATION_WEBHOOK_SECRET or PADDLE_API_KEY');
    return new Response('Server misconfiguration', { status: 500 });
  }

  const signature = req.headers.get('paddle-signature');
  if (!signature) {
    return new Response('Missing paddle-signature header', { status: 400 });
  }

  // ── 0. Live IP allowlist verification ─────────────────────────────────────
  // Enforced in production only (sandbox / dev tunnels bypass). Fetches dynamic live IPs from https://api.paddle.com/ips
  if (getPaddleEnv() === Environment.production) {
    const forwarded = req.headers.get('x-forwarded-for');
    const realIp = req.headers.get('x-real-ip');
    const clientIp = (forwarded ? forwarded.split(',')[0] : realIp)?.trim();

    if (clientIp) {
      const allowedCidrs = await getPaddleAllowedCidrs();
      if (allowedCidrs.length > 0) {
        const isAllowed = allowedCidrs.some((cidr) => ipMatchesCidr(clientIp, cidr));
        if (!isAllowed) {
          console.warn('[paddle-webhook] Unauthorized delivery attempt from source IP: ' + clientIp);
          return new Response('Forbidden: IP not allowlisted', { status: 403 });
        }
      }
    }
  }


  const rawBody = await req.text();

  // ── 1. Signature verification ──────────────────────────────────────────────
  const paddle = new Paddle(apiKey, { environment: getPaddleEnv() });
  let event: any;
  try {
    event = await paddle.webhooks.unmarshal(rawBody, secret, signature);
  } catch (err) {
    console.error('[paddle-webhook] Signature verification failed:', err);
    return new Response('Invalid signature', { status: 400 });
  }

  if (!event) {
    return new Response('Invalid event payload', { status: 400 });
  }

  const eventId   = (event as any).eventId ?? (event as any).notificationId ?? (event as any).id ?? '';
  const eventType = ((event as any).eventType ?? (event as any).event_type) as string;

  console.log(`[paddle-webhook] Processing verified event: ${eventType} (id: ${eventId})`);

  const supabase = getSupabaseAdmin();

  // ── 2. Idempotency check ───────────────────────────────────────────────────
  const { data: existing, error: lookupError } = await supabase
    .from('paddle_webhook_events')
    .select('id')
    .eq('id', eventId)
    .maybeSingle();

  if (lookupError) {
    console.error('[paddle-webhook] Failed to check event idempotency:', lookupError);
    return new Response('Unable to verify event idempotency', { status: 500 });
  }

  if (existing) {
    console.log(`[paddle-webhook] Duplicate event ${eventId} — skipping`);
    return new Response('OK (duplicate)', { status: 200 });
  }

  // ── 3. Route event ─────────────────────────────────────────────────────────
  try {
    if (
      eventType === EventName.SubscriptionCreated ||
      eventType === EventName.SubscriptionUpdated ||
      eventType === EventName.SubscriptionActivated ||
      eventType === 'subscription.created' ||
      eventType === 'subscription.updated' ||
      eventType === 'subscription.activated' ||
      eventType === 'subscription.trialing' ||
      eventType === 'subscription.past_due' ||
      eventType === 'subscription.resumed'
    ) {
      await handleSubscriptionUpsert(event, supabase);
    } else if (eventType === EventName.SubscriptionCanceled || eventType === 'subscription.canceled') {
      await handleSubscriptionCanceled(event, supabase);
    } else if (eventType === EventName.SubscriptionPaused || eventType === 'subscription.paused') {
      await handleSubscriptionPaused(event, supabase);
    }
    // Other event types (transaction.*) are logged but not acted on yet.
    // Record completion only after processing, so transient failures remain retryable.
    const { error: ledgerError } = await supabase
      .from('paddle_webhook_events')
      .insert({ id: eventId, event_type: eventType });

    if (ledgerError && ledgerError.code !== '23505') throw ledgerError;
  } catch (err) {
    console.error(`[paddle-webhook] Error processing ${eventType}:`, err);
    return new Response('Internal processing error', { status: 500 });
  }

  return new Response('OK', { status: 200 });
}

// ─── event handlers ───────────────────────────────────────────────────────────

async function handleSubscriptionUpsert(
  event: Record<string, unknown>,
  supabase: ReturnType<typeof getSupabaseAdmin>,
): Promise<void> {
  const sub = (event as { data?: Record<string, unknown> }).data;
  if (!sub) throw new Error('No subscription data in event');

  const paddleCustomerId    = (sub.customerId || sub.customer_id) as string | undefined;
  const paddleSubscriptionId = (sub.id || sub.subscription_id)   as string | undefined;
  const status              = sub.status                         as string | undefined;
  const customData          = (sub.customData || sub.custom_data) as Record<string, unknown> | undefined;
  const items               = sub.items                          as Array<{ price?: { id?: string } }> | undefined;
  const scheduledChange     = (sub.scheduledChange || sub.scheduled_change) as { action?: string; effectiveAt?: string; effective_at?: string } | null | undefined;

  if (!paddleCustomerId || !paddleSubscriptionId) throw new Error('Missing Paddle customer or subscription ID');

  const userId = await resolvePaddleUserId(
    supabase,
    paddleCustomerId,
    paddleSubscriptionId,
    customData,
  );
  if (!userId) {
    console.warn('[paddle-webhook] Subscription identity could not be securely linked; no entitlement changes applied');
    return;
  }

  // Resolve tier from price.
  const priceId = items?.[0]?.price?.id;
  const tier    = priceId ? tierFromPriceId(priceId) : null;
  if (!tier) {
    console.warn(`[paddle-webhook] Unknown priceId ${priceId} — cannot map to tier`);
    return;
  }

  const membershipStatus = toMembershipStatus(status ?? '');

  // For scheduled cancellations, keep the user active until the period ends.
  const effAt = scheduledChange?.effectiveAt || scheduledChange?.effective_at;
  const expiresAt =
    scheduledChange?.action === 'cancel' && effAt
      ? effAt
      : null;

  const { error } = await supabase
    .from('users')
    .update({
      billing_provider:       'paddle',
      membership_status:       membershipStatus,
      subscription_tier:       tier,
      paddle_customer_id:      paddleCustomerId,
      paddle_subscription_id:  paddleSubscriptionId,
      membership_expires_at:  expiresAt,
      entitlement_updated_at:  new Date().toISOString(),
    })
    .eq('id', userId);

  if (error) throw error;

  console.log(`[paddle-webhook] User ${userId} → tier=${tier} status=${membershipStatus}`);

  // When the membership is active or trialing and we resolved a mapped tier, grant
  // subscription credits according to the plan limits.
  if (['active', 'trialing'].includes(membershipStatus) && tier) {
    try {
      const billingEnd =
        (sub.currentBillingPeriod as any)?.endsAt ||
        (sub.current_billing_period as any)?.ends_at ||
        sub.nextBilledAt ||
        sub.next_billed_at ||
        null;

      await supabase.rpc('grant_creator_os_subscription_credits', {
        p_user_id: userId,
        p_tier: tier,
        p_membership_id: paddleSubscriptionId || null,
        p_period_end: billingEnd,
      });
      console.log(`[paddle-webhook] Granted subscription credits for user ${userId} (tier=${tier})`);
    } catch (creditErr) {
      console.error('[paddle-webhook] Failed to grant subscription credits:', creditErr);
    }
  }
}

async function handleSubscriptionCanceled(
  event: Record<string, unknown>,
  supabase: ReturnType<typeof getSupabaseAdmin>,
): Promise<void> {
  const sub       = (event as { data?: Record<string, unknown> }).data;
  const paddleSubscriptionId = (sub?.id || sub?.subscription_id) as string | undefined;
  if (!paddleSubscriptionId) throw new Error('Missing Paddle subscription identity in cancellation event');
  const userId = await findMappedPaddleUserId(supabase, paddleSubscriptionId);
  if (!userId) return;

  const { error } = await supabase
    .from('users')
    .update({
      billing_provider:      'paddle',
      membership_status:      'inactive',
      entitlement_updated_at: new Date().toISOString(),
    })
    .eq('id', userId)
    .eq('billing_provider', 'paddle')
    .eq('paddle_subscription_id', paddleSubscriptionId);

  if (error) throw error;
  console.log(`[paddle-webhook] User ${userId} subscription canceled → inactive`);
}

async function handleSubscriptionPaused(
  event: Record<string, unknown>,
  supabase: ReturnType<typeof getSupabaseAdmin>,
): Promise<void> {
  const sub       = (event as { data?: Record<string, unknown> }).data;
  const paddleSubscriptionId = (sub?.id || sub?.subscription_id) as string | undefined;
  if (!paddleSubscriptionId) throw new Error('Missing Paddle subscription identity in pause event');
  const userId = await findMappedPaddleUserId(supabase, paddleSubscriptionId);
  if (!userId) return;

  const { error } = await supabase
    .from('users')
    .update({
      billing_provider:      'paddle',
      membership_status:      'inactive',
      entitlement_updated_at: new Date().toISOString(),
    })
    .eq('id', userId)
    .eq('billing_provider', 'paddle')
    .eq('paddle_subscription_id', paddleSubscriptionId);

  if (error) throw error;
  console.log(`[paddle-webhook] User ${userId} subscription paused → inactive`);
}

async function findMappedPaddleUserId(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  paddleSubscriptionId: string,
): Promise<string | null> {
  const { data, error } = await supabase
    .from('users')
    .select('id')
    .eq('billing_provider', 'paddle')
    .eq('paddle_subscription_id', paddleSubscriptionId)
    .maybeSingle();
  if (error) throw error;
  return data?.id ?? null;
}

async function findMappedPaddleCustomerUserId(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  paddleCustomerId: string,
): Promise<string | null> {
  const { data, error } = await supabase
    .from('users')
    .select('id')
    .eq('billing_provider', 'paddle')
    .eq('paddle_customer_id', paddleCustomerId)
    .maybeSingle();
  if (error) throw error;
  return data?.id ?? null;
}

async function resolvePaddleUserId(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  paddleCustomerId: string,
  paddleSubscriptionId: string,
  customData?: Record<string, unknown>,
): Promise<string | null> {
  const customUserId = (customData?.userId || customData?.user_id);
  const binding = customData?.userBinding;
  const secret = await getPaddleUserBindingSecret();
  const signedUserId = typeof customUserId === 'string'
    && typeof binding === 'string'
    && secret
    && await verifyPaddleUserBinding(customUserId, binding, secret)
    ? customUserId
    : null;

  const [subscriptionOwner, customerOwner] = await Promise.all([
    findMappedPaddleUserId(supabase, paddleSubscriptionId),
    findMappedPaddleCustomerUserId(supabase, paddleCustomerId),
  ]);
  if (subscriptionOwner && customerOwner && subscriptionOwner !== customerOwner) {
    throw new Error('Paddle subscription and customer map to different Creator OS users');
  }

  const mappedUserId = subscriptionOwner || customerOwner;
  if (customUserId && mappedUserId && customUserId !== mappedUserId) {
    console.warn('[paddle-webhook] Checkout identity conflicts with the existing Paddle customer mapping');
    return null;
  }
  if (!signedUserId && !mappedUserId) return null;

  const userId = signedUserId || mappedUserId;
  if (!userId || (mappedUserId && mappedUserId !== userId)) return null;

  const { data: profile, error } = await supabase
    .from('users')
    .select('id, paddle_customer_id')
    .eq('id', userId)
    .maybeSingle();
  if (error) throw error;
  if (!profile || (profile.paddle_customer_id && profile.paddle_customer_id !== paddleCustomerId)) {
    console.warn('[paddle-webhook] Paddle customer does not match the linked Creator OS account');
    return null;
  }

  return userId;
}
