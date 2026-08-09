-- Supabase Storage requires a SELECT policy for upsert:true to work, 
-- because it needs to check if the file already exists before doing an UPDATE.

DROP POLICY IF EXISTS "Users view own CreatorOS avatar" ON storage.objects;
CREATE POLICY "Users view own CreatorOS avatar"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'user-avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
