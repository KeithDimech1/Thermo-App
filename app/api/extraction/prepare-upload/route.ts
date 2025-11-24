/**
 * POST /api/extraction/prepare-upload
 * Prepare for direct client-side upload to Supabase Storage
 * Returns session ID for direct upload
 */

import { NextRequest, NextResponse } from 'next/server';
import { generateSessionId } from '@/lib/utils/file-upload';

export const dynamic = 'force-dynamic';

interface PrepareUploadRequest {
  filename: string;
  fileSize: number;
  mimeType: string;
}

export async function POST(req: NextRequest) {
  try {
    const body: PrepareUploadRequest = await req.json();
    const { filename, fileSize, mimeType } = body;

    // Validate file type
    if (mimeType !== 'application/pdf') {
      return NextResponse.json(
        { error: 'Only PDF files are supported' },
        { status: 400 }
      );
    }

    // Validate file size (max 500MB)
    if (fileSize > 500 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File size exceeds 500MB limit' },
        { status: 400 }
      );
    }

    // Generate session ID
    const sessionId = generateSessionId();

    console.log(`[Prepare Upload] Session: ${sessionId}, File: ${filename}, Size: ${(fileSize / 1024 / 1024).toFixed(2)} MB`);

    // Return session info (client will upload directly to Supabase)
    return NextResponse.json({
      success: true,
      sessionId,
      uploadPath: `${sessionId}/original.pdf`,
      bucket: 'extractions',
    });

  } catch (error) {
    console.error('[Prepare Upload] Error:', error);
    return NextResponse.json(
      { error: 'Failed to prepare upload' },
      { status: 500 }
    );
  }
}
