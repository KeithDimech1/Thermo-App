/**
 * POST /api/extraction/[sessionId]/analyze
 * Analyze PDF using Anthropic API (Step 1 of extraction workflow)
 *
 * ERROR-021: Migrated to Supabase Storage
 */

import { NextRequest, NextResponse } from 'next/server';
import os from 'os';
import path from 'path';
import fs from 'fs/promises';
import {
  getExtractionSession,
  updateExtractionState,
  updatePaperMetadata,
  markSessionFailed,
} from '@/lib/db/extraction-queries';
import { extractPDFText, checkPDFJSAvailable } from '@/lib/utils/pdf-utils';
import { createMessage, isAnthropicConfigured } from '@/lib/anthropic/client';
// Screenshot generation moved to client-side (analyze page.tsx)
// import { captureTableScreenshots, captureFigureScreenshots } from '@/lib/extraction/pdf-screenshot';
import {
  ANALYSIS_SYSTEM_PROMPT,
  createAnalysisUserMessage,
} from '@/lib/anthropic/prompts';
import { downloadFile, uploadFile } from '@/lib/storage/supabase';
import type { PaperMetadata, TableInfo } from '@/lib/types/extraction-types';

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minute timeout for analysis

interface RouteParams {
  params: Promise<{
    sessionId: string;
  }>;
}

interface AnalysisResult {
  paper_metadata: PaperMetadata;
  tables: TableInfo[];
  figures?: Array<{
    figure_number: number | string;
    caption: string;
    page_number?: number;
  }>;
}

