/**
 * Enhanced Quality Badge Component
 *
 * Combines quality rating with pathogen risk context to provide
 * meaningful interpretation of CV performance.
 *
 * Example: "Good" quality might be excellent for low-risk pathogens
 * but inadequate for high-risk blood-borne pathogens.
 *
 * Usage:
 *   <QualityBadgeEnhanced
 *     qualityRating="good"
 *     pathogenName="HIV"
 *     cvLt10Pct={82}
 *     showRiskContext
 *   />
 *
 * @version 1.0.0
 * @generated 2025-11-12
 */

'use client';

import React from 'react';
import {
  getPathogenRiskProfile,
  assessRiskAppropriateQuality,
} from '@/lib/risk-classification';
import { getQualityRatingColor, type QualityRating } from '@/lib/types/qc-data';
import { Tooltip } from '@/components/ui/Tooltip';
import { RiskTierIndicator } from './RiskTierBadge';

interface QualityBadgeEnhancedProps {
  /** Overall quality rating */
  qualityRating: QualityRating;

  /** Pathogen name for risk context */
  pathogenName: string | null | undefined;

  /** Percentage with CV <10% */
  cvLt10Pct: number | null;

  /** Percentage with CV >20% */
  cvGt20Pct?: number | null;

  /** Show risk context indicator */
  showRiskContext?: boolean;

  /** Show detailed tooltip */
  showTooltip?: boolean;

  /** Display variant */
  variant?: 'default' | 'compact' | 'detailed';

  /** Additional CSS classes */
  className?: string;
}

export function QualityBadgeEnhanced({
  qualityRating,
  pathogenName,
  cvLt10Pct,
  cvGt20Pct = null,
  showRiskContext = true,
  showTooltip = true,
  variant = 'default',
  className = '',
}: QualityBadgeEnhancedProps) {
  const riskProfile = getPathogenRiskProfile(pathogenName);
  const assessment = assessRiskAppropriateQuality(cvLt10Pct, cvGt20Pct, riskProfile.tier);
  const qualityColor = getQualityRatingColor(qualityRating);

  // Determine if quality is adequate for the risk tier
  const isAdequate = assessment.isAcceptable || assessment.isExcellent;

  // Quality rating labels
  const getQualityLabel = () => {
    const labels: Record<QualityRating, string> = {
      excellent: 'Excellent',
      good: 'Good',
      acceptable: 'Acceptable',
      poor: 'Poor',
      unknown: 'Unknown',
    };
    return labels[qualityRating];
  };

  // Get contextual message
  const getContextMessage = () => {
    if (!isAdequate && riskProfile.tier === 'high') {
      return `⚠️ May be inadequate for ${riskProfile.label.toLowerCase()}-risk testing`;
    }
    if (assessment.isExcellent) {
      return `✓ Excellent for ${riskProfile.label.toLowerCase()}-risk pathogen`;
    }
    if (isAdequate) {
      return `✓ Suitable for ${riskProfile.label.toLowerCase()}-risk testing`;
    }
    return `Consider improvement for ${riskProfile.label.toLowerCase()}-risk testing`;
  };

  // Compact variant
  if (variant === 'compact') {
    const badge = (
      <div className={`inline-flex items-center gap-1 ${className}`}>
        <div
          className="w-2 h-2 rounded-full"
          style={{ backgroundColor: qualityColor }}
        />
        {showRiskContext && <RiskTierIndicator pathogenName={pathogenName} />}
      </div>
    );

    if (showTooltip) {
      return (
        <Tooltip content={
          <div className="text-sm">
            <div className="font-semibold">{getQualityLabel()} Quality</div>
            <div className="text-xs text-gray-300 mt-1">{getContextMessage()}</div>
            {cvLt10Pct !== null && (
              <div className="text-xs text-gray-400 mt-1">
                {cvLt10Pct.toFixed(1)}% CV {'<'}10%
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

  // Default variant
  if (variant === 'default') {
    const badge = (
      <div className={`inline-flex items-center gap-2 ${className}`}>
        <span
          className="px-2.5 py-1 rounded-md text-xs font-medium text-white"
          style={{ backgroundColor: qualityColor }}
        >
          {getQualityLabel()}
        </span>
        {showRiskContext && (
          <div className="flex items-center gap-1">
            <RiskTierIndicator pathogenName={pathogenName} />
            {!isAdequate && riskProfile.tier === 'high' && (
              <span className="text-red-600 text-sm">⚠️</span>
            )}
            {assessment.isExcellent && (
              <span className="text-green-600 text-sm">✓</span>
            )}
          </div>
        )}
      </div>
    );

    if (showTooltip) {
      return (
        <Tooltip content={
          <div className="text-sm max-w-xs">
            <div className="font-semibold mb-1">
              {getQualityLabel()} Quality ({riskProfile.label} Risk Pathogen)
            </div>
            <div className="text-xs text-gray-300 mb-2">{getContextMessage()}</div>
            {cvLt10Pct !== null && (
              <div className="text-xs text-gray-400">
                Performance: {cvLt10Pct.toFixed(1)}% CV {'<'}10%
                {cvGt20Pct !== null && `, ${cvGt20Pct.toFixed(1)}% CV >`}20%
              </div>
            )}
            <div className="text-xs text-gray-400 mt-2 italic">
              {assessment.recommendation}
            </div>
          </div>
        }>
          {badge}
        </Tooltip>
      );
    }

    return badge;
  }

  // Detailed variant
  return (
    <div className={`rounded-lg border p-3 ${className}`}>
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <span
            className="px-2.5 py-1 rounded-md text-xs font-semibold text-white"
            style={{ backgroundColor: qualityColor }}
          >
            {getQualityLabel()} Quality
          </span>
          {showRiskContext && <RiskTierIndicator pathogenName={pathogenName} />}
        </div>
        {!isAdequate && riskProfile.tier === 'high' && (
          <span className="text-red-600 text-lg">⚠️</span>
        )}
        {assessment.isExcellent && (
          <span className="text-green-600 text-lg">✓</span>
        )}
      </div>

      <div className="text-sm text-gray-700 mb-2">{getContextMessage()}</div>

      {cvLt10Pct !== null && (
        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-gray-600">CV {'<'}10%:</span>
            <span className="font-medium">{cvLt10Pct.toFixed(1)}%</span>
          </div>
          {cvGt20Pct !== null && (
            <div className="flex justify-between text-xs">
              <span className="text-gray-600">CV {'>'}20%:</span>
              <span className="font-medium">{cvGt20Pct.toFixed(1)}%</span>
            </div>
          )}
        </div>
      )}

      {showRiskContext && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <div className="text-xs text-gray-600 italic">
            {assessment.recommendation}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Simple quality rating badge (original style)
 * For when risk context is not needed
 */
export function QualityBadge({
  qualityRating,
  className = '',
}: {
  qualityRating: QualityRating;
  className?: string;
}) {
  const qualityColor = getQualityRatingColor(qualityRating);
  const labels: Record<QualityRating, string> = {
    excellent: 'Excellent',
    good: 'Good',
    acceptable: 'Acceptable',
    poor: 'Poor',
    unknown: 'Unknown',
  };

  return (
    <span
      className={`px-2.5 py-1 rounded-md text-xs font-medium text-white ${className}`}
      style={{ backgroundColor: qualityColor }}
    >
      {labels[qualityRating]}
    </span>
  );
}

export default QualityBadgeEnhanced;
