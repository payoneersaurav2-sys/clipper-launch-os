import { Button } from '@/components/ui/button';
import { ArrowRight, Sparkles, Workflow, Zap, BarChart, PenTool } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen relative overflow-hidden bg-[#080808] font-sans text-[#FAFAFA]">
      
      {/* Dynamic Background - Extremely subtle for premium feel */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />
      
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

      {/* Workflow Bento Grid */}
      <section id="features" className="py-16 sm:py-20 lg:py-24 px-4 bg-[#080808] relative z-10">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12 sm:mb-16 lg:mb-20">
            <h2 className="text-[26px] sm:text-[36px] md:text-[48px] font-semibold tracking-tight mb-4 text-[#FAFAFA] leading-none">A seamless workflow engine.</h2>
            <p className="text-[#A1A1AA] max-w-2xl mx-auto text-[17px] tracking-tight">Outputs automatically become inputs. No manual transfer. Everything is connected.</p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 lg:gap-6">
            <motion.div 
              whileHover={{ scale: 0.99, y: -2 }}
              className="sm:col-span-2 p-6 sm:p-8 lg:p-10 rounded-[20px] border border-white/[0.06] bg-[#111111] text-[#FAFAFA] shadow-sm relative overflow-hidden group transition-all duration-300"
            >
              <Workflow className="h-8 w-8 mb-6 text-primary" strokeWidth={1.5} />
              <h3 className="text-[24px] font-semibold mb-3 tracking-tight">1. Idea Studio</h3>
              <p className="text-[#A1A1AA] leading-relaxed max-w-md text-[15px] tracking-tight">Capture concepts and instantly generate variations with context-aware AI. Drop in a link, and watch the studio break it down into 10 viral angles.</p>
            </motion.div>

            <motion.div 
              whileHover={{ scale: 0.99, y: -2 }}
              className="p-6 sm:p-8 lg:p-10 rounded-[20px] border border-white/[0.06] bg-[#111111] text-[#FAFAFA] shadow-sm relative overflow-hidden group transition-all duration-300"
            >
              <Zap className="h-8 w-8 mb-6 text-primary" strokeWidth={1.5} />
              <h3 className="text-[20px] font-semibold mb-3 tracking-tight">2. Hook Engine</h3>
              <p className="text-[#A1A1AA] leading-relaxed text-[15px] tracking-tight">Score and optimize hooks against top performing historical data. Never post a weak first 3 seconds again.</p>
            </motion.div>

            <motion.div 
              whileHover={{ scale: 0.99, y: -2 }}
              className="p-6 sm:p-8 lg:p-10 rounded-[20px] border border-white/[0.06] bg-[#111111] text-[#FAFAFA] shadow-sm relative overflow-hidden group transition-all duration-300"
            >
              <PenTool className="h-8 w-8 mb-6 text-primary" strokeWidth={1.5} />
              <h3 className="text-[20px] font-semibold mb-3 tracking-tight">3. Caption OS</h3>
              <p className="text-[#A1A1AA] leading-relaxed text-[15px] tracking-tight">Platform-specific SEO captions generated instantly from your winning hooks.</p>
            </motion.div>

            <motion.div 
              whileHover={{ scale: 0.99, y: -2 }}
              className="md:col-span-2 p-10 rounded-[20px] border border-white/[0.06] bg-[#111111] text-[#FAFAFA] shadow-sm relative overflow-hidden group transition-all duration-300"
            >
              <BarChart className="h-8 w-8 mb-6 text-primary" strokeWidth={1.5} />
              <h3 className="text-[24px] font-semibold mb-3 tracking-tight">4. Campaign Center</h3>
              <p className="text-[#A1A1AA] leading-relaxed max-w-md text-[15px] tracking-tight">Plan 7-day launches, track production across your entire team, and review automated analytics all in one beautiful kanban board.</p>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
}
