CREATE TABLE IF NOT EXISTS public.prompts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  content TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'General',
  tags TEXT[] NOT NULL DEFAULT '{}',
  favorite BOOLEAN NOT NULL DEFAULT FALSE,
  variables TEXT[] NOT NULL DEFAULT '{}',
  model_preference TEXT,
  system_instructions TEXT,
  output_format TEXT,
  visibility TEXT NOT NULL DEFAULT 'private',
  version INTEGER NOT NULL DEFAULT 1,
  usage_count INTEGER NOT NULL DEFAULT 0,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_prompts_workspace_updated ON public.prompts (workspace_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_prompts_user_favorite ON public.prompts (user_id, favorite DESC, updated_at DESC);

ALTER TABLE public.prompts ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'prompts'
      AND policyname = 'Users can view their workspace prompts'
  ) THEN
    EXECUTE 'CREATE POLICY "Users can view their workspace prompts" ON public.prompts FOR SELECT USING (auth.uid() = user_id AND public.user_belongs_to_workspace(workspace_id))';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'prompts'
      AND policyname = 'Users can insert prompts into their workspace'
  ) THEN
    EXECUTE 'CREATE POLICY "Users can insert prompts into their workspace" ON public.prompts FOR INSERT WITH CHECK (auth.uid() = user_id AND public.user_belongs_to_workspace(workspace_id))';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'prompts'
      AND policyname = 'Users can update their own workspace prompts'
  ) THEN
    EXECUTE 'CREATE POLICY "Users can update their own workspace prompts" ON public.prompts FOR UPDATE USING (auth.uid() = user_id AND public.user_belongs_to_workspace(workspace_id)) WITH CHECK (auth.uid() = user_id AND public.user_belongs_to_workspace(workspace_id))';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'prompts'
      AND policyname = 'Users can delete their own workspace prompts'
  ) THEN
    EXECUTE 'CREATE POLICY "Users can delete their own workspace prompts" ON public.prompts FOR DELETE USING (auth.uid() = user_id AND public.user_belongs_to_workspace(workspace_id))';
  END IF;
END
$$;

INSERT INTO public.creator_os_credit_operations (operation, credits, measured_p95_cost_usd)
VALUES ('prompt_library_execution', 4, 0.00034020)
ON CONFLICT (operation) DO UPDATE
SET credits = EXCLUDED.credits,
    measured_p95_cost_usd = EXCLUDED.measured_p95_cost_usd,
    active = TRUE;
