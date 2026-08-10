import { Button } from '@/components/ui/button';
import { ArrowRight, Sparkles, Workflow, Zap, BarChart, PenTool, Layers3, PlayCircle } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function LandingPage() {
  const reduceMotion = useReducedMotion();
  const navigate = useNavigate();

  useEffect(() => {
    const remembered = localStorage.getItem('creator_os_remember_me') === 'true';
    if (!remembered) return;

    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) navigate('/dashboard');
    })();
  }, [navigate]);

  return (
    <div className="flex flex-col min-h-screen relative overflow-hidden bg-[#080808] font-sans text-[#FAFAFA]">
      
      {/* Dynamic Background - Extremely subtle for premium feel */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />
      <motion.div aria-hidden="true" animate={reduceMotion ? undefined : { x: [0, 18, 0], y: [0, -10, 0], opacity: [0.32, 0.62, 0.32] }} transition={{ duration: 12, ease: 'easeInOut', repeat: Infinity }} className="pointer-events-none absolute -top-40 left-1/2 h-[430px] w-[680px] -translate-x-1/2 rounded-full bg-primary/15 blur-[110px]" />
      
      {/* Hero Section */}
      <section className="relative flex flex-col items-center justify-center text-center px-4 pt-24 sm:pt-32 md:pt-40 pb-16 sm:pb-24 md:pb-32">
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="inline-flex items-center rounded-full border border-white/[0.06] bg-[#111111] px-3 py-1 text-[13px] font-medium mb-8 backdrop-blur-md"
        >
          <Sparkles className="h-[14px] w-[14px] mr-2 text-primary" />
          <span className="text-[#A1A1AA]">The operating system for modern creators.</span>
        </motion.div>
        
        <motion.h1 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
          className="text-[36px] sm:text-[52px] md:text-[72px] lg:text-[84px] font-semibold tracking-tighter max-w-5xl mb-6 text-[#FAFAFA] leading-[1.05]"
        >
          Build your audience.<br />
          <span className="text-primary">
            Engineer your growth.
          </span>
        </motion.h1>
        
        <motion.p 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" }}
          className="text-[15px] sm:text-[17px] md:text-[19px] text-[#A1A1AA] max-w-2xl mb-8 sm:mb-10 leading-relaxed tracking-tight"
        >
          Creator OS is the definitive workspace for digital empires. 
          Stop juggling disconnected tools and start operating from a single source of truth.
        </motion.p>
        
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3, ease: "easeOut" }}
          className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto"
        >
          <Link to="/pricing" className="w-full sm:w-auto">
            <Button size="lg" className="w-full h-12 rounded-[12px] px-8 text-[15px] font-medium bg-primary text-white hover:bg-primary/90 shadow-[0_0_20px_rgba(124,58,237,0.3)] hover:shadow-[0_0_30px_rgba(124,58,237,0.5)] transition-all duration-300">
              Explore Plans <ArrowRight className="ml-2 h-[16px] w-[16px]" />
            </Button>
          </Link>
          <a href="/login" className="w-full sm:w-auto">
            <Button variant="outline" size="lg" className="w-full h-12 rounded-[12px] px-8 text-[15px] font-medium bg-[#111111] border border-white/[0.06] text-[#FAFAFA] hover:bg-white/[0.03] transition-all duration-300">
              Sign In
            </Button>
          </a>
        </motion.div>
      </section>

      <section className="relative border-y border-white/[0.06] bg-[#0B0B0B]/80 px-4 py-5 sm:px-6 sm:py-6">
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-4 text-center sm:grid-cols-3 sm:gap-0 sm:divide-x sm:divide-white/[0.06]">
          {[['One connected workflow', 'Ideas, campaigns, production, and iteration.'], ['Built for short-form', 'Hooks, captions, storyboards, and pipeline clarity.'], ['Move with context', 'Every output stays connected to the next action.']].map(([title, copy], index) => (
            <motion.div key={title} initial={reduceMotion ? false : { opacity: 0, y: 8 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.7 }} transition={{ duration: 0.32, delay: index * 0.07 }} className="px-4 py-1"><p className="text-[13px] font-medium text-[#FAFAFA]">{title}</p><p className="mt-1 text-[12px] text-[#71717A]">{copy}</p></motion.div>
          ))}
        </div>
      </section>

      {/* Workflow Bento Grid */}
      <section id="features" className="py-16 sm:py-20 lg:py-24 px-4 bg-[#080808] relative z-10">
        <div className="max-w-6xl mx-auto">
          <motion.div initial={reduceMotion ? false : { opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.45 }} transition={{ duration: 0.42 }} className="text-center mb-12 sm:mb-16 lg:mb-20">
            <h2 className="text-[26px] sm:text-[36px] md:text-[48px] font-semibold tracking-tight mb-4 text-[#FAFAFA] leading-none">A seamless workflow engine.</h2>
            <p className="text-[#A1A1AA] max-w-2xl mx-auto text-[17px] tracking-tight">Outputs automatically become inputs. No manual transfer. Everything is connected.</p>
          </motion.div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 lg:gap-6">
            <motion.div 
              whileHover={reduceMotion ? undefined : { y: -5 }}
              transition={{ type: 'spring', stiffness: 320, damping: 24 }}
              className="os-glow-sweep sm:col-span-2 p-6 sm:p-8 lg:p-10 rounded-[20px] border border-white/[0.06] bg-[#111111] text-[#FAFAFA] shadow-sm hover:shadow-[0_18px_38px_rgba(124,58,237,0.12)] relative overflow-hidden group transition-shadow duration-300"
            >
              <Workflow className="h-8 w-8 mb-6 text-primary" strokeWidth={1.5} />
              <h3 className="text-[24px] font-semibold mb-3 tracking-tight">1. Idea Studio</h3>
              <p className="text-[#A1A1AA] leading-relaxed max-w-md text-[15px] tracking-tight">Capture concepts and instantly generate variations with context-aware AI. Drop in a link, and watch the studio break it down into 10 viral angles.</p>
            </motion.div>

            <motion.div 
              whileHover={reduceMotion ? undefined : { y: -5 }}
              transition={{ type: 'spring', stiffness: 320, damping: 24 }}
              className="os-glow-sweep p-6 sm:p-8 lg:p-10 rounded-[20px] border border-white/[0.06] bg-[#111111] text-[#FAFAFA] shadow-sm hover:shadow-[0_18px_38px_rgba(124,58,237,0.12)] relative overflow-hidden group transition-shadow duration-300"
            >
              <Zap className="h-8 w-8 mb-6 text-primary" strokeWidth={1.5} />
              <h3 className="text-[20px] font-semibold mb-3 tracking-tight">2. Hook Engine</h3>
              <p className="text-[#A1A1AA] leading-relaxed text-[15px] tracking-tight">Score and optimize hooks against top performing historical data. Never post a weak first 3 seconds again.</p>
            </motion.div>

            <motion.div 
              whileHover={reduceMotion ? undefined : { y: -5 }}
              transition={{ type: 'spring', stiffness: 320, damping: 24 }}
              className="os-glow-sweep p-6 sm:p-8 lg:p-10 rounded-[20px] border border-white/[0.06] bg-[#111111] text-[#FAFAFA] shadow-sm hover:shadow-[0_18px_38px_rgba(124,58,237,0.12)] relative overflow-hidden group transition-shadow duration-300"
            >
              <PenTool className="h-8 w-8 mb-6 text-primary" strokeWidth={1.5} />
              <h3 className="text-[20px] font-semibold mb-3 tracking-tight">3. Caption OS</h3>
              <p className="text-[#A1A1AA] leading-relaxed text-[15px] tracking-tight">Platform-specific SEO captions generated instantly from your winning hooks.</p>
            </motion.div>

            <motion.div 
              whileHover={reduceMotion ? undefined : { y: -5 }}
              transition={{ type: 'spring', stiffness: 320, damping: 24 }}
              className="os-glow-sweep md:col-span-2 p-10 rounded-[20px] border border-white/[0.06] bg-[#111111] text-[#FAFAFA] shadow-sm hover:shadow-[0_18px_38px_rgba(124,58,237,0.12)] relative overflow-hidden group transition-shadow duration-300"
            >
              <BarChart className="h-8 w-8 mb-6 text-primary" strokeWidth={1.5} />
              <h3 className="text-[24px] font-semibold mb-3 tracking-tight">4. Campaign Center</h3>
              <p className="text-[#A1A1AA] leading-relaxed max-w-md text-[15px] tracking-tight">Plan 7-day launches, track production across your entire team, and review automated analytics all in one beautiful kanban board.</p>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="relative px-4 py-16 sm:px-6 sm:py-24 lg:py-28">
        <div className="mx-auto max-w-6xl">
          <div className="mb-10 max-w-xl sm:mb-14">
            <p className="mb-3 text-[11px] font-semibold tracking-[0.16em] text-primary">ONE OPERATING RHYTHM</p>
            <h2 className="text-[30px] font-semibold leading-[1.08] tracking-[-0.04em] sm:text-[44px]">From a raw idea to a repeatable system.</h2>
            <p className="mt-4 text-[15px] leading-relaxed text-[#A1A1AA]">Creator OS keeps the work moving forward, so you can focus on the decisions that make your content distinct.</p>
          </div>
          <div className="grid gap-3 md:grid-cols-4">
            {[
              { number: '01', title: 'Find the angle', copy: 'Capture an idea or use Idea Studio to create a focused starting point.', icon: Sparkles },
              { number: '02', title: 'Build the asset', copy: 'Turn the angle into hooks, captions, and a production-ready storyboard.', icon: PenTool },
              { number: '03', title: 'Run the workflow', copy: 'Organize related content in Campaign OS and move it through the pipeline.', icon: Layers3 },
              { number: '04', title: 'Learn and repeat', copy: 'Use analytics and history to decide what the next piece should improve.', icon: BarChart },
            ].map((step, index) => <motion.article key={step.number} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.3 }} transition={{ duration: 0.35, delay: index * 0.05 }} className="rounded-[18px] border border-white/[0.07] bg-[#111111] p-5 sm:p-6">
              <div className="flex items-center justify-between"><span className="text-[11px] font-semibold tracking-[0.14em] text-primary">{step.number}</span><step.icon className="h-4 w-4 text-[#71717A]" /></div>
              <h3 className="mt-8 text-[17px] font-semibold tracking-tight">{step.title}</h3><p className="mt-2 text-[13px] leading-relaxed text-[#71717A]">{step.copy}</p>
            </motion.article>)}
          </div>
        </div>
      </section>

      <section className="relative px-4 pb-20 sm:px-6 sm:pb-28">
        <div className="mx-auto max-w-6xl overflow-hidden rounded-[24px] border border-primary/25 bg-[radial-gradient(ellipse_70%_120%_at_50%_0%,rgba(124,58,237,.24),transparent_65%),#111111] px-6 py-12 text-center sm:px-12 sm:py-16">
          <PlayCircle className="mx-auto h-6 w-6 text-primary" aria-hidden="true" />
          <h2 className="mx-auto mt-5 max-w-2xl text-[30px] font-semibold leading-[1.08] tracking-[-0.04em] sm:text-[46px]">Build the system behind your next level of content.</h2>
          <p className="mx-auto mt-4 max-w-xl text-[15px] leading-relaxed text-[#A1A1AA]">Start with the workflow you use today. Scale only when your operation calls for it.</p>
          <Link to="/pricing" className="mt-8 inline-flex"><Button size="lg" className="h-12 rounded-[12px] px-7 text-[14px]">Explore Creator OS <ArrowRight className="h-4 w-4" /></Button></Link>
        </div>
      </section>
    </div>
  );
}
