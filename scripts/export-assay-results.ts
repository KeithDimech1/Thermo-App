/**
 * Export Assay Results by Pathogen/Serology/Marker
 *
 * Extracts all assay results from the database organized by:
 * - Pathogen name (e.g., CMV, HIV, HCV)
 * - Test type (serology, nat, both)
 * - Marker name (e.g., CMV IgG, HIV-1/2 Ab)
 * - Individual assay results with CV performance data
 *
 * Output: CSV files organized by pathogen/test_type/marker
 *
 * Usage: npx tsx scripts/export-assay-results.ts
 */

// Load environment variables from .env.local
import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(process.cwd(), '.env.local') });

import { query } from '../lib/db/connection.js';
import * as fs from 'fs';
import * as path from 'path';

interface AssayResult {
  pathogen_name: string;
  pathogen_abbreviation: string;
  test_type: string;
  marker_name: string;
  marker_type: string;
  antibody_type: string | null;
  manufacturer_name: string;
  assay_name: string;
  platform: string | null;
  methodology: string | null;
  qc_sample_name: string;
  cv_lt_10_percentage: number | null;
  cv_10_15_percentage: number | null;
  cv_15_20_percentage: number | null;
  cv_gt_20_percentage: number | null;
  mean_cv: number | null;
  quality_rating: string;
  events_examined: number | null;
  config_id: number;
}

