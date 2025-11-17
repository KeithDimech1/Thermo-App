/**
 * TypeScript Type Definitions for Thermochronology Data - Schema v2
 *
 * Based on FAIR data standard (Kohn et al. 2024, GSA Bulletin)
 * Maps to PostgreSQL schema in scripts/db/schema-earthbank-v2.sql
 * Compatible with EarthBank import templates (Nixon et al. 2025)
 *
 * CRITICAL: Schema v2 uses DATAPOINT architecture
 * - Old: 1 sample → 1 analysis
 * - New: 1 sample → many datapoints (analytical sessions)
 *
 * @module lib/types/thermo-data
 * @version 2.0.0
 */

// =============================================================================
// CORE DATA TYPES - Schema v2
// =============================================================================

export interface Dataset {
  id: number;
  dataset_name: string;
  description: string | null;

  // Publication and citation
  publication_reference: string | null;
  publication_doi: string | null;
  doi: string | null; // Alias for publication_doi (legacy support)

  // Full paper metadata (MIGRATION 006)
  full_citation: string | null;
  publication_year: number | null;
  publication_journal: string | null;
  publication_volume_pages: string | null;
  study_location: string | null;
  pdf_filename: string | null;
  pdf_url: string | null;

  // Geographic scope
  study_area: string | null;

  // Dataset characteristics (MIGRATION 006)
  mineral_analyzed: string | null;
  sample_count: number | null;
  age_range_min_ma: number | null;
  age_range_max_ma: number | null;

  // Privacy and access control (NEW in v2)
  privacy_status: 'public' | 'embargo' | 'private';
  embargo_date: Date | null;
  data_package_doi: string | null;

  // Metadata
  keywords: string | null;
  data_owner: string | null;
  license: string | null;

  // Papers view metadata (IDEA-004 legacy support)
  authors: string[] | null;
  collection_date: Date | null;
  analysis_methods: string[] | null;
  laboratory: string | null;
  analyst: string | null;

  // Extraction metadata (from /thermoextract)
  paper_summary: string | null;
  fair_score: number | null;
  fair_reasoning: string | null;
  key_findings: string[] | null;
  extraction_report_url: string | null;

  // Audit
  submission_date: Date | null;
  last_modified_date: Date | null;
  created_at: Date;
}

export interface FairScoreBreakdown {
  id: number;
  dataset_id: number;

  // Table-level scores (Kohn et al. 2024)
  table4_score: number | null;  // Geosample Metadata (max 15)
  table4_reasoning: string | null;
  table5_score: number | null;  // FT Counts (max 15)
  table5_reasoning: string | null;
  table6_score: number | null;  // Track Lengths (max 10)
  table6_reasoning: string | null;
  table10_score: number | null; // Ages (max 10)
  table10_reasoning: string | null;

  // FAIR category scores (25 points each)
  findable_score: number | null;
  findable_reasoning: string | null;
  accessible_score: number | null;
  accessible_reasoning: string | null;
  interoperable_score: number | null;
  interoperable_reasoning: string | null;
  reusable_score: number | null;
  reusable_reasoning: string | null;

  // Overall score
  total_score: number | null;
  grade: string | null; // A, B, C, D, F

  // Metadata
  created_at: Date;
  updated_at: Date;
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
  is_folder: boolean | null; // NEW: TRUE if this entry represents a folder
  folder_path: string | null; // NEW: Path to the folder if is_folder=TRUE
  created_at: Date;
  updated_at: Date;
}

export interface Person {
  id: number;
  orcid: string | null;
  name: string;
  email: string | null;
  affiliation: string | null;
  created_at: Date;
}

export interface Sample {
  sample_id: string;
  dataset_id: number;

  // Sample identification
  igsn: string | null;

  // Sample classification
  sample_kind: string | null;
  sample_collection_method: string | null;
  sample_kind_additional_info: string | null;

  // Geographic location
  latitude: number | null;
  longitude: number | null;
  geodetic_datum: string | null;
  lat_long_precision_m: number | null;
  lat_long_precision_method: string | null;

  // Elevation and depth
  elevation_m: number | null;
  vertical_datum: string | null;
  elevation_accuracy_m: number | null;
  elevation_additional_info: string | null;
  depth_min_m: number | null;
  depth_max_m: number | null;
  depth_accuracy_m: number | null;

  // Location description
  location_kind: string | null;
  location_name: string | null;
  location_description: string | null;
  sampling_location_information: string | null;

