#!/usr/bin/env npx tsx
/**
 * ⚠️ DEPRECATED - NOT UPDATED FOR EARTHBANK SCHEMA (IDEA-014)
 *
 * This script uses the OLD snake_case schema (samples, ft_datapoints, etc.)
 * and has NOT been migrated to the new EarthBank camelCase schema.
 *
 * ✅ USE THIS INSTEAD:
 * 1. Transform Excel → CSV with camelCase headers (use scripts/db/transform-fair-csv-headers.ts)
 * 2. Import CSVs using: ./scripts/db/import-earthbank-csvs.sh
 *
 * See IDEA-014 migration log for details:
 * build-data/ideas/debug/IDEA-014-migrate-to-earthbank-native-schema-camelcase-1-1-template-mapping.md
 *
 * ---
 *
 * EarthBank Template Import Pipeline (LEGACY - NEEDS UPDATING)
 *
 * Imports data from EarthBank Excel templates into PostgreSQL database.
 * Supports:
 * - Sample.template.v2025-04-16.xlsx
 * - FTDatapoint.template.v2024-11-11.xlsx
 * - HeDatapoint.template.v2024-11-11.xlsx
 *
 * Usage:
 *   npx tsx scripts/db/import-earthbank-templates.ts --template samples --file path/to/file.xlsx
 *   npx tsx scripts/db/import-earthbank-templates.ts --template ft --file path/to/file.xlsx
 *   npx tsx scripts/db/import-earthbank-templates.ts --template he --file path/to/file.xlsx
 *
 * Week 2 - ERROR-005 Schema Migration
 * Created: 2025-11-17
 */

console.error('⚠️  WARNING: This script is DEPRECATED and uses the OLD schema.');
console.error('');
console.error('✅ Use this workflow instead:');
console.error('   1. Transform Excel → CSV: npx tsx scripts/db/transform-fair-csv-headers.ts <file>');
console.error('   2. Import CSVs: ./scripts/db/import-earthbank-csvs.sh');
console.error('');
console.error('Press Ctrl+C to cancel, or wait 5 seconds to continue anyway...');
console.error('');

await new Promise(resolve => setTimeout(resolve, 5000));

import * as ExcelJS from 'exceljs';
import * as path from 'path';
import * as fs from 'fs';
import { Pool, PoolClient } from 'pg';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

// Database connection
const pool = new Pool({
  connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// ============================================================================
// TYPES
// ============================================================================

interface ImportOptions {
  template: 'samples' | 'ft' | 'he';
  file: string;
  datasetId?: number;
  dryRun?: boolean;
  verbose?: boolean;
}

interface ImportStats {
  samplesInserted: number;
  datapointsInserted: number;
  countDataInserted: number;
  singleGrainAgesInserted: number;
  trackLengthsInserted: number;
  binnedLengthsInserted: number;
  heGrainsInserted: number;
  errors: string[];
}

// ============================================================================
// EXCEL READING UTILITIES
// ============================================================================

async function readExcelSheet(filePath: string, sheetName: string): Promise<any[]> {
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }

  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);

  const worksheet = workbook.getWorksheet(sheetName);
  if (!worksheet) {
    throw new Error(`Sheet "${sheetName}" not found in ${filePath}`);
  }

  // Convert worksheet to JSON array
  const jsonData: any[] = [];
  const headers: string[] = [];

  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) {
      // First row is headers
      row.eachCell((cell, colNumber) => {
        headers[colNumber] = cell.value?.toString() || '';
      });
    } else {
      // Data rows
      const rowData: any = {};
      row.eachCell((cell, colNumber) => {
        const header = headers[colNumber];
        if (header) {
          rowData[header] = cell.value;
        }
      });
      jsonData.push(rowData);
    }
  });

  return jsonData;
}

async function getSheetNames(filePath: string): Promise<string[]> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);
  return workbook.worksheets.map(sheet => sheet.name);
}

// ============================================================================
// DATABASE HELPERS
// ============================================================================

