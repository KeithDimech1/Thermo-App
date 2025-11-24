-- Migration: Add paper_analysis_sections JSONB column to datasets table
-- Date: 2025-11-24
-- Purpose: Store structured paper analysis sections (Executive Summary, Problem, Methods, Results)
--          from paper-analysis.md for enhanced dataset overview display

-- Add paper_analysis_sections column
ALTER TABLE datasets
  ADD COLUMN IF NOT EXISTS paper_analysis_sections JSONB;

-- Create GIN index for JSONB queries (enables efficient JSON key searches)
CREATE INDEX IF NOT EXISTS idx_datasets_paper_analysis_sections
  ON datasets USING GIN (paper_analysis_sections);

-- Add comment explaining the structure
COMMENT ON COLUMN datasets.paper_analysis_sections IS
'Structured paper analysis sections from paper-analysis.md. Expected structure:
{
  "executive_summary": "Full text of section 1...",
  "problem_addressed": "Full text of section 2...",
  "methods": "Full text of section 3...",
  "results": "Full text of section 4..."
}';