export async function POST(
  _req: NextRequest,
  { params }: RouteParams
) {
  const { sessionId } = await params;

  try {
    console.log(`[Analyze API] Starting analysis for session: ${sessionId}`);

    // Check prerequisites
    if (!isAnthropicConfigured()) {
      throw new Error('Anthropic API key not configured');
    }

    const pdfjsAvailable = await checkPDFJSAvailable();
    if (!pdfjsAvailable) {
      throw new Error('PDF.js not properly configured');
    }

    // Get session
    const session = await getExtractionSession(sessionId);
    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    // Check state - allow retry from 'failed' state
    if (session.state !== 'uploaded' && session.state !== 'failed') {
      return NextResponse.json(
        { error: `Invalid state: ${session.state}. Expected: uploaded or failed` },
        { status: 400 }
      );
    }

    // Update state to analyzing
    await updateExtractionState(sessionId, 'analyzing');
    console.log(`[Analyze API] State updated to analyzing`);

    // Step 1: Download PDF from Supabase Storage to temp file
    // (PyMuPDF requires filesystem path)
    console.log(`[Analyze API] Downloading PDF from Supabase Storage...`);
    const pdfBuffer = await downloadFile('extractions', `${sessionId}/original.pdf`);

    // Create temp file for PyMuPDF
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'thermo-'));
    const tempPdfPath = path.join(tempDir, 'temp.pdf');
    await fs.writeFile(tempPdfPath, pdfBuffer);
    console.log(`[Analyze API] Temp PDF path: ${tempPdfPath}`);

    // Step 2: Extract text from PDF
    console.log(`[Analyze API] Extracting text from PDF...`);
    const pdfText = await extractPDFText(tempPdfPath);
    console.log(`[Analyze API] Extracted ${pdfText.length} characters`);

    // NOTE: Don't clean up temp file yet - we need it for screenshot capture later

    // Step 3: Send to Claude API for analysis
    console.log(`[Analyze API] Sending to Claude API...`);
    const userMessage = createAnalysisUserMessage(pdfText, session.pdf_filename);

    const response = await createMessage(
      ANALYSIS_SYSTEM_PROMPT,
      userMessage,
      {
        maxTokens: 4000,
        temperature: 0.1,
      }
    );

    // Extract text content from response
    const contentBlock = response.content.find(block => block.type === 'text');
    if (!contentBlock || contentBlock.type !== 'text') {
      throw new Error('No text content in Claude response');
    }

    const analysisText = contentBlock.text;
    console.log(`[Analyze API] Received response: ${analysisText.substring(0, 200)}...`);

    // Step 4: Parse JSON response
    let analysisResult: AnalysisResult;
    try {
      // Remove markdown code blocks if present
      let jsonText = analysisText
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();

      // Try to extract JSON if there's additional text
      // Look for the first { and last } to extract just the JSON object
      const firstBrace = jsonText.indexOf('{');
      const lastBrace = jsonText.lastIndexOf('}');

      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        jsonText = jsonText.substring(firstBrace, lastBrace + 1);
      }

      // Common JSON fixes for Claude responses
      // Fix single quotes (but be careful with apostrophes in text)
      // Fix trailing commas before } or ]
      jsonText = jsonText
        .replace(/,(\s*[}\]])/g, '$1')  // Remove trailing commas
        .replace(/\n/g, ' ')            // Replace newlines with spaces
        .replace(/\r/g, '');            // Remove carriage returns

      analysisResult = JSON.parse(jsonText);
    } catch (error) {
      console.error(`[Analyze API] JSON parse error:`, error);
      console.error(`[Analyze API] Raw response (first 500 chars):`, analysisText.substring(0, 500));
      console.error(`[Analyze API] Raw response (last 500 chars):`, analysisText.substring(Math.max(0, analysisText.length - 500)));

      // Save the failed response for debugging
      try {
        await uploadFile(
          'extractions',
          `${sessionId}/debug-failed-response.txt`,
          Buffer.from(analysisText, 'utf-8'),
          'text/plain'
        );
        console.log(`[Analyze API] Saved failed response to debug-failed-response.txt`);
      } catch (uploadError) {
        console.error(`[Analyze API] Failed to save debug response:`, uploadError);
      }

      throw new Error(`Failed to parse Claude API response as JSON: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    console.log(`[Analyze API] Parsed analysis result:`, {
      title: analysisResult.paper_metadata.title,
      tablesFound: analysisResult.tables.length,
      figuresFound: analysisResult.figures?.length || 0,
    });

    // NOTE: Table screenshots are now generated client-side in the browser
    // See app/extraction/[sessionId]/analyze/page.tsx for implementation
    // This is more reliable and fully serverless-compatible
    console.log(`[Analyze API] Skipping server-side screenshot generation (handled client-side)`);

    // Clean up temp PDF file now that we're done with it
    await fs.rm(tempDir, { recursive: true, force: true });
    console.log(`[Analyze API] Cleaned up temp PDF file`);

    // Step 6: Upload extracted text to Supabase Storage
    console.log(`[Analyze API] Uploading analysis files to Supabase Storage...`);

    // Upload plain text
    await uploadFile(
      'extractions',
      `${sessionId}/text/plain-text.txt`,
      Buffer.from(pdfText, 'utf-8'),
      'text/plain'
    );
    console.log(`[Analyze API] Uploaded plain text`);

    // Upload table-index.json
    const tableIndex = {
      paper_metadata: analysisResult.paper_metadata,
      tables: analysisResult.tables.map((table) => ({
        table_number: table.table_number,
        caption: table.caption,
        page_number: table.page_number,
        estimated_rows: table.estimated_rows,
        estimated_columns: table.estimated_columns,
        data_type: table.data_type || 'Unknown', // Paper-agnostic - may not be classified
        locations: {
          // Text location will be populated during extraction
          text_file: {
            path: 'text/plain-text.txt',
            start_line: null,
            end_line: null,
          },
          // PDF page location
          pdf_pages: {
            pages: table.page_number ? [table.page_number] : [],
          },
        },
      })),
      figures: analysisResult.figures || [],
      generated_at: new Date().toISOString(),
    };

    await uploadFile(
      'extractions',
      `${sessionId}/table-index.json`,
      Buffer.from(JSON.stringify(tableIndex, null, 2), 'utf-8'),
      'application/json'
    );
    console.log(`[Analyze API] Uploaded table-index.json`);

    // Upload markdown documentation
    console.log(`[Analyze API] Generating and uploading markdown documentation...`);

    // Upload paper-index.md (quick reference)
    const paperIndexMd = generatePaperIndexMarkdown(analysisResult, session.pdf_filename);
    await uploadFile(
      'extractions',
      `${sessionId}/paper-index.md`,
      Buffer.from(paperIndexMd, 'utf-8'),
      'text/markdown'
    );
    console.log(`[Analyze API] Uploaded paper-index.md`);

    // Upload tables.md (visual table reference)
    const tablesMd = generateTablesMarkdown(analysisResult.tables);
    await uploadFile(
      'extractions',
      `${sessionId}/tables.md`,
      Buffer.from(tablesMd, 'utf-8'),
      'text/markdown'
    );
    console.log(`[Analyze API] Uploaded tables.md`);

    // Step 7: Update database with results
    await updatePaperMetadata(
      sessionId,
      analysisResult.paper_metadata,
      analysisResult.tables.length,
      [] // Paper-agnostic - no data type classification
    );

    console.log(`[Analyze API] Analysis complete for session: ${sessionId}`);

    // Return success response
    return NextResponse.json({
      success: true,
      sessionId,
      paper_metadata: analysisResult.paper_metadata,
      tables_found: analysisResult.tables.length,
      figures_found: analysisResult.figures?.length || 0,
      tables: analysisResult.tables,
      figures: analysisResult.figures || [],
      // Screenshots generated client-side (see analyze page.tsx)
    });

  } catch (error) {
    console.error(`[Analyze API] Error:`, error);

    // Mark session as failed
    try {
      await markSessionFailed(
        sessionId,
        error instanceof Error ? error.message : 'Analysis failed',
        'analyze'
      );
    } catch (dbError) {
      console.error(`[Analyze API] Failed to mark session as failed:`, dbError);
    }

    return NextResponse.json(
      {
        error: 'Analysis failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * Generate paper-index.md (quick reference guide)
 */
function generatePaperIndexMarkdown(result: AnalysisResult, filename: string): string {
  const meta = result.paper_metadata;
  const tables = result.tables;
  const figures = result.figures || [];

  const authors = meta.authors?.join(', ') || 'Unknown';
  const affiliations = meta.affiliations?.join('; ') || 'Not specified';

  return `# Paper Index: ${meta.title || 'Unknown Title'}

**Generated:** ${new Date().toISOString()}
**Filename:** ${filename}

---

## Citation

**Title:** ${meta.title || 'Unknown'}
**Authors:** ${authors}
**Affiliations:** ${affiliations}
**Journal:** ${meta.journal || 'Unknown'}
**Year:** ${meta.year || 'Unknown'}
**DOI:** ${meta.doi || 'Not specified'}

## Abstract

${meta.abstract || 'No abstract available.'}

---

## Tables Found (${tables.length})

${tables.length === 0 ? 'No tables detected.' : tables.map(table => {
  const tableNum = table.table_number;
  const caption = table.caption || 'No caption';
  const page = table.page_number ? `Page ${table.page_number}` : 'Page unknown';
  const dimensions = table.estimated_rows && table.estimated_columns
    ? `${table.estimated_rows}×${table.estimated_columns}`
    : 'Dimensions unknown';

  return `### Table ${tableNum}
**Caption:** ${caption}
**Location:** ${page}
**Estimated size:** ${dimensions}
**Data type:** ${table.data_type || 'Unknown'}
`;
}).join('\n')}

---

## Figures Found (${figures.length})

${figures.length === 0 ? 'No figures detected.' : figures.map(fig => {
  const figNum = fig.figure_number;
  const caption = fig.caption || 'No caption';
  const page = fig.page_number ? `Page ${fig.page_number}` : 'Page unknown';

  return `### Figure ${figNum}
**Caption:** ${caption}
**Location:** ${page}
`;
}).join('\n')}

---

## Next Steps

1. **Review table list** - Verify all expected tables are detected
2. **Proceed to extraction** - Use /thermoextract or web extraction interface
3. **Check table-index.json** - Review detailed table metadata

---

*Generated by AusGeochem Extraction System*
`;
}

/**
 * Generate tables.md (visual table reference)
 */
function generateTablesMarkdown(tables: TableInfo[]): string {
  if (tables.length === 0) {
    return `# Tables Reference

No tables were detected in this paper.

---

*Generated by AusGeochem Extraction System*
`;
  }

  return `# Tables Reference

**Total tables detected:** ${tables.length}

This document provides a visual reference for all tables found in the paper.

---

${tables.map((table) => {
  const tableNum = table.table_number;
  const caption = table.caption || 'No caption';
  const page = table.page_number ? `Page ${table.page_number}` : 'Page unknown';
  const rows = table.estimated_rows || 'Unknown';
  const cols = table.estimated_columns || 'Unknown';
  const dataType = table.data_type || 'Unknown';

  return `## Table ${tableNum}

**Caption:** ${caption}

**Metadata:**
- Page: ${page}
- Estimated size: ${rows} rows × ${cols} columns
- Data type: ${dataType}

**Locations:**
- Text file: \`text/plain-text.txt\` (line numbers populated during extraction)
- PDF pages: ${page}
- Screenshot: \`images/tables/table-${tableNum}.png\` (will be generated during extraction)

---
`;
}).join('\n')}

*Generated by AusGeochem Extraction System*
`;
}
