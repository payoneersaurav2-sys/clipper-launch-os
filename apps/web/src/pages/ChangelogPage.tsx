import { motion } from 'framer-motion';
import { Tag, Zap, Bug, Sparkles, ArrowUpRight } from 'lucide-react';

const RELEASES = [
  {
    version: 'v1.0.0',
    date: 'August 2026',
    label: 'Initial Release',
    labelColor: 'bg-primary/10 text-primary border-primary/30',
    highlights: [
      { type: 'feature', text: 'Full AI content engine — Idea Studio, Hook Engine, Caption OS' },
      { type: 'feature', text: 'Campaign OS with 7-stage Kanban production pipeline' },
      { type: 'feature', text: 'Analytics Dashboard with animated stat cards and sparklines' },
      { type: 'feature', text: 'Knowledge Vault — upload resources, query with AI' },
      { type: 'feature', text: 'Notification Center with real-time updates' },
      { type: 'feature', text: 'Settings — profile, workspace, notifications, security' },
      { type: 'feature', text: 'Command Palette (⌘K) with global search and navigation' },
      { type: 'feature', text: 'Onboarding wizard — niche, platform, goals, workspace setup' },
      { type: 'feature', text: 'Whop OAuth + Supabase email authentication' },
      { type: 'feature', text: 'Export system — JSON, CSV, Markdown' },
      { type: 'feature', text: 'Interactive product tour with localStorage persistence' },
      { type: 'feature', text: 'Feedback widget — bug reports, feature requests' },
      { type: 'feature', text: 'Help Center with accordion FAQ' },
      { type: 'feature', text: 'Error boundaries and error pages (404, 403, 500, Offline)' },
      { type: 'feature', text: 'Lazy-loaded routes for optimal performance' },
      { type: 'feature', text: 'Full SEO — OG tags, Twitter Cards, schema.org, sitemap' },
      { type: 'feature', text: 'Row Level Security on all Supabase tables' },
    ],
  },
  {
    version: 'v0.9.0 (Batch 5)',
    date: 'August 2026',
    label: 'Beta',
    labelColor: 'bg-yellow-400/10 text-yellow-400 border-yellow-400/30',
    highlights: [
      { type: 'feature', text: 'Central AIService layer with rate limiting and token accounting' },
      { type: 'feature', text: 'Multi-step onboarding wizard (7 steps)' },
      { type: 'feature', text: 'User Settings with Profile, Workspace, Notifications, Security tabs' },
      { type: 'feature', text: 'Knowledge Vault with file upload and AI-powered Q&A' },
      { type: 'feature', text: 'Notification Center with Supabase sync' },
      { type: 'improvement', text: 'Lazy loading for all dashboard routes' },
      { type: 'improvement', text: 'TypeScript environment declarations (vite-env.d.ts)' },
      { type: 'fix', text: 'AuthCallback compatibility with Supabase JS v2' },
    ],
  },
  {
    version: 'v0.8.0 (Batch 4)',
    date: 'August 2026',
    label: 'Alpha',
    labelColor: 'bg-blue-400/10 text-blue-400 border-blue-400/30',
    highlights: [
      { type: 'feature', text: 'Campaign OS — full CRUD, status filtering, progress tracking' },
      { type: 'feature', text: 'Clip Pipeline — 7-stage Kanban production board' },
      { type: 'feature', text: 'Analytics Dashboard — animated stats, sparklines, AI cost breakdown' },
      { type: 'feature', text: 'Dashboard Home — Today\'s Mission, quick actions, AI feed' },
      { type: 'feature', text: 'Command Palette v2 — keyboard navigation, live data' },
      { type: 'improvement', text: 'Grouped sidebar with collapse toggle' },
    ],
  },
];

const TYPE_ICON: Record<string, { icon: typeof Zap; color: string }> = {
  feature:     { icon: Sparkles, color: 'text-primary' },
  improvement: { icon: Zap,      color: 'text-yellow-400' },
  fix:         { icon: Bug,      color: 'text-emerald-400' },
};

export default function ChangelogPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-10 pb-20 animate-in fade-in duration-500 font-sans">
      {/* Header */}
      <div className="py-8 text-center">
        <div className="h-14 w-14 rounded-[16px] bg-primary/10 flex items-center justify-center mx-auto mb-5">
          <Tag className="h-6 w-6 text-primary" />
        </div>
        <h1 className="text-[32px] font-semibold tracking-tight text-[#FAFAFA] mb-3">Changelog</h1>
        <p className="text-[15px] text-[#71717A]">Every release, improvement, and fix — in one place.</p>
      </div>

      {/* Releases */}
      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-[18px] top-0 bottom-0 w-px bg-white/[0.06]" />

        <div className="space-y-10 pl-10">
          {RELEASES.map((release, i) => (
            <motion.div key={release.version} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}>
              {/* Dot */}
              <div className="absolute left-[11px] h-4 w-4 rounded-full bg-[#111111] border-2 border-primary" style={{ marginTop: '6px' }} />

              <div className="p-6 rounded-[20px] bg-[#111111] border border-white/[0.06]">
                {/* Release header */}
                <div className="flex items-center justify-between flex-wrap gap-3 mb-5">
                  <div className="flex items-center gap-3">
                    <h2 className="text-[18px] font-semibold text-[#FAFAFA] tracking-tight">{release.version}</h2>
                    <span className={`text-[11px] font-medium px-2.5 py-0.5 rounded-full border ${release.labelColor}`}>
                      {release.label}
                    </span>
                  </div>
                  <span className="text-[12px] text-[#71717A]">{release.date}</span>
                </div>

                {/* Items */}
                <ul className="space-y-2.5">
                  {release.highlights.map((item, j) => {
                    const cfg = TYPE_ICON[item.type] ?? TYPE_ICON.feature;
                    const Icon = cfg.icon;
                    return (
                      <li key={j} className="flex items-start gap-3 text-[13px]">
                        <Icon className={`h-4 w-4 shrink-0 mt-0.5 ${cfg.color}`} />
                        <span className="text-[#A1A1AA] leading-snug">{item.text}</span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Footer note */}
      <div className="text-center pt-4">
        <p className="text-[12px] text-[#71717A]">
          Future releases will follow semantic versioning (v1.1, v1.2, v2.0…).{' '}
          <a href="mailto:support@creatorOS.app" className="text-primary hover:underline inline-flex items-center gap-1">
            Subscribe to updates <ArrowUpRight className="h-3 w-3" />
          </a>
        </p>
      </div>
    </div>
  );
}
