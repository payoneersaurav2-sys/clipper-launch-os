import React, { useEffect, useRef, useState } from 'react';
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
import { useEntitlements } from '@/hooks/useEntitlements';
import { getKnowledgeLimitForTier, getPromptLimitForTier, getTierUpgradeMessage, isFeatureUnlockedForTier, PlanTier } from '@/lib/entitlements';
import { UpgradePrompt } from '@/components/UpgradePrompt';

export function HookEngine() {
  const location = useLocation();
  const navigate = useNavigate();
  const { data: ideas } = useClipIdeas();
  const { activeWorkspace } = useWorkspaceStore();
  const { data: prompts } = useWorkspacePrompts();
  const { data: knowledge } = useWorkspaceKnowledge();
  const { data: entitlements } = useEntitlements();
  const currentTier = (entitlements?.tier ?? 'free') as PlanTier;
  const canUsePrompts = isFeatureUnlockedForTier(currentTier, 'prompt_library');
  const canUseKnowledge = isFeatureUnlockedForTier(currentTier, 'knowledge_vault');
  const promptLimit = getPromptLimitForTier(currentTier);
  const knowledgeLimit = getKnowledgeLimitForTier(currentTier);

  const promptList = prompts ?? [];
  const knowledgeList = knowledge ?? [];
  const knowledgeValues = knowledgeList.map((k: any) => k.content_excerpt ?? k.content ?? '');

  const passedId = (location.state as any)?.ideaId;
  const passedPromptIds = (location.state as any)?.selectedPromptIds as string[] | undefined;
  const passedPromptTitles = (location.state as any)?.selectedPromptTitles as string[] | undefined;
  const passedPromptContents = (location.state as any)?.selectedPromptContents as string[] | undefined;
  const passedPromptId = (location.state as any)?.selectedPromptId as string | undefined;
  const selectedPromptTitleFromState = (location.state as any)?.selectedPromptTitle as string | undefined;
  const selectedPromptFromState = (location.state as any)?.selectedPrompt as string | undefined;
  const selectedKnowledgeSnippetsFromState = (location.state as any)?.selectedKnowledgeSnippets as string[] | undefined;
  const allPromptsSelectedFromState = (location.state as any)?.allPromptsSelected as boolean | undefined;
  const allKnowledgeSelectedFromState = (location.state as any)?.allKnowledgeSelected as boolean | undefined;

  const [selectedPromptIds, setSelectedPromptIds] = useState<string[]>(passedPromptIds ?? (passedPromptId ? [passedPromptId] : []));
  const [selectedPromptTitles, setSelectedPromptTitles] = useState<string[]>(passedPromptTitles ?? (selectedPromptTitleFromState ? [selectedPromptTitleFromState] : []));
  const [selectedPromptContents, setSelectedPromptContents] = useState<string[]>(passedPromptContents ?? (selectedPromptFromState ? [selectedPromptFromState] : []));
  const [selectedKnowledgeSnippets, setSelectedKnowledgeSnippets] = useState<string[]>(selectedKnowledgeSnippetsFromState ?? []);
  const [allPromptsSelected, setAllPromptsSelected] = useState<boolean>(allPromptsSelectedFromState ?? false);
  const [allKnowledgeSelected, setAllKnowledgeSelected] = useState<boolean>(allKnowledgeSelectedFromState ?? false);
  const [isPromptOpen, setIsPromptOpen] = useState(false);
  const [isKnowledgeOpen, setIsKnowledgeOpen] = useState(false);
  const promptMenuRef = useRef<HTMLDivElement | null>(null);
  const knowledgeMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (isPromptOpen && promptMenuRef.current && !promptMenuRef.current.contains(target)) {
        setIsPromptOpen(false);
      }
      if (isKnowledgeOpen && knowledgeMenuRef.current && !knowledgeMenuRef.current.contains(target)) {
        setIsKnowledgeOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsPromptOpen(false);
        setIsKnowledgeOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isPromptOpen, isKnowledgeOpen]);

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
        selectedPromptTitle: allPromptsSelected ? undefined : selectedPromptTitles[0],
        selectedPrompt: allPromptsSelected ? undefined : selectedPromptContents[0],
        selectedPromptTitles: allPromptsSelected ? promptList.map((p: any) => p.title) : selectedPromptTitles,
        selectedPromptContents: allPromptsSelected ? promptList.map((p: any) => p.content) : selectedPromptContents,
        knowledgeSnippets: allKnowledgeSelected ? knowledgeValues : selectedKnowledgeSnippets,
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
      {!canUsePrompts && (
        <div className="mb-5">
          <UpgradePrompt feature="Prompt selector" requiredPlan="creator" description={getTierUpgradeMessage(currentTier, 'prompt_library')} />
        </div>
      )}
      {!canUseKnowledge && (
        <div className="mb-5">
          <UpgradePrompt feature="Knowledge selector" requiredPlan="creator" description={getTierUpgradeMessage(currentTier, 'knowledge_vault')} />
        </div>
      )}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <div className="min-w-0">
          <h2 className="text-[22px] sm:text-[26px] font-semibold tracking-tight text-[#FAFAFA]">Hook Engine</h2>
          <p className="text-[13px] sm:text-[14px] text-[#71717A] mt-1 truncate">Context: <span className="text-[#A1A1AA]">{latestIdea.title}</span></p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative" ref={promptMenuRef}>
            {canUsePrompts ? (
              <button
              type="button"
              onClick={() => setIsPromptOpen((open) => !open)}
              className="flex items-center gap-2 h-8 rounded-full border border-white/[0.08] bg-[linear-gradient(180deg,rgba(17,17,17,0.98),rgba(13,13,13,0.96))] px-3 text-[12px] text-[#FAFAFA] shadow-[0_0_0_1px_rgba(124,58,237,0.08),0_10px_24px_rgba(0,0,0,0.2)] transition-all hover:border-primary/30"
            >
              <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-[#71717A]">Saved prompt</span>
              <span className="max-w-[160px] truncate text-[#FAFAFA]">{allPromptsSelected ? 'All prompts' : selectedPromptTitles.length ? `${selectedPromptTitles.length} prompt${selectedPromptTitles.length > 1 ? 's' : ''}` : 'No prompt'}</span>
              <ChevronDown className="h-3.5 w-3.5 text-[#A1A1AA]" />
              </button>
            ) : (
              <div className="flex items-center gap-2 h-8 rounded-full border border-white/[0.08] bg-[#111111] px-3 text-[12px] text-[#71717A]">
                <span>Prompt limit</span>
                <span className="text-primary">{promptLimit < 0 ? 'Unlimited' : `${promptLimit}`}</span>
              </div>
            )}
            {isPromptOpen && canUsePrompts && (
              <div className="absolute left-0 z-20 mt-2 w-80 max-h-72 overflow-auto rounded-[16px] border border-white/[0.08] bg-[#111111]/95 p-1.5 shadow-[0_18px_44px_rgba(0,0,0,0.38),0_0_0_1px_rgba(124,58,237,0.12)] backdrop-blur-md">
                <div className="mb-1 px-2 pt-1 pb-1.5">
                  <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-[#71717A]">Saved prompts</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedPromptIds([]);
                    setSelectedPromptTitles([]);
                    setSelectedPromptContents([]);
                    setAllPromptsSelected(false);
                    setIsPromptOpen(false);
                  }}
                  className={`flex w-full items-center justify-between rounded-[10px] border px-2.5 py-2.5 text-left transition-colors ${!allPromptsSelected && selectedPromptIds.length === 0 ? 'border-primary/30 bg-[linear-gradient(180deg,rgba(124,58,237,0.12),rgba(17,17,17,0.5))]' : 'border-transparent bg-transparent hover:border-white/[0.06] hover:bg-white/[0.02]'}`}
                >
                  <span className="text-[12px] font-medium text-[#FAFAFA]">No prompt</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const nextAll = !allPromptsSelected;
                    setAllPromptsSelected(nextAll);
                    if (nextAll) {
                      setSelectedPromptIds(promptList.map((p: any) => p.id));
                      setSelectedPromptTitles(promptList.map((p: any) => p.title));
                      setSelectedPromptContents(promptList.map((p: any) => p.content));
                    } else {
                      setSelectedPromptIds([]);
                      setSelectedPromptTitles([]);
                      setSelectedPromptContents([]);
                    }
                    setIsPromptOpen(false);
                  }}
                  className={`mt-1 flex w-full items-center justify-between rounded-[10px] border px-2.5 py-2.5 text-left transition-colors ${allPromptsSelected ? 'border-primary/30 bg-[linear-gradient(180deg,rgba(124,58,237,0.12),rgba(17,17,17,0.5))]' : 'border-transparent bg-transparent hover:border-white/[0.06] hover:bg-white/[0.02]'}`}
                >
                  <span className="text-[12px] font-medium text-[#FAFAFA]">All prompts</span>
                  <span className="text-[10px] uppercase tracking-[0.12em] text-[#71717A]">{promptList.length}</span>
                </button>
                {promptList.map((p: any) => {
                  const checked = allPromptsSelected || selectedPromptIds.includes(p.id);
                  return (
                    <label key={p.id} className={`mt-1 flex cursor-pointer items-start gap-2 rounded-[10px] border px-2.5 py-2.5 transition-colors ${checked ? 'border-primary/30 bg-[linear-gradient(180deg,rgba(124,58,237,0.12),rgba(17,17,17,0.5))]' : 'border-transparent bg-transparent hover:border-white/[0.06] hover:bg-white/[0.02]'}`}>
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) => {
                          const isChecked = e.target.checked;
                          setAllPromptsSelected(false);
                          setSelectedPromptIds((prev) => {
                            const next = isChecked ? [...new Set([...prev, p.id])] : prev.filter((id) => id !== p.id);
                            setSelectedPromptTitles(promptList.filter((item: any) => next.includes(item.id)).map((item: any) => item.title));
                            setSelectedPromptContents(promptList.filter((item: any) => next.includes(item.id)).map((item: any) => item.content));
                            return next;
                          });
                          setIsPromptOpen(false);
                        }}
                        className="mt-0.5 h-3.5 w-3.5 rounded-sm border border-white/[0.1] bg-[#0D0D0D] accent-[#7C3AED]"
                      />
                      <span className="flex-1 text-left text-[12px] leading-5 text-[#E4E4E7]">
                        <span className="mb-0.5 block font-medium text-[#FAFAFA]">{p.title}</span>
                        <span className="text-[#A1A1AA]">{(p.content ?? '').slice(0, 110)}{((p.content ?? '').length > 110 ? '…' : '')}</span>
                      </span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>
          <div className="relative" ref={knowledgeMenuRef}>
            {canUseKnowledge ? (
              <button
              type="button"
              onClick={() => setIsKnowledgeOpen((open) => !open)}
              className="flex items-center gap-2 h-8 rounded-full border border-white/[0.08] bg-[linear-gradient(180deg,rgba(17,17,17,0.98),rgba(13,13,13,0.96))] px-3 text-[12px] text-[#FAFAFA] shadow-[0_0_0_1px_rgba(124,58,237,0.08),0_10px_24px_rgba(0,0,0,0.2)] transition-all hover:border-primary/30"
            >
              <span>{allKnowledgeSelected ? 'All knowledge' : selectedKnowledgeSnippets.length ? `${selectedKnowledgeSnippets.length} knowledge` : 'Knowledge'}</span>
              <ChevronDown className="h-3.5 w-3.5 text-[#A1A1AA]" />
              </button>
            ) : (
              <div className="flex items-center gap-2 h-8 rounded-full border border-white/[0.08] bg-[#111111] px-3 text-[12px] text-[#71717A]">
                <span>Knowledge limit</span>
                <span className="text-primary">{knowledgeLimit < 0 ? 'Unlimited' : `${knowledgeLimit}`}</span>
              </div>
            )}
            {isKnowledgeOpen && canUseKnowledge && (
              <div className="absolute right-0 z-20 mt-2 w-80 max-h-72 overflow-auto rounded-[16px] border border-white/[0.08] bg-[#111111]/95 p-1.5 shadow-[0_18px_44px_rgba(0,0,0,0.38),0_0_0_1px_rgba(124,58,237,0.12)] backdrop-blur-md">
                <div className="mb-1 px-2 pt-1 pb-1.5">
                  <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-[#71717A]">Knowledge sources</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setAllKnowledgeSelected(false);
                    setSelectedKnowledgeSnippets([]);
                    setIsKnowledgeOpen(false);
                  }}
                  className={`flex w-full items-center justify-between rounded-[10px] border px-2.5 py-2.5 text-left transition-colors ${!allKnowledgeSelected && selectedKnowledgeSnippets.length === 0 ? 'border-primary/30 bg-[linear-gradient(180deg,rgba(124,58,237,0.12),rgba(17,17,17,0.5))]' : 'border-transparent bg-transparent hover:border-white/[0.06] hover:bg-white/[0.02]'}`}
                >
                  <span className="text-[12px] font-medium text-[#FAFAFA]">No knowledge</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const nextAll = !allKnowledgeSelected;
                    setAllKnowledgeSelected(nextAll);
                    setSelectedKnowledgeSnippets(nextAll ? knowledgeValues : []);
                    setIsKnowledgeOpen(false);
                  }}
                  className={`mt-1 flex w-full items-center justify-between rounded-[10px] border px-2.5 py-2.5 text-left transition-colors ${allKnowledgeSelected ? 'border-primary/30 bg-[linear-gradient(180deg,rgba(124,58,237,0.12),rgba(17,17,17,0.5))]' : 'border-transparent bg-transparent hover:border-white/[0.06] hover:bg-white/[0.02]'}`}
                >
                  <span className="text-[12px] font-medium text-[#FAFAFA]">All knowledge</span>
                  <span className="text-[10px] uppercase tracking-[0.12em] text-[#71717A]">{knowledgeValues.length}</span>
                </button>
                {knowledgeList.length > 0 ? knowledgeList.map((k: any) => {
                  const value = k.content_excerpt ?? k.content ?? '';
                  const checked = allKnowledgeSelected || selectedKnowledgeSnippets.includes(value);
                  return (
                    <label key={k.id} className={`mt-1 flex cursor-pointer items-start gap-2 rounded-[10px] border px-2.5 py-2.5 transition-colors ${checked ? 'border-primary/30 bg-[linear-gradient(180deg,rgba(124,58,237,0.12),rgba(17,17,17,0.5))]' : 'border-transparent bg-transparent hover:border-white/[0.06] hover:bg-white/[0.02]'}`}>
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) => {
                          const val = value;
                          setAllKnowledgeSelected(false);
                          setSelectedKnowledgeSnippets((prev) => e.target.checked ? [...new Set([...prev, val])] : prev.filter((x) => x !== val));
                        }}
                        className="mt-0.5 h-3.5 w-3.5 rounded-sm border border-white/[0.1] bg-[#0D0D0D] accent-[#7C3AED]"
                      />
                      <span className="flex-1 text-left text-[12px] leading-5 text-[#E4E4E7]">
                        <span className="mb-0.5 block font-medium text-[#FAFAFA]">{k.title}</span>
                        <span className="text-[#A1A1AA]">{(k.content_excerpt ?? k.content ?? '').slice(0, 110)}{((k.content_excerpt ?? k.content ?? '').length > 110 ? '…' : '')}</span>
                      </span>
                    </label>
                  );
                }) : (
                  <div className="px-3 py-3 text-[12px] text-[#71717A]">No knowledge items yet.</div>
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
