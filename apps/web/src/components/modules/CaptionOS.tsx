import React, { useState } from 'react';
import { useClipIdeas } from '@/hooks/useClipIdeas';
import { useCaptions } from '@/hooks/useCaptions';
import { useAI } from '@/hooks/useAI';
import { useWorkspaceStore } from '@/stores/useWorkspaceStore';
import { buildGenerateCaptionPrompt, buildCaptionVariantsPrompt } from '@/lib/ai-services';
import EmptyState from '@/components/EmptyState';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Loader2, Sparkles, Copy, Check, Layers } from 'lucide-react';

const PLATFORMS = ['tiktok', 'youtube', 'instagram', 'twitter'];

export function CaptionOS() {
  const { data: ideas } = useClipIdeas();
  const latestIdea = ideas?.[0];
  const { activeWorkspace } = useWorkspaceStore();
  const { data: captions, isLoading, createCaption } = useCaptions(latestIdea?.id);
  const { generateJSON, isGenerating, error, clearError } = useAI();
  const [newCaption, setNewCaption] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [platform, setPlatform] = useState('tiktok');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isVariants, setIsVariants] = useState(false);

  const ws = { id: activeWorkspace?.id ?? 'default', name: activeWorkspace?.name ?? 'Workspace' };

  if (!latestIdea) return (
    <div className="space-y-4 animate-in fade-in duration-500">
      <h2 className="text-[26px] font-semibold tracking-tight text-[#FAFAFA]">Caption OS</h2>
      <EmptyState title="Awaiting Workflow Context" description="Create an idea first to start drafting captions." actionLabel="Go to Idea Studio" />
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
    const data = await generateJSON<any>(
      buildGenerateCaptionPrompt({ workspaceId: ws.id, workspaceName: ws.name, ideaTitle: latestIdea.title, platform }),
      { category: 'caption', promptSummary: `Caption: ${latestIdea.title}` }
    );
    const full = [data.hook, data.body ?? data.caption, data.cta, (data.hashtags ?? []).join(' ')].filter(Boolean).join('\n\n');
    await createCaption.mutateAsync({ content: full, platform, clip_idea_id: latestIdea.id });
  };

  const handleVariants = async () => {
    clearError();
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
    <div className="space-y-8 max-w-5xl animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[26px] font-semibold tracking-tight text-[#FAFAFA]">Caption OS</h2>
          <p className="text-[13px] text-[#71717A] mt-1">Context: <span className="text-[#A1A1AA]">{latestIdea.title}</span></p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleVariants} disabled={isGenerating || isVariants} variant="outline"
            className="h-10 rounded-[12px] border-white/[0.06] bg-[#111111] text-[#FAFAFA] hover:bg-white/[0.05] text-[13px]">
            {isVariants ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Layers className="h-4 w-4 mr-2" />}
            All Platforms
          </Button>
          <Button onClick={handleGenerate} disabled={isGenerating}
            className="h-10 rounded-[12px] px-5 bg-primary text-white hover:bg-primary/90 shadow-[0_0_15px_rgba(124,58,237,0.3)]">
            {isGenerating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
            Generate
          </Button>
        </div>
      </div>

      {error && <div className="p-4 rounded-[12px] bg-red-500/10 border border-red-500/20 text-[13px] text-red-400">{error}</div>}

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
        <EmptyState title="No captions yet" description="Generate platform-optimised captions from your winning hook." actionLabel="Generate Caption" />
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
