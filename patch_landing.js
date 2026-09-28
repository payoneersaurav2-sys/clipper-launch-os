const fs = require('fs');
let content = fs.readFileSync('apps/web/src/pages/LandingPage.tsx', 'utf8');

if (!content.includes('import { PricingPreview }')) {
  content = content.replace("import { AgencySection } from '@/components/landing/AgencySection';", "import { AgencySection } from '@/components/landing/AgencySection';\nimport { PricingPreview } from '@/components/landing/PricingPreview';");
  
  const target = "</section>\n\n      {/* Early Social Proof */}";
  const replacement = "</section>\n\n      {/* Compact Pricing Preview */}\n      <PricingPreview />\n\n      {/* Early Social Proof */}";
  
  content = content.replace(target, replacement);
  fs.writeFileSync('apps/web/src/pages/LandingPage.tsx', content);
  console.log('patched LandingPage');
} else {
  console.log('already patched');
}
