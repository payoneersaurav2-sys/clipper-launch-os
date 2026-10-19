import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/useAuthStore';
import { getPaddle } from '@/lib/paddle';

export function useCheckout() {
  const navigate = useNavigate();
  const { user } = useAuthStore();

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

  const beginCheckout = async (checkoutUrl: string, paddlePriceId?: string) => {
    if (!user) { navigate('/login'); return; }

    // ── Paddle overlay checkout ───────────────────────────────────────────────
    // If a Paddle price ID is configured AND the Paddle singleton is ready,
    // open the Paddle overlay. userId is passed as customData so the webhook
    // handler can link the subscription to the correct user.
    if (paddlePriceId) {
      const paddle = getPaddle();
      if (paddle) {
        paddle.Checkout.open({
          items: [{ priceId: paddlePriceId, quantity: 1 }],
          customData: { userId: user.id },
        });
        return;
      }
      // Paddle not initialized (token missing / not yet configured) — fall through to Whop URL.
    }

    // ── Whop URL fallback ─────────────────────────────────────────────────────
    // Preserves the existing production checkout flow for all Whop-configured plans.
    const signedCheckoutUrl = checkoutWithPassthrough(checkoutUrl);
    window.location.assign(signedCheckoutUrl);
  };

  return { beginCheckout, user };
}
