/**
 * Database Queries - Thermochronology Data - Schema v2
 *
 * Prepared SQL queries for common operations
 * All queries use parameterized statements to prevent SQL injection
 *
 * CRITICAL: Schema v2 uses DATAPOINT architecture
 * - Old: 1 sample → 1 analysis
 * - New: 1 sample → many datapoints (analytical sessions)
 *
 * @module lib/db/queries
 * @version 2.0.0
 */

import { query, queryOne } from './connection';
import {
  Sample,
  SampleSummary,
  AFTComplete,
  FTDatapoint,
  HeDatapoint,
  FTCountData,
  FTSingleGrainAge,
  FTTrackLengthData,
  HeWholeGrainData,
  Batch,
  ReferenceMaterial,
  Person,
  SampleFilters,
  FTDataFilters,
  AHeDataFilters,
  PaginatedResponse,
  SampleDetailResponse,
  DatasetStatsResponse,
  Dataset,
  DataFile,
  FairScoreBreakdown,
  // Legacy types (for backward compatibility)
  FTCounts,
  FTTrackLengths,
  FTAges,
  AHeGrainData,
  SampleDetailResponseV1,
} from '@/lib/types/thermo-data';

// =============================================================================
// SAMPLES
// =============================================================================

/**
 * Get all samples with optional filtering
 */
export async function getAllSamples(
  filters?: SampleFilters,
  limit: number = 50,
  offset: number = 0,
  sortBy: 'sample_id' | 'elevation_m' | 'mineral_type' = 'sample_id',
  sortOrder: 'asc' | 'desc' = 'asc'
): Promise<PaginatedResponse<Sample>> {
  let sql = 'SELECT * FROM samples WHERE 1=1';
  const params: any[] = [];
  let paramCount = 1;

  // Apply filters
  if (filters?.dataset_id) {
    sql += ` AND dataset_id = $${paramCount++}`;
    params.push(filters.dataset_id);
  }

  if (filters?.mineral_type) {
    sql += ` AND mineral_type = $${paramCount++}`;
    params.push(filters.mineral_type);
  }

  if (filters?.lithology) {
    sql += ` AND lithology ILIKE $${paramCount++}`;
    params.push(`%${filters.lithology}%`);
  }

  if (filters?.min_elevation_m !== undefined) {
    sql += ` AND elevation_m >= $${paramCount++}`;
    params.push(filters.min_elevation_m);
  }

  if (filters?.max_elevation_m !== undefined) {
    sql += ` AND elevation_m <= $${paramCount++}`;
    params.push(filters.max_elevation_m);
  }

  if (filters?.has_aft) {
    sql += ` AND n_aft_grains > 0`;
  }

  if (filters?.has_ahe) {
    sql += ` AND n_ahe_grains > 0`;
  }

  // Get total count
  const countResult = await query<{ count: string }>(`SELECT COUNT(*) as count FROM (${sql}) as filtered`, params);
  const total = parseInt(countResult[0]?.count || '0', 10);

  // Apply sorting and pagination
  sql += ` ORDER BY ${sortBy} ${sortOrder.toUpperCase()} LIMIT $${paramCount++} OFFSET $${paramCount++}`;
  params.push(limit, offset);

  const data = await query<Sample>(sql, params);

  return {
    data,
    total,
    limit,
    offset,
    hasMore: offset + limit < total,
  };
}

/**
 * Get sample summary with AFT and AHe data
 * Uses backward compatibility view
 */
export async function getSampleSummaries(
  filters?: SampleFilters,
  limit: number = 50,
  offset: number = 0
): Promise<PaginatedResponse<SampleSummary>> {
  let sql = 'SELECT * FROM vw_sample_summary WHERE 1=1';
  const params: any[] = [];
  let paramCount = 1;

  // Apply filters (similar to getAllSamples)
  if (filters?.dataset_id) {
    sql += ` AND dataset_id = $${paramCount++}`;
    params.push(filters.dataset_id);
  }

  if (filters?.mineral_type) {
    sql += ` AND mineral_type = $${paramCount++}`;
    params.push(filters.mineral_type);
  }

  // Get total count
  const countResult = await query<{ count: string }>(`SELECT COUNT(*) as count FROM (${sql}) as filtered`, params);
  const total = parseInt(countResult[0]?.count || '0', 10);

  // Apply pagination
  sql += ` ORDER BY sample_id ASC LIMIT $${paramCount++} OFFSET $${paramCount++}`;
  params.push(limit, offset);

  const data = await query<SampleSummary>(sql, params);

  return {
    data,
    total,
    limit,
    offset,
    hasMore: offset + limit < total,
  };
}

