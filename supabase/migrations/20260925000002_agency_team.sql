-- Phase 7: Agency Team Permissions & Roles

-- 1. Create invitations table
CREATE TABLE IF NOT EXISTS public.agency_invitations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  agency_id UUID REFERENCES public.agencies(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'viewer',
  token_hash TEXT NOT NULL,
  invited_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(agency_id, email)
);

CREATE TABLE IF NOT EXISTS public.agency_invitation_clients (
  invitation_id UUID REFERENCES public.agency_invitations(id) ON DELETE CASCADE,
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE,
  PRIMARY KEY (invitation_id, workspace_id)
);

ALTER TABLE public.agency_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agency_invitation_clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage invitations in their agency" ON public.agency_invitations
  FOR ALL USING (public.user_belongs_to_agency(agency_id));

CREATE POLICY "Users can manage invitation clients in their agency" ON public.agency_invitation_clients
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.agency_invitations WHERE id = invitation_id AND public.user_belongs_to_agency(agency_id))
  );

-- 2. Create updated workspace access functions with explicit roles

-- Returns true if user has ANY access (including viewer)
CREATE OR REPLACE FUNCTION public.user_belongs_to_workspace(check_workspace_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  profile public.users%ROWTYPE;
  ws_agency_id UUID;
BEGIN
  SELECT * INTO profile FROM public.users WHERE id = auth.uid();
  IF NOT FOUND OR NOT public.creator_os_has_access(profile) THEN
    RETURN FALSE;
  END IF;

  IF EXISTS (SELECT 1 FROM public.workspaces WHERE id = check_workspace_id AND owner_id = auth.uid()) THEN
    RETURN TRUE;
  END IF;

  SELECT agency_id INTO ws_agency_id FROM public.workspaces WHERE id = check_workspace_id;
  IF ws_agency_id IS NOT NULL THEN
    IF EXISTS (SELECT 1 FROM public.agencies WHERE id = ws_agency_id AND owner_id = auth.uid()) THEN
      RETURN TRUE;
    END IF;
    IF EXISTS (
      SELECT 1 FROM public.agency_members
      WHERE agency_id = ws_agency_id AND user_id = auth.uid() 
      AND (
         role IN ('owner', 'admin') 
         OR 
         (role IN ('manager', 'editor', 'viewer') AND EXISTS (
           SELECT 1 FROM public.workspace_members WHERE workspace_id = check_workspace_id AND user_id = auth.uid()
         ))
      )
    ) THEN
      RETURN TRUE;
    END IF;
    RETURN FALSE;
  END IF;

  IF EXISTS (SELECT 1 FROM public.workspace_members WHERE workspace_id = check_workspace_id AND user_id = auth.uid()) THEN
    RETURN TRUE;
  END IF;
  RETURN FALSE;
END;
$$;

-- Returns true if user has EDIT/MANAGE access (excludes viewers)
CREATE OR REPLACE FUNCTION public.user_can_edit_workspace(check_workspace_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  profile public.users%ROWTYPE;
  ws_agency_id UUID;
BEGIN
  SELECT * INTO profile FROM public.users WHERE id = auth.uid();
  IF NOT FOUND OR NOT public.creator_os_has_access(profile) THEN
    RETURN FALSE;
  END IF;

  IF EXISTS (SELECT 1 FROM public.workspaces WHERE id = check_workspace_id AND owner_id = auth.uid()) THEN
    RETURN TRUE;
  END IF;

  SELECT agency_id INTO ws_agency_id FROM public.workspaces WHERE id = check_workspace_id;
  IF ws_agency_id IS NOT NULL THEN
    IF EXISTS (SELECT 1 FROM public.agencies WHERE id = ws_agency_id AND owner_id = auth.uid()) THEN
      RETURN TRUE;
    END IF;
    IF EXISTS (
      SELECT 1 FROM public.agency_members
      WHERE agency_id = ws_agency_id AND user_id = auth.uid() 
      AND (
         role IN ('owner', 'admin') 
         OR 
         (role IN ('manager', 'editor') AND EXISTS (
           SELECT 1 FROM public.workspace_members WHERE workspace_id = check_workspace_id AND user_id = auth.uid()
         ))
      )
    ) THEN
      RETURN TRUE;
    END IF;
    RETURN FALSE;
  END IF;

  IF EXISTS (SELECT 1 FROM public.workspace_members WHERE workspace_id = check_workspace_id AND user_id = auth.uid() AND role IN ('owner', 'admin', 'member')) THEN
    RETURN TRUE;
  END IF;
  RETURN FALSE;
END;
$$;

-- Returns true if user can manage agency
CREATE OR REPLACE FUNCTION public.user_can_manage_agency(check_agency_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.agencies WHERE id = check_agency_id AND owner_id = auth.uid()
  ) OR EXISTS (
    SELECT 1 FROM public.agency_members WHERE agency_id = check_agency_id AND user_id = auth.uid() AND role IN ('owner', 'admin')
  );
END;
$$;

-- Drop and recreate ALL policies using user_can_edit_workspace
-- Campaigns
DROP POLICY IF EXISTS "Users can manage campaigns in their workspaces" ON public.campaigns;
CREATE POLICY "Users can manage campaigns in their workspaces" ON public.campaigns FOR ALL USING (public.user_can_edit_workspace(workspace_id));

-- Clips
DROP POLICY IF EXISTS "Users can manage clips in their workspaces" ON public.clips;
CREATE POLICY "Users can manage clips in their workspaces" ON public.clips FOR ALL USING (public.user_can_edit_workspace(workspace_id));

-- Knowledge Items
DROP POLICY IF EXISTS "Users can manage knowledge items in their workspaces" ON public.knowledge_items;
CREATE POLICY "Users can manage knowledge items in their workspaces" ON public.knowledge_items FOR ALL USING (public.user_can_edit_workspace(workspace_id));

-- Brand Profiles
DROP POLICY IF EXISTS "Users can manage brand profiles in their workspaces" ON public.brand_profiles;
CREATE POLICY "Users can manage brand profiles in their workspaces" ON public.brand_profiles FOR ALL USING (public.user_can_edit_workspace(workspace_id));

