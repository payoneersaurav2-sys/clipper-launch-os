-- Private workspace-scoped media for Clip Pipeline uploads.
ALTER TABLE public.clips ADD COLUMN IF NOT EXISTS media_path TEXT;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('clip-media', 'clip-media', false, 104857600, ARRAY['video/mp4', 'video/quicktime', 'video/webm', 'image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO UPDATE SET public = false, file_size_limit = 104857600;

DROP POLICY IF EXISTS "Workspace members can view clip media" ON storage.objects;
DROP POLICY IF EXISTS "Workspace members can upload clip media" ON storage.objects;
DROP POLICY IF EXISTS "Workspace members can update clip media" ON storage.objects;
DROP POLICY IF EXISTS "Workspace members can delete clip media" ON storage.objects;

CREATE POLICY "Workspace members can view clip media" ON storage.objects FOR SELECT
USING (bucket_id = 'clip-media' AND public.user_belongs_to_workspace(((storage.foldername(name))[1])::uuid));
CREATE POLICY "Workspace members can upload clip media" ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'clip-media' AND public.user_belongs_to_workspace(((storage.foldername(name))[1])::uuid));
CREATE POLICY "Workspace members can update clip media" ON storage.objects FOR UPDATE
USING (bucket_id = 'clip-media' AND public.user_belongs_to_workspace(((storage.foldername(name))[1])::uuid))
WITH CHECK (bucket_id = 'clip-media' AND public.user_belongs_to_workspace(((storage.foldername(name))[1])::uuid));
CREATE POLICY "Workspace members can delete clip media" ON storage.objects FOR DELETE
USING (bucket_id = 'clip-media' AND public.user_belongs_to_workspace(((storage.foldername(name))[1])::uuid));
