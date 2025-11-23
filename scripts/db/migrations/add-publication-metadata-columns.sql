-- Migration: Add publication metadata columns to datasets table
-- Date: 2025-11-23
-- Purpose: Add missing publication metadata fields that are needed for proper dataset display

-- Add publication information columns
ALTER TABLE datasets
  ADD COLUMN IF NOT EXISTS full_citation TEXT,
  ADD COLUMN IF NOT EXISTS authors TEXT[],
  ADD COLUMN IF NOT EXISTS publication_journal VARCHAR(200),
  ADD COLUMN IF NOT EXISTS publication_year INTEGER,
  ADD COLUMN IF NOT EXISTS publication_volume_pages VARCHAR(100),
  ADD COLUMN IF NOT EXISTS doi VARCHAR(100);

-- Add file reference columns
ALTER TABLE datasets
  ADD COLUMN IF NOT EXISTS pdf_filename VARCHAR(500),
  ADD COLUMN IF NOT EXISTS pdf_url TEXT,
  ADD COLUMN IF NOT EXISTS supplementary_files_url TEXT;

-- Add study metadata columns
ALTER TABLE datasets
  ADD COLUMN IF NOT EXISTS study_location TEXT,
  ADD COLUMN IF NOT EXISTS laboratory VARCHAR(200),
  ADD COLUMN IF NOT EXISTS mineral_analyzed VARCHAR(100),
  ADD COLUMN IF NOT EXISTS sample_count INTEGER,
  ADD COLUMN IF NOT EXISTS age_range_min_ma NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS age_range_max_ma NUMERIC(10,2);

-- Add analysis metadata columns
ALTER TABLE datasets
  ADD COLUMN IF NOT EXISTS analysis_methods TEXT[],
  ADD COLUMN IF NOT EXISTS paper_summary TEXT,
  ADD COLUMN IF NOT EXISTS key_findings TEXT[];

-- Add FAIR scoring column (for display purposes - detailed breakdown in fair_score_breakdown table)
ALTER TABLE datasets
  ADD COLUMN IF NOT EXISTS fair_score INTEGER,
  ADD COLUMN IF NOT EXISTS fair_reasoning TEXT,
  ADD COLUMN IF NOT EXISTS extraction_report_url TEXT;

-- Add audit columns
ALTER TABLE datasets
  ADD COLUMN IF NOT EXISTS collection_date DATE,
  ADD COLUMN IF NOT EXISTS analyst VARCHAR(200);

-- Rename existing column to match new schema (if needed)
-- publication_doi -> doi is handled by new doi column above
-- study_area -> study_location is handled by new study_location column above

-- Create index on authors for search
CREATE INDEX IF NOT EXISTS idx_datasets_authors ON datasets USING GIN (authors);

-- Create index on DOI for lookup
CREATE INDEX IF NOT EXISTS idx_datasets_publication_doi ON datasets(doi) WHERE doi IS NOT NULL;

-- Create index on publication year for filtering
CREATE INDEX IF NOT EXISTS idx_datasets_publication_year ON datasets(publication_year) WHERE publication_year IS NOT NULL;

-- Add comment
COMMENT ON COLUMN datasets.full_citation IS 'Full publication citation';
COMMENT ON COLUMN datasets.authors IS 'Array of author names';
COMMENT ON COLUMN datasets.publication_journal IS 'Journal name';
COMMENT ON COLUMN datasets.publication_year IS 'Publication year';
COMMENT ON COLUMN datasets.doi IS 'Publication DOI';
COMMENT ON COLUMN datasets.fair_score IS 'Overall FAIR score (0-100)';
