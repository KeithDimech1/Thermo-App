import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db/connection';

export const dynamic = 'force-dynamic';

interface QualityStats {
  total: number;
  excellent: number;
  good: number;
  acceptable: number;
  poor: number;
}

interface TopPerformer {
  manufacturer_name: string;
  avg_cv_lt_10: number;
  config_count: number;
}

interface PoorPerformer {
  config_id: number;
  marker_name: string;
  manufacturer_name: string;
  assay_name: string;
  cv_gt_20_percentage: number;
  quality_rating: string;
}

interface DashboardStats {
  qualityStats: QualityStats;
  topPerformers: TopPerformer[];
  poorPerformers: PoorPerformer[];
  avgCVLt10: number;
}

export async function GET(request: NextRequest) {
  try {
    // Get dataset parameter (curated by default)
    const searchParams = request.nextUrl.searchParams;
    const dataset = searchParams.get('dataset') || 'curated';

    // Build WHERE clause for dataset filter
    const datasetFilter = dataset === 'curated' ? 'WHERE include_in_analysis = TRUE' : '';

    // Get quality rating distribution
    const qualityStatsQuery = `
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN quality_rating = 'excellent' THEN 1 ELSE 0 END) as excellent,
        SUM(CASE WHEN quality_rating = 'good' THEN 1 ELSE 0 END) as good,
        SUM(CASE WHEN quality_rating = 'acceptable' THEN 1 ELSE 0 END) as acceptable,
        SUM(CASE WHEN quality_rating = 'poor' THEN 1 ELSE 0 END) as poor
      FROM test_configurations
      ${datasetFilter};
    `;

    const qualityStatsResult = await query<QualityStats>(qualityStatsQuery);
    const qualityStats = qualityStatsResult[0] || {
      total: 0,
      excellent: 0,
      good: 0,
      acceptable: 0,
      poor: 0
    };

    // Get top performing manufacturers (by avg CV <10%)
    const datasetCondition = dataset === 'curated' ? 'tc.include_in_analysis = TRUE AND' : '';
    const topPerformersQuery = `
      SELECT
        m.name as manufacturer_name,
        AVG(cv.cv_lt_10_percentage) as avg_cv_lt_10,
        COUNT(*) as config_count
      FROM test_configurations tc
      JOIN cv_measurements cv ON tc.id = cv.test_config_id
      JOIN assays a ON tc.assay_id = a.id
      JOIN manufacturers m ON a.manufacturer_id = m.id
      WHERE ${datasetCondition} cv.cv_lt_10_percentage IS NOT NULL
      GROUP BY m.id, m.name
      HAVING COUNT(*) >= 3  -- Only manufacturers with 3+ configs
      ORDER BY avg_cv_lt_10 DESC
      LIMIT 5;
    `;

    const topPerformers = await query<TopPerformer>(topPerformersQuery);

    // Get poor performers (CV >20%)
    const poorPerformersQuery = `
      SELECT
        tc.id as config_id,
        mk.name as marker_name,
        mfr.name as manufacturer_name,
        a.name as assay_name,
        cv.cv_gt_20_percentage,
        tc.quality_rating
      FROM test_configurations tc
      JOIN cv_measurements cv ON tc.id = cv.test_config_id
      JOIN markers mk ON tc.marker_id = mk.id
      JOIN assays a ON tc.assay_id = a.id
      JOIN manufacturers mfr ON a.manufacturer_id = mfr.id
      WHERE ${datasetCondition} tc.quality_rating = 'poor'
        AND cv.cv_gt_20_percentage > 0
      ORDER BY cv.cv_gt_20_percentage DESC
      LIMIT 10;
    `;

    const poorPerformers = await query<PoorPerformer>(poorPerformersQuery);

    // Get average CV <10% across all configs
    const avgCVQuery = `
      SELECT AVG(cv.cv_lt_10_percentage) as avg_cv_lt_10
      FROM cv_measurements cv
      JOIN test_configurations tc ON cv.test_config_id = tc.id
      WHERE ${datasetCondition} cv.cv_lt_10_percentage IS NOT NULL;
    `;

    const avgCVResult = await query<{ avg_cv_lt_10: string | number | null }>(avgCVQuery);
    const avgCVLt10Raw = avgCVResult[0]?.avg_cv_lt_10;
    const avgCVLt10 = avgCVLt10Raw ? parseFloat(String(avgCVLt10Raw)) : 0;

    const stats: DashboardStats = {
      qualityStats: {
        total: parseInt(String(qualityStats.total)),
        excellent: parseInt(String(qualityStats.excellent)),
        good: parseInt(String(qualityStats.good)),
        acceptable: parseInt(String(qualityStats.acceptable)),
        poor: parseInt(String(qualityStats.poor))
      },
      topPerformers: topPerformers.map(p => ({
        manufacturer_name: p.manufacturer_name,
        avg_cv_lt_10: parseFloat(String(p.avg_cv_lt_10)),
        config_count: parseInt(String(p.config_count))
      })),
      poorPerformers: poorPerformers.map(p => ({
        config_id: p.config_id,
        marker_name: p.marker_name,
        manufacturer_name: p.manufacturer_name,
        assay_name: p.assay_name,
        cv_gt_20_percentage: parseFloat(String(p.cv_gt_20_percentage)),
        quality_rating: p.quality_rating
      })),
      avgCVLt10: parseFloat(avgCVLt10.toFixed(1))
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Dashboard stats error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard statistics' },
      { status: 500 }
    );
  }
}
