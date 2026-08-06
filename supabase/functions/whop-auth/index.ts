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

    // 2. Exchange code for Whop Access Token (PKCE-compliant)
    const tokenBody: Record<string, string> = {
      client_id: WHOP_CLIENT_ID,
      client_secret: WHOP_CLIENT_SECRET,
      grant_type: 'authorization_code',
      code,
      redirect_uri: WHOP_REDIRECT_URI,
    };
    // Include code_verifier if the client sent one (required for PKCE flows)
    if (code_verifier) {
      tokenBody.code_verifier = code_verifier;
    }

    const tokenResponse = await fetch('https://api.whop.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(tokenBody),
    });

    if (!tokenResponse.ok) {
      const errText = await tokenResponse.text();
      throw new Error(`Failed to exchange Whop code: ${errText}`);
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

    // 4. Upsert User in public.users
    const { data: userData, error: dbError } = await supabaseAdmin.from('users').upsert({
      id: whopId,
      email: email,
      full_name: whopUser.username || whopUser.name,
      membership_status: 'active',
      updated_at: new Date().toISOString()
    }, { onConflict: 'id' }).select().single();

    if (dbError) throw new Error(`Database error: ${dbError.message}`);

    // 5. Ensure User exists in Supabase Auth
    let targetUid = whopId;
    const { data: authUser, error: createUserError } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      email_confirm: true,
      user_metadata: { whop_id: whopId }
    });

    if (createUserError && createUserError.message.includes('already been registered')) {
      const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
      const found = existingUsers.users.find(u => u.email === email);
      if (found) targetUid = found.id;
    } else if (authUser?.user?.id) {
      targetUid = authUser.user.id;
    }

    if (!targetUid) throw new Error('Failed to resolve Supabase Auth UID');

    // 6. Mint custom Supabase JWT
    const jwtSecret = Deno.env.get('PROJECT_JWT_SECRET') ?? '';
    if (!jwtSecret) {
      throw new Error("PROJECT_JWT_SECRET is not configured in edge function secrets");
    }

    const token = await new SignJWT({
      aud: 'authenticated',
      role: 'authenticated',
      email: email,
      app_metadata: { provider: 'whop', providers: ['whop'] },
      user_metadata: { whop_id: whopId }
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setSubject(targetUid)
      .setIssuedAt()
      .setExpirationTime('1h')
      .sign(new TextEncoder().encode(jwtSecret));

    return new Response(JSON.stringify({
      supabase_token: token,
      user: userData
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error: any) {
    console.error("Whop auth error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});
