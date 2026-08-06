/**
 * PKCE (Proof Key for Code Exchange) utilities for Whop OAuth.
 * Whop requires PKCE for all OAuth flows.
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

/**
 * Builds the Whop OAuth URL with PKCE and saves the verifier to sessionStorage.
 * Call this before redirecting to Whop.
 */
export async function buildWhopOAuthUrl(): Promise<string> {
  const codeVerifier = generateCodeVerifier();
  sessionStorage.setItem('whop_code_verifier', codeVerifier);
  const codeChallenge = await generateCodeChallenge(codeVerifier);

  const params = new URLSearchParams({
    client_id: WHOP_CLIENT_ID,
    redirect_uri: WHOP_REDIRECT_URI,
    response_type: 'code',
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
  });

  return `https://whop.com/oauth?${params.toString()}`;
}
