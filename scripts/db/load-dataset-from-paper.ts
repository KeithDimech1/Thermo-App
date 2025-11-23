/**
 * Load Dataset from Paper Directory
 *
 * Implements /thermoload workflow:
 * 1. Parse paper metadata from paper-index.md
 * 2. Create dataset record in database
 * 3. Upload files (PDF, CSVs, images) to public/data/
 * 4. Track files in data_files table
 * 5. Perform FAIR analysis
 * 6. Generate reports (fair-compliance.json, extraction-report.md)
 * 7. Update database with FAIR scores
 */

import * as fs from 'fs';
import * as path from 'path';
import { query } from '../../lib/db/connection';
import { FILE_TYPES, getFileTypeFromExtension } from '../../lib/constants/file-types';
import { extractPaperTitle } from '../../lib/utils/extract-paper-title';

interface ParsedMetadata {
  datasetName: string;
  fullCitation: string;
  authors: string[];
  publicationJournal: string | null;
  publicationYear: number | null;
  publicationVolumePages: string | null;
  doi: string | null;
  pdfFilename: string | null;
  pdfUrl: string | null;
  supplementaryFilesUrl: string | null;
  studyLocation: string | null;
  mineralAnalyzed: string | null;
  sampleCount: number | null;
  ageRangeMinMa: number | null;
  ageRangeMaxMa: number | null;
  laboratory: string | null;
  description: string | null;
}

interface UploadedFile {
  type: string;
  source: string;
  dest: string;
  size: number;
  rows?: number;
  description?: string;
}

interface ImageMetadata {
  figures_summary?: {
    [figureName: string]: {
      description: string;
      images: Array<{
        filename: string;
        page: number;
      }>;
    };
  };
  tables_summary?: {
    [tableName: string]: {
      description: string;
      images: Array<{
        filename: string;
        page: number;
      }>;
    };
  };
}

