# McMillan et al. 2024 - PDF Table Analysis
**Analysis Date:** 2025-11-16
**PDF Source:** McMillan-2024-Malawi-extract.txt

## Executive Summary

The PDF contains **INCOMPLETE** data tables compared to FAIR standards. While aggregate-level statistics are present, grain-by-grain and individual track measurement data are **referenced but NOT included** in the extracted PDF text.

---

## Tables Found in PDF

### Table 1: Apatite Fission Track Results Summary
**Location:** Lines 1289-1293 (main text)
**Data Type:** Sample-level AFT age determinations

**Column Headers:**
- Sample ID
- No. of grains
- Ns (total spontaneous tracks counted)
- ρs (spontaneous track density)
- 238U (ppm ± 1σ)
- 232Th (ppm ± 1σ)
- eU (ppm ± 1σ)
- P(χ2) (%)
- Dispersion (%)
- Pooled age (Ma ± 1σ)
- Central age (Ma ± 1σ)
- Dpar (μm ± 1σ)
- Nlength (number of track lengths measured)
- Mean track length (μm ± se)
- MTL St.Dev. (μm)

**Sample Data (Examples):**
```
MU19-05: 22 grains, 149 Ns, Pooled: 262.8 ± 33.5 Ma, Central: 268.4 ± 36.9 Ma, MTL: 11.19 ± 0.2 μm
MU19-06: 32 grains, 583 Ns, Pooled: 90.0 ± 7.0 Ma, Central: 90.7 ± 7.4 Ma, MTL: 10.62 ± 0.2 μm
MU19-08: 35 grains, 1304 Ns, Pooled: 71.1 ± 3.5 Ma, Central: 71.8 ± 3.7 Ma, MTL: 11.30 ± 0.2 μm
```

**Total Rows:** 34 samples (MU19-05 through MU19-54)

**WHAT'S INCLUDED:**
- ✅ 34 sample-level AFT age records (pooled + central ages)
- ✅ 34 track length summary statistics (mean, SD, n)
- ✅ Aggregate track counts (total Ns per sample)
- ✅ Chemistry data (U, Th, eU per sample)

**WHAT'S MISSING:**
- ❌ Grain-by-grain AFT count data (Ns, Ni, Nd per grain)
- ❌ Individual track length measurements
- ❌ Grain-level U concentrations (LA-ICP-MS data)
- ❌ Grain-level Dpar measurements

**Note:** Text states "About 30 suitable grains were selected for counting" and mentions "single grain AFT data" in Supplementary Information (line 502), but grain-level data is **NOT in the extracted PDF**.

---

### Table 2 (1/2): Apatite (U-Th-Sm)/He Results Summary
**Location:** Lines 1294-2099 (main text + continuation)
**Data Type:** Single-grain (U-Th)/He ages

**Column Headers:**
- Sample ID (repeated per grain)
- Lab No.
- Standard Run ID
- 4He (ncc)
- Mass (mg)
- Mean FT (alpha ejection correction factor)
- U (ppm)
- Th (ppm)
- Sm (ppm)
- [eU] (ppm) = U + 0.235*Th

**Sample Data (Examples):**
```
MU19-06: 6 grains analyzed
  Grain 1: Lab 23294, He: 7.778 ncc, FT: 0.85, U: 18.7 ppm, Th: 8.3 ppm, eU: 23.2 ppm
  Grain 2: Lab 23295, He: 1.056 ncc, FT: 0.83, U: 6.6 ppm, Th: 2.1 ppm, eU: 7.1 ppm
  ...
  
MU19-09: 6 grains analyzed
MU19-12: 6 grains analyzed
```

**Total Rows:** 76 individual grain records across 13 samples

**Samples with AHe data:**
- MU19-06 (6 grains)
- MU19-08 (5 grains)
- MU19-09 (6 grains)
- MU19-12 (6 grains)
- MU19-13 (6 grains)
- MU19-14 (6 grains)
- MU19-15 (6 grains)
- MU19-16 (6 grains)
- MU19-17 (6 grains)
- MU19-18 (6 grains)
- MU19-20 (6 grains)
- MU19-24 (5 grains)
- MU19-25 (6 grains)

