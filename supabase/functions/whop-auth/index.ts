import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const WHOP_CLIENT_ID = Deno.env.get('WHOP_CLIENT_ID') ?? 'app_NsohXjOYOE0EkK';
const WHOP_CLIENT_SECRET = Deno.env.get('WHOP_CLIENT_SECRET') ?? '';
const DEFAULT_REDIRECT_URI = 'https://creator-os999.vercel.app/auth/callback';
const ACCESS_GRANTING_STATUSES = new Set(['active', 'trialing', 'past_due', 'completed']);

type WhopMembership = {
  id: string;
  plan_id: string;
  status: string;
  current_period_end?: string | null;
  created_at?: string;
};

async function resolveWhopPlan(
  supabaseAdmin: ReturnType<typeof createClient>,
  whopApiKey: string,
  whopUserId: string,
) {
  const membershipsResponse = await fetch(
    `https://api.whop.com/api/v2/memberships?user_id=${encodeURIComponent(whopUserId)}&per_page=100`,
    { headers: { Authorization: `Bearer ${whopApiKey}` } },
  );
  if (!membershipsResponse.ok) {
    const errorBody = await membershipsResponse.text();
    throw new Error(`Whop membership lookup failed: ${membershipsResponse.status} - ${errorBody}`);
  }

  const memberships = ((await membershipsResponse.json()).data ?? []) as WhopMembership[];
  const candidates = memberships.filter((membership) => ACCESS_GRANTING_STATUSES.has(membership.status));
  if (!candidates.length) return null;

  const { data: mappings, error } = await supabaseAdmin
    .from('whop_plan_mappings')
    .select('whop_plan_id, tier')
    .in('whop_plan_id', candidates.map((membership) => membership.plan_id));
  if (error) throw new Error(`Creator OS plan mapping lookup failed: ${error.message}`);

  const rank: Record<string, number> = { creator: 1, pro: 2, agency: 3 };
  const tiersByPlan = new Map((mappings ?? []).map((mapping) => [mapping.whop_plan_id, mapping.tier]));
  return candidates
    .map((membership) => ({ membership, tier: tiersByPlan.get(membership.plan_id) }))
    .filter((item): item is { membership: WhopMembership; tier: string } => Boolean(item.tier))
    .sort((a, b) => (rank[b.tier] ?? 0) - (rank[a.tier] ?? 0))[0] ?? null;
}

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
    const whopApiKey = Deno.env.get('WHOP_API_KEY') ?? '';
    if (!whopApiKey) throw new Error('Whop membership verification is not configured');
    const resolvedPlan = await resolveWhopPlan(supabaseAdmin, whopApiKey, whopUserId);
    const effectiveTier = resolvedPlan?.tier ?? 'free';
    const effectiveMembershipStatus = resolvedPlan?.membership.status ?? 'inactive';

    const { data: existingUsers, error: existingUsersError } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
    if (existingUsersError) throw new Error(`Could not look up Supabase user: ${existingUsersError.message}`);

    const normalizedWhopEmail = String(email ?? '').trim().toLowerCase();
    const emailCandidate = existingUsers.users.find((user) => user.email && String(user.email).trim().toLowerCase() === normalizedWhopEmail);
    const whopCandidate = existingUsers.users.find((user) => user.user_metadata?.whop_id === whopUserId);
    const existingUser = emailCandidate ?? whopCandidate ?? null;

    const deterministicPassword = await derivePassword(whopUserId, serviceRoleKey);
    let supabaseUserId: string;
    let signInEmail: string;

    if (existingUser) {
      supabaseUserId = existingUser.id;
      signInEmail = existingUser.email!;
      const nextMetadata = {
        ...(existingUser.user_metadata ?? {}),
        whop_id: whopUserId,
      };
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(supabaseUserId, {
        password: deterministicPassword,
        user_metadata: nextMetadata,
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

    // Read existing profile to avoid overwriting managed subscription fields
    const { data: existingProfile, error: existingProfileErr } = await supabaseAdmin
      .from('users')
      .select('subscription_tier, membership_status, whop_membership_id, whop_plan_id, membership_expires_at')
      .eq('id', supabaseUserId)
      .maybeSingle();
    if (existingProfileErr) throw new Error(`Could not read existing profile: ${existingProfileErr.message}`);

    const upsertPayload: Record<string, unknown> = {
      id: supabaseUserId,
      whop_id: whopUserId,
      full_name: fullName,
      avatar_url: whopUser.picture ?? null,
      updated_at: new Date().toISOString(),
    };

    // Only update managed membership fields when we have a resolved plan from Whop.
    // This prevents brief upstream failures from downgrading paid users to 'free'.
    if (resolvedPlan) {
      upsertPayload.membership_status = effectiveMembershipStatus;
      upsertPayload.subscription_tier = effectiveTier;
      upsertPayload.whop_membership_id = resolvedPlan?.membership.id ?? null;
      upsertPayload.whop_plan_id = resolvedPlan?.membership.plan_id ?? null;
      upsertPayload.membership_expires_at = resolvedPlan?.membership.current_period_end ?? null;
      upsertPayload.entitlement_updated_at = new Date().toISOString();
    }

    const { error: profileError } = await supabaseAdmin.from('users').upsert(upsertPayload, { onConflict: 'id' });
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
