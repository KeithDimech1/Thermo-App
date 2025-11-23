/**
 * POST /api/extraction/[sessionId]/extract
 * Extract table data from PDF using Anthropic API (Step 2 of extraction workflow)
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
  markSessionFailed,
} from '@/lib/db/extraction-queries';
import { extractPDFText } from '@/lib/utils/python-bridge';
import { createMessage, createMessageWithContent } from '@/lib/anthropic/client';
import { downloadFile, uploadFile } from '@/lib/storage/supabase';
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
  tableScreenshotBase64?: string,
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

  // Call Claude API (with visual validation if screenshot available)
  console.log(`[Extract] Sending to Claude API${tableScreenshotBase64 ? ' (with table screenshot)' : ''}...`);

  const response = tableScreenshotBase64
    ? await createMessageWithContent(
        EXTRACTION_SYSTEM_PROMPT,
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
            text: userMessage + '\n\n**CRITICAL: You have been provided with a screenshot of the actual table from the PDF. You MUST visually validate your extraction against this image to ensure accuracy.**',
          },
        ],
        {
          maxTokens: 8000,
          temperature: 0.1,
        }
      )
    : await createMessage(
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

  const csvResponse = contentBlock.text;
  console.log(`[Extract] Received CSV response: ${csvResponse.substring(0, 200)}...`);

  // Parse CSV
  let csvData: Array<Record<string, string>>;
  try {
    csvData = parseCSV(csvResponse);
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
  // PHASE 2: FIELD MAPPING VALIDATION (if data type is known)
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
    }
  }

  // ═══════════════════════════════════════════════════════════════════
  // PHASE 2B: AI-BASED QUALITY VALIDATION (data-agnostic)
  // ═══════════════════════════════════════════════════════════════════

  console.log(`[Extract] Running AI-based quality validation...`);

  // Convert CSV to text for Claude to review
  const csvText = arrayToCSV(csvData);

  // Get a sample of the PDF text around the table for context
  const pdfTextSample = pdfText.substring(0, 30000); // First 30k chars for context

  // Create validation prompt
  const validationPrompt = `Review the quality of this extracted table data.

**Original Table Caption:** ${table.caption || 'No caption'}

**Expected Table Characteristics:**
- Table Number: ${table.table_number}
- Estimated Rows: ${table.estimated_rows || 'Unknown'}
- Estimated Columns: ${table.estimated_columns || 'Unknown'}

**Extracted CSV:**
\`\`\`csv
${csvText.substring(0, 5000)}${csvText.length > 5000 ? '\n... (truncated)' : ''}
\`\`\`

**CSV Statistics:**
- Rows: ${stats.totalRows}
- Columns: ${stats.totalColumns}
- Completeness: ${stats.completeness.toFixed(1)}%

**Original PDF Text (context):**
\`\`\`
${pdfTextSample}
\`\`\`

## Your Task:

Review the extracted CSV and determine if it's a HIGH-QUALITY extraction. Check for:

1. **Data Integrity Issues:**
   - Are cells excessively long (>200 characters)?
   - Are there obvious concatenation errors (e.g., "149–132 Ma Lu-Hf garneta b")?
   - Are numeric values mixed with text inappropriately?
   - Are superscripts/subscripts incorrectly merged with data?

2. **Structural Issues:**
   - Do column headers make sense?
   - Is data aligned properly in columns?
   - Are there missing rows or columns?

3. **Completeness:**
   - Does the row count match expectations?
   - Are critical columns present?

## Response Format:

Return a JSON object:
\`\`\`json
{
  "valid": true/false,
  "quality_score": 0-100,
  "issues": [
    {
      "severity": "critical" | "high" | "medium" | "low",
      "category": "data_integrity" | "structure" | "completeness" | "formatting",
      "description": "Detailed description of the issue",
      "location": "Row X, Column Y" or "General"
    }
  ],
  "recommendation": "accept" | "retry" | "manual_review"
}
\`\`\`

**Guidelines:**
- quality_score < 70: Set valid=false, recommendation="retry" (poor quality)
- quality_score 70-84: Set valid=false, recommendation="retry" (moderate issues)
- quality_score 85-94: Set valid=true, recommendation="accept" (good quality with minor issues)
- quality_score >= 95: Set valid=true, recommendation="accept" (excellent quality)
- Critical or high-severity issues always result in valid=false
- Medium-severity issues with footnote/superscript problems should fail

Return ONLY the JSON object, no explanations.`;

  // Call Claude for validation (with visual comparison if screenshot available)
  console.log(`[Extract] Sending CSV to Claude for quality review${tableScreenshotBase64 ? ' (with visual comparison)' : ''}...`);

  const validationResponse = tableScreenshotBase64
    ? await createMessageWithContent(
        'You are a data extraction quality reviewer. Your task is to analyze extracted table data and identify quality issues.',
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
            text: validationPrompt + '\n\n**CRITICAL: You have been provided with a screenshot of the actual table from the PDF. You MUST compare the extracted CSV against this visual image to verify accuracy. Check that all values match the visual table exactly.**',
          },
        ],
        {
          maxTokens: 2000,
          temperature: 0.0, // Deterministic
        }
      )
    : await createMessage(
        'You are a data extraction quality reviewer. Your task is to analyze extracted table data and identify quality issues.',
        validationPrompt,
        {
          maxTokens: 2000,
          temperature: 0.0, // Deterministic
        }
      );

  // Parse validation response
  const validationContentBlock = validationResponse.content.find(block => block.type === 'text');
  if (!validationContentBlock || validationContentBlock.type !== 'text') {
    console.warn(`[Extract] No validation response from Claude, proceeding with extraction`);
  } else {
    try {
      const validationText = validationContentBlock.text
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();

      const validationResult = JSON.parse(validationText);
      console.log(`[Extract] AI validation result: ${validationResult.valid ? 'PASS' : 'FAIL'} (score: ${validationResult.quality_score}/100)`);

      if (validationResult.issues && validationResult.issues.length > 0) {
        console.log(`[Extract] Issues found (${validationResult.issues.length}):`);
        validationResult.issues.slice(0, 5).forEach((issue: any) => {
          console.log(`  ${issue.severity.toUpperCase()}: ${issue.description} (${issue.location})`);
        });
      }

      // If validation fails, throw error with Claude's feedback
      // Threshold: 85/100 - we want high-quality extractions
      if (!validationResult.valid || validationResult.quality_score < 85) {
        const criticalIssues = validationResult.issues
          .filter((i: any) => i.severity === 'critical' || i.severity === 'high')
          .slice(0, 5);

        const errorMsg =
          `AI quality validation FAILED (score: ${validationResult.quality_score}/100):\n` +
          criticalIssues.map((i: any) => `  - ${i.description} (${i.location})`).join('\n') +
          (validationResult.issues.length > 5 ? `\n  ... and ${validationResult.issues.length - 5} more issues` : '');

        console.error(`[Extract] ${errorMsg}`);
        throw new Error(errorMsg);
      }

      console.log(`[Extract] ✓ AI quality validation passed (score: ${validationResult.quality_score}/100)`);
    } catch (parseError) {
      console.warn(`[Extract] Failed to parse validation response:`, parseError);
      console.warn(`[Extract] Proceeding with extraction despite validation parse error`);
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

    // Load cached text from Supabase Storage (extracted during analysis)
    console.log(`[Extract API] Loading cached text from Supabase Storage...`);
    let pdfText: string;
    try {
      const textBuffer = await downloadFile('extractions', `${sessionId}/text/plain-text.txt`);
      pdfText = textBuffer.toString('utf-8');
      console.log(`[Extract API] Loaded ${pdfText.length} characters from cache`);
    } catch (error) {
      // Fallback: Extract text if cache doesn't exist (shouldn't happen)
      console.warn(`[Extract API] Cache miss - extracting text from PDF...`);

      // Download PDF to temp file and extract text
      const pdfBuffer = await downloadFile('extractions', `${sessionId}/original.pdf`);
      const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'thermo-'));
      const tempPdfPath = path.join(tempDir, 'temp.pdf');
      await fs.writeFile(tempPdfPath, pdfBuffer);

      pdfText = await extractPDFText(tempPdfPath);

      // Clean up temp file
      await fs.rm(tempDir, { recursive: true, force: true });

      console.log(`[Extract API] Extracted ${pdfText.length} characters`);
    }

    // ═══════════════════════════════════════════════════════════════════
    // PHASE 2: DOWNLOAD TABLE SCREENSHOT FOR VISUAL VALIDATION
    // ═══════════════════════════════════════════════════════════════════

    console.log(`[Extract API] Downloading table screenshot for visual validation...`);
    let tableScreenshotBase64: string | undefined;

    try {
      const screenshotPath = `${sessionId}/images/tables/table-${table.table_number}.png`;
      const screenshotBuffer = await downloadFile('extractions', screenshotPath);
      tableScreenshotBase64 = screenshotBuffer.toString('base64');
      console.log(`[Extract API] ✓ Table screenshot loaded (${screenshotBuffer.length} bytes)`);
    } catch (error) {
      console.warn(`[Extract API] ⚠ Table screenshot not found - proceeding without visual validation`);
      console.warn(`[Extract API] Screenshot path: ${sessionId}/images/tables/table-${table.table_number}.png`);
      // Continue without screenshot - extraction will work but without visual validation
    }

    // ═══════════════════════════════════════════════════════════════════
    // PHASE 3: RETRY WRAPPER WITH VALIDATION
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
          tableScreenshotBase64,
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

    // Upload CSV to Supabase Storage
    const csvFilename = `table_${table.table_number}.csv`;
    const csvText = arrayToCSV(csvData);

    const csvUrl = await uploadFile(
      'extractions',
      `${sessionId}/extracted/${csvFilename}`,
      Buffer.from(csvText, 'utf-8'),
      'text/csv'
    );

    console.log(`[Extract API] CSV uploaded to: ${csvUrl}`);

    // Update session state to 'extracted'
    await updateExtractionState(sessionId, 'extracted', 3);
    console.log(`[Extract API] State updated to extracted`);

    // Return success response
    const result: ExtractionResult = {
      success: true,
      sessionId,
      tableNumber: table.table_number,
      csvData,
      csvPath: csvUrl, // Supabase Storage URL
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
