const fs = require('fs');
let content = fs.readFileSync('apps/web/src/pages/CreditStorePage.tsx', 'utf8');

content = content.replace("import React, { useState } from 'react';", "import React from 'react';");
content = content.replace("import { buildWhopOAuthUrl } from '@/lib/whopPkce';", "");
content = content.replace(/const whopId = [^;]+;/, "");

fs.writeFileSync('apps/web/src/pages/CreditStorePage.tsx', content);
console.log('patched');