/**
 * Get single sample by ID
 */
export async function getSampleById(sampleId: string): Promise<Sample | null> {
  return await queryOne<Sample>(
    'SELECT * FROM samples WHERE sample_id = $1',
    [sampleId]
  );
}

/**
 * Get complete sample details with all related data (SCHEMA V2)
 * Returns ARRAYS of datapoints (not single records)
 */
export async function getSampleDetail(sampleId: string): Promise<SampleDetailResponse | null> {
  const sample = await getSampleById(sampleId);
  if (!sample) return null;

  const [ftDatapoints, heDatapoints, ftCountData, heGrainData] = await Promise.all([
    query<FTDatapoint>('SELECT * FROM ft_datapoints WHERE sample_id = $1 ORDER BY id', [sampleId]),
    query<HeDatapoint>('SELECT * FROM he_datapoints WHERE sample_id = $1 ORDER BY id', [sampleId]),
    query<FTCountData>(
      `SELECT fcd.* FROM ft_count_data fcd
       JOIN ft_datapoints ftd ON fcd.ft_datapoint_id = ftd.id
       WHERE ftd.sample_id = $1
       ORDER BY fcd.ft_datapoint_id, fcd.grain_id`,
      [sampleId]
    ),
    query<HeWholeGrainData>(
      `SELECT hgd.* FROM he_whole_grain_data hgd
       JOIN he_datapoints hed ON hgd.he_datapoint_id = hed.id
       WHERE hed.sample_id = $1
       ORDER BY hgd.he_datapoint_id, hgd.grain_id`,
      [sampleId]
    ),
  ]);

  return {
    sample,
    ft_datapoints: ftDatapoints,
    he_datapoints: heDatapoints,
    ft_count_data: ftCountData,
    he_whole_grain_data: heGrainData,
  };
}

// =============================================================================
// FISSION-TRACK DATAPOINTS (Schema v2)
// =============================================================================

/**
 * Get all FT datapoints for a sample
 */
export async function getFTDatapointsBySample(sampleId: string): Promise<FTDatapoint[]> {
  return await query<FTDatapoint>(
    'SELECT * FROM ft_datapoints WHERE sample_id = $1 ORDER BY id',
    [sampleId]
  );
}

/**
 * Get single FT datapoint by ID
 */
export async function getFTDatapointById(datapointId: number): Promise<FTDatapoint | null> {
  return await queryOne<FTDatapoint>(
    'SELECT * FROM ft_datapoints WHERE id = $1',
    [datapointId]
  );
}

/**
 * Get FT count data for a specific datapoint
 */
export async function getFTCountDataByDatapoint(datapointId: number): Promise<FTCountData[]> {
  return await query<FTCountData>(
    'SELECT * FROM ft_count_data WHERE ft_datapoint_id = $1 ORDER BY grain_id',
    [datapointId]
  );
}

/**
 * Get FT single grain ages for a specific datapoint
 */
export async function getFTSingleGrainAgesByDatapoint(datapointId: number): Promise<FTSingleGrainAge[]> {
  return await query<FTSingleGrainAge>(
    'SELECT * FROM ft_single_grain_ages WHERE ft_datapoint_id = $1 ORDER BY grain_id',
    [datapointId]
  );
}

/**
 * Get FT track length data for a specific datapoint
 */
export async function getFTTrackLengthDataByDatapoint(datapointId: number): Promise<FTTrackLengthData[]> {
  return await query<FTTrackLengthData>(
    'SELECT * FROM ft_track_length_data WHERE ft_datapoint_id = $1 ORDER BY grain_id, track_id',
    [datapointId]
  );
}

