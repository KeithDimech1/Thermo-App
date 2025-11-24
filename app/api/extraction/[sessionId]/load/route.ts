/**
 * POST /api/extraction/[sessionId]/load
 *
 * Load Stage (Phase 4) - Exactly matching CLI `/thermoload` workflow
 *
 * This route does NOT import CSV data to earthbank_* tables.
 * It only creates dataset metadata and uploads files.
 * FAIR assessment has been moved to the ThermoFAIR page (/datasets/[id]/fair).
 *
 * Steps:
 * 1. Parse paper metadata from paper-index.md
 * 2. Create dataset record in datasets table
 * 3. Copy files from extractions bucket to datasets bucket
 * 4. Track files in data_files table (with Supabase Storage URLs)
 * 5. Return success response with dataset info
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
  files_uploaded: number;
  total_size_bytes: number;
  already_exists?: boolean;
  message?: string;
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
        full_citation,
        authors,
        publication_journal,
        publication_year,
        publication_volume_pages,
        doi,
        pdf_filename,
        pdf_url,
        supplementary_files_url,
        study_location,
        laboratory,
        mineral_analyzed,
        sample_count,
        age_range_min_ma,
        age_range_max_ma,
        publication_reference,
        publication_doi,
        study_area,
        created_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, NOW()
      )
      RETURNING id`,
      [
        metadata.dataset_name,
        metadata.description,
        metadata.full_citation,
        metadata.authors,
        metadata.publication_journal,
        metadata.publication_year,
        metadata.publication_volume_pages,
        metadata.doi,
        metadata.pdf_filename,
        metadata.pdf_url,
        metadata.supplementary_files_url,
        metadata.study_location,
        metadata.laboratory,
        metadata.mineral_analyzed,
        metadata.sample_count,
        metadata.age_range_min_ma,
        metadata.age_range_max_ma,
        metadata.full_citation, // Also map to publication_reference for backwards compatibility
        metadata.doi, // Also map to publication_doi for backwards compatibility
        metadata.study_location // Also map to study_area for backwards compatibility
      ]
    );

    const datasetId = dataset!.id;
    console.log(`[Load] Created dataset ID: ${datasetId}`);

    // ========================================
    // STEP 2.5: Add Authors to People Table and Link to Dataset
    // ========================================
    console.log('[Load] Step 2.5: Populating people table with authors...');

    if (metadata.authors && metadata.authors.length > 0) {
      await populateAuthors(datasetId, metadata.authors);
      console.log(`[Load] Linked ${metadata.authors.length} authors to dataset`);
    }

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
      const extractedFiles = await listFiles('extractions', `${sessionId}/tables`);
      const csvFiles = extractedFiles.filter(f => f.name.endsWith('.csv'));

      for (const csvFile of csvFiles) {
        const csvBuffer = await downloadFile('extractions', `${sessionId}/tables/${csvFile.name}`);
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

      // Load table-index.json to get captions
      let tableCaptions: Map<string, string> = new Map();
      try {
        const tableIndexBuffer = await downloadFile('extractions', `${sessionId}/table-index.json`);
        const tableIndex = JSON.parse(tableIndexBuffer.toString('utf-8'));

        if (tableIndex.tables && Array.isArray(tableIndex.tables)) {
          for (const table of tableIndex.tables) {
            const tableNum = String(table.table_number);
            if (table.caption) {
              tableCaptions.set(tableNum, table.caption);
            }
          }
          console.log(`[Load] Loaded ${tableCaptions.size} table captions from table-index.json`);
        }
      } catch (indexErr) {
        console.log('[Load] Could not load table-index.json (will use default descriptions)');
      }

      for (const imgFile of tableImages) {
        const imgBuffer = await downloadFile('extractions', `${sessionId}/images/tables/${imgFile.name}`);
        const imgUrl = await uploadFile(
          'datasets',
          `${datasetId}/tables/${imgFile.name}`,
          imgBuffer,
          getFileTypeFromExtension(imgFile.name)
        );

        // Extract table number from filename (e.g., "table-1.png" -> "1")
        const tableNumMatch = imgFile.name.match(/table-?(\d+|[A-Z]\d+)/i);
        const tableNum = tableNumMatch?.[1];

        // Look up caption from table-index.json
        const caption = tableNum && tableCaptions.has(String(tableNum))
          ? tableCaptions.get(String(tableNum))!
          : 'Table screenshot from paper';

        uploadedFiles.push({
          file_name: imgFile.name,
          file_path: imgUrl,
          file_type: getFileTypeFromExtension(imgFile.name),
          mime_type: getFileTypeFromExtension(imgFile.name),
          file_size_bytes: imgBuffer.length,
          display_name: imgFile.name.replace(/\.(png|jpg|jpeg|tiff)$/i, ''),
          description: caption
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

    // Copy metadata files (paper-index.md, tables.md, table-index.json, plain-text.txt)
    console.log('[Load] Copying extraction metadata files...');
    const metadataFiles = [
      { source: `${sessionId}/paper-index.md`, name: 'paper-index.md', type: 'text/markdown', description: 'Quick reference guide with paper metadata and table list' },
      { source: `${sessionId}/tables.md`, name: 'tables.md', type: 'text/markdown', description: 'Visual table reference with metadata' },
      { source: `${sessionId}/table-index.json`, name: 'table-index.json', type: 'application/json', description: 'Structured table metadata (JSON)' },
      { source: `${sessionId}/text/plain-text.txt`, name: 'plain-text.txt', type: 'text/plain', description: 'Extracted PDF text content' }
    ];

    for (const metaFile of metadataFiles) {
      try {
        const metaBuffer = await downloadFile('extractions', metaFile.source);
        const metaUrl = await uploadFile(
          'datasets',
          `${datasetId}/metadata/${metaFile.name}`,
          metaBuffer,
          metaFile.type
        );

        uploadedFiles.push({
          file_name: metaFile.name,
          file_path: metaUrl,
          file_type: metaFile.type,
          mime_type: metaFile.type,
          file_size_bytes: metaBuffer.length,
          display_name: metaFile.name.replace(/\.(md|json|txt)$/i, ''),
          description: metaFile.description
        });
        console.log(`   ✓ Copied ${metaFile.name} (${(metaBuffer.length / 1024).toFixed(1)} KB)`);
      } catch (err) {
        console.log(`   ⚠️  Could not copy ${metaFile.name} (this is OK - may not exist)`);
      }
    }

    console.log(`[Load] Uploaded ${uploadedFiles.length} files`);

    // ========================================
    // STEP 4: Track Files in Database
    // ========================================
    console.log('[Load] Step 4: Tracking files in database (final step)...');

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
    // STEP 5: Update Session State to 'loaded'
    // ========================================
    console.log('[Load] Step 5: Updating session state...');

    // NOTE: FAIR assessment has been moved to ThermoFAIR page
    // fair_score is set to NULL initially
    await query(
      `UPDATE extraction_sessions
       SET state = 'loaded',
           dataset_id = $1,
           fair_score = NULL,
           completed_at = NOW(),
           updated_at = NOW()
       WHERE session_id = $2`,
      [datasetId, sessionId]
    );

    // Calculate total size
    const totalSizeBytes = uploadedFiles.reduce((sum, f) => sum + f.file_size_bytes, 0);

    const response: LoadResponse = {
      success: true,
      dataset_id: datasetId,
      dataset_name: metadata.dataset_name,
      files_uploaded: uploadedFiles.length,
      total_size_bytes: totalSizeBytes
    };

    console.log('[Load] ✅ Load complete! FAIR assessment can be performed via ThermoFAIR page.', response);

    return NextResponse.json(response);

  } catch (error: any) {
    console.error('[Load] Error:', error);

    // Handle duplicate DOI constraint violation (PostgreSQL error code 23505)
    if (error.code === '23505' && error.constraint === 'datasets_doi_unique') {
      console.log('[Load] Duplicate DOI detected - finding existing dataset...');

      // Re-fetch session to get pdf_filename
      const sessionData = await queryOne<any>(
        'SELECT pdf_filename FROM extraction_sessions WHERE session_id = $1',
        [sessionId]
      );

      // Extract DOI from error message or re-parse metadata
      const paperIndexBuffer = await downloadFile('extractions', `${sessionId}/paper-index.md`);
      const paperIndexContent = paperIndexBuffer.toString('utf-8');
      const metadata = parsePaperMetadata(paperIndexContent, sessionData?.pdf_filename || 'paper.pdf');

      // Find existing dataset with this DOI
      const existingDataset = await queryOne<{ id: number; dataset_name: string }>(
        'SELECT id, dataset_name FROM datasets WHERE doi = $1',
        [metadata.doi]
      );

      if (existingDataset) {
        console.log(`[Load] Found existing dataset: ${existingDataset.dataset_name} (ID: ${existingDataset.id})`);

        // Update session to point to existing dataset
        await query(
          `UPDATE extraction_sessions
           SET dataset_id = $1,
               updated_at = NOW()
           WHERE session_id = $2`,
          [existingDataset.id, sessionId]
        );

        // Return special response indicating dataset already exists
        return NextResponse.json(
          {
            success: true,
            already_exists: true,
            dataset_id: existingDataset.id,
            dataset_name: existingDataset.dataset_name,
            message: `This paper is already in the database (DOI: ${metadata.doi})`
          },
          { status: 200 }
        );
      }
    }

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

/**
 * Add authors to people table and link them to the dataset
 *
 * For each author:
 * 1. Check if person exists by name (case-insensitive)
 * 2. If not, create new person record
 * 3. Link person to dataset via dataset_people_roles with role='author'
 *
 * @param datasetId - Dataset ID to link authors to
 * @param authors - Array of author names
 */
