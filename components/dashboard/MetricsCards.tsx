'use client';

import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

interface MetricsCardsProps {
  qualityStats: {
    total: number;
    excellent: number;
    good: number;
    acceptable: number;
    poor: number;
  };
  avgCVLt10: number;
}

export function MetricsCards({ qualityStats, avgCVLt10 }: MetricsCardsProps) {
  const metrics = [
    {
      label: 'Total Configurations',
      value: qualityStats.total,
      color: 'bg-blue-500',
      textColor: 'text-blue-600',
      bgColor: 'bg-blue-50',
      description: 'All test configurations',
      icon: '📊'
    },
    {
      label: 'Excellent',
      value: qualityStats.excellent,
      color: 'bg-green-500',
      textColor: 'text-green-600',
      bgColor: 'bg-green-50',
      description: 'CV <10% for all events',
      percentage: qualityStats.total > 0
        ? ((qualityStats.excellent / qualityStats.total) * 100).toFixed(1)
        : '0',
      icon: '✅'
    },
    {
      label: 'Good',
      value: qualityStats.good,
      color: 'bg-blue-500',
      textColor: 'text-blue-600',
      bgColor: 'bg-blue-50',
      description: 'Mostly CV 10-15%',
      percentage: qualityStats.total > 0
        ? ((qualityStats.good / qualityStats.total) * 100).toFixed(1)
        : '0',
      icon: '👍'
    },
    {
      label: 'Acceptable',
      value: qualityStats.acceptable,
      color: 'bg-amber-500',
      textColor: 'text-amber-600',
      bgColor: 'bg-amber-50',
      description: 'Some CV 15-20%',
      percentage: qualityStats.total > 0
        ? ((qualityStats.acceptable / qualityStats.total) * 100).toFixed(1)
        : '0',
      icon: '⚠️'
    },
    {
      label: 'Poor',
      value: qualityStats.poor,
      color: 'bg-red-500',
      textColor: 'text-red-600',
      bgColor: 'bg-red-50',
      description: 'Any CV >20%',
      percentage: qualityStats.total > 0
        ? ((qualityStats.poor / qualityStats.total) * 100).toFixed(1)
        : '0',
      icon: '❌'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Main Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {metrics.map((metric, index) => (
          <Card key={index} className={`${metric.bgColor} border-2 border-gray-200 hover:shadow-lg transition-shadow`}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-2xl">{metric.icon}</span>
                {metric.percentage && (
                  <Badge variant="default" className="text-xs">
                    {metric.percentage}%
                  </Badge>
                )}
              </div>
              <div className={`text-3xl font-bold ${metric.textColor} mb-1`}>
                {metric.value}
              </div>
              <div className="text-sm font-medium text-gray-700 mb-1">
                {metric.label}
              </div>
              <div className="text-xs text-gray-500">
                {metric.description}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Average CV Summary */}
      <Card className="bg-gradient-to-r from-blue-50 to-cyan-50 border-2 border-blue-200">
        <div className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-gray-700 mb-1">
                Average CV {'<'}10% Performance
              </div>
              <div className="text-xs text-gray-500">
                Across all test configurations
              </div>
            </div>
            <div className="text-right">
              <div className="text-4xl font-bold text-blue-600">
                {avgCVLt10.toFixed(1)}%
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Higher is better
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Quality Distribution Bar */}
      <Card className="border-2 border-gray-200">
        <div className="p-6">
          <div className="text-sm font-medium text-gray-700 mb-3">
            Quality Distribution
          </div>
          <div className="flex h-8 rounded-lg overflow-hidden">
            <div
              className="bg-green-500 flex items-center justify-center text-white text-xs font-medium"
              style={{ width: `${(qualityStats.excellent / qualityStats.total) * 100}%` }}
              title={`Excellent: ${qualityStats.excellent}`}
            >
              {qualityStats.excellent > 0 && qualityStats.excellent}
            </div>
            <div
              className="bg-blue-500 flex items-center justify-center text-white text-xs font-medium"
              style={{ width: `${(qualityStats.good / qualityStats.total) * 100}%` }}
              title={`Good: ${qualityStats.good}`}
            >
              {qualityStats.good > 0 && qualityStats.good}
            </div>
            <div
              className="bg-amber-500 flex items-center justify-center text-white text-xs font-medium"
              style={{ width: `${(qualityStats.acceptable / qualityStats.total) * 100}%` }}
              title={`Acceptable: ${qualityStats.acceptable}`}
            >
              {qualityStats.acceptable > 0 && qualityStats.acceptable}
            </div>
            <div
              className="bg-red-500 flex items-center justify-center text-white text-xs font-medium"
              style={{ width: `${(qualityStats.poor / qualityStats.total) * 100}%` }}
              title={`Poor: ${qualityStats.poor}`}
            >
              {qualityStats.poor > 0 && qualityStats.poor}
            </div>
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-2">
            <span>Excellent</span>
            <span>Good</span>
            <span>Acceptable</span>
            <span>Poor</span>
          </div>
        </div>
      </Card>
    </div>
  );
}
