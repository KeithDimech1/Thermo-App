/**
 * Analytics Tabs Component
 *
 * Client component that organizes analytics content into tabs
 * Separates different visualizations for better organization
 */

'use client';

import { Tabs } from '@/components/ui/Tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { CVHeatmap } from '@/components/visualizations/CVHeatmap';
import { CVDistributionChart } from '@/components/visualizations/CVDistributionChart';
import { CVExplainerCard } from '@/components/education/CVExplainerCard';
import { StatisticalSummary } from '@/components/analytics/StatisticalSummary';

interface AnalyticsTabsProps {
  dataset: 'curated' | 'all';
  overallStats: {
    totalConfigs: number;
    totalMarkers: number;
    totalManufacturers: number;
    totalAssays: number;
    avgCVLt10Pct: number;
  };
  qualityDist: {
    excellent: number;
    good: number;
    acceptable: number;
    poor: number;
  };
  excellentPct: string;
  goodOrBetterPct: string;
  heatmapData: any[];
  distributionData: any[];
}

export function AnalyticsTabs({
  dataset,
  overallStats,
  qualityDist,
  excellentPct,
  goodOrBetterPct,
  heatmapData,
  distributionData,
}: AnalyticsTabsProps) {
  const tabs = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'heatmap', label: 'CV Heatmap', icon: '🔥' },
    { id: 'distribution', label: 'CV Distribution', icon: '📈' },
    { id: 'quality', label: 'Quality Ratings', icon: '⭐' },
    { id: 'statistics', label: 'Statistical Analysis', icon: '🔬' },
  ];

  return (
    <Tabs tabs={tabs} defaultTab="overview">
      {(activeTab) => (
        <>
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-8">
              {/* Summary Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card variant="bordered">
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-blue-600">
                        {overallStats.totalConfigs}
                      </div>
                      <div className="text-sm text-gray-600 mt-1">Test Configurations</div>
                    </div>
                  </CardContent>
                </Card>

                <Card variant="bordered">
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-green-600">{excellentPct}%</div>
                      <div className="text-sm text-gray-600 mt-1">Excellent Quality</div>
                      <div className="text-xs text-gray-500 mt-1">CV &lt;10% for all levels</div>
                    </div>
                  </CardContent>
                </Card>

                <Card variant="bordered">
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-blue-600">{goodOrBetterPct}%</div>
                      <div className="text-sm text-gray-600 mt-1">Good or Better</div>
                      <div className="text-xs text-gray-500 mt-1">Excellent + Good ratings</div>
                    </div>
                  </CardContent>
                </Card>

                <Card variant="bordered">
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-purple-600">
                        {overallStats.avgCVLt10Pct.toFixed(1)}%
                      </div>
                      <div className="text-sm text-gray-600 mt-1">Average CV &lt;10%</div>
                      <div className="text-xs text-gray-500 mt-1">Across all configurations</div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Educational Component */}
              <CVExplainerCard variant="compact" />

              {/* Dataset Info */}
              <Card variant="bordered" className="bg-gray-50 border-gray-200">
                <CardContent className="py-4">
                  <div className="flex items-start gap-3">
                    <div className="text-2xl">ℹ️</div>
                    <div>
                      <p className="text-sm text-gray-900 font-medium mb-1">
                        Currently viewing: {dataset === 'curated' ? 'Curated' : 'All'} Data
                      </p>
                      <p className="text-sm text-gray-700">
                        {dataset === 'curated'
                          ? 'Showing validated test configurations (132 configs). Use the dataset toggle in the navigation to view all data including NAT and serology extended datasets.'
                          : 'Showing all test configurations (261 configs) including NAT and serology extended datasets. Use the dataset toggle to view only curated data.'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Research Reference */}
              <Card variant="bordered" className="bg-indigo-50 border-indigo-200">
                <CardContent className="py-4">
                  <p className="text-sm text-indigo-900">
                    <strong>Research Foundation:</strong> These visualizations are based on
                    analysis methods from Dimech W. "The standardization and control of serology
                    and nucleic acid testing for infectious diseases."{' '}
                    <em>Clin Microbiol Rev</em>. 2021;34(4):e00035-21.{' '}
                    <a
                      href="https://doi.org/10.1128/CMR.00035-21"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-600 hover:text-indigo-800 underline"
                    >
                      View Publication
                    </a>
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Heatmap Tab */}
          {activeTab === 'heatmap' && (
            <div className="space-y-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">CV Performance Heatmap</h2>
                <p className="text-gray-600 mt-1">
                  Marker × Manufacturer matrix showing percentage of measurements with CV &lt;10%
                </p>
              </div>

              <CVHeatmap
                data={heatmapData}
                title="CV Performance by Marker and Manufacturer"
                showLegend={true}
              />

              <Card variant="bordered" className="bg-blue-50 border-blue-200">
                <CardContent className="py-4">
                  <p className="text-sm text-blue-900">
                    <strong>How to read this heatmap:</strong> Each cell represents one
                    marker-manufacturer combination. Green cells indicate excellent performance
                    (≥95% of measurements with CV &lt;10%), while red cells indicate concerning
                    performance. Click any cell to view detailed configuration information.
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Distribution Tab */}
          {activeTab === 'distribution' && (
            <div className="space-y-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  CV Distribution by Manufacturer
                </h2>
                <p className="text-gray-600 mt-1">
                  Comparison of quality ratings across manufacturers (showing manufacturers with
                  3+ configurations)
                </p>
              </div>

              <CVDistributionChart
                data={distributionData}
                title="CV Performance Distribution"
                type="stacked"
                showLegend={true}
                height={500}
              />

              <Card variant="bordered" className="bg-amber-50 border-amber-200">
                <CardContent className="py-4">
                  <p className="text-sm text-amber-900">
                    <strong>Interpreting the distribution:</strong> This chart shows what
                    percentage of each manufacturer's test configurations fall into different CV
                    buckets. Higher percentages in the green bucket (CV &lt;10% for ≥95% of
                    measurements) indicate better overall performance consistency.
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Quality Ratings Tab */}
          {activeTab === 'quality' && (
            <div className="space-y-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Overall Quality Distribution</h2>
                <p className="text-gray-600 mt-1">
                  Breakdown of test configurations by quality rating
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card variant="bordered" className="bg-green-50 border-green-200">
                  <CardHeader>
                    <CardTitle className="text-green-900">Excellent</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-4xl font-bold text-green-600">
                      {qualityDist.excellent || 0}
                    </div>
                    <div className="text-sm text-green-700 mt-2">
                      {excellentPct}% of all configurations
                    </div>
                    <div className="text-xs text-green-600 mt-2">
                      CV &lt;10% for all three QC levels
                    </div>
                  </CardContent>
                </Card>

                <Card variant="bordered" className="bg-blue-50 border-blue-200">
                  <CardHeader>
                    <CardTitle className="text-blue-900">Good</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-4xl font-bold text-blue-600">
                      {qualityDist.good || 0}
                    </div>
                    <div className="text-sm text-blue-700 mt-2">
                      {(((qualityDist.good || 0) / overallStats.totalConfigs) * 100).toFixed(1)}%
                      of all configurations
                    </div>
                    <div className="text-xs text-blue-600 mt-2">
                      CV &lt;10% for at least two QC levels
                    </div>
                  </CardContent>
                </Card>

                <Card variant="bordered" className="bg-amber-50 border-amber-200">
                  <CardHeader>
                    <CardTitle className="text-amber-900">Acceptable</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-4xl font-bold text-amber-600">
                      {qualityDist.acceptable || 0}
                    </div>
                    <div className="text-sm text-amber-700 mt-2">
                      {(
                        ((qualityDist.acceptable || 0) / overallStats.totalConfigs) *
                        100
                      ).toFixed(1)}
                      % of all configurations
                    </div>
                    <div className="text-xs text-amber-600 mt-2">
                      CV &lt;10% for at least one QC level
                    </div>
                  </CardContent>
                </Card>

                <Card variant="bordered" className="bg-red-50 border-red-200">
                  <CardHeader>
                    <CardTitle className="text-red-900">Poor</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-4xl font-bold text-red-600">
                      {qualityDist.poor || 0}
                    </div>
                    <div className="text-sm text-red-700 mt-2">
                      {(((qualityDist.poor || 0) / overallStats.totalConfigs) * 100).toFixed(1)}%
                      of all configurations
                    </div>
                    <div className="text-xs text-red-600 mt-2">
                      CV ≥10% for all three QC levels
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* Statistical Analysis Tab */}
          {activeTab === 'statistics' && (
            <div className="space-y-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Advanced Statistical Analysis
                </h2>
                <p className="text-gray-600 mt-1">
                  Control limits, process capability (Cpk), outlier detection, and distribution
                  statistics
                </p>
              </div>

              <StatisticalSummary dataset={dataset} />
            </div>
          )}
        </>
      )}
    </Tabs>
  );
}
