/**
 * POST /api/datasets/[id]/fair/analyze
 *
 * Perform AI-powered FAIR compliance analysis on a dataset
 *
 * This route:
 * 1. Downloads CSVs and paper-index.md from Supabase Storage
 * 2. Parses CSV contents for field-by-field analysis
 * 3. Loads Kohn 2024 reporting standards
 * 4. Uses AI (Anthropic Claude) to analyze data quality
 * 5. Converts data to EarthBank templates (if applicable)
 * 6. Saves results to database
 * 7. Returns FAIR score and downloadable template URLs
 */

import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db/connection';
import { downloadFile, uploadFile } from '@/lib/storage/supabase';
import { FILE_TYPES } from '@/lib/constants/file-types';
import Anthropic from '@anthropic-ai/sdk';
import { readFileSync } from 'fs';
import { join } from 'path';

interface FairAnalysisResponse {
  success: boolean;
  total_score: number;
  grade: string;
  findable_score: number;
  accessible_score: number;
  interoperable_score: number;
  reusable_score: number;
  table4_score: number;
  table5_score: number;
  table6_score: number;
  table10_score: number;
  analysis_date: string;
  earthbank_templates_available: boolean;
  earthbank_template_urls?: string[];
  is_thermochronology_data: boolean;
  can_import_to_database: boolean;
  ai_analysis_summary?: string;
}

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

