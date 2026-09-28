const fs = require('fs');
let content = fs.readFileSync('apps/web/src/pages/PricingPage.tsx', 'utf8');

content = content.replace("import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';", "import { motion, useReducedMotion } from 'framer-motion';");
content = content.replace("import { Check, Sparkles, X } from 'lucide-react';", "import { Check, X } from 'lucide-react';");
content = content.replace("import { Link, useNavigate } from 'react-router-dom';", "import { useNavigate } from 'react-router-dom';");
content = content.replace("const currentTier = entitlements?.subscription_tier ?? subscriptionTier ?? 'free';", "const currentTier = entitlements?.tier ?? subscriptionTier ?? 'free';");

fs.writeFileSync('apps/web/src/pages/PricingPage.tsx', content);
console.log('patched');
