/**
 * POST /api/extraction/upload
 * Upload PDF for extraction workflow
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  generateSessionId,
  validatePDF,
  saveUploadedPDF,
  parseUploadedFile
} from '@/lib/utils/file-upload';
import { createExtractionSession } from '@/lib/db/extraction-queries';
import type { UploadResponse, ErrorResponse } from '@/lib/types/extraction-types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60; // 60 second timeout for uploads

export async function POST(req: NextRequest) {
  try {
    console.log('[Upload API] Processing PDF upload');

    // Parse multipart form data
    const formData = await req.formData();
    const file = await parseUploadedFile(formData);

    if (!file) {
      console.error('[Upload API] No PDF file provided in request');
      return NextResponse.json<ErrorResponse>(
        { error: 'No PDF file provided' },
        { status: 400 }
      );
    }

    console.log(`[Upload API] Received file: ${file.name}, size: ${file.size} bytes, type: ${file.type}`);

    // Validate PDF
    const validation = validatePDF(file);
    if (!validation.valid) {
      console.error(`[Upload API] Validation failed: ${validation.error}`);
      return NextResponse.json<ErrorResponse>(
        { error: validation.error! },
        { status: 400 }
      );
    }

    // Generate session ID
    const sessionId = generateSessionId();
    console.log(`[Upload API] Generated session ID: ${sessionId}`);

    // Save file to uploads directory
    const uploadedFile = await saveUploadedPDF(file, sessionId);
    console.log(`[Upload API] Saved file to: ${uploadedFile.path}`);

    // Create database record
    const session = await createExtractionSession(
      sessionId,
      file.name,
      uploadedFile.relativePath,
      file.size
    );

    console.log(`[Upload API] Created session record: ${session.id}`);

    // Return success response
    const response: UploadResponse = {
      success: true,
      sessionId: session.session_id,
      filename: session.pdf_filename,
      size: session.pdf_size_bytes,
    };

    return NextResponse.json(response, { status: 201 });

  } catch (error) {
    console.error('[Upload API] Upload error:', error);

    return NextResponse.json<ErrorResponse>(
      {
        error: 'Upload failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
