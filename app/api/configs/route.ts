/**
 * Test Configurations API Route
 *
 * GET /api/configs - Get all test configurations with optional filters
 *
 * Query Parameters:
 * - marker_id: Filter by marker ID
 * - marker_ids: Filter by marker IDs (comma-separated for multi-select)
 * - manufacturer_id: Filter by manufacturer ID
 * - manufacturer_ids: Filter by manufacturer IDs (comma-separated for multi-select)
 * - assay_id: Filter by assay ID
 * - assay_ids: Filter by assay IDs (comma-separated for multi-select)
 * - pathogen_ids: Filter by pathogen IDs (comma-separated for multi-select)
 * - quality_rating: Filter by quality rating (excellent|good|acceptable|poor)
 * - test_type: Filter by test type (serology|nat)
 * - dataset: Filter by dataset (curated|all) - default: curated
 * - min_cv_lt_10: Minimum percentage with CV <10%
 * - cv_filter: CV quality filter (all|lt10|gt10|gt15|gt20)
 * - search: Search text for marker, assay, manufacturer, or platform
 * - sort_by: Sort field (marker_name|assay_name|manufacturer_name|cv_lt_10_percentage)
 * - sort_order: Sort order (asc|desc)
 * - limit: Results per page (default: 50)
 * - offset: Pagination offset (default: 0)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAllConfigs } from '@/lib/db/queries';
import { TestConfigFilters, QualityRating, DatasetType } from '@/lib/types/qc-data';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    // Parse filter parameters
    const filters: TestConfigFilters = {};

    const markerId = searchParams.get('marker_id');
    const markerIds = searchParams.get('marker_ids');
    if (markerId) {
      filters.markerId = parseInt(markerId);
    } else if (markerIds) {
      const ids = markerIds.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));
      if (ids.length > 0) filters.pathogenIds = ids; // Will filter via markers
    }

    const manufacturerId = searchParams.get('manufacturer_id');
    const manufacturerIds = searchParams.get('manufacturer_ids');
    if (manufacturerId) {
      filters.manufacturerId = parseInt(manufacturerId);
    } else if (manufacturerIds) {
      const ids = manufacturerIds.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));
      if (ids.length === 1) {
        filters.manufacturerId = ids[0];
      }
      // Multi-manufacturer filtering needs to be handled in the query
    }

    const assayId = searchParams.get('assay_id');
    const assayIds = searchParams.get('assay_ids');
    if (assayId) {
      filters.assayId = parseInt(assayId);
    } else if (assayIds) {
      const ids = assayIds.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));
      if (ids.length === 1) {
        filters.assayId = ids[0];
      }
      // Multi-assay filtering needs to be handled in the query
    }

    // Pathogen filter (multi-select support via comma-separated values)
    const pathogenIds = searchParams.get('pathogen_ids');
    if (pathogenIds) {
      filters.pathogenIds = pathogenIds.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));
    }

    const qualityRating = searchParams.get('quality_rating');
    if (qualityRating) {
      filters.qualityRating = qualityRating as QualityRating;
    }

    const testType = searchParams.get('test_type');
    if (testType) {
      filters.testType = testType as 'serology' | 'nat';
    }

    const dataset = searchParams.get('dataset');
    if (dataset) {
      filters.dataset = dataset as DatasetType;
    } else {
      // Default to curated data
      filters.dataset = 'curated';
    }

    const minCVLt10 = searchParams.get('min_cv_lt_10');
    if (minCVLt10) {
      filters.minCVLt10Pct = parseFloat(minCVLt10);
    }

    // Apply CV quality filter
    const cvFilter = searchParams.get('cv_filter');
    if (cvFilter === 'lt10') {
      filters.minCVLt10Pct = 100; // Only configs with 100% CV <10%
    } else if (cvFilter === 'gt10') {
      filters.maxCVLt10Pct = 89.9; // CV <10% less than 90%
    } else if (cvFilter === 'gt15') {
      filters.maxCVLt10Pct = 84.9; // CV <10% less than 85%
    } else if (cvFilter === 'gt20') {
      filters.maxCVLt10Pct = 79.9; // CV <10% less than 80%
    }

    // Parse pagination parameters
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Parse search parameter
    const search = searchParams.get('search');

    // Parse sorting parameters
    const sortBy = searchParams.get('sort_by') as 'marker_name' | 'assay_name' | 'manufacturer_name' | 'cv_lt_10_percentage' | null;
    const sortOrder = (searchParams.get('sort_order') || 'desc') as 'asc' | 'desc';

    console.log('[Configs API] Request received:', {
      filters,
      limit,
      offset,
      hasDBUrl: !!process.env.DATABASE_URL,
    });

    // Validate pagination
    if (limit < 1 || limit > 100) {
      return NextResponse.json(
        { error: 'Limit must be between 1 and 100' },
        { status: 400 }
      );
    }

    if (offset < 0) {
      return NextResponse.json(
        { error: 'Offset must be non-negative' },
        { status: 400 }
      );
    }

    // Query database
    const { data, total } = await getAllConfigs(filters, limit, offset, sortBy || undefined, sortOrder);

    // Apply search filter if provided (client-side for now)
    let filteredData = data;
    let filteredTotal = total;
    if (search) {
      const searchLower = search.toLowerCase();
      filteredData = data.filter((config: any) =>
        config.marker_name?.toLowerCase().includes(searchLower) ||
        config.assay_name?.toLowerCase().includes(searchLower) ||
        config.manufacturer_name?.toLowerCase().includes(searchLower) ||
        config.platform?.toLowerCase().includes(searchLower)
      );
      filteredTotal = filteredData.length;
    }

    console.log('[Configs API] Success:', {
      count: filteredData.length,
      total: filteredTotal,
      dataset: filters.dataset,
      search,
      cvFilter,
    });

    // Return paginated response
    return NextResponse.json({
      data: filteredData,
      total: filteredTotal,
      page: Math.floor(offset / limit) + 1,
      pageSize: limit,
      totalPages: Math.ceil(filteredTotal / limit),
      filters: Object.keys(filters).length > 0 ? filters : undefined,
    });
  } catch (error) {
    console.error('[Configs API] ERROR:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      hasDBUrl: !!process.env.DATABASE_URL,
    });

    return NextResponse.json(
      {
        error: 'Failed to fetch test configurations',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// Add CORS headers for API
export async function OPTIONS(_request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
