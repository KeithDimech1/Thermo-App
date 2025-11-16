#!/usr/bin/env tsx
/**
 * QC Data Import Script
 *
 * Imports data from qc-data.json into PostgreSQL/Neon database
 * Handles transactions, error recovery, and progress reporting
 *
 * Usage:
 *   npm run db:import
 *   tsx scripts/db/import-data.ts
 *
 * @version 1.0.0
 */

// Load environment variables from .env.local
import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(process.cwd(), '.env.local') });

import { Pool, PoolClient } from 'pg';
import { readFileSync } from 'fs';
import { join } from 'path';
import type { QCDataJSON } from '../../lib/types/qc-data';

// =============================================================================
// CONFIGURATION
// =============================================================================

const DATABASE_URL = process.env.DATABASE_URL || process.env.POSTGRES_URL;

if (!DATABASE_URL) {
  console.error('❌ Error: DATABASE_URL or POSTGRES_URL environment variable not set');
  console.error('   Please create a .env.local file with your database connection string');
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

function logProgress(current: number, total: number, label: string) {
  const percentage = ((current / total) * 100).toFixed(1);
  const bar = '█'.repeat(Math.floor(current / total * 40));
  const empty = '░'.repeat(40 - bar.length);
  process.stdout.write(`\r  ${label}: [${bar}${empty}] ${current}/${total} (${percentage}%)`);
  if (current === total) process.stdout.write('\n');
}

// =============================================================================
// DATA LOADING
// =============================================================================

function loadQCData(): QCDataJSON {
  try {
    const dataPath = join(__dirname, '../../build-data/assets/qc-data.json');
    const rawData = readFileSync(dataPath, 'utf-8');
    return JSON.parse(rawData);
  } catch (error) {
    log('Failed to load qc-data.json', 'error');
    throw error;
  }
}

// =============================================================================
// IMPORT FUNCTIONS
// =============================================================================

async function importCategories(client: PoolClient, data: QCDataJSON): Promise<void> {
  const categories = Object.values(data.categories);
  log(`Importing ${categories.length} categories...`, 'info');

  for (let i = 0; i < categories.length; i++) {
    const cat = categories[i];
    await client.query(
      `INSERT INTO categories (id, name, description)
       VALUES ($1, $2, $3)
       ON CONFLICT (id) DO UPDATE SET
         name = EXCLUDED.name,
         description = EXCLUDED.description`,
      [cat.id, cat.name, cat.description]
    );
    logProgress(i + 1, categories.length, 'Categories');
  }
}

async function importPathogens(client: PoolClient, data: QCDataJSON): Promise<void> {
  const pathogens = Object.values(data.pathogens);
  log(`Importing ${pathogens.length} pathogens...`, 'info');

  for (let i = 0; i < pathogens.length; i++) {
    const pathogen = pathogens[i];

    // Find category ID by name (since JSON has category as string)
    let categoryId = null;
    if (pathogen.category) {
      const categoryEntry = Object.values(data.categories).find(
        c => c.name === pathogen.category
      );
      categoryId = categoryEntry?.id || null;
    }

    await client.query(
      `INSERT INTO pathogens (id, name, category_id)
       VALUES ($1, $2, $3)
       ON CONFLICT (id) DO UPDATE SET
         name = EXCLUDED.name,
         category_id = EXCLUDED.category_id`,
      [pathogen.id, pathogen.name, categoryId]
    );
    logProgress(i + 1, pathogens.length, 'Pathogens');
  }
}

async function importMarkers(client: PoolClient, data: QCDataJSON): Promise<void> {
  const markers = Object.values(data.markers);
  log(`Importing ${markers.length} markers...`, 'info');

  for (let i = 0; i < markers.length; i++) {
    const marker = markers[i];
    await client.query(
      `INSERT INTO markers (id, name, pathogen_id, category_id, antibody_type, marker_type)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (id) DO UPDATE SET
         name = EXCLUDED.name,
         pathogen_id = EXCLUDED.pathogen_id,
         category_id = EXCLUDED.category_id,
         antibody_type = EXCLUDED.antibody_type,
         marker_type = EXCLUDED.marker_type`,
      [
        marker.id,
        marker.name,
        marker.pathogenId,
        marker.categoryId,
        marker.antibodyType,
        'Antibody' // Default marker type
      ]
    );
    logProgress(i + 1, markers.length, 'Markers');
  }
}

async function importManufacturers(client: PoolClient, data: QCDataJSON): Promise<void> {
  const manufacturers = Object.values(data.manufacturers);
  log(`Importing ${manufacturers.length} manufacturers...`, 'info');

  for (let i = 0; i < manufacturers.length; i++) {
    const mfr = manufacturers[i];
    await client.query(
      `INSERT INTO manufacturers (id, name, total_assays)
       VALUES ($1, $2, $3)
       ON CONFLICT (id) DO UPDATE SET
         name = EXCLUDED.name,
         total_assays = EXCLUDED.total_assays`,
      [mfr.id, mfr.name, mfr.totalAssays]
    );
    logProgress(i + 1, manufacturers.length, 'Manufacturers');
  }
}

async function importAssays(client: PoolClient, data: QCDataJSON): Promise<void> {
  const assays = Object.values(data.assays);
  log(`Importing ${assays.length} assays...`, 'info');

  for (let i = 0; i < assays.length; i++) {
    const assay = assays[i];
    await client.query(
      `INSERT INTO assays (id, name, manufacturer_id, platform, methodology)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (id) DO UPDATE SET
         name = EXCLUDED.name,
         manufacturer_id = EXCLUDED.manufacturer_id,
         platform = EXCLUDED.platform,
         methodology = EXCLUDED.methodology`,
      [
        assay.id,
        assay.name,
        assay.manufacturerId,
        assay.platform,
        assay.methodology
      ]
    );
    logProgress(i + 1, assays.length, 'Assays');
  }
}

async function importQCSamples(client: PoolClient, data: QCDataJSON): Promise<void> {
  const qcSamples = Object.values(data.qcSamples);
  log(`Importing ${qcSamples.length} QC samples...`, 'info');

  for (let i = 0; i < qcSamples.length; i++) {
    const qc = qcSamples[i];
    await client.query(
      `INSERT INTO qc_samples (id, name, manufacturer, matrix_type)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (id) DO UPDATE SET
         name = EXCLUDED.name,
         manufacturer = EXCLUDED.manufacturer,
         matrix_type = EXCLUDED.matrix_type`,
      [qc.id, qc.name, qc.manufacturer, qc.matrixType]
    );
    logProgress(i + 1, qcSamples.length, 'QC Samples');
  }
}

async function importTestConfigurations(client: PoolClient, data: QCDataJSON): Promise<void> {
  const configs = data.testConfigurations;
  log(`Importing ${configs.length} test configurations...`, 'info');

  for (let i = 0; i < configs.length; i++) {
    const config = configs[i];
    await client.query(
      `INSERT INTO test_configurations (
         id, marker_id, assay_id, qc_sample_id, test_type,
         events_examined, quality_rating
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (id) DO UPDATE SET
         marker_id = EXCLUDED.marker_id,
         assay_id = EXCLUDED.assay_id,
         qc_sample_id = EXCLUDED.qc_sample_id,
         test_type = EXCLUDED.test_type,
         events_examined = EXCLUDED.events_examined,
         quality_rating = EXCLUDED.quality_rating`,
      [
        config.id,
        config.markerId,
        config.assayId,
        config.qcSampleId,
        config.testType,
        config.eventsExamined,
        config.qualityRating
      ]
    );
    logProgress(i + 1, configs.length, 'Test Configs');
  }
}

async function importCVMeasurements(client: PoolClient, data: QCDataJSON): Promise<void> {
  const configs = data.testConfigurations;
  log(`Importing ${configs.length} CV measurements...`, 'info');

  for (let i = 0; i < configs.length; i++) {
    const config = configs[i];
    const cv = config.cvPerformance;

    await client.query(
      `INSERT INTO cv_measurements (
         test_config_id,
         cv_lt_10_count, cv_lt_10_percentage,
         cv_10_15_count, cv_10_15_percentage,
         cv_15_20_count, cv_15_20_percentage,
         cv_gt_20_count, cv_gt_20_percentage
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       ON CONFLICT (test_config_id) DO UPDATE SET
         cv_lt_10_count = EXCLUDED.cv_lt_10_count,
         cv_lt_10_percentage = EXCLUDED.cv_lt_10_percentage,
         cv_10_15_count = EXCLUDED.cv_10_15_count,
         cv_10_15_percentage = EXCLUDED.cv_10_15_percentage,
         cv_15_20_count = EXCLUDED.cv_15_20_count,
         cv_15_20_percentage = EXCLUDED.cv_15_20_percentage,
         cv_gt_20_count = EXCLUDED.cv_gt_20_count,
         cv_gt_20_percentage = EXCLUDED.cv_gt_20_percentage`,
      [
        config.id,
        cv.lessThan10.count,
        cv.lessThan10.percentage,
        cv.between10And15.count,
        cv.between10And15.percentage,
        cv.between15And20.count,
        cv.between15And20.percentage,
        cv.greaterThan20.count,
        cv.greaterThan20.percentage
      ]
    );
    logProgress(i + 1, configs.length, 'CV Measurements');
  }
}

// =============================================================================
// MAIN IMPORT FUNCTION
// =============================================================================

async function importData() {
  const startTime = Date.now();
  let client: PoolClient | null = null;

  try {
    log('Starting QC data import...', 'info');
    log('', 'info');

    // Load data
    log('Loading qc-data.json...', 'info');
    const data = loadQCData();
    log(`Loaded ${data.metadata.totalConfigurations} test configurations`, 'success');
    log('', 'info');

    // Get database client
    client = await pool.connect();

    // Start transaction
    await client.query('BEGIN');
    log('Transaction started', 'info');
    log('', 'info');

    // Import in order (respecting foreign key dependencies)
    await importCategories(client, data);
    await importPathogens(client, data);
    await importMarkers(client, data);
    await importManufacturers(client, data);
    await importAssays(client, data);
    await importQCSamples(client, data);
    await importTestConfigurations(client, data);
    await importCVMeasurements(client, data);

    // Commit transaction
    await client.query('COMMIT');
    log('', 'info');
    log('Transaction committed successfully!', 'success');

    // Summary
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    log('', 'info');
    log('========================================', 'success');
    log('Import completed successfully!', 'success');
    log('========================================', 'success');
    log(`Duration: ${duration}s`, 'info');
    log(`Categories: ${Object.keys(data.categories).length}`, 'info');
    log(`Pathogens: ${Object.keys(data.pathogens).length}`, 'info');
    log(`Markers: ${Object.keys(data.markers).length}`, 'info');
    log(`Manufacturers: ${Object.keys(data.manufacturers).length}`, 'info');
    log(`Assays: ${Object.keys(data.assays).length}`, 'info');
    log(`QC Samples: ${Object.keys(data.qcSamples).length}`, 'info');
    log(`Test Configurations: ${data.testConfigurations.length}`, 'info');
    log(`CV Measurements: ${data.testConfigurations.length}`, 'info');
    log('========================================', 'success');
    log('', 'info');
    log('Next step: Run verification script', 'info');
    log('  npm run db:verify', 'info');

  } catch (error) {
    // Rollback on error
    if (client) {
      await client.query('ROLLBACK');
      log('Transaction rolled back due to error', 'error');
    }

    log('', 'error');
    log('========================================', 'error');
    log('Import failed!', 'error');
    log('========================================', 'error');
    if (error instanceof Error) {
      log(`Error: ${error.message}`, 'error');
      if (error.stack) {
        console.error(error.stack);
      }
    }
    process.exit(1);

  } finally {
    if (client) {
      client.release();
    }
    await pool.end();
  }
}

// =============================================================================
// RUN
// =============================================================================

importData().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});
