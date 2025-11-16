/**
 * Confidence Tooltip Component
 *
 * Educational tooltip explaining why sample size matters for
 * statistical confidence in CV measurements.
 *
 * Usage:
 *   <ConfidenceTooltip eventsExamined={120}>
 *     <YourComponent />
 *   </ConfidenceTooltip>
 *
 * @version 1.0.0
 * @generated 2025-11-12
 */

'use client';

import React from 'react';
import {
  getConfidenceProfile,
  getStatisticalPowerDescription,
  estimateConfidenceIntervalWidth,
} from '@/lib/confidence-classification';
import { Tooltip } from '@/components/ui/Tooltip';

interface ConfidenceTooltipProps {
  /** Number of events examined */
  eventsExamined: number | null | undefined;

  /** Child element to wrap with tooltip */
  children: React.ReactNode;

  /** Show detailed statistical explanation */
  showDetailedStats?: boolean;

  /** Additional context about pathogen risk */
  pathogenRiskTier?: 'high' | 'medium' | 'low';
}

export function ConfidenceTooltip({
  eventsExamined,
  children,
  showDetailedStats = true,
  pathogenRiskTier,
}: ConfidenceTooltipProps) {
  const profile = getConfidenceProfile(eventsExamined);
  const powerDescription = getStatisticalPowerDescription(eventsExamined);
  const ciWidth = estimateConfidenceIntervalWidth(eventsExamined);

  const tooltipContent = (
    <div className="text-sm max-w-md">
      {/* Header */}
      <div className="font-semibold mb-2 flex items-center gap-2">
        <span style={{ color: profile.color }}>{profile.icon}</span>
        <span>{profile.label}</span>
      </div>

      {/* Sample size */}
      <div className="mb-3 p-2 bg-gray-800 rounded border border-gray-700">
        <div className="text-xs text-gray-300">
          <span className="font-medium">Sample Size:</span>{' '}
          {eventsExamined !== null && eventsExamined !== undefined
            ? `${eventsExamined.toLocaleString()} events`
            : 'Not reported'}
        </div>
      </div>

      {/* Why sample size matters */}
      <div className="mb-3">
        <div className="text-xs font-medium text-gray-200 mb-1">
          Why Sample Size Matters:
        </div>
        <div className="text-xs text-gray-300 space-y-1">
          <div>
            • Larger samples = more reliable CV measurements
          </div>
          <div>
            • Small samples = CV estimates may be misleading
          </div>
          <div>
            • Adequate samples ensure clinical decisions are based on solid data
          </div>
        </div>
      </div>

      {/* Statistical power */}
      {showDetailedStats && (
        <div className="mb-3 p-2 bg-blue-900/20 rounded border border-blue-700">
          <div className="text-xs text-gray-300">
            {powerDescription}
          </div>
        </div>
      )}

      {/* Confidence interval */}
      {showDetailedStats && ciWidth && (
        <div className="mb-3">
          <div className="text-xs text-gray-400">
            <span className="font-medium">Precision:</span> CV estimates are accurate within approximately ±{ciWidth.toFixed(1)}%
          </div>
        </div>
      )}

      {/* Recommendations */}
      <div className="mt-3 pt-3 border-t border-gray-700">
        <div className="text-xs text-gray-400 italic">
          {profile.reliability}
        </div>
      </div>

      {/* Risk tier context */}
      {pathogenRiskTier && (
        <div className="mt-2 p-2 bg-amber-900/20 rounded border border-amber-700">
          <div className="text-xs text-amber-300">
            <span className="font-medium">Note:</span> {pathogenRiskTier === 'high'
              ? 'High-risk pathogens require ≥150 events for maximum confidence'
              : pathogenRiskTier === 'medium'
              ? 'Medium-risk pathogens should have ≥100 events'
              : 'Low-risk pathogens should have ≥50 events'}
          </div>
        </div>
      )}

      {/* Guidelines */}
      <div className="mt-3 pt-3 border-t border-gray-700">
        <div className="text-xs text-gray-400">
          <div className="font-medium mb-1">Sample Size Guidelines:</div>
          <div className="space-y-0.5 text-[11px]">
            <div>✓✓ ≥100 events: High confidence (recommended)</div>
            <div>✓ 50-99 events: Medium confidence (acceptable)</div>
            <div>⚠ 20-49 events: Low confidence (use caution)</div>
            <div>⚠️ {'<'}20 events: Insufficient (not valid)</div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <Tooltip content={tooltipContent}>
      {children}
    </Tooltip>
  );
}

/**
 * Simple confidence explanation tooltip (shorter version)
 */
export function SimpleConfidenceTooltip({
  eventsExamined,
  children,
}: {
  eventsExamined: number | null | undefined;
  children: React.ReactNode;
}) {
  const profile = getConfidenceProfile(eventsExamined);

  return (
    <Tooltip content={
      <div className="text-sm max-w-xs">
        <div className="font-semibold mb-1">{profile.label}</div>
        <div className="text-xs text-gray-300 mb-2">
          Based on {eventsExamined !== null && eventsExamined !== undefined
            ? `${eventsExamined.toLocaleString()} events`
            : 'unreported sample size'}
        </div>
        <div className="text-xs text-gray-400">
          {profile.description}
        </div>
      </div>
    }>
      {children}
    </Tooltip>
  );
}

export default ConfidenceTooltip;