async function insertSample(client: PoolClient, row: any, datasetId: number): Promise<void> {
  // Map EarthBank Sample template columns to our schema
  // Reference: Sample.template.v2025-04-16.xlsx

  const sampleId = row['Sample Name'] || row['sample_id'];
  if (!sampleId) {
    throw new Error('Sample Name is required');
  }

  const sql = `
    INSERT INTO samples (
      sample_id, dataset_id, igsn,
      latitude, longitude, elevation_m,
      country, region, locality,
      lithology, stratigraphic_unit, geological_age_ma,
      mineral_type, mineral_separation_method,
      sample_collector, collection_date, field_notes,
      sample_description, sample_quality
    ) VALUES (
      $1, $2, $3,
      $4, $5, $6,
      $7, $8, $9,
      $10, $11, $12,
      $13, $14,
      $15, $16, $17,
      $18, $19
    )
    ON CONFLICT (sample_id) DO UPDATE SET
      igsn = EXCLUDED.igsn,
      latitude = EXCLUDED.latitude,
      longitude = EXCLUDED.longitude,
      elevation_m = EXCLUDED.elevation_m,
      lithology = EXCLUDED.lithology,
      mineral_type = EXCLUDED.mineral_type
  `;

  const values = [
    sampleId,
    datasetId,
    row['IGSN'] || row['igsn'] || null,
    row['Latitude'] || row['latitude'] || null,
    row['Longitude'] || row['longitude'] || null,
    row['Elevation (m)'] || row['elevation_m'] || null,
    row['Country'] || row['country'] || null,
    row['Region'] || row['region'] || null,
    row['Locality'] || row['locality'] || null,
    row['Lithology'] || row['lithology'] || null,
    row['Stratigraphic Unit'] || row['stratigraphic_unit'] || null,
    row['Geological Age (Ma)'] || row['geological_age_ma'] || null,
    row['Mineral Type'] || row['mineral_type'] || 'apatite',
    row['Mineral Separation Method'] || row['mineral_separation_method'] || null,
    row['Sample Collector'] || row['collector'] || null,
    row['Collection Date'] || row['collection_date'] || null,
    row['Field Notes'] || row['field_notes'] || null,
    row['Sample Description'] || row['sample_description'] || null,
    row['Sample Quality'] || row['sample_quality'] || null
  ];

  await client.query(sql, values);
}

