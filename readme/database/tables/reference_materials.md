# Table: `reference_materials`

**Last Updated:** 2025-11-18 06:55:00

## Purpose

Stores **quality control (QC) standard results** analyzed alongside unknown samples. Reference materials with known ages/values are run in each analytical batch to validate:
- Analytical accuracy (measured vs expected)
- Batch-to-batch reproducibility
- Instrument stability over time

Essential for **data quality assurance** - every batch should include standards.

## Schema

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | integer | PK, NOT NULL | Unique identifier |
| `batch_id` | integer | FK → batches.id, NOT NULL | Analytical batch |
| `material_name` | varchar(100) | NOT NULL | Standard name (e.g., "Durango", "Fish Canyon") |
| `material_type` | varchar(50) | | Material type: 'age_standard', 'kinetic_standard', etc. |
| `expected_age_ma` | numeric(10,2) | | Accepted/published age (Ma) |
| `expected_age_error_ma` | numeric(10,2) | | Uncertainty on expected age |
| `measured_age_ma` | numeric(10,2) | | Age measured in this batch |
| `measured_age_error_ma` | numeric(10,2) | | Uncertainty on measured age |
| `parameter_type` | varchar(50) | | Alternative: specific parameter measured |
| `measured_value` | numeric(15,6) | | Measured parameter value |
| `expected_value` | numeric(15,6) | | Expected parameter value |
| `error` | numeric(15,6) | | Uncertainty on measurement |
| `created_at` | timestamp | DEFAULT now() | Record creation timestamp |

## Relationships

### Foreign Keys
- `batch_id` → `batches.id` (parent analytical batch)

### Referenced By
- None (leaf table)
- Data used to assess batch quality in `batches` and `ft_datapoints`/`he_datapoints`

## Used By (Code Files)

**Import:**
- `scripts/db/import-earthbank-templates.ts` - Imports reference material results

**Queries:**
- `lib/db/queries.ts:getReferenceMaterialsByBatch()` - QC data for batch

## Business Rules

1. **One batch → multiple standards:** Typically 2-5 standards per batch
2. **Known vs measured:** Expected values from literature, measured from this batch
3. **Accuracy check:** measured_age should match expected_age within 2σ
4. **Reproducibility:** Standard ages should be consistent across batches
5. **Red flags:**
   - >10% difference from expected
   - High standard deviation across replicates
   - Drift over time

## Common Reference Materials

### Fission-Track Standards

| Standard | Mineral | Expected Age | Purpose |
|----------|---------|--------------|---------|
| **Durango apatite** | Apatite | 31.4 ± 0.5 Ma | Most common FT age standard |
| **Fish Canyon tuff** | Apatite/Zircon | 28.5 ± 0.06 Ma | High-precision standard |
| **Mount Dromedary** | Apatite | 98.7 ± 0.7 Ma | Older age range |
| **IUGS apatite** | Apatite | Variable | Track density standard |

### (U-Th)/He Standards

| Standard | Mineral | Expected Age | Purpose |
|----------|---------|--------------|---------|
| **Durango apatite** | Apatite | 31.4 ± 0.5 Ma | Age standard (FT + He) |
| **Fish Canyon tuff** | Apatite | ~28 Ma | Age validation |
| **Mt. Dromedary** | Apatite | ~98 Ma | Older He standard |

### Kinetic Standards

| Standard | Mineral | Dpar (μm) | rmr₀ |
|----------|---------|-----------|------|
| **Durango** | Apatite | ~2.0-2.5 | ~0.83 |
| **Fish Canyon** | Apatite | ~1.8-2.2 | ~0.84 |

## EarthBank Integration

Maps to **EarthBank QC fields:**
- Standard material names
- Expected vs measured values
- Batch-level QC tracking
- Enables data quality assessment

## Common Queries

```sql
-- Get all standards for a batch
SELECT
  material_name,
  expected_age_ma,
  measured_age_ma,
  100.0 * (measured_age_ma - expected_age_ma) / expected_age_ma AS percent_diff
FROM reference_materials
WHERE batch_id = 123
ORDER BY material_name;

-- Find batches with poor standard accuracy (>10% off)
SELECT
  b.batch_name,
  rm.material_name,
  rm.expected_age_ma,
  rm.measured_age_ma,
  ABS(rm.measured_age_ma - rm.expected_age_ma) AS diff_ma,
  100.0 * ABS(rm.measured_age_ma - rm.expected_age_ma) / rm.expected_age_ma AS percent_diff
FROM reference_materials rm
JOIN batches b ON rm.batch_id = b.id
WHERE ABS(100.0 * (rm.measured_age_ma - rm.expected_age_ma) / rm.expected_age_ma) > 10
ORDER BY percent_diff DESC;

-- Track Durango apatite ages over time
SELECT
  b.analysis_date,
  rm.measured_age_ma,
  rm.measured_age_error_ma,
  31.4 AS expected_age_ma
FROM reference_materials rm
JOIN batches b ON rm.batch_id = b.id
WHERE rm.material_name = 'Durango'
ORDER BY b.analysis_date;

-- Standard reproducibility statistics
SELECT
  material_name,
  COUNT(*) AS n_measurements,
  AVG(measured_age_ma) AS mean_age_ma,
  STDDEV(measured_age_ma) AS sd_age_ma,
  100.0 * STDDEV(measured_age_ma) / AVG(measured_age_ma) AS cv_pct,
  AVG(expected_age_ma) AS expected_age_ma
FROM reference_materials
WHERE material_name = 'Durango'
GROUP BY material_name;
```

## Quality Control Thresholds

**Acceptable performance:**
- **Age difference:** <5% from expected (ideally <3%)
- **Reproducibility:** Standard deviation <10% (ideally <5%)
- **Outliers:** <10% of measurements outside 2σ

**Warning signs:**
- **Systematic bias:** All standards too old or too young
- **Poor reproducibility:** High scatter between replicates
- **Drift:** Standards shift over time (instrument degradation)

## QC Workflow

1. **Run standards:** Analyze 2-5 standards per batch with unknowns
2. **Calculate statistics:** Mean, SD, % difference from expected
3. **Flag issues:** Batches failing QC criteria
4. **Re-run if needed:** Re-analyze if standards fail
5. **Document:** Record all standard results (good and bad)

## Durango Apatite Details

**Most widely used FT/He standard:**
- **Location:** Cerro de Mercado, Durango, Mexico
- **FT age:** 31.4 ± 0.5 Ma (McDowell et al. 2005)
- **He age:** ~31 Ma
- **Dpar:** ~2.0-2.5 μm (intermediate annealing kinetics)
- **Availability:** Commercially available from Ward's

## Notes

- **Every batch needs standards:** Non-negotiable for quality assurance
- **Document all results:** Even failed runs (shows integrity)
- **Multiple standards:** Use 2+ standards per batch (different ages/kinetics)
- **Track over time:** Monitor trends (instrument drift, analyst changes)
- **FAIR compliance:** QC data enables independent quality assessment
- **Publication requirement:** Many journals require standard results
