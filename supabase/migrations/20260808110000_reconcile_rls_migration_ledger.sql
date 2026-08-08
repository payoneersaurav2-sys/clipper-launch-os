-- Production reconciliation for two historic migrations that were partially
-- applied outside the Supabase migration ledger. This is intentionally
-- idempotent and establishes the documented non-recursive workspace policies.

DROP POLICY IF EXISTS "Workspace owners can manage members" ON public.workspace_members;
DROP POLICY IF EXISTS "Users can view workspaces they own or belong to" ON public.workspaces;
DROP POLICY IF EXISTS "Users can view their own membership" ON public.workspace_members;
DROP POLICY IF EXISTS "Workspace owners can insert members" ON public.workspace_members;
DROP POLICY IF EXISTS "Workspace owners can update members" ON public.workspace_members;
DROP POLICY IF EXISTS "Workspace owners can delete members" ON public.workspace_members;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.users;

CREATE POLICY "Users can view workspaces they own or belong to" ON public.workspaces
FOR SELECT USING (
  owner_id = auth.uid()
  OR id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid())
);

CREATE POLICY "Users can view their own membership" ON public.workspace_members
FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Workspace owners can insert members" ON public.workspace_members
FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.workspaces WHERE id = workspace_id AND owner_id = auth.uid())
);

CREATE POLICY "Workspace owners can update members" ON public.workspace_members
FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.workspaces WHERE id = workspace_id AND owner_id = auth.uid())
);

CREATE POLICY "Workspace owners can delete members" ON public.workspace_members
FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.workspaces WHERE id = workspace_id AND owner_id = auth.uid())
);

CREATE POLICY "Users can insert their own profile" ON public.users
FOR INSERT WITH CHECK (auth.uid() = id);
