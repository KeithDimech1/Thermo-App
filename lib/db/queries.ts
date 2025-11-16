/**
 * Database Queries - Thermochronology Data
 *
 * Prepared SQL queries for common operations
 * All queries use parameterized statements to prevent SQL injection
 *
 * @module lib/db/queries
 */

import { query, queryOne } from './connection';
import {
  Sample,
  SampleSummary,
  AFTComplete,
  FTCounts,
  FTTrackLengths,
  FTAges,
  AHeGrainData,
  SampleFilters,
  FTDataFilters,
  AHeDataFilters,
  PaginatedResponse,
  SampleDetailResponse,
  DatasetStatsResponse,
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

  if (filters?.analysis_method) {
    sql += ` AND analysis_method = $${paramCount++}`;
    params.push(filters.analysis_method);
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
 * Get complete sample details with all related data
 */
export async function getSampleDetail(sampleId: string): Promise<SampleDetailResponse | null> {
  const sample = await getSampleById(sampleId);
  if (!sample) return null;

  const [ftCounts, ftLengths, ftAges, aheGrains] = await Promise.all([
    queryOne<FTCounts>('SELECT * FROM ft_counts WHERE sample_id = $1', [sampleId]),
    queryOne<FTTrackLengths>('SELECT * FROM ft_track_lengths WHERE sample_id = $1', [sampleId]),
    queryOne<FTAges>('SELECT * FROM ft_ages WHERE sample_id = $1', [sampleId]),
    query<AHeGrainData>('SELECT * FROM ahe_grain_data WHERE sample_id = $1 ORDER BY lab_no', [sampleId]),
  ]);

  return {
    sample,
    ft_counts: ftCounts || null,
    ft_track_lengths: ftLengths || null,
    ft_ages: ftAges || null,
    ahe_grains: aheGrains,
  };
}

// =============================================================================
// FISSION-TRACK DATA
// =============================================================================

/**
 * Get all AFT data with optional filtering
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

/**
 * Get FT ages by sample ID
 */
export async function getFTAgesBySample(sampleId: string): Promise<FTAges | null> {
  return await queryOne<FTAges>(
    'SELECT * FROM ft_ages WHERE sample_id = $1',
    [sampleId]
  );
}

/**
 * Get FT track lengths by sample ID
 */
export async function getFTLengthsBySample(sampleId: string): Promise<FTTrackLengths | null> {
  return await queryOne<FTTrackLengths>(
    'SELECT * FROM ft_track_lengths WHERE sample_id = $1',
    [sampleId]
  );
}

/**
 * Get FT counts by sample ID
 */
export async function getFTCountsBySample(sampleId: string): Promise<FTCounts | null> {
  return await queryOne<FTCounts>(
    'SELECT * FROM ft_counts WHERE sample_id = $1',
    [sampleId]
  );
}

// =============================================================================
// (U-Th)/He DATA
// =============================================================================

/**
 * Get all AHe data with optional filtering
 */
export async function getAHeData(
  filters?: AHeDataFilters,
  limit: number = 100,
  offset: number = 0
): Promise<PaginatedResponse<AHeGrainData>> {
  let sql = 'SELECT * FROM ahe_grain_data WHERE 1=1';
  const params: any[] = [];
  let paramCount = 1;

  // Apply filters
  if (filters?.sample_id) {
    sql += ` AND sample_id = $${paramCount++}`;
    params.push(filters.sample_id);
  }

  if (filters?.min_age_ma !== undefined) {
    sql += ` AND corr_age_ma >= $${paramCount++}`;
    params.push(filters.min_age_ma);
  }

  if (filters?.max_age_ma !== undefined) {
    sql += ` AND corr_age_ma <= $${paramCount++}`;
    params.push(filters.max_age_ma);
  }

  if (filters?.min_eU_ppm !== undefined) {
    sql += ` AND eU_ppm >= $${paramCount++}`;
    params.push(filters.min_eU_ppm);
  }

  if (filters?.max_eU_ppm !== undefined) {
    sql += ` AND eU_ppm <= $${paramCount++}`;
    params.push(filters.max_eU_ppm);
  }

  // Get total count
  const countResult = await query<{ count: string }>(`SELECT COUNT(*) as count FROM (${sql}) as filtered`, params);
  const total = parseInt(countResult[0]?.count || '0', 10);

  // Apply pagination
  sql += ` ORDER BY sample_id, lab_no ASC LIMIT $${paramCount++} OFFSET $${paramCount++}`;
  params.push(limit, offset);

  const data = await query<AHeGrainData>(sql, params);

  return {
    data,
    total,
    limit,
    offset,
    hasMore: offset + limit < total,
  };
}

/**
 * Get AHe grains by sample ID
 */
export async function getAHeGrainsBySample(sampleId: string): Promise<AHeGrainData[]> {
  return await query<AHeGrainData>(
    'SELECT * FROM ahe_grain_data WHERE sample_id = $1 ORDER BY lab_no',
    [sampleId]
  );
}

// =============================================================================
// STATISTICS & ANALYTICS
// =============================================================================

/**
 * Get dataset statistics
 */
export async function getDatasetStats(datasetId: number = 1): Promise<DatasetStatsResponse> {
  const sql = `
    SELECT
      COUNT(DISTINCT s.sample_id) as total_samples,
      COUNT(DISTINCT CASE WHEN s.n_aft_grains > 0 THEN s.sample_id END) as total_aft_analyses,
      SUM(s.n_ahe_grains) as total_ahe_grains,
      MIN(fa.central_age_ma) as aft_min_age,
      MAX(fa.central_age_ma) as aft_max_age,
      MIN(ahe.corr_age_ma) as ahe_min_age,
      MAX(ahe.corr_age_ma) as ahe_max_age,
      MIN(s.elevation_m) as min_elevation,
      MAX(s.elevation_m) as max_elevation
    FROM samples s
    LEFT JOIN ft_ages fa ON s.sample_id = fa.sample_id
    LEFT JOIN ahe_grain_data ahe ON s.sample_id = ahe.sample_id
    WHERE s.dataset_id = $1
  `;

  const row = await queryOne<{
    total_samples: string;
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
