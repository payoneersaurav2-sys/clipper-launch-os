import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Shield, Users, Layers, Zap, Folder, LayoutGrid } from 'lucide-react';
import { Button } from '@/components/ui/button';


const features = [
  {
    name: 'Multi-Client Environment Isolation',
    description: 'Keep client data strictly separated. Seamlessly switch between brands without mixing context or content.',
    icon: Shield,
  },
  {
    name: 'Brand Profiles',
    description: 'Define unique voice, tone, and platform-specific rules for every client you manage.',
    icon: Users,
  },
  {
    name: 'Client-Scoped Knowledge Vault',
    description: 'Store facts, links, and documents mapped specifically to each client. AI never hallucinates data across brands.',
    icon: Layers,
  },
  {
    name: 'Client-Aware AI Context',
    description: 'When generating hooks or campaigns, the AI automatically inherits the active client\'s Brand Profile and Knowledge.',
    icon: Zap,
  },
  {
    name: 'Team Roles & Permissions',
    description: 'Invite your team and control who can access which client workspaces. Perfect for scaling your operations.',
    icon: Folder,
  },
  {
    name: 'Campaign & Content Workflows',
    description: 'Plan out multi-platform campaigns and track clip production natively inside each client\'s isolated workspace.',
    icon: LayoutGrid,
  },
];

export default function ForAgenciesPage() {
  useEffect(() => {
    document.title = 'For Agencies | Creator OS';
  }, []);
  return (
    <>
      
      
      <div className="flex flex-col min-h-[calc(100vh-80px)]">
        {/* Hero Section */}
        <section className="relative px-4 pt-24 sm:pt-32 pb-16 sm:pb-24 lg:pb-32 overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(124,58,237,0.15),transparent_50%)] pointer-events-none" />
          
          <div className="max-w-4xl mx-auto text-center relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold uppercase tracking-wider mb-8">
                <Shield className="w-3.5 h-3.5" />
                Agency HQ
              </div>
              
              <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold tracking-tight text-white mb-6">
                Scale your agency with <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-400">client-scoped AI</span>
              </h1>
              
              <p className="text-lg sm:text-xl text-zinc-400 mb-10 max-w-2xl mx-auto leading-relaxed">
                Stop mixing client contexts in ChatGPT. Manage multiple brands, isolate knowledge vaults, and invite your team to a unified production OS.
              </p>
              
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link to="/pricing">
                  <Button className="h-12 px-8 rounded-xl bg-primary text-white hover:bg-primary/90 shadow-[0_0_20px_rgba(124,58,237,0.3)] transition-all text-base font-medium">
                    View Agency Plan
                  </Button>
                </Link>
                <Link to="/login?mode=signup">
                  <Button variant="outline" className="h-12 px-8 rounded-xl border-zinc-800 bg-transparent hover:bg-white/5 text-white transition-all text-base font-medium">
                    Start Building
                  </Button>
                </Link>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Feature Grid */}
        <section className="px-4 py-16 sm:py-24 border-t border-white/5 bg-[#0A0A0A]">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-white tracking-tight mb-4">Built for multi-brand operations</h2>
              <p className="text-zinc-400">Everything you need to deliver content for dozens of clients at scale.</p>
            </div>
            
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
              {features.map((feature, i) => (
                <motion.div
                  key={feature.name}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  className="bg-[#111111] border border-white/5 p-8 rounded-2xl hover:border-primary/30 transition-colors group"
                >
                  <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <feature.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-3">{feature.name}</h3>
                  <p className="text-sm text-zinc-400 leading-relaxed">{feature.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Bottom CTA */}
        <section className="px-4 py-24 border-t border-white/5 relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(124,58,237,0.1),transparent_50%)] pointer-events-none" />
          <div className="max-w-3xl mx-auto text-center relative z-10">
            <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight mb-6">Ready to upgrade your workflow?</h2>
            <p className="text-zinc-400 mb-10 text-lg">Join the agencies already scaling their content production with Creator OS.</p>
            <Link to="/pricing">
              <Button className="h-12 px-8 rounded-xl bg-primary text-white hover:bg-primary/90 shadow-[0_0_20px_rgba(124,58,237,0.3)] transition-all text-base font-medium">
                Get Started with Agency
              </Button>
            </Link>
          </div>
        </section>
      </div>
    </>
  );
}
