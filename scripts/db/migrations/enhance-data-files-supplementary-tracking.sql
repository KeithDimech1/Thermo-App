-- Migration: Enhance data_files table for supplementary file tracking
-- Date: 2025-11-18
-- Purpose: Track supplementary data files from external repositories (OSF, Zenodo, etc.)
--          Enable showing "Supplementary data: ✅ Uploaded / ⚠️ Partial / ❌ Not uploaded"

-- Add upload status tracking
ALTER TABLE data_files
ADD COLUMN IF NOT EXISTS upload_status VARCHAR(20) DEFAULT 'available';

COMMENT ON COLUMN data_files.upload_status IS 'Upload status: available (uploaded/accessible), pending (to be uploaded), not_uploadable (too large/format issue), external_only (reference link only)';

-- Add category for organizing supplementary files
ALTER TABLE data_files
ADD COLUMN IF NOT EXISTS category VARCHAR(100);

COMMENT ON COLUMN data_files.category IS 'Category for organizing files: supplementary_data, supplementary_figures, supplementary_text, raw_extract, earthbank_template, main_pdf, etc.';

-- Add source URL for tracking where file came from
ALTER TABLE data_files
ADD COLUMN IF NOT EXISTS source_url TEXT;

COMMENT ON COLUMN data_files.source_url IS 'Original download URL (OSF, Zenodo, etc.) if file was obtained from external repository';

-- Add upload notes for tracking issues
ALTER TABLE data_files
ADD COLUMN IF NOT EXISTS upload_notes TEXT;

COMMENT ON COLUMN data_files.upload_notes IS 'Notes about upload status, issues, or special handling requirements';

-- Create index for faster filtering by upload status
CREATE INDEX IF NOT EXISTS idx_data_files_upload_status ON data_files(upload_status);
CREATE INDEX IF NOT EXISTS idx_data_files_category ON data_files(category);

-- Verification query
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'data_files'
AND column_name IN ('upload_status', 'category', 'source_url', 'upload_notes')
ORDER BY ordinal_position;

-- Check indexes
SELECT
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'data_files'
AND indexname LIKE 'idx_data_files_%';
