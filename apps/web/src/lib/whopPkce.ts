/**
 * Whop OAuth 2.1 PKCE helpers.
 *
 * The verifier stays in sessionStorage on our origin. `state` is a separate,
 * opaque CSRF token; never place the verifier in a callback URL.
 */

const WHOP_ENV_REDIRECT_URI = import.meta.env.VITE_WHOP_REDIRECT_URI?.trim();
const WHOP_ENV_CLIENT_ID = import.meta.env.VITE_WHOP_CLIENT_ID?.trim();
const isProduction = import.meta.env.PROD;

const allowedOrigin = (() => {
  try {
    return new URL(window.location.href).origin;
  } catch {
    return '';
  }
})();

export const WHOP_REDIRECT_URI = WHOP_ENV_REDIRECT_URI || (!isProduction ? `${allowedOrigin}/auth/callback` : '');
export const WHOP_CLIENT_ID = WHOP_ENV_CLIENT_ID || '';

const PKCE_STORAGE_KEY = 'creator_os_whop_oauth';

export function assertWhopRuntimeConfig() {
  if (!WHOP_CLIENT_ID) {
    throw new Error('Whop OAuth is not configured. Set VITE_WHOP_CLIENT_ID before starting the auth flow.');
  }

  if (!WHOP_REDIRECT_URI) {
    throw new Error('Whop OAuth is not configured for production. Set VITE_WHOP_REDIRECT_URI to the exact app callback URL.');
  }

  try {
    const redirectUrl = new URL(WHOP_REDIRECT_URI);
    const currentUrl = new URL(window.location.href);
    const allowedHostnames = new Set(['localhost', '127.0.0.1', '[::1]']);

    if (redirectUrl.protocol !== 'https:' && !allowedHostnames.has(currentUrl.hostname)) {
      throw new Error('Whop redirect URI must use HTTPS in production.');
    }

    const exactOriginMatch = redirectUrl.origin === currentUrl.origin;
    const exactPathMatch = redirectUrl.pathname === '/auth/callback';
    const exactHostAllowed = exactOriginMatch || allowedHostnames.has(currentUrl.hostname);

    if (!exactHostAllowed || !exactPathMatch) {
      throw new Error('Whop redirect URI must match the exact app callback URL for this environment.');
    }
  } catch {
    throw new Error('Whop redirect URI is invalid. Use the exact app callback URL configured for this environment.');
  }
}

interface PkceTransaction {
  codeVerifier: string;
  state: string;
  nonce: string;
  intent: 'sign_in' | 'link_account';
}

function base64UrlEncode(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

function randomString(byteLength: number): string {
  return base64UrlEncode(crypto.getRandomValues(new Uint8Array(byteLength)));
}

async function createS256Challenge(verifier: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier));
  return base64UrlEncode(new Uint8Array(digest));
}

export async function buildWhopOAuthUrl(intent: PkceTransaction['intent'] = 'sign_in'): Promise<string> {
  assertWhopRuntimeConfig();

  const transaction: PkceTransaction = {
    codeVerifier: randomString(32),
    state: randomString(16),
    nonce: randomString(16),
    intent,
  };

  sessionStorage.setItem(PKCE_STORAGE_KEY, JSON.stringify(transaction));

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: WHOP_CLIENT_ID,
    redirect_uri: WHOP_REDIRECT_URI,
    scope: 'openid profile email',
    state: transaction.state,
    nonce: transaction.nonce,
    code_challenge: await createS256Challenge(transaction.codeVerifier),
    code_challenge_method: 'S256',
  });

  return `https://api.whop.com/oauth/authorize?${params.toString()}`;
}

/**
 * Verifies the callback state and returns the one-time verifier. The
 * transaction is consumed even on an invalid callback so a user must restart
 * the flow instead of accidentally reusing an authorization code.
 */
export function getStoredCodeVerifier(searchParams: URLSearchParams): string | null {
  return getStoredWhopTransaction(searchParams)?.codeVerifier ?? null;
}

export function getStoredWhopTransaction(searchParams: URLSearchParams): Pick<PkceTransaction, 'codeVerifier' | 'intent'> | null {
  const rawTransaction = sessionStorage.getItem(PKCE_STORAGE_KEY);
  sessionStorage.removeItem(PKCE_STORAGE_KEY);

  if (!rawTransaction) return null;

  try {
    const transaction = JSON.parse(rawTransaction) as Partial<PkceTransaction>;
    const returnedState = searchParams.get('state');
    if (
      !transaction.codeVerifier ||
      !transaction.state ||
      !returnedState ||
      returnedState !== transaction.state
    ) {
      return null;
    }
    return { codeVerifier: transaction.codeVerifier, intent: transaction.intent === 'link_account' ? 'link_account' : 'sign_in' };
  } catch {
    return null;
  }
}
