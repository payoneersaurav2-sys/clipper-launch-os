-- Creator OS: Batch 4 schema extensions
-- Adds clips table and augments campaigns with brand/niche/completion fields

-- Extend campaigns table
ALTER TABLE public.campaigns
  ADD COLUMN IF NOT EXISTS brand TEXT,
  ADD COLUMN IF NOT EXISTS niche TEXT,
  ADD COLUMN IF NOT EXISTS platform TEXT,
  ADD COLUMN IF NOT EXISTS clip_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS completion_pct INTEGER DEFAULT 0;

-- Update status values comment for campaigns
-- status: 'researching','planning','recording','editing','posting','growing','completed','archived'

-- Clips table (production pipeline)
CREATE TABLE IF NOT EXISTS public.clips (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE NOT NULL,
  campaign_id UUID REFERENCES public.campaigns(id) ON DELETE CASCADE,
  clip_idea_id UUID REFERENCES public.clip_ideas(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  hook TEXT,
  caption TEXT,
  platform TEXT DEFAULT 'tiktok',
  status TEXT DEFAULT 'idea', -- 'idea','writing','editing','ready','scheduled','published','analyzed'
  views INTEGER DEFAULT 0,
  likes INTEGER DEFAULT 0,
  comments INTEGER DEFAULT 0,
  shares INTEGER DEFAULT 0,
  revenue NUMERIC DEFAULT 0.00,
  publishing_date TIMESTAMPTZ,
  tags TEXT[],
  notes TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

ALTER TABLE public.clips ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view clips in their workspaces" ON public.clips
  FOR SELECT USING (public.user_belongs_to_workspace(workspace_id));

CREATE POLICY "Users can manage clips in their workspaces" ON public.clips
  FOR ALL USING (public.user_belongs_to_workspace(workspace_id));

-- Index for kanban queries
CREATE INDEX IF NOT EXISTS idx_clips_campaign_status ON public.clips(campaign_id, status);
CREATE INDEX IF NOT EXISTS idx_clips_workspace ON public.clips(workspace_id);
