/**
 * POST /api/extraction/[sessionId]/load
 *
 * Load Stage (Phase 4) - Exactly matching CLI `/thermoload` workflow
 *
 * This route does NOT import CSV data to earthbank_* tables.
 * It only creates dataset metadata, uploads files, and performs FAIR assessment.
 *
 * Steps:
 * 1. Parse paper metadata from paper-index.md
 * 2. Create dataset record in datasets table
 * 3. Upload files to public/data/datasets/[dataset_id]/
 * 4. Track files in data_files table
 * 5. Perform FAIR analysis against Kohn 2024 standards
 * 6. Generate FAIR reports (fair-compliance.json, extraction-report.md)
 * 7. Update database with FAIR scores
 * 8. Return success response with dataset info
 */

import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';
import { query, queryOne } from '@/lib/db/connection';
import { FILE_TYPES, getFileTypeFromExtension } from '@/lib/constants/file-types';

interface LoadResponse {
  success: boolean;
  dataset_id: number;
  dataset_name: string;
  fair_score: number;
  fair_grade: string;
  files_uploaded: number;
  total_size_bytes: number;
}

export async function POST(
  _request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  const { sessionId } = params;

  try {
    console.log(`[Load] Starting load for session: ${sessionId}`);

    // Get session from database
    const session = await queryOne<any>(
      'SELECT * FROM extraction_sessions WHERE session_id = $1',
      [sessionId]
    );

    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    // Verify session is in 'extracted' state
    if (session.state !== 'extracted') {
      return NextResponse.json(
        { error: `Cannot load from state '${session.state}'. Session must be in 'extracted' state.` },
        { status: 400 }
      );
    }

    // Update session state to 'loading'
    await query(
      'UPDATE extraction_sessions SET state = $1, updated_at = NOW() WHERE session_id = $2',
      ['loading', sessionId]
    );

    const sessionDir = path.join(process.cwd(), 'public', 'uploads', sessionId);

    // ========================================
    // STEP 1: Parse Paper Metadata
    // ========================================
    console.log('[Load] Step 1: Parsing paper metadata...');

    const paperIndexPath = path.join(sessionDir, 'paper-index.md');
    const paperIndexContent = await fs.readFile(paperIndexPath, 'utf-8');

    const metadata = parsePaperMetadata(paperIndexContent, session.pdf_filename);

    console.log('[Load] Parsed metadata:', {
      dataset_name: metadata.dataset_name,
      authors: metadata.authors,
      doi: metadata.doi,
      year: metadata.publication_year
    });

    // ========================================
    // STEP 2: Create Dataset Record
    // ========================================
    console.log('[Load] Step 2: Creating dataset record...');

    const dataset = await queryOne<{ id: number }>(
      `INSERT INTO datasets (
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
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
        $11, $12, $13, $14, $15, $16, $17, NOW()
      )
      RETURNING id`,
      [
        metadata.dataset_name,
        metadata.description,
        metadata.full_citation,
        metadata.publication_year,
        metadata.publication_journal,
        metadata.publication_volume_pages,
        metadata.doi,
        metadata.pdf_filename,
        metadata.pdf_url,
        metadata.supplementary_files_url,
        metadata.study_location,
        metadata.mineral_analyzed,
        metadata.sample_count,
        metadata.age_range_min_ma,
        metadata.age_range_max_ma,
        metadata.authors,
        metadata.laboratory
      ]
    );

    const datasetId = dataset!.id;
    console.log(`[Load] Created dataset ID: ${datasetId}`);

    // ========================================
    // STEP 3: Upload Files to Public Directory
    // ========================================
    console.log('[Load] Step 3: Uploading files to public directory...');

    const datasetDir = path.join(process.cwd(), 'public', 'data', 'datasets', datasetId.toString());
    await fs.mkdir(datasetDir, { recursive: true });
    await fs.mkdir(path.join(datasetDir, 'csv'), { recursive: true });
    await fs.mkdir(path.join(datasetDir, 'tables'), { recursive: true });
    await fs.mkdir(path.join(datasetDir, 'figures'), { recursive: true });

    const uploadedFiles: Array<{
      file_name: string;
      file_path: string;
      file_type: string;
      file_size_bytes: number;
      row_count?: number;
      display_name?: string;
      description?: string;
    }> = [];

    // Upload PDF
    const pdfSource = path.join(sessionDir, 'original.pdf');
    const pdfDest = path.join(datasetDir, metadata.pdf_filename);
    await fs.copyFile(pdfSource, pdfDest);
    const pdfStats = await fs.stat(pdfDest);
    uploadedFiles.push({
      file_name: metadata.pdf_filename,
      file_path: `data/datasets/${datasetId}/${metadata.pdf_filename}`,
      file_type: FILE_TYPES.PDF,
      file_size_bytes: pdfStats.size,
      display_name: metadata.pdf_filename,
      description: 'Original research paper PDF'
    });

    // Upload CSVs
    const extractedDir = path.join(sessionDir, 'extracted');
    try {
      const csvFiles = await fs.readdir(extractedDir);
      for (const csvFile of csvFiles.filter(f => f.endsWith('.csv'))) {
        const csvSource = path.join(extractedDir, csvFile);
        const csvDest = path.join(datasetDir, 'csv', csvFile);
        await fs.copyFile(csvSource, csvDest);
        const csvStats = await fs.stat(csvDest);

        // Count rows (excluding header)
        const csvContent = await fs.readFile(csvDest, 'utf-8');
        const rowCount = csvContent.split('\n').filter(line => line.trim()).length - 1;

        uploadedFiles.push({
          file_name: csvFile,
          file_path: `data/datasets/${datasetId}/csv/${csvFile}`,
          file_type: FILE_TYPES.CSV,
          file_size_bytes: csvStats.size,
          row_count: rowCount,
          display_name: csvFile.replace('.csv', '').replace(/_/g, ' '),
          description: `Extracted data table (${rowCount} rows)`
        });
      }
    } catch (err) {
      console.log('[Load] No extracted CSV files found (this is OK)');
    }

    // Upload table images
    const tablesImageDir = path.join(sessionDir, 'images', 'tables');
    try {
      const tableImages = await fs.readdir(tablesImageDir);
      for (const imgFile of tableImages) {
        const imgSource = path.join(tablesImageDir, imgFile);
        const imgDest = path.join(datasetDir, 'tables', imgFile);
        await fs.copyFile(imgSource, imgDest);
        const imgStats = await fs.stat(imgDest);

        uploadedFiles.push({
          file_name: imgFile,
          file_path: `data/datasets/${datasetId}/tables/${imgFile}`,
          file_type: getFileTypeFromExtension(imgFile),
          file_size_bytes: imgStats.size,
          display_name: imgFile.replace(/\.(png|jpg|jpeg|tiff)$/i, ''),
          description: 'Table screenshot from paper'
        });
      }
    } catch (err) {
      console.log('[Load] No table images found (this is OK)');
    }

    // Upload figure images
    const figuresImageDir = path.join(sessionDir, 'images', 'figures');
    try {
      const figureImages = await fs.readdir(figuresImageDir);
      for (const imgFile of figureImages) {
        const imgSource = path.join(figuresImageDir, imgFile);
        const imgDest = path.join(datasetDir, 'figures', imgFile);
        await fs.copyFile(imgSource, imgDest);
        const imgStats = await fs.stat(imgDest);

        uploadedFiles.push({
          file_name: imgFile,
          file_path: `data/datasets/${datasetId}/figures/${imgFile}`,
          file_type: getFileTypeFromExtension(imgFile),
          file_size_bytes: imgStats.size,
          display_name: imgFile.replace(/\.(png|jpg|jpeg|tiff)$/i, ''),
          description: 'Figure image from paper'
        });
      }
    } catch (err) {
      console.log('[Load] No figure images found (this is OK)');
    }

    console.log(`[Load] Uploaded ${uploadedFiles.length} files`);

    // ========================================
    // STEP 4: Track Files in Database
    // ========================================
    console.log('[Load] Step 4: Tracking files in database...');

    for (const file of uploadedFiles) {
      await query(
        `INSERT INTO data_files (
          dataset_id,
          file_name,
          file_path,
          file_type,
          display_name,
          file_size_bytes,
          row_count,
          description,
          upload_status,
          created_at,
          updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'available', NOW(), NOW())`,
        [
          datasetId,
          file.file_name,
          file.file_path,
          file.file_type,
          file.display_name,
          file.file_size_bytes,
          file.row_count || null,
          file.description
        ]
      );
    }

    // ========================================
    // STEP 5: Perform FAIR Analysis
    // ========================================
    console.log('[Load] Step 5: Performing FAIR analysis...');

    const fairAssessment = await performFAIRAnalysis(metadata, uploadedFiles);

    console.log('[Load] FAIR assessment:', {
      total_score: fairAssessment.total_score,
      grade: fairAssessment.grade,
      findable: fairAssessment.findable_score,
      accessible: fairAssessment.accessible_score,
      interoperable: fairAssessment.interoperable_score,
      reusable: fairAssessment.reusable_score
    });

    // ========================================
    // STEP 6: Generate FAIR Reports
    // ========================================
    console.log('[Load] Step 6: Generating FAIR reports...');

    const fairComplianceJson = {
      dataset_id: datasetId,
      dataset_name: metadata.dataset_name,
      assessment_date: new Date().toISOString(),
      total_score: fairAssessment.total_score,
      grade: fairAssessment.grade,
      kohn_2024_compliance: {
        table4_score: fairAssessment.table4_score,
        table4_reasoning: fairAssessment.table4_reasoning,
        table5_score: fairAssessment.table5_score,
        table5_reasoning: fairAssessment.table5_reasoning,
        table6_score: fairAssessment.table6_score,
        table6_reasoning: fairAssessment.table6_reasoning,
        table10_score: fairAssessment.table10_score,
        table10_reasoning: fairAssessment.table10_reasoning
      },
      fair_categories: {
        findable: {
          score: fairAssessment.findable_score,
          reasoning: fairAssessment.findable_reasoning
        },
        accessible: {
          score: fairAssessment.accessible_score,
          reasoning: fairAssessment.accessible_reasoning
        },
        interoperable: {
          score: fairAssessment.interoperable_score,
          reasoning: fairAssessment.interoperable_reasoning
        },
        reusable: {
          score: fairAssessment.reusable_score,
          reasoning: fairAssessment.reusable_reasoning
        }
      }
    };

    // Save fair-compliance.json
    const fairJsonPath = path.join(sessionDir, 'fair-compliance.json');
    await fs.writeFile(fairJsonPath, JSON.stringify(fairComplianceJson, null, 2), 'utf-8');

    // Generate extraction-report.md
    const reportMd = generateExtractionReport(metadata, uploadedFiles, fairAssessment);
    const reportPath = path.join(sessionDir, 'extraction-report.md');
    await fs.writeFile(reportPath, reportMd, 'utf-8');

    console.log('[Load] Generated FAIR reports');

    // ========================================
    // STEP 7: Update Database with FAIR Scores
    // ========================================
    console.log('[Load] Step 7: Updating database with FAIR scores...');

    await query(
      `INSERT INTO fair_score_breakdown (
        dataset_id,
        table4_score, table4_reasoning,
        table5_score, table5_reasoning,
        table6_score, table6_reasoning,
        table10_score, table10_reasoning,
        findable_score, findable_reasoning,
        accessible_score, accessible_reasoning,
        interoperable_score, interoperable_reasoning,
        reusable_score, reusable_reasoning,
        total_score, grade,
        created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, NOW(), NOW()
      )`,
      [
        datasetId,
        fairAssessment.table4_score, fairAssessment.table4_reasoning,
        fairAssessment.table5_score, fairAssessment.table5_reasoning,
        fairAssessment.table6_score, fairAssessment.table6_reasoning,
        fairAssessment.table10_score, fairAssessment.table10_reasoning,
        fairAssessment.findable_score, fairAssessment.findable_reasoning,
        fairAssessment.accessible_score, fairAssessment.accessible_reasoning,
        fairAssessment.interoperable_score, fairAssessment.interoperable_reasoning,
        fairAssessment.reusable_score, fairAssessment.reusable_reasoning,
        fairAssessment.total_score, fairAssessment.grade
      ]
    );

    // ========================================
    // STEP 8: Update Session State to 'loaded'
    // ========================================
    console.log('[Load] Step 8: Updating session state...');

    await query(
      `UPDATE extraction_sessions
       SET state = 'loaded',
           dataset_id = $1,
           fair_score = $2,
           completed_at = NOW(),
           updated_at = NOW()
       WHERE session_id = $3`,
      [datasetId, fairAssessment.total_score, sessionId]
    );

    // Calculate total size
    const totalSizeBytes = uploadedFiles.reduce((sum, f) => sum + f.file_size_bytes, 0);

    const response: LoadResponse = {
      success: true,
      dataset_id: datasetId,
      dataset_name: metadata.dataset_name,
      fair_score: fairAssessment.total_score,
      fair_grade: fairAssessment.grade,
      files_uploaded: uploadedFiles.length,
      total_size_bytes: totalSizeBytes
    };

    console.log('[Load] ✅ Load complete!', response);

    return NextResponse.json(response);

  } catch (error: any) {
    console.error('[Load] Error:', error);

    // Update session with error
    await query(
      `UPDATE extraction_sessions
       SET state = 'failed',
           error_message = $1,
           error_stage = 'load',
           updated_at = NOW()
       WHERE session_id = $2`,
      [error.message, sessionId]
    );

    return NextResponse.json(
      { error: 'Load failed', details: error.message },
      { status: 500 }
    );
  }
}

