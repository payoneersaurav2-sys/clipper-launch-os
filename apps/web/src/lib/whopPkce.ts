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
  return btoa(String.fromCharCode(...array))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

export const WHOP_REDIRECT_URI = import.meta.env.VITE_APP_URL
  ? `${import.meta.env.VITE_APP_URL}/auth/callback`
  : 'https://creator-os999.vercel.app/auth/callback';

export const WHOP_CLIENT_ID = import.meta.env.VITE_WHOP_CLIENT_ID || 'app_NsohXjOYOE0EkK';

const PKCE_STORAGE_KEY = 'whop_pkce_verifier';

/**
 * Builds the Whop OAuth URL with PKCE.
 * Stores code_verifier in sessionStorage (same-origin, survives redirect).
 * Uses state only as a CSRF nonce — NOT for verifier transport.
 */
export async function buildWhopOAuthUrl(): Promise<string> {
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = await generateCodeChallenge(codeVerifier);

  // Store in sessionStorage — both pages are same origin so this is reliable
  sessionStorage.setItem(PKCE_STORAGE_KEY, codeVerifier);

  const params = new URLSearchParams({
    client_id: WHOP_CLIENT_ID,
    redirect_uri: WHOP_REDIRECT_URI,
    response_type: 'code',
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
    state: 'web_oauth', // simple CSRF marker, not used as verifier carrier anymore
  });

  return `https://whop.com/oauth?${params.toString()}`;
}

/** Read the stored PKCE verifier after the OAuth redirect */
export function getStoredCodeVerifier(): string | null {
  const v = sessionStorage.getItem(PKCE_STORAGE_KEY);
  sessionStorage.removeItem(PKCE_STORAGE_KEY); // single-use
  return v;
}