async function insertFTDatapoint(client: PoolClient, row: any): Promise<number> {
  // Map EarthBank FT Datapoints sheet to ft_datapoints table
  // Reference: FTDatapoint.template.v2024-11-11.xlsx "FT Datapoints" sheet

  const datapointKey = row['DataPoint Name'] || row[Object.keys(row)[0]];
  const sampleId = row['Sample'] || row[Object.keys(row)[1]];

  if (!datapointKey || !sampleId) {
    throw new Error(`DataPoint Name and Sample are required. Got: ${datapointKey}, ${sampleId}`);
  }

  const sql = `
    INSERT INTO ft_datapoints (
      sample_id, datapoint_key, publication_doi,
      laboratory, analyst_orcid, analysis_date,
      mineral_type, ft_method, ft_software, ft_algorithm, u_determination_method,
      n_grains, total_area_cm2,
      mean_rho_s, total_Ns, mean_rho_i, total_Ni, mean_rho_d, total_Nd,
      dosimeter,
      mean_U_ppm, sd_U_ppm,
      mean_Dpar_um, se_Dpar_um, n_Dpar_measurements,
      mean_Dper_um, se_Dper_um, n_Dper_measurements,
      mean_rmr0, sd_rmr0, mean_kappa, sd_kappa, rmr0_equation,
      chi_square, P_chi2_pct, dispersion_pct,
      age_equation,
      mean_age_ma, mean_age_error_ma,
      central_age_ma, central_age_error_ma,
      pooled_age_ma, pooled_age_error_ma,
      population_age_ma, population_age_error_ma,
      age_error_type, age_comment,
      mean_track_length_um, se_mean_track_length_um,
      n_track_measurements, sd_track_length_um,
      cf252_irradiation, etchant_chemical, etch_duration_seconds, etch_temperature_c,
      zeta_yr_cm2, zeta_error_yr_cm2, zeta_error_type,
      R_um, lambda_D, lambda_f, q_factor,
      irradiation_reactor, thermal_neutron_dose, irradiation_batch_id
    ) VALUES (
      $1, $2, $3,
      $4, $5, $6,
      $7, $8, $9, $10, $11,
      $12, $13,
      $14, $15, $16, $17, $18, $19,
      $20,
      $21, $22,
      $23, $24, $25,
      $26, $27, $28,
      $29, $30, $31, $32, $33,
      $34, $35, $36,
      $37,
      $38, $39,
      $40, $41,
      $42, $43,
      $44, $45,
      $46, $47,
      $48, $49,
      $50, $51,
      $52, $53, $54, $55,
      $56, $57, $58,
      $59, $60, $61, $62,
      $63, $64, $65
    )
    RETURNING id
  `;

  // Helper to extract column value (handles long column names with multiple potential formats)
  const get = (keys: string | string[]) => {
    if (typeof keys === 'string') keys = [keys];
    for (const key of keys) {
      if (row[key] !== undefined && row[key] !== null && row[key] !== '') {
        return row[key];
      }
    }
    return null;
  };

  const values = [
    sampleId, // $1
    datapointKey, // $2
    get(['Database assigned ID for any particular publication. \nDOI or keyword can  be used as search term.', 'publication_doi']), // $3
    get(['Lab name and/or Uni where analysis was conducted', 'laboratory']), // $4
    get(['ORCID ID of analyst', 'analyst_orcid']), // $5
    get(['Date-time of analysis', 'analysis_date']), // $6
    get(['Mineral analysed', 'mineral_type']) || 'apatite', // $7
    get(['Method used to count and characterise fission tracks', 'ft_method']), // $8
    get(['Software used to perform digital fission track analysis', 'ft_software']), // $9
    get(['The algorithm used to perform (semi-) automated FT counting', 'ft_algorithm']), // $10
    get(['Analytical method used to measure uranium concentrations for FT age determinations', 'u_determination_method']), // $11
    get(['Total number of single grains analysed', 'n_grains']), // $12
    get(['Total area of counting region', 'total_area_cm2']), // $13
    get(['Mean spontaneous track density', 'mean_rho_s']), // $14
    get(['Total number of spontaneous tracks', 'total_Ns']), // $15
    get(['Mean induced track density', 'mean_rho_i']), // $16
    get(['Total number of induced tracks', 'total_Ni']), // $17
    get(['Mean dosimeter track density', 'mean_rho_d']), // $18
    get(['Total number of dosimeter tracks', 'total_Nd']), // $19
    get(['Dosimeter glass used for analysis (only relevant for EDM and population fission track methods)', 'dosimeter']), // $20
    get(['Average U content of analysed grains', 'mean_U_ppm']), // $21
    get(['Standard deviation of average U content of analysed grains', 'sd_U_ppm']), // $22
    get(['Mean etch pit diameter parallel to crystallographic c-axis', 'mean_Dpar_um']), // $23
    get(['Standard error of etch pit diameter parallel to crystallographic c-axis', 'se_Dpar_um']), // $24
    get(['The total number of Dpar measurements for the entire sample', 'n_Dpar_measurements']), // $25
    get(['Mean etch pit diameter perpendicular to crystallographic c-axis', 'mean_Dper_um']), // $26
    get(['Standard error of etch pit diameter perpendicular to crystallographic c-axis', 'se_Dper_um']), // $27
    get(['The total number of Dper measurements for the entire sample', 'n_Dper_measurements']), // $28
    get(['Mean rmr0 of analysed grains, a parameter corresponding to annealing resistance of an apatite grain of certain composition (Carlson et al., 1999; Ketcham et al., 2007)', 'mean_rmr0']), // $29
    get(['Standard deviation of rmr0', 'sd_rmr0']), // $30
    get(['Mean fitted parameter corresponding to annealing resistance of an apatite grain of certain composition (Carlson et al., 1999; Ketcham et al., 2007)', 'mean_kappa']), // $31
    get(['Standard deviation of mean K parameter', 'sd_kappa']), // $32
    get(['The equation used to determine the rmr0 and κ parameters', 'rmr0_equation']), // $33
    get(['Chi-square test to statistically test the null-hypothesis that the analysed grains belong to one age population', 'chi_square']), // $34
    null, // P_chi2_pct - derived from chi_square // $35
    get(['Measure of dispersion of single grain ages, ranging from 0 to 1', 'dispersion_pct']), // $36
    get(['The equation used to determine FT age', 'age_equation']), // $37
    get(['Mean fission track age', 'mean_age_ma']), // $38
    get(['Mean fission track age uncertainty', 'mean_age_error_ma']), // $39
    get(['Fission track central age', 'central_age_ma']), // $40
    get(['Fission track central age unceratinty', 'central_age_error_ma']), // $41
    get(['Fission track pooled age', 'pooled_age_ma']), // $42
    get(['Fission track pooled age uncertainty', 'pooled_age_error_ma']), // $43
    get(['Fission track population age', 'population_age_ma']), // $44
    get(['Fission track population age uncertainty', 'population_age_error_ma']), // $45
    get(['Fission track age uncertainty type', 'age_error_type']), // $46
    get(['Brief comment on fission track age', 'age_comment']), // $47
    get(['Mean confined fission Track Length', 'mean_track_length_um']), // $48
    get(['Standard error of mean confined track length', 'se_mean_track_length_um']), // $49
    get(['Number of fission tracks measured', 'n_track_measurements']), // $50
    get(['Standard deviation of mean confined fission track length', 'sd_track_length_um']), // $51
    get(['Was the sample irradiated with 252Cf?', 'cf252_irradiation']), // $52
    get(['Etchant chemical composition', 'etchant_chemical']), // $53
    get(['Duration of etching', 'etch_duration_seconds']), // $54
    get(['Temperature minerals were etched at', 'etch_temperature_c']), // $55
    get(['Zeta for EDM or LA-ICP-MS zeta-calibrated fission track ages', 'zeta_yr_cm2']), // $56
    get(['Zeta uncertainty for EDM or LA-ICP-MS zeta-calibrated fission track ages', 'zeta_error_yr_cm2']), // $57
    get(['Zeta-calibration uncertainty type', 'zeta_error_type']), // $58
    get(['R is the etchable fission track range used for determination of FT age via absolute dating approach', 'R_um']), // $59
    get(['Total 238U decay constant used to determine FT age', 'lambda_D']), // $60
    get(['Fission decay constant used to determine FT age', 'lambda_f']), // $61
    get(['Detection efficiency factor', 'q_factor']), // $62
    get(['Name of irradiation reactor for EDM and population age determinations', 'irradiation_reactor']), // $63
    get(['Thermal neutron dose or neutron fluence (in units neutrson/cm-2) experienced during sample irradiation, this is the thermal neutron flux multiplied by a time component (Only required for calculating FT ages by Population Method)', 'thermal_neutron_dose']), // $64
    get(['Batch identification umber for the irradiation', 'irradiation_batch_id']) // $65
  ];

  const result = await client.query(sql, values);
  return result.rows[0].id;
}