  // Sample characteristics
  lithology: string | null;
  mineral_type: string | null;
  analysis_method: string | null; // Legacy field
  sample_method: string | null; // Alias for sample_collection_method

  // Stratigraphic context
  stratigraphic_unit: string | null;
  chronostratigraphic_unit_age: string | null;
  chronostrat_age_min_ma: number | null;
  chronostrat_age_max_ma: number | null;
  sample_age_ma: number | null;
  stratigraphic_info: string | null;

  // Collection provenance
  collection_date_min: Date | null;
  collection_date_max: Date | null;
  collection_date_exact: Date | null;

  // Archive and documentation
  last_known_sample_archive: string | null;
  archive_additional_info: string | null;
  funding_grant_id: string | null;
  associated_references: string | null;
  keywords: string | null;

  // Data availability (calculated)
  n_aft_grains: number | null;
  n_ahe_grains: number | null;

  // Metadata
  created_at: Date;
  updated_at: Date;
}

export interface SamplePersonRole {
  id: number;
  sample_id: string;
  person_id: number;
  role: string; // collector, chief_investigator, investigator, etc.
  created_at: Date;
}

export interface Batch {
  id: number;
  batch_name: string;
  analysis_date: Date | null;
  laboratory: string | null;
  analytical_session: string | null;

  // Irradiation metadata (FT only)
  irradiation_id: string | null;
  irradiation_reactor: string | null;
  thermal_neutron_dose: number | null;

  created_at: Date;
}

export interface ReferenceMaterial {
  id: number;
  batch_id: number;
  material_name: string;
  material_type: string | null;

  // Expected values
  expected_age_ma: number | null;
  expected_age_error_ma: number | null;

  // Measured values
  measured_age_ma: number | null;
  measured_age_error_ma: number | null;

  // Other parameters
  parameter_type: string | null;
  measured_value: number | null;
  expected_value: number | null;
  error: number | null;

  created_at: Date;
}

export interface Mount {
  id: number;
  mount_id: string;
  mount_name: string | null;
  mount_date: Date | null;
  sample_id: string | null;

  // Etching (if done at mount level)
  etchant_chemical: string | null;
  etch_duration_seconds: number | null;
  etch_temperature_c: number | null;

  created_at: Date;
}

export interface Grain {
  id: number;
  grain_id: string;
  mount_id: string | null;
  grain_identifier: string | null;

  // Grain characteristics
  grain_morphology: string | null;
  grain_quality: string | null;

  created_at: Date;
}

// =============================================================================
// FISSION-TRACK DATAPOINT (CORE NEW CONCEPT)
// =============================================================================

export interface FTDatapoint {
  id: number;
  sample_id: string;
  datapoint_key: string;
  batch_id: number | null;

  // Provenance
  laboratory: string | null;
  analyst_orcid: string | null;
  analysis_date: Date | null;
  publication_doi: string | null;

  // Method metadata
  mineral_type: string | null;
  ft_method: string | null; // EDM, LA-ICP-MS, Population
  ft_software: string | null;
  ft_algorithm: string | null;
  u_determination_method: string | null;

  // Whole-rock summary stats
  n_grains: number | null;
  total_area_cm2: number | null;
  mean_rho_s: number | null;
  total_Ns: number | null;
  mean_rho_i: number | null;
  total_Ni: number | null;
  mean_rho_d: number | null;
  total_Nd: number | null;
  dosimeter: string | null;

  // Kinetic parameters (aggregate)
  mean_U_ppm: number | null;
  sd_U_ppm: number | null;
  mean_Dpar_um: number | null;
  se_Dpar_um: number | null;
  n_Dpar_measurements: number | null;
  mean_Dper_um: number | null;
  se_Dper_um: number | null;
  n_Dper_measurements: number | null;
  mean_rmr0: number | null;
  sd_rmr0: number | null;
  mean_kappa: number | null;
  sd_kappa: number | null;
  rmr0_equation: string | null;

  // Statistical tests
  chi_square: number | null;
  P_chi2_pct: number | null;
  dispersion_pct: number | null;

  // Age results
  age_equation: string | null;
  mean_age_ma: number | null;
  mean_age_error_ma: number | null;
  central_age_ma: number | null;
  central_age_error_ma: number | null;
  pooled_age_ma: number | null;
  pooled_age_error_ma: number | null;
  population_age_ma: number | null;
  population_age_error_ma: number | null;
  age_error_type: string | null;
  age_comment: string | null;

