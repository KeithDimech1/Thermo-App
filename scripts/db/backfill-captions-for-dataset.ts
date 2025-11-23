/**
 * Backfill Image Captions for Dataset
 *
 * Updates the description field in data_files table with captions
 * extracted from image-metadata.json
 *
 * Usage:
 *   npx tsx scripts/db/backfill-captions-for-dataset.ts <dataset_id> <paper_directory>
 *
 * Example:
 *   npx tsx scripts/db/backfill-captions-for-dataset.ts 2 "build-data/learning/thermo-papers/Carraro(2025)-zircon-provenance"
 */

import * as fs from 'fs';
import * as path from 'path';
import { query } from '../../lib/db/connection';

interface ImageMetadata {
  figures_summary?: {
    [figureName: string]: {
      description: string;
      images: Array<{
        filename: string;
        page: number;
      }>;
    };
  };
  tables_summary?: {
    [tableName: string]: {
      description: string;
      images: Array<{
        filename: string;
        page: number;
      }>;
    };
  };
}

interface CaptionUpdate {
  filename: string;
  caption: string;
  type: 'figure' | 'table';
}

async function main() {
  const datasetId = process.argv[2];
  const paperDir = process.argv[3];

  if (!datasetId || !paperDir) {
    console.error('❌ Usage: npx tsx scripts/db/backfill-captions-for-dataset.ts <dataset_id> <paper_directory>');
    process.exit(1);
  }

  if (!fs.existsSync(paperDir)) {
    console.error(`❌ Paper directory not found: ${paperDir}`);
    process.exit(1);
  }

  const metadataPath = path.join(paperDir, 'images', 'image-metadata.json');
  if (!fs.existsSync(metadataPath)) {
    console.error(`❌ image-metadata.json not found at: ${metadataPath}`);
    process.exit(1);
  }

  console.log(`📝 Backfilling captions for dataset ${datasetId}...`);
  console.log(`📂 Reading from: ${metadataPath}`);
  console.log();

  // Load metadata
  const metadata: ImageMetadata = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'));
  const captionUpdates: CaptionUpdate[] = [];

  // Extract figure captions
  if (metadata.figures_summary) {
    for (const [figureName, figureData] of Object.entries(metadata.figures_summary)) {
      for (const image of figureData.images) {
        captionUpdates.push({
          filename: image.filename,
          caption: `${figureName}: ${figureData.description}`,
          type: 'figure'
        });
      }
    }
  }

  // Extract table captions
  if (metadata.tables_summary) {
    for (const [tableName, tableData] of Object.entries(metadata.tables_summary)) {
      for (const image of tableData.images) {
        captionUpdates.push({
          filename: image.filename,
          caption: `${tableName}: ${tableData.description}`,
          type: 'table'
        });
      }
    }
  }

  console.log(`✅ Found ${captionUpdates.length} captions to update`);
  console.log(`   - Figures: ${captionUpdates.filter(u => u.type === 'figure').length}`);
  console.log(`   - Tables: ${captionUpdates.filter(u => u.type === 'table').length}`);
  console.log();

  // Update database
  let updatedCount = 0;
  let notFoundCount = 0;

  for (const update of captionUpdates) {
    const result = await query(`
      UPDATE data_files
      SET description = $1, updated_at = NOW()
      WHERE dataset_id = $2
        AND file_name = $3
        AND file_type = 'image/png'
      RETURNING id
    `, [update.caption, datasetId, update.filename]);

    if (result.length > 0) {
      updatedCount++;
      console.log(`   ✅ Updated ${update.filename}`);
    } else {
      notFoundCount++;
      console.log(`   ⚠️  Not found in DB: ${update.filename}`);
    }
  }

  console.log();
  console.log('📊 Summary:');
  console.log(`   ✅ Updated: ${updatedCount}`);
  console.log(`   ⚠️  Not found: ${notFoundCount}`);
  console.log();
  console.log('✅ Caption backfill complete!');

  process.exit(0);
}

main().catch(error => {
  console.error('❌ Error:', error);
  process.exit(1);
});