async function insertFTCountData(client: PoolClient, datapointId: number, row: any): Promise<void> {
  // Map EarthBank FTCountData sheet to ft_count_data table
  const sql = `
    INSERT INTO ft_count_data (
      ft_datapoint_id, grain_id,
      counting_area_cm2,
      Ns, rho_s_cm2, Ni, rho_i_cm2,
      Dpar_um, Dpar_error_um, n_Dpar_measurements,
      Dper_um, Dper_error_um, n_Dper_measurements,
      Dpar_Dper_error_type, comments
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15
    )
  `;

  const get = (keys: string | string[]) => {
    if (typeof keys === 'string') keys = [keys];
    for (const key of keys) {
      if (row[key] !== undefined && row[key] !== null && row[key] !== '') {
        return row[key];
      }
    }
    return null;
  };

  const values = [
    datapointId,
    get(['Name or lab number of individual grain analysed', 'grain_id']),
    get(['Total area of counting region', 'counting_area_cm2']),
    get(['Number of spontaneous tracks', 'Ns']),
    get(['Spontaneous track density', 'rho_s_cm2']),
    get(['Number of induced tracks', 'Ni']),
    get(['Induced track density', 'rho_i_cm2']),
    get(['Modal etch pit diameter parallel to crystallographic c-axis', 'Dpar_um']),
    get(['Uncertainty of etch pit diameter parallel to crystallographic c-axis', 'Dpar_error_um']),
    get(['Number of Dpar measurements', 'n_Dpar_measurements']),
    get(['Modal etch pit diameter perpendicular to crystallographic c-axis', 'Dper_um']),
    get(['Uncertainty of etch pit diameter perpendicular to crystallographic c-axis', 'Dper_error_um']),
    get(['Number of Dper measurements', 'n_Dper_measurements']),
    get(['Dpar and Dper measurement uncertainty type', 'Dpar_Dper_error_type']),
    get(['Additional information about analysis or data upload', 'comments'])
  ];

  await client.query(sql, values);
}

