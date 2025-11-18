# EarthBank Template Schema - Quick Reference

**Generated:** 2025-11-18
**Purpose:** Quick lookup for database schema comparison and import script development

See **EARTHBANK-TEMPLATE-SCHEMA.md** for complete detailed documentation.

---

## Template Files Summary

| Template | Version | Sheets | Main Data Columns |
|----------|---------|--------|------------------|
| Sample.template.v2025-04-16.xlsx | 2025-04-16 | 4 sheets | 30 columns |
| FTDatapoint.template.v2024-11-11.xlsx | 2024-11-11 | 12 sheets | 70 columns (main) |
| HeDatapoint.template.v2024-11-11.xlsx | 2024-11-11 | 8 sheets | 46 columns (main) |

---

## Critical Database Field Mappings

### Sample Template → samples table

| Excel Column | Database Field | Type | Notes |
|-------------|---------------|------|-------|
| Col 1: Sample ID | `sample_name` or `local_name` | text | **Required**, unique |
| Col 2: IGSN | `igsn` | text | **Required** for FAIR |
| Col 3: Material Type | `sample_material` | text | From lookup list |
| Col 4: Collection Method | `collection_method` | text | From lookup list |
| Col 5: Lithology/Mineral | `lithology` | text | From mindat.org (10K+ values) |
| Col 7: Latitude | `latitude` | float | **Required**, -90 to +90 |
| Col 8: Longitude | `longitude` | float | **Required**, -180 to +180 |
| Col 10: Elevation | `elevation_m` | float | Auto-calc from lat/long if NULL |
| Col 15: Location Type | `location_type` | text | Outcrop/Well/Mine/etc. |
| Col 18: Geological Unit | `geological_unit` | text | Formation name |
| Col 29: Reference DOI | `publication_doi` | text | Links to literature |

**Note:** Sample template has NO "Field Definitions" sheet. Must map by column position (1-30).

---

### FT Datapoint Template → ft_datapoints table

#### FT Datapoints Sheet (70 columns)

**Key Foreign Keys:**
- `sampleID` → `samples.sample_name` or `samples.igsn`
- `batchID` → `batches.batch_id`
- `referenceMaterial` → `reference_materials.material_name`

**Critical Fields:**

| Excel DB Name | Database Field | Type | Unit | Notes |
|--------------|---------------|------|------|-------|
| `analysisDate` | `analysis_date` | timestamp | | When analyzed |
| `mineral` | `mineral` | text | | Apatite/Zircon/etc. |
| `ftCharacterisationMethod` | `counting_method` | text | | EDM/LA-ICP-MS/Population |
| `noOfGrains` | `num_grains` | int | | Total grains analyzed |
| `rhod` | `rho_d` | float | tracks/cm² | Dosimeter track density |
| `nd` | `n_d` | int | | Dosimeter tracks |
| `rhoS` | `rho_s` | float | tracks/cm² | Spontaneous track density |
| `ns` | `n_s` | int | | Spontaneous tracks |
| `rhoi` | `rho_i` | float | tracks/cm² | Induced track density |
| `ni` | `n_i` | int | | Induced tracks |
| **`centralAgeMa`** | `central_age_ma` | float | Ma | **PRIMARY AGE** |
| `centralAgeUncertaintyMa` | `central_age_1se_ma` | float | Ma | Age uncertainty |
| `pooledAgeMa` | `pooled_age_ma` | float | Ma | Alternative age |
| `chi2pct` | `chi_square_p` | float | | P(χ²) test |
| `dispersion` | `dispersion` | float | | 0-1 age scatter |
| **`mtl`** | `mean_track_length_um` | float | μm | **Mean track length** |
| `stdDevMu` | `track_length_sd_um` | float | μm | Track length SD |
| `dPar` | `mean_dpar_um` | float | μm | Dpar (parallel to c-axis) |
| `dPer` | `mean_dper_um` | float | μm | Dper (perpendicular) |
| `zetaCalibration` | `zeta` | float | | Zeta calibration |

#### FTCountData Sheet (15 columns)

**Foreign Key:** `name` → `ft_datapoints.[key]`

| Excel DB Name | Database Field | Type | Unit |
|--------------|---------------|------|------|
| `grainName` | `grain_id` | text | |
| `area` | `area_cm2` | float | cm² |
| `rhoS` | `rho_s` | float | tracks/cm² |
| `ns` | `n_s` | int | |
| `rhoi` | `rho_i` | float | tracks/cm² |
| `ni` | `n_i` | int | |
| `dPar` | `dpar_um` | float | μm |
| `dPer` | `dper_um` | float | μm |

