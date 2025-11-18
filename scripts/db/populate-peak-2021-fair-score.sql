-- Populate FAIR score breakdown for Peak (2021) Grand Canyon dataset
-- Based on extraction report: build-data/learning/thermo-papers/Peak(2021)-Grand-Canyon-Great-Unconformity-Geology/EXTRACTION_REPORT.md
-- Overall Score: 70/100 (Fair - Moderate gaps)

-- First, update the datasets table with the FAIR score summary
UPDATE datasets
SET
  fair_score = 70,
  fair_reasoning = 'Good data quality with complete analytical data and open access, but moderate gaps in provenance metadata (no IGSN, no batch QC data) and sample metadata (lat/lon in paper, not in data tables). ZHe data is excellent with full grain-level chemistry, geometry, and uncertainty propagation.'
WHERE id = 2;

-- Then, populate the fair_score_breakdown table
INSERT INTO fair_score_breakdown (
  dataset_id,

  -- Table-level scores (Kohn et al. 2024)
  table4_score,
  table4_reasoning,
  table5_score,
  table5_reasoning,
  table6_score,
  table6_reasoning,
  table10_score,
  table10_reasoning,

  -- FAIR category scores (25 points each)
  findable_score,
  findable_reasoning,
  accessible_score,
  accessible_reasoning,
  interoperable_score,
  interoperable_reasoning,
  reusable_score,
  reusable_reasoning,

  -- Overall score
  total_score,
  grade
) VALUES (
  2,  -- dataset_id for Peak (2021)

  -- Table 4: Geosample Metadata (max 15)
  8,
  'Basic sample metadata present: sample_id (CP06-XX, UGXX-X, EGC1), lat/lon (in paper Fig 1, not in data tables), elevation (~600-800m), mineral (zircon), lithology (Precambrian granitoid, Neoproterozoic tuff), stratigraphic_unit (Granite Gorge Metamorphic Suite, Walcott Member Tuff). MISSING: IGSN (not assigned), collector (in paper: Peak, B.A.), collection_date (approximate: 2006-era for CP06 samples, archival for UG/EGC samples). Gaps: 7/15 points lost for missing IGSN and metadata not in data tables.',

  -- Table 5: FT Counts (max 15) - N/A for ZHe dataset
  NULL,
  'N/A - This dataset contains zircon (U-Th)/He data, not fission-track data.',

  -- Table 6: Track Lengths (max 10) - N/A for ZHe dataset
  NULL,
  'N/A - This dataset contains zircon (U-Th)/He data, not fission-track data.',

  -- Table 10: Ages (max 10) - applies to ZHe ages
  9,
  'All core age fields present: grain-level ZHe dates (corrected and uncorrected), 2σ analytical uncertainties, Ft (alpha-ejection correction factors), grain geometry (mass, radius), complete chemistry (U, Th, Sm, eU, He concentrations), analyst (Peak, B.A. in paper), lab (University of Colorado Boulder in paper), method (single-grain ZHe with LA-ICP-MS zonation profiling). Minor gap: analysis_date approximate (~2020, pre-publication), analyst/lab in paper text not in data tables. Missing zeta/λf/λD (N/A for He dating - uses direct measurement, not neutron activation).',

  -- Findable (max 25)
  10,
  'Moderate findability with significant gaps. ✅ Sample IDs provided (CP06-65, UG90-2, etc.) - clear and unambiguous. ✅ DOI assigned to dataset (OSF: https://doi.org/10.17605/OSF.IO/D8B2Q). ✅ Paper DOI (10.1130/G49116.1). ⚠️ Locations available in paper Figure 1 but not in data tables - requires manual extraction. ❌ NO IGSN assigned - samples not globally findable/traceable (critical gap for FAIR compliance). ❌ Metadata scattered between paper and supplemental files. Lost 15/25 points for missing IGSN and metadata fragmentation.',

  -- Accessible (max 25)
  22,
  'Excellent accessibility with minor gaps. ✅ Data publicly available on OSF (Open Science Framework) - no registration/authentication required. ✅ Paper is Gold Open Access (CC-BY license) - freely accessible. ✅ Data in open formats (Excel/CSV) - machine-readable. ✅ All analytical data in supplemental tables (Table S1: ZHe dates, Table S2: LA-ICP-MS zonation profiles). ⚠️ Some metadata requires extraction from paper text (analyst, lab, lithology descriptions). ⚠️ No embargo period but data predates FAIR best practices. Lost 3/25 points for metadata fragmentation.',

  -- Interoperable (max 25)
  23,
  'Excellent interoperability with minor provenance gaps. ✅ EarthBank HeDatapoint template format compatible (mapped to he_datapoints + he_whole_grain_data tables). ✅ Standard field names and controlled vocabularies (zircon, ZHe method, Precambrian granitoid). ✅ Consistent units throughout (ppm for concentrations, Ma for ages, µm for dimensions, nmol/g for He). ✅ Machine-readable metadata (OSF API accessible). ⚠️ Provenance fields (analyst, lab, analysis_date) in paper text, not in structured data tables. ⚠️ Kinetic parameters (zonation profiles) in separate table, requires linking by grain_id. Lost 2/25 points for metadata not in standardized schema format.',

  -- Reusable (max 25)
  15,
  'Good reusability for analytical data, but significant provenance gaps limit full reuse potential. ✅ Complete analytical data: all 50 grains have corrected ages, 2σ uncertainties, raw ages, Ft corrections, full chemistry (U, Th, Sm, eU, He), grain geometry (mass, radius). ✅ All uncertainties propagated (2σ analytical) - enables error analysis. ✅ FT (alpha-ejection) corrections reported - enables age recalculation verification. ✅ LA-ICP-MS zonation profiles available (Table S2) - enables advanced modeling. ✅ Complete methods in SupplementaryText.pdf. ✅ Open license (CC-BY). ❌ NO IGSN - samples not traceable to archives. ❌ NO batch/reference material QC data - no interlaboratory validation possible. ⚠️ Provenance (analyst, lab, date) in paper text, not in data tables. ⚠️ No thermal history model outputs in structured format (HeFTy paths in figures only). Lost 10/25 points for missing IGSN, no QC standards, and incomplete provenance tracking.',

  -- Overall score
  70,
  'C'  -- Grade: C (70-79)
)
ON CONFLICT (dataset_id) DO UPDATE SET
  table4_score = EXCLUDED.table4_score,
  table4_reasoning = EXCLUDED.table4_reasoning,
  table5_score = EXCLUDED.table5_score,
  table5_reasoning = EXCLUDED.table5_reasoning,
  table6_score = EXCLUDED.table6_score,
  table6_reasoning = EXCLUDED.table6_reasoning,
  table10_score = EXCLUDED.table10_score,
  table10_reasoning = EXCLUDED.table10_reasoning,
  findable_score = EXCLUDED.findable_score,
  findable_reasoning = EXCLUDED.findable_reasoning,
  accessible_score = EXCLUDED.accessible_score,
  accessible_reasoning = EXCLUDED.accessible_reasoning,
  interoperable_score = EXCLUDED.interoperable_score,
  interoperable_reasoning = EXCLUDED.interoperable_reasoning,
  reusable_score = EXCLUDED.reusable_score,
  reusable_reasoning = EXCLUDED.reusable_reasoning,
  total_score = EXCLUDED.total_score,
  grade = EXCLUDED.grade,
  updated_at = CURRENT_TIMESTAMP;

-- Verify the insert
SELECT
  d.dataset_name,
  f.total_score,
  f.grade,
  f.findable_score,
  f.accessible_score,
  f.interoperable_score,
  f.reusable_score,
  f.table4_score,
  f.table10_score
FROM datasets d
LEFT JOIN fair_score_breakdown f ON d.id = f.dataset_id
WHERE d.id = 2;
