# Table: `ft_track_length_data`

**Last Updated:** 2025-11-18 06:49:00

## Purpose

Stores **individual confined track length measurements** for fission-track thermochronology. Track lengths are the **key to thermal history modeling** - they record how much annealing (track shortening) has occurred.

This is **THE most important table for thermal modeling**:
- Mean track length (MTL) indicates average cooling rate
- Length distribution shape reveals complex thermal histories
- Individual track data enables Monte Carlo modeling

## Schema (Key Fields)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | integer | PK, NOT NULL | Unique identifier |
| `ft_datapoint_id` | integer | FK → ft_datapoints.id, NOT NULL | Parent analytical session |
| `grain_id` | varchar(100) | NOT NULL | Grain containing this track |
| `track_id` | varchar(100) | NOT NULL | Unique track identifier |
| `track_type` | varchar(20) | CHECK constraint | 'TINT', 'TINCLE', 'semi-track', or NULL |
| `mount_id` | varchar(50) | FK → mounts.mount_id | Sample mount |
| `etch_duration_seconds` | integer | | Etching time (seconds) |
| `apparent_length_um` | numeric(6,3) | | Measured track length (μm) |
| `corrected_z_depth_um` | numeric(8,2) | | Depth correction for oblique tracks |
| `true_length_um` | numeric(6,3) | | **3D corrected length (μm)** |
| `azimuth_deg` | numeric(6,2) | | Track azimuth angle (degrees) |
| `dip_deg` | numeric(6,2) | | Track dip angle (degrees) |
| `angle_to_c_axis_deg` | numeric(6,2) | | **Angle to crystallographic c-axis** |
| `c_axis_corrected_length_um` | numeric(6,3) | | **Length corrected for c-axis angle** |
| `dpar_um` | numeric(6,3) | | Dpar etch pit diameter (μm) |
| `dpar_error_um` | numeric(6,3) | | Dpar uncertainty |
| `n_dpar_measurements` | integer | | Number of Dpar measurements |
| `dper_um` | numeric(6,3) | | Dper etch pit diameter perpendicular to c-axis |
| `dper_error_um` | numeric(6,3) | | Dper uncertainty |
| `n_dper_measurements` | integer | | Number of Dper measurements |
| `dpar_dper_error_type` | varchar(20) | | Error type (SE, SD, 1σ, 2σ) |
| `rmr0` | numeric(6,4) | | Reduced mean length ratio (annealing kinetics) |
| `kappa` | numeric(6,4) | | Kappa annealing parameter |
| `comments` | text | | Additional notes |
| `created_at` | timestamp | DEFAULT now() | Record creation timestamp |

**CHECK constraint:** `track_type` must be 'TINT', 'TINCLE', 'semi-track', or NULL

## Relationships

### Foreign Keys
- `ft_datapoint_id` → `ft_datapoints.id` (parent analytical session)
- `mount_id` → `mounts.mount_id` (sample mount)

### Referenced By
- None (leaf table)
- Data used to calculate MTL in `ft_datapoints.mean_track_length_um`

## Used By (Code Files)

**Import:**
- `scripts/db/import-earthbank-templates.ts` - Imports from EarthBank "FTLengthData" sheet

**Queries:**
- `lib/db/queries.ts:getFTTrackLengthDataByDatapoint()` - Retrieve individual track lengths

## Business Rules

1. **Track types:**
   - **TINT:** Track-in-track (most reliable for thermal modeling)
   - **TINCLE:** Track-in-cleavage (good quality)
   - **semi-track:** Track intersecting surface (use with caution)

2. **Length corrections:**
   - **3D correction:** Accounts for track dip angle (oblique tracks appear shorter)
   - **c-axis correction:** Accounts for anisotropic annealing (Donelick et al. 1999)

3. **Typical values:**
   - Unannealed apatite: ~16 μm
   - Partially annealed: 10-14 μm
   - Heavily annealed: <10 μm

4. **Minimum measurements:** 50-100 tracks recommended for robust statistics

## Key Concepts

