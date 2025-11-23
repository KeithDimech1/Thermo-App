# Table: `earthbank_ftTrackLengthData`

**Last Schema Update:** 2025-11-24 08:00:00
**Schema Version:** v2.1 (EarthBank camelCase Native)
**Row Count:** ~975 track measurements (as of 2025-11-18 migration)

## Purpose

Individual confined fission-track length measurements at the grain level. Each record represents a single measured track from a specific grain within an analytical session. Track lengths are critical for thermal history modeling as they record the accumulated annealing (shortening) from burial heating.

**Key Features:**
- Individual track measurements (µm precision)
- C-axis crystallographic orientation angles
- Per-track Dpar values (kinetic parameter)
- Links to parent datapoint for analytical context
- Enables thermal history modeling (HeFTy, QTQt)

## Schema (Bones)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | uuid | PK, NOT NULL, DEFAULT uuid_generate_v4() | Internal UUID primary key |
| `datapointName` | varchar(255) | NOT NULL, FK | References earthbank_ftDatapoints |
| `sampleID` | varchar(255) | | Sample identifier (denormalized for queries) |
| `grainName` | varchar(100) | | Grain identifier within datapoint |
| `trackID` | varchar(100) | | Individual track identifier |
| `trackType` | varchar(100) | | Track type (e.g., "confined", "projected") |
| `lengthUm` | numeric(10,3) | | Track length in micrometers |
| `cAxisAngleDeg` | numeric(10,2) | | Angle to c-axis (0-90°) |
| `dPar` | numeric(10,3) | | Etch pit diameter for this grain (µm) |
| `createdAt` | timestamp | DEFAULT CURRENT_TIMESTAMP | Record creation timestamp |

**Indexes:**
- Primary key on `id` (UUID)
- B-tree indexes on: `datapointName`, `lengthUm`

## Relationships

### Foreign Keys
- `datapointName` → `earthbank_ftDatapoints.datapointName` (ON DELETE CASCADE)

### Referenced By
None (this is a leaf table in the hierarchy)

**Architecture:** Sample → Datapoint → Track Length Data (leaf level)

## Used By (Code Files)

**Write Operations (INSERT):**
- `scripts/import-mcmillan-2024.ts` - Imports track length measurements
- `scripts/import-mcmillan-2024-complete.ts` - Complete dataset import

**Read Operations (SELECT):**
- `lib/db/earthbank-queries.ts` - Query functions for track length data
- `app/api/tables/[name]/route.ts` - Generic table access
- `app/api/datasets/[id]/table-counts/route.ts` - Record counts
- `lib/extraction/field-mappings.ts` - Field mapping utilities

## Business Rules

**Track Length Measurement:**
- Only confined tracks are measured (horizontal tracks in c-axis parallel mounts)
- Length range: typically 1-20 µm (mean ~12-14 µm for unannealed apatite)
- Minimum track length: ~1 µm (shorter tracks not resolvable)
- Precision: ±0.1 µm typical measurement error

**C-Axis Angle Correction:**
- `cAxisAngleDeg` used to correct measured lengths to true 3D length
- Tracks parallel to c-axis (0°) are unbiased
- Tracks perpendicular to c-axis (90°) appear shortened
- Correction formula: true_length = measured_length / cos(c_axis_angle)

**Thermal History Significance:**
- Longer mean track length → rapid cooling, simple history
- Shorter mean track length → slow cooling or reheating
- Bimodal distributions → multiple thermal events
- Standard deviation → complexity of thermal history

**Cascading Deletes:**
- Deleting parent datapoint removes all track measurements
- Ensures referential integrity

## EarthBank Compliance

**FAIR Principles:**
- ✅ **Findable:** Linked via `datapointName` to parent analytical session
- ✅ **Accessible:** Individual measurements available (not just statistics)
- ✅ **Interoperable:** camelCase field names match EarthBank template
- ✅ **Reusable:** Raw data enables remodeling with different assumptions

**Kohn et al. (2024) Reporting:**
- ✅ Individual track lengths (not just MTL)
- ✅ C-axis angles for correction
- ✅ Dpar values per grain (kinetic parameter)
- ✅ Track type classification

## Critical SQL Syntax

```sql
-- ✅ CORRECT: Get track length distribution for a datapoint
SELECT "lengthUm", "cAxisAngleDeg", "grainName"
FROM "earthbank_ftTrackLengthData"
WHERE "datapointName" = '07PAC01_AFT_GU'
ORDER BY "lengthUm";

-- Calculate mean track length (MTL)
SELECT
  "datapointName",
  AVG("lengthUm") as mtl,
  STDDEV("lengthUm") as std_dev,
  COUNT(*) as n_tracks
FROM "earthbank_ftTrackLengthData"
GROUP BY "datapointName";

-- Track length histogram (1 µm bins)
SELECT
  FLOOR("lengthUm") as bin_start,
  COUNT(*) as frequency
FROM "earthbank_ftTrackLengthData"
WHERE "datapointName" = '07PAC01_AFT_GU'
GROUP BY FLOOR("lengthUm")
ORDER BY bin_start;

-- ❌ WRONG: Unquoted camelCase fails
SELECT lengthUm FROM earthbank_ftTrackLengthData; -- FAILS!
```

## Recent Changes

**2025-11-18 (IDEA-014):** Table created during EarthBank schema migration
- Migrated from `ft_track_length_data` (snake_case) → `earthbank_ftTrackLengthData` (camelCase)
- 975 track measurements migrated with 100% data integrity
- Added UUID primary keys
- String-based foreign keys for human readability

## Related Tables

→ [earthbank_ftDatapoints](earthbank_ftDatapoints.md) - Parent analytical session
→ [earthbank_samples](earthbank_samples.md) - Sample metadata (via datapoint)

## Thermal Modeling Applications

**HeFTy / QTQt Input:**
- Track length distribution (histogram or raw measurements)
- C-axis angles for orientation correction
- Dpar values for annealing kinetics
- Associated FT age from parent datapoint

**Quality Indicators:**
- N ≥ 100 tracks recommended for robust thermal modeling
- MTL range: 10-14 µm typical for basement rocks
- Std Dev: 1-2 µm typical (larger = complex history)

**Interpretation:**
- MTL = 14-16 µm → Very rapid cooling (volcanic, plutonic)
- MTL = 12-13 µm → Moderate cooling rate
- MTL = 10-11 µm → Slow cooling or reheating
- MTL < 10 µm → Significant reheating or prolonged residence at elevated T
