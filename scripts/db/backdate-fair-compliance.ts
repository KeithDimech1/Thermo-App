#!/usr/bin/env npx tsx
/**
 * Backdate FAIR Compliance JSON for Existing Papers
 *
 * This script generates fair-compliance.json files for papers that were analyzed
 * before the FAIR compliance JSON system was implemented.
 *
 * It reads:
 * - paper-index.md (for metadata)
 * - extraction-report.md (for FAIR scores, if exists)
 * - paper-analysis.md (for additional context)
 *
 * Usage:
 *   npx tsx scripts/db/backdate-fair-compliance.ts
 *   npx tsx scripts/db/backdate-fair-compliance.ts --paper "Dusel-Bacon(2015)..."
 */

import fs from 'fs';
import path from 'path';

const PAPERS_DIR = '/Users/keithdimech/Pathway/Dev/Clair/Thermo-App/build-data/learning/thermo-papers';

interface FairCompliance {
  paper: {
    citation: string;
    doi: string | null;
    year: number | null;
    authors: string[];
    journal: string | null;
    title: string | null;
    folder_name: string;
  };
  analysis_date: string;
  kohn_2024_compliance: Record<string, any>;
  summary: {
    total_score: number;
    total_possible: number;
    percentage: number;
    grade: string;
    method: string;
    mineral: string;
    sample_count: number;
    data_availability: string;
  };
  strengths: string[];
  gaps: string[];
  notes: string;
}

/**
 * Extract metadata from paper-index.md
 */
