const fs = require('fs');
let content = fs.readFileSync('apps/web/src/pages/LandingPage.tsx', 'utf8');

// Remove existing <AgencySection />
content = content.replace(/\n\s*<AgencySection \/>/, '');

// Add it back after <ComparisonMatrix />
content = content.replace('<ComparisonMatrix />', '<ComparisonMatrix />\n\n      <AgencySection />');

fs.writeFileSync('apps/web/src/pages/LandingPage.tsx', content);
console.log('patched');
