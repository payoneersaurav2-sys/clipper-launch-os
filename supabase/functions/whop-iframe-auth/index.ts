import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { jwtVerify, createRemoteJWKSet } from "https://deno.land/x/jose@v4.14.4/index.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Whop's public key set for verifying x-whop-user-token JWTs
const WHOP_JWKS = createRemoteJWKSet(new URL('https://api.whop.com/.well-known/jwks.json'));
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

  const tierRank: Record<string, number> = { creator: 1, pro: 2, agency: 3 };
  const byPlan = new Map((mappings ?? []).map((mapping) => [mapping.whop_plan_id, mapping.tier]));
  const matched = candidates
    .map((membership) => ({ membership, tier: byPlan.get(membership.plan_id) }))
    .filter((item): item is { membership: WhopMembership; tier: string } => Boolean(item.tier))
    .sort((a, b) => (tierRank[b.tier] ?? 0) - (tierRank[a.tier] ?? 0))[0];

  return matched ?? null;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { token, experienceId } = await req.json();
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

    // 3 & 4. Verify the verified Whop user is entitled to this Experience.
    // The Experience ID is provided by Whop in the Experience View URL. A
    // server-side fallback supports a fixed Experience configuration.
    const whopApiKey = Deno.env.get('WHOP_API_KEY') ?? '';
    const configuredExperienceId = Deno.env.get('WHOP_EXPERIENCE_ID') ?? '';
    const resourceId = experienceId || configuredExperienceId;

    if (!whopApiKey) throw new Error('Whop access verification is not configured');
    if (!resourceId) throw new Error('Whop Experience ID is missing');

    const accessResponse = await fetch(
      `https://api.whop.com/api/v1/users/${encodeURIComponent(userId)}/access/${encodeURIComponent(resourceId)}`,
      { headers: { 'Authorization': `Bearer ${whopApiKey}` } },
    );
    if (!accessResponse.ok) {
      throw new Error(`Whop access check failed: ${accessResponse.status}`);
    }
    const access = await accessResponse.json();
    if (!access.has_access || !['customer', 'admin'].includes(access.access_level)) {
      return new Response(JSON.stringify({ error: 'Your Whop membership does not have access to Creator OS.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    // Whop access verifies the Experience; membership resolution verifies the
    // paid Creator OS tier. Checkout URLs are never used as an entitlement.
    const resolvedPlan = await resolveWhopPlan(supabaseAdmin, whopApiKey, userId);
    if (!resolvedPlan) {
      return new Response(JSON.stringify({ error: 'Your Whop access is valid, but no active Creator OS plan could be resolved.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    const [profileRes, listData] = await Promise.all([
      fetch(`https://api.whop.com/api/v2/users/${userId}`, {
        headers: { 'Authorization': `Bearer ${whopApiKey}` }
      }),
      supabaseAdmin.auth.admin.listUsers({ perPage: 1000 })
        .then(r => r.data),
    ]);

    let email = `whop_${userId}@creator-os.app`;
    let fullName = 'Whop User';
    if (profileRes?.ok) {
      const profile = await profileRes.json();
      if (profile.email) email = profile.email;
      fullName = profile.username || profile.name || fullName;
    }

    // 4. Create or retrieve the user in Supabase Auth
    const deterministicPassword = await derivePassword(userId, SERVICE_ROLE_KEY);

    let targetUid: string;
    let signInEmail: string = email; // track the correct email to sign in with

    // Search for existing user by email or whop_id metadata (listData already fetched above)
    const byEmail = listData?.users?.find(u => u.email === email);
    const byWhopId = listData?.users?.find(u => u.user_metadata?.whop_id === userId);
    const found = byEmail || byWhopId;

    if (found) {
      targetUid = found.id;
      signInEmail = found.email!; // CRITICAL: use their actual Supabase email
      const { error: updateErr } = await supabaseAdmin.auth.admin.updateUserById(targetUid, {
        password: deterministicPassword,
        user_metadata: { whop_id: userId },
      });
      if (updateErr) throw new Error(`Failed to update user password: ${updateErr.message}`);
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
      signInEmail = email;
    }

    // 5. Upsert into public.users (schema: id UUID, whop_id TEXT, full_name TEXT, membership_status TEXT)
    const { error: dbError } = await supabaseAdmin.from('users').upsert({
      id: targetUid,
      whop_id: userId,
      full_name: fullName,
      membership_status: resolvedPlan.membership.status,
      subscription_tier: resolvedPlan.tier,
      whop_membership_id: resolvedPlan.membership.id,
      whop_plan_id: resolvedPlan.membership.plan_id,
      membership_expires_at: resolvedPlan.membership.current_period_end ?? null,
      entitlement_updated_at: new Date().toISOString(),
      onboarding_complete: true,
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
