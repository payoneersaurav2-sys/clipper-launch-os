-- Creator OS: operational campaign and content-production workflow.
-- Extends the existing campaigns/clips records; it deliberately does not create a
-- second content-item model.

ALTER TABLE public.campaigns
  ADD COLUMN IF NOT EXISTS objective TEXT,
  ADD COLUMN IF NOT EXISTS target_audience TEXT,
  ADD COLUMN IF NOT EXISTS content_pillars TEXT[] DEFAULT '{}'::TEXT[],
  ADD COLUMN IF NOT EXISTS posting_frequency TEXT,
  ADD COLUMN IF NOT EXISTS notes TEXT,
  ADD COLUMN IF NOT EXISTS ai_strategy JSONB;

ALTER TABLE public.clips
  ADD COLUMN IF NOT EXISTS content_pillar TEXT,
  ADD COLUMN IF NOT EXISTS script TEXT,
  ADD COLUMN IF NOT EXISTS cta TEXT,
  ADD COLUMN IF NOT EXISTS hashtags TEXT[] DEFAULT '{}'::TEXT[],
  ADD COLUMN IF NOT EXISTS media_url TEXT,
  ADD COLUMN IF NOT EXISTS media_type TEXT,
  ADD COLUMN IF NOT EXISTS media_status TEXT NOT NULL DEFAULT 'missing',
  ADD COLUMN IF NOT EXISTS timezone TEXT NOT NULL DEFAULT 'UTC',
  ADD COLUMN IF NOT EXISTS saves INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS followers_gained INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS engagement_rate NUMERIC,
  ADD COLUMN IF NOT EXISTS retention_rate NUMERIC,
  ADD COLUMN IF NOT EXISTS published_url TEXT,
  ADD COLUMN IF NOT EXISTS publication_state TEXT NOT NULL DEFAULT 'not_connected';

CREATE TABLE IF NOT EXISTS public.campaign_insights (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE NOT NULL,
  campaign_id UUID REFERENCES public.campaigns(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  recommendations JSONB NOT NULL DEFAULT '[]'::JSONB,
  source TEXT NOT NULL DEFAULT 'ai_performance_analysis',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.campaign_insights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view campaign insights in their workspaces"
  ON public.campaign_insights FOR SELECT
  USING (public.user_belongs_to_workspace(workspace_id));

CREATE POLICY "Users can manage campaign insights in their workspaces"
  ON public.campaign_insights FOR ALL
  USING (public.user_belongs_to_workspace(workspace_id))
  WITH CHECK (public.user_belongs_to_workspace(workspace_id));

CREATE INDEX IF NOT EXISTS idx_campaign_insights_workspace_campaign
  ON public.campaign_insights(workspace_id, campaign_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_clips_workspace_status
  ON public.clips(workspace_id, status);
