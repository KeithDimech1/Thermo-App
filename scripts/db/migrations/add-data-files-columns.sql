-- Migration: Add missing columns to data_files table
-- Date: 2025-11-23
-- Purpose: Add columns needed for file categorization, upload tracking, and display

-- Add new columns
ALTER TABLE data_files
  ADD COLUMN IF NOT EXISTS category VARCHAR(100),
  ADD COLUMN IF NOT EXISTS upload_status VARCHAR(50) DEFAULT 'available',
  ADD COLUMN IF NOT EXISTS display_name TEXT,
  ADD COLUMN IF NOT EXISTS is_folder BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS source_url TEXT,
  ADD COLUMN IF NOT EXISTS upload_notes TEXT,
  ADD COLUMN IF NOT EXISTS row_count INTEGER,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Set default values for existing rows based on file_type
UPDATE data_files
SET
  category = CASE
    WHEN file_type = 'pdf' THEN 'paper'
    WHEN file_type = 'csv' THEN 'data'
    WHEN file_type LIKE 'image%' THEN 'image'
    ELSE 'other'
  END,
  display_name = COALESCE(display_name, file_name),
  upload_status = COALESCE(upload_status, 'available')
WHERE category IS NULL;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_data_files_category ON data_files(category);
CREATE INDEX IF NOT EXISTS idx_data_files_upload_status ON data_files(upload_status);

-- Add comments
COMMENT ON COLUMN data_files.category IS 'File category (paper, data, supplementary, image, etc.)';
COMMENT ON COLUMN data_files.upload_status IS 'Upload status (available, pending, not_uploadable, external_only)';
COMMENT ON COLUMN data_files.display_name IS 'Human-readable file name for display';
COMMENT ON COLUMN data_files.is_folder IS 'Whether this represents a folder/directory';
COMMENT ON COLUMN data_files.source_url IS 'External URL if file is hosted elsewhere';
COMMENT ON COLUMN data_files.upload_notes IS 'Notes about upload status or location';
COMMENT ON COLUMN data_files.row_count IS 'Number of rows for CSV files';
