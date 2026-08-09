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
  const { user } = useAuthStore();

  return useQuery({
    queryKey: ['entitlements', user?.id],
    enabled: Boolean(user),
    staleTime: 60_000,
    queryFn: async (): Promise<Entitlements> => {
      const { data, error } = await supabase.rpc('current_creator_os_entitlements');
      if (error) throw error;
      const result = (data ?? {}) as RpcEntitlements;
      const tier = normalizePlanTier(result.tier);
      if (result.status !== 'active' || !tier) {
        return { status: result.status === 'unsubscribed' ? 'unsubscribed' : 'unknown' };
      }

      // Use server values when available. The local config provides a safe
      // rendering fallback during a rolling migration, never authorization.
      const fallback = planEntitlements[tier];
      return {
        status: 'active',
        tier,
        capabilities: normalizeCapabilities(result.capabilities) ?? fallback.capabilities,
        limits: normalizeLimits(result.limits) ?? fallback.limits,
        membershipExpiresAt: result.membershipExpiresAt ?? null,
      };
    },
  });
}
