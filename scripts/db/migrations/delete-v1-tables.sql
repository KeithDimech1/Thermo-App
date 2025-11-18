-- =============================================================================
-- Delete Old Schema v1 Tables (Clean Up After Migration)
-- =============================================================================
-- Date: 2025-11-18
-- Issue: Old v1 tables (ft_ages, ft_counts, ft_track_lengths) still exist
--        but are no longer used by code or views
-- =============================================================================
-- PREREQUISITE: Run fix-views-to-v2-schema.sql FIRST to update views!
-- =============================================================================

-- Safety check: Display tables to be deleted
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'SCHEMA V1 CLEANUP';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'The following tables will be DELETED:';
  RAISE NOTICE '  - ft_ages';
  RAISE NOTICE '  - ft_counts';
  RAISE NOTICE '  - ft_track_lengths';
  RAISE NOTICE '';
  RAISE NOTICE 'These tables are from Schema v1 and are';
  RAISE NOTICE 'no longer used by code or views.';
  RAISE NOTICE '';
  RAISE NOTICE 'BACKUP RECOMMENDED before proceeding!';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
END $$;

-- =============================================================================
-- Check for data in old tables (informational only)
-- =============================================================================

SELECT 'ft_ages' as table_name, COUNT(*) as row_count FROM ft_ages
UNION ALL
SELECT 'ft_counts', COUNT(*) FROM ft_counts
UNION ALL
SELECT 'ft_track_lengths', COUNT(*) FROM ft_track_lengths;

-- =============================================================================
-- BACKUP OLD TABLES (Recommended - uncomment to create backup tables)
-- =============================================================================

-- Option 1: Create archive tables (recommended)
-- CREATE TABLE _archive_ft_ages_v1 AS SELECT * FROM ft_ages;
-- CREATE TABLE _archive_ft_counts_v1 AS SELECT * FROM ft_counts;
-- CREATE TABLE _archive_ft_track_lengths_v1 AS SELECT * FROM ft_track_lengths;

-- Option 2: Use pg_dump to backup to file (run from command line)
-- pg_dump -h <host> -U <user> -d <db> -t ft_ages -t ft_counts -t ft_track_lengths > backup_v1_tables_2025-11-18.sql

-- =============================================================================
-- Check for dependencies (should return 0 rows if safe to delete)
-- =============================================================================

SELECT
  tc.table_name,
  tc.constraint_name,
  tc.constraint_type,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
  JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
  LEFT JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name IN ('ft_ages', 'ft_counts', 'ft_track_lengths')
ORDER BY tc.table_name, tc.constraint_name;

-- =============================================================================
-- DELETE OLD TABLES (UNCOMMENT TO EXECUTE)
-- =============================================================================

-- WARNING: This is IRREVERSIBLE without a backup!
-- Make sure you have:
-- 1. ✅ Updated views to use ft_datapoints (ran fix-views-to-v2-schema.sql)
-- 2. ✅ Verified no code references these tables
-- 3. ✅ Created backups (see above)
-- 4. ✅ Tested application with new views

-- Step 1: Drop any triggers on old tables
-- DROP TRIGGER IF EXISTS update_ft_ages_updated_at ON ft_ages;
-- DROP TRIGGER IF EXISTS update_ft_counts_updated_at ON ft_counts;
-- DROP TRIGGER IF EXISTS update_ft_track_lengths_updated_at ON ft_track_lengths;

-- Step 2: Drop tables with CASCADE (will drop any remaining foreign keys)
-- DROP TABLE IF EXISTS ft_ages CASCADE;
-- DROP TABLE IF EXISTS ft_counts CASCADE;
-- DROP TABLE IF EXISTS ft_track_lengths CASCADE;

-- Step 3: Verify deletion
-- SELECT table_name
-- FROM information_schema.tables
-- WHERE table_schema = 'public'
--   AND table_name IN ('ft_ages', 'ft_counts', 'ft_track_lengths');
-- Expected: 0 rows

-- =============================================================================
-- COMPLETION MESSAGE
-- =============================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'REVIEW COMPLETE';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'To delete old v1 tables:';
  RAISE NOTICE '1. Review row counts above';
  RAISE NOTICE '2. Verify no foreign key dependencies';
  RAISE NOTICE '3. Create backup tables or pg_dump';
  RAISE NOTICE '4. Uncomment DROP TABLE commands';
  RAISE NOTICE '5. Re-run this script';
  RAISE NOTICE '';
  RAISE NOTICE 'CURRENT STATUS: No changes made';
  RAISE NOTICE '========================================';
END $$;
