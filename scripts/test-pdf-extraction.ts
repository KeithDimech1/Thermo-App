/**
 * Test script for PDF.js utilities (replacement for PyMuPDF)
 *
 * This verifies that the new PDF.js-based extraction works correctly
 * before deploying to production.
 */

import { extractPDFText, extractPDFMetadata, renderPageToPng, checkPDFJSAvailable } from '../lib/utils/pdf-utils';
import path from 'path';
import fs from 'fs/promises';
import os from 'os';

async function testPDFExtraction() {
  console.log('🧪 Testing PDF.js extraction utilities...\n');

  // Test 1: Check if PDF.js is available
  console.log('Test 1: Checking PDF.js availability...');
  const isAvailable = await checkPDFJSAvailable();
  if (!isAvailable) {
    console.error('❌ PDF.js not available!');
    process.exit(1);
  }
  console.log('✅ PDF.js is available\n');

  // Find a test PDF
  const testPdfPath = path.join(
    process.cwd(),
    'build-data/learning/thermo-papers/Kirby(2002)-Late-Cenozoic-Tibetan-Plateau-Tectonics',
    'Tectonics - 2002 - Kirby - Late Cenozoic evolution of the eastern margin of the Tibetan Plateau  Inferences from 40Ar 39Ar.pdf'
  );

  console.log(`📄 Using test PDF: ${path.basename(testPdfPath)}\n`);

  // Check if file exists
  try {
    await fs.access(testPdfPath);
  } catch {
    console.error('❌ Test PDF not found!');
    process.exit(1);
  }

  // Test 2: Extract metadata
  console.log('Test 2: Extracting PDF metadata...');
  try {
    const metadata = await extractPDFMetadata(testPdfPath);
    console.log('✅ Metadata extracted:');
    console.log(`   - Page count: ${metadata.pageCount}`);
    console.log(`   - Title: ${metadata.title || 'N/A'}`);
    console.log(`   - Author: ${metadata.author || 'N/A'}`);
    console.log(`   - Creator: ${metadata.creator || 'N/A'}\n`);
  } catch (error) {
    console.error('❌ Metadata extraction failed:', error);
    process.exit(1);
  }

  // Test 3: Extract text
  console.log('Test 3: Extracting text from PDF...');
  try {
    const text = await extractPDFText(testPdfPath);
    console.log('✅ Text extracted:');
    console.log(`   - Total characters: ${text.length}`);
    console.log(`   - First 200 chars: ${text.substring(0, 200).replace(/\n/g, ' ').trim()}...\n`);
  } catch (error) {
    console.error('❌ Text extraction failed:', error);
    process.exit(1);
  }

  // Test 4: Render page to PNG
  console.log('Test 4: Rendering page 1 to PNG...');
  try {
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'pdf-test-'));
    const outputPath = path.join(tempDir, 'test-page-1.png');

    const result = await renderPageToPng(testPdfPath, 1, outputPath, 2.0);

    if (result.success) {
      const stats = await fs.stat(outputPath);
      console.log('✅ PNG rendered:');
      console.log(`   - Width: ${result.width}px`);
      console.log(`   - Height: ${result.height}px`);
      console.log(`   - File size: ${Math.round(stats.size / 1024)}KB`);
      console.log(`   - Output: ${outputPath}\n`);
    } else {
      console.error('❌ PNG rendering failed:', result.error);
      process.exit(1);
    }

    // Cleanup
    await fs.rm(tempDir, { recursive: true, force: true });
  } catch (error) {
    console.error('❌ PNG rendering failed:', error);
    process.exit(1);
  }

  console.log('🎉 All tests passed! PDF.js utilities are working correctly.\n');
  console.log('✅ Ready to deploy to Vercel - PyMuPDF dependency removed successfully.');
}

// Run tests
testPDFExtraction().catch(error => {
  console.error('\n💥 Test suite failed:', error);
  process.exit(1);
});
