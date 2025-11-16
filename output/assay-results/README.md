# Assay Results Export

**Generated:** 2025-11-13T03:41:40.602Z
**Total Configurations:** 137

## Structure

Results are organized by:
1. **Pathogen** (e.g., CMV, HIV, HCV)
2. **Test Type** (serology, nat, both)
3. **Marker** (e.g., CMV IgG, HIV-1/2 Ab)

## Files

### All Results
- `all-assay-results.csv` - Complete dataset in one file

### By Pathogen

#### Cytomegalovirus (CMV)/
- serology/anti-CMV IgG (6 assays)
- serology/anti-CMV IgM (4 assays)

#### Epstein-Barr Virus (EBV)/
- serology/Anti-EBNA IgG (4 assays)
- serology/Anti-VCA IgG (5 assays)
- serology/Anti-VCA IgM (6 assays)

#### Hepatitis A Virus (HAV)/
- serology/Anti-HAV IgM (5 assays)

#### Hepatitis B Virus (HBV)/
- serology/HBeAg (5 assays)
- serology/HBsAg (9 assays)
- serology/anti-HBc IgG (4 assays)
- serology/anti-HBc IgM (8 assays)

#### Hepatitis C Virus (HCV)/
- serology/anti-HCV (12 assays)

#### Herpes Simplex Virus (HSV)/
- serology/anti-HSV (4 assays)

#### Human Immunodeficiency Virus (HIV)/
- serology/anti-HIV-1 (12 assays)

#### Human T-cell Lymphotropic Virus (HTLV)/
- serology/anti-HTLV-I (6 assays)

#### Measles virus/
- serology/anti-measles IgG (2 assays)
- serology/anti-measles IgM (1 assays)

#### Mumps virus/
- serology/anti-mumps IgG (2 assays)
- serology/anti-mumps IgM (2 assays)

#### Parvovirus B19/
- serology/anti-PVB19 IgG (2 assays)
- serology/anti-PVB19 IgM (2 assays)

#### Rubella virus/
- serology/anti-rubella IgG (6 assays)
- serology/anti-rubella IgM (5 assays)

#### SARS-CoV-2/
- serology/anti-COVID19 IgG (4 assays)

#### Toxoplasma gondii/
- serology/anti-Toxo IgG (4 assays)
- serology/anti-Toxo IgM (3 assays)

#### Treponema pallidum (Syphilis)/
- serology/anti-syphilis IgG (9 assays)

#### Varicella-Zoster Virus (VZV)/
- serology/anti-VZV IgG (2 assays)
- serology/anti-VZV IgM (3 assays)

## CSV Columns

1. **Pathogen** - Disease/organism name
2. **Pathogen Abbreviation** - Short code (e.g., CMV, HIV)
3. **Test Type** - serology, nat, or both
4. **Marker Name** - Specific marker being tested
5. **Marker Type** - Antibody, Antigen, or Nucleic Acid
6. **Antibody Type** - IgG, IgM, Total, etc.
7. **Manufacturer** - Test kit manufacturer
8. **Assay Name** - Specific assay/platform
9. **Platform** - Instrument platform
10. **Methodology** - CLIA, ELISA, PCR, etc.
11. **QC Sample** - Quality control material used
12. **CV <10% (%)** - Percentage of results with CV below 10%
13. **CV 10-15% (%)** - Percentage with CV 10-15%
14. **CV 15-20% (%)** - Percentage with CV 15-20%
15. **CV >20% (%)** - Percentage with CV above 20%
16. **Mean CV (%)** - Average coefficient of variation
17. **Quality Rating** - excellent, good, acceptable, poor
18. **Events Examined** - Number of test events analyzed
19. **Config ID** - Database configuration ID