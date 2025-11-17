# Table: `ft_count_data`

**Last Updated:** 2025-11-18 06:47:00

## Purpose

Stores **grain-by-grain fission-track count data** for EDM and LA-ICP-MS methods. This is the **fundamental data** from which all FT ages are calculated. Each row represents one analyzed grain with its spontaneous (Ns), induced (Ni), and dosimeter (Nd) track counts.

This table is **required by Kohn et al. (2024) FAIR standards** - enables independent age recalculation with updated decay constants.

## Schema (Key Fields)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | integer | PK, NOT NULL | Unique identifier |
| `ft_datapoint_id` | integer | FK → ft_datapoints.id, NOT NULL | Parent analytical session |
| `grain_id` | varchar(100) | NOT NULL, UNIQUE with datapoint | Grain identifier (e.g., "G1", "grain-001") |
| `counting_area_cm2` | numeric(10,6) | | Area counted for tracks (cm²) |
| `ns` | integer | | Spontaneous track count |
| `rho_s_cm2` | numeric(12,2) | | Spontaneous track density (tracks/cm²) |
| `ni` | integer | | Induced track count (EDM method) |
| `rho_i_cm2` | numeric(12,2) | | Induced track density (tracks/cm²) |
| `nd` | integer | | Dosimeter track count (EDM method) |
| `rho_d_cm2` | numeric(12,2) | | Dosimeter track density (tracks/cm²) |
| `dpar_um` | numeric(6,3) | | Dpar etch pit diameter (μm) |
| `dpar_error_um` | numeric(6,3) | | Dpar uncertainty |
| `n_dpar_measurements` | integer | | Number of Dpar measurements |
| `dper_um` | numeric(6,3) | | Dper etch pit diameter perpendicular to c-axis |
| `dper_error_um` | numeric(6,3) | | Dper uncertainty |
| `n_dper_measurements` | integer | | Number of Dper measurements |
| `dpar_dper_error_type` | varchar(20) | | Error type (SE, SD, 1σ, 2σ) |
| `comments` | text | | Additional notes |
| `created_at` | timestamp | DEFAULT now() | Record creation timestamp |

## Relationships

### Foreign Keys
- `ft_datapoint_id` → `ft_datapoints.id` (parent analytical session)
- `grain_id` + `ft_datapoint_id` → Unique constraint

### Referenced By
- Used to calculate pooled age, central age, dispersion in `ft_datapoints`

## Used By (Code Files)

**Import:**
- `scripts/db/import-earthbank-templates.ts:insertFTCountData()` - Imports from EarthBank template

**Queries:**
- `lib/db/queries.ts:getFTCountDataByDatapoint()` - Retrieve grain-by-grain data

## Business Rules

1. **Unique grains:** (ft_datapoint_id, grain_id) must be unique
2. **Required for age calc:** Ns, ρs required minimum (EDM needs Ni, Nd, ρi, ρd)
3. **Track densities:** ρs = Ns / counting_area (automatically calculated or provided)
4. **Dpar for kinetics:** Dpar measurements enable annealing model corrections
5. **Zero-count grains:** Allowed (Ns = 0 is valid, indicates very young age or U-poor grain)

## Key Concepts

### Track Counts
- **Ns (Spontaneous):** Tracks from natural uranium-238 fission
- **Ni (Induced):** Tracks from thermal neutron irradiation (EDM only)
- **Nd (Dosimeter):** Tracks in dosimeter glass (EDM only)

### Track Densities
- **ρs:** Spontaneous track density (tracks/cm²)
- **ρi:** Induced track density (tracks/cm²)
- **ρd:** Dosimeter track density (tracks/cm²)

### Kinetic Parameters
- **Dpar:** Etch pit diameter parallel to c-axis (annealing kinetics proxy)
- **Dper:** Etch pit diameter perpendicular to c-axis
- **rmr₀:** Reduced mean length ratio (calculated from Dpar)

## EarthBank Integration

Maps to **EarthBank FTCountData sheet** (Kohn et al. 2024 Table 5):
- All count fields (Ns, Ni, Nd)
- All density fields (ρs, ρi, ρd)
- Counting area, Dpar measurements
- Grain-level metadata

## Common Queries

```sql
-- Get grain-by-grain count data for a sample
SELECT
  grain_id,
  ns,
  rho_s_cm2,
  ni,
  rho_i_cm2,
  dpar_um
FROM ft_count_data
WHERE ft_datapoint_id = (
  SELECT id FROM ft_datapoints WHERE sample_id = 'MAL-001'
)
ORDER BY grain_id;

-- Calculate pooled age from grain counts
SELECT
  SUM(ns) AS total_ns,
  SUM(ni) AS total_ni,
  SUM(nd) AS total_nd,
  SUM(ns) * 1.0 / SUM(ni) AS ns_ni_ratio
FROM ft_count_data
WHERE ft_datapoint_id = 123;

-- Find grains with high Dpar (slow-annealing)
SELECT
  grain_id,
  dpar_um,
  rho_s_cm2
FROM ft_count_data
WHERE ft_datapoint_id = 123
  AND dpar_um > 2.5
ORDER BY dpar_um DESC;
```

## EDM vs LA-ICP-MS

| Field | EDM Method | LA-ICP-MS Method |
|-------|-----------|------------------|
| **Ns, ρs** | ✅ Required | ✅ Required |
| **Ni, ρi, Nd, ρd** | ✅ Required | ❌ Not used |
| **counting_area** | ✅ Required | ✅ Required |
| **Dpar** | ✅ Recommended | ✅ Recommended |

## Statistical Calculations

From this table, you can calculate:
- **Pooled age:** Age from summed track counts (assumes single population)
- **Central age:** Random effects model accounting for overdispersion
- **Chi-square (χ²):** Tests if scatter exceeds analytical uncertainty
- **Dispersion:** Measure of age heterogeneity

## Notes

- **Core FAIR data:** Required by Kohn et al. (2024) reporting standards
- **Independent recalculation:** Enables age updates with new decay constants
- **Grain-level detail:** Preserves all information for advanced statistics
- **Quality control:** Individual grain ages reveal outliers, mixing, U zoning
