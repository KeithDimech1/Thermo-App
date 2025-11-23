# Table: `earthbank_heWholeGrainData`

**Last Schema Update:** 2025-11-24 08:05:00
**Schema Version:** v2.1 (EarthBank camelCase Native)
**Row Count:** ~113 grains (as of 2025-11-18 migration)

## Purpose

Individual grain-level (U-Th)/He data including chemistry, ages, and alpha-ejection corrections. Each record represents one analyzed grain with complete radiogenic 4He, parent isotope concentrations, and geometric measurements. This is the most granular level of He data.

**Key Features:**
- Individual grain corrected and uncorrected ages
- Complete U, Th, Sm chemistry with uncertainties
- Alpha-ejection correction factors (Ft) per grain
- Grain geometry and mass measurements
- eU (effective uranium) calculations
- Enables quality control and outlier detection

## Schema (Bones)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | uuid | PK, NOT NULL, DEFAULT uuid_generate_v4() | Internal UUID primary key |
| `datapointName` | varchar(255) | NOT NULL, FK | References earthbank_heDatapoints |
| `sampleID` | varchar(255) | | Sample identifier (denormalized) |
| `grainName` | varchar(100) | NOT NULL | Grain identifier within datapoint |
| `correctedHeAge` | numeric(10,2) | | α-ejection corrected age (Ma) |
| `correctedHeAgeUncertainty` | numeric(10,2) | | 1σ uncertainty on corrected age |
| `uncorrectedHeAge` | numeric(10,2) | | Raw He age before correction (Ma) |
| `uncorrectedHeAgeUncertainty` | numeric(10,2) | | Uncertainty on raw age |
| `ft` | numeric(10,4) | | Alpha-ejection correction factor (Ft) |
| `ftU238`, `ftU235`, `ftTh232`, `ftSm147` | numeric(10,4) | | Isotope-specific Ft factors |
| `he4Concentration` | numeric(15,6) | | 4He concentration (atoms/g) |
| `he4ConcentrationUncertainty` | numeric(15,6) | | Uncertainty on 4He |
| `heNmolG` | numeric(15,6) | | 4He in nmol/g |
| `heNmolGUncertainty` | numeric(15,6) | | Uncertainty on He nmol/g |
| `uConcentration` | numeric(10,2) | | Uranium concentration (ppm) |
| `uConcentrationUncertainty` | numeric(10,2) | | Uncertainty on U |
| `uNg` | numeric(15,6) | | Uranium mass (ng) |
| `uNgUncertainty` | numeric(15,6) | | Uncertainty on U mass |
| `thConcentration` | numeric(10,2) | | Thorium concentration (ppm) |
| `thConcentrationUncertainty` | numeric(10,2) | | Uncertainty on Th |
| `thNg` | numeric(15,6) | | Thorium mass (ng) |
| `thNgUncertainty` | numeric(15,6) | | Uncertainty on Th mass |
| `smConcentration` | numeric(10,2) | | Samarium concentration (ppm) |
| `smConcentrationUncertainty` | numeric(10,2) | | Uncertainty on Sm |
| `smNg` | numeric(15,6) | | Samarium mass (ng) |
| `smNgUncertainty` | numeric(15,6) | | Uncertainty on Sm mass |
| `eU` | numeric(10,2) | | Effective uranium (ppm) |
| `eUUncertainty` | numeric(10,2) | | Uncertainty on eU |
| `rsUm` | numeric(12,3) | | Equivalent spherical radius (µm) |
| `massMg` | numeric(12,6) | | Grain mass (mg) |
| `geometry` | varchar(100) | | Grain shape (e.g., "hexagonal prism") |
| `lengthUm` | numeric(12,3) | | Grain length (µm) |
| `widthUm` | numeric(12,3) | | Grain width (µm) |
| `numPits` | integer | | Number of laser pits (if laser heating) |
| `createdAt` | timestamp | DEFAULT CURRENT_TIMESTAMP | Record creation timestamp |

**Indexes:**
- Primary key on `id` (UUID)
- Unique constraint on `(datapointName, grainName)`
- B-tree indexes on: `datapointName`, `correctedHeAge`, `eU`

## Relationships

### Foreign Keys
- `datapointName` → `earthbank_heDatapoints.datapointName` (ON DELETE CASCADE)

### Referenced By
None (this is a leaf table in the hierarchy)

**Architecture:** Sample → He Datapoint → Whole Grain Data (leaf level)

## Used By (Code Files)

**Write Operations (INSERT):**
- `scripts/import-mcmillan-2024.ts` - Imports grain-level He data
- `scripts/import-mcmillan-2024-complete.ts` - Complete dataset import

**Read Operations (SELECT):**
- `lib/db/earthbank-queries.ts` - Query functions for He grain data
- `app/api/tables/[name]/route.ts` - Generic table access
- `app/api/datasets/[id]/table-counts/route.ts` - Record counts
- `lib/extraction/field-mappings.ts` - Field mapping utilities

## Business Rules

**Age Calculation:**
- `correctedHeAge = uncorrectedHeAge / ft`
- Ft depends on grain size, geometry, and parent isotope distribution
- Typical Ft range: 0.65-0.90 (smaller grains have lower Ft)

