/**
 * Data Confidence Badge Component
 *
 * Displays statistical confidence level based on sample size,
 * with tooltips explaining the importance of adequate sample sizes.
 *
 * Usage:
 *   <DataConfidenceBadge eventsExamined={120} />
 *   <DataConfidenceBadge eventsExamined={45} pathogenRiskTier="high" />
 *   <DataConfidenceBadge eventsExamined={15} variant="detailed" />
 *
 * @version 1.0.0
 * @generated 2025-11-12
 */

'use client';

import React from 'react';
import {
  getConfidenceProfile,
  getConfidenceRecommendation,
  assessSampleSizeAdequacy,
  formatEventsExamined,
} from '@/lib/confidence-classification';
import { Tooltip } from '@/components/ui/Tooltip';

interface DataConfidenceBadgeProps {
  /** Number of events examined */
  eventsExamined: number | null | undefined;

  /** Optional: Pathogen risk tier for context */
  pathogenRiskTier?: 'high' | 'medium' | 'low';

  /** Badge display variant */
  variant?: 'default' | 'compact' | 'detailed';

  /** Show tooltip with explanation */
  showTooltip?: boolean;

  /** Additional CSS classes */
  className?: string;
}

export function DataConfidenceBadge({
  eventsExamined,
  pathogenRiskTier,
  variant = 'default',
  showTooltip = true,
  className = '',
}: DataConfidenceBadgeProps) {
  const profile = getConfidenceProfile(eventsExamined);
  const recommendation = getConfidenceRecommendation(eventsExamined, pathogenRiskTier);

  // Get adequacy assessment if risk tier provided
  const adequacy = pathogenRiskTier
    ? assessSampleSizeAdequacy(eventsExamined, pathogenRiskTier)
    : null;

  // Compact variant - just icon
  if (variant === 'compact') {
    const badge = (
      <span
        className={`inline-flex items-center justify-center ${className}`}
        title={showTooltip ? undefined : profile.label}
      >
        <span className="text-sm">{profile.icon}</span>
      </span>
    );

    if (showTooltip) {
      return (
        <Tooltip content={
          <div className="text-sm">
            <div className="font-semibold mb-1">{profile.label}</div>
            <div className="text-xs text-gray-300">{formatEventsExamined(eventsExamined)}</div>
            <div className="text-xs text-gray-400 mt-1">{profile.description}</div>
          </div>
        }>
          {badge}
        </Tooltip>
      );
    }

    return badge;
  }

  // Default variant - icon + label
  if (variant === 'default') {
    const badge = (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border ${className}`}
        style={{
          color: profile.color,
          backgroundColor: profile.bgColor,
          borderColor: profile.borderColor,
        }}
      >
        <span className="text-sm">{profile.icon}</span>
        <span>{profile.label}</span>
        {eventsExamined !== null && eventsExamined !== undefined && (
          <span className="text-xs opacity-75">
            (n={eventsExamined})
          </span>
        )}
      </span>
    );

    if (showTooltip) {
      return (
        <Tooltip content={
          <div className="text-sm max-w-xs">
            <div className="font-semibold mb-1">{profile.label}</div>
            <div className="text-xs text-gray-300 mb-2">
              {formatEventsExamined(eventsExamined)}
            </div>
            <div className="text-xs text-gray-400 mb-2">{profile.reliability}</div>
            {adequacy && !adequacy.isAdequate && (
              <div className="text-xs text-amber-300 mt-2 p-2 bg-amber-900/30 rounded border border-amber-700">
                {adequacy.recommendation}
              </div>
            )}
          </div>
        }>
          {badge}
        </Tooltip>
      );
    }

    return badge;
  }

  // Detailed variant - full information card
  return (
    <div
      className={`rounded-lg p-3 border ${className}`}
      style={{
        backgroundColor: profile.bgColor,
        borderColor: profile.borderColor,
      }}
    >
      <div className="flex items-start gap-2 mb-2">
        <span className="text-2xl">{profile.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <span
              className="text-sm font-semibold"
              style={{ color: profile.color }}
            >
              {profile.label}
            </span>
            {eventsExamined !== null && eventsExamined !== undefined && (
              <span className="text-xs font-medium text-gray-600">
                n = {eventsExamined.toLocaleString()}
              </span>
            )}
          </div>
          <p className="text-xs text-gray-700 mb-2">
            {profile.reliability}
          </p>
        </div>
      </div>

      <div className="text-xs text-gray-600 mb-2">
        {recommendation}
      </div>

      {adequacy && (
        <div className={`mt-2 pt-2 border-t ${adequacy.isAdequate ? 'border-green-300' : 'border-amber-300'}`}>
          <div className={`text-xs ${adequacy.isAdequate ? 'text-green-700' : 'text-amber-700'}`}>
            {adequacy.recommendation}
          </div>
        </div>
      )}

      {/* Sample size guidance */}
      <div className="mt-3 pt-2 border-t border-gray-300">
        <div className="text-xs text-gray-600">
          <div className="font-medium mb-1">Sample Size Guidelines:</div>
          <div className="space-y-0.5 text-[11px]">
            <div>• ≥100 events: High confidence</div>
            <div>• 50-99 events: Medium confidence</div>
            <div>• 20-49 events: Low confidence</div>
            <div>• {'<'}20 events: Insufficient</div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Simple confidence indicator - minimal visual indicator
 * For use in tables or compact layouts
 */
export function ConfidenceIndicator({
  eventsExamined,
  className = '',
}: {
  eventsExamined: number | null | undefined;
  className?: string;
}) {
  const profile = getConfidenceProfile(eventsExamined);

  return (
    <Tooltip content={
      <div className="text-sm">
        <div className="font-semibold">{profile.label}</div>
        <div className="text-xs text-gray-300 mt-1">
          {formatEventsExamined(eventsExamined)}
        </div>
      </div>
    }>
      <div
        className={`w-2 h-2 rounded-full ${className}`}
        style={{ backgroundColor: profile.color }}
      />
    </Tooltip>
  );
}

export default DataConfidenceBadge;
