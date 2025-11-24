# Table: `extraction_sessions`

**Last Schema Update:** 2025-11-24 08:10:00
**Schema Version:** Supporting table (snake_case - legacy schema)
**Row Count:** Variable (one per extraction session)

## Purpose

Tracks the state and progress of data extraction sessions from PDF papers. Each session represents one execution of the `/thermoextract` workflow, storing metadata about the paper, extraction progress, and final results.

**Key Features:**
- Complete extraction workflow state tracking
- Paper metadata and analysis results
- Table extraction statistics (found, extracted, failed)
- FAIR score integration
- Links to created dataset records
- Error tracking and recovery

## Schema (Bones)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | uuid | PK, NOT NULL, DEFAULT uuid_generate_v4() | Internal UUID primary key |
| `session_id` | text | NOT NULL, UNIQUE | Human-readable session ID (e.g., "malawi_extraction") |
| `pdf_filename` | text | NOT NULL | Original PDF filename |
| `pdf_path` | text | NOT NULL | Storage path to uploaded PDF |
| `pdf_size_bytes` | bigint | NOT NULL | PDF file size |
| `state` | text | NOT NULL, DEFAULT 'uploaded' | Current extraction state (see below) |
| `current_step` | integer | DEFAULT 1 | Progress step (1-5) |
| `paper_metadata` | jsonb | | Extracted paper metadata (title, authors, DOI, etc.) |
| `tables_found` | integer | | Number of tables detected in paper |
| `data_types` | text[] | | Types of data found (ft_ages, he_ages, samples, etc.) |
| `csvs_extracted` | integer | | Number of CSV files successfully created |
| `extraction_quality_score` | integer | | Quality score (0-100) for extraction |
| `failed_tables` | text[] | | List of tables that failed extraction |
| `dataset_id` | integer | FK | Links to created dataset record |
| `fair_score` | integer | | FAIR assessment score (0-100) |
| `records_imported` | integer | | Number of database records imported |
| `user_id` | text | | User who initiated extraction |
| `created_at` | timestamp | DEFAULT now() | Session start timestamp |
| `updated_at` | timestamp | DEFAULT now() | Last update timestamp |
| `completed_at` | timestamp | | Session completion timestamp |
| `error_message` | text | | Error details if extraction failed |
| `error_stage` | text | | Stage where error occurred |
| `ai_tokens_input_total` | integer | DEFAULT 0 | Total input tokens across all AI calls |
| `ai_tokens_output_total` | integer | DEFAULT 0 | Total output tokens across all AI calls |
| `ai_tokens_total` | integer | GENERATED | Total tokens (input + output) - auto-calculated |
| `ai_cost_usd` | numeric(10,6) | GENERATED | Total AI cost in USD - auto-calculated ($3/M input, $15/M output) |
| `ai_usage_breakdown` | jsonb | DEFAULT {...} | Per-stage token breakdown (analysis, extraction, fair_analysis) |
| `ai_model` | text | DEFAULT 'claude-sonnet-4-5-20250929' | AI model used for extraction |

**Indexes:**
- Primary key on `id` (UUID)
- Unique constraint on `session_id`
- B-tree indexes on: `session_id`, `state`, `created_at DESC`
- B-tree index on: `ai_cost_usd DESC` (for cost queries)
- B-tree index on: `user_id, ai_cost_usd` (for per-user cost tracking)

## Relationships

### Foreign Keys
- `dataset_id` → `datasets.id` (optional - set when dataset created)

### Referenced By
None (this is a workflow tracking table)

## Extraction States

**Upload Phase:**
- `uploaded` - PDF uploaded, ready for analysis

**Analysis Phase:**
- `analyzing` - AI analyzing paper structure
- `analyzed` - Analysis complete, metadata extracted

**Extraction Phase:**
- `extracting` - Extracting tables to CSV
- `extracted` - All tables processed

