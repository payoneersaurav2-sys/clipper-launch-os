import React, { useState } from 'react';
import EmptyState from './EmptyState';
import { useClipIdeas, ClipIdea } from '@/hooks/useClipIdeas';
import { useHooks } from '@/hooks/useHooks';
import { useCaptions } from '@/hooks/useCaptions';
import { useAI } from '@/hooks/useAI';
import { AI_SCHEMAS } from '@clipper/core/src/ai/schemas';
import { useWorkspaceStore } from '@/stores/useWorkspaceStore';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Lightbulb, Plus, Loader2, ListTree, Type, Star, Sparkles } from 'lucide-react';

export function IdeaStudio() {
  const { data: ideas, isLoading, createIdea } = useClipIdeas();
  const { activeWorkspace } = useWorkspaceStore();
  const { generate, isGenerating } = useAI();
  const [newTitle, setNewTitle] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setIsCreating(true);
    await createIdea.mutateAsync({ title: newTitle, context: '' });
    setNewTitle('');
    setIsCreating(false);
  };

  const handleAIGenerate = async () => {
    if (!activeWorkspace) return;
    try {
      const response = await generate({
         systemPrompt: "You are a viral content strategist. Generate 3 viral clip ideas for the user.",
         developerPrompt: "Return only valid JSON.",
         taskContext: {
           workspace: activeWorkspace.id,
           workflowStage: 'idea',
           userPreferences: {},
           memory: [],
           previousGenerations: []
         },
         expectedJsonSchema: AI_SCHEMAS.ideas
      });
      
      const parsed = JSON.parse(response.content);
      for (const idea of parsed.ideas) {
         await createIdea.mutateAsync({ title: idea.title, context: idea.context });
      }
    } catch (error) {
      console.error("AI Generation failed:", error);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Idea Studio</h2>
        <Button variant="secondary" onClick={handleAIGenerate} disabled={isGenerating}>
          {isGenerating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2 text-primary" />}
          Auto-Generate Ideas
        </Button>
      </div>

      <form onSubmit={handleCreate} className="flex gap-2">
        <Input 
          placeholder="Type a new clip idea (e.g., 'Why developers hate Jira')" 
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          disabled={isCreating}
          className="max-w-xl"
        />
        <Button type="submit" disabled={isCreating || !newTitle.trim()}>
          {isCreating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
          Capture
        </Button>
      </form>

      {isLoading ? (
        <div className="flex h-32 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : ideas?.length === 0 ? (
        <EmptyState 
          title="No ideas generated yet" 
          description="Start your workflow by brainstorming clip concepts. The AI will inject your niche context automatically."
          actionLabel="Brainstorm Ideas"
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {ideas?.map((idea) => (
            <Card key={idea.id} className="hover:border-primary/50 transition-colors cursor-pointer group">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="p-2 rounded-md bg-primary/10 text-primary">
                    <Lightbulb className="h-5 w-5" />
                  </div>
                  <span className="text-xs font-medium px-2 py-1 bg-muted rounded-full uppercase tracking-wider">
                    {idea.status}
                  </span>
                </div>
                <h3 className="font-semibold text-lg line-clamp-2 mb-2 group-hover:text-primary transition-colors">{idea.title}</h3>
                <p className="text-sm text-muted-foreground">Generated {new Date(idea.created_at).toLocaleDateString()}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export function HookEngine() {
  const { data: ideas } = useClipIdeas();
  const latestIdea = ideas?.[0]; 
  const { activeWorkspace } = useWorkspaceStore();
  const { generate, isGenerating: isAIGenerating } = useAI();
  
  const { data: hooks, isLoading, createHook, updateHookStatus } = useHooks(latestIdea?.id);
  const [newHook, setNewHook] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  if (!latestIdea) {
    return (
      <div className="space-y-4 animate-in fade-in duration-500">
        <h2 className="text-3xl font-bold tracking-tight">Hook Engine</h2>
        <EmptyState 
          title="Awaiting Idea Context" 
          description="Create an Idea in the Idea Studio first to start generating and tracking hooks."
          actionLabel="Go to Idea Studio"
        />
      </div>
    );
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHook.trim() || !latestIdea.id) return;
    setIsCreating(true);
    await createHook.mutateAsync({ content: newHook, clip_idea_id: latestIdea.id });
    setNewHook('');
    setIsCreating(false);
  };

  const handleAIGenerate = async () => {
    if (!activeWorkspace || !latestIdea) return;
    try {
      const response = await generate({
         systemPrompt: `Generate 3 highly engaging short-form video hooks for this idea: ${latestIdea.title}`,
         developerPrompt: "Return only valid JSON.",
         taskContext: {
           workspace: activeWorkspace.id,
           workflowStage: 'hook',
           userPreferences: {},
           memory: [],
           previousGenerations: hooks?.map(h => h.content) || []
         },
         expectedJsonSchema: AI_SCHEMAS.hooks
      });
      
      const parsed = JSON.parse(response.content);
      for (const hook of parsed.hooks) {
         await createHook.mutateAsync({ content: hook.content, clip_idea_id: latestIdea.id });
      }
    } catch (error) {
      console.error("AI Generation failed:", error);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
           <h2 className="text-3xl font-bold tracking-tight">Hook Engine</h2>
           <p className="text-muted-foreground mt-1">Context: <span className="font-semibold text-foreground">{latestIdea.title}</span></p>
        </div>
        <Button variant="secondary" onClick={handleAIGenerate} disabled={isAIGenerating}>
          {isAIGenerating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2 text-primary" />}
          Generate Hooks
        </Button>
      </div>

      <form onSubmit={handleCreate} className="flex gap-2">
        <Input 
          placeholder="Manually draft a hook for this idea..." 
          value={newHook}
          onChange={(e) => setNewHook(e.target.value)}
          disabled={isCreating}
          className="max-w-xl"
        />
        <Button type="submit" disabled={isCreating || !newHook.trim()}>
          {isCreating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
          Add Hook
        </Button>
      </form>

      {isLoading ? (
         <div className="flex h-32 items-center justify-center">
           <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
         </div>
      ) : hooks?.length === 0 ? (
         <EmptyState 
           title="No hooks yet" 
           description="Write your first hook for this idea. AI generation will be available soon."
           actionLabel="Focus Input"
         />
      ) : (
         <div className="grid gap-4">
           {hooks?.map((hook) => (
             <Card key={hook.id} className="hover:border-primary/50 transition-colors">
               <CardContent className="p-4 flex items-center justify-between gap-4">
                 <div className="flex items-center gap-4">
                   <div className="p-2 rounded-md bg-muted">
                     <ListTree className="h-4 w-4" />
                   </div>
                   <p className="text-sm font-medium">{hook.content}</p>
                 </div>
                 <div className="flex items-center gap-2">
                   <span className="text-xs font-medium px-2 py-1 bg-muted rounded-full uppercase">
                     {hook.status}
                   </span>
                   <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => updateHookStatus.mutate({ id: hook.id, status: hook.status === 'favorite' ? 'draft' : 'favorite' })}
                   >
                      <Star className={hook.status === 'favorite' ? "h-4 w-4 fill-primary text-primary" : "h-4 w-4"} />
                   </Button>
                 </div>
               </CardContent>
             </Card>
           ))}
         </div>
      )}
    </div>
  );
}

export function CaptionOS() {
  const { data: ideas } = useClipIdeas();
  const latestIdea = ideas?.[0];
  const { activeWorkspace } = useWorkspaceStore();
  const { generate, isGenerating: isAIGenerating } = useAI();
  
  const { data: captions, isLoading, createCaption } = useCaptions(latestIdea?.id);
  const [newCaption, setNewCaption] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  if (!latestIdea) {
    return (
      <div className="space-y-4 animate-in fade-in duration-500">
        <h2 className="text-3xl font-bold tracking-tight">Caption OS</h2>
        <EmptyState 
          title="Awaiting Workflow Context" 
          description="Move an idea through the pipeline to start drafting captions."
          actionLabel="View Pipeline"
        />
      </div>
    );
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCaption.trim() || !latestIdea.id) return;
    setIsCreating(true);
    await createCaption.mutateAsync({ content: newCaption, platform: 'tiktok', clip_idea_id: latestIdea.id });
    setNewCaption('');
    setIsCreating(false);
  };

  const handleAIGenerate = async () => {
    if (!activeWorkspace || !latestIdea) return;
    try {
      const response = await generate({
         systemPrompt: `Write a viral TikTok caption for this video idea: ${latestIdea.title}. Include engaging hooks in the text, a clear CTA, and relevant hashtags.`,
         developerPrompt: "Return only valid JSON.",
         taskContext: {
           workspace: activeWorkspace.id,
           workflowStage: 'caption',
           userPreferences: {},
           memory: [],
           previousGenerations: []
         },
         expectedJsonSchema: AI_SCHEMAS.captions
      });
      
      const parsed = JSON.parse(response.content);
      const fullCaption = `${parsed.caption}\n\n${parsed.cta}\n\n${parsed.hashtags.join(' ')}`;
      await createCaption.mutateAsync({ content: fullCaption, platform: 'tiktok', clip_idea_id: latestIdea.id });
    } catch (error) {
      console.error("AI Generation failed:", error);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
           <h2 className="text-3xl font-bold tracking-tight">Caption OS</h2>
           <p className="text-muted-foreground mt-1">Context: <span className="font-semibold text-foreground">{latestIdea.title}</span></p>
        </div>
        <Button variant="secondary" onClick={handleAIGenerate} disabled={isAIGenerating}>
          {isAIGenerating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2 text-primary" />}
          Generate Caption
        </Button>
      </div>

      <form onSubmit={handleCreate} className="flex gap-2">
        <Input 
          placeholder="Draft a caption for TikTok/Reels..." 
          value={newCaption}
          onChange={(e) => setNewCaption(e.target.value)}
          disabled={isCreating}
          className="max-w-xl"
        />
        <Button type="submit" disabled={isCreating || !newCaption.trim()}>
          {isCreating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
          Add Caption
        </Button>
      </form>

      {isLoading ? (
         <div className="flex h-32 items-center justify-center">
           <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
         </div>
      ) : captions?.length === 0 ? (
         <EmptyState 
           title="No captions drafted" 
           description="Write platform-specific captions with SEO metadata based on your selected Hook."
           actionLabel="Focus Input"
         />
      ) : (
         <div className="grid gap-4 md:grid-cols-2">
           {captions?.map((caption) => (
             <Card key={caption.id}>
               <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center justify-between">
                     <span className="capitalize">{caption.platform}</span>
                     <span className="text-xs bg-muted px-2 py-0.5 rounded-full font-normal">{caption.status}</span>
                  </CardTitle>
               </CardHeader>
               <CardContent>
                 <p className="text-sm">{caption.content}</p>
                 <p className="text-xs text-muted-foreground mt-4">Drafted on {new Date(caption.created_at).toLocaleDateString()}</p>
               </CardContent>
             </Card>
           ))}
         </div>
      )}
    </div>
  );
}

export function LaunchCenter() {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold tracking-tight">Launch Center</h2>
      <EmptyState 
        title="No active campaigns" 
        description="Plan a 7-day launch to organize your generated clips into a cohesive publishing schedule."
        actionLabel="Create Campaign"
      />
    </div>
  );
}

export function ClipTracker() {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold tracking-tight">Clip Tracker</h2>
      <EmptyState 
        title="Pipeline empty" 
        description="Your kanban board will populate as you approve Ideas and move them into production."
        actionLabel="View Pipeline"
      />
    </div>
  );
}

export function KnowledgeVault() {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold tracking-tight">Knowledge Vault</h2>
      <EmptyState 
        title="Upload your brain" 
        description="Drop PDFs, Notion links, and Brand Guidelines here. The AI will remember them forever."
        actionLabel="Add Resource"
      />
    </div>
  );
}

export function PromptLibrary() {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold tracking-tight">Prompt Library</h2>
      <EmptyState 
        title="No custom prompts" 
        description="Save your best performing AI instructions here for 1-click execution later."
        actionLabel="New Prompt"
      />
    </div>
  );
}

export function Analytics() {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold tracking-tight">Analytics</h2>
      <EmptyState 
        title="Insufficient Data" 
        description="Publish your first campaign to unlock the earnings and engagement dashboard."
        actionLabel="Connect Social Accounts"
      />
    </div>
  );
}
