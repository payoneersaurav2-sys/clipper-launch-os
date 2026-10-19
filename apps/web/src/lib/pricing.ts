export type BillingInterval = 'monthly' | 'annual';

type CheckoutSlot = {
  url: string;
  billing: BillingInterval;
  /** Index in the owner-supplied list. Kept to make later Whop verification easy. */
  sourceIndex: number;
  /**
   * Paddle price ID (e.g. "pri_01abc...").
   * When set, the checkout hook opens the Paddle overlay instead of redirecting to Whop.
   * Read from VITE_PADDLE_PRICE_* env vars at build time.
   * Leave undefined (or empty) to keep using the Whop URL as fallback.
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

// This is the only checkout-URL configuration in Creator OS.
// All plans follow the supplied sequential order from Whop.
const suppliedCheckoutUrls = [
  'https://whop.com/checkout/plan_aebXspbqY5fMR',
  'https://whop.com/checkout/plan_2eRxyfJ19G1eu',
  'https://whop.com/checkout/plan_JBRDyCvvE29lS',
  'https://whop.com/checkout/plan_qDlONxyQFdDMf',
  'https://whop.com/checkout/plan_qDlONxyQFdDMf',
  'https://whop.com/checkout/plan_cpIr2MLFacoNX',
  'https://whop.com/checkout/plan_dPUk9DgQILIsi',
] as const;

export const unresolvedCheckoutMapping = {
  sourceIndex: 5,
  url: suppliedCheckoutUrls[4],
  reason: 'Duplicates source #4. It is deliberately unassigned; confirm the Whop plan before using it.',
} as const;







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
    id: 'creator', name: 'Creator', positioning: 'Build your content engine.', monthlyPrice: 29, annualPrice: 290, cta: 'Start Creating',
    features: creatorFeatures,
    checkout: {
      monthly: { url: suppliedCheckoutUrls[0], billing: 'monthly', sourceIndex: 1, paddlePriceId: import.meta.env.VITE_PADDLE_PRICE_CREATOR_MONTHLY as string | undefined },
      annual:  { url: suppliedCheckoutUrls[1], billing: 'annual',  sourceIndex: 2, paddlePriceId: import.meta.env.VITE_PADDLE_PRICE_CREATOR_ANNUAL  as string | undefined },
    },
  },
  {
    id: 'pro', name: 'Pro', positioning: 'Run your complete creator workflow.', monthlyPrice: 49, annualPrice: 499, cta: 'Go Pro', recommended: true,
    features: proFeatures,
    checkout: {
      monthly: { url: suppliedCheckoutUrls[2], billing: 'monthly', sourceIndex: 3, paddlePriceId: import.meta.env.VITE_PADDLE_PRICE_PRO_MONTHLY as string | undefined },
      annual:  { url: suppliedCheckoutUrls[3], billing: 'annual',  sourceIndex: 4, paddlePriceId: import.meta.env.VITE_PADDLE_PRICE_PRO_ANNUAL  as string | undefined },
    },
  },
  {
    id: 'agency', name: 'Agency', positioning: 'For agencies managing multiple brands, clients, and content operations.', monthlyPrice: 199, annualPrice: 1990, cta: 'Start With Agency',
    features: agencyFeatures,
    checkout: {
      monthly: { url: suppliedCheckoutUrls[5], billing: 'monthly', sourceIndex: 6, paddlePriceId: import.meta.env.VITE_PADDLE_PRICE_AGENCY_MONTHLY as string | undefined },
      annual:  { url: suppliedCheckoutUrls[6], billing: 'annual',  sourceIndex: 7, paddlePriceId: import.meta.env.VITE_PADDLE_PRICE_AGENCY_ANNUAL  as string | undefined },
    },
  },
];

export function annualSavings(plan: PricingPlan) {
  const monthlyTotal = plan.monthlyPrice * 12;
  const amount = monthlyTotal - plan.annualPrice;
  return { amount, percent: Math.round((amount / monthlyTotal) * 100), monthlyTotal };
}

/** Development guard for accidental config errors. It cannot verify opaque Whop IDs remotely. */
export function validatePricingConfiguration() {
  const warnings: string[] = [];
  const seenSupplied = new Map<string, number>();
  suppliedCheckoutUrls.forEach((url, index) => {
    const first = seenSupplied.get(url);
    if (first !== undefined) warnings.push(`Duplicate supplied checkout URL detected: ${url} (sources #${first + 1} and #${index + 1}). Source #${index + 1} remains unresolved.`);
    else seenSupplied.set(url, index);
  });

  const assigned = new Map<string, string>();
  pricingPlans.forEach((plan) => {
    (['monthly', 'annual'] as const).forEach((billing) => {
      const slot = plan.checkout[billing];
      const label = `${plan.id}_${billing}`;
      const isValidWhopUrl = /^https:\/\/whop\.com\/checkout\/plan_[A-Za-z0-9]+$/.test(slot.url ?? '');
      const hasPaddlePriceId = !!slot.paddlePriceId;
      if (!isValidWhopUrl && !hasPaddlePriceId) warnings.push(`Missing or invalid checkout URL/price ID for ${label}.`);
      if (slot?.billing !== billing) warnings.push(`Monthly/annual checkout slot mismatch for ${label}.`);
      if (slot?.url && assigned.has(slot.url)) warnings.push(`Duplicate assigned checkout URL: ${slot.url} (${assigned.get(slot.url)} and ${label}).`);
      else if (slot?.url) assigned.set(slot.url, label);
    });
    if (plan.monthlyPrice <= 0 || plan.annualPrice <= 0 || plan.annualPrice >= plan.monthlyPrice * 12) warnings.push(`Invalid annual pricing for ${plan.id}.`);
  });
  if (pricingPlans.length !== 3) warnings.push(`Expected exactly 3 pricing plans; found ${pricingPlans.length}.`);
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








