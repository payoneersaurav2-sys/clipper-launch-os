const fs = require('fs');
let content = fs.readFileSync('apps/web/src/App.tsx', 'utf8');

// Add import
content = content.replace(
  "const PricingPage         = lazy(() => import('./pages/PricingPage'));",
  "const PricingPage         = lazy(() => import('./pages/PricingPage'));\nconst CheckoutCompletePage = lazy(() => import('./pages/CheckoutCompletePage'));"
);

// Add route
content = content.replace(
  '<Route path="/pricing"   element={<LandingLayout><PricingPage /></LandingLayout>} />',
  '<Route path="/pricing"   element={<LandingLayout><PricingPage /></LandingLayout>} />\n            <Route path="/checkout/complete" element={<CheckoutCompletePage />} />'
);

fs.writeFileSync('apps/web/src/App.tsx', content);
console.log('patched');
