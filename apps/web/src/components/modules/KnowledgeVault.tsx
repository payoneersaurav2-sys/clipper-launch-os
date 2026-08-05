import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useWorkspaceStore } from '@/stores/useWorkspaceStore';
import { answerFromKnowledge } from '@/services/AIService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Upload, FileText, Trash2, Search, Sparkles, Loader2, 
  BookOpen, Plus, X, Link as LinkIcon
} from 'lucide-react';

interface KnowledgeItem {
  id: string;
  title: string;
  content: string;
  file_type: string;
  tags: string[];
  created_at: string;
}

function useKnowledge() {
  const { activeWorkspace } = useWorkspaceStore();
  const wsId = activeWorkspace?.id;
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ['knowledge', wsId],
    queryFn: async (): Promise<KnowledgeItem[]> => {
      const { data, error } = await supabase
        .from('knowledge_items')
        .select('*')
        .eq('workspace_id', wsId)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!wsId,
  });

  const addItem = useMutation({
    mutationFn: async (item: Partial<KnowledgeItem> & { workspace_id: string }) => {
      const { data, error } = await supabase.from('knowledge_items').insert([item]).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['knowledge', wsId] }),
  });

  const deleteItem = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from('knowledge_items').update({ deleted_at: new Date().toISOString() }).eq('id', id);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['knowledge', wsId] }),
  });

  return { ...query, addItem, deleteItem, wsId };
}

