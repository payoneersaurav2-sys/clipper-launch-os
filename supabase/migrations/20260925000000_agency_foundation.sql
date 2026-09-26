-- Phase 1: Agency Data Architecture Foundation

-- 1. Create the Agency entity
CREATE TABLE IF NOT EXISTS public.agencies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create the Agency Membership entity
CREATE TABLE IF NOT EXISTS public.agency_members (
  agency_id UUID REFERENCES public.agencies(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (agency_id, user_id)
);

-- 3. Link Clients (Workspaces) to Agencies
ALTER TABLE public.workspaces
  ADD COLUMN IF NOT EXISTS agency_id UUID REFERENCES public.agencies(id) ON DELETE CASCADE;

-- 4. Enable RLS
ALTER TABLE public.agencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agency_members ENABLE ROW LEVEL SECURITY;

-- 5. Helper Functions
CREATE OR REPLACE FUNCTION public.user_belongs_to_agency(check_agency_id UUID)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.agencies
    WHERE id = check_agency_id AND owner_id = auth.uid()
  ) OR EXISTS (
    SELECT 1 FROM public.agency_members
    WHERE agency_id = check_agency_id AND user_id = auth.uid()
  );
END;
$$;

-- 6. Update user_belongs_to_workspace to include Agency access
CREATE OR REPLACE FUNCTION public.user_belongs_to_workspace(check_workspace_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  profile public.users%ROWTYPE;
  ws_agency_id UUID;
BEGIN
  SELECT * INTO profile FROM public.users WHERE id = auth.uid();
  IF NOT FOUND OR NOT public.creator_os_has_access(profile) THEN
    RETURN FALSE;
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.workspace_members
    WHERE workspace_id = check_workspace_id AND user_id = auth.uid()
  ) OR EXISTS (
    SELECT 1 FROM public.workspaces
    WHERE id = check_workspace_id AND owner_id = auth.uid()
  ) THEN
    RETURN TRUE;
  END IF;

  SELECT agency_id INTO ws_agency_id FROM public.workspaces WHERE id = check_workspace_id;
  IF ws_agency_id IS NOT NULL THEN
    RETURN public.user_belongs_to_agency(ws_agency_id);
  END IF;

  RETURN FALSE;
END;
$$;

-- 7. RLS Policies for Agency tables
CREATE POLICY "Users can view agencies they belong to" ON public.agencies
  FOR SELECT USING (public.user_belongs_to_agency(id));

CREATE POLICY "Users can create agencies" ON public.agencies
  FOR INSERT WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Agency owners can update" ON public.agencies
  FOR UPDATE USING (owner_id = auth.uid());

CREATE POLICY "Agency owners can delete" ON public.agencies
  FOR DELETE USING (owner_id = auth.uid());

CREATE POLICY "Users can view agency members" ON public.agency_members
  FOR SELECT USING (public.user_belongs_to_agency(agency_id));

CREATE POLICY "Agency owners can manage members" ON public.agency_members
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.agencies WHERE id = agency_id AND owner_id = auth.uid())
  );

-- 8. Fix Storage RLS to support workspace/team collaboration
CREATE OR REPLACE FUNCTION public.safe_cast_to_uuid(text_val TEXT)
RETURNS UUID AS $$
BEGIN
  RETURN text_val::UUID;
EXCEPTION WHEN OTHERS THEN
  RETURN NULL;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

DROP POLICY IF EXISTS "Users manage own CreatorOS knowledge files" ON storage.objects;

CREATE POLICY "Workspace members can manage knowledge files"
  ON storage.objects FOR ALL TO authenticated
  USING (
    bucket_id = 'knowledge-assets' 
    AND (
      (storage.foldername(name))[1] = auth.uid()::text 
      OR 
      (
        array_length(storage.foldername(name), 1) >= 2 
        AND 
        public.user_belongs_to_workspace(public.safe_cast_to_uuid((storage.foldername(name))[2]))
      )
    )
  );

-- 9. Elevate Agency limits in subscription_plan_config
UPDATE public.subscription_plan_config
SET
  limits = jsonb_set(limits, '{workspaces}', '50'::jsonb)
WHERE tier = 'agency';




