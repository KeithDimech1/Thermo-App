/**
 * QC Analytics Statistics
 *
 * Statistical analysis utilities for QC data
 * Provides descriptive statistics, control limits, and outlier detection
 * for coefficient of variation (CV) measurements
 *
 * @module lib/stats/qc-analytics
 */

import * as ss from 'simple-statistics';

/**
 * CV Metrics for quality control analysis
 */
export interface CVMetrics {
  /** Mean CV value */
  mean: number;
  /** Median CV value */
  median: number;
  /** Standard deviation */
  stdDev: number;
  /** Coefficient of variation (CV of CV measurements) */
  cv: number;
  /** Upper control limit (mean + 3σ) */
  upperControlLimit: number;
  /** Lower control limit (mean - 3σ, minimum 0) */
  lowerControlLimit: number;
  /** Values exceeding control limits */
  outliers: number[];
  /** 25th percentile */
  q1: number;
  /** 75th percentile */
  q3: number;
  /** Interquartile range */
  iqr: number;
  /** 90th percentile */
  p90: number;
  /** 95th percentile */
  p95: number;
  /** Minimum value */
  min: number;
  /** Maximum value */
  max: number;
  /** Count of data points */
  count: number;
}

/**
 * Calculate comprehensive CV metrics
 *
 * @param cvData - Array of CV percentage values
 * @returns Comprehensive statistical metrics
 *
 * @example
 * ```typescript
 * const data = [5.2, 6.1, 4.8, 5.5, 6.3, 5.9];
 * const metrics = calculateCVMetrics(data);
 * console.log(`Mean: ${metrics.mean}%, UCL: ${metrics.upperControlLimit}%`);
 * ```
 */
export function calculateCVMetrics(cvData: number[]): CVMetrics {
  if (cvData.length === 0) {
    return {
      mean: 0,
      median: 0,
      stdDev: 0,
      cv: 0,
      upperControlLimit: 0,
      lowerControlLimit: 0,
      outliers: [],
      q1: 0,
      q3: 0,
      iqr: 0,
      p90: 0,
      p95: 0,
      min: 0,
      max: 0,
      count: 0,
    };
  }

  const meanVal = ss.mean(cvData);
  const medianVal = ss.median(cvData);
  const stdDev = ss.standardDeviation(cvData);
  const cv = (stdDev / meanVal) * 100; // CV of CV measurements

  // Control limits (Shewhart control chart)
  const ucl = meanVal + 3 * stdDev;
  const lcl = Math.max(0, meanVal - 3 * stdDev); // CV can't be negative

  // Quartiles and IQR for outlier detection
  const q1 = ss.quantile(cvData, 0.25);
  const q3 = ss.quantile(cvData, 0.75);
  const iqr = q3 - q1;

  // Percentiles
  const p90 = ss.quantile(cvData, 0.90);
  const p95 = ss.quantile(cvData, 0.95);

  // Min/Max
  const min = ss.min(cvData);
  const max = ss.max(cvData);

  // Outliers using IQR method (Tukey's fences)
  const lowerFence = q1 - 1.5 * iqr;
  const upperFence = q3 + 1.5 * iqr;
  const outliers = cvData.filter((cv) => cv < lowerFence || cv > upperFence);

  return {
    mean: Number(meanVal.toFixed(2)),
    median: Number(medianVal.toFixed(2)),
    stdDev: Number(stdDev.toFixed(2)),
    cv: Number(cv.toFixed(2)),
    upperControlLimit: Number(ucl.toFixed(2)),
    lowerControlLimit: Number(lcl.toFixed(2)),
    outliers,
    q1: Number(q1.toFixed(2)),
    q3: Number(q3.toFixed(2)),
    iqr: Number(iqr.toFixed(2)),
    p90: Number(p90.toFixed(2)),
    p95: Number(p95.toFixed(2)),
    min: Number(min.toFixed(2)),
    max: Number(max.toFixed(2)),
    count: cvData.length,
  };
}

