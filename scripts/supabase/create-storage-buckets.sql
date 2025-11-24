--
-- Supabase Storage Bucket Setup for ERROR-021 Migration
-- Run this in Supabase SQL Editor: https://app.supabase.com/project/_/sql
--

-- =====================================================
-- BUCKET 1: extractions (temporary workspace)
-- =====================================================
-- Stores temporary extraction files during analysis/extraction workflow
-- Structure: extractions/{sessionId}/{files}
-- Lifecycle: Can be cleaned up after load completes

INSERT INTO storage.buckets (id, name, public)
VALUES ('extractions', 'extractions', true)
ON CONFLICT (id) DO NOTHING;

-- Set public access policy for extractions bucket
CREATE POLICY "Public Access" ON storage.objects FOR SELECT
USING (bucket_id = 'extractions');

-- Allow anonymous uploads (uses NEXT_PUBLIC_SUPABASE_ANON_KEY)
CREATE POLICY "Allow anonymous uploads" ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'extractions');

CREATE POLICY "Allow anonymous updates" ON storage.objects FOR UPDATE
USING (bucket_id = 'extractions');

CREATE POLICY "Allow anonymous deletes" ON storage.objects FOR DELETE
USING (bucket_id = 'extractions');

-- =====================================================
-- BUCKET 2: datasets (permanent storage)
-- =====================================================
-- Stores final published datasets
-- Structure: datasets/{datasetId}/{files}
-- Lifecycle: Permanent (linked to datasets table)

INSERT INTO storage.buckets (id, name, public)
VALUES ('datasets', 'datasets', true)
ON CONFLICT (id) DO NOTHING;

-- Set public access policy for datasets bucket
CREATE POLICY "Public Access" ON storage.objects FOR SELECT
USING (bucket_id = 'datasets');

CREATE POLICY "Authenticated users can upload" ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'datasets' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update" ON storage.objects FOR UPDATE
USING (bucket_id = 'datasets' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete" ON storage.objects FOR DELETE
USING (bucket_id = 'datasets' AND auth.role() = 'authenticated');

-- =====================================================
-- Verify bucket creation
-- =====================================================
SELECT id, name, public, created_at
FROM storage.buckets
WHERE id IN ('extractions', 'datasets')
ORDER BY name;
