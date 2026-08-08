import React from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Zap, HelpCircle, MessageSquare, FileText, ChevronRight, ExternalLink } from 'lucide-react';

const SECTIONS = [
  {
    icon: Zap,
    color: 'text-primary bg-primary/10',
    title: 'Getting Started',
    items: [
      { q: 'How do I create my first campaign?',        a: 'Go to Campaign OS → click "New Campaign" → fill in your niche, platform, and goal → click Create.' },
      { q: 'How do I generate ideas?',                   a: 'Open Idea Studio → click "Generate Ideas". The AI uses your workspace settings to create 5 tailored viral ideas.' },
      { q: 'Do I need an AI API key?',                   a: 'No. Creator OS uses a shared AI provider via OpenRouter. You only need your own key if you want to use a custom model in AI Settings.' },
      { q: 'How do I set up my workspace?',              a: 'Complete the onboarding wizard at /onboarding. You can re-run it anytime from Settings → Workspace.' },
    ],
  },
  {
    icon: HelpCircle,
    color: 'text-yellow-400 bg-yellow-400/10',
    title: 'Frequently Asked Questions',
    items: [
      { q: 'Can I use Creator OS on mobile?',            a: 'Yes. The dashboard is responsive and works on tablet and mobile. A dedicated mobile app is on the roadmap.' },
      { q: 'Is my data private?',                        a: 'Yes. Your workspace data is isolated by Row Level Security in Supabase. No other user can access your data.' },
      { q: 'How does the AI know my niche?',             a: 'You set your niche during onboarding. The AI injects it into every prompt automatically. Update it anytime in Settings.' },
      { q: 'How many ideas can I generate?',             a: 'As many as you need. There is no hard limit, though OpenRouter rate limits apply (30 req/min).' },
      { q: 'Can I export my content?',                   a: 'Yes. Campaign OS and Analytics support JSON, CSV, and Markdown exports from the menu on each page.' },
    ],
  },
  {
    icon: FileText,
    color: 'text-emerald-400 bg-emerald-400/10',
    title: 'Feature Guides',
    items: [
      { q: 'Idea Studio',       a: 'Generate → Expand any idea into a full production brief with one click. Ideas auto-save to your history.' },
      { q: 'Hook Engine',       a: 'Generate hooks → Score individual hooks → Use AI to rewrite weak hooks. Favourite your best performers.' },
      { q: 'Caption OS',        a: 'Enter your topic → select platform → Generate. Get platform-specific caption variants with hashtags included.' },
      { q: 'Campaign OS',       a: 'Create campaigns with statuses (Researching → Growing). Track clips through a 7-stage Kanban pipeline.' },
      { q: 'Knowledge Vault',   a: 'Upload brand guides, scripts, or research. The AI references these automatically in future generations.' },
      { q: 'Command Palette',   a: 'Press ⌘K (or Ctrl+K) anywhere to search, navigate, or create content without using the mouse.' },
    ],
  },
  {
    icon: MessageSquare,
    color: 'text-blue-400 bg-blue-400/10',
    title: 'Troubleshooting',
    items: [
      { q: 'AI generation is failing',                   a: 'Check that VITE_OPENROUTER_API_KEY is set in your .env file. The AI requires a valid API key to generate content.' },
      { q: '"Failed to fetch" error on login',           a: 'Your Supabase environment variables are missing or incorrect. Verify VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.' },
      { q: 'I am redirected to /expired',                a: 'Your account membership_status is not "active". Go to Supabase Dashboard → Table Editor → users and set your row to active.' },
      { q: 'Campaign data is not saving',                a: 'Ensure you have an active workspace. Run the database migrations from the SQL editor if tables are missing.' },
    ],
  },
];

function AccordionItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = React.useState(false);
  return (
    <div className="border-b border-white/[0.04] last:border-0">
      <button onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between gap-4 py-4 text-left group">
        <span className={`text-[14px] font-medium transition-colors ${open ? 'text-primary' : 'text-[#A1A1AA] group-hover:text-[#FAFAFA]'}`}>{q}</span>
        <ChevronRight className={`h-4 w-4 text-[#71717A] shrink-0 transition-transform ${open ? 'rotate-90' : ''}`} />
      </button>
      {open && (
        <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
          className="text-[13px] text-[#71717A] leading-relaxed pb-4">{a}</motion.p>
      )}
    </div>
  );
}

export default function HelpCenterPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-12 pb-20 animate-in fade-in duration-500 font-sans">
      {/* Header */}
      <div className="text-center py-8">
        <div className="h-14 w-14 rounded-[16px] bg-primary/10 flex items-center justify-center mx-auto mb-5">
          <BookOpen className="h-6 w-6 text-primary" />
        </div>
        <h1 className="text-[32px] font-semibold tracking-tight text-[#FAFAFA] mb-3">Help Center</h1>
        <p className="text-[16px] text-[#71717A] max-w-lg mx-auto">
          Everything you need to get the most out of Creator OS.
        </p>
      </div>

      {/* Sections */}
      {SECTIONS.map(section => {
        const Icon = section.icon;
        return (
          <div key={section.title} className="p-7 rounded-[20px] bg-[#111111] border border-white/[0.06]">
            <div className="flex items-center gap-3 mb-6">
              <div className={`h-9 w-9 rounded-[10px] flex items-center justify-center ${section.color}`}>
                <Icon className="h-4 w-4" />
              </div>
              <h2 className="text-[18px] font-semibold text-[#FAFAFA] tracking-tight">{section.title}</h2>
            </div>
            <div>
              {section.items.map(item => <AccordionItem key={item.q} q={item.q} a={item.a} />)}
            </div>
          </div>
        );
      })}

      {/* Contact card */}
      <div className="p-7 rounded-[20px] bg-primary/[0.06] border border-primary/20 flex items-center justify-between gap-6">
        <div>
          <h3 className="text-[16px] font-semibold text-[#FAFAFA] mb-1">Still need help?</h3>
          <p className="text-[13px] text-[#71717A]">Use the feedback button (bottom-right) to reach our team directly.</p>
        </div>
        <a href="mailto:support@creatorOS.app"
          className="flex items-center gap-2 h-10 px-5 rounded-[12px] bg-primary text-white hover:bg-primary/90 text-[13px] font-medium whitespace-nowrap shrink-0">
          <ExternalLink className="h-4 w-4" />Contact Support
        </a>
      </div>
    </div>
  );
}
