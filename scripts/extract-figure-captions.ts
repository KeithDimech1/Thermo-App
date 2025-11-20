#!/usr/bin/env tsx
/**
 * Extract figure captions from plain text and match them to extracted images
 * This helps filter out useless images (logos, small graphics) and only keep
 * scientifically relevant figures with proper captions.
 *
 * Also renames image files to use figure names (e.g., "figure_1.jpeg")
 * and extracts table captions with metadata.
 */

import fs from 'fs';
import path from 'path';

interface ImageMetadata {
  filename: string;
  page: number;
  index: number;
  format: string;
  width: number;
  height: number;
  caption?: string;
  figure_number?: string;
}

interface ImageMetadataFile {
  paper: string;
  pdf: string;
  total_images: number;
  total_pages: number;
  extracted_date: string;
  images: ImageMetadata[];
  table_images?: any[];
}

interface FigureCaption {
  figure_number: string;
  caption: string;
  approximate_page?: number;
}

interface TableCaption {
  table_number: string;
  caption: string;
  approximate_page?: number;
}

/**
 * Extract figure captions from plain text file
 */
function extractCaptions(plainTextPath: string): FigureCaption[] {
  const text = fs.readFileSync(plainTextPath, 'utf-8');
  const lines = text.split('\n');

  const captions: FigureCaption[] = [];
  let currentCaption: FigureCaption | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Match figure caption start (e.g., "Fig. 1." or "Figure 1.")
    const figMatch = line.match(/^(Fig\.|Figure)\s+(\d+[A-Z]?)\./);

    if (figMatch) {
      // Save previous caption if exists
      if (currentCaption) {
        captions.push(currentCaption);
      }

      // Start new caption
      currentCaption = {
        figure_number: figMatch[2],
        caption: line.trim(),
      };

      // Try to extract page number from context
      // Look back for "--- PAGE X ---" markers
      for (let j = i - 1; j >= Math.max(0, i - 20); j--) {
        const pageMatch = lines[j].match(/---\s*PAGE\s+(\d+)\s*---/);
        if (pageMatch) {
          currentCaption.approximate_page = parseInt(pageMatch[1]);
          break;
        }
      }
    } else if (currentCaption) {
      // Continue caption on next lines until we hit an empty line or new section
      if (line.trim() && !line.match(/^[A-Z][a-z]+\s+et\s+al\./)) {
        currentCaption.caption += ' ' + line.trim();
      } else if (!line.trim()) {
        // Empty line - end of caption
        captions.push(currentCaption);
        currentCaption = null;
      }
    }
  }

  // Don't forget the last caption
  if (currentCaption) {
    captions.push(currentCaption);
  }

  return captions;
}

/**
 * Extract table captions from plain text file
 */
function extractTableCaptions(plainTextPath: string): TableCaption[] {
  const text = fs.readFileSync(plainTextPath, 'utf-8');
  const lines = text.split('\n');

  const captions: TableCaption[] = [];
  let currentCaption: TableCaption | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Match table caption start (e.g., "Table 1." or "TABLE 1:")
    const tableMatch = line.match(/^(Table|TABLE)\s+([\dA-Z]+)[\.:]/i);

    if (tableMatch) {
      // Save previous caption if exists
      if (currentCaption) {
        captions.push(currentCaption);
      }

      // Start new caption
      currentCaption = {
        table_number: tableMatch[2],
        caption: line.trim(),
      };

      // Try to extract page number from context
      for (let j = i - 1; j >= Math.max(0, i - 20); j--) {
        const pageMatch = lines[j].match(/---\s*PAGE\s+(\d+)\s*---/);
        if (pageMatch) {
          currentCaption.approximate_page = parseInt(pageMatch[1]);
          break;
        }
      }
    } else if (currentCaption) {
      // Continue caption on next lines until we hit an empty line or new section
      if (line.trim() && !line.match(/^[A-Z][a-z]+\s+et\s+al\./)) {
        currentCaption.caption += ' ' + line.trim();
      } else if (!line.trim()) {
        // Empty line - end of caption
        captions.push(currentCaption);
        currentCaption = null;
      }
    }
  }

  // Don't forget the last caption
  if (currentCaption) {
    captions.push(currentCaption);
  }

  return captions;
}

/**
 * Match captions to images based on page proximity and size heuristics
 */
function matchCaptionsToImages(
  images: ImageMetadata[],
  captions: FigureCaption[]
): ImageMetadata[] {
  const MIN_FIGURE_SIZE = 500; // Minimum width or height for a real figure

  // Filter out small images (likely logos, icons, etc.)
  const largeImages = images.filter(
    img => img.width >= MIN_FIGURE_SIZE || img.height >= MIN_FIGURE_SIZE
  );

  // Sort images by page
  largeImages.sort((a, b) => a.page - b.page);

  // Sort captions by figure number
  captions.sort((a, b) => {
    const numA = parseInt(a.figure_number);
    const numB = parseInt(b.figure_number);
    return numA - numB;
  });

  const matchedImages: ImageMetadata[] = [];

  // Match images to captions
  for (const caption of captions) {
    const figNum = parseInt(caption.figure_number);
    const approxPage = caption.approximate_page;

    // Find image closest to the caption's page
    let bestMatch: ImageMetadata | null = null;
    let bestDistance = Infinity;

    for (const img of largeImages) {
      // Skip if already matched
      if (matchedImages.some(m => m.filename === img.filename)) {
        continue;
      }

      const distance = approxPage
        ? Math.abs(img.page - approxPage)
        : Math.abs(img.page - (figNum + 2)); // Rough heuristic: figures usually after page 3

      if (distance < bestDistance) {
        bestDistance = distance;
        bestMatch = img;
      }
    }

    if (bestMatch) {
      matchedImages.push({
        ...bestMatch,
        figure_number: caption.figure_number,
        caption: caption.caption,
      });
    }
  }

  return matchedImages;
}

