/**
 * TypeScript types for IDEA-015: Web-Based PDF Upload with Three-Step Extraction Workflow
 * Matches extraction_sessions table schema
 */

/**
 * Extraction workflow states
 */
export type ExtractionState =
  | 'uploaded'     // PDF uploaded, ready for analysis
  | 'analyzing'    // AI analyzing paper structure
  | 'analyzed'     // Analysis complete, ready for extraction
  | 'extracting'   // AI extracting tables to CSV
  | 'extracted'    // Extraction complete, ready for load
  | 'loading'      // Loading data to database
  | 'loaded'       // Load complete, dataset published
  | 'failed';      // Workflow failed

/**
 * Paper metadata from Step 1 (Analysis)
 */
export interface PaperMetadata {
  title: string;
  authors: string[];
  affiliations?: string[];
  abstract?: string;
  doi?: string;
  journal?: string;
  year?: number;
  study_location?: string;
  mineral?: string;
  sample_count?: number;
  laboratory?: string;
  age_range_min_ma?: number;
  age_range_max_ma?: number;
  supplementary_data_url?: string;  // URL to supplementary materials (e.g., journal website, Zenodo, GitHub)
}

/**
 * Extraction session record
 * Maps to extraction_sessions database table
 */
export interface ExtractionSession {
  // Primary key
  id: string;                          // UUID
  session_id: string;                  // Short ID (extract-abc123)

  // File information
  pdf_filename: string;
  pdf_path: string;                    // Relative: /uploads/[sessionId]/original.pdf
  pdf_size_bytes: number;

  // Workflow tracking
  state: ExtractionState;
  current_step: number;                // 1 = analyze, 2 = extract, 3 = load

  // Step 1: Analysis results
  paper_metadata?: PaperMetadata | null;
  tables_found?: number | null;
  data_types?: string[] | null;       // ['AFT ages', 'He ages', 'Track lengths']

  // Step 2: Extraction results
  csvs_extracted?: number | null;
  extraction_quality_score?: number | null;  // 0-100
  failed_tables?: string[] | null;

  // Step 3: Load results
  dataset_id?: number | null;
  fair_score?: number | null;
  records_imported?: number | null;

  // Metadata
  user_id?: string | null;             // Future: auth integration
  created_at: Date;
  updated_at: Date;
  completed_at?: Date | null;

  // Error tracking
  error_message?: string | null;
  error_stage?: 'analyze' | 'extract' | 'load' | null;
}

/**
 * Upload response from POST /api/extraction/upload
 */
export interface UploadResponse {
  success: true;
  sessionId: string;
  filename: string;
  size: number;
}

/**
 * Session response from GET /api/extraction/[sessionId]
 */
export interface SessionResponse {
  session: ExtractionSession;
}

/**
 * Error response
 */
export interface ErrorResponse {
  error: string;
  details?: string;
}

/**
 * Analysis progress update (for SSE streaming in Phase 2)
 */
export interface AnalysisProgress {
  stage: string;
  message: string;
  progress: number;  // 0-100
}

/**
 * Extraction progress update (for SSE streaming in Phase 3)
 */
export interface ExtractionProgress {
  table_name: string;
  stage: string;
  message: string;
  progress: number;  // 0-100
  quality_score?: number;
}

/**
 * Table information from analysis
 */
export interface TableInfo {
  table_number: number | string;  // Can be 1, 2, "A1", "S1", etc.
  caption: string;
  page_number?: number;
  data_type?: string;  // Optional - paper-agnostic analysis may not classify
  estimated_rows?: number;
  estimated_columns?: number;
}
