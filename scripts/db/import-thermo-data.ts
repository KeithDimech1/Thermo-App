#!/usr/bin/env tsx
/**
 * ⚠️ DEPRECATED - NOT UPDATED FOR EARTHBANK SCHEMA (IDEA-014)
 *
 * This script uses the OLD snake_case schema (samples, ft_datapoints, etc.)
 * and has NOT been migrated to the new EarthBank camelCase schema.
 *
 * ✅ USE THIS INSTEAD:
 * ./scripts/db/import-earthbank-csvs.sh
 *
 * See IDEA-014 migration log for details:
 * build-data/ideas/debug/IDEA-014-migrate-to-earthbank-native-schema-camelcase-1-1-template-mapping.md
 *
 * ---
 *
 * Thermochronology Data Import Script (LEGACY - NEEDS UPDATING)
 *
 * Imports FAIR-formatted CSV data into PostgreSQL/Neon database
 * Handles transactions, error recovery, and progress reporting
 *
 * Usage:
 *   npm run db:import-thermo
 *   tsx scripts/db/import-thermo-data.ts
 *
 * Data Source: /build-data/assets/source-data/thermo/data-extracts/transformed-fair/
 * Data Standard: Kohn et al. (2024) FAIR reporting guidelines (GSA Bulletin)
 *
 * @version 1.0.0
 */

console.error('⚠️  WARNING: This script is DEPRECATED and uses the OLD schema.');
console.error('');
console.error('✅ Use this workflow instead:');
console.error('   ./scripts/db/import-earthbank-csvs.sh');
console.error('');
console.error('Press Ctrl+C to cancel, or wait 5 seconds to continue anyway...');
console.error('');

await new Promise(resolve => setTimeout(resolve, 5000));

// Load environment variables from .env.local
import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(process.cwd(), '.env.local') });

import { Pool, PoolClient } from 'pg';
import { readFileSync } from 'fs';
import { join } from 'path';

// =============================================================================
// CONFIGURATION
// =============================================================================

// Use DIRECT_URL for imports to avoid pooler transaction issues
const DATABASE_URL = process.env.DIRECT_URL || process.env.DATABASE_URL || process.env.POSTGRES_URL;

if (!DATABASE_URL) {
  console.error('❌ Error: DIRECT_URL, DATABASE_URL or POSTGRES_URL environment variable not set');
  console.error('   Please create a .env.local file with your database connection string');
  process.exit(1);
}

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: DATABASE_URL.includes('neon.tech') || DATABASE_URL.includes('supabase')
    ? { rejectUnauthorized: false }
    : undefined
});

const DATA_PATH = join(process.cwd(), 'build-data/assets/source-data/thermo/data-extracts/transformed-fair');

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

/**
 * Parse CSV file into array of objects
 * Handles quoted values with commas inside
 */
function parseCSV(content: string): Record<string, string>[] {
  const lines = content.trim().split('\n');

  // Parse CSV line respecting quotes
  function parseLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());

    return result;
  }

  const headers = parseLine(lines[0]);

  return lines.slice(1).map(line => {
    const values = parseLine(line);
    const row: Record<string, string> = {};

    headers.forEach((header, i) => {
      const value = values[i]?.trim() || '';
      row[header.trim()] = value === '' ? null : value;
    });

    return row;
  });
}

/**
 * Convert string value to appropriate type for SQL
 */
function toSQLValue(value: string | null): any {
  if (value === null || value === '' || value === 'NULL') return null;

  // Try to parse as number
  const num = parseFloat(value);
  if (!isNaN(num)) return num;

  return value;
}

// =============================================================================
// IMPORT FUNCTIONS
// =============================================================================

