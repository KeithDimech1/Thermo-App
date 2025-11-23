#!/usr/bin/env npx tsx

/**
 * Extract figures from PDFs and upload to Supabase
 *
 * Usage: npx tsx scripts/storage/extract-and-upload-figures.ts <dataset_id>
 */

import { createClient } from '@supabase/supabase-js';
import { query } from '../../lib/db/connection';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

interface DataFile {
  id: number;
  file_name: string;
  file_path: string;
  file_type: string;
}

async function getPdfForDataset(datasetId: number): Promise<DataFile | null> {
  const sql = `
    SELECT id, file_name, file_path, file_type
    FROM data_files
    WHERE dataset_id = $1 AND file_type = 'pdf'
    LIMIT 1
  `;

  const results = await query<DataFile>(sql, [datasetId]);
  return results.length > 0 ? results[0] : null;
}

async function downloadPdf(pdfUrl: string, outputPath: string): Promise<void> {
  console.log(`📥 Downloading PDF from: ${pdfUrl}`);

  const response = await fetch(pdfUrl);
  if (!response.ok) {
    throw new Error(`Failed to download PDF: ${response.statusText}`);
  }

  const buffer = await response.arrayBuffer();
  fs.writeFileSync(outputPath, Buffer.from(buffer));

  console.log(`✅ PDF downloaded to: ${outputPath}`);
}

async function extractImagesFromPdf(pdfPath: string, outputDir: string): Promise<string[]> {
  console.log(`🖼️  Extracting images from PDF...`);

  // Create Python script to extract images
  const pythonScript = `
import fitz  # PyMuPDF
import sys
import os

pdf_path = sys.argv[1]
output_dir = sys.argv[2]

doc = fitz.open(pdf_path)
image_list = []

for page_num in range(len(doc)):
    page = doc[page_num]
    images = page.get_images(full=True)

    for img_index, img in enumerate(images):
        xref = img[0]
        base_image = doc.extract_image(xref)
        image_bytes = base_image["image"]
        image_ext = base_image["ext"]

        # Filter out small images (likely icons/logos, not figures)
        # Typical figures are >50KB
        if len(image_bytes) > 50000:
            image_filename = f"figure-{len(image_list) + 1}.{image_ext}"
            image_path = os.path.join(output_dir, image_filename)

            with open(image_path, "wb") as img_file:
                img_file.write(image_bytes)

            image_list.append(image_filename)
            print(f"Extracted: {image_filename} ({len(image_bytes)} bytes)")

print(f"Total figures extracted: {len(image_list)}")
`;

  const scriptPath = path.join(os.tmpdir(), 'extract_images.py');
  fs.writeFileSync(scriptPath, pythonScript);

  try {
    const { stdout, stderr } = await execAsync(`python3 ${scriptPath} "${pdfPath}" "${outputDir}"`);
    console.log(stdout);
    if (stderr) console.error(stderr);

    // Get list of extracted images
    const files = fs.readdirSync(outputDir)
      .filter(f => f.startsWith('figure-') && (f.endsWith('.png') || f.endsWith('.jpg') || f.endsWith('.jpeg')))
      .sort();

    console.log(`✅ Extracted ${files.length} figure images`);
    return files;
  } finally {
    fs.unlinkSync(scriptPath);
  }
}

async function uploadFigureToSupabase(
  datasetId: number,
  localPath: string,
  fileName: string
): Promise<string> {
  const storagePath = `${datasetId}/figures/${fileName}`;

  console.log(`☁️  Uploading ${fileName} to Supabase...`);

  const fileBuffer = fs.readFileSync(localPath);

  const { data, error } = await supabase.storage
    .from('datasets')
    .upload(storagePath, fileBuffer, {
      contentType: fileName.endsWith('.png') ? 'image/png' : 'image/jpeg',
      upsert: true
    });

  if (error) {
    throw new Error(`Failed to upload ${fileName}: ${error.message}`);
  }

  // Get public URL
  const { data: urlData } = supabase.storage
    .from('datasets')
    .getPublicUrl(storagePath);

  console.log(`✅ Uploaded: ${urlData.publicUrl}`);
  return urlData.publicUrl;
}

async function insertDataFileRecord(
  datasetId: number,
  fileName: string,
  filePath: string,
  fileSize: number
): Promise<void> {
  const sql = `
    INSERT INTO data_files (
      dataset_id,
      file_name,
      file_path,
      file_type,
      display_name,
      file_size_bytes,
      description,
      mime_type,
      upload_status
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    ON CONFLICT DO NOTHING
  `;

  const figureNumber = fileName.match(/figure-(\d+)/)?.[1] || '?';
  const displayName = `Figure ${figureNumber}`;
  const description = `Figure ${figureNumber} from paper`;

  await query(sql, [
    datasetId,
    fileName,
    filePath,
    'image/png',
    displayName,
    fileSize,
    description,
    fileName.endsWith('.png') ? 'image/png' : 'image/jpeg',
    'available'
  ]);

  console.log(`✅ Database record created for ${fileName}`);
}

async function main() {
  const datasetId = parseInt(process.argv[2]);

  if (!datasetId || isNaN(datasetId)) {
    console.error('Usage: npx tsx scripts/storage/extract-and-upload-figures.ts <dataset_id>');
    process.exit(1);
  }

  console.log(`\n🚀 Extracting and uploading figures for dataset ${datasetId}\n`);

  // 1. Get PDF from database
  const pdfFile = await getPdfForDataset(datasetId);
  if (!pdfFile) {
    console.error(`❌ No PDF found for dataset ${datasetId}`);
    process.exit(1);
  }

  console.log(`📄 Found PDF: ${pdfFile.file_name}`);

  // 2. Create temp directory
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'figures-'));
  const pdfPath = path.join(tempDir, 'paper.pdf');

  try {
    // 3. Download PDF
    await downloadPdf(pdfFile.file_path, pdfPath);

    // 4. Extract images
    const figuresDir = path.join(tempDir, 'figures');
    fs.mkdirSync(figuresDir);
    const imageFiles = await extractImagesFromPdf(pdfPath, figuresDir);

    if (imageFiles.length === 0) {
      console.log('⚠️  No figures found in PDF (all images were too small)');
      return;
    }

    // 5. Upload each figure to Supabase
    console.log(`\n☁️  Uploading ${imageFiles.length} figures to Supabase...\n`);

    for (const imageFile of imageFiles) {
      const localPath = path.join(figuresDir, imageFile);
      const fileSize = fs.statSync(localPath).size;

      // Upload to Supabase
      const publicUrl = await uploadFigureToSupabase(datasetId, localPath, imageFile);

      // Insert database record
      await insertDataFileRecord(datasetId, imageFile, publicUrl, fileSize);
    }

    console.log(`\n✅ Successfully processed ${imageFiles.length} figures!`);
    console.log(`\nView at: https://thermo-app.vercel.app/datasets/${datasetId}/figures`);

  } finally {
    // Cleanup temp directory
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
}

main().catch(console.error);