async function populateAuthors(datasetId: number, authors: string[]): Promise<void> {
  for (const authorName of authors) {
    if (!authorName || authorName.trim().length === 0) {
      continue; // Skip empty names
    }

    const cleanName = authorName.trim();

    // Check if person already exists (case-insensitive)
    let person = await queryOne<{ id: number }>(
      'SELECT id FROM people WHERE LOWER(name) = LOWER($1)',
      [cleanName]
    );

    // If person doesn't exist, create them
    if (!person) {
      person = await queryOne<{ id: number }>(
        'INSERT INTO people (name, created_at) VALUES ($1, NOW()) RETURNING id',
        [cleanName]
      );
      console.log(`[Load]   Created new person: ${cleanName} (ID: ${person!.id})`);
    } else {
      console.log(`[Load]   Found existing person: ${cleanName} (ID: ${person.id})`);
    }

    // Link person to dataset (if not already linked)
    // Use ON CONFLICT to avoid duplicates
    await query(
      `INSERT INTO dataset_people_roles (dataset_id, person_id, role, created_at)
       VALUES ($1, $2, 'author', NOW())
       ON CONFLICT (dataset_id, person_id, role) DO NOTHING`,
      [datasetId, person!.id]
    );
  }
}

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

  // Use full paper title as dataset name
  const dataset_name = title || 'Unknown Dataset';

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

// NOTE: FAIR analysis functions (performFAIRAnalysis, generateExtractionReport) have been
// removed and moved to /api/datasets/[id]/fair/analyze/route.ts
// FAIR assessment is now performed via the ThermoFAIR page, not during load.
