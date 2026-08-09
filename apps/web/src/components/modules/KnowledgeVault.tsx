import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Session } from '@supabase/supabase-js';
import { supabase, supabaseUrl } from '@/lib/supabase';
import { useWorkspaceStore } from '@/stores/useWorkspaceStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { buildKnowledgeAnswerPrompt } from '@/lib/ai-services';
import { useAI } from '@/hooks/useAI';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Upload, FileText, Trash2, Search, Sparkles, Loader2,
  BookOpen, Plus, X, RefreshCw, Globe2, FileCheck2,
} from 'lucide-react';
import { useCredits } from '@/hooks/useCredits';
import { UpgradePrompt } from '@/components/UpgradePrompt';

interface KnowledgeItem {
  id: string;
  title: string;
  content: string;
  file_type: string;
  tags: string[];
  created_at: string;
  file_url?: string | null;
  source_type?: 'text' | 'file' | 'website';
  source_url?: string | null;
  ingestion_status?: 'ready' | 'processing' | 'failed';
  ingestion_error?: string | null;
  content_excerpt?: string | null;
  metadata?: Record<string, unknown> | null;
}

interface KnowledgeChunk {
  id: string;
  resource_id: string;
  source_type: string;
  source_name: string;
  source_url?: string | null;
  page_number?: number | null;
  chunk_index: number;
  content: string;
  metadata?: Record<string, unknown> | null;
}

function formatFunctionError(error: unknown, data?: { success?: boolean; message?: string; error?: { message?: string } }) {
  const supabaseError = error as { message?: string; details?: string; hint?: string; name?: string; status?: number };
  const message = supabaseError?.message
    || supabaseError?.details
    || supabaseError?.hint
    || data?.error?.message
    || data?.message
    || 'The website could not be ingested.';
  if (supabaseError?.name || supabaseError?.status) {
    return `${message} ${supabaseError.name ?? ''}${supabaseError.status ? ` (${supabaseError.status})` : ''}`.trim();
  }
  return message;
}

