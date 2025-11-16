/**
 * QC Data Loader Utilities
 *
 * Helper functions to load and query QC data from JSON file
 *
 * @version 1.0.0
 */

import type {
  QCDataJSON,
  TestConfigJSON,
  TestConfigDetails,
  TestConfigFilters,
  ManufacturerPerformance,
  QualityRating,
  DiseaseCategory
} from '../types/qc-data';

/**
 * Load QC data from JSON file
 * Usage: const data = await loadQCData();
 *
 * NOTE: This function is not currently used as the app uses PostgreSQL database.
 * Commented out to prevent build errors when qc-data.json doesn't exist.
 */
export async function loadQCData(): Promise<QCDataJSON> {
  // In Next.js, you can import JSON directly
  // const data = await import('../../build-data/assets/qc-data.json');
  // return data.default as QCDataJSON;
  throw new Error('loadQCData is not implemented. This app uses PostgreSQL database instead of JSON files.');
}

/**
 * Get all test configurations with full details
 */
export function getTestConfigDetails(data: QCDataJSON): TestConfigDetails[] {
  return data.testConfigurations.map(config => {
    const marker = data.markers[config.markerId];
    const assay = data.assays[config.assayId];
    const qcSample = data.qcSamples[config.qcSampleId];
    const pathogen = marker?.pathogenId ? data.pathogens[marker.pathogenId] : null;
    const category = marker?.categoryId ? data.categories[marker.categoryId] : null;

    return {
      config_id: config.id,
      test_type: config.testType,
      events_examined: config.eventsExamined,
      quality_rating: config.qualityRating,

      marker_id: config.markerId,
      marker_name: marker?.name || 'Unknown',
      antibody_type: marker?.antibodyType ?? null,

      pathogen_id: pathogen?.id || 0,
      pathogen_name: pathogen?.name || 'Unknown',
      pathogen_abbreviation: pathogen?.abbreviation || null,

      category_id: category?.id || 0,
      category_name: (category?.name || 'Other') as DiseaseCategory,

      assay_id: config.assayId,
      assay_name: assay?.name || 'Unknown',
      platform: assay?.platform ?? null,
      methodology: assay?.methodology ?? null,

      manufacturer_id: assay?.manufacturerId || 0,
      manufacturer_name: assay?.manufacturerName || 'Unknown',

      qc_sample_id: config.qcSampleId,
      qc_sample_name: qcSample?.name || 'Unknown',

      cv_lt_10_count: config.cvPerformance.lessThan10.count,
      cv_lt_10_percentage: config.cvPerformance.lessThan10.percentage,
      cv_10_15_count: config.cvPerformance.between10And15.count,
      cv_10_15_percentage: config.cvPerformance.between10And15.percentage,
      cv_15_20_count: config.cvPerformance.between15And20.count,
      cv_15_20_percentage: config.cvPerformance.between15And20.percentage,
      cv_gt_20_count: config.cvPerformance.greaterThan20.count,
      cv_gt_20_percentage: config.cvPerformance.greaterThan20.percentage,
      mean_cv: null // Not in JSON, would need to calculate
    };
  });
}

/**
 * Filter test configurations
 */
export function filterTestConfigs(
  configs: TestConfigDetails[],
  filters: TestConfigFilters
): TestConfigDetails[] {
  return configs.filter(config => {
    // Filter by marker
    if (filters.markerId && config.marker_id !== filters.markerId) return false;
    if (filters.markerName && !config.marker_name.toLowerCase().includes(filters.markerName.toLowerCase())) return false;

    // Filter by assay
    if (filters.assayId && config.assay_id !== filters.assayId) return false;

    // Filter by manufacturer
    if (filters.manufacturerId && config.manufacturer_id !== filters.manufacturerId) return false;
    if (filters.manufacturerName && config.manufacturer_name !== filters.manufacturerName) return false;

    // Filter by category
    if (filters.categoryId && config.category_id !== filters.categoryId) return false;
    if (filters.categoryName && config.category_name !== filters.categoryName) return false;

    // Filter by pathogen
    if (filters.pathogenId && config.pathogen_id !== filters.pathogenId) return false;

    // Filter by quality rating
    if (filters.qualityRating) {
      if (Array.isArray(filters.qualityRating)) {
        if (!filters.qualityRating.includes(config.quality_rating as QualityRating)) return false;
      } else {
        if (config.quality_rating !== filters.qualityRating) return false;
      }
    }

    // Filter by test type
    if (filters.testType && config.test_type !== filters.testType) return false;

    // Filter by CV performance
    if (filters.minCVLt10Pct && (config.cv_lt_10_percentage || 0) < filters.minCVLt10Pct) return false;
    if (filters.maxCVGt20Pct && (config.cv_gt_20_percentage || 0) > filters.maxCVGt20Pct) return false;

    return true;
  });
}

/**
 * Get manufacturer performance summary
 */
