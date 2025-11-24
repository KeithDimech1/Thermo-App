/**
 * EarthBank Database Queries - Schema v3 (camelCase)
 *
 * CRITICAL: All queries use double-quoted identifiers for camelCase fields
 * Tables: earthbank_samples, earthbank_ftDatapoints, earthbank_heDatapoints
 * PostgreSQL requirement: "sampleID", "centralAgeMa", "pooledAgeMa"
 *
 * Migration: IDEA-014 (snake_case → camelCase)
 *
 * @module lib/db/earthbank-queries
 * @version 3.0.0
 */

import { query, queryOne } from './connection';
import {
  EarthBankSample,
  EarthBankDataset,
  EarthBankFTDatapoint,
  EarthBankHeDatapoint,
  EarthBankFTTrackLengthData,
  EarthBankHeWholeGrainData,
  EarthBankPaginatedResponse,
  EarthBankSampleDetailResponse,
  EarthBankSampleFilters,
  EarthBankFTDataFilters,
  EarthBankHeDataFilters,
  EarthBankDatasetStats,
} from '@/lib/types/earthbank-types';

// =============================================================================
// SAMPLES
// =============================================================================

/**
 * Get all samples with optional filtering
 */
export async function getAllSamples(
  filters?: EarthBankSampleFilters,
  limit: number = 50,
  offset: number = 0,
  sortBy: 'sampleID' | 'elevationM' | 'mineralType' = 'sampleID',
  sortOrder: 'asc' | 'desc' = 'asc'
): Promise<EarthBankPaginatedResponse<EarthBankSample>> {
  let sql = 'SELECT * FROM "earthbank_samples" WHERE 1=1';
  const params: any[] = [];
  let paramCount = 1;

  // Apply filters
  if (filters?.datasetID) {
    sql += ` AND "datasetID" = $${paramCount++}`;
    params.push(filters.datasetID);
  }

  if (filters?.mineralType) {
    sql += ` AND "mineralType" = $${paramCount++}`;
    params.push(filters.mineralType);
  }

  if (filters?.lithology) {
    sql += ` AND "lithology" ILIKE $${paramCount++}`;
    params.push(`%${filters.lithology}%`);
  }

  if (filters?.minElevationM !== undefined) {
    sql += ` AND "elevationM" >= $${paramCount++}`;
    params.push(filters.minElevationM);
  }

  if (filters?.maxElevationM !== undefined) {
    sql += ` AND "elevationM" <= $${paramCount++}`;
    params.push(filters.maxElevationM);
  }

  // Get total count
  const countResult = await query<{ count: string }>(
    `SELECT COUNT(*) as count FROM (${sql}) as filtered`,
    params
  );
  const total = parseInt(countResult[0]?.count || '0', 10);

  // Add sorting and pagination
  sql += ` ORDER BY "${sortBy}" ${sortOrder.toUpperCase()}`;
  sql += ` LIMIT $${paramCount++} OFFSET $${paramCount++}`;
  params.push(limit, offset);

  const results = await query<EarthBankSample>(sql, params);

  return {
    data: results,
    total,
    limit,
    offset,
    hasMore: offset + limit < total,
  };
}

/**
 * Get a single sample by ID
 */
export async function getSampleById(sampleID: string): Promise<EarthBankSample | null> {
  const sql = 'SELECT * FROM "earthbank_samples" WHERE "sampleID" = $1';
  return queryOne<EarthBankSample>(sql, [sampleID]);
}

/**
 * Get sample detail with all related datapoints
 */
export async function getSampleDetail(sampleID: string): Promise<EarthBankSampleDetailResponse | null> {
  const sample = await getSampleById(sampleID);
  if (!sample) return null;

  // Get FT datapoints
  const ftDatapoints = await getFTDatapointsBySample(sampleID);

  // Get He datapoints
  const heDatapoints = await getHeDatapointsBySample(sampleID);

  // Get FT track length data
  const ftTrackLengthData = await query<EarthBankFTTrackLengthData>(
    'SELECT * FROM "earthbank_ftTrackLengthData" WHERE "datapointName" IN (SELECT "datapointName" FROM "earthbank_ftDatapoints" WHERE "sampleID" = $1)',
    [sampleID]
  );

  // Get He whole grain data
  const heWholeGrainData = await query<EarthBankHeWholeGrainData>(
    'SELECT * FROM "earthbank_heWholeGrainData" WHERE "datapointName" IN (SELECT "datapointName" FROM "earthbank_heDatapoints" WHERE "sampleID" = $1)',
    [sampleID]
  );

  return {
    sample,
    ftDatapoints,
    heDatapoints,
    ftCountData: [], // Table not yet created
    ftTrackLengthData,
    heWholeGrainData,
  };
}

