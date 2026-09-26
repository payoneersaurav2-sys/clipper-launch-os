import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/useAuthStore';
import { buildWhopOAuthUrl } from '@/lib/whopPkce';

export function useCheckout() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const whopId = user?.user_metadata?.whop_id;

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

  const beginCheckout = async (checkoutUrl: string) => {
    if (!user) { navigate('/login'); return; }
    if (!whopId) {
      try {
        const whopUrl = await buildWhopOAuthUrl('link_account');
        window.location.assign(whopUrl);
      } catch {
        navigate('/dashboard/credits');
      }
      return;
    }
    const signedCheckoutUrl = checkoutWithPassthrough(checkoutUrl);
    window.location.assign(signedCheckoutUrl);
  };

  return { beginCheckout, user, whopId };
}
