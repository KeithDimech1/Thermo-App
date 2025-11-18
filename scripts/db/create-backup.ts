#!/usr/bin/env tsx
/**
 * Create a full database backup using pg_dump
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

// Load environment variables
const envPath = path.join(process.cwd(), '.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');

// Extract DIRECT_URL (with or without quotes)
const directUrlMatch = envContent.match(/DIRECT_URL=["']?([^\s"']+)["']?/);
if (!directUrlMatch) {
  console.error('❌ DIRECT_URL not found in .env.local');
  process.exit(1);
}

const connectionString = directUrlMatch[1];
const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T').join('-').slice(0, -5);
const backupFile = `backup-pre-earthbank-migration-${timestamp}.sql`;

console.log(`📦 Creating database backup: ${backupFile}`);
console.log(`🔗 Connection: ${connectionString.replace(/:[^:@]+@/, ':***@')}`);

try {
  // Run pg_dump
  const command = `pg_dump "${connectionString}" --no-owner --no-acl`;
  const output = execSync(command, { encoding: 'utf-8', maxBuffer: 50 * 1024 * 1024 });

  // Write to file
  fs.writeFileSync(backupFile, output);

  // Get file size
  const stats = fs.statSync(backupFile);
  const sizeMB = (stats.size / 1024 / 1024).toFixed(2);

  console.log(`✅ Backup created: ${backupFile} (${sizeMB} MB)`);
  console.log(`📁 Location: ${path.resolve(backupFile)}`);

  // Verify backup has content
  if (stats.size < 1000) {
    console.error(`⚠️  Backup file is suspiciously small (${stats.size} bytes)`);
    console.error(`❌ Backup may have failed - please review manually`);
    process.exit(1);
  }

  console.log(`✅ Backup verification passed`);

} catch (error) {
  console.error('❌ Backup failed:', error instanceof Error ? error.message : error);
  process.exit(1);
}
