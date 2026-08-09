import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Entitlements, normalizeCapabilities, normalizeLimits, normalizePlanTier, planEntitlements } from '@/lib/entitlements';
import { useAuthStore } from '@/stores/useAuthStore';

type RpcEntitlements = {
  status?: 'active' | 'unsubscribed' | 'unknown';
  tier?: unknown;
  capabilities?: unknown;
  limits?: unknown;
  membershipExpiresAt?: string | null;
};

export function useEntitlements() {
  const { user, membershipStatus, subscriptionTier } = useAuthStore();

  return useQuery({
    queryKey: ['entitlements', user?.id],
    enabled: Boolean(user),
    staleTime: 60_000,
    queryFn: async (): Promise<Entitlements> => {
      const { data, error } = await supabase.rpc('current_creator_os_entitlements');
      if (error) throw error;
      const result = (data ?? {}) as RpcEntitlements;
      const tier = normalizePlanTier(result.tier);
      const fallbackTier = normalizePlanTier(subscriptionTier);

      if (result.status !== 'active' || !tier) {
        if (user && fallbackTier && fallbackTier !== 'free' && membershipStatus !== 'inactive') {
          return {
            status: 'active',
            tier: fallbackTier,
            capabilities: planEntitlements[fallbackTier].capabilities,
            limits: planEntitlements[fallbackTier].limits,
            membershipExpiresAt: null,
          };
        }
        return { status: result.status === 'unsubscribed' ? 'unsubscribed' : 'unknown' };
      }

      const capabilities = normalizeCapabilities(result.capabilities);
      const limits = normalizeLimits(result.limits);
      const fallback = planEntitlements[tier];

      return {
        status: 'active',
        tier,
        capabilities: capabilities ?? fallback.capabilities,
        limits: limits ?? fallback.limits,
        membershipExpiresAt: result.membershipExpiresAt ?? null,
      };
    },
  });
}
