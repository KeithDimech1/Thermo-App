/**
 * POST /api/extraction/[sessionId]/analyze
 * Analyze PDF using Anthropic API (Step 1 of extraction workflow)
 */

import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';
import {
  getExtractionSession,
  updateExtractionState,
  updatePaperMetadata,
  markSessionFailed,
} from '@/lib/db/extraction-queries';
import { extractPDFText, checkPyMuPDFInstalled } from '@/lib/utils/python-bridge';
import { createMessage, isAnthropicConfigured } from '@/lib/anthropic/client';
import {
  ANALYSIS_SYSTEM_PROMPT,
  createAnalysisUserMessage,
} from '@/lib/anthropic/prompts';
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

    const pymupdfInstalled = await checkPyMuPDFInstalled();
    if (!pymupdfInstalled) {
      throw new Error('PyMuPDF not installed. Please install: pip install pymupdf');
    }

    // Get session
    const session = await getExtractionSession(sessionId);
    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    // Check state
    if (session.state !== 'uploaded') {
      return NextResponse.json(
        { error: `Invalid state: ${session.state}. Expected: uploaded` },
        { status: 400 }
      );
    }

    // Update state to analyzing
    await updateExtractionState(sessionId, 'analyzing');
    console.log(`[Analyze API] State updated to analyzing`);

    // Get PDF path
    const pdfPath = path.join(process.cwd(), 'public', session.pdf_path);
    console.log(`[Analyze API] PDF path: ${pdfPath}`);

    // Step 1: Extract text from PDF
    console.log(`[Analyze API] Extracting text from PDF...`);
    const pdfText = await extractPDFText(pdfPath);
    console.log(`[Analyze API] Extracted ${pdfText.length} characters`);

    // Step 2: Send to Claude API for analysis
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

    // Step 3: Parse JSON response
    let analysisResult: AnalysisResult;
    try {
      // Remove markdown code blocks if present
      const jsonText = analysisText
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();

      analysisResult = JSON.parse(jsonText);
    } catch (error) {
      console.error(`[Analyze API] JSON parse error:`, error);
      throw new Error('Failed to parse Claude API response as JSON');
    }

    console.log(`[Analyze API] Parsed analysis result:`, {
      title: analysisResult.paper_metadata.title,
      tablesFound: analysisResult.tables.length,
      figuresFound: analysisResult.figures?.length || 0,
    });

    // Step 4: Create paper directory structure (match CLI workflow)
    const sessionDir = path.join(process.cwd(), 'public', 'uploads', sessionId);
    const textDir = path.join(sessionDir, 'text');
    const imagesDir = path.join(sessionDir, 'images');
    const tablesImgDir = path.join(imagesDir, 'tables');

    console.log(`[Analyze API] Creating directory structure...`);
    await fs.mkdir(textDir, { recursive: true });
    await fs.mkdir(tablesImgDir, { recursive: true });

    // Save extracted text to text/plain-text.txt (for reuse in extraction)
    const plainTextPath = path.join(textDir, 'plain-text.txt');
    await fs.writeFile(plainTextPath, pdfText, 'utf-8');
    console.log(`[Analyze API] Saved plain text to ${plainTextPath}`);

    // Create table-index.json (links text locations to PDF pages)
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

    const tableIndexPath = path.join(sessionDir, 'table-index.json');
    await fs.writeFile(tableIndexPath, JSON.stringify(tableIndex, null, 2), 'utf-8');
    console.log(`[Analyze API] Saved table index to ${tableIndexPath}`);

    // Generate markdown documentation (match CLI workflow)
    console.log(`[Analyze API] Generating markdown documentation...`);

    // Generate paper-index.md (quick reference)
    const paperIndexMd = generatePaperIndexMarkdown(analysisResult, session.pdf_filename);
    const paperIndexPath = path.join(sessionDir, 'paper-index.md');
    await fs.writeFile(paperIndexPath, paperIndexMd, 'utf-8');
    console.log(`[Analyze API] Saved paper-index.md`);

    // Generate tables.md (visual table reference)
    const tablesMd = generateTablesMarkdown(analysisResult.tables);
    const tablesPath = path.join(sessionDir, 'tables.md');
    await fs.writeFile(tablesPath, tablesMd, 'utf-8');
    console.log(`[Analyze API] Saved tables.md`);

    // Step 5: Update database with results
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

${tables.map((table, index) => {
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
