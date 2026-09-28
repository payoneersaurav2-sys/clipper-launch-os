const fs = require('fs');
let content = fs.readFileSync('apps/web/src/pages/PricingPage.tsx', 'utf8');

content = content.replace("  const { beginCheckout } = useCheckout();", "  const { beginCheckout, user, whopId } = useCheckout();");
content = content.replace("import { useNavigate } from 'react-router-dom';\r\n", '');
content = content.replace("import { useNavigate } from 'react-router-dom';\n", '');

fs.writeFileSync('apps/web/src/pages/PricingPage.tsx', content);
console.log('patched');