/**
 * Get all AFT data with optional filtering (UPDATED for schema v2)
 * Uses backward compatibility view
 */
export async function getAFTData(
  filters?: FTDataFilters,
  limit: number = 50,
  offset: number = 0
): Promise<PaginatedResponse<AFTComplete>> {
  let sql = 'SELECT * FROM vw_aft_complete WHERE 1=1';
  const params: any[] = [];
  let paramCount = 1;

  // Apply filters
  if (filters?.sample_id) {
    sql += ` AND sample_id = $${paramCount++}`;
    params.push(filters.sample_id);
  }

  if (filters?.min_age_ma !== undefined) {
    sql += ` AND central_age_ma >= $${paramCount++}`;
    params.push(filters.min_age_ma);
  }

  if (filters?.max_age_ma !== undefined) {
    sql += ` AND central_age_ma <= $${paramCount++}`;
    params.push(filters.max_age_ma);
  }

  if (filters?.min_track_length_um !== undefined) {
    sql += ` AND mean_track_length_um >= $${paramCount++}`;
    params.push(filters.min_track_length_um);
  }

  if (filters?.max_track_length_um !== undefined) {
    sql += ` AND mean_track_length_um <= $${paramCount++}`;
    params.push(filters.max_track_length_um);
  }

  if (filters?.min_dispersion_pct !== undefined) {
    sql += ` AND dispersion_pct >= $${paramCount++}`;
    params.push(filters.min_dispersion_pct);
  }

  if (filters?.max_dispersion_pct !== undefined) {
    sql += ` AND dispersion_pct <= $${paramCount++}`;
    params.push(filters.max_dispersion_pct);
  }

  // Get total count
  const countResult = await query<{ count: string }>(`SELECT COUNT(*) as count FROM (${sql}) as filtered`, params);
  const total = parseInt(countResult[0]?.count || '0', 10);

  // Apply pagination
  sql += ` ORDER BY sample_id ASC LIMIT $${paramCount++} OFFSET $${paramCount++}`;
  params.push(limit, offset);

  const data = await query<AFTComplete>(sql, params);

  return {
    data,
    total,
    limit,
    offset,
    hasMore: offset + limit < total,
  };
}

// =============================================================================
// (U-Th)/He DATAPOINTS (Schema v2)
// =============================================================================

/**
 * Get all He datapoints for a sample
 */
export async function getHeDatapointsBySample(sampleId: string): Promise<HeDatapoint[]> {
  return await query<HeDatapoint>(
    'SELECT * FROM he_datapoints WHERE sample_id = $1 ORDER BY id',
    [sampleId]
  );
}

/**
 * Get single He datapoint by ID
 */
export async function getHeDatapointById(datapointId: number): Promise<HeDatapoint | null> {
  return await queryOne<HeDatapoint>(
    'SELECT * FROM he_datapoints WHERE id = $1',
    [datapointId]
  );
}

/**
 * Get He whole grain data for a specific datapoint
 */
export async function getHeGrainDataByDatapoint(datapointId: number): Promise<HeWholeGrainData[]> {
  return await query<HeWholeGrainData>(
    'SELECT * FROM he_whole_grain_data WHERE he_datapoint_id = $1 ORDER BY grain_id',
    [datapointId]
  );
}

/**
 * Get all AHe data with optional filtering (UPDATED for schema v2)
 * Queries he_whole_grain_data table
 */
