/**
 * POST /api/extraction/[sessionId]/extract
 * Extract table data from PDF using Anthropic API (Step 2 of extraction workflow)
 */

import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';
import {
  getExtractionSession,
  updateExtractionState,
  markSessionFailed,
} from '@/lib/db/extraction-queries';
import { extractPDFText } from '@/lib/utils/python-bridge';
import { createMessage } from '@/lib/anthropic/client';
import {
  EXTRACTION_SYSTEM_PROMPT,
  createExtractionUserMessage,
  type TableExtractionRequest,
} from '@/lib/anthropic/prompts';
import { parseCSV, getCSVStats, validateCSV, arrayToCSV } from '@/lib/extraction/csv-utils';
import { getFieldMapping } from '@/lib/extraction/field-mappings';
import {
  retryWithBackoff,
  analyzeExtractionError,
  generateRetryPrompt,
  calculateRetryMetrics,
} from '@/lib/extraction/extract-with-retry';
import type { TableInfo } from '@/lib/types/extraction-types';

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minute timeout for extraction

interface RouteParams {
  params: Promise<{
    sessionId: string;
  }>;
}

interface ExtractionRequestBody {
  table: TableInfo;
}

interface ExtractionResult {
  success: boolean;
  sessionId: string;
  tableNumber: number | string;
  csvData: Array<Record<string, string>>;
  csvPath: string;
  stats: {
    totalRows: number;
    totalColumns: number;
    completeness: number;
  };
}

/**
 * Core extraction logic that can be retried
 * @returns csvData and stats on success
 * @throws Error on validation failure
 */