  // Track length summary
  mean_track_length_um: number | null;
  se_mean_track_length_um: number | null;
  n_track_measurements: number | null;
  sd_track_length_um: number | null;

  // Etching conditions
  cf252_irradiation: boolean | null;
  etchant_chemical: string | null;
  etch_duration_seconds: number | null;
  etch_temperature_c: number | null;

  // Calibration (EDM method)
  zeta_yr_cm2: number | null;
  zeta_error_yr_cm2: number | null;
  zeta_error_type: string | null;

  // Absolute dating (LA-ICP-MS method)
  R_um: number | null;

  // Decay constants
  lambda_D: string | null;
  lambda_f: string | null;
  q_factor: number | null;

  // Irradiation (EDM only)
  irradiation_reactor: string | null;
  thermal_neutron_dose: number | null;
  irradiation_batch_id: string | null;

  created_at: Date;
}

export interface FTCountData {
  id: number;
  ft_datapoint_id: number;
  grain_id: string;

  // Count data
  counting_area_cm2: number | null;
  Ns: number | null;
  rho_s_cm2: number | null;
  Ni: number | null;
  rho_i_cm2: number | null;
  Nd: number | null;
  rho_d_cm2: number | null;

  // Kinetic parameters (grain-specific)
  Dpar_um: number | null;
  Dpar_error_um: number | null;
  n_Dpar_measurements: number | null;
  Dper_um: number | null;
  Dper_error_um: number | null;
  n_Dper_measurements: number | null;
  Dpar_Dper_error_type: string | null;

  // Comments
  comments: string | null;

  created_at: Date;
}

export interface FTSingleGrainAge {
  id: number;
  ft_datapoint_id: number;
  grain_id: string;
  mount_id: string | null;

  // Etching
  etch_duration_seconds: number | null;

  // Chemistry
  U_ppm: number | null;
  U_ppm_error: number | null;
  U_Ca_ratio: number | null;
  U_Ca_ratio_error: number | null;
  U_Ca_error_type: string | null;

  // Kinetic parameters
  rmr0: number | null;
  kappa: number | null;

  // Age
  grain_age_ma: number | null;
  grain_age_error_ma: number | null;
  grain_age_error_type: string | null;

  // Comments
  comments: string | null;

  created_at: Date;
}

export interface FTTrackLengthData {
  id: number;
  ft_datapoint_id: number;
  grain_id: string;
  track_id: string;

  // Track classification
  track_type: 'TINT' | 'TINCLE' | 'semi-track' | null;
  mount_id: string | null;
  etch_duration_seconds: number | null;

  // Length measurements
  apparent_length_um: number | null;
  corrected_z_depth_um: number | null;
  true_length_um: number | null;

  // Orientation
  azimuth_deg: number | null;
  dip_deg: number | null;
  angle_to_c_axis_deg: number | null;
  c_axis_corrected_length_um: number | null;

  // Kinetic parameters (for this grain)
  Dpar_um: number | null;
  Dpar_error_um: number | null;
  n_Dpar_measurements: number | null;
  Dper_um: number | null;
  Dper_error_um: number | null;
  n_Dper_measurements: number | null;
  Dpar_Dper_error_type: string | null;

  // Composition
  rmr0: number | null;
  kappa: number | null;

  // Comments
  comments: string | null;

  created_at: Date;
}

export interface FTBinnedLengthData {
  id: number;
  ft_datapoint_id: number;
  mount_id: string | null;
  etch_duration_seconds: number | null;

  // Histogram bins (20 bins of 1 µm each)
  bin_0_1_um: number | null;
  bin_1_2_um: number | null;
  bin_2_3_um: number | null;
  bin_3_4_um: number | null;
  bin_4_5_um: number | null;
  bin_5_6_um: number | null;
  bin_6_7_um: number | null;
  bin_7_8_um: number | null;
  bin_8_9_um: number | null;
  bin_9_10_um: number | null;
  bin_10_11_um: number | null;
  bin_11_12_um: number | null;
  bin_12_13_um: number | null;
  bin_13_14_um: number | null;
  bin_14_15_um: number | null;
  bin_15_16_um: number | null;
  bin_16_17_um: number | null;
  bin_17_18_um: number | null;
  bin_18_19_um: number | null;
  bin_19_20_um: number | null;

