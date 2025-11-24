# Implementation Plan: AI Cost Tracking for Data Extraction Workflow

**Created:** 2025-11-24
**Purpose:** Track Anthropic API token usage and costs per paper/user across upload → analysis → extract → load workflow

---

## Overview

Track AI credit usage across the entire `/thermoextract` workflow:
1. **Upload** - PDF upload (no AI usage)
2. **Analysis** - Claude analyzes paper structure (AI usage)
3. **Extract** - Claude extracts tables (AI usage - highest cost)
4. **Load** - Dataset creation + FAIR analysis (AI usage)

**Goals:**
- Track tokens per extraction session (per paper)
- Calculate costs using Anthropic pricing
- Enable user-level cost analysis
- Optimize expensive extractions
- Budget forecasting

---

## Database Schema Changes

### Step 1: Add Token Tracking Columns to `extraction_sessions`

**New Columns:**

```sql
-- Token usage tracking
ALTER TABLE extraction_sessions
ADD COLUMN ai_tokens_input_total INTEGER DEFAULT 0,
ADD COLUMN ai_tokens_output_total INTEGER DEFAULT 0,
ADD COLUMN ai_tokens_total INTEGER GENERATED ALWAYS AS (ai_tokens_input_total + ai_tokens_output_total) STORED,

-- Cost tracking (in USD)
ADD COLUMN ai_cost_usd NUMERIC(10,6) GENERATED ALWAYS AS (
  (ai_tokens_input_total / 1000000.0) * 3.00 +  -- $3 per million input tokens (Sonnet 4.5)
  (ai_tokens_output_total / 1000000.0) * 15.00   -- $15 per million output tokens (Sonnet 4.5)
) STORED,

-- Per-stage token breakdown (JSONB for flexibility)
ADD COLUMN ai_usage_breakdown JSONB DEFAULT '{
  "analysis": {"input": 0, "output": 0, "calls": 0},
  "extraction": {"input": 0, "output": 0, "calls": 0},
  "fair_analysis": {"input": 0, "output": 0, "calls": 0}
}'::jsonb,

-- Model used
ADD COLUMN ai_model TEXT DEFAULT 'claude-sonnet-4-5-20250929';
```

**Why JSONB for breakdown?**
- Flexible for different extraction types
- Can add new stages without schema migration
- Easy to query specific stages
- Preserves API call count per stage

---

## Current Anthropic Pricing (as of 2025-11-24)

**Claude Sonnet 4.5 (claude-sonnet-4-5-20250929):**
- Input tokens: $3.00 per million tokens
- Output tokens: $15.00 per million tokens

**Example Costs:**
- 10K input + 2K output = $0.03 + $0.03 = $0.06
- 100K input + 10K output = $0.30 + $0.15 = $0.45
- 1M input + 100K output = $3.00 + $1.50 = $4.50

**Typical Paper Extraction:**
- Analysis: ~50K input + ~5K output = ~$0.20
- Table extraction (5 tables): ~200K input + ~30K output = ~$1.05
- FAIR analysis: ~30K input + ~3K output = ~$0.12
- **Total per paper: ~$1.40** (varies widely)

---

## Code Changes

### Step 2: Update Anthropic Client Helper

**File:** `lib/anthropic/client.ts`

Add token extraction utilities:

```typescript
/**
 * Token usage information from Anthropic API response
 */
export interface TokenUsage {
  input_tokens: number;
  output_tokens: number;
  total_tokens: number;
  cost_usd: number;
}

/**
 * Extract token usage from Anthropic API response
 */
export function extractTokenUsage(response: Anthropic.Message): TokenUsage {
  const inputTokens = response.usage.input_tokens;
  const outputTokens = response.usage.output_tokens;

  // Pricing for Claude Sonnet 4.5 (update if model changes)
  const inputCostPerMillion = 3.00;
  const outputCostPerMillion = 15.00;

  const cost =
    (inputTokens / 1_000_000) * inputCostPerMillion +
    (outputTokens / 1_000_000) * outputCostPerMillion;

  return {
    input_tokens: inputTokens,
    output_tokens: outputTokens,
    total_tokens: inputTokens + outputTokens,
    cost_usd: cost,
  };
}

/**
 * Calculate cost for given token counts
 */
export function calculateCost(inputTokens: number, outputTokens: number, model?: string): number {
  // Pricing varies by model
  const pricing = {
    'claude-sonnet-4-5-20250929': { input: 3.00, output: 15.00 },
    'claude-sonnet-3-5-20240620': { input: 3.00, output: 15.00 },
    'claude-haiku-3-5-20241022': { input: 0.80, output: 4.00 },
  };

  const modelPricing = pricing[model as keyof typeof pricing] || pricing['claude-sonnet-4-5-20250929'];

  return (
    (inputTokens / 1_000_000) * modelPricing.input +
    (outputTokens / 1_000_000) * modelPricing.output
  );
}

/**
 * Format cost for display
 */
export function formatCost(usd: number): string {
  if (usd < 0.01) return `$${(usd * 100).toFixed(3)}¢`;
  return `$${usd.toFixed(4)}`;
}
```