// =============================================================================
// FT DATAPOINTS
// =============================================================================

/**
 * Get all FT datapoints for a sample
 */
export async function getFTDatapointsBySample(sampleID: string): Promise<EarthBankFTDatapoint[]> {
  const sql = 'SELECT * FROM "earthbank_ftDatapoints" WHERE "sampleID" = $1 ORDER BY "datapointName"';
  return query<EarthBankFTDatapoint>(sql, [sampleID]);
}

/**
 * Get a single FT datapoint by name
 */
export async function getFTDatapointByName(datapointName: string): Promise<EarthBankFTDatapoint | null> {
  const sql = 'SELECT * FROM "earthbank_ftDatapoints" WHERE "datapointName" = $1';
  return queryOne<EarthBankFTDatapoint>(sql, [datapointName]);
}

/**
 * Get FT datapoints with age filtering
 */
export async function getFTDatapointsFiltered(
  filters?: EarthBankFTDataFilters,
  limit: number = 50,
  offset: number = 0
): Promise<EarthBankPaginatedResponse<EarthBankFTDatapoint>> {
  let sql = 'SELECT * FROM "earthbank_ftDatapoints" WHERE 1=1';
  const params: any[] = [];
  let paramCount = 1;

  if (filters?.sampleID) {
    sql += ` AND "sampleID" = $${paramCount++}`;
    params.push(filters.sampleID);
  }

  if (filters?.minAgeMa) {
    sql += ` AND "centralAgeMa" >= $${paramCount++}`;
    params.push(filters.minAgeMa);
  }

  if (filters?.maxAgeMa) {
    sql += ` AND "centralAgeMa" <= $${paramCount++}`;
    params.push(filters.maxAgeMa);
  }

  if (filters?.minTrackLengthUm) {
    sql += ` AND "mtl" >= $${paramCount++}`;
    params.push(filters.minTrackLengthUm);
  }

  if (filters?.maxTrackLengthUm) {
    sql += ` AND "mtl" <= $${paramCount++}`;
    params.push(filters.maxTrackLengthUm);
  }

  if (filters?.minDispersionPct) {
    sql += ` AND "dispersion" >= $${paramCount++}`;
    params.push(filters.minDispersionPct);
  }

  if (filters?.maxDispersionPct) {
    sql += ` AND "dispersion" <= $${paramCount++}`;
    params.push(filters.maxDispersionPct);
  }

  // Get total count
  const countResult = await query<{ count: string }>(
    `SELECT COUNT(*) as count FROM (${sql}) as filtered`,
    params
  );
  const total = parseInt(countResult[0]?.count || '0', 10);

  // Add pagination
  sql += ` ORDER BY "centralAgeMa" DESC LIMIT $${paramCount++} OFFSET $${paramCount++}`;
  params.push(limit, offset);

  const results = await query<EarthBankFTDatapoint>(sql, params);

  return {
    data: results,
    total,
    limit,
    offset,
    hasMore: offset + limit < total,
  };
}

// =============================================================================
// HE DATAPOINTS
// =============================================================================

/**
 * Get all He datapoints for a sample
 */
export async function getHeDatapointsBySample(sampleID: string): Promise<EarthBankHeDatapoint[]> {
  const sql = 'SELECT * FROM "earthbank_heDatapoints" WHERE "sampleID" = $1 ORDER BY "datapointName"';
  return query<EarthBankHeDatapoint>(sql, [sampleID]);
}

/**
 * Get a single He datapoint by name
 */
export async function getHeDatapointByName(datapointName: string): Promise<EarthBankHeDatapoint | null> {
  const sql = 'SELECT * FROM "earthbank_heDatapoints" WHERE "datapointName" = $1';
  return queryOne<EarthBankHeDatapoint>(sql, [datapointName]);
}

/**
 * Get He datapoints with age filtering
 */
export async function getHeDatapointsFiltered(
  filters?: EarthBankHeDataFilters,
  limit: number = 50,
  offset: number = 0
): Promise<EarthBankPaginatedResponse<EarthBankHeDatapoint>> {
  let sql = 'SELECT * FROM "earthbank_heDatapoints" WHERE 1=1';
  const params: any[] = [];
  let paramCount = 1;

  if (filters?.sampleID) {
    sql += ` AND "sampleID" = $${paramCount++}`;
    params.push(filters.sampleID);
  }

  if (filters?.minAgeMa) {
    sql += ` AND "meanCorrectedAgeMa" >= $${paramCount++}`;
    params.push(filters.minAgeMa);
  }

  if (filters?.maxAgeMa) {
    sql += ` AND "meanCorrectedAgeMa" <= $${paramCount++}`;
    params.push(filters.maxAgeMa);
  }

  // Get total count
  const countResult = await query<{ count: string }>(
    `SELECT COUNT(*) as count FROM (${sql}) as filtered`,
    params
  );
  const total = parseInt(countResult[0]?.count || '0', 10);

  // Add pagination
  sql += ` ORDER BY "meanCorrectedAgeMa" DESC LIMIT $${paramCount++} OFFSET $${paramCount++}`;
  params.push(limit, offset);

  const results = await query<EarthBankHeDatapoint>(sql, params);

  return {
    data: results,
    total,
    limit,
    offset,
    hasMore: offset + limit < total,
  };
}

