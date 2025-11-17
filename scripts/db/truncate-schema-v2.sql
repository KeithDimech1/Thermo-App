-- Truncate all data from EarthBank Schema v2
-- Preserves schema (table structure) but removes all data
-- Resets auto-increment sequences
-- Order matters: delete children before parents to avoid FK constraint violations

BEGIN;

-- Grain-level data (deepest children)
TRUNCATE TABLE ft_count_data RESTART IDENTITY CASCADE;
TRUNCATE TABLE ft_single_grain_ages RESTART IDENTITY CASCADE;
TRUNCATE TABLE ft_track_length_data RESTART IDENTITY CASCADE;
TRUNCATE TABLE ft_binned_length_data RESTART IDENTITY CASCADE;
TRUNCATE TABLE he_whole_grain_data RESTART IDENTITY CASCADE;
TRUNCATE TABLE ahe_grain_data RESTART IDENTITY CASCADE;

-- Datapoint-level (analytical sessions)
TRUNCATE TABLE ft_datapoints RESTART IDENTITY CASCADE;
TRUNCATE TABLE he_datapoints RESTART IDENTITY CASCADE;

-- Relationship tables
TRUNCATE TABLE datapoint_people_roles RESTART IDENTITY CASCADE;
TRUNCATE TABLE sample_people_roles RESTART IDENTITY CASCADE;

-- Physical sample tracking
TRUNCATE TABLE grains RESTART IDENTITY CASCADE;
TRUNCATE TABLE mounts RESTART IDENTITY CASCADE;

-- Sample level
TRUNCATE TABLE samples RESTART IDENTITY CASCADE;

-- QC infrastructure
TRUNCATE TABLE batches RESTART IDENTITY CASCADE;
TRUNCATE TABLE reference_materials RESTART IDENTITY CASCADE;

-- Top level
TRUNCATE TABLE datasets RESTART IDENTITY CASCADE;
TRUNCATE TABLE people RESTART IDENTITY CASCADE;

-- Verify all tables are empty
SELECT 'datasets' AS table_name, COUNT(*) AS count FROM datasets
UNION ALL SELECT 'samples', COUNT(*) FROM samples
UNION ALL SELECT 'people', COUNT(*) FROM people
UNION ALL SELECT 'batches', COUNT(*) FROM batches
UNION ALL SELECT 'reference_materials', COUNT(*) FROM reference_materials
UNION ALL SELECT 'mounts', COUNT(*) FROM mounts
UNION ALL SELECT 'grains', COUNT(*) FROM grains
UNION ALL SELECT 'sample_people_roles', COUNT(*) FROM sample_people_roles
UNION ALL SELECT 'datapoint_people_roles', COUNT(*) FROM datapoint_people_roles
UNION ALL SELECT 'ft_datapoints', COUNT(*) FROM ft_datapoints
UNION ALL SELECT 'he_datapoints', COUNT(*) FROM he_datapoints
UNION ALL SELECT 'ft_count_data', COUNT(*) FROM ft_count_data
UNION ALL SELECT 'ft_single_grain_ages', COUNT(*) FROM ft_single_grain_ages
UNION ALL SELECT 'ft_track_length_data', COUNT(*) FROM ft_track_length_data
UNION ALL SELECT 'ft_binned_length_data', COUNT(*) FROM ft_binned_length_data
UNION ALL SELECT 'he_whole_grain_data', COUNT(*) FROM he_whole_grain_data
UNION ALL SELECT 'ahe_grain_data', COUNT(*) FROM ahe_grain_data
ORDER BY table_name;

COMMIT;
