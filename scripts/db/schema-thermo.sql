-- =============================================================================
-- Thermochronology Database Schema - PostgreSQL/Neon
-- =============================================================================
-- Version: 1.0.0
-- Created: 2025-11-16
-- Compatible with: PostgreSQL 14+, Neon Serverless Postgres
-- Data Standard: Kohn et al. (2024) FAIR reporting guidelines (GSA Bulletin)
-- =============================================================================

-- Drop existing tables (for clean reinstall)
DROP TABLE IF EXISTS ahe_grain_data CASCADE;
DROP TABLE IF EXISTS ft_track_lengths CASCADE;
DROP TABLE IF EXISTS ft_ages CASCADE;
DROP TABLE IF EXISTS ft_counts CASCADE;
DROP TABLE IF EXISTS samples CASCADE;
DROP TABLE IF EXISTS datasets CASCADE;

-- Drop existing views
DROP VIEW IF EXISTS vw_sample_summary CASCADE;
DROP VIEW IF EXISTS vw_aft_complete CASCADE;

-- Enable extensions (if needed)
CREATE EXTENSION IF NOT EXISTS pg_trgm; -- For fuzzy text search

-- =============================================================================
-- 1. DATASETS TABLE
-- =============================================================================
CREATE TABLE datasets (
  id SERIAL PRIMARY KEY,
  dataset_name VARCHAR(200) NOT NULL,
  description TEXT,
  publication_reference TEXT,
  doi VARCHAR(100),
  study_area VARCHAR(200),
  analyst VARCHAR(100),
  laboratory VARCHAR(200),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE datasets IS 'Dataset-level metadata for data organization';

-- Insert default dataset
INSERT INTO datasets (id, dataset_name, description, study_area, analyst, laboratory)
VALUES (1, 'Malawi Rift Thermochronology', 'Central Basin - Usisya Border Fault', 'Malawi Rift Central Basin', 'M_McMillan', 'University of Melbourne');

-- =============================================================================
-- 2. SAMPLES TABLE (FAIR Table 4: Geosample Metadata)
-- =============================================================================
CREATE TABLE samples (
  sample_id VARCHAR(50) PRIMARY KEY,
  dataset_id INTEGER REFERENCES datasets(id) DEFAULT 1,

  -- Sample identification
  igsn VARCHAR(20) UNIQUE,

  -- Geographic location
  latitude DECIMAL(10, 7),
  longitude DECIMAL(10, 7),
  elevation_m DECIMAL(8, 2),
  geodetic_datum VARCHAR(20) DEFAULT 'WGS84',
  vertical_datum VARCHAR(50) DEFAULT 'mean sea level',
  lat_long_precision_m INTEGER,

  -- Sample characteristics
  lithology VARCHAR(100),
  mineral_type VARCHAR(50),
  sample_kind VARCHAR(100),
  sample_method VARCHAR(100),
  sample_depth_m DECIMAL(8, 2),
  sampling_location_information TEXT,

  -- Stratigraphic context
  stratigraphic_unit VARCHAR(200),
  chronostratigraphic_unit_age VARCHAR(100),
  sample_age_ma DECIMAL(10, 2),

  -- Provenance
  sample_collector VARCHAR(200),
  collection_date DATE,
  analyst VARCHAR(100),
  analysis_method VARCHAR(100),
  last_known_sample_archive VARCHAR(200),
  associated_references TEXT,

  -- Data availability
  n_aft_grains INTEGER,
  n_ahe_grains INTEGER,

  -- Metadata
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_samples_dataset ON samples(dataset_id);
CREATE INDEX idx_samples_location ON samples(latitude, longitude);
CREATE INDEX idx_samples_mineral ON samples(mineral_type);
CREATE INDEX idx_samples_igsn ON samples(igsn) WHERE igsn IS NOT NULL;

COMMENT ON TABLE samples IS 'Geological sample metadata (FAIR Table 4)';
COMMENT ON COLUMN samples.igsn IS 'International Geo Sample Number - global unique identifier';
COMMENT ON COLUMN samples.n_aft_grains IS 'Number of grains with AFT data';
COMMENT ON COLUMN samples.n_ahe_grains IS 'Number of grains with (U-Th)/He data';

-- =============================================================================
-- 3. FT_COUNTS TABLE (FAIR Table 5: Fission-Track Counts)
-- =============================================================================
CREATE TABLE ft_counts (
  id SERIAL PRIMARY KEY,
  sample_id VARCHAR(50) NOT NULL REFERENCES samples(sample_id) ON DELETE CASCADE,
  grain_id VARCHAR(100) NOT NULL UNIQUE,

  -- Count data (LA-ICP-MS method)
  Ns INTEGER,
  rho_s_cm2 DECIMAL(12, 2),

  -- Chemistry (LA-ICP-MS specific)
  U_ppm DECIMAL(10, 3),
  U_1sigma DECIMAL(10, 3),
  Th_ppm DECIMAL(10, 3),
  Th_1sigma DECIMAL(10, 3),
  eU_ppm DECIMAL(10, 3),
  eU_1sigma DECIMAL(10, 3),

  -- Kinetic parameters
  Dpar_um DECIMAL(6, 3),
  Dpar_sd_um DECIMAL(6, 3),
  Dper_um DECIMAL(6, 3),
  Dper_sd_um DECIMAL(6, 3),
  Cl_wt_pct DECIMAL(6, 4),
  eCl_apfu DECIMAL(8, 4),
  rmr0 DECIMAL(6, 4),
  rmr0D DECIMAL(6, 4),

  -- Statistical measures
  P_chi2_pct DECIMAL(6, 3),
  Disp_pct DECIMAL(6, 3),
  n_grains INTEGER,

  -- Analytical method
  ft_counting_method VARCHAR(50),
  ft_software VARCHAR(100),
  ft_algorithm VARCHAR(50),
  microscope VARCHAR(100),
  objective VARCHAR(50),
  analyst VARCHAR(100),
  laboratory VARCHAR(100),
  analysis_date DATE,
  sample_mount_id VARCHAR(50),
  etching_conditions VARCHAR(200),
  counting_area_cm2 DECIMAL(10, 6),

  -- EDM-specific (NULL for LA-ICP-MS)
  Ni INTEGER,
  Nd INTEGER,
  rho_i_cm2 DECIMAL(12, 2),
  rho_d_cm2 DECIMAL(12, 2),
  dosimeter VARCHAR(50),

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_ft_counts_sample ON ft_counts(sample_id);
CREATE INDEX idx_ft_counts_grain ON ft_counts(grain_id);
CREATE INDEX idx_ft_counts_dispersion ON ft_counts(Disp_pct);

COMMENT ON TABLE ft_counts IS 'Fission-track count data (FAIR Table 5)';
COMMENT ON COLUMN ft_counts.grain_id IS 'Grain identifier (sample_id_aggregate for sample-level data)';

-- =============================================================================
-- 4. FT_TRACK_LENGTHS TABLE (FAIR Table 6: Track Lengths)
-- =============================================================================
CREATE TABLE ft_track_lengths (
  id SERIAL PRIMARY KEY,
  sample_id VARCHAR(50) NOT NULL REFERENCES samples(sample_id) ON DELETE CASCADE,
  grain_id VARCHAR(100) NOT NULL,

  -- Summary statistics
  n_confined_tracks INTEGER,
  mean_track_length_um DECIMAL(6, 3),
  mean_track_length_se_um DECIMAL(6, 3),
  mean_track_length_sd_um DECIMAL(6, 3),

  -- Kinetic parameters
  Dpar_um DECIMAL(6, 3),
  Dpar_sd_um DECIMAL(6, 3),
  Dper_um DECIMAL(6, 3),
  Dper_sd_um DECIMAL(6, 3),

  -- Individual track data (if available)
  apparent_length_um DECIMAL(6, 3),
  true_length_um DECIMAL(6, 3),
  angle_to_c_axis_deg DECIMAL(6, 2),
  azimuth_deg DECIMAL(6, 2),
  dip_deg DECIMAL(6, 2),
  corrected_z_depth_um DECIMAL(8, 2),

  -- Analytical method
  ft_length_method VARCHAR(50),
  ft_software VARCHAR(100),
  ft_track_type VARCHAR(20),
  microscope VARCHAR(100),
  objective VARCHAR(50),
  analyst VARCHAR(100),
  laboratory VARCHAR(100),
  analysis_date DATE,
  sample_mount_id VARCHAR(50),
  etching_conditions VARCHAR(200),
  cf252_irradiation BOOLEAN DEFAULT FALSE,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT check_track_type CHECK (ft_track_type IN ('TINT', 'TINCLE', NULL))
);

CREATE INDEX idx_ft_lengths_sample ON ft_track_lengths(sample_id);
CREATE INDEX idx_ft_lengths_grain ON ft_track_lengths(grain_id);
CREATE INDEX idx_ft_lengths_mtl ON ft_track_lengths(mean_track_length_um);

COMMENT ON TABLE ft_track_lengths IS 'Fission-track length measurements (FAIR Table 6)';
COMMENT ON COLUMN ft_track_lengths.ft_track_type IS 'Track type: TINT (track-in-track) or TINCLE (track-in-cleavage)';

-- =============================================================================
-- 5. FT_AGES TABLE (FAIR Table 10: Fission-Track Ages)
-- =============================================================================
CREATE TABLE ft_ages (
  id SERIAL PRIMARY KEY,
  sample_id VARCHAR(50) NOT NULL UNIQUE REFERENCES samples(sample_id) ON DELETE CASCADE,

  -- Age equation and calibration
  age_equation VARCHAR(100),
  ft_age_type VARCHAR(50),

  -- Calibration constants
  lambda_D VARCHAR(20),
  lambda_f VARCHAR(20),
  zeta_yr_cm2 DECIMAL(12, 6),
  zeta_error_yr_cm2 DECIMAL(12, 6),

  -- EDM-specific calibration (NULL for LA-ICP-MS)
  dosimeter VARCHAR(50),
  Rs_um DECIMAL(8, 3),
  q DECIMAL(6, 4),
  irradiation_reactor VARCHAR(100),

  -- Age results
  n_grains INTEGER,
  pooled_age_ma DECIMAL(10, 2),
  pooled_age_error_ma DECIMAL(10, 2),
  central_age_ma DECIMAL(10, 2),
  central_age_error_ma DECIMAL(10, 2),

  -- Statistical measures
  dispersion_pct DECIMAL(6, 3),
  P_chi2 DECIMAL(8, 6),

  -- Mixture modeling (if applicable)
  age_peak_software VARCHAR(100),
  best_fit_peak_ages_ma DECIMAL(10, 2)[],
  best_fit_peak_errors_ma DECIMAL(10, 2)[],
  best_fit_peak_grain_pct DECIMAL(6, 2)[],

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT check_age_type CHECK (ft_age_type IN ('pooled', 'central', 'mixed', NULL))
);

CREATE INDEX idx_ft_ages_sample ON ft_ages(sample_id);
CREATE INDEX idx_ft_ages_central ON ft_ages(central_age_ma);
CREATE INDEX idx_ft_ages_dispersion ON ft_ages(dispersion_pct);

COMMENT ON TABLE ft_ages IS 'Fission-track age results (FAIR Table 10)';
COMMENT ON COLUMN ft_ages.ft_age_type IS 'Age calculation method: pooled, central, or mixed (mixture modeling)';

-- =============================================================================
-- 6. AHE_GRAIN_DATA TABLE ((U-Th)/He Grain-Level Results)
-- =============================================================================
CREATE TABLE ahe_grain_data (
  id SERIAL PRIMARY KEY,
  sample_id VARCHAR(50) NOT NULL REFERENCES samples(sample_id) ON DELETE CASCADE,
  lab_no VARCHAR(50) UNIQUE,

  -- Grain dimensions
  length_um DECIMAL(10, 2),
  half_width_um DECIMAL(10, 2),
  Rs_um DECIMAL(10, 2),
  mass_mg DECIMAL(10, 6),
  terminations VARCHAR(10),

  -- Chemistry
  U_ppm DECIMAL(10, 3),
  Th_ppm DECIMAL(10, 3),
  Sm_ppm DECIMAL(10, 3),
  eU_ppm DECIMAL(10, 3),
  He_ncc DECIMAL(12, 6),

  -- Ages
  uncorr_age_ma DECIMAL(10, 2),
  corr_age_ma DECIMAL(10, 2),
  corr_age_1sigma_ma DECIMAL(10, 2),
  FT DECIMAL(6, 4),

  -- Analytical method
  std_run VARCHAR(10),
  thermal_model VARCHAR(10),

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_ahe_sample ON ahe_grain_data(sample_id);
CREATE INDEX idx_ahe_lab_no ON ahe_grain_data(lab_no);
CREATE INDEX idx_ahe_age ON ahe_grain_data(corr_age_ma);

COMMENT ON TABLE ahe_grain_data IS '(U-Th)/He grain-level results';
COMMENT ON COLUMN ahe_grain_data.FT IS 'Alpha ejection correction factor (Ft)';
COMMENT ON COLUMN ahe_grain_data.eU_ppm IS 'Effective uranium (U + 0.235*Th)';
COMMENT ON COLUMN ahe_grain_data.terminations IS 'Grain termination count (e.g., 0T, 1T, 2T)';

-- =============================================================================
-- TRIGGERS
-- =============================================================================

-- Update updated_at timestamp on samples
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_samples_updated_at
BEFORE UPDATE ON samples
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- VIEWS
-- =============================================================================

-- Complete sample summary with AFT and AHe data
CREATE OR REPLACE VIEW vw_sample_summary AS
SELECT
  s.sample_id,
  s.igsn,
  s.latitude,
  s.longitude,
  s.elevation_m,
  s.lithology,
  s.mineral_type,
  s.sampling_location_information,
  s.analyst,
  s.analysis_method,
  s.n_aft_grains,
  s.n_ahe_grains,

  -- AFT age data
  fa.central_age_ma as aft_central_age_ma,
  fa.central_age_error_ma as aft_age_error_ma,
  fa.dispersion_pct as aft_dispersion_pct,
  fa.P_chi2 as aft_P_chi2,

  -- AFT track length data
  ftl.mean_track_length_um as aft_mtl_um,
  ftl.mean_track_length_sd_um as aft_mtl_sd_um,
  ftl.n_confined_tracks as aft_n_tracks,

  -- AHe summary (average of all grains)
  AVG(ahe.corr_age_ma) as ahe_mean_age_ma,
  STDDEV(ahe.corr_age_ma) as ahe_age_sd_ma,
  COUNT(ahe.id) as ahe_n_grains_measured,
  AVG(ahe.eU_ppm) as ahe_mean_eU_ppm,

  d.dataset_name,
  d.study_area

FROM samples s
LEFT JOIN ft_ages fa ON s.sample_id = fa.sample_id
LEFT JOIN ft_track_lengths ftl ON s.sample_id = ftl.sample_id AND ftl.grain_id LIKE '%_aggregate'
LEFT JOIN ahe_grain_data ahe ON s.sample_id = ahe.sample_id
LEFT JOIN datasets d ON s.dataset_id = d.id
GROUP BY s.sample_id, s.igsn, s.latitude, s.longitude, s.elevation_m, s.lithology,
         s.mineral_type, s.sampling_location_information, s.analyst, s.analysis_method,
         s.n_aft_grains, s.n_ahe_grains, fa.central_age_ma, fa.central_age_error_ma,
         fa.dispersion_pct, fa.P_chi2, ftl.mean_track_length_um, ftl.mean_track_length_sd_um,
         ftl.n_confined_tracks, d.dataset_name, d.study_area;

COMMENT ON VIEW vw_sample_summary IS 'Complete sample summary with AFT and AHe data';

-- Complete AFT data (counts + lengths + ages combined)
CREATE OR REPLACE VIEW vw_aft_complete AS
SELECT
  s.sample_id,
  s.sampling_location_information,
  s.latitude,
  s.longitude,
  s.elevation_m,

  -- Ages
  fa.central_age_ma,
  fa.central_age_error_ma,
  fa.pooled_age_ma,
  fa.pooled_age_error_ma,
  fa.dispersion_pct,
  fa.P_chi2,
  fa.n_grains,

  -- Track lengths
  ftl.mean_track_length_um,
  ftl.mean_track_length_sd_um,
  ftl.n_confined_tracks,

  -- Count data
  fc.Ns,
  fc.rho_s_cm2,
  fc.U_ppm,
  fc.eU_ppm,
  fc.Dpar_um,
  fc.Cl_wt_pct,
  fc.rmr0

FROM samples s
LEFT JOIN ft_ages fa ON s.sample_id = fa.sample_id
LEFT JOIN ft_track_lengths ftl ON s.sample_id = ftl.sample_id AND ftl.grain_id LIKE '%_aggregate'
LEFT JOIN ft_counts fc ON s.sample_id = fc.sample_id AND fc.grain_id LIKE '%_aggregate';

COMMENT ON VIEW vw_aft_complete IS 'Complete AFT data combining ages, lengths, and counts';

-- =============================================================================
-- COMPLETION MESSAGE
-- =============================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Thermochronology Schema created successfully!';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Tables: 6';
  RAISE NOTICE '  - datasets (metadata)';
  RAISE NOTICE '  - samples (FAIR Table 4)';
  RAISE NOTICE '  - ft_counts (FAIR Table 5)';
  RAISE NOTICE '  - ft_track_lengths (FAIR Table 6)';
  RAISE NOTICE '  - ft_ages (FAIR Table 10)';
  RAISE NOTICE '  - ahe_grain_data (custom)';
  RAISE NOTICE 'Views: 2';
  RAISE NOTICE 'Triggers: 1';
  RAISE NOTICE '';
  RAISE NOTICE 'Data Standard: Kohn et al. (2024) FAIR';
  RAISE NOTICE 'Next step: Run import-thermo-data.ts';
  RAISE NOTICE '========================================';
END $$;