async function main() {
  const paperDir = process.argv[2];

  if (!paperDir) {
    console.error('❌ Error: Please provide paper directory path');
    console.error('   Usage: npx tsx scripts/db/load-dataset-from-paper.ts <paper-directory>');
    process.exit(1);
  }

  console.log();
  console.log('━'.repeat(80));
  console.log('/THERMOLOAD - DATASET LOADER WITH FAIR ASSESSMENT');
  console.log('━'.repeat(80));
  console.log();

  const paperPath = path.resolve(paperDir);
  const paperIndexPath = path.join(paperPath, 'paper-index.md');
  const extractedDir = path.join(paperPath, 'extracted');

  // Validate paths
  if (!fs.existsSync(paperPath)) {
    console.error(`❌ Error: Directory not found: ${paperDir}`);
    process.exit(1);
  }

  if (!fs.existsSync(paperIndexPath)) {
    console.error(`❌ Error: paper-index.md not found!`);
    console.error(`   Run /thermoanalysis first to create paper metadata.`);
    process.exit(1);
  }

  console.log(`✅ Paper directory: ${path.basename(paperPath)}`);
  console.log();

  // STEP 1: Parse Paper Metadata
  console.log('━'.repeat(80));
  console.log('STEP 1: PARSING PAPER METADATA');
  console.log('━'.repeat(80));
  console.log();

  const indexContent = fs.readFileSync(paperIndexPath, 'utf-8');
  const metadata = parseMetadata(indexContent, path.basename(paperPath));

  console.log(`✅ Dataset Name: ${metadata.datasetName}`);
  console.log(`✅ Authors: ${metadata.authors.join(', ')}`);
  console.log(`✅ Journal: ${metadata.publicationJournal} (${metadata.publicationYear})`);
  console.log(`✅ DOI: ${metadata.doi}`);
  console.log(`✅ Study Location: ${metadata.studyLocation}`);
  console.log(`✅ Mineral: ${metadata.mineralAnalyzed}`);
  console.log(`✅ Sample Count: ${metadata.sampleCount}`);
  if (metadata.ageRangeMinMa && metadata.ageRangeMaxMa) {
    console.log(`✅ Age Range: ${metadata.ageRangeMinMa}-${metadata.ageRangeMaxMa} Ma`);
  }
  console.log();

  // STEP 2: Create Dataset Database Record
  console.log('━'.repeat(80));
  console.log('STEP 2: CREATING DATASET RECORD');
  console.log('━'.repeat(80));
  console.log();

  const datasetId = await createDatasetRecord(metadata);
  console.log(`✅ Created dataset record: ID = ${datasetId}`);
  console.log(`   Name: ${metadata.datasetName}`);
  console.log();

  // STEP 3: Upload Files
  console.log('━'.repeat(80));
  console.log('STEP 3: UPLOADING FILES');
  console.log('━'.repeat(80));
  console.log();

  const uploadedFiles = await uploadFiles(paperPath, extractedDir, datasetId);
  const totalSize = uploadedFiles.reduce((sum, f) => sum + f.size, 0);

  console.log();
  console.log(`📦 Total files uploaded: ${uploadedFiles.length} (${(totalSize / 1024 / 1024).toFixed(2)} MB)`);
  console.log();

  // STEP 4: Track Files in Database
  console.log('━'.repeat(80));
  console.log('STEP 4: TRACKING FILES IN DATABASE');
  console.log('━'.repeat(80));
  console.log();

  await trackFilesInDatabase(uploadedFiles, datasetId);
  console.log(`✅ Tracked ${uploadedFiles.length} files in data_files table`);
  console.log();

  // STEP 5: Perform FAIR Analysis
  console.log('━'.repeat(80));
  console.log('STEP 5: PERFORMING FAIR ANALYSIS');
  console.log('━'.repeat(80));
  console.log();

  const fairData = await performFairAnalysis(uploadedFiles, metadata, datasetId);
  console.log();
  console.log('━'.repeat(40));
  console.log(`📊 TOTAL FAIR SCORE: ${fairData.summary.total_score}/100 (Grade ${fairData.summary.grade})`);
  console.log('━'.repeat(40));
  console.log();

  // STEP 6: Generate FAIR Report
  console.log('━'.repeat(80));
  console.log('STEP 6: GENERATING FAIR REPORT');
  console.log('━'.repeat(80));
  console.log();

  const fairJsonPath = path.join(paperPath, 'fair-compliance.json');
  const reportPath = path.join(paperPath, 'extraction-report.md');

  fs.writeFileSync(fairJsonPath, JSON.stringify(fairData, null, 2));
  console.log(`✅ Saved FAIR analysis: ${fairJsonPath}`);

  await generateFairReport(fairData, metadata, uploadedFiles, totalSize, reportPath);
  console.log(`✅ Generated FAIR report: ${reportPath}`);
  console.log();

  // STEP 7: Update Database with FAIR Scores
  console.log('━'.repeat(80));
  console.log('STEP 7: UPDATING DATABASE WITH FAIR SCORES');
  console.log('━'.repeat(80));
  console.log();

  await updateFairScores(datasetId, fairData);
  console.log(`✅ Inserted FAIR score breakdown (score: ${fairData.summary.total_score}/100)`);
  console.log();

  // STEP 8: Report Success
  console.log('━'.repeat(80));
  console.log('✅ DATASET LOAD COMPLETE');
  console.log('━'.repeat(80));
  console.log();

  console.log(`📊 Dataset: ${metadata.datasetName}`);
  console.log(`   ID: ${datasetId}`);
  console.log(`   FAIR Score: ${fairData.summary.total_score}/100 (Grade ${fairData.summary.grade})`);
  console.log();

  const pdfCount = uploadedFiles.filter(f => f.type === FILE_TYPES.PDF).length;
  const csvCount = uploadedFiles.filter(f => f.type === FILE_TYPES.CSV).length;
  const imgCount = uploadedFiles.filter(f => f.type === FILE_TYPES.IMAGE_PNG).length;

  console.log(`📁 Files Uploaded:`);
  console.log(`   - PDFs: ${pdfCount}`);
  console.log(`   - CSVs: ${csvCount}`);
  console.log(`   - Images: ${imgCount}`);
  console.log(`   - Total Size: ${(totalSize / 1024 / 1024).toFixed(2)} MB`);
  console.log();

  console.log(`📈 FAIR Breakdown:`);
  console.log(`   - Findable: ${fairData.fair_categories.findable.score}/25`);
  console.log(`   - Accessible: ${fairData.fair_categories.accessible.score}/25`);
  console.log(`   - Interoperable: ${fairData.fair_categories.interoperable.score}/25`);
  console.log(`   - Reusable: ${fairData.fair_categories.reusable.score}/25`);
  console.log();

  console.log(`🌐 View Dataset:`);
  console.log(`   - Overview: http://localhost:3000/datasets/${datasetId}`);
  console.log(`   - FAIR Assessment: http://localhost:3000/datasets/${datasetId}/fair`);
  console.log(`   - Data Files: http://localhost:3000/datasets/${datasetId}/data`);
  console.log();

  console.log(`📄 Reports Generated:`);
  console.log(`   - FAIR JSON: ${fairJsonPath}`);
  console.log(`   - FAIR Report: ${reportPath}`);
  console.log();

  console.log('🎯 Next Steps:');
  console.log(`   1. Review FAIR assessment at /datasets/${datasetId}/fair`);
  console.log(`   2. (Optional) Import CSV data to database with /thermoimport (future command)`);
  console.log(`   3. Publish dataset to production`);
  console.log();

  console.log('━'.repeat(80));
  console.log();
}

