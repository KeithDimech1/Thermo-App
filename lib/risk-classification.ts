/**
 * Pathogen Risk Classification System
 *
 * Based on clinical significance, blood safety requirements, and
 * consequences of false negative results.
 *
 * References:
 * - Dimech W, et al. (2021) "Quality indicators for immunoassays"
 * - WHO Blood Transfusion Safety Guidelines
 * - CDC Blood Safety Guidelines
 *
 * @version 1.0.0
 * @generated 2025-11-12
 */

export type RiskTier = 'high' | 'medium' | 'low';

export interface PathogenRiskProfile {
  tier: RiskTier;
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
  icon: string;
  clinicalImpact: string;
  testingImportance: string;
  cvThreshold: {
    excellent: number; // Recommended max CV for excellent performance
    acceptable: number; // Maximum acceptable CV
  };
}

/**
 * Pathogen risk classification
 *
 * HIGH RISK: Blood-borne pathogens with severe consequences
 * - HIV, HBV, HCV
 * - Require highest accuracy (CV <10% strongly recommended)
 * - False negatives can be life-threatening
 *
 * MEDIUM RISK: Significant clinical impact, especially in vulnerable populations
 * - CMV, Toxoplasma, Rubella, HSV
 * - Important for pregnancy, immunocompromised
 * - CV <15% recommended
 *
 * LOW RISK: Routine testing, manageable conditions
 * - EBV, Parvovirus, SARS-CoV-2, others
 * - CV <20% acceptable
 */
export const PATHOGEN_RISK_CLASSIFICATION: Record<string, RiskTier> = {
  // HIGH RISK - Blood-borne pathogens (transfusion transmissible)
  'Human Immunodeficiency Virus (HIV)': 'high',
  'HIV': 'high',
  'HIV-1': 'high',
  'HIV-2': 'high',
  'Hepatitis B Virus (HBV)': 'high',
  'HBV': 'high',
  'Hepatitis C Virus (HCV)': 'high',
  'HCV': 'high',

  // MEDIUM RISK - TORCH pathogens and significant clinical impact
  'Cytomegalovirus (CMV)': 'medium',
  'CMV': 'medium',
  'Toxoplasma gondii': 'medium',
  'Toxoplasma': 'medium',
  'Rubella virus': 'medium',
  'Rubella': 'medium',
  'Herpes Simplex Virus (HSV)': 'medium',
  'HSV': 'medium',
  'HSV-1': 'medium',
  'HSV-2': 'medium',
  'Treponema pallidum': 'medium', // Syphilis
  'Syphilis': 'medium',

  // LOW RISK - Routine/manageable
  'Epstein-Barr Virus (EBV)': 'low',
  'EBV': 'low',
  'Parvovirus B19': 'low',
  'SARS-CoV-2': 'low',
  'Measles virus': 'low',
  'Mumps virus': 'low',
  'Varicella-Zoster Virus (VZV)': 'low',
  'VZV': 'low',
};

/**
 * Risk tier profiles with visual styling and clinical context
 */
export const RISK_TIER_PROFILES: Record<RiskTier, PathogenRiskProfile> = {
  high: {
    tier: 'high',
    label: 'High Risk',
    color: '#dc2626', // red-600
    bgColor: '#fee2e2', // red-100
    borderColor: '#fecaca', // red-200
    icon: '🔴',
    clinicalImpact: 'Life-threatening blood-borne infections',
    testingImportance: 'Critical for blood safety. False negatives can have severe consequences.',
    cvThreshold: {
      excellent: 10,
      acceptable: 15,
    },
  },
  medium: {
    tier: 'medium',
    label: 'Medium Risk',
    color: '#ea580c', // orange-600
    bgColor: '#ffedd5', // orange-100
    borderColor: '#fed7aa', // orange-200
    icon: '🟠',
    clinicalImpact: 'Significant risk for vulnerable populations',
    testingImportance: 'Important for pregnancy screening and immunocompromised patients.',
    cvThreshold: {
      excellent: 10,
      acceptable: 20,
    },
  },
  low: {
    tier: 'low',
    label: 'Low Risk',
    color: '#2563eb', // blue-600
    bgColor: '#dbeafe', // blue-100
    borderColor: '#bfdbfe', // blue-200
    icon: '🔵',
    clinicalImpact: 'Routine testing, generally manageable',
    testingImportance: 'Standard clinical diagnostic testing.',
    cvThreshold: {
      excellent: 10,
      acceptable: 20,
    },
  },
};

/**
 * Get risk tier for a pathogen
 * @param pathogenName - Name or abbreviation of pathogen
 * @returns Risk tier (defaults to 'low' if not found)
 */
