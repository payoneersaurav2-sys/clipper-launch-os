import { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Check, X } from 'lucide-react';
import { BillingInterval, annualSavings, pricingPlans } from '@/lib/pricing';
import { planEntitlements, PlanTier } from '@/lib/entitlements';
import { useAuthStore } from '@/stores/useAuthStore';
import { useEntitlements } from '@/hooks/useEntitlements';
import { useCheckout } from '@/hooks/useCheckout';
import { FAQSection, pricingFaqs } from '@/components/FAQSection';
import { useNavigate } from 'react-router-dom';

const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

// Extended plan definition for the UI
const uiPlans = [
  {
    id: 'free' as PlanTier,
    name: 'Free',
    positioning: 'Explore Creator OS',
    monthlyPrice: 0,
    annualPrice: 0,
    cta: 'Start Free',
    features: [
      { group: 'WORKSPACE & KNOWLEDGE', items: ['1 Workspace', 'No Knowledge Vault'] },
      { group: 'CAMPAIGNS & CONTENT', items: ['10 Active campaigns', '5-Item content batches'] },
      { group: 'AI & CREATION', items: ['Core Idea & Hook Tools', 'No batch AI generation'] },
    ],
  },
  ...pricingPlans.map(p => ({ ...p, id: p.id as PlanTier }))
];

const COMPARISON_CATEGORIES = [
  {
    name: 'CORE',
    features: [
      {
        label: 'Workspaces',
        getValue: (tier: PlanTier) => planEntitlements[tier].limits.workspaces,
      },
      {
        label: 'AI Generations / mo',
        getValue: (tier: PlanTier) => planEntitlements[tier].limits.ai_generations_per_month === 0 ? '0' : planEntitlements[tier].limits.ai_generations_per_month.toLocaleString(),
      }
    ]
  },
  {
    name: 'CREATE',
    features: [
      {
        label: 'Idea Studio & Hook Engine',
        getValue: (tier: PlanTier) => planEntitlements[tier].capabilities.core_ai,
      },
      {
        label: 'Caption OS',
        getValue: (tier: PlanTier) => planEntitlements[tier].capabilities.core_ai,
      },
      {
        label: 'Batch AI Generation',
        getValue: (tier: PlanTier) => planEntitlements[tier].capabilities.batch_generation,
      },
    ]
  },
  {
    name: 'KNOWLEDGE & AI',
    features: [
      {
        label: 'Knowledge Vault Items',
        getValue: (tier: PlanTier) => {
          const limit = planEntitlements[tier].limits.knowledge_items_limit;
          return limit < 0 ? 'Unlimited' : (limit === 0 ? '0' : limit.toString());
        },
      },
      {
        label: 'Prompt Library Items',
        getValue: (tier: PlanTier) => {
          const limit = planEntitlements[tier].limits.prompt_limit;
          return limit < 0 ? 'Unlimited' : (limit === 0 ? '0' : limit.toString());
        },
      },
      {
        label: 'Brand Profiles & Context',
        getValue: (tier: PlanTier) => tier === 'agency',
      }
    ]
  },
  {
    name: 'OPERATIONS',
    features: [
      {
        label: 'Active Campaigns',
        getValue: (tier: PlanTier) => planEntitlements[tier].limits.active_campaigns.toLocaleString(),
      },
      {
        label: 'Content Batch Size',
        getValue: (tier: PlanTier) => planEntitlements[tier].limits.content_batch_size.toLocaleString(),
      },
      {
        label: 'Campaign & Clip Workflows',
        getValue: (tier: PlanTier) => planEntitlements[tier].capabilities.campaigns && planEntitlements[tier].capabilities.clip_pipeline,
      }
    ]
  },
  {
    name: 'AGENCY',
    features: [
      {
        label: 'Multi-client environment isolation',
        getValue: (tier: PlanTier) => tier === 'agency',
      },
      {
        label: 'Team roles & access permissions',
        getValue: (tier: PlanTier) => tier === 'agency',
      },
    ]
  }
];

