const fs = require('fs');
let content = fs.readFileSync('apps/web/src/App.tsx', 'utf8');

content = content.replace(
  "const FAQPage             = lazy(() => import('./pages/FAQPage'));",
  "const FAQPage             = lazy(() => import('./pages/FAQPage'));\nconst ForAgenciesPage     = lazy(() => import('./pages/ForAgenciesPage'));"
);

content = content.replace(
  '<Route path="/faq"       element={<LandingLayout><FAQPage /></LandingLayout>} />',
  '<Route path="/faq"       element={<LandingLayout><FAQPage /></LandingLayout>} />\n              <Route path="/for-agencies" element={<LandingLayout><ForAgenciesPage /></LandingLayout>} />'
);

fs.writeFileSync('apps/web/src/App.tsx', content);
console.log('patched app');
