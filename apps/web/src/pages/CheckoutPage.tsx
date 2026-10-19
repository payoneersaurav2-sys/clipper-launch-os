import { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useCheckoutStore } from '@/stores/useCheckoutStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { PaddleCheckoutModal } from '@/components/checkout/PaddleCheckoutModal';
import { ArrowLeft, ShieldCheck } from 'lucide-react';
import Wordmark from '@/components/Wordmark';

export default function CheckoutPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { openCheckout } = useCheckoutStore();

  const planParam = searchParams.get('plan') as 'creator' | 'pro' | 'agency' | null;
  const billingParam = searchParams.get('billing') as 'monthly' | 'annual' | null;

  useEffect(() => {
    if (!user) {
      navigate(`/login?returnTo=${encodeURIComponent(window.location.pathname + window.location.search)}`);
      return;
    }

    // Automatically open the checkout modal for the requested plan
    openCheckout({
      planId: planParam && ['creator', 'pro', 'agency'].includes(planParam) ? planParam : 'pro',
      billing: billingParam && ['monthly', 'annual'].includes(billingParam) ? billingParam : 'annual',
    });
  }, [user, planParam, billingParam, openCheckout, navigate]);

  return (
    <div className="min-h-screen bg-[#080808] text-white flex flex-col justify-between p-4 sm:p-8">
      {/* Checkout Page Header */}
      <header className="max-w-5xl mx-auto w-full flex items-center justify-between pb-6 border-b border-white/[0.06]">
        <button
          type="button"
          onClick={() => navigate('/dashboard/pricing')}
          className="inline-flex items-center gap-2 text-xs text-zinc-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Plans</span>
        </button>

        <Wordmark className="h-5" />

        <div className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Secure Checkout</span>
        </div>
      </header>

      {/* Main Centered Content */}
      <main className="flex-1 flex items-center justify-center py-10">
        <PaddleCheckoutModal />
      </main>

      {/* Footer */}
      <footer className="max-w-5xl mx-auto w-full text-center text-xs text-zinc-500 pt-6 border-t border-white/[0.06]">
        <p>© {new Date().getFullYear()} Creator OS. Payments securely processed via Paddle. Cancel anytime.</p>
      </footer>
    </div>
  );
}
