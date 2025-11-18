-- Populate supplementary files for Malawi Rift Footwall Exhumation dataset
-- Source: https://doi.org/10.58024/AGUM6A344358 (AusGeochem platform)
-- Generated: 2025-11-18

-- Dataset ID for Malawi Rift
-- (Will use subquery to get ID dynamically)

-- ============================================================================
-- SUPPLEMENTARY DATA FILES (Excel - Uploadable)
-- ============================================================================

-- Fission Track data
INSERT INTO data_files (dataset_id, file_name, file_path, file_type, category, upload_status, source_url, display_name, description)
VALUES (
  (SELECT id FROM datasets WHERE dataset_name = 'Malawi Rift Footwall Exhumation'),
  'Fission Track.xlsx',
  '/build-data/learning/thermo-papers/Malawi-Rift-Footwall-Exhumation/Supplementary/Fission Track/Fission Track.xlsx',
  'Excel',
  'supplementary_data',
  'available',
  'https://doi.org/10.58024/AGUM6A344358',
  'Fission Track Supplementary Data',
  'Complete AFT analytical data including single-grain ages, count data, and track length measurements (212 KB)'
)
ON CONFLICT DO NOTHING;

-- Helium data
INSERT INTO data_files (dataset_id, file_name, file_path, file_type, category, upload_status, source_url, display_name, description)
VALUES (
  (SELECT id FROM datasets WHERE dataset_name = 'Malawi Rift Footwall Exhumation'),
  'Helium.xlsx',
  '/build-data/learning/thermo-papers/Malawi-Rift-Footwall-Exhumation/Supplementary/Helium/Helium.xlsx',
  'Excel',
  'supplementary_data',
  'available',
  'https://doi.org/10.58024/AGUM6A344358',
  '(U-Th)/He Supplementary Data',
  'Complete (U-Th)/He single-grain analytical data with Ft corrections and thermal constraints (28 KB)'
)
ON CONFLICT DO NOTHING;

-- Geochemistry data
INSERT INTO data_files (dataset_id, file_name, file_path, file_type, category, upload_status, source_url, display_name, description)
VALUES (
  (SELECT id FROM datasets WHERE dataset_name = 'Malawi Rift Footwall Exhumation'),
  'Geochem.xlsx',
  '/build-data/learning/thermo-papers/Malawi-Rift-Footwall-Exhumation/Supplementary/Geochem/Geochem.xlsx',
  'Excel',
  'supplementary_data',
  'available',
  'https://doi.org/10.58024/AGUM6A344358',
  'Geochemistry Supplementary Data',
  'LA-ICP-MS trace element geochemistry data for apatite grains (88 KB)'
)
ON CONFLICT DO NOTHING;

-- Samples data
INSERT INTO data_files (dataset_id, file_name, file_path, file_type, category, upload_status, source_url, display_name, description)
VALUES (
  (SELECT id FROM datasets WHERE dataset_name = 'Malawi Rift Footwall Exhumation'),
  'Samples.xlsx',
  '/build-data/learning/thermo-papers/Malawi-Rift-Footwall-Exhumation/Supplementary/Samples/Samples.xlsx',
  'Excel',
  'supplementary_data',
  'available',
  'https://doi.org/10.58024/AGUM6A344358',
  'Samples Metadata',
  'Sample location, lithology, and collection metadata (8 KB)'
)
ON CONFLICT DO NOTHING;

-- Thermal History data
INSERT INTO data_files (dataset_id, file_name, file_path, file_type, category, upload_status, source_url, display_name, description)
VALUES (
  (SELECT id FROM datasets WHERE dataset_name = 'Malawi Rift Footwall Exhumation'),
  'Thermal History.xlsx',
  '/build-data/learning/thermo-papers/Malawi-Rift-Footwall-Exhumation/Supplementary/Thermal History/Thermal History.xlsx',
  'Excel',
  'supplementary_data',
  'available',
  'https://doi.org/10.58024/AGUM6A344358',
  'Thermal History Modeling Results',
  'HeFTy thermal history modeling results and constraints (20 KB)'
)
ON CONFLICT DO NOTHING;

