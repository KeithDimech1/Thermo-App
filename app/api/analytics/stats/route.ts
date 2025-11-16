/**
 * Statistical Analytics API
 *
 * Provides advanced statistical analysis for QC data
 * Includes control limits, outlier detection, process capability, etc.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAllConfigs } from '@/lib/db/queries';
import {
  calculateCVMetrics,
  calculateProcessCapability,
  detectOutliers,
  calculateDistributionStats,
  type CVMetrics,
  type ProcessCapability,
  type OutlierAnalysis,
  type DistributionStats,
} from '@/lib/stats/qc-analytics';

interface StatsResponse {
  /** Overall CV metrics with control limits */
  overall: CVMetrics;
  /** Process capability analysis */
  capability: ProcessCapability;
  /** Outlier detection results */
  outliers: OutlierAnalysis;
  /** Distribution statistics */
  distribution: DistributionStats;
  /** Sample data info */
  dataInfo: {
    totalConfigs: number;
    configsWithCV: number;
    dateGenerated: string;
  };
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const dataset = (searchParams.get('dataset') || 'curated') as 'curated' | 'all';
    const manufacturerId = searchParams.get('manufacturerId');
    const assayId = searchParams.get('assayId');

    // Build filters
    const filters: any = { dataset };
    if (manufacturerId) {
      filters.manufacturerId = parseInt(manufacturerId);
    }
    if (assayId) {
      filters.assayId = parseInt(assayId);
    }

    // Get all configurations with filters
    const { data: configs } = await getAllConfigs(filters, 1000, 0);

    // Extract CV <10% measurements
    const cvData = configs
      .map((d) => d.cv_lt_10_percentage)
      .filter((cv): cv is number => cv !== null && !isNaN(cv));

    if (cvData.length === 0) {
      return NextResponse.json(
        {
          error: 'No CV data available for analysis',
          errorType: 'NO_DATA',
          message: 'No test configurations found matching the selected filters.'
        },
        { status: 404 }
      );
    }

    // Check for minimum data points required for statistical analysis
    const MIN_DATA_POINTS = 3;
    if (cvData.length < MIN_DATA_POINTS) {
      return NextResponse.json(
        {
          error: 'Insufficient data for statistical analysis',
          errorType: 'INSUFFICIENT_DATA',
          message: `At least ${MIN_DATA_POINTS} data points are required for statistical analysis. Found ${cvData.length}.`,
          dataPoints: cvData.length,
          minimumRequired: MIN_DATA_POINTS,
          suggestion: 'Try selecting broader filters (e.g., manufacturer only, or pathogen only) to include more test configurations.'
        },
        { status: 422 } // Unprocessable Entity
      );
    }

    // Calculate comprehensive statistics
    let overall, capability, outliers, distribution;

    try {
      overall = calculateCVMetrics(cvData);
      capability = calculateProcessCapability(cvData, 95, 0); // USL: 95%, LSL: 0%
      outliers = detectOutliers(cvData);
      distribution = calculateDistributionStats(cvData);
    } catch (calcError) {
      // If statistical calculations fail (e.g., not enough data for skewness)
      console.error('Statistical calculation error:', calcError);
      return NextResponse.json(
        {
          error: 'Insufficient data for statistical analysis',
          errorType: 'INSUFFICIENT_DATA',
          message: `Statistical calculations require more data points. Found ${cvData.length} configurations.`,
          dataPoints: cvData.length,
          minimumRequired: MIN_DATA_POINTS,
          suggestion: 'Try selecting broader filters (e.g., manufacturer only, or pathogen only) to include more test configurations.',
          details: calcError instanceof Error ? calcError.message : 'Calculation failed'
        },
        { status: 422 }
      );
    }

    const response: StatsResponse = {
      overall,
      capability,
      outliers,
      distribution,
      dataInfo: {
        totalConfigs: configs.length,
        configsWithCV: cvData.length,
        dateGenerated: new Date().toISOString(),
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error calculating statistics:', error);
    return NextResponse.json(
      {
        error: 'Failed to calculate statistics',
        errorType: 'SERVER_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    );
  }
}
