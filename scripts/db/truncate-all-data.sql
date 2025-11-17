-- Truncate all data from thermochronology database
-- Preserves schema (table structure) but removes all data
-- Resets auto-increment sequences

BEGIN;

-- Delete in order (child tables first due to foreign keys)
TRUNCATE TABLE ahe_grain_data CASCADE;
TRUNCATE TABLE ft_track_lengths CASCADE;
TRUNCATE TABLE ft_counts CASCADE;
TRUNCATE TABLE ft_ages CASCADE;
TRUNCATE TABLE samples CASCADE;
TRUNCATE TABLE datasets RESTART IDENTITY CASCADE;

-- Verify all tables are empty
SELECT 'datasets' AS table_name, COUNT(*) AS count FROM datasets
UNION ALL
SELECT 'samples', COUNT(*) FROM samples
UNION ALL
SELECT 'ft_ages', COUNT(*) FROM ft_ages
UNION ALL
SELECT 'ft_counts', COUNT(*) FROM ft_counts
UNION ALL
SELECT 'ft_track_lengths', COUNT(*) FROM ft_track_lengths
UNION ALL
SELECT 'ahe_grain_data', COUNT(*) FROM ahe_grain_data;

COMMIT;