  // Kinetic parameters
  Dpar_um: number | null;
  Dpar_error_um: number | null;
  n_Dpar_measurements: number | null;
  Dper_um: number | null;
  Dper_error_um: number | null;
  n_Dper_measurements: number | null;
  Dpar_Dper_error_type: string | null;

  // Comments
  comments: string | null;

  created_at: Date;
}

// =============================================================================
// (U-Th)/He DATAPOINT
// =============================================================================

export interface HeDatapoint {
  id: number;
  sample_id: string;
  datapoint_key: string;
  batch_id: number | null;

  // Provenance
  laboratory: string | null;
  analyst_orcid: string | null;
  analysis_date: Date | null;
  publication_doi: string | null;

  // Method metadata
  mineral_type: string | null;
  he_analysis_method: string | null;
  he_software: string | null;
  he_measurement_mass_spec: string | null;

  // Aliquot characteristics
  n_aliquots: number | null;
  mean_radius_um: number | null;
  mean_mass_ug: number | null;

  // Helium analysis
  he_analysis_gas_purity_method: string | null;
  he_analysis_pit_volume_software: string | null;
  he_alpha_stopping_power_calc: string | null;

  // Summary statistics
  mean_he4_uncorr_age_ma: number | null;
  se_mean_he4_uncorr_age_ma: number | null;
  mean_he4_corr_age_ma: number | null;
  se_mean_he4_corr_age_ma: number | null;
  weighted_mean_he4_uncorr_age_ma: number | null;
  weighted_mean_he4_uncorr_age_error_ma: number | null;
  weighted_mean_he4_corr_age_ma: number | null;
  weighted_mean_he4_corr_age_error_ma: number | null;

  // QC statistics
  chi_square: number | null;
  MSWD: number | null;
  IQR_pct: number | null;

  created_at: Date;
}

export interface HeWholeGrainData {
  id: number;
  he_datapoint_id: number;
  grain_id: string;
  mount_id: string | null;

  // Grain dimensions
  length_um: number | null;
  length_error_um: number | null;
  width_um: number | null;
  width_error_um: number | null;
  height_um: number | null;
  pyramidal_termination_lengths_um: string | null; // Comma-separated
  grain_shape: string | null;

  // Volumes and surfaces
  raw_volume_um3: number | null;
  surface_area_um2: number | null;
  sa_to_vol_ratio: number | null;

  // Ft corrections
  Ft_value: number | null;
  Ft_correction_model: string | null;

  // Parent isotopes (absolute)
  He4_ncc: number | null;
  He4_ncc_error: number | null;
  U238_ng: number | null;
  U238_ng_error: number | null;
  Th232_ng: number | null;
  Th232_ng_error: number | null;
  Sm147_ng: number | null;
  Sm147_ng_error: number | null;

  // Parent isotopes (concentrations)
  U_ppm: number | null;
  U_ppm_error: number | null;
  Th_ppm: number | null;
  Th_ppm_error: number | null;
  Sm_ppm: number | null;
  Sm_ppm_error: number | null;
  eU_ppm: number | null;
  eU_ppm_error: number | null;

  // Helium (concentration)
  He4_nmol_g: number | null;
  He4_nmol_g_error: number | null;

  // Ages
  he4_uncorr_age_ma: number | null;
  he4_uncorr_age_error_ma: number | null;
  he4_corr_age_ma: number | null;
  he4_corr_age_error_ma: number | null;
  age_error_type: string | null;

  // Mass and density
  mass_ug: number | null;
  mass_error_ug: number | null;
  density_g_cm3: number | null;

  // Grain characterization
  grain_morphology: string | null;
  grain_quality: string | null;
  mineral_type: string | null;

  // Other isotopes
  U235_ng: number | null;
  He3_fcc: number | null;

  // Ratios
  Th_U_ratio: number | null;
  Sm_eU_ratio: number | null;

  // Comments
  comments: string | null;

  created_at: Date;
}

// =============================================================================
// LEGACY TYPES (For backward compatibility - DEPRECATED)
// =============================================================================
// These types are from schema v1 and are kept for backward compatibility
// with existing code. New code should use FTDatapoint instead.
// =============================================================================