export function getPathogenRiskTier(pathogenName: string | null | undefined): RiskTier {
  if (!pathogenName) return 'low';

  // Check exact match first
  if (pathogenName in PATHOGEN_RISK_CLASSIFICATION) {
    return PATHOGEN_RISK_CLASSIFICATION[pathogenName] || 'low';
  }

  // Check if pathogen name contains high-risk keywords
  const lowerName = pathogenName.toLowerCase();
  if (lowerName.includes('hiv') || lowerName.includes('immunodeficiency')) return 'high';
  if (lowerName.includes('hepatitis b') || lowerName.includes('hbv')) return 'high';
  if (lowerName.includes('hepatitis c') || lowerName.includes('hcv')) return 'high';

  // Check medium-risk keywords
  if (lowerName.includes('cytomegalovirus') || lowerName.includes('cmv')) return 'medium';
  if (lowerName.includes('toxoplasma')) return 'medium';
  if (lowerName.includes('rubella')) return 'medium';
  if (lowerName.includes('herpes') || lowerName.includes('hsv')) return 'medium';
  if (lowerName.includes('syphilis') || lowerName.includes('treponema')) return 'medium';

  // Default to low risk
  return 'low';
}

/**
 * Get risk profile for a pathogen
 * @param pathogenName - Name or abbreviation of pathogen
 * @returns Complete risk profile with styling and context
 */
export function getPathogenRiskProfile(pathogenName: string | null | undefined): PathogenRiskProfile {
  const tier = getPathogenRiskTier(pathogenName);
  return RISK_TIER_PROFILES[tier];
}

/**
 * Determine if CV performance meets risk-appropriate thresholds
 * @param cvLt10Pct - Percentage of results with CV <10%
 * @param cvGt20Pct - Percentage of results with CV >20%
 * @param riskTier - Pathogen risk tier
 * @returns Quality assessment relative to risk tier
 */
export function assessRiskAppropriateQuality(
  cvLt10Pct: number | null,
  cvGt20Pct: number | null,
  riskTier: RiskTier
): {
  isAcceptable: boolean;
  isExcellent: boolean;
  recommendation: string;
} {
  if (cvLt10Pct === null) {
    return {
      isAcceptable: false,
      isExcellent: false,
      recommendation: 'Insufficient data to assess quality',
    };
  }

  const profile = RISK_TIER_PROFILES[riskTier];
  const gt20Pct = cvGt20Pct ?? 0;

  // Excellent performance
  if (cvLt10Pct >= 95 && gt20Pct < 2) {
    return {
      isAcceptable: true,
      isExcellent: true,
      recommendation: `✓ Excellent performance for ${profile.label} pathogen`,
    };
  }

  // Risk-specific thresholds
  switch (riskTier) {
    case 'high':
      // High-risk: Need >80% CV<10% and <10% CV>20%
      if (cvLt10Pct >= 80 && gt20Pct < 10) {
        return {
          isAcceptable: true,
          isExcellent: false,
          recommendation: '✓ Acceptable for high-risk pathogen. Consider improvement to >95% CV<10%',
        };
      }
      return {
        isAcceptable: false,
        isExcellent: false,
        recommendation: '⚠ Below recommended threshold for high-risk pathogen. Target >80% CV<10%',
      };

    case 'medium':
      // Medium-risk: Need >70% CV<10% and <15% CV>20%
      if (cvLt10Pct >= 70 && gt20Pct < 15) {
        return {
          isAcceptable: true,
          isExcellent: false,
          recommendation: '✓ Acceptable for medium-risk pathogen',
        };
      }
      return {
        isAcceptable: false,
        isExcellent: false,
        recommendation: '⚠ Below recommended threshold for medium-risk pathogen. Target >70% CV<10%',
      };

    case 'low':
      // Low-risk: Need >60% CV<10% and <20% CV>20%
      if (cvLt10Pct >= 60 && gt20Pct < 20) {
        return {
          isAcceptable: true,
          isExcellent: false,
          recommendation: '✓ Acceptable performance',
        };
      }
      return {
        isAcceptable: false,
        isExcellent: false,
        recommendation: '⚠ Consider improvement to >60% CV<10%',
      };

    default:
      return {
        isAcceptable: false,
        isExcellent: false,
        recommendation: 'Unable to assess quality',
      };
  }
}

/**
 * Get all high-risk pathogens
 */
export function getHighRiskPathogens(): string[] {
  return Object.entries(PATHOGEN_RISK_CLASSIFICATION)
    .filter(([_, tier]) => tier === 'high')
    .map(([name]) => name);
}

/**
 * Get risk-based clinical guidance
 * @param pathogenName - Pathogen name
 * @param cvLt10Pct - Percentage with CV <10%
 * @returns Clinical guidance based on risk tier and performance
 */
export function getRiskBasedGuidance(
  pathogenName: string | null | undefined,
  cvLt10Pct: number | null
): string {
  const profile = getPathogenRiskProfile(pathogenName);
  const assessment = assessRiskAppropriateQuality(cvLt10Pct, null, profile.tier);

  if (!assessment.isAcceptable && profile.tier === 'high') {
    return `⚠️ HIGH PRIORITY: This assay may not meet blood safety requirements. Consider alternative assays or lot changes.`;
  }

  if (!assessment.isAcceptable && profile.tier === 'medium') {
    return `⚠️ CAUTION: Performance may be inadequate for vulnerable populations (pregnancy, immunocompromised).`;
  }

  if (assessment.isExcellent) {
    return `✅ This assay meets excellence criteria for ${profile.tier}-risk testing.`;
  }

  return assessment.recommendation;
}