async function getValidAccessToken(currentSession: Session | null, setSession: (session: Session | null) => void) {
  const { data: currentSessionData } = await supabase.auth.getSession();
  const session = currentSessionData?.session ?? currentSession;

  if (!session) {
    throw new Error('Sign in again to ingest knowledge.');
  }

  if (!session.refresh_token) {
    if (session.access_token) {
      return session.access_token;
    }
    throw new Error('Sign in again to ingest knowledge.');
  }

  const { data: refreshedData, error: refreshError } = await supabase.auth.refreshSession({ refresh_token: session.refresh_token });
  if (refreshError) {
    console.error('supabase.auth.refreshSession failed', refreshError);
    await supabase.auth.signOut().catch(() => undefined);
    throw new Error('Sign in again to ingest knowledge.');
  }

  if (!refreshedData?.session?.access_token) {
    console.error('supabase.auth.refreshSession returned no access token', refreshedData);
    await supabase.auth.signOut().catch(() => undefined);
    throw new Error('Sign in again to ingest knowledge.');
  }

  const newSession = refreshedData.session;
  await supabase.auth.setSession(newSession);
  setSession(newSession);
  return newSession.access_token;
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

function normalizeTags(raw: string) {
  return raw.split(',').map((tag) => tag.trim()).filter(Boolean);
}

function AddItemModal({ wsId, onClose }: { wsId: string; onClose: () => void }) {
  const { addItem } = useKnowledge();
  const { user, session, setSession } = useAuthStore();
  const [mode, setMode] = useState<'text' | 'file' | 'website'>('text');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [url, setUrl] = useState('');
  const [tags, setTags] = useState('');
  const [saving, setSaving] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      setFormError('Choose a file under 10 MB.');
      return;
    }
    setFormError(null);
    setSelectedFile(file);
    const text = await file.text();
    setTitle(file.name.replace(/\.[^/.]+$/, ''));
    setContent(file.type === 'application/pdf' ? '' : text.slice(0, 12000));
    setMode('file');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || (!content.trim() && !url.trim() && !selectedFile)) return;
    setSaving(true);
    setFormError(null);
    try {
      if (mode === 'website') {
        const normalizedUrl = url.trim();
        if (!/^https?:\/\//i.test(normalizedUrl)) {
          throw new Error('Enter a valid https:// URL to ingest.');
        }
        const accessToken = await getValidAccessToken(session, setSession);
        const invokeUrl = `${supabaseUrl}/functions/v1/knowledge-ingest`;
        console.debug('Invoking knowledge-ingest', { wsId, normalizedUrl, authTokenLength: accessToken.length, invokeUrl });
        const response = await fetch(invokeUrl, {
          method: 'POST',
          mode: 'cors',
          credentials: 'omit',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            workspace_id: wsId,
            title: title.trim(),
            url: normalizedUrl,
            tags: normalizeTags(tags),
          }),
        });
        const data = await response.json().catch(() => null);
        if (!response.ok) {
          console.error('knowledge-ingest invoke error', response.status, data);
          throw new Error(formatFunctionError(null, data));
        }
        if (data?.success === false) {
          console.error('knowledge-ingest returned failure', data);
          throw new Error(formatFunctionError(null, data));
        }
        if (!data?.item) throw new Error('The website could not be ingested.');
        onClose();
        return;
      }

      let fileUrl: string | undefined;
      let extractedContent = content.trim();
      let fileType = selectedFile?.name.split('.').pop()?.toLowerCase() ?? 'text';
      let sourceType: KnowledgeItem['source_type'] = 'text';

      if (selectedFile) {
        if (!user) throw new Error('Sign in again before uploading a file.');
        const safeName = selectedFile.name.replace(/[^a-zA-Z0-9._-]/g, '-');
        const path = `${user.id}/${wsId}/${crypto.randomUUID()}-${safeName}`;
        const { error: uploadError } = await supabase.storage.from('knowledge-assets').upload(path, selectedFile, {
          upsert: false,
          contentType: selectedFile.type || 'application/octet-stream',
        });
        if (uploadError) throw uploadError;
        fileUrl = path;
        sourceType = 'file';
        fileType = selectedFile.name.split('.').pop()?.toLowerCase() ?? fileType;
        if (selectedFile.type.startsWith('text/') || ['txt', 'md', 'markdown'].includes(fileType)) {
          extractedContent = (await selectedFile.text()).slice(0, 12000);
        } else {
          extractedContent = `Attached source: ${selectedFile.name}`;
        }
      }

      await addItem.mutateAsync({
        workspace_id: wsId,
        title: title.trim(),
        content: extractedContent || `Attached source: ${selectedFile?.name ?? 'text'}`,
        file_url: fileUrl,
        file_type: fileType,
        source_type: sourceType,
        source_url: null,
        ingestion_status: 'ready',
        content_excerpt: extractedContent.slice(0, 500) || null,
        metadata: selectedFile ? { name: selectedFile.name, size_bytes: selectedFile.size, mime_type: selectedFile.type || null } : {},
        tags: normalizeTags(tags),
      });
      onClose();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'We could not save this resource. Please try again.';
      setFormError(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      <motion.div initial={{ scale: 0.96, y: 8 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.96 }}
        className="w-full max-w-md bg-[#111111] border border-white/[0.08] rounded-t-[20px] sm:rounded-[20px] p-5 sm:p-7 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-[16px] font-semibold text-[#FAFAFA]">Add Knowledge</h3>
          <button onClick={onClose} className="text-[#71717A] hover:text-[#FAFAFA]"><X className="h-4 w-4" /></button>
        </div>

        <div className="flex gap-1 p-1 rounded-[10px] bg-[#0D0D0D] border border-white/[0.06] mb-5">
          {[{ id: 'text', label: 'Text', icon: FileText }, { id: 'file', label: 'File', icon: Upload }, { id: 'website', label: 'Website', icon: Globe2 }].map((m) => (
            <button key={m.id} onClick={() => setMode(m.id as 'text' | 'file' | 'website')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-[8px] text-[12px] font-medium transition-all ${mode === m.id ? 'bg-primary/10 text-primary' : 'text-[#71717A] hover:text-[#FAFAFA]'}`}>
              <m.icon className="h-3.5 w-3.5" />{m.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title *" autoFocus
            className="h-10 rounded-[10px] bg-[#0D0D0D] border-white/[0.08] text-[#FAFAFA] placeholder:text-[#71717A]" />

          {mode === 'text' ? (
            <textarea value={content} onChange={(e) => setContent(e.target.value)}
              placeholder="Paste text, notes, or guidelines here…" rows={5}
              className="w-full rounded-[10px] bg-[#0D0D0D] border border-white/[0.08] text-[#FAFAFA] placeholder:text-[#71717A] p-3 text-[13px] resize-none outline-none focus:border-primary/50 transition-colors" />
          ) : null}

          {mode === 'file' ? (
            <>
              <input ref={fileRef} type="file" accept=".txt,.md,.pdf" onChange={handleFile} className="hidden" />
              <button type="button" onClick={() => fileRef.current?.click()}
                className="flex items-center gap-2 text-[12px] text-[#71717A] hover:text-primary transition-colors">
                <Upload className="h-3.5 w-3.5" />{selectedFile ? selectedFile.name : 'Upload file (.txt, .md, .pdf)'}
              </button>
              <p className="text-[11px] leading-4 text-[#71717A]">Text files are available to AI immediately. PDFs are retained privately and can be paired with pasted notes for searchability.</p>
            </>
          ) : null}

          {mode === 'website' ? (
            <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://example.com" type="url"
              className="h-10 rounded-[10px] bg-[#0D0D0D] border-white/[0.08] text-[#FAFAFA] placeholder:text-[#71717A]" />
          ) : null}

          {mode !== 'file' && content && mode !== 'website' ? (
            <p className="text-[11px] leading-4 text-[#71717A]">This entry will be available to AI as a reusable knowledge source.</p>
          ) : null}

          <Input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="Tags (comma separated)"
            className="h-10 rounded-[10px] bg-[#0D0D0D] border-white/[0.08] text-[#FAFAFA] placeholder:text-[#71717A]" />
          {formError && <p className="rounded-[10px] border border-primary/20 bg-primary/[0.06] px-3 py-2 text-[12px] text-[#D4D4D8]">{formError}</p>}

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose}
              className="flex-1 h-10 rounded-[10px] border-white/[0.06] bg-transparent text-[#A1A1AA] text-[13px]">Cancel</Button>
            <Button type="submit" disabled={saving || !title.trim() || (!content.trim() && !url.trim() && !selectedFile)}
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
  const { data: credits } = useCredits();
  const { data: items, isLoading, deleteItem, wsId } = useKnowledge();
  const { activeWorkspace } = useWorkspaceStore();
  const { session, setSession } = useAuthStore();
  const queryClient = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [search, setSearch] = useState('');
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [answerError, setAnswerError] = useState('');
  const [answering, setAnswering] = useState(false);
  const [refreshingId, setRefreshingId] = useState<string | null>(null);
  const { generateJSON } = useAI();

  const filtered = items?.filter((item) => {
    const haystack = `${item.title} ${item.content} ${item.content_excerpt ?? ''} ${item.source_url ?? ''}`.toLowerCase();
    return haystack.includes(search.toLowerCase());
  });

  const handleAsk = async () => {
    if (!question.trim() || !items?.length || !wsId) return;
    setAnswering(true);
    setAnswer('');
    setAnswerError('');

    try {
      const { data: chunkRows, error: chunkError } = await supabase
        .from('knowledge_chunks')
        .select('*')
        .eq('workspace_id', wsId)
        .order('page_number', { ascending: true, nullsFirst: true })
        .order('chunk_index', { ascending: true });

      if (chunkError) throw chunkError;

      const relevantChunks = (chunkRows ?? []) as KnowledgeChunk[];
      const explicitPageMatch = question.match(/page\s+(\d+)/i);
      const pageFilter = explicitPageMatch ? Number(explicitPageMatch[1]) : null;

      const rankedChunks = relevantChunks.filter((chunk) => {
        if (!pageFilter) return true;
        return chunk.page_number === pageFilter;
      }).slice(0, 8);

      const context = rankedChunks.length > 0
        ? rankedChunks.map((chunk) => {
            const pageLabel = chunk.page_number ? ` [Page ${chunk.page_number}]` : '';
            const sourceLabel = chunk.source_name || 'Knowledge source';
            return `[Source: ${sourceLabel}${pageLabel}]\n${chunk.content}`;
          }).join('\n\n')
        : items.slice(0, 5).map((item) => `[${item.title}]: ${item.content.slice(0, 800)}`).join('\n\n');

      const result = await generateJSON<{ answer: string; sources?: string[]; confidence?: number }>(
        buildKnowledgeAnswerPrompt({
          question: question.trim(),
          context,
          workspaceId: wsId,
          workspaceName: activeWorkspace?.name ?? 'Workspace',
        }),
        { category: 'custom', promptSummary: 'Answer from saved knowledge' },
      );
      const sources = result.sources ?? [];
      setAnswer(result.answer || 'I could not find relevant content in your Knowledge Vault for that question.');
      if (sources.length) {
        setAnswer((prev) => `${prev}\n\nSources:\n${sources.map((source) => `- ${source}`).join('\n')}`);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'We could not answer that right now. Please try again.';
      setAnswerError(message);
    } finally {
      setAnswering(false);
    }
  };

  const handleRefresh = async (item: KnowledgeItem) => {
    if (!wsId || item.source_type !== 'website' || !item.source_url) return;
    setRefreshingId(item.id);
    try {
      const accessToken = await getValidAccessToken(session, setSession);
      const invokeUrl = `${supabaseUrl}/functions/v1/knowledge-ingest`;
      console.debug('Refreshing knowledge-ingest', { wsId, itemId: item.id, sourceUrl: item.source_url, authTokenLength: accessToken.length, invokeUrl });
      const response = await fetch(invokeUrl, {
        method: 'POST',
        mode: 'cors',
        credentials: 'omit',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          workspace_id: wsId,
          existing_item_id: item.id,
          title: item.title,
          url: item.source_url,
          tags: item.tags ?? [],
        }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        console.error('knowledge-ingest refresh error', response.status, data);
        throw new Error(formatFunctionError(null, data));
      }
      if (data?.success === false) {
        console.error('knowledge-ingest refresh returned failure', data);
        throw new Error(formatFunctionError(null, data));
      }
      if (!data?.item) throw new Error('The website could not be refreshed.');
      await queryClient.invalidateQueries({ queryKey: ['knowledge', wsId] });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'The website could not be refreshed right now.';
      setAnswerError(message);
    } finally {
      setRefreshingId(null);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <div>
          <h2 className="text-[22px] sm:text-[26px] font-semibold tracking-tight text-[#FAFAFA]">Knowledge Vault</h2>
          <p className="text-[13px] sm:text-[14px] text-[#71717A] mt-1">Your AI&apos;s long-term memory. Add text, files, or website sources and keep them ready for generation.</p>
        </div>
        {credits?.tier !== 'free' && (
          <Button onClick={() => setShowAdd(true)} className="h-10 rounded-[12px] px-5 bg-primary text-white hover:bg-primary/90 text-[13px] self-start sm:self-auto shrink-0">
            <Plus className="h-4 w-4 mr-1.5" />Add Knowledge
          </Button>
        )}
      </div>

      {credits?.tier === 'free' ? (
        <div className="mt-8">
          <UpgradePrompt
            feature="Knowledge Vault"
            requiredPlan="creator"
            description="Give the AI long-term memory. Upload brand guides, PDFs, and links so every generation is perfectly aligned with your unique style."
          />
        </div>
      ) : (
        <>
          {items && items.length > 0 && (
            <div className="p-6 rounded-[18px] bg-primary/[0.06] border border-primary/20 space-y-3">
              <p className="text-[13px] font-medium text-primary flex items-center gap-2">
                <Sparkles className="h-4 w-4" />Ask your knowledge base
              </p>
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                <Input value={question} onChange={(e) => setQuestion(e.target.value)}
                  placeholder="e.g. What is my brand tone?" onKeyDown={(e) => e.key === 'Enter' && handleAsk()}
                  className="h-10 rounded-[10px] bg-[#0D0D0D] border-white/[0.08] text-[#FAFAFA] placeholder:text-[#71717A] flex-1" />
                <Button onClick={handleAsk} disabled={answering || !question.trim()}
                  className="h-10 rounded-[10px] px-5 bg-primary text-white text-[13px]">
                  {answering ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Ask'}
                </Button>
              </div>
              <AnimatePresence>
                {answerError && (
                  <motion.p initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="text-[12px] text-red-400" role="alert">
                    {answerError}
                  </motion.p>
                )}
                {answer && (
                  <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                    className="p-4 rounded-[12px] bg-[#0D0D0D] border border-white/[0.06]">
                    <p className="text-[13px] text-[#FAFAFA] leading-relaxed whitespace-pre-wrap">{answer}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#71717A]" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search knowledge…"
              className="h-10 pl-10 rounded-[12px] bg-[#111111] border-white/[0.06] text-[#FAFAFA] placeholder:text-[#71717A]" />
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {[...Array(3)].map((_, index) => <div key={index} className="h-40 rounded-[16px] bg-[#111111] animate-pulse" />)}
            </div>
          ) : !filtered?.length ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="h-14 w-14 rounded-[16px] bg-primary/10 flex items-center justify-center mb-5">
                <BookOpen className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-[17px] font-semibold text-[#FAFAFA] mb-2">{search ? 'No results' : 'Vault is empty'}</h3>
              <p className="text-[14px] text-[#71717A] max-w-sm mb-6">
                {search ? 'Try a different search term.' : 'Add text, files, or a website source. The AI will reference them automatically.'}
              </p>
              {!search && (
                <Button onClick={() => setShowAdd(true)} className="h-10 rounded-[12px] px-5 bg-primary text-white text-[13px]">
                  <Plus className="h-4 w-4 mr-1.5" />Add First Resource
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              <AnimatePresence>
                {filtered.map((item) => {
                  const sourceLabel = item.source_type === 'website' ? 'Website' : item.source_type === 'file' ? 'File' : 'Text';
                  const sourceBadgeClass = item.ingestion_status === 'failed'
                    ? 'bg-red-500/10 text-red-400'
                    : item.ingestion_status === 'processing'
                      ? 'bg-amber-500/10 text-amber-400'
                      : 'bg-emerald-500/10 text-emerald-400';
                  const Icon = item.source_type === 'website' ? Globe2 : item.source_type === 'file' ? FileCheck2 : FileText;
                  return (
                    <motion.div key={item.id} layout initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                      className="group p-5 rounded-[16px] bg-[#111111] border border-white/[0.06] hover:border-white/[0.12] transition-colors relative">
                      <div className="flex items-start justify-between mb-3">
                        <div className="h-8 w-8 rounded-[8px] bg-primary/10 flex items-center justify-center shrink-0">
                          <Icon className="h-4 w-4 text-primary" />
                        </div>
                        <div className="flex items-center gap-1.5">
                          {item.source_type === 'website' && (
                            <button onClick={() => handleRefresh(item)} disabled={refreshingId === item.id}
                              className="text-[#71717A] hover:text-primary transition-all p-1 disabled:opacity-60">
                              {refreshingId === item.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
                            </button>
                          )}
                          <button onClick={() => deleteItem.mutate(item.id)}
                            className="text-[#71717A] hover:text-red-400 transition-all p-1">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="text-[14px] font-semibold text-[#FAFAFA] tracking-tight line-clamp-1">{item.title}</h4>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full ${sourceBadgeClass}`}>{sourceLabel}</span>
                      </div>
                      <p className="text-[12px] text-[#71717A] line-clamp-3 leading-relaxed">{item.content_excerpt ?? item.content}</p>
                      {item.ingestion_status === 'failed' && item.ingestion_error ? (
                        <p className="text-[11px] text-red-400 mt-2">{item.ingestion_error}</p>
                      ) : null}
                      {item.tags?.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-3">
                          {item.tags.map((tag) => (
                            <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-white/[0.06] text-[#71717A] capitalize">{tag}</span>
                          ))}
                        </div>
                      )}
                      <p className="text-[10px] text-[#71717A] mt-3">{new Date(item.created_at).toLocaleDateString()}</p>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}

          <AnimatePresence>
            {showAdd && wsId && <AddItemModal wsId={wsId} onClose={() => setShowAdd(false)} />}
          </AnimatePresence>
        </>
      )}
    </div>
  );
}
