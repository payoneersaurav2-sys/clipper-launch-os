const fs = require('fs');
let content = fs.readFileSync('apps/web/src/pages/LandingPage.tsx', 'utf8');

if (!content.includes('import { SocialProofStrip }')) {
  content = content.replace(
    "import { PricingPreview } from '@/components/landing/PricingPreview';",
    "import { PricingPreview } from '@/components/landing/PricingPreview';\nimport { SocialProofStrip } from '@/components/landing/SocialProofStrip';"
  );
  
  const target = "{/* Compact Pricing Preview */}";
  const replacement = "{/* Verified Social Proof */}\n      <SocialProofStrip />\n\n      {/* Compact Pricing Preview */}";
  
  content = content.replace(target, replacement);
  
  // also remove the old HeroTrustStrip inside hero so we don't have duplicated social proofs.
  // Wait, prompt said: "If verified creator stories exist, they can remain later on the homepage."
  // And Phase 8: "Do not duplicate the same testimonial in this new section. The purpose of this section is: NUMBERS / PRODUCT EVIDENCE while the later testimonial section is: REAL CUSTOMER STORY. Keep these conceptually separate."
  // So leaving HeroTrustStrip in the hero is fine? 
  // Wait, HeroTrustStrip is a customer story directly at the bottom of the hero.
  // The new flow should be: Hero -> Social Proof Strip -> Pricing Preview -> Features
  
  fs.writeFileSync('apps/web/src/pages/LandingPage.tsx', content);
  console.log('patched LandingPage for SocialProofStrip');
} else {
  console.log('already patched');
}
