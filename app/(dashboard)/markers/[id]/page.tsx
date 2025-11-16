/**
 * Marker Detail Page
 *
 * Shows detailed information about a specific marker including:
 * - Clinical context and interpretation
 * - Performance summary across all assays
 * - List of all test configurations for this marker
 */

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { RiskTierBadge } from '@/components/risk/RiskTierBadge';
import { ClinicalSuitabilityCard } from '@/components/risk/ClinicalSuitabilityCard';
import { QualityBadgeEnhanced } from '@/components/risk/QualityBadgeEnhanced';
import { CompactEventsDisplay } from '@/components/confidence/EventsExaminedDisplay';
import { AddToCompareButton } from '@/components/compare/AddToCompareButton';
import { getAllMarkers } from '@/lib/db/queries';

// Generate static params for all marker pages at build time
export async function generateStaticParams() {
  try {
    const markers = await getAllMarkers();
    return markers.map((marker) => ({
      id: marker.id.toString(),
    }));
  } catch (error) {
    console.error('Error generating static params for markers:', error);
    return [];
  }
}

// Mock data for development
const MOCK_MARKER_DETAIL = {
  marker: {
    id: 1,
    name: 'anti-CMV IgG',
    pathogen_id: 1,
    pathogen_name: 'Cytomegalovirus (CMV)',
    category_id: 1,
    category_name: 'TORCH',
    antibody_type: 'IgG',
    marker_type: 'Antibody',
    clinical_use: 'Detection of past CMV infection or immunity. Critical in pregnancy screening and immunocompromised patients.',
    interpretation_positive: 'Past infection or immunity to CMV. IgG antibodies indicate immune response.',
    interpretation_negative: 'No evidence of past CMV infection. Patient is susceptible.',
  },
  configs: [
    {
      config_id: 1,
      assay_name: 'ARCHITECT CMV IgG',
      manufacturer_name: 'Abbott',
      platform: 'ARCHITECT i2000SR',
      methodology: 'CMIA',
      quality_rating: 'excellent' as const,
      cv_lt_10_percentage: 92.9,
      cv_10_15_percentage: 7.1,
      cv_15_20_percentage: 0.0,
      cv_gt_20_percentage: 0.0,
      events_examined: 70,
      test_type: 'serology' as const,
    },
    {
      config_id: 2,
      assay_name: 'Elecsys CMV IgG',
      manufacturer_name: 'Roche',
      platform: 'cobas e411',
      methodology: 'ECLIA',
      quality_rating: 'excellent' as const,
      cv_lt_10_percentage: 88.5,
      cv_10_15_percentage: 11.5,
      cv_15_20_percentage: 0.0,
      cv_gt_20_percentage: 0.0,
      events_examined: 65,
      test_type: 'serology' as const,
    },
    {
      config_id: 3,
      assay_name: 'ADVIA Centaur CMV IgG',
      manufacturer_name: 'Siemens',
      platform: 'ADVIA Centaur XP',
      methodology: 'CLIA',
      quality_rating: 'good' as const,
      cv_lt_10_percentage: 85.2,
      cv_10_15_percentage: 12.3,
      cv_15_20_percentage: 2.5,
      cv_gt_20_percentage: 0.0,
      events_examined: 58,
      test_type: 'serology' as const,
    },
  ],
  totalConfigs: 3,
};