export async function getAHeData(
  filters?: AHeDataFilters,
  limit: number = 100,
  offset: number = 0
): Promise<PaginatedResponse<HeWholeGrainData>> {
  let sql = `
    SELECT hgd.*
    FROM he_whole_grain_data hgd
    JOIN he_datapoints hed ON hgd.he_datapoint_id = hed.id
    WHERE 1=1
  `;
  const params: any[] = [];
  let paramCount = 1;

  // Apply filters
  if (filters?.sample_id) {
    sql += ` AND hed.sample_id = $${paramCount++}`;
    params.push(filters.sample_id);
  }

  if (filters?.min_age_ma !== undefined) {
    sql += ` AND hgd.he4_corr_age_ma >= $${paramCount++}`;
    params.push(filters.min_age_ma);
  }

  if (filters?.max_age_ma !== undefined) {
    sql += ` AND hgd.he4_corr_age_ma <= $${paramCount++}`;
    params.push(filters.max_age_ma);
  }

  if (filters?.min_eU_ppm !== undefined) {
    sql += ` AND hgd.eU_ppm >= $${paramCount++}`;
    params.push(filters.min_eU_ppm);
  }

  if (filters?.max_eU_ppm !== undefined) {
    sql += ` AND hgd.eU_ppm <= $${paramCount++}`;
    params.push(filters.max_eU_ppm);
  }

  // Get total count
  const countResult = await query<{ count: string }>(`SELECT COUNT(*) as count FROM (${sql}) as filtered`, params);
  const total = parseInt(countResult[0]?.count || '0', 10);

  // Apply pagination
  sql += ` ORDER BY hed.sample_id, hgd.grain_id ASC LIMIT $${paramCount++} OFFSET $${paramCount++}`;
  params.push(limit, offset);

  const data = await query<HeWholeGrainData>(sql, params);

  return {
    data,
    total,
    limit,
    offset,
    hasMore: offset + limit < total,
  };
}

// =============================================================================
// BATCHES & QC
// =============================================================================

/**
 * Get all batches
 */
export async function getAllBatches(): Promise<Batch[]> {
  return await query<Batch>('SELECT * FROM batches ORDER BY batch_name');
}

/**
 * Get single batch by ID
 */
export async function getBatchById(batchId: number): Promise<Batch | null> {
  return await queryOne<Batch>('SELECT * FROM batches WHERE id = $1', [batchId]);
}

/**
 * Get reference materials for a batch
 */
export async function getReferenceMaterialsByBatch(batchId: number): Promise<ReferenceMaterial[]> {
  return await query<ReferenceMaterial>(
    'SELECT * FROM reference_materials WHERE batch_id = $1 ORDER BY material_name',
    [batchId]
  );
}

// =============================================================================
// PEOPLE & PROVENANCE
// =============================================================================

/**
 * Get all people
 */
export async function getAllPeople(): Promise<Person[]> {
  return await query<Person>('SELECT * FROM people ORDER BY name');
}

/**
 * Get person by ID
 */
export async function getPersonById(personId: number): Promise<Person | null> {
  return await queryOne<Person>('SELECT * FROM people WHERE id = $1', [personId]);
}

/**
 * Get person by ORCID
 */
export async function getPersonByOrcid(orcid: string): Promise<Person | null> {
  return await queryOne<Person>('SELECT * FROM people WHERE orcid = $1', [orcid]);
}

// =============================================================================
// STATISTICS & ANALYTICS (UPDATED for schema v2)
// =============================================================================

/**
 * Get dataset statistics (UPDATED for schema v2)
 */
