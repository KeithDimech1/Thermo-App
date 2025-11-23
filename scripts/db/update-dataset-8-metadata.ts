/**
 * Update Dataset 8 (Ault 2019) with correct metadata from paper-index.md
 */

import * as fs from 'fs';
import * as path from 'path';
import { query } from '../../lib/db/connection';
import { extractPaperTitle } from '../../lib/utils/extract-paper-title';

const paperIndexPath = path.join(
  __dirname,
  '../../build-data/learning/thermo-papers/Ault(2019)-Innovations-Thermochronometry-Tectonics/paper-index.md'
);

async function main() {
  console.log('📄 Reading paper-index.md...');
  const indexContent = fs.readFileSync(paperIndexPath, 'utf-8');

  // Extract full citation
  const citationMatch = indexContent.match(/\*\*Full Citation:\*\*\s*(.+?)(?=\n\*\*Authors)/s);
  const fullCitation = citationMatch ? citationMatch[1].trim() : null;

  console.log('Full Citation:', fullCitation);

  // Extract paper title from citation
  const paperTitle = extractPaperTitle(fullCitation);
  console.log('Extracted Title:', paperTitle);

  // Extract authors (text between **Authors:** and **Journal:**)
  const authorsMatch = indexContent.match(/\*\*Authors:\*\*\s*(.+?)(?=\n\*\*Journal)/s);
  let authors: string[] = [];
  if (authorsMatch) {
    const authorsText = authorsMatch[1];
    // Split by newlines and extract names
    const lines = authorsText.split('\n').filter(line => line.trim().startsWith('-'));
    authors = lines.map(line => {
      // Extract name before parentheses
      const nameMatch = line.match(/-\s*([^(]+)/);
      return nameMatch ? nameMatch[1].trim() : '';
    }).filter(name => name);
  }

  console.log('Authors:', authors);

  // Extract journal
  const journalMatch = indexContent.match(/\*\*Journal:\*\*\s*([^\n]+)/);
  const journal = journalMatch ? journalMatch[1].trim() : null;

  // Extract volume/pages
  const volumeMatch = indexContent.match(/\*\*Volume\/Pages:\*\*\s*([^\n]+)/);
  const volumePages = volumeMatch ? volumeMatch[1].trim() : null;

  // Extract year
  const yearMatch = indexContent.match(/\*\*Year:\*\*\s*(\d{4})/);
  const year = yearMatch ? parseInt(yearMatch[1]) : null;

  // Extract DOI
  const doiMatch = indexContent.match(/\*\*DOI:\*\*\s*([^\n]+)/);
  const doi = doiMatch ? doiMatch[1].trim() : null;

  // Extract PDF filename
  const pdfFilenameMatch = indexContent.match(/\*\*PDF Filename:\*\*\s*([^\n]+)/);
  const pdfFilename = pdfFilenameMatch ? pdfFilenameMatch[1].replace(/^-\s*/, '').trim() : null;

  // Extract supplementary files URL
  const suppMatch = indexContent.match(/\*\*Supplementary Files URL:\*\*\s*([^\n]+)/);
  let suppUrl = suppMatch ? suppMatch[1].replace(/^-\s*/, '').trim() : null;
  if (suppUrl && (suppUrl.includes('None') || suppUrl.includes('review paper'))) {
    suppUrl = null;
  }

  console.log('');
  console.log('📊 Metadata to update:');
  console.log('  Dataset Name:', paperTitle || 'Ault 2019');
  console.log('  Full Citation:', fullCitation?.substring(0, 100) + '...');
  console.log('  Authors:', authors);
  console.log('  Journal:', journal);
  console.log('  Year:', year);
  console.log('  Volume/Pages:', volumePages);
  console.log('  DOI:', doi);
  console.log('  PDF Filename:', pdfFilename);
  console.log('  Supplementary URL:', suppUrl);
  console.log('');

  // Update database
  console.log('💾 Updating dataset 8...');

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
      supplementary_files_url = $9,
      last_modified_date = CURRENT_DATE
    WHERE id = 8
  `, [
    paperTitle || 'Innovations in (U–Th)/He, Fission Track, and Trapped Charge Thermochronometry',
    fullCitation,
    authors,
    journal,
    year,
    volumePages,
    doi,
    pdfFilename,
    suppUrl
  ]);

  console.log('✅ Dataset 8 updated successfully!');
  console.log('');
  console.log('🌐 View at: http://localhost:3000/datasets/8');
}

main().catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});