-- SEM Geochemistry raw data
INSERT INTO data_files (dataset_id, file_name, file_path, file_type, category, upload_status, source_url, display_name, description)
VALUES (
  (SELECT id FROM datasets WHERE dataset_name = 'Malawi Rift Footwall Exhumation'),
  'Usisya_SEM_wocolor.xlsx',
  '/build-data/learning/thermo-papers/Malawi-Rift-Footwall-Exhumation/Supplementary/Files/SEM Geochem Raw Data/Usisya_SEM_wocolor.xlsx',
  'Excel',
  'supplementary_data',
  'available',
  'https://doi.org/10.58024/AGUM6A344358',
  'SEM Geochemistry Raw Data',
  'Scanning Electron Microscope geochemistry raw measurements (564 KB)'
)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- SINGLE GRAIN AGE FILES (35 Excel files - folder reference)
-- ============================================================================

-- Instead of inserting 35 individual files, track the folder
INSERT INTO data_files (dataset_id, file_name, file_path, file_type, category, upload_status, source_url, display_name, description, is_folder, folder_path)
VALUES (
  (SELECT id FROM datasets WHERE dataset_name = 'Malawi Rift Footwall Exhumation'),
  'Single Grain Age Files',
  '/build-data/learning/thermo-papers/Malawi-Rift-Footwall-Exhumation/Supplementary/Files/Single Grain Age Files (Excel)/',
  'Excel',
  'supplementary_data',
  'available',
  'https://doi.org/10.58024/AGUM6A344358',
  'Single Grain Age Files (35 samples)',
  'Individual sample-by-sample Excel files containing grain-by-grain AFT analytical results (MU19-05 through MU19-54, total 1.3 MB)',
  true,
  '/build-data/learning/thermo-papers/Malawi-Rift-Footwall-Exhumation/Supplementary/Files/Single Grain Age Files (Excel)/'
)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- SHAPEFILES (Geospatial data - reference only, not uploadable to database)
-- ============================================================================

-- Fission Track shapefile
INSERT INTO data_files (dataset_id, file_name, file_path, file_type, category, upload_status, source_url, display_name, description, is_folder, folder_path, upload_notes)
VALUES (
  (SELECT id FROM datasets WHERE dataset_name = 'Malawi Rift Footwall Exhumation'),
  'Fission Track Shapefile',
  '/build-data/learning/thermo-papers/Malawi-Rift-Footwall-Exhumation/Supplementary/Fission Track/shapefile/',
  'Shapefile',
  'supplementary_geospatial',
  'external_only',
  'https://doi.org/10.58024/AGUM6A344358',
  'Fission Track Geospatial Data',
  'GIS shapefile with AFT sample locations and results (5 files: .shp, .shx, .dbf, .prj, .fix)',
  true,
  '/build-data/learning/thermo-papers/Malawi-Rift-Footwall-Exhumation/Supplementary/Fission Track/shapefile/',
  'Geospatial format - available for download from AusGeochem but not imported to database'
)
ON CONFLICT DO NOTHING;

-- Helium shapefile
INSERT INTO data_files (dataset_id, file_name, file_path, file_type, category, upload_status, source_url, display_name, description, is_folder, folder_path, upload_notes)
VALUES (
  (SELECT id FROM datasets WHERE dataset_name = 'Malawi Rift Footwall Exhumation'),
  'Helium Shapefile',
  '/build-data/learning/thermo-papers/Malawi-Rift-Footwall-Exhumation/Supplementary/Helium/shapefile/',
  'Shapefile',
  'supplementary_geospatial',
  'external_only',
  'https://doi.org/10.58024/AGUM6A344358',
  '(U-Th)/He Geospatial Data',
  'GIS shapefile with (U-Th)/He sample locations and results (5 files: .shp, .shx, .dbf, .prj, .fix)',
  true,
  '/build-data/learning/thermo-papers/Malawi-Rift-Footwall-Exhumation/Supplementary/Helium/shapefile/',
  'Geospatial format - available for download from AusGeochem but not imported to database'
)
ON CONFLICT DO NOTHING;