#### FTSingleGrain Sheet (15 columns)

**Foreign Key:** `name` → `ft_datapoints.[key]`

| Excel DB Name | Database Field | Type | Unit |
|--------------|---------------|------|------|
| `grainName` | `grain_id` | text | |
| `ageMa` | `age_ma` | float | Ma |
| `ageUncertaintyMa` | `age_1se_ma` | float | Ma |
| `uCont` | `u_ppm` | float | ppm |
| `rmr0` | `rmr0` | float | |
| `kParameter` | `kappa` | float | |

#### FTLengthData Sheet (23 columns)

**Foreign Key:** `name` → `ft_datapoints.[key]`

| Excel DB Name | Database Field | Type | Unit |
|--------------|---------------|------|------|
| `grainName` | `grain_id` | text | |
| `trackID` | `track_id` | text | |
| `trackType` | `track_type` | text | TINT/TINCLE/Semi |
| `trackLength` | `length_um` | float | μm |
| `cAxisAngle` | `c_axis_angle_deg` | float | degrees |
| `cAxisCorrectedLength` | `c_axis_corrected_length_um` | float | μm |

---

### He Datapoint Template → he_datapoints table

#### He Datapoints Sheet (46 columns)

**Key Foreign Keys:**
- `sampleID` → `samples.sample_name` or `samples.igsn`
- `batchID` → `batches.batch_id`
- `referenceMaterial` → `reference_materials.material_name`

**Critical Fields:**

| Excel DB Name | Database Field | Type | Unit | Notes |
|--------------|---------------|------|------|-------|
| `analysisDate` | `analysis_date` | timestamp | | When analyzed |
| `mineral` | `mineral` | text | | Apatite/Zircon/etc. |
| `numAliquots` | `num_aliquots` | int | | **Required** |
| `meanCorrectedHeAge` | `mean_age_ma` | float | Ma | Mean corrected age |
| `meanCorrectedHeAgeUncertainty` | `mean_age_1se_ma` | float | Ma | Uncertainty |
| **`weightedMeanCorrectedHeAge`** | `weighted_mean_age_ma` | float | Ma | **PRIMARY AGE** |
| `weightedMeanCorrectedHeAgeUncertainty` | `weighted_mean_age_1se_ma` | float | Ma | Uncertainty |
| `chi2pctCorrected` | `chi_square_p` | float | | P(χ²) test |
| `mswdCorrected` | `mswd` | float | | MSWD |
| `iqrCorrected` | `iqr_ma` | float | Ma | Interquartile range |

#### HeWholeGrain Sheet (75 columns)

**Foreign Key:** `datapointName` → `he_datapoints.[key]`

**Top Priority Fields:**

| Excel DB Name | Database Field | Type | Unit | Notes |
|--------------|---------------|------|------|-------|
| `aliquotID` | `aliquot_id` | text | | Aliquot identifier |
| `aliquotType` | `aliquot_type` | text | | Single/Multi/Unknown |
| `numAliquots` | `num_grains` | int | | Grains in aliquot |
| `aliquotLength` | `length_um` | float | μm | |
| `aliquotWidth` | `width_um` | float | μm | |
| **`ft`** | `ft_correction` | float | | **Alpha ejection correction** |
| `he4Concentration` | `he4_nmol_g` | float | nmol/g | Helium content |
| `uConcentration` | `u_ppm` | float | ppm | Uranium |
| `thConcentration` | `th_ppm` | float | ppm | Thorium |
| `eU` | `effective_u_ppm` | float | ppm | Effective U |
| `uncorrectedHeAge` | `uncorrected_age_ma` | float | Ma | Raw age |
| **`correctedHeAge`** | `corrected_age_ma` | float | Ma | **FT corrected age** |
| `tau` | `total_uncertainty_ma` | float | Ma | Total uncertainty |

---

## Import Workflow Cheat Sheet

### 1. Read Template Structure

```typescript
// For FT/He templates: Read Field Definitions sheet
const fieldDefs = readSheet(workbook, 'Field Definitions - FTDataPoint')
const dbFieldMap = fieldDefs.map(row => ({
  displayName: row[0],  // Column A
  dbName: row[2]        // Column C: "Database Technical Name"
}))

// For Sample template: Read column headers directly
const sampleHeaders = readSheet(workbook, 'Samples')[0] // Row 1
```

### 2. Import Order (Respects Foreign Keys)

