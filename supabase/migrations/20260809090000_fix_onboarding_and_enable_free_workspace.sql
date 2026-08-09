-- Correct the workspace entitlement trigger and make the supported free trial
-- experience usable without weakening paid-plan enforcement.

CREATE OR REPLACE FUNCTION public.enforce_workspace_entitlement()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  allowed_workspaces INTEGER;
  workspace_count INTEGER;
BEGIN
  IF auth.role() <> 'authenticated' THEN RETURN NEW; END IF;
  IF NEW.owner_id <> auth.uid() THEN
    RAISE EXCEPTION 'Workspace owner must be the signed-in user';
  END IF;

  allowed_workspaces := public.creator_os_current_limit('workspaces');
  SELECT count(*) INTO workspace_count
  FROM public.workspaces
  WHERE owner_id = auth.uid() AND deleted_at IS NULL;

  IF allowed_workspaces = 0 THEN
    RAISE EXCEPTION 'SUBSCRIPTION_REQUIRED';
  END IF;
  IF workspace_count >= allowed_workspaces THEN
    RAISE EXCEPTION 'PLAN_LIMIT_REACHED: workspace limit reached';
  END IF;
  RETURN NEW;
END;
$$;

-- The original function treated a free account as if it had no workspace
-- permissions. A free account is an intentional, credit-limited product tier.
CREATE OR REPLACE FUNCTION public.user_belongs_to_workspace(check_workspace_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  profile public.users%ROWTYPE;
BEGIN
  SELECT * INTO profile FROM public.users WHERE id = auth.uid();
  IF NOT FOUND OR NOT public.creator_os_has_access(profile) THEN
    RETURN FALSE;
  END IF;

  RETURN EXISTS (
    SELECT 1 FROM public.workspace_members
    WHERE workspace_id = check_workspace_id AND user_id = auth.uid()
  ) OR EXISTS (
    SELECT 1 FROM public.workspaces
    WHERE id = check_workspace_id AND owner_id = auth.uid()
  );
END;
$$;

-- Social/email sign-ins need to create their own public profile before the
-- mandatory onboarding workflow can persist it. Managed Whop fields remain
-- protected by prevent_client_managed_user_field_changes().
DROP POLICY IF EXISTS "Users can create their own profile" ON public.users;
CREATE POLICY "Users can create their own profile"
  ON public.users FOR INSERT
  WITH CHECK (
    id = auth.uid()
    AND COALESCE(membership_status, 'inactive') = 'inactive'
    AND COALESCE(subscription_tier, 'free') = 'free'
    AND whop_id IS NULL
  );