export async function getDatasetStats(datasetId: number = 1): Promise<DatasetStatsResponse> {
  const sql = `
    SELECT
      COUNT(DISTINCT s.sample_id) as total_samples,
      COUNT(DISTINCT ftd.id) as total_ft_datapoints,
      COUNT(DISTINCT hed.id) as total_he_datapoints,
      COUNT(DISTINCT CASE WHEN ftd.id IS NOT NULL THEN s.sample_id END) as total_aft_analyses,
      SUM(s.n_ahe_grains) as total_ahe_grains,
      MIN(ftd.central_age_ma) as aft_min_age,
      MAX(ftd.central_age_ma) as aft_max_age,
      MIN(hgd.he4_corr_age_ma) as ahe_min_age,
      MAX(hgd.he4_corr_age_ma) as ahe_max_age,
      MIN(s.elevation_m) as min_elevation,
      MAX(s.elevation_m) as max_elevation
    FROM samples s
    LEFT JOIN ft_datapoints ftd ON s.sample_id = ftd.sample_id
    LEFT JOIN he_datapoints hed ON s.sample_id = hed.sample_id
    LEFT JOIN he_whole_grain_data hgd ON hed.id = hgd.he_datapoint_id
    WHERE s.dataset_id = $1
  `;

  const row = await queryOne<{
    total_samples: string;
    total_ft_datapoints: string;
    total_he_datapoints: string;
    total_aft_analyses: string;
    total_ahe_grains: string;
    aft_min_age: number;
    aft_max_age: number;
    ahe_min_age: number;
    ahe_max_age: number;
    min_elevation: number;
    max_elevation: number;
  }>(sql, [datasetId]);

  return {
    total_samples: parseInt(row?.total_samples || '0', 10),
    total_ft_datapoints: parseInt(row?.total_ft_datapoints || '0', 10),
    total_he_datapoints: parseInt(row?.total_he_datapoints || '0', 10),
    total_aft_analyses: parseInt(row?.total_aft_analyses || '0', 10),
    total_ahe_grains: parseInt(row?.total_ahe_grains || '0', 10),
    age_range_ma: {
      aft_min: row?.aft_min_age || null,
      aft_max: row?.aft_max_age || null,
      ahe_min: row?.ahe_min_age || null,
      ahe_max: row?.ahe_max_age || null,
    },
    elevation_range_m: {
      min: row?.min_elevation || null,
      max: row?.max_elevation || null,
    },
  };
}

/**
 * Search samples by location
 */
export async function searchSamplesByLocation(
  minLat: number,
  maxLat: number,
  minLon: number,
  maxLon: number
): Promise<Sample[]> {
  const sql = `
    SELECT * FROM samples
    WHERE latitude BETWEEN $1 AND $2
    AND longitude BETWEEN $3 AND $4
    ORDER BY sample_id
  `;

  return await query<Sample>(sql, [minLat, maxLat, minLon, maxLon]);
}

// =============================================================================
// DATASETS
// =============================================================================

/**
 * Get all datasets/papers with optional filtering
 */
export async function getAllDatasets(): Promise<Dataset[]> {
  const sql = `
    SELECT * FROM datasets
    ORDER BY id ASC
  `;

  return await query<Dataset>(sql);
}

/**
 * Get single dataset by ID
 */
export async function getDatasetById(id: number): Promise<Dataset | null> {
  const sql = `
    SELECT * FROM datasets
    WHERE id = $1
  `;

  return await queryOne<Dataset>(sql, [id]);
}

/**
 * Get FAIR score breakdown for a dataset
 * Returns detailed FAIR compliance assessment
 */
export async function getFairScoreBreakdown(datasetId: number): Promise<FairScoreBreakdown | null> {
  const sql = `
    SELECT * FROM fair_score_breakdown
    WHERE dataset_id = $1
  `;

  return await queryOne<FairScoreBreakdown>(sql, [datasetId]);
}

// =============================================================================
// DATA FILES
// =============================================================================

/**
 * Get all data files for a specific dataset
 */
export async function getDataFilesByDataset(datasetId: number): Promise<DataFile[]> {
  const sql = `
    SELECT * FROM data_files
    WHERE dataset_id = $1
    ORDER BY file_type, file_name
  `;

  return await query<DataFile>(sql, [datasetId]);
}

/**
 * Get total file size for a dataset
 */
export async function getDatasetTotalFileSize(datasetId: number): Promise<number> {
  const sql = `
    SELECT COALESCE(SUM(file_size_bytes), 0) as total_size
    FROM data_files
    WHERE dataset_id = $1
  `;

  const rows = await query<{ total_size: string }>(sql, [datasetId]);
  return rows.length > 0 && rows[0] ? parseInt(rows[0].total_size, 10) : 0;
}

// =============================================================================
// LEGACY FUNCTIONS (For backward compatibility - DEPRECATED)
// =============================================================================
// These functions are kept for backward compatibility with schema v1 code.
// They query the backward compatibility views (vw_aft_complete, vw_sample_summary).
// New code should use the datapoint-aware functions above.
// =============================================================================

/**
 * Get FT ages by sample ID
 * @deprecated Use getFTDatapointsBySample() instead - schema v2 has multiple datapoints per sample
 */
