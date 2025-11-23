/**
 * Cleanup Orphaned Storage Buckets
 *
 * This script:
 * 1. Lists all folders in Supabase storage (datasets and extractions buckets)
 * 2. Compares against active dataset IDs in the database
 * 3. Deletes storage folders that don't correspond to existing datasets
 *
 * IMPORTANT: Run with caution! This will permanently delete files.
 */

import { createClient } from '@supabase/supabase-js';
import { query } from '../../lib/db/connection';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL in .env.local');
  process.exit(1);
}

// Prefer service role key for admin operations, fall back to anon key
const supabaseKey = supabaseServiceKey || supabaseAnonKey;

if (!supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  console.error('   Required: SUPABASE_SERVICE_ROLE_KEY or SUPABASE_ANON_KEY');
  process.exit(1);
}

if (!supabaseServiceKey) {
  console.log('⚠️  Using SUPABASE_ANON_KEY (limited permissions - may fail for delete operations)');
  console.log('   For full admin access, add SUPABASE_SERVICE_ROLE_KEY to .env.local');
  console.log();
}

const supabase = createClient(supabaseUrl, supabaseKey);

interface DatasetRecord {
  id: number;
}

async function getActiveDatasetIds(): Promise<Set<number>> {
  const datasets = await query<DatasetRecord>('SELECT id FROM datasets ORDER BY id');
  return new Set(datasets.map(d => d.id));
}

async function listBucketFolders(bucketName: string): Promise<string[]> {
  const { data, error } = await supabase.storage
    .from(bucketName)
    .list('', {
      limit: 1000,
      offset: 0,
    });

  if (error) {
    console.error(`❌ Error listing bucket ${bucketName}:`, error.message);
    return [];
  }

  // Extract folder names (folders have metadata.mimetype === 'application/x-directory' or similar)
  // In Supabase, folders are prefixes, so we get the top-level items
  const folders = data
    .filter(item => item.id) // Folders and files both have IDs
    .map(item => item.name);

  return folders;
}

async function deleteFolder(bucketName: string, folderPath: string): Promise<boolean> {
  // List all files in the folder recursively
  const { data: files, error: listError } = await supabase.storage
    .from(bucketName)
    .list(folderPath, {
      limit: 1000,
      sortBy: { column: 'name', order: 'asc' },
    });

  if (listError) {
    console.error(`   ❌ Error listing files in ${bucketName}/${folderPath}:`, listError.message);
    return false;
  }

  if (!files || files.length === 0) {
    console.log(`   ℹ️  Folder ${folderPath} is empty or doesn't exist`);
    return true;
  }

  // Build list of file paths to delete
  const filePaths = files.map(file => `${folderPath}/${file.name}`);

  console.log(`   Found ${files.length} files to delete`);

  // Delete all files
  const { data, error: deleteError } = await supabase.storage
    .from(bucketName)
    .remove(filePaths);

  if (deleteError) {
    console.error(`   ❌ Error deleting files:`, deleteError.message);
    return false;
  }

  console.log(`   ✅ Deleted ${filePaths.length} files from ${bucketName}/${folderPath}`);
  return true;
}

async function cleanupOrphanedBuckets(dryRun: boolean = true) {
  console.log('━'.repeat(80));
  console.log('CLEANUP ORPHANED STORAGE BUCKETS');
  console.log('━'.repeat(80));
  console.log();

  if (dryRun) {
    console.log('🔍 DRY RUN MODE - No files will be deleted');
    console.log('   Run with --execute flag to actually delete files');
    console.log();
  } else {
    console.log('⚠️  EXECUTION MODE - Files will be permanently deleted!');
    console.log();
  }

  // Step 1: Get active dataset IDs from database
  console.log('Step 1: Fetching active dataset IDs from database...');
  const activeDatasetIds = await getActiveDatasetIds();
  console.log(`✅ Found ${activeDatasetIds.size} active datasets:`, Array.from(activeDatasetIds));
  console.log();

  // Step 2: Check datasets bucket
  console.log('Step 2: Checking datasets bucket...');
  const datasetFolders = await listBucketFolders('datasets');
  console.log(`Found ${datasetFolders.length} folders in datasets bucket`);

  const orphanedDatasets: string[] = [];
  for (const folder of datasetFolders) {
    // Dataset folders are named by ID (e.g., "8", "9", "10")
    const datasetId = parseInt(folder, 10);

    if (isNaN(datasetId)) {
      console.log(`   ⚠️  Skipping non-numeric folder: ${folder}`);
      continue;
    }

    if (!activeDatasetIds.has(datasetId)) {
      console.log(`   🗑️  Orphaned: datasets/${folder} (dataset ID ${datasetId} not in database)`);
      orphanedDatasets.push(folder);
    } else {
      console.log(`   ✓ Active: datasets/${folder}`);
    }
  }

  console.log();

  // Step 3: Check extractions bucket
  console.log('Step 3: Checking extractions bucket...');
  const extractionFolders = await listBucketFolders('extractions');
  console.log(`Found ${extractionFolders.length} folders in extractions bucket`);

  // For extractions, we check if there's a corresponding session in extraction_sessions table
  const extractionSessions = await query<{ session_id: string }>(
    'SELECT DISTINCT session_id FROM extraction_sessions'
  );
  const activeSessionIds = new Set(extractionSessions.map(s => s.session_id));

  const orphanedExtractions: string[] = [];
  for (const folder of extractionFolders) {
    if (!activeSessionIds.has(folder)) {
      console.log(`   🗑️  Orphaned: extractions/${folder} (session not in database)`);
      orphanedExtractions.push(folder);
    } else {
      console.log(`   ✓ Active: extractions/${folder}`);
    }
  }

  console.log();
  console.log('━'.repeat(80));
  console.log('SUMMARY');
  console.log('━'.repeat(80));
  console.log(`Active datasets: ${activeDatasetIds.size}`);
  console.log(`Orphaned dataset folders: ${orphanedDatasets.length}`);
  console.log(`Orphaned extraction folders: ${orphanedExtractions.length}`);
  console.log();

  if (orphanedDatasets.length === 0 && orphanedExtractions.length === 0) {
    console.log('✅ No orphaned buckets found! Storage is clean.');
    return;
  }

  // Step 4: Delete orphaned folders (if not dry run)
  if (!dryRun) {
    console.log('Step 4: Deleting orphaned folders...');
    console.log();

    for (const folder of orphanedDatasets) {
      console.log(`🗑️  Deleting datasets/${folder}...`);
      await deleteFolder('datasets', folder);
    }

    for (const folder of orphanedExtractions) {
      console.log(`🗑️  Deleting extractions/${folder}...`);
      await deleteFolder('extractions', folder);
    }

    console.log();
    console.log('✅ Cleanup complete!');
  } else {
    console.log('🔍 Dry run complete. To execute deletion, run:');
    console.log('   npx tsx scripts/storage/cleanup-orphaned-buckets.ts --execute');
  }

  console.log();
}

// Main execution
const args = process.argv.slice(2);
const dryRun = !args.includes('--execute');

cleanupOrphanedBuckets(dryRun).catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});
