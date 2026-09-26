-- Phase 3: Client / Brand Profiles Architecture

CREATE TABLE IF NOT EXISTS public.brand_profiles (
  workspace_id UUID PRIMARY KEY REFERENCES public.workspaces(id) ON DELETE CASCADE,
  
  -- Identity
  website TEXT,
  short_description TEXT,
  industry TEXT,
  location TEXT,
  
  -- Audience
  target_audience TEXT,
  audience_problems TEXT,
  audience_goals TEXT,
  
  -- Voice
  tone TEXT,
  writing_style TEXT,
  words_to_use TEXT,
  words_to_avoid TEXT,
  
  -- Strategy
  content_pillars TEXT[],
  content_goals TEXT,
  
  -- Offers
  products_services TEXT,
  primary_offer TEXT,
  
  -- Platforms
  platforms TEXT[],
  
  -- Guidelines
  do_guidelines TEXT,
  dont_guidelines TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.brand_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view brand profiles for their workspaces" ON public.brand_profiles;
CREATE POLICY "Users can view brand profiles for their workspaces"
  ON public.brand_profiles FOR SELECT
  USING (public.user_belongs_to_workspace(workspace_id));

DROP POLICY IF EXISTS "Users can insert brand profiles for their workspaces" ON public.brand_profiles;
CREATE POLICY "Users can insert brand profiles for their workspaces"
  ON public.brand_profiles FOR INSERT
  WITH CHECK (public.user_belongs_to_workspace(workspace_id));

DROP POLICY IF EXISTS "Users can update brand profiles for their workspaces" ON public.brand_profiles;
CREATE POLICY "Users can update brand profiles for their workspaces"
  ON public.brand_profiles FOR UPDATE
  USING (public.user_belongs_to_workspace(workspace_id));

DROP POLICY IF EXISTS "Users can delete brand profiles for their workspaces" ON public.brand_profiles;
CREATE POLICY "Users can delete brand profiles for their workspaces"
  ON public.brand_profiles FOR DELETE
  USING (public.user_belongs_to_workspace(workspace_id));

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_brand_profiles_updated_at
  BEFORE UPDATE ON public.brand_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();




