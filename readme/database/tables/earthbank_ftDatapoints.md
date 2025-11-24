# Table: `earthbank_ftDatapoints`

**Last Schema Update:** 2025-11-24 07:58:00
**Schema Version:** v2.1 (EarthBank camelCase Native)
**Row Count:** ~67 datapoints (as of 2025-11-18 migration)

## Purpose

Fission-track (FT) analytical session data with complete QC metadata and age calculations. Each datapoint represents one analytical session for a sample (same sample can have multiple datapoints from different labs, dates, or analysts). This is the core table for AFT thermochronology data following EarthBank FAIR standards.

**Key Features:**
- Complete analytical metadata (lab, analyst, date, method)
- Pooled and central age calculations with uncertainties
- Track density and uranium concentration measurements
- Mean track length (MTL) statistics
- Zeta calibration values for age calculation
- Links to grain-level track length measurements

## Schema (Bones)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | uuid | PK, NOT NULL, DEFAULT uuid_generate_v4() | Internal UUID primary key |
| `datapointName` | varchar(255) | NOT NULL, UNIQUE | Datapoint identifier (e.g., "07PAC01_AFT_GU") |
| `sampleID` | varchar(255) | NOT NULL, FK | References earthbank_samples |
| `laboratory` | varchar(255) | | Laboratory where analysis performed |
| `analyst` | varchar(255) | | Person who performed analysis |
| `analysisDate` | timestamp | | Date/time of analysis |
| `labNumber` | varchar(100) | | Laboratory sample identifier |
| `ftMethod` | varchar(100) | | FT method (e.g., "LA-ICP-MS", "EDM") |
| `mineralType` | varchar(100) | | Mineral analyzed (typically "apatite") |
| `nGrains` | integer | | Number of grains counted |
| `totalNs` | integer | | Total spontaneous tracks counted |
| `rhoS` | numeric(15,6) | | Spontaneous track density (tracks/cm²) |
| `uPpm` | numeric(10,2) | | Uranium concentration (ppm) |
| `uPpmStdDev` | numeric(10,2) | | Standard deviation of U concentration |
| `uConcentration` | numeric(10,2) | | Alternative U concentration field |
| `dPar` | numeric(10,3) | | Etch pit diameter (µm) - kinetic parameter |
| `dParUncertainty` | numeric(10,3) | | Uncertainty on Dpar |
| `pChi2` | numeric(10,2) | | Chi-square probability (0-100%) |
| `dispersion` | numeric(10,4) | | Age dispersion parameter |
| `pooledAgeMa` | numeric(10,2) | | Pooled age (Ma) - assumes single population |
| `pooledAgeUncertainty` | numeric(10,2) | | 1σ uncertainty on pooled age |
| `centralAgeMa` | numeric(10,2) | | Central age (Ma) - accounts for dispersion |
| `centralAgeUncertainty` | numeric(10,2) | | 1σ uncertainty on central age |
| `mtl` | numeric(10,3) | | Mean track length (µm) |
| `mtlUncertainty` | numeric(10,3) | | Uncertainty on MTL |
| `stdDevMu` | numeric(10,3) | | Standard deviation of track lengths |
| `nTracks` | integer | | Number of track lengths measured |
| `sigmaP` | numeric(10,4) | | Dispersion of pooled age |
| `sigmaPError` | numeric(10,4) | | Error on sigma_p |
| `zeta` | numeric(12,4) | | Zeta calibration factor |
| `zetaUncertainty` | numeric(12,4) | | Uncertainty on zeta |
| `createdAt` | timestamp | DEFAULT CURRENT_TIMESTAMP | Record creation timestamp |
| `updatedAt` | timestamp | DEFAULT CURRENT_TIMESTAMP | Last update timestamp |

**Indexes:**
- Primary key on `id` (UUID)
- Unique constraint on `datapointName`
- B-tree indexes on: `datapointName`, `sampleID`, `centralAgeMa`, `pooledAgeMa`

## Relationships

### Foreign Keys
- `sampleID` → `earthbank_samples.sampleID` (ON DELETE CASCADE)

### Referenced By
- `earthbank_ftTrackLengthData.datapointName` → References this table (ON DELETE CASCADE)

**Architecture:** Sample → Datapoint → Track Length Data (hierarchical relationship)

## Used By (Code Files)

**Write Operations (INSERT/UPDATE):**
- `scripts/import-mcmillan-2024.ts` - Imports FT datapoint records from McMillan 2024
- `scripts/import-mcmillan-2024-complete.ts` - Complete dataset import workflow

**Read Operations (SELECT):**
- `lib/db/earthbank-queries.ts` - Core query functions for FT datapoints
- `app/api/analysis/ages/route.ts` - Age analysis and statistics API
- `app/api/tables/[name]/route.ts` - Generic table access endpoint
- `app/api/datasets/[id]/table-counts/route.ts` - Record count queries
- `lib/extraction/field-mappings.ts` - Field mapping for data extraction

## Business Rules

**Age Calculation Priority:**
- **Central Age** - Use when P(χ²) < 5% (indicates age dispersion)
- **Pooled Age** - Use when P(χ²) ≥ 5% (single age population)
- Both ages stored for transparency and reanalysis

**Quality Control:**
- `pChi2` values < 5% indicate age dispersion (mixed populations)
- `dispersion` quantifies age scatter beyond analytical uncertainty
- `nGrains` ≥ 20 recommended for reliable statistics (Kohn et al. 2024)

