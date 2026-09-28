import {
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  BarChart3,
  Check,
  Copy,
  Layers,
  PenLine,
  PenTool,
  Play,
  Sparkles,
  Star,
  X,
  Zap,
} from 'lucide-react'
import { CONTACT_EMAIL, HOME_FAQS, PRICING_URL, SAURAV_REVIEW, START_URL } from '#/lib/site'
import { SocialProofStrip } from './social-proof'
import { PricingPreview } from './pricing-preview'

function Stars({ className = 'text-primary' }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center gap-0.5 ${className}`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} className="h-3.5 w-3.5 fill-current" />
      ))}
    </div>
  )
}

function MiniReview() {
  return (
    <div className="mt-10 flex flex-col items-center">
      <Stars />
      <p className="mt-3 max-w-md text-center text-[14px] leading-relaxed text-muted-foreground">
        “{SAURAV_REVIEW.text}”
      </p>
      <p className="mt-2 flex items-center gap-2 text-[13px] text-muted-foreground">
        <span>{SAURAV_REVIEW.name}</span>
        <span>•</span>
        <span>{SAURAV_REVIEW.role}</span>
        <BadgeCheck className="h-3.5 w-3.5 text-primary" />
      </p>
    </div>
  )
}

function ReviewCard() {
  return (
    <article className="rounded-[24px] bg-white p-8 text-left shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
      <Stars />
      <p className="mt-6 text-[16px] leading-relaxed text-zinc-800">“{SAURAV_REVIEW.text}”</p>
      <div className="mt-8 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-100 text-[14px] font-semibold text-zinc-600">
          S
        </div>
        <div>
          <p className="text-[14px] font-medium text-zinc-900">{SAURAV_REVIEW.name}</p>
          <p className="text-[13px] text-zinc-500">{SAURAV_REVIEW.role}</p>
        </div>
        <BadgeCheck className="ml-auto h-4 w-4 text-primary" />
      </div>
    </article>
  )
}

function HookEngineDemo() {
  return (
    <section id="hook-engine-demo" className="relative overflow-hidden bg-[#030303] px-4 py-20 sm:px-6 sm:py-28 lg:py-32 border-y border-white/[0.04]">
      <div className="pointer-events-none absolute left-1/2 top-1/4 -z-10 -translate-x-1/2 -translate-y-1/2 h-[400px] w-[600px] rounded-full bg-primary/10 blur-[100px]" />

      <div className="mx-auto max-w-6xl">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-8 items-center">
          
          <div className="flex flex-col items-start text-left">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 mb-6 text-sm font-medium text-primary shadow-[0_0_12px_rgba(124,58,237,0.15)]">
              <Zap className="h-4 w-4" />
              <span>Hook Engine</span>
            </div>
            
            <h2 className="text-[32px] sm:text-[42px] font-semibold tracking-[-0.04em] text-white leading-[1.08] mb-5">
              Turn better ideas into stronger hooks.
            </h2>
            
            <p className="text-[16px] sm:text-[18px] leading-relaxed text-white/60 mb-8 max-w-md">
              Write hooks people want to keep watching. Hook Engine analyzes your hook, identifies weaknesses, and helps turn it into a stronger version using supported retention frameworks.
            </p>
            
            <a href={START_URL} className="inline-flex">
              <span className="inline-flex h-12 w-full sm:w-auto items-center justify-center rounded-[12px] bg-primary px-8 text-[15px] font-medium text-white shadow-[0_0_24px_rgba(124,58,237,0.4)] transition-all hover:shadow-[0_0_32px_rgba(124,58,237,0.6)]">
                Try Hook Engine Free <ArrowRight className="ml-2 h-4 w-4" />
              </span>
            </a>
          </div>

          <div className="relative">
            <div className="relative overflow-hidden rounded-[24px] border border-white/[0.08] bg-[#0A0A0A] shadow-2xl aspect-video w-full group">
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 bg-gradient-to-br from-white/[0.02] to-transparent">
                <Play className="h-12 w-12 text-white/20 mb-4" />
                <p className="text-white/40 text-sm font-medium">Hook Engine Demo Recording</p>
              </div>

              <video 
                src="/demo/hook-engine-demo.mp4" 
                className="absolute inset-0 w-full h-full object-cover z-10"
                autoPlay 
                muted 
                loop 
                playsInline
                aria-label="Hook Engine analyzing and rewriting a hook"
              />
              
              <div className="absolute inset-0 rounded-[24px] ring-1 ring-inset ring-white/10 pointer-events-none z-20" />
            </div>
            <div className="absolute -inset-1 bg-gradient-to-tr from-primary/30 to-blue-500/30 rounded-[24px] blur-xl opacity-30 -z-10 transition-opacity duration-500" />
          </div>

        </div>
      </div>
    </section>
  )
}

const COMPARISON = [
  {
    feature: '3-Second Hook Retention Scoring',
    manual: 'None',
    generic: 'Basic text',
    ours: 'Real-time retention scoring',
    genericWarn: false,
  },
  {
    feature: 'Platform-Specific SEO Captions',
    manual: 'Manual',
    generic: 'Basic format',
    ours: 'Native TikTok/Shorts SEO tags',
    genericWarn: true,
  },
  {
    feature: 'Visual Clip Production Pipeline',
    manual: 'Disconnected',
    generic: 'Not supported',
    ours: 'Built-in Kanban pipeline',
    genericWarn: false,
  },
  {
    feature: 'Multi-Brand Client Workspaces',
    manual: 'High clutter',
    generic: 'Single session',
    ours: 'Dedicated agency workspaces',
    genericWarn: false,
  },
  {
    feature: 'Idea-to-Batch Repurposing',
    manual: '3+ hours',
    generic: 'Unstructured',
    ours: '1-click 10-angle generator',
    genericWarn: true,
  },
]

import { useState } from 'react'

function FAQItem({ faq, isOpen, onClick }: { faq: typeof HOME_FAQS[0], isOpen: boolean, onClick: () => void }) {
  return (
    <article
      className={`overflow-hidden rounded-[16px] border transition-colors duration-300 ${
        isOpen ? 'bg-[#111111] border-primary/20' : 'bg-[#0D0D0D] border-white/[0.06] hover:border-white/[0.12]'
      }`}
    >
      <button
        type="button"
        onClick={onClick}
        aria-expanded={isOpen}
        className="w-full flex items-center justify-between p-5 sm:p-7 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset group"
      >
        <h3 className={`text-[16px] sm:text-[17px] font-medium tracking-tight pr-8 transition-colors ${isOpen ? 'text-primary' : 'text-[#FAFAFA] group-hover:text-primary'}`}>
          {faq.question}
        </h3>
        <div className={`flex-shrink-0 transition-colors ${isOpen ? 'text-primary' : 'text-[#71717A] group-hover:text-primary'}`}>
          <span className="text-[18px] font-medium leading-none">{isOpen ? '?' : '+'}</span>
        </div>
      </button>
      <div 
        className={`grid transition-all duration-300 ease-in-out ${isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}
      >
        <div className="overflow-hidden">
          <div className="px-5 sm:px-7 pb-5 sm:pb-7 pt-0 text-[#A1A1AA] text-[15px] sm:text-[16px] leading-relaxed">
            {faq.answer}
          </div>
        </div>
      </div>
    </article>
  )
}

function CustomFAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section className="bg-[#080808] px-4 py-16 sm:py-24 border-t border-white/[0.05]">
      <div className="mx-auto max-w-3xl">
        <div className="mb-12 sm:mb-16 text-center">
          <h2 className="text-[32px] sm:text-[40px] font-semibold tracking-tight text-[#FAFAFA] mb-4 leading-tight">
            Questions, answered.
          </h2>
          <p className="mt-3 text-[16px] sm:text-[18px] text-[#A1A1AA] tracking-tight">
            Everything you need to know before you start.
          </p>
        </div>
        <div className="space-y-3">
          {HOME_FAQS.map((faq, index) => (
            <FAQItem 
              key={faq.question} 
              faq={faq} 
              isOpen={openIndex === index} 
              onClick={() => setOpenIndex(openIndex === index ? null : index)} 
            />
          ))}
        </div>
      </div>
    </section>
  )
}

export function HomePage() {
  return (
    <div>
      <div className="relative overflow-hidden">
        <div className="grid-hero pointer-events-none absolute inset-0" />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-40 left-1/2 h-[430px] w-[680px] -translate-x-1/2 rounded-full bg-primary/15 blur-[110px]"
        />
        <section
          id="hero"
          aria-label="The main header and value proposition"
          className="relative flex flex-col items-center justify-center px-4 pb-16 pt-24 text-center sm:pb-24 sm:pt-32 md:pb-32 md:pt-40"
        >
          <div className="mb-8 inline-flex items-center rounded-full border border-border bg-card px-3 py-1 text-[13px] font-medium backdrop-blur-md">
            <Sparkles className="mr-2 h-[14px] w-[14px] text-primary" />
            <span className="text-muted-foreground">The Notion alternative for creators.</span>
          </div>
          <h1 className="mb-6 max-w-5xl text-[36px] font-semibold leading-[1.05] tracking-tight text-foreground sm:text-[52px] md:text-[72px] lg:text-[84px]">
            The Operating System for Modern Creators & Video Agencies
          </h1>
          <p className="mb-10 max-w-2xl text-[17px] font-medium leading-relaxed tracking-tight text-muted-foreground md:text-[22px]">
            More than just a Trello alternative for video production. Score viral hooks, automate
            TikTok captions, and manage short-form campaigns from a single dashboard.
          </p>
          <div className="flex w-full flex-col items-center gap-4 sm:w-auto sm:flex-row">
            <a href={START_URL} className="w-full sm:w-auto">
              <span className="inline-flex h-12 w-full items-center justify-center rounded-[12px] bg-primary px-8 text-[15px] font-medium text-white shadow-[0_0_24px_rgba(124,58,237,0.4)] transition-all duration-300 hover:bg-primary/90 hover:shadow-[0_0_32px_rgba(124,58,237,0.6)] sm:w-auto">
                Start creating free
                <ArrowRight className="ml-2 h-4 w-4" />
              </span>
            </a>
            <a href={PRICING_URL} className="w-full sm:w-auto">
              <span className="inline-flex h-12 w-full items-center justify-center rounded-[12px] border border-border bg-card/50 px-8 text-[15px] font-medium text-foreground backdrop-blur-sm transition-all duration-300 hover:bg-muted sm:w-auto">
                View Pricing
              </span>
            </a>
          </div>
          <MiniReview />
        </section>
        <SocialProofStrip />
      </div>

      <section id="features" className="relative z-10 bg-background px-4 py-16 sm:py-20 lg:py-24">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 text-center sm:mb-16 lg:mb-20">
            <h2 className="mb-4 text-[26px] font-semibold leading-none tracking-tight text-foreground sm:text-[36px] md:text-[48px]">
              A seamless workflow engine.
            </h2>
            <p className="mx-auto max-w-2xl text-[17px] tracking-tight text-muted-foreground">
              The definitive UGC creator management system. Outputs automatically become inputs.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:gap-6">
            <div
              id="idea-studio"
              className="group relative overflow-hidden rounded-[20px] border border-border bg-card p-6 text-foreground shadow-sm transition-shadow duration-300 hover:shadow-[0_18px_38px_rgba(124,58,237,0.12)] sm:col-span-2 sm:p-8 lg:p-10"
            >
              <Copy className="mb-6 h-8 w-8 text-primary" strokeWidth={1.5} />
              <h3 className="mb-3 text-[24px] font-semibold tracking-tight">1. Idea Studio</h3>
              <p className="max-w-md text-[15px] leading-relaxed tracking-tight text-muted-foreground">
                Capture concepts and instantly generate variations with context-aware AI. Drop in a
                link, and watch the studio break it down into 10 viral angles.
              </p>
            </div>
            <div
              id="hook-engine"
              className="group relative overflow-hidden rounded-[20px] border border-border bg-card p-6 text-foreground shadow-sm transition-shadow duration-300 hover:shadow-[0_18px_38px_rgba(124,58,237,0.12)] sm:p-8 lg:p-10"
            >
              <Zap className="mb-6 h-8 w-8 text-primary" strokeWidth={1.5} />
              <h3 className="mb-3 text-[20px] font-semibold tracking-tight">2. Hook Engine</h3>
              <p className="text-[15px] leading-relaxed tracking-tight text-muted-foreground">
                Learn exactly how to score video hooks before filming. Score and optimize hooks
                against top performing historical data. A powerful VidIQ hook alternative.
              </p>
            </div>
            <div
              id="caption-os"
              className="group relative overflow-hidden rounded-[20px] border border-border bg-card p-6 text-foreground shadow-sm transition-shadow duration-300 hover:shadow-[0_18px_38px_rgba(124,58,237,0.12)] sm:p-8 lg:p-10"
            >
              <PenTool className="mb-6 h-8 w-8 text-primary" strokeWidth={1.5} />
              <h3 className="mb-3 text-[20px] font-semibold tracking-tight">3. Caption OS</h3>
              <p className="text-[15px] leading-relaxed tracking-tight text-muted-foreground">
                Platform-specific SEO captions generated instantly from your winning hooks. Your
                Opus Clip companion workflow.
              </p>
            </div>
            <div
              id="campaign-center"
              className="group relative overflow-hidden rounded-[20px] border border-border bg-card p-6 text-foreground shadow-sm transition-shadow duration-300 hover:shadow-[0_18px_38px_rgba(124,58,237,0.12)] sm:col-span-2 sm:p-8 lg:p-10"
            >
              <BarChart3 className="mb-6 h-8 w-8 text-primary" strokeWidth={1.5} />
              <h3 className="mb-3 text-[24px] font-semibold tracking-tight">4. Campaign Center</h3>
              <p className="max-w-xl text-[15px] leading-relaxed tracking-tight text-muted-foreground">
                Plan launches, track production across your entire freelance video clipper pipeline,
                and review automated analytics all in one beautiful kanban board. The TubeBuddy
                alternative 2026.
              </p>
            </div>
          </div>
        </div>
      </section>

      <HookEngineDemo />

      <section className="bg-background px-4 py-16 sm:py-20">
        <div className="mx-auto max-w-6xl">
          <div className="mb-10 max-w-xl sm:mb-14">
            <p className="mb-3 text-[11px] font-semibold tracking-[0.16em] text-primary">
              ONE OPERATING RHYTHM
            </p>
            <h2 className="text-[30px] font-semibold leading-[1.08] tracking-[-0.04em] sm:text-[44px]">
              From a raw idea to a repeatable system.
            </h2>
            <p className="mt-4 text-[15px] leading-relaxed text-muted-foreground">
              Creator OS keeps the work moving forward, so you can focus on the decisions that make
              your content distinct. The best content planner for TikTok clippers.
            </p>
          </div>
          <div className="grid gap-3 md:grid-cols-4">
            {[
              {
                number: '01',
                title: 'Find the angle',
                copy: 'Capture an idea or use Idea Studio to create a focused starting point.',
                icon: Sparkles,
              },
              {
                number: '02',
                title: 'Build the asset',
                copy: 'Turn the angle into hooks, captions, and a production-ready storyboard.',
                icon: PenLine,
              },
              {
                number: '03',
                title: 'Run the workflow',
                copy: 'Organize related content in Campaign OS and move it through the pipeline.',
                icon: Layers,
              },
              {
                number: '04',
                title: 'Learn and repeat',
                copy: 'Use analytics and history to decide what the next piece should improve.',
                icon: BarChart3,
              },
            ].map((step) => (
              <article
                key={step.number}
                className="rounded-[18px] border border-border bg-card p-5 sm:p-6"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold tracking-[0.14em] text-primary">
                    {step.number}
                  </span>
                  <step.icon className="h-4 w-4 text-muted-foreground" />
                </div>
                <h3 className="mt-8 text-[17px] font-semibold tracking-tight">{step.title}</h3>
                <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">{step.copy}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-background px-4 py-16 sm:py-20">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 text-center sm:mb-16">
            <h2 className="mb-4 text-[30px] font-semibold leading-none tracking-[-0.04em] sm:text-[40px]">
              Why Creator OS?
            </h2>
            <p className="text-[16px] tracking-tight text-muted-foreground">
              See how we stack up against manual workflows and generic AI writers.
            </p>
          </div>
          <div className="overflow-x-auto rounded-[20px] border border-border bg-card shadow-2xl">
            <table className="w-full min-w-[700px] border-collapse text-left">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="w-1/4 p-5 text-[15px] font-semibold text-foreground">Feature</th>
                  <th className="w-1/4 p-5 text-[14px] font-medium text-muted-foreground">
                    Manual Spreadsheets & Notes
                  </th>
                  <th className="w-1/4 p-5 text-[14px] font-medium text-muted-foreground">
                    Generic AI Writers
                  </th>
                  <th className="w-1/4 border-l border-primary/20 bg-primary/5 p-5 text-[15px] font-semibold text-primary">
                    Creator OS
                  </th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON.map((row) => (
                  <tr key={row.feature} className="border-t border-border hover:bg-muted/30">
                    <td className="p-5 text-[14px] font-medium">{row.feature}</td>
                    <td className="p-5 text-[14px] text-muted-foreground">
                      <span className="flex items-center gap-2">
                        <X className="h-4 w-4 text-destructive" /> {row.manual}
                      </span>
                    </td>
                    <td className="p-5 text-[14px] text-muted-foreground">
                      <span className="flex items-center gap-2">
                        {row.genericWarn ? (
                          <AlertTriangle className="h-4 w-4 text-amber-500" />
                        ) : (
                          <X className="h-4 w-4 text-destructive" />
                        )}{' '}
                        {row.generic}
                      </span>
                    </td>
                    <td className="border-l border-primary/20 bg-primary/5 p-5 text-[14px] font-medium">
                      <span className="flex items-center gap-2 text-success">
                        <Check className="h-4 w-4" /> {row.ours}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <PricingPreview />

      <section className="relative overflow-hidden bg-black px-4 py-20 text-white sm:py-24">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-0 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-primary/10 opacity-50 blur-[120px]"
        />
        <div className="relative mx-auto max-w-7xl">
          <div className="mb-16 md:text-center">
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
              CREATORS ARE BUILDING WITH CREATOR OS
            </p>
            <h2 className="text-[32px] font-semibold leading-[1.08] tracking-[-0.04em] text-white sm:text-[46px]">
              What creators are saying
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-[16px] leading-relaxed text-white/60">
              Real experiences from creators using Creator OS to create, organize, and grow.
            </p>
          </div>
          <div className="mx-auto flex max-w-7xl flex-col gap-6 lg:flex-row">
            <div className="w-full flex-shrink-0 lg:w-[45%]">
              <ReviewCard />
            </div>
            <div className="relative flex min-h-[220px] flex-1 items-center justify-center overflow-hidden rounded-[24px] border border-white/5 bg-white/[0.02]">
              <p className="text-[15px] text-white/40">More reviews coming soon.</p>
            </div>
          </div>
          <div className="mt-14 text-center">
            <h3 className="text-[22px] font-semibold">Using Creator OS?</h3>
            <p className="mt-2 text-[15px] text-white/60">
              Share your experience with other creators.
            </p>
            <a
              href={`mailto:${CONTACT_EMAIL}?subject=Creator%20OS%20review`}
              className="mt-6 inline-flex h-12 items-center justify-center rounded-[12px] bg-primary px-8 text-[14px] font-semibold text-white shadow-sm transition-colors hover:bg-primary/90"
            >
              WRITE A REVIEW →
            </a>
          </div>
        </div>
      </section>

      <CustomFAQSection />

      <section className="relative px-4 pb-20 pt-8 sm:px-6 sm:pb-28 sm:pt-12 bg-[#080808]">
        <div className="mx-auto max-w-6xl overflow-hidden rounded-[24px] border border-primary/20 bg-[#111111] px-6 py-14 text-center sm:px-12 sm:py-20 relative">
          {/* Subtle glow effect behind CTA */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60%] h-[60%] bg-primary/10 blur-[100px] pointer-events-none rounded-full" />
          
          <div className="relative z-10">
            <h2 className="mx-auto max-w-2xl text-[32px] font-semibold leading-[1.08] tracking-tight text-[#FAFAFA] sm:text-[46px]">
              Ready to build your content system?
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-[16px] leading-relaxed text-[#A1A1AA]">
              Start with the Free plan and see how Creator OS fits your workflow.
            </p>
            
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <a href={START_URL} className="w-full sm:w-auto inline-flex">
                <span className="inline-flex h-12 w-full items-center justify-center rounded-[12px] bg-primary px-8 text-[15px] font-medium text-white shadow-[0_0_24px_rgba(124,58,237,0.3)] transition-all hover:shadow-[0_0_32px_rgba(124,58,237,0.5)]">
                  Start Free <ArrowRight className="ml-2 h-4 w-4" />
                </span>
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