export function getManufacturerPerformance(data: QCDataJSON): ManufacturerPerformance[] {
  const manufacturerStats: Record<number, ManufacturerPerformance> = {};

  data.testConfigurations.forEach(config => {
    const assay = data.assays[config.assayId];
    const manufacturerId = assay?.manufacturerId;

    if (!manufacturerId) return;

    if (!manufacturerStats[manufacturerId]) {
      manufacturerStats[manufacturerId] = {
        id: manufacturerId,
        name: assay?.manufacturerName || 'Unknown',
        total_configs: 0,
        avg_cv_lt_10_pct: 0,
        excellent_count: 0,
        good_count: 0,
        acceptable_count: 0,
        poor_count: 0
      };
    }

    const stats = manufacturerStats[manufacturerId];
    stats.total_configs++;

    // Count by quality rating
    switch (config.qualityRating) {
      case 'excellent':
        stats.excellent_count++;
        break;
      case 'good':
        stats.good_count++;
        break;
      case 'acceptable':
        stats.acceptable_count++;
        break;
      case 'poor':
        stats.poor_count++;
        break;
    }

    // Accumulate CV percentages for averaging
    if (config.cvPerformance.lessThan10.percentage !== null) {
      stats.avg_cv_lt_10_pct += config.cvPerformance.lessThan10.percentage;
    }
  });

  // Calculate averages
  Object.values(manufacturerStats).forEach(stats => {
    stats.avg_cv_lt_10_pct = stats.avg_cv_lt_10_pct / stats.total_configs;
  });

  return Object.values(manufacturerStats).sort((a, b) => b.avg_cv_lt_10_pct - a.avg_cv_lt_10_pct);
}

/**
 * Get test configs for a specific marker
 */
export function getConfigsByMarker(data: QCDataJSON, markerName: string): TestConfigJSON[] {
  return data.testConfigurations.filter(config => config.markerName === markerName);
}

/**
 * Get test configs for a specific manufacturer
 */
export function getConfigsByManufacturer(data: QCDataJSON, manufacturerName: string): TestConfigJSON[] {
  return data.testConfigurations.filter(config => config.manufacturerName === manufacturerName);
}

/**
 * Get all unique markers
 */
