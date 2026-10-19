import { useEffect, useState, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Check, Lock, AlertCircle,
  Copy, CheckCircle2, Loader2, RefreshCw, CreditCard,
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
  maximumFractionDigits: 0,
});

/** How long to wait for `checkout.loaded` before surfacing a helpful error. */
const PADDLE_LOAD_TIMEOUT_MS = 12_000;

export function PaddleCheckoutModal() {
  const navigate = useNavigate();
  const {
    isOpen,
    planId,
    billing,
    customPriceId,
    closeCheckout,
    setBilling,
    setPlanId,
  } = useCheckoutStore();

  const { user, subscriptionTier, membershipStatus } = useAuthStore();
  const { data: entitlements } = useEntitlements();

  const [isLoadingPaddle, setIsLoadingPaddle] = useState(true);
  const [isPaddleLoaded, setIsPaddleLoaded] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [copiedCard, setCopiedCard] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const loadTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isSandbox = (import.meta.env.VITE_PADDLE_ENV as string | undefined) !== 'production';

  // Selected plan metadata
  const currentPlan = useMemo(() => getPlan(planId) || pricingPlans[1], [planId]);

  // Pricing
  const isAnnual = billing === 'annual';
  const displayPrice = isAnnual ? currentPlan.annualPrice : currentPlan.monthlyPrice;
  const renewalText = isAnnual
    ? `${money.format(currentPlan.annualPrice)}/year`
    : `${money.format(currentPlan.monthlyPrice)}/month`;

  // Trial end date (3 days from now)
  const trialEndDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 3);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }, []);

  // Already on this plan?
  const currentActiveTier = entitlements?.tier ?? (subscriptionTier as PlanTier) ?? 'free';
  const isAlreadyOnThisPlan =
    currentActiveTier === planId &&
    (membershipStatus === 'active' || membershipStatus === 'trialing');

  // Plan limits for the benefit list
  const limits = planEntitlements[planId as PlanTier]?.limits;

  // ESC key
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) closeCheckout();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, closeCheckout]);

  // ─── Paddle checkout lifecycle ──────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen) {
      setIsPaddleLoaded(false);
      setIsLoadingPaddle(true);
      setCheckoutError(null);
      setIsSuccess(false);
      if (loadTimeoutRef.current) clearTimeout(loadTimeoutRef.current);
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

    // Subscribe to Paddle events
    const unsubscribe = subscribePaddleEvents((event) => {
      if (!isMounted) return;
      if (event.name === 'checkout.loaded') {
        if (loadTimeoutRef.current) clearTimeout(loadTimeoutRef.current);
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
        if (loadTimeoutRef.current) clearTimeout(loadTimeoutRef.current);
        const detail = (event as any).detail || (event as any).message || 'Payment form failed to load.';
        setCheckoutError(typeof detail === 'string' ? detail : 'Payment form failed to load.');
        setIsLoadingPaddle(false);
      }
    });

    // Small delay so the DOM target is mounted before Paddle injects its iframe
    const openTimer = setTimeout(async () => {
      try {
        const paddle = await getPaddleAsync();
        if (!isMounted) return;

        if (!paddle) {
          setCheckoutError(
            'Paddle billing is currently unavailable. Check your network connection and try again.'
          );
          setIsLoadingPaddle(false);
          return;
        }

        const priceId = customPriceId || currentPlan.checkout[billing].paddlePriceId;
        if (!priceId) {
          setCheckoutError(
            `No price configured for ${currentPlan.name} (${billing}). Contact support.`
          );
          setIsLoadingPaddle(false);
          return;
        }

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

        // ── Critical fix: timeout when domain is unapproved (Live) or network-blocked.
        // Paddle's iframe will silently hang without firing checkout.loaded or checkout.error.
        // After PADDLE_LOAD_TIMEOUT_MS we surface an actionable error so users aren't stuck.
        if (loadTimeoutRef.current) clearTimeout(loadTimeoutRef.current);
        loadTimeoutRef.current = setTimeout(() => {
          if (!isMounted || isPaddleLoaded) return;
          setCheckoutError(
            isSandbox
              ? 'Checkout took too long to initialize. Ensure your Paddle sandbox is configured correctly and retry.'
              : 'Checkout failed to load. This is usually caused by domain approval: your domain must be approved in the Paddle dashboard under My Account → Settings → Website Approval. Please contact support if this persists.'
          );
          setIsLoadingPaddle(false);
        }, PADDLE_LOAD_TIMEOUT_MS);
      } catch (err: any) {
        if (isMounted) {
          if (loadTimeoutRef.current) clearTimeout(loadTimeoutRef.current);
          setCheckoutError(err.message || 'Unable to load payment form.');
          setIsLoadingPaddle(false);
        }
      }
    }, 120);

    return () => {
      isMounted = false;
      clearTimeout(openTimer);
      if (loadTimeoutRef.current) clearTimeout(loadTimeoutRef.current);
      unsubscribe();
      try {
        getPaddle()?.Checkout.close();
      } catch {
        // Safe cleanup
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, planId, billing, customPriceId, isAlreadyOnThisPlan]);

  const handleCopyTestCard = () => {
    navigator.clipboard.writeText('4242424242424242');
    setCopiedCard(true);
    setTimeout(() => setCopiedCard(false), 2200);
  };

  const handleRetry = () => {
    setCheckoutError(null);
    setIsLoadingPaddle(true);
    setIsPaddleLoaded(false);
    if (loadTimeoutRef.current) clearTimeout(loadTimeoutRef.current);
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
        loadTimeoutRef.current = setTimeout(() => {
          if (isPaddleLoaded) return;
          setCheckoutError('Checkout timed out. Please try again or contact support.');
          setIsLoadingPaddle(false);
        }, PADDLE_LOAD_TIMEOUT_MS);
      }
    }
  };

  const handleSelectPlan = (newPlanId: 'creator' | 'pro' | 'agency') => {
    setPlanId(newPlanId);
    if (isPaddleLoaded) {
      const newPriceId = getPlan(newPlanId)?.checkout[billing].paddlePriceId;
      if (newPriceId) {
        try {
          getPaddle()?.Checkout.updateItems([{ priceId: newPriceId, quantity: 1 }]);
        } catch (err) {
          console.warn('[Checkout] updateItems failed on plan switch:', err);
        }
      }
    }
  };

  const handleSelectBilling = (newBilling: BillingInterval) => {
    setBilling(newBilling);
    if (isPaddleLoaded) {
      const newPriceId = currentPlan.checkout[newBilling].paddlePriceId;
      if (newPriceId) {
        try {
          getPaddle()?.Checkout.updateItems([{ priceId: newPriceId, quantity: 1 }]);
        } catch (err) {
          console.warn('[Checkout] updateItems failed on billing switch:', err);
        }
      }
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/80 backdrop-blur-sm p-4 sm:p-6 sm:items-center"
        onClick={(e) => { if (e.target === e.currentTarget) closeCheckout(); }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="checkout-modal-title"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.97, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.97, y: 10 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-4xl bg-[#0D0D0F] border border-white/[0.08] rounded-2xl shadow-2xl overflow-hidden my-auto"
        >
          {/* Top violet accent line */}
          <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-[#7C3AED]/60 to-transparent pointer-events-none" />

          {/* ── Header ─────────────────────────────────────────────────── */}
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/[0.06] bg-[#0A0A0C]">
            <div className="flex items-center gap-2.5">
              <Wordmark className="h-[18px]" />
              {isSandbox && (
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  TEST MODE
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={closeCheckout}
              className="p-1.5 rounded-lg text-zinc-500 hover:text-white hover:bg-white/[0.07] transition-colors"
              aria-label="Close checkout"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* ── Two-column body ─────────────────────────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-[2fr_3fr] min-h-[520px]">

            {/* ── Left: Order summary ─────────────────────────────────── */}
            <div className="lg:border-r border-b lg:border-b-0 border-white/[0.06] bg-[#0A0A0C] p-6 sm:p-7 flex flex-col gap-6">

              {/* Plan tabs */}
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500 mb-2">Plan</p>
                <div className="flex gap-1 p-1 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                  {(['creator', 'pro', 'agency'] as const).map((id) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => handleSelectPlan(id)}
                      className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all capitalize ${
                        planId === id
                          ? 'bg-[#7C3AED] text-white shadow-[0_0_10px_rgba(124,58,237,0.35)]'
                          : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      {id}
                    </button>
                  ))}
                </div>
              </div>

              {/* Plan name + description */}
              <div>
                <h3 id="checkout-modal-title" className="text-xl font-bold text-white tracking-tight">
                  {currentPlan.name} Plan
                </h3>
                <p className="text-xs text-zinc-500 mt-1">{currentPlan.positioning}</p>
              </div>

              {/* Billing toggle */}
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500 mb-2">Billing</p>
                <div className="flex gap-1 p-1 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                  {(['monthly', 'annual'] as const).map((b) => (
                    <button
                      key={b}
                      type="button"
                      onClick={() => handleSelectBilling(b)}
                      className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                        billing === b
                          ? 'bg-white/10 text-white'
                          : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      <span className="capitalize">{b}</span>
                      {b === 'annual' && (
                        <span className="text-[9px] px-1 rounded bg-emerald-500/20 text-emerald-400 font-bold">
                          −17%
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price summary */}
              <div className="space-y-2 text-xs border-t border-white/[0.06] pt-4">
                <div className="flex justify-between text-zinc-400">
                  <span>{currentPlan.name} ({billing})</span>
                  <span className="line-through">{money.format(displayPrice)}</span>
                </div>
                <div className="flex justify-between text-emerald-400 font-medium">
                  <span>3-day trial discount</span>
                  <span>−100%</span>
                </div>
                <div className="flex justify-between text-white font-bold text-sm pt-2 border-t border-white/[0.06]">
                  <span>Due today</span>
                  <span className="text-emerald-400">$0.00</span>
                </div>
                <p className="text-[11px] text-zinc-600 leading-relaxed">
                  Recurring {renewalText} starts{' '}
                  <span className="text-zinc-400">{trialEndDate}</span> — cancel anytime before.
                </p>
              </div>

              {/* Key features (max 4) */}
              {limits && (
                <ul className="space-y-1.5 text-xs text-zinc-400">
                  <li className="flex items-start gap-2">
                    <Check className="w-3.5 h-3.5 text-[#7C3AED] mt-0.5 shrink-0" strokeWidth={3} />
                    <span><strong className="text-zinc-200">{limits.workspaces}</strong> {limits.workspaces === 1 ? 'Workspace' : 'Workspaces'}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-3.5 h-3.5 text-[#7C3AED] mt-0.5 shrink-0" strokeWidth={3} />
                    <span><strong className="text-zinc-200">{limits.ai_generations_per_month.toLocaleString()}</strong> AI generations/month</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-3.5 h-3.5 text-[#7C3AED] mt-0.5 shrink-0" strokeWidth={3} />
                    <span>Knowledge Vault + Caption OS</span>
                  </li>
                  {planId === 'agency' && (
                    <li className="flex items-start gap-2">
                      <Check className="w-3.5 h-3.5 text-[#7C3AED] mt-0.5 shrink-0" strokeWidth={3} />
                      <span>Multi-client isolation + team access</span>
                    </li>
                  )}
                </ul>
              )}

              {/* Security footnote */}
              <div className="mt-auto pt-2 border-t border-white/[0.05] flex items-center gap-1.5 text-[11px] text-zinc-600">
                <Lock className="w-3 h-3 shrink-0" />
                <span>Secured by Paddle · PCI-DSS Level 1</span>
              </div>
            </div>

            {/* ── Right: Payment ──────────────────────────────────────── */}
            <div className="bg-[#0D0D0F] p-6 sm:p-7 flex flex-col gap-4">

              {/* Payment header */}
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-[#7C3AED]" />
                  Payment
                </h4>
                <span className="flex items-center gap-1.5 text-[11px] text-zinc-500">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Live SSL
                </span>
              </div>

              {/* Sandbox test card */}
              {isSandbox && (
                <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-300">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-zinc-800 text-amber-400 border border-zinc-700 uppercase shrink-0">
                      Test
                    </span>
                    <code className="font-mono tracking-wider">4242 •••• 4242 4242</code>
                    <span className="text-zinc-600 hidden sm:inline">any MM/YY · any CVC</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyTestCard}
                    className="px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-[11px] font-medium transition-colors flex items-center gap-1 shrink-0"
                  >
                    {copiedCard ? (
                      <><CheckCircle2 className="w-3 h-3 text-emerald-400" /><span className="text-emerald-400">Copied</span></>
                    ) : (
                      <><Copy className="w-3 h-3 text-zinc-400" /><span>Copy</span></>
                    )}
                  </button>
                </div>
              )}

              {/* ── Payment area states ─── */}
              <div className="flex-1 flex flex-col">

                {/* Already subscribed */}
                {isAlreadyOnThisPlan ? (
                  <div className="flex-1 flex flex-col items-center justify-center gap-4 py-10 text-center">
                    <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                      <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">Already on {currentPlan.name}</p>
                      <p className="text-xs text-zinc-500 mt-1">Your subscription is active.</p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2 w-full max-w-xs">
                      <button
                        type="button"
                        onClick={() => { closeCheckout(); navigate('/dashboard/settings'); }}
                        className="flex-1 px-4 py-2 rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs font-semibold transition-colors"
                      >
                        Manage in Settings
                      </button>
                      <button
                        type="button"
                        onClick={closeCheckout}
                        className="flex-1 px-4 py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.08] text-zinc-300 text-xs font-semibold transition-colors border border-white/[0.06]"
                      >
                        Close
                      </button>
                    </div>
                  </div>

                ) : checkoutError ? (
                  /* Error state */
                  <div className="flex-1 flex flex-col items-center justify-center gap-4 py-10 text-center">
                    <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                      <AlertCircle className="w-6 h-6 text-red-400" />
                    </div>
                    <div className="max-w-sm">
                      <p className="text-sm font-semibold text-white mb-1">Payment form unavailable</p>
                      <p className="text-xs text-zinc-500 leading-relaxed">{checkoutError}</p>
                    </div>
                    <button
                      type="button"
                      onClick={handleRetry}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-medium text-white transition-colors"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      Retry
                    </button>
                  </div>

                ) : isSuccess ? (
                  /* Success state */
                  <div className="flex-1 flex flex-col items-center justify-center gap-3 py-10 text-center">
                    <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                      <CheckCircle2 className="w-7 h-7 text-emerald-400" />
                    </div>
                    <p className="text-base font-bold text-white">Payment confirmed</p>
                    <p className="text-xs text-zinc-500">Activating your trial…</p>
                    <Loader2 className="w-4 h-4 text-[#7C3AED] animate-spin" />
                  </div>

                ) : (
                  /* Paddle iframe mount */
                  <div className="relative flex-1">
                    {/* Loading overlay — shown until checkout.loaded fires or timeout hits */}
                    {(isLoadingPaddle || !isPaddleLoaded) && (
                      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-[#0D0D0F] rounded-xl">
                        <Loader2 className="w-5 h-5 text-[#7C3AED] animate-spin" />
                        <p className="text-xs text-zinc-500">Loading payment form…</p>
                      </div>
                    )}
                    {/* Paddle injects its iframe into this element */}
                    <div
                      className="paddle-checkout-frame w-full"
                      style={{ minHeight: '460px' }}
                    />
                  </div>
                )}
              </div>

              {/* Bottom micro-copy */}
              {!isAlreadyOnThisPlan && !checkoutError && !isSuccess && (
                <p className="text-[11px] text-zinc-600 text-center">
                  Cancel any time before {trialEndDate} · No charge today
                </p>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

export default PaddleCheckoutModal;
