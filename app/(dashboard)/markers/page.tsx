/**
 * Markers List Page
 *
 * Browse all test markers grouped by category
 */

export const dynamic = 'force-dynamic';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import Link from 'next/link';
import { getMarkersByCategory } from '@/lib/db/queries';
import { AddToCompareButton } from '@/components/compare/AddToCompareButton';

async function getMarkers() {
  try {
    // In development, return mock data if database not available
    if (process.env.NODE_ENV === 'development' && !process.env.DATABASE_URL) {
      return [
        {
          category_id: 1,
          category_name: 'TORCH',
          markers: [
            { id: 1, name: 'anti-CMV IgG', antibody_type: 'IgG', marker_type: 'Antibody' },
            { id: 2, name: 'anti-CMV IgM', antibody_type: 'IgM', marker_type: 'Antibody' },
            { id: 3, name: 'anti-Toxoplasma IgG', antibody_type: 'IgG', marker_type: 'Antibody' },
            { id: 4, name: 'anti-Rubella IgG', antibody_type: 'IgG', marker_type: 'Antibody' },
          ],
        },
        {
          category_id: 2,
          category_name: 'Hepatitis',
          markers: [
            { id: 5, name: 'HBsAg', antibody_type: 'Antigen', marker_type: 'Antigen' },
            { id: 6, name: 'anti-HBc Total', antibody_type: 'Antibody (Total)', marker_type: 'Antibody' },
            { id: 7, name: 'anti-HCV', antibody_type: 'Antibody (Total)', marker_type: 'Antibody' },
          ],
        },
        {
          category_id: 3,
          category_name: 'Retrovirus',
          markers: [
            { id: 8, name: 'anti-HIV 1+2', antibody_type: 'Antibody (Total)', marker_type: 'Antibody' },
          ],
        },
      ];
    }

    // Call database query function directly instead of using fetch
    const markers = await getMarkersByCategory();
    return markers;
  } catch (error) {
    console.error('Error fetching markers:', error);
    return [];
  }
}

export default async function MarkersPage() {
  const markersByCategory = await getMarkers();

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-gray-900">Markers</h1>
          <p className="text-gray-600 mt-2">
            Browse test markers across infectious disease categories
          </p>
        </div>
        <div className="text-sm text-gray-500">
          {markersByCategory.reduce((sum: number, cat: any) => sum + cat.markers.length, 0)} markers
        </div>
      </div>

      {/* Markers by Category */}
      <div className="space-y-6">
        {markersByCategory.map((category: any) => (
          <Card key={category.category_id} variant="bordered">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-2xl">{category.category_name}</CardTitle>
                <Badge variant="default" size="sm">
                  {category.markers.length} markers
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {category.markers.map((marker: any) => {
                  // Color coding based on average CV performance
                  const avgCV = marker.avg_cv_lt_10 || 0;
                  let borderColor = 'border-gray-300';
                  let bgColor = 'bg-white';
                  let cvColor = 'text-gray-600';

                  if (avgCV >= 80) {
                    borderColor = 'border-green-300';
                    bgColor = 'bg-green-50';
                    cvColor = 'text-green-700';
                  } else if (avgCV >= 60) {
                    borderColor = 'border-blue-300';
                    bgColor = 'bg-blue-50';
                    cvColor = 'text-blue-700';
                  } else if (avgCV >= 40) {
                    borderColor = 'border-amber-300';
                    bgColor = 'bg-amber-50';
                    cvColor = 'text-amber-700';
                  } else if (avgCV > 0) {
                    borderColor = 'border-orange-300';
                    bgColor = 'bg-orange-50';
                    cvColor = 'text-orange-700';
                  }

                  return (
                    <div
                      key={marker.id}
                      className={`p-4 rounded-lg border ${borderColor} ${bgColor} transition-all hover:shadow-md`}
                    >
                      {/* Marker Name */}
                      <Link href={`/markers/${marker.id}`} className="block mb-3">
                        <div className="font-semibold text-gray-900 hover:text-blue-600 transition-colors">
                          {marker.name}
                        </div>
                      </Link>

                      {/* Stats Row */}
                      <div className="flex items-center justify-between mb-3 text-xs">
                        <div className="flex items-center gap-3">
                          <span className="text-gray-600">
                            {marker.config_count || 0} assay{marker.config_count !== 1 ? 's' : ''}
                          </span>
                          {marker.avg_cv_lt_10 && (
                            <span className={`font-semibold ${cvColor}`}>
                              {marker.avg_cv_lt_10.toFixed(1)}% avg CV
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Badges */}
                      <div className="flex items-center gap-2 mb-3 flex-wrap">
                        {marker.antibody_type && (
                          <Badge variant="default" size="sm">
                            {marker.antibody_type}
                          </Badge>
                        )}
                        {marker.pathogen_name && (
                          <span className="text-xs text-gray-500">
                            {marker.pathogen_name}
                          </span>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-2">
                        <Link href={`/markers/${marker.id}`} className="flex-1">
                          <button className="w-full px-3 py-1.5 text-sm font-medium text-blue-700 bg-white border border-blue-300 rounded-md hover:bg-blue-50 transition-colors">
                            View All
                          </button>
                        </Link>
                        {marker.best_config_id && (
                          <AddToCompareButton
                            configId={marker.best_config_id}
                            variant="primary"
                            size="sm"
                            className="flex-1"
                          />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {markersByCategory.length === 0 && (
        <Card variant="bordered">
          <CardContent className="py-12 text-center">
            <div className="text-gray-400 text-6xl mb-4">🔬</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No markers found</h3>
            <p className="text-gray-600">
              Configure your database connection to load marker data
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
