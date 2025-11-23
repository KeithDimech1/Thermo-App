/**
 * Update all datasets with correct metadata from paper-index.md files
 *
 * This finds the corresponding paper-index.md for each dataset and updates
 * the database with complete publication metadata.
 */

import * as fs from 'fs';
import * as path from 'path';
import { query } from '../../lib/db/connection';
import { extractPaperTitle } from '../../lib/utils/extract-paper-title';

// Mapping of dataset IDs to paper directories
const datasetPaperMapping: Record<number, string> = {
  9: 'build-data/learning/thermo-papers/Wells(2012)-Geodynamics-of-synconvergent-extension-and-Tectonics',
  10: 'build-data/learning/thermo-papers/Kirby(2002)-Late-Cenozoic-Tibetan-Plateau-Tectonics',
};

interface ParsedMetadata {
  fullCitation: string | null;
  authors: string[];
  journal: string | null;
  year: number | null;
  volumePages: string | null;
  doi: string | null;
  pdfFilename: string | null;
  pdfUrl: string | null;
  suppUrl: string | null;
  paperTitle: string | null;
}

function parseMetadata(indexContent: string): ParsedMetadata {
  // Extract full citation (between **Citation:** and next ** marker)
  const citationMatch = indexContent.match(/\*\*Citation:\*\*\s*(.+?)(?=\n\n|\n\*\*)/s);
  const fullCitation = citationMatch ? citationMatch[1].trim() : null;

  // Extract paper title from citation
  const paperTitle = extractPaperTitle(fullCitation);

  // Extract authors (lines starting with - after **Authors:**)
  const authorsMatch = indexContent.match(/\*\*Authors:\*\*\s*(.+?)(?=\n\n|\n\*\*)/s);
  let authors: string[] = [];
  if (authorsMatch) {
    const authorsText = authorsMatch[1];
    const lines = authorsText.split('\n').filter(line => line.trim().startsWith('-'));
    authors = lines.map(line => {
      // Extract name before parentheses
      const nameMatch = line.match(/-\s*([^(]+)/);
      return nameMatch ? nameMatch[1].trim() : '';
    }).filter(name => name);
  }

  // Extract journal
  const journalMatch = indexContent.match(/\*\*Journal:\*\*\s*([^,\n]+)/);
  const journal = journalMatch ? journalMatch[1].trim() : null;

  // Extract volume/pages
  const volumeMatch = indexContent.match(/\*\*Journal:\*\*[^,\n]+,\s*(?:Vol\.\s*)?([^,\n]+)/);
  const volumePages = volumeMatch ? volumeMatch[1].trim() : null;

  // Extract year
  const yearMatch = indexContent.match(/\*\*Year:\*\*\s*(\d{4})/);
  const year = yearMatch ? parseInt(yearMatch[1]) : null;

  // Extract DOI
  const doiMatch = indexContent.match(/\*\*DOI:\*\*\s*(?:https?:\/\/doi\.org\/)?([^\s\n]+)/);
  const doi = doiMatch ? doiMatch[1].trim() : null;

  // Extract PDF filename
  const pdfFilenameMatch = indexContent.match(/\*\*PDF Filename:\*\*\s*-?\s*([^\n]+)/);
  const pdfFilename = pdfFilenameMatch ? pdfFilenameMatch[1].trim() : null;

  // Extract PDF URL
  const pdfUrlMatch = indexContent.match(/\*\*PDF URL:\*\*\s*(https?:\/\/[^\s\n]+)/);
  const pdfUrl = pdfUrlMatch ? pdfUrlMatch[1].trim() : null;

  // Extract supplementary files URL
  const suppMatch = indexContent.match(/\*\*Supplementary Files URL:\*\*\s*([^\n]+)/);
  let suppUrl = suppMatch ? suppMatch[1].replace(/^-\s*/, '').trim() : null;
  if (suppUrl && (suppUrl.includes('None') || suppUrl.toLowerCase().includes('none'))) {
    suppUrl = null;
  }

  return {
    fullCitation,
    authors,
    journal,
    year,
    volumePages,
    doi,
    pdfFilename,
    pdfUrl,
    suppUrl,
    paperTitle
  };
}

async function updateDataset(datasetId: number, paperDir: string): Promise<void> {
  const paperIndexPath = path.join(paperDir, 'paper-index.md');

  if (!fs.existsSync(paperIndexPath)) {
    console.log(`⚠️  Dataset ${datasetId}: paper-index.md not found at ${paperDir}`);
    return;
  }

  console.log(`\n📄 Dataset ${datasetId}: Reading ${paperDir}...`);
  const indexContent = fs.readFileSync(paperIndexPath, 'utf-8');
  const metadata = parseMetadata(indexContent);

  console.log(`  Title: ${metadata.paperTitle || 'Not extracted'}`);
  console.log(`  Authors: ${metadata.authors.length} found`);
  console.log(`  Journal: ${metadata.journal} (${metadata.year})`);
  console.log(`  DOI: ${metadata.doi}`);

  // Use paper title as dataset_name, fallback to existing name
  const datasetName = metadata.paperTitle || `Dataset ${datasetId}`;

  await query(`
    UPDATE datasets
    SET
      dataset_name = $1,
      full_citation = $2,
      authors = $3,
      publication_journal = $4,
      publication_year = $5,
      publication_volume_pages = $6,
      doi = $7,
      pdf_filename = $8,
      pdf_url = $9,
      supplementary_files_url = $10,
      last_modified_date = CURRENT_DATE
    WHERE id = $11
  `, [
    datasetName,
    metadata.fullCitation,
    metadata.authors,
    metadata.journal,
    metadata.year,
    metadata.volumePages,
    metadata.doi,
    metadata.pdfFilename,
    metadata.pdfUrl,
    metadata.suppUrl,
    datasetId
  ]);

  console.log(`✅ Dataset ${datasetId} updated successfully`);
}

async function main() {
  console.log('━'.repeat(80));
  console.log('UPDATE ALL DATASETS WITH COMPLETE METADATA');
  console.log('━'.repeat(80));

  for (const [datasetId, paperDir] of Object.entries(datasetPaperMapping)) {
    await updateDataset(parseInt(datasetId), paperDir);
  }

  console.log('\n━'.repeat(80));
  console.log('✅ ALL DATASETS UPDATED');
  console.log('━'.repeat(80));
  console.log('\n🌐 View datasets at: http://localhost:3000/datasets');
  console.log('');
}

main().catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});
