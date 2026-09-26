ALTER TABLE public.knowledge_chunks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage knowledge chunks in their workspaces"
  ON public.knowledge_chunks
  FOR ALL
  USING (public.user_belongs_to_workspace(workspace_id))
  WITH CHECK (public.user_belongs_to_workspace(workspace_id));
