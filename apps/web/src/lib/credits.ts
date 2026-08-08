export type CreditOperation =
  | 'idea_generation'
  | 'idea_expansion'
  | 'hook_generation'
  | 'hook_scoring'
  | 'caption_generation'
  | 'caption_variants'
  | 'campaign_strategy'
  | 'campaign_content_plan'
  | 'storyboard_script'
  | 'analytics_analysis'
  | 'knowledge_answer';

export const CREDIT_COSTS: Record<CreditOperation, { credits: number; measuredP95CostUsd: number }> = {
  idea_generation: { credits: 21, measuredP95CostUsd: 0.0020922 },
  idea_expansion: { credits: 4, measuredP95CostUsd: 0.000312 },
  hook_generation: { credits: 6, measuredP95CostUsd: 0.00050835 },
  hook_scoring: { credits: 2, measuredP95CostUsd: 0.0001962 },
  caption_generation: { credits: 3, measuredP95CostUsd: 0.0002574 },
  caption_variants: { credits: 4, measuredP95CostUsd: 0.00032505 },
  campaign_strategy: { credits: 18, measuredP95CostUsd: 0.0017652 },
  campaign_content_plan: { credits: 18, measuredP95CostUsd: 0.00174495 },
  storyboard_script: { credits: 4, measuredP95CostUsd: 0.00036225 },
  analytics_analysis: { credits: 5, measuredP95CostUsd: 0.0004401 },
  knowledge_answer: { credits: 3, measuredP95CostUsd: 0.00028065 },
};

export type CreditPack = {
  id: 'starter' | 'growth' | 'scale' | 'studio' | 'enterprise';
  credits: number;
  price: number;
  checkoutUrl: string;
  popular?: boolean;
};

// The only credit-pack checkout configuration in Creator OS.
export const CREDIT_PACKS: readonly CreditPack[] = [
  { id: 'starter', credits: 1_000, price: 9, checkoutUrl: 'https://whop.com/checkout/plan_pHajojZffyDxv' },
  { id: 'growth', credits: 5_000, price: 29, checkoutUrl: 'https://whop.com/checkout/plan_5IB8JVbpg8rik', popular: true },
  { id: 'scale', credits: 15_000, price: 69, checkoutUrl: 'https://whop.com/checkout/plan_3SbRI3CB8aiur' },
  { id: 'studio', credits: 50_000, price: 149, checkoutUrl: 'https://whop.com/checkout/plan_cpIr2MLFacoNX' },
  { id: 'enterprise', credits: 150_000, price: 299, checkoutUrl: 'https://whop.com/checkout/plan_2eRxyfJ19G1eu' },
] as const;

export function getCreditCost(operation: CreditOperation) {
  return CREDIT_COSTS[operation].credits;
}