export function getAllMarkers(data: QCDataJSON) {
  return Object.values(data.markers).sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Get all unique manufacturers
 */
export function getAllManufacturers(data: QCDataJSON) {
  return Object.values(data.manufacturers).sort((a, b) => b.totalAssays - a.totalAssays);
}

/**
 * Get all unique categories
 */
export function getAllCategories(data: QCDataJSON) {
  return Object.values(data.categories).sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Get configs by quality rating
 */
export function getConfigsByQuality(data: QCDataJSON, rating: QualityRating): TestConfigJSON[] {
  return data.testConfigurations.filter(config => config.qualityRating === rating);
}

/**
 * Search configs by text (marker name or assay name)
 */
export function searchConfigs(data: QCDataJSON, searchTerm: string): TestConfigJSON[] {
  const term = searchTerm.toLowerCase();
  return data.testConfigurations.filter(config =>
    config.markerName.toLowerCase().includes(term) ||
    config.assayName.toLowerCase().includes(term) ||
    (config.manufacturerName && config.manufacturerName.toLowerCase().includes(term))
  );
}

/**
 * Get statistics summary
 */
export function getStatisticsSummary(data: QCDataJSON) {
  const configs = data.testConfigurations;

  return {
    totalConfigs: configs.length,
    totalMarkers: Object.keys(data.markers).length,
    totalManufacturers: Object.keys(data.manufacturers).length,
    totalQCSamples: Object.keys(data.qcSamples).length,

    qualityBreakdown: {
      excellent: configs.filter(c => c.qualityRating === 'excellent').length,
      good: configs.filter(c => c.qualityRating === 'good').length,
      acceptable: configs.filter(c => c.qualityRating === 'acceptable').length,
      poor: configs.filter(c => c.qualityRating === 'poor').length,
      unknown: configs.filter(c => c.qualityRating === 'unknown').length
    },

    testTypeBreakdown: {
      serology: configs.filter(c => c.testType === 'serology').length,
      nat: configs.filter(c => c.testType === 'nat').length,
      both: configs.filter(c => c.testType === 'both').length
    },

    avgEventsExamined: configs.reduce((sum, c) => sum + (c.eventsExamined || 0), 0) / configs.length,

    avgCVLt10Pct: configs.reduce((sum, c) =>
      sum + (c.cvPerformance.lessThan10.percentage || 0), 0
    ) / configs.length
  };
}

/**
 * Compare two assays for the same marker
 */
export function compareAssays(
  data: QCDataJSON,
  markerName: string,
  assayId1: number,
  assayId2: number
) {
  const config1 = data.testConfigurations.find(c =>
    c.markerName === markerName && c.assayId === assayId1
  );
  const config2 = data.testConfigurations.find(c =>
    c.markerName === markerName && c.assayId === assayId2
  );

  if (!config1 || !config2) {
    return null;
  }

  return {
    marker: markerName,
    assay1: {
      name: config1.assayName,
      manufacturer: config1.manufacturerName,
      qualityRating: config1.qualityRating,
      cvLt10Pct: config1.cvPerformance.lessThan10.percentage,
      eventsExamined: config1.eventsExamined
    },
    assay2: {
      name: config2.assayName,
      manufacturer: config2.manufacturerName,
      qualityRating: config2.qualityRating,
      cvLt10Pct: config2.cvPerformance.lessThan10.percentage,
      eventsExamined: config2.eventsExamined
    },
    winner: (config1.cvPerformance.lessThan10.percentage || 0) >
            (config2.cvPerformance.lessThan10.percentage || 0) ? 'assay1' : 'assay2'
  };
}

/**
 * Get top performers (best CV <10% percentages)
 */
export function getTopPerformers(data: QCDataJSON, limit: number = 10): TestConfigJSON[] {
  return [...data.testConfigurations]
    .sort((a, b) => {
      const aPct = a.cvPerformance.lessThan10.percentage || 0;
      const bPct = b.cvPerformance.lessThan10.percentage || 0;
      return bPct - aPct;
    })
    .slice(0, limit);
}

/**
 * Get poor performers (high CV >20% percentages)
 */
export function getPoorPerformers(data: QCDataJSON, threshold: number = 20): TestConfigJSON[] {
  return data.testConfigurations
    .filter(c => (c.cvPerformance.greaterThan20.percentage || 0) >= threshold)
    .sort((a, b) => {
      const aPct = a.cvPerformance.greaterThan20.percentage || 0;
      const bPct = b.cvPerformance.greaterThan20.percentage || 0;
      return bPct - aPct;
    });
}

/**
 * Group configs by category
 */
export function groupByCategory(data: QCDataJSON): Record<string, TestConfigJSON[]> {
  const grouped: Record<string, TestConfigJSON[]> = {};

  data.testConfigurations.forEach(config => {
    const marker = data.markers[config.markerId];
    const category = marker?.categoryName || 'Other';

    if (!grouped[category]) {
      grouped[category] = [];
    }
    grouped[category].push(config);
  });

  return grouped;
}

/**
 * Group configs by pathogen
 */
export function groupByPathogen(data: QCDataJSON): Record<string, TestConfigJSON[]> {
  const grouped: Record<string, TestConfigJSON[]> = {};

  data.testConfigurations.forEach(config => {
    const marker = data.markers[config.markerId];
    const pathogen = marker?.pathogenName || 'Unknown';

    if (!grouped[pathogen]) {
      grouped[pathogen] = [];
    }
    grouped[pathogen].push(config);
  });

  return grouped;
}

// =============================================================================
// EXAMPLE USAGE
// =============================================================================

/**
 * Example: Get all anti-CMV IgG test configurations
 */
export async function exampleGetCMVConfigs() {
  const data = await loadQCData();
  const cmvConfigs = getConfigsByMarker(data, 'anti-CMV IgG');

  console.log(`Found ${cmvConfigs.length} test configurations for anti-CMV IgG:`);
  cmvConfigs.forEach(config => {
    console.log(`  - ${config.assayName} (${config.manufacturerName}): ${config.qualityRating}`);
  });

  return cmvConfigs;
}

/**
 * Example: Compare Abbott and Roche performance
 */
export async function exampleCompareManufacturers() {
  const data = await loadQCData();
  const abbottConfigs = getConfigsByManufacturer(data, 'Abbott');
  const rocheConfigs = getConfigsByManufacturer(data, 'Roche');

  const abbottAvgCV = abbottConfigs.reduce((sum, c) =>
    sum + (c.cvPerformance.lessThan10.percentage || 0), 0
  ) / abbottConfigs.length;

  const rocheAvgCV = rocheConfigs.reduce((sum, c) =>
    sum + (c.cvPerformance.lessThan10.percentage || 0), 0
  ) / rocheConfigs.length;

  console.log('Manufacturer Comparison:');
  console.log(`  Abbott: ${abbottAvgCV.toFixed(2)}% average CV <10%`);
  console.log(`  Roche: ${rocheAvgCV.toFixed(2)}% average CV <10%`);

  return { abbott: abbottAvgCV, roche: rocheAvgCV };
}

/**
 * Example: Find poor performers that need investigation
 */
export async function exampleFindPoorPerformers() {
  const data = await loadQCData();
  const poorPerformers = getPoorPerformers(data, 20);

  console.log(`Found ${poorPerformers.length} configurations with >20% CV >20%:`);
  poorPerformers.forEach(config => {
    const gt20Pct = config.cvPerformance.greaterThan20.percentage || 0;
    console.log(`  - ${config.markerName} on ${config.assayName}: ${gt20Pct.toFixed(2)}% events >20% CV`);
  });

  return poorPerformers;
}