/** @deprecated Use FTDatapoint instead */
export interface FTCounts {
  id: number;
  sample_id: string;
  grain_id: string;
  Ns: number | null;
  rho_s_cm2: number | null;
  U_ppm: number | null;
  U_1sigma: number | null;
  Th_ppm: number | null;
  Th_1sigma: number | null;
  eU_ppm: number | null;
  eU_1sigma: number | null;
  Dpar_um: number | null;
  Dpar_sd_um: number | null;
  Dper_um: number | null;
  Dper_sd_um: number | null;
  Cl_wt_pct: number | null;
  eCl_apfu: number | null;
  rmr0: number | null;
  rmr0D: number | null;
  P_chi2_pct: number | null;
  Disp_pct: number | null;
  n_grains: number | null;
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
  Ni: number | null;
  Nd: number | null;
  rho_i_cm2: number | null;
  rho_d_cm2: number | null;
  dosimeter: string | null;
  created_at: Date;
}

/** @deprecated Use FTTrackLengthData instead */
export interface FTTrackLengths {
  id: number;
  sample_id: string;
  grain_id: string;
  n_confined_tracks: number | null;
  mean_track_length_um: number | null;
  mean_track_length_se_um: number | null;
  mean_track_length_sd_um: number | null;
  Dpar_um: number | null;
  Dpar_sd_um: number | null;
  Dper_um: number | null;
  Dper_sd_um: number | null;
  apparent_length_um: number | null;
  true_length_um: number | null;
  angle_to_c_axis_deg: number | null;
  etching_conditions: string | null;
  analyst: string | null;
  laboratory: string | null;
  analysis_date: Date | null;
  created_at: Date;
}

/** @deprecated Use FTDatapoint instead */
export interface FTAges {
  id: number;
  sample_id: string;
  age_equation: string | null;
  ft_age_type: string | null;
  lambda_D: string | null;
  lambda_f: string | null;
  zeta_yr_cm2: number | null;
  zeta_error_yr_cm2: number | null;
  dosimeter: string | null;
  Rs_um: number | null;
  q: number | null;
  irradiation_reactor: string | null;
  n_grains: number | null;
  pooled_age_ma: number | null;
  pooled_age_error_ma: number | null;
  central_age_ma: number | null;
  central_age_error_ma: number | null;
  dispersion_pct: number | null;
  P_chi2: number | null;
  age_peak_software: string | null;
  best_fit_peak_ages_ma: number[] | null;
  best_fit_peak_errors_ma: number[] | null;
  best_fit_peak_grain_pct: number[] | null;
  created_at: Date;
}

/** @deprecated Use HeWholeGrainData instead */
export interface AHeGrainData {
  id: number;
  sample_id: string;
  lab_no: string | null;
  length_um: number | null;
  half_width_um: number | null;
  Rs_um: number | null;
  mass_mg: number | null;
  terminations: string | null;
  U_ppm: number | null;
  Th_ppm: number | null;
  Sm_ppm: number | null;
  eU_ppm: number | null;
  He_ncc: number | null;
  uncorr_age_ma: number | null;
  corr_age_ma: number | null;
  corr_age_1sigma_ma: number | null;
  FT: number | null;
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

  // AFT summary (from first datapoint)
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

  // Ages (from first datapoint)
  central_age_ma: number | null;
  central_age_error_ma: number | null;
  pooled_age_ma: number | null;
  pooled_age_error_ma: number | null;

  // Track lengths
  mean_track_length_um: number | null;
  mean_track_length_sd_um: number | null;
  n_confined_tracks: number | null;

  // Counts (from first datapoint)
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
  ft_datapoints: FTDatapoint[];
  he_datapoints: HeDatapoint[];
  ft_count_data: FTCountData[];
  he_whole_grain_data: HeWholeGrainData[];
}

export interface DatasetStatsResponse {
  total_samples: number;
  total_ft_datapoints: number;
  total_he_datapoints: number;
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

// =============================================================================
// LEGACY RESPONSE TYPES (For backward compatibility - DEPRECATED)
// =============================================================================

/** @deprecated Use SampleDetailResponse instead */
export interface SampleDetailResponseV1 {
  sample: Sample;
  ft_counts: FTCounts | null;
  ft_track_lengths: FTTrackLengths | null;
  ft_ages: FTAges | null;
  ahe_grains: AHeGrainData[];
}

// =============================================================================
// UTILITY TYPES
// =============================================================================

export type DatapointType = 'FT' | 'He';
export type FTMethod = 'EDM' | 'LA-ICP-MS' | 'Population';
export type TrackType = 'TINT' | 'TINCLE' | 'semi-track';
export type PrivacyStatus = 'public' | 'embargo' | 'private';
