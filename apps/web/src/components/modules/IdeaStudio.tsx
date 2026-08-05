import React, { useState } from 'react';
import { useClipIdeas } from '@/hooks/useClipIdeas';
import { useAI } from '@/hooks/useAI';
import { useWorkspaceStore } from '@/stores/useWorkspaceStore';
import { buildGenerateIdeasPrompt, buildExpandIdeaPrompt } from '@/lib/ai-services';
import AIOutputPanel from '@/components/AIOutputPanel';
import EmptyState from '@/components/EmptyState';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Lightbulb, Plus, Loader2, Sparkles, ChevronDown } from 'lucide-react';

export function IdeaStudio() {
  const { data: ideas, isLoading, createIdea } = useClipIdeas();
  const { activeWorkspace } = useWorkspaceStore();
  const { generateJSON, isGenerating, error, cancel, clearError } = useAI();
  const [newTitle, setNewTitle] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [expandingId, setExpandingId] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Record<string, any>>({});

  const ws = { id: activeWorkspace?.id ?? 'default', name: activeWorkspace?.name ?? 'Workspace' };

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
    const data = await generateJSON<{ ideas: any[] }>(
      buildGenerateIdeasPrompt({ 
        workspaceId: ws.id, 
        workspaceName: ws.name,
        niche: activeWorkspace?.niche,
        platform: activeWorkspace?.platform,
      }),
      { category: 'idea', promptSummary: 'Generate viral ideas' }
    );
    for (const idea of data.ideas ?? []) {
      await createIdea.mutateAsync({ title: idea.title, context: idea.context ?? '' });
    }
  };

  const handleExpand = async (idea: any) => {
    setExpandingId(idea.id);
    const data = await generateJSON<any>(
      buildExpandIdeaPrompt({ 
        workspaceId: ws.id, 
        workspaceName: ws.name, 
        ideaTitle: idea.title,
        platform: activeWorkspace?.platform 
      }),
      { category: 'idea', promptSummary: `Expand: ${idea.title}` }
    );
    setExpanded(prev => ({ ...prev, [idea.id]: data }));
    setExpandingId(null);
  };

  return (
    <div className="space-y-8 max-w-5xl animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[26px] font-semibold tracking-tight text-[#FAFAFA]">Idea Studio</h2>
          <p className="text-[14px] text-[#71717A] mt-1">Generate, capture and expand content ideas.</p>
        </div>
        <Button
          onClick={handleAIGenerate}
          disabled={isGenerating}
          className="h-10 rounded-[12px] px-5 bg-primary text-white hover:bg-primary/90 shadow-[0_0_15px_rgba(124,58,237,0.3)] transition-all"
        >
          {isGenerating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
          Generate Ideas
        </Button>
      </div>

      {error && (
        <div className="p-4 rounded-[12px] bg-red-500/10 border border-red-500/20 text-[13px] text-red-400">{error}</div>
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
