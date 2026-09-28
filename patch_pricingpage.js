const fs = require('fs');

let content = fs.readFileSync('apps/web/src/pages/PricingPage.tsx', 'utf8');

// add import for useCheckout
if (!content.includes('useCheckout')) {
  content = content.replace(
    "import { useEntitlements } from '@/hooks/useEntitlements';",
    "import { useEntitlements } from '@/hooks/useEntitlements';\nimport { useCheckout } from '@/hooks/useCheckout';"
  );
}

// Replace local checkout functions
const startIdx = content.indexOf('const checkoutWithPassthrough');
const endIdx = content.indexOf('useEffect(() => {');

if (startIdx !== -1 && endIdx !== -1) {
  content = content.slice(0, startIdx) + content.slice(endIdx);
  // Now add useCheckout call right after useState
  content = content.replace(
    "const { data: entitlements } = useEntitlements();",
    "const { data: entitlements } = useEntitlements();\n  const { beginCheckout } = useCheckout();"
  );
}

fs.writeFileSync('apps/web/src/pages/PricingPage.tsx', content);
console.log('patched');
