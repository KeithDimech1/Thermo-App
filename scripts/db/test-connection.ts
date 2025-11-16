#!/usr/bin/env tsx
/**
 * Database Connection Test
 *
 * Tests the database connection and displays configuration
 *
 * Usage:
 *   npm run db:test
 *   tsx scripts/db/test-connection.ts
 *
 * @version 1.0.0
 */

// Load environment variables from .env.local
import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(process.cwd(), '.env.local') });

import { Pool } from 'pg';

// =============================================================================
// CONFIGURATION
// =============================================================================

const DATABASE_URL = process.env.DATABASE_URL || process.env.POSTGRES_URL;

if (!DATABASE_URL) {
  console.error('\n❌ Error: DATABASE_URL environment variable not set\n');
  console.error('Please create a .env.local file with your database connection string.');
  console.error('See .env.local.example for examples.\n');
  process.exit(1);
}

// =============================================================================
// CONNECTION TEST
// =============================================================================

async function testConnection() {
  let pool: Pool | null = null;

  try {
    console.log('\n📊 Database Connection Test');
    console.log('========================================\n');

    // Parse connection string to show details (without password)
    const url = new URL(DATABASE_URL);
    const safeUrl = DATABASE_URL.replace(/:[^:@]+@/, ':****@');

    console.log('Connection Details:');
    console.log(`  Host:     ${url.hostname}`);
    console.log(`  Port:     ${url.port || '5432'}`);
    console.log(`  Database: ${url.pathname.slice(1)}`);
    console.log(`  User:     ${url.username}`);
    console.log(`  SSL:      ${url.searchParams.get('sslmode') || 'auto-detected'}`);
    console.log(`\n  Full URL: ${safeUrl}\n`);

    // Create pool with SSL detection
    const useSSL = DATABASE_URL.includes('neon.tech') ||
                   DATABASE_URL.includes('supabase') ||
                   DATABASE_URL.includes('sslmode=require');

    pool = new Pool({
      connectionString: DATABASE_URL,
      ssl: useSSL ? { rejectUnauthorized: false } : undefined
    });

    console.log('🔌 Attempting connection...\n');

    // Test query
    const result = await pool.query('SELECT NOW() as current_time, version() as pg_version');

    console.log('✅ Connection successful!\n');
    console.log('PostgreSQL Details:');
    console.log(`  Server Time: ${result.rows[0].current_time}`);
    console.log(`  Version:     ${result.rows[0].pg_version.split(',')[0]}\n`);

    // Check if tables exist
    const tablesResult = await pool.query(`
      SELECT COUNT(*) as table_count
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
    `);

    const tableCount = parseInt(tablesResult.rows[0].table_count);

    console.log('Schema Status:');
    console.log(`  Tables:      ${tableCount}`);

    if (tableCount === 0) {
      console.log('\n⚠️  No tables found. Run schema creation:');
      console.log('    npm run db:schema\n');
    } else if (tableCount === 8) {
      console.log('  Status:      ✅ Schema created\n');

      // Check data
      const dataResult = await pool.query('SELECT COUNT(*) FROM test_configurations');
      const configCount = parseInt(dataResult.rows[0].count);

      if (configCount === 0) {
        console.log('⚠️  Schema exists but no data. Run import:');
        console.log('    npm run db:import\n');
      } else {
        console.log(`  Data:        ✅ ${configCount} test configurations\n`);
      }
    } else {
      console.log('  Status:      ⚠️  Partial schema (expected 8 tables)\n');
    }

    console.log('========================================');
    console.log('✅ Database is ready to use!');
    console.log('========================================\n');

  } catch (error) {
    console.log('❌ Connection failed!\n');
    console.log('========================================');
    console.log('Error Details:');
    console.log('========================================\n');

    if (error instanceof Error) {
      console.error(error.message);

      if (error.message.includes('ECONNREFUSED')) {
        console.log('\nTroubleshooting:');
        console.log('  1. Is PostgreSQL running?');
        console.log('  2. Check host and port in DATABASE_URL');
        console.log('  3. For local: brew services start postgresql@14');
      } else if (error.message.includes('password authentication failed')) {
        console.log('\nTroubleshooting:');
        console.log('  1. Check username and password in DATABASE_URL');
        console.log('  2. Verify user exists in PostgreSQL');
      } else if (error.message.includes('does not exist')) {
        console.log('\nTroubleshooting:');
        console.log('  1. Create the database first');
        console.log('  2. For local: createdb qc_results');
        console.log('  3. For Neon: database is auto-created');
      }
    } else {
      console.error(error);
    }

    console.log('');
    process.exit(1);

  } finally {
    if (pool) {
      await pool.end();
    }
  }
}

// =============================================================================
// RUN
// =============================================================================

testConnection().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});
