import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useWorkspaceStore } from '@/stores/useWorkspaceStore';

export interface BrandProfile {
  workspace_id: string;
  website: string | null;
  short_description: string | null;
  industry: string | null;
  location: string | null;
  target_audience: string | null;
  audience_problems: string | null;
  audience_goals: string | null;
  tone: string | null;
  writing_style: string | null;
  words_to_use: string | null;
  words_to_avoid: string | null;
  content_pillars: string[] | null;
  content_goals: string | null;
  products_services: string | null;
  primary_offer: string | null;
  platforms: string[] | null;
  do_guidelines: string | null;
  dont_guidelines: string | null;
  created_at: string;
  updated_at: string;
}

export const useBrandProfile = () => {
  const { activeWorkspace } = useWorkspaceStore();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['brand_profile', activeWorkspace?.id],
    queryFn: async (): Promise<BrandProfile | null> => {
      if (!activeWorkspace?.id) return null;
      const { data, error } = await supabase
        .from('brand_profiles')
        .select('*')
        .eq('workspace_id', activeWorkspace.id)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!activeWorkspace?.id,
  });

  const updateProfile = useMutation({
    mutationFn: async (updates: Partial<BrandProfile>) => {
      if (!activeWorkspace?.id) throw new Error('No active workspace');
      
      const { data, error } = await supabase
        .from('brand_profiles')
        .upsert({ 
          workspace_id: activeWorkspace.id, 
          ...updates 
        }, { onConflict: 'workspace_id' })
        .select()
        .single();
        
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brand_profile', activeWorkspace?.id] });
    }
  });

  return { ...query, updateProfile };
};
