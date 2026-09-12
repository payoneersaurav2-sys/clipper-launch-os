import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

export const ACCESS_GRANTING_STATUSES = new Set(['active', 'trialing', 'past_due', 'completed']);

export type WhopMembership = {
  id: string;
  plan_id: string;
  status: string;
  current_period_end?: string | null;
  created_at?: string;
};

export async function resolveWhopPlan(
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

  if (error) {
    throw new Error(`Creator OS plan mapping lookup failed: ${error.message}`);
  }

  const rank: Record<string, number> = { creator: 1, pro: 2, agency: 3 };
  const tiersByPlan = new Map((mappings ?? []).map((mapping) => [mapping.whop_plan_id, mapping.tier]));

  return candidates
    .map((membership) => ({ membership, tier: tiersByPlan.get(membership.plan_id) }))
    .filter((item): item is { membership: WhopMembership; tier: string } => Boolean(item.tier))
    .sort((a, b) => (rank[b.tier] ?? 0) - (rank[a.tier] ?? 0))[0] ?? null;
}
