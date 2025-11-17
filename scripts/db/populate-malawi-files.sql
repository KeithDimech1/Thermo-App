-- Populate data_files for Malawi dataset (ID=1)
-- Run with: psql "$DATABASE_URL" -f scripts/db/populate-malawi-files.sql

-- Clear existing files for this dataset
DELETE FROM data_files WHERE dataset_id = 1;

-- =============================================================================
-- RAW DATA FILES (from RAW/ folder)
-- =============================================================================

-- Table 1: AFT Results (CSV)
INSERT INTO data_files (dataset_id, file_name, file_path, file_type, display_name, description, file_size_bytes)
VALUES (
  1,
  'table1-aft-results.csv',
  '/build-data/learning/thermo-papers/Malawi-Rift-Footwall-Exhumation/RAW/table1-aft-results.csv',
  'RAW',
  'Table 1 - AFT Results',
  'Raw data extracted from paper Table 1 (AFT results summary)',
  NULL
);

-- Table 2: (U-Th)/He Results Part 1 (CSV)
INSERT INTO data_files (dataset_id, file_name, file_path, file_type, display_name, description, file_size_bytes)
VALUES (
  1,
  'table2-uthe-results-part1.csv',
  '/build-data/learning/thermo-papers/Malawi-Rift-Footwall-Exhumation/RAW/table2-uthe-results-part1.csv',
  'RAW',
  'Table 2 - (U-Th)/He Results',
  'Raw data extracted from paper Table 2 ((U-Th)/He results)',
  NULL
);

-- Table A2: Detailed EPMA Composition (CSV)
INSERT INTO data_files (dataset_id, file_name, file_path, file_type, display_name, description, file_size_bytes)
VALUES (
  1,
  'tableA2.csv',
  '/build-data/learning/thermo-papers/Malawi-Rift-Footwall-Exhumation/RAW/tableA2.csv',
  'RAW',
  'Table A2 - EPMA Composition',
  'Raw data extracted from Table A2 (detailed EPMA mineral composition)',
  NULL
);

-- Table A3: Durango QC (CSV)
INSERT INTO data_files (dataset_id, file_name, file_path, file_type, display_name, description, file_size_bytes)
VALUES (
  1,
  'tableA3-durango-qc.csv',
  '/build-data/learning/thermo-papers/Malawi-Rift-Footwall-Exhumation/RAW/tableA3-durango-qc.csv',
  'RAW',
  'Table A3 - Durango QC Standards',
  'Quality control data for Durango apatite reference material',
  NULL
);

-- =============================================================================
-- EARTHBANK/FAIR DATA FILES (from FAIR/ folder)
-- =============================================================================

-- Samples (EarthBank format)
INSERT INTO data_files (dataset_id, file_name, file_path, file_type, display_name, description, file_size_bytes)
VALUES (
  1,
  'earthbank_samples_complete.csv',
  '/build-data/learning/thermo-papers/Malawi-Rift-Footwall-Exhumation/FAIR/earthbank_samples_complete.csv',
  'EarthBank',
  'Samples (EarthBank Format)',
  'EarthBank-formatted sample data (FAIR compliant)',
  NULL
);

-- FT Datapoints (EarthBank format)
INSERT INTO data_files (dataset_id, file_name, file_path, file_type, display_name, description, file_size_bytes)
VALUES (
  1,
  'earthbank_ft_datapoints_complete.csv',
  '/build-data/learning/thermo-papers/Malawi-Rift-Footwall-Exhumation/FAIR/earthbank_ft_datapoints_complete.csv',
  'EarthBank',
  'FT Datapoints (EarthBank Format)',
  'EarthBank-formatted fission-track datapoint data (FAIR compliant)',
  NULL
);

-- FT Track Length Data (EarthBank format)
INSERT INTO data_files (dataset_id, file_name, file_path, file_type, display_name, description, file_size_bytes)
VALUES (
  1,
  'earthbank_ft_track_length_data_complete.csv',
  '/build-data/learning/thermo-papers/Malawi-Rift-Footwall-Exhumation/FAIR/earthbank_ft_track_length_data_complete.csv',
  'EarthBank',
  'FT Track Lengths (EarthBank Format)',
  'EarthBank-formatted track length data (FAIR compliant)',
  NULL
);