function parseMetadata(indexContent: string, dirName: string): ParsedMetadata {
  // Extract citation
  const citationMatch = indexContent.match(/\*\*Citation:\*\*\s*(.+)/);
  const fullCitation = citationMatch ? citationMatch[1].trim() : null;

  // Extract authors
  const authorsMatch = indexContent.match(/\*\*Authors:\*\*\s*(.+)/);
  let authors: string[] = [];
  if (authorsMatch) {
    const authorsText = authorsMatch[1];
    authors = authorsText.split(',').map(author => {
      const name = author.replace(/\s*\([^)]+\)/, '').trim();
      return name;
    }).filter(n => n);
  }

  // Extract journal
  const journalMatch = indexContent.match(/\*\*Journal:\*\*\s*([^,]+)/);
  const publicationJournal = journalMatch ? journalMatch[1].trim() : null;

  // Extract year
  const yearMatch = indexContent.match(/\*\*Year:\*\*\s*(\d{4})/);
  const publicationYear = yearMatch ? parseInt(yearMatch[1]) : null;

  // Extract DOI
  const doiMatch = indexContent.match(/\*\*DOI:\*\*\s*(?:https?:\/\/doi\.org\/)?([^\s\n]+)/);
  const doi = doiMatch ? doiMatch[1].trim() : null;

  // Extract volume/pages
  const volumeMatch = indexContent.match(/Volume\s+(\d+)[,\s]+(?:Article\s+)?(\S+)/);
  const publicationVolumePages = volumeMatch ? `Volume ${volumeMatch[1]}, ${volumeMatch[2]}` : null;

  // Extract PDF filename
  const pdfFilenameMatch = indexContent.match(/\*\*PDF Filename:\*\*\s*(.+\.pdf)/);
  const pdfFilename = pdfFilenameMatch ? pdfFilenameMatch[1].trim() : null;

  // Extract PDF URL
  const pdfUrlMatch = indexContent.match(/\*\*PDF URL:\*\*\s*(https?:\/\/[^\s\n]+)/);
  const pdfUrl = pdfUrlMatch ? pdfUrlMatch[1].trim() : null;

  // Extract supplementary files URL
  const suppMatch = indexContent.match(/\*\*Supplementary Files URL:\*\*\s*(https?:\/\/[^\s\n]+)/);
  let supplementaryFilesUrl = suppMatch ? suppMatch[1].trim() : null;
  if (supplementaryFilesUrl && supplementaryFilesUrl.includes('None')) {
    supplementaryFilesUrl = null;
  }

  // Extract study area
  const studyMatch = indexContent.match(/\*\*Study Area:\*\*\s*(.+)/);
  const studyLocation = studyMatch ? studyMatch[1].trim() : null;

  // Extract mineral
  const mineralMatch = indexContent.match(/\*\*Method:\*\*\s*(?:Both\s+)?(?:AFT.*?and\s+)?(?:AHe)?\s*\(([^)]+)\)/);
  let mineralAnalyzed: string | null = null;
  if (mineralMatch) {
    const mineralText = mineralMatch[1];
    if (/Apatite/i.test(mineralText)) {
      mineralAnalyzed = 'Apatite';
    } else if (/Zircon/i.test(mineralText)) {
      mineralAnalyzed = 'Zircon';
    } else {
      mineralAnalyzed = mineralText;
    }
  }

  // Extract sample count
  const sampleCountMatch = indexContent.match(/\*\*Sample Count:\*\*\s*(\d+)/);
  const sampleCount = sampleCountMatch ? parseInt(sampleCountMatch[1]) : null;

  // Extract age range
  const ageRangeMatch = indexContent.match(/\*\*Age Range:\*\*\s*~?(\d+)-(\d+)\s*Ma/);
  const ageRangeMinMa = ageRangeMatch ? parseFloat(ageRangeMatch[1]) : null;
  const ageRangeMaxMa = ageRangeMatch ? parseFloat(ageRangeMatch[2]) : null;

  // Extract laboratory
  const labMatch = indexContent.match(/\*\*Laboratory:\*\*\s*(.+)/);
  const laboratory = labMatch ? labMatch[1].trim() : null;

  // Generate dataset name - use paper title if available
  let datasetName: string;
  const paperTitle = extractPaperTitle(fullCitation);

  if (paperTitle) {
    // Use the extracted paper title as the dataset name
    datasetName = paperTitle;
  } else if (authors.length > 0 && publicationYear) {
    // Fallback to "Author Year" format
    const firstAuthorLast = authors[0].split(' ').pop() || authors[0];
    datasetName = `${firstAuthorLast} ${publicationYear}`;
  } else {
    // Last resort: use directory name
    datasetName = dirName.replace(/-/g, ' ');
  }

  const description = fullCitation ? `Thermochronology data from ${fullCitation}` : null;

  return {
    datasetName,
    fullCitation: fullCitation || '',
    authors,
    publicationJournal,
    publicationYear,
    publicationVolumePages,
    doi,
    pdfFilename,
    pdfUrl,
    supplementaryFilesUrl,
    studyLocation,
    mineralAnalyzed,
    sampleCount,
    ageRangeMinMa,
    ageRangeMaxMa,
    laboratory,
    description
  };
}

async function createDatasetRecord(metadata: ParsedMetadata): Promise<number> {
  const result = await query<{ id: number }>(`
    INSERT INTO datasets (
      dataset_name,
      description,
      full_citation,
      publication_year,
      publication_journal,
      publication_volume_pages,
      doi,
      pdf_filename,
      pdf_url,
      supplementary_files_url,
      study_location,
      mineral_analyzed,
      sample_count,
      age_range_min_ma,
      age_range_max_ma,
      authors,
      laboratory,
      created_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, NOW())
    RETURNING id
  `, [
    metadata.datasetName,
    metadata.description,
    metadata.fullCitation,
    metadata.publicationYear,
    metadata.publicationJournal,
    metadata.publicationVolumePages,
    metadata.doi,
    metadata.pdfFilename,
    metadata.pdfUrl,
    metadata.supplementaryFilesUrl,
    metadata.studyLocation,
    metadata.mineralAnalyzed,
    metadata.sampleCount,
    metadata.ageRangeMinMa,
    metadata.ageRangeMaxMa,
    metadata.authors,
    metadata.laboratory
  ]);

  return result[0].id;
}

function loadImageMetadata(paperPath: string): Map<string, string> {
  const metadataPath = path.join(paperPath, 'images', 'image-metadata.json');
  const captions = new Map<string, string>();

  if (!fs.existsSync(metadataPath)) {
    console.log('   ⚠️  No image-metadata.json found - captions will not be loaded');
    return captions;
  }

  try {
    const metadata: ImageMetadata = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'));

    // Process figures
    if (metadata.figures_summary) {
      for (const [figureName, figureData] of Object.entries(metadata.figures_summary)) {
        for (const image of figureData.images) {
          captions.set(image.filename, `${figureName}: ${figureData.description}`);
        }
      }
    }

    // Process tables
    if (metadata.tables_summary) {
      for (const [tableName, tableData] of Object.entries(metadata.tables_summary)) {
        for (const image of tableData.images) {
          captions.set(image.filename, `${tableName}: ${tableData.description}`);
        }
      }
    }

    console.log(`   ✅ Loaded captions for ${captions.size} images from image-metadata.json`);
  } catch (error) {
    console.log(`   ⚠️  Failed to parse image-metadata.json: ${error}`);
  }

  return captions;
}

