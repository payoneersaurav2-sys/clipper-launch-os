import { useState } from 'react';
import { useClipIdeas } from '@/hooks/useClipIdeas';
import { useHooks } from '@/hooks/useHooks';
import { useAI } from '@/hooks/useAI';
import { useWorkspaceStore } from '@/stores/useWorkspaceStore';
import { useHistoryStore } from '@/stores/useHistoryStore';
import { buildAnalyticsReportPrompt } from '@/lib/ai-services';
import EmptyState from '@/components/EmptyState';
import { Button } from '@/components/ui/button';
import { Loader2, Sparkles, TrendingUp, TrendingDown, ChevronRight, Activity } from 'lucide-react';

export function Analytics() {
  const { activeWorkspace } = useWorkspaceStore();
  const { data: ideas } = useClipIdeas();
  const { data: hooks } = useHooks(ideas?.[0]?.id);
  const { generateJSON, isGenerating, error, clearError } = useAI();
  const totalTokens = useHistoryStore(s => s.getTotalTokens());
  const totalCost   = useHistoryStore(s => s.getTotalCost());
  const recordCount = useHistoryStore(s => s.records.length);
  const [report, setReport] = useState<any>(null);

  const ws = { id: activeWorkspace?.id ?? 'default', name: activeWorkspace?.name ?? 'Workspace' };

  const handleGenerate = async () => {
    clearError();
    const data = await generateJSON<any>(
      buildAnalyticsReportPrompt({
        workspaceId: ws.id, workspaceName: ws.name,
        recentIdeas: ideas?.slice(0, 5).map(i => i.title),
        recentHooks: hooks?.slice(0, 5).map(h => h.content),
        publishedCount: recordCount,
      }),
      { category: 'analytics', promptSummary: 'Performance analysis' }
    );
    setReport(data);
  };

  const priorityColor: Record<string, string> = {
    high: 'text-red-400 bg-red-400/10 border-red-400/20',
    medium: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
    low: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
  };

  return (
    <div className="space-y-8 max-w-5xl animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[26px] font-semibold tracking-tight text-[#FAFAFA]">Analytics</h2>
          <p className="text-[14px] text-[#71717A] mt-1">AI-powered performance analysis and recommendations.</p>
        </div>
        <Button onClick={handleGenerate} disabled={isGenerating}
          className="h-10 rounded-[12px] px-5 bg-primary text-white hover:bg-primary/90 shadow-[0_0_15px_rgba(124,58,237,0.3)]">
          {isGenerating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
          Analyse Workspace
        </Button>
      </div>

      {/* Token Usage Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Generations', value: recordCount },
          { label: 'Total Tokens Used', value: totalTokens.toLocaleString() },
          { label: 'Est. AI Cost', value: `$${totalCost.toFixed(4)}` },
        ].map(stat => (
          <div key={stat.label} className="p-5 rounded-[16px] bg-[#111111] border border-white/[0.06]">
            <Activity className="h-4 w-4 text-primary mb-3" />
            <p className="text-[22px] font-semibold tracking-tight text-[#FAFAFA]">{stat.value}</p>
            <p className="text-[12px] text-[#71717A] mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {error && <div className="p-4 rounded-[12px] bg-red-500/10 border border-red-500/20 text-[13px] text-red-400">{error}</div>}

      {isGenerating && (
        <div className="flex h-32 items-center justify-center gap-3 text-[#71717A]">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="text-[14px]">Analysing your workspace…</span>
        </div>
      )}

      {!report && !isGenerating && (
        <EmptyState title="No analysis yet" description="Click Analyse Workspace for an AI-generated performance report with specific next actions." actionLabel="Analyse Now" />
      )}

      {report && (
        <div className="space-y-5">
          {/* Summary */}
          <div className="p-6 rounded-[18px] bg-[#111111] border border-white/[0.06]">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[30px] font-bold text-primary">{report.overallScore}<span className="text-[18px] text-[#71717A]">/10</span></span>
              <div className="flex-1 h-1.5 bg-white/[0.06] rounded-full overflow-hidden ml-3">
                <div className="h-full bg-primary rounded-full" style={{ width: `${(report.overallScore / 10) * 100}%` }} />
              </div>
            </div>
            <p className="text-[14px] text-[#A1A1AA] leading-relaxed">{report.summary}</p>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {/* Strengths */}
            <div className="p-5 rounded-[16px] bg-[#111111] border border-white/[0.06]">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="h-4 w-4 text-emerald-400" />
                <p className="text-[12px] font-medium text-emerald-400 uppercase tracking-widest">Strengths</p>
              </div>
              <ul className="space-y-2.5">
                {report.strengths?.map((s: string, i: number) => (
                  <li key={i} className="text-[13px] text-[#A1A1AA] flex items-start gap-2">
                    <span className="text-emerald-400 shrink-0 mt-0.5">+</span>{s}
                  </li>
                ))}
              </ul>
            </div>
            {/* Weaknesses */}
            <div className="p-5 rounded-[16px] bg-[#111111] border border-white/[0.06]">
              <div className="flex items-center gap-2 mb-4">
                <TrendingDown className="h-4 w-4 text-red-400" />
                <p className="text-[12px] font-medium text-red-400 uppercase tracking-widest">Areas to Improve</p>
              </div>
              <ul className="space-y-2.5">
                {report.weaknesses?.map((w: string, i: number) => (
                  <li key={i} className="text-[13px] text-[#A1A1AA] flex items-start gap-2">
                    <span className="text-red-400 shrink-0 mt-0.5">−</span>{w}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Next Actions */}
          {report.nextActions?.length > 0 && (
            <div className="rounded-[18px] bg-[#111111] border border-white/[0.06] overflow-hidden">
              <div className="px-6 py-4 border-b border-white/[0.06]">
                <p className="text-[13px] font-medium text-[#A1A1AA]">Next Actions</p>
              </div>
              <div className="divide-y divide-white/[0.04]">
                {report.nextActions.map((a: any, i: number) => (
                  <div key={i} className="px-6 py-4 flex items-center gap-4 hover:bg-white/[0.02]">
                    <span className={`text-[11px] font-medium px-2.5 py-0.5 rounded-full border capitalize shrink-0 ${priorityColor[a.priority] ?? priorityColor.low}`}>
                      {a.priority}
                    </span>
                    <p className="text-[13px] text-[#FAFAFA] flex-1">{a.action}</p>
                    {a.reason && <p className="text-[12px] text-[#71717A] max-w-[200px] hidden md:block">{a.reason}</p>}
                    <ChevronRight className="h-4 w-4 text-[#71717A] shrink-0" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recommendations */}
          {report.recommendations?.length > 0 && (
            <div className="p-6 rounded-[18px] bg-primary/[0.06] border border-primary/20 space-y-3">
              <p className="text-[12px] text-primary uppercase tracking-widest font-medium">Recommendations</p>
              {report.recommendations.map((r: string, i: number) => (
                <p key={i} className="text-[13px] text-[#A1A1AA] flex items-start gap-2">
                  <span className="text-primary shrink-0 mt-0.5">→</span>{r}
                </p>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
