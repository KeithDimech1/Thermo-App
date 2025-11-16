/**
 * Data Confidence Classification System
 *
 * Assesses statistical confidence based on sample size (events examined).
 * Larger sample sizes provide more reliable CV measurements.
 *
 * References:
 * - Dimech W, et al. (2021) - Emphasizes importance of sample size
 * - Statistical power analysis for immunoassay validation
 * - CLSI guidelines for QC sample size requirements
 *
 * @version 1.0.0
 * @generated 2025-11-12
 */

export type ConfidenceLevel = 'high' | 'medium' | 'low' | 'insufficient';

export interface ConfidenceProfile {
  level: ConfidenceLevel;
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
  icon: string;
  description: string;
  reliability: string;
  minSampleSize: number;
  maxSampleSize?: number;
}

/**
 * Sample size thresholds for confidence levels
 *
 * HIGH CONFIDENCE: ≥100 events
 * - Provides statistically robust CV estimates
 * - Reliable for clinical decision-making
 * - Recommended minimum for critical applications
 *
 * MEDIUM CONFIDENCE: 50-99 events
 * - Acceptable for most applications
 * - May show some variability in CV estimates
 * - Adequate for routine monitoring
 *
 * LOW CONFIDENCE: 20-49 events
 * - Limited statistical power
 * - CV estimates may be unreliable
 * - Use with caution, consider larger sample
 *
 * INSUFFICIENT: <20 events
 * - Not statistically valid
 * - Do not rely on these results
 * - Insufficient for any clinical decision
 */
export const CONFIDENCE_PROFILES: Record<ConfidenceLevel, ConfidenceProfile> = {
  high: {
    level: 'high',
    label: 'High Confidence',
    color: '#059669', // green-600
    bgColor: '#d1fae5', // green-100
    borderColor: '#a7f3d0', // green-200
    icon: '✓✓',
    description: 'Statistically robust sample size',
    reliability: 'Reliable for clinical decision-making. CV estimates are stable and trustworthy.',
    minSampleSize: 100,
  },
  medium: {
    level: 'medium',
    label: 'Medium Confidence',
    color: '#2563eb', // blue-600
    bgColor: '#dbeafe', // blue-100
    borderColor: '#bfdbfe', // blue-200
    icon: '✓',
    description: 'Acceptable sample size',
    reliability: 'Adequate for routine use. CV estimates may show some variability.',
    minSampleSize: 50,
    maxSampleSize: 99,
  },
  low: {
    level: 'low',
    label: 'Low Confidence',
    color: '#d97706', // amber-600
    bgColor: '#fef3c7', // amber-100
    borderColor: '#fde68a', // amber-200
    icon: '⚠',
    description: 'Limited sample size',
    reliability: 'Limited statistical power. CV estimates may be unreliable. Use with caution.',
    minSampleSize: 20,
    maxSampleSize: 49,
  },
  insufficient: {
    level: 'insufficient',
    label: 'Insufficient Data',
    color: '#dc2626', // red-600
    bgColor: '#fee2e2', // red-100
    borderColor: '#fecaca', // red-200
    icon: '⚠️',
    description: 'Inadequate sample size',
    reliability: 'Not statistically valid. Do not rely on these results for clinical decisions.',
    minSampleSize: 0,
    maxSampleSize: 19,
  },
};

/**
 * Get confidence level based on sample size
 * @param eventsExamined - Number of events/samples examined
 * @returns Confidence level
 */
export function getConfidenceLevel(eventsExamined: number | null | undefined): ConfidenceLevel {
  if (eventsExamined === null || eventsExamined === undefined) {
    return 'insufficient';
  }

  if (eventsExamined >= 100) return 'high';
  if (eventsExamined >= 50) return 'medium';
  if (eventsExamined >= 20) return 'low';
  return 'insufficient';
}

/**
 * Get confidence profile
 * @param eventsExamined - Number of events/samples examined
 * @returns Complete confidence profile
 */
export function getConfidenceProfile(eventsExamined: number | null | undefined): ConfidenceProfile {
  const level = getConfidenceLevel(eventsExamined);
  return CONFIDENCE_PROFILES[level];
}

/**
 * Get recommended action based on confidence level
 * @param eventsExamined - Number of events examined
 * @param pathogenRiskTier - Risk tier of pathogen (optional, for context)
 * @returns Recommendation
 */
