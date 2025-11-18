-- Migrate existing v1 data to v2 schema
-- Converts ft_ages → ft_datapoints, ft_counts → ft_count_data, etc.

BEGIN;

-- STEP 1: Migrate ft_ages → ft_datapoints
-- Create one datapoint per sample (1:1 mapping for now)
INSERT INTO ft_datapoints (
    sample_id,
    datapoint_key,
    n_grains,
    pooled_age_ma,
    pooled_age_error_ma,
    central_age_ma,
    central_age_error_ma,
    dispersion_pct,
    p_chi2_pct,
    ft_method,
    mineral_type
)
SELECT
    fa.sample_id,
    fa.sample_id || '_FT_001' AS datapoint_key,  -- Generate unique key
    fa.n_grains,
    fa.pooled_age_ma,
    fa.pooled_age_error_ma,
    fa.central_age_ma,
    fa.central_age_error_ma,
    fa.dispersion_pct,
    fa.p_chi2 * 100.0 AS p_chi2_pct,  -- Convert fraction to percent
    'LA-ICP-MS' AS ft_method,  -- Default for Malawi dataset
    s.mineral_type
FROM ft_ages fa
JOIN samples s ON fa.sample_id = s.sample_id
ON CONFLICT (datapoint_key) DO NOTHING;

-- STEP 2: Create temp mapping table (sample_id → ft_datapoint_id)
CREATE TEMP TABLE temp_v1_to_v2_mapping AS
SELECT
    fa.sample_id,
    fd.id AS ft_datapoint_id
FROM ft_ages fa
JOIN ft_datapoints fd ON fa.sample_id = fd.sample_id
WHERE fd.datapoint_key = fa.sample_id || '_FT_001';

-- STEP 3: Migrate ft_counts → ft_count_data
INSERT INTO ft_count_data (
    ft_datapoint_id,
    grain_id,
    ns,
    rho_s_cm2,
    dpar_um,
    dpar_error_um
)
SELECT
    m.ft_datapoint_id,
    fc.grain_id,
    fc.ns,
    fc.rho_s_cm2,
    fc.dpar_um,
    fc.dpar_sd_um
FROM ft_counts fc
JOIN temp_v1_to_v2_mapping m ON fc.sample_id = m.sample_id;

-- STEP 4: Migrate ft_track_lengths → ft_track_length_data
INSERT INTO ft_track_length_data (
    ft_datapoint_id,
    grain_id,
    track_id,
    track_type,
    true_length_um,
    dpar_um,
    dpar_error_um
)
SELECT
    m.ft_datapoint_id,
    tl.grain_id,
    tl.grain_id || '_summary' AS track_id,  -- Generate track_id
    'TINT' AS track_type,
    tl.mean_track_length_um,
    tl.dpar_um,
    tl.mean_track_length_se_um
FROM ft_track_lengths tl
JOIN temp_v1_to_v2_mapping m ON tl.sample_id = m.sample_id
WHERE tl.mean_track_length_um IS NOT NULL;

-- STEP 5: Verify migration
SELECT 'Migration Summary' AS status;
SELECT 'ft_datapoints' AS table_name, COUNT(*) AS rows FROM ft_datapoints
UNION ALL
SELECT 'ft_count_data', COUNT(*) FROM ft_count_data
UNION ALL
SELECT 'ft_track_length_data', COUNT(*) FROM ft_track_length_data;

COMMIT;

-- After verifying migration is successful, you can delete v1 tables:
-- DROP TABLE ft_ages CASCADE;
-- DROP TABLE ft_counts CASCADE;
-- DROP TABLE ft_track_lengths CASCADE;
