/**
 * ClinicalSuitabilityCard Component
 *
 * Displays clinical suitability recommendations based on:
 * - Quality rating (excellent/good/acceptable/poor)
 * - Risk tier (high/medium/low)
 *
 * Provides risk-aware guidance on appropriate use of test configurations.
 */

'use client';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { RiskTierBadge } from './RiskTierBadge';

interface ClinicalSuitabilityCardProps {
  qualityRating: 'excellent' | 'good' | 'acceptable' | 'poor';
  riskTier: 'high' | 'medium' | 'low';
  pathogenName?: string;
  configName?: string;
}

interface SuitabilityConfig {
  status: 'suitable' | 'caution' | 'not-recommended';
  icon: string;
  title: string;
  message: string;
  bgColor: string;
  borderColor: string;
}

function getSuitabilityConfig(
  qualityRating: string,
  riskTier: string
): SuitabilityConfig {
  // High-risk pathogens (HIV, HBV, HCV)
  if (riskTier === 'high') {
    if (qualityRating === 'excellent') {
      return {
        status: 'suitable',
        icon: '',
        title: 'Suitable for High-Risk Pathogen Testing',
        message:
          'Excellent quality rating meets the stringent requirements for high-risk pathogen testing. This assay is suitable for all clinical settings including screening.',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200',
      };
    }
    return {
      status: 'not-recommended',
      icon: 'Ô',
      title: 'Not Recommended for High-Risk Pathogen Testing',
      message:
        'High-risk pathogens (HIV, HBV, HCV) require "excellent" quality ratings. False negatives can have severe clinical and public health consequences. Consider alternative assays with better CV performance.',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
    };
  }

  // Medium-risk pathogens (CMV, Toxoplasma, etc.)
  if (riskTier === 'medium') {
    if (qualityRating === 'excellent' || qualityRating === 'good') {
      return {
        status: 'suitable',
        icon: '',
        title: 'Suitable for Medium-Risk Pathogen Testing',
        message:
          'Quality rating meets requirements for medium-risk pathogen testing. Appropriate for routine clinical use with vulnerable populations.',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200',
      };
    }
    if (qualityRating === 'acceptable') {
      return {
        status: 'caution',
        icon: ' ',
        title: 'Use with Caution for Medium-Risk Testing',
        message:
          'Acceptable quality may be sufficient but consider confirmatory testing for critical clinical decisions, especially with vulnerable populations.',
        bgColor: 'bg-amber-50',
        borderColor: 'border-amber-200',
      };
    }
    return {
      status: 'not-recommended',
      icon: 'Ô',
      title: 'Not Recommended for Medium-Risk Testing',
      message:
          'Poor quality rating indicates inconsistent performance. Use alternative assays for clinical decision-making.',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
    };
  }

  // Low-risk pathogens
  if (qualityRating === 'poor') {
    return {
      status: 'caution',
      icon: ' ',
      title: 'Use with Caution',
      message:
        'Poor CV performance suggests inconsistent results. Consider using for preliminary screening only, with confirmatory testing required.',
      bgColor: 'bg-amber-50',
      borderColor: 'border-amber-200',
    };
  }

  return {
    status: 'suitable',
    icon: '',
    title: 'Suitable for Clinical Use',
    message:
      'Quality rating is appropriate for this pathogen risk level. Suitable for routine clinical testing.',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
  };
}

export function ClinicalSuitabilityCard({
  qualityRating,
  riskTier,
  pathogenName,
  configName,
}: ClinicalSuitabilityCardProps) {
  const config = getSuitabilityConfig(qualityRating, riskTier);

  return (
    <Card variant="bordered" className={`${config.bgColor} ${config.borderColor}`}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{config.icon}</span>
            <div>
              <CardTitle className="text-lg">{config.title}</CardTitle>
              {configName && (
                <div className="text-sm text-gray-600 mt-1">{configName}</div>
              )}
            </div>
          </div>
          <RiskTierBadge riskTier={riskTier} pathogenName={pathogenName} size="sm" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <p className="text-sm text-gray-700">{config.message}</p>

          <div className="grid grid-cols-2 gap-4 p-3 bg-white rounded border border-gray-200">
            <div>
              <div className="text-xs font-medium text-gray-500 uppercase mb-1">
                Quality Rating
              </div>
              <div className="text-sm font-semibold text-gray-900 capitalize">
                {qualityRating}
              </div>
            </div>
            <div>
              <div className="text-xs font-medium text-gray-500 uppercase mb-1">
                Risk Tier
              </div>
              <div className="text-sm font-semibold text-gray-900 capitalize">
                {riskTier} Risk
              </div>
            </div>
          </div>

          {config.status === 'not-recommended' && (
            <div className="p-3 bg-red-100 border border-red-300 rounded">
              <div className="text-xs font-semibold text-red-900 mb-1">
                  Important
              </div>
              <div className="text-xs text-red-800">
                Review alternative test configurations with better CV performance for this
                pathogen. Contact your laboratory director for guidance.
              </div>
            </div>
          )}

          <div className="pt-3 border-t border-gray-300">
            <div className="text-xs text-gray-500">
              <strong>Reference:</strong> Dimech W. Clin Microbiol Rev. 2021;34(4):e00035-21
              - Risk-based quality requirements
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
