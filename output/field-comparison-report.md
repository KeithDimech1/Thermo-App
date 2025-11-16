# Field Comparison Report: PDF Extract vs Reference CSV

## Summary
- **PDF Extract CSV:** `/Users/keithdimech/Pathway/Dev/Clair/Thermo-App/output/McMillan-2024-PDF-extracted-ages.csv`
- **Reference CSV:** `/Users/keithdimech/Pathway/Dev/Clair/Thermo-App/build-data/assets/source-data/thermo/data-extracts/transformed-fair/table-10-fission-track-ages.csv`
- **Rows Extracted:** 34 samples (35 rows including header)

---

## Field Mapping

### Fields Present in BOTH (Overlapping)

| PDF Extract Field          | Reference CSV Field     | Status |
|---------------------------|-------------------------|--------|
| Central_Age_Ma            | central_age_ma          | ✓ MATCH |
| Central_Age_Error_Ma      | central_age_error_ma    | ✓ MATCH |
| Pooled_Age_Ma             | pooled_age_ma           | ✓ MATCH |
| Pooled_Age_Error_Ma       | pooled_age_error_ma     | ✓ MATCH |
| Dispersion_Pct            | dispersion_pct          | ✓ MATCH |
| P_chi2                    | P_chi2                  | ✓ MATCH |
| n_grains                  | n_grains                | ✓ MATCH |
| Sample_ID                 | sample_id               | ✓ MATCH |

**Overlapping Fields:** 8

---

## Fields in PDF Extract NOT in Reference

| PDF Field       | Source in Table 1                     | Why Missing from Reference |
|----------------|---------------------------------------|----------------------------|
| MTL_um         | Mean track length [μm ± se]           | Track length data in separate table |
| MTL_SD_um      | MTL St.Dev. [μm]                      | Track length data in separate table |
| n_tracks       | Nlength (number of lengths measured)  | Track length data in separate table |
| Dpar_um        | Dpar [μm ± 1σ]                        | Compositional data in separate table |
| U_ppm          | 238U [ppm ± 1σ]                       | Compositional data in separate table |
| Th_ppm         | 232Th [ppm ± 1σ]                      | Compositional data in separate table |
| Cl_wt_pct      | Cl [wt %]                             | Compositional data in separate table |

**PDF-Only Fields:** 7

---

## Fields in Reference NOT in PDF Extract

These fields are present in the AusGeochem reference CSV but **MISSING** from the PDF Table 1:

| Reference Field           | Description                                    | Why Missing |
|--------------------------|------------------------------------------------|-------------|
| Rs_um                    | Track density spacing parameter                | Not in Table 1 |
| age_equation             | Method used for age calculation                | Metadata field |
| age_peak_software        | Software used for peak decomposition           | Metadata field |
| best_fit_peak_ages_ma    | Decomposed peak ages (if multiple populations) | Advanced analysis |
| best_fit_peak_errors_ma  | Errors on decomposed peaks                     | Advanced analysis |
| best_fit_peak_grain_pct  | Percentage of grains in each peak              | Advanced analysis |
| dosimeter                | Dosimeter type used (e.g., N/A for LA-ICP-MS)  | Analytical metadata |
| ft_age_type              | Type of FT age (central, pooled, etc.)         | Metadata field |
| irradiation_reactor      | Reactor used for irradiation                   | Analytical metadata |
| lambda_D                 | Decay constant for dosimeter                   | Physical constant |
| lambda_f                 | Fission decay constant                         | Physical constant |
| q                        | Quality flag or parameter                      | QC metadata |
| zeta_error_yr_cm2        | Error on zeta calibration factor               | Calibration metadata |
| zeta_yr_cm2              | Zeta calibration factor                        | Calibration metadata |

**Reference-Only Fields:** 14

---

## Summary Statistics

| Metric                              | Count |
|-------------------------------------|-------|
| Total fields in PDF extract         | 15    |
| Total fields in reference           | 22    |
| Fields present in BOTH              | 8     |
| Fields ONLY in PDF extract          | 7     |
| Fields ONLY in reference            | 14    |
| **Additional fields in reference**  | **+14** |

---

## Key Insights

1. **Core Age Data Present:** All essential age determination fields (central age, pooled age, dispersion, P(χ²), n_grains) are successfully extracted.

2. **Track Length Data Extracted:** The PDF extraction includes track length parameters (MTL, SD, n_tracks) that are stored in a **separate table** in the reference database (likely `ft_track_lengths` table).

3. **Compositional Data Extracted:** U, Th, Cl, and Dpar are extracted from PDF but stored in **separate grain-level tables** in the reference database (likely `ft_counts` or compositional tables).

4. **Missing Metadata:** The reference CSV includes extensive analytical metadata (dosimeter, irradiation reactor, decay constants, zeta calibration) that is NOT present in the published Table 1. This metadata is documented in the paper's methods section but not tabulated.

5. **Missing Advanced Analysis:** Peak decomposition fields (best_fit_peak_*) are for samples with multiple age populations - this analysis may not have been performed for all samples or is reported elsewhere.

---

## Recommendations

1. **For ft_ages table:** Use the 8 overlapping fields from PDF extract
2. **For ft_track_lengths table:** Extract MTL, MTL_SD, n_tracks separately
3. **For compositional data:** Extract U, Th, Cl, Dpar to grain-level or sample metadata tables
4. **For missing metadata:** Extract from paper's methods section (Section 4.1):
   - age_equation: "LA-ICP-MS zeta-calibrated"
   - ft_age_type: "central" (as stated in paper)
   - dosimeter: "N/A (LA-ICP-MS)"
   - irradiation_reactor: "N/A (LA-ICP-MS)"
   - lambda_D: 1.55125e-10 (from reference CSV)
   - lambda_f: 8.46e-17 (from reference CSV)

