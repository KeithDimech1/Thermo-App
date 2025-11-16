/**
 * Manufacturer Detail Page
 *
 * Shows detailed information about a specific manufacturer including:
 * - Company information
 * - Performance summary across all assays
 * - List of all test configurations by this manufacturer
 * - Platform comparison (if multiple platforms)
 */

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  getAllManufacturers,
  getManufacturerById,
  getAssaysByManufacturerId,
  getConfigsByManufacturerId,
} from '@/lib/db/queries';

// Generate static params for all manufacturer pages at build time
export async function generateStaticParams() {
  try {
    const manufacturers = await getAllManufacturers();
    return manufacturers.map((manufacturer) => ({
      id: manufacturer.id.toString(),
    }));
  } catch (error) {
    console.error('Error generating static params for manufacturers:', error);
    return [];
  }
}

async function getManufacturerDetail(id: string) {
  try {
    const manufacturerId = parseInt(id);
    if (isNaN(manufacturerId)) return null;

    // Get manufacturer with performance data
    const manufacturer = await getManufacturerById(manufacturerId);
    if (!manufacturer) return null;

    // Get manufacturer's assays
    const assays = await getAssaysByManufacturerId(manufacturerId);

    // Get manufacturer's test configurations
    const configs = await getConfigsByManufacturerId(manufacturerId);

    return {
      manufacturer,
      assays,
      configs,
    };
  } catch (error) {
    console.error('Error fetching manufacturer detail:', error);
    return null;
  }
}

function getQualityBadgeVariant(rating: string) {
  switch (rating) {
    case 'excellent':
      return 'excellent';
    case 'good':
      return 'good';
    case 'acceptable':
      return 'acceptable';
    case 'poor':
      return 'poor';
    default:
      return 'default';
  }
}

// Helper to safely convert to number (handles string values from database)
function toNum(value: any): number {
  if (value === null || value === undefined) return 0;
  const num = typeof value === 'string' ? parseFloat(value) : Number(value);
  return isNaN(num) ? 0 : num;
}

