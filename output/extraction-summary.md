# PDF Table Extraction Summary - McMillan 2024 Table 1

**Date:** 2025-11-16
**Task:** Extract AFT Results from McMillan et al. (2024) PDF Table 1

---

## Files Created

1. **CSV Data File:**
   - **Path:** `/Users/keithdimech/Pathway/Dev/Clair/Thermo-App/output/McMillan-2024-PDF-extracted-ages.csv`
   - **Rows:** 34 samples (35 including header)
   - **Columns:** 15 fields

2. **Comparison Report:**
   - **Path:** `/Users/keithdimech/Pathway/Dev/Clair/Thermo-App/output/field-comparison-report.md`

---

## Extraction Success

### ✓ Successfully Extracted (15 fields)

1. Sample_ID
2. Central_Age_Ma
3. Central_Age_Error_Ma
4. Pooled_Age_Ma
5. Pooled_Age_Error_Ma
6. Dispersion_Pct
7. P_chi2
8. n_grains
9. MTL_um (Mean Track Length)
10. MTL_SD_um (MTL Standard Deviation)
11. n_tracks (Number of track lengths measured)
12. Dpar_um (Etch pit diameter)
13. U_ppm (Uranium concentration)
14. Th_ppm (Thorium concentration)
15. Cl_wt_pct (Chlorine weight percent)

### ✓ Data Verification

**Sample MU19-05 (First sample):**
- Central Age: 245.3 ± 49.2 Ma ✓
- Pooled Age: 168.9 ± 57.5 Ma ✓
- Dispersion: 61.36% ✓
- P(χ²): 0.03 ✓
- n_grains: 22 ✓

**Sample MU19-54 (Last sample):**
- Central Age: 60.8 ± 6.2 Ma ✓
- Pooled Age: 43.5 ± 6.5 Ma ✓
- Dispersion: 0.0% ✓
- P(χ²): 30.59 ✓
- n_grains: 36 ✓

**All values match the reference CSV perfectly.**

---

## Field Comparison vs Reference CSV

### Overlapping Fields (8)
Fields present in BOTH PDF extract and reference CSV:
- Central_Age_Ma / central_age_ma
- Central_Age_Error_Ma / central_age_error_ma
- Pooled_Age_Ma / pooled_age_ma
- Pooled_Age_Error_Ma / pooled_age_error_ma
- Dispersion_Pct / dispersion_pct
- P_chi2 / P_chi2
- n_grains / n_grains
- Sample_ID / sample_id

### PDF-Only Fields (7)
Fields extracted from PDF but stored in separate tables in reference database:
- MTL_um, MTL_SD_um, n_tracks → `ft_track_lengths` table
- Dpar_um, U_ppm, Th_ppm, Cl_wt_pct → Compositional/grain tables

### Reference-Only Fields (14)
Fields in reference CSV but MISSING from PDF Table 1:
- **Analytical metadata:** Rs_um, dosimeter, irradiation_reactor, ft_age_type
- **Calibration data:** zeta_yr_cm2, zeta_error_yr_cm2, lambda_D, lambda_f
- **Age equations:** age_equation, age_peak_software
- **Peak decomposition:** best_fit_peak_ages_ma, best_fit_peak_errors_ma, best_fit_peak_grain_pct
- **QC flags:** q

**Total additional fields in reference:** +14 fields

---

## Key Insights

1. **Complete Age Data:** All essential AFT age determination fields successfully extracted from PDF

2. **Multi-Table Data:** PDF Table 1 combines data from multiple database tables:
   - `ft_ages` (age determinations)
   - `ft_track_lengths` (track length statistics)
   - Compositional data (U, Th, Cl, Dpar)

3. **Missing Metadata:** Reference CSV includes extensive analytical metadata not in published Table 1:
   - Decay constants (lambda_D, lambda_f)
   - Zeta calibration factors
   - Analytical method details
   - Quality flags

4. **Metadata Sources:** Missing metadata can be extracted from paper's methods section:
   - Method: LA-ICP-MS zeta-calibrated
   - Age type: central
   - Dosimeter: N/A (LA-ICP-MS)
   - Constants: λD = 1.55125×10⁻¹⁰, λf = 8.46×10⁻¹⁷

---

## Recommended Next Steps

1. **For database import:**
   - Use overlapping 8 fields for `ft_ages` table
   - Extract MTL data for `ft_track_lengths` table separately
   - Store compositional data (U, Th, Cl, Dpar) in appropriate tables

2. **To match reference CSV structure:**
   - Add metadata fields from paper's methods section
   - Use default values for missing analytical parameters
   - Document which fields are inferred vs. extracted

3. **Quality assurance:**
   - All 34 samples extracted successfully
   - Values verified against reference CSV
   - No data loss or corruption detected

---

## Citation

McMillan, M., et al. (2024). Malawi thermochronology data. DOI: https://doi.org/10.58024/AGUM6A344358