/**
 * Main function
 */
function main() {
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.error('Usage: extract-figure-captions.ts <plain-text-file> <image-metadata-json>');
    console.error('');
    console.error('Example:');
    console.error('  tsx extract-figure-captions.ts text/plain-text.txt images/image-metadata.json');
    process.exit(1);
  }

  const [plainTextPath, metadataPath] = args;

  // Validate files exist
  if (!fs.existsSync(plainTextPath)) {
    console.error(`Error: Plain text file not found: ${plainTextPath}`);
    process.exit(1);
  }

  if (!fs.existsSync(metadataPath)) {
    console.error(`Error: Metadata file not found: ${metadataPath}`);
    process.exit(1);
  }

  console.log('📖 Reading files...');
  const captions = extractCaptions(plainTextPath);
  const metadata: ImageMetadataFile = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'));

  console.log(`\n📊 Found ${captions.length} figure captions`);
  console.log(`📊 Found ${metadata.images.length} total images`);

  console.log('\n🔍 Matching captions to images...');
  const matchedImages = matchCaptionsToImages(metadata.images, captions);

  console.log(`\n✅ Matched ${matchedImages.length} images with captions`);
  console.log(`❌ Filtered out ${metadata.images.length - matchedImages.length} images without captions`);

  // Rename image files to use figure names
  console.log('\n🔄 Renaming image files...');
  const imagesDir = path.dirname(metadataPath);
  const renamedImages: ImageMetadata[] = [];

  matchedImages.forEach((img, idx) => {
    const oldPath = path.join(imagesDir, img.filename);
    const figNum = img.figure_number!.toLowerCase().replace(/[^a-z0-9]/g, '_');
    const newFilename = `figure_${figNum}.${img.format}`;
    const newPath = path.join(imagesDir, newFilename);

    if (fs.existsSync(oldPath)) {
      // Check if file already exists with new name
      if (fs.existsSync(newPath) && oldPath !== newPath) {
        // Add suffix to avoid collision
        const suffix = `_${idx}`;
        const newFilenameWithSuffix = `figure_${figNum}${suffix}.${img.format}`;
        const newPathWithSuffix = path.join(imagesDir, newFilenameWithSuffix);
        fs.renameSync(oldPath, newPathWithSuffix);
        console.log(`  ✓ ${img.filename} → ${newFilenameWithSuffix}`);
        renamedImages.push({ ...img, filename: newFilenameWithSuffix });
      } else {
        fs.renameSync(oldPath, newPath);
        console.log(`  ✓ ${img.filename} → ${newFilename}`);
        renamedImages.push({ ...img, filename: newFilename });
      }
    } else {
      console.log(`  ⚠ ${img.filename} not found, keeping original name`);
      renamedImages.push(img);
    }
  });

  // Update metadata with renamed files
  const updatedMetadata: ImageMetadataFile = {
    ...metadata,
    images: renamedImages,
    total_images: renamedImages.length,
  };

  // Save updated metadata
  const backupPath = metadataPath.replace('.json', '.backup.json');
  fs.copyFileSync(metadataPath, backupPath);
  console.log(`\n💾 Backed up original metadata to: ${backupPath}`);

  fs.writeFileSync(metadataPath, JSON.stringify(updatedMetadata, null, 2));
  console.log(`💾 Updated metadata saved to: ${metadataPath}`);

  // Extract table captions and create table metadata
  console.log('\n📊 Extracting table captions...');
  const tableCaptions = extractTableCaptions(plainTextPath);
  console.log(`✅ Found ${tableCaptions.length} table captions`);

  if (tableCaptions.length > 0 && metadata.table_images && metadata.table_images.length > 0) {
    // Match table captions to table images
    const tablesWithCaptions = metadata.table_images.map(tableImg => {
      const matchingCaption = tableCaptions.find(cap =>
        cap.table_number === tableImg.table_num ||
        cap.table_number.toUpperCase() === tableImg.table_num.toUpperCase()
      );

      return {
        ...tableImg,
        caption: matchingCaption?.caption || null,
      };
    });

    // Create table metadata JSON
    const tableMetadata = {
      paper: metadata.paper,
      pdf: metadata.pdf,
      total_tables: tableCaptions.length,
      extracted_date: metadata.extracted_date,
      tables: tablesWithCaptions,
    };

    const tableMetadataPath = path.join(path.dirname(metadataPath), 'table-metadata.json');
    fs.writeFileSync(tableMetadataPath, JSON.stringify(tableMetadata, null, 2));
    console.log(`💾 Table metadata saved to: ${tableMetadataPath}`);

    // Show table results
    console.log('\n📋 Tables with Captions:');
    tablesWithCaptions.forEach(table => {
      console.log(`  Table ${table.table_num} (page ${table.page}) - ${table.screenshot}`);
      if (table.caption) {
        console.log(`    Caption: ${table.caption.substring(0, 100)}...`);
      } else {
        console.log(`    Caption: ⚠ Not found in text`);
      }
    });
  }

  // Show figure results
  console.log('\n📋 Matched Figures (Renamed):');
  renamedImages.forEach(img => {
    console.log(`  Fig. ${img.figure_number} (page ${img.page}) - ${img.filename}`);
    console.log(`    Caption: ${img.caption?.substring(0, 100)}...`);
  });
}

if (require.main === module) {
  main();
}
