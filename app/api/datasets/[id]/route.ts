import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db/connection';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

/**
 * DELETE /api/datasets/[id]
 *
 * Deletes a dataset and all associated data:
 * - Database records (CASCADE handles related tables)
 * - Storage folder in datasets bucket
 * - Storage folder in extractions bucket (if associated extraction exists)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const datasetId = parseInt(id, 10);

    if (isNaN(datasetId)) {
      return NextResponse.json(
        { error: 'Invalid dataset ID' },
        { status: 400 }
      );
    }

    // 1. Get extraction session ID (if exists) before deleting dataset
    const extractionResult = await query<{ session_id: string }>(
      'SELECT session_id FROM extraction_sessions WHERE dataset_id = $1',
      [datasetId]
    );
    const extractionSessionId = extractionResult.length > 0 ? extractionResult[0].session_id : null;

    // 2. Delete dataset from database (CASCADE will handle all related tables)
    const deleteResult = await query(
      'DELETE FROM datasets WHERE id = $1 RETURNING id',
      [datasetId]
    );

    if (deleteResult.length === 0) {
      return NextResponse.json(
        { error: 'Dataset not found' },
        { status: 404 }
      );
    }

    // 3. Delete dataset storage folder (datasets bucket)
    await deleteStorageFolder('datasets', id);

    // 4. Delete extraction storage folder (extractions bucket) if exists
    if (extractionSessionId) {
      await deleteStorageFolder('extractions', extractionSessionId);
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Dataset deleted successfully',
        deletedDatasetId: datasetId,
        deletedExtractionSession: extractionSessionId
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting dataset:', error);
    return NextResponse.json(
      {
        error: 'Failed to delete dataset',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * Delete all files in a storage folder
 */
async function deleteStorageFolder(bucketName: string, folderPath: string): Promise<void> {
  try {
    // List all files in the folder
    const { data: files, error: listError } = await supabase.storage
      .from(bucketName)
      .list(folderPath, {
        limit: 1000
      });

    if (listError) {
      console.error(`Error listing files in ${bucketName}/${folderPath}:`, listError);
      return;
    }

    if (!files || files.length === 0) {
      console.log(`No files found in ${bucketName}/${folderPath}`);
      return;
    }

    // Delete all files
    const filePaths = files.map(file => `${folderPath}/${file.name}`);
    const { error: deleteError } = await supabase.storage
      .from(bucketName)
      .remove(filePaths);

    if (deleteError) {
      console.error(`Error deleting files in ${bucketName}/${folderPath}:`, deleteError);
      return;
    }

    console.log(`Deleted ${files.length} files from ${bucketName}/${folderPath}`);

    // Try to remove the folder itself
    const { error: removeFolderError } = await supabase.storage
      .from(bucketName)
      .remove([folderPath]);

    if (removeFolderError) {
      console.log(`Could not remove folder ${bucketName}/${folderPath} (may not be empty)`);
    } else {
      console.log(`Removed folder ${bucketName}/${folderPath}`);
    }
  } catch (error) {
    console.error(`Error in deleteStorageFolder(${bucketName}, ${folderPath}):`, error);
  }
}
