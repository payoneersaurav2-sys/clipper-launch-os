import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import test from 'node:test';
import handler, { validatePaddleServerConfig } from './paddle';
import { getPaddleUserBindingSecret, signPaddleUserBinding } from '../paddle-user-binding';

const envKeys = [
  'PADDLE_API_KEY',
  'PADDLE_ENV',
  'PADDLE_NOTIFICATION_WEBHOOK_SECRET',
  'PADDLE_CUSTOM_DATA_SECRET',
  'PADDLE_PRICE_CREATOR_MONTHLY',
  'SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
] as const;

async function withWebhookEnvironment<T>(run: () => Promise<T>): Promise<T> {
  const previous = Object.fromEntries(envKeys.map((key) => [key, process.env[key]]));
  Object.assign(process.env, {
    PADDLE_API_KEY: 'pdl_sdbx_test_key',
    PADDLE_ENV: 'sandbox',
    PADDLE_NOTIFICATION_WEBHOOK_SECRET: 'pdl_ntfset_test_secret_with_at_least_32_chars',
    PADDLE_CUSTOM_DATA_SECRET: 'creator-os-paddle-binding-test-secret-32bytes',
    PADDLE_PRICE_CREATOR_MONTHLY: 'pri_creator_test',
    SUPABASE_URL: 'https://supabase.local.test',
    SUPABASE_SERVICE_ROLE_KEY: 'test-service-role',
  });

  try {
    return await run();
  } finally {
    for (const key of envKeys) {
      if (previous[key] === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = previous[key];
      }
    }
  }
}

function paddleSignature(body: string, secret: string): string {
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const digest = createHmac('sha256', secret).update(`${timestamp}:${body}`).digest('hex');
  return `ts=${timestamp};h1=${digest}`;
}

