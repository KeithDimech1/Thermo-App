#!/usr/bin/env tsx
/**
 * Database Import Verification Script
 *
 * Verifies that all data was imported correctly
 * Runs test queries and compares counts with expected values
 *
 * Usage:
 *   npm run db:verify
 *   tsx scripts/db/verify-import.ts
 *
 * @version 1.0.0
 */

// Load environment variables from .env.local
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

function log(message: string, status: 'pass' | 'fail' | 'info' = 'info') {
  const icons = {
    pass: '✅',
    fail: '❌',
    info: '📊'
  };
  const colors = {
    pass: '\x1b[32m',  // Green
    fail: '\x1b[31m',  // Red
    info: '\x1b[36m'   // Cyan
  };
  const reset = '\x1b[0m';

  console.log(`${icons[status]} ${colors[status]}${message}${reset}`);
}

// =============================================================================
// VERIFICATION TESTS
// =============================================================================

interface TestResult {
  name: string;
  passed: boolean;
  expected?: number;
  actual?: number;
  message?: string;
}

const results: TestResult[] = [];

async function testTableCounts() {
  console.log('\n📋 Testing table row counts...\n');

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

  for (const table of tables) {
    const result = await pool.query(`SELECT COUNT(*) FROM ${table.name}`);
    const actual = parseInt(result.rows[0].count);
    const passed = actual === table.expected;

    results.push({
      name: `Table: ${table.name}`,
      passed,
      expected: table.expected,
      actual
    });

    const status = passed ? 'pass' : 'fail';
    const message = passed
      ? `${table.name.padEnd(25)} ${actual} rows`
      : `${table.name.padEnd(25)} Expected ${table.expected}, got ${actual}`;

    log(message, status);
  }
}

async function testForeignKeys() {
  console.log('\n🔗 Testing foreign key relationships...\n');

  const tests = [
    {
      name: 'Markers → Pathogens',
      query: `
        SELECT COUNT(*) FROM markers
        WHERE pathogen_id IS NOT NULL
        AND pathogen_id NOT IN (SELECT id FROM pathogens)
      `
    },
    {
      name: 'Markers → Categories',
      query: `
        SELECT COUNT(*) FROM markers
        WHERE category_id IS NOT NULL
        AND category_id NOT IN (SELECT id FROM categories)
      `
    },
    {
      name: 'Assays → Manufacturers',
      query: `
        SELECT COUNT(*) FROM assays
        WHERE manufacturer_id IS NOT NULL
        AND manufacturer_id NOT IN (SELECT id FROM manufacturers)
      `
    },
    {
      name: 'Test Configs → Markers',
      query: `
        SELECT COUNT(*) FROM test_configurations
        WHERE marker_id NOT IN (SELECT id FROM markers)
      `
    },
    {
      name: 'Test Configs → Assays',
      query: `
        SELECT COUNT(*) FROM test_configurations
        WHERE assay_id NOT IN (SELECT id FROM assays)
      `
    },
    {
      name: 'CV Measurements → Test Configs',
      query: `
        SELECT COUNT(*) FROM cv_measurements
        WHERE test_config_id NOT IN (SELECT id FROM test_configurations)
      `
    }
  ];

  for (const test of tests) {
    const result = await pool.query(test.query);
    const orphaned = parseInt(result.rows[0].count);
    const passed = orphaned === 0;

    results.push({
      name: test.name,
      passed,
      message: passed ? 'All references valid' : `${orphaned} orphaned records`
    });

    const status = passed ? 'pass' : 'fail';
    const message = passed
      ? `${test.name.padEnd(30)} All references valid`
      : `${test.name.padEnd(30)} ${orphaned} orphaned records`;

    log(message, status);
  }
}

async function testDataIntegrity() {
  console.log('\n🔍 Testing data integrity...\n');

  const tests = [
    {
      name: 'CV percentages within 0-100',
      query: `
        SELECT COUNT(*) FROM cv_measurements
        WHERE cv_lt_10_percentage < 0 OR cv_lt_10_percentage > 100
           OR cv_10_15_percentage < 0 OR cv_10_15_percentage > 100
           OR cv_15_20_percentage < 0 OR cv_15_20_percentage > 100
           OR cv_gt_20_percentage < 0 OR cv_gt_20_percentage > 100
      `
    },
    {
      name: 'Quality ratings valid',
      query: `
        SELECT COUNT(*) FROM test_configurations
        WHERE quality_rating NOT IN ('excellent', 'good', 'acceptable', 'poor', 'unknown')
      `
    },
    {
      name: 'Test types valid',
      query: `
        SELECT COUNT(*) FROM test_configurations
        WHERE test_type NOT IN ('serology', 'nat', 'both')
      `
    },
    {
      name: 'Events examined > 0',
      query: `
        SELECT COUNT(*) FROM test_configurations
        WHERE events_examined IS NOT NULL AND events_examined <= 0
      `
    }
  ];

  for (const test of tests) {
    const result = await pool.query(test.query);
    const invalid = parseInt(result.rows[0].count);
    const passed = invalid === 0;

    results.push({
      name: test.name,
      passed,
      message: passed ? 'Valid' : `${invalid} invalid records`
    });

    const status = passed ? 'pass' : 'fail';
    const message = passed
      ? `${test.name.padEnd(35)} Valid`
      : `${test.name.padEnd(35)} ${invalid} invalid`;

    log(message, status);
  }
}

