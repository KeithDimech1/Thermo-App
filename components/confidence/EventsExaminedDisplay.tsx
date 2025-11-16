/**
 * Events Examined Display Component
 *
 * Prominent display of sample size (events examined) with confidence
 * indicators and educational tooltips.
 *
 * Usage:
 *   <EventsExaminedDisplay eventsExamined={120} />
 *   <EventsExaminedDisplay
 *     eventsExamined={45}
 *     pathogenRiskTier="high"
 *     variant="card"
 *   />
 *
 * @version 1.0.0
 * @generated 2025-11-12
 */

'use client';

import React from 'react';
import {
  getConfidenceProfile,
  formatEventsExamined,
  assessSampleSizeAdequacy,
} from '@/lib/confidence-classification';
import { ConfidenceTooltip } from './ConfidenceTooltip';
import { DataConfidenceBadge } from './DataConfidenceBadge';

interface EventsExaminedDisplayProps {
  /** Number of events examined */
  eventsExamined: number | null | undefined;

  /** Optional: Pathogen risk tier for context */
  pathogenRiskTier?: 'high' | 'medium' | 'low';

  /** Display variant */
  variant?: 'inline' | 'badge' | 'card';

  /** Show educational tooltip */
  showTooltip?: boolean;

  /** Additional CSS classes */
  className?: string;
}

export function EventsExaminedDisplay({
  eventsExamined,
  pathogenRiskTier,
  variant = 'inline',
  showTooltip = true,
  className = '',
}: EventsExaminedDisplayProps) {
  const profile = getConfidenceProfile(eventsExamined);
  const adequacy = pathogenRiskTier
    ? assessSampleSizeAdequacy(eventsExamined, pathogenRiskTier)
    : null;

  // Inline variant - simple text with icon
  if (variant === 'inline') {
    const display = (
      <div className={`inline-flex items-center gap-2 ${className}`}>
        <span className="text-sm font-medium text-gray-700">
          {formatEventsExamined(eventsExamined)}
        </span>
        <span className="text-sm" style={{ color: profile.color }}>
          {profile.icon}
        </span>
      </div>
    );

    if (showTooltip) {
      return (
        <ConfidenceTooltip
          eventsExamined={eventsExamined}
          pathogenRiskTier={pathogenRiskTier}
        >
          {display}
        </ConfidenceTooltip>
      );
    }

    return display;
  }

  // Badge variant - uses DataConfidenceBadge
  if (variant === 'badge') {
    return (
      <DataConfidenceBadge
        eventsExamined={eventsExamined}
        pathogenRiskTier={pathogenRiskTier}
        showTooltip={showTooltip}
        className={className}
      />
    );
  }

  // Card variant - detailed card display
  return (
    <div
      className={`rounded-lg p-4 border ${className}`}
      style={{
        backgroundColor: profile.bgColor,
        borderColor: profile.borderColor,
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="text-sm font-semibold text-gray-900">Sample Size</div>
        <span className="text-xl">{profile.icon}</span>
      </div>

      {/* Main value */}
      <div className="mb-3">
        {eventsExamined !== null && eventsExamined !== undefined ? (
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-gray-900">
              {eventsExamined.toLocaleString()}
            </span>
            <span className="text-sm text-gray-600">events examined</span>
          </div>
        ) : (
          <div className="text-lg text-gray-500 italic">Not reported</div>
        )}
      </div>

      {/* Confidence level */}
      <div className="mb-3">
        <div
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium"
          style={{
            color: profile.color,
            backgroundColor: 'white',
            border: `1px solid ${profile.borderColor}`,
          }}
        >
          <span>{profile.icon}</span>
          <span>{profile.label}</span>
        </div>
      </div>

      {/* Description */}
      <div className="text-xs text-gray-700 mb-3">
        {profile.reliability}
      </div>

      {/* Adequacy assessment */}
      {adequacy && (
        <div className={`p-2 rounded text-xs ${
          adequacy.isAdequate
            ? 'bg-green-50 text-green-800 border border-green-200'
            : 'bg-amber-50 text-amber-800 border border-amber-200'
        }`}>
          {adequacy.recommendation}
        </div>
      )}

      {/* Educational note */}
      {showTooltip && (
        <div className="mt-3 pt-3 border-t border-gray-300">
          <div className="text-xs text-gray-600">
            <div className="font-medium mb-1">💡 Why this matters:</div>
            <div className="text-[11px] text-gray-500">
              Larger sample sizes provide more reliable CV measurements.
              Hover over the {profile.icon} icon for details.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Compact Events Examined Display
 * For use in tables or space-constrained layouts
 */
export function CompactEventsDisplay({
  eventsExamined,
  showConfidenceIcon = true,
  className = '',
}: {
  eventsExamined: number | null | undefined;
  showConfidenceIcon?: boolean;
  className?: string;
}) {
  const profile = getConfidenceProfile(eventsExamined);

  if (eventsExamined === null || eventsExamined === undefined) {
    return <span className={`text-xs text-gray-400 italic ${className}`}>n/a</span>;
  }

  return (
    <ConfidenceTooltip eventsExamined={eventsExamined} showDetailedStats={false}>
      <div className={`inline-flex items-center gap-1 ${className}`}>
        <span className="text-xs font-medium text-gray-700">
          n={eventsExamined}
        </span>
        {showConfidenceIcon && (
          <span className="text-xs" style={{ color: profile.color }}>
            {profile.icon}
          </span>
        )}
      </div>
    </ConfidenceTooltip>
  );
}

/**
 * Events Examined Metric Card
 * For dashboard or analytics displays
 */
export function EventsMetricCard({
  eventsExamined,
  label = 'Events Examined',
  className = '',
}: {
  eventsExamined: number | null | undefined;
  label?: string;
  className?: string;
}) {
  const profile = getConfidenceProfile(eventsExamined);

  return (
    <div className={`bg-white rounded-lg shadow p-4 border border-gray-200 ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="text-xs font-medium text-gray-600 uppercase tracking-wide">
          {label}
        </div>
        <span className="text-lg">{profile.icon}</span>
      </div>

      <div className="mb-2">
        {eventsExamined !== null && eventsExamined !== undefined ? (
          <div className="text-2xl font-bold text-gray-900">
            {eventsExamined.toLocaleString()}
          </div>
        ) : (
          <div className="text-lg text-gray-400 italic">Not reported</div>
        )}
      </div>

      <div className="flex items-center gap-2">
        <div
          className="flex-1 h-1.5 rounded-full"
          style={{ backgroundColor: profile.borderColor }}
        >
          <div
            className="h-full rounded-full transition-all"
            style={{
              backgroundColor: profile.color,
              width: eventsExamined
                ? `${Math.min((eventsExamined / 150) * 100, 100)}%`
                : '0%',
            }}
          />
        </div>
      </div>

      <div className="mt-2">
        <span
          className="text-xs font-medium"
          style={{ color: profile.color }}
        >
          {profile.label}
        </span>
      </div>
    </div>
  );
}

export default EventsExaminedDisplay;
