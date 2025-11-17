-- Migration: Add metadata columns to datasets table for paper analysis
-- Run with: psql "$DATABASE_URL" -f scripts/db/migrations/add-dataset-metadata-columns.sql

ALTER TABLE datasets
  ADD COLUMN IF NOT EXISTS authors text[],
  ADD COLUMN IF NOT EXISTS collection_date date,
  ADD COLUMN IF NOT EXISTS analysis_methods text[],
  ADD COLUMN IF NOT EXISTS paper_summary text,
  ADD COLUMN IF NOT EXISTS fair_score integer CHECK (fair_score >= 0 AND fair_score <= 100),
  ADD COLUMN IF NOT EXISTS fair_reasoning text,
  ADD COLUMN IF NOT EXISTS key_findings text[],
  ADD COLUMN IF NOT EXISTS extraction_report_url text;

-- Add comment
COMMENT ON COLUMN datasets.paper_summary IS 'Executive summary of the research paper';
COMMENT ON COLUMN datasets.fair_score IS 'FAIR data compliance score (0-100)';
COMMENT ON COLUMN datasets.key_findings IS 'Array of key scientific findings from the paper';
