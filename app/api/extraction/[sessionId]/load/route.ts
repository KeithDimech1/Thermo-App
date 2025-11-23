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
 * 3. Copy files from extractions bucket to datasets bucket
 * 4. Track files in data_files table (with Supabase Storage URLs)
 * 5. Perform FAIR analysis against Kohn 2024 standards
 * 6. Generate FAIR reports (fair-compliance.json, extraction-report.md)
 * 7. Update database with FAIR scores
 * 8. Return success response with dataset info
 *
 * ERROR-021: Migrated to Supabase Storage
 */

import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db/connection';
import { FILE_TYPES, getFileTypeFromExtension } from '@/lib/constants/file-types';
import { downloadFile, uploadFile, listFiles } from '@/lib/storage/supabase';

interface LoadResponse {
  success: boolean;
  dataset_id: number;
  dataset_name: string;
  fair_score: number;
  fair_grade: string;
  files_uploaded: number;
  total_size_bytes: number;
}

interface RouteParams {
  params: Promise<{
    sessionId: string;
  }>;
}

export async function POST(
  _request: NextRequest,
  { params }: RouteParams
) {
  const { sessionId } = await params;

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

    // Verify session is in 'extracted' or 'analyzed' state
    // 'analyzed' state is allowed for papers with no tables (paper-agnostic workflow)
    const validStates = ['extracted', 'analyzed'];
    if (!validStates.includes(session.state)) {
      return NextResponse.json(
        { error: `Cannot load from state '${session.state}'. Session must be in 'extracted' or 'analyzed' state.` },
        { status: 400 }
      );
    }

    // Update session state to 'loading'
    await query(
      'UPDATE extraction_sessions SET state = $1, updated_at = NOW() WHERE session_id = $2',
      ['loading', sessionId]
    );

    // ========================================
    // STEP 1: Parse Paper Metadata
    // ========================================
    console.log('[Load] Step 1: Parsing paper metadata from Supabase Storage...');

    // Download paper-index.md from Supabase Storage
    const paperIndexBuffer = await downloadFile('extractions', `${sessionId}/paper-index.md`);
    const paperIndexContent = paperIndexBuffer.toString('utf-8');

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
        publication_reference,
        publication_doi,
        study_area,
        created_at
      ) VALUES (
        $1, $2, $3, $4, $5, NOW()
      )
      RETURNING id`,
      [
        metadata.dataset_name,
        metadata.description,
        metadata.full_citation, // Map to publication_reference
        metadata.doi, // Map to publication_doi
        metadata.study_location // Map to study_area
      ]
    );

    const datasetId = dataset!.id;
    console.log(`[Load] Created dataset ID: ${datasetId}`);

    // ========================================
    // STEP 3: Copy Files from Extractions to Datasets Bucket
    // ========================================
    console.log('[Load] Step 3: Copying files from extractions to datasets bucket...');

    const uploadedFiles: Array<{
      file_name: string;
      file_path: string;
      file_type: string;
      file_size_bytes: number;
      mime_type?: string;
      row_count?: number;
      display_name?: string;
      description?: string;
    }> = [];

    // Copy PDF
    console.log('[Load] Copying PDF...');
    const pdfBuffer = await downloadFile('extractions', `${sessionId}/original.pdf`);
    const pdfUrl = await uploadFile(
      'datasets',
      `${datasetId}/${metadata.pdf_filename}`,
      pdfBuffer,
      'application/pdf'
    );
    uploadedFiles.push({
      file_name: metadata.pdf_filename,
      file_path: pdfUrl,
      file_type: FILE_TYPES.PDF,
      mime_type: 'application/pdf',
      file_size_bytes: pdfBuffer.length,
      display_name: metadata.pdf_filename,
      description: 'Original research paper PDF'
    });

    // Copy CSVs
    console.log('[Load] Copying CSV files...');
    try {
      const extractedFiles = await listFiles('extractions', `${sessionId}/extracted`);
      const csvFiles = extractedFiles.filter(f => f.name.endsWith('.csv'));

      for (const csvFile of csvFiles) {
        const csvBuffer = await downloadFile('extractions', `${sessionId}/extracted/${csvFile.name}`);
        const csvUrl = await uploadFile(
          'datasets',
          `${datasetId}/csv/${csvFile.name}`,
          csvBuffer,
          'text/csv'
        );

        // Count rows (excluding header)
        const csvContent = csvBuffer.toString('utf-8');
        const rowCount = csvContent.split('\n').filter(line => line.trim()).length - 1;

        uploadedFiles.push({
          file_name: csvFile.name,
          file_path: csvUrl,
          file_type: FILE_TYPES.CSV,
          mime_type: 'text/csv',
          file_size_bytes: csvBuffer.length,
          row_count: rowCount,
          display_name: csvFile.name.replace('.csv', '').replace(/_/g, ' '),
          description: `Extracted data table (${rowCount} rows)`
        });
      }
    } catch (err) {
      console.log('[Load] No extracted CSV files found (this is OK)');
    }

    // Copy table images
    console.log('[Load] Copying table images...');
    try {
      const tableImages = await listFiles('extractions', `${sessionId}/images/tables`);

      for (const imgFile of tableImages) {
        const imgBuffer = await downloadFile('extractions', `${sessionId}/images/tables/${imgFile.name}`);
        const imgUrl = await uploadFile(
          'datasets',
          `${datasetId}/tables/${imgFile.name}`,
          imgBuffer,
          getFileTypeFromExtension(imgFile.name)
        );

        uploadedFiles.push({
          file_name: imgFile.name,
          file_path: imgUrl,
          file_type: getFileTypeFromExtension(imgFile.name),
          mime_type: getFileTypeFromExtension(imgFile.name),
          file_size_bytes: imgBuffer.length,
          display_name: imgFile.name.replace(/\.(png|jpg|jpeg|tiff)$/i, ''),
          description: 'Table screenshot from paper'
        });
      }
    } catch (err) {
      console.log('[Load] No table images found (this is OK)');
    }

    // Copy figure images
    console.log('[Load] Copying figure images...');
    try {
      const figureImages = await listFiles('extractions', `${sessionId}/images/figures`);

      for (const imgFile of figureImages) {
        const imgBuffer = await downloadFile('extractions', `${sessionId}/images/figures/${imgFile.name}`);
        const imgUrl = await uploadFile(
          'datasets',
          `${datasetId}/figures/${imgFile.name}`,
          imgBuffer,
          getFileTypeFromExtension(imgFile.name)
        );

        uploadedFiles.push({
          file_name: imgFile.name,
          file_path: imgUrl,
          file_type: getFileTypeFromExtension(imgFile.name),
          mime_type: getFileTypeFromExtension(imgFile.name),
          file_size_bytes: imgBuffer.length,
          display_name: imgFile.name.replace(/\.(png|jpg|jpeg|tiff)$/i, ''),
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
          file_size_bytes,
          mime_type,
          description,
          created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
        [
          datasetId,
          file.file_name,
          file.file_path,
          file.file_type,
          file.file_size_bytes,
          file.mime_type || null,
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

    // Upload fair-compliance.json to datasets bucket
    await uploadFile(
      'datasets',
      `${datasetId}/fair-compliance.json`,
      Buffer.from(JSON.stringify(fairComplianceJson, null, 2), 'utf-8'),
      'application/json'
    );

    // Generate and upload extraction-report.md
    const reportMd = generateExtractionReport(metadata, uploadedFiles, fairAssessment);
    await uploadFile(
      'datasets',
      `${datasetId}/extraction-report.md`,
      Buffer.from(reportMd, 'utf-8'),
      'text/markdown'
    );

    console.log('[Load] Generated and uploaded FAIR reports');

    // ========================================
    // STEP 7: Update Database with FAIR Scores
    // ========================================
    console.log('[Load] Step 7: Updating database with FAIR scores...');

    await query(
      `INSERT INTO fair_score_breakdown (
        dataset_id,
        findable_score,
        accessible_score,
        interoperable_score,
        reusable_score,
        total_score,
        has_persistent_id,
        has_descriptive_metadata,
        has_keywords,
        has_open_access,
        has_standard_protocol,
        uses_standard_format,
        uses_controlled_vocab,
        has_field_definitions,
        has_license,
        has_provenance,
        has_qc_metrics,
        created_at,
        updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, NOW(), NOW()
      )`,
      [
        datasetId,
        fairAssessment.findable_score,
        fairAssessment.accessible_score,
        fairAssessment.interoperable_score,
        fairAssessment.reusable_score,
        fairAssessment.total_score,
        fairAssessment.has_persistent_id || false,
        fairAssessment.has_descriptive_metadata || false,
        fairAssessment.has_keywords || false,
        fairAssessment.has_open_access || false,
        fairAssessment.has_standard_protocol || false,
        fairAssessment.uses_standard_format || false,
        fairAssessment.uses_controlled_vocab || false,
        fairAssessment.has_field_definitions || false,
        fairAssessment.has_license || false,
        fairAssessment.has_provenance || false,
        fairAssessment.has_qc_metrics || false
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

    // Try to update session with error (don't fail if database is down)
    try {
      await query(
        `UPDATE extraction_sessions
         SET state = 'failed',
             error_message = $1,
             error_stage = 'load',
             updated_at = NOW()
         WHERE session_id = $2`,
        [error.message, sessionId]
      );
    } catch (dbError) {
      console.error('[Load] Failed to update session error state (database may be down):', dbError);
    }

    // Always return JSON response even if database update fails
    return NextResponse.json(
      {
        error: 'Load failed',
        details: error.message || 'Unknown error',
        code: error.code || 'UNKNOWN'
      },
      { status: 500 }
    );
  }
}

// ========================================
// Helper Functions
// ========================================

function parsePaperMetadata(content: string, pdfFilename: string) {
  // Extract title
  const titleMatch = content.match(/\*\*Title:\*\*\s*(.+)/);
  const title = titleMatch?.[1]?.trim() || 'Unknown Title';

  // Extract authors
  const authorsMatch = content.match(/\*\*Authors:\*\*\s*(.+)/);
  let authors: string[] = [];
  if (authorsMatch?.[1]) {
    const authorsText = authorsMatch[1];
    authors = authorsText.split(',').map(author => author.trim()).filter(name => name.length > 0);
  }

  // Extract affiliations (to use for laboratory extraction)
  const affiliationsMatch = content.match(/\*\*Affiliations:\*\*\s*(.+)/);
  const affiliations = affiliationsMatch?.[1]?.trim() || null;

  // Extract laboratory from affiliations (first institution mentioned)
  let laboratory = null;
  if (affiliations) {
    const firstAffiliation = affiliations.split(';')[0]?.trim();
    laboratory = firstAffiliation || null;
  }

  // Extract journal
  const journalMatch = content.match(/\*\*Journal:\*\*\s*([^\n]+)/);
  const publication_journal = journalMatch?.[1]?.trim() || null;

  // Extract year
  const yearMatch = content.match(/\*\*Year:\*\*\s*(\d{4})/);
  const publication_year = yearMatch?.[1] ? parseInt(yearMatch[1]) : null;

  // Extract DOI
  const doiMatch = content.match(/\*\*DOI:\*\*\s*(?:https?:\/\/doi\.org\/)?([\w./-]+)/);
  const doi = doiMatch?.[1]?.trim() || null;

  // Extract abstract
  const abstractMatch = content.match(/##\s*Abstract\s*\n\n(.+?)(?=\n\n---|$)/s);
  const abstract = abstractMatch?.[1]?.trim() || null;

  // Extract volume/pages
  const volumeMatch = content.match(/Volume\s+(\d+)[,\s]+(?:Article\s+)?(\S+)/);
  const publication_volume_pages = (volumeMatch?.[1] && volumeMatch?.[2]) ? `Volume ${volumeMatch[1]}, ${volumeMatch[2]}` : null;

  // Extract PDF URL
  const pdfUrlMatch = content.match(/\*\*PDF URL:\*\*\s*(https?:\/\/[^\s\n]+)/);
  const pdf_url = pdfUrlMatch?.[1]?.trim() || null;

  // Extract supplementary files URL
  const suppMatch = content.match(/\*\*Supplementary Files URL:\*\*\s*(https?:\/\/[^\s\n]+)/);
  let supplementary_files_url = suppMatch?.[1]?.trim() || null;
  if (supplementary_files_url && supplementary_files_url.includes('None')) {
    supplementary_files_url = null;
  }

  // Extract study area/location
  const studyMatch = content.match(/\*\*Study Area:\*\*\s*(.+)/);
  const study_location = studyMatch?.[1]?.trim() || null;

  // Extract mineral analyzed
  const mineralMatch = content.match(/\*\*Method:\*\*\s*(?:Both\s+)?(?:AFT.*?and\s+)?(?:AHe)?\s*\(([^)]+)\)/);
  let mineral_analyzed = null;
  if (mineralMatch?.[1]) {
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
  const sample_count = sampleCountMatch?.[1] ? parseInt(sampleCountMatch[1]) : null;

  // Extract age range
  const ageRangeMatch = content.match(/\*\*Age Range:\*\*\s*~?(\d+)-(\d+)\s*Ma/);
  const age_range_min_ma = ageRangeMatch?.[1] ? parseFloat(ageRangeMatch[1]) : null;
  const age_range_max_ma = ageRangeMatch?.[2] ? parseFloat(ageRangeMatch[2]) : null;

  // Generate dataset name (FirstAuthorLastName YEAR)
  let dataset_name = 'Unknown Dataset';
  if (authors.length > 0 && publication_year && authors[0]) {
    const nameParts = authors[0].split(' ');
    const firstAuthorLast = nameParts[nameParts.length - 1] || authors[0];
    dataset_name = `${firstAuthorLast} ${publication_year}`;
  }

  // Generate full citation (Author1, Author2, ... (Year). Title. Journal, Volume, Pages.)
  let full_citation = null;
  if (authors.length > 0 && publication_year && title && publication_journal) {
    const authorList = authors.join(', ');
    full_citation = `${authorList} (${publication_year}). ${title}. ${publication_journal}`;
    if (publication_volume_pages) {
      full_citation += `, ${publication_volume_pages}`;
    }
    full_citation += '.';
  }

  // Generate description using abstract or title
  const description = abstract || (title ? `Thermochronology data from ${title}` : null);

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
