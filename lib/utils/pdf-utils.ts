/**
 * PDF Utilities using PDF.js (serverless-compatible)
 *
 * Replaces PyMuPDF/Python bridge with pure JavaScript solution.
 * Works in Vercel serverless environment without Python dependencies.
 */

// Use legacy build for Node.js compatibility
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';
import { createCanvas } from 'canvas';
import fs from 'fs/promises';

/**
 * Extract text from PDF using PDF.js
 */
export async function extractPDFText(pdfPath: string): Promise<string> {
  try {
    // Read PDF file
    const pdfBuffer = await fs.readFile(pdfPath);

    // Load PDF document
    const loadingTask = pdfjsLib.getDocument({
      data: new Uint8Array(pdfBuffer),
      useSystemFonts: true,
    });

    const pdf = await loadingTask.promise;
    const numPages = pdf.numPages;

    let fullText = '';

    // Extract text from each page
    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();

      // Combine text items with spaces
      const pageText = textContent.items
        .map((item: any) => item.str)
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

    const loadingTask = pdfjsLib.getDocument({
      data: new Uint8Array(pdfBuffer),
      useSystemFonts: true,
    });

    const pdf = await loadingTask.promise;
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
 * Render a PDF page to PNG using PDF.js and Canvas
 */
export async function renderPageToPng(
  pdfPath: string,
  pageNumber: number,
  outputPath: string,
  zoom: number = 2.0
): Promise<{ success: boolean; error?: string; width?: number; height?: number }> {
  try {
    // Read PDF file
    const pdfBuffer = await fs.readFile(pdfPath);

    // Load PDF document
    const loadingTask = pdfjsLib.getDocument({
      data: new Uint8Array(pdfBuffer),
      useSystemFonts: true,
    });

    const pdf = await loadingTask.promise;

    // Validate page number
    if (pageNumber < 1 || pageNumber > pdf.numPages) {
      return {
        success: false,
        error: `Invalid page number: ${pageNumber} (PDF has ${pdf.numPages} pages)`,
      };
    }

    // Get page
    const page = await pdf.getPage(pageNumber);
    const viewport = page.getViewport({ scale: zoom });

    // Create canvas
    const canvas = createCanvas(viewport.width, viewport.height);
    const context = canvas.getContext('2d');

    // Render page to canvas
    const renderContext: any = {
      canvasContext: context,
      viewport: viewport,
    };
    await page.render(renderContext).promise;

    // Save to PNG file
    const buffer = canvas.toBuffer('image/png');
    await fs.writeFile(outputPath, buffer);

    return {
      success: true,
      width: viewport.width,
      height: viewport.height,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Check if PDF.js is properly configured
 * (Always returns true since we're using it natively)
 */
export async function checkPDFJSAvailable(): Promise<boolean> {
  try {
    // Simple check - just verify the module is loaded
    return typeof pdfjsLib.getDocument === 'function';
  } catch {
    return false;
  }
}
