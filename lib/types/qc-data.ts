/**
 * QC Results Data Types
 *
 * TypeScript interfaces for Quality Control performance data
 * Maps to both JSON structure and database schema
 *
 * @version 1.0.0
 * @generated 2025-11-11
 */

// =============================================================================
// ENUMS AND CONSTANTS
// =============================================================================

export type AntibodyType = 'IgG' | 'IgM' | 'Antigen' | 'Antibody (Total)' | 'Other';
export type MarkerType = 'Antibody' | 'Antigen' | 'Nucleic Acid';
export type TestType = 'serology' | 'nat' | 'both';
export type QualityRating = 'excellent' | 'good' | 'acceptable' | 'poor' | 'unknown';
export type Methodology = 'CLIA' | 'ELISA' | 'PCR' | 'ECLIA' | 'CMIA';
export type AutomationLevel = 'Fully Automated' | 'Semi-Automated' | 'Manual';
export type MatrixType = 'human plasma' | 'human serum' | 'synthetic';

// Disease categories
export const DISEASE_CATEGORIES = [
  'TORCH',
  'Hepatitis',
  'Retrovirus',
  'COVID-19',
  'EBV',
  'Childhood Diseases',
  'Bacterial',
  'Parvovirus',
  'Other'
] as const;

export type DiseaseCategory = typeof DISEASE_CATEGORIES[number];

// =============================================================================
// DATABASE ENTITIES (match schema exactly)
// =============================================================================

/**
 * Category - Disease category grouping
 * Table: categories
 */
export interface Category {
  id: number;
  name: DiseaseCategory;
  description: string | null;
  created_at?: Date;
}

/**
 * Pathogen - Infectious organism
 * Table: pathogens
 */
export interface Pathogen {
  id: number;
  name: string;
  abbreviation?: string | null;
  category_id: number | null;
  scientific_name?: string | null;
  transmission_route?: string | null;
  clinical_significance?: string | null;
  created_at?: Date;
}

/**
 * Marker - Test marker (antibody/antigen/NAT)
 * Table: markers
 */
export interface Marker {
  id: number;
  name: string;
  pathogen_id: number | null;
  category_id: number | null;
  antibody_type: AntibodyType | null;
  marker_type: MarkerType | null;
  clinical_use?: string | null;
  interpretation_positive?: string | null;
  interpretation_negative?: string | null;
  created_at?: Date;
}

/**
 * Manufacturer - Test equipment manufacturer
 * Table: manufacturers
 */
export interface Manufacturer {
  id: number;
  name: string;
  country?: string | null;
  website?: string | null;
  total_assays: number;
  created_at?: Date;
}

/**
 * Assay - Assay platform
 * Table: assays
 */
export interface Assay {
  id: number;
  name: string;
  manufacturer_id: number | null;
  platform: string | null;
  methodology: Methodology | null;
  automation_level?: AutomationLevel | null;
  throughput?: string | null;
  created_at?: Date;
}

/**
 * Assay Lot - Individual reagent lot tracking
 * Table: assay_lots
 */
export interface AssayLot {
  id: number;
  assay_id: number;
  lot_number: string;
  manufacture_date?: Date | null;
  expiration_date?: Date | null;
  qc_release_date?: Date | null;
  notes?: string | null;
  created_at?: Date;
}

/**
 * QC Sample - Quality control sample
 * Table: qc_samples
 */
export interface QCSample {
  id: number;
  name: string;
  manufacturer: string | null;
  product_code?: string | null;
  matrix_type: MatrixType | null;
  lot_number?: string | null;
  expiration_date?: Date | null;
  target_markers?: string[] | null;
  concentration_level?: string | null;
  certifications?: string[] | null;
  created_at?: Date;
}

/**
 * Test Configuration - Unique marker+assay+QC combination
 * Table: test_configurations
 */
export interface TestConfiguration {
  id: number;
  marker_id: number;
  assay_id: number;
  assay_lot_id?: number | null;
  qc_sample_id: number;
  test_type: TestType;
  events_examined: number | null;
  quality_rating: QualityRating | null;
  notes?: string | null;
  created_at?: Date;
  updated_at?: Date;
}