```
1. people (analysts, collectors)
2. institutions (labs, archives)
3. publications (literature DOIs)
4. reference_materials (standards)
5. batches (if pre-created)
6. samples ← Sample template
7. ft_datapoints ← FT Datapoints sheet
8. ft_count_data ← FTCountData sheet
9. ft_single_grain_ages ← FTSingleGrain sheet
10. ft_track_length_data ← FTLengthData sheet
11. he_datapoints ← He Datapoints sheet
12. he_whole_grain_data ← HeWholeGrain sheet
```

### 3. Sample Linking Strategy

```sql
-- Try IGSN first (preferred for FAIR)
SELECT id FROM samples WHERE igsn = :templateSampleID;

-- Fall back to sample name
SELECT id FROM samples WHERE sample_name = :templateSampleID;
```

### 4. Batch Linking for QC

```sql
-- Link unknowns and standards analyzed together
SELECT * FROM ft_datapoints
WHERE batch_id = 'BATCH-2024-001'
-- Returns both geosamples AND reference materials
-- Enables QC assessment (standards performance)
```

### 5. Uncertainty Handling

**EarthBank stores TWO fields:**
- `[value]Uncertainty` - The numeric uncertainty
- `[value]UncertaintyType` - Statistical meaning (1σ, 2σ, 95% CI, etc.)

**Options for database:**
1. **Assume type in column name:** `central_age_1se_ma` (implies 1SE)
2. **Separate column:** `central_age_uncertainty_type`
3. **Default:** If no type provided, assume `1 sigma`

**Recommendation:** Store both for full fidelity with templates.

---

## Controlled Vocabularies

### Universal (All Templates)

**Uncertainty Type** (19 values):
- `1 sigma`, `2 sigma`, `95% confidence`
- `1 standard error`, `2 standard error`
- `1 sigma internal`, `2 sigma internal`, `95% confidence internal`
- `1 sigma external`, `2 sigma external`, `95% confidence external`
- `Other`, `Unknown`, `Undefined`
- `Duplicate sample`, `Duplicate analytical session`, `Duplicate aliquot`
- `Replicate`, `Standard deviation`

### Sample Template

**Sample Kind** (16): Ore, Xenolith, Regolith, Meteorite, Organic material, Loose sediment, Soil, Fluid, Fossil, Mineral, etc.

**Sampling Method** (11): Cuttings, Core, Dredge, Unknown, Auger, Other, Hand Sample, Grab, vial, thin section, etc.

**Lithology** (10,184): From mindat.org - includes rocks, minerals, ores

**Location Kind** (9): Unknown, Outcrop location, Section location, Other, Borehole/well, Mine (open-pit), Mine (underground), Boulder, Mine

**Person Role** (11): Unknown, Laboratory manager, Laboratory technician, Chief investigator, Principal investigator, Investigator, Collector, Analyst, First author, Co-author, etc.

### FT Template

**Mineral Type** (5): **Apatite**, **Zircon**, Titanite, Monazite, Glass

**FT Characterisation Method** (3):
- `External detector method (EDM)`
- `LA-ICP-MS`
- `Population method`

**Track Type** (5):
- `Confined track-in-track (TINT)`
- `Confined track-in-cleavage (TINCLE)`
- `Semi-track`
- `Surface track`
- `Other`

### He Template

**Aliquot Type** (3): `Single-grain`, `Multi-grain`, `Unknown`

**Crystal Fragmentation** (5): `Whole`, `Fragmented`, `Abraded`, `Mixed`, `Unknown`

**Aliquot Geometry** (8): `Hexagonal prism`, `Tetragonal prism`, `Ellipsoid`, `Sphere`, `Irregular`, `Mixed`, `Unknown`, `Other`

---

## Validation Rules

### Required Fields

**Sample:**
- `sampleID` (must be unique)
- `IGSN` (for FAIR compliance)
- `latitude` (-90 to +90)
- `longitude` (-180 to +180)

**FT Datapoint:**
- `sampleID` (or `referenceMaterial`, mutually exclusive)
- `mineral`
- `analysisDate`
- Track densities: `rhoS`, `ns`, `rhoi`, `ni`, `rhod`, `nd`

**He Datapoint:**
- `sampleID` (or `referenceMaterial`, mutually exclusive)
- `mineral`
- `analysisDate`
- `numAliquots`

**Grain Data:**
- `datapointName` (foreign key to parent datapoint)
- Grain/aliquot ID

### Data Type Validation

