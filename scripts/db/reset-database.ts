#!/usr/bin/env tsx
/**
 * Database Reset Script
 *
 * Drops all tables and recreates schema
 * WARNING: This will delete ALL data!
 *
 * Usage:
 *   npm run db:reset
 *   tsx scripts/db/reset-database.ts
 *
 * @version 1.0.0
 */

import { Pool } from 'pg';
import { readFileSync } from 'fs';
import { join } from 'path';
import * as readline from 'readline';

// =============================================================================
// CONFIGURATION
// =============================================================================

const DATABASE_URL = process.env.DATABASE_URL || process.env.POSTGRES_URL;

if (!DATABASE_URL) {
  console.error('❌ Error: DATABASE_URL environment variable not set');
  process.exit(1);
}

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: DATABASE_URL.includes('supabase')
    ? { rejectUnauthorized: false }
    : undefined
});

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

function askQuestion(query: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise(resolve => rl.question(query, (answer) => {
    rl.close();
    resolve(answer);
  }));
}

// =============================================================================
// MAIN FUNCTION
// =============================================================================

async function resetDatabase() {
  try {
    console.log('\n⚠️  ========================================');
    console.log('⚠️   DATABASE RESET WARNING');
    console.log('⚠️  ========================================');
    console.log('');
    console.log('This will:');
    console.log('  1. Drop all tables and views');
    console.log('  2. Delete ALL data');
    console.log('  3. Recreate the schema');
    console.log('');
    console.log('Database:', DATABASE_URL.replace(/:[^:@]+@/, ':****@'));
    console.log('');

    const answer = await askQuestion('Are you sure you want to continue? (yes/no): ');

    if (answer.toLowerCase() !== 'yes') {
      console.log('\n✅ Reset cancelled');
      return;
    }

    const doubleCheck = await askQuestion('\nType "DELETE ALL DATA" to confirm: ');

    if (doubleCheck !== 'DELETE ALL DATA') {
      console.log('\n✅ Reset cancelled');
      return;
    }

    console.log('\n📊 Reading schema file...');
    const schemaPath = join(__dirname, 'schema.sql');
    const schema = readFileSync(schemaPath, 'utf-8');

    console.log('🔄 Executing schema (dropping and recreating tables)...');
    await pool.query(schema);

    console.log('\n✅ ========================================');
    console.log('✅  Database reset complete!');
    console.log('✅ ========================================');
    console.log('');
    console.log('Next steps:');
    console.log('  1. Import data: npm run db:import');
    console.log('  2. Verify: npm run db:verify');
    console.log('');

  } catch (error) {
    console.error('\n❌ Reset failed:');
    console.error(error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// =============================================================================
// RUN
// =============================================================================

resetDatabase().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});
