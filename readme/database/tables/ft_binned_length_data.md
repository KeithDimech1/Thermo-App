# Table: `ft_binned_length_data`

**Last Updated:** 2025-11-18 06:46:00

## Purpose

Stores **binned track length histograms** for fission-track data. This is the **legacy format** where track lengths are reported as frequency counts in 1 μm bins (0-1, 1-2, 2-3, etc.) instead of individual measurements.

Many older publications report track lengths this way. This table enables import of legacy data while maintaining compatibility with modern track-by-track measurements.

## Schema (Key Fields)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | integer | PK, NOT NULL | Unique identifier |
| `ft_datapoint_id` | integer | FK → ft_datapoints.id, NOT NULL | Parent FT analytical session |
| `mount_id` | varchar(50) | FK → mounts.mount_id | Sample mount identifier |
| `etch_duration_seconds` | integer | | Etching time in seconds |
| `bin_0_1_um` | integer | | Track count in 0-1 μm bin |
| `bin_1_2_um` | integer | | Track count in 1-2 μm bin |
| `bin_2_3_um` | integer | | Track count in 2-3 μm bin |
| ... | ... | ... | (Bins continue to 19-20 μm) |
| `bin_19_20_um` | integer | | Track count in 19-20 μm bin |
| `dpar_um` | numeric(6,3) | | Mean Dpar value (μm) |
| `dpar_error_um` | numeric(6,3) | | Dpar uncertainty |
| `n_dpar_measurements` | integer | | Number of Dpar measurements |
| `dper_um` | numeric(6,3) | | Mean Dper value (μm) |
| `dper_error_um` | numeric(6,3) | | Dper uncertainty |
| `n_dper_measurements` | integer | | Number of Dper measurements |
| `dpar_dper_error_type` | varchar(20) | | Error type (SE, SD, 1σ, 2σ) |
| `comments` | text | | Additional notes |
| `created_at` | timestamp | DEFAULT now() | Record creation timestamp |

## Relationships

### Foreign Keys
- `ft_datapoint_id` → `ft_datapoints.id` (parent analytical session)
- `mount_id` → `mounts.mount_id` (sample mount)

### Referenced By
- None (leaf table)

## Used By (Code Files)

**Currently:** Not directly queried (legacy format support)

**Import scripts:**
- `scripts/db/import-earthbank-templates.ts` (imports EarthBank "FTBinnedLengthData" sheet)

## Business Rules

1. **Bins are 1 μm wide:** Each bin spans exactly 1 μm (e.g., bin_5_6_um = tracks from 5.0-5.999 μm)
2. **Integer counts:** Each bin stores count of tracks in that range
3. **Legacy format:** Modern data uses `ft_track_length_data` (individual measurements)
4. **Histogram reconstruction:** Can recreate publication-style histograms from bins
5. **Cannot extract individual tracks:** Binned data loses detail of individual measurements

## EarthBank Integration

Maps to **EarthBank FTBinnedLengthData sheet:**
- Direct 1:1 mapping of all bin columns
- Imports legacy data from older publications
- Preserves histogram format from papers

## Common Queries

```sql
-- Get binned track length histogram for a sample
SELECT
  bin_0_1_um, bin_1_2_um, bin_2_3_um, bin_3_4_um, bin_4_5_um,
  bin_5_6_um, bin_6_7_um, bin_7_8_um, bin_8_9_um, bin_9_10_um,
  bin_10_11_um, bin_11_12_um, bin_12_13_um, bin_13_14_um, bin_14_15_um,
  bin_15_16_um, bin_16_17_um, bin_17_18_um, bin_18_19_um, bin_19_20_um
FROM ft_binned_length_data
WHERE ft_datapoint_id = (
  SELECT id FROM ft_datapoints WHERE sample_id = 'MAL-001'
);

-- Calculate mean track length from binned data
SELECT
  (bin_0_1_um * 0.5 + bin_1_2_um * 1.5 + bin_2_3_um * 2.5 + ... + bin_19_20_um * 19.5) /
  (bin_0_1_um + bin_1_2_um + bin_2_3_um + ... + bin_19_20_um) AS mean_track_length_um
FROM ft_binned_length_data
WHERE ft_datapoint_id = 123;
```

## Legacy vs Modern Format

| Aspect | Binned (Legacy) | Individual (Modern) |
|--------|----------------|---------------------|
| **Storage** | 20 bin columns | 1 row per track |
| **Detail** | Lost | Full precision |
| **Analysis** | Limited | Flexible |
| **Thermal modeling** | Approximate | Precise |
| **Source** | Older papers | Modern labs |
| **Table** | `ft_binned_length_data` | `ft_track_length_data` |

## Notes

- **Use sparingly:** Prefer `ft_track_length_data` for new data
- **Import only:** Primarily for legacy data extraction from PDFs
- **Information loss:** Binning loses sub-micron detail and individual track properties
- **Histogram display:** Useful for recreating publication figures
