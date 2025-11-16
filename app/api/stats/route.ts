/**
 * API Route: /api/stats
 *
 * Get dataset statistics including:
 * - Total samples
 * - Total AFT analyses
 * - Total AHe grains
 * - Age ranges (AFT and AHe)
 * - Elevation range
 */

import { NextRequest, NextResponse } from 'next/server';
import { getDatasetStats } from '@/lib/db/queries';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const datasetId = parseInt(searchParams.get('dataset_id') || '1', 10);

    const stats = await getDatasetStats(datasetId);

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching dataset stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dataset statistics', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
