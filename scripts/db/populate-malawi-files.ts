/**
 * Populate data_files table for Malawi dataset
 *
 * This script scans the Malawi paper directory and adds file references
 * to the data_files table, organized by type (RAW, FAIR/EarthBank, PDF, Images)
 */

import { query } from '../../lib/db/connection';
import * as fs from 'fs';
import * as path from 'path';

const MALAWI_DIR = '/Users/keithdimech/Pathway/Dev/Clair/Thermo-App/build-data/learning/thermo-papers/Malawi-Rift-Footwall-Exhumation';
const DATASET_ID = 4; // Malawi dataset ID

interface FileInfo {
  file_name: string;
  file_path: string;
  file_type: string;
  display_name: string;
  description: string | null;
  file_size_bytes: number | null;
}

function getFileSize(filePath: string): number | null {
  try {
    const stats = fs.statSync(filePath);
    return stats.size;
  } catch (error) {
    console.error(`Error getting file size for ${filePath}:`, error);
    return null;
  }
}

function getFilesFromDirectory(dirPath: string, fileType: string): FileInfo[] {
  const files: FileInfo[] = [];

  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.isFile()) {
        const fullPath = path.join(dirPath, entry.name);
        const relativePath = fullPath.replace('/Users/keithdimech/Pathway/Dev/Clair/Thermo-App/', '');

        files.push({
          file_name: entry.name,
          file_path: `/${relativePath}`,
          file_type: fileType,
          display_name: entry.name.replace(/\.[^/.]+$/, ''), // Remove extension
          description: null,
          file_size_bytes: getFileSize(fullPath)
        });
      }
    }
  } catch (error) {
    console.error(`Error reading directory ${dirPath}:`, error);
  }

  return files;
}

async function populateDataFiles() {
  console.log('🗂️  Populating data_files for Malawi dataset...\n');

  // 1. Clear existing files for this dataset
  console.log('Clearing existing files...');
  await query('DELETE FROM data_files WHERE dataset_id = $1', [DATASET_ID]);

  const filesToInsert: FileInfo[] = [];

  // 2. Add RAW data files
  console.log('📊 Adding RAW data files...');
  const rawFiles = getFilesFromDirectory(path.join(MALAWI_DIR, 'RAW'), 'RAW');
  rawFiles.forEach(f => {
    if (f.file_name.endsWith('.csv')) {
      f.description = 'Raw data extracted from paper tables';
    } else if (f.file_name.endsWith('.pdf')) {
      f.description = 'Original table from paper PDF';
    }
  });
  filesToInsert.push(...rawFiles);
  console.log(`  ✓ Found ${rawFiles.length} RAW files`);

  // 3. Add EarthBank/FAIR data files
  console.log('🌍 Adding EarthBank/FAIR data files...');
  const fairFiles = getFilesFromDirectory(path.join(MALAWI_DIR, 'FAIR'), 'EarthBank');
  fairFiles.forEach(f => {
    f.description = 'EarthBank-formatted data (FAIR compliant)';
  });
  filesToInsert.push(...fairFiles);
  console.log(`  ✓ Found ${fairFiles.length} EarthBank files`);

  // 4. Add main PDF
  console.log('📄 Adding main paper PDF...');
  const pdfPath = path.join(MALAWI_DIR, '4D fault evolution revealed by footwall exhumation modelling_ A natural experiment in the Malawi rift.pdf');
  if (fs.existsSync(pdfPath)) {
    filesToInsert.push({
      file_name: '4D fault evolution revealed by footwall exhumation modelling_ A natural experiment in the Malawi rift.pdf',
      file_path: '/build-data/learning/thermo-papers/Malawi-Rift-Footwall-Exhumation/4D fault evolution revealed by footwall exhumation modelling_ A natural experiment in the Malawi rift.pdf',
      file_type: 'PDF',
      display_name: 'McMillan et al. (2024) - Full Paper',
      description: 'Complete research article',
      file_size_bytes: getFileSize(pdfPath)
    });
    console.log('  ✓ Found main PDF');
  }

  // 5. Add supplementary PDFs
  const suppPdfPath = path.join(MALAWI_DIR, 'RAW');
  const suppPdfs = fs.readdirSync(suppPdfPath)
    .filter(f => f.endsWith('.pdf') && f.startsWith('table'));

  for (const pdf of suppPdfs) {
    const fullPath = path.join(suppPdfPath, pdf);
    filesToInsert.push({
      file_name: pdf,
      file_path: `/build-data/learning/thermo-papers/Malawi-Rift-Footwall-Exhumation/RAW/${pdf}`,
      file_type: 'PDF',
      display_name: pdf.replace('.pdf', ''),
      description: 'Supplementary table from paper',
      file_size_bytes: getFileSize(fullPath)
    });
  }
  console.log(`  ✓ Found ${suppPdfs.length} supplementary PDFs`);

  // 6. Add image metadata file
  console.log('🖼️  Adding image archive reference...');
  const imagesPath = path.join(MALAWI_DIR, 'images');
  if (fs.existsSync(imagesPath)) {
    const imageFiles = fs.readdirSync(imagesPath).filter(f =>
      f.endsWith('.png') || f.endsWith('.jpg') || f.endsWith('.jpeg')
    );

    filesToInsert.push({
      file_name: 'images-archive',
      file_path: '/build-data/learning/thermo-papers/Malawi-Rift-Footwall-Exhumation/images',
      file_type: 'Images',
      display_name: 'Figure Images Archive',
      description: `${imageFiles.length} extracted figures and diagrams from the paper`,
      file_size_bytes: null
    });
    console.log(`  ✓ Found ${imageFiles.length} images`);
  }

  // 7. Insert all files
  console.log(`\n💾 Inserting ${filesToInsert.length} files into database...`);

  for (const file of filesToInsert) {
    const sql = `
      INSERT INTO data_files (
        dataset_id, file_name, file_path, file_type,
        display_name, file_size_bytes, description
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
    `;

    await query(sql, [
      DATASET_ID,
      file.file_name,
      file.file_path,
      file.file_type,
      file.display_name,
      file.file_size_bytes,
      file.description
    ]);
  }

  console.log('✅ Done!\n');

  // 8. Summary
  const summary = await query<{ file_type: string; count: string }>(
    'SELECT file_type, COUNT(*) as count FROM data_files WHERE dataset_id = $1 GROUP BY file_type ORDER BY file_type',
    [DATASET_ID]
  );

  console.log('📊 Summary:');
  for (const row of summary) {
    console.log(`  ${row.file_type}: ${row.count} files`);
  }
}

// Run the script
populateDataFiles()
  .then(() => {
    console.log('\n✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });
