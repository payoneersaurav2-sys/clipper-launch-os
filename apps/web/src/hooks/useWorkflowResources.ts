import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useWorkspaceStore } from '@/stores/useWorkspaceStore';
import { fetchWorkspacePrompts, type SavedPromptRow } from '@/lib/promptLibraryService';

export interface KnowledgeItemSnippet {
  id: string;
  title: string;
  content_excerpt: string | null;
  content: string;
  source_type?: string | null;
  source_url?: string | null;
}

export function useWorkspacePrompts() {
  const { activeWorkspace } = useWorkspaceStore();

  return useQuery({
    queryKey: ['workspace-prompts', activeWorkspace?.id],
    enabled: Boolean(activeWorkspace),
    queryFn: async (): Promise<SavedPromptRow[]> => {
      if (!activeWorkspace) throw new Error('No active workspace');
      return fetchWorkspacePrompts(activeWorkspace.id);
    },
  });
}

export function useWorkspaceKnowledge() {
  const { activeWorkspace } = useWorkspaceStore();

  return useQuery({
    queryKey: ['workspace-knowledge', activeWorkspace?.id],
    enabled: Boolean(activeWorkspace),
    queryFn: async (): Promise<KnowledgeItemSnippet[]> => {
      if (!activeWorkspace) throw new Error('No active workspace');
      const { data, error } = await supabase
        .from('knowledge_items')
        .select('id, title, content_excerpt, content, source_type, source_url')
        .eq('workspace_id', activeWorkspace.id)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as KnowledgeItemSnippet[];
    },
  });
}

export function useWorkspaceKnowledgeExists() {
  const { activeWorkspace } = useWorkspaceStore();
  const workspaceId = activeWorkspace?.id;

  return useQuery({
    queryKey: ['workspace-knowledge-exists', workspaceId],
    enabled: Boolean(workspaceId),
    queryFn: async (): Promise<boolean> => {
      if (!workspaceId) throw new Error('No active workspace');
      const { data, error } = await supabase
        .from('knowledge_items')
        .select('id')
        .eq('workspace_id', workspaceId)
        .is('deleted_at', null)
        .limit(1);
      if (error) throw error;
      return Boolean(data?.length);
    },
  });
}