// ========================================
// Helper Functions
// ========================================

function parsePaperMetadata(content: string, pdfFilename: string) {
  // Extract citation
  const citationMatch = content.match(/\*\*Citation:\*\*\s*(.+)/);
  const full_citation = citationMatch ? citationMatch[1].trim() : null;

  // Extract authors
  const authorsMatch = content.match(/\*\*Authors:\*\*\s*(.+)/);
  let authors: string[] = [];
  if (authorsMatch) {
    const authorsText = authorsMatch[1];
    authors = authorsText.split(',').map(author => {
      // Remove affiliation in parentheses
      return author.replace(/\s*\([^)]+\)/g, '').trim();
    }).filter(name => name.length > 0);
  }

  // Extract journal
  const journalMatch = content.match(/\*\*Journal:\*\*\s*([^,\n]+)/);
  const publication_journal = journalMatch ? journalMatch[1].trim() : null;

  // Extract year
  const yearMatch = content.match(/\*\*Year:\*\*\s*(\d{4})/);
  const publication_year = yearMatch ? parseInt(yearMatch[1]) : null;

  // Extract DOI
  const doiMatch = content.match(/\*\*DOI:\*\*\s*(?:https?:\/\/doi\.org\/)?([\w./-]+)/);
  const doi = doiMatch ? doiMatch[1].trim() : null;

  // Extract volume/pages
  const volumeMatch = content.match(/Volume\s+(\d+)[,\s]+(?:Article\s+)?(\S+)/);
  const publication_volume_pages = volumeMatch ? `Volume ${volumeMatch[1]}, ${volumeMatch[2]}` : null;

  // Extract PDF URL
  const pdfUrlMatch = content.match(/\*\*PDF URL:\*\*\s*(https?:\/\/[^\s\n]+)/);
  const pdf_url = pdfUrlMatch ? pdfUrlMatch[1].trim() : null;

  // Extract supplementary files URL
  const suppMatch = content.match(/\*\*Supplementary Files URL:\*\*\s*(https?:\/\/[^\s\n]+)/);
  let supplementary_files_url = suppMatch ? suppMatch[1].trim() : null;
  if (supplementary_files_url && supplementary_files_url.includes('None')) {
    supplementary_files_url = null;
  }

  // Extract study area/location
  const studyMatch = content.match(/\*\*Study Area:\*\*\s*(.+)/);
  const study_location = studyMatch ? studyMatch[1].trim() : null;

  // Extract mineral analyzed
  const mineralMatch = content.match(/\*\*Method:\*\*\s*(?:Both\s+)?(?:AFT.*?and\s+)?(?:AHe)?\s*\(([^)]+)\)/);
  let mineral_analyzed = null;
  if (mineralMatch) {
    const mineralText = mineralMatch[1];
    if (mineralText.toLowerCase().includes('apatite')) {
      mineral_analyzed = 'Apatite';
    } else if (mineralText.toLowerCase().includes('zircon')) {
      mineral_analyzed = 'Zircon';
    } else {
      mineral_analyzed = mineralText;
    }
  }

  // Extract sample count
  const sampleCountMatch = content.match(/\*\*Sample Count:\*\*\s*(\d+)/);
  const sample_count = sampleCountMatch ? parseInt(sampleCountMatch[1]) : null;

  // Extract age range
  const ageRangeMatch = content.match(/\*\*Age Range:\*\*\s*~?(\d+)-(\d+)\s*Ma/);
  const age_range_min_ma = ageRangeMatch ? parseFloat(ageRangeMatch[1]) : null;
  const age_range_max_ma = ageRangeMatch ? parseFloat(ageRangeMatch[2]) : null;

  // Extract laboratory
  const labMatch = content.match(/\*\*Laboratory:\*\*\s*(.+)/);
  const laboratory = labMatch ? labMatch[1].trim() : null;

  // Generate dataset name
  let dataset_name = 'Unknown Dataset';
  if (authors.length > 0 && publication_year) {
    const firstAuthorLast = authors[0].split(' ').pop() || authors[0];
    dataset_name = `${firstAuthorLast} ${publication_year}`;
  }

  // Generate description
  const description = full_citation ? `Thermochronology data from ${full_citation}` : null;

  return {
    dataset_name,
    description,
    full_citation,
    publication_year,
    publication_journal,
    publication_volume_pages,
    doi,
    pdf_filename: pdfFilename,
    pdf_url,
    supplementary_files_url,
    study_location,
    mineral_analyzed,
    sample_count,
    age_range_min_ma,
    age_range_max_ma,
    authors,
    laboratory
  };
}

