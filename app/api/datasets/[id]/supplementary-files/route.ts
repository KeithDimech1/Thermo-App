import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db/connection';

export const dynamic = 'force-dynamic';

interface SupplementaryFile {
  id: number;
  file_name: string;
  file_type: string;
  category: string;
  upload_status: string;
  display_name: string | null;
  description: string | null;
  is_folder: boolean;
  file_path: string;
  source_url: string | null;
  upload_notes: string | null;
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
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

    // Fetch supplementary files for this dataset
    const sql = `
      SELECT
        id,
        file_name,
        file_type,
        category,
        upload_status,
        display_name,
        description,
        is_folder,
        file_path,
        source_url,
        upload_notes
      FROM data_files
      WHERE dataset_id = $1
      AND category LIKE 'supplementary%'
      ORDER BY
        CASE upload_status
          WHEN 'available' THEN 1
          WHEN 'pending' THEN 2
          WHEN 'not_uploadable' THEN 3
          WHEN 'external_only' THEN 4
          ELSE 5
        END,
        category,
        file_type,
        display_name
    `;

    const files = await query<SupplementaryFile>(sql, [datasetId]);

    // Calculate summary statistics
    const summary = {
      total: files.length,
      available: files.filter(f => f.upload_status === 'available').length,
      external_only: files.filter(f => f.upload_status === 'external_only').length,
      pending: files.filter(f => f.upload_status === 'pending').length,
      not_uploadable: files.filter(f => f.upload_status === 'not_uploadable').length,
    };

    return NextResponse.json({
      files,
      summary,
      has_supplementary_data: files.length > 0,
    });
  } catch (error) {
    console.error('Error fetching supplementary files:', error);
    return NextResponse.json(
      { error: 'Failed to fetch supplementary files' },
      { status: 500 }
    );
  }
}
