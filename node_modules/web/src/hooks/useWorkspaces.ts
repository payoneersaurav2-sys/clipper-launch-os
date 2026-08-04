import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/useAuthStore';
import { useWorkspaceStore, Workspace } from '@/stores/useWorkspaceStore';

export const useWorkspaces = () => {
  const { user } = useAuthStore();
  const { setActiveWorkspace, workspaces, setWorkspaces, activeWorkspace } = useWorkspaceStore();
  const queryClient = useQueryClient();

  const fetchWorkspaces = async (): Promise<Workspace[]> => {
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('workspaces')
      .select('*')
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    // Auto-select first workspace if none active
    if (data.length > 0 && !activeWorkspace) {
      setActiveWorkspace(data[0]);
    }
    setWorkspaces(data);
    
    return data;
  };

  const query = useQuery({
    queryKey: ['workspaces', user?.id],
    queryFn: fetchWorkspaces,
    enabled: !!user,
  });

  const createWorkspace = useMutation({
    mutationFn: async (name: string) => {
      const { data, error } = await supabase
        .from('workspaces')
        .insert([{ name, owner_id: user?.id }])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (newWorkspace) => {
      queryClient.invalidateQueries({ queryKey: ['workspaces'] });
      setActiveWorkspace(newWorkspace);
    },
  });

  return { ...query, createWorkspace };
};
