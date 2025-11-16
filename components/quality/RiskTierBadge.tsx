/**
 * RiskTierBadge Component
 *
 * Displays pathogen risk tier classification based on clinical consequences.
 */

'use client';

import { useState } from 'react';

interface RiskTierBadgeProps {
  riskTier: 'high' | 'medium' | 'low';
  pathogenName?: string;
  showTooltip?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const riskConfig = {
  high: {
    label: 'High Risk',
    bgColor: 'bg-red-100',
    textColor: 'text-red-800',
    borderColor: 'border-red-300',
    icon: '⚠️',
    description: 'HIV, Hepatitis B, Hepatitis C',
    requirement: 'Excellent quality required',
    reason: 'False-negative results have severe clinical consequences',
  },
  medium: {
    label: 'Medium Risk',
    bgColor: 'bg-amber-100',
    textColor: 'text-amber-800',
    borderColor: 'border-amber-300',
    icon: '⚡',
    description: 'CMV, Toxoplasma, Rubella, SARS-CoV-2',
    requirement: 'Good quality or better required',
    reason: 'Significant clinical impact for vulnerable populations',
  },
  low: {
    label: 'Low Risk',
    bgColor: 'bg-green-100',
    textColor: 'text-green-800',
    borderColor: 'border-green-300',
    icon: '✓',
    description: 'EBV, Measles, Parvovirus',
    requirement: 'Acceptable quality may be sufficient',
    reason: 'Less critical clinical consequences',
  },
};

const sizeClasses = {
  sm: 'text-xs px-2 py-1',
  md: 'text-sm px-3 py-1.5',
  lg: 'text-base px-4 py-2',
};

// Helper function to determine pathogen risk tier based on name
export function getPathogenRiskTier(pathogenName: string | null): 'high' | 'medium' | 'low' {
  if (!pathogenName) return 'low';

  const pathogen = pathogenName.toLowerCase();

  // High risk pathogens
  if (pathogen.includes('hiv') ||
      pathogen.includes('hepatitis b') ||
      pathogen.includes('hepatitis c') ||
      pathogen.includes('hbv') ||
      pathogen.includes('hcv')) {
    return 'high';
  }

  // Medium risk pathogens
  if (pathogen.includes('cmv') ||
      pathogen.includes('cytomegalovirus') ||
      pathogen.includes('toxoplasma') ||
      pathogen.includes('rubella') ||
      pathogen.includes('sars-cov-2') ||
      pathogen.includes('covid')) {
    return 'medium';
  }

  // Default to low risk
  return 'low';
}

export function RiskTierBadge({
  riskTier,
  pathogenName,
  showTooltip = true,
  size = 'md',
}: RiskTierBadgeProps) {
  const [isTooltipVisible, setIsTooltipVisible] = useState(false);
  const config = riskConfig[riskTier];

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
                <div className="font-semibold text-gray-900">{config.label} Pathogen</div>
                {pathogenName && (
                  <div className="text-sm text-gray-600">{pathogenName}</div>
                )}
              </div>
            </div>

            <div>
              <div className="text-xs font-medium text-gray-500 uppercase mb-1">
                Examples
              </div>
              <div className="text-sm text-gray-700">{config.description}</div>
            </div>

            <div>
              <div className="text-xs font-medium text-gray-500 uppercase mb-1">
                Quality Requirement
              </div>
              <div className="text-sm text-gray-900 font-medium">{config.requirement}</div>
            </div>

            <div>
              <div className="text-xs font-medium text-gray-500 uppercase mb-1">
                Clinical Impact
              </div>
              <div className="text-sm text-gray-700">{config.reason}</div>
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
