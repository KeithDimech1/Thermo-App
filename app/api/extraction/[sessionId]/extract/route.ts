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
import { parseCSV, getCSVStats } from '@/lib/extraction/csv-utils';
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
  tableNumber: number;
  csvData: Array<Record<string, string>>;
  csvPath: string;
  stats: {
    totalRows: number;
    totalColumns: number;
    completeness: number;
  };
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

    if (!table || !table.table_number || !table.data_type) {
      return NextResponse.json(
        { error: 'Invalid request: table information required' },
        { status: 400 }
      );
    }

    console.log(`[Extract API] Extracting Table ${table.table_number} (${table.data_type})`);

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

    // Get PDF path and extract text
    const pdfPath = path.join(process.cwd(), 'public', session.pdf_path);
    console.log(`[Extract API] Extracting text from PDF...`);
    const pdfText = await extractPDFText(pdfPath);
    console.log(`[Extract API] Extracted ${pdfText.length} characters`);

    // Create extraction prompts
    const extractionRequest: TableExtractionRequest = {
      tableNumber: table.table_number,
      tableCaption: table.caption,
      dataType: table.data_type,
      pdfText,
      filename: session.pdf_filename,
    };
    const userMessage = createExtractionUserMessage(extractionRequest);

    // Call Claude API
    console.log(`[Extract API] Sending to Claude API...`);
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
    console.log(`[Extract API] Received CSV response: ${csvText.substring(0, 200)}...`);

    // Parse CSV
    let csvData: Array<Record<string, string>>;
    try {
      csvData = parseCSV(csvText);
      console.log(`[Extract API] Parsed ${csvData.length} rows`);
    } catch (error) {
      console.error(`[Extract API] CSV parse error:`, error);
      throw new Error('Failed to parse extracted CSV data');
    }

    // Get CSV statistics
    const stats = getCSVStats(csvData);
    console.log(`[Extract API] Stats: ${stats.totalRows} rows, ${stats.totalColumns} columns, ${stats.completeness.toFixed(1)}% complete`);

    // Save CSV to file
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', sessionId);
    await fs.mkdir(uploadsDir, { recursive: true });

    const csvFilename = `table_${table.table_number}.csv`;
    const csvPath = path.join(uploadsDir, csvFilename);
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
