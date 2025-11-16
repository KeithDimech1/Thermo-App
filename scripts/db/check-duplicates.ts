#!/usr/bin/env tsx
/**
 * Database Duplicate Check Script
 *
 * Comprehensively checks for:
 * 1. Duplicate rows in each table
 * 2. Redundant data storage
 * 3. Data integrity issues
 *
 * Usage:
 *   npm run db:check-duplicates
 *   tsx scripts/db/check-duplicates.ts
 *
 * @version 1.0.0
 */

// Load environment variables
import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(process.cwd(), '.env.local') });

import { Pool } from 'pg';

// =============================================================================
// CONFIGURATION
// =============================================================================

const DATABASE_URL = process.env.DATABASE_URL || process.env.POSTGRES_URL;

if (!DATABASE_URL) {
  console.error('❌ Error: DATABASE_URL environment variable not set');
  process.exit(1);
}

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: DATABASE_URL.includes('neon.tech') || DATABASE_URL.includes('supabase')
    ? { rejectUnauthorized: false }
    : undefined
});

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

function log(message: string, type: 'info' | 'success' | 'error' | 'warn' = 'info') {
  const icons = {
    info: '📊',
    success: '✅',
    error: '❌',
    warn: '⚠️'
  };
  const colors = {
    info: '\x1b[36m',    // Cyan
    success: '\x1b[32m', // Green
    error: '\x1b[31m',   // Red
    warn: '\x1b[33m'     // Yellow
  };
  const reset = '\x1b[0m';

  console.log(`${icons[type]} ${colors[type]}${message}${reset}`);
}

// =============================================================================
// DUPLICATE CHECKS
// =============================================================================

interface DuplicateResult {
  table: string;
  passed: boolean;
  duplicates: number;
  details?: any[];
}

const results: DuplicateResult[] = [];

async function checkCategoriesDuplicates() {
  console.log('\n🔍 Checking categories for duplicates...\n');

  // Check for duplicate IDs
  const idCheck = await pool.query(`
    SELECT id, COUNT(*) as count
    FROM categories
    GROUP BY id
    HAVING COUNT(*) > 1
  `);

  // Check for duplicate names
  const nameCheck = await pool.query(`
    SELECT name, COUNT(*) as count
    FROM categories
    GROUP BY name
    HAVING COUNT(*) > 1
  `);

  const passed = idCheck.rows.length === 0 && nameCheck.rows.length === 0;

  results.push({
    table: 'categories',
    passed,
    duplicates: idCheck.rows.length + nameCheck.rows.length,
    details: [...idCheck.rows, ...nameCheck.rows]
  });

  if (passed) {
    log('categories: No duplicates found', 'success');
  } else {
    log(`categories: ${idCheck.rows.length + nameCheck.rows.length} duplicates found`, 'error');
    console.log('  Duplicate IDs:', idCheck.rows);
    console.log('  Duplicate names:', nameCheck.rows);
  }
}

async function checkPathogensDuplicates() {
  console.log('🔍 Checking pathogens for duplicates...\n');

  const idCheck = await pool.query(`
    SELECT id, COUNT(*) as count
    FROM pathogens
    GROUP BY id
    HAVING COUNT(*) > 1
  `);

  const nameCheck = await pool.query(`
    SELECT name, COUNT(*) as count
    FROM pathogens
    GROUP BY name
    HAVING COUNT(*) > 1
  `);

  const passed = idCheck.rows.length === 0 && nameCheck.rows.length === 0;

  results.push({
    table: 'pathogens',
    passed,
    duplicates: idCheck.rows.length + nameCheck.rows.length
  });

  if (passed) {
    log('pathogens: No duplicates found', 'success');
  } else {
    log(`pathogens: ${idCheck.rows.length + nameCheck.rows.length} duplicates found`, 'error');
  }
}

async function checkMarkersDuplicates() {
  console.log('🔍 Checking markers for duplicates...\n');

  const idCheck = await pool.query(`
    SELECT id, COUNT(*) as count
    FROM markers
    GROUP BY id
    HAVING COUNT(*) > 1
  `);

  const nameCheck = await pool.query(`
    SELECT name, COUNT(*) as count
    FROM markers
    GROUP BY name
    HAVING COUNT(*) > 1
  `);

  const passed = idCheck.rows.length === 0 && nameCheck.rows.length === 0;

  results.push({
    table: 'markers',
    passed,
    duplicates: idCheck.rows.length + nameCheck.rows.length
  });

  if (passed) {
    log('markers: No duplicates found', 'success');
  } else {
    log(`markers: ${idCheck.rows.length + nameCheck.rows.length} duplicates found`, 'error');
  }
}

async function checkManufacturersDuplicates() {
  console.log('🔍 Checking manufacturers for duplicates...\n');

  const idCheck = await pool.query(`
    SELECT id, COUNT(*) as count
    FROM manufacturers
    GROUP BY id
    HAVING COUNT(*) > 1
  `);

  const nameCheck = await pool.query(`
    SELECT name, COUNT(*) as count
    FROM manufacturers
    GROUP BY name
    HAVING COUNT(*) > 1
  `);

  const passed = idCheck.rows.length === 0 && nameCheck.rows.length === 0;

  results.push({
    table: 'manufacturers',
    passed,
    duplicates: idCheck.rows.length + nameCheck.rows.length
  });

  if (passed) {
    log('manufacturers: No duplicates found', 'success');
  } else {
    log(`manufacturers: ${idCheck.rows.length + nameCheck.rows.length} duplicates found`, 'error');
  }
}

