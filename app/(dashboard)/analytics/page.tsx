/**
 * Analytics Page
 *
 * Advanced data visualizations and analytics for QC results.
 * Organized into tabs: Overview, Heatmap, Distribution, Quality, Statistics
 *
 * Phase 3 Implementation
 */

export const dynamic = 'force-dynamic';

import { AnalyticsTabs } from '@/components/analytics/AnalyticsTabs';
import {
  getHeatmapData,
  getCVDistributionByManufacturer,
  getQualityDistribution,
  getOverallStats,
} from '@/lib/db/queries';

interface AnalyticsPageProps {
  searchParams: { [key: string]: string | string[] | undefined };
}

export default async function AnalyticsPage({ searchParams }: AnalyticsPageProps) {
  // Get dataset parameter (default: curated)
  const dataset = (searchParams.dataset as 'curated' | 'all') || 'curated';

  // Fetch all data in parallel
  const [heatmapData, distributionData, qualityDistArray, overallStats] = await Promise.all([
    getHeatmapData(dataset),
    getCVDistributionByManufacturer(dataset),
    getQualityDistribution(dataset),
    getOverallStats(dataset),
  ]);

  // Convert quality distribution array to object (parse to numbers!)
  const qualityDist = qualityDistArray.reduce((acc, item) => {
    const rating = item.quality_rating as 'excellent' | 'good' | 'acceptable' | 'poor';
    acc[rating] = parseInt(String(item.count));
    return acc;
  }, { excellent: 0, good: 0, acceptable: 0, poor: 0 } as { excellent: number; good: number; acceptable: number; poor: number });

  // Calculate summary statistics
  const excellentCount = qualityDist.excellent || 0;
  const goodCount = qualityDist.good || 0;
  const excellentPct = ((excellentCount / overallStats.totalConfigs) * 100).toFixed(1);
  const goodOrBetterPct = (((excellentCount + goodCount) / overallStats.totalConfigs) * 100).toFixed(1);

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-4xl font-bold text-gray-900">Analytics</h1>
        <p className="text-gray-600 mt-2">
          Advanced visualizations and analysis of quality control data
        </p>
      </div>

      {/* Tabbed Content */}
      <AnalyticsTabs
        dataset={dataset}
        overallStats={overallStats}
        qualityDist={qualityDist}
        excellentPct={excellentPct}
        goodOrBetterPct={goodOrBetterPct}
        heatmapData={heatmapData}
        distributionData={distributionData}
      />
    </div>
  );
}

/**
 * Metadata for SEO
 */
export const metadata = {
  title: 'Analytics - QC Results Viewer',
  description:
    'Advanced visualizations and analysis of quality control data for infectious disease testing',
};