### Track Length Types

**Apparent length:** Raw measurement (what you see in microscope)
**True length (3D corrected):** Corrected for dip angle
**c-axis corrected:** Corrected for crystallographic orientation

### Track Types Priority
1. **TINT (preferred):** Most reliable, clear endpoints
2. **TINCLE (good):** Clear endpoints along cleavage
3. **Semi-tracks (caution):** One endpoint at surface, may be biased short

### Annealing Indicators
- **Mean track length (MTL):** Average cooling rate proxy
- **Standard deviation:** Thermal history complexity
- **Skewness:** Complex vs simple cooling
- **Bi-modal distribution:** Multiple cooling events

## EarthBank Integration

Maps to **EarthBank FTLengthData sheet** (Kohn et al. 2024 Table 6):
- Individual track measurements
- 3D geometry (azimuth, dip, c-axis angle)
- Length corrections
- Track type classification
- Dpar measurements (grain-specific kinetics)

## Common Queries

```sql
-- Get track length distribution for thermal modeling
SELECT
  c_axis_corrected_length_um AS length_um,
  angle_to_c_axis_deg,
  dpar_um
FROM ft_track_length_data
WHERE ft_datapoint_id = (
  SELECT id FROM ft_datapoints WHERE sample_id = 'MAL-001'
)
  AND track_type IN ('TINT', 'TINCLE')  -- Exclude semi-tracks
ORDER BY length_um;

-- Calculate mean track length (MTL)
SELECT
  AVG(c_axis_corrected_length_um) AS mtl_um,
  STDDEV(c_axis_corrected_length_um) AS sd_um,
  COUNT(*) AS n_tracks
FROM ft_track_length_data
WHERE ft_datapoint_id = 123
  AND track_type IN ('TINT', 'TINCLE');

-- Identify short tracks (heavy annealing)
SELECT
  grain_id,
  track_id,
  c_axis_corrected_length_um,
  dpar_um
FROM ft_track_length_data
WHERE ft_datapoint_id = 123
  AND c_axis_corrected_length_um < 10.0
ORDER BY c_axis_corrected_length_um;

-- Track length vs c-axis angle (anisotropic annealing check)
SELECT
  angle_to_c_axis_deg,
  AVG(apparent_length_um) AS avg_apparent_length,
  AVG(c_axis_corrected_length_um) AS avg_corrected_length
FROM ft_track_length_data
WHERE ft_datapoint_id = 123
GROUP BY angle_to_c_axis_deg
ORDER BY angle_to_c_axis_deg;
```

## Thermal History Interpretation

| MTL (μm) | Interpretation | Thermal History |
|----------|---------------|-----------------|
| **14-16** | Unannealed | Rapid cooling, low max temp |
| **12-14** | Partially annealed | Moderate cooling, ~110-150°C max |
| **10-12** | Heavily annealed | Slow cooling, ~150-200°C max |
| **<10** | Very annealed | Very slow cooling or reheating |

**Standard deviation:**
- **<1.5 μm:** Simple, monotonic cooling
- **1.5-2.5 μm:** Complex cooling, multiple stages
- **>2.5 μm:** Very complex, possible reheating

## Thermal Modeling Applications

This data feeds into thermal modeling software:
- **HeFTy** (Ketcham 2005)
- **QTQt** (Gallagher 2012)
- **AFTInv** (Issler et al. 2005)

**Required inputs:**
- Individual track lengths (c-axis corrected)
- Dpar values (kinetic parameter)
- Age (from `ft_datapoints`)

**Output:**
- Time-temperature (t-T) path
- Confidence envelopes
- Goodness-of-fit statistics

## Notes

- **Critical for thermal modeling:** Most important FT data after age
- **Measure 50-100 tracks:** More tracks = better statistics
- **TINT preferred:** Highest quality, most reliable
- **c-axis correction:** Essential for accurate thermal modeling
- **Dpar per grain:** Enables multi-kinetic modeling (grain-specific annealing)
- **FAIR compliance:** Required by Kohn et al. (2024) Table 6
