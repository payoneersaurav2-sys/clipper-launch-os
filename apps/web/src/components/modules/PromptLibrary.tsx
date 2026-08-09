import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, Clock3, Copy, FileText, Layers, Loader2, Pencil, Plus, Search, Sparkles, Star, TerminalSquare, Trash2, X, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { UpgradePrompt } from '@/components/UpgradePrompt';
import { AIPromptContext } from '@clipper/core/src/ai/types';
import { useAI } from '@/hooks/useAI';
import { useAuthStore } from '@/stores/useAuthStore';
import { useWorkspaceStore } from '@/stores/useWorkspaceStore';
import { useCredits } from '@/hooks/useCredits';
import { useEntitlements } from '@/hooks/useEntitlements';
import {
  compilePromptTemplate,
  createPrompt,
  deletePrompt,
  duplicatePrompt,
  extractPromptVariables,
  fetchWorkspacePrompts,
  incrementPromptUsage,
  PROMPT_CATEGORIES,
  STARTER_PROMPTS,
  toggleFavorite,
  updatePrompt,
  type PromptCategory,
  type PromptDraft,
  type SavedPromptRow,
} from '@/lib/promptLibraryService';

type PromptFilter = 'all' | 'favorites' | 'recent' | 'popular';
type PromptSort = 'updated' | 'used' | 'popular' | 'az';

type PromptEditorSeed = {
  title?: string;
  description?: string;
  content?: string;
  category?: PromptCategory;
  tags?: string[] | readonly string[];
  favorite?: boolean;
};