async function exportAssayResults() {
  console.log('🔍 Fetching assay results from database...\n');

  // Query to get all assay results organized by pathogen/test_type/marker
  const sql = `
    SELECT
      p.name as pathogen_name,
      p.abbreviation as pathogen_abbreviation,
      tc.test_type,
      m.name as marker_name,
      m.marker_type,
      m.antibody_type,
      mfr.name as manufacturer_name,
      a.name as assay_name,
      a.platform,
      a.methodology,
      qc.name as qc_sample_name,
      cv.cv_lt_10_percentage,
      cv.cv_10_15_percentage,
      cv.cv_15_20_percentage,
      cv.cv_gt_20_percentage,
      cv.mean_cv,
      tc.quality_rating,
      tc.events_examined,
      tc.id as config_id
    FROM test_configurations tc
    JOIN markers m ON tc.marker_id = m.id
    JOIN pathogens p ON m.pathogen_id = p.id
    JOIN assays a ON tc.assay_id = a.id
    JOIN manufacturers mfr ON a.manufacturer_id = mfr.id
    JOIN qc_samples qc ON tc.qc_sample_id = qc.id
    LEFT JOIN cv_measurements cv ON tc.id = cv.test_config_id
    ORDER BY
      p.name,
      tc.test_type,
      m.name,
      mfr.name,
      a.name
  `;

  const results = await query<AssayResult>(sql);

  console.log(`✅ Found ${results.length} assay configurations\n`);

  // Group results by pathogen -> test_type -> marker
  const grouped = new Map<string, Map<string, Map<string, AssayResult[]>>>();

  for (const result of results) {
    if (!grouped.has(result.pathogen_name)) {
      grouped.set(result.pathogen_name, new Map());
    }
    const pathogenGroup = grouped.get(result.pathogen_name)!;

    if (!pathogenGroup.has(result.test_type)) {
      pathogenGroup.set(result.test_type, new Map());
    }
    const testTypeGroup = pathogenGroup.get(result.test_type)!;

    if (!testTypeGroup.has(result.marker_name)) {
      testTypeGroup.set(result.marker_name, []);
    }
    testTypeGroup.get(result.marker_name)!.push(result);
  }

  // Create output directory
  const outputDir = path.join(process.cwd(), 'output', 'assay-results');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  console.log(`📁 Creating CSV files in: ${outputDir}\n`);

  // CSV header
  const csvHeader = [
    'Pathogen',
    'Pathogen Abbreviation',
    'Test Type',
    'Marker Name',
    'Marker Type',
    'Antibody Type',
    'Manufacturer',
    'Assay Name',
    'Platform',
    'Methodology',
    'QC Sample',
    'CV <10% (%)',
    'CV 10-15% (%)',
    'CV 15-20% (%)',
    'CV >20% (%)',
    'Mean CV (%)',
    'Quality Rating',
    'Events Examined',
    'Config ID'
  ].join(',');

  // Option 1: Single CSV file with all results
  const allResultsFile = path.join(outputDir, 'all-assay-results.csv');
  const allResultsLines = [csvHeader];

  for (const result of results) {
    const line = [
      escapeCsv(result.pathogen_name),
      escapeCsv(result.pathogen_abbreviation || ''),
      escapeCsv(result.test_type),
      escapeCsv(result.marker_name),
      escapeCsv(result.marker_type || ''),
      escapeCsv(result.antibody_type || ''),
      escapeCsv(result.manufacturer_name),
      escapeCsv(result.assay_name),
      escapeCsv(result.platform || ''),
      escapeCsv(result.methodology || ''),
      escapeCsv(result.qc_sample_name || ''),
      result.cv_lt_10_percentage?.toFixed(1) || '',
      result.cv_10_15_percentage?.toFixed(1) || '',
      result.cv_15_20_percentage?.toFixed(1) || '',
      result.cv_gt_20_percentage?.toFixed(1) || '',
      result.mean_cv?.toFixed(2) || '',
      escapeCsv(result.quality_rating),
      result.events_examined?.toString() || '',
      result.config_id.toString()
    ].join(',');

    allResultsLines.push(line);
  }

  fs.writeFileSync(allResultsFile, allResultsLines.join('\n'));
  console.log(`✅ Created: all-assay-results.csv (${results.length} rows)`);

  // Option 2: Separate CSV files by pathogen
  let fileCount = 0;
  for (const [pathogen, testTypeMap] of grouped) {
    const pathogenDir = path.join(outputDir, sanitizeFilename(pathogen));
    if (!fs.existsSync(pathogenDir)) {
      fs.mkdirSync(pathogenDir, { recursive: true });
    }

    for (const [testType, markerMap] of testTypeMap) {
      for (const [marker, assays] of markerMap) {
        const filename = `${sanitizeFilename(pathogen)}_${testType}_${sanitizeFilename(marker)}.csv`;
        const filepath = path.join(pathogenDir, filename);

        const lines = [csvHeader];
        for (const result of assays) {
          const line = [
            escapeCsv(result.pathogen_name),
            escapeCsv(result.pathogen_abbreviation || ''),
            escapeCsv(result.test_type),
            escapeCsv(result.marker_name),
            escapeCsv(result.marker_type || ''),
            escapeCsv(result.antibody_type || ''),
            escapeCsv(result.manufacturer_name),
            escapeCsv(result.assay_name),
            escapeCsv(result.platform || ''),
            escapeCsv(result.methodology || ''),
            escapeCsv(result.qc_sample_name || ''),
            result.cv_lt_10_percentage?.toFixed(1) || '',
            result.cv_10_15_percentage?.toFixed(1) || '',
            result.cv_15_20_percentage?.toFixed(1) || '',
            result.cv_gt_20_percentage?.toFixed(1) || '',
            result.mean_cv?.toFixed(2) || '',
            escapeCsv(result.quality_rating),
            result.events_examined?.toString() || '',
            result.config_id.toString()
          ].join(',');

          lines.push(line);
        }

        fs.writeFileSync(filepath, lines.join('\n'));
        fileCount++;
        console.log(`  ✅ ${pathogen}/${filename} (${assays.length} assays)`);
      }
    }
  }

  console.log(`\n📊 Summary:`);
  console.log(`  - Total assay configurations: ${results.length}`);
  console.log(`  - Pathogens: ${grouped.size}`);
  console.log(`  - Individual CSV files created: ${fileCount}`);
  console.log(`  - All results file: all-assay-results.csv`);
  console.log(`\n✅ Export complete! Files saved to: ${outputDir}`);

  // Create a summary file
  const summaryFile = path.join(outputDir, 'README.md');
  const summaryLines = [
    '# Assay Results Export',
    '',
    `**Generated:** ${new Date().toISOString()}`,
    `**Total Configurations:** ${results.length}`,
    '',
    '## Structure',
    '',
    'Results are organized by:',
    '1. **Pathogen** (e.g., CMV, HIV, HCV)',
    '2. **Test Type** (serology, nat, both)',
    '3. **Marker** (e.g., CMV IgG, HIV-1/2 Ab)',
    '',
    '## Files',
    '',
    '### All Results',
    '- `all-assay-results.csv` - Complete dataset in one file',
    '',
    '### By Pathogen',
    ''
  ];

  for (const [pathogen, testTypeMap] of grouped) {
    summaryLines.push(`#### ${pathogen}/`);
    for (const [testType, markerMap] of testTypeMap) {
      for (const [marker, assays] of markerMap) {
        summaryLines.push(`- ${testType}/${marker} (${assays.length} assays)`);
      }
    }
    summaryLines.push('');
  }

  summaryLines.push('## CSV Columns');
  summaryLines.push('');
  summaryLines.push('1. **Pathogen** - Disease/organism name');
  summaryLines.push('2. **Pathogen Abbreviation** - Short code (e.g., CMV, HIV)');
  summaryLines.push('3. **Test Type** - serology, nat, or both');
  summaryLines.push('4. **Marker Name** - Specific marker being tested');
  summaryLines.push('5. **Marker Type** - Antibody, Antigen, or Nucleic Acid');
  summaryLines.push('6. **Antibody Type** - IgG, IgM, Total, etc.');
  summaryLines.push('7. **Manufacturer** - Test kit manufacturer');
  summaryLines.push('8. **Assay Name** - Specific assay/platform');
  summaryLines.push('9. **Platform** - Instrument platform');
  summaryLines.push('10. **Methodology** - CLIA, ELISA, PCR, etc.');
  summaryLines.push('11. **QC Sample** - Quality control material used');
  summaryLines.push('12. **CV <10% (%)** - Percentage of results with CV below 10%');
  summaryLines.push('13. **CV 10-15% (%)** - Percentage with CV 10-15%');
  summaryLines.push('14. **CV 15-20% (%)** - Percentage with CV 15-20%');
  summaryLines.push('15. **CV >20% (%)** - Percentage with CV above 20%');
  summaryLines.push('16. **Mean CV (%)** - Average coefficient of variation');
  summaryLines.push('17. **Quality Rating** - excellent, good, acceptable, poor');
  summaryLines.push('18. **Events Examined** - Number of test events analyzed');
  summaryLines.push('19. **Config ID** - Database configuration ID');

  fs.writeFileSync(summaryFile, summaryLines.join('\n'));
  console.log(`📄 Created summary: README.md\n`);

  process.exit(0);
}

/**
 * Escape CSV field (handle commas, quotes, newlines)
 */
function escapeCsv(value: string | null | undefined): string {
  if (!value) return '';

  const stringValue = String(value);

  // If contains comma, quote, or newline, wrap in quotes and escape quotes
  if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }

  return stringValue;
}

/**
 * Sanitize filename (remove invalid characters)
 */
function sanitizeFilename(name: string): string {
  return name
    .replace(/[\/\\:*?"<>|]/g, '_')  // Replace invalid chars
    .replace(/\s+/g, '_')             // Replace spaces
    .replace(/_+/g, '_')              // Remove duplicate underscores
    .toLowerCase();
}

// Run export
exportAssayResults().catch(error => {
  console.error('❌ Error exporting assay results:', error);
  process.exit(1);
});
