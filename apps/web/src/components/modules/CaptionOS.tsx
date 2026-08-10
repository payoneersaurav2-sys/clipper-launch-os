import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useClipIdeas } from '@/hooks/useClipIdeas';
import { useCaptions } from '@/hooks/useCaptions';
import { useAI } from '@/hooks/useAI';
import { useWorkspaceStore } from '@/stores/useWorkspaceStore';
import { useWorkspacePrompts, useWorkspaceKnowledge } from '@/hooks/useWorkflowResources';
import { buildGenerateCaptionPrompt, buildCaptionVariantsPrompt } from '@/lib/ai-services';
import EmptyState from '@/components/EmptyState';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Loader2, Sparkles, Copy, Check, Layers, ChevronDown } from 'lucide-react';

const PLATFORMS = ['tiktok', 'youtube', 'instagram', 'twitter'];

export function CaptionOS() {
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

  const latestIdea = passedId
    ? ideas?.find(i => i.id === passedId) ?? ideas?.[0]
    : ideas?.[0];

  const { data: captions, isLoading, createCaption } = useCaptions(latestIdea?.id);
  const { generateJSON, isGenerating, error, clearError } = useAI();
  const [newCaption, setNewCaption] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [platform, setPlatform] = useState('tiktok');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isVariants, setIsVariants] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const ws = activeWorkspace
    ? { id: activeWorkspace.id, name: activeWorkspace.name }
    : null;

  if (!latestIdea) return (
    <div className="space-y-4 animate-in fade-in duration-500">
      <h2 className="text-[26px] font-semibold tracking-tight text-[#FAFAFA]">Caption OS</h2>
      <EmptyState title="Awaiting Workflow Context" description="Create an idea first to start drafting captions." actionLabel="Go to Idea Studio" onAction={() => navigate('/dashboard/idea-studio')} />
    </div>
  );

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCaption.trim()) return;
    setIsCreating(true);
    await createCaption.mutateAsync({ content: newCaption, platform, clip_idea_id: latestIdea.id });
    setNewCaption('');
    setIsCreating(false);
  };

  const handleGenerate = async () => {
    clearError();
    setMessage(null);
    if (!ws) {
      setMessage('Select or create a workspace before generating captions.');
      return;
    }
    const data = await generateJSON<any>(
      buildGenerateCaptionPrompt({
        workspaceId: ws.id,
        workspaceName: ws.name,
        ideaTitle: latestIdea.title,
        platform,
        selectedPromptTitle,
        selectedPrompt,
        knowledgeSnippets: selectedKnowledgeSnippets,
      }),
      { category: 'caption', promptSummary: `Caption: ${latestIdea.title}` }
    );
    const full = [data.hook, data.body ?? data.caption, data.cta, (data.hashtags ?? []).join(' ')].filter(Boolean).join('\n\n');
    await createCaption.mutateAsync({ content: full, platform, clip_idea_id: latestIdea.id });
  };

  const handleVariants = async () => {
    clearError();
    setMessage(null);
    if (!ws) {
      setMessage('Select or create a workspace before generating caption variants.');
      return;
    }
    setIsVariants(true);
    const data = await generateJSON<{ variants: any[] }>(
      buildCaptionVariantsPrompt({ workspaceId: ws.id, workspaceName: ws.name, ideaTitle: latestIdea.title, platforms: PLATFORMS }),
      { category: 'caption', promptSummary: 'Multi-platform variants' }
    );
    for (const v of data.variants ?? []) {
      const full = [v.caption, (v.hashtags ?? []).join(' ')].filter(Boolean).join('\n\n');
      await createCaption.mutateAsync({ content: full, platform: v.platform ?? 'tiktok', clip_idea_id: latestIdea.id });
    }
    setIsVariants(false);
  };

  const handleCopy = async (id: string, text: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="os-page max-w-5xl animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <div className="min-w-0">
          <h2 className="text-[22px] sm:text-[26px] font-semibold tracking-tight text-[#FAFAFA]">Caption OS</h2>
          <p className="text-[13px] sm:text-[14px] text-[#71717A] mt-1 truncate">Context: <span className="text-[#A1A1AA]">{latestIdea.title}</span></p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex items-center gap-2 rounded-full border border-white/[0.08] bg-[linear-gradient(180deg,rgba(17,17,17,0.98),rgba(13,13,13,0.96))] px-2.5 py-1.5 shadow-[0_0_0_1px_rgba(124,58,237,0.08),0_10px_24px_rgba(0,0,0,0.22)]">
            <label className="text-[10px] font-medium uppercase tracking-[0.18em] text-[#71717A]">Saved prompt</label>
            <div className="relative">
              <select
                value={selectedPromptId ?? ''}
                onChange={(e) => {
                  const id = e.target.value || null;
                  setSelectedPromptId(id);
                  const p = prompts?.find((x: any) => x.id === id);
                  setSelectedPromptTitle(p?.title);
                  setSelectedPrompt(p?.content);
                }}
                className="h-8 min-w-[170px] appearance-none rounded-full border border-white/[0.08] bg-[radial-gradient(circle_at_top,rgba(124,58,237,0.08),rgba(13,13,13,0.96)_55%)] px-3 pr-8 text-[12px] font-medium text-[#FAFAFA] outline-none transition-all hover:border-primary/35 hover:shadow-[0_0_0_1px_rgba(124,58,237,0.15)] focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
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
                      <input type="checkbox" checked={checked} onChange={(e) => {
                        const val = value;
                        setSelectedKnowledgeSnippets((prev) => e.target.checked ? [...prev, val] : prev.filter((x) => x !== val));
                      }} className="mt-0.5 h-3.5 w-3.5 rounded-sm border border-white/[0.1] bg-[#0D0D0D] accent-[#7C3AED]" />
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
          <div className="flex gap-2 self-start sm:self-auto">
            <Button onClick={handleVariants} disabled={isGenerating || isVariants} variant="outline"
              className="h-10 rounded-[12px] border-white/[0.06] bg-[#111111] text-[#FAFAFA] hover:bg-white/[0.05] text-[13px]">
              {isVariants ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Layers className="h-4 w-4 mr-2" />}
              <span className="hidden sm:inline">All Platforms</span>
              <span className="inline sm:hidden">All</span>
            </Button>
            <Button onClick={handleGenerate} disabled={isGenerating}
              className="h-10 rounded-[12px] px-4 sm:px-5 bg-primary text-white hover:bg-primary/90 shadow-[0_0_15px_rgba(124,58,237,0.3)] text-[13px]">
              {isGenerating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 sm:mr-2" />}
              <span className="hidden sm:inline">Generate</span>
            </Button>
          </div>
        </div>
      </div>

      {(error || message) && (
        <div className={`p-4 rounded-[12px] border text-[13px] ${error ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'}`}>
          {error || message}
        </div>
      )}

      <div className="flex gap-2 flex-wrap">
        {PLATFORMS.map(p => (
          <button key={p} onClick={() => setPlatform(p)}
            className={`px-4 py-1.5 rounded-full text-[12px] font-medium capitalize transition-all ${platform === p ? 'bg-primary text-white shadow-[0_0_10px_rgba(124,58,237,0.3)]' : 'bg-[#111111] border border-white/[0.06] text-[#71717A] hover:text-[#FAFAFA]'}`}>
            {p}
          </button>
        ))}
      </div>

      <form onSubmit={handleCreate} className="flex gap-3">
        <Input placeholder={`Draft a ${platform} caption…`} value={newCaption} onChange={e => setNewCaption(e.target.value)} disabled={isCreating}
          className="h-11 rounded-[12px] bg-[#111111] border-white/[0.06] text-[#FAFAFA] placeholder:text-[#71717A] focus:border-primary/50 max-w-xl" />
        <Button type="submit" disabled={isCreating || !newCaption.trim()} variant="outline"
          className="h-11 rounded-[12px] border-white/[0.06] bg-[#111111] text-[#FAFAFA] hover:bg-white/[0.05]">
          {isCreating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4 mr-1" />}
          Add
        </Button>
      </form>

      {isLoading ? (
        <div className="flex h-32 items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-[#71717A]" /></div>
      ) : captions?.length === 0 ? (
        <EmptyState title="No captions yet" description="Generate platform-optimised captions from your winning hook." actionLabel="Generate Caption" onAction={handleGenerate} />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {captions?.map(cap => (
            <Card key={cap.id} className="bg-[#111111] border border-white/[0.06] rounded-[16px] hover:border-white/[0.12] transition-colors">
              <CardHeader className="px-6 pt-5 pb-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-medium text-[#71717A] uppercase tracking-widest capitalize">{cap.platform}</span>
                  <Button variant="ghost" size="sm" onClick={() => handleCopy(cap.id, cap.content)}
                    className="h-7 px-2.5 text-[12px] text-[#71717A] hover:text-[#FAFAFA] rounded-[8px]">
                    {copiedId === cap.id ? <Check className="h-3 w-3 mr-1 text-emerald-400" /> : <Copy className="h-3 w-3 mr-1" />}
                    {copiedId === cap.id ? 'Copied' : 'Copy'}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="px-6 pb-5">
                <p className="text-[13px] text-[#A1A1AA] whitespace-pre-line leading-relaxed">{cap.content}</p>
                <p className="text-[11px] text-[#71717A] mt-3">{new Date(cap.created_at).toLocaleDateString()}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
