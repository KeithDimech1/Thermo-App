/**
 * GET/DELETE /api/extraction/[sessionId]
 * Session management endpoints
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getExtractionSession,
  deleteExtractionSession
} from '@/lib/db/extraction-queries';
import { deleteSessionFiles } from '@/lib/utils/file-upload';
import type { SessionResponse, ErrorResponse } from '@/lib/types/extraction-types';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: Promise<{
    sessionId: string;
  }>;
}

/**
 * GET - Retrieve session metadata and current state
 */
export async function GET(
  _req: NextRequest,
  { params }: RouteParams
) {
  try {
    const { sessionId } = await params;
    console.log(`[Session API] GET request for session: ${sessionId}`);

    const session = await getExtractionSession(sessionId);

    if (!session) {
      console.log(`[Session API] Session not found: ${sessionId}`);
      return NextResponse.json<ErrorResponse>(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    console.log(`[Session API] Retrieved session: ${sessionId}, state: ${session.state}`);

    const response: SessionResponse = { session };
    return NextResponse.json(response);

  } catch (error) {
    console.error('[Session API] GET error:', error);

    return NextResponse.json<ErrorResponse>(
      {
        error: 'Failed to retrieve session',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Cancel extraction and delete all files
 */
export async function DELETE(
  _req: NextRequest,
  { params }: RouteParams
) {
  try {
    const { sessionId } = await params;
    console.log(`[Session API] DELETE request for session: ${sessionId}`);

    // Check if session exists
    const session = await getExtractionSession(sessionId);

    if (!session) {
      console.log(`[Session API] Session not found: ${sessionId}`);
      return NextResponse.json<ErrorResponse>(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    console.log(`[Session API] Deleting session: ${sessionId}`);

    // Delete files from filesystem
    try {
      await deleteSessionFiles(sessionId);
      console.log(`[Session API] Deleted files for session: ${sessionId}`);
    } catch (error) {
      console.error(`[Session API] Error deleting files: ${error}`);
      // Continue with database deletion even if file deletion fails
    }

    // Delete database record
    await deleteExtractionSession(sessionId);
    console.log(`[Session API] Deleted database record for session: ${sessionId}`);

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('[Session API] DELETE error:', error);

    return NextResponse.json<ErrorResponse>(
      {
        error: 'Failed to delete session',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
