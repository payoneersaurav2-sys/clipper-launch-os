import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useClipIdeas } from '@/hooks/useClipIdeas';
import { useWorkspacePrompts, useWorkspaceKnowledge } from '@/hooks/useWorkflowResources';
import { useAI } from '@/hooks/useAI';
import { useWorkspaceStore } from '@/stores/useWorkspaceStore';
import { buildGenerateIdeasPrompt, buildExpandIdeaPrompt } from '@/lib/ai-services';
import EmptyState from '@/components/EmptyState';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Lightbulb, Plus, Loader2, Sparkles, ChevronDown, Zap, Type } from 'lucide-react';

export function IdeaStudio() {
  const navigate = useNavigate();
  const { data: ideas, isLoading, createIdea } = useClipIdeas();
  const { activeWorkspace } = useWorkspaceStore();
  const { generateJSON, isGenerating, error, clearError } = useAI();
  const [newTitle, setNewTitle] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [expandingId, setExpandingId] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Record<string, any>>({});
  const [generationNotice, setGenerationNotice] = useState<string | null>(null);

  const ws = activeWorkspace
    ? { id: activeWorkspace.id, name: activeWorkspace.name, niche: activeWorkspace.niche, platform: activeWorkspace.platform }
    : null;

  const { data: prompts } = useWorkspacePrompts();
  const { data: knowledge } = useWorkspaceKnowledge();

  const [selectedPromptId, setSelectedPromptId] = useState<string | null>(null);
  const [selectedPromptTitle, setSelectedPromptTitle] = useState<string | undefined>(undefined);
  const [selectedPromptContent, setSelectedPromptContent] = useState<string | undefined>(undefined);
  const [selectedKnowledgeSnippets, setSelectedKnowledgeSnippets] = useState<string[]>([]);
  const [isKnowledgeOpen, setIsKnowledgeOpen] = useState(false);

  const sendTo = (path: string, idea: any) => {
    navigate(`/dashboard/${path}`, {
      state: {
        ideaId: idea.id,
        ideaTitle: idea.title,
        selectedPromptId,
        selectedPromptTitle,
        selectedPrompt: selectedPromptContent,
        selectedKnowledgeSnippets,
      },
    });
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setIsCreating(true);
    await createIdea.mutateAsync({ title: newTitle, context: '' });
    setNewTitle('');
    setIsCreating(false);
  };

  const handleAIGenerate = async () => {
    clearError();
    setGenerationNotice(null);
    if (!ws) {
      setGenerationNotice('Choose or create a workspace before generating ideas.');
      return;
    }
    try {
      const data = await generateJSON<{ ideas?: Array<{ title?: string; context?: string }> }>(
        buildGenerateIdeasPrompt({
          workspaceId: ws.id,
          workspaceName: ws.name,
          niche: ws.niche ?? undefined,
          platform: ws.platform ?? undefined,
        }),
        { category: 'idea', promptSummary: 'Generate viral ideas' }
      );
      const generatedIdeas = (data.ideas ?? []).filter((idea) => typeof idea?.title === 'string' && idea.title.trim().length > 0);
      if (generatedIdeas.length === 0) {
        setGenerationNotice('The AI returned no usable ideas. Please retry.');
        return;
      }
      await Promise.all(generatedIdeas.map((idea) => createIdea.mutateAsync({ title: idea.title!.trim(), context: idea.context?.trim() ?? '' })));
      setGenerationNotice(`${generatedIdeas.length} ideas added to your workspace.`);
    } catch (generationError) {
      setGenerationNotice(generationError instanceof Error ? generationError.message : 'Could not generate ideas. Please retry.');
    }
  };

  const handleExpand = async (idea: any) => {
    if (!ws) {
      setGenerationNotice('Choose or create a workspace before expanding an idea.');
      return;
    }
    setExpandingId(idea.id);
    const data = await generateJSON<any>(
      buildExpandIdeaPrompt({ 
        workspaceId: ws.id, 
        workspaceName: ws.name, 
        ideaTitle: idea.title,
        platform: ws.platform ?? undefined,
      }),
      { category: 'idea', promptSummary: `Expand: ${idea.title}` }
    );
    setExpanded(prev => ({ ...prev, [idea.id]: data }));
    setExpandingId(null);
  };

  return (
    <div className="os-page max-w-5xl animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <div>
          <h2 className="text-[22px] sm:text-[26px] font-semibold tracking-tight text-[#FAFAFA]">Idea Studio</h2>
          <p className="text-[13px] sm:text-[14px] text-[#71717A] mt-1">Generate, capture and expand content ideas.</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex items-center gap-2 rounded-full border border-white/[0.08] bg-[linear-gradient(180deg,rgba(17,17,17,0.98),rgba(13,13,13,0.96))] px-2.5 py-1.5 shadow-[0_0_0_1px_rgba(124,58,237,0.08),0_10px_24px_rgba(0,0,0,0.22)]">
            <label className="text-[11px] uppercase tracking-[0.18em] text-[#71717A]">Saved prompt</label>
            <div className="relative">
              <select
                value={selectedPromptId ?? ''}
                onChange={(e) => {
                  const id = e.target.value || null;
                  setSelectedPromptId(id);
                  const p = prompts?.find((x: any) => x.id === id);
                  setSelectedPromptTitle(p?.title);
                  setSelectedPromptContent(p?.content);
                }}
                className="h-8 appearance-none rounded-full border border-white/[0.08] bg-[#0D0D0D] px-3 pr-7 text-[12px] font-medium text-[#FAFAFA] outline-none transition-all hover:border-primary/30 focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
              >
                <option value="">No prompt</option>
                {prompts?.map((p: any) => <option key={p.id} value={p.id}>{p.title}</option>)}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#A1A1AA]" />
            </div>
          </div>
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsKnowledgeOpen((open) => !open)}
              className="flex items-center gap-2 h-8 rounded-full border border-white/[0.08] bg-[linear-gradient(180deg,rgba(17,17,17,0.98),rgba(13,13,13,0.96))] px-3 text-[12px] text-[#FAFAFA] shadow-[0_0_0_1px_rgba(124,58,237,0.08),0_10px_24px_rgba(0,0,0,0.2)] transition-all hover:border-primary/30"
            >
              <span>{selectedKnowledgeSnippets.length ? `${selectedKnowledgeSnippets.length} knowledge` : 'Knowledge'}</span>
              <ChevronDown className="h-3.5 w-3.5 text-[#A1A1AA]" />
            </button>
            {isKnowledgeOpen && (
              <div className="absolute right-0 z-20 mt-2 w-80 max-h-72 overflow-auto rounded-[16px] border border-white/[0.08] bg-[#111111]/95 p-1.5 shadow-[0_18px_44px_rgba(0,0,0,0.38),0_0_0_1px_rgba(124,58,237,0.12)] backdrop-blur-md">
                <div className="mb-1 px-2 pt-1 pb-1.5">
                  <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-[#71717A]">Knowledge sources</p>
                </div>
                {knowledge && knowledge.length > 0 ? knowledge.map((k: any) => {
                  const value = k.content_excerpt ?? k.content ?? '';
                  const checked = selectedKnowledgeSnippets.includes(value);
                  return (
                    <label key={k.id} className={`flex cursor-pointer items-start gap-2 rounded-[10px] border px-2.5 py-2.5 transition-colors ${checked ? 'border-primary/30 bg-[linear-gradient(180deg,rgba(124,58,237,0.12),rgba(17,17,17,0.5))]' : 'border-transparent bg-transparent hover:border-white/[0.06] hover:bg-white/[0.02]'}`}>
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) => {
                          const val = value;
                          setSelectedKnowledgeSnippets((prev) => e.target.checked ? [...prev, val] : prev.filter((x) => x !== val));
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
        <Button
          onClick={handleAIGenerate}
          disabled={isGenerating}
          className="h-10 rounded-[12px] px-5 bg-primary text-white hover:bg-primary/90 shadow-[0_0_15px_rgba(124,58,237,0.3)] transition-all self-start sm:self-auto shrink-0 text-[13px]"
        >
          {isGenerating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
          Generate Ideas
        </Button>
      </div>

      {(error || generationNotice) && (
        <div className={`p-4 rounded-[12px] border text-[13px] ${error || (generationNotice ?? '').startsWith('Could') || (generationNotice ?? '').startsWith('Choose') || (generationNotice ?? '').startsWith('The AI') ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'}`}>
          {error || generationNotice}
        </div>
      )}

      <form onSubmit={handleCreate} className="flex gap-3">
        <Input
          placeholder="Capture an idea (e.g. 'Why most creators quit before $10k/mo')"
          value={newTitle}
          onChange={e => setNewTitle(e.target.value)}
          disabled={isCreating}
          className="h-11 rounded-[12px] bg-[#111111] border-white/[0.06] text-[#FAFAFA] placeholder:text-[#71717A] focus:border-primary/50 focus:ring-primary/20 max-w-xl"
        />
        <Button
          type="submit"
          disabled={isCreating || !newTitle.trim()}
          variant="outline"
          className="h-11 rounded-[12px] border-white/[0.06] bg-[#111111] text-[#FAFAFA] hover:bg-white/[0.05]"
        >
          {isCreating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4 mr-1.5" />}
          Capture
        </Button>
      </form>

      {isLoading ? (
        <div className="flex h-32 items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-[#71717A]" />
        </div>
      ) : ideas?.length === 0 ? (
        <EmptyState
          title="No ideas yet"
          description="Capture your first idea or let the AI generate viral concepts for your niche."
          actionLabel="Generate Ideas"
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {ideas?.map(idea => (
            <Card key={idea.id} className="bg-[#111111] border border-white/[0.06] rounded-[16px] hover:border-primary/30 transition-colors group">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="p-2 rounded-[10px] bg-primary/10">
                    <Lightbulb className="h-4 w-4 text-primary" />
                  </div>
                  <span className="text-[11px] font-medium px-2 py-0.5 bg-white/[0.06] rounded-full text-[#71717A] uppercase tracking-wide">
                    {idea.status}
                  </span>
                </div>
                <h3 className="text-[14px] font-medium text-[#FAFAFA] line-clamp-2 mb-3 group-hover:text-primary transition-colors">
                  {idea.title}
                </h3>
                <div className="flex items-center justify-between">
                  <p className="text-[12px] text-[#71717A]">
                    {new Date(idea.created_at).toLocaleDateString()}
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleExpand(idea)}
                    disabled={expandingId === idea.id}
                    className="h-7 px-2.5 text-[12px] text-[#71717A] hover:text-primary hover:bg-primary/10 rounded-[8px]"
                  >
                    {expandingId === idea.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <ChevronDown className="h-3 w-3 mr-1" />}
                    Expand
                  </Button>
                </div>

                {/* Send To actions */}
                <div className="flex gap-1.5 mt-3 pt-3 border-t border-white/[0.05]">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => sendTo('hook-engine', idea)}
                    className="flex-1 h-7 text-[11px] text-[#71717A] hover:text-primary hover:bg-primary/10 rounded-[8px] gap-1"
                  >
                    <Zap className="h-3 w-3" /> Hook Engine
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => sendTo('caption-os', idea)}
                    className="flex-1 h-7 text-[11px] text-[#71717A] hover:text-[#FAFAFA] hover:bg-white/[0.06] rounded-[8px] gap-1"
                  >
                    <Type className="h-3 w-3" /> Caption OS
                  </Button>
                </div>
                {expanded[idea.id] && (
                  <div className="mt-4 pt-4 border-t border-white/[0.06] text-[13px] text-[#A1A1AA] leading-relaxed">
                    <p className="mb-2">{expanded[idea.id].expanded}</p>
                    {expanded[idea.id].angles?.length > 0 && (
                      <div className="space-y-1 mt-3">
                        <p className="text-[11px] text-[#71717A] uppercase tracking-widest mb-1">Angles</p>
                        {expanded[idea.id].angles.slice(0, 3).map((a: string, i: number) => (
                          <p key={i} className="text-[12px]">• {a}</p>
                        ))}
                      </div>
                    )}
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
