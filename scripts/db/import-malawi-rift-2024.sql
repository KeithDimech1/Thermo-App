-- Import Malawi Rift 2024 Data
-- Simple import without metadata complexity

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

\COPY temp_samples FROM 'build-data/learning/thermo-papers/data/Malawi-Rift-2024-samples.csv' WITH (FORMAT CSV, HEADER TRUE, NULL '');

INSERT INTO samples (
    sample_id, dataset_id, latitude, longitude, elevation_m,
    mineral_type, analysis_method, n_aft_grains
)
SELECT
    sample_id, 1, latitude, longitude, elevation_m,
    mineral_type, analysis_method, n_aft_grains
FROM temp_samples
ON CONFLICT (sample_id) DO NOTHING;

-- Import FT ages
\COPY ft_ages (sample_id, n_grains, pooled_age_ma, pooled_age_error_ma, central_age_ma, central_age_error_ma, dispersion_pct, p_chi2, ft_age_type) FROM 'build-data/learning/thermo-papers/data/Malawi-Rift-2024-ft_ages.csv' WITH (FORMAT CSV, HEADER TRUE, NULL '');

-- Import FT counts
\COPY ft_counts (sample_id, grain_id, ns, rho_s_cm2, u_ppm, th_ppm, eu_ppm, dpar_um, rmr0, cl_wt_pct, n_grains) FROM 'build-data/learning/thermo-papers/data/Malawi-Rift-2024-ft_counts.csv' WITH (FORMAT CSV, HEADER TRUE, NULL '');

-- Import FT track lengths
\COPY ft_track_lengths (sample_id, grain_id, n_confined_tracks, mean_track_length_um, mean_track_length_sd_um, dpar_um) FROM 'build-data/learning/thermo-papers/data/Malawi-Rift-2024-ft_track_lengths.csv' WITH (FORMAT CSV, HEADER TRUE, NULL '');

-- Verify counts
SELECT 'datasets' AS table_name, COUNT(*) AS count FROM datasets WHERE id = 1
UNION ALL
SELECT 'samples', COUNT(*) FROM samples WHERE dataset_id = 1
UNION ALL
SELECT 'ft_ages', COUNT(*) FROM ft_ages WHERE sample_id IN (SELECT sample_id FROM samples WHERE dataset_id = 1)
UNION ALL
SELECT 'ft_counts', COUNT(*) FROM ft_counts WHERE sample_id IN (SELECT sample_id FROM samples WHERE dataset_id = 1)
UNION ALL
SELECT 'ft_track_lengths', COUNT(*) FROM ft_track_lengths WHERE sample_id IN (SELECT sample_id FROM samples WHERE dataset_id = 1);

COMMIT;
