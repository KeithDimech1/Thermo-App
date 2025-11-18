/**
 * API Route: /api/stats
 *
 * Get dataset statistics including:
 * - Total samples
 * - Total AFT analyses
 * - Total AHe grains
 * - Age ranges (AFT and AHe)
 * - Elevation range
 *
 * MIGRATED TO EARTHBANK SCHEMA (camelCase)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getDatasetStats } from '@/lib/db/earthbank-queries';

export const dynamic = 'force-dynamic';

export async function GET(_request: NextRequest) {
  try {
    // Query EarthBank schema (returns camelCase JSON)
    // Note: getDatasetStats() returns stats for all datasets (no filtering)
    const stats = await getDatasetStats();

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching dataset stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dataset statistics', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