```typescript
// Numeric ranges
latitude: -90 to +90
longitude: -180 to +180
ages: 0.01 to 4000 Ma (typical geologic range)
track_lengths: 0 to 20 μm (typical for apatite)
ft_correction: 0 to 1 (alpha ejection correction)

// Date formats
analysisDate: ISO 8601 or Excel date number

// IGSN format
igsn: /^[A-Z]{2,5}\d{4,}[A-Z0-9]*$/ (basic pattern)
```

---

## Common Import Errors

### ❌ "Sheet not found"
**Fix:** Use exact names (case-sensitive):
- `FT Datapoints` not `ft_datapoints`
- `HeWholeGrain` not `He Whole Grain`

### ❌ "Foreign key violation: sampleID not found"
**Fix:**
1. Import samples before datapoints
2. Try IGSN lookup before sample_name
3. Check for typos/whitespace

### ❌ "Duplicate datapoint name"
**Context:** This is VALID for grain data sheets (multiple grains per datapoint).
**Fix:** Don't enforce uniqueness on `name` in FTCountData/FTSingleGrain/etc.

### ❌ "Age uncertainty without uncertainty type"
**Fix:**
- Default to `1 sigma` if missing
- Or require both fields (strict mode)

### ❌ "Reference material and sample both populated"
**Fix:** Mutual exclusion logic:
```typescript
if (row.referenceMaterial) {
  // This is a standard, ignore sampleID
  datapointType = 'standard'
} else if (row.sampleID) {
  // This is a geosample
  datapointType = 'unknown'
} else {
  throw new Error('Must provide either sampleID or referenceMaterial')
}
```

---

## Units Reference

**All units are SI-derived. No conversion needed.**

| Measurement | Unit | Notes |
|-------------|------|-------|
| Age | Ma (megayears) | Millions of years |
| Track Length | μm (micrometers) | 1 μm = 0.001 mm |
| Dpar/Dper | μm | Etch pit diameter |
| Counting Area | cm² | Square centimeters |
| Track Density | tracks/cm² | |
| U/Th/Sm Concentration | ppm (μg/g) | Parts per million |
| He Content (whole) | nmol/g | Nanomoles per gram |
| Temperature | °C | Celsius |
| Mass | ng | Nanograms |
| Volume (grain) | μm³ | Cubic micrometers |
| Volume (pit) | μm³ | Cubic micrometers |

---

## Age Types Explained

### Fission Track (4 age types)

1. **Mean Age** (`meanAgeMa`) - Simple arithmetic average of single grain ages
2. **Central Age** (`centralAgeMa`) - **MOST COMMON** - Accounts for overdispersion via error-weighted mean
3. **Pooled Age** (`pooledAgeMa`) - Treats all tracks from all grains as single population
4. **Population Age** (`popAgeMa`) - EDM-specific calculation

**Database decision:** Store all 4? Or only primary (Central) + flag?
**Recommendation:** Store all 4 for full fidelity.

### Helium (2 age types)

1. **Uncorrected Age** - Raw measurement before alpha ejection correction
2. **Corrected Age** - **PRIMARY AGE** - FT correction applied

**Both support:**
- Mean (arithmetic average)
- Weighted Mean (**PREFERRED** for publication)

---

## Quick Template Comparison

| Feature | Sample | FT Datapoint | He Datapoint |
|---------|--------|--------------|--------------|
| **Version** | v2025-04-16 | v2024-11-11 | v2024-11-11 |
| **Main Columns** | 30 | 70 | 46 |
| **Grain Data Sheets** | 0 | 4 (Count, Single, Length, Binned) | 2 (Whole, InSitu) |
| **Field Definitions** | ❌ No | ✅ Yes (5 sheets) | ✅ Yes (3 sheets) |
| **Props Sheet** | ✅ Yes | ✅ Yes | ✅ Yes |
| **Lookup Tables** | ✅ Yes | ✅ Yes | ✅ Yes |
| **Total Sheets** | 4 | 12 | 8 |

---

## Next Steps

1. **Read database schema:** `scripts/db/migrations/*.sql`
2. **Map fields:** Use this doc + EARTHBANK-TEMPLATE-SCHEMA.md
3. **Identify gaps:** Fields in DB but not in templates (or vice versa)
4. **Update import script:** `scripts/db/import-earthbank-templates.ts`
5. **Add validation:** See "Validation Rules" above
6. **Test:** Use existing imported datasets

---

**For complete schema with all 70 FT fields, 75 He fields, and full descriptions:**
See **EARTHBANK-TEMPLATE-SCHEMA.md**

---

**End of Quick Reference**