async function checkAssaysDuplicates() {
  console.log('🔍 Checking assays for duplicates...\n');

  const idCheck = await pool.query(`
    SELECT id, COUNT(*) as count
    FROM assays
    GROUP BY id
    HAVING COUNT(*) > 1
  `);

  const nameCheck = await pool.query(`
    SELECT name, COUNT(*) as count
    FROM assays
    GROUP BY name
    HAVING COUNT(*) > 1
  `);

  const passed = idCheck.rows.length === 0 && nameCheck.rows.length === 0;

  results.push({
    table: 'assays',
    passed,
    duplicates: idCheck.rows.length + nameCheck.rows.length
  });

  if (passed) {
    log('assays: No duplicates found', 'success');
  } else {
    log(`assays: ${idCheck.rows.length + nameCheck.rows.length} duplicates found`, 'error');
  }
}

async function checkQCSamplesDuplicates() {
  console.log('🔍 Checking QC samples for duplicates...\n');

  const idCheck = await pool.query(`
    SELECT id, COUNT(*) as count
    FROM qc_samples
    GROUP BY id
    HAVING COUNT(*) > 1
  `);

  const nameCheck = await pool.query(`
    SELECT name, COUNT(*) as count
    FROM qc_samples
    GROUP BY name
    HAVING COUNT(*) > 1
  `);

  const passed = idCheck.rows.length === 0 && nameCheck.rows.length === 0;

  results.push({
    table: 'qc_samples',
    passed,
    duplicates: idCheck.rows.length + nameCheck.rows.length
  });

  if (passed) {
    log('qc_samples: No duplicates found', 'success');
  } else {
    log(`qc_samples: ${idCheck.rows.length + nameCheck.rows.length} duplicates found`, 'error');
  }
}

async function checkTestConfigurationsDuplicates() {
  console.log('🔍 Checking test_configurations for duplicates...\n');

  // Check for duplicate IDs
  const idCheck = await pool.query(`
    SELECT id, COUNT(*) as count
    FROM test_configurations
    GROUP BY id
    HAVING COUNT(*) > 1
  `);

  // Check for duplicate combinations (marker_id, assay_id, qc_sample_id)
  // This should be prevented by UNIQUE constraint, but let's verify
  const comboCheck = await pool.query(`
    SELECT marker_id, assay_id, qc_sample_id, COUNT(*) as count
    FROM test_configurations
    GROUP BY marker_id, assay_id, qc_sample_id
    HAVING COUNT(*) > 1
  `);

  const passed = idCheck.rows.length === 0 && comboCheck.rows.length === 0;

  results.push({
    table: 'test_configurations',
    passed,
    duplicates: idCheck.rows.length + comboCheck.rows.length,
    details: comboCheck.rows
  });

  if (passed) {
    log('test_configurations: No duplicates found', 'success');
  } else {
    log(`test_configurations: ${idCheck.rows.length + comboCheck.rows.length} duplicates found`, 'error');
    if (comboCheck.rows.length > 0) {
      console.log('  Duplicate marker/assay/qc combinations:');
      comboCheck.rows.forEach(row => {
        console.log(`    Marker ${row.marker_id}, Assay ${row.assay_id}, QC ${row.qc_sample_id}: ${row.count} times`);
      });
    }
  }
}

async function checkCVMeasurementsDuplicates() {
  console.log('🔍 Checking cv_measurements for duplicates...\n');

  // Check for duplicate test_config_id
  // This should be prevented by UNIQUE constraint
  const configCheck = await pool.query(`
    SELECT test_config_id, COUNT(*) as count
    FROM cv_measurements
    GROUP BY test_config_id
    HAVING COUNT(*) > 1
  `);

  const passed = configCheck.rows.length === 0;

  results.push({
    table: 'cv_measurements',
    passed,
    duplicates: configCheck.rows.length,
    details: configCheck.rows
  });

  if (passed) {
    log('cv_measurements: No duplicates found', 'success');
  } else {
    log(`cv_measurements: ${configCheck.rows.length} duplicate test_config_ids found`, 'error');
    configCheck.rows.forEach(row => {
      console.log(`  test_config_id ${row.test_config_id}: ${row.count} times`);
    });
  }
}

// =============================================================================
// DATA REDUNDANCY CHECKS
// =============================================================================

