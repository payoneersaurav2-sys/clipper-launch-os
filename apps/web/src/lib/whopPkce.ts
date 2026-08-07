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

/**
 * Builds the Whop OAuth URL WITHOUT PKCE.
 * We use client_secret (confidential client flow) — Whop may reject
 * PKCE + client_secret together. No verifier storage needed.
 */
export async function buildWhopOAuthUrl(): Promise<string> {
  const params = new URLSearchParams({
    client_id: WHOP_CLIENT_ID,
    redirect_uri: WHOP_REDIRECT_URI,
    response_type: 'code',
    state: 'web_oauth',
  });

  return `https://whop.com/oauth?${params.toString()}`;
}

/** No-op kept for compatibility */
export function getStoredCodeVerifier(): string | null {
  return null;
}