/**
 * CV Measurement - Coefficient of Variation performance data
 * Table: cv_measurements
 */
export interface CVMeasurement {
  id: number;
  test_config_id: number;

  // CV <10% (Excellent)
  cv_lt_10_count: number | null;
  cv_lt_10_percentage: number | null;

  // CV 10-15% (Good)
  cv_10_15_count: number | null;
  cv_10_15_percentage: number | null;

  // CV 15-20% (Acceptable)
  cv_15_20_count: number | null;
  cv_15_20_percentage: number | null;

  // CV >20% (Poor)
  cv_gt_20_count: number | null;
  cv_gt_20_percentage: number | null;

  // Statistical measures
  mean_cv?: number | null;
  median_cv?: number | null;
  std_dev_cv?: number | null;

  measurement_date?: Date | null;
  created_at?: Date;
}

// =============================================================================
// VIEW TYPES (for queried data with joins)
// =============================================================================

/**
 * Complete test configuration with all related data
 * Matches vw_test_config_details view
 */
export interface TestConfigDetails {
  config_id: number;
  test_type: TestType;
  events_examined: number | null;
  quality_rating: QualityRating | null;

  // Marker info
  marker_id: number;
  marker_name: string;
  antibody_type: AntibodyType | null;

  // Pathogen info
  pathogen_id: number;
  pathogen_name: string;
  pathogen_abbreviation: string | null;

  // Category info
  category_id: number;
  category_name: DiseaseCategory;

  // Assay info
  assay_id: number;
  assay_name: string;
  platform: string | null;
  methodology: Methodology | null;

  // Manufacturer info
  manufacturer_id: number;
  manufacturer_name: string;

  // QC Sample info
  qc_sample_id: number;
  qc_sample_name: string;

  // CV Performance
  cv_lt_10_count: number | null;
  cv_lt_10_percentage: number | null;
  cv_10_15_count: number | null;
  cv_10_15_percentage: number | null;
  cv_15_20_count: number | null;
  cv_15_20_percentage: number | null;
  cv_gt_20_count: number | null;
  cv_gt_20_percentage: number | null;
  mean_cv: number | null;
}

/**
 * Manufacturer performance summary
 * Matches vw_manufacturer_performance view
 */
export interface ManufacturerPerformance {
  id: number;
  name: string;
  total_configs: number;
  avg_cv_lt_10_pct: number;
  excellent_count: number;
  good_count: number;
  acceptable_count: number;
  poor_count: number;
}

// =============================================================================
// JSON FILE STRUCTURE (for importing from qc-data.json)
// =============================================================================

/**
 * CV Performance data structure (nested in JSON)
 */
export interface CVPerformanceData {
  lessThan10: {
    count: number | null;
    percentage: number | null;
  };
  between10And15: {
    count: number | null;
    percentage: number | null;
  };
  between15And20: {
    count: number | null;
    percentage: number | null;
  };
  greaterThan20: {
    count: number | null;
    percentage: number | null;
  };
}

/**
 * Test configuration from JSON file
 */
export interface TestConfigJSON {
  id: number;
  markerId: number;
  markerName: string;
  assayId: number;
  assayName: string;
  manufacturerId: number | null;
  manufacturerName: string | null;
  qcSampleId: number;
  qcSampleName: string;
  eventsExamined: number | null;
  cvPerformance: CVPerformanceData;
  qualityRating: QualityRating;
  testType: TestType;
}

/**
 * Marker from JSON file
 */
export interface MarkerJSON {
  id: number;
  name: string;
  pathogenId: number | null;
  pathogenName: string | null;
  categoryId: number | null;
  categoryName: DiseaseCategory | null;
  antibodyType: AntibodyType | null;
}

/**
 * Assay from JSON file
 */
export interface AssayJSON {
  id: number;
  name: string;
  manufacturerId: number | null;
  manufacturerName: string | null;
  platform: string | null;
  methodology: Methodology | null;
}