**WHAT'S INCLUDED:**
- ✅ 76 single-grain (U-Th)/He records (chemistry + He content)
- ✅ Raw helium measurements (ncc)
- ✅ Grain mass (mg)
- ✅ FT correction factors
- ✅ U, Th, Sm concentrations per grain

**WHAT'S MISSING (from this table section):**
- ❌ Age calculations (raw age, corrected age) - likely in Table 2 (2/2)
- ❌ Th/U ratios
- ❌ Grain dimensions (a, b, c axes)

**Note:** Table 2 appears to be split across multiple sections in the PDF. Only chemistry data is visible in the extracted portion.

---

### Table 2 (2/2): [NOT FOUND in extracted text]
**Expected Content:** Age calculations (raw age, corrected age, error)
**Status:** Referenced but not present in extraction

Evidence of existence:
- Line 2712: "Model reproducibility of individual single grain data is presented in Table 2"
- Only chemistry portion (1/2) was extracted

---

### Table A2: Detailed EMPA Data
**Location:** Lines 3312-8167 (multiple continuations, 15 pages)
**Data Type:** Electron microprobe analysis of apatite composition

**Column Headers:**
- Sample ID / Grain ID
- Ca, Si, P, F, Cl, OH (atoms per formula unit)
- Mn, Mg, Fe, Sr, Na, Ce, La, K, Y, S (apfu)
- Corrected Total (wt%)

**Samples Analyzed:**
- Durango (standard, 25 analyses)
- FCT (standard, 9 analyses)
- Madagascar (standard, 14 analyses)
- MU19-09 (sample data begins at line 3423)
- [Additional samples continue across 15 table continuations]

**WHAT'S INCLUDED:**
- ✅ Major and trace element compositions
- ✅ Apatite end-member chemistry
- ✅ Standard material analyses for quality control

**Purpose:** This data is used to calculate rmr0 (annealing kinetics parameter) for thermal history modeling. **NOT part of the core FAIR thermochronology tables.**

---

### Table A3: Durango Apatite (U-Th)/He Standard Run Results
**Location:** Lines 8168-8268
**Data Type:** Quality control standard measurements

**Column Headers:**
- Analysis No.
- Standard Run ID
- 4He gas (ncc)
- Mean FT
- Th/U
- Uncorrected Age (Ma)
- Corrected Age (Ma)
- Error ±1σ (Ma)

**Sample Data:**
```
Durango 22693: 4.478 ncc He, FT: 1.00, Uncorrected: 31.2 Ma, Corrected: ~31 Ma
Durango 22694: 3.378 ncc He, FT: 1.00, Uncorrected: 30.9 Ma, Corrected: ~31 Ma
...
```

**Total Rows:** 9 Durango standard analyses

**Purpose:** Quality control data for (U-Th)/He measurements. **NOT part of the core FAIR thermochronology tables.**

---

## Comparison to FAIR Standard (AusGeochem Database)

### Expected Data Structure (from database schema)

**FAIR Table 4 Equivalent: `ft_ages`**
- 1 record per sample (pooled/central age)
- Expected: 34 records
- **Found in PDF Table 1:** ✅ YES (34 records)

**FAIR Table 5 Equivalent: `ft_counts`**
- 1 record per grain (Ns, Ni, Nd, ρs, ρi, ρd, U)
- Expected: ~30 grains × 34 samples = ~1020 records
- **Found in PDF:** ❌ NO - Only aggregate Ns per sample (34 totals)
- **Referenced:** "single grain AFT data" in Supplementary Information (not in PDF)

**FAIR Table 6 Equivalent: `ft_track_lengths`**
- 1 record per measured track
- Expected: ~100 tracks × 34 samples = ~3400 records
- **Found in PDF:** ❌ NO - Only summary statistics (mean, SD, n)
- **Data Present:** 34 mean track length values (Table 1)

