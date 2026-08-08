import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useWorkspaceStore } from '@/stores/useWorkspaceStore';

export type CampaignStatus =
  | 'researching' | 'planning' | 'recording'
  | 'editing' | 'posting' | 'growing'
  | 'completed' | 'archived';

export interface Campaign {
  id: string;
  workspace_id: string;
  title: string;
  brand?: string;
  niche?: string;
  platform?: string;
  goal?: string;
  objective?: string;
  target_audience?: string;
  content_pillars?: string[];
  posting_frequency?: string;
  notes?: string;
  ai_strategy?: Record<string, unknown>;
  start_date?: string;
  end_date?: string;
  status: CampaignStatus;
  clip_count?: number;
  completion_pct?: number;
  created_at: string;
  updated_at: string;
}

export type ClipStatus =
  | 'idea' | 'writing' | 'editing'
  | 'ready' | 'scheduled' | 'published' | 'analyzed';

export interface Clip {
  id: string;
  campaign_id: string;
  workspace_id: string;
  title: string;
  hook?: string;
  caption?: string;
  script?: string;
  cta?: string;
  hashtags?: string[];
  content_pillar?: string;
  media_url?: string;
  media_type?: string;
  media_status?: string;
  platform?: string;
  status: ClipStatus;
  views?: number;
  likes?: number;
  comments?: number;
  shares?: number;
  saves?: number;
  followers_gained?: number;
  engagement_rate?: number;
  retention_rate?: number;
  revenue?: number;
  publishing_date?: string;
  timezone?: string;
  published_url?: string;
  publication_state?: string;
  tags?: string[];
  notes?: string;
  created_at: string;
  updated_at: string;
}

// ---- Campaigns -----------------------------------------------

export function useCampaigns() {
  const { activeWorkspace } = useWorkspaceStore();
  const wsId = activeWorkspace?.id;
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ['campaigns', wsId],
    queryFn: async (): Promise<Campaign[]> => {
      const { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .eq('workspace_id', wsId)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!wsId,
  });

  const createCampaign = useMutation({
    mutationFn: async (payload: Partial<Campaign>) => {
      const { data, error } = await supabase
        .from('campaigns')
        .insert([{ ...payload, workspace_id: wsId }])
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['campaigns', wsId] }),
  });

  const updateCampaign = useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<Campaign> }) => {
      const { data, error } = await supabase
        .from('campaigns')
        .update({ ...patch, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['campaigns', wsId] }),
  });

  const deleteCampaign = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('campaigns')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['campaigns', wsId] }),
  });

  const duplicateCampaign = useMutation({
    mutationFn: async (campaign: Campaign) => {
      const { id: _id, created_at: _createdAt, updated_at: _updatedAt, ...rest } = campaign;
      const { data, error } = await supabase
        .from('campaigns')
        .insert([{ ...rest, title: `${campaign.title} (Copy)`, status: 'planning' }])
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['campaigns', wsId] }),
  });

  return { ...query, createCampaign, updateCampaign, deleteCampaign, duplicateCampaign };
}

export function useCampaign(campaignId?: string) {
  const { activeWorkspace } = useWorkspaceStore();
  const wsId = activeWorkspace?.id;

  return useQuery({
    queryKey: ['campaign', wsId, campaignId],
    queryFn: async (): Promise<Campaign | null> => {
      const { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .eq('id', campaignId)
        .eq('workspace_id', wsId)
        .is('deleted_at', null)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!wsId && !!campaignId,
  });
}

// ---- Clips ---------------------------------------------------

export function useClips(campaignId?: string) {
  const { activeWorkspace } = useWorkspaceStore();
  const wsId = activeWorkspace?.id;
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ['clips', wsId, campaignId],
    queryFn: async (): Promise<Clip[]> => {
      let q = supabase.from('clips').select('*').is('deleted_at', null).order('created_at', { ascending: true });
      if (campaignId) q = q.eq('campaign_id', campaignId);
      else if (wsId) q = q.eq('workspace_id', wsId);
      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!wsId,
  });

  const createClip = useMutation({
    mutationFn: async (payload: Partial<Clip>) => {
      const { data, error } = await supabase
        .from('clips')
        .insert([{ ...payload, workspace_id: wsId }])
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['clips', wsId] }),
  });

  const createClips = useMutation({
    mutationFn: async (payloads: Partial<Clip>[]) => {
      if (!wsId) throw new Error('Select a workspace before creating content.');
      const { data, error } = await supabase
        .from('clips')
        .insert(payloads.map(payload => ({ ...payload, workspace_id: wsId })))
        .select();
      if (error) throw error;
      return data ?? [];
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['clips', wsId] }),
  });

  const updateClip = useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<Clip> }) => {
      const { data, error } = await supabase
        .from('clips')
        .update({ ...patch, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['clips', wsId] });
    },
  });

  const deleteClip = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('clips')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['clips', wsId] }),
  });

  return { ...query, createClip, createClips, updateClip, deleteClip };
}

// ---- Analytics aggregates (from existing analytics table) ----

export function useAnalyticsStats() {
  const { activeWorkspace } = useWorkspaceStore();
  const wsId = activeWorkspace?.id;

  return useQuery({
    queryKey: ['analytics-stats', wsId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('analytics')
        .select('views, likes, shares, earnings, recorded_at, campaign_id')
        .order('recorded_at', { ascending: true });
      if (error) throw error;
      const rows = data ?? [];
      const totalViews    = rows.reduce((a, r) => a + (r.views ?? 0), 0);
      const totalRevenue  = rows.reduce((a, r) => a + (r.earnings ?? 0), 0);
      const totalLikes    = rows.reduce((a, r) => a + (r.likes ?? 0), 0);
      const totalShares   = rows.reduce((a, r) => a + (r.shares ?? 0), 0);
      return { totalViews, totalRevenue, totalLikes, totalShares, rows };
    },
    enabled: !!wsId,
  });
}
