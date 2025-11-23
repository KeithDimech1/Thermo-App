# Table: `earthbank_heDatapoints`

**Last Schema Update:** 2025-11-24 08:02:00
**Schema Version:** v2.1 (EarthBank camelCase Native)
**Row Count:** ~8 datapoints (as of 2025-11-18 migration)

## Purpose

(U-Th)/He analytical session data with mean age results. Each datapoint represents one (U-Th)/He analytical session for a sample (same sample can have multiple sessions). This table stores aggregate statistics; individual grain data is in `earthbank_heWholeGrainData`.

**Key Features:**
- Complete analytical metadata (lab, analyst, date, method)
- Mean corrected and uncorrected ages
- Links to grain-level chemistry and ages
- Complementary to fission-track data (lower closure temperature)

## Schema (Bones)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | uuid | PK, NOT NULL, DEFAULT uuid_generate_v4() | Internal UUID primary key |
| `datapointName` | varchar(255) | NOT NULL, UNIQUE | Datapoint identifier (e.g., "07PAC01_AHe_GU") |
| `sampleID` | varchar(255) | NOT NULL, FK | References earthbank_samples |
| `ftMethod` | varchar(100) | | He extraction method (e.g., "laser", "furnace") |
| `laboratory` | varchar(255) | | Laboratory where analysis performed |
| `analyst` | varchar(255) | | Person who performed analysis |
| `analysisDate` | timestamp | | Date/time of analysis |
| `nGrains` | integer | | Number of grains analyzed |
| `meanCorrectedAgeMa` | numeric(10,2) | | Mean α-ejection corrected age (Ma) |
| `meanCorrectedAgeUncertainty` | numeric(10,2) | | 1σ uncertainty on mean corrected age |
| `meanUncorrectedAgeMa` | numeric(10,2) | | Mean raw He age before correction |
| `notes` | text | | Additional notes or comments |
| `createdAt` | timestamp | DEFAULT CURRENT_TIMESTAMP | Record creation timestamp |
| `updatedAt` | timestamp | DEFAULT CURRENT_TIMESTAMP | Last update timestamp |

**Indexes:**
- Primary key on `id` (UUID)
- Unique constraint on `datapointName`
- B-tree indexes on: `datapointName`, `sampleID`, `meanCorrectedAgeMa`

## Relationships

### Foreign Keys
- `sampleID` → `earthbank_samples.sampleID` (ON DELETE CASCADE)

### Referenced By
- `earthbank_heWholeGrainData.datapointName` → References this table (ON DELETE CASCADE)

**Architecture:** Sample → He Datapoint → Whole Grain Data (hierarchical)

## Used By (Code Files)

**Write Operations (INSERT/UPDATE):**
- `scripts/import-mcmillan-2024.ts` - Imports (U-Th)/He datapoint records
- `scripts/import-mcmillan-2024-complete.ts` - Complete dataset import

**Read Operations (SELECT):**
- `lib/db/earthbank-queries.ts` - Core query functions for He datapoints
- `app/api/tables/[name]/route.ts` - Generic table access endpoint
- `app/api/datasets/[id]/table-counts/route.ts` - Record count queries
- `lib/extraction/field-mappings.ts` - Field mapping utilities

## Business Rules

**Age Reporting:**
- **Corrected Age** (primary) - Accounts for α-ejection (alpha recoil)
- **Uncorrected Age** (raw) - Direct 4He/parent isotope ratio age
- Correction factor (Ft) typically 0.7-0.9 (depends on grain size/geometry)
- Formula: Corrected Age = Uncorrected Age / Ft

**Quality Control:**
- `nGrains` ≥ 3 recommended for mean age reliability
- Grain ages should replicate within ~10-15% (1σ)
- Outliers may indicate He implantation or U/Th zoning

**Analytical Metadata:**
- `ftMethod`: "laser" (individual grain heating) vs. "furnace" (bulk heating)
- `laboratory`: Important for inter-lab comparison
- `analyst`: ORCID tracking for provenance

**Cascading Behavior:**
- Deleting datapoint cascades to all grain data
- Deleting parent sample cascades to this datapoint

## EarthBank Compliance

**FAIR Principles:**
- ✅ **Findable:** Unique `datapointName` identifier
- ✅ **Accessible:** Complete analytical provenance (lab, analyst, date)
- ✅ **Interoperable:** camelCase field names match EarthBank He template
- ✅ **Reusable:** Both corrected and raw ages stored for transparency

**Kohn et al. (2024) Reporting Standards:**
- ✅ Mean corrected age with uncertainty
- ✅ Number of grains analyzed
- ✅ Laboratory and analyst information
- ✅ Analysis date for temporal context

## Critical SQL Syntax

```sql
-- ✅ CORRECT: Get He datapoints with grain counts
SELECT "datapointName", "sampleID", "meanCorrectedAgeMa", "nGrains"
FROM "earthbank_heDatapoints"
WHERE "nGrains" >= 3  -- Minimum for reliable mean
ORDER BY "meanCorrectedAgeMa";

-- Compare corrected vs uncorrected ages
SELECT
  "datapointName",
  "meanCorrectedAgeMa",
  "meanUncorrectedAgeMa",
  ("meanCorrectedAgeMa" / "meanUncorrectedAgeMa") as ft_factor
FROM "earthbank_heDatapoints"
WHERE "meanUncorrectedAgeMa" > 0;

-- Get datapoints by lab
SELECT "laboratory", COUNT(*) as n_datapoints
FROM "earthbank_heDatapoints"
GROUP BY "laboratory";

-- ❌ WRONG: Unquoted camelCase fails
SELECT meanCorrectedAgeMa FROM earthbank_heDatapoints; -- FAILS!
```

## Recent Changes

**2025-11-18 (IDEA-014):** Table created during EarthBank schema migration
- Migrated from `he_datapoints` (snake_case) → `earthbank_heDatapoints` (camelCase)
- 8 datapoints migrated with 100% data integrity
- Added UUID primary keys
- String-based foreign keys for human readability

## Related Tables

→ [earthbank_samples](earthbank_samples.md) - Parent sample metadata
→ [earthbank_heWholeGrainData](earthbank_heWholeGrainData.md) - Individual grain chemistry/ages
→ [batches](batches.md) - Analytical batch metadata (legacy schema)
→ [people](people.md) - Analyst ORCID information (legacy schema)

## Closure Temperature Context

**(U-Th)/He System:**
- Closure temperature: ~65-75°C (apatite), ~180-200°C (zircon)
- Lower than AFT (~110°C for apatite)
- Sensitive to slower cooling and lower-temperature thermal events

**Comparison with AFT:**
- He age < AFT age → Expected for simple monotonic cooling
- He age ≈ AFT age → Very rapid cooling
- He age > AFT age → Possible 4He implantation or analytical issue

## Alpha-Ejection Correction (Ft)

**Why Correction Needed:**
- Alpha particles travel ~20 µm before stopping
- 4He produced near grain edges can escape → age too young
- Correction depends on grain size, geometry, U/Th distribution

**Typical Ft Values:**
- Small grains (50 µm): Ft ~0.65-0.75 (large correction)
- Medium grains (100 µm): Ft ~0.75-0.85
- Large grains (200 µm): Ft ~0.85-0.90 (small correction)

**Note:** Grain-specific Ft values stored in `earthbank_heWholeGrainData`
