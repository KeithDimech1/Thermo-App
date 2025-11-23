/**
 * PDF Screenshot Utilities
 *
 * Captures screenshots of specific PDF pages for table/figure backup.
 * Ensures visual fallback even when CSV extraction fails.
 *
 * Uses PyMuPDF (via Python bridge) instead of pdf-to-png-converter
 * to avoid native binding issues.
 */

import { uploadFile } from '@/lib/storage/supabase';
import { execSync } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

export interface TableScreenshotInfo {
  tableNumber: number | string;
  pageNumber: number;
  imageUrl: string;
  imagePath: string;
}

/**
 * Render a PDF page to PNG using PyMuPDF
 */
async function renderPageToPng(
  pdfPath: string,
  pageNumber: number,
  outputPath: string,
  zoom: number = 2.0
): Promise<{ success: boolean; error?: string }> {
  try {
    const scriptPath = path.join(process.cwd(), 'lib/utils/pdf-to-png.py');
    const command = `python3 "${scriptPath}" "${pdfPath}" ${pageNumber} "${outputPath}" ${zoom}`;

    const result = execSync(command, {
      encoding: 'utf-8',
      maxBuffer: 10 * 1024 * 1024, // 10MB buffer
    });

    const parsed = JSON.parse(result);
    return parsed;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Capture screenshots of table pages from PDF
 *
 * @param pdfPath - Path to the PDF file
 * @param tables - Array of tables with page numbers
 * @param sessionId - Session ID for organizing files
 * @returns Array of screenshot info
 */
export async function captureTableScreenshots(
  pdfPath: string,
  tables: Array<{ table_number: number | string; page_number?: number }>,
  sessionId: string
): Promise<TableScreenshotInfo[]> {
  const screenshots: TableScreenshotInfo[] = [];

  for (const table of tables) {
    if (!table.page_number) {
      console.log(`[PDF Screenshot] Skipping table ${table.table_number} - no page number`);
      continue;
    }

    try {
      console.log(`[PDF Screenshot] Capturing table ${table.table_number} from page ${table.page_number}...`);

      // Create temp file for PNG output
      const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'thermo-screenshots-'));
      const tempPngPath = path.join(tempDir, `table-${table.table_number}.png`);

      // Render page to PNG using PyMuPDF
      const result = await renderPageToPng(pdfPath, table.page_number, tempPngPath, 2.0);

      if (!result.success) {
        console.error(`[PDF Screenshot] Failed to render table ${table.table_number}: ${result.error}`);
        await fs.rm(tempDir, { recursive: true, force: true });
        continue;
      }

      // Read PNG data
      const pngData = await fs.readFile(tempPngPath);
      const imagePath = `${sessionId}/images/tables/table-${table.table_number}.png`;

      // Upload to Supabase Storage
      const imageUrl = await uploadFile(
        'extractions',
        imagePath,
        pngData,
        'image/png'
      );

      screenshots.push({
        tableNumber: table.table_number,
        pageNumber: table.page_number,
        imageUrl,
        imagePath,
      });

      console.log(`[PDF Screenshot] ✓ Saved table ${table.table_number} screenshot: ${imagePath}`);

      // Clean up temp file
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch (error) {
      console.error(`[PDF Screenshot] Failed to capture table ${table.table_number}:`, error);
      // Continue with other tables even if one fails
    }
  }

  return screenshots;
}

/**
 * Capture screenshots of figure pages from PDF
 *
 * @param pdfPath - Path to the PDF file
 * @param figures - Array of figures with page numbers
 * @param sessionId - Session ID for organizing files
 * @returns Array of screenshot info
 */
export async function captureFigureScreenshots(
  pdfPath: string,
  figures: Array<{ figure_number: number | string; page_number?: number }>,
  sessionId: string
): Promise<TableScreenshotInfo[]> {
  const screenshots: TableScreenshotInfo[] = [];

  for (const figure of figures) {
    if (!figure.page_number) {
      console.log(`[PDF Screenshot] Skipping figure ${figure.figure_number} - no page number`);
      continue;
    }

    try {
      console.log(`[PDF Screenshot] Capturing figure ${figure.figure_number} from page ${figure.page_number}...`);

      // Create temp file for PNG output
      const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'thermo-screenshots-'));
      const tempPngPath = path.join(tempDir, `figure-${figure.figure_number}.png`);

      // Render page to PNG using PyMuPDF
      const result = await renderPageToPng(pdfPath, figure.page_number, tempPngPath, 2.0);

      if (!result.success) {
        console.error(`[PDF Screenshot] Failed to render figure ${figure.figure_number}: ${result.error}`);
        await fs.rm(tempDir, { recursive: true, force: true });
        continue;
      }

      // Read PNG data
      const pngData = await fs.readFile(tempPngPath);
      const imagePath = `${sessionId}/images/figures/figure-${figure.figure_number}.png`;

      // Upload to Supabase Storage
      const imageUrl = await uploadFile(
        'extractions',
        imagePath,
        pngData,
        'image/png'
      );

      screenshots.push({
        tableNumber: figure.figure_number,
        pageNumber: figure.page_number,
        imageUrl,
        imagePath,
      });

      console.log(`[PDF Screenshot] ✓ Saved figure ${figure.figure_number} screenshot: ${imagePath}`);

      // Clean up temp file
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch (error) {
      console.error(`[PDF Screenshot] Failed to capture figure ${figure.figure_number}:`, error);
      // Continue with other figures even if one fails
    }
  }

  return screenshots;
}
