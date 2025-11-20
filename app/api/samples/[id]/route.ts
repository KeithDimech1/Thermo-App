/**
 * API Route: /api/samples/[id]
 *
 * Get complete details for a single sample including:
 * - Sample metadata (camelCase)
 * - Fission-track count data
 * - Track length data
 * - Single grain ages
 * - (U-Th)/He grain data
 *
 * MIGRATED TO EARTHBANK SCHEMA (camelCase)
 */

import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/utils/logger';
import { getSampleDetail } from '@/lib/db/earthbank-queries';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sampleId = params.id;

    if (!sampleId) {
      return NextResponse.json(
        { error: 'Sample ID is required' },
        { status: 400 }
      );
    }

    // Query EarthBank schema (returns camelCase JSON)
    const sampleDetail = await getSampleDetail(sampleId);

    if (!sampleDetail) {
      return NextResponse.json(
        { error: 'Sample not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(sampleDetail);
  } catch (error) {
    logger.error({ err: error }, 'Error fetching sample detail:');
    return NextResponse.json(
      { error: 'Failed to fetch sample detail', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
