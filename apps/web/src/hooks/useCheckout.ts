import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/useAuthStore';
import { useCheckoutStore } from '@/stores/useCheckoutStore';
import { findPlanByPriceId, type BillingInterval } from '@/lib/pricing';

export function useCheckout() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const openCheckout = useCheckoutStore((s) => s.openCheckout);

  const beginCheckout = async (
    checkoutUrl?: string,
    paddlePriceId?: string,
    options?: { planId?: 'creator' | 'pro' | 'agency'; billing?: BillingInterval }
  ) => {
    if (!user) {
      navigate('/login');
      return;
    }

    let planId = options?.planId;
    let billing = options?.billing;

    if (!planId && paddlePriceId) {
      const found = findPlanByPriceId(paddlePriceId);
      if (found) {
        planId = found.plan.id;
        billing = found.billing;
      }
    }

    // Opens the native Creator OS Paddle checkout modal container
    openCheckout({
      planId: planId ?? 'pro',
      billing: billing ?? 'annual',
      paddlePriceId,
      checkoutUrl: checkoutUrl || '',
    });
  };

  return { beginCheckout, user };
}
