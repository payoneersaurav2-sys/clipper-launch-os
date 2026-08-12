import { useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Check, Sparkles } from 'lucide-react';
import { BillingInterval, annualSavings, pricingPlans, unresolvedCheckoutMapping, validatePricingConfiguration } from '@/lib/pricing';
import { useAuthStore } from '@/stores/useAuthStore';
import { buildWhopOAuthUrl } from '@/lib/whopPkce';

const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

export default function PricingPage() {
  const [billing, setBilling] = useState<BillingInterval>('monthly');
  const reduceMotion = useReducedMotion();
  const navigate = useNavigate();
  const { user, whopId } = useAuthStore();
  const { subscriptionTier } = useAuthStore();

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

  useEffect(() => {
    if (!import.meta.env.DEV) return;
    validatePricingConfiguration().forEach((warning) => console.warn(`[CreatorOS pricing] ${warning}`));
    console.warn(`[CreatorOS pricing] Unresolved checkout mapping: source #${unresolvedCheckoutMapping.sourceIndex} (${unresolvedCheckoutMapping.reason})`);
  }, []);

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#080808] text-[#FAFAFA]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_32%_at_50%_8%,rgba(124,58,237,0.15),transparent_72%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_70%_62%_at_50%_20%,#000_35%,transparent_100%)]" />

      <section className="relative mx-auto max-w-7xl px-4 pb-20 pt-16 sm:px-6 sm:pt-24 lg:px-8 lg:pb-28">
        <motion.div initial={reduceMotion ? false : { opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }} className="mx-auto max-w-3xl text-center">
          <div className="mb-6 inline-flex items-center rounded-full border border-white/[0.07] bg-[#111111]/80 px-3 py-1 text-[12px] font-medium tracking-wide text-[#A1A1AA] backdrop-blur">
            <Sparkles className="mr-2 h-3.5 w-3.5 text-primary" aria-hidden="true" /> PRICING
          </div>
          <p className="mb-4 text-[11px] font-semibold tracking-[0.22em] text-primary sm:text-[12px]">CHOOSE YOUR OPERATING SYSTEM</p>
          <h1 className="text-[38px] font-semibold leading-[1.02] tracking-[-0.055em] sm:text-[56px] lg:text-[72px]">Build your content operation.</h1>
          <p className="mx-auto mt-5 max-w-xl text-[16px] leading-relaxed tracking-tight text-[#A1A1AA] sm:text-[18px]">Start simple. Scale when your workflow demands it.</p>
        </motion.div>

        <div className="mt-10 flex flex-col items-center gap-3 sm:mt-12">
          <div role="radiogroup" aria-label="Billing period" className="inline-grid grid-cols-2 rounded-[14px] border border-white/[0.08] bg-[#111111] p-1 shadow-[0_10px_30px_rgba(0,0,0,0.2)]">
            {(['monthly', 'annual'] as const).map((option) => {
              const selected = billing === option;
              return <button key={option} type="button" role="radio" aria-checked={selected} onClick={() => setBilling(option)} onKeyDown={(event) => {
                if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
                  event.preventDefault();
                  setBilling(option === 'monthly' ? 'annual' : 'monthly');
                }
              }} className={`relative h-10 rounded-[10px] px-4 text-[13px] font-semibold uppercase tracking-[0.1em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-[#080808] sm:px-6 ${selected ? 'text-white' : 'text-[#71717A] hover:text-[#A1A1AA]'}`}>
                {selected && <motion.span layoutId="billing-selection" transition={{ type: 'spring', stiffness: 420, damping: 32 }} className="absolute inset-0 rounded-[10px] bg-primary shadow-[0_0_18px_rgba(124,58,237,0.35)]" />}
                <span className="relative">{option}</span>
              </button>;
            })}
          </div>
          <span className={`text-[12px] font-medium tracking-wide transition-colors ${billing === 'annual' ? 'text-primary' : 'text-[#71717A]'}`}>ANNUAL SAVES 17%</span>
        </div>

        <div className="mx-auto mt-12 grid max-w-6xl grid-cols-1 gap-4 sm:mt-16 md:grid-cols-2 lg:grid-cols-3 lg:items-stretch lg:gap-5">
          {(() => {
            // Determine which plans to show based on subscriptionTier stored in DB
            const tierOrder: Record<string, number> = { free: 0, creator: 1, pro: 2, agency: 3 };
            const userTier = (subscriptionTier ?? (user ? 'free' : 'free')) as keyof typeof tierOrder;
            const visiblePlans = pricingPlans.filter((plan) => tierOrder[plan.id] > (tierOrder[userTier] ?? 0));
            if (userTier === 'agency') {
              return <div className="col-span-full rounded-lg border border-white/[0.06] bg-[#0b0b0b] p-6 text-center text-[#A1A1AA]">You are on the highest plan — no upgrades available.</div>;
            }
            const toRender = (user ? visiblePlans : pricingPlans);
            return toRender.map((plan, index) => {
            const savings = annualSavings(plan);
            const checkoutUrl = plan.checkout[billing].url;
            const isAnnual = billing === 'annual';
            const displayedPrice = isAnnual ? plan.annualPrice : plan.monthlyPrice;
            return <motion.article key={plan.id} initial={reduceMotion ? false : { opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: reduceMotion ? 0 : 0.08 * index }} whileHover={reduceMotion ? undefined : { y: -5 }} className={`relative flex min-h-[500px] flex-col overflow-hidden rounded-[22px] border p-6 transition-shadow sm:p-7 ${plan.recommended ? 'border-primary/70 bg-[linear-gradient(145deg,rgba(124,58,237,0.16),#111111_36%,#111111)] shadow-[0_12px_45px_rgba(124,58,237,0.12)]' : 'border-white/[0.08] bg-[#111111] shadow-[0_16px_42px_rgba(0,0,0,0.15)] hover:border-white/[0.14]'}`}>
              {plan.recommended && <><div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary to-transparent" /><span className="absolute right-6 top-6 inline-flex rounded-full border border-primary/40 bg-primary/15 px-2.5 py-1 text-[11px] font-semibold tracking-[0.12em] text-[#C4B5FD] sm:right-7 sm:top-7">MOST POPULAR</span></>}
              <div className="pt-1">
                <h2 className="text-[22px] font-semibold tracking-tight">{plan.name}</h2>
                <p className="mt-2 min-h-[48px] max-w-[260px] text-[15px] leading-relaxed tracking-tight text-[#A1A1AA]">{plan.positioning}</p>
              </div>
              <div className="mt-8 border-y border-white/[0.07] py-5">
                <div className="flex items-end gap-2"><AnimatePresence mode="wait" initial={false}><motion.span key={`${plan.id}-${billing}`} initial={reduceMotion ? false : { opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={reduceMotion ? undefined : { opacity: 0, y: -6 }} transition={{ duration: 0.18 }} className="text-[45px] font-semibold leading-none tracking-[-0.06em]">{money.format(displayedPrice)}</motion.span></AnimatePresence><span className="mb-1 text-[14px] text-[#A1A1AA]">/{isAnnual ? 'year' : 'month'}</span></div>
                <div className="mt-3 min-h-[40px] text-[12px] leading-5 text-[#71717A]">{isAnnual ? <><span>Billed annually.</span><br /><span className="font-medium text-primary">Save {money.format(savings.amount)}/year &middot; {savings.percent}%</span></> : <><span>Billed monthly.</span><br /><span className="text-[#71717A]">Pay annually to save {money.format(savings.amount)}/year.</span></>}</div>
              </div>
              <div className="mt-6">
              <ul className="space-y-4" aria-label={`${plan.name} capabilities`}>
                {plan.features.map((feature) => <li key={feature} className="flex gap-3 text-[14px] leading-5 text-[#D4D4D8]"><Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" strokeWidth={2.4} aria-hidden="true" />{feature}</li>)}
              </ul>
              </div>
              <button type="button" onClick={() => beginCheckout(checkoutUrl)} aria-label={`${plan.cta}: ${plan.name} ${billing} plan`} className={`mt-auto inline-flex h-12 w-full items-center justify-center rounded-[12px] px-5 text-[14px] font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-[#111111] ${plan.recommended ? 'bg-primary text-white shadow-[0_0_22px_rgba(124,58,237,0.3)] hover:bg-primary/90 hover:shadow-[0_0_30px_rgba(124,58,237,0.48)]' : 'border border-white/[0.1] bg-white/[0.04] text-white hover:border-primary/50 hover:bg-primary/15'}`}>{!user ? 'Sign in to start' : !whopId ? 'Connect Whop to start' : plan.cta}</button>
            </motion.article>;
          })}
        </div>
        <p className="mx-auto mt-10 max-w-2xl text-center text-[12px] leading-relaxed text-[#71717A]">Secure checkout is handled by Whop. Annual billing is clearly shown before checkout.</p>
      </section>
    </div>
  );
}
