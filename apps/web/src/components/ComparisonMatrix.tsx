import { motion } from 'framer-motion';
import { Check, X, AlertTriangle } from 'lucide-react';

export function ComparisonMatrix() {
  return (
    <section id="comparison" aria-label="Spreadsheets vs. Generic AI vs. Creator OS Table" className="py-16 sm:py-24 px-4 bg-[#080808] relative z-10 text-[#FAFAFA]">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12 sm:mb-16">
          <h2 className="text-[30px] sm:text-[40px] font-semibold tracking-[-0.04em] mb-4 leading-none">Why Creator OS?</h2>
          <p className="text-[#A1A1AA] text-[16px] tracking-tight">See how we stack up against manual workflows and generic AI writers.</p>
        </div>
        
        <div className="overflow-x-auto rounded-[20px] border border-white/[0.08] bg-[#111111] shadow-2xl">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="border-b border-white/[0.08] bg-[#0A0A0A]">
                <th className="p-5 font-semibold text-[#FAFAFA] text-[15px] w-1/4">Feature</th>
                <th className="p-5 font-medium text-[#A1A1AA] text-[14px] w-1/4">Manual Spreadsheets & Notes</th>
                <th className="p-5 font-medium text-[#A1A1AA] text-[14px] w-1/4">Generic AI Writers</th>
                <th className="p-5 font-semibold text-primary text-[15px] w-1/4 border-l border-primary/20 bg-primary/5">Creator OS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              <tr className="hover:bg-white/[0.01] transition-colors">
                <td className="p-5 font-medium text-[14px]">3-Second Hook Retention Scoring</td>
                <td className="p-5 text-[14px] text-[#A1A1AA]"><span className="flex items-center gap-2"><X className="h-4 w-4 text-red-400" /> None</span></td>
                <td className="p-5 text-[14px] text-[#A1A1AA]"><span className="flex items-center gap-2"><X className="h-4 w-4 text-red-400" /> Basic text</span></td>
                <td className="p-5 text-[14px] font-medium border-l border-primary/20 bg-primary/5"><span className="flex items-center gap-2 text-emerald-400"><Check className="h-4 w-4" /> Real-time retention scoring</span></td>
              </tr>
              <tr className="hover:bg-white/[0.01] transition-colors">
                <td className="p-5 font-medium text-[14px]">Platform-Specific SEO Captions</td>
                <td className="p-5 text-[14px] text-[#A1A1AA]"><span className="flex items-center gap-2"><X className="h-4 w-4 text-red-400" /> Manual</span></td>
                <td className="p-5 text-[14px] text-[#A1A1AA]"><span className="flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-yellow-400" /> Basic format</span></td>
                <td className="p-5 text-[14px] font-medium border-l border-primary/20 bg-primary/5"><span className="flex items-center gap-2 text-emerald-400"><Check className="h-4 w-4" /> Native TikTok/Shorts SEO tags</span></td>
              </tr>
              <tr className="hover:bg-white/[0.01] transition-colors">
                <td className="p-5 font-medium text-[14px]">Visual Clip Production Pipeline</td>
                <td className="p-5 text-[14px] text-[#A1A1AA]"><span className="flex items-center gap-2"><X className="h-4 w-4 text-red-400" /> Disconnected</span></td>
                <td className="p-5 text-[14px] text-[#A1A1AA]"><span className="flex items-center gap-2"><X className="h-4 w-4 text-red-400" /> Not supported</span></td>
                <td className="p-5 text-[14px] font-medium border-l border-primary/20 bg-primary/5"><span className="flex items-center gap-2 text-emerald-400"><Check className="h-4 w-4" /> Built-in Kanban pipeline</span></td>
              </tr>
              <tr className="hover:bg-white/[0.01] transition-colors">
                <td className="p-5 font-medium text-[14px]">Multi-Brand Client Workspaces</td>
                <td className="p-5 text-[14px] text-[#A1A1AA]"><span className="flex items-center gap-2"><X className="h-4 w-4 text-red-400" /> High clutter</span></td>
                <td className="p-5 text-[14px] text-[#A1A1AA]"><span className="flex items-center gap-2"><X className="h-4 w-4 text-red-400" /> Single session</span></td>
                <td className="p-5 text-[14px] font-medium border-l border-primary/20 bg-primary/5"><span className="flex items-center gap-2 text-emerald-400"><Check className="h-4 w-4" /> Dedicated agency workspaces</span></td>
              </tr>
              <tr className="hover:bg-white/[0.01] transition-colors">
                <td className="p-5 font-medium text-[14px]">Idea-to-Batch Repurposing</td>
                <td className="p-5 text-[14px] text-[#A1A1AA]"><span className="flex items-center gap-2"><X className="h-4 w-4 text-red-400" /> 3+ hours</span></td>
                <td className="p-5 text-[14px] text-[#A1A1AA]"><span className="flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-yellow-400" /> Unstructured</span></td>
                <td className="p-5 text-[14px] font-medium border-l border-primary/20 bg-primary/5"><span className="flex items-center gap-2 text-emerald-400"><Check className="h-4 w-4" /> 1-click 10-angle generator</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