export function getConfidenceRecommendation(
  eventsExamined: number | null | undefined,
  pathogenRiskTier?: 'high' | 'medium' | 'low'
): string {
  const level = getConfidenceLevel(eventsExamined);

  switch (level) {
    case 'high':
      return '✓ Sample size provides reliable CV estimates. Results are statistically robust.';

    case 'medium':
      return 'Acceptable sample size for routine use. Consider larger sample for critical applications.';

    case 'low':
      if (pathogenRiskTier === 'high') {
        return '⚠️ Sample size too small for high-risk pathogen testing. Recommend ≥100 events.';
      }
      return '⚠ Limited sample size. CV estimates may be unreliable. Consider larger sample (≥50 events).';

    case 'insufficient':
      return '⚠️ INSUFFICIENT DATA: Sample size too small for valid statistical analysis. Do not use these results.';

    default:
      return 'Unable to assess confidence - no sample size data available.';
  }
}

/**
 * Calculate recommended sample size for a pathogen risk tier
 * @param pathogenRiskTier - Risk tier of pathogen
 * @returns Recommended minimum sample size
 */
export function getRecommendedSampleSize(pathogenRiskTier: 'high' | 'medium' | 'low'): number {
  switch (pathogenRiskTier) {
    case 'high':
      return 150; // Higher requirement for blood-borne pathogens
    case 'medium':
      return 100; // Standard requirement
    case 'low':
      return 50; // Minimum for routine testing
    default:
      return 100;
  }
}

/**
 * Check if sample size is adequate for pathogen risk tier
 * @param eventsExamined - Number of events examined
 * @param pathogenRiskTier - Risk tier of pathogen
 * @returns Assessment of adequacy
 */
export function assessSampleSizeAdequacy(
  eventsExamined: number | null | undefined,
  pathogenRiskTier: 'high' | 'medium' | 'low'
): {
  isAdequate: boolean;
  recommendation: string;
  recommendedSize: number;
} {
  const recommendedSize = getRecommendedSampleSize(pathogenRiskTier);
  const actualSize = eventsExamined ?? 0;

  if (actualSize >= recommendedSize) {
    return {
      isAdequate: true,
      recommendation: `✓ Sample size (${actualSize}) meets requirements for ${pathogenRiskTier}-risk testing`,
      recommendedSize,
    };
  }

  if (actualSize < 20) {
    return {
      isAdequate: false,
      recommendation: `⚠️ INSUFFICIENT: Need ≥${recommendedSize} events for ${pathogenRiskTier}-risk testing (currently ${actualSize})`,
      recommendedSize,
    };
  }

  return {
    isAdequate: false,
    recommendation: `⚠ Below recommended sample size for ${pathogenRiskTier}-risk testing. Target: ${recommendedSize}, Current: ${actualSize}`,
    recommendedSize,
  };
}

/**
 * Get confidence interval width estimate
 * Rough estimate of CV precision based on sample size
 * @param eventsExamined - Number of events examined
 * @returns Estimated confidence interval width (%)
 */
export function estimateConfidenceIntervalWidth(eventsExamined: number | null | undefined): number | null {
  if (!eventsExamined || eventsExamined < 20) return null;

  // Simplified estimate: CI width is inversely proportional to sqrt(n)
  // For n=100: ±2% CI width
  // For n=50: ±2.8% CI width
  // For n=20: ±4.5% CI width
  const baseWidth = 2; // Base width at n=100
  const scaleFactor = Math.sqrt(100 / eventsExamined);
  return baseWidth * scaleFactor;
}

/**
 * Get statistical power description
 * @param eventsExamined - Number of events examined
 * @returns Description of statistical power
 */
export function getStatisticalPowerDescription(eventsExamined: number | null | undefined): string {
  const level = getConfidenceLevel(eventsExamined);
  const ciWidth = estimateConfidenceIntervalWidth(eventsExamined);

  switch (level) {
    case 'high':
      return `High statistical power. CV estimates are precise (estimated ±${ciWidth?.toFixed(1)}% confidence interval).`;

    case 'medium':
      return `Moderate statistical power. CV estimates have acceptable precision (estimated ±${ciWidth?.toFixed(1)}% confidence interval).`;

    case 'low':
      return `Low statistical power. CV estimates may vary widely (estimated ±${ciWidth?.toFixed(1)}% confidence interval).`;

    case 'insufficient':
      return 'Insufficient statistical power. Results are not reliable for clinical interpretation.';

    default:
      return 'Statistical power cannot be assessed without sample size data.';
  }
}

/**
 * Format events examined for display
 * @param eventsExamined - Number of events examined
 * @returns Formatted string
 */
export function formatEventsExamined(eventsExamined: number | null | undefined): string {
  if (eventsExamined === null || eventsExamined === undefined) {
    return 'Not reported';
  }
  return `${eventsExamined.toLocaleString()} events`;
}

/**
 * Get all confidence levels sorted by minimum sample size
 */
export function getAllConfidenceLevels(): ConfidenceProfile[] {
  return Object.values(CONFIDENCE_PROFILES).sort((a, b) => b.minSampleSize - a.minSampleSize);
}