**Loading Phase:**
- `loading` - Importing to database
- `completed` - Workflow finished successfully

**Error States:**
- `failed` - Extraction failed (see `error_message`)
- `cancelled` - User cancelled extraction

## Used By (Code Files)

**Write Operations (INSERT/UPDATE):**
- `app/api/extraction/[sessionId]/analyze/route.ts` - Updates analysis results
- `app/api/extraction/[sessionId]/extract/route.ts` - Updates extraction progress
- `app/api/extraction/[sessionId]/load/route.ts` - Updates load results
- `lib/db/extraction-queries.ts` - Core extraction workflow functions

**Read Operations (SELECT):**
- `app/extraction/[sessionId]/analyze/page.tsx` - Analysis UI
- `app/extraction/[sessionId]/load/page.tsx` - Loading UI
- `lib/types/extraction-types.ts` - TypeScript type definitions

**Cleanup Operations:**
- `scripts/storage/cleanup-old-extractions.ts` - Removes old sessions
- `scripts/db/reset-all-datasets.ts` - Cleanup utility

## Business Rules

**Session Lifecycle:**
1. User uploads PDF → `state = 'uploaded'`
2. AI analyzes paper → `state = 'analyzing'` → `state = 'analyzed'`
3. AI extracts tables → `state = 'extracting'` → `state = 'extracted'`
4. User loads data → `state = 'loading'` → `state = 'completed'`

**Progress Tracking:**
- `current_step` increments from 1 (upload) to 5 (complete)
- Used for progress bar UI
- Can resume from any step if interrupted

**Quality Metrics:**
- `extraction_quality_score` based on:
  - Table extraction success rate
  - Data completeness
  - Field mapping accuracy
  - CSV validation results

**Error Handling:**
- `error_stage` identifies where failure occurred
- `error_message` contains detailed error info
- Partial extractions preserved (failed_tables tracked)

## Paper Metadata (JSONB)

**Stored in `paper_metadata` field:**
```json
{
  "title": "Paper title",
  "authors": ["Author 1", "Author 2"],
  "year": 2024,
  "journal": "Journal name",
  "doi": "10.xxxx/xxxxx",
  "abstract": "Abstract text...",
  "keywords": ["keyword1", "keyword2"]
}
```

## Critical SQL Syntax

```sql
-- Get recent extraction sessions
SELECT session_id, state, created_at, tables_found, csvs_extracted
FROM extraction_sessions
ORDER BY created_at DESC
LIMIT 20;

-- Find failed extractions
SELECT session_id, error_stage, error_message, created_at
FROM extraction_sessions
WHERE state = 'failed'
ORDER BY created_at DESC;

-- Extraction success rate
SELECT
  COUNT(*) FILTER (WHERE state = 'completed') as successful,
  COUNT(*) FILTER (WHERE state = 'failed') as failed,
  ROUND(100.0 * COUNT(*) FILTER (WHERE state = 'completed') / COUNT(*), 1) as success_rate
FROM extraction_sessions
WHERE created_at > NOW() - INTERVAL '30 days';

-- Query paper metadata (JSONB)
SELECT
  session_id,
  paper_metadata->>'title' as title,
  paper_metadata->>'year' as year,
  paper_metadata->>'journal' as journal
FROM extraction_sessions
WHERE paper_metadata->>'year' = '2024';

-- Average extraction quality
SELECT
  AVG(extraction_quality_score) as avg_quality,
  AVG(CAST(csvs_extracted AS FLOAT) / NULLIF(tables_found, 0)) as success_rate
FROM extraction_sessions
WHERE state = 'completed';
```

## Recent Changes

**2025-11-21 (Supabase Migration):** Table migrated to Supabase
- Maintained snake_case naming (legacy schema)
- Added indexes for performance
- JSONB support for paper_metadata

**2025-11-16 (IDEA-015):** Added extraction session tracking
- Created table for `/thermoextract` workflow
- Integrated with dataset creation
- Added FAIR scoring integration

