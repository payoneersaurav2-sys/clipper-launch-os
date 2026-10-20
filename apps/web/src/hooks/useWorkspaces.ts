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
      .select('id, name, owner_id, agency_id, niche, platform')
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;

    let workspaces = data ?? [];
    let selectedWorkspace = workspaces.find(workspace => workspace.id === activeWorkspace?.id);
    if (!selectedWorkspace && activeWorkspace?.id) {
      const { data: persistedWorkspace, error: persistedWorkspaceError } = await supabase
        .from('workspaces')
        .select('id, name, owner_id, agency_id, niche, platform')
        .eq('id', activeWorkspace.id)
        .is('deleted_at', null)
        .maybeSingle();
      if (persistedWorkspaceError) throw persistedWorkspaceError;
      selectedWorkspace = persistedWorkspace ?? undefined;
      if (selectedWorkspace) workspaces = [...workspaces, selectedWorkspace];
    }

    // Persisted Zustand state can outlive the authenticated user. Keep the
    // selected workspace only when it is in this user's RLS-filtered result.
    const nextActiveWorkspace = selectedWorkspace ?? workspaces[0] ?? null;
    if (nextActiveWorkspace?.id !== activeWorkspace?.id || (!nextActiveWorkspace && activeWorkspace)) {
      setActiveWorkspace(nextActiveWorkspace);
    }
    setWorkspaces(workspaces);
    
    return workspaces;
  };

  const query = useQuery({
    queryKey: ['workspaces', user?.id],
    queryFn: fetchWorkspaces,
    enabled: !!user,
  });

  const createWorkspace = useMutation({
    mutationFn: async (input: string | { name: string; agency_id?: string }) => {
      const name = typeof input === 'string' ? input : input.name;
      const agency_id = typeof input === 'string' ? undefined : input.agency_id;
      
      const { data, error } = await supabase
        .from('workspaces')
        .insert([{ name, owner_id: user?.id, agency_id }])
        .select('id, name, owner_id, agency_id, niche, platform')
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (newWorkspace) => {
      queryClient.invalidateQueries({ queryKey: ['workspaces'] });
      setActiveWorkspace(newWorkspace);
    },
  });

  // Ensure
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
