import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/useAuthStore';

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

  const beginCheckout = async (checkoutUrl: string) => {
    if (!user) { navigate('/login'); return; }
    
    // We no longer require Whop OAuth to start a checkout! 
    // The passthrough parameter securely links the user to the purchase on the webhook side.
    const signedCheckoutUrl = checkoutWithPassthrough(checkoutUrl);
    window.location.assign(signedCheckoutUrl);
  };

  return { beginCheckout, user };
}
