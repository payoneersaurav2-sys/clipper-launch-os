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
    const { code, redirect_uri, code_verifier } = await req.json();

    if (!code) {
      return new Response(JSON.stringify({ error: 'Missing code' }), { status: 400, headers: corsHeaders });
    }

    // Force exact match with dashboard
    const REDIRECT_URI = redirect_uri || 'https://creator-os999.vercel.app/auth/callback';

    // Standard OAuth 2.0 Form Encoded Payload
    const formParams = new URLSearchParams();
    formParams.append('grant_type', 'authorization_code');
    formParams.append('client_id', WHOP_CLIENT_ID);
    formParams.append('client_secret', WHOP_CLIENT_SECRET);
    formParams.append('code', code);
    formParams.append('redirect_uri', REDIRECT_URI);
    
    if (code_verifier) {
      formParams.append('code_verifier', code_verifier);
    }

    console.log('EXCHANGING CODE VIA POST:', code.slice(0, 10));

    const tokenResponse = await fetch('https://api.whop.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formParams.toString(),
    });

    if (!tokenResponse.ok) {
      const errText = await tokenResponse.text();
      throw new Error(`invalid_grant Whop API response: ${errText} (Used x-www-form-urlencoded)`);
    }

    const data = await tokenResponse.json();
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Edge Function Crash:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
