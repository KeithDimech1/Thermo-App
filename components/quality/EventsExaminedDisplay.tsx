/**
 * EventsExaminedDisplay Component
 *
 * Prominently displays the sample size (events_examined) with context.
 * Helps users understand the statistical reliability of CV measurements.
 */

'use client';

import { DataConfidenceBadge } from './DataConfidenceBadge';

interface EventsExaminedDisplayProps {
  eventsExamined: number | null;
  showConfidenceBadge?: boolean;
  variant?: 'default' | 'compact' | 'detailed';
}

export function EventsExaminedDisplay({
  eventsExamined,
  showConfidenceBadge = true,
  variant = 'default',
}: EventsExaminedDisplayProps) {
  if (eventsExamined === null) {
    return (
      <div className="flex items-center gap-2 text-gray-500 text-sm">
        <span className="font-medium">Events Examined:</span>
        <span>No data</span>
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div className="flex items-center gap-2 text-sm">
        <span className="text-gray-600">n =</span>
        <span className="font-semibold text-gray-900">{eventsExamined}</span>
        {showConfidenceBadge && (
          <DataConfidenceBadge eventsExamined={eventsExamined} size="sm" />
        )}
      </div>
    );
  }

  if (variant === 'detailed') {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-medium text-gray-500 uppercase">Sample Size</div>
            <div className="text-3xl font-bold text-gray-900 mt-1">
              {eventsExamined.toLocaleString()}
            </div>
            <div className="text-sm text-gray-600 mt-1">QC events examined</div>
          </div>
          {showConfidenceBadge && (
            <DataConfidenceBadge eventsExamined={eventsExamined} size="lg" />
          )}
        </div>

        <div className="p-3 bg-blue-50 border border-blue-200 rounded">
          <div className="text-xs font-semibold text-blue-900 mb-1">
            Why Sample Size Matters
          </div>
          <div className="text-xs text-blue-800">
            Larger sample sizes provide more reliable CV estimates. QConnect typically uses
            thousands of patient specimens, far exceeding traditional QC programs (20-30
            events).
          </div>
        </div>
      </div>
    );
  }

  // Default variant
  return (
    <div className="flex items-center gap-3">
      <div>
        <div className="text-xs font-medium text-gray-500 uppercase">Events Examined</div>
        <div className="text-2xl font-bold text-gray-900">
          {eventsExamined.toLocaleString()}
        </div>
      </div>
      {showConfidenceBadge && <DataConfidenceBadge eventsExamined={eventsExamined} />}
    </div>
  );
}
