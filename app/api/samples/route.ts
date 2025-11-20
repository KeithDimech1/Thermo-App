/**
 * API Route: /api/samples
 *
 * Get all samples with optional filtering and pagination
 *
 * MIGRATED TO EARTHBANK SCHEMA (camelCase)
 *
 * Query Parameters:
 * - limit: number (default: 50)
 * - offset: number (default: 0)
 * - mineralType: string (camelCase)
 * - lithology: string
 * - datasetID: string (UUID, camelCase)
 * - minElevationM: number (camelCase)
 * - maxElevationM: number (camelCase)
 * - sortBy: 'sampleID' | 'elevationM' | 'mineralType' (camelCase)
 * - sortOrder: 'asc' | 'desc'
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAllSamples } from '@/lib/db/earthbank-queries';
import { EarthBankSampleFilters } from '@/lib/types/earthbank-types';
import { logger } from '@/lib/utils/logger';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    // Parse pagination
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    // Parse sorting (camelCase field names)
    const sortBy = (searchParams.get('sortBy') as 'sampleID' | 'elevationM' | 'mineralType') || 'sampleID';
    const sortOrder = (searchParams.get('sortOrder') as 'asc' | 'desc') || 'asc';

    // Parse filters (camelCase field names)
    const filters: EarthBankSampleFilters = {};

    if (searchParams.has('mineralType')) {
      filters.mineralType = searchParams.get('mineralType')!;
    }

    if (searchParams.has('lithology')) {
      filters.lithology = searchParams.get('lithology')!;
    }

    if (searchParams.has('datasetID')) {
      filters.datasetID = searchParams.get('datasetID')!;
    }

    if (searchParams.has('minElevationM')) {
      filters.minElevationM = parseFloat(searchParams.get('minElevationM')!);
    }

    if (searchParams.has('maxElevationM')) {
      filters.maxElevationM = parseFloat(searchParams.get('maxElevationM')!);
    }

    // Execute query (returns camelCase JSON)
    const result = await getAllSamples(filters, limit, offset, sortBy, sortOrder);

    return NextResponse.json(result);
  } catch (error) {
    logger.error({ err: error, route: '/api/samples' }, 'Error fetching samples');
    return NextResponse.json(
      { error: 'Failed to fetch samples', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
