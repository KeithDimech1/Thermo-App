'use client';

import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

interface TopPerformer {
  manufacturer_name: string;
  avg_cv_lt_10: number;
  config_count: number;
}

interface TopPerformersProps {
  topPerformers: TopPerformer[];
}

export function TopPerformers({ topPerformers }: TopPerformersProps) {
  if (topPerformers.length === 0) {
    return (
      <Card className="bg-gray-50 border-2 border-gray-200">
        <div className="p-6 text-center">
          <div className="text-sm text-gray-500">
            No performance data available
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="bg-green-50 border-2 border-green-200">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-2xl">🏆</span>
              <h3 className="text-lg font-semibold text-green-800">
                Top Performers
              </h3>
            </div>
            <p className="text-sm text-green-600">
              Manufacturers with highest avg CV {'<'}10%
            </p>
          </div>
        </div>

        {/* Performance List */}
        <div className="space-y-3">
          {topPerformers.map((performer, index) => (
            <Link
              key={performer.manufacturer_name}
              href={`/manufacturers?search=${encodeURIComponent(performer.manufacturer_name)}`}
              className="block"
            >
              <div className="bg-white p-4 rounded-lg border border-green-200 hover:border-green-400 hover:shadow-md transition-all cursor-pointer">
                <div className="flex items-center justify-between mb-2">
                  {/* Rank Badge */}
                  <div className="flex items-center gap-3">
                    <div className={`
                      w-8 h-8 rounded-full flex items-center justify-center font-bold text-white
                      ${index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : index === 2 ? 'bg-amber-600' : 'bg-green-600'}
                    `}>
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">
                        {performer.manufacturer_name}
                      </div>
                      <div className="text-sm text-gray-600">
                        {performer.config_count} configuration{performer.config_count !== 1 ? 's' : ''}
                      </div>
                    </div>
                  </div>

                  {/* Score Badge */}
                  <Badge
                    variant={performer.avg_cv_lt_10 >= 90 ? 'excellent' : 'default'}
                    className="text-sm font-bold"
                  >
                    {performer.avg_cv_lt_10.toFixed(1)}%
                  </Badge>
                </div>

                {/* Progress Bar */}
                <div className="mt-2">
                  <div className="flex h-2 rounded overflow-hidden bg-gray-200">
                    <div
                      className={`
                        ${performer.avg_cv_lt_10 >= 90 ? 'bg-green-500' : 'bg-blue-500'}
                      `}
                      style={{ width: `${Math.min(performer.avg_cv_lt_10, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Help Text */}
        <div className="mt-4 pt-4 border-t border-green-200">
          <div className="text-xs text-gray-600">
            <span className="font-medium">Ranking based on:</span> Average percentage of CV measurements
            {'<'} 10% across all test configurations (minimum 3 configs required).
          </div>
        </div>
      </div>
    </Card>
  );
}
