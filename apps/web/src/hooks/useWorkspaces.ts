import { useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/useAuthStore';
import { useWorkspaceStore, Workspace } from '@/stores/useWorkspaceStore';

export const useWorkspaces = () => {
  const { user } = useAuthStore();
  const { setActiveWorkspace, setWorkspaces, activeWorkspace } = useWorkspaceStore();
  const queryClient = useQueryClient();

  const fetchWorkspaces = async (): Promise<Workspace[]> => {
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('workspaces')
      .select('*')
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    // Persisted Zustand state can outlive the authenticated user. Keep the
    // selected workspace only when it is in this user's RLS-filtered result.
    const nextActiveWorkspace = data.find(workspace => workspace.id === activeWorkspace?.id) ?? data[0] ?? null;
    if (nextActiveWorkspace?.id !== activeWorkspace?.id || (!nextActiveWorkspace && activeWorkspace)) {
      setActiveWorkspace(nextActiveWorkspace);
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

  // Whop iframe users intentionally bypass the web onboarding screens. Ensure
  // that path still has a real workspace for all persisted CreatorOS data.
  const ensuredForUserId = useRef<string | null>(null);
  useEffect(() => {
    if (!user) {
      ensuredForUserId.current = null;
      return;
    }
    if (query.isSuccess && query.data?.length === 0 && ensuredForUserId.current !== user.id) {
      ensuredForUserId.current = user.id;
      createWorkspace.mutate('My Creator Workspace');
    }
  }, [createWorkspace, query.data?.length, query.isSuccess, user]);

  return { ...query, createWorkspace };
};
