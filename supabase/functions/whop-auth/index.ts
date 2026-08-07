import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const WHOP_CLIENT_ID = Deno.env.get('WHOP_CLIENT_ID') ?? 'app_NsohXjOYOE0EkK';
const WHOP_CLIENT_SECRET = Deno.env.get('WHOP_CLIENT_SECRET') ?? '';
const DEFAULT_REDIRECT_URI = 'https://creator-os999.vercel.app/auth/callback';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  let code = '';
  let redirectUri = DEFAULT_REDIRECT_URI;
  let codeVerifier = '';

  try {
    const body = await req.json();
    code = body.code ?? '';
    redirectUri = body.redirect_uri ?? DEFAULT_REDIRECT_URI;
    codeVerifier = body.code_verifier ?? '';

    if (!code) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization code' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build form-encoded payload per OAuth 2.0 spec
    const formParams = new URLSearchParams();
    formParams.set('grant_type', 'authorization_code');
    formParams.set('client_id', WHOP_CLIENT_ID);
    formParams.set('client_secret', WHOP_CLIENT_SECRET);
    formParams.set('code', code);
    formParams.set('redirect_uri', redirectUri);

    if (codeVerifier) {
      formParams.set('code_verifier', codeVerifier);
    }

    console.log('[whop-auth] Exchanging code:', {
      code_prefix: code.slice(0, 10),
      redirect_uri: redirectUri,
      has_verifier: !!codeVerifier,
      verifier_prefix: codeVerifier?.slice(0, 12) ?? 'NONE',
    });

    const tokenResponse = await fetch('https://api.whop.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formParams.toString(),
    });

    const responseText = await tokenResponse.text();
    console.log('[whop-auth] Whop response status:', tokenResponse.status);
    console.log('[whop-auth] Whop response body:', responseText);

    // Always return 200 to Supabase client, with error details in body if needed
    if (!tokenResponse.ok) {
      return new Response(
        JSON.stringify({
          error: `Whop token exchange failed: ${responseText}`,
          whop_status: tokenResponse.status,
          diagnostics: {
            redirect_uri: redirectUri,
            has_verifier: !!codeVerifier,
            client_id: WHOP_CLIENT_ID,
          }
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = JSON.parse(responseText);
    return new Response(
      JSON.stringify(data),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('[whop-auth] Unexpected crash:', error.message);
    return new Response(
      JSON.stringify({ error: `Edge Function crash: ${error.message}` }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