async function performFAIRAnalysis(metadata: any, files: any[]) {
  // Initialize scores
  let findable_score = 0;
  let accessible_score = 0;
  let interoperable_score = 0;
  let reusable_score = 0;

  const findable_reasons: string[] = [];
  const accessible_reasons: string[] = [];
  const interoperable_reasons: string[] = [];
  const reusable_reasons: string[] = [];

  // FINDABLE (max 25 points)
  if (metadata.doi) {
    findable_score += 10;
    findable_reasons.push('✓ DOI present (10 pts)');
  } else {
    findable_reasons.push('✗ No DOI (0 pts)');
  }

  if (metadata.authors && metadata.authors.length > 0) {
    findable_score += 8;
    findable_reasons.push(`✓ Authors listed (${metadata.authors.length} authors, 8 pts)`);
  } else {
    findable_reasons.push('✗ No authors (0 pts)');
  }

  if (metadata.full_citation) {
    findable_score += 7;
    findable_reasons.push('✓ Full citation (7 pts)');
  } else {
    findable_reasons.push('✗ No citation (0 pts)');
  }

  // ACCESSIBLE (max 25 points)
  const pdfFiles = files.filter(f => f.file_type === FILE_TYPES.PDF);
  if (pdfFiles.length > 0) {
    accessible_score += 10;
    accessible_reasons.push(`✓ PDF available (${pdfFiles.length} files, 10 pts)`);
  } else {
    accessible_reasons.push('✗ No PDF (0 pts)');
  }

  const csvFiles = files.filter(f => f.file_type === FILE_TYPES.CSV);
  if (csvFiles.length > 0) {
    accessible_score += 10;
    accessible_reasons.push(`✓ CSV data files (${csvFiles.length} files, 10 pts)`);
  } else {
    accessible_reasons.push('✗ No CSV data (0 pts)');
  }

  if (metadata.pdf_url) {
    accessible_score += 5;
    accessible_reasons.push('✓ PDF URL provided (5 pts)');
  } else {
    accessible_reasons.push('✗ No PDF URL (0 pts)');
  }

  // INTEROPERABLE (max 25 points)
  // Simple heuristic: check if CSVs follow naming conventions
  const ftFiles = csvFiles.filter((f: any) => f.file_name.toLowerCase().includes('ft') || f.file_name.toLowerCase().includes('fission'));
  const heFiles = csvFiles.filter((f: any) => f.file_name.toLowerCase().includes('he') || f.file_name.toLowerCase().includes('helium'));

  if (ftFiles.length > 0 || heFiles.length > 0) {
    interoperable_score += 15;
    interoperable_reasons.push(`✓ EarthBank-compatible naming (${ftFiles.length} FT, ${heFiles.length} He, 15 pts)`);
  } else {
    interoperable_reasons.push('✗ No EarthBank-compatible files (0 pts)');
  }

  if (csvFiles.length > 0) {
    interoperable_score += 10;
    interoperable_reasons.push('✓ Machine-readable CSV format (10 pts)');
  }

  // REUSABLE (max 25 points)
  if (metadata.laboratory) {
    reusable_score += 8;
    reusable_reasons.push(`✓ Laboratory specified (${metadata.laboratory}, 8 pts)`);
  } else {
    reusable_reasons.push('✗ No laboratory info (0 pts)');
  }

  if (metadata.study_location) {
    reusable_score += 7;
    reusable_reasons.push(`✓ Study location (${metadata.study_location}, 7 pts)`);
  } else {
    reusable_reasons.push('✗ No study location (0 pts)');
  }

  if (metadata.mineral_analyzed) {
    reusable_score += 5;
    reusable_reasons.push(`✓ Mineral specified (${metadata.mineral_analyzed}, 5 pts)`);
  } else {
    reusable_reasons.push('✗ No mineral info (0 pts)');
  }

  if (metadata.sample_count) {
    reusable_score += 5;
    reusable_reasons.push(`✓ Sample count (${metadata.sample_count} samples, 5 pts)`);
  } else {
    reusable_reasons.push('✗ No sample count (0 pts)');
  }

  const total_score = findable_score + accessible_score + interoperable_score + reusable_score;

  // Calculate grade
  let grade = 'F';
  if (total_score >= 90) grade = 'A';
  else if (total_score >= 80) grade = 'B';
  else if (total_score >= 70) grade = 'C';
  else if (total_score >= 60) grade = 'D';

  // Kohn 2024 scores (simplified - would need actual CSV analysis)
  // For MVP, use heuristic scoring
  const table4_score = metadata.sample_count ? 12 : 5; // Sample metadata
  const table5_score = ftFiles.length > 0 ? 12 : 0;    // FT count data
  const table6_score = ftFiles.length > 0 ? 8 : 0;     // Track length data
  const table10_score = ftFiles.length > 0 || heFiles.length > 0 ? 8 : 0; // Ages

  return {
    total_score,
    grade,
    findable_score,
    findable_reasoning: findable_reasons.join('\n'),
    accessible_score,
    accessible_reasoning: accessible_reasons.join('\n'),
    interoperable_score,
    interoperable_reasoning: interoperable_reasons.join('\n'),
    reusable_score,
    reusable_reasoning: reusable_reasons.join('\n'),
    table4_score,
    table4_reasoning: metadata.sample_count ? 'Sample metadata present' : 'Limited sample metadata',
    table5_score,
    table5_reasoning: ftFiles.length > 0 ? 'FT count data available' : 'No FT count data',
    table6_score,
    table6_reasoning: ftFiles.length > 0 ? 'Track length data likely present' : 'No track length data',
    table10_score,
    table10_reasoning: (ftFiles.length > 0 || heFiles.length > 0) ? 'Age data available' : 'No age data'
  };
}

