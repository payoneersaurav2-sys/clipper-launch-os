// This runs in Deno (Supabase Edge Functions)
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { code } = await req.json();
    if (!code) throw new Error('No authorization code provided');

    // 1. Setup Admin Supabase Client (Service Role required to mint custom tokens)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const WHOP_CLIENT_ID = Deno.env.get('WHOP_CLIENT_ID') ?? '';
    const WHOP_CLIENT_SECRET = Deno.env.get('WHOP_CLIENT_SECRET') ?? '';
    const WHOP_REDIRECT_URI = Deno.env.get('WHOP_REDIRECT_URI') ?? '';
    const REQUIRED_PRODUCT_ID = Deno.env.get('WHOP_REQUIRED_PRODUCT_ID') ?? '';

    // 2. Exchange code for Whop Access Token
    const tokenResponse = await fetch('https://whop.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: WHOP_CLIENT_ID,
        client_secret: WHOP_CLIENT_SECRET,
        grant_type: 'authorization_code',
        code,
        redirect_uri: WHOP_REDIRECT_URI
      })
    });

    if (!tokenResponse.ok) {
       throw new Error('Failed to exchange Whop authorization code');
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

    // 4. Verify Active Membership
    // In production, we iterate through memberships or check the specific required product.
    const membershipsResponse = await fetch('https://api.whop.com/api/v2/memberships', {
      headers: { Authorization: `Bearer ${access_token}` }
    });

    if (!membershipsResponse.ok) throw new Error('Failed to fetch memberships');
    
    const membershipsData = await membershipsResponse.json();
    const activeMemberships = membershipsData.data.filter((m: any) => m.valid && m.status === 'active');
    
    // Check if they own the specific product (or just check if they have any active membership for now)
    const hasAccess = activeMemberships.some((m: any) => m.product.id === REQUIRED_PRODUCT_ID);

    if (!hasAccess) {
       return new Response(JSON.stringify({ error: 'No active license found for this product.' }), {
         status: 403,
         headers: { ...corsHeaders, 'Content-Type': 'application/json' },
       });
    }

    // 5. User is verified! Upsert their identity into our Supabase Database
    const { data: userData, error: dbError } = await supabaseAdmin.from('users').upsert({
       id: whopId, // We use Whop ID as the primary key for perfect sync
       email: email,
       full_name: whopUser.username || whopUser.name,
       membership_status: 'active',
       updated_at: new Date().toISOString()
    }, { onConflict: 'id' }).select().single();

    if (dbError) throw new Error(`Database error: ${dbError.message}`);

    // 6. Mint custom Supabase JWT
    // We use the admin client to sign a token so the frontend can establish a session
    // This allows all standard RLS policies in PostgreSQL to work using auth.uid()
    
    // NOTE: Supabase doesn't natively expose `admin.auth.createCustomToken` like Firebase, 
    // so in Supabase we typically use `auth.admin.generateLink` or we manually insert into auth.users.
    // For standard Supabase custom provider flow, we ensure the user exists in `auth.users`
    
    const { data: authUser, error: createUserError } = await supabaseAdmin.auth.admin.createUser({
       email: email,
       email_confirm: true,
       user_metadata: { whop_id: whopId }
    });

    // If user already exists, it will throw an error, which is fine, we just fetch them
    let targetUid = authUser?.user?.id;
    
    if (createUserError && createUserError.message.includes('already been registered')) {
        const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
        const found = existingUsers.users.find(u => u.email === email);
        if (found) targetUid = found.id;
    }

    if (!targetUid) throw new Error('Failed to resolve Supabase Auth UID');

    // Currently Supabase has no direct "createCustomToken". The best way to log a user in purely from server
    // is to either return a temporary one-time password (OTP) or magic link for the frontend to consume.
    // For a seamless flow, we generate a magic link and parse the token out of it, or we use a third party JWT signer.
    
    // MOCK FOR NOW: Assuming we have a securely signed token mechanism
    const customToken = "supabase.custom.token.mock";

    return new Response(JSON.stringify({ 
      supabase_token: customToken,
      user: userData 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});
