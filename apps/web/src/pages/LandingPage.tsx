import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRight, Sparkles, Workflow, Zap, Play, BarChart, PenTool } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen relative overflow-hidden bg-background">
      {/* Dynamic Background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />
      
      {/* Hero Section */}
      <section className="relative flex flex-col items-center justify-center text-center px-4 pt-40 pb-32">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-sm font-medium mb-8 backdrop-blur-md"
        >
          <Sparkles className="h-4 w-4 mr-2 text-primary" />
          <span className="text-primary">The definitive clipping OS is here</span>
        </motion.div>
        
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tighter max-w-5xl mb-6 text-foreground leading-[1.1]"
        >
          Don't just edit clips.<br />
          <span className="bg-gradient-to-r from-primary to-primary/50 bg-clip-text text-transparent">
            Orchestrate them.
          </span>
        </motion.h1>
        
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-lg md:text-xl text-muted-foreground max-w-2xl mb-10 leading-relaxed"
        >
          Clipper Launch OS is the premium workspace for creators entering the clipping economy. 
          Stop copy-pasting between random AI tools and start using a cohesive workflow engine.
        </motion.p>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto"
        >
          <Link to="/signup" className="w-full sm:w-auto">
            <Button size="lg" className="w-full h-12 px-8 text-base shadow-[0_0_40px_-10px_rgba(255,255,255,0.3)] hover:shadow-[0_0_60px_-15px_rgba(255,255,255,0.5)] transition-all">
              Start Free Trial <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
          <Link to="/login" className="w-full sm:w-auto">
            <Button variant="outline" size="lg" className="w-full h-12 px-8 text-base bg-background/50 backdrop-blur-md">
              Sign In
            </Button>
          </Link>
        </motion.div>
      </section>

      {/* Workflow Bento Grid */}
      <section className="py-24 px-4 bg-background relative z-10">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">A seamless workflow engine.</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg">Outputs automatically become inputs. No manual transfer. Everything is connected.</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            <motion.div 
              whileHover={{ y: -5 }}
              className="md:col-span-2 p-8 rounded-3xl border border-border/50 bg-gradient-to-br from-card to-card/50 text-card-foreground shadow-sm relative overflow-hidden group"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <Workflow className="h-10 w-10 mb-6 text-primary" />
              <h3 className="text-2xl font-bold mb-3 tracking-tight">1. Idea Studio</h3>
              <p className="text-muted-foreground leading-relaxed max-w-md">Capture concepts and instantly generate variations with context-aware AI. Drop in a link, and watch the studio break it down into 10 viral angles.</p>
            </motion.div>

            <motion.div 
              whileHover={{ y: -5 }}
              className="p-8 rounded-3xl border border-border/50 bg-gradient-to-br from-card to-card/50 text-card-foreground shadow-sm relative overflow-hidden group"
            >
               <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <Zap className="h-10 w-10 mb-6 text-primary" />
              <h3 className="text-xl font-bold mb-3 tracking-tight">2. Hook Engine</h3>
              <p className="text-muted-foreground leading-relaxed">Score and optimize hooks against top performing historical data. Never post a weak first 3 seconds again.</p>
            </motion.div>

            <motion.div 
              whileHover={{ y: -5 }}
              className="p-8 rounded-3xl border border-border/50 bg-gradient-to-br from-card to-card/50 text-card-foreground shadow-sm relative overflow-hidden group"
            >
               <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <PenTool className="h-10 w-10 mb-6 text-primary" />
              <h3 className="text-xl font-bold mb-3 tracking-tight">3. Caption OS</h3>
              <p className="text-muted-foreground leading-relaxed">Platform-specific SEO captions generated instantly from your winning hooks.</p>
            </motion.div>

            <motion.div 
              whileHover={{ y: -5 }}
              className="md:col-span-2 p-8 rounded-3xl border border-border/50 bg-gradient-to-br from-card to-card/50 text-card-foreground shadow-sm relative overflow-hidden group"
            >
               <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <BarChart className="h-10 w-10 mb-6 text-primary" />
              <h3 className="text-2xl font-bold mb-3 tracking-tight">4. Campaign Center</h3>
              <p className="text-muted-foreground leading-relaxed max-w-md">Plan 7-day launches, track production across your entire team, and review automated analytics all in one beautiful kanban board.</p>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
}