export default async function ManufacturerDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const data = await getManufacturerDetail(params.id);

  if (!data) {
    notFound();
  }

  const { manufacturer, assays, configs } = data;

  // Calculate performance metrics
  const totalConfigs = configs.length;
  const avgCVLt10 =
    totalConfigs > 0
      ? configs.reduce((sum: number, c: any) => sum + toNum(c.cv_lt_10_percentage), 0) /
        totalConfigs
      : 0;

  const excellentCount = configs.filter((c: any) => c.quality_rating === 'excellent').length;
  const goodCount = configs.filter((c: any) => c.quality_rating === 'good').length;
  const acceptableCount = configs.filter((c: any) => c.quality_rating === 'acceptable').length;
  const poorCount = configs.filter((c: any) => c.quality_rating === 'poor').length;

  // Group configs by platform
  const platformGroups = configs.reduce((acc: any, config: any) => {
    const platform = config.platform || 'Unknown';
    if (!acc[platform]) {
      acc[platform] = [];
    }
    acc[platform].push(config);
    return acc;
  }, {});

  const platforms = Object.keys(platformGroups);

  return (
    <div className="space-y-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <Link href="/manufacturers" className="hover:text-blue-600">
          ← Back to Manufacturers
        </Link>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h1 className="text-4xl font-bold text-gray-900">{manufacturer.name}</h1>
          <div className="flex items-center gap-3 mt-3">
            <Badge variant="default" size="md">
              {totalConfigs} Test Configurations
            </Badge>
            <Badge variant="default" size="md">
              {assays.length} Assays
            </Badge>
          </div>
        </div>
        <Button variant="secondary" size="md">
          Export Data
        </Button>
      </div>

      {/* Performance Summary */}
      <Card variant="bordered">
        <CardHeader>
          <CardTitle>Overall Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
            <div>
              <div className="text-sm text-gray-600 mb-1">Total Configs</div>
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

      {/* Platform Breakdown (if multiple platforms) */}
      {platforms.length > 1 && (
        <Card variant="bordered">
          <CardHeader>
            <CardTitle>Performance by Platform</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {platforms.map((platform) => {
                const platformConfigs = platformGroups[platform];
                const platformAvgCV =
                  platformConfigs.reduce(
                    (sum: number, c: any) => sum + toNum(c.cv_lt_10_percentage),
                    0
                  ) / platformConfigs.length;
                const platformExcellent = platformConfigs.filter(
                  (c: any) => c.quality_rating === 'excellent'
                ).length;

                return (
                  <div key={platform} className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-gray-900">{platform}</h3>
                      <Badge variant="default" size="sm">
                        {platformConfigs.length} configs
                      </Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Avg CV &lt;10%:</span>
                        <span className="ml-2 font-semibold text-blue-600">
                          {platformAvgCV.toFixed(1)}%
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Excellent:</span>
                        <span className="ml-2 font-semibold text-green-600">
                          {platformExcellent}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Total:</span>
                        <span className="ml-2 font-semibold text-gray-900">
                          {platformConfigs.length}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Test Configurations */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900">
            Test Configurations ({totalConfigs})
          </h2>
          <div className="flex items-center gap-2">
            <select className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="cv_desc">Best CV First</option>
              <option value="cv_asc">Worst CV First</option>
              <option value="marker">By Marker</option>
              <option value="platform">By Platform</option>
            </select>
            <select className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">All Platforms</option>
              {platforms.map((platform) => (
                <option key={platform} value={platform}>
                  {platform}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Configs Grid */}
        <div className="space-y-4">
          {configs.map((config: any) => (
            <Card key={config.config_id} variant="bordered" className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  {/* Left: Config Info */}
                  <div className="flex-1">
                    <div className="flex items-start gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <Link
                            href={`/markers/${config.marker_id || '#'}`}
                            className="text-lg font-semibold text-blue-600 hover:text-blue-700"
                          >
                            {config.marker_name}
                          </Link>
                          <span className="text-gray-400">•</span>
                          <span className="text-gray-600">{config.assay_name}</span>
                        </div>
                        <div className="flex items-center gap-3 mt-2 text-sm text-gray-600">
                          {config.platform && <span>{config.platform}</span>}
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

                      {/* Quality Badge */}
                      <Badge
                        variant={getQualityBadgeVariant(config.quality_rating)}
                        size="lg"
                      >
                        {config.quality_rating.charAt(0).toUpperCase() +
                          config.quality_rating.slice(1)}
                      </Badge>
                    </div>

                    {/* Performance Metrics */}
                    <div className="grid grid-cols-4 gap-4 mt-4 pt-4 border-t border-gray-200">
                      <div>
                        <div className="text-xs text-gray-500 mb-1">CV &lt;10%</div>
                        <div className="text-lg font-bold text-green-600">
                          {config.cv_lt_10_percentage ? toNum(config.cv_lt_10_percentage).toFixed(1) : '—'}%
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 mb-1">CV 10-15%</div>
                        <div className="text-lg font-bold text-blue-600">
                          {config.cv_10_15_percentage ? toNum(config.cv_10_15_percentage).toFixed(1) : '—'}%
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 mb-1">CV 15-20%</div>
                        <div className="text-lg font-bold text-amber-600">
                          {config.cv_15_20_percentage ? toNum(config.cv_15_20_percentage).toFixed(1) : '—'}%
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Events</div>
                        <div className="text-lg font-bold text-gray-900">
                          {config.events_examined || '—'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex flex-col gap-2 ml-6">
                    <Button variant="primary" size="sm">
                      View Details
                    </Button>
                    <Button variant="secondary" size="sm">
                      Add to Compare
                    </Button>
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
                No configurations found
              </h3>
              <p className="text-gray-600">
                There are no test configurations available for this manufacturer
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
