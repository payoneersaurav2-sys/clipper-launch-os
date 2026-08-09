-- Original knowledge resources are private. Only extracted/pasted text is sent
-- to AI; the stored file can be downloaded by its owner when needed.
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('knowledge-assets', 'knowledge-assets', false, 10485760)
ON CONFLICT (id) DO UPDATE SET public = false, file_size_limit = EXCLUDED.file_size_limit;

DROP POLICY IF EXISTS "Users manage own CreatorOS knowledge files" ON storage.objects;
CREATE POLICY "Users manage own CreatorOS knowledge files"
  ON storage.objects FOR ALL TO authenticated
  USING (bucket_id = 'knowledge-assets' AND (storage.foldername(name))[1] = auth.uid()::text)
  WITH CHECK (bucket_id = 'knowledge-assets' AND (storage.foldername(name))[1] = auth.uid()::text);
