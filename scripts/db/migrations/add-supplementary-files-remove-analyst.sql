-- Migration: Add supplementary files field and remove analyst field
-- Date: 2025-11-18
-- Purpose:
--   1. Add supplementary_files_url to track links to external data repositories (OSF, Zenodo, etc.)
--   2. Remove analyst field (not dataset-level, should be tracked per datapoint)

-- Add supplementary files URL field
ALTER TABLE datasets
ADD COLUMN IF NOT EXISTS supplementary_files_url TEXT;

COMMENT ON COLUMN datasets.supplementary_files_url IS 'URL to supplementary data repository (OSF, Zenodo, Figshare, etc.)';

-- Remove analyst field (analyst should be tracked at datapoint level, not dataset level)
ALTER TABLE datasets
DROP COLUMN IF EXISTS analyst;

-- Verification queries
SELECT
    column_name,
    data_type,
    character_maximum_length,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'datasets'
AND column_name IN ('doi', 'laboratory', 'publication_reference', 'full_citation',
                     'publication_year', 'publication_journal', 'publication_volume_pages',
                     'supplementary_files_url', 'pdf_url')
ORDER BY ordinal_position;
