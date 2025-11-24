/**
 * POST /api/extraction/confirm-upload
 * Confirm successful client-side upload and create database session
 */

import { NextRequest, NextResponse } from 'next/server';
import { createExtractionSession } from '@/lib/db/extraction-queries';
import type { UploadResponse, ErrorResponse } from '@/lib/types/extraction-types';

export const dynamic = 'force-dynamic';

interface ConfirmUploadRequest {
  sessionId: string;
  filename: string;
  fileSize: number;
  uploadPath: string;
}

export async function POST(req: NextRequest) {
  try {
    const body: ConfirmUploadRequest = await req.json();
    const { sessionId, filename, fileSize, uploadPath } = body;

    console.log(`[Confirm Upload] Creating session for: ${sessionId}`);

    // Create database record
    const session = await createExtractionSession(
      sessionId,
      filename,
      uploadPath,
      fileSize
    );

    console.log(`[Confirm Upload] Session created: ${session.id}`);

    // Return success response
    const response: UploadResponse = {
      success: true,
      sessionId: session.session_id,
      filename: session.pdf_filename,
      size: session.pdf_size_bytes,
    };

    return NextResponse.json(response, { status: 201 });

  } catch (error) {
    console.error('[Confirm Upload] Error:', error);

    return NextResponse.json<ErrorResponse>(
      {
        error: 'Failed to create session',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
