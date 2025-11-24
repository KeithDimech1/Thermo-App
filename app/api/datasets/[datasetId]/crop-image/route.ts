/**
 * POST /api/datasets/[datasetId]/crop-image
 *
 * Crops an image and updates the data_files record
 *
 * Request body:
 * - fileId: number - ID of the data_files record
 * - croppedImageData: string - Base64-encoded cropped image
 * - originalFileName: string - Original filename
 *
 * Response:
 * - success: boolean
 * - newImageUrl: string - URL of the cropped image
 */

import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db/connection';
import { uploadFile } from '@/lib/storage/supabase';

// Increase body size limit for large base64 images
export const maxDuration = 30; // 30 seconds max execution time
export const dynamic = 'force-dynamic';

interface CropImageRequest {
  fileId: number;
  croppedImageData: string; // Base64 data URL
  originalFileName: string;
}

interface CropImageResponse {
  success: boolean;
  newImageUrl: string;
}

interface RouteParams {
  params: Promise<{
    datasetId: string;
  }>;
}

export async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
  const { datasetId } = await params;

  try {
    const body: CropImageRequest = await request.json();
    const { fileId, croppedImageData, originalFileName } = body;

    // Validate inputs
    if (!fileId || !croppedImageData || !originalFileName) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get the original file record
    const originalFile = await queryOne<{
      id: number;
      file_path: string;
      file_name: string;
      dataset_id: number;
    }>(
      'SELECT id, file_path, file_name, dataset_id FROM data_files WHERE id = $1',
      [fileId]
    );

    if (!originalFile) {
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      );
    }

    // Verify dataset ID matches
    if (originalFile.dataset_id !== parseInt(datasetId)) {
      return NextResponse.json(
        { error: 'Dataset ID mismatch' },
        { status: 403 }
      );
    }

    console.log('[Crop API] Received request:', {
      datasetId,
      fileId,
      originalFileName,
      dataSize: croppedImageData?.length || 0
    });

    // Convert base64 to buffer
    // Format: "data:image/png;base64,..." or "data:image/jpeg;base64,..."
    const base64Data = croppedImageData.split(',')[1];
    if (!base64Data) {
      console.error('[Crop API] Invalid image data format');
      return NextResponse.json(
        { error: 'Invalid image data format' },
        { status: 400 }
      );
    }

    // Detect mime type from base64 header
    const mimeMatch = croppedImageData.match(/data:image\/([a-z]+);base64,/);
    const detectedType = mimeMatch?.[1] || 'jpeg';

    const imageBuffer = Buffer.from(base64Data, 'base64');
    console.log('[Crop API] Image buffer created:', imageBuffer.length, 'bytes');

    // Generate new filename with detected type
    const baseName = originalFileName.replace(/\.(png|jpg|jpeg|tiff)$/i, '');
    const croppedFileName = `${baseName}_cropped.${detectedType}`;

    // Upload to Supabase Storage
    console.log('[Crop API] Uploading to Supabase:', croppedFileName);
    const croppedImageUrl = await uploadFile(
      'datasets',
      `${datasetId}/tables/${croppedFileName}`,
      imageBuffer,
      `image/${detectedType}`
    );
    console.log('[Crop API] Upload complete:', croppedImageUrl);

    // Update data_files record with new path
    await query(
      `UPDATE data_files
       SET file_path = $1,
           file_name = $2,
           file_size_bytes = $3,
           updated_at = NOW()
       WHERE id = $4`,
      [croppedImageUrl, croppedFileName, imageBuffer.length, fileId]
    );

    console.log(`[Crop] Cropped image uploaded: ${croppedFileName} (${imageBuffer.length} bytes)`);

    const response: CropImageResponse = {
      success: true,
      newImageUrl: croppedImageUrl
    };

    return NextResponse.json(response);

  } catch (error: any) {
    console.error('[Crop] Error:', error);

    return NextResponse.json(
      {
        error: 'Failed to crop image',
        details: error.message || 'Unknown error'
      },
      { status: 500 }
    );
  }
}
