/**
 * Clinical Suitability Card Component
 *
 * Displays clinical suitability assessment based on pathogen risk tier
 * and assay performance. Provides actionable recommendations.
 *
 * Usage:
 *   <ClinicalSuitabilityCard
 *     pathogenName="HIV"
 *     cvLt10Pct={85}
 *     cvGt20Pct={8}
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
  getRiskBasedGuidance,
} from '@/lib/risk-classification';
import { RiskTierBadge } from './RiskTierBadge';

interface ClinicalSuitabilityCardProps {
  /** Pathogen name */
  pathogenName: string | null | undefined;

  /** Percentage of results with CV <10% */
  cvLt10Pct: number | null;

  /** Percentage of results with CV >20% */
  cvGt20Pct: number | null;

  /** Optional: Show detailed recommendations */
  showDetailedGuidance?: boolean;

  /** Additional CSS classes */
  className?: string;
}

export function ClinicalSuitabilityCard({
  pathogenName,
  cvLt10Pct,
  cvGt20Pct,
  showDetailedGuidance = true,
  className = '',
}: ClinicalSuitabilityCardProps) {
  const profile = getPathogenRiskProfile(pathogenName);
  const assessment = assessRiskAppropriateQuality(cvLt10Pct, cvGt20Pct, profile.tier);
  const guidance = getRiskBasedGuidance(pathogenName, cvLt10Pct);

  // Determine overall suitability status
  const getSuitabilityStatus = () => {
    if (assessment.isExcellent) {
      return {
        label: 'Excellent',
        icon: '✅',
        color: 'text-green-700',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200',
      };
    }
    if (assessment.isAcceptable) {
      return {
        label: 'Acceptable',
        icon: '✓',
        color: 'text-blue-700',
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-200',
      };
    }
    if (profile.tier === 'high') {
      return {
        label: 'Not Recommended',
        icon: '⚠️',
        color: 'text-red-700',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-300',
      };
    }
    return {
      label: 'Needs Improvement',
      icon: '⚠',
      color: 'text-amber-700',
      bgColor: 'bg-amber-50',
      borderColor: 'border-amber-200',
    };
  };

  const status = getSuitabilityStatus();

  // Get specific use case recommendations
  const getUseCaseRecommendations = () => {
    const recommendations: { useCase: string; suitable: boolean; notes: string }[] = [];

    switch (profile.tier) {
      case 'high':
        recommendations.push({
          useCase: 'Blood Transfusion Screening',
          suitable: assessment.isExcellent || (assessment.isAcceptable && cvLt10Pct! >= 85),
          notes: assessment.isExcellent
            ? 'Meets stringent blood safety requirements'
            : assessment.isAcceptable
            ? 'Acceptable but monitor performance closely'
            : 'Below blood safety thresholds - use alternative assay',
        });
        recommendations.push({
          useCase: 'Organ Donor Screening',
          suitable: assessment.isExcellent,
          notes: assessment.isExcellent
            ? 'Suitable for critical donor screening'
            : 'Consider higher-performing assay for donor screening',
        });
        break;

      case 'medium':
        recommendations.push({
          useCase: 'Pregnancy Screening',
          suitable: assessment.isAcceptable || assessment.isExcellent,
          notes: assessment.isExcellent
            ? 'Excellent for routine pregnancy screening'
            : assessment.isAcceptable
            ? 'Suitable for pregnancy screening'
            : 'May require confirmatory testing',
        });
        recommendations.push({
          useCase: 'Immunocompromised Patients',
          suitable: assessment.isExcellent || (assessment.isAcceptable && cvLt10Pct! >= 75),
          notes: assessment.isExcellent
            ? 'Reliable for high-risk populations'
            : assessment.isAcceptable
            ? 'Acceptable with clinical correlation'
            : 'Consider alternative assay for vulnerable patients',
        });
        break;

      case 'low':
        recommendations.push({
          useCase: 'Routine Clinical Diagnosis',
          suitable: assessment.isAcceptable || assessment.isExcellent,
          notes: assessment.isExcellent
            ? 'Excellent for routine use'
            : assessment.isAcceptable
            ? 'Suitable for general diagnostic use'
            : 'Consider improvement or alternative',
        });
        recommendations.push({
          useCase: 'Epidemiological Surveillance',
          suitable: true,
          notes: 'Acceptable for population-level monitoring',
        });
        break;
    }

    return recommendations;
  };

  const useCases = getUseCaseRecommendations();

  return (
    <div className={`rounded-lg border shadow-sm overflow-hidden ${status.bgColor} ${status.borderColor} ${className}`}>
      {/* Header */}
      <div className="px-4 py-3 border-b bg-white border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-gray-900">Clinical Suitability Assessment</h3>
          <RiskTierBadge pathogenName={pathogenName} variant="compact" />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-2xl">{status.icon}</span>
          <div className="flex-1">
            <div className={`text-lg font-semibold ${status.color}`}>{status.label}</div>
            {cvLt10Pct !== null && (
              <div className="text-xs text-gray-600">
                {cvLt10Pct.toFixed(1)}% results with CV {'<'}10%
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Performance Assessment */}
      <div className="px-4 py-3 bg-white border-b border-gray-200">
        <div className="text-sm text-gray-800 mb-2">{assessment.recommendation}</div>
        {showDetailedGuidance && (
          <div className="text-sm text-gray-700 p-3 bg-gray-50 rounded border border-gray-200">
            {guidance}
          </div>
        )}
      </div>

      {/* Use Case Recommendations */}
      {showDetailedGuidance && (
        <div className="px-4 py-3 bg-white">
          <div className="text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">
            Recommended Clinical Applications
          </div>
          <div className="space-y-2">
            {useCases.map((useCase, index) => (
              <div key={index} className="flex items-start gap-2">
                <span className="text-sm mt-0.5">
                  {useCase.suitable ? '✓' : '✗'}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-800">{useCase.useCase}</div>
                  <div className="text-xs text-gray-600">{useCase.notes}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Performance Thresholds */}
      {showDetailedGuidance && (
        <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
          <div className="text-xs font-semibold text-gray-700 mb-1">
            Target Performance for {profile.label} Risk Pathogens
          </div>
          <div className="flex items-center gap-4 text-xs text-gray-600">
            <div>
              <span className="font-medium">Excellent:</span> ≥95% CV {'<'}10%
            </div>
            <div>
              <span className="font-medium">Acceptable:</span> ≥
              {profile.tier === 'high' ? '80' : profile.tier === 'medium' ? '70' : '60'}% CV {'<'}10%
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Compact Clinical Suitability Indicator
 * For use in tables or compact layouts
 */
export function ClinicalSuitabilityIndicator({
  pathogenName,
  cvLt10Pct,
  cvGt20Pct,
  className = '',
}: {
  pathogenName: string | null | undefined;
  cvLt10Pct: number | null;
  cvGt20Pct: number | null;
  className?: string;
}) {
  const profile = getPathogenRiskProfile(pathogenName);
  const assessment = assessRiskAppropriateQuality(cvLt10Pct, cvGt20Pct, profile.tier);

  const getIcon = () => {
    if (assessment.isExcellent) return '✅';
    if (assessment.isAcceptable) return '✓';
    if (profile.tier === 'high') return '⚠️';
    return '⚠';
  };

  const getColor = () => {
    if (assessment.isExcellent) return 'text-green-600';
    if (assessment.isAcceptable) return 'text-blue-600';
    if (profile.tier === 'high') return 'text-red-600';
    return 'text-amber-600';
  };

  return (
    <span className={`inline-flex items-center gap-1 ${getColor()} ${className}`} title={assessment.recommendation}>
      <span className="text-sm">{getIcon()}</span>
      <span className="text-xs font-medium">
        {assessment.isExcellent ? 'Excellent' : assessment.isAcceptable ? 'Suitable' : 'Review'}
      </span>
    </span>
  );
}

export default ClinicalSuitabilityCard;
