const fs = require('fs');

let content = fs.readFileSync('apps/web/src/pages/LandingPage.tsx', 'utf8');

// Add imports
if (!content.includes('FAQSection')) {
  content = content.replace(
    /import \{ supabase \} from '@\/lib\/supabase';/,
    import { supabase } from '@/lib/supabase';\nimport { FAQSection } from '@/components/FAQSection';\nimport { ComparisonMatrix } from '@/components/ComparisonMatrix';
  );
}

// Update h1
content = content.replace(
  /<motion\.h1[^>]*>[\s\S]*?<\/motion\.h1>/,
  <h1>The Operating System for Modern Creators & Video Agencies</h1>
);

// Inject components before the final CTA section
const ctaSectionRegex = /(<section className="relative px-4 pb-20 sm:px-6 sm:pb-28">[\s\S]*?<PlayCircle[\s\S]*?<\/section>)/;
content = content.replace(
  ctaSectionRegex,
  <ComparisonMatrix />\n      <FAQSection />\n\n      
);

fs.writeFileSync('apps/web/src/pages/LandingPage.tsx', content);