async function importSamples(client: PoolClient) {
  log('Importing samples metadata (FAIR Table 4)...', 'info');

  const csvContent = readFileSync(join(DATA_PATH, 'table-04-geosample-metadata.csv'), 'utf-8');
  const rows = parseCSV(csvContent);

  let inserted = 0;

  for (const row of rows) {
    await client.query(`
      INSERT INTO samples (
        sample_id, dataset_id, igsn, latitude, longitude, elevation_m,
        geodetic_datum, vertical_datum, lat_long_precision_m,
        lithology, mineral_type, sample_kind, sample_method, sample_depth_m,
        sampling_location_information, stratigraphic_unit,
        chronostratigraphic_unit_age, sample_age_ma,
        sample_collector, collection_date, analyst, analysis_method,
        last_known_sample_archive, associated_references,
        n_aft_grains, n_ahe_grains
      ) VALUES (
        $1, 1, $2, $3, $4, $5,
        $6, $7, $8,
        $9, $10, $11, $12, $13,
        $14, $15,
        $16, $17,
        $18, $19, $20, $21,
        $22, $23,
        $24, $25
      )
      ON CONFLICT (sample_id) DO UPDATE SET
        latitude = EXCLUDED.latitude,
        longitude = EXCLUDED.longitude,
        n_aft_grains = EXCLUDED.n_aft_grains,
        n_ahe_grains = EXCLUDED.n_ahe_grains
    `, [
      row.sample_id,
      toSQLValue(row.igsn),
      toSQLValue(row.latitude),
      toSQLValue(row.longitude),
      toSQLValue(row.elevation_m),
      row.geodetic_datum || 'WGS84',
      row.vertical_datum || 'mean sea level',
      toSQLValue(row.lat_long_precision_m),
      toSQLValue(row.lithology),
      toSQLValue(row.mineral_type),
      toSQLValue(row.sample_kind),
      toSQLValue(row.sample_method),
      toSQLValue(row.sample_depth_m),
      toSQLValue(row.sampling_location_information),
      toSQLValue(row.stratigraphic_unit),
      toSQLValue(row.chronostratigraphic_unit_age),
      toSQLValue(row.sample_age_ma),
      toSQLValue(row.sample_collector),
      toSQLValue(row.collection_date),
      toSQLValue(row.analyst),
      toSQLValue(row.analysis_method),
      toSQLValue(row.last_known_sample_archive),
      toSQLValue(row.associated_references),
      toSQLValue(row.n_aft_grains),
      toSQLValue(row.n_ahe_grains)
    ]);
    inserted++;
  }

  log(`Imported ${inserted} samples`, 'success');
  return inserted;
}

async function importFTCounts(client: PoolClient) {
  log('Importing fission-track count data (FAIR Table 5)...', 'info');

  const csvContent = readFileSync(join(DATA_PATH, 'table-05-fission-track-counts.csv'), 'utf-8');
  const rows = parseCSV(csvContent);

  let inserted = 0;

  for (const row of rows) {
    await client.query(`
      INSERT INTO ft_counts (
        sample_id, grain_id,
        Ns, rho_s_cm2, rho_i_cm2, rho_d_cm2,
        Ni, Nd,
        U_ppm, U_1sigma, Th_ppm, Th_1sigma, eU_ppm, eU_1sigma,
        Dpar_um, Dpar_sd_um, Dper_um, Dper_sd_um,
        Cl_wt_pct, eCl_apfu, rmr0, rmr0D,
        P_chi2_pct, Disp_pct, n_grains,
        ft_counting_method, ft_software, ft_algorithm,
        microscope, objective, analyst, laboratory,
        analysis_date, sample_mount_id, etching_conditions,
        counting_area_cm2, dosimeter
      ) VALUES (
        $1, $2,
        $3, $4, $5, $6,
        $7, $8,
        $9, $10, $11, $12, $13, $14,
        $15, $16, $17, $18,
        $19, $20, $21, $22,
        $23, $24, $25,
        $26, $27, $28,
        $29, $30, $31, $32,
        $33, $34, $35,
        $36, $37
      )
      ON CONFLICT (grain_id) DO UPDATE SET
        Ns = EXCLUDED.Ns,
        rho_s_cm2 = EXCLUDED.rho_s_cm2
    `, [
      row.sample_id,
      row.grain_id,
      toSQLValue(row.Ns),
      toSQLValue(row.rho_s_cm2),
      toSQLValue(row.rho_i_cm2),
      toSQLValue(row.rho_d_cm2),
      toSQLValue(row.Ni),
      toSQLValue(row.Nd),
      toSQLValue(row.U_ppm),
      toSQLValue(row.U_1sigma),
      toSQLValue(row.Th_ppm),
      toSQLValue(row.Th_1sigma),
      toSQLValue(row.eU_ppm),
      toSQLValue(row.eU_1sigma),
      toSQLValue(row.Dpar_um),
      toSQLValue(row.Dpar_sd_um),
      toSQLValue(row.Dper_um),
      toSQLValue(row.Dper_sd_um),
      toSQLValue(row.Cl_wt_pct),
      toSQLValue(row.eCl_apfu),
      toSQLValue(row.rmr0),
      toSQLValue(row.rmr0D),
      toSQLValue(row.P_chi2_pct),
      toSQLValue(row.Disp_pct),
      toSQLValue(row.n_grains),
      toSQLValue(row.ft_counting_method),
      toSQLValue(row.ft_software),
      toSQLValue(row.ft_algorithm),
      toSQLValue(row.microscope),
      toSQLValue(row.objective),
      toSQLValue(row.analyst),
      toSQLValue(row.laboratory),
      toSQLValue(row.analysis_date),
      toSQLValue(row.sample_mount_id),
      toSQLValue(row.etching_conditions),
      toSQLValue(row.counting_area_cm2),
      toSQLValue(row.dosimeter)
    ]);
    inserted++;
  }

  log(`Imported ${inserted} FT count records`, 'success');
  return inserted;
}

