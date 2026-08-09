/**
 * Whop OAuth 2.1 PKCE helpers.
 *
 * The verifier stays in sessionStorage on our origin. `state` is a separate,
 * opaque CSRF token; never place the verifier in a callback URL.
 */

export const WHOP_REDIRECT_URI = 'https://creator-os999.vercel.app/auth/callback';
export const WHOP_CLIENT_ID = import.meta.env.VITE_WHOP_CLIENT_ID || 'app_NsohXjOYOE0EkK';

const PKCE_STORAGE_KEY = 'creator_os_whop_oauth';

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
