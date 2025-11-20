-- Migration 010: Create extraction_sessions table for IDEA-015
-- Web-based PDF upload workflow tracking
-- Created: 2025-11-21

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create extraction_sessions table
CREATE TABLE IF NOT EXISTS extraction_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id TEXT UNIQUE NOT NULL,  -- Short ID like "extract-abc123"

  -- File info
  pdf_filename TEXT NOT NULL,
  pdf_path TEXT NOT NULL,          -- Relative path: public/uploads/[sessionId]/original.pdf
  pdf_size_bytes BIGINT NOT NULL,

  -- Workflow state
  state TEXT NOT NULL DEFAULT 'uploaded',
  -- States: 'uploaded' | 'analyzing' | 'analyzed' | 'extracting' | 'extracted' | 'loading' | 'loaded' | 'failed'
  current_step INTEGER DEFAULT 1,   -- 1 = analyze, 2 = extract, 3 = load

  -- Analysis results (Step 1)
  paper_metadata JSONB,             -- {title, authors, doi, journal, year}
  tables_found INTEGER,
  data_types TEXT[],                -- ['AFT ages', 'He ages', 'Track lengths']

  -- Extraction results (Step 2)
  csvs_extracted INTEGER,
  extraction_quality_score INTEGER, -- 0-100
  failed_tables TEXT[],

  -- Load results (Step 3)
  dataset_id INTEGER REFERENCES datasets(id),
  fair_score INTEGER,
  records_imported INTEGER,

  -- Metadata
  user_id TEXT,                     -- Future: auth integration
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,

  -- Error tracking
  error_message TEXT,
  error_stage TEXT                  -- 'analyze' | 'extract' | 'load'
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_extraction_sessions_session_id ON extraction_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_extraction_sessions_state ON extraction_sessions(state);
CREATE INDEX IF NOT EXISTS idx_extraction_sessions_created_at ON extraction_sessions(created_at DESC);

-- Add table comment
COMMENT ON TABLE extraction_sessions IS 'IDEA-015: Tracks web-based PDF extraction workflows';

-- Verify table created
SELECT 'extraction_sessions table created successfully' AS status;
