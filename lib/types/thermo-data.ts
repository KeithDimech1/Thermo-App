/**
 * TypeScript Type Definitions for Thermochronology Data
 *
 * Based on FAIR data standard (Kohn et al. 2024, GSA Bulletin)
 * Maps to PostgreSQL schema in scripts/db/schema-thermo.sql
 *
 * @module lib/types/thermo-data
 */

// =============================================================================
// CORE DATA TYPES
// =============================================================================

export interface Dataset {
  id: number;
  dataset_name: string;
  description: string | null;
  publication_reference: string | null;
  doi: string | null;
  study_area: string | null;
  analyst: string | null;
  laboratory: string | null;
  authors: string[] | null; // Added for Papers view (IDEA-004)
  collection_date: Date | null; // Added for Papers view (IDEA-004)
  analysis_methods: string[] | null; // Added for Papers view (IDEA-004)

  // Extraction metadata (added 2025-11-16)
  paper_summary: string | null;
  fair_score: number | null;
  fair_reasoning: string | null;
  key_findings: string[] | null;
  extraction_report_url: string | null;

  created_at: Date;
}

export interface DataFile {
  id: number;
  dataset_id: number;
  file_name: string;
  file_path: string;
  file_type: string;
  display_name: string | null;
  file_size_bytes: number | null;
  row_count: number | null;
  description: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface Sample {
  sample_id: string;
  dataset_id: number;

  // Sample identification
  igsn: string | null;

  // Geographic location
  latitude: number | null;
  longitude: number | null;
  elevation_m: number | null;
  geodetic_datum: string | null;
  vertical_datum: string | null;
  lat_long_precision_m: number | null;

  // Sample characteristics
  lithology: string | null;
  mineral_type: string | null;
  sample_kind: string | null;
  sample_method: string | null;
  sample_depth_m: number | null;
  sampling_location_information: string | null;

  // Stratigraphic context
  stratigraphic_unit: string | null;
  chronostratigraphic_unit_age: string | null;
  sample_age_ma: number | null;

  // Provenance
  sample_collector: string | null;
  collection_date: Date | null;
  analyst: string | null;
  analysis_method: string | null;
  last_known_sample_archive: string | null;
  associated_references: string | null;

  // Data availability
  n_aft_grains: number | null;
  n_ahe_grains: number | null;

  // Metadata
  created_at: Date;
  updated_at: Date;
}

export interface FTCounts {
  id: number;
  sample_id: string;
  grain_id: string;

  // Count data (LA-ICP-MS method)
  Ns: number | null;
  rho_s_cm2: number | null;

  // Chemistry (LA-ICP-MS specific)
  U_ppm: number | null;
  U_1sigma: number | null;
  Th_ppm: number | null;
  Th_1sigma: number | null;
  eU_ppm: number | null;
  eU_1sigma: number | null;

  // Kinetic parameters
  Dpar_um: number | null;
  Dpar_sd_um: number | null;
  Dper_um: number | null;
  Dper_sd_um: number | null;
  Cl_wt_pct: number | null;
  eCl_apfu: number | null;
  rmr0: number | null;
  rmr0D: number | null;

  // Statistical measures
  P_chi2_pct: number | null;
  Disp_pct: number | null;
  n_grains: number | null;

  // Analytical method
  ft_counting_method: string | null;
  ft_software: string | null;
  ft_algorithm: string | null;
  microscope: string | null;
  objective: string | null;
  analyst: string | null;
  laboratory: string | null;
  analysis_date: Date | null;
  sample_mount_id: string | null;
  etching_conditions: string | null;
  counting_area_cm2: number | null;

  // EDM-specific (NULL for LA-ICP-MS)
  Ni: number | null;
  Nd: number | null;
  rho_i_cm2: number | null;
  rho_d_cm2: number | null;
  dosimeter: string | null;

  created_at: Date;
}

export interface FTTrackLengths {
  id: number;
  sample_id: string;
  grain_id: string;

  // Summary statistics
  n_confined_tracks: number | null;
  mean_track_length_um: number | null;
  mean_track_length_se_um: number | null;
  mean_track_length_sd_um: number | null;

  // Kinetic parameters
  Dpar_um: number | null;
  Dpar_sd_um: number | null;
  Dper_um: number | null;
  Dper_sd_um: number | null;

  // Individual track data (if available)
  apparent_length_um: number | null;
  true_length_um: number | null;
  angle_to_c_axis_deg: number | null;

  // Analytical method
  etching_conditions: string | null;
  analyst: string | null;
  laboratory: string | null;
  analysis_date: Date | null;

  created_at: Date;
}

export interface FTAges {
  id: number;
  sample_id: string;

