import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const TURNSTILE_SECRET_KEY = Deno.env.get('TURNSTILE_SECRET_KEY') ?? '';
const TURNSTILE_VERIFY_URL = Deno.env.get('TURNSTILE_VERIFY_URL') ?? 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    if (!TURNSTILE_SECRET_KEY) {
      return new Response(
        JSON.stringify({ success: false, error: 'Turnstile is not configured on the server.' }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body = await req.json();
    const token = String(body?.token ?? '').trim();
    const action = String(body?.action ?? '').trim();
    const hostname = String(body?.hostname ?? '').trim();

    if (!token) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing Turnstile token.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const verifyResponse = await fetch(TURNSTILE_VERIFY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        secret: TURNSTILE_SECRET_KEY,
        response: token,
        remoteip: req.headers.get('x-forwarded-for') ?? '',
        hostname: hostname || 'creator-os999.vercel.app',
        action,
      }).toString(),
    });

    const result = await verifyResponse.json();
    const valid = Boolean(result?.success) && (!action || action === result?.action || !result?.action);

    if (!verifyResponse.ok || !valid) {
      return new Response(
        JSON.stringify({ success: false, error: 'Human verification failed.', details: result }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(JSON.stringify({ success: true, challenge_ts: result.challenge_ts, hostname: result.hostname }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    console.error('[verify-captcha] unexpected error:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Captcha verification failed unexpectedly.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
