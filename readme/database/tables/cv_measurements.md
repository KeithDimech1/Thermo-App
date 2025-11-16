# Table: `cv_measurements`

**Purpose:** Store coefficient of variation (CV) performance metrics for each test configuration
**Last Schema Update:** 2025-11-11
**Estimated Row Count:** ~200-500 measurements
**Relationship:** 1:1 with `test_configurations`

---

## Purpose

Stores detailed **coefficient of variation (CV)** measurements that quantify the precision and reproducibility of each test configuration. CV measures the relative variability of repeated measurements - lower CV means higher precision.

Each row corresponds to exactly one `test_configuration` and contains:
- Distribution of CV values across different thresholds
- Statistical summaries (mean, median, std dev)
- Percentage breakdowns for quality assessment

---

## Schema (Bones)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | integer | PK, AUTO | Unique identifier |
| `test_config_id` | integer | FK → test_configurations.id, NOT NULL, UNIQUE | The configuration being measured |
| `cv_lt_10_count` | integer | NULL | Count of measurements with CV < 10% |
| `cv_lt_10_percentage` | numeric(5,2) | NULL, CHECK 0-100 | % of measurements with CV < 10% |
| `cv_10_15_count` | integer | NULL | Count of measurements with CV 10-15% |
| `cv_10_15_percentage` | numeric(5,2) | NULL, CHECK 0-100 | % of measurements with CV 10-15% |
| `cv_15_20_count` | integer | NULL | Count of measurements with CV 15-20% |
| `cv_15_20_percentage` | numeric(5,2) | NULL, CHECK 0-100 | % of measurements with CV 15-20% |
| `cv_gt_20_count` | integer | NULL | Count of measurements with CV > 20% |
| `cv_gt_20_percentage` | numeric(5,2) | NULL, CHECK 0-100 | % of measurements with CV > 20% |
| `mean_cv` | numeric(5,2) | NULL | Average CV across all measurements |
| `median_cv` | numeric(5,2) | NULL | Median CV (50th percentile) |
| `std_dev_cv` | numeric(5,2) | NULL | Standard deviation of CV values |
| `measurement_date` | date | NULL | When measurements were taken |
| `created_at` | timestamp | DEFAULT now() | When record was created |

---

## Understanding CV (Coefficient of Variation)

**What is CV?**
```
CV = (Standard Deviation / Mean) × 100%
```

**Why it matters:**
- **Low CV (<10%):** Highly precise, repeatable results
- **Medium CV (10-15%):** Acceptable precision for most applications
- **High CV (>15%):** Poor precision, unreliable results

**Example:**
If a test measures antibody levels with:
- Mean = 100 units
- Standard Deviation = 5 units
- **CV = (5/100) × 100 = 5%** → Excellent precision!

---

## Relationships

### Foreign Keys (Parents)
- **`test_config_id`** → `test_configurations.id` (1:1, UNIQUE)
  Each measurement set belongs to exactly one test configuration

### No Children
This is a leaf table - no other tables reference it.

---

## Check Constraints

### Percentage Validation
All percentage fields must be between 0 and 100:
- `cv_lt_10_percentage` >= 0 AND <= 100
- `cv_10_15_percentage` >= 0 AND <= 100
- `cv_15_20_percentage` >= 0 AND <= 100
- `cv_gt_20_percentage` >= 0 AND <= 100

**Note:** Percentages should sum to ~100%, but constraint doesn't enforce this (to allow for rounding).

---

## Used By (Code Files)

### API Routes (Read Operations)
- `app/api/configs/route.ts` - Fetch configs with CV performance data
- `app/api/configs/[id]/route.ts` - Single config with detailed CV metrics
- `app/api/analytics/dashboard-stats/route.ts` - Dashboard CV distribution statistics
- `app/api/manufacturers/[id]/route.ts` - Manufacturer avg CV performance
- `app/api/markers/[id]/route.ts` - Marker CV performance across assays
- `app/api/search/route.ts` - Search results with CV filtering

### Server Components
- `app/(dashboard)/dashboard/page.tsx` - Dashboard metrics (avg CV <10%)
- `app/(dashboard)/assays/page.tsx` - Assay list with CV performance
- `app/(dashboard)/manufacturers/[id]/page.tsx` - Manufacturer detail with CV stats
- `app/(dashboard)/markers/[id]/page.tsx` - Marker detail with CV performance
- `app/(dashboard)/compare/page.tsx` - Side-by-side CV comparison

### Dashboard Components
- `components/dashboard/MetricsCards.tsx` - Shows avg CV <10% metric
- `components/dashboard/QualityAlerts.tsx` - Highlights poor CV performers
- `components/dashboard/TopPerformers.tsx` - Shows best CV performers

### Database Queries
- `lib/db/queries.ts` - All query functions join with this table:
  - `getAllConfigs()` - Includes CV percentages for filtering
  - `getConfigById()` - Full CV breakdown for single config
  - `getPoorPerformers()` - Uses cv_lt_10_percentage threshold
  - `getOverallStats()` - Calculates avg CV distribution
  - `compareConfigs()` - CV comparison across multiple configs
  - `getConfigsWithConfidence()` - Includes std_dev for confidence intervals

### Views
- `vw_manufacturer_performance` - Aggregates avg_cv_lt_10_pct by manufacturer
- `vw_test_config_details` - Includes all CV fields for easy querying

---

## Business Rules

