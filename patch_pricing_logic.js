const fs = require('fs');
let content = fs.readFileSync('apps/web/src/lib/pricing.ts', 'utf8');

// Restore suppliedCheckoutUrls
const newUrls = `const suppliedCheckoutUrls = [
  'https://whop.com/checkout/plan_aebXspbqY5fMR',
  'https://whop.com/checkout/plan_FAWP5M3r4he3u',
  'https://whop.com/checkout/plan_JBRDyCvvE29lS',
  'https://whop.com/checkout/plan_qDlONxyQFdDMf',
  'https://whop.com/checkout/plan_qDlONxyQFdDMf',
  'https://whop.com/checkout/plan_DqQz98z72Us8l',
  'https://whop.com/checkout/plan_dPUk9DgQILIsi',
] as const;`;

// A regex match for the original suppliedCheckoutUrls block:
const arrayMatch = content.match(/const suppliedCheckoutUrls = \[[\s\S]*?\] as const;/);
if (arrayMatch) {
  content = content.replace(arrayMatch[0], newUrls);
}

// Fix mappings and Pro price
content = content.replace(
  "checkout: { monthly: { url: suppliedCheckoutUrls[0], billing: 'monthly', sourceIndex: 1 }, annual: { url: suppliedCheckoutUrls[3], billing: 'annual', sourceIndex: 4 } },",
  "checkout: { monthly: { url: suppliedCheckoutUrls[0], billing: 'monthly', sourceIndex: 1 }, annual: { url: suppliedCheckoutUrls[1], billing: 'annual', sourceIndex: 2 } },"
);

content = content.replace(
  "id: 'pro', name: 'Pro', positioning: 'Run your complete creator workflow.', monthlyPrice: 49, annualPrice: 490, cta: 'Go Pro', recommended: true,",
  "id: 'pro', name: 'Pro', positioning: 'Run your complete creator workflow.', monthlyPrice: 49, annualPrice: 499, cta: 'Go Pro', recommended: true,"
);

// We need to replace Pro and Agency simultaneously to avoid overlapping replace operations.
// Let's replace the whole pricingPlans array body just to be safe:

// ... Actually, it's easier to just rebuild it if the replaces overlap, but they shouldn't overlap if we are precise.
// Wait, the first one is Pro's checkout:
content = content.replace(
  "checkout: { monthly: { url: suppliedCheckoutUrls[5], billing: 'monthly', sourceIndex: 6 }, annual: { url: suppliedCheckoutUrls[1], billing: 'annual', sourceIndex: 2 } },",
  "checkout: { monthly: { url: suppliedCheckoutUrls[2], billing: 'monthly', sourceIndex: 3 }, annual: { url: suppliedCheckoutUrls[3], billing: 'annual', sourceIndex: 4 } },"
);

// Then Agency's checkout:
// Note: Agency's checkout might have my previous fix `url: suppliedCheckoutUrls[2]` (or if I replaced the literal URL, it might be different).
// Wait! My previous fix replaced 'https://whop.com/checkout/plan_JBRDyCvvE29lS' with 'https://whop.com/checkout/plan_cpIr2MLFacoNX' INSIDE the suppliedCheckoutUrls array!
// So I already restored the original array string. The `checkout` objects in `pricingPlans` still refer to `suppliedCheckoutUrls[2]` etc.
// Let's just do it securely by matching the exact line.
content = content.replace(
  "checkout: { monthly: { url: suppliedCheckoutUrls[2], billing: 'monthly', sourceIndex: 3 }, annual: { url: suppliedCheckoutUrls[6], billing: 'annual', sourceIndex: 7 } },",
  "checkout: { monthly: { url: suppliedCheckoutUrls[5], billing: 'monthly', sourceIndex: 6 }, annual: { url: suppliedCheckoutUrls[6], billing: 'annual', sourceIndex: 7 } },"
);

// We need to also remove the comment that says:
// "Creator and Agency follow the supplied order..."
const commentRegex = /\/\/ Creator and Agency follow the supplied order\. The owner verified that Pro's[\s\S]*?\/\/ Source #5 deliberately remains unassigned because it duplicates source #4\./;
content = content.replace(commentRegex, '// All plans follow the supplied sequential order from Whop.');


fs.writeFileSync('apps/web/src/lib/pricing.ts', content);
console.log('patched');
