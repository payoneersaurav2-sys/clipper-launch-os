import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useWorkspaceStore } from '@/stores/useWorkspaceStore';

export interface ClipIdea {
  id: string;
  workspace_id: string;
  title: string;
  context: string;
  status: string;
  created_at: string;
}

export const useClipIdeas = () => {
  const { activeWorkspace } = useWorkspaceStore();
  const queryClient = useQueryClient();

  const fetchIdeas = async (): Promise<ClipIdea[]> => {
    if (!activeWorkspace) throw new Error('No active workspace');

    const { data, error } = await supabase
      .from('clip_ideas')
      .select('*')
      .eq('workspace_id', activeWorkspace.id)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  };

  const query = useQuery({
    queryKey: ['clip_ideas', activeWorkspace?.id],
    queryFn: fetchIdeas,
    enabled: !!activeWorkspace,
  });

  const createIdea = useMutation({
    mutationFn: async ({ title, context }: { title: string; context: string }) => {
      if (!activeWorkspace) throw new Error('No active workspace');
      const { data, error } = await supabase
        .from('clip_ideas')
        .insert([{ title, context, workspace_id: activeWorkspace.id }])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clip_ideas'] });
    },
  });

  const updateIdeaStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { data, error } = await supabase
        .from('clip_ideas')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clip_ideas'] });
    },
  });

  return { ...query, createIdea, updateIdeaStatus };
};
