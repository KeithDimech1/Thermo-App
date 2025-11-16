/**
 * Analytics API Route
 *
 * GET /api/analytics - Get overall statistics and quality distribution
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getOverallStats,
  getCVDistribution,
  getQualityDistribution,
} from '@/lib/db/queries';

export async function GET(_request: NextRequest) {
  try {
    // Get all analytics data in parallel
    const [overallStats, cvDistribution, qualityDistribution] = await Promise.all([
      getOverallStats(),
      getCVDistribution(),
      getQualityDistribution(),
    ]);

    return NextResponse.json({
      data: {
        overall: overallStats,
        cvDistribution,
        qualityDistribution,
      },
    });
  } catch (error) {
    console.error('API Error (GET /api/analytics):', error);

    return NextResponse.json(
      {
        error: 'Failed to fetch analytics',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