### Quality Rating Derivation
The `cv_lt_10_percentage` field drives the `test_configurations.quality_rating`:

```typescript
// From lib/types/qc-data.ts:549
if (cv_lt_10_percentage >= 80) → 'excellent'
if (cv_lt_10_percentage >= 60) → 'good'
if (cv_lt_10_percentage >= 40) → 'acceptable'
if (cv_lt_10_percentage > 0)  → 'poor'
else                           → 'unknown'
```

### Clinical Significance
- **CV < 10%:** Target for critical diagnostic tests (e.g., HIV screening)
- **CV 10-15%:** Acceptable for many routine tests
- **CV > 15%:** May not meet regulatory requirements

### Data Completeness
- `mean_cv` and `median_cv` are typically always present
- `std_dev_cv` may be NULL for small sample sizes
- Count fields should match: cv_lt_10_count + cv_10_15_count + cv_15_20_count + cv_gt_20_count = total measurements

---

## Common Query Patterns

### Get high performers (CV <10% > 80%)
```sql
SELECT tc.*, cv.cv_lt_10_percentage, cv.mean_cv
FROM test_configurations tc
JOIN cv_measurements cv ON tc.id = cv.test_config_id
WHERE cv.cv_lt_10_percentage > 80
ORDER BY cv.cv_lt_10_percentage DESC;
```

### Get CV distribution summary
```sql
SELECT
  AVG(cv_lt_10_percentage) as avg_cv_lt_10,
  AVG(cv_10_15_percentage) as avg_cv_10_15,
  AVG(cv_gt_20_percentage) as avg_cv_gt_20
FROM cv_measurements;
```

### Compare CV performance for a marker across assays
```sql
SELECT
  a.name as assay_name,
  mfr.name as manufacturer_name,
  cv.cv_lt_10_percentage,
  cv.mean_cv,
  cv.median_cv
FROM cv_measurements cv
JOIN test_configurations tc ON cv.test_config_id = tc.id
JOIN assays a ON tc.assay_id = a.id
JOIN manufacturers mfr ON a.manufacturer_id = mfr.id
WHERE tc.marker_id = $1
ORDER BY cv.cv_lt_10_percentage DESC;
```

### Get manufacturer average CV performance
```sql
SELECT
  mfr.name,
  COUNT(tc.id) as total_configs,
  AVG(cv.cv_lt_10_percentage) as avg_cv_lt_10,
  AVG(cv.mean_cv) as overall_mean_cv
FROM manufacturers mfr
JOIN assays a ON a.manufacturer_id = mfr.id
JOIN test_configurations tc ON tc.assay_id = a.id
JOIN cv_measurements cv ON cv.test_config_id = tc.id
GROUP BY mfr.id, mfr.name
ORDER BY avg_cv_lt_10 DESC;
```

---

## Statistical Interpretation

### Mean vs Median CV
- **Mean CV:** Average of all CV values (sensitive to outliers)
- **Median CV:** Middle value (robust to outliers)
- If mean >> median: Some measurements had very high CVs (outliers present)
- If mean ≈ median: CV distribution is roughly symmetric

### Standard Deviation
- **Low std_dev (<2%):** Consistent CV across measurements (predictable)
- **High std_dev (>5%):** Variable CV (may indicate procedural issues)

### Percentage Breakdowns
Percentages show the **distribution** of CV values:
- cv_lt_10_percentage = 85% means 85% of measurements had excellent precision
- cv_gt_20_percentage = 10% means 10% of measurements had poor precision

---

## Recent Changes

**2025-11-11:** Initial schema documented
- No recent modifications detected
- Schema is stable

---

## Related Tables

- **[test_configurations](test_configurations.md)** - Parent table (1:1 relationship)
- **[markers](markers.md)** - Via test_configurations
- **[assays](assays.md)** - Via test_configurations
- **[manufacturers](manufacturers.md)** - Via assays and test_configurations

---

## Performance Notes

### Indexes
- Primary key index on `id` (automatic)
- Foreign key index on `test_config_id` (automatic)
- Unique constraint on `test_config_id` enforces 1:1 relationship
- **Recommended:** Index on `cv_lt_10_percentage` for quality filtering

### Query Optimization
- Always join with `test_configurations` to get context
- Use `vw_test_config_details` for pre-joined access
- Filter by `cv_lt_10_percentage` in WHERE clause for quality searches
- Use `mean_cv` and `median_cv` for quick statistical summaries

### Storage
- numeric(5,2) stores up to 999.99 with 2 decimal places
- Efficient for percentage and CV storage
- Total row size: ~150 bytes (small, fast)

---

## Data Quality Checks

### Expected Invariants
```sql
-- Percentages should sum to ~100% (allowing for rounding)
SELECT *
FROM cv_measurements
WHERE ABS(
  COALESCE(cv_lt_10_percentage, 0) +
  COALESCE(cv_10_15_percentage, 0) +
  COALESCE(cv_15_20_percentage, 0) +
  COALESCE(cv_gt_20_percentage, 0) - 100
) > 1;

-- Counts should match percentages (if total measurements known)
-- mean_cv should be positive
SELECT * FROM cv_measurements WHERE mean_cv <= 0;

-- median_cv should be positive
SELECT * FROM cv_measurements WHERE median_cv <= 0;
```

---

**Generated:** 2025-11-11
**Last Verified:** 2025-11-11
**Schema Version:** 1.0.0
