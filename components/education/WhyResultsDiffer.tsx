/**
 * WhyResultsDiffer Component
 *
 * Educational panel explaining why results differ between manufacturers
 * and why absolute antibody values (IU/ml) cannot be compared.
 *
 * Core concept from Dimech (2021): "The measurand of serological assays
 * is assay-specific... Each test system quantifies different measurands
 * and uses different detection systems."
 *
 * This component educates users about:
 * - Measurand variability (different antigens, antibody classes detected)
 * - Why international standards don't work for serology
 * - Why CV% is the only valid comparison metric
 */

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';

interface WhyResultsDifferProps {
  variant?: 'full' | 'compact' | 'banner';
  showExamples?: boolean;
  showReference?: boolean;
}

export function WhyResultsDiffer({
  variant = 'full',
  showExamples = true,
  showReference = true,
}: WhyResultsDifferProps) {
  // Banner variant for comparison pages
  if (variant === 'banner') {
    return (
      <div className="p-4 bg-amber-50 border-l-4 border-amber-500 rounded-lg">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 text-2xl">⚠️</div>
          <div className="flex-1">
            <h4 className="font-semibold text-amber-900 mb-1">
              Important: CV% Comparison Only
            </h4>
            <p className="text-sm text-gray-700 mb-2">
              This comparison focuses on Coefficient of Variation (CV%) which measures
              how consistently each assay performs.
            </p>
            <p className="text-sm text-gray-700 font-medium">
              Absolute antibody measurements (IU/ml) are NOT standardized and CANNOT
              be compared between different manufacturers.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Compact variant for quick reference
  if (variant === 'compact') {
    return (
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 text-2xl">📊</div>
          <div>
            <h4 className="font-semibold text-blue-900 mb-1">
              Why Results Differ
            </h4>
            <p className="text-sm text-gray-700 mb-2">
              Each manufacturer uses different antigens, detection methods, and
              antibody classes. This means they measure fundamentally different things.
            </p>
            <p className="text-sm text-gray-700">
              <strong>Only CV% can be compared</strong> across platforms—not absolute
              values (IU/ml).
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Full educational card
  return (
    <Card variant="bordered">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span>📊</span>
          Why Results Differ Between Manufacturers
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Main Concept */}
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="font-semibold text-blue-900 mb-2">
            Key Concept: Measurand Variability
          </h3>
          <p className="text-sm text-gray-700 leading-relaxed">
            Each manufacturer's assay measures a{' '}
            <strong>different "measurand"</strong> (the specific thing being
            measured), even when testing for the same pathogen. This is why absolute
            antibody values cannot be compared between platforms.
          </p>
        </div>

        {/* Why Assays Differ */}
        <div>
          <h3 className="font-semibold text-gray-900 mb-3">
            Why Each Assay Measures Something Different
          </h3>
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-2">
                1. Different Antigens
              </h4>
              <div className="pl-4 space-y-2 text-sm text-gray-700">
                <div className="flex items-start gap-2">
                  <span className="text-blue-600 mt-0.5">•</span>
                  <span>
                    <strong>Whole virus</strong> vs{' '}
                    <strong>disrupted virus</strong> vs{' '}
                    <strong>purified antigens</strong> vs{' '}
                    <strong>recombinant proteins</strong>
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-blue-600 mt-0.5">•</span>
                  <span>
                    Each antigen source presents different epitopes (antibody
                    binding sites)
                  </span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-2">
                2. Different Detection Systems
              </h4>
              <div className="pl-4 space-y-2 text-sm text-gray-700">
                <div className="flex items-start gap-2">
                  <span className="text-blue-600 mt-0.5">•</span>
                  <span>
                    CLIA, ELISA, ECLIA, CMIA—each uses different chemistry
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-blue-600 mt-0.5">•</span>
                  <span>Different signal amplification methods</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-blue-600 mt-0.5">•</span>
                  <span>Different calibration approaches</span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-2">
                3. Different Antibody Classes Detected
              </h4>
              <div className="pl-4 space-y-2 text-sm text-gray-700">
                <div className="flex items-start gap-2">
                  <span className="text-blue-600 mt-0.5">•</span>
                  <span>
                    Some detect only IgG, others detect IgM, IgA, or total antibodies
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-blue-600 mt-0.5">•</span>
                  <span>Conjugates may be polyclonal or monoclonal antibodies</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Example Comparison */}
        {showExamples && (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <h3 className="font-semibold text-amber-900 mb-2">
              ⚠️ What This Means for Comparison
            </h3>
            <div className="space-y-2 text-sm text-gray-700">
              <p>
                <strong>Scenario:</strong> Two assays testing for anti-CMV IgG
              </p>
              <ul className="space-y-1 pl-4">
                <li>
                  <strong>Assay A:</strong> Reports 45 IU/ml (using whole virus
                  antigen, CLIA detection)
                </li>
                <li>
                  <strong>Assay B:</strong> Reports 120 IU/ml (using recombinant
                  protein, ECLIA detection)
                </li>
              </ul>
              <p className="pt-2 font-medium text-amber-900">
                ❌ These values CANNOT be compared! They are measuring different
                things.
              </p>
              <p className="pt-1">
                ✅ But you CAN compare their CV% to see which is more consistent.
              </p>
            </div>
          </div>
        )}

        {/* Why International Standards Failed */}
        <div>
          <h3 className="font-semibold text-gray-900 mb-2">
            Why International Standards Don't Work
          </h3>
          <p className="text-sm text-gray-700 leading-relaxed mb-3">
            Despite attempts to create international standards for infectious disease
            serology, these efforts have largely been unsuccessful. Studies consistently
            show a lack of correlation between quantitative results from different
            assays, even when they report in the same units (IU/ml).
          </p>
          <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-gray-700">
            <strong className="text-red-900">The problem:</strong> International
            standards cannot account for the fundamental differences in what each
            assay measures (different antigens, different detection methods, different
            antibody classes).
          </div>
        </div>

        {/* The Solution */}
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <h3 className="font-semibold text-green-900 mb-2">
            ✅ The Solution: Focus on CV%
          </h3>
          <p className="text-sm text-gray-700 leading-relaxed mb-3">
            Instead of comparing absolute values, we compare{' '}
            <strong>reproducibility</strong> using CV%. This tells us which assays
            are most consistent and reliable, regardless of the measurand differences.
          </p>
          <div className="space-y-2 text-sm">
            <div className="flex items-start gap-2">
              <span className="text-green-600 mt-0.5">✓</span>
              <span className="text-gray-700">
                CV% measures precision, not absolute quantity
              </span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-green-600 mt-0.5">✓</span>
              <span className="text-gray-700">
                CV% is not affected by calibration differences
              </span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-green-600 mt-0.5">✓</span>
              <span className="text-gray-700">
                CV% can be meaningfully compared across all platforms
              </span>
            </div>
          </div>
        </div>

        {/* Scientific Reference */}
        {showReference && (
          <div className="pt-4 border-t border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-2">
              Scientific Foundation
            </h3>
            <p className="text-sm text-gray-700 leading-relaxed mb-3">
              This educational content is based on comprehensive research by Dimech
              (2021) analyzing decades of attempts to standardize infectious disease
              serology testing. The research conclusively demonstrates that:
            </p>
            <ul className="space-y-1 text-sm text-gray-700 pl-4 mb-3">
              <li>
                • "The measurand of serological assays is assay-specific"
              </li>
              <li>
                • "Quantitative results cannot be standardized" between platforms
              </li>
              <li>
                • International standards for serology "have, by and large, been
                unsuccessful"
              </li>
            </ul>
            <div className="text-xs text-gray-600 italic">
              <strong>Reference:</strong> Dimech W. The standardization and control
              of serology and nucleic acid testing for infectious diseases.{' '}
              <em>Clinical Microbiology Reviews</em>. 2021;34(4):e00035-21.{' '}
              <a
                href="https://doi.org/10.1128/CMR.00035-21"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-700 underline"
              >
                https://doi.org/10.1128/CMR.00035-21
              </a>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