// ============================================================================
// IMPORT ORCHESTRATION
// ============================================================================

async function importSamples(options: ImportOptions): Promise<ImportStats> {
  const stats: ImportStats = {
    samplesInserted: 0,
    datapointsInserted: 0,
    countDataInserted: 0,
    singleGrainAgesInserted: 0,
    trackLengthsInserted: 0,
    binnedLengthsInserted: 0,
    heGrainsInserted: 0,
    errors: []
  };

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Read Samples sheet
    const samples = await readExcelSheet(options.file, 'Samples');
    console.log(`Found ${samples.length} samples to import`);

    for (const row of samples) {
      try {
        // Skip header rows (if template includes example data)
        const sampleId = row['Sample Name'] || row['sample_id'];
        if (!sampleId || sampleId === 'String' || sampleId === 'Search Term') {
          continue;
        }

        await insertSample(client, row, options.datasetId || 1);
        stats.samplesInserted++;

        if (options.verbose) {
          console.log(`✓ Imported sample: ${sampleId}`);
        }
      } catch (error: any) {
        const errorMsg = `Error importing sample: ${error.message}`;
        stats.errors.push(errorMsg);
        console.error(`✗ ${errorMsg}`);
      }
    }

    if (options.dryRun) {
      await client.query('ROLLBACK');
      console.log('DRY RUN: Changes rolled back');
    } else {
      await client.query('COMMIT');
      console.log('Changes committed successfully');
    }

  } catch (error: any) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }

  return stats;
}

async function importFTData(options: ImportOptions): Promise<ImportStats> {
  const stats: ImportStats = {
    samplesInserted: 0,
    datapointsInserted: 0,
    countDataInserted: 0,
    singleGrainAgesInserted: 0,
    trackLengthsInserted: 0,
    binnedLengthsInserted: 0,
    heGrainsInserted: 0,
    errors: []
  };

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Read FT Datapoints sheet
    const datapoints = await readExcelSheet(options.file, 'FT Datapoints');
    console.log(`Found ${datapoints.length} FT datapoints to import`);

    // Map datapoint keys to database IDs
    const datapointKeyToId = new Map<string, number>();

    for (const row of datapoints) {
      try {
        const datapointKey = row['Is used to reference datapoints from other sheets. Must be unique. \nBest practice: use sample name if unique or row number (1, 2, 3, 4, ….)'];

        // Skip header/example rows
        if (!datapointKey || datapointKey === 'String') {
          continue;
        }

        const dpId = await insertFTDatapoint(client, row);
        datapointKeyToId.set(datapointKey, dpId);
        stats.datapointsInserted++;

        if (options.verbose) {
          console.log(`✓ Imported FT datapoint: ${datapointKey} (ID: ${dpId})`);
        }
      } catch (error: any) {
        const errorMsg = `Error importing FT datapoint: ${error.message}`;
        stats.errors.push(errorMsg);
        console.error(`✗ ${errorMsg}`);
      }
    }

    // Import linked FTCountData
    try {
      const countData = await readExcelSheet(options.file, 'FTCountData');
      console.log(`Found ${countData.length} count data rows to import`);

      for (const row of countData) {
        try {
          const datapointKey = row['References a datapoint. Must exists as \'Key\' in the \'Datapoints\' sheet.'];

          if (!datapointKey || datapointKey === 'String') {
            continue;
          }

          const dpId = datapointKeyToId.get(datapointKey);
          if (!dpId) {
            throw new Error(`Datapoint key "${datapointKey}" not found`);
          }

          await insertFTCountData(client, dpId, row);
          stats.countDataInserted++;

          if (options.verbose) {
            console.log(`✓ Imported count data for datapoint: ${datapointKey}`);
          }
        } catch (error: any) {
          const errorMsg = `Error importing count data: ${error.message}`;
          stats.errors.push(errorMsg);
          console.error(`✗ ${errorMsg}`);
        }
      }
    } catch (error: any) {
      console.log(`FTCountData sheet not found or empty: ${error.message}`);
    }

    if (options.dryRun) {
      await client.query('ROLLBACK');
      console.log('DRY RUN: Changes rolled back');
    } else {
      await client.query('COMMIT');
      console.log('Changes committed successfully');
    }

  } catch (error: any) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }

  return stats;
}