**FAIR Table 10 Equivalent: `ahe_grain_data`**
- 1 record per grain (U, Th, Sm, He, raw age, corrected age)
- Expected: 76 records (based on reference data: 63 from Ketcham)
- **Found in PDF Table 2 (1/2):** ⚠️ PARTIAL (76 chemistry records, ages missing)
- **Expected in Table 2 (2/2):** Age calculations (NOT extracted)

---

## Data Gaps Summary

### ✅ DATA AVAILABLE IN PDF

| Data Type | Table | Records | FAIR Equivalent |
|-----------|-------|---------|-----------------|
| AFT sample ages | Table 1 | 34 | `ft_ages` |
| AFT track length summaries | Table 1 | 34 | Summary of `ft_track_lengths` |
| AHe grain chemistry | Table 2 (1/2) | 76 | Part of `ahe_grain_data` |
| EMPA compositions | Table A2 | ~500+ | Supplementary data |
| QC standards | Table A3 | 9 | QC data |

### ❌ DATA MISSING FROM PDF (Referenced in Supplementary Info)

| Data Type | Expected Records | FAIR Equivalent | Status |
|-----------|------------------|-----------------|--------|
| Grain-by-grain AFT counts | ~1020 | `ft_counts` | "single grain AFT data" in Supp. Info |
| Individual track lengths | ~3400 | `ft_track_lengths` | Only summaries in Table 1 |
| AHe grain ages | 76 | Part of `ahe_grain_data` | Table 2 (2/2) not extracted |
| Grain dimensions | 76 | Part of `ahe_grain_data` | Not in extracted tables |

---

## Key Findings

### 1. Publication Format vs. FAIR Format

**What the paper provides:**
- **Summary tables** suitable for publication (sample-level aggregates)
- References to detailed data in "Supplementary Information"
- Quality control and methodology documentation

**What FAIR/AusGeochem requires:**
- **Raw grain-by-grain measurements** for full reproducibility
- Individual track length measurements (not just means)
- Complete single-grain (U-Th)/He ages with dimensions

### 2. Supplementary Information Critical

The PDF text repeatedly references "Supplementary Information" for:
- Single grain AFT data (line 502, 2733)
- Detailed single grain age files (line 491)
- Track length data (line 534)

**Location:** https://doi.org/10.1016/j.jsg.2024.105196 (line 3277)

### 3. Data Completeness Assessment

**For populating AusGeochem database, this PDF provides:**
- ✅ 100% of `ft_ages` table (34/34 records)
- ✅ 100% of track length **summaries** (34/34 MTL values)
- ⚠️ ~121% of `ahe_grain_data` chemistry (76/63 expected)
- ❌ 0% of `ft_counts` table (0/~1020 grain records)
- ❌ 0% of individual `ft_track_lengths` (0/~3400 track measurements)

**To achieve FAIR compliance, we need:**
1. Access to Supplementary Information files
2. Complete Table 2 (2/2) with AHe ages
3. Grain-by-grain AFT count data
4. Individual track length measurements

---

## Recommendations

### Immediate Actions
1. **Access Supplementary Data:** Download from journal DOI (line 3277)
   - Look for Excel/CSV files with grain-level data
   - Search for "single grain AFT data" files

2. **Verify Table 2 Completion:** Check if PDF extraction cut off Table 2 (2/2)
   - Expected columns: Th/U, Raw age (Ma), Corrected age (Ma), Error

3. **Contact Authors:** If supplementary data unavailable
   - Request grain-by-grain AFT counts (Ns, Ni per grain)
   - Request individual track length measurements
   - Request grain dimensions for AHe data

### Data Extraction Priority

**Priority 1 (Critical for Database):**
- ✅ Table 1 AFT ages → Extract to `ft_ages` table
- ⚠️ Table 2 AHe data → Need complete ages for `ahe_grain_data`

**Priority 2 (Supplementary Required):**
- ❌ Grain-level AFT counts → `ft_counts` table
- ❌ Individual track lengths → `ft_track_lengths` table

**Priority 3 (Optional):**
- Table A2 EMPA data → Could be linked for advanced modeling
- Table A3 QC data → Useful for data quality assessment

