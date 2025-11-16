/**
 * API Route: /api/samples
 *
 * Get all samples with optional filtering and pagination
 *
 * Query Parameters:
 * - limit: number (default: 50)
 * - offset: number (default: 0)
 * - mineral_type: string
 * - lithology: string
 * - analysis_method: string
 * - min_elevation_m: number
 * - max_elevation_m: number
 * - has_aft: boolean
 * - has_ahe: boolean
 * - sortBy: 'sample_id' | 'elevation_m' | 'mineral_type'
 * - sortOrder: 'asc' | 'desc'
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAllSamples } from '@/lib/db/queries';
import { SampleFilters } from '@/lib/types/thermo-data';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    // Parse pagination
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    // Parse sorting
    const sortBy = (searchParams.get('sortBy') as 'sample_id' | 'elevation_m' | 'mineral_type') || 'sample_id';
    const sortOrder = (searchParams.get('sortOrder') as 'asc' | 'desc') || 'asc';

    // Parse filters
    const filters: SampleFilters = {};

    if (searchParams.has('mineral_type')) {
      filters.mineral_type = searchParams.get('mineral_type')!;
    }

    if (searchParams.has('lithology')) {
      filters.lithology = searchParams.get('lithology')!;
    }

    if (searchParams.has('analysis_method')) {
      filters.analysis_method = searchParams.get('analysis_method')!;
    }

    if (searchParams.has('min_elevation_m')) {
      filters.min_elevation_m = parseFloat(searchParams.get('min_elevation_m')!);
    }

    if (searchParams.has('max_elevation_m')) {
      filters.max_elevation_m = parseFloat(searchParams.get('max_elevation_m')!);
    }

    if (searchParams.has('has_aft')) {
      filters.has_aft = searchParams.get('has_aft') === 'true';
    }

    if (searchParams.has('has_ahe')) {
      filters.has_ahe = searchParams.get('has_ahe') === 'true';
    }

    // Execute query
    const result = await getAllSamples(filters, limit, offset, sortBy, sortOrder);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching samples:', error);
    return NextResponse.json(
      { error: 'Failed to fetch samples', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
