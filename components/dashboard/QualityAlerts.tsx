'use client';

import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { useState } from 'react';

interface PoorPerformer {
  config_id: number;
  marker_name: string;
  manufacturer_name: string;
  assay_name: string;
  cv_gt_20_percentage: number;
  quality_rating: string;
}

interface QualityAlertsProps {
  poorPerformers: PoorPerformer[];
}

type Severity = 'critical' | 'warning';

function getSeverity(cvGt20: number): Severity {
  return cvGt20 >= 50 ? 'critical' : 'warning';
}

function getSeverityColor(severity: Severity): string {
  return severity === 'critical' ? 'red' : 'orange';
}

function getActionableInsight(performer: PoorPerformer): string {
  const severity = getSeverity(performer.cv_gt_20_percentage);

  if (severity === 'critical') {
    return 'Immediate investigation required. Consider discontinuing use until resolved.';
  }
  return 'Review recommended. Investigate potential causes and corrective actions.';
}

export function QualityAlerts({ poorPerformers }: QualityAlertsProps) {
  const [groupBy, setGroupBy] = useState<'severity' | 'manufacturer' | 'none'>('severity');

  if (poorPerformers.length === 0) {
    return (
      <Card className="bg-green-50 border-2 border-green-200">
        <div className="p-6 text-center">
          <div className="text-4xl mb-2">🎉</div>
          <div className="text-lg font-semibold text-green-800 mb-1">
            No Quality Alerts
          </div>
          <div className="text-sm text-green-600">
            All test configurations are performing well!
          </div>
        </div>
      </Card>
    );
  }

  // Categorize by severity
  const critical = poorPerformers.filter(p => getSeverity(p.cv_gt_20_percentage) === 'critical');
  const warnings = poorPerformers.filter(p => getSeverity(p.cv_gt_20_percentage) === 'warning');

  // Group by manufacturer
  const byManufacturer = poorPerformers.reduce((acc, p) => {
    const mfr = p.manufacturer_name;
    if (!acc[mfr]) acc[mfr] = [];
    acc[mfr].push(p);
    return acc;
  }, {} as Record<string, PoorPerformer[]>);

  const renderAlert = (performer: PoorPerformer) => {
    const severity = getSeverity(performer.cv_gt_20_percentage);
    const insight = getActionableInsight(performer);
    const severityColor = getSeverityColor(severity);

    return (
      <div key={performer.config_id} className="space-y-2">
        <Link
          href={`/configs/${performer.config_id}`}
          className="block"
        >
          <div className={`bg-white p-4 rounded-lg border border-${severityColor}-200 hover:border-${severityColor}-400 hover:shadow-md transition-all cursor-pointer`}>
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  {severity === 'critical' && <span className="text-red-600">🔴</span>}
                  {severity === 'warning' && <span className="text-orange-600">🟠</span>}
                  <div className="font-medium text-gray-900 truncate">
                    {performer.marker_name}
                  </div>
                </div>
                <div className="text-sm text-gray-600 truncate">
                  {performer.manufacturer_name} - {performer.assay_name}
                </div>
              </div>
              <div className="flex flex-col items-end gap-1 ml-2 shrink-0">
                <Badge
                  variant={severity === 'critical' ? 'poor' : 'acceptable'}
                  className="text-xs"
                >
                  {severity.toUpperCase()}
                </Badge>
                <Badge variant="poor" className="text-xs">
                  {performer.cv_gt_20_percentage.toFixed(1)}% {'>'}20%
                </Badge>
              </div>
            </div>

            {/* Progress bar showing poor performance */}
            <div className="mt-2">
              <div className="flex h-2 rounded overflow-hidden bg-gray-200">
                <div
                  className={severity === 'critical' ? 'bg-red-600' : 'bg-orange-500'}
                  style={{ width: `${Math.min(performer.cv_gt_20_percentage, 100)}%` }}
                />
              </div>
            </div>

            {/* Actionable insight */}
            <div className={`mt-2 text-xs ${severity === 'critical' ? 'text-red-700' : 'text-orange-700'} bg-${severityColor}-50 p-2 rounded`}>
              <span className="font-medium">Action:</span> {insight}
            </div>
          </div>
        </Link>
      </div>
    );
  };

  return (
    <Card className="bg-red-50 border-2 border-red-200">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-2xl">⚠️</span>
              <h3 className="text-lg font-semibold text-red-800">
                Quality Alerts
              </h3>
            </div>
            <p className="text-sm text-red-600">
              {critical.length} critical, {warnings.length} warning{warnings.length !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="flex gap-2">
            <Badge variant="poor" className="text-sm">
              {poorPerformers.length}
            </Badge>
          </div>
        </div>

        {/* Group By Controls */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setGroupBy('severity')}
            className={`text-xs px-3 py-1 rounded ${groupBy === 'severity' ? 'bg-red-600 text-white' : 'bg-white text-gray-700 border'}`}
          >
            By Severity
          </button>
          <button
            onClick={() => setGroupBy('manufacturer')}
            className={`text-xs px-3 py-1 rounded ${groupBy === 'manufacturer' ? 'bg-red-600 text-white' : 'bg-white text-gray-700 border'}`}
          >
            By Manufacturer
          </button>
          <button
            onClick={() => setGroupBy('none')}
            className={`text-xs px-3 py-1 rounded ${groupBy === 'none' ? 'bg-red-600 text-white' : 'bg-white text-gray-700 border'}`}
          >
            All
          </button>
        </div>

        {/* Alert List */}
        <div className="space-y-3">
          {groupBy === 'severity' && (
            <>
              {critical.length > 0 && (
                <div>
                  <div className="text-xs font-semibold text-red-800 mb-2 uppercase">Critical (≥50% CV {'>'}20%)</div>
                  <div className="space-y-2">
                    {critical.slice(0, 3).map(renderAlert)}
                  </div>
                </div>
              )}
              {warnings.length > 0 && (
                <div className="mt-4">
                  <div className="text-xs font-semibold text-orange-800 mb-2 uppercase">Warnings ({'<'}50% CV {'>'}20%)</div>
                  <div className="space-y-2">
                    {warnings.slice(0, 2).map(renderAlert)}
                  </div>
                </div>
              )}
            </>
          )}

          {groupBy === 'manufacturer' && (
            <>
              {Object.entries(byManufacturer).slice(0, 3).map(([mfr, items]) => (
                <div key={mfr}>
                  <div className="text-xs font-semibold text-gray-800 mb-2">{mfr} ({items.length})</div>
                  <div className="space-y-2">
                    {items.slice(0, 2).map(renderAlert)}
                  </div>
                </div>
              ))}
            </>
          )}

          {groupBy === 'none' && (
            poorPerformers.slice(0, 5).map(renderAlert)
          )}
        </div>

        {/* View All Link */}
        {poorPerformers.length > 5 && (
          <div className="mt-4 pt-4 border-t border-red-200">
            <Link
              href="/assays?quality_rating=poor"
              className="text-sm font-medium text-red-700 hover:text-red-900 flex items-center justify-center gap-1"
            >
              View all {poorPerformers.length} alerts
              <span>→</span>
            </Link>
          </div>
        )}

        {/* Quick Actions */}
        <div className="mt-4 pt-4 border-t border-red-200">
          <div className="text-xs font-semibold text-gray-700 mb-2">Recommended Actions:</div>
          <div className="space-y-1 text-xs text-gray-600">
            <div>• Review critical alerts immediately</div>
            <div>• Investigate potential causes (reagent lots, equipment calibration)</div>
            <div>• Consider corrective actions or alternative assays</div>
            {critical.length > 0 && <div className="text-red-700 font-medium">• Discontinue use of critical configurations until resolved</div>}
          </div>
        </div>

        {/* Help Text */}
        <div className="mt-4 pt-4 border-t border-red-200">
          <div className="text-xs text-gray-600">
            <span className="font-medium">Note:</span> Configurations with any CV measurements {'>'} 20%
            are flagged for review. Critical severity (≥50% CV {'>'}20%) requires immediate action.
          </div>
        </div>
      </div>
    </Card>
  );
}
