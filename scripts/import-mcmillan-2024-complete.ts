import { Pool } from 'pg';
import * as XLSX from 'xlsx';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const FAIR_PATH = '/Users/keithdimech/Pathway/Dev/Clair/Thermo-App/build-data/learning/thermo-papers/McMillan(2024)-4D-Fault-Evolution-Malawi-Rift/FAIR';

// Database connection (use DIRECT_URL for migrations/imports)
const pool = new Pool({
  connectionString: process.env.DIRECT_URL,
  ssl: { rejectUnauthorized: false }
});

interface CSVRow {
  [key: string]: any;
}

function readCSV(filename: string): CSVRow[] {
  const filePath = path.join(FAIR_PATH, filename);
  const workbook = XLSX.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  return XLSX.utils.sheet_to_json(worksheet);
}

async function importMcMillan2024() {
  console.log('='.repeat(80));
  console.log('MCMILLAN(2024) DATABASE IMPORT - COMPLETE DATASET');
  console.log('='.repeat(80));
  console.log();

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // ========================================================================
    // STEP 1: CREATE DATASET ENTRY
    // ========================================================================
    console.log('STEP 1: Creating dataset entry...');
    console.log('-'.repeat(80));

    // Check if dataset already exists
    const existingDataset = await client.query(`
      SELECT id FROM datasets WHERE dataset_name = $1
    `, ['McMillan(2024)-4D-Fault-Evolution-Malawi-Rift']);

    let datasetID;
    if (existingDataset.rows.length > 0) {
      datasetID = existingDataset.rows[0].id;
      console.log(`ℹ️  Dataset already exists: ID ${datasetID}`);
    } else {
      const datasetResult = await client.query(`
        INSERT INTO datasets (
          dataset_name,
          description,
          full_citation,
          publication_year,
          publication_journal,
          publication_volume_pages,
          doi,
          study_location,
          laboratory,
          mineral_analyzed,
          sample_count,
          age_range_min_ma,
          age_range_max_ma,
          supplementary_files_url
        )
        VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14
        )
        RETURNING id
      `, [
      'McMillan(2024)-4D-Fault-Evolution-Malawi-Rift',
      '4D fault evolution revealed by footwall exhumation modelling: A natural experiment in the Malawi rift',
      'McMillan, M., Boone, S.C., Chindandali, P., Kohn, B., Gleadow, A. (2024). 4D fault evolution revealed by footwall exhumation modelling: A natural experiment in the Malawi rift. Journal of Structural Geology 187, 105196.',
      2024,
      'Journal of Structural Geology',
      '187, 105196',
      'https://doi.org/10.1016/j.jsg.2024.105196',
      'Usisya fault system, Central Basin, Lake Malawi, Malawi (East African Rift System)',
      'Melbourne Thermochronology',
      'apatite',
      34,
      18.9,
      324.8,
      'https://doi.org/10.58024/AGUM6A344358'
    ]);

      datasetID = datasetResult.rows[0].id;
      console.log(`✅ Dataset created: ID ${datasetID}`);
    }
    console.log();

    // ========================================================================
    // STEP 2: IMPORT SAMPLES
    // ========================================================================
    console.log('STEP 2: Importing samples...');
    console.log('-'.repeat(80));

    const samples = readCSV('earthbank_samples.csv');
    console.log(`Read ${samples.length} samples from CSV`);

    let samplesImported = 0;
    for (const sample of samples) {
      await client.query(`
        INSERT INTO earthbank_samples (
          "sampleID", "IGSN", latitude, longitude, "elevationM",
          "geodeticDatum", "verticalDatum", mineral, "mineralType",
          lithology, "sampleKind", "datasetID", "locationDescription"
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        ON CONFLICT ("sampleID") DO UPDATE
        SET
          "IGSN" = EXCLUDED."IGSN",
          latitude = EXCLUDED.latitude,
          longitude = EXCLUDED.longitude,
          "elevationM" = EXCLUDED."elevationM"
      `, [
        sample.sampleID,
        sample.IGSN,
        sample.latitude,
        sample.longitude,
        sample.elevationM,
        sample.geodeticDatum || 'WGS84',
        sample.verticalDatum || 'mean sea level',
        sample.mineral,
        sample.mineralType,
        sample.lithology,
        sample.sampleKind,
        String(datasetID),
        sample.locationDescription || null
      ]);
      samplesImported++;
    }

    console.log(`✅ Imported ${samplesImported} samples`);
    console.log();

    // ========================================================================
    // STEP 3: IMPORT FT DATAPOINTS
    // ========================================================================
    console.log('STEP 3: Importing FT datapoints...');
    console.log('-'.repeat(80));

    const ftDatapoints = readCSV('earthbank_ftDatapoints.csv');
    console.log(`Read ${ftDatapoints.length} FT datapoints from CSV`);

    // Filter out reference materials (no sampleID)
    const ftDatapointsFiltered = ftDatapoints.filter(dp => dp.sampleID && dp.sampleID.trim() !== '');
    console.log(`Filtered to ${ftDatapointsFiltered.length} sample datapoints (excluded ${ftDatapoints.length - ftDatapointsFiltered.length} standards)`);

    let ftDatapointsImported = 0;
    for (const dp of ftDatapointsFiltered) {
      await client.query(`
        INSERT INTO "earthbank_ftDatapoints" (
          "datapointName", "sampleID", laboratory, analyst, "ftMethod",
          "mineralType", "nGrains", "totalNs", "rhoS",
          "centralAgeMa", "centralAgeUncertainty",
          dispersion, "pChi2", mtl, "mtlUncertainty", "stdDevMu",
          "nTracks", "dPar", "dParUncertainty",
          "uPpm", "uPpmStdDev", zeta
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22)
        ON CONFLICT ("datapointName") DO UPDATE
        SET
          "centralAgeMa" = EXCLUDED."centralAgeMa",
          "centralAgeUncertainty" = EXCLUDED."centralAgeUncertainty"
      `, [
        dp.datapointName,
        dp.sampleID,
        dp.laboratory,
        dp.analyst,
        dp.ftMethod,
        dp.mineralType,
        dp.nGrains,
        dp.totalNs,
        dp.rhoS,
        dp.centralAgeMa,
        dp.centralAgeUncertainty,
        dp.dispersion,
        dp.pChi2,
        dp.mtl,
        dp.mtlUncertainty,
        dp.stdDevMu,
        dp.nTracks,
        dp.dPar,
        dp.dParUncertainty,
        dp.uPpm,
        dp.uPpmStdDev,
        dp.zeta
      ]);
      ftDatapointsImported++;
    }

    console.log(`✅ Imported ${ftDatapointsImported} FT datapoints`);
    console.log();

    // ========================================================================
    // STEP 4: IMPORT FT TRACK LENGTH DATA
    // ========================================================================
    console.log('STEP 4: Importing FT track length data...');
    console.log('-'.repeat(80));

    const ftTrackLengths = readCSV('earthbank_ftTrackLengthData.csv');
    console.log(`Read ${ftTrackLengths.length} track length measurements from CSV`);

    let ftTracksImported = 0;
    for (const track of ftTrackLengths) {
      await client.query(`
        INSERT INTO "earthbank_ftTrackLengthData" (
          "datapointName", "trackType", "lengthUm", "cAxisAngleDeg", "dPar"
        )
        VALUES ($1, $2, $3, $4, $5)
      `, [
        track.datapointName,
        track.trackType,
        track.lengthUm,
        track.cAxisAngleDeg,
        track.dPar
      ]);
      ftTracksImported++;
    }

    console.log(`✅ Imported ${ftTracksImported} track length measurements`);
    console.log();

    // ========================================================================
    // STEP 5: IMPORT HE DATAPOINTS
    // ========================================================================
    console.log('STEP 5: Importing He datapoints...');
    console.log('-'.repeat(80));

    const heDatapoints = readCSV('earthbank_heDatapoints.csv');
    console.log(`Read ${heDatapoints.length} He datapoints from CSV`);

    let heDatapointsImported = 0;
    for (const dp of heDatapoints) {
      await client.query(`
        INSERT INTO "earthbank_heDatapoints" (
          "datapointName", "sampleID", laboratory, analyst,
          "nGrains", "meanCorrectedAgeMa", "meanCorrectedAgeUncertainty",
          "meanUncorrectedAgeMa"
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT ("datapointName") DO UPDATE
        SET
          "meanCorrectedAgeMa" = EXCLUDED."meanCorrectedAgeMa",
          "meanCorrectedAgeUncertainty" = EXCLUDED."meanCorrectedAgeUncertainty"
      `, [
        dp.datapointName,
        dp.sampleID,
        dp.laboratory,
        dp.analyst,
        dp.nGrains,
        dp.meanCorrectedAgeMa,
        dp.meanCorrectedAgeUncertainty,
        dp.meanUncorrectedAgeMa
      ]);
      heDatapointsImported++;
    }

    console.log(`✅ Imported ${heDatapointsImported} He datapoints`);
    console.log();

    // ========================================================================
    // STEP 6: IMPORT HE WHOLE GRAIN DATA
    // ========================================================================
    console.log('STEP 6: Importing He whole grain data...');
    console.log('-'.repeat(80));

    const heWholeGrain = readCSV('earthbank_heWholeGrainData.csv');
    console.log(`Read ${heWholeGrain.length} He grains from CSV`);

    let heGrainsImported = 0;
    for (const grain of heWholeGrain) {
      await client.query(`
        INSERT INTO "earthbank_heWholeGrainData" (
          "datapointName", "grainName",
          "correctedHeAge", "correctedHeAgeUncertainty",
          "uncorrectedHeAge", "uncorrectedHeAgeUncertainty",
          ft, "rsUm", "massMg", "heNmolG",
          "uConcentration", "uConcentrationUncertainty",
          "thConcentration", "thConcentrationUncertainty",
          "smConcentration", "smConcentrationUncertainty",
          "eU", "lengthUm", "widthUm", geometry
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
      `, [
        grain.datapointName,
        grain.grainName,
        grain.correctedHeAge,
        grain.correctedHeAgeUncertainty,
        grain.uncorrectedHeAge,
        grain.uncorrectedHeAgeUncertainty,
        grain.ft,
        grain.rsUm,
        grain.massMg,
        grain.heNmolG,
        grain.uConcentration,
        grain.uConcentrationUncertainty,
        grain.thConcentration,
        grain.thConcentrationUncertainty,
        grain.smConcentration,
        grain.smConcentrationUncertainty,
        grain.eU,
        grain.lengthUm,
        grain.widthUm,
        grain.geometry
      ]);
      heGrainsImported++;
    }

    console.log(`✅ Imported ${heGrainsImported} He grains`);
    console.log();

    // ========================================================================
    // COMMIT TRANSACTION
    // ========================================================================
    await client.query('COMMIT');

    console.log('='.repeat(80));
    console.log('IMPORT COMPLETE');
    console.log('='.repeat(80));
    console.log();
    console.log('Summary:');
    console.log(`  - Dataset:           ${datasetID}`);
    console.log(`  - Samples:           ${samplesImported}`);
    console.log(`  - FT datapoints:     ${ftDatapointsImported}`);
    console.log(`  - FT track lengths:  ${ftTracksImported}`);
    console.log(`  - He datapoints:     ${heDatapointsImported}`);
    console.log(`  - He grains:         ${heGrainsImported}`);
    console.log();
    console.log(`  Total records:       ${samplesImported + ftDatapointsImported + ftTracksImported + heDatapointsImported + heGrainsImported}`);
    console.log();

    // ========================================================================
    // VALIDATION QUERIES
    // ========================================================================
    console.log('Running validation queries...');
    console.log('-'.repeat(80));

    // Check sample count
    const sampleCheck = await client.query(`
      SELECT COUNT(*) as count
      FROM earthbank_samples
      WHERE "datasetID" = $1
    `, [String(datasetID)]);
    console.log(`✅ Samples in DB: ${sampleCheck.rows[0].count}`);

    // Check FT datapoint count
    const ftCheck = await client.query(`
      SELECT COUNT(*) as count
      FROM "earthbank_ftDatapoints"
      WHERE "sampleID" IN (
        SELECT "sampleID" FROM earthbank_samples WHERE "datasetID" = $1
      )
    `, [String(datasetID)]);
    console.log(`✅ FT datapoints in DB: ${ftCheck.rows[0].count}`);

    // Check age range
    const ageCheck = await client.query(`
      SELECT
        MIN("centralAgeMa") as min_age,
        MAX("centralAgeMa") as max_age,
        AVG("centralAgeMa") as avg_age
      FROM "earthbank_ftDatapoints"
      WHERE "sampleID" IN (
        SELECT "sampleID" FROM earthbank_samples WHERE "datasetID" = $1
      )
    `, [String(datasetID)]);
    console.log(`✅ Age range: ${ageCheck.rows[0].min_age} - ${ageCheck.rows[0].max_age} Ma (avg: ${Math.round(ageCheck.rows[0].avg_age)} Ma)`);

    console.log();
    console.log('='.repeat(80));

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Import failed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run import
importMcMillan2024().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