-- Geochem shapefile
INSERT INTO data_files (dataset_id, file_name, file_path, file_type, category, upload_status, source_url, display_name, description, is_folder, folder_path, upload_notes)
VALUES (
  (SELECT id FROM datasets WHERE dataset_name = 'Malawi Rift Footwall Exhumation'),
  'Geochem Shapefile',
  '/build-data/learning/thermo-papers/Malawi-Rift-Footwall-Exhumation/Supplementary/Geochem/shapefile/',
  'Shapefile',
  'supplementary_geospatial',
  'external_only',
  'https://doi.org/10.58024/AGUM6A344358',
  'Geochemistry Geospatial Data',
  'GIS shapefile with geochemistry sample locations (5 files: .shp, .shx, .dbf, .prj, .fix)',
  true,
  '/build-data/learning/thermo-papers/Malawi-Rift-Footwall-Exhumation/Supplementary/Geochem/shapefile/',
  'Geospatial format - available for download from AusGeochem but not imported to database'
)
ON CONFLICT DO NOTHING;

-- Samples shapefile
INSERT INTO data_files (dataset_id, file_name, file_path, file_type, category, upload_status, source_url, display_name, description, is_folder, folder_path, upload_notes)
VALUES (
  (SELECT id FROM datasets WHERE dataset_name = 'Malawi Rift Footwall Exhumation'),
  'Samples Shapefile',
  '/build-data/learning/thermo-papers/Malawi-Rift-Footwall-Exhumation/Supplementary/Samples/shapefile/',
  'Shapefile',
  'supplementary_geospatial',
  'external_only',
  'https://doi.org/10.58024/AGUM6A344358',
  'Sample Locations Geospatial Data',
  'GIS shapefile with all sample locations (5 files: .shp, .shx, .dbf, .prj, .fix)',
  true,
  '/build-data/learning/thermo-papers/Malawi-Rift-Footwall-Exhumation/Supplementary/Samples/shapefile/',
  'Geospatial format - available for download from AusGeochem but not imported to database'
)
ON CONFLICT DO NOTHING;

-- Thermal History shapefile
INSERT INTO data_files (dataset_id, file_name, file_path, file_type, category, upload_status, source_url, display_name, description, is_folder, folder_path, upload_notes)
VALUES (
  (SELECT id FROM datasets WHERE dataset_name = 'Malawi Rift Footwall Exhumation'),
  'Thermal History Shapefile',
  '/build-data/learning/thermo-papers/Malawi-Rift-Footwall-Exhumation/Supplementary/Thermal History/shapefile/',
  'Shapefile',
  'supplementary_geospatial',
  'external_only',
  'https://doi.org/10.58024/AGUM6A344358',
  'Thermal History Geospatial Data',
  'GIS shapefile with thermal history modeling results (5 files: .shp, .shx, .dbf, .prj, .fix)',
  true,
  '/build-data/learning/thermo-papers/Malawi-Rift-Footwall-Exhumation/Supplementary/Thermal History/shapefile/',
  'Geospatial format - available for download from AusGeochem but not imported to database'
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
WHERE dataset_id = (SELECT id FROM datasets WHERE dataset_name = 'Malawi Rift Footwall Exhumation')
AND category LIKE 'supplementary%'
GROUP BY category, upload_status
ORDER BY category, upload_status;

-- Detailed list
SELECT
  file_type,
  display_name,
  upload_status,
  CASE WHEN is_folder THEN '📁 Folder' ELSE '📄 File' END as type_icon,
  description
FROM data_files
WHERE dataset_id = (SELECT id FROM datasets WHERE dataset_name = 'Malawi Rift Footwall Exhumation')
AND category LIKE 'supplementary%'
ORDER BY upload_status, category, file_type, display_name;