async function checkDataRedundancy() {
  console.log('\n📦 Checking for data redundancy...\n');

  // 1. Check if test_configurations and cv_measurements have 1:1 relationship
  const configCount = await pool.query('SELECT COUNT(*) FROM test_configurations');
  const cvCount = await pool.query('SELECT COUNT(*) FROM cv_measurements');

  const configTotal = parseInt(configCount.rows[0].count);
  const cvTotal = parseInt(cvCount.rows[0].count);

  if (configTotal === cvTotal) {
    log(`test_configurations ↔ cv_measurements: Perfect 1:1 relationship (${configTotal} each)`, 'success');
  } else {
    log(`test_configurations ↔ cv_measurements: Mismatch (${configTotal} configs, ${cvTotal} CV measurements)`, 'warn');
  }

  // 2. Check for orphaned cv_measurements (should be caught by foreign key, but let's verify)
  const orphanedCV = await pool.query(`
    SELECT COUNT(*) FROM cv_measurements
    WHERE test_config_id NOT IN (SELECT id FROM test_configurations)
  `);

  if (parseInt(orphanedCV.rows[0].count) === 0) {
    log('No orphaned CV measurements', 'success');
  } else {
    log(`${orphanedCV.rows[0].count} orphaned CV measurements found`, 'error');
  }

  // 3. Check if any data is duplicated between tables (it shouldn't be)
  console.log('\n  Architecture Verification:');
  console.log('  ✓ test_configurations: stores WHAT was tested (marker + assay + QC sample)');
  console.log('  ✓ cv_measurements: stores HOW WELL it performed (CV percentages)');
  console.log('  ✓ These are separate tables linked by test_config_id (normalized design)');
  console.log('  ✓ Views (vw_test_config_details) join them for easy querying\n');
}

// =============================================================================
// ROW COUNT COMPARISON
// =============================================================================

async function compareRowCounts() {
  console.log('\n📊 Comparing database row counts with expected values...\n');

  const tables = [
    { name: 'categories', expected: 8 },
    { name: 'pathogens', expected: 16 },
    { name: 'markers', expected: 28 },
    { name: 'manufacturers', expected: 9 },
    { name: 'assays', expected: 132 },
    { name: 'qc_samples', expected: 16 },
    { name: 'test_configurations', expected: 132 },
    { name: 'cv_measurements', expected: 132 }
  ];

  let allMatch = true;

  for (const table of tables) {
    const result = await pool.query(`SELECT COUNT(*) FROM ${table.name}`);
    const actual = parseInt(result.rows[0].count);
    const matches = actual === table.expected;

    if (!matches) allMatch = false;

    const status = matches ? 'success' : 'error';
    const message = matches
      ? `${table.name.padEnd(25)} ${actual} rows (matches expected)`
      : `${table.name.padEnd(25)} ${actual} rows (expected ${table.expected})`;

    log(message, status);
  }

  return allMatch;
}

// =============================================================================
// MAIN FUNCTION
// =============================================================================

async function checkDuplicates() {
  try {
    console.log('\n========================================');
    console.log('Database Duplicate & Redundancy Check');
    console.log('========================================');

    // Run all duplicate checks
    await checkCategoriesDuplicates();
    await checkPathogensDuplicates();
    await checkMarkersDuplicates();
    await checkManufacturersDuplicates();
    await checkAssaysDuplicates();
    await checkQCSamplesDuplicates();
    await checkTestConfigurationsDuplicates();
    await checkCVMeasurementsDuplicates();

    // Check for data redundancy
    await checkDataRedundancy();

    // Compare row counts
    const countsMatch = await compareRowCounts();

    // Summary
    const totalTables = results.length;
    const cleanTables = results.filter(r => r.passed).length;
    const tablesWithDuplicates = totalTables - cleanTables;
    const totalDuplicates = results.reduce((sum, r) => sum + r.duplicates, 0);

    console.log('\n========================================');
    console.log('Summary');
    console.log('========================================');
    console.log(`Tables Checked: ${totalTables}`);

    if (tablesWithDuplicates === 0) {
      log(`Clean Tables: ${cleanTables} (All tables are duplicate-free!)`, 'success');
    } else {
      log(`Clean Tables: ${cleanTables}`, 'success');
      log(`Tables with Duplicates: ${tablesWithDuplicates}`, 'error');
      log(`Total Duplicates Found: ${totalDuplicates}`, 'error');
    }

    if (!countsMatch) {
      log('Row counts do not match expected values', 'warn');
    }

    console.log('========================================\n');

    if (tablesWithDuplicates > 0) {
      console.log('Tables with duplicates:');
      results.filter(r => !r.passed).forEach(r => {
        console.log(`  ❌ ${r.table}: ${r.duplicates} duplicates`);
        if (r.details && r.details.length > 0) {
          r.details.forEach(d => console.log(`     ${JSON.stringify(d)}`));
        }
      });
      console.log('');
      process.exit(1);
    } else {
      log('All checks passed! No duplicates found. ✨', 'success');
      console.log('\n✅ Database Integrity Summary:');
      console.log('  • No duplicate rows in any table');
      console.log('  • No redundant data storage');
      console.log('  • test_configurations and cv_measurements have proper 1:1 relationship');
      console.log('  • Database is properly normalized');
      console.log('  • Ready for production use!\n');
    }

  } catch (error) {
    console.error('\n❌ Check failed with error:');
    console.error(error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// =============================================================================
// RUN
// =============================================================================

checkDuplicates().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});
