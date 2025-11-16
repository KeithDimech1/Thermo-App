/**
 * DataConfidenceBadge Component
 *
 * Displays data confidence level based on sample size (events_examined).
 * Based on statistical power principles from QConnect methodology.
 *
 * Confidence Levels:
 * - High (≥50 events): Robust statistical power
 * - Medium (30-49): Reliable estimates
 * - Limited (15-29): Interpret with caution
 * - Insufficient (<15): Unreliable for clinical decisions
 */

'use client';

import { useState } from 'react';

interface DataConfidenceBadgeProps {
  eventsExamined: number | null;
  showTooltip?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

type ConfidenceLevel = 'high' | 'medium' | 'limited' | 'insufficient';

interface ConfidenceConfig {
  level: ConfidenceLevel;
  label: string;
  bgColor: string;
  textColor: string;
  borderColor: string;
  icon: string;
  description: string;
  interpretation: string;
}

function getConfidenceConfig(eventsExamined: number | null): ConfidenceConfig {
  if (eventsExamined === null || eventsExamined < 15) {
    return {
      level: 'insufficient',
      label: 'Insufficient Data',
      bgColor: 'bg-gray-100',
      textColor: 'text-gray-800',
      borderColor: 'border-gray-300',
      icon: '⚠️',
      description: 'Less than 15 events examined',
      interpretation: 'Sample size too small for reliable statistical conclusions. Do not use for clinical decisions.',
    };
  }

  if (eventsExamined < 30) {
    return {
      level: 'limited',
      label: 'Limited Confidence',
      bgColor: 'bg-amber-100',
      textColor: 'text-amber-800',
      borderColor: 'border-amber-300',
      icon: '⚡',
      description: '15-29 events examined',
      interpretation: 'Limited statistical power. Results should be interpreted with caution and may require confirmation.',
    };
  }

  if (eventsExamined < 50) {
    return {
      level: 'medium',
      label: 'Medium Confidence',
      bgColor: 'bg-blue-100',
      textColor: 'text-blue-800',
      borderColor: 'border-blue-300',
      icon: '✓',
      description: '30-49 events examined',
      interpretation: 'Adequate statistical power for reliable CV estimates. Results generally trustworthy for clinical use.',
    };
  }

  return {
    level: 'high',
    label: 'High Confidence',
    bgColor: 'bg-green-100',
    textColor: 'text-green-800',
    borderColor: 'border-green-300',
    icon: '✓✓',
    description: '50+ events examined',
    interpretation: 'Robust statistical power with large sample size. Results highly reliable for clinical decision-making.',
  };
}

const sizeClasses = {
  sm: 'text-xs px-2 py-1',
  md: 'text-sm px-3 py-1.5',
  lg: 'text-base px-4 py-2',
};

export function DataConfidenceBadge({
  eventsExamined,
  showTooltip = true,
  size = 'md',
}: DataConfidenceBadgeProps) {
  const [isTooltipVisible, setIsTooltipVisible] = useState(false);
  const config = getConfidenceConfig(eventsExamined);

  const badgeClasses = `
    inline-flex items-center gap-1.5 rounded-full font-medium border
    ${config.bgColor} ${config.textColor} ${config.borderColor}
    ${sizeClasses[size]}
    ${showTooltip ? 'cursor-help' : ''}
  `;

  const badge = (
    <span
      className={badgeClasses}
      onMouseEnter={() => showTooltip && setIsTooltipVisible(true)}
      onMouseLeave={() => setIsTooltipVisible(false)}
    >
      <span>{config.icon}</span>
      <span>{config.label}</span>
      {eventsExamined !== null && size !== 'sm' && (
        <span className="text-xs opacity-75">({eventsExamined} events)</span>
      )}
    </span>
  );

  if (!showTooltip) {
    return badge;
  }

  return (
    <div className="relative inline-block">
      {badge}

      {isTooltipVisible && (
        <div className="absolute z-50 w-80 p-4 mt-2 bg-white border border-gray-200 rounded-lg shadow-xl left-0">
          <div className="space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-gray-200">
              <span className="text-2xl">{config.icon}</span>
              <div>
                <div className="font-semibold text-gray-900">{config.label}</div>
                <div className="text-sm text-gray-600">
                  {eventsExamined !== null ? `${eventsExamined} events examined` : 'No data'}
                </div>
              </div>
            </div>

            <div>
              <div className="text-xs font-medium text-gray-500 uppercase mb-1">
                Sample Size
              </div>
              <div className="text-sm text-gray-700">{config.description}</div>
            </div>

            <div>
              <div className="text-xs font-medium text-gray-500 uppercase mb-1">
                Interpretation
              </div>
              <div className="text-sm text-gray-700">{config.interpretation}</div>
            </div>

            <div className="bg-blue-50 p-3 rounded border border-blue-200">
              <div className="text-xs font-semibold text-blue-900 mb-1">
                Traditional QC vs QConnect
              </div>
              <div className="text-xs text-blue-800">
                Traditional QC programs typically use 20-30 samples. QConnect uses thousands
                of patient specimens for more robust statistics.
              </div>
            </div>

            <div className="pt-2 border-t border-gray-200">
              <div className="text-xs text-gray-500">
                <strong>Reference:</strong> Dimech W. Clin Microbiol Rev. 2021;34(4):e00035-21
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