async function testViews() {
  console.log('\n👁️  Testing database views...\n');

  const views = [
    {
      name: 'vw_test_config_details',
      query: 'SELECT COUNT(*) FROM vw_test_config_details'
    },
    {
      name: 'vw_manufacturer_performance',
      query: 'SELECT COUNT(*) FROM vw_manufacturer_performance'
    }
  ];

  for (const view of views) {
    try {
      const result = await pool.query(view.query);
      const count = parseInt(result.rows[0].count);
      const passed = count > 0;

      results.push({
        name: `View: ${view.name}`,
        passed,
        actual: count,
        message: `${count} rows`
      });

      const status = passed ? 'pass' : 'fail';
      log(`${view.name.padEnd(35)} ${count} rows`, status);

    } catch (error) {
      results.push({
        name: `View: ${view.name}`,
        passed: false,
        message: 'View does not exist or query failed'
      });
      log(`${view.name.padEnd(35)} Error`, 'fail');
    }
  }
}

async function testSampleQueries() {
  console.log('\n🔎 Testing sample queries...\n');

  const queries = [
    {
      name: 'Find all CMV markers',
      query: `SELECT COUNT(*) FROM markers WHERE name LIKE '%CMV%'`,
      expectedMin: 2 // at least anti-CMV IgG and IgM
    },
    {
      name: 'Find Abbott assays',
      query: `
        SELECT COUNT(*) FROM assays a
        JOIN manufacturers m ON a.manufacturer_id = m.id
        WHERE m.name = 'Abbott'
      `,
      expectedMin: 40 // Should have 46 assays
    },
    {
      name: 'Excellent quality configs',
      query: `SELECT COUNT(*) FROM test_configurations WHERE quality_rating = 'excellent'`,
      expectedMin: 30
    },
    {
      name: 'Poor quality configs',
      query: `SELECT COUNT(*) FROM test_configurations WHERE quality_rating = 'poor'`,
      expectedMin: 1
    }
  ];

  for (const test of queries) {
    const result = await pool.query(test.query);
    const count = parseInt(result.rows[0].count);
    const passed = count >= test.expectedMin;

    results.push({
      name: test.name,
      passed,
      actual: count,
      message: `Found ${count} records`
    });

    const status = passed ? 'pass' : 'fail';
    log(`${test.name.padEnd(35)} ${count} found`, status);
  }
}

async function showStatistics() {
  console.log('\n📊 Database Statistics...\n');

  // Quality breakdown
  const qualityResult = await pool.query(`
    SELECT quality_rating, COUNT(*) as count
    FROM test_configurations
    GROUP BY quality_rating
    ORDER BY count DESC
  `);

  console.log('Quality Rating Distribution:');
  qualityResult.rows.forEach(row => {
    const percentage = (row.count / 132 * 100).toFixed(1);
    console.log(`  ${row.quality_rating.padEnd(15)} ${String(row.count).padStart(3)} (${percentage}%)`);
  });

  // Top manufacturers
  const mfrResult = await pool.query(`
    SELECT name, total_assays
    FROM manufacturers
    ORDER BY total_assays DESC
    LIMIT 5
  `);

  console.log('\nTop Manufacturers by Assay Count:');
  mfrResult.rows.forEach(row => {
    console.log(`  ${row.name.padEnd(20)} ${row.total_assays} assays`);
  });

  // Average CV performance
  const cvResult = await pool.query(`
    SELECT
      AVG(cv_lt_10_percentage) as avg_excellent,
      AVG(cv_gt_20_percentage) as avg_poor
    FROM cv_measurements
    WHERE cv_lt_10_percentage IS NOT NULL
  `);

  if (cvResult.rows.length > 0) {
    console.log('\nAverage CV Performance:');
    console.log(`  <10% CV:  ${cvResult.rows[0].avg_excellent?.toFixed(2)}%`);
    console.log(`  >20% CV:  ${cvResult.rows[0].avg_poor?.toFixed(2)}%`);
  }
}

// =============================================================================
// MAIN FUNCTION
// =============================================================================

async function verify() {
  try {
    console.log('\n========================================');
    console.log('QC Database Import Verification');
    console.log('========================================');

    await testTableCounts();
    await testForeignKeys();
    await testDataIntegrity();
    await testViews();
    await testSampleQueries();
    await showStatistics();

    // Summary
    const totalTests = results.length;
    const passed = results.filter(r => r.passed).length;
    const failed = totalTests - passed;

    console.log('\n========================================');
    console.log('Verification Summary');
    console.log('========================================');
    console.log(`Total Tests: ${totalTests}`);
    log(`Passed: ${passed}`, 'pass');
    if (failed > 0) {
      log(`Failed: ${failed}`, 'fail');
    }
    console.log('========================================\n');

    if (failed > 0) {
      console.log('Failed tests:');
      results.filter(r => !r.passed).forEach(r => {
        console.log(`  ❌ ${r.name}: ${r.message || 'Failed'}`);
      });
      console.log('');
      process.exit(1);
    } else {
      log('All tests passed! ✨', 'pass');
      console.log('\nDatabase is ready to use!');
      console.log('');
    }

  } catch (error) {
    console.error('\n❌ Verification failed with error:');
    console.error(error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// =============================================================================
// RUN
// =============================================================================

verify().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});