async function uploadFiles(paperPath: string, extractedDir: string, datasetId: number): Promise<UploadedFile[]> {
  const uploadedFiles: UploadedFile[] = [];
  const datasetDir = path.join('public/data/datasets', datasetId.toString());

  // Load image captions from metadata
  console.log('📝 Loading image captions...');
  const imageCaptions = loadImageMetadata(paperPath);
  console.log();

  // Create dataset directory
  if (!fs.existsSync(datasetDir)) {
    fs.mkdirSync(datasetDir, { recursive: true });
  }

  // Upload PDF
  console.log('📄 Uploading PDF...');
  const pdfFiles = fs.readdirSync(paperPath).filter(f => f.endsWith('.pdf'));
  if (pdfFiles.length > 0) {
    const pdfSource = path.join(paperPath, pdfFiles[0]);
    const pdfDest = path.join(datasetDir, pdfFiles[0]);
    fs.copyFileSync(pdfSource, pdfDest);

    const pdfSize = fs.statSync(pdfDest).size;
    uploadedFiles.push({
      type: FILE_TYPES.PDF, // Using constant instead of hardcoded string
      source: pdfSource,
      dest: pdfDest,
      size: pdfSize
    });
    console.log(`   ✅ ${pdfFiles[0]} (${(pdfSize / 1024 / 1024).toFixed(2)} MB)`);
  } else {
    console.log(`   ⚠️  No PDF found`);
  }
  console.log();

  // Upload CSVs
  console.log('📊 Uploading extracted CSVs...');
  const csvDir = path.join(datasetDir, 'csv');
  if (!fs.existsSync(csvDir)) {
    fs.mkdirSync(csvDir, { recursive: true });
  }

  if (fs.existsSync(extractedDir)) {
    const csvFiles = fs.readdirSync(extractedDir).filter(f => f.endsWith('.csv'));
    for (const csvFile of csvFiles) {
      const csvSource = path.join(extractedDir, csvFile);
      const csvDest = path.join(csvDir, csvFile);
      fs.copyFileSync(csvSource, csvDest);

      const csvSize = fs.statSync(csvDest).size;
      const csvContent = fs.readFileSync(csvDest, 'utf-8');
      const rowCount = csvContent.split('\n').length - 1; // Exclude header

      uploadedFiles.push({
        type: FILE_TYPES.CSV, // Using constant instead of hardcoded string
        source: csvSource,
        dest: csvDest,
        size: csvSize,
        rows: rowCount
      });
      console.log(`   ✅ ${csvFile} (${rowCount} rows, ${(csvSize / 1024).toFixed(1)} KB)`);
    }
    console.log(`   Total CSVs: ${csvFiles.length}`);
  } else {
    console.log(`   ⚠️  No extracted/ directory found`);
  }
  console.log();

  // Upload table images
  console.log('🖼️  Uploading table screenshots...');
  const tablesDir = path.join(datasetDir, 'tables');
  if (!fs.existsSync(tablesDir)) {
    fs.mkdirSync(tablesDir, { recursive: true });
  }

  const imagesTablesPath = path.join(paperPath, 'images', 'tables');
  if (fs.existsSync(imagesTablesPath)) {
    const tableImages = fs.readdirSync(imagesTablesPath).filter(f => f.endsWith('.png'));
    for (const imgFile of tableImages) {
      const imgSource = path.join(imagesTablesPath, imgFile);
      const imgDest = path.join(tablesDir, imgFile);
      fs.copyFileSync(imgSource, imgDest);

      const imgSize = fs.statSync(imgDest).size;
      const caption = imageCaptions.get(imgFile) || 'Table screenshot';
      uploadedFiles.push({
        type: getFileTypeFromExtension(imgFile), // Using helper function for type safety
        source: imgSource,
        dest: imgDest,
        size: imgSize,
        description: caption
      });
      console.log(`   ✅ ${imgFile} (${(imgSize / 1024).toFixed(1)} KB)`);
    }
    console.log(`   Total table images: ${tableImages.length}`);
  } else {
    console.log(`   ⚠️  No table images found`);
  }
  console.log();

  // Upload figure images
  console.log('📈 Uploading figure images...');
  const figuresDir = path.join(datasetDir, 'figures');
  if (!fs.existsSync(figuresDir)) {
    fs.mkdirSync(figuresDir, { recursive: true });
  }

  const imagesFiguresPath = path.join(paperPath, 'images', 'figures');
  if (fs.existsSync(imagesFiguresPath)) {
    const figureImages = fs.readdirSync(imagesFiguresPath).filter(f => f.endsWith('.png'));
    for (const imgFile of figureImages) {
      const imgSource = path.join(imagesFiguresPath, imgFile);
      const imgDest = path.join(figuresDir, imgFile);
      fs.copyFileSync(imgSource, imgDest);

      const imgSize = fs.statSync(imgDest).size;
      const caption = imageCaptions.get(imgFile) || 'Figure';
      uploadedFiles.push({
        type: getFileTypeFromExtension(imgFile), // Using helper function for type safety
        source: imgSource,
        dest: imgDest,
        size: imgSize,
        description: caption
      });
      console.log(`   ✅ ${imgFile} (${(imgSize / 1024).toFixed(1)} KB)`);
    }
    console.log(`   Total figures: ${figureImages.length}`);
  } else {
    console.log(`   ⚠️  No figure images found`);
  }

  return uploadedFiles;
}

