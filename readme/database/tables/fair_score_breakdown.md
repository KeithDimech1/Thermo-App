# Table: `fair_score_breakdown`

**Last Schema Update:** 2025-11-24 08:12:00
**Schema Version:** Supporting table (snake_case - legacy schema)
**Row Count:** One per dataset (1:1 relationship)

## Purpose

Stores detailed FAIR (Findable, Accessible, Interoperable, Reusable) principle assessment scores for each dataset. Each of the four FAIR principles is evaluated across multiple criteria, with boolean flags for individual checks and aggregate scores for each category.

**Key Features:**
- Granular FAIR principle tracking (16 individual criteria)
- Category scores for each FAIR principle (0-25 points each)
- Total FAIR score (0-100)
- One-to-one relationship with datasets table
- Automatic timestamps for score updates

## Schema (Bones)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | integer | PK, NOT NULL, AUTO-INCREMENT | Internal primary key |
| `dataset_id` | integer | FK, UNIQUE | References datasets table (1:1) |
| **Findable (F)** | | | |
| `findable_score` | integer | DEFAULT 0 | Category score (0-25) |
| `has_persistent_id` | boolean | DEFAULT false | IGSN or persistent identifier present |
| `has_descriptive_metadata` | boolean | DEFAULT false | Sample metadata complete |
| `has_keywords` | boolean | DEFAULT false | Keywords/tags provided |
| **Accessible (A)** | | | |
| `accessible_score` | integer | DEFAULT 0 | Category score (0-25) |
| `has_open_access` | boolean | DEFAULT false | Data publicly accessible |
| `has_standard_protocol` | boolean | DEFAULT false | Standard access method |
| **Interoperable (I)** | | | |
| `interoperable_score` | integer | DEFAULT 0 | Category score (0-25) |
| `uses_standard_format` | boolean | DEFAULT false | EarthBank template format |
| `uses_controlled_vocab` | boolean | DEFAULT false | Standardized field names |
| `has_field_definitions` | boolean | DEFAULT false | Data dictionary present |
| **Reusable (R)** | | | |
| `reusable_score` | integer | DEFAULT 0 | Category score (0-25) |
| `has_license` | boolean | DEFAULT false | Clear usage license |
| `has_provenance` | boolean | DEFAULT false | Source/analyst documented |
| `has_qc_metrics` | boolean | DEFAULT false | Quality control data |
| **Summary** | | | |
| `total_score` | integer | DEFAULT 0 | Sum of category scores (0-100) |
| `created_at` | timestamp | DEFAULT CURRENT_TIMESTAMP | Initial assessment timestamp |
| `updated_at` | timestamp | DEFAULT CURRENT_TIMESTAMP | Last reassessment timestamp |

**Indexes:**
- Primary key on `id`
- Unique constraint on `dataset_id` (ensures 1:1 relationship)
- B-tree index on `dataset_id`

## Relationships

### Foreign Keys
- `dataset_id` → `datasets.id` (ON DELETE CASCADE, 1:1 relationship)

### Referenced By
None (this is a detail table for datasets)

**Note:** Deleting a dataset cascades to its FAIR score breakdown

## FAIR Principles Breakdown

### Findable (25 points max)

**has_persistent_id (10 points):**
- IGSN present for samples
- DOI present for dataset/paper
- Globally unique identifier

**has_descriptive_metadata (10 points):**
- Sample location (lat/lon)
- Lithology, mineral type
- Collection metadata

**has_keywords (5 points):**
- Dataset keywords/tags
- Searchable terms
- Classification labels

### Accessible (25 points max)

**has_open_access (15 points):**
- Data publicly downloadable
- No authentication required
- Permanent storage location

**has_standard_protocol (10 points):**
- HTTP/REST API access
- Standard download formats
- Documented access method

### Interoperable (25 points max)

**uses_standard_format (10 points):**
- EarthBank template compliance
- CSV or Excel format
- Machine-readable structure

**uses_controlled_vocab (10 points):**
- Standardized field names (camelCase)
- Controlled lithology terms
- Standard mineral names

**has_field_definitions (5 points):**
- Data dictionary available
- Field meanings documented
- Units clearly specified

### Reusable (25 points max)

**has_license (10 points):**
- CC-BY, CC0, or similar
- Clear usage terms
- Attribution requirements

**has_provenance (10 points):**
- Analyst/operator ORCID
- Laboratory documented
- Analysis date recorded

**has_qc_metrics (5 points):**
- P(χ²), dispersion reported
- Reference material results
- Error bars/uncertainties

## Scoring Algorithm

```typescript
function calculateFAIRScore(breakdown: FAIRScoreBreakdown): number {
  // Findable: max 25 points
  let findable = 0;
  if (breakdown.has_persistent_id) findable += 10;
  if (breakdown.has_descriptive_metadata) findable += 10;
  if (breakdown.has_keywords) findable += 5;

  // Accessible: max 25 points
  let accessible = 0;
  if (breakdown.has_open_access) accessible += 15;
  if (breakdown.has_standard_protocol) accessible += 10;

  // Interoperable: max 25 points
  let interoperable = 0;
  if (breakdown.uses_standard_format) interoperable += 10;
  if (breakdown.uses_controlled_vocab) interoperable += 10;
  if (breakdown.has_field_definitions) interoperable += 5;

  // Reusable: max 25 points
  let reusable = 0;
  if (breakdown.has_license) reusable += 10;
  if (breakdown.has_provenance) reusable += 10;
  if (breakdown.has_qc_metrics) reusable += 5;

  return findable + accessible + interoperable + reusable; // 0-100
}
```

