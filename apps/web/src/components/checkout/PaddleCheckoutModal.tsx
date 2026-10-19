import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Check, ShieldCheck, Lock, Sparkles, AlertCircle, 
  Copy, CheckCircle2, Loader2, RefreshCw, CreditCard
} from 'lucide-react';
import { useCheckoutStore } from '@/stores/useCheckoutStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { useEntitlements } from '@/hooks/useEntitlements';
import { getPaddle, getPaddleAsync, subscribePaddleEvents } from '@/lib/paddle';
import { getPlan, pricingPlans, type BillingInterval } from '@/lib/pricing';
import { planEntitlements, PlanTier } from '@/lib/entitlements';
import Wordmark from '@/components/Wordmark';

const money = new Intl.NumberFormat('en-US', { 
  style: 'currency', 
  currency: 'USD', 
  maximumFractionDigits: 0 
});

export function PaddleCheckoutModal() {
  const navigate = useNavigate();
  const { 
    isOpen, 
    planId, 
    billing, 
    customPriceId, 
    closeCheckout, 
    setBilling, 
    setPlanId 
  } = useCheckoutStore();

  const { user, subscriptionTier, membershipStatus } = useAuthStore();
  const { data: entitlements } = useEntitlements();

  const [isLoadingPaddle, setIsLoadingPaddle] = useState(true);
  const [isPaddleLoaded, setIsPaddleLoaded] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [copiedCard, setCopiedCard] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const isSandbox = (import.meta.env.VITE_PADDLE_ENV as string | undefined) !== 'production';

  // Selected plan metadata
  const currentPlan = useMemo(() => getPlan(planId) || pricingPlans[1], [planId]);
  
  // Calculate pricing
  const isAnnual = billing === 'annual';
  const displayPrice = isAnnual ? currentPlan.annualPrice : currentPlan.monthlyPrice;
  const renewalText = isAnnual 
    ? `${money.format(currentPlan.annualPrice)}/year` 
    : `${money.format(currentPlan.monthlyPrice)}/month`;

  // 3-day trial calculation
  const trialEndDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 3);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }, []);

  // Subscription-awareness check: is user already subscribed to this tier?
  const currentActiveTier = entitlements?.tier ?? (subscriptionTier as PlanTier) ?? 'free';
  const isAlreadyOnThisPlan = currentActiveTier === planId && (membershipStatus === 'active' || membershipStatus === 'trialing');

  // Key tier limits from entitlements config
  const limits = planEntitlements[planId as PlanTier]?.limits;

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        closeCheckout();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, closeCheckout]);

  // Paddle Checkout lifecycle
  useEffect(() => {
    if (!isOpen) {
      setIsPaddleLoaded(false);
      setIsLoadingPaddle(true);
      setCheckoutError(null);
      setIsSuccess(false);
      return;
    }

    if (isAlreadyOnThisPlan) {
      setIsLoadingPaddle(false);
      return;
    }

    let isMounted = true;
    setIsLoadingPaddle(true);
    setIsPaddleLoaded(false);
    setCheckoutError(null);

    // Subscribe to Paddle checkout events
    const unsubscribe = subscribePaddleEvents((event) => {
      if (!isMounted) return;

      console.log('[Checkout Modal] Paddle Event received:', event);

      if (event.name === 'checkout.loaded') {
        setIsPaddleLoaded(true);
        setIsLoadingPaddle(false);
        setCheckoutError(null);
      } else if (event.name === 'checkout.completed') {
        setIsSuccess(true);
        setTimeout(() => {
          closeCheckout();
          navigate('/checkout/complete');
        }, 1200);
      } else if (event.name === 'checkout.closed') {
        closeCheckout();
      } else if (
        event.name === 'checkout.error' || 
        (event as any).type === 'checkout.error' ||
        (event as any).type === 'checkout.warning'
      ) {
        const detail = (event as any).detail || (event as any).message;
        if (detail && detail.includes('error')) {
          setCheckoutError(detail);
          setIsLoadingPaddle(false);
        }
      }
    });

    // Small delay ensures modal target container is mounted in the DOM
    const openTimer = setTimeout(async () => {
      try {
        const paddle = await getPaddleAsync();
        if (!isMounted) return;

        if (!paddle) {
          setCheckoutError('Paddle billing service is currently unavailable. Please check your network or try again.');
          setIsLoadingPaddle(false);
          return;
        }

        const priceId = customPriceId || currentPlan.checkout[billing].paddlePriceId;
        if (!priceId) {
          setCheckoutError(`No Paddle price configured for ${currentPlan.name} (${billing}).`);
          setIsLoadingPaddle(false);
          return;
        }

        console.log('[Checkout Modal] Opening inline checkout:', { priceId, planId, billing, userId: user?.id });

        paddle.Checkout.open({
          items: [{ priceId, quantity: 1 }],
          customData: user?.id ? { userId: user.id } : undefined,
          customer: user?.email ? { email: user.email } : undefined,
          settings: {
            displayMode: 'inline',
            variant: 'one-page',
            theme: 'dark',
            locale: 'en',
            allowLogout: false,
            frameTarget: 'paddle-checkout-frame',
            frameInitialHeight: 460,
            frameStyle: 'width: 100%; min-height: 460px; background-color: transparent; border: none;',
            successUrl: `${window.location.origin}/checkout/complete`,
          },
        });
      } catch (err: any) {
        if (isMounted) {
          console.error('[Checkout Modal] Error opening Paddle checkout:', err);
          setCheckoutError(err.message || 'Unable to load payment form.');
          setIsLoadingPaddle(false);
        }
      }
    }, 120);

    return () => {
      isMounted = false;
      clearTimeout(openTimer);
      unsubscribe();
      try {
        const paddle = getPaddle();
        paddle?.Checkout.close();
      } catch {
        // Safe cleanup
      }
    };
  }, [isOpen, planId, billing, customPriceId, isAlreadyOnThisPlan, currentPlan, user?.id, user?.email, closeCheckout, navigate]);

  const handleCopyTestCard = () => {
    navigator.clipboard.writeText('4242424242424242');
    setCopiedCard(true);
    setTimeout(() => setCopiedCard(false), 2200);
  };

  const handleRetry = () => {
    setCheckoutError(null);
    setIsLoadingPaddle(true);
    setIsPaddleLoaded(false);
    const paddle = getPaddle();
    if (paddle) {
      const priceId = customPriceId || currentPlan.checkout[billing].paddlePriceId;
      if (priceId) {
        paddle.Checkout.open({
          items: [{ priceId, quantity: 1 }],
          customData: user?.id ? { userId: user.id } : undefined,
          customer: user?.email ? { email: user.email } : undefined,
          settings: {
            displayMode: 'inline',
            variant: 'one-page',
            theme: 'dark',
            locale: 'en',
            frameTarget: 'paddle-checkout-frame',
            frameInitialHeight: 460,
            frameStyle: 'width: 100%; min-height: 460px; background-color: transparent; border: none;',
            successUrl: `${window.location.origin}/checkout/complete`,
          },
        });
      }
    }
  };

  const handleSelectPlan = (newPlanId: 'creator' | 'pro' | 'agency') => {
    setPlanId(newPlanId);
    const targetPlan = getPlan(newPlanId);
    const newPriceId = targetPlan?.checkout[billing].paddlePriceId;
    if (newPriceId && isPaddleLoaded) {
      try {
        const paddle = getPaddle();
        paddle?.Checkout.updateItems([{ priceId: newPriceId, quantity: 1 }]);
      } catch (err) {
        console.warn('[Checkout Modal] updateItems failed on plan switch:', err);
      }
    }
  };

  const handleSelectBilling = (newBilling: BillingInterval) => {
    setBilling(newBilling);
    const newPriceId = currentPlan.checkout[newBilling].paddlePriceId;
    if (newPriceId && isPaddleLoaded) {
      try {
        const paddle = getPaddle();
        paddle?.Checkout.updateItems([{ priceId: newPriceId, quantity: 1 }]);
      } catch (err) {
        console.warn('[Checkout Modal] updateItems failed on billing switch:', err);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div 
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md overflow-y-auto"
        onClick={(e) => {
          if (e.target === e.currentTarget) closeCheckout();
        }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="checkout-modal-title"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 12 }}
          transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-5xl bg-[#0C0C0E] border border-white/[0.09] rounded-2xl sm:rounded-3xl shadow-[0_0_80px_rgba(124,58,237,0.18)] overflow-hidden my-auto"
        >
          {/* Subtle top brand glow line */}
          <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-[#7C3AED] to-transparent pointer-events-none" />

          {/* Modal Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.07] bg-[#09090B]">
            <div className="flex items-center gap-3">
              <Wordmark className="h-5" />
              <div className="h-4 w-px bg-white/[0.1] hidden sm:block" />
              <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>256-bit Encrypted Checkout</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {isSandbox && (
                <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wide bg-amber-500/10 text-amber-300 border border-amber-500/20">
                  SANDBOX TEST MODE
                </span>
              )}
              <button
                type="button"
                onClick={closeCheckout}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.08] transition-colors"
                aria-label="Close checkout"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Main Content Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[580px]">
            {/* ── Left Column: Plan & Order Summary ────────────────────────── */}
            <div className="lg:col-span-5 bg-[#08080A] p-6 sm:p-8 border-b lg:border-b-0 lg:border-r border-white/[0.07] flex flex-col justify-between">
              <div>
                {/* Plan Selector Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="inline-flex p-1 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                    {(['creator', 'pro', 'agency'] as const).map((id) => (
                      <button
                        key={id}
                        type="button"
                        onClick={() => handleSelectPlan(id)}
                        className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all capitalize ${
                          planId === id
                            ? 'bg-[#7C3AED] text-white shadow-[0_0_12px_rgba(124,58,237,0.4)]'
                            : 'text-zinc-400 hover:text-white'
                        }`}
                      >
                        {id}
                      </button>
                    ))}
                  </div>

                  {currentPlan.recommended && (
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-[#7C3AED]/15 text-[#C4B5FD] border border-[#7C3AED]/30">
                      Popular
                    </span>
                  )}
                </div>

                <div className="mb-6">
                  <h3 id="checkout-modal-title" className="text-2xl font-bold text-white tracking-tight">
                    {currentPlan.name} Plan
                  </h3>
                  <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                    {currentPlan.positioning}
                  </p>
                </div>

                {/* Billing Interval Toggle inside Checkout */}
                <div className="mb-6 p-1.5 rounded-xl bg-white/[0.03] border border-white/[0.07] flex items-center justify-between">
                  <span className="text-xs font-medium text-zinc-400 pl-2">Billing frequency:</span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleSelectBilling('monthly')}
                      className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                        billing === 'monthly'
                          ? 'bg-white/10 text-white font-semibold'
                          : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      Monthly
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSelectBilling('annual')}
                      className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 ${
                        billing === 'annual'
                          ? 'bg-[#7C3AED] text-white font-semibold shadow-[0_0_12px_rgba(124,58,237,0.3)]'
                          : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      <span>Annual</span>
                      <span className="text-[10px] px-1 rounded bg-emerald-500/20 text-emerald-300 font-bold">
                        -17%
                      </span>
                    </button>
                  </div>
                </div>

                {/* 3-Day Free Trial Highlight Card */}
                <div className="mb-6 p-4 rounded-2xl bg-gradient-to-br from-[#7C3AED]/10 via-[#7C3AED]/5 to-transparent border border-[#7C3AED]/25 shadow-inner">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-[#A78BFA]" />
                      <span className="text-xs font-bold text-[#E9D5FF] tracking-wide uppercase">
                        3-Day Free Trial
                      </span>
                    </div>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
                      $0.00 DUE TODAY
                    </span>
                  </div>
                  <p className="text-xs text-zinc-300 leading-relaxed">
                    Full access to {currentPlan.name} tier for 3 days. No charge today. You can cancel anytime with 1 click in settings before the trial ends without paying anything.
                  </p>
                </div>

                {/* Transparent Price Summary */}
                <div className="mb-6 space-y-2.5 text-xs text-zinc-400 border-t border-b border-white/[0.06] py-4">
                  <div className="flex items-center justify-between">
                    <span>{currentPlan.name} Plan ({billing})</span>
                    <span className="text-zinc-300 line-through">{money.format(displayPrice)}</span>
                  </div>
                  <div className="flex items-center justify-between text-emerald-400 font-medium">
                    <span>3-Day Free Trial Discount</span>
                    <span>-100% (-{money.format(displayPrice)})</span>
                  </div>
                  <div className="flex items-center justify-between text-white font-bold text-sm pt-2 border-t border-white/[0.06]">
                    <span>Total Due Today:</span>
                    <span className="text-emerald-400 text-base">$0.00</span>
                  </div>
                  <p className="text-[11px] text-zinc-500 pt-1 leading-normal">
                    Recurring {renewalText} begins on <span className="text-zinc-300 font-medium">{trialEndDate}</span> unless cancelled beforehand.
                  </p>
                </div>

                {/* Included Features & Limits */}
                <div className="space-y-2">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-2">
                    What you unlock today:
                  </p>
                  {limits && (
                    <ul className="space-y-2 text-xs text-zinc-300">
                      <li className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-[#7C3AED] shrink-0" strokeWidth={3} />
                        <span><strong>{limits.workspaces}</strong> {limits.workspaces === 1 ? 'Workspace' : 'Isolated Workspaces'}</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-[#7C3AED] shrink-0" strokeWidth={3} />
                        <span><strong>{limits.ai_generations_per_month.toLocaleString()}</strong> AI generations / month</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-[#7C3AED] shrink-0" strokeWidth={3} />
                        <span><strong>{limits.active_campaigns}</strong> Active Campaigns & {limits.content_batch_size}-item batches</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-[#7C3AED] shrink-0" strokeWidth={3} />
                        <span>Knowledge Vault & platform-optimized Caption OS</span>
                      </li>
                      {planId === 'agency' && (
                        <li className="flex items-center gap-2 text-emerald-300">
                          <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" strokeWidth={3} />
                          <span>Multi-Client Isolation & Team Access Controls</span>
                        </li>
                      )}
                    </ul>
                  )}
                </div>
              </div>

              {/* Security & Guarantees Trust Footer */}
              <div className="mt-8 pt-4 border-t border-white/[0.06] text-[11px] text-zinc-500 space-y-1.5">
                <div className="flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Payments secured by Paddle (Merchant of Record)</span>
                </div>
                <div>PCI-DSS Level 1 compliant. Your card data is never stored by Creator OS.</div>
              </div>
            </div>

            {/* ── Right Column: Card Details & Payment Frame ──────────────── */}
            <div className="lg:col-span-7 bg-[#0C0C0E] p-6 sm:p-8 flex flex-col justify-between relative">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="text-base font-semibold text-white tracking-tight flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-[#7C3AED]" />
                      Payment Method
                    </h4>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      Enter your payment details to authorize and start your 3-day trial.
                    </p>
                  </div>
                  <div className="flex items-center gap-1 text-[11px] text-zinc-400">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span>Live SSL</span>
                  </div>
                </div>

                {/* Sandbox Card Helper Banner */}
                {isSandbox && (
                  <div className="mb-4 p-3 rounded-xl bg-zinc-900/90 border border-zinc-800 text-xs text-zinc-300 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-zinc-800 text-amber-400 border border-zinc-700 uppercase shrink-0">
                        Test Card
                      </span>
                      <code className="font-mono text-zinc-200 tracking-wider">4242 •••• 4242 4242</code>
                      <span className="text-zinc-500 hidden sm:inline">(Any future MM/YY & CVC)</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleCopyTestCard}
                      className="px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-[11px] text-zinc-200 font-medium transition-colors flex items-center gap-1 shrink-0"
                    >
                      {copiedCard ? (
                        <>
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          <span className="text-emerald-400">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3 text-zinc-400" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                )}

                {/* Subscription-Aware State: Already active */}
                {isAlreadyOnThisPlan ? (
                  <div className="my-8 p-6 rounded-2xl bg-zinc-900 border border-zinc-800 text-center">
                    <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-3">
                      <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <h5 className="text-base font-bold text-white mb-1">
                      You are already subscribed to {currentPlan.name}
                    </h5>
                    <p className="text-xs text-zinc-400 max-w-sm mx-auto mb-6">
                      Your {currentPlan.name} subscription is active. You do not need to enter payment details again.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          closeCheckout();
                          navigate('/dashboard/settings');
                        }}
                        className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs font-semibold transition-colors"
                      >
                        Manage Subscription in Settings
                      </button>
                      <button
                        type="button"
                        onClick={() => closeCheckout()}
                        className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.08] text-zinc-300 text-xs font-semibold transition-colors border border-white/[0.06]"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                ) : checkoutError ? (
                  /* Error State */
                  <div className="my-8 p-6 rounded-2xl bg-red-950/20 border border-red-500/20 text-center">
                    <div className="w-12 h-12 rounded-full bg-red-500/10 text-red-400 flex items-center justify-center mx-auto mb-3">
                      <AlertCircle className="w-6 h-6" />
                    </div>
                    <h5 className="text-sm font-semibold text-white mb-1">
                      Unable to initialize payment form
                    </h5>
                    <p className="text-xs text-zinc-400 max-w-sm mx-auto mb-4">
                      {checkoutError}
                    </p>
                    <button
                      type="button"
                      onClick={handleRetry}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-medium text-white transition-colors"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      Retry loading checkout
                    </button>
                  </div>
                ) : isSuccess ? (
                  /* Completed State */
                  <div className="my-12 p-8 text-center flex flex-col items-center">
                    <div className="w-16 h-16 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mb-4 animate-bounce">
                      <CheckCircle2 className="w-8 h-8" />
                    </div>
                    <h5 className="text-lg font-bold text-white mb-1">
                      Payment Confirmed!
                    </h5>
                    <p className="text-xs text-zinc-400 max-w-xs mb-4">
                      Your 3-day trial is being activated. Taking you to your workspace...
                    </p>
                    <Loader2 className="w-5 h-5 text-[#7C3AED] animate-spin" />
                  </div>
                ) : (
                  /* Live Paddle Form Mount Container */
                  <div className="relative">
                    {/* Skeleton while Paddle iframe initializes */}
                    {(!isPaddleLoaded || isLoadingPaddle) && (
                      <div className="absolute inset-0 z-10 bg-[#0C0C0E] rounded-xl flex flex-col justify-center space-y-4 p-4 animate-pulse">
                        <div className="flex items-center justify-center gap-2 text-xs text-zinc-400 pb-2">
                          <Loader2 className="w-4 h-4 text-[#7C3AED] animate-spin" />
                          <span>Securing Paddle payment channel...</span>
                        </div>
                        <div className="h-10 bg-white/[0.04] rounded-lg border border-white/[0.05]" />
                        <div className="grid grid-cols-2 gap-3">
                          <div className="h-10 bg-white/[0.04] rounded-lg border border-white/[0.05]" />
                          <div className="h-10 bg-white/[0.04] rounded-lg border border-white/[0.05]" />
                        </div>
                        <div className="h-10 bg-white/[0.04] rounded-lg border border-white/[0.05]" />
                        <div className="h-12 bg-[#7C3AED]/20 rounded-xl border border-[#7C3AED]/30 mt-4" />
                      </div>
                    )}

                    {/* Target element injected by Paddle.js */}
                    <div 
                      className="paddle-checkout-frame min-h-[460px] w-full"
                      style={{ minHeight: '460px' }}
                    />
                  </div>
                )}
              </div>

              {/* Bottom Guarantee Note */}
              <div className="pt-4 border-t border-white/[0.06] flex items-center justify-between text-[11px] text-zinc-500">
                <span className="flex items-center gap-1">
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  Zero risk — $0 charged today
                </span>
                <span>Immediate workspace activation</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
export default PaddleCheckoutModal;
