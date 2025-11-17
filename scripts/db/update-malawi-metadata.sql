-- Update Malawi dataset with paper metadata
-- Based on: build-data/learning/thermo-papers/Malawi-Rift-Footwall-Exhumation/paper-index.md

UPDATE datasets
SET
  dataset_name = 'McMillan et al. (2024) - Malawi Rift Footwall Exhumation',
  description = 'Apatite fission-track (AFT) and (U-Th)/He (AHe) thermochronology constraining 4D fault evolution in the Malawi Rift Central Basin. This landmark study validates footwall exhumation modeling as a proxy for normal fault array evolution using the Usisya Border Fault System as a natural laboratory.',

  -- Publication details
  publication_reference = 'McMillan, M., Boone, S.C., Chindandali, P., Kohn, B., Gleadow, A., 2024. 4D fault evolution revealed by footwall exhumation modelling: A natural experiment in the Malawi rift. Journal of Structural Geology 187, 105196.',
  doi = '10.1016/j.jsg.2024.105196',

  -- Geographic scope
  study_area = 'Central Basin, Malawi Rift, East African Rift System (EARS), Lake Malawi western margin (~11-13°S latitude)',

  -- Authors
  authors = ARRAY[
    'Malcolm McMillan',
    'Samuel C. Boone',
    'Patrick Chindandali',
    'Barry Kohn',
    'Andrew Gleadow'
  ],

  -- Analysis methods
  analysis_methods = ARRAY[
    'AFT (LA-ICP-MS method)',
    'AHe ((U-Th)/He dating)',
    'QTQt thermal history modeling'
  ],

  -- Paper summary
  paper_summary = 'This landmark 2024 study provides the first successful validation of footwall exhumation modeling as a proxy for normal fault array evolution in extensional basins. Using the Miocene Central Basin of the Malawi Rift as a natural laboratory, the authors demonstrate that along-strike patterns in footwall denudational cooling closely mirror 4D hangingwall subsidence trends previously documented from seismic reflection and well data. The study analyzes 35 samples across the 120 km-long Usisya fault system using joint AFT-AHe thermal history modeling.',

  -- Key findings
  key_findings = ARRAY[
    'Diachronous footwall exhumation along Usisya fault mirrors 4D hangingwall subsidence from seismic data, validating thermochronology-based fault evolution reconstruction',
    'Early-stage (Stage 1-2) exhumation focused at centers of 4 isolated fault segments, matching distribution of early syn-rift depocenters identified in seismic reflection data',
    'Later-onset exhumation in intervening areas marks subsequent fault segment propagation and linkage forming the through-going Usisya fault system (Stage 3)',
    'Low cumulative exhumation in Usisya footwall coincides with areas of significant intra-basinal faulting, indicating strain partitioning within the fault array',
    'Thermal history modeling using joint AFT + AHe data successfully constrains spatiotemporal fault evolution where subsurface seismic/well data are absent',
    'Close agreement between footwall denudation trends and hangingwall sedimentation patterns validates Boone et al. (2019) methodology',
    'Segment growth and linkage model is the dominant fault evolution mechanism for Usisya fault, not constant-length model'
  ],

  -- FAIR score and reasoning
  fair_score = 95,
  fair_reasoning = 'FAIR Score 95/100: This dataset exemplifies FAIR data principles with complete EarthBank compatibility, IGSN sample identification, DOI assignment (10.58024/AGUM6A344358), ORCID-based provenance, granular data storage (individual tracks, single grain ages), batch QC tracking with Durango reference materials, and complete kinetic parameters (rmr0, Dpar, Cl content). Minor deduction for thermal history models not being directly available (requires QTQt reprocessing). Data already uploaded to AusGeochem/EarthBank platform.',

  -- Additional metadata
  laboratory = 'Thermochronology Research Group, University of Melbourne',
  analyst = 'Malcolm McMillan (AFT), Barry Kohn (AHe)',
  collection_date = '2019-01-01'  -- Inferred from sample IDs (MU19-XX)

WHERE id = 1;

-- Show updated record
SELECT
  id,
  dataset_name,
  array_length(authors, 1) as author_count,
  array_length(analysis_methods, 1) as method_count,
  array_length(key_findings, 1) as findings_count,
  fair_score,
  doi
FROM datasets
WHERE id = 1;
