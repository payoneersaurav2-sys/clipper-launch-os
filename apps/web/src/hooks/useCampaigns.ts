import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useWorkspaceStore } from '@/stores/useWorkspaceStore';
import { trackEvent } from '@/lib/analytics';

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
  media_path?: string;
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
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['campaigns', wsId] });
      trackEvent('campaign_created', { platform: data.platform || 'none' }, wsId);
    },
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

export function useDashboardCampaigns() {
  const { activeWorkspace } = useWorkspaceStore();
  const wsId = activeWorkspace?.id;

  return useQuery({
    queryKey: ['dashboard-campaigns', wsId],
    queryFn: async (): Promise<Array<Pick<Campaign, 'id' | 'title' | 'status' | 'completion_pct'>>> => {
      const { data, error } = await supabase
        .from('campaigns')
        .select('id, title, status, completion_pct')
        .eq('workspace_id', wsId)
        .is('deleted_at', null)
        .in('status', ['researching', 'planning', 'recording', 'editing', 'posting', 'growing'])
        .order('created_at', { ascending: false })
        .limit(3);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!wsId,
  });
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
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['clips', wsId] });
      trackEvent('content_created', { count: 1, platform: data.platform || 'none' }, wsId);
    },
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
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['clips', wsId] });
      trackEvent('content_created', { count: data.length }, wsId);
    },
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
    queryKey: ['analytics-stats', wsId, '30-days'],
    queryFn: async () => {
      if (!wsId) throw new Error('No active workspace');

      const endDate = new Date();
      const startDate = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const endDateIso = endDate.toISOString();
      const campaignPageSize = 1000;
      let campaignOffset = 0;
      let hasMoreCampaigns = true;
      const campaignIds: string[] = [];
      while (hasMoreCampaigns) {
        const { data: campaigns, error: campaignsError } = await supabase
          .from('campaigns')
          .select('id')
          .eq('workspace_id', wsId)
          .is('deleted_at', null)
          .order('id', { ascending: true })
          .range(campaignOffset, campaignOffset + campaignPageSize - 1);
        if (campaignsError) throw campaignsError;

        const rows = campaigns ?? [];
        campaignIds.push(...rows.map(campaign => campaign.id));
        hasMoreCampaigns = rows.length === campaignPageSize;
        campaignOffset += campaignPageSize;
      }

      if (campaignIds.length === 0) {
        return { totalViews: 0, totalRevenue: 0, totalLikes: 0, totalShares: 0 };
      }

      const campaignBatchSize = 100;
      const pageSize = 1000;
      let totalViews = 0;
      let totalRevenue = 0;
      let totalLikes = 0;
      let totalShares = 0;

      for (let campaignIndex = 0; campaignIndex < campaignIds.length; campaignIndex += campaignBatchSize) {
        const campaignBatch = campaignIds.slice(campaignIndex, campaignIndex + campaignBatchSize);
        let offset = 0;
        let hasMore = true;

        while (hasMore) {
          const { data, error } = await supabase
            .from('analytics')
            .select('id, views, likes, shares, earnings')
            .in('campaign_id', campaignBatch)
            .gte('recorded_at', startDate)
            .lte('recorded_at', endDateIso)
            .order('recorded_at', { ascending: true })
            .order('id', { ascending: true })
            .range(offset, offset + pageSize - 1);
          if (error) throw error;

          const rows = data ?? [];
          totalViews += rows.reduce((sum, row) => sum + (row.views ?? 0), 0);
          totalRevenue += rows.reduce((sum, row) => sum + (row.earnings ?? 0), 0);
          totalLikes += rows.reduce((sum, row) => sum + (row.likes ?? 0), 0);
          totalShares += rows.reduce((sum, row) => sum + (row.shares ?? 0), 0);

          hasMore = rows.length === pageSize;
          offset += pageSize;
        }
      }

      return { totalViews, totalRevenue, totalLikes, totalShares };
    },
    enabled: !!wsId,
  });
}