**Track Length Statistics:**
- `mtl` (mean track length) indicates thermal history complexity
- `stdDevMu` shows track length distribution spread
- `nTracks` ≥ 100 recommended for thermal modeling

**Calibration:**
- `zeta` factor accounts for track revelation efficiency
- Analyst-specific calibration against age standards
- Required for external detector method (EDM)

**Cascading Behavior:**
- Deleting a datapoint cascades to all track length measurements
- Deleting parent sample cascades to this datapoint

## EarthBank Compliance

**FAIR Principles:**
- ✅ **Findable:** Unique `datapointName` identifier
- ✅ **Accessible:** Complete analytical provenance (lab, analyst, date)
- ✅ **Interoperable:** camelCase field names match EarthBank FT template
- ✅ **Reusable:** All QC parameters stored (P(χ²), dispersion, zeta)

**Kohn et al. (2024) Reporting Standards:**
- ✅ Pooled and central ages with uncertainties
- ✅ Track density (rhoS), uranium concentration
- ✅ Number of grains and tracks
- ✅ Chi-square probability and dispersion
- ✅ Mean track length with standard deviation
- ✅ Dpar (kinetic parameter) with uncertainty
- ✅ Zeta calibration values

## Critical SQL Syntax

```sql
-- ✅ CORRECT: Use double-quotes for camelCase columns
SELECT "datapointName", "sampleID", "centralAgeMa", "pooledAgeMa"
FROM "earthbank_ftDatapoints"
WHERE "pChi2" < 5.0;  -- Dispersed age populations

-- Get datapoints with track length data
SELECT d."datapointName", d."centralAgeMa", d."mtl", d."nTracks"
FROM "earthbank_ftDatapoints" d
WHERE d."nTracks" >= 100;  -- Sufficient for thermal modeling

-- ❌ WRONG: Unquoted camelCase fails
SELECT centralAgeMa FROM earthbank_ftDatapoints; -- FAILS!
```

## Recent Changes

**2025-11-18 (IDEA-014):** Table created during EarthBank schema migration
- Migrated from `ft_datapoints` (snake_case) → `earthbank_ftDatapoints` (camelCase)
- 67 datapoints migrated with 100% data integrity
- Added UUID primary keys
- String-based foreign keys for human readability

## Related Tables

→ [earthbank_samples](earthbank_samples.md) - Parent sample metadata
→ [earthbank_ftTrackLengthData](earthbank_ftTrackLengthData.md) - Individual track measurements
→ [batches](batches.md) - Analytical batch/session metadata (legacy schema)
→ [people](people.md) - Analyst ORCID information (legacy schema)

## Key Analytical Parameters

**For Age Interpretation:**
- `centralAgeMa` / `centralAgeUncertainty` - Primary age result
- `pooledAgeMa` / `pooledAgeUncertainty` - Alternative if P(χ²) ≥ 5%
- `pChi2` - Quality metric (dispersed vs. simple population)

**For Thermal Modeling:**
- `mtl` / `stdDevMu` - Track length distribution
- `dPar` - Kinetic parameter (annealing behavior)
- `nTracks` - Number of measurements (confidence)

**For QC Assessment:**
- `nGrains` - Statistical adequacy
- `dispersion` - Age scatter magnitude
- `uPpm` / `uPpmStdDev` - Uranium distribution

---

## 🔍 Code Quality Issues

**Last Check:** 2025-11-24 09:30:00
**Found by:** `/bigtidycheck`

### 🔴 Critical Issues

1. **Schema Mismatch: Application code queries old snake_case table instead of new EarthBank table** → **ERROR-015**
   - **Files:**
     - `lib/db/queries.ts:179` - `SELECT * FROM ft_datapoints` (WRONG - empty table)
     - `lib/types/thermo-data.ts:875` - Interface uses `ft_datapoints` property name
   - **Issue:** getSampleDetail() queries `ft_datapoints` (old schema, 0 records) instead of `"earthbank_ftDatapoints"` (new schema with all data)
   - **Impact:** BLOCKING - Sample detail pages return empty arrays for FT data, breaking UI
   - **Root Cause:** IDEA-014 migration completed database schema but didn't update all application code
   - **Suggested Fix:**
     ```typescript
     // OLD (queries empty table):
     query<FTDatapoint>('SELECT * FROM ft_datapoints WHERE sample_id = $1', [sampleId])

     // NEW (queries correct table with camelCase columns):
     query<FTDatapoint>('SELECT * FROM "earthbank_ftDatapoints" WHERE "sampleID" = $1', [sampleId])
     ```
   - **Status:** 🔴 Open → Logged
   - **Debug Log:** `build-data/errors/debug/ER-015-schema-mismatch-queries-use-old-tables.md`
   - **Track:** Use `/debug-mode` to fix, `/resolve ERROR-015` when done

### 🟡 Medium Issues

1. **Schema Reference: table-counts API uses mixed old/new table names**
   - **File:** `app/api/datasets/[id]/table-counts/route.ts:33-79`
   - **Issue:** Query uses `ft_datapoints` variable name but queries new table structure with comments "Not in EarthBank schema"
   - **Impact:** Confusing code, incorrect counts returned (shows 0 for all tables)
   - **Suggested Fix:** Update query to use `"earthbank_ftDatapoints"` with proper quoting
   - **Status:** 🟡 Open

---

**To resolve an issue:**
1. Fix the code
2. Run `/bigtidycheck` again to verify
3. Update status to ✅ Fixed
4. If logged as ERROR-XXX, run `/resolve ERROR-XXX`
