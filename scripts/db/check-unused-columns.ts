/**
 * Check Unused Columns for Actual Data
 *
 * Verifies which "unused" columns actually contain data in the database
 * before creating an implementation plan
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import { query } from '../../lib/db/connection';

// Load environment variables
config({ path: resolve(__dirname, '../../.env.local') });

interface ColumnCheck {
  table: string;
  column: string;
  hasData: boolean;
  rowCount: number;
  nonNullCount: number;
  percentageFilled: number;
}

async function checkUnusedColumns(): Promise<void> {
  console.log('=== CHECKING UNUSED COLUMNS FOR ACTUAL DATA ===\n');

  const results: ColumnCheck[] = [];

  try {
    // QC Samples - 7 potentially unused columns
    console.log('📦 QC SAMPLES TABLE:');
    const qcData = await query<{
      total_rows: string;
      has_manufacturer: string;
      has_product_code: string;
      has_matrix_type: string;
      has_lot_number: string;
      has_expiration_date: string;
      has_concentration_level: string;
      has_certifications: string;
    }>(`
      SELECT
        COUNT(*) as total_rows,
        COUNT(manufacturer) as has_manufacturer,
        COUNT(product_code) as has_product_code,
        COUNT(matrix_type) as has_matrix_type,
        COUNT(lot_number) as has_lot_number,
        COUNT(expiration_date) as has_expiration_date,
        COUNT(concentration_level) as has_concentration_level,
        COUNT(certifications) as has_certifications
      FROM qc_samples
    `);

    const qcRow = qcData[0];
    const qcTotal = parseInt(qcRow.total_rows);

    console.log(`  Total rows: ${qcTotal}`);
    console.log(`  manufacturer: ${qcRow.has_manufacturer} (${(parseInt(qcRow.has_manufacturer)/qcTotal*100).toFixed(1)}%)`);
    console.log(`  product_code: ${qcRow.has_product_code} (${(parseInt(qcRow.has_product_code)/qcTotal*100).toFixed(1)}%)`);
    console.log(`  matrix_type: ${qcRow.has_matrix_type} (${(parseInt(qcRow.has_matrix_type)/qcTotal*100).toFixed(1)}%)`);
    console.log(`  lot_number: ${qcRow.has_lot_number} (${(parseInt(qcRow.has_lot_number)/qcTotal*100).toFixed(1)}%)`);
    console.log(`  expiration_date: ${qcRow.has_expiration_date} (${(parseInt(qcRow.has_expiration_date)/qcTotal*100).toFixed(1)}%)`);
    console.log(`  concentration_level: ${qcRow.has_concentration_level} (${(parseInt(qcRow.has_concentration_level)/qcTotal*100).toFixed(1)}%)`);
    console.log(`  certifications: ${qcRow.has_certifications} (${(parseInt(qcRow.has_certifications)/qcTotal*100).toFixed(1)}%)`);

    // Pathogens - 3 potentially unused columns
    console.log('\n🦠 PATHOGENS TABLE:');
    const pathogenData = await query<{
      total_rows: string;
      has_scientific_name: string;
      has_transmission_route: string;
      has_clinical_significance: string;
    }>(`
      SELECT
        COUNT(*) as total_rows,
        COUNT(scientific_name) as has_scientific_name,
        COUNT(transmission_route) as has_transmission_route,
        COUNT(clinical_significance) as has_clinical_significance
      FROM pathogens
    `);

    const pathogenRow = pathogenData[0];
    const pathogenTotal = parseInt(pathogenRow.total_rows);

    console.log(`  Total rows: ${pathogenTotal}`);
    console.log(`  scientific_name: ${pathogenRow.has_scientific_name} (${(parseInt(pathogenRow.has_scientific_name)/pathogenTotal*100).toFixed(1)}%)`);
    console.log(`  transmission_route: ${pathogenRow.has_transmission_route} (${(parseInt(pathogenRow.has_transmission_route)/pathogenTotal*100).toFixed(1)}%)`);
    console.log(`  clinical_significance: ${pathogenRow.has_clinical_significance} (${(parseInt(pathogenRow.has_clinical_significance)/pathogenTotal*100).toFixed(1)}%)`);

    // Categories - 1 potentially unused column
    console.log('\n📁 CATEGORIES TABLE:');
    const categoryData = await query<{
      total_rows: string;
      has_description: string;
    }>(`
      SELECT
        COUNT(*) as total_rows,
        COUNT(description) as has_description
      FROM categories
    `);

    const categoryRow = categoryData[0];
    const categoryTotal = parseInt(categoryRow.total_rows);

    console.log(`  Total rows: ${categoryTotal}`);
    console.log(`  description: ${categoryRow.has_description} (${(parseInt(categoryRow.has_description)/categoryTotal*100).toFixed(1)}%)`);

    // CV Measurements - 3 potentially unused columns
    console.log('\n📊 CV MEASUREMENTS TABLE:');
    const cvData = await query<{
      total_rows: string;
      has_median_cv: string;
      has_std_dev_cv: string;
      has_measurement_date: string;
    }>(`
      SELECT
        COUNT(*) as total_rows,
        COUNT(median_cv) as has_median_cv,
        COUNT(std_dev_cv) as has_std_dev_cv,
        COUNT(measurement_date) as has_measurement_date
      FROM cv_measurements
    `);

    const cvRow = cvData[0];
    const cvTotal = parseInt(cvRow.total_rows);

    console.log(`  Total rows: ${cvTotal}`);
    console.log(`  median_cv: ${cvRow.has_median_cv} (${(parseInt(cvRow.has_median_cv)/cvTotal*100).toFixed(1)}%)`);
    console.log(`  std_dev_cv: ${cvRow.has_std_dev_cv} (${(parseInt(cvRow.has_std_dev_cv)/cvTotal*100).toFixed(1)}%)`);
    console.log(`  measurement_date: ${cvRow.has_measurement_date} (${(parseInt(cvRow.has_measurement_date)/cvTotal*100).toFixed(1)}%)`);

    // Assays - 2 potentially unused columns
    console.log('\n🧪 ASSAYS TABLE:');
    const assayData = await query<{
      total_rows: string;
      has_automation_level: string;
      has_throughput: string;
    }>(`
      SELECT
        COUNT(*) as total_rows,
        COUNT(automation_level) as has_automation_level,
        COUNT(throughput) as has_throughput
      FROM assays
    `);

    const assayRow = assayData[0];
    const assayTotal = parseInt(assayRow.total_rows);

    console.log(`  Total rows: ${assayTotal}`);
    console.log(`  automation_level: ${assayRow.has_automation_level} (${(parseInt(assayRow.has_automation_level)/assayTotal*100).toFixed(1)}%)`);
    console.log(`  throughput: ${assayRow.has_throughput} (${(parseInt(assayRow.has_throughput)/assayTotal*100).toFixed(1)}%)`);

    // Test Configurations - notes column
    console.log('\n⚙️  TEST CONFIGURATIONS TABLE:');
    const configData = await query<{
      total_rows: string;
      has_notes: string;
    }>(`
      SELECT
        COUNT(*) as total_rows,
        COUNT(notes) as has_notes
      FROM test_configurations
    `);

    const configRow = configData[0];
    const configTotal = parseInt(configRow.total_rows);

    console.log(`  Total rows: ${configTotal}`);
    console.log(`  notes: ${configRow.has_notes} (${(parseInt(configRow.has_notes)/configTotal*100).toFixed(1)}%)`);

    // Markers - check if clinical interpretation fields have data
    console.log('\n🔬 MARKERS TABLE:');
    const markerData = await query<{
      total_rows: string;
      has_clinical_use: string;
      has_interpretation_positive: string;
      has_interpretation_negative: string;
    }>(`
      SELECT
        COUNT(*) as total_rows,
        COUNT(clinical_use) as has_clinical_use,
        COUNT(interpretation_positive) as has_interpretation_positive,
        COUNT(interpretation_negative) as has_interpretation_negative
      FROM markers
    `);

    const markerRow = markerData[0];
    const markerTotal = parseInt(markerRow.total_rows);

    console.log(`  Total rows: ${markerTotal}`);
    console.log(`  clinical_use: ${markerRow.has_clinical_use} (${(parseInt(markerRow.has_clinical_use)/markerTotal*100).toFixed(1)}%)`);
    console.log(`  interpretation_positive: ${markerRow.has_interpretation_positive} (${(parseInt(markerRow.has_interpretation_positive)/markerTotal*100).toFixed(1)}%)`);
    console.log(`  interpretation_negative: ${markerRow.has_interpretation_negative} (${(parseInt(markerRow.has_interpretation_negative)/markerTotal*100).toFixed(1)}%)`);

    // Check current indexes
    console.log('\n\n=== CHECKING CURRENT INDEXES ===\n');
    const indexData = await query<{
      tablename: string;
      indexname: string;
      indexdef: string;
    }>(`
      SELECT
        tablename,
        indexname,
        indexdef
      FROM pg_indexes
      WHERE schemaname = 'public'
        AND tablename IN ('test_configurations', 'cv_measurements', 'markers', 'assays', 'manufacturers')
      ORDER BY tablename, indexname
    `);

    let currentTable = '';
    for (const idx of indexData) {
      if (idx.tablename !== currentTable) {
        console.log(`\n📋 ${idx.tablename.toUpperCase()}:`);
        currentTable = idx.tablename;
      }
      console.log(`  ${idx.indexname}`);
      console.log(`    ${idx.indexdef}`);
    }

    console.log('\n\n✅ Analysis complete!\n');

  } catch (error) {
    console.error('❌ Error checking columns:', error);
    throw error;
  }
}

// Run the check
checkUnusedColumns()
  .then(() => {
    console.log('Done.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
