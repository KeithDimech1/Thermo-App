--
-- Fix Supabase Storage Upload Policy for Anonymous Users
-- Issue: RLS policy requires 'authenticated' role, but client uses 'anon' key
-- Solution: Allow both 'anon' and 'authenticated' roles to upload
--

-- Drop existing policies
DROP POLICY IF EXISTS "Authenticated users can upload" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete" ON storage.objects;

-- Create new policies that allow anonymous uploads
CREATE POLICY "Allow anonymous uploads" ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'extractions');

CREATE POLICY "Allow anonymous updates" ON storage.objects
FOR UPDATE
USING (bucket_id = 'extractions');

CREATE POLICY "Allow anonymous deletes" ON storage.objects
FOR DELETE
USING (bucket_id = 'extractions');

-- Verify policies
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename = 'objects'
  AND policyname LIKE '%anonymous%'
ORDER BY policyname;
