import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/utils/logger';
import { query } from '@/lib/db/connection';
import * as fs from 'fs';
import * as path from 'path';
import { DataFile } from '@/lib/types/thermo-data';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const fileId = parseInt(id, 10);

    if (isNaN(fileId)) {
      return NextResponse.json(
        { error: 'Invalid file ID' },
        { status: 400 }
      );
    }

    // Get file metadata from database
    const sql = 'SELECT * FROM data_files WHERE id = $1';
    const files = await query<DataFile>(sql, [fileId]);

    if (files.length === 0) {
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      );
    }

    const file = files[0];

    if (!file) {
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      );
    }

    // Resolve file path
    // Paths starting with /data/ are in the public directory
    // Other paths starting with / are absolute from project root
    let filePath: string;
    if (file.file_path.startsWith('/data/')) {
      // Convert /data/... to public/data/...
      filePath = path.join(process.cwd(), 'public', file.file_path.substring(1));
    } else if (file.file_path.startsWith('/')) {
      // Absolute from project root
      filePath = path.join(process.cwd(), file.file_path.substring(1));
    } else {
      // Relative path
      filePath = path.join(process.cwd(), file.file_path);
    }

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      logger.error(`File not found: ${filePath}`);
      return NextResponse.json(
        { error: 'File not found on server', path: filePath },
        { status: 404 }
      );
    }

    // Read file content
    const fileContent = fs.readFileSync(filePath);

    // Determine content type based on file extension
    const ext = path.extname(file.file_name).toLowerCase();
    const contentTypes: Record<string, string> = {
      '.csv': 'text/csv',
      '.pdf': 'application/pdf',
      '.json': 'application/json',
      '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      '.txt': 'text/plain',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
    };

    const contentType = contentTypes[ext] || 'application/octet-stream';

    // Return file with appropriate headers
    return new NextResponse(fileContent as unknown as BodyInit, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${file.file_name}"`,
        'Content-Length': fileContent.length.toString(),
      },
    });
  } catch (error) {
    logger.error({ err: error }, 'Error serving file:');
    return NextResponse.json(
      { error: 'Failed to serve file' },
      { status: 500 }
    );
  }
}