function AddItemModal({ wsId, onClose }: { wsId: string; onClose: () => void }) {
  const { addItem } = useKnowledge();
  const [mode, setMode] = useState<'text' | 'url'>('text');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [url, setUrl] = useState('');
  const [tags, setTags] = useState('');
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    setTitle(file.name.replace(/\.[^/.]+$/, ''));
    setContent(text.slice(0, 10000)); // cap at 10k chars
    setMode('text');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || (!content.trim() && !url.trim())) return;
    setSaving(true);
    await addItem.mutateAsync({
      workspace_id: wsId,
      title: title.trim(),
      content: content.trim() || url.trim(),
      file_type: mode === 'url' ? 'url' : 'text',
      tags: tags.split(',').map(t => t.trim()).filter(Boolean),
    });
    setSaving(false);
    onClose();
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={e => e.target === e.currentTarget && onClose()}>
      <motion.div initial={{ scale: 0.96, y: 8 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.96 }}
        className="w-full max-w-md bg-[#111111] border border-white/[0.08] rounded-[20px] p-7 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-[16px] font-semibold text-[#FAFAFA]">Add Knowledge</h3>
          <button onClick={onClose} className="text-[#71717A] hover:text-[#FAFAFA]"><X className="h-4 w-4" /></button>
        </div>

        {/* Mode toggle */}
        <div className="flex gap-1 p-1 rounded-[10px] bg-[#0D0D0D] border border-white/[0.06] mb-5">
          {[{ id: 'text', label: 'Text / File', icon: FileText }, { id: 'url', label: 'URL', icon: LinkIcon }].map(m => (
            <button key={m.id} onClick={() => setMode(m.id as any)}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-[8px] text-[12px] font-medium transition-all ${mode === m.id ? 'bg-primary/10 text-primary' : 'text-[#71717A] hover:text-[#FAFAFA]'}`}>
              <m.icon className="h-3.5 w-3.5" />{m.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Title *" autoFocus
            className="h-10 rounded-[10px] bg-[#0D0D0D] border-white/[0.08] text-[#FAFAFA] placeholder:text-[#71717A]" />

          {mode === 'text' ? (
            <>
              <textarea value={content} onChange={e => setContent(e.target.value)}
                placeholder="Paste text, notes, or guidelines here…" rows={5}
                className="w-full rounded-[10px] bg-[#0D0D0D] border border-white/[0.08] text-[#FAFAFA] placeholder:text-[#71717A] p-3 text-[13px] resize-none outline-none focus:border-primary/50 transition-colors" />
              <input ref={fileRef} type="file" accept=".txt,.md,.pdf" onChange={handleFile} className="hidden" />
              <button type="button" onClick={() => fileRef.current?.click()}
                className="flex items-center gap-2 text-[12px] text-[#71717A] hover:text-primary transition-colors">
                <Upload className="h-3.5 w-3.5" />Upload file (.txt, .md, .pdf)
              </button>
            </>
          ) : (
            <Input value={url} onChange={e => setUrl(e.target.value)} placeholder="https://…" type="url"
              className="h-10 rounded-[10px] bg-[#0D0D0D] border-white/[0.08] text-[#FAFAFA] placeholder:text-[#71717A]" />
          )}

          <Input value={tags} onChange={e => setTags(e.target.value)} placeholder="Tags (comma separated)"
            className="h-10 rounded-[10px] bg-[#0D0D0D] border-white/[0.08] text-[#FAFAFA] placeholder:text-[#71717A]" />

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose}
              className="flex-1 h-10 rounded-[10px] border-white/[0.06] bg-transparent text-[#A1A1AA] text-[13px]">Cancel</Button>
            <Button type="submit" disabled={saving || !title.trim() || (!content.trim() && !url.trim())}
              className="flex-1 h-10 rounded-[10px] bg-primary text-white hover:bg-primary/90 text-[13px]">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Add to Vault'}
            </Button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

export function KnowledgeVault() {
  const { data: items, isLoading, deleteItem, wsId } = useKnowledge();
  const { activeWorkspace } = useWorkspaceStore();
  const [showAdd, setShowAdd] = useState(false);
  const [search, setSearch] = useState('');
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [answering, setAnswering] = useState(false);

  const filtered = items?.filter(i =>
    i.title.toLowerCase().includes(search.toLowerCase()) ||
    i.content.toLowerCase().includes(search.toLowerCase())
  );

  const handleAsk = async () => {
    if (!question.trim() || !items?.length || !wsId) return;
    setAnswering(true);
    setAnswer('');
    const context = items.slice(0, 5).map(i => `[${i.title}]: ${i.content.slice(0, 800)}`).join('\n\n');
    const result = await answerFromKnowledge({
      question: question.trim(),
      context,
      workspaceId: wsId,
      workspaceName: activeWorkspace?.name ?? 'Workspace',
    });
    setAnswer(result.answer);
    setAnswering(false);
  };

  return (
    <div className="space-y-8 max-w-5xl animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[26px] font-semibold tracking-tight text-[#FAFAFA]">Knowledge Vault</h2>
          <p className="text-[14px] text-[#71717A] mt-1">Your AI's long-term memory. Upload resources, brand guides, or notes.</p>
        </div>
        <Button onClick={() => setShowAdd(true)} className="h-10 rounded-[12px] px-5 bg-primary text-white hover:bg-primary/90 text-[13px]">
          <Plus className="h-4 w-4 mr-1.5" />Add Knowledge
        </Button>
      </div>

      {/* AI Ask section */}
      {items && items.length > 0 && (
        <div className="p-6 rounded-[18px] bg-primary/[0.06] border border-primary/20 space-y-3">
          <p className="text-[13px] font-medium text-primary flex items-center gap-2">
            <Sparkles className="h-4 w-4" />Ask your knowledge base
          </p>
          <div className="flex gap-3">
            <Input value={question} onChange={e => setQuestion(e.target.value)}
              placeholder="e.g. What is my brand tone?" onKeyDown={e => e.key === 'Enter' && handleAsk()}
              className="h-10 rounded-[10px] bg-[#0D0D0D] border-white/[0.08] text-[#FAFAFA] placeholder:text-[#71717A] flex-1" />
            <Button onClick={handleAsk} disabled={answering || !question.trim()}
              className="h-10 rounded-[10px] px-5 bg-primary text-white text-[13px]">
              {answering ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Ask'}
            </Button>
          </div>
          <AnimatePresence>
            {answer && (
              <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-[12px] bg-[#0D0D0D] border border-white/[0.06]">
                <p className="text-[13px] text-[#FAFAFA] leading-relaxed whitespace-pre-wrap">{answer}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#71717A]" />
        <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search knowledge…"
          className="h-10 pl-10 rounded-[12px] bg-[#111111] border-white/[0.06] text-[#FAFAFA] placeholder:text-[#71717A]" />
      </div>

      {/* Items grid */}
      {isLoading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => <div key={i} className="h-40 rounded-[16px] bg-[#111111] animate-pulse" />)}
        </div>
      ) : !filtered?.length ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="h-14 w-14 rounded-[16px] bg-primary/10 flex items-center justify-center mb-5">
            <BookOpen className="h-6 w-6 text-primary" />
          </div>
          <h3 className="text-[17px] font-semibold text-[#FAFAFA] mb-2">{search ? 'No results' : 'Vault is empty'}</h3>
          <p className="text-[14px] text-[#71717A] max-w-sm mb-6">
            {search ? 'Try a different search term.' : 'Upload PDFs, paste text, or add URLs. The AI will reference these in every generation.'}
          </p>
          {!search && (
            <Button onClick={() => setShowAdd(true)} className="h-10 rounded-[12px] px-5 bg-primary text-white text-[13px]">
              <Plus className="h-4 w-4 mr-1.5" />Add First Resource
            </Button>
          )}
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence>
            {filtered.map(item => (
              <motion.div key={item.id} layout initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                className="group p-5 rounded-[16px] bg-[#111111] border border-white/[0.06] hover:border-white/[0.12] transition-colors relative">
                <div className="flex items-start justify-between mb-3">
                  <div className="h-8 w-8 rounded-[8px] bg-primary/10 flex items-center justify-center shrink-0">
                    <FileText className="h-4 w-4 text-primary" />
                  </div>
                  <button onClick={() => deleteItem.mutate(item.id)}
                    className="opacity-0 group-hover:opacity-100 text-[#71717A] hover:text-red-400 transition-all p-1">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
                <h4 className="text-[14px] font-semibold text-[#FAFAFA] tracking-tight mb-1.5 line-clamp-1">{item.title}</h4>
                <p className="text-[12px] text-[#71717A] line-clamp-3 leading-relaxed">{item.content}</p>
                {item.tags?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {item.tags.map(tag => (
                      <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-white/[0.06] text-[#71717A] capitalize">{tag}</span>
                    ))}
                  </div>
                )}
                <p className="text-[10px] text-[#71717A] mt-3">{new Date(item.created_at).toLocaleDateString()}</p>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      <AnimatePresence>
        {showAdd && wsId && <AddItemModal wsId={wsId} onClose={() => setShowAdd(false)} />}
      </AnimatePresence>
    </div>
  );
}
