const fs = require('fs');
const path = require('path');

const pagesDir = path.join('d:\\CLipper launch OS\\apps\\web\\src\\pages\\legal');
const pages = [
  { name: 'AcceptableUsePage.tsx', type: 'terms' },
  { name: 'RefundPolicyPage.tsx', type: 'terms' },
  { name: 'CookiePolicyPage.tsx', type: 'privacy' },
  { name: 'AIDisclaimerPage.tsx', type: 'terms' },
  { name: 'DMCAPage.tsx', type: 'terms' }
];

pages.forEach(page => {
  const filePath = path.join(pagesDir, page.name);
  let content = fs.readFileSync(filePath, 'utf-8');

  // Skip if already has useState
  if (content.includes('useState')) return;

  const versionField = page.type === 'terms' ? 'terms_version' : 'privacy_version';

  // Add imports
  content = `import { useState, useEffect } from 'react';\nimport { supabase } from '@/lib/supabase';\n` + content;

  // Add state and effect
  const stateCode = `  const [version, setVersion] = useState<string | null>(null);

  useEffect(() => {
    const fetchVersion = async () => {
      try {
        const { data } = await supabase.rpc('check_legal_status');
        if (data?.${versionField}) {
          setVersion(data.${versionField});
        } else {
          setVersion('1.0.0');
        }
      } catch {
        setVersion('1.0.0');
      }
    };
    fetchVersion();
  }, []);

  if (!version) {
    return (
      <div className="flex items-center justify-center h-full min-h-[300px]">
        <div className="h-8 w-8 rounded-full border-b-2 border-primary animate-spin" />
      </div>
    );
  }
`;

  content = content.replace(/export default function \w+\(\) {\s+return \(/, `export default function ${page.name.replace('.tsx','')}() {\n${stateCode}\n  return (`);

  // Add the date and version tags right after the h1
  const datesHtml = `
      <p className="text-[#A1A1AA] mb-2">Effective Date: September 15, 2026</p>
      <p className="text-[#A1A1AA] mb-2">Last Updated: September 15, 2026</p>
      <p className="text-[#A1A1AA] mb-8">Version: {version}</p>
`;
  content = content.replace(/(<h1[^>]*>.*?<\/h1>)(?:\s*<p[^>]*>Effective Date[^<]*<\/p>)?/, `$1${datesHtml}`);

  fs.writeFileSync(filePath, content);
  console.log(`Updated ${page.name}`);
});