async function trackFilesInDatabase(uploadedFiles: UploadedFile[], datasetId: number): Promise<void> {
  for (const file of uploadedFiles) {
    const fileName = path.basename(file.dest);
    const filePath = path.relative('public', file.dest);
    const fileType = file.type;
    const fileSize = file.size;
    const rowCount = file.rows || null;
    const description = file.description || null;

    let displayName: string;
    if (fileType === FILE_TYPES.PDF) {
      displayName = 'Full Paper (PDF)';
    } else if (fileType === FILE_TYPES.CSV) {
      displayName = fileName.replace('_extracted.csv', '').replace(/_/g, ' ');
      displayName = displayName.charAt(0).toUpperCase() + displayName.slice(1);
    } else {
      displayName = fileName;
    }

    await query(`
      INSERT INTO data_files (
        dataset_id, file_name, file_path, file_type,
        display_name, file_size_bytes, row_count, description,
        created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
    `, [datasetId, fileName, filePath, fileType, displayName, fileSize, rowCount, description]);
  }
}

async function performFairAnalysis(uploadedFiles: UploadedFile[], metadata: ParsedMetadata, datasetId: number): Promise<any> {
  const csvFiles = uploadedFiles.filter(f => f.type === FILE_TYPES.CSV);

  const fairData: any = {
    dataset_name: metadata.datasetName,
    assessment_date: new Date().toISOString(),
    kohn_2024_compliance: {},
    fair_categories: {},
    summary: {},
    strengths: [],
    gaps: []
  };

  // Simplified FAIR analysis
  // In production, use lib/db/fair-compliance.ts for comprehensive assessment

  // Calculate FAIR category scores
  let findableScore = 25;
  const findableReasons: string[] = [];
  if (!metadata.doi) {
    findableScore -= 5;
    findableReasons.push('Missing DOI (-5)');
  }
  if (metadata.authors.length === 0) {
    findableScore -= 5;
    findableReasons.push('Missing authors (-5)');
  }
  if (!metadata.fullCitation) {
    findableScore -= 5;
    findableReasons.push('Missing citation (-5)');
  }

  let accessibleScore = 25;
  const accessibleReasons: string[] = [];
  if (!metadata.pdfUrl) {
    accessibleScore -= 10;
    accessibleReasons.push('No PDF URL (-10)');
  }
  if (csvFiles.length === 0) {
    accessibleScore -= 15;
    accessibleReasons.push('No data files (-15)');
  }

  const interopScore = Math.min(25, Math.round((csvFiles.length / Math.max(csvFiles.length, 1)) * 25));

  let reusableScore = 25;
  const reusableReasons: string[] = [];
  if (!metadata.laboratory) {
    reusableScore -= 5;
    reusableReasons.push('Missing laboratory (-5)');
  }
  if (!metadata.studyLocation) {
    reusableScore -= 5;
    reusableReasons.push('Missing study location (-5)');
  }

  fairData.fair_categories = {
    findable: {
      score: findableScore,
      max_score: 25,
      percentage: (findableScore / 25) * 100,
      reasoning: findableReasons.length > 0 ? findableReasons.join('; ') : 'Complete metadata present'
    },
    accessible: {
      score: accessibleScore,
      max_score: 25,
      percentage: (accessibleScore / 25) * 100,
      reasoning: accessibleReasons.length > 0 ? accessibleReasons.join('; ') : 'Data fully accessible'
    },
    interoperable: {
      score: interopScore,
      max_score: 25,
      percentage: (interopScore / 25) * 100,
      reasoning: `${csvFiles.length} EarthBank-compatible CSV files present`
    },
    reusable: {
      score: reusableScore,
      max_score: 25,
      percentage: (reusableScore / 25) * 100,
      reasoning: reusableReasons.length > 0 ? reusableReasons.join('; ') : 'Complete provenance metadata'
    }
  };

  console.log('📊 Calculating FAIR category scores...');
  console.log(`   Findable: ${findableScore}/25`);
  console.log(`   Accessible: ${accessibleScore}/25`);
  console.log(`   Interoperable: ${interopScore}/25`);
  console.log(`   Reusable: ${reusableScore}/25`);

  const totalScore = findableScore + accessibleScore + interopScore + reusableScore;
  let grade: string;
  if (totalScore >= 90) grade = 'A';
  else if (totalScore >= 80) grade = 'B';
  else if (totalScore >= 70) grade = 'C';
  else if (totalScore >= 60) grade = 'D';
  else grade = 'F';

  fairData.summary = {
    total_score: totalScore,
    max_score: 100,
    percentage: totalScore,
    grade
  };

  // Identify strengths
  if (totalScore >= 90) {
    fairData.strengths.push('Excellent FAIR compliance across all categories');
  }
  if (findableScore === 25) {
    fairData.strengths.push('Complete findability metadata (DOI, authors, citation)');
  }
  if (accessibleScore === 25) {
    fairData.strengths.push('Data fully accessible with PDF and data files');
  }
  if (csvFiles.length > 5) {
    fairData.strengths.push(`Rich dataset with ${csvFiles.length} data tables`);
  }

  // Identify gaps
  if (!metadata.doi) {
    fairData.gaps.push('Add DOI for persistent identification');
  }
  if (!metadata.pdfUrl) {
    fairData.gaps.push('Provide PDF URL for paper access');
  }

  return fairData;
}

