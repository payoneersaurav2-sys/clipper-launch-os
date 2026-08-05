-- 1. Drop the problematic recursive policies
DROP POLICY IF EXISTS "Workspace owners can manage members" ON public.workspace_members;
DROP POLICY IF EXISTS "Users can view workspaces they own or belong to" ON public.workspaces;

-- 2. Recreate Workspace SELECT Policy
CREATE POLICY "Users can view workspaces they own or belong to" ON public.workspaces 
FOR SELECT 
USING (
  owner_id = auth.uid() 
  OR 
  id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid())
);

-- 3. Fix Workspace Members Policies (Break the loop by separating SELECT from modifying)
CREATE POLICY "Users can view their own membership" ON public.workspace_members 
FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Workspace owners can insert members" ON public.workspace_members 
FOR INSERT 
WITH CHECK (
  EXISTS (SELECT 1 FROM public.workspaces WHERE id = workspace_id AND owner_id = auth.uid())
);

CREATE POLICY "Workspace owners can update members" ON public.workspace_members 
FOR UPDATE 
USING (
  EXISTS (SELECT 1 FROM public.workspaces WHERE id = workspace_id AND owner_id = auth.uid())
);

CREATE POLICY "Workspace owners can delete members" ON public.workspace_members 
FOR DELETE 
USING (
  EXISTS (SELECT 1 FROM public.workspaces WHERE id = workspace_id AND owner_id = auth.uid())
);