-- He Whole Grain Data (EarthBank format)
INSERT INTO data_files (dataset_id, file_name, file_path, file_type, display_name, description, file_size_bytes)
VALUES (
  1,
  'earthbank_he_whole_grain_complete.csv',
  '/build-data/learning/thermo-papers/Malawi-Rift-Footwall-Exhumation/FAIR/earthbank_he_whole_grain_complete.csv',
  'EarthBank',
  'He Whole Grain Data (EarthBank Format)',
  'EarthBank-formatted (U-Th)/He grain data (FAIR compliant)',
  NULL
);

-- =============================================================================
-- PDF FILES
-- =============================================================================

-- Main paper PDF
INSERT INTO data_files (dataset_id, file_name, file_path, file_type, display_name, description, file_size_bytes)
VALUES (
  1,
  '4D fault evolution revealed by footwall exhumation modelling_ A natural experiment in the Malawi rift.pdf',
  '/build-data/learning/thermo-papers/Malawi-Rift-Footwall-Exhumation/4D fault evolution revealed by footwall exhumation modelling_ A natural experiment in the Malawi rift.pdf',
  'PDF',
  'McMillan et al. (2024) - Full Paper',
  'Complete research article from Journal of Structural Geology',
  NULL
);

-- Table 1 PDF extract
INSERT INTO data_files (dataset_id, file_name, file_path, file_type, display_name, description, file_size_bytes)
VALUES (
  1,
  'table1_page9.pdf',
  '/build-data/learning/thermo-papers/Malawi-Rift-Footwall-Exhumation/RAW/table1_page9.pdf',
  'PDF',
  'Table 1 Extract (Page 9)',
  'PDF extract of AFT results table from paper',
  NULL
);

-- Table 2 PDF extract
INSERT INTO data_files (dataset_id, file_name, file_path, file_type, display_name, description, file_size_bytes)
VALUES (
  1,
  'table2_pages10-11.pdf',
  '/build-data/learning/thermo-papers/Malawi-Rift-Footwall-Exhumation/RAW/table2_pages10-11.pdf',
  'PDF',
  'Table 2 Extract (Pages 10-11)',
  'PDF extract of (U-Th)/He results table from paper',
  NULL
);

-- Table A2 PDF extract
INSERT INTO data_files (dataset_id, file_name, file_path, file_type, display_name, description, file_size_bytes)
VALUES (
  1,
  'tableA2_pages22-36.pdf',
  '/build-data/learning/thermo-papers/Malawi-Rift-Footwall-Exhumation/RAW/tableA2_pages22-36.pdf',
  'PDF',
  'Table A2 Extract (Pages 22-36)',
  'PDF extract of EPMA composition data from paper',
  NULL
);

-- Table A3 PDF extract
INSERT INTO data_files (dataset_id, file_name, file_path, file_type, display_name, description, file_size_bytes)
VALUES (
  1,
  'tableA3_page36.pdf',
  '/build-data/learning/thermo-papers/Malawi-Rift-Footwall-Exhumation/RAW/tableA3_page36.pdf',
  'PDF',
  'Table A3 Extract (Page 36)',
  'PDF extract of Durango QC standards from paper',
  NULL
);

-- =============================================================================
-- IMAGES (Directory reference)
-- =============================================================================

INSERT INTO data_files (dataset_id, file_name, file_path, file_type, display_name, description, file_size_bytes)
VALUES (
  1,
  'images-archive',
  '/build-data/learning/thermo-papers/Malawi-Rift-Footwall-Exhumation/images',
  'Images',
  'Figure Images Archive',
  '57 extracted figures and diagrams from the paper',
  NULL
);

-- Show summary
SELECT file_type, COUNT(*) as count, SUM(file_size_bytes)::INTEGER as total_bytes
FROM data_files
WHERE dataset_id = 1
GROUP BY file_type
ORDER BY file_type;

SELECT 'Total files: ' || COUNT(*)::TEXT FROM data_files WHERE dataset_id = 1;
