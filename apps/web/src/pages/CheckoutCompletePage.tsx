import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import type { PlanTier } from '@/lib/entitlements';
import { useAuthStore } from '@/stores/useAuthStore';

const REFRESH_ATTEMPTS = 15;
const REFRESH_INTERVAL_MS = 2_000;
const isPaidTier = (tier: unknown): tier is Exclude<PlanTier, 'free'> =>
  tier === 'creator' || tier === 'pro' || tier === 'agency';

export default function CheckoutCompletePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const { user, isLoading: isAuthLoading } = useAuthStore();
  const expectedTier = searchParams.get('plan');

  // Wait for Supabase session restoration before treating the user as signed out.
  useEffect(() => {
    if (isAuthLoading) return;
    if (!user) {
      navigate('/login?returnTo=%2Fdashboard', { replace: true });
      return;
    }

    const queryKey = ['entitlements', user.id];

    const refreshEntitlements = async () => {
      for (let attempt = 0; attempt < REFRESH_ATTEMPTS; attempt += 1) {
        await queryClient.invalidateQueries({ queryKey, refetchType: 'all' });
        await queryClient.refetchQueries({ queryKey, type: 'all' });

        const currentTier = queryClient.getQueryData<{ status?: string; tier?: PlanTier }>(queryKey);
        const expectedPaidTier = isPaidTier(expectedTier);
        const planIsActive = currentTier?.status === 'active'
          && (expectedPaidTier ? currentTier.tier === expectedTier : isPaidTier(currentTier.tier));

        if (planIsActive) {
          const currentSession = useAuthStore.getState().session;
          if (currentSession?.user.id === user.id) {
            await useAuthStore.getState().syncSession(currentSession);
          }
          return;
        }

        if (attempt < REFRESH_ATTEMPTS - 1) {
          await new Promise((resolve) => window.setTimeout(resolve, REFRESH_INTERVAL_MS));
        }
      }
    };

    void refreshEntitlements();
    navigate('/dashboard', { replace: true });
  }, [isAuthLoading, user, expectedTier, navigate, queryClient]);

  return null;
}