/**
 * Manufacturer comparison statistics
 */
export interface ManufacturerComparison {
  /** Mean of first manufacturer */
  mfr1Mean: number;
  /** Mean of second manufacturer */
  mfr2Mean: number;
  /** Absolute difference */
  difference: number;
  /** Percent difference */
  percentDiff: number;
  /** Standard error of difference */
  standardError: number;
  /** Is difference statistically significant? (rough estimate) */
  isSignificant: boolean;
}

/**
 * Compare performance between two manufacturers
 *
 * @param manufacturer1 - CV values for first manufacturer
 * @param manufacturer2 - CV values for second manufacturer
 * @returns Statistical comparison metrics
 *
 * @example
 * ```typescript
 * const abbott = [5.2, 6.1, 4.8, 5.5];
 * const roche = [7.1, 8.2, 7.5, 8.0];
 * const comparison = compareManufacturers(abbott, roche);
 * console.log(`Difference: ${comparison.difference}% (${comparison.percentDiff}%)`);
 * ```
 */
export function compareManufacturers(
  manufacturer1: number[],
  manufacturer2: number[]
): ManufacturerComparison {
  const m1 = ss.mean(manufacturer1);
  const m2 = ss.mean(manufacturer2);
  const diff = m1 - m2;
  const percentDiff = (diff / m2) * 100;

  // Standard error of difference
  const se1 = ss.standardDeviation(manufacturer1) / Math.sqrt(manufacturer1.length);
  const se2 = ss.standardDeviation(manufacturer2) / Math.sqrt(manufacturer2.length);
  const standardError = Math.sqrt(se1 ** 2 + se2 ** 2);

  // Rough significance test (2 SE rule)
  const isSignificant = Math.abs(diff) > 2 * standardError;

  return {
    mfr1Mean: Number(m1.toFixed(2)),
    mfr2Mean: Number(m2.toFixed(2)),
    difference: Number(diff.toFixed(2)),
    percentDiff: Number(percentDiff.toFixed(1)),
    standardError: Number(standardError.toFixed(2)),
    isSignificant,
  };
}

/**
 * Lot variation analysis
 */
export interface LotVariation {
  /** Mean CV across all lots */
  overallMean: number;
  /** Standard deviation between lots */
  lotStdDev: number;
  /** CV of lot means (lot-to-lot variation) */
  lotCV: number;
  /** Lots with high variation (>2 SD from mean) */
  highVariationLots: string[];
  /** Within-lot average CV */
  withinLotCV: number;
  /** Between-lot CV contribution */
  betweenLotCV: number;
}

/**
 * Analyze lot-to-lot variation
 *
 * @param lots - Array of lot data with lot number and average CV
 * @returns Lot variation analysis metrics
 *
 * @example
 * ```typescript
 * const lots = [
 *   { lot: '93093LI00', avgCV: 5.2 },
 *   { lot: '93094LI00', avgCV: 7.8 },
 *   { lot: '93095LI00', avgCV: 5.5 }
 * ];
 * const analysis = analyzeLotVariation(lots);
 * console.log(`Lot-to-lot CV: ${analysis.lotCV}%`);
 * ```
 */
export function analyzeLotVariation(
  lots: Array<{ lot: string; avgCV: number }>
): LotVariation {
  const cvValues = lots.map((l) => l.avgCV);
  const overallMean = ss.mean(cvValues);
  const lotStdDev = ss.standardDeviation(cvValues);
  const lotCV = (lotStdDev / overallMean) * 100;

  // Flag lots >2 SD from mean
  const highVariationLots = lots
    .filter((l) => Math.abs(l.avgCV - overallMean) > 2 * lotStdDev)
    .map((l) => l.lot);

  // Estimate within-lot and between-lot variation
  // Simplified - assumes similar within-lot variation
  const withinLotCV = overallMean * 0.1; // Rough estimate: 10% of mean
  const betweenLotCV = lotCV;

  return {
    overallMean: Number(overallMean.toFixed(2)),
    lotStdDev: Number(lotStdDev.toFixed(2)),
    lotCV: Number(lotCV.toFixed(2)),
    highVariationLots,
    withinLotCV: Number(withinLotCV.toFixed(2)),
    betweenLotCV: Number(betweenLotCV.toFixed(2)),
  };
}

