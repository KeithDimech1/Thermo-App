# Side-by-Side Field Comparison

## PDF Extract vs AusGeochem Reference CSV

### Fields Present in BOTH (8 fields)

| Field Name          | PDF Extract Header    | Reference CSV Header  | Match Status |
|---------------------|----------------------|----------------------|--------------|
| Sample ID           | Sample_ID            | sample_id            | ✓ MATCH      |
| Central Age         | Central_Age_Ma       | central_age_ma       | ✓ MATCH      |
| Central Age Error   | Central_Age_Error_Ma | central_age_error_ma | ✓ MATCH      |
| Pooled Age          | Pooled_Age_Ma        | pooled_age_ma        | ✓ MATCH      |
| Pooled Age Error    | Pooled_Age_Error_Ma  | pooled_age_error_ma  | ✓ MATCH      |
| Dispersion          | Dispersion_Pct       | dispersion_pct       | ✓ MATCH      |
| P(chi-squared)      | P_chi2               | P_chi2               | ✓ MATCH      |
| Number of Grains    | n_grains             | n_grains             | ✓ MATCH      |

---

### Fields ONLY in PDF Extract (7 fields)

These fields were extracted from PDF Table 1 but are stored in **separate database tables** in the reference:

| Field Name                  | PDF Extract Header | Storage Location in Database   |
|---------------------------|-------------------|--------------------------------|
| Mean Track Length          | MTL_um            | `ft_track_lengths` table       |
| MTL Standard Deviation     | MTL_SD_um         | `ft_track_lengths` table       |
| Number of Track Lengths    | n_tracks          | `ft_track_lengths` table       |
| Etch Pit Diameter          | Dpar_um           | Compositional/grain table      |
| Uranium Concentration      | U_ppm             | `ft_counts` or `samples` table |
| Thorium Concentration      | Th_ppm            | `ft_counts` or `samples` table |
| Chlorine Content           | Cl_wt_pct         | Compositional table            |

**Why these are separate:** The AusGeochem database normalizes data - track lengths are stored per grain, not as summary statistics in the `ft_ages` table.

---

### Fields ONLY in Reference CSV (14 fields)

These fields are in the reference CSV but **NOT present in published Table 1**:

| Field Name                    | Reference CSV Header     | Data Type        | Why Missing from PDF                          |
|------------------------------|-------------------------|------------------|-----------------------------------------------|
| Track Spacing Parameter       | Rs_um                   | Analytical       | Not published in Table 1                      |
| Age Equation                  | age_equation            | Metadata         | Documented in methods (LA-ICP-MS zeta-calib)  |
| Peak Decomposition Software   | age_peak_software       | Metadata         | Not all samples have peak decomposition       |
| Best-Fit Peak Ages            | best_fit_peak_ages_ma   | Advanced         | Only for multi-population samples             |
| Best-Fit Peak Errors          | best_fit_peak_errors_ma | Advanced         | Only for multi-population samples             |
| Best-Fit Peak Grain %         | best_fit_peak_grain_pct | Advanced         | Only for multi-population samples             |
| Dosimeter Type                | dosimeter               | Metadata         | Documented in methods (N/A for LA-ICP-MS)     |
| FT Age Type                   | ft_age_type             | Metadata         | All are "central" ages                        |
| Irradiation Reactor           | irradiation_reactor     | Metadata         | N/A for LA-ICP-MS method                      |
| Dosimeter Decay Constant      | lambda_D                | Physical Const   | 1.55125×10⁻¹⁰ (standard value)                |
| Fission Decay Constant        | lambda_f                | Physical Const   | 8.46×10⁻¹⁷ (standard value)                   |
| Quality Parameter             | q                       | QC               | Not published                                 |
| Zeta Error                    | zeta_error_yr_cm2       | Calibration      | Not published (analyst-specific)              |
| Zeta Calibration Factor       | zeta_yr_cm2             | Calibration      | Not published (analyst-specific)              |

**Why these are missing:** Most are internal analytical metadata or derived from methods sections rather than tabulated in published results.

---

## Summary Counts

| Category                               | Count |
|----------------------------------------|-------|
| **PDF Extract Fields**                 | 15    |
| **Reference CSV Fields**               | 22    |
| **Overlapping (in both)**              | 8     |
| **PDF-only (stored in other tables)**  | 7     |
| **Reference-only (missing from PDF)**  | 14    |

---

## Gap Analysis

### Critical Fields for ft_ages Table
All 8 critical fields are present in both sources:
- ✓ Sample ID
- ✓ Central Age (± error)
- ✓ Pooled Age (± error)
- ✓ Dispersion
- ✓ P(χ²)
- ✓ Number of grains

### Metadata Fields (Can be inferred from methods)
These can be added to database from paper's methodology:
- age_equation: "LA-ICP-MS zeta-calibrated"
- ft_age_type: "central"
- dosimeter: "N/A (LA-ICP-MS)"
- irradiation_reactor: "N/A (LA-ICP-MS)"
- lambda_D: 1.55125e-10
- lambda_f: 8.46e-17

### Track Length Fields (Require separate extraction)
PDF includes summary statistics that need separate table:
- MTL_um, MTL_SD_um, n_tracks → Extract to `ft_track_lengths`

### Compositional Fields (Require separate extraction)
PDF includes compositional data for separate table:
- U_ppm, Th_ppm, Cl_wt_pct, Dpar_um → Extract to compositional tables

### Advanced Analysis Fields (Not available from PDF)
These are NOT in Table 1 and would require:
- Peak decomposition results: May be in supplementary files
- Zeta calibration: Analyst-specific, not published
- Rs_um: Not published in summary table
- Quality flags (q): Internal QC data

---

## Conclusion

**Extraction Success Rate:** 100% for core age data (8/8 fields)

**Additional Data Extracted:** 7 fields that belong in other database tables

**Missing Metadata:** 14 fields, of which:
- 6 can be inferred from methods section
- 3 are for advanced analysis (peak decomposition)
- 5 are internal analytical metadata (not critical for publication)

**Recommendation:** The PDF extraction successfully captured all essential AFT age determination data. The reference CSV contains 14 additional metadata fields that provide traceability and analytical context but are not strictly necessary for basic data presentation.
