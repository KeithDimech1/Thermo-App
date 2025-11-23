/**
 * GET /api/extraction/[sessionId]/pdf
 * Download PDF for client-side screenshot generation
 */

import { NextRequest, NextResponse } from 'next/server';
import { downloadFile } from '@/lib/storage/supabase';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: Promise<{
    sessionId: string;
  }>;
}

export async function GET(
  _req: NextRequest,
  { params }: RouteParams
) {
  const { sessionId } = await params;

  try {
    console.log(`[PDF API] Downloading PDF for session: ${sessionId}`);

    // Download PDF from Supabase Storage
    const pdfBuffer = await downloadFile('extractions', `${sessionId}/original.pdf`);

    console.log(`[PDF API] Downloaded PDF (${pdfBuffer.length} bytes)`);

    // Return PDF with proper headers (convert Buffer to Uint8Array)
    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Length': pdfBuffer.length.toString(),
        'Cache-Control': 'private, max-age=3600', // Cache for 1 hour
      },
    });

  } catch (error) {
    console.error(`[PDF API] Error:`, error);

    return NextResponse.json(
      {
        error: 'Failed to download PDF',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
