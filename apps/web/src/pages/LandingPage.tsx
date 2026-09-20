import { ReviewsSection } from '@/components/landing/ReviewsSection';
import { HeroTrustStrip, FeatureReviewSnippet, PricingTrustSnippet } from '@/components/landing/TrustElements';
import { useApprovedReviews } from '@/hooks/useReviews';
import { Button } from '@/components/ui/button';
import { ArrowRight, Sparkles, Workflow, Zap, BarChart, PenTool, Layers3, PlayCircle } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { FAQSection } from '@/components/FAQSection';
import { ComparisonMatrix } from '@/components/ComparisonMatrix';

export default function LandingPage() {
  const reduceMotion = useReducedMotion();
  const navigate = useNavigate();

  const { data: reviews } = useApprovedReviews();
  const approved = reviews || [];
  const featured = approved.find(r => r.is_featured) || approved[0];
  const otherReviews = approved.filter(r => r.id !== featured?.id);

  const heroReview = featured;
  const ideaReview = otherReviews[0] || heroReview;
  const campaignReview = otherReviews[1] || otherReviews[0] || heroReview;
  const pricingReview = otherReviews[2] || otherReviews[1] || heroReview;

  useEffect(() => {
    const remembered = localStorage.getItem('creator_os_remember_me') === 'true';
    if (!remembered) return;

    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) navigate('/dashboard');
    })();
  }, [navigate]);

  return (
    <div className="flex flex-col min-h-screen relative overflow-hidden bg-background font-sans text-foreground">
      
      {/* Dynamic Background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--foreground)/0.03)_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--foreground)/0.03)_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />
      <motion.div aria-hidden="true" animate={reduceMotion ? undefined : { x: [0, 18, 0], y: [0, -10, 0], opacity: [0.32, 0.62, 0.32] }} transition={{ duration: 12, ease: 'easeInOut', repeat: Infinity }} className="pointer-events-none absolute -top-40 left-1/2 h-[430px] w-[680px] -translate-x-1/2 rounded-full bg-primary/15 blur-[110px]" />
      
      {/* Hero Section */}
      <section id="hero" aria-label="The main header and value proposition" className="relative flex flex-col items-center justify-center text-center px-4 pt-24 sm:pt-32 md:pt-40 pb-16 sm:pb-24 md:pb-32">
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="inline-flex items-center rounded-full border border-border bg-card px-3 py-1 text-[13px] font-medium mb-8 backdrop-blur-md"
        >
          <Sparkles className="h-[14px] w-[14px] mr-2 text-primary" />
          <span className="text-muted-foreground">The Notion alternative for creators.</span>
        </motion.div>
        
        <h1 className="text-[36px] sm:text-[52px] md:text-[72px] lg:text-[84px] font-semibold tracking-tight text-foreground max-w-5xl mb-6 leading-[1.05]">
          The Operating System for Modern Creators & Video Agencies
        </h1>
        
        <motion.p 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" }}
          className="text-[18px] sm:text-[20px] md:text-[22px] text-muted-foreground max-w-2xl mb-10 leading-relaxed font-medium tracking-tight"
        >
          More than just a Trello alternative for video production. Score viral hooks, automate TikTok captions, and manage short-form campaigns from a single dashboard.
        </motion.p>

        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3, ease: "easeOut" }}
          className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto"
        >
          <Link to="/login" className="w-full sm:w-auto">
            <Button size="lg" className="w-full sm:w-auto h-12 rounded-[12px] px-8 bg-primary hover:bg-primary/90 text-white font-medium text-[15px] shadow-[0_0_24px_rgba(124,58,237,0.4)] hover:shadow-[0_0_32px_rgba(124,58,237,0.6)] transition-all duration-300">
              Start creating free
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
          <Link to="/pricing" className="w-full sm:w-auto">
            <Button size="lg" variant="outline" className="w-full sm:w-auto h-12 rounded-[12px] px-8 border-border bg-card/50 hover:bg-muted text-foreground font-medium text-[15px] backdrop-blur-sm transition-all duration-300">
              View Pricing
            </Button>
          </Link>
        </motion.div>

        <HeroTrustStrip review={heroReview} />
      </section>

      {/* Early Social Proof */}
      <ReviewsSection />

      {/* Workflow Bento Grid */}
      <section id="features" className="py-16 sm:py-20 lg:py-24 px-4 bg-background relative z-10">
        <div className="max-w-6xl mx-auto">
          <motion.div initial={reduceMotion ? false : { opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.45 }} transition={{ duration: 0.42 }} className="text-center mb-12 sm:mb-16 lg:mb-20">
            <h2 className="text-[26px] sm:text-[36px] md:text-[48px] font-semibold tracking-tight mb-4 text-foreground leading-none">A seamless workflow engine.</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-[17px] tracking-tight">The definitive UGC creator management system. Outputs automatically become inputs.</p>
          </motion.div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 lg:gap-6">
            <motion.div 
              id="idea-studio" aria-label="1-Click Viral Content Angle Generator"
              whileHover={reduceMotion ? undefined : { y: -5 }}
              transition={{ type: 'spring', stiffness: 320, damping: 24 }}
              className="os-glow-sweep sm:col-span-2 p-6 sm:p-8 lg:p-10 rounded-[20px] border border-border bg-card text-foreground shadow-sm hover:shadow-[0_18px_38px_rgba(124,58,237,0.12)] relative overflow-hidden group transition-shadow duration-300"
            >
              <Workflow className="h-8 w-8 mb-6 text-primary" strokeWidth={1.5} />
              <h3 className="text-[24px] font-semibold mb-3 tracking-tight">1. Idea Studio</h3>
              <p className="text-muted-foreground leading-relaxed max-w-md text-[15px] tracking-tight">Capture concepts and instantly generate variations with context-aware AI. Drop in a link, and watch the studio break it down into 10 viral angles.</p>
              <FeatureReviewSnippet review={ideaReview} />
            </motion.div>

            <motion.div 
              id="hook-engine" aria-label="3-Second Retention Optimizer & Hook Scoring"
              whileHover={reduceMotion ? undefined : { y: -5 }}
              transition={{ type: 'spring', stiffness: 320, damping: 24 }}
              className="os-glow-sweep p-6 sm:p-8 lg:p-10 rounded-[20px] border border-border bg-card text-foreground shadow-sm hover:shadow-[0_18px_38px_rgba(124,58,237,0.12)] relative overflow-hidden group transition-shadow duration-300"
            >
              <Zap className="h-8 w-8 mb-6 text-primary" strokeWidth={1.5} />
              <h3 className="text-[20px] font-semibold mb-3 tracking-tight">2. Hook Engine</h3>
              <p className="text-muted-foreground leading-relaxed text-[15px] tracking-tight">Learn exactly how to score video hooks before filming. Score and optimize hooks against top performing historical data. A powerful VidIQ hook alternative.</p>
            </motion.div>

            <motion.div 
              id="caption-os" aria-label="Multi-Platform SEO Caption Writer"
              whileHover={reduceMotion ? undefined : { y: -5 }}
              transition={{ type: 'spring', stiffness: 320, damping: 24 }}
              className="os-glow-sweep p-6 sm:p-8 lg:p-10 rounded-[20px] border border-border bg-card text-foreground shadow-sm hover:shadow-[0_18px_38px_rgba(124,58,237,0.12)] relative overflow-hidden group transition-shadow duration-300"
            >
              <PenTool className="h-8 w-8 mb-6 text-primary" strokeWidth={1.5} />
              <h3 className="text-[20px] font-semibold mb-3 tracking-tight">3. Caption OS</h3>
              <p className="text-muted-foreground leading-relaxed text-[15px] tracking-tight">Platform-specific SEO captions generated instantly from your winning hooks. Your Opus Clip companion workflow.</p>
            </motion.div>

            <motion.div 
              id="campaign-os" aria-label="Kanban Short-Form Clip Pipeline"
              whileHover={reduceMotion ? undefined : { y: -5 }}
              transition={{ type: 'spring', stiffness: 320, damping: 24 }}
              className="os-glow-sweep md:col-span-2 p-10 rounded-[20px] border border-border bg-card text-foreground shadow-sm hover:shadow-[0_18px_38px_rgba(124,58,237,0.12)] relative overflow-hidden group transition-shadow duration-300"
            >
              <BarChart className="h-8 w-8 mb-6 text-primary" strokeWidth={1.5} />
              <h3 className="text-[24px] font-semibold mb-3 tracking-tight">4. Campaign Center</h3>
              <p className="text-muted-foreground leading-relaxed max-w-md text-[15px] tracking-tight">Plan launches, track production across your entire freelance video clipper pipeline, and review automated analytics all in one beautiful kanban board. The TubeBuddy alternative 2026.</p>
              <FeatureReviewSnippet review={campaignReview} />
            </motion.div>
          </div>
        </div>
      </section>

      <section className="relative px-4 py-16 sm:px-6 sm:py-24 lg:py-28">
        <div className="mx-auto max-w-6xl">
          <div className="mb-10 max-w-xl sm:mb-14">
            <p className="mb-3 text-[11px] font-semibold tracking-[0.16em] text-primary">ONE OPERATING RHYTHM</p>
            <h2 className="text-[30px] font-semibold leading-[1.08] tracking-[-0.04em] sm:text-[44px]">From a raw idea to a repeatable system.</h2>
            <p className="mt-4 text-[15px] leading-relaxed text-muted-foreground">Creator OS keeps the work moving forward, so you can focus on the decisions that make your content distinct. The best content planner for TikTok clippers.</p>
          </div>
          <div className="grid gap-3 md:grid-cols-4">
            {[
              { number: '01', title: 'Find the angle', copy: 'Capture an idea or use Idea Studio to create a focused starting point.', icon: Sparkles },
              { number: '02', title: 'Build the asset', copy: 'Turn the angle into hooks, captions, and a production-ready storyboard.', icon: PenTool },
              { number: '03', title: 'Run the workflow', copy: 'Organize related content in Campaign OS and move it through the pipeline.', icon: Layers3 },
              { number: '04', title: 'Learn and repeat', copy: 'Use analytics and history to decide what the next piece should improve.', icon: BarChart },
            ].map((step, index) => <motion.article key={step.number} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.3 }} transition={{ duration: 0.35, delay: index * 0.05 }} className="rounded-[18px] border border-border bg-card p-5 sm:p-6">
              <div className="flex items-center justify-between"><span className="text-[11px] font-semibold tracking-[0.14em] text-primary">{step.number}</span><step.icon className="h-4 w-4 text-muted-foreground" /></div>
              <h3 className="mt-8 text-[17px] font-semibold tracking-tight">{step.title}</h3><p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">{step.copy}</p>
            </motion.article>)}
          </div>
        </div>
      </section>

      <ComparisonMatrix />
      <FAQSection />

      <section id="pricing" aria-label="Creator ($29), Pro ($49), and Agency ($149) Tiers" className="relative px-4 pb-20 sm:px-6 sm:pb-28">
        <div className="mx-auto max-w-6xl overflow-hidden rounded-[24px] border border-primary/25 bg-[radial-gradient(ellipse_70%_120%_at_50%_0%,rgba(124,58,237,.15),transparent_65%)] bg-card px-6 py-12 text-center sm:px-12 sm:py-16">
          <PlayCircle className="mx-auto h-6 w-6 text-primary" aria-hidden="true" />
          <h2 className="mx-auto mt-5 max-w-2xl text-[30px] font-semibold leading-[1.08] tracking-[-0.04em] sm:text-[46px]">Build the system behind your next level of content.</h2>
          <p className="mx-auto mt-4 max-w-xl text-[15px] leading-relaxed text-muted-foreground">Start with the workflow you use today. Scale only when your short-form video editor software needs it.</p>
          <PricingTrustSnippet review={pricingReview} />
          <Link to="/pricing" className="mt-8 inline-flex"><Button size="lg" className="h-12 rounded-[12px] px-7 text-[14px]">Explore Creator OS <ArrowRight className="h-4 w-4" /></Button></Link>
        </div>
      </section>
    </div>
  );
}
