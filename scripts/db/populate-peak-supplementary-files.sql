-- Populate supplementary files for Peak et al. (2021) dataset
-- Source: https://doi.org/10.17605/OSF.IO/D8B2Q (OSF repository)
-- Generated: 2025-11-18

-- Dataset ID for Peak et al. (2021)
-- (Will use subquery to get ID dynamically)

-- ============================================================================
-- SUPPLEMENTARY DATA FILES (Excel - Uploadable)
-- ============================================================================

-- Main data tables file
INSERT INTO data_files (dataset_id, file_name, file_path, file_type, category, upload_status, source_url, display_name, description)
VALUES (
  (SELECT id FROM datasets WHERE dataset_name = 'Peak et al. (2021)'),
  'Tables_Peaketal_GrandCanyonPaleotopography.xlsx',
  '/build-data/learning/thermo-papers/Peak(2021)-Grand-Canyon-Great-Unconformity-Geology/supplemental/Tables_Peaketal_GrandCanyonPaleotopography.xlsx',
  'Excel',
  'supplementary_data',
  'available',
  'https://doi.org/10.17605/OSF.IO/D8B2Q',
  'Complete ZHe Analytical Data Tables',
  'Primary data file containing all (U-Th)/He analytical results and thermal history modeling data. Includes 12 tables (S1-S12): ZHe summary and detailed data, zonation profiles, thermal modeling constraints, and inverse/forward model results (1.1 MB)'
)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- SUPPLEMENTARY DOCUMENTS (PDF - Uploadable)
-- ============================================================================

-- Supplementary text (methods and discussion)
INSERT INTO data_files (dataset_id, file_name, file_path, file_type, category, upload_status, source_url, display_name, description)
VALUES (
  (SELECT id FROM datasets WHERE dataset_name = 'Peak et al. (2021)'),
  'SupplementaryText.pdf',
  '/build-data/learning/thermo-papers/Peak(2021)-Grand-Canyon-Great-Unconformity-Geology/supplemental/SupplementaryText.pdf',
  'PDF',
  'supplementary_text',
  'available',
  'https://doi.org/10.17605/OSF.IO/D8B2Q',
  'Supplementary Methods and Results',
  'Extended methods, thermal history modeling approach, detailed analytical procedures for ZHe and LA-ICP-MS, additional discussion of data interpretations (186 KB)'
)
ON CONFLICT DO NOTHING;

-- Supplementary figures
INSERT INTO data_files (dataset_id, file_name, file_path, file_type, category, upload_status, source_url, display_name, description)
VALUES (
  (SELECT id FROM datasets WHERE dataset_name = 'Peak et al. (2021)'),
  'SupplementaryFigures.pdf',
  '/build-data/learning/thermo-papers/Peak(2021)-Grand-Canyon-Great-Unconformity-Geology/supplemental/SupplementaryFigures.pdf',
  'PDF',
  'supplementary_figures',
  'available',
  'https://doi.org/10.17605/OSF.IO/D8B2Q',
  'Supplementary Figures (S1-S5)',
  'Supplementary figures including date vs. radius plots (grain size effects), LA-ICP-MS zonation profiles (U, Th, Sm depth plots), zonation pattern variability, and UGG forward/inverse model results (2.1 MB)'
)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- RAW DATA FILES (LA-ICP-MS Depth Profiles - Uploadable as folder reference)
-- ============================================================================

-- Track the depth profiles folder (10 individual files)
INSERT INTO data_files (dataset_id, file_name, file_path, file_type, category, upload_status, source_url, display_name, description, is_folder, folder_path)
VALUES (
  (SELECT id FROM datasets WHERE dataset_name = 'Peak et al. (2021)'),
  'LA-ICP-MS Depth Profile Data Files',
  '/build-data/learning/thermo-papers/Peak(2021)-Grand-Canyon-Great-Unconformity-Geology/supplemental/DepthProfiles_DataFiles/',
  'Text',
  'supplementary_data',
  'available',
  'https://doi.org/10.17605/OSF.IO/D8B2Q',
  'LA-ICP-MS Depth Profile Raw Data (10 files)',
  'Raw LA-ICP-MS depth profiling data used to generate zonation profiles in Tables S4 and S9. Text files containing depth vs. U, Th, Sm measurements for individual zircon grains. Files: row2-5, row3-4, row4-2, row4-5, row5-7, row6-3, row6-4, row6-6, row6-7, row7-4 (total 650 KB)',
  true,
  '/build-data/learning/thermo-papers/Peak(2021)-Grand-Canyon-Great-Unconformity-Geology/supplemental/DepthProfiles_DataFiles/'
)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Summary of supplementary files
SELECT
  category,
  upload_status,
  COUNT(*) as file_count,
  SUM(CASE WHEN is_folder THEN 1 ELSE 0 END) as folder_count
FROM data_files
WHERE dataset_id = (SELECT id FROM datasets WHERE dataset_name = 'Peak et al. (2021)')
AND category LIKE 'supplementary%'
GROUP BY category, upload_status
ORDER BY category, upload_status;

-- Detailed list
SELECT
  file_type,
  display_name,
  upload_status,
  CASE WHEN is_folder THEN '📁 Folder' ELSE '📄 File' END as type_icon,
  CASE
    WHEN LENGTH(description) > 80 THEN SUBSTRING(description, 1, 77) || '...'
    ELSE description
  END as description_short
FROM data_files
WHERE dataset_id = (SELECT id FROM datasets WHERE dataset_name = 'Peak et al. (2021)')
AND category LIKE 'supplementary%'
ORDER BY
  CASE category
    WHEN 'supplementary_data' THEN 1
    WHEN 'supplementary_text' THEN 2
    WHEN 'supplementary_figures' THEN 3
    ELSE 4
  END,
  file_type,
  display_name;
