import assert from 'node:assert/strict';
import test from 'node:test';
import handler, { signPaddleUserBinding, verifyPaddleUserBinding } from './paddle-user-binding';

const userId = '40112e30-af17-494a-99ac-b2ff36c17ad3';
const secret = 'creator-os-paddle-binding-test-secret-32bytes';
const envKeys = ['SUPABASE_URL', 'SUPABASE_ANON_KEY', 'PADDLE_CUSTOM_DATA_SECRET'] as const;

async function withBindingEnvironment<T>(run: () => Promise<T>): Promise<T> {
  const previous = Object.fromEntries(envKeys.map((key) => [key, process.env[key]]));
  Object.assign(process.env, {
    SUPABASE_URL: 'https://supabase.local.test',
    SUPABASE_ANON_KEY: 'test-anon-key',
    PADDLE_CUSTOM_DATA_SECRET: secret,
  });

  try {
    return await run();
  } finally {
    for (const key of envKeys) {
      if (previous[key] === undefined) delete process.env[key];
      else process.env[key] = previous[key];
    }
  }
}

test('Paddle user bindings verify only for the signed user and secret', async () => {
  const binding = await signPaddleUserBinding(userId, secret);
  assert.equal(await verifyPaddleUserBinding(userId, binding, secret), true);
  assert.equal(await verifyPaddleUserBinding('50112e30-af17-494a-99ac-b2ff36c17ad3', binding, secret), false);
  assert.equal(await verifyPaddleUserBinding(userId, binding, `${secret}-other`), false);
  assert.equal(await verifyPaddleUserBinding(userId, 'not-a-signature', secret), false);
});

test('checkout identity endpoint signs only the authenticated Supabase user', async () => {
  await withBindingEnvironment(async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async (input) => {
      assert.match(String(input), /\/auth\/v1\/user$/);
      return new Response(JSON.stringify({ id: userId, email: 'member@example.test' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    };

    try {
      const response = await handler(new Request('https://local.test/api/paddle-user-binding', {
        method: 'POST',
        headers: { authorization: 'Bearer synthetic-session-token' },
      }));
      const payload = await response.json() as { customData?: { userId?: string; userBinding?: string } };

      assert.equal(response.status, 200);
      assert.equal(payload.customData?.userId, userId);
      assert.equal(
        await verifyPaddleUserBinding(userId, payload.customData?.userBinding ?? '', secret),
        true,
      );
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});

test('checkout identity endpoint rejects anonymous requests without contacting Supabase', async () => {
  await withBindingEnvironment(async () => {
    const originalFetch = globalThis.fetch;
    let fetchCount = 0;
    globalThis.fetch = async () => {
      fetchCount += 1;
      throw new Error('Unexpected authentication request');
    };

    try {
      const response = await handler(new Request('https://local.test/api/paddle-user-binding', {
        method: 'POST',
      }));

      assert.equal(response.status, 401);
      assert.equal(fetchCount, 0);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});
