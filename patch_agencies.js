const fs = require('fs');
let content = fs.readFileSync('apps/web/src/pages/ForAgenciesPage.tsx', 'utf8');

content = content.replace("import React from 'react';", "import { useEffect } from 'react';");
content = content.replace("import { Shield, Users, Layers, Zap, Folder, Check, LayoutGrid } from 'lucide-react';", "import { Shield, Users, Layers, Zap, Folder, LayoutGrid } from 'lucide-react';");
content = content.replace("import { Helmet } from 'react-helmet';", "");
content = content.replace(/<Helmet>[\s\S]*?<\/Helmet>/, "");
content = content.replace("export default function ForAgenciesPage() {", "export default function ForAgenciesPage() {\n  useEffect(() => {\n    document.title = 'For Agencies | Creator OS';\n  }, []);");

fs.writeFileSync('apps/web/src/pages/ForAgenciesPage.tsx', content);
console.log('patched ForAgenciesPage');
