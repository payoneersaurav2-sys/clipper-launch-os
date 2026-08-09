import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Copy, FileText, Loader2, Pencil, Plus, Search, TerminalSquare, Trash2, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useWorkspaceStore } from '@/stores/useWorkspaceStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCredits } from '@/hooks/useCredits';
import { UpgradePrompt } from '@/components/UpgradePrompt';

type SavedPrompt = { id: string; name: string; prompt: string; tags: string[]; updatedAt: string };
type PromptStore = { prompts: SavedPrompt[] };
const SETTINGS_KEY = 'prompt_library';

function PromptEditor({ initial, onClose }: { initial?: SavedPrompt; onClose: () => void }) {
  const { activeWorkspace } = useWorkspaceStore();
  const client = useQueryClient();
  const [name, setName] = useState(initial?.name ?? '');
  const [prompt, setPrompt] = useState(initial?.prompt ?? '');
  const [tags, setTags] = useState(initial?.tags.join(', ') ?? '');
  const [error, setError] = useState<string | null>(null);

  const save = useMutation({
    mutationFn: async () => {
      if (!activeWorkspace) throw new Error('Choose a workspace first.');
      const { data, error: fetchError } = await supabase.from('settings').select('value').eq('workspace_id', activeWorkspace.id).eq('key', SETTINGS_KEY).maybeSingle();
      if (fetchError) throw fetchError;
      const existing = ((data?.value as PromptStore | null)?.prompts ?? []).filter(item => item.id !== initial?.id);
      const item: SavedPrompt = {
        id: initial?.id ?? crypto.randomUUID(),
        name: name.trim(),
        prompt: prompt.trim(),
        tags: tags.split(',').map(tag => tag.trim()).filter(Boolean),
        updatedAt: new Date().toISOString(),
      };
      const { error } = await supabase.from('settings').upsert({ workspace_id: activeWorkspace.id, key: SETTINGS_KEY, value: { prompts: [item, ...existing] } }, { onConflict: 'workspace_id,key' });
      if (error) throw error;
    },
    onSuccess: async () => { await client.invalidateQueries({ queryKey: ['prompt-library', activeWorkspace?.id] }); onClose(); },
    onError: () => setError('Could not save this prompt. Please try again.'),
  });

  return <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-end justify-center bg-black/65 p-0 backdrop-blur-sm sm:items-center sm:p-4" onClick={event => event.currentTarget === event.target && onClose()}>
    <motion.div initial={{ opacity: 0, y: 12, scale: .98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 12 }} className="w-full max-w-xl rounded-t-[20px] border border-white/[0.09] bg-[#111111] p-5 shadow-2xl sm:rounded-[20px] sm:p-7">
      <div className="mb-6 flex items-center justify-between"><div><h3 className="text-base font-semibold text-[#FAFAFA]">{initial ? 'Edit prompt' : 'New prompt'}</h3><p className="mt-1 text-xs text-[#71717A]">Save reusable instructions for your creator workflow.</p></div><button onClick={onClose} className="rounded-lg p-1.5 text-[#71717A] hover:bg-white/[0.06] hover:text-white" aria-label="Close"><X className="h-4 w-4" /></button></div>
      <div className="space-y-4"><Input value={name} onChange={event => setName(event.target.value)} placeholder="Prompt name" autoFocus className="h-11 rounded-[10px] border-white/[0.08] bg-[#0D0D0D] text-[#FAFAFA]" />
        <textarea value={prompt} onChange={event => setPrompt(event.target.value)} rows={8} placeholder="Write the instruction you want to save…" className="w-full resize-none rounded-[10px] border border-white/[0.08] bg-[#0D0D0D] p-3 text-sm text-[#FAFAFA] outline-none transition-colors placeholder:text-[#71717A] focus:border-primary/50" />
        <Input value={tags} onChange={event => setTags(event.target.value)} placeholder="Tags, comma separated" className="h-11 rounded-[10px] border-white/[0.08] bg-[#0D0D0D] text-[#FAFAFA]" />
        {error && <p className="rounded-[10px] border border-primary/20 bg-primary/[0.06] px-3 py-2 text-xs text-[#D4D4D8]">{error}</p>}
        <div className="flex gap-3"><Button variant="outline" onClick={onClose} className="flex-1">Cancel</Button><Button disabled={!name.trim() || !prompt.trim() || save.isPending} onClick={() => save.mutate()} className="flex-1">{save.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save prompt'}</Button></div>
      </div>
    </motion.div>
  </motion.div>;
}

export function PromptLibrary() {
  const { data: credits } = useCredits();
  const { activeWorkspace } = useWorkspaceStore();
  const client = useQueryClient();
  const [query, setQuery] = useState('');
  const [editing, setEditing] = useState<SavedPrompt | undefined>();
  const [editorOpen, setEditorOpen] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const { data: prompts = [], isLoading } = useQuery({
    queryKey: ['prompt-library', activeWorkspace?.id], enabled: Boolean(activeWorkspace),
    queryFn: async () => {
      const { data, error } = await supabase.from('settings').select('value').eq('workspace_id', activeWorkspace!.id).eq('key', SETTINGS_KEY).maybeSingle();
      if (error) throw error;
      return ((data?.value as PromptStore | null)?.prompts ?? []) as SavedPrompt[];
    },
  });
  const remove = useMutation({
    mutationFn: async (id: string) => {
      if (!activeWorkspace) return;
      const value = { prompts: prompts.filter(prompt => prompt.id !== id) };
      const { error } = await supabase.from('settings').upsert({ workspace_id: activeWorkspace.id, key: SETTINGS_KEY, value }, { onConflict: 'workspace_id,key' });
      if (error) throw error;
    }, onSuccess: () => client.invalidateQueries({ queryKey: ['prompt-library', activeWorkspace?.id] }),
  });
  const filtered = useMemo(() => prompts.filter(prompt => `${prompt.name} ${prompt.prompt} ${prompt.tags.join(' ')}`.toLowerCase().includes(query.toLowerCase())), [prompts, query]);
  const copy = async (prompt: SavedPrompt) => { await navigator.clipboard.writeText(prompt.prompt); setCopied(prompt.id); window.setTimeout(() => setCopied(null), 1500); };

  return (
    <div className="mx-auto max-w-5xl space-y-7 animate-in fade-in duration-500">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[.18em] text-primary">Intelligence</p>
          <h2 className="mt-2 text-[26px] font-semibold tracking-tight text-[#FAFAFA]">Prompt Center</h2>
          <p className="mt-1 text-sm text-[#71717A]">Your reusable creative instructions, saved to this workspace.</p>
        </div>
        {credits?.tier !== 'free' && (
          <Button onClick={() => { setEditing(undefined); setEditorOpen(true); }}>
            <Plus className="mr-1.5 h-4 w-4" />New prompt
          </Button>
        )}
      </div>

      {credits?.tier === 'free' ? (
        <div className="mt-8">
          <UpgradePrompt
            feature="Prompt Library"
            requiredPlan="creator"
            description="Save, manage, and reuse your best AI instructions across all workspaces to speed up your content creation."
          />
        </div>
      ) : (
        <>
          <div className="relative"><Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#71717A]" /><Input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search saved prompts…" className="h-11 rounded-[12px] border-white/[0.07] bg-[#111111] pl-10 text-[#FAFAFA]" /></div>
          {isLoading ? <div className="grid gap-3 sm:grid-cols-2">{[0, 1].map(item => <div key={item} className="h-44 animate-pulse rounded-[16px] bg-[#111111]" />)}</div> : filtered.length === 0 ? <div className="flex flex-col items-center rounded-[18px] border border-dashed border-white/[0.1] bg-[#111111]/60 px-6 py-20 text-center"><div className="mb-4 flex h-12 w-12 items-center justify-center rounded-[14px] bg-primary/10"><TerminalSquare className="h-5 w-5 text-primary" /></div><h3 className="font-semibold text-[#FAFAFA]">{query ? 'No matching prompts' : 'Build your prompt library'}</h3><p className="mt-2 max-w-sm text-sm leading-6 text-[#71717A]">{query ? 'Try a different search phrase.' : 'Save the instructions you return to often, then copy or refine them whenever you need.'}</p>{!query && <Button className="mt-5" onClick={() => setEditorOpen(true)}><Plus className="mr-1.5 h-4 w-4" />Save your first prompt</Button>}</div> : <div className="grid gap-3 sm:grid-cols-2">{filtered.map(prompt => <motion.article key={prompt.id} layout className="group rounded-[16px] border border-white/[0.07] bg-[#111111] p-5 transition-colors hover:border-primary/30"><div className="flex items-start justify-between gap-4"><div className="min-w-0"><h3 className="truncate text-sm font-semibold text-[#FAFAFA]">{prompt.name}</h3><p className="mt-2 line-clamp-4 whitespace-pre-wrap text-xs leading-5 text-[#A1A1AA]">{prompt.prompt}</p></div><FileText className="h-4 w-4 shrink-0 text-primary" /></div><div className="mt-4 flex items-center justify-between gap-2"><div className="flex min-w-0 flex-wrap gap-1">{prompt.tags.slice(0, 3).map(tag => <span key={tag} className="rounded-full bg-white/[0.06] px-2 py-0.5 text-[10px] text-[#A1A1AA]">{tag}</span>)}</div><div className="flex shrink-0 gap-1"><button onClick={() => copy(prompt)} className="rounded-lg p-2 text-[#71717A] hover:bg-white/[0.06] hover:text-white" aria-label={`Copy ${prompt.name}`}>{copied === prompt.id ? <span className="text-[10px] text-primary">Copied</span> : <Copy className="h-3.5 w-3.5" />}</button><button onClick={() => { setEditing(prompt); setEditorOpen(true); }} className="rounded-lg p-2 text-[#71717A] hover:bg-white/[0.06] hover:text-white" aria-label={`Edit ${prompt.name}`}><Pencil className="h-3.5 w-3.5" /></button><button onClick={() => remove.mutate(prompt.id)} className="rounded-lg p-2 text-[#71717A] hover:bg-white/[0.06] hover:text-red-300" aria-label={`Delete ${prompt.name}`}><Trash2 className="h-3.5 w-3.5" /></button></div></div></motion.article>)}</div>}
          <AnimatePresence>{editorOpen && <PromptEditor initial={editing} onClose={() => setEditorOpen(false)} />}</AnimatePresence>
        </>
      )}
    </div>
  );
}