export async function getFTAgesBySample(sampleId: string): Promise<FTAges | null> {
  // Query first datapoint only for backward compatibility
  const datapoint = await queryOne<FTDatapoint>(
    'SELECT * FROM ft_datapoints WHERE sample_id = $1 ORDER BY id LIMIT 1',
    [sampleId]
  );

  if (!datapoint) return null;

  // Map FTDatapoint to legacy FTAges type
  return {
    id: datapoint.id,
    sample_id: datapoint.sample_id,
    age_equation: datapoint.age_equation,
    ft_age_type: datapoint.ft_method,
    lambda_D: datapoint.lambda_D,
    lambda_f: datapoint.lambda_f,
    zeta_yr_cm2: datapoint.zeta_yr_cm2,
    zeta_error_yr_cm2: datapoint.zeta_error_yr_cm2,
    dosimeter: datapoint.dosimeter,
    Rs_um: datapoint.R_um,
    q: datapoint.q_factor,
    irradiation_reactor: datapoint.irradiation_reactor,
    n_grains: datapoint.n_grains,
    pooled_age_ma: datapoint.pooled_age_ma,
    pooled_age_error_ma: datapoint.pooled_age_error_ma,
    central_age_ma: datapoint.central_age_ma,
    central_age_error_ma: datapoint.central_age_error_ma,
    dispersion_pct: datapoint.dispersion_pct,
    P_chi2: datapoint.P_chi2_pct,
    age_peak_software: null,
    best_fit_peak_ages_ma: null,
    best_fit_peak_errors_ma: null,
    best_fit_peak_grain_pct: null,
    created_at: datapoint.created_at,
  };
}

/**
 * Get FT track lengths by sample ID
 * @deprecated Use getFTTrackLengthDataByDatapoint() instead - schema v2 has granular track data
 */
export async function getFTLengthsBySample(sampleId: string): Promise<FTTrackLengths | null> {
  // Query first datapoint only for backward compatibility
  const datapoint = await queryOne<FTDatapoint>(
    'SELECT * FROM ft_datapoints WHERE sample_id = $1 ORDER BY id LIMIT 1',
    [sampleId]
  );

  if (!datapoint) return null;

  // Map to legacy type (summary statistics only)
  return {
    id: datapoint.id,
    sample_id: datapoint.sample_id,
    grain_id: 'summary', // No grain_id in datapoint table
    n_confined_tracks: datapoint.n_track_measurements,
    mean_track_length_um: datapoint.mean_track_length_um,
    mean_track_length_se_um: datapoint.se_mean_track_length_um,
    mean_track_length_sd_um: datapoint.sd_track_length_um,
    Dpar_um: datapoint.mean_Dpar_um,
    Dpar_sd_um: datapoint.se_Dpar_um,
    Dper_um: datapoint.mean_Dper_um,
    Dper_sd_um: datapoint.se_Dper_um,
    apparent_length_um: null,
    true_length_um: null,
    angle_to_c_axis_deg: null,
    etching_conditions: datapoint.etchant_chemical,
    analyst: null, // Use analyst_orcid in schema v2
    laboratory: datapoint.laboratory,
    analysis_date: datapoint.analysis_date,
    created_at: datapoint.created_at,
  };
}

/**
 * Get FT counts by sample ID
 * @deprecated Use getFTCountDataByDatapoint() instead - schema v2 has count data per datapoint
 */
