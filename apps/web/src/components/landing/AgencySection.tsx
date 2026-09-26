import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, Layers, Users, Database, Sparkles, FolderKanban, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FeatureReviewSnippet } from './TrustElements';
import { useApprovedReviews } from '@/hooks/useReviews';
import { pricingPlans } from '@/lib/pricing';
import { useCheckout } from '@/hooks/useCheckout';

export function AgencySection() {
  const reduceMotion = useReducedMotion();
  const { data: reviews } = useApprovedReviews();
  const agencyReview = reviews?.find(r => r.review_text.toLowerCase().includes('client') || r.review_text.toLowerCase().includes('agency')) || reviews?.[0];
  
  const agencyPlan = pricingPlans.find(p => p.id === 'agency');
  const { beginCheckout } = useCheckout();

  return (
    <section id="agency-workflow" className="py-20 sm:py-28 px-4 relative z-10 bg-[#080808] border-t border-white/[0.04] border-b overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-primary/20 blur-[120px] rounded-full pointer-events-none opacity-50" />
      
      <div className="max-w-6xl mx-auto relative">
        <motion.div 
          initial={reduceMotion ? false : { opacity: 0, y: 12 }} 
          whileInView={{ opacity: 1, y: 0 }} 
          viewport={{ once: true, amount: 0.4 }} 
          transition={{ duration: 0.5 }}
          className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center"
        >
          {/* Left Content */}
          <div className="space-y-8">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold uppercase tracking-wider mb-6 border border-primary/20">
                <Users className="w-3.5 h-3.5" />
                For Agencies
              </div>
              <h2 className="text-[32px] sm:text-[42px] font-semibold tracking-tight text-white leading-[1.1] mb-6">
                Run every client from one operating system.
              </h2>
              <p className="text-zinc-400 text-[17px] leading-relaxed max-w-lg">
                Keep each brand's knowledge, content, campaigns, and AI context organized inside one workspace. Stop mixing client data in generic AI tools.
              </p>
            </div>
            
            <ul className="space-y-4">
              {[
                { icon: Layers, text: 'Client-scoped workspaces & Brand Profiles' },
                { icon: Database, text: 'Isolated Multi-Client Knowledge Vaults' },
                { icon: Sparkles, text: 'Client-aware AI context engine' },
                { icon: Users, text: 'Team roles & explicitly assigned permissions' },
                { icon: FolderKanban, text: 'Separated campaign & content operations' }
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <span className="text-zinc-300 text-[15px]">{item.text}</span>
                </li>
              ))}
            </ul>

            {agencyReview && (
              <div className="pt-2 border-t border-white/5">
                <FeatureReviewSnippet review={agencyReview} />
              </div>
            )}

            <div className="flex flex-wrap items-center gap-6 pt-4">
              {agencyPlan && (
                <Button 
                  size="lg" 
                  onClick={() => beginCheckout(agencyPlan.checkout['monthly'].url)}
                  className="h-12 px-8 text-sm font-medium bg-primary text-white hover:bg-primary/90 shadow-[0_0_24px_rgba(124,58,237,0.4)] hover:shadow-[0_0_32px_rgba(124,58,237,0.6)] transition-all duration-300"
                >
                  Start with Agency <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              )}
              {agencyPlan && (
                <div className="flex flex-col">
                  <span className="text-white font-semibold">${agencyPlan.monthlyPrice}/month</span>
                  {agencyPlan.annualPrice && (
                    <span className="text-zinc-500 text-xs">or ${Math.round(agencyPlan.annualPrice / 12)}/mo billed annually</span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right Visual Workflow */}
          <div className="relative hidden sm:block">
            <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 to-transparent rounded-2xl blur-xl" />
            <div className="relative bg-[#111111] border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl">
              <div className="flex items-center justify-between mb-8 pb-6 border-b border-white/5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center">
                    <span className="font-bold text-white text-lg">HQ</span>
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-white">Agency HQ</div>
                    <div className="text-xs text-zinc-500">Master Overview</div>
                  </div>
                </div>
                <div className="px-3 py-1 rounded bg-white/5 text-zinc-400 text-xs border border-white/10 flex items-center gap-1">
                  <Users className="w-3 h-3" /> Team Access
                </div>
              </div>

              <div className="space-y-4">
                {/* Client A */}
                <div className="bg-[#161616] border border-primary/20 rounded-xl p-4 relative overflow-hidden group">
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-white">Client: Apex Tech</span>
                    <span className="text-[10px] uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded">Active Workspace</span>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    <div className="bg-black/30 rounded p-2 text-center border border-white/5"><div className="text-xs text-zinc-300">Profile</div></div>
                    <div className="bg-black/30 rounded p-2 text-center border border-white/5"><div className="text-xs text-zinc-300">Knowledge</div></div>
                    <div className="bg-primary/5 rounded p-2 text-center border border-primary/10"><div className="text-xs text-primary flex items-center justify-center gap-1"><Sparkles className="w-3 h-3"/> AI Context</div></div>
                    <div className="bg-black/30 rounded p-2 text-center border border-white/5"><div className="text-xs text-zinc-300">Campaigns</div></div>
                  </div>
                </div>

                {/* Client B */}
                <div className="bg-[#0c0c0c] border border-white/5 rounded-xl p-4 opacity-75">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-zinc-400">Client: Lumina Skincare</span>
                  </div>
                  <div className="grid grid-cols-4 gap-2 opacity-60">
                    <div className="bg-black/30 rounded p-2 text-center"><div className="text-xs text-zinc-500">Profile</div></div>
                    <div className="bg-black/30 rounded p-2 text-center"><div className="text-xs text-zinc-500">Knowledge</div></div>
                    <div className="bg-black/30 rounded p-2 text-center"><div className="text-xs text-zinc-500">AI Context</div></div>
                    <div className="bg-black/30 rounded p-2 text-center"><div className="text-xs text-zinc-500">Campaigns</div></div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
