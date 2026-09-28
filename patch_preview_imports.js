const fs = require('fs');
let content = fs.readFileSync('apps/web/src/components/landing/PricingPreview.tsx', 'utf8');

content = content.replace("import { planEntitlements, PlanTier } from '@/lib/entitlements';", "import { PlanTier } from '@/lib/entitlements';");

fs.writeFileSync('apps/web/src/components/landing/PricingPreview.tsx', content);
console.log('patched');
