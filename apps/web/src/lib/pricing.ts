export type BillingInterval = 'monthly' | 'annual';

type CheckoutSlot = {
  url: string;
  billing: BillingInterval;
  /** Index in the owner-supplied list. Kept to make later Whop verification easy. */
  sourceIndex: number;
};

export type PricingPlan = {
  id: 'creator' | 'pro' | 'agency';
  name: string;
  positioning: string;
  monthlyPrice: number;
  annualPrice: number;
  cta: string;
  features: string[];
  recommended?: boolean;
  checkout: Record<BillingInterval, CheckoutSlot>;
};

// This is the only checkout-URL configuration in Creator OS.
// Mapping follows the supplied slot order, with source #5 deliberately left
// unassigned because it duplicates source #4. Do not assign it to another plan
// until the Whop product owner confirms what it represents.
const suppliedCheckoutUrls = [
  'https://whop.com/checkout/plan_x36ZUqtqy8DUf',
  'https://whop.com/checkout/plan_FAWP5M3r4he3u',
  'https://whop.com/checkout/plan_JBRDyCvvE29lS',
  'https://whop.com/checkout/plan_qDlONxyQFdDMf',
  'https://whop.com/checkout/plan_qDlONxyQFdDMf',
  'https://whop.com/checkout/plan_DqQz98z72Us8l',
  'https://whop.com/checkout/plan_dPUk9DgQILIsi',
] as const;

export const unresolvedCheckoutMapping = {
  sourceIndex: 5,
  url: suppliedCheckoutUrls[4],
  reason: 'Duplicates source #4. It is deliberately unassigned; confirm the Whop plan before using it.',
} as const;

export const pricingPlans: PricingPlan[] = [
  {
    id: 'creator', name: 'Creator', positioning: 'Build your content engine.', monthlyPrice: 19, annualPrice: 190, cta: 'Start Creating',
    features: ['Idea Studio and Hook Engine', 'Platform-ready Caption OS', 'Connected content workspace'],
    checkout: { monthly: { url: suppliedCheckoutUrls[0], billing: 'monthly', sourceIndex: 1 }, annual: { url: suppliedCheckoutUrls[1], billing: 'annual', sourceIndex: 2 } },
  },
  {
    id: 'pro', name: 'Pro', positioning: 'Run your complete creator workflow.', monthlyPrice: 49, annualPrice: 490, cta: 'Start Pro', recommended: true,
    features: ['Campaign planning and content generation', 'Clip Pipeline production workflow', 'Analytics and performance insights'],
    checkout: { monthly: { url: suppliedCheckoutUrls[2], billing: 'monthly', sourceIndex: 3 }, annual: { url: suppliedCheckoutUrls[3], billing: 'annual', sourceIndex: 4 } },
  },
  {
    id: 'agency', name: 'Agency', positioning: 'Scale content across brands and clients.', monthlyPrice: 149, annualPrice: 1490, cta: 'Start Scaling',
    features: ['Campaign OS for content operations', 'Production-ready content workspaces', 'Analytics built for higher-volume workflows'],
    checkout: { monthly: { url: suppliedCheckoutUrls[5], billing: 'monthly', sourceIndex: 6 }, annual: { url: suppliedCheckoutUrls[6], billing: 'annual', sourceIndex: 7 } },
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
      if (!slot?.url || !/^https:\/\/whop\.com\/checkout\/plan_[A-Za-z0-9]+$/.test(slot.url)) warnings.push(`Missing or invalid checkout URL for ${label}.`);
      if (slot?.billing !== billing) warnings.push(`Monthly/annual checkout slot mismatch for ${label}.`);
      if (slot?.url && assigned.has(slot.url)) warnings.push(`Duplicate assigned checkout URL: ${slot.url} (${assigned.get(slot.url)} and ${label}).`);
      else if (slot?.url) assigned.set(slot.url, label);
    });
    if (plan.monthlyPrice <= 0 || plan.annualPrice <= 0 || plan.annualPrice >= plan.monthlyPrice * 12) warnings.push(`Invalid annual pricing for ${plan.id}.`);
  });
  if (pricingPlans.length !== 3) warnings.push(`Expected exactly 3 pricing plans; found ${pricingPlans.length}.`);
  return warnings;
}