## Related Tables

→ [datasets](datasets.md) - Created dataset record (via `dataset_id`)
→ [data_files](data_files.md) - Extracted files associated with session
→ [fair_score_breakdown](fair_score_breakdown.md) - FAIR assessment details

## Extraction Workflow Integration

**Step 1: Upload (state = 'uploaded')**
- User uploads PDF via web interface
- PDF stored in Vercel Blob or local storage
- Session record created

**Step 2: Analysis (state = 'analyzing' → 'analyzed')**
- AI identifies tables, figures, metadata
- `paper_metadata` populated
- `tables_found` counted
- `data_types` detected

**Step 3: Extraction (state = 'extracting' → 'extracted')**
- AI extracts each table to CSV
- Table screenshots captured
- `csvs_extracted` incremented
- `failed_tables` tracked

**Step 4: Validation**
- CSVs validated against schema
- `extraction_quality_score` calculated
- FAIR assessment performed

**Step 5: Loading (state = 'loading' → 'completed')**
- User imports data to database
- `dataset_id` linked
- `records_imported` counted
- Session marked complete

## Error Recovery

**Partial Extraction Success:**
- Some tables extract successfully, others fail
- `csvs_extracted` vs `tables_found` shows success rate
- `failed_tables` array lists problems
- Successful CSVs still available for import

**Resume Capability:**
- `current_step` allows resuming from any stage
- Partial results preserved
- User can retry failed tables manually

## Cleanup Policy

**Active Sessions:**
- Kept indefinitely once linked to dataset

**Abandoned Sessions:**
- Sessions in 'uploaded' or 'analyzing' state
- Older than 7 days
- No linked dataset_id
- Eligible for cleanup

**Cleanup Script:**
```bash
scripts/storage/cleanup-old-extractions.ts
```

## Common Queries

**Active extractions:**
```sql
SELECT session_id, state, current_step, created_at
FROM extraction_sessions
WHERE state NOT IN ('completed', 'failed', 'cancelled')
ORDER BY created_at DESC;
```

**Best extraction quality:**
```sql
SELECT
  session_id,
  paper_metadata->>'title' as title,
  extraction_quality_score,
  fair_score
FROM extraction_sessions
WHERE state = 'completed'
ORDER BY extraction_quality_score DESC
LIMIT 10;
```

**Recent papers by journal:**
```sql
SELECT
  paper_metadata->>'journal' as journal,
  COUNT(*) as paper_count
FROM extraction_sessions
WHERE paper_metadata ? 'journal'
GROUP BY paper_metadata->>'journal'
ORDER BY paper_count DESC;
```

---

## AI Cost Tracking (Added 2025-11-24)

**Purpose:** Track Anthropic API token usage and costs across the extraction workflow to enable:
- Per-paper cost analysis
- User-level cost tracking and budgeting
- Workflow optimization (identify expensive extractions)
- Model selection (Sonnet vs Haiku)
- Cost forecasting

**Schema Columns:**
- `ai_tokens_input_total` - Cumulative input tokens
- `ai_tokens_output_total` - Cumulative output tokens
- `ai_tokens_total` - Auto-calculated sum (generated column)
- `ai_cost_usd` - Auto-calculated cost using model pricing (generated column)
- `ai_usage_breakdown` - JSONB with per-stage details
- `ai_model` - Model used (defaults to Claude Sonnet 4.5)

**Breakdown Structure:**
```json
{
  "analysis": {
    "input": 50000,
    "output": 5000,
    "calls": 1
  },
  "extraction": {
    "input": 200000,
    "output": 30000,
    "calls": 5
  },
  "fair_analysis": {
    "input": 30000,
    "output": 3000,
    "calls": 1
  }
}
```

**Pricing (Claude Sonnet 4.5):**
- Input tokens: $3.00 per million
- Output tokens: $15.00 per million