/**
 * Manufacturer from JSON file
 */
export interface ManufacturerJSON {
  id: number;
  name: string;
  totalAssays: number;
}

/**
 * QC Sample from JSON file
 */
export interface QCSampleJSON {
  id: number;
  name: string;
  manufacturer: string;
  matrixType: MatrixType;
}

/**
 * Pathogen from JSON file
 */
export interface PathogenJSON {
  id: number;
  name: string;
  abbreviation?: string | null;
  category: DiseaseCategory | null;
}

/**
 * Category from JSON file
 */
export interface CategoryJSON {
  id: number;
  name: DiseaseCategory;
  description: string;
}

/**
 * Complete QC data JSON structure
 */
export interface QCDataJSON {
  metadata: {
    title: string;
    description: string;
    source: string;
    generatedDate: string;
    dataVersion: string;
    totalConfigurations: number;
    totalMarkers: number;
    totalManufacturers: number;
    totalQCSamples: number;
    totalPathogens?: number;
    totalCategories?: number;
  };
  testConfigurations: TestConfigJSON[];
  markers: Record<string, MarkerJSON>;
  assays: Record<string, AssayJSON>;
  manufacturers: Record<string, ManufacturerJSON>;
  qcSamples: Record<string, QCSampleJSON>;
  pathogens: Record<string, PathogenJSON>;
  categories: Record<string, CategoryJSON>;
}

// =============================================================================
// UTILITY TYPES
// =============================================================================

/**
 * Dataset type for filtering curated vs all data
 */
export type DatasetType = 'curated' | 'all';

/**
 * Filter parameters for querying test configurations
 */
export interface TestConfigFilters {
  markerId?: number;
  markerName?: string;
  assayId?: number;
  manufacturerId?: number;
  manufacturerName?: string;
  categoryId?: number;
  categoryName?: DiseaseCategory;
  pathogenId?: number;
  pathogenIds?: number[]; // Multi-select pathogen filter
  pathogenAbbreviations?: string[]; // Multi-select by abbreviation
  qualityRating?: QualityRating | QualityRating[];
  testType?: TestType;
  dataset?: DatasetType; // 'curated' (default) or 'all'
  minCVLt10Pct?: number; // Minimum percentage with CV <10%
  maxCVLt10Pct?: number; // Maximum percentage with CV <10%
  maxCVGt20Pct?: number; // Maximum percentage with CV >20%
}

/**
 * Sort options for test configurations
 */
export interface TestConfigSort {
  field: 'marker_name' | 'manufacturer_name' | 'quality_rating' | 'cv_lt_10_percentage' | 'events_examined';
  direction: 'asc' | 'desc';
}

/**
 * Pagination parameters
 */
export interface PaginationParams {
  page: number;
  pageSize: number;
}

/**
 * Paginated response
 */
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * API response wrapper
 */
export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// =============================================================================
// CHART DATA TYPES (for visualizations)
// =============================================================================

/**
 * Data point for CV distribution chart
 */
export interface CVDistributionPoint {
  label: string;
  value: number;
  percentage: number;
}

/**
 * Manufacturer comparison data
 */
export interface ManufacturerComparison {
  manufacturer: string;
  excellentCount: number;
  goodCount: number;
  acceptableCount: number;
  poorCount: number;
  avgCVLt10Pct: number;
}

/**
 * Heatmap cell data
 */
export interface HeatmapCell {
  marker: string;
  manufacturer: string;
  value: number; // CV percentage
  qualityRating: QualityRating;
  configId: number;
}

/**
 * Performance trend data point
 */
export interface PerformanceTrend {
  date: Date;
  avgCVLt10Pct: number;
  excellentCount: number;
  poorCount: number;
}

// =============================================================================
// FORM TYPES (for data entry/editing)
// =============================================================================

/**
 * Form data for creating/updating test configuration
 */
export interface TestConfigFormData {
  markerId: number;
  assayId: number;
  qcSampleId: number;
  testType: TestType;
  eventsExamined: number;
  notes?: string;
}

/**
 * Form data for CV measurements
 */
