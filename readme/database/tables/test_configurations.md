# Table: `test_configurations`

**Purpose:** Core table that defines unique test combinations
**Last Schema Update:** 2025-11-11
**Estimated Row Count:** ~200-500 configurations
**Growth Rate:** Active (grows as new assay/QC combinations are tested)

---

## Purpose

This is the **central table** of the database. It represents unique combinations of:
- A specific **marker** (what's being measured)
- A specific **assay** (how it's measured)
- A specific **QC sample** (what material is used)

Each combination is evaluated for quality, and performance metrics (CV measurements) are tracked in a 1:1 relationship.

---

## Schema (Bones)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | integer | PK, AUTO | Unique identifier |
| `marker_id` | integer | FK → markers.id, NOT NULL | The biomarker being tested |
| `assay_id` | integer | FK → assays.id, NOT NULL | The test system used |
| `qc_sample_id` | integer | FK → qc_samples.id, NOT NULL | The QC material used |
| `test_type` | varchar(50) | NOT NULL, CHECK | Type of test: serology, nat, both |
| `events_examined` | integer | NULL | Number of test events analyzed |
| `quality_rating` | varchar(50) | CHECK, NULL | Overall quality: excellent, good, acceptable, poor, unknown |
| `notes` | text | NULL | Additional comments or context |
| `created_at` | timestamp | DEFAULT now() | When record was created |
| `updated_at` | timestamp | DEFAULT now() | When record was last modified |
| `inclusion_group` | varchar(50) | DEFAULT 'original_curated' | Data source/batch identifier |

---

## Relationships

### Foreign Keys (Parents)
- **`marker_id`** → `markers.id`
  Links to the biomarker (e.g., "HIV-1/2 Ab", "HCV IgG")

- **`assay_id`** → `assays.id`
  Links to the test platform (e.g., "ARCHITECT HIV Ag/Ab Combo")

- **`qc_sample_id`** → `qc_samples.id`
  Links to the QC material used (e.g., "Bio-Rad Immunology Plus")

### Referenced By (Children)
- **`cv_measurements.test_config_id`** → `test_configurations.id` (1:1)
  Each configuration has exactly one set of CV performance metrics

---

## Unique Constraints

**Unique Index:** (marker_id, assay_id, qc_sample_id)

This ensures that each combination is recorded only once. You cannot have duplicate test configurations with the same marker, assay, and QC sample.

---

## Check Constraints

### test_type
Must be one of:
- `'serology'` - Antibody/antigen detection
- `'nat'` - Nucleic acid testing (PCR)
- `'both'` - Tests both serology and NAT

### quality_rating
Must be one of:
- `'excellent'` - High precision (typically CV <10% > 80%)
- `'good'` - Good precision (CV <10% 60-80%)
- `'acceptable'` - Acceptable precision (CV <10% 40-60%)
- `'poor'` - Poor precision (CV <10% < 40%)
- `'unknown'` - Not yet assessed

**Note:** Quality rating is typically calculated from `cv_measurements.cv_lt_10_percentage`.

---

## Used By (Code Files)

### API Routes (Write Operations)
- `app/api/configs/route.ts` - GET endpoint to fetch test configurations with filters
- `app/api/configs/[id]/route.ts` - GET endpoint for single configuration details

### API Routes (Read Operations)
- `app/api/analytics/dashboard-stats/route.ts` - Dashboard statistics (quality distribution)
- `app/api/manufacturers/[id]/route.ts` - Manufacturer's test configurations
- `app/api/markers/[id]/route.ts` - Marker's test configurations
- `app/api/search/route.ts` - Search across configurations

### Server Components
- `app/(dashboard)/dashboard/page.tsx` - Dashboard overview with poor performers
- `app/(dashboard)/assays/page.tsx` - All test configurations list
- `app/(dashboard)/manufacturers/[id]/page.tsx` - Manufacturer detail with configs
- `app/(dashboard)/markers/[id]/page.tsx` - Marker detail with configs
- `app/(dashboard)/compare/page.tsx` - Compare multiple configurations

### Database Queries
- `lib/db/queries.ts` - 20+ query functions:
  - `getAllConfigs()` - List all with filters
  - `getConfigById()` - Single config with full details
  - `getConfigsByMarkerId()` - All configs for a marker
  - `getConfigsByManufacturerId()` - All configs for a manufacturer
  - `getPoorPerformers()` - Configs with CV <10% below threshold
  - `compareConfigs()` - Multi-config comparison
  - `getConfigWithRiskAssessment()` - Config with calculated risk
  - `getConfigsWithConfidence()` - Configs with confidence intervals
  - `compareConfigsWithContext()` - Detailed comparison with context

### Views
- `vw_manufacturer_performance` - Aggregates configs by manufacturer
- `vw_test_config_details` - Denormalized view of all config details

---

## Business Rules

### Quality Rating Calculation
```typescript
// From lib/types/qc-data.ts:549
calculateQualityRating(cvPerformance: CVPerformanceData): QualityRating {
  const cvLt10 = cvPerformance.cv_lt_10_percentage;

  if (cvLt10 >= 80) return 'excellent';
  if (cvLt10 >= 60) return 'good';
  if (cvLt10 >= 40) return 'acceptable';
  if (cvLt10 > 0) return 'poor';
  return 'unknown';
}
```

### Inclusion Groups
- **original_curated** - Original dataset from QC study
- Future: May include new_batch, external_data, etc.

### Test Type Inference
- If marker.marker_type = 'Nucleic Acid' → likely test_type = 'nat'
- If marker.marker_type = 'Antibody' or 'Antigen' → likely test_type = 'serology'
- Some markers support both types

---

## Common Query Patterns

### Get all configs for a marker
```sql
SELECT tc.*, a.name as assay_name, m.name as marker_name
FROM test_configurations tc
JOIN assays a ON tc.assay_id = a.id
JOIN markers m ON tc.marker_id = m.id
WHERE tc.marker_id = $1
ORDER BY tc.quality_rating DESC;
```

### Get poor performers (CV <10% < 40%)
```sql
SELECT tc.*, cv.cv_lt_10_percentage
FROM test_configurations tc
JOIN cv_measurements cv ON tc.id = cv.test_config_id
WHERE cv.cv_lt_10_percentage < 40
ORDER BY cv.cv_lt_10_percentage ASC;
```

### Get configs by manufacturer
```sql
SELECT tc.*, a.name as assay_name, m.name as marker_name
FROM test_configurations tc
JOIN assays a ON tc.assay_id = a.id
JOIN markers m ON tc.marker_id = m.id
WHERE a.manufacturer_id = $1;
```

### Compare assays for the same marker
```sql
SELECT
  tc.id,
  a.name as assay_name,
  mfr.name as manufacturer_name,
  cv.cv_lt_10_percentage,
  tc.quality_rating
FROM test_configurations tc
JOIN assays a ON tc.assay_id = a.id
JOIN manufacturers mfr ON a.manufacturer_id = mfr.id
JOIN cv_measurements cv ON tc.id = cv.test_config_id
WHERE tc.marker_id = $1
ORDER BY cv.cv_lt_10_percentage DESC;
```

---

## Recent Changes

**2025-11-11:** Initial schema documented
- No recent modifications detected
- Schema is stable

---

## Related Tables

- **[markers](markers.md)** - What biomarkers are being tested
- **[assays](assays.md)** - What test systems are used
- **[qc_samples](qc_samples.md)** - What QC materials are used
- **[cv_measurements](cv_measurements.md)** - Performance metrics (1:1 relationship)
- **[manufacturers](manufacturers.md)** - Via assays table

---

## Performance Notes

### Indexes
- Primary key index on `id` (automatic)
- Foreign key indexes on `marker_id`, `assay_id`, `qc_sample_id` (automatic)
- Unique index on (marker_id, assay_id, qc_sample_id)
- Consider adding index on `quality_rating` for dashboard queries
- Consider adding index on `test_type` for filtering

### Query Optimization
- Use `vw_test_config_details` view for denormalized access (faster)
- Join with `cv_measurements` on every query for performance metrics
- Filter by `quality_rating` in WHERE clause for quick categorization
- Use `inclusion_group` for batch processing

---

**Generated:** 2025-11-11
**Last Verified:** 2025-11-11
**Schema Version:** 1.0.0
