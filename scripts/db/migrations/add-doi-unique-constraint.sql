-- Migration: Add unique constraint on datasets.doi
-- Date: 2025-11-24
-- Purpose: Prevent duplicate papers from being uploaded

-- Add unique constraint on DOI (allows NULL, but ensures non-NULL values are unique)
ALTER TABLE datasets ADD CONSTRAINT datasets_doi_unique UNIQUE (doi);

-- Create index on DOI for faster duplicate checks
CREATE INDEX IF NOT EXISTS idx_datasets_doi ON datasets(doi) WHERE doi IS NOT NULL;
