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
  updateExtractionTokens,
} from '@/lib/db/extraction-queries';
import { createMessageWithContent, extractTokenUsage, formatCost } from '@/lib/anthropic/client';
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
    // STEP 2: Load table screenshot (generated client-side)
    // ═══════════════════════════════════════════════════════════════════
    console.log(`[Extract] Loading table screenshot...`);

    const screenshotPath = `${sessionId}/images/tables/table-${table.table_number}.png`;
    let tableScreenshotBase64: string | undefined;

    try {
      const screenshotBuffer = await downloadFile('extractions', screenshotPath);
      tableScreenshotBase64 = screenshotBuffer.toString('base64');
      console.log(`[Extract] ✓ Loaded table screenshot (${screenshotBuffer.length} bytes)`);
    } catch (error) {
      console.error(`[Extract] ❌ Failed to load table screenshot:`, error);
      await markSessionFailed(sessionId, `Failed to load table screenshot: ${error}`, 'extract');
      return NextResponse.json(
        { error: 'Table screenshot not found - screenshots are generated during analysis phase' },
        { status: 400 }
      );
    }

    // ═══════════════════════════════════════════════════════════════════
    // STEP 3: Create extraction prompt with paper context
    // ═══════════════════════════════════════════════════════════════════
    console.log(`[Extract] Creating extraction prompt...`);

    const systemPrompt = `You are a data extraction assistant specializing in scientific literature.

Your task: Extract the table from the provided screenshot into CSV format with MAXIMUM ACCURACY.

## Instructions:

1. **Examine the table screenshot carefully**
2. **Count the exact number of columns** in the image
3. **Extract ALL rows** maintaining the exact column structure
4. **Use EXACT column headers** as shown in the image
5. **Preserve all data values** exactly as they appear (numbers, symbols, text)

## Formatting Rules:

- Return ONLY the CSV data (no markdown, no explanations)
- First row: Original column headers from image
- Subsequent rows: Data values
- Use commas as delimiters
- Quote text containing commas, quotes, or newlines
- Preserve ALL numeric precision (don't round)
- Keep inequality symbols: <, >, ≤, ≥
- Keep ranges as-is: "45-50", "149–132 Ma"
- Empty cells: leave blank (not "N/A" or "null")

## Quality Checks:

- Column count in CSV must match image EXACTLY
- Row count in CSV must match image
- Data must align with headers
- No completely empty columns`;

    const userPrompt = `# Paper Context

${paperIndex ? `## Paper Index\n${paperIndex}\n` : ''}

# Table to Extract

**Table Number:** ${table.table_number}
**Caption:** ${table.caption || 'No caption provided'}
**Estimated Columns:** ${table.estimated_columns || 'Unknown'}
**Estimated Rows:** ${table.estimated_rows || 'Unknown'}

# Instructions

Extract the table from the screenshot below into CSV format.
Use the paper context above to understand the domain and terminology.
Return ONLY the CSV data (no markdown code blocks, no explanations).`;

    // ═══════════════════════════════════════════════════════════════════
    // STEP 4: Send to Claude API
    // ═══════════════════════════════════════════════════════════════════
    console.log(`[Extract] Sending to Claude API...`);

    const response = await createMessageWithContent(
      systemPrompt,
      [
        {
          type: 'image',
          source: {
            type: 'base64',
            media_type: 'image/png',
            data: tableScreenshotBase64,
          },
        },
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

    // Track token usage for cost analysis (extraction stage - called once per table)
    const tokenUsage = extractTokenUsage(response);
    await updateExtractionTokens(
      sessionId,
      'extraction',
      tokenUsage.input_tokens,
      tokenUsage.output_tokens
    );
    console.log(
      `[Extract] Table ${table.table_number} - Tokens: ${tokenUsage.total_tokens}, Cost: ${formatCost(tokenUsage.cost_usd)}`
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
