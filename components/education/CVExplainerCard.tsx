/**
 * CVExplainerCard Component
 *
 * Educational component explaining Coefficient of Variation (CV%) and why it's
 * the only valid metric for comparing assay performance across manufacturers.
 *
 * Based on Dimech (2021): "The standardization and control of serology and
 * nucleic acid testing for infectious diseases"
 *
 * Key insight: CV% measures reproducibility, which CAN be compared between
 * platforms, while absolute antibody values (IU/ml) CANNOT be compared due
 * to measurand variability.
 */

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';

interface CVExplainerCardProps {
  variant?: 'full' | 'compact';
  showExamples?: boolean;
  showReference?: boolean;
}

export function CVExplainerCard({
  variant = 'full',
  showExamples = true,
  showReference = true,
}: CVExplainerCardProps) {
  if (variant === 'compact') {
    return (
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 text-2xl">💡</div>
          <div>
            <h4 className="font-semibold text-blue-900 mb-1">
              Why We Use CV%
            </h4>
            <p className="text-sm text-gray-700">
              CV% measures how consistently an assay performs. Unlike absolute
              antibody values (IU/ml), CV% CAN be compared across different
              manufacturers and platforms.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Card variant="bordered">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span>💡</span>
          Understanding CV% (Coefficient of Variation)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* What is CV% */}
        <div>
          <h3 className="font-semibold text-gray-900 mb-2">What is CV%?</h3>
          <p className="text-gray-700 leading-relaxed">
            CV% measures how <strong>consistent</strong> an assay's results are
            when testing the same sample repeatedly. This is called{' '}
            <strong>"reproducibility."</strong>
          </p>
        </div>

        {/* Example */}
        {showExamples && (
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <h4 className="font-semibold text-gray-900 mb-2">Example</h4>
            <p className="text-sm text-gray-700 mb-3">
              If an assay gives results of 45, 47, 44, 46, and 45 IU/ml across 5
              runs, it has <strong>good reproducibility</strong> (low CV%).
            </p>
            <p className="text-sm text-gray-700">
              If results vary wildly (e.g., 30, 55, 40, 65, 35 IU/ml), it has{' '}
              <strong>poor reproducibility</strong> (high CV%).
            </p>
          </div>
        )}

        {/* Why CV% Matters */}
        <div>
          <h3 className="font-semibold text-gray-900 mb-3">Why CV% Matters</h3>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 text-green-600 mt-0.5">✅</div>
              <div>
                <span className="font-medium text-gray-900">
                  CV% CAN be compared
                </span>{' '}
                across different manufacturers
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 text-green-600 mt-0.5">✅</div>
              <div>
                <span className="font-medium text-gray-900">
                  CV% tells you
                </span>{' '}
                which assays are most reliable and consistent
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 text-green-600 mt-0.5">✅</div>
              <div>
                <span className="font-medium text-gray-900">
                  CV% is not affected
                </span>{' '}
                by the measurand differences between platforms
              </div>
            </div>
          </div>
        </div>

        {/* Why Absolute Values Don't Work */}
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <h3 className="font-semibold text-amber-900 mb-3">
            ⚠️ Why Absolute Values (IU/ml) DON'T Work
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex items-start gap-2">
              <span className="text-red-600 mt-0.5">❌</span>
              <span className="text-gray-700">
                Each manufacturer uses different antigens (whole virus vs recombinant proteins)
              </span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-red-600 mt-0.5">❌</span>
              <span className="text-gray-700">
                Each platform has different detection methods (CLIA vs ELISA vs ECLIA)
              </span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-red-600 mt-0.5">❌</span>
              <span className="text-gray-700">
                Results in IU/ml are NOT comparable between platforms
              </span>
            </div>
          </div>
        </div>

        {/* Quality Benchmarks */}
        <div>
          <h3 className="font-semibold text-gray-900 mb-3">
            Quality Benchmarks
          </h3>
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-24 text-sm font-medium text-gray-600">
                Excellent:
              </div>
              <div className="flex-1 text-sm text-gray-700">
                CV &lt;10% for ≥95% of results
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-24 text-sm font-medium text-gray-600">Good:</div>
              <div className="flex-1 text-sm text-gray-700">
                CV 10-15% for some results
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-24 text-sm font-medium text-gray-600">
                Acceptable:
              </div>
              <div className="flex-1 text-sm text-gray-700">
                CV 15-20% for some results
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-24 text-sm font-medium text-gray-600">Poor:</div>
              <div className="flex-1 text-sm text-gray-700">
                CV &gt;20% for any results
              </div>
            </div>
          </div>
        </div>

        {/* Scientific Basis */}
        {showReference && (
          <div className="pt-4 border-t border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-2">
              Scientific Basis
            </h3>
            <p className="text-sm text-gray-700 leading-relaxed mb-3">
              Dimech (2021) demonstrated that international standards for antibody
              quantification should not be used to calibrate immunoassays, and that
              different serology assays measure fundamentally different things
              (different measurands) even when testing for the same pathogen.
            </p>
            <div className="text-xs text-gray-600 italic">
              Reference: Dimech W. The standardization and control of serology and
              nucleic acid testing for infectious diseases. <em>Clinical Microbiology
              Reviews</em>. 2021;34(4):e00035-21.{' '}
              <a
                href="https://doi.org/10.1128/CMR.00035-21"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-700"
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
