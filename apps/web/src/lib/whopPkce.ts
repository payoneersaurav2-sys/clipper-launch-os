/**
 * PKCE (Proof Key for Code Exchange) utilities for Whop OAuth.
 * Whop requires PKCE for all OAuth flows.
 *
 * NOTE: We pass the code_verifier via the OAuth `state` parameter because
 * the app runs inside a Whop proxy iframe (qp5or...apps.whop.com) but the
 * callback loads on our Vercel domain. localStorage/sessionStorage don't
 * cross origins, so we let Whop echo the verifier back via `state`.
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
 * Builds the Whop OAuth URL with PKCE.
 * The code_verifier is sent in the `state` param so Whop echoes it back
 * in the redirect URL — no cross-origin storage needed.
 */
export async function buildWhopOAuthUrl(): Promise<string> {
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = await generateCodeChallenge(codeVerifier);

  const params = new URLSearchParams({
    client_id: WHOP_CLIENT_ID,
    redirect_uri: WHOP_REDIRECT_URI,
    response_type: 'code',
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
    state: codeVerifier, // Whop echoes `state` back → callback reads it from URL
  });

  return `https://whop.com/oauth?${params.toString()}`;
}
