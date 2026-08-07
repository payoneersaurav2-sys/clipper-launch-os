/**
 * PKCE (Proof Key for Code Exchange) utilities for Whop OAuth.
 * Using 'plain' method: code_challenge = code_verifier (no SHA-256)
 * This eliminates any hashing mismatch as root cause.
 */

export const WHOP_REDIRECT_URI = 'https://creator-os999.vercel.app/auth/callback';
export const WHOP_CLIENT_ID = import.meta.env.VITE_WHOP_CLIENT_ID || 'app_NsohXjOYOE0EkK';

const PKCE_STORAGE_KEY = 'whop_pkce_verifier';

function generateCodeVerifier(): string {
  const array = new Uint8Array(48); // 48 bytes → 64 base64url chars (well above 43 min)
  crypto.getRandomValues(array);
  let binary = '';
  for (let i = 0; i < array.length; i++) {
    binary += String.fromCharCode(array[i]);
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

export async function buildWhopOAuthUrl(): Promise<string> {
  const codeVerifier = generateCodeVerifier();

  // Store in both sessionStorage AND state param for maximum reliability
  sessionStorage.setItem(PKCE_STORAGE_KEY, codeVerifier);
  console.log('[PKCE] Generated verifier (length=' + codeVerifier.length + '):', codeVerifier.slice(0, 16));

  // Using plain method: challenge = verifier (no SHA-256 needed)
  // This tests if SHA-256 hashing is the source of the invalid_grant
  const params = new URLSearchParams({
    client_id: WHOP_CLIENT_ID,
    redirect_uri: WHOP_REDIRECT_URI,
    response_type: 'code',
    code_challenge: codeVerifier,         // plain: challenge IS the verifier
    code_challenge_method: 'plain',
    state: codeVerifier,                  // embed verifier in state for retrieval
  });

  return `https://whop.com/oauth?${params.toString()}`;
}

export function getStoredCodeVerifier(searchParams?: URLSearchParams): string | null {
  // Primary: state param in URL (embedded during auth)
  if (searchParams) {
    const stateVerifier = searchParams.get('state');
    if (stateVerifier && stateVerifier.length >= 43) {
      console.log('[PKCE] Got verifier from state param (len=' + stateVerifier.length + '):', stateVerifier.slice(0, 16));
      return stateVerifier;
    }
  }

  // Fallback: sessionStorage
  const v = sessionStorage.getItem(PKCE_STORAGE_KEY);
  console.log('[PKCE] Got verifier from sessionStorage (len=' + (v?.length ?? 0) + '):', v?.slice(0, 16) ?? 'NULL');
  sessionStorage.removeItem(PKCE_STORAGE_KEY);
  return v;
}
