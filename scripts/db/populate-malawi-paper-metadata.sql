-- Populate Malawi dataset with comprehensive paper metadata and FAIR scoring
-- Data extracted from paper-index.md and extraction-report.md
-- Run with: psql "$DATABASE_URL" -f scripts/db/populate-malawi-paper-metadata.sql

-- Update datasets table with complete metadata
UPDATE datasets
SET
  full_citation = 'McMillan, M., Boone, S.C., Chindandali, P., Kohn, B., Gleadow, A., 2024. 4D fault evolution revealed by footwall exhumation modelling: A natural experiment in the Malawi rift. Journal of Structural Geology 187, 105196.',
  publication_year = 2024,
  publication_journal = 'Journal of Structural Geology',
  publication_volume_pages = '187, 105196',
  study_location = 'Central Basin, Malawi Rift, East African Rift System (EARS), Malawi, Africa',
  pdf_filename = '4D fault evolution revealed by footwall exhumation modelling_ A natural experiment in the Malawi rift.pdf',
  pdf_url = '/api/datasets/1/files/pdf/main-paper',  -- Will be served via API route
  mineral_analyzed = 'apatite',
  sample_count = 35,
  age_range_min_ma = 100.5,
  age_range_max_ma = 325.0,
  paper_summary = 'This landmark 2024 study by McMillan, Boone, and colleagues provides the first successful validation of footwall exhumation modeling as a proxy for normal fault array evolution in extensional basins. Using the Miocene Central Basin of the Malawi Rift as a natural laboratory, the authors demonstrate that along-strike patterns in footwall denudational cooling—constrained by apatite fission-track (AFT) and (U-Th)/He (AHe) thermochronology—closely mirror 4D hangingwall subsidence trends previously documented from seismic reflection and well data.',
  fair_score = 92,
  fair_reasoning = 'Excellent FAIR compliance with complete metadata, public data access, EarthBank compatibility, and comprehensive provenance tracking. Minor gaps in kinetic parameters and thermal modeling data.',
  key_findings = ARRAY[
    'Diachronous footwall exhumation along Usisya fault mirrors 4D hangingwall subsidence from seismic data, validating thermochronology-based fault evolution reconstruction',
    'Early-stage exhumation focused at centers of 4 isolated fault segments, matching distribution of early syn-rift depocenters identified in seismic reflection data',
    'Later-onset exhumation in intervening areas marks subsequent fault segment propagation and linkage forming the through-going Usisya fault system',
    'Low cumulative exhumation in Usisya footwall coincides with areas of significant intra-basinal faulting, indicating strain partitioning within the fault array',
    'Thermal history modeling using joint AFT + AHe data successfully constrains spatiotemporal fault evolution where subsurface seismic/well data are absent'
  ],
  analysis_methods = ARRAY['AFT LA-ICP-MS', '(U-Th-Sm)/He'],
  collection_date = '2019-01-01'::DATE  -- Inferred from MU19 sample prefix
WHERE id = 1;

-- Insert FAIR score breakdown
INSERT INTO fair_score_breakdown (
  dataset_id,
  table4_score, table4_reasoning,
  table5_score, table5_reasoning,
  table6_score, table6_reasoning,
  table10_score, table10_reasoning,
  findable_score, findable_reasoning,
  accessible_score, accessible_reasoning,
  interoperable_score, interoperable_reasoning,
  reusable_score, reusable_reasoning,
  total_score,
  grade
) VALUES (
  1,

  -- Table 4: Geosample Metadata (15/15)
  15,
  'All required fields present: sample_id (MU19-XX), IGSN (from AusGeochem), lat/lon (Fig 3 + AusGeochem), elevation, mineral (apatite), lithology (granitoid/metamorphic), collector (Malcolm McMillan), collection_date (2019), stratigraphic_unit (Ubendian/Irumide Belt)',

  -- Table 5: FT Counts (13/15)
  13,
  'All core fields present: grain_id (Supplementary Info), Ns, ρs, Dpar, analyst (AutomatedFastTracks), lab (Melbourne), method (LA-ICP-MS), U ppm, counting area. Missing Ni/ρi/Nd/ρd (N/A for LA-ICP-MS method).',

  -- Table 6: Track Lengths (10/10)
  10,
  'All required fields present: track_id, length (MTL reported), c-axis angle (individual tracks in SI), analyst (AutomatedFastTracks), Dpar, etching conditions (5.5M HNO₃, 20°C, 20s)',

  -- Table 10: Ages (8/10)
  8,
  'All core fields present: central_age, dispersion, P(χ²), n_grains, pooled_age, analyst, laboratory. Minor: zeta/λf/λD in methods section but not in table.',

  -- FAIR Categories
  24,  -- Findable (24/25)
  'IGSN assigned (global identifiers), DOI minted (10.58024/AGUM6A344358), lat/lon coordinates provided, published on AusGeochem platform, complete sample metadata. Minor: No explicit link to regional geological map.',

  25,  -- Accessible (25/25)
  'Data publicly available (no embargo/registration), multiple access methods (AusGeochem web UI + API), open format (CSV/Excel), all tables in paper or SI, no authentication barriers.',

  23,  -- Interoperable (23/25)
  'EarthBank template compatible, Kohn et al. (2024) compliant field names, controlled vocabularies, consistent units, machine-readable metadata. Minor gaps: Some fields require text extraction from methods section, kinetic params not linked to grains.',

  20,  -- Reusable (20/25)
  'Complete provenance (ORCID for Boone), batch/QC metadata (Durango standard), statistical params complete, kinetic params for modeling, single grain data available, open license (CC BY). Gaps: zeta not in table, no analyst ORCID, no analysis dates, no thermal model paths in dataset.',

  92,  -- Total (sum of FAIR categories)
  'A'  -- Grade A (90-100 = Excellent)
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

-- Verify the update
SELECT
  id,
  dataset_name,
  publication_year,
  publication_journal,
  study_location,
  mineral_analyzed,
  sample_count,
  fair_score
FROM datasets
WHERE id = 1;

-- Verify FAIR breakdown
SELECT
  dataset_id,
  table4_score,
  table5_score,
  table6_score,
  table10_score,
  findable_score,
  accessible_score,
  interoperable_score,
  reusable_score,
  total_score,
  grade
FROM fair_score_breakdown
WHERE dataset_id = 1;
