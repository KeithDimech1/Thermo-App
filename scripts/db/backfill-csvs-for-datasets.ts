/**
 * Backfill CSV files for datasets 13, 15, 16
 *
 * Problem: These datasets went through extraction but the load phase
 * looked for CSVs in the wrong folder (extracted/ instead of tables/).
 *
 * This script:
 * 1. Downloads CSVs from extractions/{sessionId}/tables/
 * 2. Uploads to datasets/{datasetId}/csv/
 * 3. Inserts records into data_files table
 */

import { query } from '@/lib/db/connection';
import { downloadFile, uploadFile, listFiles } from '@/lib/storage/supabase';
import { FILE_TYPES } from '@/lib/constants/file-types';

interface DatasetSession {
  datasetId: number;
  sessionId: string;
  datasetName: string;
}

const DATASETS_TO_BACKFILL: DatasetSession[] = [
  {
    datasetId: 13,
    sessionId: 'extract-w7si5YXyU2',
    datasetName: 'Dickinson 2013 - Colton Formation provenance'
  },
  {
    datasetId: 15,
    sessionId: 'extract-Fn8KByGcAL',
    datasetName: 'Wells 2012 - Sevier-Laramide orogen'
  },
  {
    datasetId: 16,
    sessionId: 'extract-a4G5W73Y44',
    datasetName: 'Carraro 2024 - Zircon provenance fidelity'
  }
];

async function backfillCSVsForDataset(dataset: DatasetSession): Promise<number> {
  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`📊 Dataset ${dataset.datasetId}: ${dataset.datasetName}`);
  console.log(`   Session: ${dataset.sessionId}`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

  // Step 1: List CSV files in extractions bucket
  console.log(`\n[Step 1] Listing CSV files from extractions/${dataset.sessionId}/tables/...`);

  let csvFiles;
  try {
    const allFiles = await listFiles('extractions', `${dataset.sessionId}/tables`);
    csvFiles = allFiles.filter(f => f.name.endsWith('.csv'));
    console.log(`   ✓ Found ${csvFiles.length} CSV files`);

    if (csvFiles.length === 0) {
      console.log(`   ⚠️  No CSV files found - skipping dataset`);
      return 0;
    }

    csvFiles.forEach(f => console.log(`     - ${f.name}`));
  } catch (error) {
    console.error(`   ❌ Error listing files:`, error);
    console.log(`   ⚠️  Skipping dataset`);
    return 0;
  }

  // Step 2: Check if CSVs already exist in data_files table
  console.log(`\n[Step 2] Checking for existing CSV records in data_files...`);

  const existingCsvs = await query<{ file_name: string }>(
    `SELECT file_name FROM data_files
     WHERE dataset_id = $1 AND file_type = $2`,
    [dataset.datasetId, FILE_TYPES.CSV]
  );

  console.log(`   Found ${existingCsvs.length} existing CSV records`);

  const existingCsvNames = new Set(existingCsvs.map(r => r.file_name));
  const newCsvFiles = csvFiles.filter(f => !existingCsvNames.has(f.name));

  if (newCsvFiles.length === 0) {
    console.log(`   ✓ All CSV files already tracked - nothing to do`);
    return 0;
  }

  console.log(`   ➜ ${newCsvFiles.length} new CSV files to add:`);
  newCsvFiles.forEach(f => console.log(`     - ${f.name}`));

  // Step 3: Copy CSVs and add to data_files table
  console.log(`\n[Step 3] Copying CSV files and updating database...`);

  let addedCount = 0;

  for (const csvFile of newCsvFiles) {
    try {
      console.log(`\n   Processing: ${csvFile.name}`);

      // Download from extractions bucket
      console.log(`     → Downloading from extractions/${dataset.sessionId}/tables/${csvFile.name}`);
      const csvBuffer = await downloadFile('extractions', `${dataset.sessionId}/tables/${csvFile.name}`);
      console.log(`     ✓ Downloaded ${(csvBuffer.length / 1024).toFixed(1)} KB`);

      // Count rows (excluding header)
      const csvContent = csvBuffer.toString('utf-8');
      const rowCount = csvContent.split('\n').filter(line => line.trim()).length - 1;
      console.log(`     ✓ Counted ${rowCount} data rows`);

      // Upload to datasets bucket
      const csvUrl = await uploadFile(
        'datasets',
        `${dataset.datasetId}/csv/${csvFile.name}`,
        csvBuffer,
        'text/csv'
      );
      console.log(`     ✓ Uploaded to datasets/${dataset.datasetId}/csv/${csvFile.name}`);

      // Insert into data_files table
      await query(
        `INSERT INTO data_files (
          dataset_id,
          file_name,
          file_path,
          file_type,
          file_size_bytes,
          mime_type,
          row_count,
          display_name,
          description,
          created_at,
          updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())`,
        [
          dataset.datasetId,
          csvFile.name,
          csvUrl,
          FILE_TYPES.CSV,
          csvBuffer.length,
          'text/csv',
          rowCount,
          csvFile.name.replace('.csv', '').replace(/_/g, ' '),
          `Extracted data table (${rowCount} rows)`
        ]
      );
      console.log(`     ✓ Added to data_files table`);

      addedCount++;

    } catch (error) {
      console.error(`     ❌ Error processing ${csvFile.name}:`, error);
    }
  }

  console.log(`\n   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`   ✅ Added ${addedCount} CSV files for dataset ${dataset.datasetId}`);
  console.log(`   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

  return addedCount;
}

async function main() {
  console.log(`
╔══════════════════════════════════════════════════════════════╗
║  CSV BACKFILL SCRIPT                                         ║
║  Backfill CSV files for datasets 13, 15, 16                 ║
╚══════════════════════════════════════════════════════════════╝
  `);

  let totalAdded = 0;

  for (const dataset of DATASETS_TO_BACKFILL) {
    const added = await backfillCSVsForDataset(dataset);
    totalAdded += added;
  }

  console.log(`
╔══════════════════════════════════════════════════════════════╗
║  BACKFILL COMPLETE                                           ║
║  Total CSV files added: ${totalAdded.toString().padStart(2)}                                    ║
╚══════════════════════════════════════════════════════════════╝
  `);

  process.exit(0);
}

main().catch(error => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});
