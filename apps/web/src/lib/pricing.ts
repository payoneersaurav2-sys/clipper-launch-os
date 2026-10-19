export type BillingInterval = 'monthly' | 'annual';

export type CheckoutSlot = {
  billing: BillingInterval;
  /**
   * Paddle price ID (e.g. "pri_01abc...").
   * Read from VITE_PADDLE_PRICE_* env vars at build time.
   */
  paddlePriceId?: string;
};

export type PricingPlan = {
  id: 'creator' | 'pro' | 'agency';
  name: string;
  positioning: string;
  monthlyPrice: number;
  annualPrice: number;
  cta: string;
  features: { group: string; items: string[] }[];
  recommended?: boolean;
  checkout: Record<BillingInterval, CheckoutSlot>;
};

const creatorFeatures = [
  { group: 'WORKSPACE & KNOWLEDGE', items: ['3 Workspaces', 'Knowledge Vault'] },
  { group: 'CAMPAIGNS & CONTENT', items: ['50 Active campaigns', '30-Item content batches'] },
  { group: 'AI & CREATION', items: ['Idea Studio & Hook Engine', 'Platform-ready Caption OS', 'High AI workflow capacity'] },
];

const proFeatures = [
  { group: 'WORKSPACE & KNOWLEDGE', items: ['10 Workspaces', 'Advanced Knowledge Vault'] },
  { group: 'CAMPAIGNS & CONTENT', items: ['250 Active campaigns', '50-Item content batches'] },
  { group: 'AI & CREATION', items: ['Idea Studio & Hook Engine', 'Platform-ready Caption OS', 'Highest AI workflow capacity'] },
];

const agencyFeatures = [
  { group: 'AGENCY HQ', items: ['Multi-client environment isolation', 'Team roles & client access permissions'] },
  { group: 'CLIENT OPERATIONS', items: ['10 Workspaces', '250 Active campaigns', 'Client-scoped Knowledge & AI context'] },
  { group: 'AI & CREATION', items: ['Idea Studio & Hook Engine', 'Platform-ready Caption OS', 'Highest AI workflow capacity'] },
];

export const pricingPlans: PricingPlan[] = [
  {
    id: 'creator',
    name: 'Creator',
    positioning: 'Build your content engine.',
    monthlyPrice: 29,
    annualPrice: 290,
    cta: 'Start Creating',
    features: creatorFeatures,
    checkout: {
      monthly: { billing: 'monthly', paddlePriceId: import.meta.env.VITE_PADDLE_PRICE_CREATOR_MONTHLY as string | undefined },
      annual:  { billing: 'annual',  paddlePriceId: import.meta.env.VITE_PADDLE_PRICE_CREATOR_ANNUAL  as string | undefined },
    },
  },
  {
    id: 'pro',
    name: 'Pro',
    positioning: 'Run your complete creator workflow.',
    monthlyPrice: 49,
    annualPrice: 499,
    cta: 'Go Pro',
    recommended: true,
    features: proFeatures,
    checkout: {
      monthly: { billing: 'monthly', paddlePriceId: import.meta.env.VITE_PADDLE_PRICE_PRO_MONTHLY as string | undefined },
      annual:  { billing: 'annual',  paddlePriceId: import.meta.env.VITE_PADDLE_PRICE_PRO_ANNUAL  as string | undefined },
    },
  },
  {
    id: 'agency',
    name: 'Agency',
    positioning: 'For agencies managing multiple brands, clients, and content operations.',
    monthlyPrice: 199,
    annualPrice: 1990,
    cta: 'Start With Agency',
    features: agencyFeatures,
    checkout: {
      monthly: { billing: 'monthly', paddlePriceId: import.meta.env.VITE_PADDLE_PRICE_AGENCY_MONTHLY as string | undefined },
      annual:  { billing: 'annual',  paddlePriceId: import.meta.env.VITE_PADDLE_PRICE_AGENCY_ANNUAL  as string | undefined },
    },
  },
];

export function annualSavings(plan: PricingPlan) {
  const monthlyTotal = plan.monthlyPrice * 12;
  const amount = monthlyTotal - plan.annualPrice;
  return { amount, percent: Math.round((amount / monthlyTotal) * 100), monthlyTotal };
}

export function validatePricingConfiguration() {
  const warnings: string[] = [];
  pricingPlans.forEach((plan) => {
    (['monthly', 'annual'] as const).forEach((billing) => {
      const slot = plan.checkout[billing];
      const label = `${plan.id}_${billing}`;
      if (!slot.paddlePriceId) {
        warnings.push(`Missing Paddle price ID for ${label}.`);
      }
    });
    if (plan.monthlyPrice <= 0 || plan.annualPrice <= 0 || plan.annualPrice >= plan.monthlyPrice * 12) {
      warnings.push(`Invalid annual pricing for ${plan.id}.`);
    }
  });
  if (pricingPlans.length !== 3) {
    warnings.push(`Expected exactly 3 pricing plans; found ${pricingPlans.length}.`);
  }
  return warnings;
}

export function getPlan(planId: 'creator' | 'pro' | 'agency' | string): PricingPlan | undefined {
  return pricingPlans.find((p) => p.id === planId);
}

export function findPlanByPriceId(priceId: string): { plan: PricingPlan; billing: BillingInterval } | undefined {
  for (const plan of pricingPlans) {
    if (plan.checkout.monthly.paddlePriceId === priceId) {
      return { plan, billing: 'monthly' };
    }
    if (plan.checkout.annual.paddlePriceId === priceId) {
      return { plan, billing: 'annual' };
    }
  }
  return undefined;
}
