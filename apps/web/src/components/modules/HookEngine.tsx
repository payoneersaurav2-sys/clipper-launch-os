import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useClipIdeas } from '@/hooks/useClipIdeas';
import { useHooks } from '@/hooks/useHooks';
import { useAI } from '@/hooks/useAI';
import { useWorkspaceStore } from '@/stores/useWorkspaceStore';
import { useWorkspacePrompts, useWorkspaceKnowledge } from '@/hooks/useWorkflowResources';
import { buildGenerateHooksPrompt, buildScoreHookPrompt } from '@/lib/ai-services';
import EmptyState from '@/components/EmptyState';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Loader2, Sparkles, Star, BarChart2, CheckCircle2, ChevronDown } from 'lucide-react';

export function HookEngine() {
  const location = useLocation();
  const navigate = useNavigate();
  const { data: ideas } = useClipIdeas();
  const { activeWorkspace } = useWorkspaceStore();
  const { data: prompts } = useWorkspacePrompts();
  const { data: knowledge } = useWorkspaceKnowledge();

  const passedId = (location.state as any)?.ideaId;
  const passedPromptId = (location.state as any)?.selectedPromptId as string | undefined;
  const selectedPromptTitleFromState = (location.state as any)?.selectedPromptTitle as string | undefined;
  const selectedPromptFromState = (location.state as any)?.selectedPrompt as string | undefined;
  const selectedKnowledgeSnippetsFromState = (location.state as any)?.selectedKnowledgeSnippets as string[] | undefined;

  const [selectedPromptId, setSelectedPromptId] = useState<string | null>(passedPromptId ?? null);
  const [selectedPromptTitle, setSelectedPromptTitle] = useState<string | undefined>(selectedPromptTitleFromState);
  const [selectedPrompt, setSelectedPrompt] = useState<string | undefined>(selectedPromptFromState);
  const [selectedKnowledgeSnippets, setSelectedKnowledgeSnippets] = useState<string[]>(selectedKnowledgeSnippetsFromState ?? []);
  const [isKnowledgeOpen, setIsKnowledgeOpen] = useState(false);

  // Prefer idea passed from Idea Studio, fall back to latest
  const passedIdea = passedId ? ideas?.find(i => i.id === passedId) : undefined;
  const selectedIdea = passedIdea ?? ideas?.[0];
  const latestIdea = selectedIdea;

  const { data: hooks, isLoading, createHook, updateHookStatus } = useHooks(latestIdea?.id);
  const { generateJSON, isGenerating, error, clearError } = useAI();
  const [newHook, setNewHook] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [scores, setScores] = useState<Record<string, any>>({});
  const [scoringId, setScoringId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const ws = activeWorkspace
    ? { id: activeWorkspace.id, name: activeWorkspace.name }
    : null;

  if (!latestIdea) {
    return (
      <div className="space-y-4 animate-in fade-in duration-500">
        <h2 className="text-[26px] font-semibold tracking-tight text-[#FAFAFA]">Hook Engine</h2>
        <EmptyState title="Awaiting Idea Context" description="Create an idea in Idea Studio first to start generating hooks." actionLabel="Go to Idea Studio" onAction={() => navigate('/dashboard/idea-studio')} />
      </div>
    );
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHook.trim()) return;
    setIsCreating(true);
    await createHook.mutateAsync({ content: newHook, clip_idea_id: latestIdea.id });
    setNewHook('');
    setIsCreating(false);
  };

  const handleGenerate = async () => {
    clearError();
    setMessage(null);
    if (!ws) {
      setMessage('Select or create a workspace before generating hooks.');
      return;
    }
    const data = await generateJSON<{ hooks: any[] }>(
      buildGenerateHooksPrompt({
        workspaceId: ws.id, workspaceName: ws.name,
        ideaTitle: latestIdea.title,
        previousHooks: hooks?.map(h => h.content),
        selectedPromptTitle,
        selectedPrompt,
        knowledgeSnippets: selectedKnowledgeSnippets,
      }),
      { category: 'hook', promptSummary: `Hooks for: ${latestIdea.title}` }
    );
    for (const hook of data.hooks ?? []) {
      await createHook.mutateAsync({ content: hook.content, clip_idea_id: latestIdea.id });
    }
  };

  const handleScore = async (hook: any) => {
    if (!ws) {
      setMessage('Select or create a workspace before scoring a hook.');
      return;
    }
    setScoringId(hook.id);
    const data = await generateJSON<any>(
      buildScoreHookPrompt({ workspaceId: ws.id, workspaceName: ws.name, hookContent: hook.content }),
      { category: 'hook', promptSummary: `Score hook` }
    );
    setScores(prev => ({ ...prev, [hook.id]: data }));
    setScoringId(null);
  };

  const scoreColor = (s: number) => s >= 8 ? 'text-emerald-400' : s >= 5 ? 'text-yellow-400' : 'text-red-400';

  return (
    <div className="os-page max-w-5xl animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <div className="min-w-0">
          <h2 className="text-[22px] sm:text-[26px] font-semibold tracking-tight text-[#FAFAFA]">Hook Engine</h2>
          <p className="text-[13px] sm:text-[14px] text-[#71717A] mt-1 truncate">Context: <span className="text-[#A1A1AA]">{latestIdea.title}</span></p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 rounded-full border border-white/[0.06] bg-[#111111] px-2.5 py-1.5">
            <label className="text-[11px] uppercase tracking-[0.18em] text-[#71717A]">Saved prompt</label>
            <select
              value={selectedPromptId ?? ''}
              onChange={(e) => {
                const id = e.target.value || null;
                setSelectedPromptId(id);
                const p = prompts?.find((x: any) => x.id === id);
                setSelectedPromptTitle(p?.title);
                setSelectedPrompt(p?.content);
              }}
              className="h-8 rounded-full border border-white/[0.05] bg-[#0D0D0D] text-[#FAFAFA] px-3 text-[12px] outline-none focus:border-primary/50"
            >
              <option value="">No prompt</option>
              {prompts?.map((p: any) => <option key={p.id} value={p.id}>{p.title}</option>)}
            </select>
          </div>
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsKnowledgeOpen((open) => !open)}
              className="flex items-center gap-2 h-8 rounded-full border border-white/[0.06] bg-[#111111] px-3 text-[12px] text-[#FAFAFA]"
            >
              <span>{selectedKnowledgeSnippets.length ? `${selectedKnowledgeSnippets.length} knowledge` : 'Knowledge'}</span>
              <ChevronDown className="h-3.5 w-3.5 text-[#A1A1AA]" />
            </button>
            {isKnowledgeOpen && (
              <div className="absolute right-0 z-20 mt-2 w-72 max-h-64 overflow-auto rounded-[14px] border border-white/[0.08] bg-[#111111] p-2 shadow-2xl ring-1 ring-primary/10">
                {knowledge && knowledge.length > 0 ? knowledge.map((k: any) => {
                  const value = k.content_excerpt ?? k.content ?? '';
                  const checked = selectedKnowledgeSnippets.includes(value);
                  return (
                    <label key={k.id} className="flex cursor-pointer items-start gap-2 rounded-[10px] px-2 py-2 hover:bg-white/[0.03]">
                      <input type="checkbox" checked={checked} onChange={(e) => {
                        const val = value;
                        setSelectedKnowledgeSnippets((prev) => e.target.checked ? [...prev, val] : prev.filter((x) => x !== val));
                      }} className="mt-0.5 accent-primary" />
                      <span className="flex-1 text-left text-[12px] leading-5 text-[#E4E4E7]">
                        <span className="mb-0.5 block font-medium text-[#FAFAFA]">{k.title}</span>
                        <span className="text-[#A1A1AA]">{(k.content_excerpt ?? k.content ?? '').slice(0, 110)}{((k.content_excerpt ?? k.content ?? '').length > 110 ? '…' : '')}</span>
                      </span>
                    </label>
                  );
                }) : (
                  <div className="px-3 py-2 text-[12px] text-[#71717A]">No knowledge items yet.</div>
                )}
              </div>
            )}
          </div>
        </div>
        <Button onClick={handleGenerate} disabled={isGenerating} className="h-10 rounded-[12px] px-5 bg-primary text-white hover:bg-primary/90 shadow-[0_0_15px_rgba(124,58,237,0.3)] self-start sm:self-auto shrink-0 text-[13px]">
          {isGenerating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
          Generate Hooks
        </Button>
      </div>

      {(error || message) && (
        <div className={`p-4 rounded-[12px] border text-[13px] ${error ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'}`}>
          {error || message}
        </div>
      )}

      <form onSubmit={handleCreate} className="flex gap-3">
        <Input
          placeholder="Draft a hook manually…"
          value={newHook}
          onChange={e => setNewHook(e.target.value)}
          disabled={isCreating}
          className="h-11 rounded-[12px] bg-[#111111] border-white/[0.06] text-[#FAFAFA] placeholder:text-[#71717A] focus:border-primary/50 max-w-xl"
        />
        <Button type="submit" disabled={isCreating || !newHook.trim()} variant="outline" className="h-11 rounded-[12px] border-white/[0.06] bg-[#111111] text-[#FAFAFA] hover:bg-white/[0.05]">
          {isCreating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4 mr-1" />}
          Add
        </Button>
      </form>

      {isLoading ? (
        <div className="flex h-32 items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-[#71717A]" /></div>
      ) : hooks?.length === 0 ? (
        <EmptyState title="No hooks yet" description="Generate AI hooks or draft your own for this idea." actionLabel="Generate Hooks" onAction={handleGenerate} />
      ) : (
        <div className="grid gap-3">
          {hooks?.map(hook => (
            <Card key={hook.id} className="bg-[#111111] border border-white/[0.06] rounded-[14px] hover:border-white/[0.12] transition-colors">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <p className="text-[14px] text-[#FAFAFA] leading-relaxed flex-1">{hook.content}</p>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Button variant="ghost" size="sm" onClick={() => handleScore(hook)} disabled={scoringId === hook.id}
                      className="h-8 px-3 text-[12px] text-[#71717A] hover:text-primary hover:bg-primary/10 rounded-[8px]">
                      {scoringId === hook.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <BarChart2 className="h-3 w-3 mr-1" />}
                      Score
                    </Button>
                    <Button variant="ghost" size="icon"
                      onClick={() => updateHookStatus.mutate({ id: hook.id, status: hook.status === 'favorite' ? 'draft' : 'favorite' })}
                      className="h-8 w-8 rounded-[8px] hover:bg-white/[0.05]">
                      <Star className={hook.status === 'favorite' ? 'h-4 w-4 fill-primary text-primary' : 'h-4 w-4 text-[#71717A]'} />
                    </Button>
                  </div>
                </div>

                {scores[hook.id] && (
                  <div className="mt-4 pt-4 border-t border-white/[0.06] space-y-3">
                    <div className="flex items-center gap-3">
                      <span className={`text-[22px] font-bold tracking-tight ${scoreColor(scores[hook.id].score)}`}>
                        {scores[hook.id].score}/10
                      </span>
                      <div className="flex-1 h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${scores[hook.id].score >= 8 ? 'bg-emerald-400' : scores[hook.id].score >= 5 ? 'bg-yellow-400' : 'bg-red-400'}`}
                          style={{ width: `${scores[hook.id].score * 10}%` }} />
                      </div>
                    </div>
                    {scores[hook.id].rewrite && (
                      <div className="p-3 rounded-[10px] bg-primary/[0.08] border border-primary/20">
                        <p className="text-[11px] text-primary uppercase tracking-widest mb-1.5">Improved Version</p>
                        <p className="text-[13px] text-[#FAFAFA]">{scores[hook.id].rewrite}</p>
                      </div>
                    )}
                    {scores[hook.id].improvements?.slice(0, 2).map((imp: string, i: number) => (
                      <p key={i} className="text-[12px] text-[#71717A] flex items-start gap-1.5">
                        <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />{imp}
                      </p>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