## Used By (Code Files)

**Write Operations (INSERT/UPDATE):**
- `app/api/datasets/[id]/fair/analyze/route.ts` - Performs FAIR assessment
- `scripts/db/load-dataset-from-paper.ts` - Initial FAIR scoring
- `lib/db/queries.ts` - FAIR score updates

**Read Operations (SELECT):**
- `app/datasets/[id]/fair/page.tsx` - Displays FAIR scorecard
- `app/api/datasets/[id]/route.ts` - Dataset detail API

## Business Rules

**Score Calculation:**
- Each category independently scored (0-25)
- Total is sum of all categories (0-100)
- No partial credit (boolean flags only)

**Assessment Triggers:**
- Initial: During dataset creation
- Update: When dataset metadata changes
- Manual: User-initiated reassessment

**Score Interpretation:**
- 90-100: Excellent FAIR compliance
- 75-89: Good compliance (minor gaps)
- 50-74: Moderate compliance (significant gaps)
- 25-49: Poor compliance (major gaps)
- 0-24: Minimal FAIR compliance

**1:1 Relationship:**
- Each dataset has exactly one FAIR breakdown
- Breakdown deleted when dataset deleted
- Cannot exist without parent dataset

## Critical SQL Syntax

```sql
-- Get FAIR scores for all datasets
SELECT
  d.name as dataset_name,
  f.total_score,
  f.findable_score,
  f.accessible_score,
  f.interoperable_score,
  f.reusable_score
FROM fair_score_breakdown f
JOIN datasets d ON f.dataset_id = d.id
ORDER BY f.total_score DESC;

-- Find datasets needing FAIR improvements
SELECT
  d.name,
  f.total_score,
  CASE
    WHEN NOT f.has_persistent_id THEN 'Add IGSN'
    WHEN NOT f.has_provenance THEN 'Add analyst ORCID'
    WHEN NOT f.has_qc_metrics THEN 'Add QC data'
    ELSE 'Other improvements needed'
  END as recommendation
FROM fair_score_breakdown f
JOIN datasets d ON f.dataset_id = d.id
WHERE f.total_score < 75
ORDER BY f.total_score;

-- Average FAIR scores by category
SELECT
  AVG(findable_score) as avg_findable,
  AVG(accessible_score) as avg_accessible,
  AVG(interoperable_score) as avg_interoperable,
  AVG(reusable_score) as avg_reusable,
  AVG(total_score) as avg_total
FROM fair_score_breakdown;

-- Detailed FAIR checklist for a dataset
SELECT
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
  has_qc_metrics
FROM fair_score_breakdown
WHERE dataset_id = 123;
```

## Recent Changes

**2025-11-21 (Supabase Migration):** Table migrated to Supabase
- Maintained snake_case naming (legacy schema)
- Added index for performance
- CASCADE deletes configured

**2025-11-16 (IDEA-015):** Enhanced FAIR assessment
- Added individual criteria flags
- Split into four category scores
- Integrated with extraction workflow

## Related Tables

→ [datasets](datasets.md) - Parent dataset record (1:1 relationship)
→ [extraction_sessions](extraction_sessions.md) - Extraction that generated score

## FAIR Assessment API

**Analyze FAIR compliance:**
```
POST /api/datasets/[id]/fair/analyze
```

**View FAIR scorecard:**
```
GET /api/datasets/[id]/fair
```

## Common Use Cases

**Dashboard: FAIR Compliance Overview**
```sql
SELECT
  COUNT(*) as total_datasets,
  COUNT(*) FILTER (WHERE total_score >= 90) as excellent,
  COUNT(*) FILTER (WHERE total_score BETWEEN 75 AND 89) as good,
  COUNT(*) FILTER (WHERE total_score BETWEEN 50 AND 74) as moderate,
  COUNT(*) FILTER (WHERE total_score < 50) as poor
FROM fair_score_breakdown;
```

**Identify Most Common Gaps:**
```sql
SELECT
  'Persistent ID' as criterion, COUNT(*) FILTER (WHERE NOT has_persistent_id) as missing
FROM fair_score_breakdown
UNION ALL
SELECT 'Provenance', COUNT(*) FILTER (WHERE NOT has_provenance)
FROM fair_score_breakdown
UNION ALL
SELECT 'QC Metrics', COUNT(*) FILTER (WHERE NOT has_qc_metrics)
FROM fair_score_breakdown
ORDER BY missing DESC;
```

**Track FAIR Improvement Over Time:**
```sql
SELECT
  DATE_TRUNC('month', updated_at) as month,
  AVG(total_score) as avg_score
FROM fair_score_breakdown
GROUP BY DATE_TRUNC('month', updated_at)
ORDER BY month;
```
