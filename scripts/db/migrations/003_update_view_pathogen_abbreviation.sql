-- Migration: Update vw_test_config_details view to include pathogen abbreviation
-- Created: 2025-11-12
-- Purpose: Add pathogen abbreviation to the view for easy access

BEGIN;

-- Drop the existing view first
DROP VIEW IF EXISTS vw_test_config_details CASCADE;

-- Recreate the view with abbreviation
CREATE VIEW vw_test_config_details AS
SELECT
  tc.id as config_id,
  tc.test_type,
  tc.events_examined,
  tc.quality_rating,

  m.id as marker_id,
  m.name as marker_name,
  m.antibody_type,

  p.id as pathogen_id,
  p.name as pathogen_name,
  p.abbreviation as pathogen_abbreviation,

  c.id as category_id,
  c.name as category_name,

  a.id as assay_id,
  a.name as assay_name,
  a.platform,
  a.methodology,

  mfr.id as manufacturer_id,
  mfr.name as manufacturer_name,

  qc.id as qc_sample_id,
  qc.name as qc_sample_name,

  cv.cv_lt_10_count,
  cv.cv_lt_10_percentage,
  cv.cv_10_15_count,
  cv.cv_10_15_percentage,
  cv.cv_15_20_count,
  cv.cv_15_20_percentage,
  cv.cv_gt_20_count,
  cv.cv_gt_20_percentage,
  cv.mean_cv

FROM test_configurations tc
JOIN markers m ON tc.marker_id = m.id
LEFT JOIN pathogens p ON m.pathogen_id = p.id
LEFT JOIN categories c ON m.category_id = c.id
JOIN assays a ON tc.assay_id = a.id
LEFT JOIN manufacturers mfr ON a.manufacturer_id = mfr.id
JOIN qc_samples qc ON tc.qc_sample_id = qc.id
LEFT JOIN cv_measurements cv ON tc.id = cv.test_config_id;

COMMENT ON VIEW vw_test_config_details IS 'Complete test configuration details with all joins - includes pathogen abbreviation';

COMMIT;