function parsePaperIndex(indexPath: string): Partial<FairCompliance['paper']> {
  const content = fs.readFileSync(indexPath, 'utf-8');

  const metadata: Partial<FairCompliance['paper']> = {
    authors: [],
  };

  // Extract DOI
  const doiMatch = content.match(/DOI[:\s]+(10\.\d{4,}\/[\S]+)/i);
  if (doiMatch) metadata.doi = doiMatch[1];

  // Extract year
  const yearMatch = content.match(/\*\*Year:\*\*\s+(\d{4})/);
  if (yearMatch) metadata.year = parseInt(yearMatch[1]);

  // Extract journal
  const journalMatch = content.match(/\*\*Journal:\*\*\s+([^\n]+)/);
  if (journalMatch) metadata.journal = journalMatch[1].trim();

  // Extract title (from citation or heading)
  const citationMatch = content.match(/\*\*Full Citation:\*\*\s*\n>\s*([^\n]+)/);
  if (citationMatch) {
    metadata.citation = citationMatch[1].trim();
    // Try to extract title from citation
    const titleMatch = citationMatch[1].match(/,\s*\d{4},\s*([^:]+):/);
    if (titleMatch) metadata.title = titleMatch[1].trim();
  }

  // Extract authors (from authors list)
  const authorsSection = content.match(/\*\*Authors:\*\*\s*([\s\S]*?)(?=\n\n|\*\*[A-Z])/);
  if (authorsSection) {
    const authorLines = authorsSection[1].match(/^-\s*([^\n(]+)/gm);
    if (authorLines) {
      metadata.authors = authorLines.map(line =>
        line.replace(/^-\s*/, '').trim()
      );
    }
  }

  return metadata;
}

/**
 * Extract FAIR scores from extraction-report.md
 */
function parseExtractionReport(reportPath: string): Partial<FairCompliance['summary']> & { strengths?: string[], gaps?: string[] } {
  const content = fs.readFileSync(reportPath, 'utf-8');

  const summary: any = {};

  // Extract overall score
  const overallMatch = content.match(/\*\*OVERALL\*\*\s*\|\s*\*\*([0-9.]+)\/([0-9.]+)\*\*\s*\|\s*\*\*([0-9.]+)%\*\*/);
  if (overallMatch) {
    summary.total_score = parseFloat(overallMatch[1]);
    summary.total_possible = parseFloat(overallMatch[2]);
    summary.percentage = parseFloat(overallMatch[3]);
  }

  // Extract grade
  const gradeMatch = content.match(/\*\*FAIR Grade:\*\*\s+([A-F][+-]?)/);
  if (gradeMatch) summary.grade = gradeMatch[1];

  // Extract method
  const methodMatch = content.match(/\*\*Method:\*\*\s+([^\n]+)/);
  if (methodMatch) summary.method = methodMatch[1].trim();

  // Extract mineral
  const mineralMatch = content.match(/\*\*Mineral:\*\*\s+([^\n]+)/);
  if (mineralMatch) summary.mineral = mineralMatch[1].trim().toLowerCase();

  // Extract sample count
  const sampleMatch = content.match(/\*\*Total Samples:\*\*\s+(\d+)/);
  if (sampleMatch) summary.sample_count = parseInt(sampleMatch[1]);

  // Extract strengths
  const strengthsSection = content.match(/### Strengths\s*([\s\S]*?)(?=###|$)/);
  if (strengthsSection) {
    const strengthLines = strengthsSection[1].match(/^-\s*✅\s*([^\n]+)/gm);
    if (strengthLines) {
      summary.strengths = strengthLines.map(line =>
        line.replace(/^-\s*✅\s*/, '').trim()
      );
    }
  }

  // Extract gaps
  const gapsSection = content.match(/### Key Gaps\s*([\s\S]*?)(?=###|$)/);
  if (gapsSection) {
    const gapLines = gapsSection[1].match(/^-\s*❌\s*([^\n]+)/gm);
    if (gapLines) {
      summary.gaps = gapLines.map(line =>
        line.replace(/^-\s*❌\s*/, '').trim()
      );
    }
  }

  return summary;
}

/**
 * Calculate FAIR grade from percentage
 */
function calculateGrade(percentage: number): string {
  if (percentage >= 95) return 'A+';
  if (percentage >= 90) return 'A';
  if (percentage >= 80) return 'B';
  if (percentage >= 70) return 'C';
  if (percentage >= 60) return 'D';
  return 'F';
}

/**
 * Generate FAIR compliance JSON for a paper
 */
function generateFairCompliance(paperDir: string): FairCompliance | null {
  const folderName = path.basename(paperDir);

  console.log(`\n📄 Processing: ${folderName}`);

  // Check if fair-compliance.json already exists
  const jsonPath = path.join(paperDir, 'fair-compliance.json');
  if (fs.existsSync(jsonPath)) {
    console.log(`   ⏭️  Skipping (fair-compliance.json already exists)`);
    return null;
  }

  // Read paper-index.md
  const indexPath = path.join(paperDir, 'paper-index.md');
  if (!fs.existsSync(indexPath)) {
    console.log(`   ⚠️  Skipping (no paper-index.md found)`);
    return null;
  }

  const paperMetadata = parsePaperIndex(indexPath);

  // Read extraction-report.md (if exists)
  const reportPath = path.join(paperDir, 'extraction-report.md');
  let reportData: any = {};
  if (fs.existsSync(reportPath)) {
    console.log(`   ✅ Found extraction-report.md`);
    reportData = parseExtractionReport(reportPath);
  } else {
    console.log(`   ⚠️  No extraction-report.md (will use defaults)`);
  }

  // Build FAIR compliance object
  const fairCompliance: FairCompliance = {
    paper: {
      citation: paperMetadata.citation || `${folderName} (citation not found)`,
      doi: paperMetadata.doi || null,
      year: paperMetadata.year || null,
      authors: paperMetadata.authors || [],
      journal: paperMetadata.journal || null,
      title: paperMetadata.title || null,
      folder_name: folderName,
    },
    analysis_date: new Date().toISOString(),
    kohn_2024_compliance: {
      table_4_samples: { applicable: true, score: 0, max_score: 15, percentage: 0, required_fields: {}, recommended_fields: {} },
      table_5_ft_counts: { applicable: true, score: 0, max_score: 15, percentage: 0, required_fields: {}, recommended_fields: {} },
      table_6_track_lengths: { applicable: true, score: 0, max_score: 10, percentage: 0, required_fields: {}, recommended_fields: {} },
      table_7_la_icp_ms: { applicable: false, score: 0, max_score: 0, percentage: null, required_fields: {}, recommended_fields: {} },
      table_8_epma: { applicable: false, score: 0, max_score: 0, percentage: null, required_fields: {}, recommended_fields: {} },
      table_9_kinetic_params: { applicable: true, score: 0, max_score: 5, percentage: 0, required_fields: {}, recommended_fields: {} },
      table_10_ft_ages: { applicable: true, score: 0, max_score: 10, percentage: 0, required_fields: {}, recommended_fields: {} },
      table_11_thermal_models: { applicable: false, score: 0, max_score: 0, percentage: null, required_fields: {}, recommended_fields: {} },
    },
    summary: {
      total_score: reportData.total_score || 0,
      total_possible: reportData.total_possible || 50,
      percentage: reportData.percentage || 0,
      grade: reportData.grade || calculateGrade(reportData.percentage || 0),
      method: reportData.method || 'Unknown',
      mineral: reportData.mineral || 'unknown',
      sample_count: reportData.sample_count || 0,
      data_availability: fs.existsSync(path.join(paperDir, 'FAIR')) ? 'In-paper tables' : 'Unknown',
    },
    strengths: reportData.strengths || [
      'Paper has been analyzed but detailed field mapping not yet completed',
    ],
    gaps: reportData.gaps || [
      'Detailed field-level analysis pending',
    ],
    notes: `Backfilled from existing analysis on ${new Date().toISOString().split('T')[0]}. This JSON was auto-generated from paper-index.md and extraction-report.md (if available). For complete field-level mappings, re-run /thermoanalysis or manually update this file.`,
  };

  return fairCompliance;
}

/**
 * Main execution
 */
async function main() {
  const args = process.argv.slice(2);
  const specificPaper = args.find(arg => arg.startsWith('--paper='))?.split('=')[1];

  console.log('━'.repeat(60));
  console.log('FAIR COMPLIANCE JSON BACKFILL');
  console.log('━'.repeat(60));
  console.log();

  // Get all paper directories
  const paperDirs = fs.readdirSync(PAPERS_DIR)
    .map(name => path.join(PAPERS_DIR, name))
    .filter(dir => {
      if (!fs.statSync(dir).isDirectory()) return false;
      if (specificPaper && !dir.includes(specificPaper)) return false;
      return true;
    });

  console.log(`Found ${paperDirs.length} paper directories to process\n`);

  let created = 0;
  let skipped = 0;

  for (const paperDir of paperDirs) {
    const fairCompliance = generateFairCompliance(paperDir);

    if (fairCompliance) {
      const outputPath = path.join(paperDir, 'fair-compliance.json');
      fs.writeFileSync(outputPath, JSON.stringify(fairCompliance, null, 2));
      console.log(`   💾 Created: fair-compliance.json`);
      created++;
    } else {
      skipped++;
    }
  }

  console.log();
  console.log('━'.repeat(60));
  console.log('SUMMARY');
  console.log('━'.repeat(60));
  console.log(`✅ Created: ${created} files`);
  console.log(`⏭️  Skipped: ${skipped} files`);
  console.log();
  console.log('Next steps:');
  console.log('1. Review generated fair-compliance.json files');
  console.log('2. For detailed field mappings, re-run /thermoanalysis on specific papers');
  console.log('3. Manually update any missing metadata');
  console.log();
}

main().catch(console.error);
