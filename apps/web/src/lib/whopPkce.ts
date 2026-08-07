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

export const WHOP_REDIRECT_URI = 'https://ikryyvcvbuokblkmicjq.supabase.co/functions/v1/whop-auth';

export const WHOP_CLIENT_ID = import.meta.env.VITE_WHOP_CLIENT_ID || 'app_NsohXjOYOE0EkK';

const PKCE_STORAGE_KEY = 'whop_pkce_verifier';

/**
 * Builds the Whop OAuth URL WITH PKCE (required by Whop).
 * Stores code_verifier in sessionStorage — same origin survives OAuth redirect.
 */
export async function buildWhopOAuthUrl(): Promise<string> {
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = await generateCodeChallenge(codeVerifier);

  // Store in sessionStorage just in case, but we pass it directly via state for the Server-Side flow
  sessionStorage.setItem(PKCE_STORAGE_KEY, codeVerifier);
  console.log('[PKCE] Generated verifier prefix:', codeVerifier.slice(0, 12));

  const params = new URLSearchParams({
    client_id: WHOP_CLIENT_ID,
    redirect_uri: WHOP_REDIRECT_URI,
    response_type: 'code',
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
    state: codeVerifier, // Send verifier explicitly in state parameter!
  });

  return `https://whop.com/oauth?${params.toString()}`;
}

/** Read the stored PKCE verifier after the OAuth redirect — single use */
export function getStoredCodeVerifier(): string | null {
  const v = sessionStorage.getItem(PKCE_STORAGE_KEY);
  console.log('[PKCE] Read verifier from sessionStorage prefix:', v?.slice(0, 12) ?? 'NULL');
  sessionStorage.removeItem(PKCE_STORAGE_KEY);
  return v;
}