function PromptEditor({ initial, seed, onClose }: { initial?: SavedPromptRow; seed?: PromptEditorSeed; onClose: () => void }) {
  const { activeWorkspace } = useWorkspaceStore();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [title, setTitle] = useState(initial?.title ?? seed?.title ?? '');
  const [description, setDescription] = useState(initial?.description || seed?.description || '');
  const [content, setContent] = useState(initial?.content ?? seed?.content ?? '');
  const [category, setCategory] = useState<PromptCategory | string>(initial?.category ?? seed?.category ?? 'General');
  const [tags, setTags] = useState((initial?.tags ?? seed?.tags ?? []).join(', '));
  const [favorite, setFavorite] = useState(Boolean(initial?.favorite ?? seed?.favorite));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setTitle(initial?.title ?? seed?.title ?? '');
    setDescription(initial?.description || seed?.description || '');
    setContent(initial?.content ?? seed?.content ?? '');
    setCategory(initial?.category ?? seed?.category ?? 'General');
    setTags((initial?.tags ?? seed?.tags ?? []).join(', '));
    setFavorite(Boolean(initial?.favorite ?? seed?.favorite));
  }, [initial?.id, seed?.title, seed?.description, seed?.content, seed?.category, seed?.favorite, seed?.tags]);

  const save = useMutation({
    mutationFn: async () => {
      if (!activeWorkspace || !user) throw new Error('Choose a workspace and sign in to save prompts.');
      const trimmedTitle = title.trim();
      const trimmedContent = content.trim();
      if (!trimmedTitle || !trimmedContent) throw new Error('Add a title and prompt body before saving.');
      const tagList = tags.split(',').map((tag) => tag.trim()).filter(Boolean);
      const payload: PromptDraft = {
        workspaceId: activeWorkspace.id,
        userId: user.id,
        title: trimmedTitle,
        description: description.trim(),
        content: trimmedContent,
        category,
        tags: tagList,
        favorite,
        variables: extractPromptVariables(trimmedContent),
        visibility: 'private',
      };
      if (initial?.id) {
        return updatePrompt(initial.id, payload);
      }
      return createPrompt(payload);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['prompts', activeWorkspace?.id, user?.id] });
      onClose();
    },
    onError: (err: Error) => setError(err.message || 'We could not save this prompt. Please try again.'),
  });

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-0 backdrop-blur-sm sm:items-center sm:p-4" onClick={(event) => event.currentTarget === event.target && onClose()}>
      <motion.div initial={{ opacity: 0, y: 12, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 12 }} className="w-full max-w-2xl rounded-t-[20px] border border-white/[0.08] bg-[#111111] p-5 shadow-2xl sm:rounded-[20px] sm:p-7">
        <div className="mb-6 flex items-start justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-[#FAFAFA]">{initial ? 'Edit prompt' : 'New prompt'}</h3>
            <p className="mt-1 text-xs leading-5 text-[#71717A]">Create a reusable AI instruction for your team, workflow, or content style.</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-[#71717A] hover:bg-white/[0.06] hover:text-white" aria-label="Close">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between rounded-[12px] border border-white/[0.06] bg-[#0D0D0D] px-3 py-2">
            <span className="text-xs font-medium uppercase tracking-[0.18em] text-[#A1A1AA]">Prompt details</span>
            <button type="button" onClick={() => setFavorite((value) => !value)} className={`flex items-center gap-2 rounded-full px-2.5 py-1 text-xs ${favorite ? 'bg-primary/15 text-primary' : 'bg-white/[0.05] text-[#A1A1AA]'}`}>
              <Star className={`h-3.5 w-3.5 ${favorite ? 'fill-current' : ''}`} />
              {favorite ? 'Favorite' : 'Mark favorite'}
            </button>
          </div>

          <Input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Prompt title" autoFocus className="h-11 rounded-[10px] border-white/[0.08] bg-[#0D0D0D] text-[#FAFAFA]" />
          <Input value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Short description" className="h-11 rounded-[10px] border-white/[0.08] bg-[#0D0D0D] text-[#FAFAFA]" />
          <textarea value={content} onChange={(event) => setContent(event.target.value)} rows={10} placeholder="Write the instruction you want to reuse. Use {{topic}} and other variables to make it dynamic." className="w-full resize-none rounded-[10px] border border-white/[0.08] bg-[#0D0D0D] p-3 text-sm text-[#FAFAFA] outline-none transition-colors placeholder:text-[#71717A] focus:border-primary/50" />

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-xs font-medium uppercase tracking-[0.16em] text-[#71717A]">Category</label>
              <select value={category} onChange={(event) => setCategory(event.target.value)} className="h-11 w-full rounded-[10px] border border-white/[0.08] bg-[#0D0D0D] px-3 text-sm text-[#FAFAFA] outline-none">
                {PROMPT_CATEGORIES.map((option) => <option key={option} value={option}>{option}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-2 block text-xs font-medium uppercase tracking-[0.16em] text-[#71717A]">Tags</label>
              <Input value={tags} onChange={(event) => setTags(event.target.value)} placeholder="hooks, viral, strategy" className="h-11 rounded-[10px] border-white/[0.08] bg-[#0D0D0D] text-[#FAFAFA]" />
            </div>
          </div>

          {error && <p className="rounded-[10px] border border-primary/20 bg-primary/[0.06] px-3 py-2 text-xs text-[#D4D4D8]">{error}</p>}

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
            <Button disabled={!title.trim() || !content.trim() || save.isPending} onClick={() => save.mutate()} className="flex-1">
              {save.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}Save prompt
            </Button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function UsePromptModal({ prompt, onClose, onSaveAsPrompt, canUsePromptLibrary }: { prompt: SavedPromptRow; onClose: () => void; onSaveAsPrompt: (prompt: SavedPromptRow, result: string) => void; canUsePromptLibrary: boolean }) {
  const { activeWorkspace } = useWorkspaceStore();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const { data: credits } = useCredits();
  const { generate, isGenerating } = useAI();
  const [values, setValues] = useState<Record<string, string>>({});
  const [result, setResult] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const variables = useMemo(() => extractPromptVariables(prompt.content), [prompt.content]);
  const compiledPrompt = useMemo(() => compilePromptTemplate(prompt.content, values), [prompt.content, values]);

  useEffect(() => {
    setValues(Object.fromEntries(variables.map((variable) => [variable, ''])));
    setResult(null);
    setError(null);
  }, [variables.join('|')]);

  const runPrompt = async () => {
    if (!canUsePromptLibrary) {
      setError('Upgrade to Creator to run saved prompts.');
      setIsRunning(false);
      return;
    }
    if (!activeWorkspace || !user) {
      setError('Sign in and choose a workspace before running prompts.');
      return;
    }

    setIsRunning(true);
    setError(null);
    try {
      const developerParts: string[] = [];
      if (prompt.description) developerParts.push(prompt.description);
      if (prompt.system_instructions) developerParts.push(`System guidance: ${prompt.system_instructions}`);
      developerParts.push('Follow the saved instructions precisely and return a directly reusable answer.');
      const context: AIPromptContext = {
        systemPrompt: prompt.title,
        developerPrompt: developerParts.join('\n\n'),
        userMessage: compiledPrompt,
        taskContext: {
          workspace: { id: activeWorkspace.id, name: activeWorkspace.name, niche: activeWorkspace.niche ?? undefined, platform: activeWorkspace.platform ?? undefined },
          workflowStage: 'idea',
          userPreferences: {},
          memory: [],
          previousGenerations: [],
        },
        billingOperation: 'prompt_library_execution',
        temperature: 0.75,
        maxTokens: 1800,
      };
      const response = await generate(context);
      setResult(response.content);
      await incrementPromptUsage(prompt.id);
      await queryClient.invalidateQueries({ queryKey: ['prompts', activeWorkspace?.id, user?.id] });
    } catch (err) {
      const aiError = err as Error & { code?: string };
      const message = aiError?.code === 'INSUFFICIENT_CREDITS'
        ? 'You do not have enough credits to run this prompt right now.'
        : aiError?.message || 'The prompt could not be executed.';
      setError(message);
    } finally {
      setIsRunning(false);
    }
  };

  const copyResult = async () => {
    if (!result) return;
    await navigator.clipboard.writeText(result);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[60] flex items-end justify-center bg-black/70 p-0 backdrop-blur-sm sm:items-center sm:p-4" onClick={(event) => event.currentTarget === event.target && onClose()}>
      <motion.div initial={{ opacity: 0, y: 12, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 12 }} className="w-full max-w-3xl rounded-t-[20px] border border-white/[0.08] bg-[#111111] p-5 shadow-2xl sm:rounded-[20px] sm:p-7">
        <div className="mb-5 flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">Use prompt</p>
            <h3 className="mt-1 text-lg font-semibold text-[#FAFAFA]">{prompt.title}</h3>
            <p className="mt-1 text-sm text-[#71717A]">Fill in the variables, run the prompt, and reuse the result inside Creator OS.</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-[#71717A] hover:bg-white/[0.06] hover:text-white" aria-label="Close">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="space-y-4">
            <div className="rounded-[14px] border border-white/[0.08] bg-[#0D0D0D] p-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-xs font-medium uppercase tracking-[0.16em] text-[#71717A]">Variables</span>
                <span className="text-xs text-[#A1A1AA]">{variables.length ? `${variables.length} placeholders` : 'No variables'}</span>
              </div>
              {variables.length === 0 ? (
                <p className="text-sm text-[#A1A1AA]">This prompt does not require any extra inputs.</p>
              ) : (
                <div className="space-y-3">
                  {variables.map((variable) => (
                    <div key={variable}>
                      <label className="mb-1 block text-sm text-[#FAFAFA]">{variable}</label>
                      <Input value={values[variable] ?? ''} onChange={(event) => setValues((current) => ({ ...current, [variable]: event.target.value }))} placeholder={variable} className="h-10 rounded-[10px] border-white/[0.08] bg-[#111111] text-[#FAFAFA]" />
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-[14px] border border-white/[0.08] bg-[#0D0D0D] p-4">
              <div className="mb-3 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.16em] text-[#71717A]">
                <Sparkles className="h-3.5 w-3.5 text-primary" />Compiled prompt
              </div>
              <pre className="whitespace-pre-wrap break-words text-sm leading-6 text-[#D4D4D8]">{compiledPrompt}</pre>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-[14px] border border-white/[0.08] bg-[#0D0D0D] p-4">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-[#FAFAFA]">AI output</p>
                  <p className="text-xs text-[#71717A]">Runs through the existing Creator OS AI gateway and credit system.</p>
                </div>
                <div className="rounded-full bg-primary/10 px-2.5 py-1 text-xs text-primary">{credits?.available ?? 0} credits</div>
              </div>

              {error ? (
                <div className="space-y-3 rounded-[12px] border border-primary/20 bg-primary/[0.08] p-3 text-sm text-[#F5F5F5]">
                  <p>{error}</p>
                  {error.includes('credits') && <UpgradePrompt feature="Prompt execution" requiredPlan="creator" description="Unlock unlimited prompt runs and keep your workflow moving with a Creator plan." compact />}
                </div>
              ) : result ? (
                <div className="space-y-3">
                  <div className="rounded-[12px] border border-white/[0.06] bg-[#111111] p-3">
                    <pre className="max-h-[320px] overflow-auto whitespace-pre-wrap break-words text-sm leading-6 text-[#D4D4D8]">{result}</pre>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button onClick={copyResult} className="flex items-center gap-2">
                      <Copy className="h-4 w-4" />{copied ? 'Copied' : 'Copy result'}
                    </Button>
                    <Button variant="outline" onClick={() => onSaveAsPrompt(prompt, result)}>
                      <Layers className="mr-2 h-4 w-4" />Save as prompt
                    </Button>
                    <Button variant="outline" onClick={runPrompt}>
                      <Zap className="mr-2 h-4 w-4" />Run again
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex min-h-[220px] flex-col items-center justify-center rounded-[12px] border border-dashed border-white/[0.1] bg-[#111111]/60 px-4 py-8 text-center">
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-[12px] bg-primary/10 text-primary">
                    <Zap className="h-4 w-4" />
                  </div>
                  <p className="text-sm text-[#FAFAFA]">Ready to generate something useful.</p>
                  <p className="mt-1 text-xs leading-5 text-[#71717A]">The result will appear here as a polished output you can reuse immediately.</p>
                </div>
              )}
            </div>

            <Button onClick={runPrompt} disabled={isRunning || isGenerating} className="w-full">
              {isRunning || isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Zap className="mr-2 h-4 w-4" />}Run prompt
            </Button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

export function PromptLibrary() {
  const { user } = useAuthStore();
  const { data: entitlements, isLoading: entitlementsLoading } = useEntitlements();
  const canUsePromptLibrary = entitlements?.capabilities?.prompt_library === true;
  const isPromptLibraryDisabled = Boolean(user) && !entitlementsLoading && !canUsePromptLibrary;
  const { activeWorkspace } = useWorkspaceStore();
  const queryClient = useQueryClient();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<'all' | PromptCategory>('all');
  const [filter, setFilter] = useState<PromptFilter>('all');
  const [sortBy, setSortBy] = useState<PromptSort>('updated');
  const [editing, setEditing] = useState<SavedPromptRow | undefined>();
  const [editorSeed, setEditorSeed] = useState<PromptEditorSeed | undefined>();
  const [editorOpen, setEditorOpen] = useState(false);
  const [activePrompt, setActivePrompt] = useState<SavedPromptRow | undefined>();
  const [usePromptOpen, setUsePromptOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const { data: prompts = [], isLoading } = useQuery({
    queryKey: ['prompts', activeWorkspace?.id, user?.id],
    enabled: Boolean(activeWorkspace && user && canUsePromptLibrary),
    queryFn: async () => fetchWorkspacePrompts(activeWorkspace!.id),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      if (!activeWorkspace || !user) throw new Error('Authentication required.');
      await deletePrompt(id);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['prompts', activeWorkspace?.id, user?.id] });
    },
  });

  const favoriteToggle = useMutation({
    mutationFn: async ({ id, favorite }: { id: string; favorite: boolean }) => toggleFavorite(id, favorite),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['prompts', activeWorkspace?.id, user?.id] });
    },
  });

  const duplicate = useMutation({
    mutationFn: async (prompt: SavedPromptRow) => {
      if (!activeWorkspace || !user) throw new Error('Authentication required.');
      return duplicatePrompt(prompt, activeWorkspace.id, user.id);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['prompts', activeWorkspace?.id, user?.id] });
    },
  });

  const copyPrompt = async (prompt: SavedPromptRow) => {
    await navigator.clipboard.writeText(prompt.content);
    setCopiedId(prompt.id);
    window.setTimeout(() => setCopiedId(null), 1500);
  };

  const filteredPrompts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const nextPrompts = prompts.filter((prompt) => {
      const matchesText = !normalizedQuery || `${prompt.title} ${prompt.description ?? ''} ${prompt.content} ${prompt.tags.join(' ')}`.toLowerCase().includes(normalizedQuery);
      const matchesCategory = category === 'all' || prompt.category === category;
      const matchesFilter = filter === 'all'
        || (filter === 'favorites' && prompt.favorite)
        || (filter === 'recent' && !!prompt.last_used_at)
        || (filter === 'popular' && Number(prompt.usage_count ?? 0) > 0);
      return matchesText && matchesCategory && matchesFilter;
    });

    return [...nextPrompts].sort((a, b) => {
      if (sortBy === 'used') return new Date(b.last_used_at ?? b.updated_at).getTime() - new Date(a.last_used_at ?? a.updated_at).getTime();
      if (sortBy === 'popular') return (b.usage_count ?? 0) - (a.usage_count ?? 0);
      if (sortBy === 'az') return a.title.localeCompare(b.title);
      return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
    });
  }, [category, filter, prompts, query, sortBy]);

  const openEditor = (prompt?: SavedPromptRow, seed?: PromptEditorSeed) => {
    if (!canUsePromptLibrary) return;
    setEditing(prompt);
    setEditorSeed(seed);
    setEditorOpen(true);
  };

  const openUseModal = (prompt: SavedPromptRow) => {
    if (!canUsePromptLibrary) return;
    setActivePrompt(prompt);
    setUsePromptOpen(true);
  };

  if (isPromptLibraryDisabled) {
    return (
      <div className="mx-auto max-w-6xl space-y-7 animate-in fade-in duration-500">
        <div className="rounded-[18px] border border-white/[0.06] bg-[#111111]/70 p-8">
          <div className="mb-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">Prompt Intelligence</p>
            <h2 className="mt-2 text-[26px] font-semibold tracking-tight text-[#FAFAFA]">Prompt Library</h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[#71717A]">Save your best AI instructions, reuse them across Creator OS, and run them with variables and your existing credit system.</p>
          </div>

          <div className="space-y-5">
            <UpgradePrompt feature="Prompt Library" requiredPlan="creator" description="Unlock prompt execution, workspace-scoped prompt storage, and reusable AI workflows with a Creator subscription." />
            <Button disabled className="h-11 rounded-[12px] px-5 bg-white/5 text-[#71717A] border border-white/[0.08]">
              <Plus className="mr-2 h-4 w-4" />New prompt
            </Button>
            <p className="text-sm text-[#71717A]">Creator subscription members can save prompts, automate instructions, and run prompt executions directly from the library.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-6xl animate-in fade-in duration-500">
      <div className="flex flex-col gap-3 rounded-[18px] border border-white/[0.06] bg-[#111111]/70 p-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#71717A]" />
          <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search title, description, prompt, or tags" className="h-11 rounded-[12px] border-white/[0.07] bg-[#0D0D0D] pl-10 text-[#FAFAFA]" />
        </div>
        <div className="flex flex-wrap gap-2">
          {(['all', 'favorites', 'recent', 'popular'] as PromptFilter[]).map((item) => (
            <button key={item} onClick={() => setFilter(item)} className={`rounded-full px-3 py-1.5 text-sm ${filter === item ? 'bg-primary/15 text-primary' : 'bg-white/[0.05] text-[#A1A1AA]'}`}>
              {item === 'all' ? 'All' : item === 'favorites' ? 'Favorites' : item === 'recent' ? 'Recently used' : 'Most used'}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-3 rounded-[18px] border border-white/[0.06] bg-[#111111]/60 p-3 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setCategory('all')} className={`rounded-full px-3 py-1.5 text-sm ${category === 'all' ? 'bg-primary/15 text-primary' : 'bg-white/[0.05] text-[#A1A1AA]'}`}>All categories</button>
          {PROMPT_CATEGORIES.map((item) => (
            <button key={item} onClick={() => setCategory(item)} className={`rounded-full px-3 py-1.5 text-sm ${category === item ? 'bg-primary/15 text-primary' : 'bg-white/[0.05] text-[#A1A1AA]'}`}>{item}</button>
          ))}
        </div>
        <select value={sortBy} onChange={(event) => setSortBy(event.target.value as PromptSort)} className="h-10 rounded-[10px] border border-white/[0.08] bg-[#0D0D0D] px-3 text-sm text-[#FAFAFA]">
          <option value="updated">Recently updated</option>
          <option value="used">Recently used</option>
          <option value="popular">Most used</option>
          <option value="az">A–Z</option>
        </select>
      </div>

      {isLoading ? (
        <div className="grid gap-3 md:grid-cols-2">
          {[0, 1, 2, 3].map((item) => <div key={item} className="h-44 animate-pulse rounded-[16px] bg-[#111111]" />)}
        </div>
      ) : !activeWorkspace || !user ? (
        <div className="rounded-[18px] border border-dashed border-white/[0.1] bg-[#111111]/60 p-10 text-center text-[#A1A1AA]">
          <p className="text-base font-medium text-[#FAFAFA]">Sign in and select a workspace to open your prompt library.</p>
        </div>
      ) : filteredPrompts.length === 0 && prompts.length === 0 ? (
        <div className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="rounded-[18px] border border-dashed border-white/[0.1] bg-[#111111]/60 p-8 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-[14px] bg-primary/10 text-primary">
              <TerminalSquare className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-semibold text-[#FAFAFA]">Start building your prompt workspace</h3>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#71717A]">Save your best AI instructions here so you can reuse them later with variables and your Creator OS credits.</p>
            <Button className="mt-5" onClick={() => openEditor(undefined, undefined)}>
              <Plus className="mr-2 h-4 w-4" />Create your first prompt
            </Button>
          </div>
          <div className="rounded-[18px] border border-white/[0.06] bg-[#111111]/70 p-4">
            <div className="mb-4 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold text-[#FAFAFA]">Starter prompt templates</h3>
            </div>
            <div className="space-y-3">
              {STARTER_PROMPTS.map((template) => (
                <div key={template.title} className="rounded-[12px] border border-white/[0.06] bg-[#0D0D0D] p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-[#FAFAFA]">{template.title}</p>
                      <p className="mt-1 text-xs leading-5 text-[#71717A]">{template.description}</p>
                    </div>
                    <button onClick={() => openEditor(undefined, template)} className="rounded-full bg-primary/10 px-2.5 py-1 text-xs text-primary">Save</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : filteredPrompts.length === 0 ? (
        <div className="flex flex-col items-center rounded-[18px] border border-dashed border-white/[0.1] bg-[#111111]/60 px-6 py-16 text-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-[14px] bg-primary/10 text-primary">
            <TerminalSquare className="h-5 w-5" />
          </div>
          <h3 className="text-lg font-semibold text-[#FAFAFA]">No prompts match this view</h3>
          <p className="mt-2 max-w-sm text-sm leading-6 text-[#71717A]">Try a different search phrase, category, or filter.</p>
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {filteredPrompts.map((prompt) => (
            <motion.article key={prompt.id} layout className="group rounded-[16px] border border-white/[0.07] bg-[#111111] p-5 transition-colors hover:border-primary/30">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.2em] text-primary">{prompt.category || 'General'}</span>
                    {prompt.favorite && <span className="rounded-full bg-white/[0.06] px-2.5 py-1 text-[10px] text-[#A1A1AA]">Favorite</span>}
                  </div>
                  <h3 className="mt-3 text-sm font-semibold text-[#FAFAFA]">{prompt.title}</h3>
                  <p className="mt-2 line-clamp-4 whitespace-pre-wrap text-xs leading-5 text-[#A1A1AA]">{prompt.description || prompt.content}</p>
                </div>
                <FileText className="h-4 w-4 shrink-0 text-primary" />
              </div>

              <div className="mt-4 flex flex-wrap gap-1">
                {(prompt.tags ?? []).slice(0, 4).map((tag) => <span key={tag} className="rounded-full bg-white/[0.06] px-2 py-0.5 text-[10px] text-[#A1A1AA]">{tag}</span>)}
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-3 text-[11px] text-[#71717A]">
                <span className="inline-flex items-center gap-1"><Clock3 className="h-3.5 w-3.5" />{prompt.last_used_at ? `Used ${new Date(prompt.last_used_at).toLocaleDateString()}` : 'Never used'}</span>
                <span className="inline-flex items-center gap-1"><Zap className="h-3.5 w-3.5" />{Number(prompt.usage_count ?? 0)} runs</span>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <Button
                  disabled={!canUsePromptLibrary}
                  title={canUsePromptLibrary ? undefined : 'Upgrade to Creator to execute saved prompts.'}
                  onClick={() => openUseModal(prompt)}
                  className="flex items-center gap-2"
                >
                  <Zap className="h-4 w-4" />Use
                </Button>
                <Button variant="outline" onClick={() => copyPrompt(prompt)} className="flex items-center gap-2">
                  <Copy className="h-4 w-4" />{copiedId === prompt.id ? 'Copied' : 'Copy'}
                </Button>
                <Button variant="outline" onClick={() => openEditor(prompt)} className="flex items-center gap-2">
                  <Pencil className="h-4 w-4" />Edit
                </Button>
                <Button variant="outline" onClick={() => duplicate.mutate(prompt)} className="flex items-center gap-2">
                  <Layers className="h-4 w-4" />Duplicate
                </Button>
                <button onClick={() => favoriteToggle.mutate({ id: prompt.id, favorite: !prompt.favorite })} className={`rounded-lg p-2 ${prompt.favorite ? 'text-primary' : 'text-[#71717A]'} hover:bg-white/[0.06] hover:text-white`} aria-label={`Toggle favorite ${prompt.title}`}>
                  <Star className={`h-4 w-4 ${prompt.favorite ? 'fill-current' : ''}`} />
                </button>
                <button onClick={() => remove.mutate(prompt.id)} className="rounded-lg p-2 text-[#71717A] hover:bg-white/[0.06] hover:text-red-300" aria-label={`Delete ${prompt.title}`}>
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </motion.article>
          ))}
        </div>
      )}

      <AnimatePresence>
        {editorOpen && <PromptEditor initial={editing} seed={editorSeed} onClose={() => { setEditorOpen(false); setEditing(undefined); setEditorSeed(undefined); }} />}
      </AnimatePresence>

      <AnimatePresence>
        {usePromptOpen && activePrompt && (
          <UsePromptModal
            prompt={activePrompt}
            canUsePromptLibrary={canUsePromptLibrary}
            onClose={() => {
              setUsePromptOpen(false);
              setActivePrompt(undefined);
            }}
            onSaveAsPrompt={(prompt, result) => {
              setUsePromptOpen(false);
              setActivePrompt(undefined);
              openEditor(undefined, {
                title: `${prompt.title} Result`,
                description: 'Saved from a prompt run.',
                content: result,
                category: 'General',
                tags: ['ai-output', 'saved'],
                favorite: false,
              });
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