**Effective Uranium (eU):**
- `eU = U + 0.235 * Th`
- Accounts for Th producing ~0.235× the 4He of U (decay chains)
- Used to assess radiation damage effects

**Quality Control:**
- Compare grain ages within a datapoint (should replicate within ~10-15%)
- Outliers may indicate:
  - U/Th zoning (parent isotope heterogeneity)
  - 4He implantation from neighboring grains
  - Grain inclusions or fractures

**Grain Selection:**
- Prefer single crystal, inclusion-free grains
- Typical size: 60-150 µm for apatite
- Avoid broken or composite grains

**Cascading Deletes:**
- Deleting parent datapoint removes all grain records
- Ensures referential integrity

## EarthBank Compliance

**FAIR Principles:**
- ✅ **Findable:** Unique `(datapointName, grainName)` identifier
- ✅ **Accessible:** Complete grain-level chemistry and ages
- ✅ **Interoperable:** camelCase field names match EarthBank template
- ✅ **Reusable:** Raw data enables reanalysis with different Ft models

**Kohn et al. (2024) Reporting:**
- ✅ Individual grain ages (not just mean)
- ✅ U, Th, Sm concentrations with uncertainties
- ✅ 4He concentration measurements
- ✅ Alpha-ejection correction factors
- ✅ Grain geometry and mass
- ✅ eU for radiation damage assessment

## Critical SQL Syntax

```sql
-- ✅ CORRECT: Get grain ages for a datapoint
SELECT "grainName", "correctedHeAge", "eU", "ft"
FROM "earthbank_heWholeGrainData"
WHERE "datapointName" = '07PAC01_AHe_GU'
ORDER BY "correctedHeAge";

-- Calculate mean and std dev for grains
SELECT
  "datapointName",
  AVG("correctedHeAge") as mean_age,
  STDDEV("correctedHeAge") as std_dev,
  COUNT(*) as n_grains
FROM "earthbank_heWholeGrainData"
GROUP BY "datapointName";

-- Check for age outliers (>2σ from mean)
WITH stats AS (
  SELECT
    "datapointName",
    AVG("correctedHeAge") as mean_age,
    STDDEV("correctedHeAge") as std_dev
  FROM "earthbank_heWholeGrainData"
  GROUP BY "datapointName"
)
SELECT g."datapointName", g."grainName", g."correctedHeAge"
FROM "earthbank_heWholeGrainData" g
JOIN stats s ON g."datapointName" = s."datapointName"
WHERE ABS(g."correctedHeAge" - s.mean_age) > 2 * s.std_dev;

-- Explore eU vs age relationship
SELECT "eU", "correctedHeAge"
FROM "earthbank_heWholeGrainData"
WHERE "eU" IS NOT NULL AND "correctedHeAge" IS NOT NULL
ORDER BY "eU";

-- ❌ WRONG: Unquoted camelCase fails
SELECT correctedHeAge FROM earthbank_heWholeGrainData; -- FAILS!
```

## Recent Changes

**2025-11-18 (IDEA-014):** Table created during EarthBank schema migration
- Migrated from `he_whole_grain_data` (snake_case) → `earthbank_heWholeGrainData` (camelCase)
- 113 grains migrated with 100% data integrity
- Added UUID primary keys
- String-based foreign keys for human readability

## Related Tables

→ [earthbank_heDatapoints](earthbank_heDatapoints.md) - Parent analytical session
→ [earthbank_samples](earthbank_samples.md) - Sample metadata (via datapoint)

## Analytical Parameters Explained

**Alpha-Ejection Correction (Ft):**
- Accounts for 4He loss from alpha recoil (~20 µm stopping distance)
- Depends on grain radius, geometry, and U/Th distribution
- Separate Ft for each parent isotope (238U, 235U, 232Th, 147Sm)
- Combined Ft weighted by 4He production from each isotope

**Effective Uranium (eU):**
- eU = U + 0.235 * Th + 0.0012 * Sm
- Simplified: eU ≈ U + 0.235 * Th (Sm contribution negligible)
- High eU (>100 ppm) → radiation damage → lower closure T
- Low eU (<20 ppm) → minimal damage → higher closure T

**Grain Geometry:**
- `rsUm` - Equivalent spherical radius (for Ft calculation)
- `geometry` - Actual shape (e.g., "hexagonal prism", "tetragonal prism")
- `lengthUm`, `widthUm` - Measured dimensions
- `massMg` - Grain mass (for He/U/Th absolute quantities)

## Quality Indicators

**Grain Replication:**
- Good: Ages within ±10% (1σ standard deviation)
- Acceptable: Ages within ±15%
- Poor: Ages >20% scatter (investigate outliers)

**Typical Age Ranges (Apatite):**
- Young samples: 1-10 Ma (requires very careful analysis)
- Moderate: 10-100 Ma (typical for many basins)
- Old: 100-1000 Ma (cratonic settings)

**eU Considerations:**
- Very high eU (>500 ppm) → possible radiation damage bias
- Very low eU (<5 ppm) → difficult analysis (low 4He signal)
- Optimal range: 10-200 ppm
