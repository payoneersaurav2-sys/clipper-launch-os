import React, { useState } from 'react';
import { useAI } from '@/hooks/useAI';
import { useWorkspaceStore } from '@/stores/useWorkspaceStore';
import { buildCampaignPlanPrompt } from '@/lib/ai-services';
import EmptyState from '@/components/EmptyState';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Sparkles, Calendar, Target, Zap } from 'lucide-react';

const DURATIONS = [7, 14, 30];
const PLATFORMS = ['tiktok', 'youtube', 'instagram'];

export function LaunchCenter() {
  const { activeWorkspace } = useWorkspaceStore();
  const { generateJSON, isGenerating, error, clearError } = useAI();
  const [topic, setTopic] = useState('');
  const [goal, setGoal] = useState('');
  const [platform, setPlatform] = useState('tiktok');
  const [duration, setDuration] = useState(7);
  const [plan, setPlan] = useState<any>(null);

  const ws = { id: activeWorkspace?.id ?? 'default', name: activeWorkspace?.name ?? 'Workspace' };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return;
    clearError();
    const data = await generateJSON<any>(
      buildCampaignPlanPrompt({ workspaceId: ws.id, workspaceName: ws.name, topic, platform, durationDays: duration, goal }),
      { category: 'campaign', promptSummary: `Campaign: ${topic}` }
    );
    setPlan(data);
  };

  return (
    <div className="space-y-8 max-w-5xl animate-in fade-in duration-500">
      <div>
        <h2 className="text-[26px] font-semibold tracking-tight text-[#FAFAFA]">Launch Center</h2>
        <p className="text-[14px] text-[#71717A] mt-1">Plan your content campaigns with AI strategy.</p>
      </div>

      {error && <div className="p-4 rounded-[12px] bg-red-500/10 border border-red-500/20 text-[13px] text-red-400">{error}</div>}

      {/* Setup form */}
      <div className="p-6 rounded-[18px] bg-[#111111] border border-white/[0.06] space-y-5">
        <p className="text-[13px] font-medium text-[#A1A1AA] uppercase tracking-widest">Campaign Setup</p>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1.5">
            <label className="text-[12px] text-[#71717A]">Campaign Topic</label>
            <Input value={topic} onChange={e => setTopic(e.target.value)} placeholder="e.g. How I grew to 10k followers"
              className="h-11 rounded-[12px] bg-[#0D0D0D] border-white/[0.06] text-[#FAFAFA] placeholder:text-[#71717A] focus:border-primary/50" />
          </div>
          <div className="space-y-1.5">
            <label className="text-[12px] text-[#71717A]">Goal</label>
            <Input value={goal} onChange={e => setGoal(e.target.value)} placeholder="e.g. Grow to 5k followers"
              className="h-11 rounded-[12px] bg-[#0D0D0D] border-white/[0.06] text-[#FAFAFA] placeholder:text-[#71717A] focus:border-primary/50" />
          </div>
        </div>

        <div className="flex gap-4 flex-wrap">
          <div className="space-y-1.5">
            <label className="text-[12px] text-[#71717A]">Platform</label>
            <div className="flex gap-2">
              {PLATFORMS.map(p => (
                <button key={p} onClick={() => setPlatform(p)}
                  className={`px-4 py-1.5 rounded-full text-[12px] font-medium capitalize transition-all ${platform === p ? 'bg-primary text-white' : 'bg-[#0D0D0D] border border-white/[0.06] text-[#71717A] hover:text-[#FAFAFA]'}`}>
                  {p}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-[12px] text-[#71717A]">Duration</label>
            <div className="flex gap-2">
              {DURATIONS.map(d => (
                <button key={d} onClick={() => setDuration(d)}
                  className={`px-4 py-1.5 rounded-full text-[12px] font-medium transition-all ${duration === d ? 'bg-primary text-white' : 'bg-[#0D0D0D] border border-white/[0.06] text-[#71717A] hover:text-[#FAFAFA]'}`}>
                  {d}d
                </button>
              ))}
            </div>
          </div>
        </div>

        <Button onClick={handleGenerate as any} disabled={isGenerating || !topic.trim()}
          className="h-11 rounded-[12px] px-6 bg-primary text-white hover:bg-primary/90 shadow-[0_0_15px_rgba(124,58,237,0.3)]">
          {isGenerating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
          Generate Campaign Plan
        </Button>
      </div>

      {/* Plan output */}
      {!plan && !isGenerating && (
        <EmptyState title="No active campaigns" description="Fill in the campaign setup above and let the AI build your content calendar." actionLabel="Create Campaign" />
      )}

      {isGenerating && (
        <div className="flex h-32 items-center justify-center gap-3 text-[#71717A]">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="text-[14px]">Building your campaign plan…</span>
        </div>
      )}

      {plan && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-5 rounded-[16px] bg-[#111111] border border-white/[0.06]">
              <Target className="h-4 w-4 text-primary mb-3" />
              <p className="text-[12px] text-[#71717A] mb-1">Campaign Goal</p>
              <p className="text-[14px] text-[#FAFAFA] font-medium">{plan.goal}</p>
            </div>
            <div className="p-5 rounded-[16px] bg-[#111111] border border-white/[0.06]">
              <Calendar className="h-4 w-4 text-primary mb-3" />
              <p className="text-[12px] text-[#71717A] mb-1">Duration</p>
              <p className="text-[14px] text-[#FAFAFA] font-medium">{plan.duration}</p>
            </div>
            <div className="p-5 rounded-[16px] bg-[#111111] border border-white/[0.06]">
              <Zap className="h-4 w-4 text-primary mb-3" />
              <p className="text-[12px] text-[#71717A] mb-1">Posts Planned</p>
              <p className="text-[14px] text-[#FAFAFA] font-medium">{plan.schedule?.length ?? 0} pieces</p>
            </div>
          </div>

          <div className="rounded-[18px] bg-[#111111] border border-white/[0.06] overflow-hidden">
            <div className="px-6 py-4 border-b border-white/[0.06]">
              <p className="text-[13px] font-medium text-[#A1A1AA]">Content Schedule</p>
            </div>
            <div className="divide-y divide-white/[0.04]">
              {plan.schedule?.map((item: any, i: number) => (
                <div key={i} className="px-6 py-4 flex items-center gap-5 hover:bg-white/[0.02] transition-colors">
                  <div className="w-10 h-10 rounded-[10px] bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="text-[13px] font-bold text-primary">D{item.day}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] text-[#FAFAFA] font-medium truncate">{item.topic}</p>
                    <p className="text-[12px] text-[#71717A] mt-0.5">{item.contentType} · {item.platform} {item.time ? `· ${item.time}` : ''}</p>
                  </div>
                  {item.notes && <p className="text-[12px] text-[#71717A] max-w-[200px] truncate hidden md:block">{item.notes}</p>}
                </div>
              ))}
            </div>
          </div>

          {plan.growthTips?.length > 0 && (
            <div className="p-6 rounded-[18px] bg-primary/[0.06] border border-primary/20 space-y-3">
              <p className="text-[12px] text-primary uppercase tracking-widest font-medium">Growth Tips</p>
              {plan.growthTips.map((tip: string, i: number) => (
                <p key={i} className="text-[13px] text-[#A1A1AA] flex items-start gap-2">
                  <span className="text-primary mt-1 shrink-0">•</span>{tip}
                </p>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
