import { createClient } from '@supabase/supabase-js';

export const config = { runtime: 'edge' };

const environment = () => (globalThis as unknown as { process?: { env?: Record<string, string | undefined> } }).process?.env ?? {};
const json = (body: unknown, status: number) => new Response(JSON.stringify(body), {
  status,
  headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
});

export async function getPaddleUserBindingSecret(): Promise<string | null> {
  const env = environment();
  const configuredSecret = env.PADDLE_CUSTOM_DATA_SECRET;
  if (configuredSecret) return configuredSecret.length >= 32 ? configuredSecret : null;

  const webhookSecret = env.PADDLE_NOTIFICATION_WEBHOOK_SECRET;
  if (!webhookSecret || webhookSecret.length < 32) return null;

  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(webhookSecret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const derivedSecret = await crypto.subtle.sign(
    'HMAC',
    key,
    new TextEncoder().encode('creator-os:paddle-user-binding:v1'),
  );
  return Array.from(new Uint8Array(derivedSecret), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

async function getBindingKey(secret: string, usages: KeyUsage[]): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    usages,
  );
}

export async function signPaddleUserBinding(userId: string, secret: string): Promise<string> {
  const key = await getBindingKey(secret, ['sign']);
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(userId));
  return Array.from(new Uint8Array(signature), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

export async function verifyPaddleUserBinding(
  userId: string,
  binding: string,
  secret: string,
): Promise<boolean> {
  if (!/^[a-f0-9]{64}$/i.test(binding)) return false;
  const key = await getBindingKey(secret, ['verify']);
  const signature = new Uint8Array(binding.match(/.{2}/g)!.map((byte) => Number.parseInt(byte, 16)));
  return crypto.subtle.verify('HMAC', key, signature, new TextEncoder().encode(userId));
}

export default async function handler(request: Request): Promise<Response> {
  if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  const env = environment();
  const supabaseUrl = env.SUPABASE_URL || env.VITE_SUPABASE_URL;
  const supabaseAnonKey = env.SUPABASE_ANON_KEY || env.VITE_SUPABASE_ANON_KEY;
  const bindingSecret = await getPaddleUserBindingSecret();
  if (!supabaseUrl || !supabaseAnonKey || !bindingSecret) {
    return json({ error: 'Checkout identity service is not configured.' }, 503);
  }

  const authorization = request.headers.get('authorization');
  if (!authorization?.startsWith('Bearer ')) return json({ error: 'Sign in to continue.' }, 401);

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false },
    global: { headers: { Authorization: authorization } },
  });
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return json({ error: 'Sign in to continue.' }, 401);

  return json({
    customData: {
      userId: user.id,
      userBinding: await signPaddleUserBinding(user.id, bindingSecret),
    },
  }, 200);
}
