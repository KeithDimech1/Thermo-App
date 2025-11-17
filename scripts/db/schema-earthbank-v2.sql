-- =============================================================================
-- EarthBank-Compatible Thermochronology Database Schema v2 - PostgreSQL/Neon
-- =============================================================================
-- Version: 2.0.0
-- Created: 2025-11-17
-- Migration: Option A-1 (Clean Slate)
-- Compatible with: PostgreSQL 14+, Neon Serverless Postgres
-- Data Standard: EarthBank import templates (2024-11-11, 2025-04-16)
-- Reference: Nixon et al. (2025), Kohn et al. (2024)
-- =============================================================================
--
-- CRITICAL ARCHITECTURAL CHANGE: DATAPOINT CONCEPT
--
-- Old schema (v1): 1 sample → 1 analysis
-- New schema (v2): 1 sample → many datapoints (analytical sessions)
--
-- This enables:
-- - Multiple analyses of same sample (different labs, methods, dates)
-- - Batch tracking and QC via reference materials
-- - People/ORCID provenance
-- - Granular data storage (individual tracks, grain ages)
-- - Full EarthBank import template compatibility
--
-- =============================================================================

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS pg_trgm; -- For fuzzy text search
CREATE EXTENSION IF NOT EXISTS "uuid-ossp"; -- For UUID generation

-- =============================================================================
-- 1. DATASETS TABLE (Data Packages with Privacy Controls)
-- =============================================================================
CREATE TABLE datasets (
  id SERIAL PRIMARY KEY,
  dataset_name VARCHAR(200) NOT NULL,
  description TEXT,

  -- Publication and citation
  publication_reference TEXT,
  publication_doi VARCHAR(100),

  -- Geographic scope
  study_area VARCHAR(200),

  -- Privacy and access control
  privacy_status VARCHAR(20) DEFAULT 'public', -- public, embargo, private
  embargo_date DATE,
  data_package_doi VARCHAR(100), -- DOI for the data package itself

  -- Metadata
  keywords TEXT, -- Comma-separated
  data_owner VARCHAR(200),
  license VARCHAR(100) DEFAULT 'CC-BY-4.0',

  -- Audit
  submission_date DATE DEFAULT CURRENT_DATE,
  last_modified_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT check_privacy_status CHECK (privacy_status IN ('public', 'embargo', 'private'))
);

CREATE INDEX idx_datasets_privacy ON datasets(privacy_status);
CREATE INDEX idx_datasets_doi ON datasets(data_package_doi) WHERE data_package_doi IS NOT NULL;

COMMENT ON TABLE datasets IS 'Data packages with privacy controls, embargo dates, and DOI assignment';
COMMENT ON COLUMN datasets.privacy_status IS 'Access control: public, embargo (with date), or private';
COMMENT ON COLUMN datasets.embargo_date IS 'Date when embargoed data becomes public';
COMMENT ON COLUMN datasets.data_package_doi IS 'DOI for the data package (different from publication DOI)';

-- =============================================================================
-- 2. PEOPLE TABLE (ORCID Tracking)
-- =============================================================================
CREATE TABLE people (
  id SERIAL PRIMARY KEY,
  orcid VARCHAR(50) UNIQUE, -- ORCID ID (e.g., 0000-0002-1825-0097)
  name VARCHAR(200) NOT NULL,
  email VARCHAR(200),
  affiliation VARCHAR(300),

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT check_orcid_or_name CHECK (orcid IS NOT NULL OR name IS NOT NULL)
);

CREATE INDEX idx_people_orcid ON people(orcid) WHERE orcid IS NOT NULL;
CREATE INDEX idx_people_name ON people(name);

COMMENT ON TABLE people IS 'Individuals involved in sample collection, analysis, or research';
COMMENT ON COLUMN people.orcid IS 'ORCID ID for unique researcher identification (optional)';

