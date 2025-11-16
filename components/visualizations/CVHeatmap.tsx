/**
 * CVHeatmap Component
 *
 * Displays a heatmap matrix of CV performance:
 * - Rows: Markers
 * - Columns: Manufacturers
 * - Color: CV <10% percentage (green = excellent, red = poor)
 *
 * Based on Dimech (2021) research showing CV% is the only valid comparison metric
 * across different manufacturers and platforms.
 */

'use client';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import Link from 'next/link';

interface HeatmapCell {
  marker_id: number;
  marker_name: string;
  manufacturer_id: number;
  manufacturer_name: string;
  cv_lt_10_percentage: number | null;
  quality_rating: 'excellent' | 'good' | 'acceptable' | 'poor';
  config_id: number;
}

interface CVHeatmapProps {
  data: HeatmapCell[];
  title?: string;
  showLegend?: boolean;
}

function getColorForCV(cvPercentage: number | null): string {
  if (cvPercentage === null) return '#f3f4f6'; // gray-100

  if (cvPercentage >= 95) return '#10b981'; // green-500 (excellent)
  if (cvPercentage >= 80) return '#34d399'; // green-400 (very good)
  if (cvPercentage >= 60) return '#60a5fa'; // blue-400 (good)
  if (cvPercentage >= 40) return '#fbbf24'; // amber-400 (acceptable)
  if (cvPercentage >= 20) return '#fb923c'; // orange-400 (concerning)
  return '#ef4444'; // red-500 (poor)
}

function getTextColorForCV(cvPercentage: number | null): string {
  if (cvPercentage === null) return '#6b7280'; // gray-500
  if (cvPercentage >= 60) return '#ffffff'; // white for darker backgrounds
  return '#111827'; // gray-900 for lighter backgrounds
}

export function CVHeatmap({ data, title = 'CV Performance Heatmap', showLegend = true }: CVHeatmapProps) {
  // Extract unique markers and manufacturers
  const markers = Array.from(
    new Set(data.map((cell) => JSON.stringify({ id: cell.marker_id, name: cell.marker_name })))
  ).map((str) => JSON.parse(str));

  const manufacturers = Array.from(
    new Set(data.map((cell) => JSON.stringify({ id: cell.manufacturer_id, name: cell.manufacturer_name })))
  ).map((str) => JSON.parse(str));

  // Sort alphabetically
  markers.sort((a, b) => a.name.localeCompare(b.name));
  manufacturers.sort((a, b) => a.name.localeCompare(b.name));

  // Create lookup map
  const dataMap = new Map<string, HeatmapCell>();
  data.forEach((cell) => {
    const key = `${cell.marker_id}-${cell.manufacturer_id}`;
    dataMap.set(key, cell);
  });

  // Get cell for marker + manufacturer
  const getCell = (markerId: number, manufacturerId: number): HeatmapCell | null => {
    const key = `${markerId}-${manufacturerId}`;
    return dataMap.get(key) || null;
  };

  if (data.length === 0) {
    return (
      <Card variant="bordered">
        <CardContent className="py-12 text-center">
          <div className="text-gray-400 text-6xl mb-4">📊</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No heatmap data available
          </h3>
          <p className="text-gray-600">
            Data will appear here once test configurations are available
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card variant="bordered">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{title}</CardTitle>
          {showLegend && (
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded" style={{ backgroundColor: '#10b981' }}></div>
                <span className="text-gray-600">Excellent (≥95%)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded" style={{ backgroundColor: '#60a5fa' }}></div>
                <span className="text-gray-600">Good (60-95%)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded" style={{ backgroundColor: '#fbbf24' }}></div>
                <span className="text-gray-600">Acceptable (40-60%)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded" style={{ backgroundColor: '#ef4444' }}></div>
                <span className="text-gray-600">Poor (&lt;40%)</span>
              </div>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="border border-gray-300 bg-gray-100 p-2 text-left text-sm font-semibold text-gray-900 sticky left-0 z-10">
                  Marker
                </th>
                {manufacturers.map((mfr) => (
                  <th
                    key={mfr.id}
                    className="border border-gray-300 bg-gray-100 p-2 text-left text-sm font-semibold text-gray-900 min-w-[100px]"
                  >
                    {mfr.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {markers.map((marker) => (
                <tr key={marker.id}>
                  <td className="border border-gray-300 bg-gray-50 p-2 text-sm font-medium text-gray-900 sticky left-0 z-10">
                    {marker.name}
                  </td>
                  {manufacturers.map((mfr) => {
                    const cell = getCell(marker.id, mfr.id);
                    if (!cell) {
                      return (
                        <td
                          key={`${marker.id}-${mfr.id}`}
                          className="border border-gray-300 p-2 bg-gray-50 text-center text-sm text-gray-400"
                        >
                          —
                        </td>
                      );
                    }

                    const bgColor = getColorForCV(cell.cv_lt_10_percentage);
                    const textColor = getTextColorForCV(cell.cv_lt_10_percentage);

                    return (
                      <td
                        key={`${marker.id}-${mfr.id}`}
                        className="border border-gray-300 p-2"
                        style={{ backgroundColor: bgColor }}
                      >
                        <Link
                          href={`/configs/${cell.config_id}`}
                          className="block text-center hover:underline"
                          style={{ color: textColor }}
                        >
                          <div className="text-sm font-semibold">
                            {cell.cv_lt_10_percentage !== null
                              ? `${cell.cv_lt_10_percentage.toFixed(1)}%`
                              : 'N/A'}
                          </div>
                        </Link>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Educational note */}
        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-900">
            <strong>Note:</strong> Each cell shows the percentage of CV measurements below 10% for that
            marker-manufacturer combination. Higher percentages (green) indicate more consistent
            performance. Click any cell to view detailed configuration information.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
