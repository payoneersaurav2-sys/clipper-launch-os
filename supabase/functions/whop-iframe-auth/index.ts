import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { jwtVerify, createRemoteJWKSet } from "https://deno.land/x/jose@v4.14.4/index.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Whop's public key set for verifying x-whop-user-token JWTs
const WHOP_JWKS = createRemoteJWKSet(new URL('https://api.whop.com/.well-known/jwks.json'));

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { token } = await req.json();
    if (!token) throw new Error('No Whop token provided');

    // 1. Initialize Supabase Admin
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // 2. Verify the x-whop-user-token JWT using Whop's public JWKS
    // This is a JWT signed by Whop — NOT a Bearer API token.
    // We use jose to verify its signature and extract the userId from the payload.
    let userId: string;
    try {
      const { payload } = await jwtVerify(token, WHOP_JWKS);
      userId = payload.sub as string;
      if (!userId) throw new Error('No sub claim in token');
    } catch (jwtErr: any) {
      throw new Error(`JWT verification failed: ${jwtErr.message}`);
    }

    // 3. Fetch user profile using our server-side WHOP_API_KEY (NOT the user token)
    const whopApiKey = Deno.env.get('WHOP_API_KEY');
    if (!whopApiKey) throw new Error('WHOP_API_KEY is missing');

    const userRes = await fetch(`https://api.whop.com/api/v2/users/${userId}`, {
      headers: { 'Authorization': `Bearer ${whopApiKey}` }
    });

    let email: string;
    let fullName: string;

    if (userRes.ok) {
      const userProfile = await userRes.json();
      email = userProfile.email || `${userId}@whop.user`;
      fullName = userProfile.username || userProfile.name || 'Whop User';
    } else {
      // Fallback: use just the userId if profile fetch fails
      email = `${userId}@whop.user`;
      fullName = 'Whop User';
    }

    // 4. Ensure the user exists in Supabase Auth (email-based)
    //    The public.users table links to auth.users via UUID — email is stored in auth, not public.users
    let targetUid: string;
    const { data: authUser, error: createUserError } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      email_confirm: true,
      user_metadata: { whop_id: userId }
    });

    if (createUserError && createUserError.message.includes('already been registered')) {
      // User exists — find them
      const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
      const found = existingUsers.users.find(u => u.email === email)
        || existingUsers.users.find(u => u.user_metadata?.whop_id === userId);
      if (!found) throw new Error('Could not find existing auth user');
      targetUid = found.id;
    } else if (authUser?.user?.id) {
      targetUid = authUser.user.id;
    } else {
      throw new Error('Failed to create or find Supabase Auth user');
    }

    // 5. Upsert into public.users — schema has: id (UUID), whop_id, membership_status, full_name, avatar_url
    const { data: userData, error: dbError } = await supabaseAdmin.from('users').upsert({
      id: targetUid,               // UUID from auth.users
      whop_id: userId,             // Whop's own user ID
      full_name: fullName,
      membership_status: 'active',
      updated_at: new Date().toISOString()
    }, { onConflict: 'id' }).select().single();

    if (dbError) throw new Error(`Database error: ${dbError.message}`);

    // 6. Create a real Supabase session — returns proper access_token + refresh_token
    //    We use admin.createSession instead of minting a custom JWT because
    //    supabase.auth.setSession() on the frontend requires a real Supabase refresh token.
    const { data: sessionData, error: sessionError } = await supabaseAdmin.auth.admin.createSession({
      user_id: targetUid,
    });

    if (sessionError) throw new Error(`Session creation failed: ${sessionError.message}`);
    if (!sessionData?.session) throw new Error('No session returned from Supabase');

    return new Response(JSON.stringify({
      supabase_token: sessionData.session.access_token,
      refresh_token: sessionData.session.refresh_token,
      user: userData
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error: any) {
    console.error('Iframe Auth Error:', error);
    // Always return 200 so supabase-js can parse the JSON error message
    return new Response(JSON.stringify({ error: `Edge Function Error: ${error.message}` }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  }
});
