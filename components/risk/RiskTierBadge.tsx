/**
 * Risk Tier Badge Component
 *
 * Displays pathogen risk classification (High/Medium/Low) with
 * color-coded visual indicators and optional tooltip.
 *
 * Usage:
 *   <RiskTierBadge pathogenName="HIV" />
 *   <RiskTierBadge pathogenName="CMV" showTooltip />
 *   <RiskTierBadge pathogenName="EBV" variant="compact" />
 *
 * @version 1.0.0
 * @generated 2025-11-12
 */

'use client';

import React from 'react';
import { getPathogenRiskProfile } from '@/lib/risk-classification';
import { Tooltip } from '@/components/ui/Tooltip';

interface RiskTierBadgeProps {
  /** Pathogen name (full name or abbreviation) */
  pathogenName: string | null | undefined;

  /** Badge display variant */
  variant?: 'default' | 'compact' | 'detailed';

  /** Show tooltip with risk explanation */
  showTooltip?: boolean;

  /** Additional CSS classes */
  className?: string;
}

export function RiskTierBadge({
  pathogenName,
  variant = 'default',
  showTooltip = true,
  className = '',
}: RiskTierBadgeProps) {
  const profile = getPathogenRiskProfile(pathogenName);

  // Compact variant - just icon
  if (variant === 'compact') {
    const badge = (
      <span
        className={`inline-flex items-center justify-center ${className}`}
        title={showTooltip ? undefined : profile.label}
      >
        <span className="text-lg">{profile.icon}</span>
      </span>
    );

    if (showTooltip) {
      return (
        <Tooltip content={
          <div className="text-sm">
            <div className="font-semibold mb-1">{profile.label} Pathogen</div>
            <div className="text-xs text-gray-300">{profile.clinicalImpact}</div>
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
      </span>
    );

    if (showTooltip) {
      return (
        <Tooltip content={
          <div className="text-sm max-w-xs">
            <div className="font-semibold mb-1">{profile.label} Risk Pathogen</div>
            <div className="text-xs text-gray-300 mb-2">{profile.clinicalImpact}</div>
            <div className="text-xs text-gray-400 italic">{profile.testingImportance}</div>
          </div>
        }>
          {badge}
        </Tooltip>
      );
    }

    return badge;
  }

  // Detailed variant - full information
  const badge = (
    <div
      className={`rounded-lg p-3 border ${className}`}
      style={{
        backgroundColor: profile.bgColor,
        borderColor: profile.borderColor,
      }}
    >
      <div className="flex items-start gap-2">
        <span className="text-2xl">{profile.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span
              className="text-sm font-semibold"
              style={{ color: profile.color }}
            >
              {profile.label} Risk Pathogen
            </span>
          </div>
          <p className="text-xs text-gray-700 mb-1">
            {profile.clinicalImpact}
          </p>
          <p className="text-xs text-gray-600 italic">
            {profile.testingImportance}
          </p>
          <div className="mt-2 pt-2 border-t border-gray-300">
            <div className="text-xs text-gray-600">
              <span className="font-medium">Recommended CV:</span>{' '}
              {'<'}{profile.cvThreshold.excellent}% excellent, {'<'}{profile.cvThreshold.acceptable}% acceptable
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return badge;
}

/**
 * Risk Tier Indicator - Simple inline indicator
 * Used in tables or compact layouts
 */
export function RiskTierIndicator({
  pathogenName,
  className = '',
}: {
  pathogenName: string | null | undefined;
  className?: string;
}) {
  const profile = getPathogenRiskProfile(pathogenName);

  return (
    <Tooltip content={
      <div className="text-sm">
        <div className="font-semibold">{profile.label} Risk</div>
        <div className="text-xs text-gray-300 mt-1">{profile.clinicalImpact}</div>
      </div>
    }>
      <div
        className={`w-2 h-2 rounded-full ${className}`}
        style={{ backgroundColor: profile.color }}
      />
    </Tooltip>
  );
}

export default RiskTierBadge;
