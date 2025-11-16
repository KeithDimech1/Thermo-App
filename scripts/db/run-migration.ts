#!/usr/bin/env tsx
/**
 * Migration Runner Script
 *
 * Executes a specific migration file against the database
 *
 * Usage:
 *   tsx scripts/db/run-migration.ts <migration-file>
 *   tsx scripts/db/run-migration.ts 005_add_papers_metadata.sql
 *
 * @version 1.0.0
 */

import { Pool } from 'pg';
import { readFileSync } from 'fs';
import { join } from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: join(__dirname, '../../.env.local') });

// =============================================================================
// CONFIGURATION
// =============================================================================

const DATABASE_URL = process.env.DATABASE_URL || process.env.DIRECT_URL || process.env.POSTGRES_URL;

if (!DATABASE_URL) {
  console.error('❌ Error: DATABASE_URL environment variable not set');
  process.exit(1);
}

const migrationFile = process.argv[2];

if (!migrationFile) {
  console.error('❌ Error: Migration file not specified');
  console.error('Usage: tsx scripts/db/run-migration.ts <migration-file>');
  console.error('Example: tsx scripts/db/run-migration.ts 005_add_papers_metadata.sql');
  process.exit(1);
}

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: DATABASE_URL.includes('neon.tech') || DATABASE_URL.includes('supabase')
    ? { rejectUnauthorized: false }
    : undefined
});

// =============================================================================
// MAIN FUNCTION
// =============================================================================

async function runMigration() {
  try {
    console.log('\n📊 ========================================');
    console.log('📊  Running Migration');
    console.log('📊 ========================================');
    console.log('');
    console.log('Migration file:', migrationFile);
    console.log('Database:', DATABASE_URL.replace(/:[^:@]+@/, ':****@'));
    console.log('');

    // Read migration file
    const migrationPath = join(__dirname, 'migrations', migrationFile);
    console.log(`🔍 Reading migration: ${migrationPath}`);
    const migration = readFileSync(migrationPath, 'utf-8');

    // Execute migration
    console.log('🔄 Executing migration...');
    await pool.query(migration);

    console.log('\n✅ ========================================');
    console.log('✅  Migration completed successfully!');
    console.log('✅ ========================================');
    console.log('');

  } catch (error) {
    console.error('\n❌ Migration failed:');
    console.error(error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// =============================================================================
// RUN
// =============================================================================

runMigration().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});
