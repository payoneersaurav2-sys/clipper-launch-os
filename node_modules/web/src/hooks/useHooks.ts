import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface HookVariation {
  id: string;
  clip_idea_id: string;
  content: string;
  status: string;
  created_at: string;
}

export const useHooks = (clipIdeaId?: string) => {
  const queryClient = useQueryClient();

  const fetchHooks = async (): Promise<HookVariation[]> => {
    if (!clipIdeaId) throw new Error('No clip idea selected');

    const { data, error } = await supabase
      .from('hooks')
      .select('*')
      .eq('clip_idea_id', clipIdeaId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  };

  const query = useQuery({
    queryKey: ['hooks', clipIdeaId],
    queryFn: fetchHooks,
    enabled: !!clipIdeaId,
  });

  const createHook = useMutation({
    mutationFn: async ({ content, clip_idea_id }: { content: string; clip_idea_id: string }) => {
      const { data, error } = await supabase
        .from('hooks')
        .insert([{ content, clip_idea_id }])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['hooks', variables.clip_idea_id] });
    },
  });

  const updateHookStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { data, error } = await supabase
        .from('hooks')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['hooks', data.clip_idea_id] });
    },
  });

  return { ...query, createHook, updateHookStatus };
};
