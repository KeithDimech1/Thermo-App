import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/utils/logger';
import { query } from '@/lib/db/connection';

/**
 * API Route: GET /api/tables/[name]
 * Returns paginated table data for interactive table view
 *
 * MIGRATED TO EARTHBANK SCHEMA (camelCase)
 * - All table names prefixed with earthbank_*
 * - All column names in camelCase (e.g., sampleID, centralAgeMa, pooledAgeMa)
 * - Requires double-quoted identifiers in SQL queries
 *
 * Query params:
 * - page: Page number (default: 1)
 * - limit: Rows per page (default: 50)
 * - sortBy: Column to sort by (camelCase, optional)
 * - sortOrder: 'asc' or 'desc' (default: 'asc')
 * - datasetID: UUID filter (optional)
 */

type TableConfig = {
  tableName: string;
  columns: string[];
  defaultSort?: string;
};

const TABLE_CONFIGS: Record<string, TableConfig> = {
  'samples': {
    tableName: 'earthbank_samples',
    columns: ['id', 'sampleID', 'datasetID', 'IGSN', 'latitude', 'longitude', 'elevationM', 'lithology', 'mineralType'],
    defaultSort: 'sampleID'
  },
  'ft-datapoints': {
    tableName: 'earthbank_ftDatapoints',
    columns: ['id', 'datapointName', 'sampleID', 'laboratory', 'analyst', 'analysisDate', 'ftMethod', 'mineralType', 'nGrains', 'pooledAgeMa', 'pooledAgeUncertainty', 'centralAgeMa', 'centralAgeUncertainty', 'pChi2', 'dispersion', 'mtl', 'dPar'],
    defaultSort: 'id'
  },
  'ft-track-lengths': {
    tableName: 'earthbank_ftTrackLengthData',
    columns: ['id', 'datapointName', 'sampleID', 'grainName', 'trackID', 'trackType', 'lengthUm', 'cAxisAngleDeg', 'dPar'],
    defaultSort: 'id'
  },
  'he-datapoints': {
    tableName: 'earthbank_heDatapoints',
    columns: ['id', 'datapointName', 'sampleID', 'ftMethod', 'laboratory', 'analyst', 'analysisDate', 'nGrains', 'meanCorrectedAgeMa', 'meanCorrectedAgeUncertainty', 'meanUncorrectedAgeMa'],
    defaultSort: 'id'
  },
  'he-grains': {
    tableName: 'earthbank_heWholeGrainData',
    columns: ['id', 'datapointName', 'sampleID', 'grainName', 'correctedHeAge', 'correctedHeAgeUncertainty', 'uncorrectedHeAge', 'ft', 'uConcentration', 'thConcentration', 'smConcentration', 'eU'],
    defaultSort: 'id'
  }
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  try {
    const resolvedParams = await params;
    const tableName = resolvedParams.name;
    const config = TABLE_CONFIGS[tableName];

    if (!config) {
      return NextResponse.json(
        { error: 'Invalid table name', availableTables: Object.keys(TABLE_CONFIGS) },
        { status: 400 }
      );
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const sortBy = searchParams.get('sortBy') || config.defaultSort;
    const sortOrder = (searchParams.get('sortOrder') || 'asc').toLowerCase();

    // Validate sort order
    if (sortOrder !== 'asc' && sortOrder !== 'desc') {
      return NextResponse.json(
        { error: 'Sort order must be "asc" or "desc"' },
        { status: 400 }
      );
    }

    // Validate sort column
    if (sortBy && !config.columns.includes(sortBy)) {
      return NextResponse.json(
        { error: `Invalid sort column: ${sortBy}`, validColumns: config.columns },
        { status: 400 }
      );
    }

    // Calculate offset
    const offset = (page - 1) * limit;

    // Handle dataset filtering (using camelCase datasetID)
    const datasetId = searchParams.get('datasetID');
    const hasDatasetFilter = datasetId && datasetId.trim() !== '';

    // Build WHERE clause for dataset filtering (using double-quoted identifiers)
    let whereClause = '';
    let queryParams: any[] = [];

    if (hasDatasetFilter) {
      // Check if the table has a datasetID column
      if (config.tableName === 'earthbank_samples') {
        whereClause = 'WHERE "datasetID" = $1';
        queryParams = [datasetId];
      } else if (config.tableName === 'earthbank_ftDatapoints' || config.tableName === 'earthbank_heDatapoints') {
        // Join with samples table to filter by dataset
        whereClause = `WHERE "sampleID" IN (SELECT "sampleID" FROM "earthbank_samples" WHERE "datasetID" = $1)`;
        queryParams = [datasetId];
      } else if (config.tableName === 'earthbank_ftTrackLengthData') {
        // Join through earthbank_ftDatapoints -> earthbank_samples
        whereClause = `WHERE "datapointName" IN (
          SELECT "datapointName" FROM "earthbank_ftDatapoints"
          WHERE "sampleID" IN (SELECT "sampleID" FROM "earthbank_samples" WHERE "datasetID" = $1)
        )`;
        queryParams = [datasetId];
      } else if (config.tableName === 'earthbank_heWholeGrainData') {
        // Join through earthbank_heDatapoints -> earthbank_samples
        whereClause = `WHERE "datapointName" IN (
          SELECT "datapointName" FROM "earthbank_heDatapoints"
          WHERE "sampleID" IN (SELECT "sampleID" FROM "earthbank_samples" WHERE "datasetID" = $1)
        )`;
        queryParams = [datasetId];
      }
    }

    // Build query (all identifiers double-quoted for camelCase)
    const columnList = config.columns.map(col => `"${col}"`).join(', ');
    const countSql = `SELECT COUNT(*) as total FROM "${config.tableName}" ${whereClause}`;
    const dataSql = `
      SELECT ${columnList}
      FROM "${config.tableName}"
      ${whereClause}
      ORDER BY "${sortBy}" ${sortOrder.toUpperCase()}
      LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}
    `;

    // Execute queries
    const [countResult, dataResult] = await Promise.all([
      query<{ total: string }>(countSql, queryParams),
      query(dataSql, [...queryParams, limit, offset])
    ]);

    const total = parseInt(countResult[0]?.total || '0', 10);
    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      data: dataResult,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      },
      sort: {
        column: sortBy,
        order: sortOrder
      }
    });

  } catch (error) {
    logger.error({ err: error }, 'Table API error:');
    return NextResponse.json(
      { error: 'Failed to fetch table data' },
      { status: 500 }
    );
  }
}
