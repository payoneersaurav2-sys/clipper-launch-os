const fs = require('fs');

function patchFile(path) {
  let content = fs.readFileSync(path, 'utf8');
  content = content.replace(
    /if \(!isAdmin\) \{\s*return \(\s*<div[^>]*>[\s\S]*?<\/div>\s*\);\s*\}/g,
    'if (!isAdmin) {\n    return <Navigate to="/dashboard" replace />;\n  }'
  );
  if (!content.includes('import { Navigate }')) {
    content = content.replace("import { useState }", "import { useState };\nimport { Navigate } from 'react-router-dom';");
  }
  fs.writeFileSync(path, content, 'utf8');
  console.log('Patched ' + path);
}

patchFile('apps/web/src/pages/AdminReviewsPage.tsx');
patchFile('apps/web/src/pages/AdminMetricsPage.tsx');