  // Age equation and calibration
  age_equation: string | null;
  ft_age_type: string | null;

  // Calibration constants
  lambda_D: string | null;
  lambda_f: string | null;
  zeta_yr_cm2: number | null;
  zeta_error_yr_cm2: number | null;

  // EDM-specific calibration (NULL for LA-ICP-MS)
  dosimeter: string | null;
  Rs_um: number | null;
  q: number | null;
  irradiation_reactor: string | null;

  // Age results
  n_grains: number | null;
  pooled_age_ma: number | null;
  pooled_age_error_ma: number | null;
  central_age_ma: number | null;
  central_age_error_ma: number | null;

  // Statistical measures
  dispersion_pct: number | null;
  P_chi2: number | null;

  // Mixture modeling (if applicable)
  age_peak_software: string | null;
  best_fit_peak_ages_ma: number[] | null;
  best_fit_peak_errors_ma: number[] | null;
  best_fit_peak_grain_pct: number[] | null;

  created_at: Date;
}

export interface AHeGrainData {
  id: number;
  sample_id: string;
  lab_no: string | null;

  // Grain dimensions
  length_um: number | null;
  half_width_um: number | null;
  Rs_um: number | null;
  mass_mg: number | null;
  terminations: string | null;

  // Chemistry
  U_ppm: number | null;
  Th_ppm: number | null;
  Sm_ppm: number | null;
  eU_ppm: number | null;
  He_ncc: number | null;

  // Ages
  uncorr_age_ma: number | null;
  corr_age_ma: number | null;
  corr_age_1sigma_ma: number | null;
  FT: number | null;

  // Analytical method
  std_run: string | null;
  thermal_model: string | null;

  created_at: Date;
}

// =============================================================================
// VIEW TYPES (for complex queries)
// =============================================================================

export interface SampleSummary {
  // From samples table
  sample_id: string;
  dataset_id: number;
  latitude: number | null;
  longitude: number | null;
  elevation_m: number | null;
  lithology: string | null;
  mineral_type: string | null;
  analysis_method: string | null;

  // AFT summary
  aft_central_age_ma: number | null;
  aft_central_age_error_ma: number | null;
  aft_pooled_age_ma: number | null;
  aft_n_grains: number | null;
  aft_mean_track_length_um: number | null;
  aft_dispersion_pct: number | null;

  // AHe summary
  ahe_n_grains: number | null;
  ahe_mean_age_ma: number | null;
  ahe_mean_age_error_ma: number | null;
  ahe_age_range_ma: string | null;
}

export interface AFTComplete {
  sample_id: string;

  // Ages
  central_age_ma: number | null;
  central_age_error_ma: number | null;
  pooled_age_ma: number | null;
  pooled_age_error_ma: number | null;

  // Track lengths
  mean_track_length_um: number | null;
  mean_track_length_sd_um: number | null;
  n_confined_tracks: number | null;

  // Counts
  Ns: number | null;
  U_ppm: number | null;
  eU_ppm: number | null;
  Dpar_um: number | null;

  // Statistics
  n_grains: number | null;
  dispersion_pct: number | null;
  P_chi2: number | null;
}

// =============================================================================
// FILTER TYPES
// =============================================================================

export interface SampleFilters {
  dataset_id?: number;
  mineral_type?: string;
  lithology?: string;
  analysis_method?: string;
  min_elevation_m?: number;
  max_elevation_m?: number;
  has_aft?: boolean;
  has_ahe?: boolean;
}

export interface FTDataFilters {
  sample_id?: string;
  min_age_ma?: number;
  max_age_ma?: number;
  min_track_length_um?: number;
  max_track_length_um?: number;
  min_dispersion_pct?: number;
  max_dispersion_pct?: number;
}

export interface AHeDataFilters {
  sample_id?: string;
  min_age_ma?: number;
  max_age_ma?: number;
  min_eU_ppm?: number;
  max_eU_ppm?: number;
}

// =============================================================================
// API RESPONSE TYPES
// =============================================================================

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

export interface SampleDetailResponse {
  sample: Sample;
  ft_counts: FTCounts | null;
  ft_track_lengths: FTTrackLengths | null;
  ft_ages: FTAges | null;
  ahe_grains: AHeGrainData[];
}

export interface DatasetStatsResponse {
  total_samples: number;
  total_aft_analyses: number;
  total_ahe_grains: number;
  age_range_ma: {
    aft_min: number | null;
    aft_max: number | null;
    ahe_min: number | null;
    ahe_max: number | null;
  };
  elevation_range_m: {
    min: number | null;
    max: number | null;
  };
}
