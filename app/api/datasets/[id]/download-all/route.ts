import { NextRequest, NextResponse } from 'next/server';
import { getDataFilesByDataset, getDatasetById } from '@/lib/db/queries';
import * as fs from 'fs';
import * as path from 'path';
import JSZip from 'jszip';

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const datasetId = parseInt(params.id, 10);

    if (isNaN(datasetId)) {
      return NextResponse.json(
        { error: 'Invalid dataset ID' },
        { status: 400 }
      );
    }

    // Get dataset info
    const dataset = await getDatasetById(datasetId);
    if (!dataset) {
      return NextResponse.json(
        { error: 'Dataset not found' },
        { status: 404 }
      );
    }

    // Get all files for this dataset
    const files = await getDataFilesByDataset(datasetId);

    if (files.length === 0) {
      return NextResponse.json(
        { error: 'No files available for download' },
        { status: 404 }
      );
    }

    // Create ZIP archive
    const zip = new JSZip();

    // Add each file to ZIP
    for (const file of files) {
      try {
        // Resolve file path (assuming files are in public directory)
        const publicPath = path.join(process.cwd(), 'public', file.file_path.replace('/data/', 'data/'));

        // Check if file exists
        if (!fs.existsSync(publicPath)) {
          console.warn(`File not found: ${publicPath}`);
          continue;
        }

        // Read file content
        const fileContent = fs.readFileSync(publicPath);

        // Add to ZIP with original filename
        zip.file(file.file_name, fileContent);
      } catch (error) {
        console.error(`Error adding file ${file.file_name} to ZIP:`, error);
        // Continue with other files even if one fails
      }
    }

    // Generate ZIP buffer
    const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });

    // Create sanitized filename for ZIP
    const zipFilename = `${dataset.dataset_name.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-data.zip`;

    // Return ZIP file
    return new NextResponse(zipBuffer, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${zipFilename}"`,
        'Content-Length': zipBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error('Error generating ZIP:', error);
    return NextResponse.json(
      { error: 'Failed to generate ZIP file' },
      { status: 500 }
    );
  }
}
