const fs = require('fs');
let content = fs.readFileSync('apps/web/src/pages/PricingPage.tsx', 'utf8');

content = content.replace("import { buildWhopOAuthUrl } from '@/lib/whopPkce';\r\n", '');
content = content.replace("import { buildWhopOAuthUrl } from '@/lib/whopPkce';\n", '');

content = content.replace("  const navigate = useNavigate();\r\n", '');
content = content.replace("  const navigate = useNavigate();\n", '');

content = content.replace("  const { user, whopId } = useAuthStore();\r\n", '');
content = content.replace("  const { user, whopId } = useAuthStore();\n", '');

fs.writeFileSync('apps/web/src/pages/PricingPage.tsx', content);
console.log('patched');
