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

    // Convert base64 to buffer
    // Format: "data:image/png;base64,iVBORw0KGgo..."
    const base64Data = croppedImageData.split(',')[1];
    if (!base64Data) {
      return NextResponse.json(
        { error: 'Invalid image data format' },
        { status: 400 }
      );
    }
    const imageBuffer = Buffer.from(base64Data, 'base64');

    // Generate new filename
    const fileExtension = originalFileName.split('.').pop() || 'png';
    const baseName = originalFileName.replace(/\.(png|jpg|jpeg|tiff)$/i, '');
    const croppedFileName = `${baseName}_cropped.${fileExtension}`;

    // Upload to Supabase Storage
    const croppedImageUrl = await uploadFile(
      'datasets',
      `${datasetId}/tables/${croppedFileName}`,
      imageBuffer,
      `image/${fileExtension}`
    );

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
