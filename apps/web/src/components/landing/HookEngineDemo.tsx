import { motion } from 'framer-motion';
import { ArrowRight, Play, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useReducedMotion } from 'framer-motion';

export function HookEngineDemo() {
  const reduceMotion = useReducedMotion();

  return (
    <section id="hook-engine-demo" className="relative overflow-hidden bg-[#030303] px-4 py-20 sm:px-6 sm:py-28 lg:py-32 border-y border-white/[0.04]">
      {/* Background ambient glow */}
      <div className="pointer-events-none absolute left-1/2 top-1/4 -z-10 -translate-x-1/2 -translate-y-1/2 h-[400px] w-[600px] rounded-full bg-primary/10 blur-[100px]" />

      <div className="mx-auto max-w-6xl">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-8 items-center">
          
          <motion.div 
            initial={reduceMotion ? false : { opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col items-start text-left"
          >
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
            
            <Link to="/login?mode=signup">
              <Button size="lg" className="h-12 rounded-[12px] px-8 bg-primary hover:bg-primary/90 text-white font-medium text-[15px] shadow-[0_0_24px_rgba(124,58,237,0.4)] hover:shadow-[0_0_32px_rgba(124,58,237,0.6)] transition-all duration-300">
                Try Hook Engine Free
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </motion.div>

          <motion.div 
            initial={reduceMotion ? false : { opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="relative"
          >
            <div className="relative overflow-hidden rounded-[24px] border border-white/[0.08] bg-[#0A0A0A] shadow-2xl aspect-video w-full group">
              {/* Fallback state when video is missing */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 bg-gradient-to-br from-white/[0.02] to-transparent">
                <Play className="h-12 w-12 text-white/20 mb-4" />
                <p className="text-white/40 text-sm font-medium">Hook Engine Demo Recording</p>
                <p className="text-white/30 text-xs mt-1 max-w-xs">
                  (Video asset placeholder. Replace src with actual product screen recording in public directory)
                </p>
              </div>

              {/* The real video tag */}
              <video 
                src="/demo/hook-engine-demo.mp4" 
                className="absolute inset-0 w-full h-full object-cover z-10"
                autoPlay 
                muted 
                loop 
                playsInline
                aria-label="Hook Engine analyzing and rewriting a hook"
              />
              
              {/* Premium glass edge overlay */}
              <div className="absolute inset-0 rounded-[24px] ring-1 ring-inset ring-white/10 pointer-events-none z-20" />
            </div>
            
            {/* Decorative background glow behind video */}
            <div className="absolute -inset-1 bg-gradient-to-tr from-primary/30 to-blue-500/30 rounded-[24px] blur-xl opacity-30 -z-10 group-hover:opacity-50 transition-opacity duration-500" />
          </motion.div>

        </div>
      </div>
    </section>
  );
}
