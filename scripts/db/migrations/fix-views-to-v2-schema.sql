-- =============================================================================
-- Fix Views to Use Schema v2 Tables
-- =============================================================================
-- Date: 2025-11-18
-- Issue: Views reference old v1 tables (ft_ages, ft_counts, ft_track_lengths)
--        instead of new v2 tables (ft_datapoints)
-- =============================================================================

-- Drop old views
DROP VIEW IF EXISTS vw_aft_complete CASCADE;
DROP VIEW IF EXISTS vw_sample_summary CASCADE;

-- =============================================================================
-- 1. vw_sample_summary - Sample summary with first datapoint ages
-- =============================================================================
CREATE OR REPLACE VIEW vw_sample_summary AS
SELECT
  s.sample_id,
  s.igsn,
  s.latitude,
  s.longitude,
  s.elevation_m,
  s.lithology,
  s.mineral_type,
  s.sampling_location_information,
  s.n_aft_grains,
  s.n_ahe_grains,

  -- First FT datapoint (for backward compatibility)
  (SELECT central_age_ma
   FROM ft_datapoints
   WHERE sample_id = s.sample_id
   ORDER BY analysis_date DESC, id DESC
   LIMIT 1) as aft_central_age_ma,

  (SELECT central_age_error_ma
   FROM ft_datapoints
   WHERE sample_id = s.sample_id
   ORDER BY analysis_date DESC, id DESC
   LIMIT 1) as aft_age_error_ma,

  (SELECT dispersion_pct
   FROM ft_datapoints
   WHERE sample_id = s.sample_id
   ORDER BY analysis_date DESC, id DESC
   LIMIT 1) as aft_dispersion_pct,

  (SELECT P_chi2_pct
   FROM ft_datapoints
   WHERE sample_id = s.sample_id
   ORDER BY analysis_date DESC, id DESC
   LIMIT 1) as aft_P_chi2,

  (SELECT mean_track_length_um
   FROM ft_datapoints
   WHERE sample_id = s.sample_id
   ORDER BY analysis_date DESC, id DESC
   LIMIT 1) as aft_mtl_um,

  (SELECT sd_track_length_um
   FROM ft_datapoints
   WHERE sample_id = s.sample_id
   ORDER BY analysis_date DESC, id DESC
   LIMIT 1) as aft_mtl_sd_um,

  (SELECT n_track_measurements
   FROM ft_datapoints
   WHERE sample_id = s.sample_id
   ORDER BY analysis_date DESC, id DESC
   LIMIT 1) as aft_n_tracks,

  -- AHe summary (average of all grains from all datapoints)
  (SELECT AVG(hg.corr_age_ma)
   FROM he_whole_grain_data hg
   JOIN he_datapoints hd ON hg.he_datapoint_id = hd.id
   WHERE hd.sample_id = s.sample_id) as ahe_mean_age_ma,

  (SELECT STDDEV(hg.corr_age_ma)
   FROM he_whole_grain_data hg
   JOIN he_datapoints hd ON hg.he_datapoint_id = hd.id
   WHERE hd.sample_id = s.sample_id) as ahe_age_sd_ma,

  (SELECT COUNT(hg.id)
   FROM he_whole_grain_data hg
   JOIN he_datapoints hd ON hg.he_datapoint_id = hd.id
   WHERE hd.sample_id = s.sample_id) as ahe_n_grains_measured,

  (SELECT AVG(hg.eU_ppm)
   FROM he_whole_grain_data hg
   JOIN he_datapoints hd ON hg.he_datapoint_id = hd.id
   WHERE hd.sample_id = s.sample_id) as ahe_mean_eU_ppm,

  d.dataset_name,
  d.study_area

FROM samples s
LEFT JOIN datasets d ON s.dataset_id = d.id;

COMMENT ON VIEW vw_sample_summary IS 'Sample summary with first datapoint ages (Schema v2 - uses ft_datapoints)';

-- =============================================================================
-- 2. vw_aft_complete - Complete AFT data from first datapoint per sample
-- =============================================================================
CREATE OR REPLACE VIEW vw_aft_complete AS
SELECT
  s.sample_id,
  s.sampling_location_information,
  s.latitude,
  s.longitude,
  s.elevation_m,

  -- Ages from first datapoint
  ftd.central_age_ma,
  ftd.central_age_error_ma,
  ftd.pooled_age_ma,
  ftd.pooled_age_error_ma,
  ftd.dispersion_pct,
  ftd.P_chi2_pct,
  ftd.n_grains,

  -- Track lengths from first datapoint
  ftd.mean_track_length_um,
  ftd.sd_track_length_um,
  ftd.n_track_measurements,

  -- Aggregate count data from first datapoint
  ftd.mean_rho_s,
  ftd.total_Ns,
  ftd.mean_U_ppm,
  ftd.mean_Dpar_um

FROM samples s
LEFT JOIN LATERAL (
  SELECT * FROM ft_datapoints
  WHERE sample_id = s.sample_id
  ORDER BY analysis_date DESC, id DESC
  LIMIT 1
) ftd ON true;

COMMENT ON VIEW vw_aft_complete IS 'Complete AFT data from first datapoint per sample (Schema v2 - uses ft_datapoints)';

-- =============================================================================
-- COMPLETION
-- =============================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Views updated to Schema v2!';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Updated views:';
  RAISE NOTICE '  - vw_sample_summary (now uses ft_datapoints)';
  RAISE NOTICE '  - vw_aft_complete (now uses ft_datapoints)';
  RAISE NOTICE '';
  RAISE NOTICE 'Old v1 tables (ft_ages, ft_counts, ft_track_lengths)';
  RAISE NOTICE 'are NO LONGER REFERENCED by any views.';
  RAISE NOTICE 'Safe to delete when ready.';
  RAISE NOTICE '========================================';
END $$;
