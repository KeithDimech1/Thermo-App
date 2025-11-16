import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db/connection';

/**
 * API Route: GET /api/tables/[name]
 * Returns paginated table data for interactive table view
 *
 * Query params:
 * - page: Page number (default: 1)
 * - limit: Rows per page (default: 50)
 * - sortBy: Column to sort by (optional)
 * - sortOrder: 'asc' or 'desc' (default: 'asc')
 * - filter: JSON string of filter conditions (optional)
 */

type TableConfig = {
  tableName: string;
  columns: string[];
  defaultSort?: string;
};

const TABLE_CONFIGS: Record<string, TableConfig> = {
  'samples': {
    tableName: 'samples',
    columns: ['sample_id', 'igsn', 'latitude', 'longitude', 'elevation_m', 'lithology', 'mineral_type'],
    defaultSort: 'sample_id'
  },
  'ft-ages': {
    tableName: 'ft_ages',
    columns: ['sample_id', 'pooled_age_ma', 'pooled_age_error_ma', 'central_age_ma', 'central_age_error_ma', 'n_grains', 'p_chi2', 'dispersion_pct'],
    defaultSort: 'sample_id'
  },
  'ft-counts': {
    tableName: 'ft_counts',
    columns: ['sample_id', 'grain_id', 'ns', 'ni', 'nd', 'rho_s_cm2', 'rho_i_cm2', 'rho_d_cm2'],
    defaultSort: 'sample_id'
  },
  'track-lengths': {
    tableName: 'ft_track_lengths',
    columns: ['sample_id', 'grain_id', 'mean_track_length_um', 'mean_track_length_sd_um', 'dpar_um', 'angle_to_c_axis_deg'],
    defaultSort: 'sample_id'
  },
  'ahe-grains': {
    tableName: 'ahe_grain_data',
    columns: ['sample_id', 'lab_no', 'uncorr_age_ma', 'corr_age_ma', 'corr_age_1sigma_ma', 'ft', 'u_ppm', 'th_ppm'],
    defaultSort: 'sample_id'
  }
};

export async function GET(
  request: NextRequest,
  { params }: { params: { name: string } }
) {
  try {
    const tableName = params.name;
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

    // Build query
    const columnList = config.columns.join(', ');
    const countSql = `SELECT COUNT(*) as total FROM ${config.tableName}`;
    const dataSql = `
      SELECT ${columnList}
      FROM ${config.tableName}
      ORDER BY ${sortBy} ${sortOrder.toUpperCase()}
      LIMIT $1 OFFSET $2
    `;

    // Execute queries
    const [countResult, dataResult] = await Promise.all([
      query<{ total: string }>(countSql),
      query(dataSql, [limit, offset])
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
    console.error('Table API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch table data' },
      { status: 500 }
    );
  }
}