---

## References

**Supplementary Data Location:**
- DOI: https://doi.org/10.1016/j.jsg.2024.105196
- Publisher: Elsevier (Journal of Structural Geology)
- Repository: https://doi.org/10.58024/AGUM6A344358 (line 2735)

**Key Quotes:**
- "AFT results are summarized in Table 1, with detailed single grain age files in Supplementary Information." (lines 2733-2735)
- "Single grain ages reported in figures and discussed in the text are provided with supporting data in the Supplementary Information." (lines 436-437)

---

**Analysis Complete:** The PDF tables provide **aggregate-level** data suitable for publication but **lack the grain-by-grain detail** required for full FAIR compliance. Supplementary Information files are essential to populate the complete database schema.

---

## APPENDIX: Data Inventory Detail

### Table 1 AFT Data - Complete Field Mapping

| PDF Column | Database Field | Data Present | Notes |
|------------|---------------|--------------|-------|
| Sample ID | `sample_id` | ✅ 34 values | MU19-05 through MU19-54 |
| No. of grains | Not in `ft_ages` | ✅ 34 values | Could add to schema |
| Ns | Not in `ft_ages` | ✅ 34 totals | Aggregate only, not per-grain |
| ρs | `rho_s` | ✅ 34 values | Spontaneous track density |
| 238U | `u_ppm` | ✅ 34 values | With ±1σ errors |
| 232Th | `th_ppm` | ✅ 34 values | With ±1σ errors |
| eU | Not in schema | ✅ 34 values | Calculated: U + 0.235*Th |
| P(χ2) | `p_chi2` | ✅ 34 values | Chi-squared probability |
| Dispersion | `dispersion` | ✅ 34 values | Age dispersion (%) |
| Pooled age | `pooled_age` | ✅ 34 values | With ±1σ errors |
| Central age | `central_age` | ✅ 34 values | With ±1σ errors |
| Dpar | `dpar` | ✅ 34 values | Mean per sample, not per-grain |
| Nlength | Not in `ft_ages` | ✅ 34 values | Number of tracks measured |
| Mean track length | Not in `ft_ages` | ✅ 34 values | Summary statistic |
| MTL St.Dev. | Not in `ft_ages` | ✅ 34 values | Summary statistic |

**Mapping Success:** ~85% of `ft_ages` schema fields can be populated from Table 1

**Missing from Table 1 (but in schema):**
- `rho_i` (induced track density) - Need supplementary data
- `rho_d` (dosimeter track density) - Need supplementary data
- `ni`, `nd` (induced/dosimeter counts) - Need supplementary data
- `zeta`, `zeta_error` - In methodology text (line 1273: 2.167 ± 0.007 × 10⁻³)
- `grain_age_*` fields - Individual grain ages not in summary table

---

### Table 2 (U-Th)/He Data - Complete Field Mapping

| PDF Column | Database Field | Data Present | Notes |
|------------|---------------|--------------|-------|
| Sample ID | `sample_id` | ✅ 76 grains | Repeated per grain |
| Lab No. | `grain_id` or `lab_id` | ✅ 76 values | Unique grain identifiers (e.g., 23294) |
| Standard Run ID | `run_id` | ✅ 76 values | Analytical batch (B, C, D, E) |
| 4He (ncc) | `he_ncc` | ✅ 76 values | Raw helium measurement |
| Mass (mg) | `mass_mg` | ✅ 76 values | Grain mass |
| Mean FT | `ft_correction` | ✅ 76 values | Alpha ejection correction |
| U (ppm) | `u_ppm` | ✅ 76 values | Uranium concentration |
| Th (ppm) | `th_ppm` | ✅ 76 values | Thorium concentration |
| Sm (ppm) | `sm_ppm` | ✅ 76 values | Samarium concentration |
| [eU] (ppm) | `eu_ppm` | ✅ 76 values | Effective uranium |
| **MISSING** | | | |
| Th/U | `th_u_ratio` | ❌ | Should be in Table 2 (2/2) |
| Raw age | `raw_age_ma` | ❌ | Should be in Table 2 (2/2) |
| Corrected age | `corrected_age_ma` | ❌ | Should be in Table 2 (2/2) |
| Error | `age_error_ma` | ❌ | Should be in Table 2 (2/2) |
| a, b, c (μm) | `radius_a/b/c` | ❌ | Grain dimensions (for FT calc) |

