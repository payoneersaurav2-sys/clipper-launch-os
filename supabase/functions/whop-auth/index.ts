import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';

const WHOP_CLIENT_ID = Deno.env.get('WHOP_CLIENT_ID') ?? 'app_NsohXjOYOE0EkK';
const WHOP_CLIENT_SECRET = Deno.env.get('WHOP_CLIENT_SECRET') ?? '';
const FRONTEND_URL = 'https://creator-os999.vercel.app';
// The Edge Function itself is now the callback URL
const REDIRECT_URI = 'https://ikryyvcvbuokblkmicjq.supabase.co/functions/v1/whop-auth';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    
    // 1. Pure Server-Side OAuth Callback Flow (GET request from Whop)
    if (req.method === 'GET') {
      const code = url.searchParams.get('code');
      const state = url.searchParams.get('state'); // We pass code_verifier in state
      const errorParam = url.searchParams.get('error');

      if (errorParam) {
        return Response.redirect(`${FRONTEND_URL}/login?error=${encodeURIComponent(errorParam)}`);
      }

      if (!code) {
        return Response.redirect(`${FRONTEND_URL}/login?error=No+Authorization+Code`);
      }

      // Exchange code for token directly on the server
      const tokenBody: Record<string, string> = {
        client_id: WHOP_CLIENT_ID,
        client_secret: WHOP_CLIENT_SECRET,
        grant_type: 'authorization_code',
        code,
        redirect_uri: REDIRECT_URI,
      };
      
      if (state) {
        tokenBody.code_verifier = state;
      }

      console.log('SERVER-SIDE TOKEN EXCHANGE:', JSON.stringify({
        code_prefix: code.slice(0, 10),
        verifier_prefix: state ? state.slice(0, 10) : 'none',
      }));

      const tokenResponse = await fetch('https://api.whop.com/oauth/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tokenBody),
      });

      if (!tokenResponse.ok) {
        const errText = await tokenResponse.text();
        console.error('Whop Token Error:', errText);
        return Response.redirect(`${FRONTEND_URL}/login?error=${encodeURIComponent('Whop Error: ' + errText)}`);
      }

      const data = await tokenResponse.json();
      
      // Successfully got tokens! Redirect back to the frontend with the tokens in the hash.
      const redirectParams = new URLSearchParams();
      if (data.access_token) redirectParams.set('access_token', data.access_token);
      if (data.refresh_token) redirectParams.set('refresh_token', data.refresh_token);
      
      return Response.redirect(`${FRONTEND_URL}/auth/callback?${redirectParams.toString()}`);
    }

    // 2. Legacy POST flow (fallback)
    return new Response(JSON.stringify({ error: 'Use GET flow' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('Edge Function Crash:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
