import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/useAuthStore';
import { useCheckoutStore } from '@/stores/useCheckoutStore';
import { findPlanByPriceId, type BillingInterval } from '@/lib/pricing';

export function useCheckout() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const openCheckout = useCheckoutStore((s) => s.openCheckout);

  const checkoutWithPassthrough = (checkoutUrl: string) => {
    if (!user?.id) return checkoutUrl;
    try {
      const nextUrl = new URL(checkoutUrl);
      nextUrl.searchParams.set('passthrough', user.id);
      return nextUrl.toString();
    } catch {
      const separator = checkoutUrl.includes('?') ? '&' : '?';
      return `${checkoutUrl}${separator}passthrough=${encodeURIComponent(user.id)}`;
    }
  };

  const beginCheckout = async (
    checkoutUrl: string,
    paddlePriceId?: string,
    options?: { planId?: 'creator' | 'pro' | 'agency'; billing?: BillingInterval }
  ) => {
    if (!user) {
      navigate('/login');
      return;
    }

    // ── Paddle Branded Checkout ───────────────────────────────────────────────
    // If a Paddle price ID or plan is specified, open the native Creator OS
    // checkout modal container where the user inserts card details.
    if (paddlePriceId || options?.planId) {
      let planId = options?.planId;
      let billing = options?.billing;

      if (!planId && paddlePriceId) {
        const found = findPlanByPriceId(paddlePriceId);
        if (found) {
          planId = found.plan.id;
          billing = found.billing;
        }
      }

      openCheckout({
        planId: planId ?? 'pro',
        billing: billing ?? 'annual',
        paddlePriceId,
        checkoutUrl,
      });
      return;
    }

    // ── Whop URL fallback ─────────────────────────────────────────────────────
    // Preserves the existing fallback checkout flow if Paddle is not configured.
    const signedCheckoutUrl = checkoutWithPassthrough(checkoutUrl);
    window.location.assign(signedCheckoutUrl);
  };

  return { beginCheckout, user };
}