export default function PricingPage() {
  const [billing, setBilling] = useState<BillingInterval>('annual');
  const reduceMotion = useReducedMotion();
  const { subscriptionTier } = useAuthStore();
  const { data: entitlements } = useEntitlements();
  const { beginCheckout, user } = useCheckout();
  const navigate = useNavigate();

  const currentTier = entitlements?.tier ?? subscriptionTier ?? 'free';
  
  useEffect(() => {
    document.title = 'Pricing | Creator OS';
  }, []);

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
      beginCheckout(checkoutObj[billing].url);
    }
  };

  return (
    <div className="flex w-full flex-col font-sans">
      <section id="pricing-hero" className="relative flex flex-col items-center justify-center pt-24 pb-12 px-4 sm:pt-32 text-center">
        <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl dark:text-[#FAFAFA]">
          Simple, transparent pricing
        </h1>
        <p className="mt-4 max-w-2xl text-[16px] leading-relaxed text-muted-foreground dark:text-[#A1A1AA] sm:text-[18px]">
          Start for free, scale to your needs.
        </p>
      </section>

      <section id="pricing-cards" aria-label="Pricing Plans" className="relative px-4 pb-20 sm:px-6">
        <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
          <div className="relative inline-flex h-11 items-center rounded-full bg-secondary p-1 dark:bg-white/[0.04] shadow-inner">
            {(['monthly', 'annual'] as const).map((option) => {
              const selected = billing === option;
              return (
                <button
                  key={option}
                  onClick={() => setBilling(option)}
                  className={`relative flex h-full w-32 items-center justify-center rounded-[10px] text-[14px] font-semibold tracking-wide transition-all ${selected ? 'text-white' : 'text-muted-foreground hover:text-foreground dark:text-[#A1A1AA] dark:hover:text-[#FAFAFA]'}`}
                  aria-pressed={selected}
                >
                  {selected && (
                    <motion.span
                      layoutId="billing-selection"
                      transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                      className="absolute inset-0 rounded-full bg-primary shadow-[0_0_15px_rgba(124,58,237,0.4)]"
                    />
                  )}
                  <span className="relative capitalize">{option}</span>
                </button>
              );
            })}
          </div>
          <span className={`text-[12px] font-medium tracking-wide transition-colors ${billing === 'annual' ? 'text-primary' : 'text-muted-foreground dark:text-[#71717A]'}`}>ANNUAL SAVES 17%</span>
        </div>

        <div className="mx-auto mt-12 grid max-w-7xl grid-cols-1 gap-4 sm:mt-16 md:grid-cols-2 lg:grid-cols-4 lg:items-stretch lg:gap-5">
          {uiPlans.map((plan, index) => {
            const isFree = plan.id === 'free';
            const savings = !isFree ? annualSavings(plan as any) : { amount: 0, percent: 0 };
            const isAnnual = billing === 'annual';
            const displayedPrice = isFree ? 0 : (isAnnual ? plan.annualPrice : plan.monthlyPrice);
            const isRecommended = (plan as any).recommended;
            const isAgency = plan.id === 'agency';
            
            return (
              <motion.article 
                key={plan.id} 
                initial={reduceMotion ? false : { opacity: 0, y: 18 }} 
                animate={{ opacity: 1, y: 0 }} 
                transition={{ duration: 0.4, delay: reduceMotion ? 0 : 0.08 * index }} 
                className={`relative flex min-h-[500px] flex-col overflow-hidden rounded-[22px] border p-6 transition-shadow sm:p-7 ${isAgency ? 'border-primary/40 bg-[linear-gradient(145deg,rgba(124,58,237,0.05),#ffffff_42%,#ffffff)] shadow-[0_12px_45px_rgba(124,58,237,0.2)] dark:bg-[linear-gradient(145deg,rgba(124,58,237,0.12),#111111_36%,#111111)] dark:shadow-[0_12px_45px_rgba(124,58,237,0.25)] dark:border-primary/50' : isRecommended ? 'border-border bg-[linear-gradient(145deg,rgba(24,24,27,0.02),#ffffff_42%,#ffffff)] shadow-[0_12px_30px_rgba(24,24,27,0.06)] dark:bg-[linear-gradient(145deg,#161616_36%,#111111)] dark:shadow-[0_12px_30px_rgba(0,0,0,0.15)] dark:border-white/[0.14]' : 'border-border bg-card shadow-[0_12px_30px_rgba(24,24,27,0.04)] dark:border-white/[0.06] dark:bg-[#0A0A0A] dark:shadow-[0_12px_30px_rgba(0,0,0,0.1)]'}`}
              >
                {isRecommended && <><div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary to-transparent" /><span className="absolute right-6 top-6 inline-flex rounded-full border border-primary/40 bg-primary/15 px-2.5 py-1 text-[11px] font-semibold tracking-[0.12em] text-[#C4B5FD]">MOST POPULAR</span></>}
                <div className="pt-1">
                  <h2 className="text-[22px] font-semibold tracking-tight dark:text-[#FAFAFA]">{plan.name}</h2>
                  <p className="mt-2 min-h-[48px] text-[15px] leading-relaxed tracking-tight text-muted-foreground dark:text-[#A1A1AA]">{plan.positioning}</p>
                </div>
                <div className="mt-8 border-y border-border py-5 dark:border-white/[0.07]">
                  <div className="flex items-end gap-2">
                    <span className="text-[45px] font-semibold leading-none tracking-[-0.06em] dark:text-[#FAFAFA]">{isFree ? '$0' : money.format(displayedPrice)}</span>
                    {!isFree && <span className="mb-1 text-[14px] text-muted-foreground dark:text-[#A1A1AA]">/{isAnnual ? 'year' : 'month'}</span>}
                  </div>
                  <div className="mt-3 min-h-[40px] text-[12px] leading-5 text-muted-foreground">
                    {isFree ? (
                      <span>Free forever. No credit card required.</span>
                    ) : isAnnual ? (
                      <><span>Billed annually.</span><br /><span className="font-medium text-primary">Save {money.format(savings.amount)}/year</span></>
                    ) : (
                      <><span>Billed monthly.</span><br /><span>Pay annually to save {money.format(savings.amount)}/year.</span></>
                    )}
                  </div>
                </div>
                <div className="mt-6 flex flex-col gap-6">
                  {plan.features.map((group) => (
                    <div key={group.group}>
                      <h4 className="mb-3 text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground dark:text-[#71717A]">{group.group}</h4>
                      <ul className="space-y-3" aria-label={`${group.group} capabilities`}>
                        {group.items.map((feature) => (
                          <li key={feature} className="flex items-start gap-3 text-[13px] font-medium leading-tight text-foreground/90 dark:text-[#E4E4E7]">
                            <Check className="mt-[2px] h-[14px] w-[14px] shrink-0 text-primary" strokeWidth={3} aria-hidden="true" />
                            <span className="flex-1">{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
                <button 
                  type="button" 
                  onClick={() => handleCta(plan.id, (plan as any).checkout)} 
                  className={`mt-auto inline-flex h-12 w-full items-center justify-center rounded-[12px] px-5 text-[14px] font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${isAgency ? 'bg-primary text-white shadow-[0_0_22px_rgba(124,58,237,0.4)] hover:bg-primary/90 hover:shadow-[0_0_30px_rgba(124,58,237,0.6)]' : isRecommended ? 'bg-foreground text-background hover:bg-foreground/90 dark:bg-white dark:text-black dark:hover:bg-white/90' : 'border border-border bg-secondary text-foreground hover:bg-primary/10 dark:border-white/[0.08] dark:bg-white/[0.02] dark:text-white dark:hover:bg-primary/15'}`}
                >
                  {!user ? 'Sign in to start' : (currentTier === plan.id ? 'Current Plan' : plan.cta)}
                </button>
              </motion.article>
            );
          })}
        </div>
      </section>

      {/* Plan Progression Section */}
      <section className="py-20 px-4 bg-background dark:bg-[#080808] border-t border-border dark:border-white/[0.06]">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold tracking-tight mb-4 dark:text-[#FAFAFA]">Start free. Scale when your workflow grows.</h2>
          <p className="text-muted-foreground dark:text-[#A1A1AA] mb-12">Upgrade only when you need more capacity or advanced tools.</p>
          
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-6 text-left relative">
            <div className="hidden sm:block absolute top-[28px] left-[10%] right-[10%] h-[2px] bg-border dark:bg-white/[0.06]" />
            
            <div className="relative z-10 flex flex-col items-center sm:items-start">
              <div className="w-14 h-14 rounded-full bg-[#111111] border border-white/[0.1] flex items-center justify-center text-xl font-bold mb-4 shadow-lg">1</div>
              <h3 className="font-semibold text-lg dark:text-[#FAFAFA]">FREE</h3>
              <p className="text-sm text-muted-foreground dark:text-[#A1A1AA] mt-2 text-center sm:text-left">Explore Creator OS with basic idea generation.</p>
            </div>
            
            <div className="relative z-10 flex flex-col items-center sm:items-start">
              <div className="w-14 h-14 rounded-full bg-[#111111] border border-white/[0.1] flex items-center justify-center text-xl font-bold mb-4 shadow-lg">2</div>
              <h3 className="font-semibold text-lg dark:text-[#FAFAFA]">CREATOR</h3>
              <p className="text-sm text-muted-foreground dark:text-[#A1A1AA] mt-2 text-center sm:text-left">Build consistently with AI batching and Knowledge Vault.</p>
            </div>
            
            <div className="relative z-10 flex flex-col items-center sm:items-start">
              <div className="w-14 h-14 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center text-xl font-bold text-primary mb-4 shadow-[0_0_15px_rgba(124,58,237,0.3)]">3</div>
              <h3 className="font-semibold text-lg dark:text-[#FAFAFA]">PRO</h3>
              <p className="text-sm text-muted-foreground dark:text-[#A1A1AA] mt-2 text-center sm:text-left">Run your full content operation with high AI capacity.</p>
            </div>

            <div className="relative z-10 flex flex-col items-center sm:items-start">
              <div className="w-14 h-14 rounded-full bg-[#111111] border border-white/[0.1] flex items-center justify-center text-xl font-bold mb-4 shadow-lg">4</div>
              <h3 className="font-semibold text-lg dark:text-[#FAFAFA]">AGENCY</h3>
              <p className="text-sm text-muted-foreground dark:text-[#A1A1AA] mt-2 text-center sm:text-left">Manage multiple brands in isolated client environments.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Compare Plans Table */}
      <section className="py-20 px-4 bg-[#0A0A0A] border-t border-border dark:border-white/[0.06] overflow-hidden">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-white mb-4">Compare plans</h2>
            <p className="text-[#A1A1AA]">A detailed look at capabilities across all tiers.</p>
          </div>

          <div className="w-full overflow-x-auto pb-6">
            <div className="min-w-[700px] text-left">
              <div className="grid grid-cols-5 gap-4 py-4 border-b border-white/[0.1] sticky top-0 bg-[#0A0A0A] z-10">
                <div className="col-span-1 font-semibold text-[#FAFAFA] text-sm uppercase tracking-wider">Features</div>
                <div className="text-center font-bold text-[#FAFAFA] tracking-wide">FREE</div>
                <div className="text-center font-bold text-[#FAFAFA] tracking-wide">CREATOR</div>
                <div className="text-center font-bold text-primary tracking-wide">PRO</div>
                <div className="text-center font-bold text-[#FAFAFA] tracking-wide">AGENCY</div>
              </div>
              
              {COMPARISON_CATEGORIES.map(category => (
                <div key={category.name} className="mt-8 mb-4">
                  <div className="text-[11px] font-bold text-[#71717A] uppercase tracking-[0.15em] mb-3 px-2">
                    {category.name}
                  </div>
                  <div className="flex flex-col gap-1">
                    {category.features.map(feature => (
                      <div key={feature.label} className="grid grid-cols-5 gap-4 py-3 px-2 rounded-lg hover:bg-white/[0.02] transition-colors items-center">
                        <div className="col-span-1 text-sm text-[#E4E4E7] pr-4">{feature.label}</div>
                        {(['free', 'creator', 'pro', 'agency'] as PlanTier[]).map(tier => {
                          const val = feature.getValue(tier);
                          return (
                            <div key={tier} className="text-center flex justify-center items-center">
                              {typeof val === 'boolean' ? (
                                val ? <Check className="w-5 h-5 text-primary" /> : <X className="w-4 h-4 text-[#3F3F46]" />
                              ) : (
                                <span className={`text-sm font-medium ${tier === 'pro' ? 'text-white' : 'text-[#A1A1AA]'}`}>
                                  {val}
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Pricing FAQ */}
      <FAQSection 
        title="Questions before you start?" 
        subtitle="Everything you need to know about access, billing, cancellation, and support." 
        items={[
          { question: 'What does the Free plan include?', answer: 'The Free plan lets you explore Creator OS. You get 1 workspace, 10 active campaigns, and access to the core Idea Studio & Hook Engine. AI generation is heavily metered to let you test the tools.' },
          { question: 'When should I upgrade from Free?', answer: 'Upgrade to Creator when you need AI batch generation, access to the Knowledge Vault for brand-specific context, or the Prompt Library to save your best workflows.' },
          { question: 'What is the difference between Creator and Pro?', answer: 'Pro is designed for full-time content operations. It increases your workspaces from 3 to 10, quadruples your AI generation capacity, and expands your Knowledge Vault capacity.' },
          { question: 'What is the Agency plan designed for?', answer: 'Agency is built for teams managing multiple brands. It unlocks multi-client environment isolation, Brand Profiles, team roles, and strict data separation so AI context never bleeds across your clients.' },
          ...pricingFaqs.filter(faq => !faq.question.includes('What is the difference') && !faq.question.includes('What does the Free plan'))
        ]} 
      />
    </div>
  );
}
