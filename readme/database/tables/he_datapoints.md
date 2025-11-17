# Table: `he_datapoints`

**Last Updated:** 2025-11-18 06:50:00

## Purpose

Stores **(U-Th)/He analytical session metadata and summary statistics**. This is the **parent table** for (U-Th)/He data - each row represents one analytical session with summary ages and QC statistics.

Similar to `ft_datapoints` but for (U-Th)/He method. Contains:
- Sample-level summary statistics (mean ages, weighted means)
- Quality control metrics (MSWD, chi-square, IQR)
- Analytical methodology documentation
- Links to grain-level data in `he_whole_grain_data`

## Schema (Key Fields - 46 total)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | integer | PK, NOT NULL | Unique identifier |
| `sample_id` | varchar(50) | FK → samples.sample_id, NOT NULL | Sample identifier |
| `datapoint_key` | varchar(100) | UNIQUE, NOT NULL | Unique analytical session key |
| `batch_id` | integer | FK → batches.id | QC batch (links to standards) |
| `laboratory` | varchar(200) | | Lab name |
| `analyst_orcid` | varchar(50) | | ORCID of analyst |
| `analysis_date` | timestamp | | Date of analysis |
| `publication_doi` | varchar(100) | | DOI of publication |
| `mineral_type` | varchar(50) | | 'apatite' or 'zircon' |
| `mount_id` | varchar(50) | FK → mounts.mount_id | Sample mount |
| `n_aliquots` | integer | | Number of grains analyzed |

**Uncorrected Ages:**
| `mean_uncorr_age_ma` | numeric(10,2) | | Mean uncorrected age |
| `mean_uncorr_age_error_ma` | numeric(10,2) | | Uncertainty |
| `weighted_mean_uncorr_age_ma` | numeric(10,2) | | Weighted mean uncorrected |
| `mswd_uncorr` | numeric(8,4) | | MSWD (mean square weighted deviation) |
| `chi2_uncorr_pct` | numeric(6,3) | | Chi-square probability (%) |
| `iqr_uncorr_ma` | numeric(10,2) | | Interquartile range |

**Corrected Ages (Ft-corrected):**
| `mean_corr_age_ma` | numeric(10,2) | | **Mean corrected age (Ma)** |
| `mean_corr_age_error_ma` | numeric(10,2) | | Uncertainty |
| `weighted_mean_corr_age_ma` | numeric(10,2) | | **Weighted mean corrected** |
| `mswd_corr` | numeric(8,4) | | MSWD for corrected ages |
| `chi2_corr_pct` | numeric(6,3) | | Chi-square probability (%) |
| `iqr_corr_ma` | numeric(10,2) | | Interquartile range |

**Methodology:**
| `he_measurement_method` | varchar(100) | | He extraction method |
| `parent_isotope_method` | varchar(100) | | U-Th-Sm measurement method |
| `ft_correction_equation` | varchar(100) | | Alpha ejection correction formula |
| `eu_equation` | varchar(100) | | Effective uranium calculation |
| `he_age_approach` | varchar(100) | | Age calculation approach |
| `created_at` | timestamp | DEFAULT now() | Record creation timestamp |

## Relationships

### Foreign Keys
- `sample_id` → `samples.sample_id` (parent sample)
- `batch_id` → `batches.id` (QC batch with standards)
- `mount_id` → `mounts.mount_id` (sample mount)

### Referenced By
- `he_whole_grain_data.he_datapoint_id` → This table (grain-level data)

## Used By (Code Files)

**Import:**
- `scripts/db/import-earthbank-templates.ts` - Imports from EarthBank "He Datapoints" sheet

**Queries:**
- `lib/db/queries.ts:getHeDatapointsBySample()` - Retrieve He sessions for sample
- `lib/db/queries.ts:getHeDatapointById()` - Retrieve single He session

## Business Rules

1. **Unique datapoint_key:** Each analytical session has unique identifier
2. **Corrected vs uncorrected:**
   - **Uncorrected:** Raw ages (no alpha ejection correction)
   - **Corrected:** Ages after Ft correction (typically 10-40% older)
3. **QC metrics:**
   - **MSWD > 1:** Age scatter exceeds analytical uncertainty (possible U zoning)
   - **Chi² < 5%:** Age scatter likely geological (not analytical)
   - **IQR:** Robust measure of spread (less sensitive to outliers)
4. **Multiple grains required:** Typically 3-5 grains per sample (reproducibility)

## Key Concepts

### Uncorrected vs Corrected Ages

- **Uncorrected age:** Raw age from He/U-Th measurements
- **Ft correction:** Alpha stopping distance correction (grains lose He near edges)
- **Ft factor:** Typically 0.6-0.9 (depends on grain size/geometry)
- **Corrected age = Uncorrected age / Ft**

### Quality Control Metrics

**MSWD (Mean Square Weighted Deviation):**
- Expected value: ~1.0
- >1: Scatter exceeds analytical uncertainty
- >>2: Significant geological or analytical issues

**Chi-square probability:**
- >5%: Scatter explained by analytical uncertainty
- <5%: Excess scatter (U zoning, inclusions, He loss)

**IQR (Interquartile Range):**
- Robust to outliers
- Measure of age reproducibility

## EarthBank Integration

Maps to **EarthBank He Datapoints sheet** (46+ columns):
- Summary age statistics (mean, weighted mean)
- QC metrics (MSWD, chi-square)
- Analytical methodology
- Correction equations
- Links to grain-level data

## Common Queries

```sql
-- Get (U-Th)/He datapoints for a sample
SELECT
  datapoint_key,
  mean_corr_age_ma,
  mean_corr_age_error_ma,
  n_aliquots,
  mswd_corr,
  chi2_corr_pct
FROM he_datapoints
WHERE sample_id = 'MAL-001'
ORDER BY analysis_date;

-- Find samples with poor reproducibility (high MSWD)
SELECT
  sample_id,
  datapoint_key,
  mswd_corr,
  n_aliquots,
  iqr_corr_ma
FROM he_datapoints
WHERE mswd_corr > 2.0
ORDER BY mswd_corr DESC;

-- Compare corrected vs uncorrected ages
SELECT
  sample_id,
  mean_uncorr_age_ma,
  mean_corr_age_ma,
  (mean_corr_age_ma - mean_uncorr_age_ma) AS correction_ma,
  100.0 * (mean_corr_age_ma - mean_uncorr_age_ma) / mean_uncorr_age_ma AS correction_pct
FROM he_datapoints
ORDER BY correction_pct DESC;
```

## Typical Workflows

1. **Quality assessment:**
   - Check MSWD (should be ~1)
   - Check chi-square (should be >5%)
   - Review IQR (should be <20% of mean age)

2. **Age reporting:**
   - Report **weighted mean corrected age** (most common)
   - Include MSWD and n_aliquots
   - Note if ages fail QC criteria

3. **Comparison with FT:**
   - He ages typically younger than FT (lower closure temperature)
   - Typical difference: 50-150°C (He ~70°C, FT ~110°C)

## Notes

- **Summary table:** Grain-level data in `he_whole_grain_data`
- **Ft correction critical:** Can change ages by 10-40%
- **FAIR compliance:** Full methodology documentation enables recalculation
- **QC essential:** MSWD, chi-square reveal data quality issues
- **EarthBank compatible:** Direct import/export from templates
