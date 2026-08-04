import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface Caption {
  id: string;
  clip_idea_id: string;
  content: string;
  platform: string;
  status: string;
  created_at: string;
}

export const useCaptions = (clipIdeaId?: string) => {
  const queryClient = useQueryClient();

  const fetchCaptions = async (): Promise<Caption[]> => {
    if (!clipIdeaId) throw new Error('No clip idea selected');

    const { data, error } = await supabase
      .from('captions')
      .select('*')
      .eq('clip_idea_id', clipIdeaId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  };

  const query = useQuery({
    queryKey: ['captions', clipIdeaId],
    queryFn: fetchCaptions,
    enabled: !!clipIdeaId,
  });

  const createCaption = useMutation({
    mutationFn: async ({ content, platform, clip_idea_id }: { content: string; platform: string; clip_idea_id: string }) => {
      const { data, error } = await supabase
        .from('captions')
        .insert([{ content, platform, clip_idea_id }])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['captions', variables.clip_idea_id] });
    },
  });

  return { ...query, createCaption };
};
