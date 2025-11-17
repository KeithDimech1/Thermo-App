# Table: `ft_single_grain_ages`

**Last Updated:** 2025-11-18 06:48:00

## Purpose

Stores **individual grain ages** for fission-track data. While `ft_datapoints` stores summary statistics (pooled age, central age), this table preserves each grain's calculated age with its uncertainty.

Essential for:
- **Detrital studies:** Peak fitting, mixture modeling
- **Quality control:** Identifying outliers
- **Advanced statistics:** Radial plots, kernel density estimates
- **Reproducibility:** Grain-level age data for independent verification

## Schema (Key Fields)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | integer | PK, NOT NULL | Unique identifier |
| `ft_datapoint_id` | integer | FK → ft_datapoints.id, NOT NULL | Parent analytical session |
| `grain_id` | varchar(100) | NOT NULL, UNIQUE with datapoint | Grain identifier |
| `mount_id` | varchar(50) | FK → mounts.mount_id | Sample mount |
| `etch_duration_seconds` | integer | | Etching time (seconds) |
| `u_ppm` | numeric(10,3) | | Uranium concentration (ppm) |
| `u_ppm_error` | numeric(10,3) | | U concentration uncertainty |
| `u_ca_ratio` | numeric(10,6) | | U/Ca ratio (for LA-ICP-MS) |
| `u_ca_ratio_error` | numeric(10,6) | | U/Ca ratio uncertainty |
| `u_ca_error_type` | varchar(20) | | Error type (SE, SD, 1σ, 2σ) |
| `rmr0` | numeric(6,4) | | Reduced mean length ratio (annealing kinetics) |
| `kappa` | numeric(6,4) | | Kappa annealing parameter |
| `grain_age_ma` | numeric(10,2) | | **Calculated grain age (Ma)** |
| `grain_age_error_ma` | numeric(10,2) | | Age uncertainty (Ma) |
| `grain_age_error_type` | varchar(20) | | Error type (SE, SD, 1σ, 2σ) |
| `comments` | text | | Additional notes |
| `created_at` | timestamp | DEFAULT now() | Record creation timestamp |

## Relationships

### Foreign Keys
- `ft_datapoint_id` → `ft_datapoints.id` (parent analytical session)
- `mount_id` → `mounts.mount_id` (sample mount)
- `grain_id` + `ft_datapoint_id` → Unique constraint

### Referenced By
- None (leaf table)

## Used By (Code Files)

**Import:**
- `scripts/db/import-earthbank-templates.ts` - Imports from EarthBank "FTSingleGrain" sheet

**Queries:**
- `lib/db/queries.ts:getFTSingleGrainAgesByDatapoint()` - Retrieve individual grain ages

## Business Rules

1. **Unique grains:** (ft_datapoint_id, grain_id) must be unique
2. **Links to count data:** grain_id should match grain_id in `ft_count_data`
3. **Age calculation:** Ages calculated from track counts in `ft_count_data`
4. **Error propagation:** Uncertainties include analytical + systematic errors
5. **U concentration:** Critical for annealing corrections (Cl content proxy)

## Key Concepts

### Single Grain vs Pooled Age
- **Single grain age:** Age of one individual crystal
- **Pooled age:** Age from all grains combined (in `ft_datapoints`)
- **Central age:** Weighted mean accounting for overdispersion

### Uranium Concentration
- **u_ppm:** Direct measurement (LA-ICP-MS) or calculated from Ni (EDM)
- **u_ca_ratio:** U/Ca ratio indicates Cl content (affects annealing)
- **High U grains:** More tracks, higher precision, but potential zoning issues

### Annealing Parameters
- **rmr₀:** Kinetic parameter from Dpar (0.7-0.9 typical for apatite)
- **kappa:** Alternative kinetic parameter
- Both used in thermal history modeling

## EarthBank Integration

Maps to **EarthBank FTSingleGrain sheet:**
- Grain-level ages with uncertainties
- U concentration data
- Kinetic parameters (rmr₀, kappa)
- Mount and etching metadata

## Common Queries

```sql
-- Get single grain ages for radial plot
SELECT
  grain_id,
  grain_age_ma,
  grain_age_error_ma,
  u_ppm
FROM ft_single_grain_ages
WHERE ft_datapoint_id = (
  SELECT id FROM ft_datapoints WHERE sample_id = 'MAL-001'
)
ORDER BY grain_age_ma;

-- Identify age outliers (>2σ from central age)
WITH stats AS (
  SELECT
    AVG(grain_age_ma) AS mean_age,
    STDDEV(grain_age_ma) AS sd_age
  FROM ft_single_grain_ages
  WHERE ft_datapoint_id = 123
)
SELECT
  sga.grain_id,
  sga.grain_age_ma,
  ABS(sga.grain_age_ma - stats.mean_age) / stats.sd_age AS z_score
FROM ft_single_grain_ages sga, stats
WHERE sga.ft_datapoint_id = 123
  AND ABS(sga.grain_age_ma - stats.mean_age) / stats.sd_age > 2;

-- Compare single grain ages to pooled age
SELECT
  sga.grain_id,
  sga.grain_age_ma,
  dp.pooled_age_ma,
  ABS(sga.grain_age_ma - dp.pooled_age_ma) AS diff_ma
FROM ft_single_grain_ages sga
JOIN ft_datapoints dp ON sga.ft_datapoint_id = dp.id
WHERE dp.sample_id = 'MAL-001'
ORDER BY diff_ma DESC;
```

## Detrital Applications

For **detrital samples** (sediments with mixed provenance):
- Plot grain age distribution (kernel density estimate)
- Identify age peaks (source regions)
- Perform mixture modeling (binomial peak fitting)
- Compare age spectra between samples

## Radial Plot Data

This table provides the data for **radial plots** (Galbraith 1988):
- **Age:** grain_age_ma
- **Precision:** 1 / grain_age_error_ma
- **Plot coordinates:** (precision, standardized age estimate)

## Notes

- **Not always available:** Some labs only report pooled/central ages
- **Detrital essential:** Critical for sediment provenance studies
- **Quality control:** Reveals age scatter, outliers, U zoning
- **Thermal modeling:** Individual grain ages constrain t-T paths
- **FAIR compliance:** Grain-level data enables independent analysis