**Mapping Success:** ~60% of `ahe_grain_data` schema (chemistry complete, ages missing)

---

### Record Count Comparison

| Data Type | Expected (Reference) | Found in PDF | Completeness |
|-----------|---------------------|--------------|--------------|
| **Samples** | 34 | 34 | 100% ✅ |
| **AFT Age Records** | 34 | 34 | 100% ✅ |
| **AFT Count Records** | ~1020 grains | 0 (34 totals) | 0% ❌ |
| **Track Length Records** | ~3400 tracks | 0 (34 means) | 0% ❌ |
| **(U-Th)/He Grain Records** | 63 (Ketcham ref) | 76 chemistry | 121% ⚠️ |
| **(U-Th)/He Age Records** | 63 | 0 (missing 2/2) | 0% ❌ |

**Note:** 76 vs 63 AHe grains suggests either:
- More grains were analyzed than in the reference dataset
- Some grains may have been excluded from final interpretation
- Reference count (63) may be from a different version/subset

---

### Sample Coverage Analysis

**All 34 samples have:**
- ✅ AFT pooled age
- ✅ AFT central age
- ✅ Track length summary (mean, SD, n)
- ✅ Chemistry (U, Th, eU)
- ✅ Dispersion and P(χ2) statistics

**Only 13 samples have (U-Th)/He data:**
- MU19-06, 08, 09, 12, 13, 14, 15, 16, 17, 18, 20, 24, 25
- 21 samples have **AFT only** (no AHe data)

**Grains per sample (AHe):**
- Most samples: 6 grains
- MU19-08, MU19-24: 5 grains each
- Total: 76 grains across 13 samples
- Average: 5.8 grains/sample

---

### Data Quality Indicators

**Standard Materials Analyzed:**
- Durango apatite (25 EMPA + 9 AHe analyses)
- FCT apatite (9 EMPA analyses)
- Madagascar apatite (14 EMPA analyses)

**Expected Durango AHe Age:** ~31.0 Ma (line 8264-8267)
**Measured Range:** 30.9-31.8 Ma (good reproducibility)

**Track Counting Quality:**
- Method: LA-ICP-MS EDM (External Detector Method)
- Tracks counted: FastTracks automated + manual correction
- Zeta calibration: 2.167 ± 0.007 × 10⁻³ (line 1273)
- Track lengths: Track-In-Track (TINT) 3D corrected to 20°

---

### Next Steps for Complete Data Extraction

**Priority 1 - Download Supplementary Files:**
```
URL: https://doi.org/10.1016/j.jsg.2024.105196
Files to look for:
  - Excel/CSV with grain-by-grain AFT data (Ns, Ni, Nd per grain)
  - Individual track length measurements (c-axis projected)
  - Complete Table 2 (2/2) with AHe ages
  - Grain dimension measurements (a, b, c axes)
```

**Priority 2 - Extract from Current PDF:**
```bash
# Can extract NOW from Table 1:
- 34 AFT age records → ft_ages table (READY)
- 34 track length summaries → metadata (READY)

# Partially extractable from Table 2 (1/2):
- 76 AHe chemistry records → ahe_grain_data (PARTIAL)
```

**Priority 3 - Data Repository Check:**
```
Repository DOI: https://doi.org/10.58024/AGUM6A344358
May contain raw data files separate from publication
```

---

**FINAL ASSESSMENT:**

The PDF contains **publication-quality summary tables** but is **insufficient for full FAIR database population**. Critical grain-level data exists in Supplementary Information files that were not included in the PDF extraction.

**Usable NOW:** 34 AFT age records (ft_ages table)
**Need Supplementary Info:** All grain-level data (ft_counts, ft_track_lengths, complete ahe_grain_data)

