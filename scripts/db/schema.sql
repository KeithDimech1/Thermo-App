-- =============================================================================
-- QC Results Database Schema - PostgreSQL/Neon
-- =============================================================================
-- Version: 1.0.0
-- Created: 2025-11-11
-- Compatible with: PostgreSQL 14+, Neon Serverless Postgres
-- =============================================================================

-- Drop existing tables (for clean reinstall)
DROP TABLE IF EXISTS cv_measurements CASCADE;
DROP TABLE IF EXISTS test_configurations CASCADE;
DROP TABLE IF EXISTS qc_samples CASCADE;
DROP TABLE IF EXISTS assays CASCADE;
DROP TABLE IF EXISTS manufacturers CASCADE;
DROP TABLE IF EXISTS markers CASCADE;
DROP TABLE IF EXISTS pathogens CASCADE;
DROP TABLE IF EXISTS categories CASCADE;

-- Drop existing views
DROP VIEW IF EXISTS vw_test_config_details CASCADE;
DROP VIEW IF EXISTS vw_manufacturer_performance CASCADE;

-- Drop existing functions
DROP FUNCTION IF EXISTS update_updated_at_column CASCADE;

-- Enable extensions (if needed)
CREATE EXTENSION IF NOT EXISTS pg_trgm; -- For fuzzy text search

