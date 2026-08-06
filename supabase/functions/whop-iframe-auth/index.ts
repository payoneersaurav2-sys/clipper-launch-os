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

    const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
    const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

    // 1. Initialize Supabase Admin client
    const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    // 2. Verify x-whop-user-token as a JWT using Whop's JWKS public keys
    let userId: string;
    try {
      const { payload } = await jwtVerify(token, WHOP_JWKS);
      userId = payload.sub as string;
      if (!userId) throw new Error('No sub claim in token');
    } catch (jwtErr: any) {
      throw new Error(`JWT verification failed: ${jwtErr.message}`);
    }

    // 3. Fetch user profile from Whop using our server API key
    const whopApiKey = Deno.env.get('WHOP_API_KEY') ?? '';
    let email = `whop_${userId}@creator-os.app`;
    let fullName = 'Whop User';

    if (whopApiKey) {
      const userRes = await fetch(`https://api.whop.com/api/v2/users/${userId}`, {
        headers: { 'Authorization': `Bearer ${whopApiKey}` }
      });
      if (userRes.ok) {
        const profile = await userRes.json();
        if (profile.email) email = profile.email;
        fullName = profile.username || profile.name || fullName;
      }
    }

    // 4. Create or retrieve the user in Supabase Auth
    // We use a deterministic password so we can sign in programmatically.
    // The password is derived from the userId + service role key (kept server-side only).
    const deterministicPassword = await derivePassword(userId, SERVICE_ROLE_KEY);

    let targetUid: string;
    const { data: existingUser } = await supabaseAdmin.auth.admin.getUserById(userId);

    if (existingUser?.user?.id) {
      // User already in auth (by whop_id stored as UUID) - update password
      targetUid = existingUser.user.id;
      await supabaseAdmin.auth.admin.updateUserById(targetUid, {
        password: deterministicPassword,
      });
    } else {
      // Try to find by email
      const { data: listData } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
      const byEmail = listData?.users?.find(u => u.email === email);
      const byWhopId = listData?.users?.find(u => u.user_metadata?.whop_id === userId);
      const found = byEmail || byWhopId;

      if (found) {
        targetUid = found.id;
        await supabaseAdmin.auth.admin.updateUserById(targetUid, {
          password: deterministicPassword,
        });
      } else {
        // Create new user
        const { data: newUser, error: createErr } = await supabaseAdmin.auth.admin.createUser({
          email,
          password: deterministicPassword,
          email_confirm: true,
          user_metadata: { whop_id: userId }
        });
        if (createErr) throw new Error(`Failed to create user: ${createErr.message}`);
        targetUid = newUser.user!.id;
      }
    }

    // 5. Upsert into public.users (schema: id UUID, whop_id TEXT, full_name TEXT, membership_status TEXT)
    const { error: dbError } = await supabaseAdmin.from('users').upsert({
      id: targetUid,
      whop_id: userId,
      full_name: fullName,
      membership_status: 'active',
      updated_at: new Date().toISOString()
    }, { onConflict: 'id' });

    if (dbError) throw new Error(`Database error: ${dbError.message}`);

    // 6. Sign in via the REST token endpoint to get a real access + refresh token pair
    // SUPABASE_ANON_KEY is auto-injected by Supabase runtime into every Edge Function
    const signInRes = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SERVICE_ROLE_KEY, // service role key works here too
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
      },
      body: JSON.stringify({ email, password: deterministicPassword }),
    });

    if (!signInRes.ok) {
      const errText = await signInRes.text();
      throw new Error(`Sign-in failed: ${errText}`);
    }

    const session = await signInRes.json();

    return new Response(JSON.stringify({
      access_token: session.access_token,
      refresh_token: session.refresh_token,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error: any) {
    console.error('Iframe Auth Error:', error);
    return new Response(JSON.stringify({ error: `Edge Function Error: ${error.message}` }), {
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
