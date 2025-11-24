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

/**
 * Update token usage for an extraction session
 * Increments totals and updates the stage-specific breakdown
 */
export async function updateExtractionTokens(
  sessionId: string,
  stage: 'analysis' | 'extraction' | 'fair_analysis',
  inputTokens: number,
  outputTokens: number
): Promise<void> {
  const sql = `
    UPDATE extraction_sessions
    SET
      ai_tokens_input_total = ai_tokens_input_total + $2,
      ai_tokens_output_total = ai_tokens_output_total + $3,
      ai_usage_breakdown = jsonb_set(
        jsonb_set(
          jsonb_set(
            ai_usage_breakdown,
            '{${stage}, input}',
            ((COALESCE((ai_usage_breakdown->'${stage}'->>'input')::int, 0) + $2)::text)::jsonb
          ),
          '{${stage}, output}',
          ((COALESCE((ai_usage_breakdown->'${stage}'->>'output')::int, 0) + $3)::text)::jsonb
        ),
        '{${stage}, calls}',
        ((COALESCE((ai_usage_breakdown->'${stage}'->>'calls')::int, 0) + 1)::text)::jsonb
      ),
      updated_at = NOW()
    WHERE session_id = $1
  `;

  await query(sql, [sessionId, inputTokens, outputTokens]);
}

/**
 * Get token usage for a session
 */
export async function getExtractionTokenUsage(sessionId: string) {
  const sql = `
    SELECT
      ai_tokens_input_total,
      ai_tokens_output_total,
      ai_tokens_total,
      ai_cost_usd,
      ai_usage_breakdown,
      ai_model
    FROM extraction_sessions
    WHERE session_id = $1
  `;

  return queryOne<{
    ai_tokens_input_total: number;
    ai_tokens_output_total: number;
    ai_tokens_total: number;
    ai_cost_usd: string;
    ai_usage_breakdown: {
      analysis: { input: number; output: number; calls: number };
      extraction: { input: number; output: number; calls: number };
      fair_analysis: { input: number; output: number; calls: number };
    };
    ai_model: string;
  }>(sql, [sessionId]);
}

/**
 * Get total AI costs per user
 */
export async function getUserAICosts(userId?: string) {
  const sql = userId
    ? `SELECT
         user_id,
         COUNT(*)::int as session_count,
         SUM(ai_tokens_total)::bigint as total_tokens,
         SUM(ai_cost_usd)::numeric as total_cost_usd,
         AVG(ai_cost_usd)::numeric as avg_cost_per_paper
       FROM extraction_sessions
       WHERE user_id = $1 AND state = 'loaded'
       GROUP BY user_id`
    : `SELECT
         user_id,
         COUNT(*)::int as session_count,
         SUM(ai_tokens_total)::bigint as total_tokens,
         SUM(ai_cost_usd)::numeric as total_cost_usd,
         AVG(ai_cost_usd)::numeric as avg_cost_per_paper
       FROM extraction_sessions
       WHERE state = 'loaded' AND user_id IS NOT NULL
       GROUP BY user_id
       ORDER BY total_cost_usd DESC`;

  return userId ? queryOne(sql, [userId]) : query(sql);
}

/**
 * Get AI cost analytics (for reporting/dashboard)
 */
export async function getAICostAnalytics() {
  const sql = `
    SELECT
      COUNT(*)::int as total_sessions,
      SUM(ai_tokens_input_total)::bigint as total_input_tokens,
      SUM(ai_tokens_output_total)::bigint as total_output_tokens,
      SUM(ai_tokens_total)::bigint as total_tokens,
      SUM(ai_cost_usd)::numeric as total_cost_usd,
      AVG(ai_cost_usd)::numeric as avg_cost_per_paper,
      MIN(ai_cost_usd)::numeric as min_cost,
      MAX(ai_cost_usd)::numeric as max_cost
    FROM extraction_sessions
    WHERE state = 'loaded' AND ai_cost_usd IS NOT NULL
  `;

  return queryOne<{
    total_sessions: number;
    total_input_tokens: number;
    total_output_tokens: number;
    total_tokens: number;
    total_cost_usd: string;
    avg_cost_per_paper: string;
    min_cost: string;
    max_cost: string;
  }>(sql);
}
