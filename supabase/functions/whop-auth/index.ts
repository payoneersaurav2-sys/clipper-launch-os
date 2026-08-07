import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { SignJWT } from "https://deno.land/x/jose@v4.14.4/index.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { code, redirect_uri, code_verifier } = await req.json();
    if (!code) throw new Error('No authorization code provided');

    // 1. Setup Admin Supabase Client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const WHOP_CLIENT_ID = Deno.env.get('WHOP_CLIENT_ID') ?? '';
    const WHOP_CLIENT_SECRET = Deno.env.get('WHOP_CLIENT_SECRET') ?? '';
    const WHOP_REDIRECT_URI = redirect_uri
      || Deno.env.get('WHOP_REDIRECT_URI')
      || 'https://creator-os999.vercel.app/auth/callback';

    // 2. Exchange code for Whop Access Token with PKCE (required by Whop)
    // 2. Exchange code for Whop Access Token
    // We send credentials via JSON, which Whop API is confirmed to parse correctly.
    const tokenBody: Record<string, string> = {
      client_id: WHOP_CLIENT_ID,
      client_secret: WHOP_CLIENT_SECRET,
      grant_type: 'authorization_code',
      code,
      redirect_uri: WHOP_REDIRECT_URI,
    };
    if (code_verifier) {
      tokenBody.code_verifier = code_verifier;
    }

    // DIAGNOSTIC LOG
    console.log('TOKEN EXCHANGE:', JSON.stringify({
      redirect_uri: WHOP_REDIRECT_URI,
      code_prefix: code?.slice(0, 10),
      code_verifier_prefix: code_verifier?.slice(0, 12) ?? 'MISSING',
      code_verifier_length: code_verifier?.length ?? 0,
      client_id: WHOP_CLIENT_ID,
    }));

    const tokenResponse = await fetch('https://api.whop.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(tokenBody),
    });

    if (!tokenResponse.ok) {
      const errText = await tokenResponse.text();
      throw new Error(`Failed to exchange Whop code: ${errText} | DIAGNOSTICS: redirect_uri="${WHOP_REDIRECT_URI}", code_verifier_present=${!!code_verifier}, code_verifier_prefix="${code_verifier?.slice(0, 12)}", client_id="${WHOP_CLIENT_ID}"`);
    }

    const { access_token } = await tokenResponse.json();

    // 3. Get User Identity from Whop
    const userResponse = await fetch('https://api.whop.com/api/v2/me', {
      headers: { Authorization: `Bearer ${access_token}` }
    });

    if (!userResponse.ok) throw new Error('Failed to fetch Whop user identity');

    const whopUser = await userResponse.json();
    const whopId = whopUser.id;
    const email = whopUser.email;

    // 4. Create or retrieve the user in Supabase Auth
    const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const deterministicPassword = await derivePassword(whopId, SERVICE_ROLE_KEY);

    let targetUid: string;
    let signInEmail: string = email;

    const { data: listData } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
    const byEmail = listData?.users?.find(u => u.email === email);
    const byWhopId = listData?.users?.find(u => u.user_metadata?.whop_id === whopId);
    const found = byEmail || byWhopId;

    if (found) {
      targetUid = found.id;
      signInEmail = found.email!;
      await supabaseAdmin.auth.admin.updateUserById(targetUid, {
        password: deterministicPassword,
        user_metadata: { whop_id: whopId },
      });
    } else {
      const { data: newUser, error: createErr } = await supabaseAdmin.auth.admin.createUser({
        email,
        password: deterministicPassword,
        email_confirm: true,
        user_metadata: { whop_id: whopId }
      });
      if (createErr) throw new Error(`Failed to create user: ${createErr.message}`);
      targetUid = newUser.user!.id;
    }

    // 5. Upsert into public.users (schema: id UUID, whop_id TEXT, full_name TEXT, membership_status TEXT)
    const { data: userData, error: dbError } = await supabaseAdmin.from('users').upsert({
      id: targetUid,
      whop_id: whopId,
      full_name: whopUser.username || whopUser.name || 'Whop User',
      membership_status: 'active',
      updated_at: new Date().toISOString()
    }, { onConflict: 'id' }).select().single();

    if (dbError) throw new Error(`Database error: ${dbError.message}`);

    // 6. Sign in via the REST token endpoint to get a real access + refresh token pair
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
    const signInRes = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
      },
      body: JSON.stringify({ email: signInEmail, password: deterministicPassword }),
    });

    if (!signInRes.ok) {
      const errText = await signInRes.text();
      throw new Error(`Sign-in failed: ${errText}`);
    }

    const session = await signInRes.json();

    return new Response(JSON.stringify({
      access_token: session.access_token,
      refresh_token: session.refresh_token,
      user: userData
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error: any) {
    console.error("Whop auth error:", error);
    return new Response(JSON.stringify({ error: `Detailed Edge Error: ${error.message}` }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  }
});

// Derive a deterministic password from userId + secret using SHA-256
async function derivePassword(userId: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const data = encoder.encode(`whop-auth-${userId}`);
  const key = await crypto.subtle.importKey('raw', keyData, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const signature = await crypto.subtle.sign('HMAC', key, data);
  const hashArray = Array.from(new Uint8Array(signature));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 32) + 'Aa1!';
}
