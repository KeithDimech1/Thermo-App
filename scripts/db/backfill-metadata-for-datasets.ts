/**
 * Backfill metadata files for datasets 13, 15, 16
 *
 * Copies extraction metadata files that were previously not saved:
 * - paper-index.md - Quick reference guide
 * - tables.md - Visual table reference
 * - table-index.json - Structured table metadata
 * - text/plain-text.txt - Extracted PDF text
 */

import { query } from '@/lib/db/connection';
import { downloadFile, uploadFile } from '@/lib/storage/supabase';

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

interface MetadataFile {
  source: string;
  name: string;
  type: string;
  description: string;
}

async function backfillMetadataForDataset(dataset: DatasetSession): Promise<number> {
  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`📄 Dataset ${dataset.datasetId}: ${dataset.datasetName}`);
  console.log(`   Session: ${dataset.sessionId}`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

  const metadataFiles: MetadataFile[] = [
    {
      source: `${dataset.sessionId}/paper-index.md`,
      name: 'paper-index.md',
      type: 'text/markdown',
      description: 'Quick reference guide with paper metadata and table list'
    },
    {
      source: `${dataset.sessionId}/tables.md`,
      name: 'tables.md',
      type: 'text/markdown',
      description: 'Visual table reference with metadata'
    },
    {
      source: `${dataset.sessionId}/table-index.json`,
      name: 'table-index.json',
      type: 'application/json',
      description: 'Structured table metadata (JSON)'
    },
    {
      source: `${dataset.sessionId}/text/plain-text.txt`,
      name: 'plain-text.txt',
      type: 'text/plain',
      description: 'Extracted PDF text content'
    }
  ];

  // Check if metadata files already exist in data_files table
  console.log(`\n[Step 1] Checking for existing metadata files...`);

  const existingMetadata = await query<{ file_name: string }>(
    `SELECT file_name FROM data_files
     WHERE dataset_id = $1 AND file_name IN ($2, $3, $4, $5)`,
    [dataset.datasetId, 'paper-index.md', 'tables.md', 'table-index.json', 'plain-text.txt']
  );

  console.log(`   Found ${existingMetadata.length} existing metadata files`);

  const existingNames = new Set(existingMetadata.map(r => r.file_name));
  const newMetadataFiles = metadataFiles.filter(f => !existingNames.has(f.name));

  if (newMetadataFiles.length === 0) {
    console.log(`   ✓ All metadata files already tracked - nothing to do`);
    return 0;
  }

  console.log(`   ➜ ${newMetadataFiles.length} new metadata files to add`);

  // Copy metadata files and add to data_files table
  console.log(`\n[Step 2] Copying metadata files and updating database...`);

  let addedCount = 0;

  for (const metaFile of newMetadataFiles) {
    try {
      console.log(`\n   Processing: ${metaFile.name}`);

      // Download from extractions bucket
      console.log(`     → Downloading from extractions/${metaFile.source}`);
      const metaBuffer = await downloadFile('extractions', metaFile.source);
      console.log(`     ✓ Downloaded ${(metaBuffer.length / 1024).toFixed(1)} KB`);

      // Upload to datasets bucket
      const metaUrl = await uploadFile(
        'datasets',
        `${dataset.datasetId}/metadata/${metaFile.name}`,
        metaBuffer,
        metaFile.type
      );
      console.log(`     ✓ Uploaded to datasets/${dataset.datasetId}/metadata/${metaFile.name}`);

      // Insert into data_files table
      await query(
        `INSERT INTO data_files (
          dataset_id,
          file_name,
          file_path,
          file_type,
          file_size_bytes,
          mime_type,
          display_name,
          description,
          created_at,
          updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())`,
        [
          dataset.datasetId,
          metaFile.name,
          metaUrl,
          metaFile.type,
          metaBuffer.length,
          metaFile.type,
          metaFile.name.replace(/\.(md|json|txt)$/i, ''),
          metaFile.description
        ]
      );
      console.log(`     ✓ Added to data_files table`);

      addedCount++;

    } catch (error) {
      console.error(`     ❌ Error processing ${metaFile.name}:`, error instanceof Error ? error.message : error);
      console.log(`     ⚠️  Skipping this file (may not exist in extractions bucket)`);
    }
  }

  console.log(`\n   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`   ✅ Added ${addedCount} metadata files for dataset ${dataset.datasetId}`);
  console.log(`   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

  return addedCount;
}

async function main() {
  console.log(`
╔══════════════════════════════════════════════════════════════╗
║  METADATA BACKFILL SCRIPT                                    ║
║  Backfill extraction metadata for datasets 13, 15, 16       ║
╚══════════════════════════════════════════════════════════════╝
  `);

  let totalAdded = 0;

  for (const dataset of DATASETS_TO_BACKFILL) {
    const added = await backfillMetadataForDataset(dataset);
    totalAdded += added;
  }

  console.log(`
╔══════════════════════════════════════════════════════════════╗
║  BACKFILL COMPLETE                                           ║
║  Total metadata files added: ${totalAdded.toString().padStart(2)}                              ║
╚══════════════════════════════════════════════════════════════╝
  `);

  process.exit(0);
}

main().catch(error => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});
