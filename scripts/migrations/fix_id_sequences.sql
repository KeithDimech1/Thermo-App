-- Fix missing ID sequences for all tables
-- This allows INSERTs without specifying IDs

-- Categories
CREATE SEQUENCE IF NOT EXISTS categories_id_seq;
SELECT setval('categories_id_seq', COALESCE((SELECT MAX(id) FROM categories), 0) + 1, false);
ALTER TABLE categories ALTER COLUMN id SET DEFAULT nextval('categories_id_seq');

-- Pathogens
CREATE SEQUENCE IF NOT EXISTS pathogens_id_seq;
SELECT setval('pathogens_id_seq', COALESCE((SELECT MAX(id) FROM pathogens), 0) + 1, false);
ALTER TABLE pathogens ALTER COLUMN id SET DEFAULT nextval('pathogens_id_seq');

-- Markers
CREATE SEQUENCE IF NOT EXISTS markers_id_seq;
SELECT setval('markers_id_seq', COALESCE((SELECT MAX(id) FROM markers), 0) + 1, false);
ALTER TABLE markers ALTER COLUMN id SET DEFAULT nextval('markers_id_seq');

-- Manufacturers
CREATE SEQUENCE IF NOT EXISTS manufacturers_id_seq;
SELECT setval('manufacturers_id_seq', COALESCE((SELECT MAX(id) FROM manufacturers), 0) + 1, false);
ALTER TABLE manufacturers ALTER COLUMN id SET DEFAULT nextval('manufacturers_id_seq');

-- Assays
CREATE SEQUENCE IF NOT EXISTS assays_id_seq;
SELECT setval('assays_id_seq', COALESCE((SELECT MAX(id) FROM assays), 0) + 1, false);
ALTER TABLE assays ALTER COLUMN id SET DEFAULT nextval('assays_id_seq');

-- QC Samples
CREATE SEQUENCE IF NOT EXISTS qc_samples_id_seq;
SELECT setval('qc_samples_id_seq', COALESCE((SELECT MAX(id) FROM qc_samples), 0) + 1, false);
ALTER TABLE qc_samples ALTER COLUMN id SET DEFAULT nextval('qc_samples_id_seq');

-- Test Configurations
CREATE SEQUENCE IF NOT EXISTS test_configurations_id_seq;
SELECT setval('test_configurations_id_seq', COALESCE((SELECT MAX(id) FROM test_configurations), 0) + 1, false);
ALTER TABLE test_configurations ALTER COLUMN id SET DEFAULT nextval('test_configurations_id_seq');

-- CV Measurements
CREATE SEQUENCE IF NOT EXISTS cv_measurements_id_seq;
SELECT setval('cv_measurements_id_seq', COALESCE((SELECT MAX(id) FROM cv_measurements), 0) + 1, false);
ALTER TABLE cv_measurements ALTER COLUMN id SET DEFAULT nextval('cv_measurements_id_seq');

SELECT 'Sequences created and defaults set' AS status;
