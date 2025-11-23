/**
 * PDF Utilities using unpdf (serverless-optimized)
 *
 * Replaces PyMuPDF/Python bridge with serverless-friendly solution.
 * unpdf is designed for edge/serverless environments (Vercel, Cloudflare Workers, etc.)
 * Zero dependencies, ~1.4MB, no native bindings.
 *
 * Note: PNG rendering removed - extraction now uses plain text (more reliable)
 */

import { getDocumentProxy } from 'unpdf';
import fs from 'fs/promises';

/**
 * Extract text from PDF using unpdf
 */
export async function extractPDFText(pdfPath: string): Promise<string> {
  try {
    // Read PDF file
    const pdfBuffer = await fs.readFile(pdfPath);

    // Load PDF document using unpdf
    const pdf = await getDocumentProxy(new Uint8Array(pdfBuffer));
    const numPages = pdf.numPages;

    let fullText = '';

    // Extract text from each page
    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();

      // Combine text items with spaces
      const pageText = textContent.items
        .map((item: any) => item.str || '')
        .join(' ');

      fullText += `\n--- Page ${pageNum} ---\n${pageText}\n`;
    }

    return fullText;
  } catch (error) {
    throw new Error(`PDF text extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Extract metadata from PDF
 */
export async function extractPDFMetadata(pdfPath: string): Promise<{
  pageCount: number;
  title?: string;
  author?: string;
  subject?: string;
  creator?: string;
  producer?: string;
  creationDate?: string;
}> {
  try {
    const pdfBuffer = await fs.readFile(pdfPath);
    const pdf = await getDocumentProxy(new Uint8Array(pdfBuffer));
    const metadata = await pdf.getMetadata();

    // Type assertion for metadata.info
    const info = metadata.info as any;

    return {
      pageCount: pdf.numPages,
      title: info?.Title,
      author: info?.Author,
      subject: info?.Subject,
      creator: info?.Creator,
      producer: info?.Producer,
      creationDate: info?.CreationDate,
    };
  } catch (error) {
    throw new Error(`PDF metadata extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * PNG rendering disabled - extraction now uses plain text instead
 *
 * This is more reliable and fully serverless-compatible.
 * Screenshots were causing native binding issues on Vercel.
 */
export async function renderPageToPng(
  _pdfPath: string,
  _pageNumber: number,
  _outputPath: string,
  _zoom: number = 2.0
): Promise<{ success: boolean; error?: string; width?: number; height?: number }> {
  // PNG rendering disabled - extraction uses text-based approach
  return {
    success: false,
    error: 'PNG rendering disabled (extraction uses text-based approach)',
  };
}

/**
 * Check if unpdf is properly configured
 * (Always returns true since we're using it natively)
 */
export async function checkPDFJSAvailable(): Promise<boolean> {
  try {
    // Simple check - just verify the module is loaded
    return typeof getDocumentProxy === 'function';
  } catch {
    return false;
  }
}