export async function POST(
  _request: NextRequest,
  { params }: RouteParams
) {
  const { id } = await params;
  const datasetId = parseInt(id, 10);

  try {
    console.log(`[ThermoFAIR] Starting FAIR analysis for dataset ${datasetId}...`);

    // Get dataset metadata
    const dataset = await queryOne<any>(
      'SELECT * FROM datasets WHERE id = $1',
      [datasetId]
    );

    if (!dataset) {
      return NextResponse.json(
        { error: 'Dataset not found' },
        { status: 404 }
      );
    }

    // Get data files for this dataset
    const dataFiles = await query<any>(
      `SELECT file_name, file_path, file_type, file_size_bytes
       FROM data_files
       WHERE dataset_id = $1`,
      [datasetId]
    );

    console.log(`[ThermoFAIR] Found ${dataFiles.length} files for dataset`);

    // Download and analyze CSVs
    const csvFiles = dataFiles.filter((f: any) => f.file_type === FILE_TYPES.CSV);
    console.log(`[ThermoFAIR] Found ${csvFiles.length} CSV files to analyze`);

    // Download CSV contents for AI analysis
    const csvContents: Array<{ filename: string; content: string; url: string }> = [];
    for (const csvFile of csvFiles) {
      try {
        const urlParts = csvFile.file_path.split('/datasets/');
        if (urlParts.length > 1) {
          const storagePath = urlParts[1];
          const csvBuffer = await downloadFile('datasets', storagePath);
          csvContents.push({
            filename: csvFile.file_name,
            content: csvBuffer.toString('utf-8'),
            url: csvFile.file_path
          });
          console.log(`[ThermoFAIR] Downloaded CSV: ${csvFile.file_name} (${csvBuffer.length} bytes)`);
        }
      } catch (err) {
        console.warn(`[ThermoFAIR] Could not download CSV ${csvFile.file_name}:`, err);
      }
    }

    // Download paper-index.md for context
    let paperMetadata: any = {};
    try {
      const paperIndexFile = dataFiles.find((f: any) => f.file_name === 'paper-index.md');
      if (paperIndexFile) {
        // Extract from Supabase public URL
        const urlParts = paperIndexFile.file_path.split('/datasets/');
        if (urlParts.length > 1) {
          const storagePath = urlParts[1];
          const paperIndexBuffer = await downloadFile('datasets', storagePath);
          const paperIndexContent = paperIndexBuffer.toString('utf-8');
          paperMetadata = parsePaperMetadata(paperIndexContent);
          console.log('[ThermoFAIR] Loaded paper metadata from paper-index.md');
        }
      }
    } catch (err) {
      console.warn('[ThermoFAIR] Could not load paper-index.md, using dataset record');
      paperMetadata = {
        dataset_name: dataset.dataset_name,
        authors: dataset.authors,
        doi: dataset.doi,
        publication_journal: dataset.publication_journal,
        publication_year: dataset.publication_year,
        study_location: dataset.study_location,
        mineral_analyzed: dataset.mineral_analyzed,
        sample_count: dataset.sample_count,
        laboratory: dataset.laboratory
      };
    }

    // Load Kohn 2024 standards
    const kohnStandardsPath = join(process.cwd(), 'build-data/learning/archive/extracts/01-Kohn-2024-Reporting-Standards.txt');
    const kohnStandards = readFileSync(kohnStandardsPath, 'utf-8');
    console.log('[ThermoFAIR] Loaded Kohn 2024 standards');

    // Perform AI-powered FAIR analysis
    console.log('[ThermoFAIR] Starting AI analysis...');
    const fairAssessment = await performAIPoweredFAIRAnalysis(
      paperMetadata,
      dataFiles,
      csvContents,
      kohnStandards
    );

    console.log('[ThermoFAIR] AI FAIR assessment complete:', {
      total_score: fairAssessment.total_score,
      grade: fairAssessment.grade,
      is_thermochronology_data: fairAssessment.is_thermochronology_data
    });

    // Save FAIR scores to database
    // Check if record already exists
    const existingFair = await queryOne<any>(
      'SELECT * FROM fair_score_breakdown WHERE dataset_id = $1',
      [datasetId]
    );

    if (existingFair) {
      // Update existing record
      await query(
        `UPDATE fair_score_breakdown
         SET findable_score = $1,
             accessible_score = $2,
             interoperable_score = $3,
             reusable_score = $4,
             total_score = $5,
             findable_reasoning = $6,
             accessible_reasoning = $7,
             interoperable_reasoning = $8,
             reusable_reasoning = $9,
             table4_score = $10,
             table4_reasoning = $11,
             table5_score = $12,
             table5_reasoning = $13,
             table6_score = $14,
             table6_reasoning = $15,
             table10_score = $16,
             table10_reasoning = $17,
             grade = $18,
             updated_at = NOW()
         WHERE dataset_id = $19`,
        [
          fairAssessment.findable_score,
          fairAssessment.accessible_score,
          fairAssessment.interoperable_score,
          fairAssessment.reusable_score,
          fairAssessment.total_score,
          fairAssessment.findable_reasoning,
          fairAssessment.accessible_reasoning,
          fairAssessment.interoperable_reasoning,
          fairAssessment.reusable_reasoning,
          fairAssessment.table4_score,
          fairAssessment.table4_reasoning,
          fairAssessment.table5_score,
          fairAssessment.table5_reasoning,
          fairAssessment.table6_score,
          fairAssessment.table6_reasoning,
          fairAssessment.table10_score,
          fairAssessment.table10_reasoning,
          fairAssessment.grade,
          datasetId
        ]
      );
      console.log('[ThermoFAIR] Updated existing FAIR score record');
    } else {
      // Insert new record
      await query(
        `INSERT INTO fair_score_breakdown (
          dataset_id,
          findable_score,
          accessible_score,
          interoperable_score,
          reusable_score,
          total_score,
          findable_reasoning,
          accessible_reasoning,
          interoperable_reasoning,
          reusable_reasoning,
          table4_score,
          table4_reasoning,
          table5_score,
          table5_reasoning,
          table6_score,
          table6_reasoning,
          table10_score,
          table10_reasoning,
          grade,
          created_at,
          updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, NOW(), NOW()
        )`,
        [
          datasetId,
          fairAssessment.findable_score,
          fairAssessment.accessible_score,
          fairAssessment.interoperable_score,
          fairAssessment.reusable_score,
          fairAssessment.total_score,
          fairAssessment.findable_reasoning,
          fairAssessment.accessible_reasoning,
          fairAssessment.interoperable_reasoning,
          fairAssessment.reusable_reasoning,
          fairAssessment.table4_score,
          fairAssessment.table4_reasoning,
          fairAssessment.table5_score,
          fairAssessment.table5_reasoning,
          fairAssessment.table6_score,
          fairAssessment.table6_reasoning,
          fairAssessment.table10_score,
          fairAssessment.table10_reasoning,
          fairAssessment.grade
        ]
      );
      console.log('[ThermoFAIR] Created new FAIR score record');
    }

    // Generate EarthBank templates if data is thermochronology-compatible
    let earthbank_template_urls: string[] = [];
    let earthbank_templates_available = false;

    if (fairAssessment.is_thermochronology_data && csvContents.length > 0) {
      console.log('[ThermoFAIR] Generating EarthBank templates...');
      try {
        const templates = await generateEarthBankTemplates(csvContents, datasetId);
        earthbank_template_urls = templates;
        earthbank_templates_available = templates.length > 0;
        console.log(`[ThermoFAIR] Generated ${templates.length} EarthBank templates`);
      } catch (err) {
        console.error('[ThermoFAIR] Failed to generate EarthBank templates:', err);
      }
    }

    const response: FairAnalysisResponse = {
      success: true,
      total_score: fairAssessment.total_score,
      grade: fairAssessment.grade,
      findable_score: fairAssessment.findable_score,
      accessible_score: fairAssessment.accessible_score,
      interoperable_score: fairAssessment.interoperable_score,
      reusable_score: fairAssessment.reusable_score,
      table4_score: fairAssessment.table4_score,
      table5_score: fairAssessment.table5_score,
      table6_score: fairAssessment.table6_score,
      table10_score: fairAssessment.table10_score,
      analysis_date: new Date().toISOString(),
      earthbank_templates_available,
      earthbank_template_urls,
      is_thermochronology_data: fairAssessment.is_thermochronology_data,
      can_import_to_database: fairAssessment.can_import_to_database,
      ai_analysis_summary: fairAssessment.ai_analysis_summary
    };

    console.log('[ThermoFAIR] ✅ FAIR analysis complete!');

    return NextResponse.json(response);

  } catch (error: any) {
    console.error('[ThermoFAIR] Error:', error);

    return NextResponse.json(
      {
        error: 'FAIR analysis failed',
        details: error.message || 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// ========================================
// Helper Functions
// ========================================

function parsePaperMetadata(content: string) {
  const titleMatch = content.match(/\*\*Title:\*\*\s*(.+)/);
  const title = titleMatch?.[1]?.trim() || 'Unknown Title';

  const authorsMatch = content.match(/\*\*Authors:\*\*\s*(.+)/);
  let authors: string[] = [];
  if (authorsMatch?.[1]) {
    authors = authorsMatch[1].split(',').map(a => a.trim()).filter(n => n.length > 0);
  }

  const affiliationsMatch = content.match(/\*\*Affiliations:\*\*\s*(.+)/);
  const affiliations = affiliationsMatch?.[1]?.trim() || null;

  let laboratory = null;
  if (affiliations) {
    laboratory = affiliations.split(';')[0]?.trim() || null;
  }

  const journalMatch = content.match(/\*\*Journal:\*\*\s*([^\n]+)/);
  const publication_journal = journalMatch?.[1]?.trim() || null;

  const yearMatch = content.match(/\*\*Year:\*\*\s*(\d{4})/);
  const publication_year = yearMatch?.[1] ? parseInt(yearMatch[1]) : null;

  const doiMatch = content.match(/\*\*DOI:\*\*\s*(?:https?:\/\/doi\.org\/)?([\w./-]+)/);
  const doi = doiMatch?.[1]?.trim() || null;

  const studyMatch = content.match(/\*\*Study Area:\*\*\s*(.+)/);
  const study_location = studyMatch?.[1]?.trim() || null;

  const mineralMatch = content.match(/\*\*Method:\*\*\s*(?:Both\s+)?(?:AFT.*?and\s+)?(?:AHe)?\s*\(([^)]+)\)/);
  let mineral_analyzed = null;
  if (mineralMatch?.[1]) {
    const mineralText = mineralMatch[1];
    if (mineralText.toLowerCase().includes('apatite')) {
      mineral_analyzed = 'Apatite';
    } else if (mineralText.toLowerCase().includes('zircon')) {
      mineral_analyzed = 'Zircon';
    } else {
      mineral_analyzed = mineralText;
    }
  }

  const sampleCountMatch = content.match(/\*\*Sample Count:\*\*\s*(\d+)/);
  const sample_count = sampleCountMatch?.[1] ? parseInt(sampleCountMatch[1]) : null;

  return {
    dataset_name: title,
    authors,
    doi,
    publication_journal,
    publication_year,
    study_location,
    mineral_analyzed,
    sample_count,
    laboratory
  };
}

async function performAIPoweredFAIRAnalysis(
  metadata: any,
  files: any[],
  csvContents: Array<{ filename: string; content: string; url: string }>,
  kohnStandards: string
) {
  // Initialize Anthropic client
  const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });

  // Prepare CSV previews (first 50 lines of each)
  const csvPreviews = csvContents.map(csv => {
    const lines = csv.content.split('\n').slice(0, 50);
    return {
      filename: csv.filename,
      preview: lines.join('\n'),
      total_lines: csv.content.split('\n').length
    };
  });

  // Build AI prompt
  const aiPrompt = `You are a thermochronology data quality expert. Analyze this dataset for FAIR compliance and Kohn et al. (2024) reporting standards.

**Dataset Metadata:**
- Title: ${metadata.dataset_name || 'Unknown'}
- Authors: ${metadata.authors?.join(', ') || 'Unknown'}
- DOI: ${metadata.doi || 'None'}
- Journal: ${metadata.publication_journal || 'Unknown'} (${metadata.publication_year || 'Unknown'})
- Study Location: ${metadata.study_location || 'Unknown'}
- Mineral: ${metadata.mineral_analyzed || 'Unknown'}
- Sample Count: ${metadata.sample_count || 'Unknown'}
- Laboratory: ${metadata.laboratory || 'Unknown'}

**CSV Files (${csvContents.length} total):**
${csvPreviews.map(csv => `
### ${csv.filename} (${csv.total_lines} rows)
\`\`\`csv
${csv.preview}
\`\`\`
`).join('\n')}