-- =============================================================================
-- 1. CATEGORIES TABLE
-- =============================================================================
CREATE TABLE categories (
  id INTEGER PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE categories IS 'Disease category groupings (TORCH, Hepatitis, etc.)';
COMMENT ON COLUMN categories.name IS 'Category name (e.g., TORCH, Hepatitis, Retrovirus)';

-- =============================================================================
-- 2. PATHOGENS TABLE
-- =============================================================================
CREATE TABLE pathogens (
  id INTEGER PRIMARY KEY,
  name VARCHAR(200) NOT NULL UNIQUE,
  abbreviation VARCHAR(20),
  category_id INTEGER REFERENCES categories(id),
  scientific_name VARCHAR(200),
  transmission_route VARCHAR(100),
  clinical_significance TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_pathogens_category ON pathogens(category_id);
CREATE UNIQUE INDEX idx_pathogens_abbreviation ON pathogens(abbreviation) WHERE abbreviation IS NOT NULL;
CREATE INDEX idx_pathogens_abbreviation_lookup ON pathogens(abbreviation);

COMMENT ON TABLE pathogens IS 'Infectious organisms being tested';
COMMENT ON COLUMN pathogens.name IS 'Common name (e.g., Cytomegalovirus (CMV))';
COMMENT ON COLUMN pathogens.abbreviation IS 'Standard abbreviation (e.g., CMV, HIV, HCV)';
COMMENT ON COLUMN pathogens.scientific_name IS 'Taxonomic/scientific name';

-- =============================================================================
-- 3. MARKERS TABLE
-- =============================================================================
CREATE TABLE markers (
  id INTEGER PRIMARY KEY,
  name VARCHAR(200) NOT NULL UNIQUE,
  pathogen_id INTEGER REFERENCES pathogens(id),
  category_id INTEGER REFERENCES categories(id),
  antibody_type VARCHAR(50),
  marker_type VARCHAR(50),
  clinical_use TEXT,
  interpretation_positive TEXT,
  interpretation_negative TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT check_antibody_type CHECK (
    antibody_type IN ('IgG', 'IgM', 'Antigen', 'Antibody (Total)', 'Other', NULL)
  ),
  CONSTRAINT check_marker_type CHECK (
    marker_type IN ('Antibody', 'Antigen', 'Nucleic Acid', NULL)
  )
);

CREATE INDEX idx_markers_pathogen ON markers(pathogen_id);
CREATE INDEX idx_markers_category ON markers(category_id);
CREATE INDEX idx_markers_name_trgm ON markers USING gin(name gin_trgm_ops);

COMMENT ON TABLE markers IS 'Test markers (antibodies, antigens, nucleic acids)';
COMMENT ON COLUMN markers.antibody_type IS 'IgG, IgM, Antigen, etc.';

-- =============================================================================
-- 4. MANUFACTURERS TABLE
-- =============================================================================
CREATE TABLE manufacturers (
  id INTEGER PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  country VARCHAR(100),
  website VARCHAR(200),
  total_assays INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE manufacturers IS 'Test equipment manufacturers';

-- =============================================================================
-- 5. ASSAYS TABLE
-- =============================================================================
CREATE TABLE assays (
  id INTEGER PRIMARY KEY,
  name VARCHAR(300) NOT NULL UNIQUE,
  manufacturer_id INTEGER REFERENCES manufacturers(id),
  platform VARCHAR(100),
  methodology VARCHAR(50),
  automation_level VARCHAR(50),
  throughput VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT check_methodology CHECK (
    methodology IN ('CLIA', 'ELISA', 'PCR', 'ECLIA', 'CMIA', NULL)
  ),
  CONSTRAINT check_automation CHECK (
    automation_level IN ('Fully Automated', 'Semi-Automated', 'Manual', NULL)
  )
);

CREATE INDEX idx_assays_manufacturer ON assays(manufacturer_id);
CREATE INDEX idx_assays_name_trgm ON assays USING gin(name gin_trgm_ops);

COMMENT ON TABLE assays IS 'Assay platforms/test systems';
COMMENT ON COLUMN assays.methodology IS 'CLIA, ELISA, PCR, etc.';

-- =============================================================================
-- 6. QC_SAMPLES TABLE
-- =============================================================================
CREATE TABLE qc_samples (
  id INTEGER PRIMARY KEY,
  name VARCHAR(200) NOT NULL UNIQUE,
  manufacturer VARCHAR(100),
  product_code VARCHAR(50),
  matrix_type VARCHAR(100),
  lot_number VARCHAR(50),
  expiration_date DATE,
  target_markers TEXT[],
  concentration_level VARCHAR(50),
  certifications TEXT[],
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT check_matrix_type CHECK (
    matrix_type IN ('human plasma', 'human serum', 'synthetic', NULL)
  )
);

COMMENT ON TABLE qc_samples IS 'Quality control sample products';
COMMENT ON COLUMN qc_samples.matrix_type IS 'Sample composition (human plasma, serum, synthetic)';

-- =============================================================================
-- 6A. ASSAY_LOTS TABLE (Added 2025-11-12)
-- =============================================================================
CREATE TABLE assay_lots (
  id SERIAL PRIMARY KEY,
  assay_id INTEGER NOT NULL REFERENCES assays(id) ON DELETE CASCADE,
  lot_number VARCHAR(50) NOT NULL,
  manufacture_date DATE,
  expiration_date DATE,
  qc_release_date DATE,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  UNIQUE(assay_id, lot_number)
);

CREATE INDEX idx_assay_lots_assay ON assay_lots(assay_id);
CREATE INDEX idx_assay_lots_lot_number ON assay_lots(lot_number);
CREATE INDEX idx_assay_lots_dates ON assay_lots(expiration_date, manufacture_date);

COMMENT ON TABLE assay_lots IS 'Individual reagent lot numbers for assays - enables lot-to-lot variation tracking';
COMMENT ON COLUMN assay_lots.lot_number IS 'Manufacturer lot number (e.g., 93093LI00, 95367LI00)';
COMMENT ON COLUMN assay_lots.qc_release_date IS 'Date lot was released for use based on QC testing';

-- =============================================================================
-- 7. TEST_CONFIGURATIONS TABLE
-- =============================================================================
CREATE TABLE test_configurations (
  id INTEGER PRIMARY KEY,
  marker_id INTEGER NOT NULL REFERENCES markers(id),
  assay_id INTEGER NOT NULL REFERENCES assays(id),
  assay_lot_id INTEGER REFERENCES assay_lots(id),
  qc_sample_id INTEGER NOT NULL REFERENCES qc_samples(id),
  test_type VARCHAR(50) NOT NULL,
  events_examined INTEGER,
  quality_rating VARCHAR(50),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  UNIQUE(marker_id, assay_id, qc_sample_id),

  CONSTRAINT check_test_type CHECK (
    test_type IN ('serology', 'nat', 'both')
  ),
  CONSTRAINT check_quality_rating CHECK (
    quality_rating IN ('excellent', 'good', 'acceptable', 'poor', 'unknown')
  )
);

CREATE INDEX idx_test_configs_marker ON test_configurations(marker_id);
CREATE INDEX idx_test_configs_assay ON test_configurations(assay_id);
CREATE INDEX idx_test_configs_assay_lot ON test_configurations(assay_lot_id);
CREATE INDEX idx_test_configs_qc_sample ON test_configurations(qc_sample_id);
CREATE INDEX idx_test_configs_quality_rating ON test_configurations(quality_rating);
CREATE INDEX idx_test_configs_test_type ON test_configurations(test_type);
CREATE INDEX idx_marker_assay_lookup ON test_configurations(marker_id, assay_id);

COMMENT ON TABLE test_configurations IS 'Unique combinations of marker + assay + QC sample';
COMMENT ON COLUMN test_configurations.quality_rating IS 'Overall performance: excellent, good, acceptable, poor';

-- =============================================================================
-- 8. CV_MEASUREMENTS TABLE
-- =============================================================================
CREATE TABLE cv_measurements (
  id SERIAL PRIMARY KEY,
  test_config_id INTEGER NOT NULL UNIQUE REFERENCES test_configurations(id) ON DELETE CASCADE,

  -- CV <10% (Excellent)
  cv_lt_10_count INTEGER,
  cv_lt_10_percentage DECIMAL(5,2),

  -- CV 10-15% (Good)
  cv_10_15_count INTEGER,
  cv_10_15_percentage DECIMAL(5,2),

  -- CV 15-20% (Acceptable)
  cv_15_20_count INTEGER,
  cv_15_20_percentage DECIMAL(5,2),

  -- CV >20% (Poor)
  cv_gt_20_count INTEGER,
  cv_gt_20_percentage DECIMAL(5,2),

  -- Statistical measures
  mean_cv DECIMAL(5,2),
  median_cv DECIMAL(5,2),
  std_dev_cv DECIMAL(5,2),

  measurement_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT check_percentages CHECK (
    (cv_lt_10_percentage IS NULL OR (cv_lt_10_percentage >= 0 AND cv_lt_10_percentage <= 100)) AND
    (cv_10_15_percentage IS NULL OR (cv_10_15_percentage >= 0 AND cv_10_15_percentage <= 100)) AND
    (cv_15_20_percentage IS NULL OR (cv_15_20_percentage >= 0 AND cv_15_20_percentage <= 100)) AND
    (cv_gt_20_percentage IS NULL OR (cv_gt_20_percentage >= 0 AND cv_gt_20_percentage <= 100))
  )
);

CREATE INDEX idx_cv_measurements_test_config ON cv_measurements(test_config_id);
CREATE INDEX idx_cv_lt_10_pct ON cv_measurements(cv_lt_10_percentage DESC);
CREATE INDEX idx_cv_gt_20_pct ON cv_measurements(cv_gt_20_percentage);

COMMENT ON TABLE cv_measurements IS 'Coefficient of Variation performance data';
COMMENT ON COLUMN cv_measurements.cv_lt_10_percentage IS 'Percentage of events with CV <10% (excellent)';

-- =============================================================================
-- TRIGGERS
-- =============================================================================

-- Update updated_at timestamp on test_configurations
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_test_configs_updated_at
BEFORE UPDATE ON test_configurations
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- VIEWS
-- =============================================================================

-- Complete test configuration view with all details
CREATE OR REPLACE VIEW vw_test_config_details AS
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

COMMENT ON VIEW vw_test_config_details IS 'Complete test configuration details with all joins';

-- Manufacturer performance summary
CREATE OR REPLACE VIEW vw_manufacturer_performance AS
SELECT
  mfr.id,
  mfr.name,
  COUNT(tc.id) as total_configs,
  AVG(cv.cv_lt_10_percentage) as avg_cv_lt_10_pct,
  SUM(CASE WHEN tc.quality_rating = 'excellent' THEN 1 ELSE 0 END) as excellent_count,
  SUM(CASE WHEN tc.quality_rating = 'good' THEN 1 ELSE 0 END) as good_count,
  SUM(CASE WHEN tc.quality_rating = 'acceptable' THEN 1 ELSE 0 END) as acceptable_count,
  SUM(CASE WHEN tc.quality_rating = 'poor' THEN 1 ELSE 0 END) as poor_count
FROM manufacturers mfr
LEFT JOIN assays a ON mfr.id = a.manufacturer_id
LEFT JOIN test_configurations tc ON a.id = tc.assay_id
LEFT JOIN cv_measurements cv ON tc.id = cv.test_config_id
GROUP BY mfr.id, mfr.name;

COMMENT ON VIEW vw_manufacturer_performance IS 'Performance summary by manufacturer';

-- =============================================================================
-- GRANTS (for Neon/production)
-- =============================================================================

-- Grant read access to anon/authenticated roles (if using Supabase/auth)
-- GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon, authenticated;
-- GRANT SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- =============================================================================
-- COMPLETION MESSAGE
-- =============================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Schema created successfully!';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Tables: 8';
  RAISE NOTICE 'Views: 2';
  RAISE NOTICE 'Triggers: 1';
  RAISE NOTICE '';
  RAISE NOTICE 'Next step: Run import-data.ts';
  RAISE NOTICE '========================================';
END $$;
