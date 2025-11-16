-- =============================================================================
-- Migration 005: Add Papers/Datasets Metadata for Multi-page UX (IDEA-004)
-- =============================================================================
-- Created: 2025-11-16
-- Purpose: Enhance datasets table with author metadata and create data_files table
-- Related: IDEA-004 Phase 2 - Papers View implementation
-- =============================================================================

-- Add new columns to datasets table for author and collection metadata
ALTER TABLE datasets
  ADD COLUMN IF NOT EXISTS authors TEXT[], -- Array of author names
  ADD COLUMN IF NOT EXISTS collection_date DATE, -- When samples were collected
  ADD COLUMN IF NOT EXISTS analysis_methods TEXT[]; -- Array of methods (e.g., 'LA-ICP-MS AFT', 'AHe')

COMMENT ON COLUMN datasets.authors IS 'Array of author names for the dataset/paper';
COMMENT ON COLUMN datasets.collection_date IS 'Date when samples were collected in the field';
COMMENT ON COLUMN datasets.analysis_methods IS 'Array of analysis methods used (e.g., LA-ICP-MS AFT, AHe, EDM)';

-- =============================================================================
-- Create data_files table to track CSV downloads
-- =============================================================================
CREATE TABLE IF NOT EXISTS data_files (
  id SERIAL PRIMARY KEY,
  dataset_id INTEGER NOT NULL REFERENCES datasets(id) ON DELETE CASCADE,

  -- File metadata
  file_name VARCHAR(200) NOT NULL, -- e.g., 'table-04-geosample-metadata.csv'
  file_path VARCHAR(500) NOT NULL, -- e.g., '/data/malawi-rift/table-04-geosample-metadata.csv'
  file_type VARCHAR(50) NOT NULL, -- e.g., 'geosample', 'aft_ages', 'ahe_grains', etc.
  display_name VARCHAR(200), -- User-friendly name (e.g., 'Geosample Metadata (Table 4)')

  -- File statistics
  file_size_bytes INTEGER, -- File size in bytes
  row_count INTEGER, -- Number of data rows (excluding header)

  -- Metadata
  description TEXT, -- Brief description of file contents
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_data_files_dataset ON data_files(dataset_id);
CREATE INDEX idx_data_files_type ON data_files(file_type);

COMMENT ON TABLE data_files IS 'Metadata for downloadable CSV data files';
COMMENT ON COLUMN data_files.file_type IS 'Category: geosample, aft_ages, aft_counts, aft_lengths, ahe_grains, dataset_metadata';
COMMENT ON COLUMN data_files.display_name IS 'User-friendly display name for UI';

-- =============================================================================
-- Update trigger for data_files
-- =============================================================================
CREATE TRIGGER update_data_files_updated_at
BEFORE UPDATE ON data_files
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- Update existing Malawi Rift dataset with author metadata
-- =============================================================================
UPDATE datasets
SET
  authors = ARRAY['M. McMillan'],
  collection_date = '2019-06-15', -- Placeholder - adjust if actual date known
  analysis_methods = ARRAY['LA-ICP-MS AFT', 'AHe']
WHERE id = 1;

-- =============================================================================
-- Insert data file metadata for Malawi Rift dataset
-- =============================================================================
INSERT INTO data_files (dataset_id, file_name, file_path, file_type, display_name, row_count, description) VALUES
  (1, 'dataset-metadata.csv', '/data/malawi-rift/dataset-metadata.csv', 'dataset_metadata', 'Dataset Metadata', 1, 'Dataset-level metadata and attribution'),
  (1, 'ahe-grain-data.csv', '/data/malawi-rift/ahe-grain-data.csv', 'ahe_grains', 'AHe Grain Data', 32, '(U-Th)/He single grain age data with chemistry'),
  (1, 'table-04-geosample-metadata.csv', '/data/malawi-rift/table-04-geosample-metadata.csv', 'geosample', 'Geosample Metadata (Table 4)', 19, 'Sample locations, lithology, and field metadata'),
  (1, 'table-05-fission-track-counts.csv', '/data/malawi-rift/table-05-fission-track-counts.csv', 'aft_counts', 'Fission-Track Counts (Table 5)', 19, 'Grain-by-grain track count data and chemistry'),
  (1, 'table-06-track-lengths.csv', '/data/malawi-rift/table-06-track-lengths.csv', 'aft_lengths', 'Track Lengths (Table 6)', 19, 'Confined track length measurements'),
  (1, 'table-10-fission-track-ages.csv', '/data/malawi-rift/table-10-fission-track-ages.csv', 'aft_ages', 'Fission-Track Ages (Table 10)', 19, 'Calculated pooled and central ages with statistics');

-- =============================================================================
-- Completion message
-- =============================================================================
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Migration 005 completed successfully!';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Changes:';
  RAISE NOTICE '  - Added authors, collection_date, analysis_methods to datasets';
  RAISE NOTICE '  - Created data_files table with 6 CSV references';
  RAISE NOTICE '  - Updated Malawi Rift dataset with author metadata';
  RAISE NOTICE '';
  RAISE NOTICE 'Next: Copy CSVs to public/data/malawi-rift/';
  RAISE NOTICE '========================================';
END $$;