Update existing functions to return usage:

```typescript
/**
 * Create a message with Anthropic API (text only)
 * Returns response AND token usage
 */
export async function createMessage(
  systemPrompt: string,
  userMessage: string,
  options?: {
    maxTokens?: number;
    temperature?: number;
  }
): Promise<{ response: Anthropic.Message; usage: TokenUsage }> {
  const response = await anthropic.messages.create({
    model: EXTRACTION_MODEL,
    max_tokens: options?.maxTokens || MAX_TOKENS,
    temperature: options?.temperature || TEMPERATURE,
    system: systemPrompt,
    messages: [
      {
        role: 'user',
        content: userMessage,
      },
    ],
  });

  return {
    response,
    usage: extractTokenUsage(response),
  };
}

// Similar updates for createMessageWithContent()
```

---

### Step 3: Database Query Utilities

**File:** `lib/db/extraction-queries.ts` (create if doesn't exist)

```typescript
import { query, queryOne } from './connection';

/**
 * Update token usage for an extraction session
 */
export async function updateExtractionTokens(
  sessionId: string,
  stage: 'analysis' | 'extraction' | 'fair_analysis',
  inputTokens: number,
  outputTokens: number
) {
  await query(
    `UPDATE extraction_sessions
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
     WHERE session_id = $1`,
    [sessionId, inputTokens, outputTokens]
  );
}

/**
 * Get token usage for a session
 */
export async function getExtractionTokenUsage(sessionId: string) {
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
  }>(
    `SELECT
       ai_tokens_input_total,
       ai_tokens_output_total,
       ai_tokens_total,
       ai_cost_usd,
       ai_usage_breakdown
     FROM extraction_sessions
     WHERE session_id = $1`,
    [sessionId]
  );
}

/**
 * Get total AI costs per user
 */
export async function getUserAICosts(userId?: string) {
  const sql = userId
    ? `SELECT
         user_id,
         COUNT(*) as session_count,
         SUM(ai_tokens_total) as total_tokens,
         SUM(ai_cost_usd) as total_cost_usd,
         AVG(ai_cost_usd) as avg_cost_per_paper
       FROM extraction_sessions
       WHERE user_id = $1 AND state = 'completed'
       GROUP BY user_id`
    : `SELECT
         user_id,
         COUNT(*) as session_count,
         SUM(ai_tokens_total) as total_tokens,
         SUM(ai_cost_usd) as total_cost_usd,
         AVG(ai_cost_usd) as avg_cost_per_paper
       FROM extraction_sessions
       WHERE state = 'completed'
       GROUP BY user_id
       ORDER BY total_cost_usd DESC`;

  return userId ? queryOne(sql, [userId]) : query(sql);
}
```

---

### Step 4: Update API Routes

#### 4a. Analysis Route

**File:** `app/api/extraction/[sessionId]/analyze/route.ts`

```typescript
import { createMessageWithContent, extractTokenUsage } from '@/lib/anthropic/client';
import { updateExtractionTokens } from '@/lib/db/extraction-queries';

export async function POST(req: Request, { params }: { params: { sessionId: string } }) {
  const { sessionId } = params;

  // ... existing analysis logic ...

  // Call Anthropic API
  const { response, usage } = await createMessageWithContent(
    systemPrompt,
    content,
    { maxTokens: 8000 }
  );

  // Update token usage in database
  await updateExtractionTokens(
    sessionId,
    'analysis',
    usage.input_tokens,
    usage.output_tokens
  );

  console.log(`Analysis complete - Tokens: ${usage.total_tokens}, Cost: $${usage.cost_usd.toFixed(4)}`);

  // ... rest of logic ...
}
```

#### 4b. Extract Route

**File:** `app/api/extraction/[sessionId]/extract/route.ts`

```typescript
// For each table extraction
for (const table of tables) {
  const { response, usage } = await createMessageWithContent(
    extractionPrompt,
    tableContent
  );

  // Accumulate tokens for this stage
  await updateExtractionTokens(
    sessionId,
    'extraction',
    usage.input_tokens,
    usage.output_tokens
  );

  console.log(`Table ${table.id} - Tokens: ${usage.total_tokens}, Cost: $${usage.cost_usd.toFixed(4)}`);
}

// Log total extraction cost
const totalUsage = await getExtractionTokenUsage(sessionId);
console.log(`Total extraction cost: $${totalUsage.ai_cost_usd}`);
```

#### 4c. FAIR Analysis Route

**File:** `app/api/datasets/[id]/fair/analyze/route.ts`

```typescript
const { response, usage } = await anthropic.messages.create({
  // ... existing config ...
});

// If associated with extraction session, track tokens
if (extractionSessionId) {
  await updateExtractionTokens(
    extractionSessionId,
    'fair_analysis',
    usage.input_tokens,
    usage.output_tokens
  );
}
```

---

### Step 5: Add Cost Display in UI

**File:** `app/extraction/[sessionId]/load/page.tsx` (or create new component)

```typescript
'use client';

import { useEffect, useState } from 'react';

interface CostBreakdown {
  analysis: { input: number; output: number; cost: number };
  extraction: { input: number; output: number; cost: number };
  fair_analysis: { input: number; output: number; cost: number };
  total: number;
}

export function ExtractionCostSummary({ sessionId }: { sessionId: string }) {
  const [costs, setCosts] = useState<CostBreakdown | null>(null);

  useEffect(() => {
    fetch(`/api/extraction/${sessionId}/costs`)
      .then(res => res.json())
      .then(setCosts);
  }, [sessionId]);

  if (!costs) return <div>Loading costs...</div>;

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
      <h3 className="font-semibold text-blue-900 mb-2">AI Usage Summary</h3>

      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span>Paper Analysis:</span>
          <span>{costs.analysis.input + costs.analysis.output} tokens (${costs.analysis.cost.toFixed(4)})</span>
        </div>

        <div className="flex justify-between">
          <span>Table Extraction:</span>
          <span>{costs.extraction.input + costs.extraction.output} tokens (${costs.extraction.cost.toFixed(4)})</span>
        </div>

        <div className="flex justify-between">
          <span>FAIR Analysis:</span>
          <span>{costs.fair_analysis.input + costs.fair_analysis.output} tokens (${costs.fair_analysis.cost.toFixed(4)})</span>
        </div>

        <div className="flex justify-between font-bold text-blue-900 pt-2 border-t border-blue-300">
          <span>Total Cost:</span>
          <span>${costs.total.toFixed(4)}</span>
        </div>
      </div>

      <p className="text-xs text-blue-700 mt-2">
        Using Claude Sonnet 4.5 ($3/M input, $15/M output tokens)
      </p>
    </div>
  );
}
```

**API Endpoint:** `app/api/extraction/[sessionId]/costs/route.ts`

```typescript
import { getExtractionTokenUsage } from '@/lib/db/extraction-queries';
import { calculateCost } from '@/lib/anthropic/client';

export async function GET(req: Request, { params }: { params: { sessionId: string } }) {
  const usage = await getExtractionTokenUsage(params.sessionId);

  if (!usage) {
    return Response.json({ error: 'Session not found' }, { status: 404 });
  }

  const breakdown = usage.ai_usage_breakdown;

  return Response.json({
    analysis: {
      input: breakdown.analysis.input,
      output: breakdown.analysis.output,
      cost: calculateCost(breakdown.analysis.input, breakdown.analysis.output),
    },
    extraction: {
      input: breakdown.extraction.input,
      output: breakdown.extraction.output,
      cost: calculateCost(breakdown.extraction.input, breakdown.extraction.output),
    },
    fair_analysis: {
      input: breakdown.fair_analysis.input,
      output: breakdown.fair_analysis.output,
      cost: calculateCost(breakdown.fair_analysis.input, breakdown.fair_analysis.output),
    },
    total: parseFloat(usage.ai_cost_usd),
    total_tokens: usage.ai_tokens_total,
  });
}
```

---

## Analytics & Reporting

### Cost Analysis Queries

```sql
-- Total AI spending
SELECT
  SUM(ai_cost_usd) as total_spent,
  COUNT(*) as papers_processed,
  AVG(ai_cost_usd) as avg_cost_per_paper
FROM extraction_sessions
WHERE state = 'completed';

-- Most expensive papers
SELECT
  session_id,
  paper_metadata->>'title' as title,
  ai_tokens_total,
  ai_cost_usd,
  (ai_usage_breakdown->'extraction'->>'calls')::int as extraction_calls
FROM extraction_sessions
WHERE state = 'completed'
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
WHERE state = 'completed';

-- User-level costs
SELECT
  user_id,
  COUNT(*) as papers_extracted,
  SUM(ai_cost_usd) as total_cost,
  AVG(ai_cost_usd) as avg_per_paper,
  MAX(ai_cost_usd) as max_cost
FROM extraction_sessions
WHERE user_id IS NOT NULL AND state = 'completed'
GROUP BY user_id
ORDER BY total_cost DESC;

-- Monthly spending trend
SELECT
  DATE_TRUNC('month', created_at) as month,
  COUNT(*) as papers,
  SUM(ai_cost_usd) as total_cost,
  AVG(ai_cost_usd) as avg_per_paper
FROM extraction_sessions
WHERE state = 'completed'
GROUP BY DATE_TRUNC('month', created_at)
ORDER BY month DESC;

-- Cost efficiency (papers with best FAIR score per dollar)
SELECT
  session_id,
  paper_metadata->>'title' as title,
  fair_score,
  ai_cost_usd,
  ROUND((fair_score::numeric / NULLIF(ai_cost_usd, 0)), 2) as fair_score_per_dollar
FROM extraction_sessions
WHERE state = 'completed' AND fair_score IS NOT NULL
ORDER BY fair_score_per_dollar DESC
LIMIT 20;
```

---

## Migration Script

**File:** `scripts/db/migrations/add-ai-cost-tracking.sql`

```sql
-- Migration: Add AI cost tracking to extraction_sessions
-- Created: 2025-11-24
-- Purpose: Track Anthropic API token usage and costs

BEGIN;

-- Add token tracking columns
ALTER TABLE extraction_sessions
ADD COLUMN IF NOT EXISTS ai_tokens_input_total INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS ai_tokens_output_total INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS ai_tokens_total INTEGER GENERATED ALWAYS AS (ai_tokens_input_total + ai_tokens_output_total) STORED,

-- Cost in USD (using Claude Sonnet 4.5 pricing)
ADD COLUMN IF NOT EXISTS ai_cost_usd NUMERIC(10,6) GENERATED ALWAYS AS (
  (ai_tokens_input_total / 1000000.0) * 3.00 +
  (ai_tokens_output_total / 1000000.0) * 15.00
) STORED,

-- Per-stage breakdown
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

-- Add comment
COMMENT ON COLUMN extraction_sessions.ai_cost_usd IS
  'Total AI cost in USD (auto-calculated from tokens using current pricing)';

COMMIT;
```

**Run migration:**
```bash
npm run db:psql -- -f scripts/db/migrations/add-ai-cost-tracking.sql
```

---

## Testing Checklist

- [ ] Migration runs successfully
- [ ] Token usage captured during analysis
- [ ] Token usage captured during extraction
- [ ] Token usage captured during FAIR analysis
- [ ] Totals accumulate correctly across stages
- [ ] Cost calculations match Anthropic pricing
- [ ] UI displays cost breakdown
- [ ] Analytics queries work
- [ ] User-level costs tracked (when user_id present)
- [ ] No errors in existing extraction workflow

---

## Future Enhancements

1. **Budget Alerts:**
   - Warn when session exceeds expected cost
   - Daily/monthly spending limits
   - Email alerts for high-cost extractions

2. **Optimization Insights:**
   - Identify papers that could use cheaper models
   - Prompt optimization suggestions
   - Caching for repeated extractions

3. **User Quotas:**
   - Per-user monthly budgets
   - Tiered access (free tier, pro tier)
   - Billing integration

4. **Model Switching:**
   - Use Haiku for simple papers ($0.80/$4.00 per M tokens)
   - Use Sonnet only when needed
   - Auto-detect complexity

5. **Batch Processing:**
   - Queue expensive extractions
   - Optimize for off-peak pricing (if available)

---

## Estimated Implementation Time

- **Schema migration:** 15 minutes
- **Update client helpers:** 30 minutes
- **Update API routes (3 routes):** 1 hour
- **Add UI cost display:** 30 minutes
- **Testing:** 30 minutes
- **Documentation updates:** 15 minutes

**Total:** ~3 hours

---

## ROI Analysis

**Benefits:**
- Track spending per paper (identify expensive extractions)
- User accountability (if multi-user system)
- Budget forecasting
- Optimization opportunities (save 20-50% by using Haiku for simple papers)
- Justify costs to stakeholders

**Example Savings:**
- 100 papers/month × $1.40/paper = $140/month
- Optimize 30% to use Haiku → save $42/month (30% reduction)
- Better prompts reduce tokens 20% → save $28/month

**Total potential savings:** ~$70/month (~50% reduction)

---

## Questions?

**Q: What if pricing changes?**
A: Update calculated column formula via migration. Historical data preserved in `ai_usage_breakdown`.

**Q: How accurate is the cost?**
A: Exact - uses actual token counts from Anthropic API, not estimates.

**Q: Can we track costs for other AI operations?**
A: Yes! Same pattern applies to any Anthropic API call. Add stages to `ai_usage_breakdown`.

**Q: What about streaming responses?**
A: Stream API returns usage in final `message_stop` event. Capture and update after stream completes.

---

**Ready to implement?** Start with the migration script and work through the steps sequentially.
