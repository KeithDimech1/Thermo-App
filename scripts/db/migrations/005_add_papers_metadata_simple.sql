-- Migration 005: Add Papers Metadata (Simplified)
-- Add columns to datasets table
ALTER TABLE datasets ADD COLUMN IF NOT EXISTS authors TEXT[];
ALTER TABLE datasets ADD COLUMN IF NOT EXISTS collection_date DATE;
ALTER TABLE datasets ADD COLUMN IF NOT EXISTS analysis_methods TEXT[];

-- Create data_files table
CREATE TABLE IF NOT EXISTS data_files (
  id SERIAL PRIMARY KEY,
  dataset_id INTEGER NOT NULL REFERENCES datasets(id) ON DELETE CASCADE,
  file_name VARCHAR(200) NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  file_type VARCHAR(50) NOT NULL,
  display_name VARCHAR(200),
  file_size_bytes INTEGER,
  row_count INTEGER,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_data_files_dataset ON data_files(dataset_id);
CREATE INDEX IF NOT EXISTS idx_data_files_type ON data_files(file_type);

-- Update existing dataset
UPDATE datasets SET
  authors = ARRAY['M. McMillan'],
  collection_date = '2019-06-15',
  analysis_methods = ARRAY['LA-ICP-MS AFT', 'AHe']
WHERE id = 1 AND authors IS NULL;

-- Insert file metadata
INSERT INTO data_files (dataset_id, file_name, file_path, file_type, display_name, row_count, description)
SELECT 1, 'dataset-metadata.csv', '/data/malawi-rift/dataset-metadata.csv', 'dataset_metadata', 'Dataset Metadata', 1, 'Dataset-level metadata and attribution'
WHERE NOT EXISTS (SELECT 1 FROM data_files WHERE file_name = 'dataset-metadata.csv');

INSERT INTO data_files (dataset_id, file_name, file_path, file_type, display_name, row_count, description)
SELECT 1, 'ahe-grain-data.csv', '/data/malawi-rift/ahe-grain-data.csv', 'ahe_grains', 'AHe Grain Data', 32, '(U-Th)/He single grain age data'
WHERE NOT EXISTS (SELECT 1 FROM data_files WHERE file_name = 'ahe-grain-data.csv');

INSERT INTO data_files (dataset_id, file_name, file_path, file_type, display_name, row_count, description)
SELECT 1, 'table-04-geosample-metadata.csv', '/data/malawi-rift/table-04-geosample-metadata.csv', 'geosample', 'Geosample Metadata (Table 4)', 19, 'Sample locations and metadata'
WHERE NOT EXISTS (SELECT 1 FROM data_files WHERE file_name = 'table-04-geosample-metadata.csv');

INSERT INTO data_files (dataset_id, file_name, file_path, file_type, display_name, row_count, description)
SELECT 1, 'table-05-fission-track-counts.csv', '/data/malawi-rift/table-05-fission-track-counts.csv', 'aft_counts', 'Fission-Track Counts (Table 5)', 19, 'Track count data'
WHERE NOT EXISTS (SELECT 1 FROM data_files WHERE file_name = 'table-05-fission-track-counts.csv');

INSERT INTO data_files (dataset_id, file_name, file_path, file_type, display_name, row_count, description)
SELECT 1, 'table-06-track-lengths.csv', '/data/malawi-rift/table-06-track-lengths.csv', 'aft_lengths', 'Track Lengths (Table 6)', 19, 'Track length measurements'
WHERE NOT EXISTS (SELECT 1 FROM data_files WHERE file_name = 'table-06-track-lengths.csv');

INSERT INTO data_files (dataset_id, file_name, file_path, file_type, display_name, row_count, description)
SELECT 1, 'table-10-fission-track-ages.csv', '/data/malawi-rift/table-10-fission-track-ages.csv', 'aft_ages', 'Fission-Track Ages (Table 10)', 19, 'Calculated ages with statistics'
WHERE NOT EXISTS (SELECT 1 FROM data_files WHERE file_name = 'table-10-fission-track-ages.csv');
