/**
 * POST /api/extraction/[sessionId]/analyze
 * Analyze PDF using Anthropic API (Step 1 of extraction workflow)
 */

import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
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
  data_types_available: string[];
  quality_assessment: {
    has_sample_locations: boolean;
    has_analytical_details: boolean;
    has_grain_level_data: boolean;
    completeness_score: number;
  };
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
      dataTypes: analysisResult.data_types_available,
    });

    // Step 4: Update database with results
    await updatePaperMetadata(
      sessionId,
      analysisResult.paper_metadata,
      analysisResult.tables.length,
      analysisResult.data_types_available
    );

    console.log(`[Analyze API] Analysis complete for session: ${sessionId}`);

    // Return success response
    return NextResponse.json({
      success: true,
      sessionId,
      paper_metadata: analysisResult.paper_metadata,
      tables_found: analysisResult.tables.length,
      data_types: analysisResult.data_types_available,
      quality_score: analysisResult.quality_assessment.completeness_score,
      tables: analysisResult.tables,
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
