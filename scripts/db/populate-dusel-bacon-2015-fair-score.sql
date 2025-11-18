-- Populate FAIR score breakdown for Dusel-Bacon (2015) Alaska dataset
-- Based on extraction report: build-data/learning/thermo-papers/Dusel-Bacon(2015)-AFT-regional-exhumation-subtropical-Eocene-Alaska-CJES/extraction-report.md
-- Overall Score: 37/100 (Grade C - Pre-FAIR era, significant gaps)

UPDATE fair_score_breakdown
SET
  table4_reasoning = 'Good sample metadata with some gaps. ✅ Complete sample locations (lat/lon/elevation all provided). ✅ Rock types documented (igneous crystallization ages provided). ✅ Lithology (granitoid basement rocks). ✅ Mineral type (apatite). ✅ Sample IDs (33 samples from Yukon-Tanana Upland, Alaska). ❌ NO IGSN assigned to samples (major gap - samples not globally findable). ❌ Collector information not in tables. ❌ Collection date not provided. Lost 3/15 points for missing IGSN, collector, and collection dates.',

  table5_reasoning = 'Decent count data but incomplete provenance. ✅ Grain counts provided (2-40 per sample). ✅ Track counts documented (4-201 per sample). ✅ U ppm reported. ✅ Counting method (LA-ICP-MS). ✅ Dpar kinetic parameter included. ⚠️ Analyst/laboratory info in paper text but not tabulated in data tables. ⚠️ Analysis date not in tables. ❌ Missing Ns, Ni, Nd, ρs, ρi, ρd grain-by-grain count data (only summary statistics). Lost 5/15 points for missing grain-level count data and provenance not in tables.',

  table6_reasoning = 'Track length data present but limited detail. ✅ Mean track length (MTL) reported for all samples (13.34-14.84 µm range). ✅ Standard deviation provided. ✅ Dpar included (kinetic parameter). ⚠️ Number of confined tracks reported. ❌ Individual track measurements not provided (only summary statistics). ❌ Track type (TINT/TINCLE) not specified. ❌ c-axis angle data not included. Lost 3/10 points for missing individual track data and track classification.',

  table10_reasoning = 'Good age data with minor gaps. ✅ Pooled ages reported for all 33 samples (9.5-73.0 Ma range). ✅ Uncertainties provided (±1σ). ✅ Chi-squared (χ²) statistic included. ✅ P(χ²) values reported. ✅ Zeta calibration factor documented. ✅ Age equation specified (external detector method). ⚠️ Decay constants (λf, λD) not explicitly reported in tables (likely in methods text). ⚠️ Analyst/lab in paper, not in age table. Lost 2/10 points for decay constants and provenance not in data tables.',

  findable_reasoning = 'Poor findability due to missing critical identifiers. ✅ Sample IDs provided (33 unique sample codes). ✅ Complete geographic coordinates (lat/lon/elevation for all samples). ✅ Paper has DOI (cjes-2015-0138). ⚠️ Published in Canadian Journal of Earth Sciences (paywalled - not open access). ❌ NO IGSN assigned - samples not globally findable or traceable to physical archives. ❌ No data repository DOI (data embedded in paper tables only). ❌ Metadata scattered across paper text and tables (not centralized). Lost 13/25 points primarily for missing IGSN and no open data repository.',

  accessible_reasoning = 'Very poor accessibility - pre-FAIR era publication. ❌ Paper is paywalled (Canadian Journal of Earth Sciences requires subscription). ❌ No open data repository (OSF, Zenodo, etc.). ❌ Data only in PDF tables (not machine-readable). ⚠️ Manual extraction required to get data into usable format. ⚠️ No supplemental files (all data in main paper tables). ✅ Once extracted, data can be converted to CSV/Excel. Lost 15/25 points for paywall and no open repository.',

  interoperable_reasoning = 'Poor interoperability due to non-standard format and fragmented metadata. ❌ Data in PDF tables only (not structured database format). ❌ Provenance fields (analyst, lab, analysis date) scattered in methods text, not in data tables. ❌ No standard vocabularies or controlled terms used. ⚠️ Units are consistent within paper (Ma, µm, ppm) but not explicitly labeled in all tables. ⚠️ Field names not aligned with Kohn et al. (2024) or EarthBank standards. ✅ Can be mapped to EarthBank templates with manual curation. Lost 18/25 points for non-standard format and metadata fragmentation.',

  reusable_reasoning = 'Limited reusability due to missing provenance and QC data. ✅ Complete analytical data (ages, uncertainties, track lengths, U ppm, Dpar). ✅ Statistical parameters (χ², P(χ²), dispersion). ✅ Zeta calibration documented. ✅ Sample context (igneous crystallization ages, rock types). ❌ NO IGSN - samples not traceable to physical archives. ❌ NO batch/reference material QC data (no Durango or Fish Canyon standards reported). ❌ Analyst/laboratory/analysis date not in data tables. ❌ No open license specified (pre-CC-BY era). ⚠️ Decay constants λf/λD likely in methods text but not in tables. Lost 17/25 points for missing IGSN, no QC tracking, incomplete provenance, and restrictive copyright.',

  updated_at = CURRENT_TIMESTAMP
WHERE dataset_id = 6;

-- Verify the update
SELECT
  d.dataset_name,
  f.total_score,
  f.grade,
  f.findable_score,
  f.accessible_score,
  f.interoperable_score,
  f.reusable_score
FROM datasets d
JOIN fair_score_breakdown f ON d.id = f.dataset_id
WHERE d.id = 6;