function generateExtractionReport(metadata: any, files: any[], fairAssessment: any): string {
  const totalSize = files.reduce((sum, f) => sum + f.file_size_bytes, 0);
  const sizeMB = (totalSize / 1024 / 1024).toFixed(2);

  return `# Extraction Report

**Dataset:** ${metadata.dataset_name}
**Date:** ${new Date().toISOString().split('T')[0]}

---

## Dataset Information

- **Citation:** ${metadata.full_citation || 'N/A'}
- **Authors:** ${metadata.authors?.join(', ') || 'N/A'}
- **Journal:** ${metadata.publication_journal || 'N/A'} (${metadata.publication_year || 'N/A'})
- **DOI:** ${metadata.doi || 'N/A'}
- **Study Location:** ${metadata.study_location || 'N/A'}
- **Mineral:** ${metadata.mineral_analyzed || 'N/A'}
- **Sample Count:** ${metadata.sample_count || 'N/A'}
- **Laboratory:** ${metadata.laboratory || 'N/A'}

---

## Files Uploaded

**Total:** ${files.length} files (${sizeMB} MB)

${files.map(f => `- ${f.display_name} (${f.file_type}) - ${(f.file_size_bytes / 1024).toFixed(1)} KB${f.row_count ? ` - ${f.row_count} rows` : ''}`).join('\n')}

---

## FAIR Compliance Assessment

**Overall Score:** ${fairAssessment.total_score}/100 (Grade ${fairAssessment.grade})

### Category Scores

| Category | Score | Max | Percentage |
|----------|-------|-----|------------|
| Findable | ${fairAssessment.findable_score} | 25 | ${((fairAssessment.findable_score / 25) * 100).toFixed(0)}% |
| Accessible | ${fairAssessment.accessible_score} | 25 | ${((fairAssessment.accessible_score / 25) * 100).toFixed(0)}% |
| Interoperable | ${fairAssessment.interoperable_score} | 25 | ${((fairAssessment.interoperable_score / 25) * 100).toFixed(0)}% |
| Reusable | ${fairAssessment.reusable_score} | 25 | ${((fairAssessment.reusable_score / 25) * 100).toFixed(0)}% |

### Findable
${fairAssessment.findable_reasoning}

### Accessible
${fairAssessment.accessible_reasoning}

### Interoperable
${fairAssessment.interoperable_reasoning}

### Reusable
${fairAssessment.reusable_reasoning}

---

## Kohn et al. (2024) Compliance

| Table | Score | Max | Description |
|-------|-------|-----|-------------|
| Table 4 | ${fairAssessment.table4_score} | 15 | Sample Metadata |
| Table 5 | ${fairAssessment.table5_score} | 15 | FT Count Data |
| Table 6 | ${fairAssessment.table6_score} | 10 | Track Length Data |
| Table 10 | ${fairAssessment.table10_score} | 10 | FT Ages |

---

**Report Generated:** ${new Date().toISOString()}
`;
}