export interface CVMeasurementFormData {
  testConfigId: number;
  cvLt10Count: number;
  cvLt10Percentage: number;
  cv1015Count?: number;
  cv1015Percentage?: number;
  cv1520Count?: number;
  cv1520Percentage?: number;
  cvGt20Count?: number;
  cvGt20Percentage?: number;
  measurementDate?: Date;
}

// =============================================================================
// HELPER FUNCTIONS (type guards and validators)
// =============================================================================

/**
 * Type guard to check if value is a valid QualityRating
 */
export function isQualityRating(value: unknown): value is QualityRating {
  return typeof value === 'string' &&
    ['excellent', 'good', 'acceptable', 'poor', 'unknown'].includes(value);
}

/**
 * Type guard to check if value is a valid TestType
 */
export function isTestType(value: unknown): value is TestType {
  return typeof value === 'string' &&
    ['serology', 'nat', 'both'].includes(value);
}

/**
 * Type guard to check if value is a valid DiseaseCategory
 */
export function isDiseaseCategory(value: unknown): value is DiseaseCategory {
  return typeof value === 'string' &&
    DISEASE_CATEGORIES.includes(value as DiseaseCategory);
}

/**
 * Calculate quality rating from CV performance
 */
export function calculateQualityRating(cvPerformance: CVPerformanceData): QualityRating {
  const lt10Pct = cvPerformance.lessThan10.percentage;
  const gt20Pct = cvPerformance.greaterThan20.percentage ?? 0;

  if (lt10Pct === null) return 'unknown';
  if (lt10Pct >= 95) return 'excellent';
  if (lt10Pct >= 80 && gt20Pct < 5) return 'good';
  if (gt20Pct > 20) return 'poor';
  return 'acceptable';
}

/**
 * Get color for quality rating (for UI)
 */
export function getQualityRatingColor(rating: QualityRating): string {
  const colors: Record<QualityRating, string> = {
    excellent: '#10b981', // green-500
    good: '#3b82f6',      // blue-500
    acceptable: '#f59e0b', // amber-500
    poor: '#ef4444',       // red-500
    unknown: '#6b7280'     // gray-500
  };
  return colors[rating];
}

/**
 * Get label for CV threshold
 */
export function getCVThresholdLabel(threshold: string): string {
  const labels: Record<string, string> = {
    'lessThan10': '< 10% (Excellent)',
    'between10And15': '10-15% (Good)',
    'between15And20': '15-20% (Acceptable)',
    'greaterThan20': '> 20% (Poor)'
  };
  return labels[threshold] || threshold;
}

// =============================================================================
// CONSTANTS
// =============================================================================

export const CV_THRESHOLDS = {
  EXCELLENT: { min: 0, max: 10, label: 'Excellent', color: '#10b981' },
  GOOD: { min: 10, max: 15, label: 'Good', color: '#3b82f6' },
  ACCEPTABLE: { min: 15, max: 20, label: 'Acceptable', color: '#f59e0b' },
  POOR: { min: 20, max: 100, label: 'Poor', color: '#ef4444' }
} as const;

export const MANUFACTURER_LOGOS: Record<string, string> = {
  'Abbott': '/logos/abbott.svg',
  'Roche': '/logos/roche.svg',
  'DiaSorin': '/logos/diasorin.svg',
  'Siemens': '/logos/siemens.svg',
  'bioMerieux': '/logos/biomérieux.svg',
  'Bio-Rad': '/logos/biorad.svg',
  'Ortho': '/logos/ortho.svg'
};

export const PATHOGEN_ICONS: Record<string, string> = {
  'Cytomegalovirus (CMV)': '🦠',
  'Hepatitis B Virus (HBV)': '🧬',
  'Hepatitis C Virus (HCV)': '🧬',
  'Human Immunodeficiency Virus (HIV)': '🔴',
  'SARS-CoV-2': '😷',
  'Toxoplasma gondii': '🐱',
  'Rubella virus': '🌡️'
};

// =============================================================================
// EXPORTS
// =============================================================================

export default QCDataJSON;
