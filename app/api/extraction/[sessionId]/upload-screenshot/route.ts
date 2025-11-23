/**
 * POST /api/extraction/[sessionId]/upload-screenshot
 * Upload table screenshot from client-side generation
 */

import { NextRequest, NextResponse } from 'next/server';
import { uploadFile } from '@/lib/storage/supabase';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // 1 minute timeout

interface RouteParams {
  params: Promise<{
    sessionId: string;
  }>;
}

export async function POST(
  req: NextRequest,
  { params }: RouteParams
) {
  const { sessionId } = await params;

  try {
    // Get table number from query params
    const url = new URL(req.url);
    const tableNumber = url.searchParams.get('table');

    if (!tableNumber) {
      return NextResponse.json(
        { error: 'Missing table number parameter' },
        { status: 400 }
      );
    }

    console.log(`[Upload Screenshot API] Uploading screenshot for table ${tableNumber}`);

    // Get image blob from request body
    const blob = await req.blob();
    const buffer = Buffer.from(await blob.arrayBuffer());

    console.log(`[Upload Screenshot API] Received image (${buffer.length} bytes)`);

    // Upload to Supabase Storage
    const uploadPath = `${sessionId}/images/tables/table-${tableNumber}.png`;
    await uploadFile('extractions', uploadPath, buffer, 'image/png');

    console.log(`[Upload Screenshot API] ✓ Uploaded to ${uploadPath}`);

    return NextResponse.json({
      success: true,
      path: uploadPath,
    });

  } catch (error) {
    console.error(`[Upload Screenshot API] Error:`, error);

    return NextResponse.json(
      {
        error: 'Failed to upload screenshot',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