async function getMarkerDetail(id: string) {
  try {
    // In development, return mock data if database not available
    if (process.env.NODE_ENV === 'development' && !process.env.DATABASE_URL) {
      return MOCK_MARKER_DETAIL;
    }

    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/markers/${id}`,
      { cache: 'no-store' }
    );

    if (!res.ok) {
      if (res.status === 404) return null;
      throw new Error('Failed to fetch marker');
    }

    const response = await res.json();
    return response.data;
  } catch (error) {
    console.error('Error fetching marker detail:', error);
    return null;
  }
}

export default async function MarkerDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const data = await getMarkerDetail(params.id);

  if (!data) {
    notFound();
  }

  const { marker, configs, totalConfigs } = data;

  // Calculate performance summary
  const avgCVLt10 =
    configs.length > 0
      ? configs.reduce((sum: number, c: any) => {
          const value = c.cv_lt_10_percentage !== null
            ? parseFloat(String(c.cv_lt_10_percentage))
            : 0;
          return sum + value;
        }, 0) / configs.length
      : 0;

  const excellentCount = configs.filter((c: any) => c.quality_rating === 'excellent').length;
  const goodCount = configs.filter((c: any) => c.quality_rating === 'good').length;
  const acceptableCount = configs.filter((c: any) => c.quality_rating === 'acceptable').length;
  const poorCount = configs.filter((c: any) => c.quality_rating === 'poor').length;

  // Get best performing assay for clinical suitability assessment
  const bestAssay = configs.length > 0
    ? configs.reduce((best: any, current: any) => {
        const bestCV = best.cv_lt_10_percentage !== null ? parseFloat(String(best.cv_lt_10_percentage)) : 0;
        const currentCV = current.cv_lt_10_percentage !== null ? parseFloat(String(current.cv_lt_10_percentage)) : 0;
        return currentCV > bestCV ? current : best;
      }, configs[0])
    : null;

  return (
    <div className="space-y-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <Link href="/markers" className="hover:text-blue-600">
          ← Back to Markers
        </Link>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h1 className="text-4xl font-bold text-gray-900">{marker.name}</h1>
          <div className="flex items-center gap-3 mt-3">
            {marker.antibody_type && (
              <Badge variant="default" size="md">
                {marker.antibody_type}
              </Badge>
            )}
            {marker.category_name && (
              <Badge variant="default" size="md">
                {marker.category_name}
              </Badge>
            )}
            {marker.pathogen_name && (
              <>
                <span className="text-gray-600">{marker.pathogen_name}</span>
                <RiskTierBadge pathogenName={marker.pathogen_name} />
              </>
            )}
          </div>
        </div>
        <Button variant="secondary" size="md">
          Export Data
        </Button>
      </div>

      {/* Clinical Context */}
      {marker.clinical_use && (
        <Card variant="bordered">
          <CardHeader>
            <CardTitle>Clinical Context</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 leading-relaxed">{marker.clinical_use}</p>

            {/* Interpretation */}
            {(marker.interpretation_positive || marker.interpretation_negative) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                {marker.interpretation_positive && (
                  <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <div className="font-semibold text-green-900 mb-2">
                      ✓ Positive Result
                    </div>
                    <p className="text-sm text-green-800">
                      {marker.interpretation_positive}
                    </p>
                  </div>
                )}
                {marker.interpretation_negative && (
                  <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="font-semibold text-gray-900 mb-2">
                      ✗ Negative Result
                    </div>
                    <p className="text-sm text-gray-700">
                      {marker.interpretation_negative}
                    </p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Performance Summary */}
      <Card variant="bordered">
        <CardHeader>
          <CardTitle>Performance Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
            <div>
              <div className="text-sm text-gray-600 mb-1">Total Assays</div>
              <div className="text-3xl font-bold text-gray-900">{totalConfigs}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600 mb-1">Avg CV &lt;10%</div>
              <div className="text-3xl font-bold text-blue-600">
                {avgCVLt10.toFixed(1)}%
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600 mb-1">Excellent</div>
              <div className="text-3xl font-bold text-green-600">{excellentCount}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600 mb-1">Good</div>
              <div className="text-3xl font-bold text-blue-600">{goodCount}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600 mb-1">Poor</div>
              <div className="text-3xl font-bold text-red-600">{poorCount}</div>
            </div>
          </div>

          {/* Quality Distribution Bar */}
          {totalConfigs > 0 && (
            <div className="mt-6">
              <div className="text-sm text-gray-600 mb-2">Quality Distribution</div>
              <div className="h-8 flex rounded-lg overflow-hidden">
                {excellentCount > 0 && (
                  <div
                    className="bg-green-500 flex items-center justify-center text-white text-sm font-medium"
                    style={{ width: `${(excellentCount / totalConfigs) * 100}%` }}
                  >
                    {excellentCount > 0 && `${excellentCount}`}
                  </div>
                )}
                {goodCount > 0 && (
                  <div
                    className="bg-blue-500 flex items-center justify-center text-white text-sm font-medium"
                    style={{ width: `${(goodCount / totalConfigs) * 100}%` }}
                  >
                    {goodCount > 0 && `${goodCount}`}
                  </div>
                )}
                {acceptableCount > 0 && (
                  <div
                    className="bg-amber-500 flex items-center justify-center text-white text-sm font-medium"
                    style={{ width: `${(acceptableCount / totalConfigs) * 100}%` }}
                  >
                    {acceptableCount > 0 && `${acceptableCount}`}
                  </div>
                )}
                {poorCount > 0 && (
                  <div
                    className="bg-red-500 flex items-center justify-center text-white text-sm font-medium"
                    style={{ width: `${(poorCount / totalConfigs) * 100}%` }}
                  >
                    {poorCount > 0 && `${poorCount}`}
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Clinical Suitability Assessment - Show for best performing assay */}
      {bestAssay && (
        <ClinicalSuitabilityCard
          pathogenName={marker.pathogen_name}
          cvLt10Pct={bestAssay.cv_lt_10_percentage !== null
            ? parseFloat(String(bestAssay.cv_lt_10_percentage))
            : null}
          cvGt20Pct={bestAssay.cv_gt_20_percentage !== null
            ? parseFloat(String(bestAssay.cv_gt_20_percentage))
            : null}
          showDetailedGuidance={true}
        />
      )}

      {/* Assays for this Marker */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900">
            Available Assays ({totalConfigs})
          </h2>
          <div className="flex items-center gap-2">
            <select className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="cv_desc">Best CV First</option>
              <option value="cv_asc">Worst CV First</option>
              <option value="name">Name A-Z</option>
              <option value="manufacturer">Manufacturer</option>
            </select>
          </div>
        </div>

        {/* Assays Grid */}
        <div className="space-y-4">
          {configs.map((config: any) => (
            <Card key={config.config_id} variant="bordered" className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  {/* Left: Assay Info */}
                  <div className="flex-1">
                    <div className="flex items-start gap-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {config.assay_name}
                        </h3>
                        <div className="flex items-center gap-3 mt-2 text-sm text-gray-600">
                          <Link
                            href={`/manufacturers/${config.manufacturer_id || '#'}`}
                            className="hover:text-blue-600 font-medium"
                          >
                            {config.manufacturer_name}
                          </Link>
                          {config.platform && (
                            <>
                              <span>•</span>
                              <span>{config.platform}</span>
                            </>
                          )}
                          {config.methodology && (
                            <>
                              <span>•</span>
                              <Badge variant="default" size="sm">
                                {config.methodology}
                              </Badge>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Enhanced Quality Badge with Risk Context */}
                      <QualityBadgeEnhanced
                        qualityRating={config.quality_rating}
                        pathogenName={marker.pathogen_name}
                        cvLt10Pct={config.cv_lt_10_percentage !== null
                          ? parseFloat(String(config.cv_lt_10_percentage))
                          : null}
                        cvGt20Pct={config.cv_gt_20_percentage !== null
                          ? parseFloat(String(config.cv_gt_20_percentage))
                          : null}
                        showRiskContext={true}
                        variant="default"
                      />
                    </div>

                    {/* Performance Metrics */}
                    <div className="grid grid-cols-4 gap-4 mt-4 pt-4 border-t border-gray-200">
                      <div>
                        <div className="text-xs text-gray-500 mb-1">CV &lt;10%</div>
                        <div className="text-lg font-bold text-green-600">
                          {config.cv_lt_10_percentage !== null
                            ? `${parseFloat(String(config.cv_lt_10_percentage)).toFixed(1)}%`
                            : '—'}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 mb-1">CV 10-15%</div>
                        <div className="text-lg font-bold text-blue-600">
                          {config.cv_10_15_percentage !== null
                            ? `${parseFloat(String(config.cv_10_15_percentage)).toFixed(1)}%`
                            : '—'}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 mb-1">CV 15-20%</div>
                        <div className="text-lg font-bold text-amber-600">
                          {config.cv_15_20_percentage !== null
                            ? `${parseFloat(String(config.cv_15_20_percentage)).toFixed(1)}%`
                            : '—'}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Sample Size</div>
                        <CompactEventsDisplay
                          eventsExamined={config.events_examined}
                          showConfidenceIcon={true}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex flex-col gap-2 ml-6">
                    <Link href={`/configs/${config.config_id}`}>
                      <Button variant="primary" size="sm" className="w-full">
                        View Details
                      </Button>
                    </Link>
                    <AddToCompareButton configId={config.config_id} variant="secondary" size="sm" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Empty State */}
        {configs.length === 0 && (
          <Card variant="bordered">
            <CardContent className="py-12 text-center">
              <div className="text-gray-400 text-6xl mb-4">🔬</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No assays found
              </h3>
              <p className="text-gray-600">
                There are no test configurations available for this marker
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
