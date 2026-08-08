import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

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

    if (!codeVerifier) {
      return new Response(
        JSON.stringify({ error: 'Missing PKCE code verifier' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Whop OAuth 2.1 uses a JSON token request with the original S256 verifier.
    // Do not log authorization codes, verifiers, token responses, or secrets.
    const tokenPayload: Record<string, string> = {
      grant_type: 'authorization_code',
      client_id: WHOP_CLIENT_ID,
      code,
      redirect_uri: redirectUri,
      code_verifier: codeVerifier,
    };
    if (WHOP_CLIENT_SECRET) tokenPayload.client_secret = WHOP_CLIENT_SECRET;

    const tokenResponse = await fetch('https://api.whop.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(tokenPayload),
    });

    const responseText = await tokenResponse.text();

    if (!tokenResponse.ok) {
      console.error('[whop-auth] Whop token exchange failed:', tokenResponse.status);
      return new Response(
        JSON.stringify({
          error: 'Whop token exchange failed. Please restart sign-in and try again.',
          whop_status: tokenResponse.status,
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const whopTokens = JSON.parse(responseText);
    if (!whopTokens.access_token) throw new Error('Whop did not return an access token');

    const [userInfoResponse, supabaseUrl, serviceRoleKey] = await Promise.all([
      fetch('https://api.whop.com/oauth/userinfo', {
        headers: { Authorization: `Bearer ${whopTokens.access_token}` },
      }),
      Promise.resolve(Deno.env.get('SUPABASE_URL') ?? ''),
      Promise.resolve(Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''),
    ]);

    if (!userInfoResponse.ok) {
      throw new Error(`Whop userinfo request failed: ${userInfoResponse.status}`);
    }
    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error('Supabase server credentials are not configured');
    }

    const whopUser = await userInfoResponse.json();
    const whopUserId = whopUser.sub as string | undefined;
    if (!whopUserId) throw new Error('Whop userinfo response did not include a user ID');

    const email = whopUser.email || `whop_${whopUserId}@creator-os.app`;
    const fullName = whopUser.name || whopUser.preferred_username || 'Whop User';
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: existingUsers, error: existingUsersError } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
    if (existingUsersError) throw new Error(`Could not look up Supabase user: ${existingUsersError.message}`);

    const existingUser = existingUsers.users.find(
      (user) => user.email === email || user.user_metadata?.whop_id === whopUserId,
    );
    const deterministicPassword = await derivePassword(whopUserId, serviceRoleKey);
    let supabaseUserId: string;
    let signInEmail: string;

    if (existingUser) {
      supabaseUserId = existingUser.id;
      signInEmail = existingUser.email!;
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(supabaseUserId, {
        password: deterministicPassword,
        user_metadata: { ...existingUser.user_metadata, whop_id: whopUserId },
      });
      if (updateError) throw new Error(`Could not update Supabase user: ${updateError.message}`);
    } else {
      const { data: createdUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password: deterministicPassword,
        email_confirm: true,
        user_metadata: { whop_id: whopUserId },
      });
      if (createError || !createdUser.user) throw new Error(`Could not create Supabase user: ${createError?.message ?? 'Unknown error'}`);
      supabaseUserId = createdUser.user.id;
      signInEmail = email;
    }

    const { error: profileError } = await supabaseAdmin.from('users').upsert({
      id: supabaseUserId,
      whop_id: whopUserId,
      full_name: fullName,
      avatar_url: whopUser.picture ?? null,
      membership_status: 'active',
      updated_at: new Date().toISOString(),
    }, { onConflict: 'id' });
    if (profileError) throw new Error(`Could not synchronize Creator OS profile: ${profileError.message}`);

    const sessionResponse = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
      },
      body: JSON.stringify({ email: signInEmail, password: deterministicPassword }),
    });
    if (!sessionResponse.ok) {
      throw new Error(`Could not create Supabase session: ${sessionResponse.status}`);
    }
    const session = await sessionResponse.json();

    return new Response(
      JSON.stringify({
        access_token: session.access_token,
        refresh_token: session.refresh_token,
      }),
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

async function derivePassword(userId: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(`whop-auth-${userId}`));
  return Array.from(new Uint8Array(signature))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
    .slice(0, 32) + 'Aa1!';
}