async function importFTTrackLengths(client: PoolClient) {
  log('Importing track length data (FAIR Table 6)...', 'info');

  const csvContent = readFileSync(join(DATA_PATH, 'table-06-track-lengths.csv'), 'utf-8');
  const rows = parseCSV(csvContent);

  let inserted = 0;

  for (const row of rows) {
    await client.query(`
      INSERT INTO ft_track_lengths (
        sample_id, grain_id,
        n_confined_tracks, mean_track_length_um, mean_track_length_sd_um, mean_track_length_se_um,
        Dpar_um, Dpar_sd_um, Dper_um, Dper_sd_um,
        apparent_length_um, true_length_um, angle_to_c_axis_deg,
        etching_conditions, analyst, laboratory, analysis_date
      ) VALUES (
        $1, $2,
        $3, $4, $5, $6,
        $7, $8, $9, $10,
        $11, $12, $13,
        $14, $15, $16, $17
      )
    `, [
      row.sample_id,
      row.grain_id,
      toSQLValue(row.n_confined_tracks),
      toSQLValue(row.mean_track_length_um),
      toSQLValue(row.mean_track_length_sd_um),
      toSQLValue(row.mean_track_length_se_um),
      toSQLValue(row.Dpar_um),
      toSQLValue(row.Dpar_sd_um),
      toSQLValue(row.Dper_um),
      toSQLValue(row.Dper_sd_um),
      toSQLValue(row.apparent_length_um),
      toSQLValue(row.true_length_um),
      toSQLValue(row.angle_to_c_axis_deg),
      toSQLValue(row.etching_conditions),
      toSQLValue(row.analyst),
      toSQLValue(row.laboratory),
      toSQLValue(row.analysis_date)
    ]);
    inserted++;
  }

  log(`Imported ${inserted} track length records`, 'success');
  return inserted;
}

async function importFTAges(client: PoolClient) {
  log('Importing fission-track ages (FAIR Table 10)...', 'info');

  const csvContent = readFileSync(join(DATA_PATH, 'table-10-fission-track-ages.csv'), 'utf-8');
  const rows = parseCSV(csvContent);

  let inserted = 0;

  for (const row of rows) {
    // Parse array fields (mixture modeling peaks)
    const parseArray = (val: string | null): string | null => {
      if (!val || val === 'null') return null;
      return `{${val}}`;  // Convert to PostgreSQL array format
    };

    await client.query(`
      INSERT INTO ft_ages (
        sample_id,
        age_equation, ft_age_type,
        lambda_D, lambda_f, zeta_yr_cm2, zeta_error_yr_cm2,
        dosimeter, Rs_um, q, irradiation_reactor,
        n_grains, pooled_age_ma, pooled_age_error_ma,
        central_age_ma, central_age_error_ma,
        dispersion_pct, P_chi2,
        age_peak_software, best_fit_peak_ages_ma, best_fit_peak_errors_ma, best_fit_peak_grain_pct
      ) VALUES (
        $1,
        $2, $3,
        $4, $5, $6, $7,
        $8, $9, $10, $11,
        $12, $13, $14,
        $15, $16,
        $17, $18,
        $19, $20, $21, $22
      )
      ON CONFLICT (sample_id) DO UPDATE SET
        central_age_ma = EXCLUDED.central_age_ma,
        pooled_age_ma = EXCLUDED.pooled_age_ma
    `, [
      row.sample_id,
      toSQLValue(row.age_equation),
      toSQLValue(row.ft_age_type),
      toSQLValue(row.lambda_D),
      toSQLValue(row.lambda_f),
      toSQLValue(row.zeta_yr_cm2),
      toSQLValue(row.zeta_error_yr_cm2),
      toSQLValue(row.dosimeter),
      toSQLValue(row.Rs_um),
      toSQLValue(row.q),
      toSQLValue(row.irradiation_reactor),
      toSQLValue(row.n_grains),
      toSQLValue(row.pooled_age_ma),
      toSQLValue(row.pooled_age_error_ma),
      toSQLValue(row.central_age_ma),
      toSQLValue(row.central_age_error_ma),
      toSQLValue(row.dispersion_pct),
      toSQLValue(row.P_chi2),
      toSQLValue(row.age_peak_software),
      parseArray(row.best_fit_peak_ages_ma),
      parseArray(row.best_fit_peak_errors_ma),
      parseArray(row.best_fit_peak_grain_pct)
    ]);
    inserted++;
  }

  log(`Imported ${inserted} FT age records`, 'success');
  return inserted;
}

