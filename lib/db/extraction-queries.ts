/**
 * Database queries for IDEA-015: Extraction Sessions
 * CRUD operations for extraction_sessions table
 */

import { query, queryOne } from './connection';
import {
  ExtractionSession,
  ExtractionState,
  PaperMetadata
} from '@/lib/types/extraction-types';

/**
 * Create a new extraction session
 */
export async function createExtractionSession(
  sessionId: string,
  pdfFilename: string,
  pdfPath: string,
  pdfSizeBytes: number
): Promise<ExtractionSession> {
  const sql = `
    INSERT INTO extraction_sessions (
      session_id,
      pdf_filename,
      pdf_path,
      pdf_size_bytes,
      state,
      current_step
    )
    VALUES ($1, $2, $3, $4, 'uploaded', 1)
    RETURNING *
  `;

  const rows = await query<ExtractionSession>(sql, [
    sessionId,
    pdfFilename,
    pdfPath,
    pdfSizeBytes
  ]);

  if (!rows[0]) {
    throw new Error('Failed to create extraction session');
  }

  return rows[0];
}

/**
 * Get extraction session by session ID
 */
export async function getExtractionSession(
  sessionId: string
): Promise<ExtractionSession | null> {
  const sql = `
    SELECT * FROM extraction_sessions
    WHERE session_id = $1
  `;

  return queryOne<ExtractionSession>(sql, [sessionId]);
}

/**
 * Get extraction session by UUID
 */
export async function getExtractionSessionById(
  id: string
): Promise<ExtractionSession | null> {
  const sql = `
    SELECT * FROM extraction_sessions
    WHERE id = $1
  `;

  return queryOne<ExtractionSession>(sql, [id]);
}

/**
 * Update extraction session state
 */
export async function updateExtractionState(
  sessionId: string,
  state: ExtractionState,
  currentStep?: number
): Promise<void> {
  const sql = `
    UPDATE extraction_sessions
    SET
      state = $1,
      current_step = COALESCE($2, current_step),
      updated_at = NOW()
    WHERE session_id = $3
  `;

  await query(sql, [state, currentStep, sessionId]);
}

/**
 * Update paper metadata from analysis (Step 1)
 */
export async function updatePaperMetadata(
  sessionId: string,
  metadata: PaperMetadata,
  tablesFound: number,
  dataTypes: string[]
): Promise<void> {
  const sql = `
    UPDATE extraction_sessions
    SET
      paper_metadata = $1,
      tables_found = $2,
      data_types = $3,
      state = 'analyzed',
      current_step = 2,
      updated_at = NOW()
    WHERE session_id = $4
  `;

  await query(sql, [
    JSON.stringify(metadata),
    tablesFound,
    dataTypes,
    sessionId
  ]);
}

/**
 * Update extraction results (Step 2)
 */
export async function updateExtractionResults(
  sessionId: string,
  csvsExtracted: number,
  qualityScore: number,
  failedTables?: string[]
): Promise<void> {
  const sql = `
    UPDATE extraction_sessions
    SET
      csvs_extracted = $1,
      extraction_quality_score = $2,
      failed_tables = $3,
      state = 'extracted',
      current_step = 3,
      updated_at = NOW()
    WHERE session_id = $4
  `;

  await query(sql, [
    csvsExtracted,
    qualityScore,
    failedTables || null,
    sessionId
  ]);
}

/**
 * Update load results (Step 3)
 */
export async function updateLoadResults(
  sessionId: string,
  datasetId: number,
  fairScore: number,
  recordsImported: number
): Promise<void> {
  const sql = `
    UPDATE extraction_sessions
    SET
      dataset_id = $1,
      fair_score = $2,
      records_imported = $3,
      state = 'loaded',
      completed_at = NOW(),
      updated_at = NOW()
    WHERE session_id = $4
  `;

  await query(sql, [
    datasetId,
    fairScore,
    recordsImported,
    sessionId
  ]);
}

/**
 * Mark session as failed with error details
 */
export async function markSessionFailed(
  sessionId: string,
  errorMessage: string,
  errorStage: 'analyze' | 'extract' | 'load'
): Promise<void> {
  const sql = `
    UPDATE extraction_sessions
    SET
      state = 'failed',
      error_message = $1,
      error_stage = $2,
      updated_at = NOW()
    WHERE session_id = $3
  `;

  await query(sql, [errorMessage, errorStage, sessionId]);
}

/**
 * Delete extraction session and cleanup
 */
export async function deleteExtractionSession(
  sessionId: string
): Promise<void> {
  const sql = `
    DELETE FROM extraction_sessions
    WHERE session_id = $1
  `;

  await query(sql, [sessionId]);
}

/**
 * Get all extraction sessions (for admin/debugging)
 * Returns most recent first
 */
export async function getAllExtractionSessions(
  limit: number = 50
): Promise<ExtractionSession[]> {
  const sql = `
    SELECT * FROM extraction_sessions
    ORDER BY created_at DESC
    LIMIT $1
  `;

  return query<ExtractionSession>(sql, [limit]);
}

/**
 * Get extraction sessions by state
 */
export async function getExtractionSessionsByState(
  state: ExtractionState,
  limit: number = 50
): Promise<ExtractionSession[]> {
  const sql = `
    SELECT * FROM extraction_sessions
    WHERE state = $1
    ORDER BY created_at DESC
    LIMIT $2
  `;

  return query<ExtractionSession>(sql, [state, limit]);
}

/**
 * Count sessions by state (for dashboard metrics)
 */
export async function countSessionsByState(): Promise<Record<ExtractionState, number>> {
  const sql = `
    SELECT state, COUNT(*)::int as count
    FROM extraction_sessions
    GROUP BY state
  `;

  const rows = await query<{ state: ExtractionState; count: number }>(sql);

  const counts: Record<string, number> = {
    uploaded: 0,
    analyzing: 0,
    analyzed: 0,
    extracting: 0,
    extracted: 0,
    loading: 0,
    loaded: 0,
    failed: 0
  };

  rows.forEach(row => {
    counts[row.state] = row.count;
  });

  return counts as Record<ExtractionState, number>;
}