/**
 * Process capability analysis (Cpk)
 */
export interface ProcessCapability {
  /** Process capability index */
  cpk: number;
  /** Upper specification limit */
  usl: number;
  /** Lower specification limit */
  lsl: number;
  /** Process mean */
  mean: number;
  /** Process standard deviation */
  sigma: number;
  /** Percentage within specification */
  withinSpec: number;
  /** Process capability interpretation */
  interpretation: string;
}

/**
 * Calculate process capability (Cpk) for QC measurements
 *
 * @param cvData - Array of CV percentage values
 * @param usl - Upper specification limit (default: 15%)
 * @param lsl - Lower specification limit (default: 0%)
 * @returns Process capability metrics
 *
 * @example
 * ```typescript
 * const data = [5.2, 6.1, 4.8, 5.5, 6.3, 5.9];
 * const capability = calculateProcessCapability(data, 10, 0);
 * console.log(`Cpk: ${capability.cpk} - ${capability.interpretation}`);
 * ```
 */
export function calculateProcessCapability(
  cvData: number[],
  usl: number = 15,
  lsl: number = 0
): ProcessCapability {
  const mean = ss.mean(cvData);
  const sigma = ss.standardDeviation(cvData);

  // Calculate Cpk (minimum of upper and lower capability)
  const cpkUpper = (usl - mean) / (3 * sigma);
  const cpkLower = (mean - lsl) / (3 * sigma);
  const cpk = Math.min(cpkUpper, cpkLower);

  // Count within specification
  const withinSpec = cvData.filter((cv) => cv >= lsl && cv <= usl).length;
  const withinSpecPct = (withinSpec / cvData.length) * 100;

  // Interpretation
  let interpretation: string;
  if (cpk >= 2.0) {
    interpretation = 'Excellent - World Class';
  } else if (cpk >= 1.33) {
    interpretation = 'Good - Capable Process';
  } else if (cpk >= 1.0) {
    interpretation = 'Acceptable - Marginal';
  } else {
    interpretation = 'Poor - Not Capable';
  }

  return {
    cpk: Number(cpk.toFixed(2)),
    usl,
    lsl,
    mean: Number(mean.toFixed(2)),
    sigma: Number(sigma.toFixed(2)),
    withinSpec: Number(withinSpecPct.toFixed(1)),
    interpretation,
  };
}

/**
 * Identify statistical outliers using multiple methods
 */
export interface OutlierAnalysis {
  /** Outliers by IQR method */
  iqrOutliers: Array<{ value: number; index: number }>;
  /** Outliers by Z-score method (|z| > 3) */
  zScoreOutliers: Array<{ value: number; index: number; zScore: number }>;
  /** Outliers by modified Z-score method */
  modifiedZOutliers: Array<{ value: number; index: number; modZScore: number }>;
  /** Combined outlier list (appears in 2+ methods) */
  consensus: Array<{ value: number; index: number; methods: number }>;
}

/**
 * Detect outliers using multiple statistical methods
 *
 * @param cvData - Array of CV percentage values
 * @returns Outlier detection results from multiple methods
 *
 * @example
 * ```typescript
 * const data = [5.2, 6.1, 4.8, 15.3, 6.3, 5.9]; // 15.3 is outlier
 * const outliers = detectOutliers(data);
 * console.log(`Found ${outliers.consensus.length} consensus outliers`);
 * ```
 */