async function importAHeGrainData(client: PoolClient) {
  log('Importing (U-Th)/He grain data...', 'info');

  const csvContent = readFileSync(join(DATA_PATH, 'ahe-grain-data.csv'), 'utf-8');
  const rows = parseCSV(csvContent);

  let inserted = 0;

  for (const row of rows) {
    await client.query(`
      INSERT INTO ahe_grain_data (
        sample_id, lab_no,
        length_um, half_width_um, Rs_um, mass_mg, terminations,
        U_ppm, Th_ppm, Sm_ppm, eU_ppm, He_ncc,
        uncorr_age_ma, corr_age_ma, corr_age_1sigma_ma, FT,
        std_run, thermal_model
      ) VALUES (
        $1, $2,
        $3, $4, $5, $6, $7,
        $8, $9, $10, $11, $12,
        $13, $14, $15, $16,
        $17, $18
      )
      ON CONFLICT (lab_no) DO UPDATE SET
        corr_age_ma = EXCLUDED.corr_age_ma,
        corr_age_1sigma_ma = EXCLUDED.corr_age_1sigma_ma
    `, [
      row.sample_id,
      row.lab_no,
      toSQLValue(row.length_um),
      toSQLValue(row.half_width_um),
      toSQLValue(row.Rs_um),
      toSQLValue(row.mass_mg),
      toSQLValue(row.terminations),
      toSQLValue(row.U_ppm),
      toSQLValue(row.Th_ppm),
      toSQLValue(row.Sm_ppm),
      toSQLValue(row.eU_ppm),
      toSQLValue(row.He_ncc),
      toSQLValue(row.uncorr_age_ma),
      toSQLValue(row.corr_age_ma),
      toSQLValue(row.corr_age_1sigma_ma),
      toSQLValue(row.FT),
      toSQLValue(row.std_run),
      toSQLValue(row.thermal_model)
    ]);
    inserted++;
  }

  log(`Imported ${inserted} (U-Th)/He grain records`, 'success');
  return inserted;
}

// =============================================================================
// MAIN IMPORT FUNCTION
// =============================================================================

async function main() {
  const startTime = Date.now();

  log('='.repeat(80), 'info');
  log('THERMOCHRONOLOGY DATA IMPORT', 'info');
  log('='.repeat(80), 'info');
  log('', 'info');
  log(`Data Source: ${DATA_PATH}`, 'info');
  log(`Database: ${DATABASE_URL.split('@')[1]?.split('?')[0] || 'PostgreSQL'}`, 'info');
  log('', 'info');

  let client: PoolClient | null = null;

  try {
    // Connect to database
    log('Connecting to database...', 'info');
    client = await pool.connect();
    log('Database connection established', 'success');
    log('', 'info');

    // Debug: Check what tables exist
    const tablesResult = await client.query(`
      SELECT tablename FROM pg_tables
      WHERE schemaname = 'public'
      AND tablename IN ('samples', 'ft_counts', 'ft_ages', 'datasets')
      ORDER BY tablename
    `);
    log(`Found ${tablesResult.rows.length} Thermo tables:`, 'info');
    tablesResult.rows.forEach(row => log(`  - ${row.tablename}`, 'info'));
    log('', 'info');

    // Set search path to ensure we're using the public schema
    await client.query('SET search_path TO public');

    // Start transaction
    await client.query('BEGIN');
    log('Transaction started', 'info');
    log('', 'info');

    // Import data in dependency order
    const sampleCount = await importSamples(client);
    const ftCountCount = await importFTCounts(client);
    const ftLengthCount = await importFTTrackLengths(client);
    const ftAgeCount = await importFTAges(client);
    const aheCount = await importAHeGrainData(client);

    // Commit transaction
    await client.query('COMMIT');
    log('', 'info');
    log('Transaction committed successfully', 'success');

    // Summary
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    log('', 'info');
    log('='.repeat(80), 'info');
    log('IMPORT SUMMARY', 'success');
    log('='.repeat(80), 'info');
    log(`Samples:           ${sampleCount}`, 'success');
    log(`FT Count Records:  ${ftCountCount}`, 'success');
    log(`FT Length Records: ${ftLengthCount}`, 'success');
    log(`FT Age Records:    ${ftAgeCount}`, 'success');
    log(`AHe Grain Records: ${aheCount}`, 'success');
    log(`Total Records:     ${sampleCount + ftCountCount + ftLengthCount + ftAgeCount + aheCount}`, 'success');
    log(`Duration:          ${duration}s`, 'info');
    log('='.repeat(80), 'info');

  } catch (error) {
    // Rollback on error
    if (client) {
      await client.query('ROLLBACK');
      log('Transaction rolled back due to error', 'error');
    }

    log('', 'error');
    log('Import failed!', 'error');
    log(error instanceof Error ? error.message : String(error), 'error');

    if (error instanceof Error && error.stack) {
      console.error(error.stack);
    }

    process.exit(1);

  } finally {
    // Release client
    if (client) {
      client.release();
    }
    // Close pool
    await pool.end();
  }
}

// Run import
main();
