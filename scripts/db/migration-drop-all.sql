-- =============================================================================
-- Migration DROP Script - Remove Old Schema v1
-- =============================================================================
-- Version: 1.0.0
-- Date: 2025-11-17
-- Migration: Option A-1 (Clean Slate)
-- WARNING: This script PERMANENTLY DELETES all data and tables
-- =============================================================================
--
-- This script drops the old schema (v1) to prepare for EarthBank schema (v2)
--
-- CRITICAL: This is IRREVERSIBLE. All data will be lost.
--
-- Run this ONLY after:
-- 1. Confirming no important data exists
-- 2. Having source files available for re-import
-- 3. Testing new schema on dev database
--
-- =============================================================================

\echo '========================================='
\echo 'MIGRATION DROP SCRIPT - Schema v1 → v2'
\echo '========================================='
\echo ''
\echo 'WARNING: This will DELETE ALL DATA'
\echo 'Press Ctrl+C to cancel, or wait 5 seconds to continue...'
\echo ''

SELECT pg_sleep(5);

\echo 'Proceeding with DROP...'
\echo ''

-- =============================================================================
-- DROP VIEWS FIRST (they depend on tables)
-- =============================================================================

\echo 'Dropping views...'

DROP VIEW IF EXISTS vw_sample_summary CASCADE;
DROP VIEW IF EXISTS vw_aft_complete CASCADE;

\echo '✓ Views dropped'
\echo ''

-- =============================================================================
-- DROP TABLES (in reverse dependency order)
-- =============================================================================

\echo 'Dropping tables...'

-- Drop data tables first (they reference samples)
DROP TABLE IF EXISTS ahe_grain_data CASCADE;
DROP TABLE IF EXISTS ft_track_lengths CASCADE;
DROP TABLE IF EXISTS ft_counts CASCADE;
DROP TABLE IF EXISTS ft_ages CASCADE;

-- Drop samples table (references datasets)
DROP TABLE IF EXISTS samples CASCADE;

-- Drop datasets table (no dependencies)
DROP TABLE IF EXISTS datasets CASCADE;

\echo '✓ All old tables dropped'
\echo ''

-- =============================================================================
-- DROP FUNCTIONS/TRIGGERS (if any remain)
-- =============================================================================

\echo 'Cleaning up functions and triggers...'

DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

\echo '✓ Functions and triggers cleaned'
\echo ''

-- =============================================================================
-- VERIFY CLEAN STATE
-- =============================================================================

\echo 'Verifying clean state...'
\echo ''

-- Check for any remaining tables in public schema
DO $$
DECLARE
  table_count INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO table_count
  FROM information_schema.tables
  WHERE table_schema = 'public'
    AND table_type = 'BASE TABLE';

  IF table_count = 0 THEN
    RAISE NOTICE '✓ All tables successfully removed';
  ELSE
    RAISE WARNING '⚠ Warning: % tables still exist in public schema', table_count;
    RAISE NOTICE 'Listing remaining tables:';
    FOR rec IN
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_type = 'BASE TABLE'
    LOOP
      RAISE NOTICE '  - %', rec.table_name;
    END LOOP;
  END IF;
END $$;

\echo ''
\echo '========================================='
\echo 'DROP COMPLETE'
\echo '========================================='
\echo ''
\echo 'Database is now empty and ready for schema v2'
\echo ''
\echo 'Next step: Run schema-earthbank-v2.sql'
\echo '  psql "$DATABASE_URL" -f scripts/db/schema-earthbank-v2.sql'
\echo ''
\echo '========================================='
