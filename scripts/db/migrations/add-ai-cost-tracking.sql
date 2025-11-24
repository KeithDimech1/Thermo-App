-- Migration: Add AI cost tracking to extraction_sessions
-- Created: 2025-11-24
-- Purpose: Track Anthropic API token usage and costs across extraction workflow

BEGIN;

-- Add token tracking columns
ALTER TABLE extraction_sessions
ADD COLUMN IF NOT EXISTS ai_tokens_input_total INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS ai_tokens_output_total INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS ai_tokens_total INTEGER GENERATED ALWAYS AS (ai_tokens_input_total + ai_tokens_output_total) STORED,

-- Cost in USD (using Claude Sonnet 4.5 pricing: $3/M input, $15/M output)
ADD COLUMN IF NOT EXISTS ai_cost_usd NUMERIC(10,6) GENERATED ALWAYS AS (
  (ai_tokens_input_total / 1000000.0) * 3.00 +
  (ai_tokens_output_total / 1000000.0) * 15.00
) STORED,

-- Per-stage breakdown (analysis, extraction, fair_analysis)
ADD COLUMN IF NOT EXISTS ai_usage_breakdown JSONB DEFAULT '{
  "analysis": {"input": 0, "output": 0, "calls": 0},
  "extraction": {"input": 0, "output": 0, "calls": 0},
  "fair_analysis": {"input": 0, "output": 0, "calls": 0}
}'::jsonb,

-- Model tracking
ADD COLUMN IF NOT EXISTS ai_model TEXT DEFAULT 'claude-sonnet-4-5-20250929';

-- Create indexes for cost queries
CREATE INDEX IF NOT EXISTS idx_extraction_sessions_cost
  ON extraction_sessions(ai_cost_usd DESC)
  WHERE state = 'completed';

CREATE INDEX IF NOT EXISTS idx_extraction_sessions_user_cost
  ON extraction_sessions(user_id, ai_cost_usd)
  WHERE state = 'completed';

-- Add helpful comments
COMMENT ON COLUMN extraction_sessions.ai_cost_usd IS
  'Total AI cost in USD (auto-calculated from tokens using Claude Sonnet 4.5 pricing: $3/M input + $15/M output)';

COMMENT ON COLUMN extraction_sessions.ai_usage_breakdown IS
  'Per-stage token breakdown: {"analysis": {...}, "extraction": {...}, "fair_analysis": {...}}';

COMMIT;

-- Verify migration
SELECT
  column_name,
  data_type,
  column_default
FROM information_schema.columns
WHERE table_name = 'extraction_sessions'
  AND column_name LIKE 'ai_%'
ORDER BY ordinal_position;