export function detectOutliers(cvData: number[]): OutlierAnalysis {
  // IQR method (Tukey's fences)
  const q1 = ss.quantile(cvData, 0.25);
  const q3 = ss.quantile(cvData, 0.75);
  const iqr = q3 - q1;
  const lowerFence = q1 - 1.5 * iqr;
  const upperFence = q3 + 1.5 * iqr;

  const iqrOutliers = cvData
    .map((value, index) => ({ value, index }))
    .filter((item) => item.value < lowerFence || item.value > upperFence);

  // Z-score method
  const mean = ss.mean(cvData);
  const stdDev = ss.standardDeviation(cvData);

  const zScoreOutliers = cvData
    .map((value, index) => ({
      value,
      index,
      zScore: (value - mean) / stdDev,
    }))
    .filter((item) => Math.abs(item.zScore) > 3);

  // Modified Z-score method (using median and MAD)
  const median = ss.median(cvData);
  const deviations = cvData.map((v) => Math.abs(v - median));
  const mad = ss.median(deviations);
  const modifiedZScores = cvData.map((v) => 0.6745 * (v - median) / mad);

  const modifiedZOutliers = cvData
    .map((value, index) => ({
      value,
      index,
      modZScore: modifiedZScores[index] ?? 0,
    }))
    .filter((item) => Math.abs(item.modZScore) > 3.5);

  // Consensus: appears in 2+ methods
  const outlierCounts = new Map<number, number>();
  [...iqrOutliers, ...zScoreOutliers, ...modifiedZOutliers].forEach((item) => {
    outlierCounts.set(item.index, (outlierCounts.get(item.index) || 0) + 1);
  });

  const consensus = cvData
    .map((value, index) => ({ value, index, methods: outlierCounts.get(index) || 0 }))
    .filter((item) => item.methods >= 2);

  return {
    iqrOutliers,
    zScoreOutliers,
    modifiedZOutliers,
    consensus,
  };
}

/**
 * Distribution statistics for detailed analysis
 */
export interface DistributionStats {
  /** Mean */
  mean: number;
  /** Median */
  median: number;
  /** Mode (most common value) */
  mode: number;
  /** Standard deviation */
  stdDev: number;
  /** Variance */
  variance: number;
  /** Skewness (asymmetry) */
  skewness: number;
  /** Range */
  range: number;
  /** Coefficient of variation */
  cv: number;
  /** 5th, 10th, 25th, 50th, 75th, 90th, 95th percentiles */
  percentiles: {
    p5: number;
    p10: number;
    p25: number;
    p50: number;
    p75: number;
    p90: number;
    p95: number;
  };
}

/**
 * Calculate comprehensive distribution statistics
 *
 * @param cvData - Array of CV percentage values
 * @returns Detailed distribution statistics
 */
export function calculateDistributionStats(cvData: number[]): DistributionStats {
  const mean = ss.mean(cvData);
  const median = ss.median(cvData);
  const mode = ss.mode(cvData);
  const stdDev = ss.standardDeviation(cvData);
  const variance = ss.variance(cvData);
  const skewness = ss.sampleSkewness(cvData);
  const range = ss.max(cvData) - ss.min(cvData);
  const cv = (stdDev / mean) * 100;

  return {
    mean: Number(mean.toFixed(2)),
    median: Number(median.toFixed(2)),
    mode: Number(mode.toFixed(2)),
    stdDev: Number(stdDev.toFixed(2)),
    variance: Number(variance.toFixed(2)),
    skewness: Number(skewness.toFixed(3)),
    range: Number(range.toFixed(2)),
    cv: Number(cv.toFixed(2)),
    percentiles: {
      p5: Number(ss.quantile(cvData, 0.05).toFixed(2)),
      p10: Number(ss.quantile(cvData, 0.10).toFixed(2)),
      p25: Number(ss.quantile(cvData, 0.25).toFixed(2)),
      p50: Number(ss.quantile(cvData, 0.50).toFixed(2)),
      p75: Number(ss.quantile(cvData, 0.75).toFixed(2)),
      p90: Number(ss.quantile(cvData, 0.90).toFixed(2)),
      p95: Number(ss.quantile(cvData, 0.95).toFixed(2)),
    },
  };
}
