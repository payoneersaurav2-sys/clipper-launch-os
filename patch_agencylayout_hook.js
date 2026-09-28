const fs = require('fs');
let content = fs.readFileSync('apps/web/src/layouts/AgencyLayout.tsx', 'utf8');

// replace the first occurrence
content = content.replace("  if (isLoading) return null;\n", "");
content = content.replace("  if (isLoading) return null;\r\n", "");

fs.writeFileSync('apps/web/src/layouts/AgencyLayout.tsx', content);
console.log('patched');
