/**
 * Manufacturers List Page
 *
 * Browse all manufacturers with performance metrics
 */

export const dynamic = 'force-dynamic';

import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import Link from 'next/link';
import { getAllManufacturers } from '@/lib/db/queries';

async function getManufacturers(dataset: string = 'curated') {
  try {
    const manufacturers = await getAllManufacturers(dataset as 'curated' | 'all');
    return manufacturers;
  } catch (error) {
    console.error('Error fetching manufacturers:', error);
    return [];
  }
}

export default async function ManufacturersPage({
  searchParams,
}: {
  searchParams: { dataset?: string };
}) {
  const dataset = searchParams.dataset || 'curated';
  const manufacturers = await getManufacturers(dataset);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-gray-900">Manufacturers</h1>
          <p className="text-gray-600 mt-2">
            Compare performance across diagnostic testing platforms
          </p>
        </div>
        <div className="text-sm text-gray-500">
          {manufacturers.length} manufacturers
        </div>
      </div>

      {/* Manufacturers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {manufacturers.map((manufacturer: any) => (
          <Link key={manufacturer.id} href={`/manufacturers/${manufacturer.id}`}>
            <Card
              variant="bordered"
              className="hover:shadow-md transition-all hover:border-blue-300"
            >
              <CardContent className="pt-6">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">
                      {manufacturer.name}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {manufacturer.total_configs} test configurations
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-blue-600">
                      {parseFloat(String(manufacturer.avg_cv_lt_10_pct || '0')).toFixed(1)}%
                    </div>
                    <div className="text-xs text-gray-500">Avg CV &lt;10%</div>
                  </div>
                </div>

                {/* Performance Breakdown */}
                <div className="grid grid-cols-4 gap-2 mt-4">
                  <div className="text-center">
                    <div className="text-lg font-semibold text-green-600">
                      {manufacturer.excellent_count}
                    </div>
                    <Badge variant="excellent" size="sm" className="mt-1">
                      Excellent
                    </Badge>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold text-blue-600">
                      {manufacturer.good_count}
                    </div>
                    <Badge variant="good" size="sm" className="mt-1">
                      Good
                    </Badge>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold text-amber-600">
                      {manufacturer.acceptable_count}
                    </div>
                    <Badge variant="acceptable" size="sm" className="mt-1">
                      Accept.
                    </Badge>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold text-red-600">
                      {manufacturer.poor_count}
                    </div>
                    <Badge variant="poor" size="sm" className="mt-1">
                      Poor
                    </Badge>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mt-4">
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden flex">
                    <div
                      className="bg-green-500"
                      style={{
                        width: `${(manufacturer.excellent_count / manufacturer.total_configs) * 100}%`,
                      }}
                    />
                    <div
                      className="bg-blue-500"
                      style={{
                        width: `${(manufacturer.good_count / manufacturer.total_configs) * 100}%`,
                      }}
                    />
                    <div
                      className="bg-amber-500"
                      style={{
                        width: `${(manufacturer.acceptable_count / manufacturer.total_configs) * 100}%`,
                      }}
                    />
                    <div
                      className="bg-red-500"
                      style={{
                        width: `${(manufacturer.poor_count / manufacturer.total_configs) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Empty State */}
      {manufacturers.length === 0 && (
        <Card variant="bordered">
          <CardContent className="py-12 text-center">
            <div className="text-gray-400 text-6xl mb-4">🏭</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No manufacturers found
            </h3>
            <p className="text-gray-600">
              Configure your database connection to load manufacturer data
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
