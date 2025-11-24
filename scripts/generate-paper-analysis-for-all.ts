/**
 * Generate paper-analysis.md for all existing datasets
 *
 * This script:
 * 1. Gets all datasets that need paper_analysis_sections
 * 2. Downloads the PDF from extractions bucket
 * 3. Extracts PDF text
 * 4. Calls Claude API to generate paper-analysis.md
 * 5. Parses sections and updates database
 * 6. Uploads paper-analysis.md to datasets bucket
 */

import { query, queryOne } from '@/lib/db/connection';
import { downloadFile, uploadFile } from '@/lib/storage/supabase';
import { extractPDFText } from '@/lib/utils/pdf-utils';
import { createMessage, extractTokenUsage, formatCost } from '@/lib/anthropic/client';
import { PAPER_ANALYSIS_SYSTEM_PROMPT, createPaperAnalysisUserMessage } from '@/lib/anthropic/prompts';
import { updateExtractionTokens } from '@/lib/db/extraction-queries';
import os from 'os';
import path from 'path';
import fs from 'fs/promises';

interface Dataset {
  id: number;
  dataset_name: string;
  session_id: string;
}

/**
 * Parse paper-analysis.md markdown into structured sections
 */
function parsePaperAnalysisSections(markdown: string): {
  executive_summary?: string;
  problem_addressed?: string;
  methods?: string;
  results?: string;
} | null {
  try {
    const sections: Record<string, string> = {};

    // Split by markdown headings
    const parts = markdown.split(/##\s+\d+\.\s+/);

    // Remove the first part (before any heading)
    parts.shift();

    for (const part of parts) {
      const lines = part.trim().split('\n');
      if (lines.length === 0) continue;

      const heading = lines[0]?.toLowerCase() || '';
      const content = lines.slice(1).join('\n').trim();

      if (heading.includes('executive summary')) {
        sections.executive_summary = content;
      } else if (heading.includes('problem')) {
        sections.problem_addressed = content;
      } else if (heading.includes('method')) {
        sections.methods = content;
      } else if (heading.includes('result')) {
        sections.results = content;
      }
    }

    // Return null if no sections were parsed
    if (Object.keys(sections).length === 0) {
      return null;
    }

    return sections;
  } catch (error) {
    console.error('[Parse] Error parsing markdown:', error);
    return null;
  }
}

async function generatePaperAnalysisForDataset(dataset: Dataset): Promise<void> {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`Dataset ${dataset.id}: ${dataset.dataset_name}`);
  console.log(`Session: ${dataset.session_id}`);
  console.log('='.repeat(80));

  try {
    // Step 1: Download PDF from extractions bucket
    console.log('[1/6] Downloading PDF from extractions bucket...');
    const pdfBuffer = await downloadFile('extractions', `${dataset.session_id}/original.pdf`);
    console.log(`      ✓ Downloaded ${(pdfBuffer.length / 1024 / 1024).toFixed(2)} MB`);

    // Step 2: Extract text from PDF
    console.log('[2/6] Extracting text from PDF...');
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'paper-analysis-'));
    const tempPdfPath = path.join(tempDir, 'temp.pdf');
    await fs.writeFile(tempPdfPath, pdfBuffer);

    const pdfText = await extractPDFText(tempPdfPath);
    await fs.rm(tempDir, { recursive: true, force: true });
    console.log(`      ✓ Extracted ${pdfText.length} characters`);

    // Step 3: Generate paper analysis via Claude API
    console.log('[3/6] Generating paper analysis via Claude API...');
    const userMessage = createPaperAnalysisUserMessage(pdfText, dataset.dataset_name);
    const response = await createMessage(
      PAPER_ANALYSIS_SYSTEM_PROMPT,
      userMessage,
      {
        maxTokens: 4000,
        temperature: 0.3,
      }
    );

    // Track token usage
    const tokens = extractTokenUsage(response);
    await updateExtractionTokens(
      dataset.session_id,
      'paper_analysis',
      tokens.input_tokens,
      tokens.output_tokens
    );
    console.log(`      ✓ Generated (Input: ${tokens.input_tokens}, Output: ${tokens.output_tokens}, Cost: ${formatCost(tokens.cost_usd)})`);

    // Extract text content
    const contentBlock = response.content.find(block => block.type === 'text');
    if (!contentBlock || contentBlock.type !== 'text') {
      throw new Error('No text content in Claude response');
    }

    const paperAnalysisMd = contentBlock.text;

    // Step 4: Parse sections
    console.log('[4/6] Parsing sections...');
    const sections = parsePaperAnalysisSections(paperAnalysisMd);
    if (!sections) {
      throw new Error('Failed to parse sections from generated markdown');
    }
    console.log(`      ✓ Parsed ${Object.keys(sections).length} sections:`, Object.keys(sections).join(', '));

    // Step 5: Upload to extractions bucket
    console.log('[5/6] Uploading paper-analysis.md to extractions bucket...');
    await uploadFile(
      'extractions',
      `${dataset.session_id}/paper-analysis.md`,
      Buffer.from(paperAnalysisMd, 'utf-8'),
      'text/markdown'
    );
    console.log(`      ✓ Uploaded to extractions/${dataset.session_id}/paper-analysis.md`);

    // Step 6: Upload to datasets bucket and update database
    console.log('[6/6] Uploading to datasets bucket and updating database...');
    const datasetUrl = await uploadFile(
      'datasets',
      `${dataset.id}/metadata/paper-analysis.md`,
      Buffer.from(paperAnalysisMd, 'utf-8'),
      'text/markdown'
    );

    // Update database with sections
    await query(
      `UPDATE datasets
       SET paper_analysis_sections = $1
       WHERE id = $2`,
      [JSON.stringify(sections), dataset.id]
    );

    // Track file in data_files table (check if exists first)
    const existingFile = await queryOne(
      `SELECT id FROM data_files WHERE dataset_id = $1 AND file_name = $2`,
      [dataset.id, 'paper-analysis.md']
    );

    if (existingFile) {
      // Update existing file
      await query(
        `UPDATE data_files
         SET file_path = $1,
             file_size_bytes = $2,
             mime_type = $3
         WHERE dataset_id = $4 AND file_name = $5`,
        [datasetUrl, paperAnalysisMd.length, 'text/markdown', dataset.id, 'paper-analysis.md']
      );
    } else {
      // Insert new file
      await query(
        `INSERT INTO data_files (
          dataset_id,
          file_name,
          file_path,
          file_type,
          file_size_bytes,
          mime_type,
          description,
          created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
        [
          dataset.id,
          'paper-analysis.md',
          datasetUrl,
          'text/markdown',
          paperAnalysisMd.length,
          'text/markdown',
          'Structured 4-section paper analysis for dataset overview'
        ]
      );
    }

    console.log(`      ✓ Updated database and tracked file`);
    console.log(`\n✅ SUCCESS: Dataset ${dataset.id} complete!\n`);

  } catch (error) {
    console.error(`\n❌ ERROR: Dataset ${dataset.id} failed:`, error);
    console.error(`   Skipping and continuing with next dataset...\n`);
  }
}

async function main() {
  console.log('\n' + '='.repeat(80));
  console.log('GENERATE PAPER ANALYSIS FOR ALL EXISTING DATASETS');
  console.log('='.repeat(80));

  // Get all datasets that need paper analysis
  const datasets = await query<Dataset>(
    `SELECT
      d.id,
      d.dataset_name,
      es.session_id
    FROM datasets d
    LEFT JOIN extraction_sessions es ON es.dataset_id = d.id
    WHERE d.paper_analysis_sections IS NULL
      AND es.session_id IS NOT NULL
    ORDER BY d.id`
  );

  if (datasets.length === 0) {
    console.log('\n✓ All datasets already have paper analysis sections!');
    return;
  }

  console.log(`\nFound ${datasets.length} dataset(s) that need paper analysis:\n`);
  datasets.forEach(d => {
    console.log(`  - Dataset ${d.id}: ${d.dataset_name}`);
  });

  console.log('\nStarting generation...\n');

  // Process each dataset
  for (const dataset of datasets) {
    await generatePaperAnalysisForDataset(dataset);
  }

  console.log('='.repeat(80));
  console.log('ALL DATASETS PROCESSED');
  console.log('='.repeat(80));
  console.log(`\nTotal: ${datasets.length} dataset(s) processed`);
  console.log('\nYou can now view the paper analysis sections on each dataset page!');
  console.log('Example: https://thermo-app.vercel.app/datasets/3\n');
}

// Run the script
main()
  .then(() => {
    console.log('\n✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });
