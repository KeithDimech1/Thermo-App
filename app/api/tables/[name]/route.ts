import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db/connection';

/**
 * API Route: GET /api/tables/[name]
 * Returns paginated table data for interactive table view
 *
 * SCHEMA V2: Updated for datapoint architecture
 * - Old tables (ft_ages, ft_counts, ft_track_lengths, ahe_grain_data) renamed
 * - New tables (ft_datapoints, ft_count_data, ft_track_length_data, he_whole_grain_data)
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
    columns: ['sample_id', 'dataset_id', 'igsn', 'latitude', 'longitude', 'elevation_m', 'lithology', 'mineral_type', 'n_aft_grains', 'n_ahe_grains'],
    defaultSort: 'sample_id'
  },
  'ft-datapoints': {
    tableName: 'ft_datapoints',
    columns: ['id', 'sample_id', 'datapoint_key', 'laboratory', 'ft_method', 'pooled_age_ma', 'pooled_age_error_ma', 'central_age_ma', 'central_age_error_ma', 'n_grains', 'p_chi2_pct', 'dispersion_pct', 'mean_track_length_um'],
    defaultSort: 'id'
  },
  'ft-count-data': {
    tableName: 'ft_count_data',
    columns: ['id', 'ft_datapoint_id', 'grain_id', 'ns', 'ni', 'nd', 'rho_s_cm2', 'rho_i_cm2', 'dpar_um'],
    defaultSort: 'id'
  },
  'ft-track-lengths': {
    tableName: 'ft_track_length_data',
    columns: ['id', 'ft_datapoint_id', 'grain_id', 'track_id', 'track_type', 'apparent_length_um', 'true_length_um', 'angle_to_c_axis_deg', 'dpar_um'],
    defaultSort: 'id'
  },
  'ft-single-grain-ages': {
    tableName: 'ft_single_grain_ages',
    columns: ['id', 'ft_datapoint_id', 'grain_id', 'grain_age_ma', 'grain_age_error_ma', 'u_ppm', 'rmr0'],
    defaultSort: 'id'
  },
  'he-datapoints': {
    tableName: 'he_datapoints',
    columns: ['id', 'sample_id', 'datapoint_key', 'laboratory', 'he_analysis_method', 'n_aliquots', 'mean_he4_corr_age_ma', 'se_mean_he4_corr_age_ma', 'chi_square', 'mswd'],
    defaultSort: 'id'
  },
  'he-grains': {
    tableName: 'he_whole_grain_data',
    columns: ['id', 'he_datapoint_id', 'grain_id', 'he4_uncorr_age_ma', 'he4_corr_age_ma', 'he4_corr_age_error_ma', 'ft_value', 'u_ppm', 'th_ppm', 'sm_ppm', 'eu_ppm'],
    defaultSort: 'id'
  },
  'batches': {
    tableName: 'batches',
    columns: ['id', 'batch_name', 'analysis_date', 'laboratory', 'analytical_session', 'irradiation_reactor'],
    defaultSort: 'batch_name'
  },
  'people': {
    tableName: 'people',
    columns: ['id', 'orcid', 'name', 'email', 'affiliation'],
    defaultSort: 'name'
  },
  // Legacy table names for backward compatibility (redirect to new tables)
  'ft-ages': {
    tableName: 'ft_datapoints',
    columns: ['id', 'sample_id', 'pooled_age_ma', 'pooled_age_error_ma', 'central_age_ma', 'central_age_error_ma', 'n_grains', 'p_chi2_pct', 'dispersion_pct'],
    defaultSort: 'id'
  },
  'ft-counts': {
    tableName: 'ft_count_data',
    columns: ['id', 'ft_datapoint_id', 'grain_id', 'ns', 'ni', 'nd', 'rho_s_cm2', 'rho_i_cm2'],
    defaultSort: 'id'
  },
  'track-lengths': {
    tableName: 'ft_track_length_data',
    columns: ['id', 'ft_datapoint_id', 'grain_id', 'track_id', 'apparent_length_um', 'true_length_um'],
    defaultSort: 'id'
  },
  'ahe-grains': {
    tableName: 'he_whole_grain_data',
    columns: ['id', 'he_datapoint_id', 'grain_id', 'he4_uncorr_age_ma', 'he4_corr_age_ma', 'he4_corr_age_error_ma'],
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
