/**
 * ComparisonWarningBanner Component
 *
 * Critical warning banner for comparison pages explaining that:
 * - CV% can be compared (measures consistency)
 * - IU/ml CANNOT be compared between manufacturers (not standardized)
 *
 * Reference: Dimech W. Clin Microbiol Rev. 2021;34(4):e00035-21
 */

'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/Card';

interface ComparisonWarningBannerProps {
  className?: string;
  showLearnMore?: boolean;
}

export function ComparisonWarningBanner({
  className = '',
  showLearnMore = true,
}: ComparisonWarningBannerProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <Card variant="bordered" className={`border-amber-500 bg-amber-50 ${className}`}>
      <CardContent className="py-4">
        <div className="flex items-start gap-3">
          {/* Warning Icon */}
          <div className="text-amber-600 text-2xl flex-shrink-0 mt-0.5">
            ⚠️
          </div>

          <div className="flex-1">
            {/* Main Warning */}
            <h3 className="text-lg font-semibold text-amber-900 mb-2">
              Important: CV% Comparison Only
            </h3>

            <div className="text-amber-800 space-y-2">
              <p>
                This comparison focuses on <strong>Coefficient of Variation (CV%)</strong> which
                measures how consistently each assay performs.
              </p>

              <p className="font-semibold">
                Absolute antibody measurements (IU/ml) are NOT standardized and
                CANNOT be compared between different manufacturers.
              </p>

              {/* Expandable Section */}
              {expanded && (
                <div className="mt-4 pt-4 border-t border-amber-200 space-y-3">
                  <h4 className="font-semibold text-amber-900">Why Can't We Compare IU/ml?</h4>
                  <p>
                    Despite international efforts, antibody test standardization has proven
                    impossible due to fundamental biological variability in how antibodies bind
                    to antigens (measurand variability).
                  </p>
                  <p>
                    Each manufacturer's assay measures slightly different antibody populations,
                    meaning a result of "50 IU/ml" from Manufacturer A is not equivalent to
                    "50 IU/ml" from Manufacturer B.
                  </p>
                  <p>
                    <strong>CV% is safe to compare</strong> because it measures the internal
                    consistency of each assay, not absolute antibody levels.
                  </p>

                  <div className="bg-white/50 p-3 rounded border border-amber-300">
                    <p className="text-sm font-medium">Reference:</p>
                    <p className="text-sm">
                      Dimech W. The standardization and control of serology and nucleic acid
                      testing for infectious diseases. Clinical Microbiology Reviews.
                      2021;34(4):e00035-21.
                    </p>
                    <a
                      href="https://doi.org/10.1128/CMR.00035-21"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:text-blue-800 underline"
                    >
                      Read the full paper →
                    </a>
                  </div>
                </div>
              )}

              {/* Learn More Button */}
              {showLearnMore && (
                <button
                  onClick={() => setExpanded(!expanded)}
                  className="mt-3 text-amber-700 hover:text-amber-900 font-medium text-sm underline"
                >
                  {expanded ? 'Show Less' : 'Learn More'}
                </button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
