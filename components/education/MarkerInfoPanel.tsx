/**
 * MarkerInfoPanel Component
 *
 * Educational component that displays clinical context for a marker.
 * Shows:
 * - Clinical use
 * - Interpretation of positive/negative results
 * - Pathogen information
 * - Category context
 *
 * Based on Dimech (2021) research on infectious disease testing standardization
 */

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

interface MarkerInfo {
  name: string;
  pathogen_name?: string | null;
  category_name?: string | null;
  antibody_type?: string | null;
  clinical_use?: string | null;
  interpretation_positive?: string | null;
  interpretation_negative?: string | null;
  marker_type?: string | null;
}

interface MarkerInfoPanelProps {
  marker: MarkerInfo;
  showInterpretation?: boolean;
  showClinicalUse?: boolean;
  variant?: 'full' | 'compact';
}

export function MarkerInfoPanel({
  marker,
  showInterpretation = true,
  showClinicalUse = true,
  variant = 'full',
}: MarkerInfoPanelProps) {
  const hasInterpretation =
    showInterpretation &&
    (marker.interpretation_positive || marker.interpretation_negative);

  const hasClinicalUse = showClinicalUse && marker.clinical_use;

  // Don't render if there's no content to show
  if (!hasClinicalUse && !hasInterpretation) {
    return null;
  }

  if (variant === 'compact') {
    return (
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        {marker.clinical_use && (
          <div className="text-sm text-gray-700">
            <span className="font-semibold text-blue-900">Clinical Use: </span>
            {marker.clinical_use}
          </div>
        )}
      </div>
    );
  }

  return (
    <Card variant="bordered">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Clinical Context</CardTitle>
          <div className="flex items-center gap-2">
            {marker.antibody_type && (
              <Badge variant="default" size="sm">
                {marker.antibody_type}
              </Badge>
            )}
            {marker.marker_type && (
              <Badge variant="default" size="sm">
                {marker.marker_type}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Pathogen and Category Info */}
        {(marker.pathogen_name || marker.category_name) && (
          <div className="flex items-center gap-4 text-sm">
            {marker.pathogen_name && (
              <div>
                <span className="text-gray-600">Pathogen:</span>
                <span className="ml-2 font-medium text-gray-900">
                  {marker.pathogen_name}
                </span>
              </div>
            )}
            {marker.category_name && (
              <div>
                <span className="text-gray-600">Category:</span>
                <span className="ml-2 font-medium text-gray-900">
                  {marker.category_name}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Clinical Use */}
        {hasClinicalUse && (
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Clinical Use</h3>
            <p className="text-gray-700 leading-relaxed">{marker.clinical_use}</p>
          </div>
        )}

        {/* Result Interpretation */}
        {hasInterpretation && (
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">
              Result Interpretation
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {marker.interpretation_positive && (
                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center gap-2 font-semibold text-green-900 mb-2">
                    <svg
                      className="w-5 h-5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Positive Result
                  </div>
                  <p className="text-sm text-green-800">
                    {marker.interpretation_positive}
                  </p>
                </div>
              )}

              {marker.interpretation_negative && (
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-center gap-2 font-semibold text-gray-900 mb-2">
                    <svg
                      className="w-5 h-5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Negative Result
                  </div>
                  <p className="text-sm text-gray-700">
                    {marker.interpretation_negative}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Educational Note */}
        <div className="pt-4 border-t border-gray-200">
          <div className="flex items-start gap-3 text-sm">
            <div className="flex-shrink-0 w-5 h-5 text-blue-600">
              <svg fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="text-gray-600">
              <span className="font-medium text-gray-900">Important: </span>
              Clinical interpretation should always consider patient history, symptoms,
              and other diagnostic findings. These results alone may not be sufficient
              for clinical decision-making.
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
