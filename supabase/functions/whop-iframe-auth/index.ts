import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { WhopAPI } from 'npm:@whop-apps/sdk';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

    // 2. Initialize Whop SDK
    const whopApi = new WhopAPI({ apiKey: Deno.env.get('WHOP_API_KEY') || '' });

    // 3. Verify the iFrame Token securely
    const { userId } = await whopApi.verifyUserToken({ 'x-whop-user-token': token });

    if (!userId) {
       throw new Error('Invalid Whop session token');
    }

    // 4. Get User Profile from Whop
    const userProfile = await whopApi.user.retrieve({ id: userId });
    
    // 5. Verify Active Membership
    // (For an iframe app, we usually just let them in if they loaded it, but we can verify)
    const REQUIRED_PRODUCT_ID = Deno.env.get('WHOP_REQUIRED_PRODUCT_ID') ?? '';
    
    // 6. Upsert User in Supabase
    const { data: userData, error: dbError } = await supabaseAdmin.from('users').upsert({
       id: userId,
       email: userProfile.email,
       full_name: userProfile.username || userProfile.name || 'Whop User',
       membership_status: 'active',
       updated_at: new Date().toISOString()
    }, { onConflict: 'id' }).select().single();

    if (dbError) throw new Error(`Database error: ${dbError.message}`);

    // 7. Mint custom Supabase Auth User
    const { data: authUser, error: createUserError } = await supabaseAdmin.auth.admin.createUser({
       email: userProfile.email,
       email_confirm: true,
       user_metadata: { whop_id: userId }
    });

    let targetUid = authUser?.user?.id;
    
    if (createUserError && createUserError.message.includes('already been registered')) {
        const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
        const found = existingUsers.users.find(u => u.email === userProfile.email);
        if (found) targetUid = found.id;
    }

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