-- =============================================================================
-- 3. SAMPLES TABLE (FAIR Table 4: Geosample Metadata)
-- =============================================================================
CREATE TABLE samples (
  sample_id VARCHAR(50) PRIMARY KEY,
  dataset_id INTEGER REFERENCES datasets(id) DEFAULT 1,

  -- Sample identification
  igsn VARCHAR(20) UNIQUE,

  -- Sample classification
  sample_kind VARCHAR(100), -- rock, soil, sediment, mineral, etc.
  sample_collection_method VARCHAR(100), -- grab, core, drilling, cutting, etc.
  sample_kind_additional_info TEXT,

  -- Geographic location
  latitude DECIMAL(10, 7),
  longitude DECIMAL(10, 7),
  geodetic_datum VARCHAR(20) DEFAULT 'WGS84',
  lat_long_precision_m INTEGER,
  lat_long_precision_method VARCHAR(100), -- GPS, map estimate, etc.

  -- Elevation and depth
  elevation_m DECIMAL(8, 2),
  vertical_datum VARCHAR(50) DEFAULT 'mean sea level',
  elevation_accuracy_m DECIMAL(8, 2),
  elevation_additional_info TEXT,
  depth_min_m DECIMAL(10, 2) DEFAULT 0, -- For core/well samples
  depth_max_m DECIMAL(10, 2) DEFAULT 0,
  depth_accuracy_m DECIMAL(6, 2),

  -- Location description
  location_kind VARCHAR(100), -- outcrop, well, dredge, etc.
  location_name VARCHAR(200),
  location_description TEXT,
  sampling_location_information TEXT,

  -- Sample characteristics
  lithology VARCHAR(100),
  mineral_type VARCHAR(50),

  -- Stratigraphic context
  stratigraphic_unit VARCHAR(200),
  chronostratigraphic_unit_age VARCHAR(100),
  chronostrat_age_min_ma DECIMAL(10, 2),
  chronostrat_age_max_ma DECIMAL(10, 2),
  sample_age_ma DECIMAL(10, 2),
  stratigraphic_info TEXT,

  -- Collection provenance
  collection_date_min DATE,
  collection_date_max DATE,
  collection_date_exact DATE, -- Use this if exact date known

  -- Archive and documentation
  last_known_sample_archive VARCHAR(200),
  archive_additional_info TEXT,
  funding_grant_id VARCHAR(100),
  associated_references TEXT,
  keywords TEXT, -- Comma-separated

  -- Data availability (calculated)
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
CREATE INDEX idx_samples_lithology ON samples(lithology);

COMMENT ON TABLE samples IS 'Geological sample metadata (FAIR Table 4 + EarthBank Sample.template)';
COMMENT ON COLUMN samples.igsn IS 'International Geo Sample Number - global unique identifier';
COMMENT ON COLUMN samples.sample_kind IS 'Type of material: rock, soil, sediment, mineral, vein, ore, etc.';
COMMENT ON COLUMN samples.depth_min_m IS 'Minimum depth if collected from below surface (core/well samples)';

-- =============================================================================
-- 4. SAMPLE_PEOPLE_ROLES TABLE (Many-to-Many)
-- =============================================================================
CREATE TABLE sample_people_roles (
  id SERIAL PRIMARY KEY,
  sample_id VARCHAR(50) NOT NULL REFERENCES samples(sample_id) ON DELETE CASCADE,
  person_id INTEGER NOT NULL REFERENCES people(id) ON DELETE CASCADE,
  role VARCHAR(50) NOT NULL, -- collector, chief_investigator, investigator, etc.

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  UNIQUE(sample_id, person_id, role)
);

CREATE INDEX idx_sample_people_sample ON sample_people_roles(sample_id);
CREATE INDEX idx_sample_people_person ON sample_people_roles(person_id);

COMMENT ON TABLE sample_people_roles IS 'Links samples to people with roles (collector, investigator, etc.)';
COMMENT ON COLUMN sample_people_roles.role IS 'collector, chief_investigator, investigator, analyst, lab_technician, co-author, etc.';

-- =============================================================================
-- 5. BATCHES TABLE (Analytical Batches for QC)
-- =============================================================================
CREATE TABLE batches (
  id SERIAL PRIMARY KEY,
  batch_name VARCHAR(200) UNIQUE NOT NULL,
  analysis_date DATE,
  laboratory VARCHAR(200),
  analytical_session VARCHAR(200),

  -- Irradiation metadata (FT only)
  irradiation_id VARCHAR(100),
  irradiation_reactor VARCHAR(100),
  thermal_neutron_dose DECIMAL(18, 2), -- neutrons/cm²

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_batches_name ON batches(batch_name);
CREATE INDEX idx_batches_date ON batches(analysis_date);

COMMENT ON TABLE batches IS 'Analytical batches linking unknowns to reference materials for QC';
COMMENT ON COLUMN batches.thermal_neutron_dose IS 'Neutron fluence (neutrons/cm²) for EDM irradiation';

-- =============================================================================
-- 6. REFERENCE_MATERIALS TABLE (QC Standards)
-- =============================================================================
CREATE TABLE reference_materials (
  id SERIAL PRIMARY KEY,
  batch_id INTEGER NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
  material_name VARCHAR(100) NOT NULL, -- Durango apatite, Fish Canyon Tuff, etc.
  material_type VARCHAR(50), -- primary, secondary

  -- Expected values
  expected_age_ma DECIMAL(10, 2),
  expected_age_error_ma DECIMAL(10, 2),

  -- Measured values
  measured_age_ma DECIMAL(10, 2),
  measured_age_error_ma DECIMAL(10, 2),

  -- Other parameters
  parameter_type VARCHAR(50), -- age, U_concentration, track_length, etc.
  measured_value DECIMAL(15, 6),
  expected_value DECIMAL(15, 6),
  error DECIMAL(15, 6),

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_ref_materials_batch ON reference_materials(batch_id);
CREATE INDEX idx_ref_materials_name ON reference_materials(material_name);

COMMENT ON TABLE reference_materials IS 'QC standards (Durango, Fish Canyon, etc.) analyzed alongside unknowns';
COMMENT ON COLUMN reference_materials.material_type IS 'primary (age standard) or secondary (lab standard)';

-- =============================================================================
-- 7. MOUNTS TABLE (Physical Sample Mounts)
-- =============================================================================
CREATE TABLE mounts (
  id SERIAL PRIMARY KEY,
  mount_id VARCHAR(50) UNIQUE NOT NULL,
  mount_name VARCHAR(200),
  mount_date DATE,
  sample_id VARCHAR(50) REFERENCES samples(sample_id) ON DELETE SET NULL,

  -- Etching (if done at mount level)
  etchant_chemical VARCHAR(100),
  etch_duration_seconds INTEGER,
  etch_temperature_c DECIMAL(5, 2),

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_mounts_mount_id ON mounts(mount_id);
CREATE INDEX idx_mounts_sample ON mounts(sample_id);

COMMENT ON TABLE mounts IS 'Physical epoxy mounts containing grains';

-- =============================================================================
-- 8. GRAINS TABLE (Individual Grains within Mounts)
-- =============================================================================
CREATE TABLE grains (
  id SERIAL PRIMARY KEY,
  grain_id VARCHAR(100) UNIQUE NOT NULL,
  mount_id VARCHAR(50) REFERENCES mounts(mount_id) ON DELETE SET NULL,
  grain_identifier VARCHAR(100), -- User-friendly name

  -- Grain characteristics
  grain_morphology VARCHAR(50),
  grain_quality VARCHAR(50),

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_grains_grain_id ON grains(grain_id);
CREATE INDEX idx_grains_mount ON grains(mount_id);

COMMENT ON TABLE grains IS 'Individual grains within mounts (enables cross-method linking)';

-- =============================================================================
-- 9. FT_DATAPOINTS TABLE (FT Analytical Sessions)
-- =============================================================================
-- This is the CORE NEW CONCEPT - a datapoint represents ONE analytical session
-- One sample can have MULTIPLE datapoints (different labs, methods, dates)
-- =============================================================================
CREATE TABLE ft_datapoints (
  id SERIAL PRIMARY KEY,
  sample_id VARCHAR(50) NOT NULL REFERENCES samples(sample_id) ON DELETE CASCADE,
  datapoint_key VARCHAR(100) UNIQUE NOT NULL, -- User-provided unique ID
  batch_id INTEGER REFERENCES batches(id),

  -- Provenance
  laboratory VARCHAR(200),
  analyst_orcid VARCHAR(50),
  analysis_date TIMESTAMP,
  publication_doi VARCHAR(100),

  -- Method metadata
  mineral_type VARCHAR(50),
  ft_method VARCHAR(50), -- EDM, LA-ICP-MS, Population
  ft_software VARCHAR(100), -- TrackWorks, FastTracks, etc.
  ft_algorithm VARCHAR(50),
  u_determination_method VARCHAR(100),

  -- Whole-rock summary stats
  n_grains INTEGER,
  total_area_cm2 DECIMAL(10, 6),
  mean_rho_s DECIMAL(12, 2),
  total_Ns INTEGER,
  mean_rho_i DECIMAL(12, 2),
  total_Ni INTEGER,
  mean_rho_d DECIMAL(12, 2),
  total_Nd INTEGER,
  dosimeter VARCHAR(50), -- CN1, CN5, etc. (EDM only)

  -- Kinetic parameters (aggregate)
  mean_U_ppm DECIMAL(10, 3),
  sd_U_ppm DECIMAL(10, 3),
  mean_Dpar_um DECIMAL(6, 3),
  se_Dpar_um DECIMAL(6, 3),
  n_Dpar_measurements INTEGER,
  mean_Dper_um DECIMAL(6, 3),
  se_Dper_um DECIMAL(6, 3),
  n_Dper_measurements INTEGER,
  mean_rmr0 DECIMAL(6, 4),
  sd_rmr0 DECIMAL(6, 4),
  mean_kappa DECIMAL(6, 4),
  sd_kappa DECIMAL(6, 4),
  rmr0_equation VARCHAR(100),

  -- Statistical tests
  chi_square DECIMAL(12, 6),
  P_chi2_pct DECIMAL(6, 3),
  dispersion_pct DECIMAL(6, 4),

  -- Age results
  age_equation VARCHAR(100),
  mean_age_ma DECIMAL(10, 2),
  mean_age_error_ma DECIMAL(10, 2),
  central_age_ma DECIMAL(10, 2),
  central_age_error_ma DECIMAL(10, 2),
  pooled_age_ma DECIMAL(10, 2),
  pooled_age_error_ma DECIMAL(10, 2),
  population_age_ma DECIMAL(10, 2), -- EDM population method only
  population_age_error_ma DECIMAL(10, 2),
  age_error_type VARCHAR(20),
  age_comment TEXT,

  -- Track length summary
  mean_track_length_um DECIMAL(6, 3),
  se_mean_track_length_um DECIMAL(6, 3),
  n_track_measurements INTEGER,
  sd_track_length_um DECIMAL(6, 3),

  -- Etching conditions
  cf252_irradiation BOOLEAN,
  etchant_chemical VARCHAR(100),
  etch_duration_seconds INTEGER,
  etch_temperature_c DECIMAL(5, 2),

  -- Calibration (EDM method)
  zeta_yr_cm2 DECIMAL(12, 6),
  zeta_error_yr_cm2 DECIMAL(12, 6),
  zeta_error_type VARCHAR(20),

  -- Absolute dating (LA-ICP-MS method)
  R_um DECIMAL(8, 3), -- Etchable track range

  -- Decay constants
  lambda_D VARCHAR(30), -- Total U-238 decay constant
  lambda_f VARCHAR(30), -- Fission decay constant
  q_factor DECIMAL(6, 4), -- Detection efficiency

  -- Irradiation (EDM only)
  irradiation_reactor VARCHAR(100),
  thermal_neutron_dose DECIMAL(18, 2),
  irradiation_batch_id VARCHAR(100),

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_ft_datapoints_sample ON ft_datapoints(sample_id);
CREATE INDEX idx_ft_datapoints_key ON ft_datapoints(datapoint_key);
CREATE INDEX idx_ft_datapoints_batch ON ft_datapoints(batch_id);
CREATE INDEX idx_ft_datapoints_central_age ON ft_datapoints(central_age_ma);

COMMENT ON TABLE ft_datapoints IS 'Fission-track analytical sessions (EarthBank FT Datapoints sheet)';
COMMENT ON COLUMN ft_datapoints.datapoint_key IS 'User-provided unique identifier for this analytical session';
COMMENT ON COLUMN ft_datapoints.ft_method IS 'EDM, LA-ICP-MS, or Population method';

-- =============================================================================
-- 10. FT_COUNT_DATA TABLE (Grain-by-Grain Counts)
-- =============================================================================
CREATE TABLE ft_count_data (
  id SERIAL PRIMARY KEY,
  ft_datapoint_id INTEGER NOT NULL REFERENCES ft_datapoints(id) ON DELETE CASCADE,
  grain_id VARCHAR(100) NOT NULL,

  -- Count data
  counting_area_cm2 DECIMAL(10, 6),
  Ns INTEGER,
  rho_s_cm2 DECIMAL(12, 2),
  Ni INTEGER,
  rho_i_cm2 DECIMAL(12, 2),
  Nd INTEGER,
  rho_d_cm2 DECIMAL(12, 2),

  -- Kinetic parameters (grain-specific)
  Dpar_um DECIMAL(6, 3),
  Dpar_error_um DECIMAL(6, 3),
  n_Dpar_measurements INTEGER,
  Dper_um DECIMAL(6, 3),
  Dper_error_um DECIMAL(6, 3),
  n_Dper_measurements INTEGER,
  Dpar_Dper_error_type VARCHAR(20),

  -- Comments
  comments TEXT,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  UNIQUE(ft_datapoint_id, grain_id)
);

CREATE INDEX idx_ft_count_data_datapoint ON ft_count_data(ft_datapoint_id);
CREATE INDEX idx_ft_count_data_grain ON ft_count_data(grain_id);

COMMENT ON TABLE ft_count_data IS 'Fission-track grain-by-grain count data (EarthBank FTCountData sheet)';

-- =============================================================================
-- 11. FT_SINGLE_GRAIN_AGES TABLE (Grain-Level Ages)
-- =============================================================================
CREATE TABLE ft_single_grain_ages (
  id SERIAL PRIMARY KEY,
  ft_datapoint_id INTEGER NOT NULL REFERENCES ft_datapoints(id) ON DELETE CASCADE,
  grain_id VARCHAR(100) NOT NULL,
  mount_id VARCHAR(50),

  -- Etching (can vary per mount)
  etch_duration_seconds INTEGER,

  -- Chemistry
  U_ppm DECIMAL(10, 3),
  U_ppm_error DECIMAL(10, 3),
  U_Ca_ratio DECIMAL(10, 6),
  U_Ca_ratio_error DECIMAL(10, 6),
  U_Ca_error_type VARCHAR(20),

  -- Kinetic parameters
  rmr0 DECIMAL(6, 4),
  kappa DECIMAL(6, 4),

  -- Age
  grain_age_ma DECIMAL(10, 2),
  grain_age_error_ma DECIMAL(10, 2),
  grain_age_error_type VARCHAR(20),

  -- Comments
  comments TEXT,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  UNIQUE(ft_datapoint_id, grain_id)
);

CREATE INDEX idx_ft_single_grain_datapoint ON ft_single_grain_ages(ft_datapoint_id);
CREATE INDEX idx_ft_single_grain_grain ON ft_single_grain_ages(grain_id);

COMMENT ON TABLE ft_single_grain_ages IS 'Fission-track single grain ages (EarthBank FTSingleGrain sheet)';

-- =============================================================================
-- 12. FT_TRACK_LENGTH_DATA TABLE (Individual Track Measurements)
-- =============================================================================
CREATE TABLE ft_track_length_data (
  id SERIAL PRIMARY KEY,
  ft_datapoint_id INTEGER NOT NULL REFERENCES ft_datapoints(id) ON DELETE CASCADE,
  grain_id VARCHAR(100) NOT NULL,
  track_id VARCHAR(100) NOT NULL,

  -- Track classification
  track_type VARCHAR(20), -- TINT, TINCLE, semi-track
  mount_id VARCHAR(50),
  etch_duration_seconds INTEGER,

  -- Length measurements
  apparent_length_um DECIMAL(6, 3),
  corrected_z_depth_um DECIMAL(8, 2),
  true_length_um DECIMAL(6, 3), -- 3D corrected

  -- Orientation
  azimuth_deg DECIMAL(6, 2),
  dip_deg DECIMAL(6, 2),
  angle_to_c_axis_deg DECIMAL(6, 2),
  c_axis_corrected_length_um DECIMAL(6, 3),

  -- Kinetic parameters (for this grain)
  Dpar_um DECIMAL(6, 3),
  Dpar_error_um DECIMAL(6, 3),
  n_Dpar_measurements INTEGER,
  Dper_um DECIMAL(6, 3),
  Dper_error_um DECIMAL(6, 3),
  n_Dper_measurements INTEGER,
  Dpar_Dper_error_type VARCHAR(20),

  -- Composition
  rmr0 DECIMAL(6, 4),
  kappa DECIMAL(6, 4),

  -- Comments
  comments TEXT,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  UNIQUE(ft_datapoint_id, grain_id, track_id),

  CONSTRAINT check_track_type CHECK (track_type IN ('TINT', 'TINCLE', 'semi-track', NULL))
);

CREATE INDEX idx_ft_track_length_datapoint ON ft_track_length_data(ft_datapoint_id);
CREATE INDEX idx_ft_track_length_grain ON ft_track_length_data(grain_id);
CREATE INDEX idx_ft_track_length_mtl ON ft_track_length_data(true_length_um);

COMMENT ON TABLE ft_track_length_data IS 'Fission-track individual track measurements (EarthBank FTLengthData sheet)';
COMMENT ON COLUMN ft_track_length_data.track_type IS 'TINT (track-in-track) or TINCLE (track-in-cleavage)';

-- =============================================================================
-- 13. FT_BINNED_LENGTH_DATA TABLE (Binned Histograms)
-- =============================================================================
CREATE TABLE ft_binned_length_data (
  id SERIAL PRIMARY KEY,
  ft_datapoint_id INTEGER NOT NULL REFERENCES ft_datapoints(id) ON DELETE CASCADE,
  mount_id VARCHAR(50),
  etch_duration_seconds INTEGER,

  -- Histogram bins (20 bins of 1 µm each)
  bin_0_1_um INTEGER,
  bin_1_2_um INTEGER,
  bin_2_3_um INTEGER,
  bin_3_4_um INTEGER,
  bin_4_5_um INTEGER,
  bin_5_6_um INTEGER,
  bin_6_7_um INTEGER,
  bin_7_8_um INTEGER,
  bin_8_9_um INTEGER,
  bin_9_10_um INTEGER,
  bin_10_11_um INTEGER,
  bin_11_12_um INTEGER,
  bin_12_13_um INTEGER,
  bin_13_14_um INTEGER,
  bin_14_15_um INTEGER,
  bin_15_16_um INTEGER,
  bin_16_17_um INTEGER,
  bin_17_18_um INTEGER,
  bin_18_19_um INTEGER,
  bin_19_20_um INTEGER,

  -- Kinetic parameters
  Dpar_um DECIMAL(6, 3),
  Dpar_error_um DECIMAL(6, 3),
  n_Dpar_measurements INTEGER,
  Dper_um DECIMAL(6, 3),
  Dper_error_um DECIMAL(6, 3),
  n_Dper_measurements INTEGER,
  Dpar_Dper_error_type VARCHAR(20),

  -- Comments
  comments TEXT,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_ft_binned_length_datapoint ON ft_binned_length_data(ft_datapoint_id);

COMMENT ON TABLE ft_binned_length_data IS 'Fission-track binned length histograms (legacy data format)';

-- =============================================================================
-- 14. HE_DATAPOINTS TABLE ((U-Th)/He Analytical Sessions)
-- =============================================================================
CREATE TABLE he_datapoints (
  id SERIAL PRIMARY KEY,
  sample_id VARCHAR(50) NOT NULL REFERENCES samples(sample_id) ON DELETE CASCADE,
  datapoint_key VARCHAR(100) UNIQUE NOT NULL,
  batch_id INTEGER REFERENCES batches(id),

  -- Provenance
  laboratory VARCHAR(200),
  analyst_orcid VARCHAR(50),
  analysis_date TIMESTAMP,
  publication_doi VARCHAR(100),

  -- Method metadata
  mineral_type VARCHAR(50),
  mount_id VARCHAR(50),
  n_aliquots INTEGER,

  -- Uncorrected ages
  mean_uncorr_age_ma DECIMAL(10, 2),
  mean_uncorr_age_error_ma DECIMAL(10, 2),
  mean_uncorr_age_error_type VARCHAR(20),
  weighted_mean_uncorr_age_ma DECIMAL(10, 2),
  weighted_mean_uncorr_age_error_ma DECIMAL(10, 2),
  weighted_mean_uncorr_age_error_type VARCHAR(20),
  mswd_uncorr DECIMAL(8, 4),
  conf95_uncorr_ma DECIMAL(10, 2),
  chi2_uncorr_pct DECIMAL(6, 3),
  iqr_uncorr_ma DECIMAL(10, 2),

  -- Corrected ages
  mean_corr_age_ma DECIMAL(10, 2),
  mean_corr_age_error_ma DECIMAL(10, 2),
  mean_corr_age_error_type VARCHAR(20),
  weighted_mean_corr_age_ma DECIMAL(10, 2),
  weighted_mean_corr_age_error_ma DECIMAL(10, 2),
  weighted_mean_corr_age_error_type VARCHAR(20),
  mswd_corr DECIMAL(8, 4),
  conf95_corr_ma DECIMAL(10, 2),
  chi2_corr_pct DECIMAL(6, 3),
  iqr_corr_ma DECIMAL(10, 2),

  -- Uncertainty description
  uncertainty_description TEXT,

  -- In-situ method metadata
  ablation_pit_volume_method VARCHAR(100),
  ablation_pit_volume_software VARCHAR(100),
  he_measurement_method VARCHAR(100),
  parent_isotope_method VARCHAR(100),

  -- Calculation equations
  surface_area_volume_equation VARCHAR(100),
  alpha_stopping_distance_ref VARCHAR(200),
  ft_correction_equation VARCHAR(100),
  esr_sa_v_equation VARCHAR(100),
  esr_ft_equation VARCHAR(100),
  eU_equation VARCHAR(100),
  he_age_approach VARCHAR(100),
  corr_age_method VARCHAR(100),

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_he_datapoints_sample ON he_datapoints(sample_id);
CREATE INDEX idx_he_datapoints_key ON he_datapoints(datapoint_key);
CREATE INDEX idx_he_datapoints_batch ON he_datapoints(batch_id);

COMMENT ON TABLE he_datapoints IS '(U-Th)/He analytical sessions (EarthBank He Datapoints sheet)';

-- =============================================================================
-- 15. HE_WHOLE_GRAIN_DATA TABLE (He Grain-Level Results)
-- =============================================================================
CREATE TABLE he_whole_grain_data (
  id SERIAL PRIMARY KEY,
  he_datapoint_id INTEGER NOT NULL REFERENCES he_datapoints(id) ON DELETE CASCADE,
  lab_no VARCHAR(50) UNIQUE,
  grain_identifier VARCHAR(100),

  -- Aliquot metadata
  aliquot_type VARCHAR(20), -- single, multi, unknown
  n_grains_in_aliquot INTEGER,
  crystal_integrity VARCHAR(20), -- whole, fragment, abraded, mixed
  grain_morphology VARCHAR(50),
  assumed_geometry VARCHAR(50),

  -- Grain dimensions
  length_um DECIMAL(10, 2),
  length_um_sd DECIMAL(10, 2), -- For multi-grain aliquots
  half_width_um DECIMAL(10, 2),
  width_um_sd DECIMAL(10, 2),
  height_um DECIMAL(10, 2), -- Second width
  height_um_sd DECIMAL(10, 2),
  measurement_method VARCHAR(100),
  crystal_faces_measured VARCHAR(200),

  -- He measurement
  He_ncc DECIMAL(12, 6),
  He_measurement_method VARCHAR(100),
  He_extraction_temperature_c DECIMAL(6, 2),
  He_extraction_duration_min INTEGER,
  He_extraction_method VARCHAR(100), -- furnace, laser
  He_blank_ncc DECIMAL(12, 6),
  He_blank_error_ncc DECIMAL(12, 6),

  -- Chemistry
  U_ppm DECIMAL(10, 3),
  U_ppm_error DECIMAL(10, 3),
  Th_ppm DECIMAL(10, 3),
  Th_ppm_error DECIMAL(10, 3),
  Sm_ppm DECIMAL(10, 3),
  Sm_ppm_error DECIMAL(10, 3),
  eU_ppm DECIMAL(10, 3),
  U_measurement_method VARCHAR(100),
  U_blank_ppm DECIMAL(10, 6),
  Th_blank_ppm DECIMAL(10, 6),
  Sm_blank_ppm DECIMAL(10, 6),
  spike_U238_U235_ratio DECIMAL(10, 6),
  spike_Th232_Th229_ratio DECIMAL(10, 6),

  -- Grain geometry
  mass_mg DECIMAL(10, 6),
  surface_area_mm2 DECIMAL(10, 6),
  volume_mm3 DECIMAL(10, 6),
  sa_v_ratio DECIMAL(10, 6),
  Rs_um DECIMAL(10, 2), -- Equivalent sphere radius
  esr_sa_v_um DECIMAL(10, 2),
  esr_ft_um DECIMAL(10, 2),
  sa_v_calc_equation VARCHAR(100),
  ft_correction_equation VARCHAR(100),
  alpha_stopping_distance_ref VARCHAR(200),

  -- Ages
  uncorr_age_ma DECIMAL(10, 2),
  uncorr_age_error_ma DECIMAL(10, 2),
  corr_age_ma DECIMAL(10, 2),
  corr_age_error_ma DECIMAL(10, 2),
  corr_age_1sigma_ma DECIMAL(10, 2),
  FT DECIMAL(6, 4), -- Alpha ejection correction factor
  error_type VARCHAR(20),
  eU_equation VARCHAR(100),
  he_age_approach VARCHAR(100),
  lambda_U238 VARCHAR(30),
  lambda_Th232 VARCHAR(30),
  lambda_Sm147 VARCHAR(30),

  -- Analytical details
  terminations VARCHAR(10), -- 0T, 1T, 2T
  std_run VARCHAR(10),
  thermal_model VARCHAR(10),

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_he_whole_grain_datapoint ON he_whole_grain_data(he_datapoint_id);
CREATE INDEX idx_he_whole_grain_lab_no ON he_whole_grain_data(lab_no);
CREATE INDEX idx_he_whole_grain_age ON he_whole_grain_data(corr_age_ma);

COMMENT ON TABLE he_whole_grain_data IS '(U-Th)/He grain-level results (EarthBank HeWholeGrain sheet)';
COMMENT ON COLUMN he_whole_grain_data.FT IS 'Alpha ejection correction factor (Ft)';
COMMENT ON COLUMN he_whole_grain_data.eU_ppm IS 'Effective uranium (U + 0.235*Th)';
COMMENT ON COLUMN he_whole_grain_data.terminations IS 'Grain termination count (e.g., 0T, 1T, 2T)';

-- =============================================================================
-- 16. DATAPOINT_PEOPLE_ROLES TABLE (Many-to-Many)
-- =============================================================================
CREATE TABLE datapoint_people_roles (
  id SERIAL PRIMARY KEY,
  datapoint_id INTEGER NOT NULL, -- Can link to ft_datapoints.id or he_datapoints.id
  datapoint_type VARCHAR(20) NOT NULL, -- 'ft' or 'he'
  person_id INTEGER NOT NULL REFERENCES people(id) ON DELETE CASCADE,
  role VARCHAR(50) NOT NULL, -- analyst, lab_technician, etc.

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT check_datapoint_type CHECK (datapoint_type IN ('ft', 'he', 'upb', 'trace'))
);

CREATE INDEX idx_datapoint_people_datapoint ON datapoint_people_roles(datapoint_id, datapoint_type);
CREATE INDEX idx_datapoint_people_person ON datapoint_people_roles(person_id);

COMMENT ON TABLE datapoint_people_roles IS 'Links datapoints to people with roles (analyst, technician, etc.)';

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

-- Update last_modified_date on datasets
CREATE OR REPLACE FUNCTION update_dataset_modified_date()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_modified_date = CURRENT_DATE;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_datasets_modified_date
BEFORE UPDATE ON datasets
FOR EACH ROW
EXECUTE FUNCTION update_dataset_modified_date();

-- =============================================================================
-- VIEWS (Compatibility and Convenience)
-- =============================================================================

-- Sample summary view with first datapoint ages
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
  s.n_aft_grains,
  s.n_ahe_grains,

  -- First FT datapoint (for backward compatibility)
  (SELECT central_age_ma FROM ft_datapoints WHERE sample_id = s.sample_id ORDER BY analysis_date DESC LIMIT 1) as aft_central_age_ma,
  (SELECT central_age_error_ma FROM ft_datapoints WHERE sample_id = s.sample_id ORDER BY analysis_date DESC LIMIT 1) as aft_age_error_ma,
  (SELECT dispersion_pct FROM ft_datapoints WHERE sample_id = s.sample_id ORDER BY analysis_date DESC LIMIT 1) as aft_dispersion_pct,
  (SELECT P_chi2_pct FROM ft_datapoints WHERE sample_id = s.sample_id ORDER BY analysis_date DESC LIMIT 1) as aft_P_chi2,
  (SELECT mean_track_length_um FROM ft_datapoints WHERE sample_id = s.sample_id ORDER BY analysis_date DESC LIMIT 1) as aft_mtl_um,

  -- AHe summary (average of all grains from first datapoint)
  (SELECT AVG(hg.corr_age_ma)
   FROM he_whole_grain_data hg
   JOIN he_datapoints hd ON hg.he_datapoint_id = hd.id
   WHERE hd.sample_id = s.sample_id) as ahe_mean_age_ma,
  (SELECT STDDEV(hg.corr_age_ma)
   FROM he_whole_grain_data hg
   JOIN he_datapoints hd ON hg.he_datapoint_id = hd.id
   WHERE hd.sample_id = s.sample_id) as ahe_age_sd_ma,

  d.dataset_name,
  d.study_area

FROM samples s
LEFT JOIN datasets d ON s.dataset_id = d.id;

COMMENT ON VIEW vw_sample_summary IS 'Sample summary with first datapoint ages (backward compatibility view)';

-- Complete AFT data view (first datapoint per sample)
CREATE OR REPLACE VIEW vw_aft_complete AS
SELECT
  s.sample_id,
  s.sampling_location_information,
  s.latitude,
  s.longitude,
  s.elevation_m,

  -- Ages from first datapoint
  ftd.central_age_ma,
  ftd.central_age_error_ma,
  ftd.pooled_age_ma,
  ftd.pooled_age_error_ma,
  ftd.dispersion_pct,
  ftd.P_chi2_pct,
  ftd.n_grains,

  -- Track lengths from first datapoint
  ftd.mean_track_length_um,
  ftd.sd_track_length_um,
  ftd.n_track_measurements,

  -- Aggregate count data from first datapoint
  ftd.mean_rho_s,
  ftd.total_Ns,
  ftd.mean_U_ppm,
  ftd.mean_Dpar_um

FROM samples s
LEFT JOIN LATERAL (
  SELECT * FROM ft_datapoints
  WHERE sample_id = s.sample_id
  ORDER BY analysis_date DESC
  LIMIT 1
) ftd ON true;

COMMENT ON VIEW vw_aft_complete IS 'Complete AFT data from first datapoint per sample (backward compatibility)';

-- =============================================================================
-- INSERT DEFAULT DATASET
-- =============================================================================

INSERT INTO datasets (id, dataset_name, description, study_area, privacy_status, license)
VALUES (1, 'Default Dataset', 'Default data package for initial imports', 'Global', 'public', 'CC-BY-4.0')
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- COMPLETION MESSAGE
-- =============================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'EarthBank Schema v2 created successfully!';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Tables: 16';
  RAISE NOTICE '  Core: datasets, samples, people, batches, mounts, grains';
  RAISE NOTICE '  FT: ft_datapoints, ft_count_data, ft_single_grain_ages,';
  RAISE NOTICE '      ft_track_length_data, ft_binned_length_data';
  RAISE NOTICE '  He: he_datapoints, he_whole_grain_data';
  RAISE NOTICE '  Linking: sample_people_roles, datapoint_people_roles';
  RAISE NOTICE '  QC: reference_materials';
  RAISE NOTICE 'Views: 2';
  RAISE NOTICE 'Triggers: 2';
  RAISE NOTICE '';
  RAISE NOTICE 'CRITICAL: This is OPTION A-1 (Clean Slate)';
  RAISE NOTICE 'All old data will be LOST when migrating.';
  RAISE NOTICE '';
  RAISE NOTICE 'Next step: Create import-earthbank-templates.ts';
  RAISE NOTICE '========================================';
END $$;