**Cost Formula:**
```sql
ai_cost_usd = (ai_tokens_input_total / 1000000.0) * 3.00 + (ai_tokens_output_total / 1000000.0) * 15.00
```

**Typical Costs:**
- Simple paper (1-2 tables): $0.30 - $0.60
- Medium paper (3-5 tables): $0.80 - $1.50
- Complex paper (6-10 tables): $2.00 - $4.00

**Cost Analytics Queries:**

```sql
-- Total AI spending
SELECT
  SUM(ai_cost_usd) as total_spent,
  COUNT(*) as papers_processed,
  AVG(ai_cost_usd) as avg_cost_per_paper
FROM extraction_sessions
WHERE state = 'loaded';

-- Most expensive papers
SELECT
  session_id,
  paper_metadata->>'title' as title,
  ai_tokens_total,
  ai_cost_usd,
  (ai_usage_breakdown->'extraction'->>'calls')::int as extraction_calls
FROM extraction_sessions
WHERE state = 'loaded'
ORDER BY ai_cost_usd DESC
LIMIT 10;

-- Cost by stage breakdown
SELECT
  COUNT(*) as paper_count,
  AVG((ai_usage_breakdown->'analysis'->'input')::int +
      (ai_usage_breakdown->'analysis'->'output')::int) as avg_analysis_tokens,
  AVG((ai_usage_breakdown->'extraction'->'input')::int +
      (ai_usage_breakdown->'extraction'->'output')::int) as avg_extraction_tokens,
  AVG((ai_usage_breakdown->'fair_analysis'->'input')::int +
      (ai_usage_breakdown->'fair_analysis'->'output')::int) as avg_fair_tokens
FROM extraction_sessions
WHERE state = 'loaded';

-- User-level costs (when user tracking enabled)
SELECT
  user_id,
  COUNT(*) as papers_extracted,
  SUM(ai_cost_usd) as total_cost,
  AVG(ai_cost_usd) as avg_per_paper,
  MAX(ai_cost_usd) as max_cost
FROM extraction_sessions
WHERE user_id IS NOT NULL AND state = 'loaded'
GROUP BY user_id
ORDER BY total_cost DESC;

-- Monthly spending trend
SELECT
  DATE_TRUNC('month', created_at) as month,
  COUNT(*) as papers,
  SUM(ai_cost_usd) as total_cost,
  AVG(ai_cost_usd) as avg_per_paper
FROM extraction_sessions
WHERE state = 'loaded'
GROUP BY DATE_TRUNC('month', created_at)
ORDER BY month DESC;

-- Cost efficiency (FAIR score per dollar)
SELECT
  session_id,
  paper_metadata->>'title' as title,
  fair_score,
  ai_cost_usd,
  ROUND((fair_score::numeric / NULLIF(ai_cost_usd, 0)), 2) as fair_score_per_dollar
FROM extraction_sessions
WHERE state = 'loaded' AND fair_score IS NOT NULL
ORDER BY fair_score_per_dollar DESC
LIMIT 20;
```

**API Endpoints:**
- `GET /api/extraction/[sessionId]/costs` - Retrieve cost breakdown for a session

**UI Components:**
- `<AICostSummary sessionId={sessionId} />` - Display costs in extraction workflow

**Implementation Files:**
- Migration: `scripts/db/migrations/add-ai-cost-tracking.sql`
- Queries: `lib/db/extraction-queries.ts` (updateExtractionTokens, getExtractionTokenUsage, getUserAICosts)
- Client helpers: `lib/anthropic/client.ts` (extractTokenUsage, calculateCost, formatCost)
- API updates: All extraction routes track tokens automatically

**Optimization Opportunities:**
- Use Haiku for simple papers ($0.80/$4.00 per M tokens = ~70% cheaper)
- Cache repeated extractions
- Optimize prompts to reduce token usage
- Batch process during off-peak hours (if pricing varies)