async function generateFairReport(fairData: any, metadata: ParsedMetadata, uploadedFiles: UploadedFile[], totalSize: number, reportPath: string): Promise<void> {
  const report: string[] = [];

  report.push(`# FAIR Assessment Report: ${metadata.datasetName}\n`);
  report.push(`**Generated:** ${new Date().toLocaleString()}\n`);
  report.push('---\n');

  // Executive Summary
  report.push('## Executive Summary\n');
  report.push(`**FAIR Score:** ${fairData.summary.total_score}/100 (Grade ${fairData.summary.grade})\n`);
  report.push(`**Dataset:** ${metadata.datasetName}\n`);
  report.push(`**Citation:** ${metadata.fullCitation}\n`);

  // FAIR Breakdown
  report.push('## FAIR Assessment\n');
  report.push('| Category | Score | Percentage |\n');
  report.push('|----------|-------|------------|\n');
  report.push(`| Findable | ${fairData.fair_categories.findable.score}/25 | ${fairData.fair_categories.findable.percentage.toFixed(0)}% |\n`);
  report.push(`| Accessible | ${fairData.fair_categories.accessible.score}/25 | ${fairData.fair_categories.accessible.percentage.toFixed(0)}% |\n`);
  report.push(`| Interoperable | ${fairData.fair_categories.interoperable.score}/25 | ${fairData.fair_categories.interoperable.percentage.toFixed(0)}% |\n`);
  report.push(`| Reusable | ${fairData.fair_categories.reusable.score}/25 | ${fairData.fair_categories.reusable.percentage.toFixed(0)}% |\n`);
  report.push(`| **TOTAL** | **${fairData.summary.total_score}/100** | **${fairData.summary.total_score}%** |\n`);

  // Data Inventory
  report.push('## Data Inventory\n');
  report.push(`- **Samples:** ${metadata.sampleCount || 'Unknown'}\n`);
  report.push(`- **CSV Files:** ${uploadedFiles.filter(f => f.type === FILE_TYPES.CSV).length}\n`);
  report.push(`- **Table Images:** ${uploadedFiles.filter(f => f.type === FILE_TYPES.IMAGE_PNG && f.description === 'Table screenshot').length}\n`);
  report.push(`- **Figure Images:** ${uploadedFiles.filter(f => f.type === FILE_TYPES.IMAGE_PNG && f.description === 'Figure').length}\n`);
  report.push(`- **Total File Size:** ${(totalSize / 1024 / 1024).toFixed(2)} MB\n`);

  // Strengths
  if (fairData.strengths.length > 0) {
    report.push('## Strengths\n');
    fairData.strengths.forEach((s: string) => report.push(`- ${s}\n`));
  }

  // Gaps
  if (fairData.gaps.length > 0) {
    report.push('## Areas for Improvement\n');
    fairData.gaps.forEach((g: string) => report.push(`- ${g}\n`));
  }

  // References
  report.push('## References\n');
  report.push('- **Kohn et al. (2024)** - Reporting standards for thermochronology data. GSA Bulletin.\n');
  report.push('- **Nixon et al. (2025)** - EarthBank: A FAIR platform for geological data. Chemical Geology.\n');

  fs.writeFileSync(reportPath, report.join('\n'));
}

async function updateFairScores(datasetId: number, fairData: any): Promise<void> {
  // Insert fair_score_breakdown
  await query(`
    INSERT INTO fair_score_breakdown (
      dataset_id, total_score, grade,
      findable_score, findable_reasoning,
      accessible_score, accessible_reasoning,
      interoperable_score, interoperable_reasoning,
      reusable_score, reusable_reasoning,
      created_at, updated_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())
  `, [
    datasetId,
    fairData.summary.total_score,
    fairData.summary.grade,
    fairData.fair_categories.findable.score,
    fairData.fair_categories.findable.reasoning,
    fairData.fair_categories.accessible.score,
    fairData.fair_categories.accessible.reasoning,
    fairData.fair_categories.interoperable.score,
    fairData.fair_categories.interoperable.reasoning,
    fairData.fair_categories.reusable.score,
    fairData.fair_categories.reusable.reasoning
  ]);

  // Note: datasets table doesn't have fair_score column
  // FAIR score is stored in fair_score_breakdown table only
}

main().catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});
