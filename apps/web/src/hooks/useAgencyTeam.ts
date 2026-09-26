import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/useAuthStore';
import { AgencyRole } from '@clipper/core/src/auth/agency-auth';

export interface AgencyMember {
  agency_id: string;
  user_id: string;
  role: AgencyRole;
  created_at: string;
  user?: {
    full_name: string;
    email: string;
    avatar_url: string;
  };
  clients?: string[]; // array of workspace_ids they have access to
}

export interface AgencyInvitation {
  id: string;
  agency_id: string;
  email: string;
  role: AgencyRole;
  expires_at: string;
  created_at: string;
  invited_by: string;
  agency_invitation_clients?: { workspace_id: string }[];
}

export function useAgencyTeam(agencyId?: string) {
  const qc = useQueryClient();
  const { session } = useAuthStore();

  const membersQuery = useQuery({
    queryKey: ['agency_members', agencyId],
    queryFn: async (): Promise<AgencyMember[]> => {
      if (!agencyId) return [];
      
      // 1. Get members
      const { data: members, error } = await supabase
        .from('agency_members')
        .select(`
          agency_id, user_id, role, created_at,
          user:users ( full_name, email, avatar_url )
        `)
        .eq('agency_id', agencyId);
      
      if (error) throw error;
      
      // 2. Get client assignments
      const { data: workspaces, error: wsError } = await supabase
        .from('workspaces')
        .select('id')
        .eq('agency_id', agencyId);
        
      if (wsError) throw wsError;
      const workspaceIds = workspaces.map(w => w.id);
      
      const memberClients: Record<string, string[]> = {};
      if (workspaceIds.length > 0) {
        const { data: wm, error: wmErr } = await supabase
          .from('workspace_members')
          .select('user_id, workspace_id')
          .in('workspace_id', workspaceIds);
        if (!wmErr && wm) {
          wm.forEach(w => {
            if (!memberClients[w.user_id]) memberClients[w.user_id] = [];
            memberClients[w.user_id].push(w.workspace_id);
          });
        }
      }

      return members.map(m => ({
        ...m,
        user: Array.isArray(m.user) ? m.user[0] : m.user,
        clients: memberClients[m.user_id] || []
      })) as AgencyMember[];
    },
    enabled: !!agencyId
  });

  const invitesQuery = useQuery({
    queryKey: ['agency_invites', agencyId],
    queryFn: async (): Promise<AgencyInvitation[]> => {
      if (!agencyId) return [];
      const { data, error } = await supabase
        .from('agency_invitations')
        .select('*, agency_invitation_clients(workspace_id)')
        .eq('agency_id', agencyId);
      if (error) throw error;
      return data as AgencyInvitation[];
    },
    enabled: !!agencyId
  });

  const inviteMember = useMutation({
    mutationFn: async (payload: { email: string, role: AgencyRole, workspaceIds?: string[] }) => {
      const res = await fetch('/api/invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({
          action: 'create',
          agencyId,
          ...payload
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send invite');
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['agency_invites', agencyId] })
  });

  const cancelInvite = useMutation({
    mutationFn: async (inviteId: string) => {
      const { error } = await supabase.from('agency_invitations').delete().eq('id', inviteId);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['agency_invites', agencyId] })
  });

  const updateRole = useMutation({
    mutationFn: async ({ userId, role }: { userId: string, role: AgencyRole }) => {
      const { error } = await supabase
        .from('agency_members')
        .update({ role })
        .eq('agency_id', agencyId)
        .eq('user_id', userId);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['agency_members', agencyId] })
  });
  
  const updateClientAccess = useMutation({
    mutationFn: async ({ userId, workspaceIds }: { userId: string, workspaceIds: string[] }) => {
      // Get all workspaces for this agency
      const { data: workspaces, error: wsError } = await supabase
        .from('workspaces')
        .select('id')
        .eq('agency_id', agencyId);
      if (wsError) throw wsError;
      
      const allAgencyWsIds = workspaces.map(w => w.id);
      
      // Delete existing access for this user in this agency's workspaces
      if (allAgencyWsIds.length > 0) {
        await supabase
          .from('workspace_members')
          .delete()
          .eq('user_id', userId)
          .in('workspace_id', allAgencyWsIds);
      }
      
      // Insert new access
      if (workspaceIds.length > 0) {
        const inserts = workspaceIds.map(wId => ({
          workspace_id: wId,
          user_id: userId,
          role: 'member'
        }));
        const { error } = await supabase.from('workspace_members').insert(inserts);
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['agency_members', agencyId] })
  });

  const removeMember = useMutation({
    mutationFn: async (userId: string) => {
      // Trigger deletion of agency_members; cascade handles workspace_members if RLS permits
      // Wait, deleting agency_members does not cascade to workspace_members automatically
      // We should also delete workspace_members for this agency
      
      const { data: workspaces } = await supabase.from('workspaces').select('id').eq('agency_id', agencyId);
      const allAgencyWsIds = workspaces?.map(w => w.id) || [];
      
      if (allAgencyWsIds.length > 0) {
         await supabase.from('workspace_members').delete().eq('user_id', userId).in('workspace_id', allAgencyWsIds);
      }
      
      const { error } = await supabase.from('agency_members').delete().eq('agency_id', agencyId).eq('user_id', userId);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['agency_members', agencyId] })
  });

  return {
    members: membersQuery.data ?? [],
    invites: invitesQuery.data ?? [],
    isLoading: membersQuery.isLoading || invitesQuery.isLoading,
    inviteMember,
    cancelInvite,
    updateRole,
    updateClientAccess,
    removeMember
  };
}