export async function getFTCountsBySample(sampleId: string): Promise<FTCounts | null> {
  // Query first datapoint for backward compatibility
  const datapoint = await queryOne<FTDatapoint>(
    'SELECT * FROM ft_datapoints WHERE sample_id = $1 ORDER BY id LIMIT 1',
    [sampleId]
  );

  if (!datapoint) return null;

  // Map to legacy type (aggregate data only)
  return {
    id: datapoint.id,
    sample_id: datapoint.sample_id,
    grain_id: 'aggregate',
    Ns: datapoint.total_Ns,
    rho_s_cm2: datapoint.mean_rho_s,
    U_ppm: datapoint.mean_U_ppm,
    U_1sigma: datapoint.sd_U_ppm,
    Th_ppm: null,
    Th_1sigma: null,
    eU_ppm: datapoint.mean_U_ppm, // Approximation
    eU_1sigma: datapoint.sd_U_ppm,
    Dpar_um: datapoint.mean_Dpar_um,
    Dpar_sd_um: datapoint.se_Dpar_um,
    Dper_um: datapoint.mean_Dper_um,
    Dper_sd_um: datapoint.se_Dper_um,
    Cl_wt_pct: null,
    eCl_apfu: null,
    rmr0: datapoint.mean_rmr0,
    rmr0D: null,
    P_chi2_pct: datapoint.P_chi2_pct,
    Disp_pct: datapoint.dispersion_pct,
    n_grains: datapoint.n_grains,
    ft_counting_method: datapoint.ft_method,
    ft_software: datapoint.ft_software,
    ft_algorithm: datapoint.ft_algorithm,
    microscope: null,
    objective: null,
    analyst: null, // Use analyst_orcid in v2
    laboratory: datapoint.laboratory,
    analysis_date: datapoint.analysis_date,
    sample_mount_id: null,
    etching_conditions: datapoint.etchant_chemical,
    counting_area_cm2: datapoint.total_area_cm2,
    Ni: datapoint.total_Ni,
    Nd: datapoint.total_Nd,
    rho_i_cm2: datapoint.mean_rho_i,
    rho_d_cm2: datapoint.mean_rho_d,
    dosimeter: datapoint.dosimeter,
    created_at: datapoint.created_at,
  };
}

/**
 * Get AHe grains by sample ID
 * @deprecated Use getHeGrainDataByDatapoint() instead - schema v2 has He grain data per datapoint
 */
export async function getAHeGrainsBySample(sampleId: string): Promise<AHeGrainData[]> {
  // Query all He grain data for sample (across all datapoints)
  const grainData = await query<HeWholeGrainData>(
    `SELECT hgd.* FROM he_whole_grain_data hgd
     JOIN he_datapoints hed ON hgd.he_datapoint_id = hed.id
     WHERE hed.sample_id = $1
     ORDER BY hgd.grain_id`,
    [sampleId]
  );

  // Map to legacy AHeGrainData type
  return grainData.map((grain) => ({
    id: grain.id,
    sample_id: sampleId,
    lab_no: grain.grain_id,
    length_um: grain.length_um,
    half_width_um: grain.width_um ? grain.width_um / 2 : null,
    Rs_um: grain.length_um && grain.width_um ? Math.min(grain.length_um, grain.width_um) / 2 : null,
    mass_mg: grain.mass_ug ? grain.mass_ug / 1000 : null,
    terminations: grain.pyramidal_termination_lengths_um,
    U_ppm: grain.U_ppm,
    Th_ppm: grain.Th_ppm,
    Sm_ppm: grain.Sm_ppm,
    eU_ppm: grain.eU_ppm,
    He_ncc: grain.He4_ncc,
    uncorr_age_ma: grain.he4_uncorr_age_ma,
    corr_age_ma: grain.he4_corr_age_ma,
    corr_age_1sigma_ma: grain.he4_corr_age_error_ma,
    FT: grain.Ft_value,
    std_run: null,
    thermal_model: grain.Ft_correction_model,
    created_at: grain.created_at,
  }));
}

/**
 * Get sample detail (Legacy v1 response format)
 * @deprecated Use getSampleDetail() instead - returns schema v2 structure with datapoint arrays
 */
export async function getSampleDetailV1(sampleId: string): Promise<SampleDetailResponseV1 | null> {
  const sample = await getSampleById(sampleId);
  if (!sample) return null;

  const [ftCounts, ftLengths, ftAges, aheGrains] = await Promise.all([
    getFTCountsBySample(sampleId),
    getFTLengthsBySample(sampleId),
    getFTAgesBySample(sampleId),
    getAHeGrainsBySample(sampleId),
  ]);

  return {
    sample,
    ft_counts: ftCounts,
    ft_track_lengths: ftLengths,
    ft_ages: ftAges,
    ahe_grains: aheGrains,
  };
}