**Kohn 2024 Standards (excerpt):**
${kohnStandards.substring(0, 3000)}...

**Your Task:**
1. Determine if this is valid thermochronology data (fission-track or (U-Th)/He)
2. Assess FAIR compliance (Findable, Accessible, Interoperable, Reusable) - score each category 0-25
3. Evaluate Kohn 2024 compliance for Tables 4, 5, 6, 10 - score each table
4. Determine if data can be imported to database (valid field names, complete records)
5. Provide detailed reasoning for each score

**Response Format (JSON):**
{
  "is_thermochronology_data": boolean,
  "can_import_to_database": boolean,
  "findable_score": number (0-25),
  "accessible_score": number (0-25),
  "interoperable_score": number (0-25),
  "reusable_score": number (0-25),
  "table4_score": number (0-15),
  "table5_score": number (0-15),
  "table6_score": number (0-10),
  "table10_score": number (0-10),
  "findable_reasoning": "detailed explanation",
  "accessible_reasoning": "detailed explanation",
  "interoperable_reasoning": "detailed explanation",
  "reusable_reasoning": "detailed explanation",
  "table4_reasoning": "detailed explanation",
  "table5_reasoning": "detailed explanation",
  "table6_reasoning": "detailed explanation",
  "table10_reasoning": "detailed explanation",
  "summary": "1-2 sentence overall assessment"
}`;

  // Call Anthropic API
  console.log('[ThermoFAIR] Calling Anthropic API for analysis...');
  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4096,
    messages: [
      {
        role: 'user',
        content: aiPrompt
      }
    ]
  });

  // Parse AI response
  const firstContent = message.content[0];
  const aiResponseText = firstContent && firstContent.type === 'text' ? firstContent.text : '';
  console.log('[ThermoFAIR] AI response received');

  let aiAnalysis: any;
  try {
    // Extract JSON from response (might be wrapped in markdown code blocks)
    const jsonMatch = aiResponseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      aiAnalysis = JSON.parse(jsonMatch[0]);
    } else {
      throw new Error('No JSON found in AI response');
    }
  } catch (err) {
    console.error('[ThermoFAIR] Failed to parse AI response:', err);
    // Fallback to heuristic analysis
    return performHeuristicFAIRAnalysis(metadata, files);
  }

  // Calculate total score and grade
  const total_score = aiAnalysis.findable_score + aiAnalysis.accessible_score +
                      aiAnalysis.interoperable_score + aiAnalysis.reusable_score;

  let grade = 'F';
  if (total_score >= 90) grade = 'A';
  else if (total_score >= 80) grade = 'B';
  else if (total_score >= 70) grade = 'C';
  else if (total_score >= 60) grade = 'D';

  return {
    total_score,
    grade,
    findable_score: aiAnalysis.findable_score,
    findable_reasoning: aiAnalysis.findable_reasoning,
    accessible_score: aiAnalysis.accessible_score,
    accessible_reasoning: aiAnalysis.accessible_reasoning,
    interoperable_score: aiAnalysis.interoperable_score,
    interoperable_reasoning: aiAnalysis.interoperable_reasoning,
    reusable_score: aiAnalysis.reusable_score,
    reusable_reasoning: aiAnalysis.reusable_reasoning,
    table4_score: aiAnalysis.table4_score,
    table4_reasoning: aiAnalysis.table4_reasoning,
    table5_score: aiAnalysis.table5_score,
    table5_reasoning: aiAnalysis.table5_reasoning,
    table6_score: aiAnalysis.table6_score,
    table6_reasoning: aiAnalysis.table6_reasoning,
    table10_score: aiAnalysis.table10_score,
    table10_reasoning: aiAnalysis.table10_reasoning,
    is_thermochronology_data: aiAnalysis.is_thermochronology_data || false,
    can_import_to_database: aiAnalysis.can_import_to_database || false,
    ai_analysis_summary: aiAnalysis.summary || 'AI analysis completed'
  };
}

// Fallback heuristic analysis if AI fails
async function performHeuristicFAIRAnalysis(metadata: any, files: any[]) {
  let findable_score = 0;
  let accessible_score = 0;
  let interoperable_score = 0;
  let reusable_score = 0;

  const findable_reasons: string[] = [];
  const accessible_reasons: string[] = [];
  const interoperable_reasons: string[] = [];
  const reusable_reasons: string[] = [];

  // FINDABLE (max 25 points)
  if (metadata.doi) {
    findable_score += 10;
    findable_reasons.push('✓ DOI present (10 pts)');
  } else {
    findable_reasons.push('✗ No DOI (0 pts)');
  }

  if (metadata.authors && metadata.authors.length > 0) {
    findable_score += 8;
    findable_reasons.push(`✓ Authors listed (${metadata.authors.length} authors, 8 pts)`);
  } else {
    findable_reasons.push('✗ No authors (0 pts)');
  }

  if (metadata.publication_journal && metadata.publication_year) {
    findable_score += 7;
    findable_reasons.push('✓ Full citation (7 pts)');
  } else {
    findable_reasons.push('✗ Incomplete citation (0 pts)');
  }

  // ACCESSIBLE (max 25 points)
  const pdfFiles = files.filter(f => f.file_type === FILE_TYPES.PDF);
  if (pdfFiles.length > 0) {
    accessible_score += 10;
    accessible_reasons.push(`✓ PDF available (${pdfFiles.length} files, 10 pts)`);
  } else {
    accessible_reasons.push('✗ No PDF (0 pts)');
  }

  const csvFiles = files.filter(f => f.file_type === FILE_TYPES.CSV);
  if (csvFiles.length > 0) {
    accessible_score += 10;
    accessible_reasons.push(`✓ CSV data files (${csvFiles.length} files, 10 pts)`);
  } else {
    accessible_reasons.push('✗ No CSV data (0 pts)');
  }

  accessible_score += 5; // Files are in Supabase Storage (public access)
  accessible_reasons.push('✓ Public data repository (Supabase Storage, 5 pts)');

  // INTEROPERABLE (max 25 points)
  const ftFiles = csvFiles.filter((f: any) =>
    f.file_name.toLowerCase().includes('ft') ||
    f.file_name.toLowerCase().includes('fission')
  );
  const heFiles = csvFiles.filter((f: any) =>
    f.file_name.toLowerCase().includes('he') ||
    f.file_name.toLowerCase().includes('helium')
  );

  if (ftFiles.length > 0 || heFiles.length > 0) {
    interoperable_score += 15;
    interoperable_reasons.push(`✓ EarthBank-compatible naming (${ftFiles.length} FT, ${heFiles.length} He, 15 pts)`);
  } else {
    interoperable_reasons.push('✗ No EarthBank-compatible files (0 pts)');
  }

  if (csvFiles.length > 0) {
    interoperable_score += 10;
    interoperable_reasons.push('✓ Machine-readable CSV format (10 pts)');
  }

  // REUSABLE (max 25 points)
  if (metadata.laboratory) {
    reusable_score += 8;
    reusable_reasons.push(`✓ Laboratory specified (${metadata.laboratory}, 8 pts)`);
  } else {
    reusable_reasons.push('✗ No laboratory info (0 pts)');
  }

  if (metadata.study_location) {
    reusable_score += 7;
    reusable_reasons.push(`✓ Study location (${metadata.study_location}, 7 pts)`);
  } else {
    reusable_reasons.push('✗ No study location (0 pts)');
  }

  if (metadata.mineral_analyzed) {
    reusable_score += 5;
    reusable_reasons.push(`✓ Mineral specified (${metadata.mineral_analyzed}, 5 pts)`);
  } else {
    reusable_reasons.push('✗ No mineral info (0 pts)');
  }

  if (metadata.sample_count) {
    reusable_score += 5;
    reusable_reasons.push(`✓ Sample count (${metadata.sample_count} samples, 5 pts)`);
  } else {
    reusable_reasons.push('✗ No sample count (0 pts)');
  }

  const total_score = findable_score + accessible_score + interoperable_score + reusable_score;

  let grade = 'F';
  if (total_score >= 90) grade = 'A';
  else if (total_score >= 80) grade = 'B';
  else if (total_score >= 70) grade = 'C';
  else if (total_score >= 60) grade = 'D';

  // Kohn 2024 scores (heuristic)
  const table4_score = metadata.sample_count ? 12 : 5;
  const table5_score = ftFiles.length > 0 ? 12 : 0;
  const table6_score = ftFiles.length > 0 ? 8 : 0;
  const table10_score = ftFiles.length > 0 || heFiles.length > 0 ? 8 : 0;

  return {
    total_score,
    grade,
    findable_score,
    findable_reasoning: findable_reasons.join('\n'),
    accessible_score,
    accessible_reasoning: accessible_reasons.join('\n'),
    interoperable_score,
    interoperable_reasoning: interoperable_reasons.join('\n'),
    reusable_score,
    reusable_reasoning: reusable_reasons.join('\n'),
    table4_score,
    table4_reasoning: metadata.sample_count ? 'Sample metadata present' : 'Limited sample metadata',
    table5_score,
    table5_reasoning: ftFiles.length > 0 ? 'FT count data available' : 'No FT count data',
    table6_score,
    table6_reasoning: ftFiles.length > 0 ? 'Track length data likely present' : 'No track length data',
    table10_score,
    table10_reasoning: (ftFiles.length > 0 || heFiles.length > 0) ? 'Age data available' : 'No age data',
    is_thermochronology_data: ftFiles.length > 0 || heFiles.length > 0,
    can_import_to_database: false,
    ai_analysis_summary: 'Heuristic analysis (AI unavailable)'
  };
}

async function generateEarthBankTemplates(
  csvContents: Array<{ filename: string; content: string; url: string }>,
  datasetId: number
): Promise<string[]> {
  // TODO: Implement actual EarthBank template conversion
  // For now, just copy CSVs to earthbank-templates folder
  const templateUrls: string[] = [];

  for (const csv of csvContents) {
    try {
      const templatePath = `${datasetId}/earthbank-templates/${csv.filename}`;
      const uploadedUrl = await uploadFile(
        'datasets',
        templatePath,
        Buffer.from(csv.content, 'utf-8'),
        'text/csv'
      );
      templateUrls.push(uploadedUrl);
      console.log(`[ThermoFAIR] Uploaded template: ${csv.filename}`);
    } catch (err) {
      console.error(`[ThermoFAIR] Failed to upload template ${csv.filename}:`, err);
    }
  }

  return templateUrls;
}
