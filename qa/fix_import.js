const fs = require('fs');

function patchFile(path) {
  let content = fs.readFileSync(path, 'utf8');
  content = content.replace("import { useState };", "import { useState } from 'react';");
  fs.writeFileSync(path, content, 'utf8');
  console.log('Fixed ' + path);
}

patchFile('apps/web/src/pages/AdminReviewsPage.tsx');
patchFile('apps/web/src/pages/AdminMetricsPage.tsx');