async function importHeData(options: ImportOptions): Promise<ImportStats> {
  const stats: ImportStats = {
    samplesInserted: 0,
    datapointsInserted: 0,
    countDataInserted: 0,
    singleGrainAgesInserted: 0,
    trackLengthsInserted: 0,
    binnedLengthsInserted: 0,
    heGrainsInserted: 0,
    errors: []
  };

  console.log('He datapoint import not yet implemented (Week 2 task)');
  return stats;
}

// ============================================================================
// CLI
// ============================================================================

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes('--help')) {
    console.log(`
EarthBank Template Import Pipeline

Usage:
  npx tsx scripts/db/import-earthbank-templates.ts --template <type> --file <path> [options]

Templates:
  --template samples     Import Sample.template.xlsx
  --template ft          Import FTDatapoint.template.xlsx
  --template he          Import HeDatapoint.template.xlsx

Options:
  --file <path>          Path to Excel template file (required)
  --dataset-id <id>      Dataset ID to assign samples to (default: 1)
  --dry-run              Test import without committing changes
  --verbose              Show detailed import progress

Examples:
  npx tsx scripts/db/import-earthbank-templates.ts --template samples --file ./data/samples.xlsx
  npx tsx scripts/db/import-earthbank-templates.ts --template ft --file ./data/ft_data.xlsx --dry-run
  npx tsx scripts/db/import-earthbank-templates.ts --template he --file ./data/he_data.xlsx --verbose
    `);
    process.exit(0);
  }

  const options: ImportOptions = {
    template: 'samples' as any,
    file: '',
    datasetId: 1,
    dryRun: false,
    verbose: false
  };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--template':
        options.template = args[++i] as any;
        break;
      case '--file':
        options.file = args[++i];
        break;
      case '--dataset-id':
        options.datasetId = parseInt(args[++i], 10);
        break;
      case '--dry-run':
        options.dryRun = true;
        break;
      case '--verbose':
        options.verbose = true;
        break;
    }
  }

  if (!options.file) {
    console.error('Error: --file is required');
    process.exit(1);
  }

  if (!['samples', 'ft', 'he'].includes(options.template)) {
    console.error('Error: --template must be samples, ft, or he');
    process.exit(1);
  }

  console.log('='.repeat(80));
  console.log('EarthBank Template Import');
  console.log('='.repeat(80));
  console.log(`Template: ${options.template}`);
  console.log(`File: ${options.file}`);
  console.log(`Dataset ID: ${options.datasetId}`);
  console.log(`Dry Run: ${options.dryRun}`);
  console.log('='.repeat(80));
  console.log();

  let stats: ImportStats;

  try {
    switch (options.template) {
      case 'samples':
        stats = await importSamples(options);
        break;
      case 'ft':
        stats = await importFTData(options);
        break;
      case 'he':
        stats = await importHeData(options);
        break;
      default:
        throw new Error(`Unknown template: ${options.template}`);
    }

    console.log();
    console.log('='.repeat(80));
    console.log('Import Summary');
    console.log('='.repeat(80));
    console.log(`Samples inserted: ${stats.samplesInserted}`);
    console.log(`Datapoints inserted: ${stats.datapointsInserted}`);
    console.log(`Count data rows inserted: ${stats.countDataInserted}`);
    console.log(`Single grain ages inserted: ${stats.singleGrainAgesInserted}`);
    console.log(`Track lengths inserted: ${stats.trackLengthsInserted}`);
    console.log(`Binned lengths inserted: ${stats.binnedLengthsInserted}`);
    console.log(`He grains inserted: ${stats.heGrainsInserted}`);
    console.log(`Errors: ${stats.errors.length}`);

    if (stats.errors.length > 0) {
      console.log('\nErrors encountered:');
      stats.errors.forEach(err => console.log(`  - ${err}`));
    }

    console.log('='.repeat(80));

    process.exit(stats.errors.length > 0 ? 1 : 0);

  } catch (error: any) {
    console.error('\n❌ Fatal error during import:');
    console.error(error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  main().catch(console.error);
}

export { importSamples, importFTData, importHeData };
