/**
 * PKCE (Proof Key for Code Exchange) utilities for Whop OAuth.
 * Whop requires PKCE for all OAuth flows.
 *
 * For the web app flow, we store the code_verifier in sessionStorage because
 * both /login and /auth/callback are on the same origin (Vercel domain).
 * sessionStorage survives the OAuth redirect back to our domain.
 */

export function generateCodeVerifier(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return base64UrlEncode(array);
}

export async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return base64UrlEncode(new Uint8Array(digest));
}

function base64UrlEncode(array: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < array.length; i++) {
    binary += String.fromCharCode(array[i]);
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

export const WHOP_REDIRECT_URI = 'https://creator-os999.vercel.app/auth/callback';

export const WHOP_CLIENT_ID = import.meta.env.VITE_WHOP_CLIENT_ID || 'app_NsohXjOYOE0EkK';

const PKCE_STORAGE_KEY = 'whop_pkce_verifier';

/**
 * Builds the Whop OAuth URL WITH PKCE (required by Whop).
 * Stores code_verifier in sessionStorage — same origin survives OAuth redirect.
 */
export async function buildWhopOAuthUrl(): Promise<string> {
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = await generateCodeChallenge(codeVerifier);

  // Store in sessionStorage — creator-os999.vercel.app persists through whop.com redirect
  sessionStorage.setItem(PKCE_STORAGE_KEY, codeVerifier);
  console.log('[PKCE] Stored verifier prefix:', codeVerifier.slice(0, 12));

  const params = new URLSearchParams({
    client_id: WHOP_CLIENT_ID,
    redirect_uri: WHOP_REDIRECT_URI,
    response_type: 'code',
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
    // Pass verifier in state so it comes back in the redirect URL
    // This eliminates sessionStorage dependency entirely
    state: codeVerifier,
  });

  return `https://whop.com/oauth?${params.toString()}`;
}

/**
 * Read the PKCE verifier from the OAuth redirect URL state param (primary)
 * or fall back to sessionStorage (secondary).
 * The state param is the most reliable source — it's in the URL, not cleared by browser.
 */
export function getStoredCodeVerifier(searchParams?: URLSearchParams): string | null {
  // Primary: read from URL state parameter (always available if we passed it in buildWhopOAuthUrl)
  if (searchParams) {
    const stateVerifier = searchParams.get('state');
    // Make sure it looks like a PKCE verifier (43+ chars), not a generic state string
    if (stateVerifier && stateVerifier.length >= 43) {
      console.log('[PKCE] Got verifier from URL state param:', stateVerifier.slice(0, 12));
      return stateVerifier;
    }
  }

  // Fallback: sessionStorage
  const v = sessionStorage.getItem(PKCE_STORAGE_KEY);
  console.log('[PKCE] Got verifier from sessionStorage:', v?.slice(0, 12) ?? 'NULL');
  sessionStorage.removeItem(PKCE_STORAGE_KEY);
  return v;
}
