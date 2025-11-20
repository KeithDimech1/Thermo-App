const XLSX = require('xlsx');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const FAIR_PATH = '/Users/keithdimech/Pathway/Dev/Clair/Thermo-App/build-data/learning/thermo-papers/McMillan(2024)-4D-Fault-Evolution-Malawi-Rift/FAIR';

// Database connection
const pool = new Pool({
  connectionString: process.env.DIRECT_URL,
  ssl: { rejectUnauthorized: false }
});

async function inspectMappings() {
  console.log('='.repeat(80));
  console.log('COLUMN MAPPING INSPECTION: FAIR CSVs vs Database Schema');
  console.log('='.repeat(80));
  console.log();

  const tables = [
    { csv: 'earthbank_samples.csv', table: 'earthbank_samples' },
    { csv: 'earthbank_ftDatapoints.csv', table: 'earthbank_ftDatapoints' },
    { csv: 'earthbank_ftCountData.csv', table: 'earthbank_ftCountData' },
    { csv: 'earthbank_ftTrackLengthData.csv', table: 'earthbank_ftTrackLengthData' },
    { csv: 'earthbank_heDatapoints.csv', table: 'earthbank_heDatapoints' },
    { csv: 'earthbank_heWholeGrainData.csv', table: 'earthbank_heWholeGrainData' },
  ];

  for (const { csv, table } of tables) {
    console.log('-'.repeat(80));
    console.log(`TABLE: ${table}`);
    console.log('-'.repeat(80));

    // Read CSV columns
    const csvPath = path.join(FAIR_PATH, csv);
    const workbook = XLSX.readFile(csvPath);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(sheet);

    if (data.length === 0) {
      console.log(`⚠️  CSV is empty: ${csv}`);
      console.log();
      continue;
    }

    const csvColumns = Object.keys(data[0]).sort();

    // Get database columns
    const result = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = $1
      AND column_name NOT IN ('id', 'created_at', 'updated_at')
      ORDER BY column_name
    `, [table]);

    const dbColumns = result.rows.map(r => r.column_name).sort();
    const dbColumnDetails = result.rows.reduce((acc, row) => {
      acc[row.column_name] = {
        type: row.data_type,
        nullable: row.is_nullable === 'YES'
      };
      return acc;
    }, {});

    console.log(`CSV columns: ${csvColumns.length}`);
    console.log(`DB columns:  ${dbColumns.length} (excluding id, created_at, updated_at)`);
    console.log();

    // Find matches and mismatches
    const inBoth = csvColumns.filter(c => dbColumns.includes(c));
    const onlyInCSV = csvColumns.filter(c => !dbColumns.includes(c));
    const onlyInDB = dbColumns.filter(c => !csvColumns.includes(c));

    // Check for case-sensitivity issues
    const csvLower = csvColumns.map(c => c.toLowerCase());
    const dbLower = dbColumns.map(c => c.toLowerCase());
    const caseMismatches = [];
    csvColumns.forEach(csvCol => {
      const csvColLower = csvCol.toLowerCase();
      if (!dbColumns.includes(csvCol) && dbLower.includes(csvColLower)) {
        const dbMatch = dbColumns.find(dbCol => dbCol.toLowerCase() === csvColLower);
        caseMismatches.push({ csv: csvCol, db: dbMatch });
      }
    });

    if (inBoth.length === csvColumns.length && inBoth.length === dbColumns.length) {
      console.log(`✅ PERFECT MATCH: All ${inBoth.length} columns align`);
    } else {
      console.log(`⚠️  PARTIAL MATCH:`);
      console.log(`   - Matching: ${inBoth.length} columns`);
      console.log(`   - CSV only: ${onlyInCSV.length} columns`);
      console.log(`   - DB only:  ${onlyInDB.length} columns`);
    }
    console.log();

    if (caseMismatches.length > 0) {
      console.log(`❌ CASE SENSITIVITY ISSUES (${caseMismatches.length}):`);
      caseMismatches.forEach(({ csv, db }) => {
        console.log(`   CSV: "${csv}" → DB: "${db}"`);
      });
      console.log();
    }

    if (onlyInCSV.length > 0) {
      console.log(`📄 Columns ONLY in CSV (not in database):`);
      onlyInCSV.forEach(col => {
        console.log(`   - ${col}`);
      });
      console.log();
    }

    if (onlyInDB.length > 0) {
      console.log(`🗄️  Columns ONLY in database (missing from CSV):`);
      onlyInDB.slice(0, 10).forEach(col => {
        const details = dbColumnDetails[col];
        const nullableStr = details.nullable ? 'NULL allowed' : 'NOT NULL';
        console.log(`   - ${col} (${details.type}, ${nullableStr})`);
      });
      if (onlyInDB.length > 10) {
        console.log(`   ... and ${onlyInDB.length - 10} more`);
      }
      console.log();
    }

    // Sample data preview
    console.log(`📊 Sample data (first row):`);
    const sampleRow = data[0];
    Object.entries(sampleRow).slice(0, 5).forEach(([key, value]) => {
      console.log(`   ${key}: ${value}`);
    });
    if (Object.keys(sampleRow).length > 5) {
      console.log(`   ... and ${Object.keys(sampleRow).length - 5} more columns`);
    }
    console.log();
  }

  console.log('='.repeat(80));
  console.log('INSPECTION COMPLETE');
  console.log('='.repeat(80));

  await pool.end();
}

inspectMappings().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