async function extractTableAttempt(
  _sessionId: string,
  table: TableInfo,
  pdfText: string,
  pdfFilename: string,
  attemptNumber: number,
  previousError?: Error
): Promise<{ csvData: Array<Record<string, string>>; stats: ReturnType<typeof getCSVStats> }> {
  const dataType = table.data_type || 'Unknown';
  console.log(`[Extract] Attempt ${attemptNumber} for Table ${table.table_number} (${dataType})`);

  // Create extraction prompts
  const extractionRequest: TableExtractionRequest = {
    tableNumber: table.table_number,
    tableCaption: table.caption || 'No caption',
    dataType: dataType,
    pdfText,
    filename: pdfFilename,
  };
  let userMessage = createExtractionUserMessage(extractionRequest);

  // Adjust prompt on retry
  if (attemptNumber > 1 && previousError) {
    console.log(`[Extract] Adjusting prompt based on previous error...`);
    const analysis = analyzeExtractionError(previousError);
    console.log(`[Extract] Error type: ${analysis.errorType}, severity: ${analysis.severity}`);
    userMessage = generateRetryPrompt(userMessage, previousError, attemptNumber);
  }

  // Call Claude API
  console.log(`[Extract] Sending to Claude API...`);
  const response = await createMessage(
    EXTRACTION_SYSTEM_PROMPT,
    userMessage,
    {
      maxTokens: 8000,
      temperature: 0.1,
    }
  );

  // Extract text content from response
  const contentBlock = response.content.find(block => block.type === 'text');
  if (!contentBlock || contentBlock.type !== 'text') {
    throw new Error('No text content in Claude response');
  }

  const csvText = contentBlock.text;
  console.log(`[Extract] Received CSV response: ${csvText.substring(0, 200)}...`);

  // Parse CSV
  let csvData: Array<Record<string, string>>;
  try {
    csvData = parseCSV(csvText);
    console.log(`[Extract] Parsed ${csvData.length} rows`);
  } catch (error) {
    console.error(`[Extract] CSV parse error:`, error);
    throw new Error('Failed to parse extracted CSV data');
  }

  // Get CSV statistics
  const stats = getCSVStats(csvData);
  console.log(`[Extract] Stats: ${stats.totalRows} rows, ${stats.totalColumns} columns, ${stats.completeness.toFixed(1)}% complete`);

  // ═══════════════════════════════════════════════════════════════════
  // PHASE 1: CRITICAL VALIDATION CHECKS
  // ═══════════════════════════════════════════════════════════════════

  // Validation 1: Column Count Check (≥90% of expected)
  const expectedColumns = table.estimated_columns || 5;
  const columnCompleteness = (stats.totalColumns / expectedColumns) * 100;

  if (columnCompleteness < 90) {
    const errorMsg =
      `Column count validation FAILED:\n` +
      `  Expected: ${expectedColumns} columns\n` +
      `  Found: ${stats.totalColumns} columns\n` +
      `  Completeness: ${columnCompleteness.toFixed(1)}%\n` +
      `  Threshold: ≥90%\n\n` +
      `This indicates the table extraction may have missed columns. ` +
      `Common causes: merged columns, complex headers, or parsing errors.`;

    console.error(`[Extract] ${errorMsg}`);
    throw new Error(errorMsg);
  }
  console.log(`[Extract] ✓ Column count validation passed (${columnCompleteness.toFixed(1)}%)`);

  // Validation 2: Empty Column Detection (≤10% empty columns)
  const emptyColumns = stats.fieldStats.filter(f => f.fillRate === 0);
  const emptyColumnPct = (emptyColumns.length / stats.totalColumns) * 100;

  if (emptyColumnPct > 10) {
    const emptyColNames = emptyColumns.map(c => c.field).join(', ');
    const errorMsg =
      `Empty column validation FAILED:\n` +
      `  Empty columns: ${emptyColumns.length}/${stats.totalColumns}\n` +
      `  Percentage: ${emptyColumnPct.toFixed(1)}%\n` +
      `  Threshold: ≤10%\n` +
      `  Columns: ${emptyColNames}\n\n` +
      `Too many columns are completely empty. This indicates a parsing failure. ` +
      `The extraction likely misaligned data or failed to detect column boundaries.`;

    console.error(`[Extract] ${errorMsg}`);
    throw new Error(errorMsg);
  }
  console.log(`[Extract] ✓ Empty column check passed (${emptyColumnPct.toFixed(1)}% empty)`);

  // Validation 3: Overall Data Completeness (≥50%)
  if (stats.completeness < 50) {
    const errorMsg =
      `Data completeness validation FAILED:\n` +
      `  Completeness: ${stats.completeness.toFixed(1)}%\n` +
      `  Threshold: ≥50%\n\n` +
      `More than half of the cells are empty. This indicates a catastrophic extraction failure. ` +
      `The table structure was likely not detected correctly. Consider using a different ` +
      `extraction method or manual correction.`;

    console.error(`[Extract] ${errorMsg}`);
    throw new Error(errorMsg);
  }
  console.log(`[Extract] ✓ Data completeness check passed (${stats.completeness.toFixed(1)}%)`);

  // ═══════════════════════════════════════════════════════════════════
  // PHASE 2: FIELD MAPPING VALIDATION
  // ═══════════════════════════════════════════════════════════════════

  if (table.data_type && table.data_type !== 'Unknown') {
    const mapping = getFieldMapping(table.data_type);
    if (mapping) {
      console.log(`[Extract] Running field mapping validation for ${mapping.tableName}...`);
      const validation = validateCSV(csvData, mapping);

      if (!validation.valid) {
        const errorMsg = validation.errors
          .slice(0, 10) // Limit to first 10 errors
          .map(e => `  Row ${e.row}, ${e.field}: ${e.message}`)
          .join('\n');

        const fullErrorMsg =
          `Field validation failed:\n${errorMsg}` +
          (validation.errors.length > 10 ? `\n  ... and ${validation.errors.length - 10} more errors` : '');

        console.error(`[Extract] ${fullErrorMsg}`);
        throw new Error(fullErrorMsg);
      }

      if (validation.warnings.length > 0) {
        console.warn(`[Extract] Field mapping warnings (${validation.warnings.length}):`);
        validation.warnings.slice(0, 5).forEach(w => {
          console.warn(`  Row ${w.row}, ${w.field}: ${w.message}`);
        });
      }

      console.log(`[Extract] ✓ Field mapping validation passed`);
    } else {
      console.log(`[Extract] No field mapping found for data type: ${table.data_type}`);
    }
  }

  console.log(`[Extract] ✅ All validation checks passed (attempt ${attemptNumber})`);

  return { csvData, stats };
}