test('Paddle webhook rejects invalid signatures before contacting Supabase', async () => {
  await withWebhookEnvironment(async () => {
    const originalFetch = globalThis.fetch;
    let fetchCount = 0;
    globalThis.fetch = async () => {
      fetchCount += 1;
      throw new Error('Unexpected network request');
    };

    try {
      const response = await handler(new Request('https://local.test/api/webhook/paddle', {
        method: 'POST',
        headers: { 'paddle-signature': 'ts=1;h1=invalid' },
        body: JSON.stringify({ eventType: 'subscription.created', data: {} }),
      }));

      assert.equal(response.status, 400);
      assert.equal(fetchCount, 0);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});

test('Paddle server config fails closed on sandbox/live mismatches', async () => {
  const ok = validatePaddleServerConfig({
    PADDLE_ENV: 'sandbox',
    PADDLE_API_KEY: 'pdl_sdbx_test_key',
    PADDLE_NOTIFICATION_WEBHOOK_SECRET: 'pdl_ntfset_test_secret_with_at_least_32_chars',
    PADDLE_CUSTOM_DATA_SECRET: 'creator-os-paddle-binding-test-secret-32bytes',
    PADDLE_PRICE_CREATOR_MONTHLY: 'pri_creator_test',
    VITE_PADDLE_PRICE_CREATOR_MONTHLY: 'pri_creator_test',
    PADDLE_PRICE_PRO_MONTHLY: 'pri_pro_test',
    VITE_PADDLE_PRICE_PRO_MONTHLY: 'pri_pro_test',
  });

  assert.equal(ok.ok, true);

  const bad = validatePaddleServerConfig({
    PADDLE_ENV: 'sandbox',
    PADDLE_API_KEY: 'pdl_live_production_key',
    PADDLE_NOTIFICATION_WEBHOOK_SECRET: 'pdl_ntfset_test_secret_with_at_least_32_chars',
    PADDLE_CUSTOM_DATA_SECRET: 'creator-os-paddle-binding-test-secret-32bytes',
    PADDLE_PRICE_CREATOR_MONTHLY: 'pri_creator_test',
    VITE_PADDLE_PRICE_CREATOR_MONTHLY: 'pri_creator_test_other',
  });

  assert.equal(bad.ok, false);
  assert.match(bad.errors.join(' '), /Sandbox mode cannot use a live Paddle API key|must match/i);
});

test('Paddle user binding derives a domain-separated key when no dedicated secret is configured', async () => {
  await withWebhookEnvironment(async () => {
    delete process.env.PADDLE_CUSTOM_DATA_SECRET;
    const secret = await getPaddleUserBindingSecret();
    const config = validatePaddleServerConfig({
      PADDLE_ENV: 'sandbox',
      PADDLE_API_KEY: 'pdl_sdbx_test_key',
      PADDLE_NOTIFICATION_WEBHOOK_SECRET: process.env.PADDLE_NOTIFICATION_WEBHOOK_SECRET,
      PADDLE_PRICE_CREATOR_MONTHLY: 'pri_creator_test',
    });

    assert.equal(config.ok, true);
    assert.ok(secret);
    assert.notEqual(secret, process.env.PADDLE_NOTIFICATION_WEBHOOK_SECRET);
    assert.equal(secret.length, 64);
  });
});

test('verified Paddle subscription events require signed account binding and record Paddle provenance', async () => {
  await withWebhookEnvironment(async () => {
    delete process.env.PADDLE_CUSTOM_DATA_SECRET;
    const originalFetch = globalThis.fetch;
    const userUpdates: Record<string, unknown>[] = [];
    globalThis.fetch = async (input, init) => {
      const url = new URL(String(input));
      const method = init?.method ?? 'GET';

      if (url.pathname.endsWith('/users') && method === 'GET') {
        if (url.searchParams.has('id')) {
          return new Response(JSON.stringify({
            id: '40112e30-af17-494a-99ac-b2ff36c17ad3',
            paddle_customer_id: null,
          }), { status: 200, headers: { 'Content-Type': 'application/json' } });
        }
        return new Response('null', { status: 200, headers: { 'Content-Type': 'application/json' } });
      }
      if (url.pathname.endsWith('/paddle_webhook_events') && method === 'GET') {
        return new Response('null', { status: 200, headers: { 'Content-Type': 'application/json' } });
      }
      if (url.pathname.endsWith('/paddle_webhook_events') && method === 'POST') {
        return new Response(null, { status: 201 });
      }
      if (url.pathname.endsWith('/users') && method === 'PATCH') {
        userUpdates.push(JSON.parse(String(init?.body)) as Record<string, unknown>);
        return new Response(null, { status: 204 });
      }
      if (url.pathname.endsWith('/rpc/grant_creator_os_subscription_credits') && method === 'POST') {
        return new Response('null', { status: 200 });
      }

      throw new Error(`Unexpected Supabase request: ${method} ${url.pathname}`);
    };

    const secret = 'pdl_ntfset_test_secret_with_at_least_32_chars';
    const userId = '40112e30-af17-494a-99ac-b2ff36c17ad3';
    const bindingSecret = await getPaddleUserBindingSecret();
    assert.ok(bindingSecret);
    const userBinding = await signPaddleUserBinding(userId, bindingSecret);
    const body = JSON.stringify({
      event_id: 'evt_test_001',
      notification_id: 'ntf_test_001',
      event_type: 'subscription.created',
      occurred_at: '2026-10-21T00:00:00Z',
      data: {
        id: 'sub_test_verified',
        customer_id: 'ctm_test_customer',
        status: 'active',
        custom_data: { userId, userBinding },
        items: [{ price: { id: 'pri_creator_test' } }],
        billing_cycle: { interval: 'month', frequency: 1 },
        current_billing_period: { starts_at: '2026-10-21T00:00:00Z', ends_at: '2099-01-01T00:00:00Z' },
      },
    });

    try {
      const response = await handler(new Request('https://local.test/api/webhook/paddle', {
        method: 'POST',
        headers: { 'paddle-signature': paddleSignature(body, secret) },
        body,
      }));

      assert.equal(response.status, 200);
      assert.equal(userUpdates.length, 1);
      assert.equal(userUpdates[0].billing_provider, 'paddle');
      assert.equal(userUpdates[0].paddle_subscription_id, 'sub_test_verified');
      assert.equal(userUpdates[0].subscription_tier, 'creator');
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});

test('failed subscription updates stay retryable until processing succeeds', async () => {
  await withWebhookEnvironment(async () => {
    const originalFetch = globalThis.fetch;
    const eventId = 'evt_test_retry_after_processing_failure';
    const userId = '40112e30-af17-494a-99ac-b2ff36c17ad3';
    const completedEvents = new Set<string>();
    const userUpdates: Record<string, unknown>[] = [];
    let failNextProfileUpdate = true;
    let ledgerInsertCount = 0;

    globalThis.fetch = async (input, init) => {
      const url = new URL(String(input));
      const method = init?.method ?? 'GET';

      if (url.pathname.endsWith('/paddle_webhook_events') && method === 'GET') {
        return new Response(
          JSON.stringify(completedEvents.has(eventId) ? { id: eventId } : null),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        );
      }
      if (url.pathname.endsWith('/paddle_webhook_events') && method === 'POST') {
        ledgerInsertCount += 1;
        completedEvents.add(eventId);
        return new Response(null, { status: 201 });
      }
      if (url.pathname.endsWith('/users') && method === 'GET') {
        if (url.searchParams.has('id')) {
          return new Response(JSON.stringify({ id: userId, paddle_customer_id: null }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          });
        }
        return new Response('null', { status: 200, headers: { 'Content-Type': 'application/json' } });
      }
      if (url.pathname.endsWith('/users') && method === 'PATCH') {
        userUpdates.push(JSON.parse(String(init?.body)) as Record<string, unknown>);
        if (failNextProfileUpdate) {
          failNextProfileUpdate = false;
          return new Response(JSON.stringify({ code: 'XX000', message: 'Temporary database error' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
          });
        }
        return new Response(null, { status: 204 });
      }
      if (url.pathname.endsWith('/rpc/grant_creator_os_subscription_credits') && method === 'POST') {
        return new Response('null', { status: 200 });
      }

      throw new Error(`Unexpected Supabase request: ${method} ${url.pathname}`);
    };

    const userBinding = await signPaddleUserBinding(userId, process.env.PADDLE_CUSTOM_DATA_SECRET!);
    const body = JSON.stringify({
      event_id: eventId,
      notification_id: 'ntf_test_retry_after_processing_failure',
      event_type: 'subscription.created',
      occurred_at: '2026-10-21T00:00:00Z',
      data: {
        id: 'sub_test_retry_after_processing_failure',
        customer_id: 'ctm_test_retry_after_processing_failure',
        status: 'trialing',
        custom_data: { userId, userBinding },
        items: [{ price: { id: 'pri_creator_test' } }],
        billing_cycle: { interval: 'month', frequency: 1 },
        current_billing_period: { starts_at: '2026-10-21T00:00:00Z', ends_at: '2099-01-01T00:00:00Z' },
      },
    });

    try {
      const firstResponse = await handler(new Request('https://local.test/api/webhook/paddle', {
        method: 'POST',
        headers: { 'paddle-signature': paddleSignature(body, 'pdl_ntfset_test_secret_with_at_least_32_chars') },
        body,
      }));

      assert.equal(firstResponse.status, 500);
      assert.equal(completedEvents.has(eventId), false);
      assert.equal(ledgerInsertCount, 0);

      const retryResponse = await handler(new Request('https://local.test/api/webhook/paddle', {
        method: 'POST',
        headers: { 'paddle-signature': paddleSignature(body, 'pdl_ntfset_test_secret_with_at_least_32_chars') },
        body,
      }));

      assert.equal(retryResponse.status, 200);
      assert.equal(userUpdates.length, 2);
      assert.equal(userUpdates[1].membership_status, 'trialing');
      assert.equal(completedEvents.has(eventId), true);
      assert.equal(ledgerInsertCount, 1);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});

test('verified webhook cannot use client-controlled custom data to change another users entitlements', async () => {
  await withWebhookEnvironment(async () => {
    const originalFetch = globalThis.fetch;
    const userUpdates: Record<string, unknown>[] = [];
    globalThis.fetch = async (input, init) => {
      const url = new URL(String(input));
      const method = init?.method ?? 'GET';
      if (url.pathname.endsWith('/paddle_webhook_events') && method === 'GET') {
        return new Response('null', { status: 200, headers: { 'Content-Type': 'application/json' } });
      }
      if (url.pathname.endsWith('/paddle_webhook_events') && method === 'POST') {
        return new Response(null, { status: 201 });
      }
      if (url.pathname.endsWith('/users') && method === 'GET') {
        return new Response('null', { status: 200, headers: { 'Content-Type': 'application/json' } });
      }
      if (url.pathname.endsWith('/users') && method === 'PATCH') {
        userUpdates.push(JSON.parse(String(init?.body)) as Record<string, unknown>);
        return new Response(null, { status: 204 });
      }
      throw new Error(`Unexpected Supabase request: ${method} ${url.pathname}`);
    };

    const body = JSON.stringify({
      event_id: 'evt_test_unbound_identity',
      notification_id: 'ntf_test_unbound_identity',
      event_type: 'subscription.created',
      occurred_at: '2026-10-21T00:00:00Z',
      data: {
        id: 'sub_test_unbound',
        customer_id: 'ctm_attacker_customer',
        status: 'active',
        custom_data: { userId: '40112e30-af17-494a-99ac-b2ff36c17ad3' },
        items: [{ price: { id: 'pri_creator_test' } }],
        billing_cycle: { interval: 'month', frequency: 1 },
        current_billing_period: { starts_at: '2026-10-21T00:00:00Z', ends_at: '2099-01-01T00:00:00Z' },
      },
    });

    try {
      const response = await handler(new Request('https://local.test/api/webhook/paddle', {
        method: 'POST',
        headers: { 'paddle-signature': paddleSignature(body, 'pdl_ntfset_test_secret_with_at_least_32_chars') },
        body,
      }));

      assert.equal(response.status, 200);
      assert.equal(userUpdates.length, 0);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});

test('legacy Paddle events update only the user already mapped to their Paddle customer', async () => {
  await withWebhookEnvironment(async () => {
    const originalFetch = globalThis.fetch;
    const userUpdates: Record<string, unknown>[] = [];
    const userId = '40112e30-af17-494a-99ac-b2ff36c17ad3';
    globalThis.fetch = async (input, init) => {
      const url = new URL(String(input));
      const method = init?.method ?? 'GET';
      if (url.pathname.endsWith('/paddle_webhook_events') && method === 'GET') {
        return new Response('null', { status: 200, headers: { 'Content-Type': 'application/json' } });
      }
      if (url.pathname.endsWith('/paddle_webhook_events') && method === 'POST') {
        return new Response(null, { status: 201 });
      }
      if (url.pathname.endsWith('/users') && method === 'GET') {
        const isProfileLookup = url.searchParams.has('id');
        const isCustomerLookup = url.searchParams.has('paddle_customer_id');
        if (isProfileLookup || isCustomerLookup) {
          return new Response(JSON.stringify({
            id: userId,
            paddle_customer_id: 'ctm_legacy_customer',
          }), { status: 200, headers: { 'Content-Type': 'application/json' } });
        }
        return new Response('null', { status: 200, headers: { 'Content-Type': 'application/json' } });
      }
      if (url.pathname.endsWith('/users') && method === 'PATCH') {
        userUpdates.push(JSON.parse(String(init?.body)) as Record<string, unknown>);
        return new Response(null, { status: 204 });
      }
      if (url.pathname.endsWith('/rpc/grant_creator_os_subscription_credits') && method === 'POST') {
        return new Response('null', { status: 200 });
      }
      throw new Error(`Unexpected Supabase request: ${method} ${url.pathname}`);
    };

    const body = JSON.stringify({
      event_id: 'evt_test_legacy_mapped_customer',
      notification_id: 'ntf_test_legacy_mapped_customer',
      event_type: 'subscription.created',
      occurred_at: '2026-10-21T00:00:00Z',
      data: {
        id: 'sub_test_legacy',
        customer_id: 'ctm_legacy_customer',
        status: 'active',
        custom_data: { userId },
        items: [{ price: { id: 'pri_creator_test' } }],
        billing_cycle: { interval: 'month', frequency: 1 },
        current_billing_period: { starts_at: '2026-10-21T00:00:00Z', ends_at: '2099-01-01T00:00:00Z' },
      },
    });

    try {
      const response = await handler(new Request('https://local.test/api/webhook/paddle', {
        method: 'POST',
        headers: { 'paddle-signature': paddleSignature(body, 'pdl_ntfset_test_secret_with_at_least_32_chars') },
        body,
      }));

      assert.equal(response.status, 200);
      assert.equal(userUpdates.length, 1);
      assert.equal(userUpdates[0].paddle_customer_id, 'ctm_legacy_customer');
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});