// =============================================================================
// FT TRACK LENGTH DATA
// =============================================================================

/**
 * Get all track length data for a sample
 */
export async function getFTTrackLengthDataBySample(sampleID: string): Promise<EarthBankFTTrackLengthData[]> {
  const sql = `
    SELECT tl.*
    FROM "earthbank_ftTrackLengthData" tl
    JOIN "earthbank_ftDatapoints" dp ON tl."datapointName" = dp."datapointName"
    WHERE dp."sampleID" = $1
    ORDER BY tl."datapointName", tl."grainName"
  `;
  return query<EarthBankFTTrackLengthData>(sql, [sampleID]);
}

// =============================================================================
// HE WHOLE GRAIN DATA
// =============================================================================

/**
 * Get all He whole grain data for a sample
 */
export async function getHeWholeGrainDataBySample(sampleID: string): Promise<EarthBankHeWholeGrainData[]> {
  const sql = `
    SELECT wg.*
    FROM "earthbank_heWholeGrainData" wg
    JOIN "earthbank_heDatapoints" dp ON wg."datapointName" = dp."datapointName"
    WHERE dp."sampleID" = $1
    ORDER BY wg."datapointName", wg."grainName"
  `;
  return query<EarthBankHeWholeGrainData>(sql, [sampleID]);
}

// =============================================================================
// STATISTICS
// =============================================================================

/**
 * Get dataset statistics
 */
export async function getDatasetStats(): Promise<EarthBankDatasetStats> {
  const sql = `
    SELECT
      (SELECT COUNT(*) FROM "earthbank_samples") as "totalSamples",
      (SELECT COUNT(*) FROM "earthbank_ftDatapoints") as "totalFTDatapoints",
      (SELECT COUNT(*) FROM "earthbank_heDatapoints") as "totalHeDatapoints",
      (SELECT COUNT(*) FROM "earthbank_ftDatapoints") as "totalAFTAnalyses",
      (SELECT COUNT(*) FROM "earthbank_heWholeGrainData") as "totalAHeGrains",
      (SELECT MIN("centralAgeMa") FROM "earthbank_ftDatapoints" WHERE "centralAgeMa" IS NOT NULL) as "aftMinAge",
      (SELECT MAX("centralAgeMa") FROM "earthbank_ftDatapoints" WHERE "centralAgeMa" IS NOT NULL) as "aftMaxAge",
      (SELECT MIN("correctedHeAge") FROM "earthbank_heWholeGrainData" WHERE "correctedHeAge" IS NOT NULL) as "aheMinAge",
      (SELECT MAX("correctedHeAge") FROM "earthbank_heWholeGrainData" WHERE "correctedHeAge" IS NOT NULL) as "aheMaxAge",
      (SELECT MIN("elevationM") FROM "earthbank_samples" WHERE "elevationM" IS NOT NULL) as "minElevation",
      (SELECT MAX("elevationM") FROM "earthbank_samples" WHERE "elevationM" IS NOT NULL) as "maxElevation"
  `;

  const result = await query<any>(sql);
  const row = result[0];

  return {
    totalSamples: parseInt(row.totalSamples, 10),
    totalFTDatapoints: parseInt(row.totalFTDatapoints, 10),
    totalHeDatapoints: parseInt(row.totalHeDatapoints, 10),
    totalAFTAnalyses: parseInt(row.totalAFTAnalyses, 10),
    totalAHeGrains: parseInt(row.totalAHeGrains, 10),
    ageRangeMa: {
      aftMin: row.aftMinAge,
      aftMax: row.aftMaxAge,
      aheMin: row.aheMinAge,
      aheMax: row.aheMaxAge,
    },
    elevationRangeM: {
      min: row.minElevation,
      max: row.maxElevation,
    },
  };
}

/**
 * Get sample count by mineral type
 */
