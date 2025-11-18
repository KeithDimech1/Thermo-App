-- Import Malawi Rift 2024 Data (Schema v2)
-- Uses ft_datapoints, ft_count_data, ft_track_length_data

BEGIN;

-- Check if dataset already exists, if not create it
INSERT INTO datasets (id, dataset_name, description, study_area, analyst, laboratory)
VALUES (1, 'Malawi Rift Thermochronology', 'Central Basin - Usisya Border Fault', 'Malawi Rift Central Basin', 'M_McMillan', 'University of Melbourne')
ON CONFLICT (id) DO NOTHING;

-- Import samples
CREATE TEMP TABLE temp_samples (
    sample_id VARCHAR(50),
    dataset_id INTEGER,
    latitude NUMERIC,
    longitude NUMERIC,
    elevation_m NUMERIC,
    mineral_type VARCHAR(50),
    analysis_method VARCHAR(100),
    n_aft_grains INTEGER
);

\COPY temp_samples FROM 'build-data/learning/thermo-papers/data/Malawi-2024-samples.csv' WITH (FORMAT CSV, HEADER TRUE, NULL '');

INSERT INTO samples (
    sample_id, dataset_id, latitude, longitude, elevation_m,
    mineral_type, analysis_method, n_aft_grains
)
SELECT
    sample_id, 1, latitude, longitude, elevation_m,
    mineral_type, analysis_method, n_aft_grains
FROM temp_samples
ON CONFLICT (sample_id) DO NOTHING;

-- Import FT datapoints (Schema v2)
\COPY ft_datapoints (sample_id, datapoint_key, n_grains, pooled_age_ma, pooled_age_error_ma, central_age_ma, central_age_error_ma, dispersion_pct, p_chi2_pct, ft_method, mineral_type) FROM 'build-data/learning/thermo-papers/data/Malawi-2024-ft_datapoints.csv' WITH (FORMAT CSV, HEADER TRUE, NULL '');

-- Create temp table to map sample_id to ft_datapoint_id
CREATE TEMP TABLE temp_sample_datapoint_map AS
SELECT sample_id, id AS ft_datapoint_id
FROM ft_datapoints
WHERE sample_id IN (SELECT sample_id FROM samples WHERE dataset_id = 1);

-- Import FT count data (Schema v2) - requires ft_datapoint_id
CREATE TEMP TABLE temp_ft_count_data (
    sample_id VARCHAR(50),
    grain_id VARCHAR(100),
    ns INTEGER,
    rho_s_cm2 NUMERIC,
    dpar_um NUMERIC,
    dpar_sd_um NUMERIC
);

\COPY temp_ft_count_data FROM 'build-data/learning/thermo-papers/data/Malawi-2024-ft_count_data.csv' WITH (FORMAT CSV, HEADER TRUE, NULL '');

INSERT INTO ft_count_data (ft_datapoint_id, grain_id, ns, rho_s_cm2, dpar_um, dpar_error_um)
SELECT
    m.ft_datapoint_id, t.grain_id, t.ns, t.rho_s_cm2, t.dpar_um, t.dpar_sd_um
FROM temp_ft_count_data t
JOIN temp_sample_datapoint_map m ON t.sample_id = m.sample_id;

-- Import FT track length data (Schema v2) - requires ft_datapoint_id
CREATE TEMP TABLE temp_ft_track_length_data (
    sample_id VARCHAR(50),
    grain_id VARCHAR(100),
    n_confined_tracks INTEGER,
    mean_track_length_um NUMERIC,
    mean_track_length_se_um NUMERIC,
    mean_track_length_sd_um NUMERIC,
    dpar_um NUMERIC
);

\COPY temp_ft_track_length_data FROM 'build-data/learning/thermo-papers/data/Malawi-2024-ft_track_length_data.csv' WITH (FORMAT CSV, HEADER TRUE, NULL '');

INSERT INTO ft_track_length_data (ft_datapoint_id, grain_id, track_id, track_type, true_length_um, dpar_um, dpar_error_um)
SELECT
    m.ft_datapoint_id,
    t.grain_id,
    t.grain_id || '_summary' AS track_id,  -- Generate track_id
    'TINT' AS track_type,
    t.mean_track_length_um,
    t.dpar_um,
    t.mean_track_length_se_um
FROM temp_ft_track_length_data t
JOIN temp_sample_datapoint_map m ON t.sample_id = m.sample_id;

-- Verify counts
SELECT 'datasets' AS table_name, COUNT(*) AS count FROM datasets WHERE id = 1
UNION ALL
SELECT 'samples', COUNT(*) FROM samples WHERE dataset_id = 1
UNION ALL
SELECT 'ft_datapoints', COUNT(*) FROM ft_datapoints WHERE sample_id IN (SELECT sample_id FROM samples WHERE dataset_id = 1)
UNION ALL
SELECT 'ft_count_data', COUNT(*) FROM ft_count_data WHERE ft_datapoint_id IN (SELECT id FROM ft_datapoints WHERE sample_id IN (SELECT sample_id FROM samples WHERE dataset_id = 1))
UNION ALL
SELECT 'ft_track_length_data', COUNT(*) FROM ft_track_length_data WHERE ft_datapoint_id IN (SELECT id FROM ft_datapoints WHERE sample_id IN (SELECT sample_id FROM samples WHERE dataset_id = 1));

COMMIT;
