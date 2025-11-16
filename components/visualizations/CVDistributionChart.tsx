/**
 * CVDistributionChart Component
 *
 * Visualizes CV distribution across test configurations using Recharts.
 * Shows percentage breakdowns for CV thresholds: <10%, 10-15%, 15-20%, >20%
 *
 * Chart types:
 * - Bar chart: Compare CV distribution across manufacturers/markers
 * - Stacked bar: Show composition of CV buckets
 * - Histogram: Show overall CV distribution
 */

'use client';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';

interface CVDistributionData {
  name: string; // Manufacturer or Marker name
  cv_lt_10: number;
  cv_10_15: number;
  cv_15_20: number;
  cv_gt_20: number;
  total_configs?: number;
}

interface CVDistributionChartProps {
  data: CVDistributionData[];
  title?: string;
  type?: 'stacked' | 'grouped' | 'simple';
  showLegend?: boolean;
  height?: number;
}

// Custom tooltip
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const total = payload.reduce((sum: number, entry: any) => sum + entry.value, 0);

    return (
      <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg">
        <p className="font-semibold text-gray-900 mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center justify-between gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-gray-600">{entry.name}:</span>
            </div>
            <span className="font-medium text-gray-900">
              {entry.value.toFixed(1)}%
            </span>
          </div>
        ))}
        {total > 0 && (
          <div className="mt-2 pt-2 border-t border-gray-200 flex justify-between text-sm">
            <span className="text-gray-600">Total:</span>
            <span className="font-bold text-gray-900">{total.toFixed(1)}%</span>
          </div>
        )}
      </div>
    );
  }
  return null;
};

export function CVDistributionChart({
  data,
  title = 'CV Distribution',
  type = 'stacked',
  showLegend = true,
  height = 400,
}: CVDistributionChartProps) {
  if (data.length === 0) {
    return (
      <Card variant="bordered">
        <CardContent className="py-12 text-center">
          <div className="text-gray-400 text-6xl mb-4">📊</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No distribution data available
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
      {title && (
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
      )}
      <CardContent>
        <ResponsiveContainer width="100%" height={height}>
          <BarChart
            data={data}
            margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="name"
              angle={-45}
              textAnchor="end"
              height={100}
              tick={{ fill: '#6b7280', fontSize: 12 }}
            />
            <YAxis
              label={{ value: 'Percentage (%)', angle: -90, position: 'insideLeft' }}
              tick={{ fill: '#6b7280', fontSize: 12 }}
            />
            <Tooltip content={<CustomTooltip />} />
            {showLegend && <Legend wrapperStyle={{ paddingTop: '20px' }} />}

            {type === 'stacked' && (
              <>
                <Bar
                  dataKey="cv_lt_10"
                  stackId="a"
                  fill="#10b981"
                  name="Excellent (<10%)"
                />
                <Bar
                  dataKey="cv_10_15"
                  stackId="a"
                  fill="#60a5fa"
                  name="Good (10-15%)"
                />
                <Bar
                  dataKey="cv_15_20"
                  stackId="a"
                  fill="#fbbf24"
                  name="Acceptable (15-20%)"
                />
                <Bar
                  dataKey="cv_gt_20"
                  stackId="a"
                  fill="#ef4444"
                  name="Poor (>20%)"
                />
              </>
            )}

            {type === 'grouped' && (
              <>
                <Bar dataKey="cv_lt_10" fill="#10b981" name="Excellent (<10%)" />
                <Bar dataKey="cv_10_15" fill="#60a5fa" name="Good (10-15%)" />
                <Bar dataKey="cv_15_20" fill="#fbbf24" name="Acceptable (15-20%)" />
                <Bar dataKey="cv_gt_20" fill="#ef4444" name="Poor (>20%)" />
              </>
            )}

            {type === 'simple' && (
              <Bar dataKey="cv_lt_10" fill="#3b82f6" name="CV <10%">
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={
                      entry.cv_lt_10 >= 80
                        ? '#10b981'
                        : entry.cv_lt_10 >= 60
                        ? '#60a5fa'
                        : entry.cv_lt_10 >= 40
                        ? '#fbbf24'
                        : '#ef4444'
                    }
                  />
                ))}
              </Bar>
            )}
          </BarChart>
        </ResponsiveContainer>

        {/* Educational note */}
        <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-sm text-amber-900">
            <strong>Interpreting this chart:</strong> Each bar shows the percentage of test
            configurations in different CV performance buckets. Higher percentages in the green/blue
            buckets indicate better overall quality consistency across that manufacturer's product
            line.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
