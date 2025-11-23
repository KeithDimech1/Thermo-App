/**
 * POST /api/extraction/[sessionId]/extract
 * SIMPLIFIED: Extract table data using paper context + table screenshot
 *
 * Flow: paper-summary + paper-index + table screenshot → Claude → Save CSV
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getExtractionSession,
  updateExtractionState,
  markSessionFailed,
} from '@/lib/db/extraction-queries';
import { createMessageWithContent } from '@/lib/anthropic/client';
import { downloadFile, uploadFile } from '@/lib/storage/supabase';
import { parseCSV, arrayToCSV } from '@/lib/extraction/csv-utils';
import type { TableInfo } from '@/lib/types/extraction-types';

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minute timeout

interface RouteParams {
  params: Promise<{
    sessionId: string;
  }>;
}

interface ExtractionRequestBody {
  table: TableInfo;
}

export async function POST(
  req: NextRequest,
  { params }: RouteParams
) {
  const { sessionId } = await params;

  try {
    console.log(`[Extract] Starting simplified extraction for session: ${sessionId}`);

    // Parse request body
    const body: ExtractionRequestBody = await req.json();
    const { table } = body;

    if (!table || !table.table_number) {
      return NextResponse.json(
        { error: 'Invalid request: table information required' },
        { status: 400 }
      );
    }

    console.log(`[Extract] Extracting Table ${table.table_number}: ${table.caption || 'No caption'}`);

    // Get session
    const session = await getExtractionSession(sessionId);
    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    // Check state - allow analyzed, extracting, or extracted (for multiple table extractions)
    if (session.state !== 'analyzed' && session.state !== 'extracting' && session.state !== 'extracted') {
      return NextResponse.json(
        { error: `Invalid state: ${session.state}. Expected: analyzed, extracting, or extracted` },
        { status: 400 }
      );
    }

    // Update state to extracting
    await updateExtractionState(sessionId, 'extracting');

    // ═══════════════════════════════════════════════════════════════════
    // STEP 1: Load paper context (index from analysis phase)
    // ═══════════════════════════════════════════════════════════════════
    console.log(`[Extract] Loading paper context...`);

    const indexPath = `${sessionId}/paper-index.md`;
    let paperIndex = '';

    try {
      const indexBuffer = await downloadFile('extractions', indexPath);
      paperIndex = indexBuffer.toString('utf-8');
      console.log(`[Extract] ✓ Loaded paper index (${indexBuffer.length} bytes)`);
    } catch (error) {
      console.warn(`[Extract] ⚠ Could not load paper-index.md:`, error);
    }

    // ═══════════════════════════════════════════════════════════════════
    // STEP 2: Load plain text from PDF (more reliable than screenshots)
    // ═══════════════════════════════════════════════════════════════════
    console.log(`[Extract] Loading PDF plain text...`);

    const textPath = `${sessionId}/text/plain-text.txt`;
    let pdfText = '';

    try {
      const textBuffer = await downloadFile('extractions', textPath);
      pdfText = textBuffer.toString('utf-8');
      console.log(`[Extract] ✓ Loaded PDF text (${pdfText.length} characters)`);
    } catch (error) {
      console.error(`[Extract] ❌ Failed to load PDF text:`, error);
      await markSessionFailed(sessionId, `Failed to load PDF text: ${error}`, 'extract');
      return NextResponse.json(
        { error: 'PDF text not found - run analysis phase first' },
        { status: 400 }
      );
    }

    // Extract relevant section around the table's page
    let tableContext = pdfText;
    if (table.page_number) {
      const pageMarker = `--- Page ${table.page_number} ---`;
      const pageStart = pdfText.indexOf(pageMarker);
      if (pageStart !== -1) {
        // Get 3 pages of context (current + before + after)
        const prevPageMarker = `--- Page ${table.page_number - 1} ---`;
        const nextNextPageMarker = `--- Page ${table.page_number + 2} ---`;

        const contextStart = pdfText.indexOf(prevPageMarker);
        const contextEnd = pdfText.indexOf(nextNextPageMarker);

        const start = contextStart !== -1 ? contextStart : pageStart;
        const end = contextEnd !== -1 ? contextEnd : pdfText.length;

        tableContext = pdfText.substring(start, end);
        console.log(`[Extract] ✓ Extracted context for page ${table.page_number} (${tableContext.length} chars)`);
      }
    }

    // ═══════════════════════════════════════════════════════════════════
    // STEP 3: Create extraction prompt with paper context
    // ═══════════════════════════════════════════════════════════════════
    console.log(`[Extract] Creating extraction prompt...`);

    const systemPrompt = `You are a data extraction assistant specializing in scientific literature.

Your task: Extract the table from the provided text into CSV format with MAXIMUM ACCURACY.

## Instructions:

1. **Examine the text carefully** to find Table ${table.table_number}
2. **Extract the table structure** (headers and data rows)
3. **Count the exact number of columns**
4. **Use EXACT column headers** as shown in the text
5. **Preserve all data values** exactly as they appear (numbers, symbols, text)

## Formatting Rules:

- Return ONLY the CSV data (no markdown, no explanations)
- First row: Original column headers from table
- Subsequent rows: Data values
- Use commas as delimiters
- Quote text containing commas, quotes, or newlines
- Preserve ALL numeric precision (don't round)
- Keep inequality symbols: <, >, ≤, ≥
- Keep ranges as-is: "45-50", "149–132 Ma"
- Empty cells: leave blank (not "N/A" or "null")

## Quality Checks:

- Column count in CSV must match table exactly
- Row count in CSV must match table
- Data must align with headers
- No completely empty columns`;

    const userPrompt = `# Paper Context

${paperIndex ? `## Paper Index\n${paperIndex}\n` : ''}

# Table to Extract

**Table Number:** ${table.table_number}
**Caption:** ${table.caption || 'No caption provided'}
**Estimated Columns:** ${table.estimated_columns || 'Unknown'}
**Estimated Rows:** ${table.estimated_rows || 'Unknown'}
**Page Number:** ${table.page_number || 'Unknown'}

# Relevant Text from PDF

${tableContext}

# Instructions

Extract Table ${table.table_number} from the text above into CSV format.
Use the paper context to understand the domain and terminology.
Return ONLY the CSV data (no markdown code blocks, no explanations).`;

    // ═══════════════════════════════════════════════════════════════════
    // STEP 4: Send to Claude API
    // ═══════════════════════════════════════════════════════════════════
    console.log(`[Extract] Sending to Claude API...`);

    const response = await createMessageWithContent(
      systemPrompt,
      [
        {
          type: 'text',
          text: userPrompt,
        },
      ],
      {
        maxTokens: 8000,
        temperature: 0.1, // Low temperature for accurate extraction
      }
    );

    // Extract text response
    const contentBlock = response.content.find(block => block.type === 'text');
    if (!contentBlock || contentBlock.type !== 'text') {
      throw new Error('No text content in Claude response');
    }

    const csvResponse = contentBlock.text.trim();
    console.log(`[Extract] Received CSV response (${csvResponse.length} characters)`);

    // ═══════════════════════════════════════════════════════════════════
    // STEP 5: Parse and validate basic CSV structure
    // ═══════════════════════════════════════════════════════════════════
    console.log(`[Extract] Parsing CSV...`);

    let csvData: Array<Record<string, string>>;
    try {
      csvData = parseCSV(csvResponse);
      console.log(`[Extract] ✓ Parsed ${csvData.length} rows`);
    } catch (error) {
      console.error(`[Extract] ❌ CSV parse error:`, error);
      await markSessionFailed(sessionId, `Failed to parse CSV: ${error}`, 'extract');
      return NextResponse.json(
        { error: 'Failed to parse extracted CSV data', details: String(error) },
        { status: 500 }
      );
    }

    // Basic sanity check - must have at least 1 row
    if (csvData.length === 0) {
      console.error(`[Extract] ❌ No data extracted`);
      await markSessionFailed(sessionId, 'No data in extracted CSV', 'extract');
      return NextResponse.json(
        { error: 'Extraction returned no data' },
        { status: 500 }
      );
    }

    const columnCount = Object.keys(csvData[0] || {}).length;
    console.log(`[Extract] ✓ Extracted ${csvData.length} rows x ${columnCount} columns`);

    // ═══════════════════════════════════════════════════════════════════
    // STEP 6: Calculate basic stats (completeness)
    // ═══════════════════════════════════════════════════════════════════
    const totalCells = csvData.length * columnCount;
    let filledCells = 0;

    csvData.forEach(row => {
      Object.values(row).forEach(value => {
        if (value && value.trim() !== '') {
          filledCells++;
        }
      });
    });

    const completeness = totalCells > 0 ? (filledCells / totalCells) * 100 : 0;
    console.log(`[Extract] ✓ Completeness: ${completeness.toFixed(1)}% (${filledCells}/${totalCells} cells filled)`);

    // ═══════════════════════════════════════════════════════════════════
    // STEP 7: Save CSV to storage
    // ═══════════════════════════════════════════════════════════════════
    console.log(`[Extract] Saving CSV...`);

    const csvPath = `${sessionId}/tables/table-${table.table_number}.csv`;
    const csvContent = arrayToCSV(csvData);
    await uploadFile('extractions', csvPath, Buffer.from(csvContent, 'utf-8'), 'text/csv');

    console.log(`[Extract] ✓ Saved CSV to ${csvPath}`);

    // ═══════════════════════════════════════════════════════════════════
    // STEP 8: Update session state to extracted
    // ═══════════════════════════════════════════════════════════════════
    await updateExtractionState(sessionId, 'extracted');
    console.log(`[Extract] ✓ Session state updated to 'extracted'`);

    // ═══════════════════════════════════════════════════════════════════
    // STEP 9: Return success
    // ═══════════════════════════════════════════════════════════════════
    console.log(`[Extract] ✅ Extraction complete`);

    return NextResponse.json({
      success: true,
      sessionId,
      tableNumber: table.table_number,
      csvData,
      csvPath,
      stats: {
        totalRows: csvData.length,
        totalColumns: columnCount,
        completeness,
      },
    });

  } catch (error) {
    console.error(`[Extract] ❌ Extraction failed:`, error);

    await markSessionFailed(
      sessionId,
      `Extraction failed: ${error instanceof Error ? error.message : String(error)}`,
      'extract'
    );

    return NextResponse.json(
      {
        error: 'Extraction failed',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
