-- Creator OS: Batch 5 DB extensions
-- Adds: onboarding_state, notifications, knowledge_items, user API keys

-- 1. Onboarding state per user
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS onboarding_complete BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS niche TEXT,
  ADD COLUMN IF NOT EXISTS platform TEXT,
  ADD COLUMN IF NOT EXISTS posting_frequency TEXT,
  ADD COLUMN IF NOT EXISTS experience_level TEXT,
  ADD COLUMN IF NOT EXISTS goals TEXT[];

-- 2. Notifications
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'system', -- 'ai','campaign','system','billing','team'
  title TEXT NOT NULL,
  message TEXT,
  href TEXT,            -- optional deep-link
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Only insert if not already created (idempotent)
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename='notifications' AND policyname='Users can view their own notifications'
  ) THEN
    CREATE POLICY "Users can view their own notifications" ON public.notifications
      FOR SELECT USING (user_id = auth.uid());
    CREATE POLICY "Users can manage their own notifications" ON public.notifications
      FOR ALL USING (user_id = auth.uid());
  END IF;
END $$;

-- 3. Knowledge Vault items
CREATE TABLE IF NOT EXISTS public.knowledge_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  content TEXT,             -- extracted text
  file_url TEXT,            -- supabase storage URL
  file_type TEXT,           -- 'pdf', 'txt', 'md', 'url'
  tags TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

ALTER TABLE public.knowledge_items ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename='knowledge_items' AND policyname='Users can manage knowledge in their workspaces'
  ) THEN
    CREATE POLICY "Users can manage knowledge in their workspaces" ON public.knowledge_items
      FOR ALL USING (public.user_belongs_to_workspace(workspace_id));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_knowledge_workspace ON public.knowledge_items(workspace_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id, read);
