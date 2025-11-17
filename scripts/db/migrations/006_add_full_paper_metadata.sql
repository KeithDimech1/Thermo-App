-- Migration: Add comprehensive paper metadata and FAIR scoring to datasets
-- Run with: psql "$DATABASE_URL" -f scripts/db/migrations/006_add_full_paper_metadata.sql

-- ========================================
-- Add additional metadata fields to datasets table
-- ========================================

ALTER TABLE datasets
  ADD COLUMN IF NOT EXISTS full_citation TEXT,
  ADD COLUMN IF NOT EXISTS publication_year INTEGER,
  ADD COLUMN IF NOT EXISTS publication_journal VARCHAR(200),
  ADD COLUMN IF NOT EXISTS publication_volume_pages VARCHAR(100),
  ADD COLUMN IF NOT EXISTS study_location TEXT,
  ADD COLUMN IF NOT EXISTS pdf_filename VARCHAR(500),
  ADD COLUMN IF NOT EXISTS pdf_url TEXT,
  ADD COLUMN IF NOT EXISTS mineral_analyzed VARCHAR(100),
  ADD COLUMN IF NOT EXISTS sample_count INTEGER,
  ADD COLUMN IF NOT EXISTS age_range_min_ma DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS age_range_max_ma DECIMAL(10,2);

-- Add comments
COMMENT ON COLUMN datasets.full_citation IS 'Complete formatted citation for the research paper';
COMMENT ON COLUMN datasets.publication_year IS 'Year of publication';
COMMENT ON COLUMN datasets.publication_journal IS 'Journal name';
COMMENT ON COLUMN datasets.publication_volume_pages IS 'Volume and page numbers (e.g., "187, 105196")';
COMMENT ON COLUMN datasets.study_location IS 'Geographic location of the study (e.g., "Central Basin, Malawi Rift")';
COMMENT ON COLUMN datasets.pdf_filename IS 'Filename of the PDF (stored in project)';
COMMENT ON COLUMN datasets.pdf_url IS 'Public URL to access the PDF (served via Vercel)';
COMMENT ON COLUMN datasets.mineral_analyzed IS 'Mineral type analyzed (apatite, zircon, etc.)';
COMMENT ON COLUMN datasets.sample_count IS 'Total number of samples in dataset';
COMMENT ON COLUMN datasets.age_range_min_ma IS 'Minimum age in dataset (Ma)';
COMMENT ON COLUMN datasets.age_range_max_ma IS 'Maximum age in dataset (Ma)';

-- ========================================
-- Create FAIR score breakdown table
-- ========================================

CREATE TABLE IF NOT EXISTS fair_score_breakdown (
  id SERIAL PRIMARY KEY,
  dataset_id INTEGER NOT NULL UNIQUE REFERENCES datasets(id) ON DELETE CASCADE,

  -- Table-level scores (Kohn et al. 2024)
  table4_score INTEGER CHECK (table4_score >= 0 AND table4_score <= 15),
  table4_reasoning TEXT,
  table5_score INTEGER CHECK (table5_score >= 0 AND table5_score <= 15),
  table5_reasoning TEXT,
  table6_score INTEGER CHECK (table6_score >= 0 AND table6_score <= 10),
  table6_reasoning TEXT,
  table10_score INTEGER CHECK (table10_score >= 0 AND table10_score <= 10),
  table10_reasoning TEXT,

  -- FAIR category scores (25 points each)
  findable_score INTEGER CHECK (findable_score >= 0 AND findable_score <= 25),
  findable_reasoning TEXT,
  accessible_score INTEGER CHECK (accessible_score >= 0 AND accessible_score <= 25),
  accessible_reasoning TEXT,
  interoperable_score INTEGER CHECK (interoperable_score >= 0 AND interoperable_score <= 25),
  interoperable_reasoning TEXT,
  reusable_score INTEGER CHECK (reusable_score >= 0 AND reusable_score <= 25),
  reusable_reasoning TEXT,

  -- Overall score
  total_score INTEGER CHECK (total_score >= 0 AND total_score <= 100),
  grade VARCHAR(2),

  -- Metadata
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT check_total_matches_sum CHECK (
    total_score = findable_score + accessible_score + interoperable_score + reusable_score
  )
);

CREATE INDEX idx_fair_breakdown_dataset ON fair_score_breakdown(dataset_id);
CREATE INDEX idx_fair_breakdown_grade ON fair_score_breakdown(grade);

COMMENT ON TABLE fair_score_breakdown IS 'Detailed FAIR data compliance assessment breakdown';
COMMENT ON COLUMN fair_score_breakdown.table4_score IS 'Kohn et al. (2024) Table 4 score - Geosample Metadata (max 15)';
COMMENT ON COLUMN fair_score_breakdown.table5_score IS 'Kohn et al. (2024) Table 5 score - FT Counts (max 15)';
COMMENT ON COLUMN fair_score_breakdown.table6_score IS 'Kohn et al. (2024) Table 6 score - Track Lengths (max 10)';
COMMENT ON COLUMN fair_score_breakdown.table10_score IS 'Kohn et al. (2024) Table 10 score - Ages (max 10)';
COMMENT ON COLUMN fair_score_breakdown.findable_score IS 'FAIR Findable score (max 25)';
COMMENT ON COLUMN fair_score_breakdown.accessible_score IS 'FAIR Accessible score (max 25)';
COMMENT ON COLUMN fair_score_breakdown.interoperable_score IS 'FAIR Interoperable score (max 25)';
COMMENT ON COLUMN fair_score_breakdown.reusable_score IS 'FAIR Reusable score (max 25)';
COMMENT ON COLUMN fair_score_breakdown.grade IS 'Letter grade: A (90-100), B (80-89), C (70-79), D (60-69), F (<60)';

-- ========================================
-- Update data_files table to support folders
-- ========================================

ALTER TABLE data_files
  ADD COLUMN IF NOT EXISTS is_folder BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS folder_path VARCHAR(500);

COMMENT ON COLUMN data_files.is_folder IS 'TRUE if this entry represents a folder (like RAW/ or FAIR/)';
COMMENT ON COLUMN data_files.folder_path IS 'Path to the folder if is_folder=TRUE';
