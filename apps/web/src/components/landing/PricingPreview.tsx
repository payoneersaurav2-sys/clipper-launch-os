import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, Check } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { pricingPlans } from '@/lib/pricing';
import { PlanTier } from '@/lib/entitlements';
import { useAuthStore } from '@/stores/useAuthStore';
import { useCheckout } from '@/hooks/useCheckout';

const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

const previewPlans = [
  {
    id: 'free' as PlanTier,
    name: 'Free',
    positioning: 'Explore Creator OS',
    monthlyPrice: 0,
    cta: 'Start Free',
    benefits: [
      '1 Workspace',
      '10 Active campaigns',
      'Core Idea & Hook Tools'
    ]
  },
  {
    id: 'creator' as PlanTier,
    name: 'Creator',
    positioning: 'Build consistently',
    monthlyPrice: pricingPlans.find(p => p.id === 'creator')?.monthlyPrice || 29,
    cta: 'Upgrade to Creator',
    checkout: pricingPlans.find(p => p.id === 'creator')?.checkout,
    benefits: [
      '3 Workspaces',
      '250 AI Generations / mo',
      'Batch generation unlocked',
      'Knowledge Vault access'
    ]
  },
  {
    id: 'pro' as PlanTier,
    name: 'Pro',
    positioning: 'Run your content operation',
    monthlyPrice: pricingPlans.find(p => p.id === 'pro')?.monthlyPrice || 49,
    cta: 'Upgrade to Pro',
    recommended: true,
    checkout: pricingPlans.find(p => p.id === 'pro')?.checkout,
    benefits: [
      '10 Workspaces',
      '1000 AI Generations / mo',
      'Advanced Knowledge Vault',
      'Maximum batch limits'
    ]
  },
  {
    id: 'agency' as PlanTier,
    name: 'Agency',
    positioning: 'Manage multiple brands and teams',
    monthlyPrice: pricingPlans.find(p => p.id === 'agency')?.monthlyPrice || 199,
    cta: 'Upgrade to Agency',
    checkout: pricingPlans.find(p => p.id === 'agency')?.checkout,
    benefits: [
      'Unlimited Knowledge / Prompts',
      'Multi-client environment isolation',
      'Client-scoped AI context',
      'Team roles & access permissions'
    ]
  }
];

export function PricingPreview() {
  const reduceMotion = useReducedMotion();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { beginCheckout } = useCheckout();

  const handleCta = (planId: PlanTier, checkoutObj?: any) => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (planId === 'free') {
      navigate('/dashboard');
      return;
    }
    if (checkoutObj) {
      // Default to monthly for the preview
      beginCheckout(checkoutObj['monthly'].url);
    }
  };

  return (
    <section className="py-16 sm:py-20 lg:py-24 px-4 bg-[#0A0A0A] relative z-10 border-t border-white/[0.05]">
      <div className="max-w-[1400px] mx-auto">
        <div className="text-center mb-12 sm:mb-16">
          <h2 className="text-[28px] sm:text-[36px] md:text-[44px] font-semibold tracking-tight text-white mb-4 leading-tight">
            Start free. Scale when your workflow grows.
          </h2>
          <p className="text-[16px] sm:text-[18px] text-[#A1A1AA] max-w-2xl mx-auto">
            Choose the plan that fits how you create, publish, and operate.
          </p>
        </div>

        {/* Horizontal scroll container for mobile/tablet to prevent overflow */}
        <div className="w-full overflow-x-auto pb-8 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-hide">
          <div className="flex sm:grid sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-5 min-w-[max-content] sm:min-w-0">
            {previewPlans.map((plan, i) => {
              const isAgency = plan.id === 'agency';
              const isRecommended = plan.recommended;
              
              return (
                <motion.div
                  key={plan.id}
                  initial={reduceMotion ? false : { opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ duration: 0.4, delay: i * 0.1 }}
                  className={`w-[280px] sm:w-auto relative flex flex-col rounded-[20px] border p-6 sm:p-7 
                    ${isAgency 
                      ? 'border-primary/40 bg-[linear-gradient(145deg,rgba(124,58,237,0.1),#111111_40%,#111111)] shadow-[0_8px_30px_rgba(124,58,237,0.15)]' 
                      : isRecommended 
                        ? 'border-white/[0.15] bg-[#161616] shadow-[0_8px_30px_rgba(0,0,0,0.2)]' 
                        : 'border-white/[0.06] bg-[#0F0F0F] hover:bg-[#121212] transition-colors'
                    }`}
                >
                  {isRecommended && (
                    <div className="absolute top-0 inset-x-0 flex justify-center -translate-y-1/2">
                      <span className="inline-flex items-center rounded-full border border-primary/30 bg-[#161616] px-3 py-1 text-[10px] font-bold tracking-[0.15em] text-[#C4B5FD] uppercase shadow-sm">
                        Most Popular
                      </span>
                    </div>
                  )}

                  <div className="mb-6">
                    <h3 className="text-xl font-semibold text-white mb-2">{plan.name}</h3>
                    <p className="text-sm text-[#A1A1AA] h-10">{plan.positioning}</p>
                  </div>

                  <div className="mb-8 flex items-baseline gap-1">
                    <span className="text-[38px] font-semibold tracking-tight text-white leading-none">
                      {plan.monthlyPrice === 0 ? '$0' : money.format(plan.monthlyPrice)}
                    </span>
                    {plan.monthlyPrice > 0 && <span className="text-sm text-[#A1A1AA] font-medium">/mo</span>}
                  </div>

                  <ul className="space-y-4 mb-8 flex-1">
                    {plan.benefits.map(benefit => (
                      <li key={benefit} className="flex items-start gap-3">
                        <Check className={`w-[18px] h-[18px] shrink-0 mt-0.5 ${isAgency ? 'text-primary' : 'text-white/70'}`} />
                        <span className="text-[13.5px] leading-snug text-[#E4E4E7]">{benefit}</span>
                      </li>
                    ))}
                  </ul>

                  <Button 
                    onClick={() => handleCta(plan.id, plan.checkout)}
                    variant={isAgency ? 'default' : isRecommended ? 'outline' : 'secondary'}
                    className={`w-full h-11 rounded-[10px] text-[14px] font-medium transition-all ${
                      isAgency 
                        ? 'bg-primary hover:bg-primary/90 text-white shadow-[0_0_20px_rgba(124,58,237,0.3)] hover:shadow-[0_0_25px_rgba(124,58,237,0.4)] border-none' 
                        : isRecommended
                          ? 'bg-white text-black hover:bg-white/90 border-transparent'
                          : 'bg-white/5 border border-white/10 hover:bg-white/10 text-white'
                    }`}
                  >
                    {!user ? 'Sign in to start' : plan.cta}
                  </Button>
                </motion.div>
              );
            })}
          </div>
        </div>

        <div className="mt-8 text-center">
          <Link to="/pricing" className="inline-flex items-center gap-2 text-[14.5px] font-medium text-[#A1A1AA] hover:text-white transition-colors group">
            Compare all plans 
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>
    </section>
  );
}
