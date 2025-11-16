/**
 * MethodologyComparison Component
 *
 * Side-by-side comparison of assay methodologies showing why different
 * methodologies produce different results (measurand variability).
 *
 * Used in comparison tool to educate users about methodology differences.
 *
 * Reference: Dimech W. Clin Microbiol Rev. 2021;34(4):e00035-21
 */

'use client';

import { Card, CardContent } from '@/components/ui/Card';
import { MethodologyBadge } from './MethodologyTooltip';

interface MethodologyComparisonProps {
  assay1: {
    name: string;
    methodology: string;
    manufacturer: string;
  };
  assay2: {
    name: string;
    methodology: string;
    manufacturer: string;
  };
  className?: string;
}

const methodologyInfo: Record<string, { name: string; description: string }> = {
  CLIA: {
    name: 'Chemiluminescent Immunoassay',
    description: 'Uses chemical light reactions for detection',
  },
  ECLIA: {
    name: 'Electrochemiluminescent Immunoassay',
    description: 'Uses electrical stimulation to generate light signals',
  },
  ELISA: {
    name: 'Enzyme-Linked Immunosorbent Assay',
    description: 'Uses enzyme reactions producing colored products',
  },
  CMIA: {
    name: 'Chemiluminescent Microparticle Immunoassay',
    description: 'Combines microparticles with chemiluminescence',
  },
  PCR: {
    name: 'Polymerase Chain Reaction',
    description: 'Amplifies and detects nucleic acids (DNA/RNA)',
  },
  EIA: {
    name: 'Enzyme Immunoassay',
    description: 'General enzyme-based detection',
  },
  FEIA: {
    name: 'Fluorescent Enzyme Immunoassay',
    description: 'Uses fluorescent markers for detection',
  },
};

function normalizeMethodology(methodology: string): string {
  return methodology.replace(/[^a-zA-Z]/g, '').toUpperCase();
}

function getMethodologyInfo(methodology: string) {
  const normalized = normalizeMethodology(methodology);
  return methodologyInfo[normalized] || { name: methodology, description: 'Unknown methodology' };
}

export function MethodologyComparison({ assay1, assay2, className = '' }: MethodologyComparisonProps) {
  const method1 = getMethodologyInfo(assay1.methodology);
  const method2 = getMethodologyInfo(assay2.methodology);
  const areDifferent = normalizeMethodology(assay1.methodology) !== normalizeMethodology(assay2.methodology);

  return (
    <Card variant="bordered" className={`${areDifferent ? 'border-blue-300 bg-blue-50' : ''} ${className}`}>
      <CardContent className="py-4">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-start gap-2">
            <div className="text-blue-600 text-xl flex-shrink-0">🔬</div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900">Methodology Comparison</h3>
              {areDifferent ? (
                <p className="text-sm text-blue-700 mt-1">
                  <strong>Different methodologies detected.</strong> These assays use different detection systems
                  and may measure different antibody populations.
                </p>
              ) : (
                <p className="text-sm text-gray-600 mt-1">
                  Both assays use the same methodology but may still produce different results due to
                  manufacturer-specific antigens and calibration.
                </p>
              )}
            </div>
          </div>

          {/* Side-by-side comparison */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Assay 1 */}
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="space-y-3">
                <div>
                  <div className="text-xs font-semibold text-gray-500 uppercase">Assay 1</div>
                  <div className="text-sm font-semibold text-gray-900 mt-1">{assay1.manufacturer}</div>
                  <div className="text-sm text-gray-600">{assay1.name}</div>
                </div>

                <div>
                  <div className="text-xs font-semibold text-gray-700 mb-2">Methodology:</div>
                  <MethodologyBadge methodology={assay1.methodology} />
                  <div className="text-xs text-gray-600 mt-2">{method1.description}</div>
                </div>
              </div>
            </div>

            {/* Assay 2 */}
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="space-y-3">
                <div>
                  <div className="text-xs font-semibold text-gray-500 uppercase">Assay 2</div>
                  <div className="text-sm font-semibold text-gray-900 mt-1">{assay2.manufacturer}</div>
                  <div className="text-sm text-gray-600">{assay2.name}</div>
                </div>

                <div>
                  <div className="text-xs font-semibold text-gray-700 mb-2">Methodology:</div>
                  <MethodologyBadge methodology={assay2.methodology} />
                  <div className="text-xs text-gray-600 mt-2">{method2.description}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Educational note */}
          {areDifferent && (
            <div className="bg-white rounded border border-blue-200 p-3">
              <p className="text-xs text-gray-700">
                <span className="font-semibold text-gray-900">Why This Matters: </span>
                Different methodologies use different antigens, detection systems, and calibration approaches.
                This means they measure different aspects of the immune response (measurand variability).
                <strong className="text-blue-700"> Results in IU/ml cannot be compared between these assays.</strong>
              </p>
            </div>
          )}

          {!areDifferent && (
            <div className="bg-white rounded border border-gray-200 p-3">
              <p className="text-xs text-gray-700">
                <span className="font-semibold text-gray-900">Note: </span>
                Even with the same methodology, manufacturer-specific antigens and calibration mean
                <strong className="text-gray-900"> IU/ml results should not be compared.</strong> Always compare
                CV% (consistency) instead of absolute values.
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
