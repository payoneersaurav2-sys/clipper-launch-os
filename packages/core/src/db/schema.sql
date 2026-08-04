-- Clipper Launch OS: PostgreSQL Schema (Supabase)

-- Enable uuid-ossp extension for UUID generation if not enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Users (Extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  whop_id TEXT UNIQUE,
  membership_status TEXT DEFAULT 'inactive', -- 'active', 'inactive', 'revoked'
  full_name TEXT,
  avatar_url TEXT,
  subscription_tier TEXT DEFAULT 'free',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- 2. Organizations / Workspaces
CREATE TABLE IF NOT EXISTS public.workspaces (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  owner_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- Workspace Members for future team support
CREATE TABLE IF NOT EXISTS public.workspace_members (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  role TEXT DEFAULT 'member', -- 'owner', 'admin', 'member'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(workspace_id, user_id)
);

-- 3. File Architecture: Folders
CREATE TABLE IF NOT EXISTS public.folders (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE NOT NULL,
  parent_id UUID REFERENCES public.folders(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- 4. Projects
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE NOT NULL,
  folder_id UUID REFERENCES public.folders(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'active', -- 'active', 'archived'
  color TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- 5. Workflow: Clip Ideas
CREATE TABLE IF NOT EXISTS public.clip_ideas (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE NOT NULL,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  context TEXT,
  status TEXT DEFAULT 'draft', -- 'draft', 'in_progress', 'approved', 'archived'
  priority TEXT DEFAULT 'normal', -- 'low', 'normal', 'high'
  tags TEXT[],
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- 6. Workflow: Hooks
CREATE TABLE IF NOT EXISTS public.hooks (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  clip_idea_id UUID REFERENCES public.clip_ideas(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  version_id INTEGER DEFAULT 1,
  status TEXT DEFAULT 'draft', -- 'draft', 'favorite', 'rejected'
  ai_score INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- 7. Workflow: Captions
CREATE TABLE IF NOT EXISTS public.captions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  clip_idea_id UUID REFERENCES public.clip_ideas(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  platform TEXT NOT NULL, -- 'tiktok', 'instagram', 'youtube'
  version_id INTEGER DEFAULT 1,
  status TEXT DEFAULT 'draft', -- 'draft', 'favorite', 'rejected'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- 8. Workflow: Campaigns
CREATE TABLE IF NOT EXISTS public.campaigns (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  status TEXT DEFAULT 'planning', -- 'planning', 'active', 'completed'
  platform_target TEXT[],
  goal TEXT,
  budget_placeholder NUMERIC,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- 9. Analytics
CREATE TABLE IF NOT EXISTS public.analytics (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  campaign_id UUID REFERENCES public.campaigns(id) ON DELETE CASCADE NOT NULL,
  clip_idea_id UUID REFERENCES public.clip_ideas(id) ON DELETE SET NULL,
  views INTEGER DEFAULT 0,
  likes INTEGER DEFAULT 0,
  shares INTEGER DEFAULT 0,
  earnings NUMERIC DEFAULT 0.00,
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. AI System: Persistent Memory
CREATE TABLE IF NOT EXISTS public.ai_memory (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE NOT NULL,
  category TEXT NOT NULL, -- 'tone', 'niche', 'preference'
  key TEXT NOT NULL,
  value TEXT NOT NULL,
  weight INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. AI System: Prompt History
CREATE TABLE IF NOT EXISTS public.prompt_history (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  prompt_text TEXT NOT NULL,
  context_used JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. Settings
CREATE TABLE IF NOT EXISTS public.settings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE NOT NULL,
  key TEXT NOT NULL,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(workspace_id, key)
);

-- 13. Notifications
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT,
  read BOOLEAN DEFAULT false,
  type TEXT DEFAULT 'system', -- 'system', 'campaign', 'ai'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-------------------------------------------------------
-- RLS POLICIES (Row Level Security)
-------------------------------------------------------

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clip_ideas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.captions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_memory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prompt_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Helper function to check workspace access AND active Whop membership
CREATE OR REPLACE FUNCTION public.user_belongs_to_workspace(check_workspace_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  is_active BOOLEAN;
BEGIN
  -- 1. Verify the user has an active Whop membership
  SELECT membership_status = 'active' INTO is_active 
  FROM public.users WHERE id = auth.uid();
  
  IF is_active IS NOT TRUE THEN
    RETURN FALSE;
  END IF;

  -- 2. Verify workspace ownership or membership
  RETURN EXISTS (
    SELECT 1 FROM public.workspace_members
    WHERE workspace_id = check_workspace_id
    AND user_id = auth.uid()
  ) OR EXISTS (
    SELECT 1 FROM public.workspaces
    WHERE id = check_workspace_id
    AND owner_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Users Table Policies
CREATE POLICY "Users can view their own profile" ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON public.users FOR UPDATE USING (auth.uid() = id);

-- Workspaces Policies
CREATE POLICY "Users can view workspaces they own or belong to" ON public.workspaces FOR SELECT USING (owner_id = auth.uid() OR id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()));
CREATE POLICY "Users can create workspaces" ON public.workspaces FOR INSERT WITH CHECK (owner_id = auth.uid());
CREATE POLICY "Workspace owners can update" ON public.workspaces FOR UPDATE USING (owner_id = auth.uid());
CREATE POLICY "Workspace owners can delete" ON public.workspaces FOR DELETE USING (owner_id = auth.uid());

-- Workspace Members Policies
CREATE POLICY "Users can view members of their workspaces" ON public.workspace_members FOR SELECT USING (public.user_belongs_to_workspace(workspace_id));
CREATE POLICY "Workspace owners can manage members" ON public.workspace_members FOR ALL USING (
  EXISTS (SELECT 1 FROM public.workspaces WHERE id = workspace_id AND owner_id = auth.uid())
);

-- Projects Policies
CREATE POLICY "Users can view projects in their workspaces" ON public.projects FOR SELECT USING (public.user_belongs_to_workspace(workspace_id));
CREATE POLICY "Users can manage projects in their workspaces" ON public.projects FOR ALL USING (public.user_belongs_to_workspace(workspace_id));

-- Folders Policies
CREATE POLICY "Users can view folders in their workspaces" ON public.folders FOR SELECT USING (public.user_belongs_to_workspace(workspace_id));
CREATE POLICY "Users can manage folders in their workspaces" ON public.folders FOR ALL USING (public.user_belongs_to_workspace(workspace_id));

-- Clip Ideas Policies
CREATE POLICY "Users can view ideas in their workspaces" ON public.clip_ideas FOR SELECT USING (public.user_belongs_to_workspace(workspace_id));
CREATE POLICY "Users can manage ideas in their workspaces" ON public.clip_ideas FOR ALL USING (public.user_belongs_to_workspace(workspace_id));

-- Hooks Policies
CREATE POLICY "Users can view hooks via idea workspace" ON public.hooks FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.clip_ideas WHERE id = clip_idea_id AND public.user_belongs_to_workspace(workspace_id))
);
CREATE POLICY "Users can manage hooks via idea workspace" ON public.hooks FOR ALL USING (
  EXISTS (SELECT 1 FROM public.clip_ideas WHERE id = clip_idea_id AND public.user_belongs_to_workspace(workspace_id))
);

-- Captions Policies
CREATE POLICY "Users can view captions via idea workspace" ON public.captions FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.clip_ideas WHERE id = clip_idea_id AND public.user_belongs_to_workspace(workspace_id))
);
CREATE POLICY "Users can manage captions via idea workspace" ON public.captions FOR ALL USING (
  EXISTS (SELECT 1 FROM public.clip_ideas WHERE id = clip_idea_id AND public.user_belongs_to_workspace(workspace_id))
);

-- Campaigns Policies
CREATE POLICY "Users can view campaigns in their workspaces" ON public.campaigns FOR SELECT USING (public.user_belongs_to_workspace(workspace_id));
CREATE POLICY "Users can manage campaigns in their workspaces" ON public.campaigns FOR ALL USING (public.user_belongs_to_workspace(workspace_id));

-- Analytics Policies
CREATE POLICY "Users can view analytics via campaign workspace" ON public.analytics FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.campaigns WHERE id = campaign_id AND public.user_belongs_to_workspace(workspace_id))
);
CREATE POLICY "System can manage analytics" ON public.analytics FOR ALL USING (
  EXISTS (SELECT 1 FROM public.campaigns WHERE id = campaign_id AND public.user_belongs_to_workspace(workspace_id))
);

-- AI Memory Policies
CREATE POLICY "Users can view AI memory in their workspaces" ON public.ai_memory FOR SELECT USING (public.user_belongs_to_workspace(workspace_id));
CREATE POLICY "Users can manage AI memory in their workspaces" ON public.ai_memory FOR ALL USING (public.user_belongs_to_workspace(workspace_id));

-- Settings Policies
CREATE POLICY "Users can view settings in their workspaces" ON public.settings FOR SELECT USING (public.user_belongs_to_workspace(workspace_id));
CREATE POLICY "Users can manage settings in their workspaces" ON public.settings FOR ALL USING (public.user_belongs_to_workspace(workspace_id));

-- Notifications Policies
CREATE POLICY "Users can view their own notifications" ON public.notifications FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can manage their own notifications" ON public.notifications FOR UPDATE USING (user_id = auth.uid());