export async function getSampleCountByMineral(): Promise<{ mineralType: string; count: number }[]> {
  const sql = `
    SELECT
      "mineralType",
      COUNT(*) as count
    FROM "earthbank_samples"
    WHERE "mineralType" IS NOT NULL
    GROUP BY "mineralType"
    ORDER BY count DESC
  `;
  return query<{ mineralType: string; count: number }>(sql);
}

/**
 * Get age distribution (histogram data)
 */
export async function getAgeDistribution(
  method: 'FT' | 'He',
  binSizeMa: number = 50
): Promise<{ ageBinMa: number; count: number }[]> {
  const table = method === 'FT' ? 'earthbank_ftDatapoints' : 'earthbank_heWholeGrainData';
  const ageField = method === 'FT' ? 'centralAgeMa' : 'correctedHeAge';

  const sql = `
    SELECT
      FLOOR("${ageField}" / ${binSizeMa}) * ${binSizeMa} as "ageBinMa",
      COUNT(*) as count
    FROM "${table}"
    WHERE "${ageField}" IS NOT NULL
    GROUP BY "ageBinMa"
    ORDER BY "ageBinMa"
  `;

  return query<{ ageBinMa: number; count: number }>(sql);
}

// =============================================================================
// DATASET QUERIES (datasets table - supporting table, not migrated to earthbank_*)
// =============================================================================
// Note: EarthBankDataset interface is now imported from @/lib/types/earthbank-types

export async function getAllDatasets(): Promise<EarthBankDataset[]> {
  const sql = `
    SELECT
      d.*,
      COALESCE(
        (
          SELECT array_agg(p.name)
          FROM dataset_people_roles dpr
          JOIN people p ON dpr.person_id = p.id
          WHERE dpr.dataset_id = d.id AND dpr.role = 'author'
        ),
        d.authors
      ) as authors
    FROM datasets d
    ORDER BY d.id ASC
  `;

  const rows = await query<any>(sql);
  
  // Transform snake_case to camelCase
  return rows.map(row => ({
    id: row.id.toString(),
    datasetName: row.dataset_name,
    description: row.description,
    publicationReference: row.publication_reference,
    doi: row.doi,
    fullCitation: row.full_citation,
    publicationYear: row.publication_year,
    publicationJournal: row.publication_journal,
    publicationVolumePages: row.publication_volume_pages,
    studyLocation: row.study_location,
    pdfFilename: row.pdf_filename,
    pdfUrl: row.pdf_url,
    supplementaryFilesUrl: row.supplementary_files_url,
    studyArea: row.study_area,
    mineralAnalyzed: row.mineral_analyzed,
    sampleCount: row.sample_count,
    ageRangeMinMa: row.age_range_min_ma,
    ageRangeMaxMa: row.age_range_max_ma,
    authors: row.authors,
    collectionDate: row.collection_date,
    analyst: row.analyst,
    laboratory: row.laboratory,
    analysisMethods: row.analysis_methods,
    paperSummary: row.paper_summary,
    paperAnalysisSections: row.paper_analysis_sections,
    createdAt: row.created_at,
  }));
}

export async function getDatasetById(id: string): Promise<EarthBankDataset | null> {
  const sql = `
    SELECT
      d.*,
      COALESCE(
        (
          SELECT array_agg(p.name)
          FROM dataset_people_roles dpr
          JOIN people p ON dpr.person_id = p.id
          WHERE dpr.dataset_id = d.id AND dpr.role = 'author'
        ),
        d.authors
      ) as authors
    FROM datasets d
    WHERE d.id = $1
  `;

  const rows = await query<any>(sql, [parseInt(id, 10)]);
  
  if (rows.length === 0) {
    return null;
  }

  const row = rows[0];
  
  // Transform snake_case to camelCase
  return {
    id: row.id.toString(),
    datasetName: row.dataset_name,
    description: row.description,
    publicationReference: row.publication_reference,
    doi: row.doi,
    fullCitation: row.full_citation,
    publicationYear: row.publication_year,
    publicationJournal: row.publication_journal,
    publicationVolumePages: row.publication_volume_pages,
    studyLocation: row.study_location,
    pdfFilename: row.pdf_filename,
    pdfUrl: row.pdf_url,
    supplementaryFilesUrl: row.supplementary_files_url,
    studyArea: row.study_area,
    mineralAnalyzed: row.mineral_analyzed,
    sampleCount: row.sample_count,
    ageRangeMinMa: row.age_range_min_ma,
    ageRangeMaxMa: row.age_range_max_ma,
    authors: row.authors,
    collectionDate: row.collection_date,
    analyst: row.analyst,
    laboratory: row.laboratory,
    analysisMethods: row.analysis_methods,
    paperSummary: row.paper_summary,
    paperAnalysisSections: row.paper_analysis_sections,
    createdAt: row.created_at,
  };
}