export async function POST(
  req: NextRequest,
  { params }: RouteParams
) {
  const { sessionId } = await params;

  try {
    console.log(`[Extract API] Starting extraction for session: ${sessionId}`);

    // Parse request body
    const body: ExtractionRequestBody = await req.json();
    const { table } = body;

    if (!table || !table.table_number) {
      return NextResponse.json(
        { error: 'Invalid request: table information required' },
        { status: 400 }
      );
    }

    const dataType = table.data_type || 'Unknown';
    console.log(`[Extract API] Extracting Table ${table.table_number} (${dataType})`);

    // Get session
    const session = await getExtractionSession(sessionId);
    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    // Check state
    if (session.state !== 'analyzed' && session.state !== 'extracting') {
      return NextResponse.json(
        { error: `Invalid state: ${session.state}. Expected: analyzed or extracting` },
        { status: 400 }
      );
    }

    // Update state to extracting (if not already)
    if (session.state !== 'extracting') {
      await updateExtractionState(sessionId, 'extracting', 2);
      console.log(`[Extract API] State updated to extracting`);
    }

    // Load cached text from plain-text.txt (extracted during analysis)
    const sessionDir = path.join(process.cwd(), 'public', 'uploads', sessionId);
    const plainTextPath = path.join(sessionDir, 'text', 'plain-text.txt');

    console.log(`[Extract API] Loading cached text from ${plainTextPath}...`);
    let pdfText: string;
    try {
      pdfText = await fs.readFile(plainTextPath, 'utf-8');
      console.log(`[Extract API] Loaded ${pdfText.length} characters from cache`);
    } catch (error) {
      // Fallback: Extract text if cache doesn't exist (shouldn't happen)
      console.warn(`[Extract API] Cache miss - extracting text from PDF...`);
      const pdfPath = path.join(process.cwd(), 'public', session.pdf_path);
      pdfText = await extractPDFText(pdfPath);
      console.log(`[Extract API] Extracted ${pdfText.length} characters`);
    }

    // ═══════════════════════════════════════════════════════════════════
    // PHASE 2: RETRY WRAPPER WITH VALIDATION
    // ═══════════════════════════════════════════════════════════════════

    console.log(`[Extract API] Starting extraction with retry wrapper...`);
    let lastError: Error | undefined;

    const retryResult = await retryWithBackoff<{ csvData: Array<Record<string, string>>; stats: ReturnType<typeof getCSVStats> }>(
      async (attemptNumber) => {
        return await extractTableAttempt(
          sessionId,
          table,
          pdfText,
          session.pdf_filename,
          attemptNumber,
          lastError
        );
      },
      {
        maxRetries: 3,
        initialDelayMs: 1000,
        maxDelayMs: 5000,
        backoffMultiplier: 2,
      },
      (error, attemptNumber) => {
        // Callback on each failed attempt
        lastError = error;
        console.error(`[Extract API] Attempt ${attemptNumber} failed: ${error.message}`);
      }
    );

    if (!retryResult.success || !retryResult.data) {
      const metrics = calculateRetryMetrics(sessionId, table.table_number, retryResult);
      console.error(`[Extract API] All retry attempts exhausted:`, metrics);
      throw retryResult.finalError || new Error('Extraction failed after all retries');
    }

    const { csvData, stats } = retryResult.data;
    const metrics = calculateRetryMetrics(sessionId, table.table_number, retryResult);

    console.log(`[Extract API] ✅ Extraction succeeded on attempt ${metrics.successfulAttempt}/${metrics.totalAttempts}`);
    console.log(`[Extract API] Total duration: ${metrics.totalDurationMs}ms`);

    // ═══════════════════════════════════════════════════════════════════

    // Save CSV to file
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', sessionId);
    await fs.mkdir(uploadsDir, { recursive: true });

    const csvFilename = `table_${table.table_number}.csv`;
    const csvPath = path.join(uploadsDir, csvFilename);
    const csvText = arrayToCSV(csvData);
    await fs.writeFile(csvPath, csvText);

    const relativeCsvPath = `uploads/${sessionId}/${csvFilename}`;
    console.log(`[Extract API] CSV saved to: ${relativeCsvPath}`);

    // Return success response
    const result: ExtractionResult = {
      success: true,
      sessionId,
      tableNumber: table.table_number,
      csvData,
      csvPath: relativeCsvPath,
      stats: {
        totalRows: stats.totalRows,
        totalColumns: stats.totalColumns,
        completeness: stats.completeness,
      },
    };

    console.log(`[Extract API] Extraction complete for Table ${table.table_number}`);

    return NextResponse.json(result);

  } catch (error) {
    console.error(`[Extract API] Error:`, error);

    // Mark session as failed
    try {
      await markSessionFailed(
        sessionId,
        error instanceof Error ? error.message : 'Extraction failed',
        'extract'
      );
    } catch (dbError) {
      console.error(`[Extract API] Failed to mark session as failed:`, dbError);
    }

    return NextResponse.json(
      {
        error: 'Extraction failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
