/**
 * COMPLETE RESET: Delete all datasets, extraction sessions, and storage files
 *
 * WARNING: This is DESTRUCTIVE and IRREVERSIBLE!
 *
 * This script will:
 * 1. Delete ALL files from Supabase Storage (extractions + datasets buckets)
 * 2. Delete ALL database records (datasets, extraction_sessions, data_files, etc.)
 * 3. Reset dataset ID sequence to start from 1
 */

import { query } from '@/lib/db/connection';
import { createClient } from '@supabase/supabase-js';
import readline from 'readline';
import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables
if (!process.env.SUPABASE_URL) {
  const envPath = resolve(process.cwd(), '.env.local');
  config({ path: envPath });
}

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase credentials');
}

const supabase = createClient(supabaseUrl, supabaseKey);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function askQuestion(question: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

async function deleteAllStorageFiles() {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🗑️  STEP 1: DELETE ALL STORAGE FILES');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Delete from extractions bucket
  console.log('[1/2] Deleting all files from extractions bucket...');
  try {
    const { data: extractionsList, error: listError } = await supabase.storage
      .from('extractions')
      .list('', { limit: 1000 });

    if (listError) {
      console.error('   ❌ Error listing extractions:', listError);
    } else if (extractionsList && extractionsList.length > 0) {
      // Delete all folders/files
      const filesToDelete = extractionsList.map(item => item.name);

      for (const folder of filesToDelete) {
        // List all files in this folder recursively
        const { data: files } = await supabase.storage
          .from('extractions')
          .list(folder, { limit: 1000 });

        if (files && files.length > 0) {
          const paths = files.map(f => `${folder}/${f.name}`);
          const { error: deleteError } = await supabase.storage
            .from('extractions')
            .remove(paths);

          if (deleteError) {
            console.error(`   ⚠️  Error deleting files from ${folder}:`, deleteError.message);
          }
        }

        // Delete the folder itself
        await supabase.storage.from('extractions').remove([folder]);
      }

      console.log(`   ✓ Deleted ${filesToDelete.length} extraction session folders`);
    } else {
      console.log('   ✓ Extractions bucket already empty');
    }
  } catch (error) {
    console.error('   ❌ Error:', error);
  }

  // Delete from datasets bucket
  console.log('\n[2/2] Deleting all files from datasets bucket...');
  try {
    const { data: datasetsList, error: listError } = await supabase.storage
      .from('datasets')
      .list('', { limit: 1000 });

    if (listError) {
      console.error('   ❌ Error listing datasets:', listError);
    } else if (datasetsList && datasetsList.length > 0) {
      // Delete all folders/files
      const filesToDelete = datasetsList.map(item => item.name);

      for (const folder of filesToDelete) {
        // List all files in this folder recursively
        const { data: files } = await supabase.storage
          .from('datasets')
          .list(folder, { limit: 1000 });

        if (files && files.length > 0) {
          const paths = files.map(f => `${folder}/${f.name}`);
          const { error: deleteError } = await supabase.storage
            .from('datasets')
            .remove(paths);

          if (deleteError) {
            console.error(`   ⚠️  Error deleting files from ${folder}:`, deleteError.message);
          }
        }

        // Delete the folder itself
        await supabase.storage.from('datasets').remove([folder]);
      }

      console.log(`   ✓ Deleted ${filesToDelete.length} dataset folders`);
    } else {
      console.log('   ✓ Datasets bucket already empty');
    }
  } catch (error) {
    console.error('   ❌ Error:', error);
  }

  console.log('\n✅ Storage cleanup complete');
}

async function deleteAllDatabaseRecords() {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🗑️  STEP 2: DELETE ALL DATABASE RECORDS');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Count records before deletion
  const datasetsCount = await query('SELECT COUNT(*) FROM datasets');
  const extractionsCount = await query('SELECT COUNT(*) FROM extraction_sessions');
  const filesCount = await query('SELECT COUNT(*) FROM data_files');

  console.log('Current records:');
  console.log(`   - Datasets: ${datasetsCount[0].count}`);
  console.log(`   - Extraction sessions: ${extractionsCount[0].count}`);
  console.log(`   - Data files: ${filesCount[0].count}`);

  console.log('\n[1/5] Deleting dataset_people_roles...');
  const rolesResult = await query('DELETE FROM dataset_people_roles');
  console.log(`   ✓ Deleted ${rolesResult.length || 0} records`);

  console.log('\n[2/5] Deleting fair_score_breakdown...');
  const fairResult = await query('DELETE FROM fair_score_breakdown');
  console.log(`   ✓ Deleted ${fairResult.length || 0} records`);

  console.log('\n[3/5] Deleting data_files...');
  const filesResult = await query('DELETE FROM data_files');
  console.log(`   ✓ Deleted ${filesResult.length || 0} records`);

  console.log('\n[4/5] Deleting extraction_sessions...');
  const sessionsResult = await query('DELETE FROM extraction_sessions');
  console.log(`   ✓ Deleted ${sessionsResult.length || 0} records`);

  console.log('\n[5/5] Deleting datasets...');
  const datasetsResult = await query('DELETE FROM datasets');
  console.log(`   ✓ Deleted ${datasetsResult.length || 0} records`);

  console.log('\n✅ Database cleanup complete');
}

async function resetSequence() {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔄 STEP 3: RESET DATASET ID SEQUENCE');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  console.log('Resetting datasets_id_seq to start from 1...');
  await query('ALTER SEQUENCE datasets_id_seq RESTART WITH 1');
  console.log('   ✓ Sequence reset - next dataset will have ID: 1');

  console.log('\n✅ Sequence reset complete');
}

async function main() {
  console.log(`
╔════════════════════════════════════════════════════════════════╗
║                                                                ║
║  ⚠️  COMPLETE DATASET RESET - DESTRUCTIVE OPERATION ⚠️         ║
║                                                                ║
║  This will DELETE ALL:                                         ║
║  • Storage files (extractions + datasets buckets)              ║
║  • Database records (datasets, extraction_sessions, etc.)      ║
║  • Reset dataset ID sequence to 1                              ║
║                                                                ║
║  THIS CANNOT BE UNDONE!                                        ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝
  `);

  const answer = await askQuestion('Are you ABSOLUTELY SURE you want to proceed? (type "YES DELETE ALL" to confirm): ');

  if (answer !== 'YES DELETE ALL') {
    console.log('\n❌ Aborted - no changes made');
    rl.close();
    process.exit(0);
  }

  console.log('\n🚀 Starting complete reset...\n');

  try {
    // Step 1: Delete all storage files
    await deleteAllStorageFiles();

    // Step 2: Delete all database records
    await deleteAllDatabaseRecords();

    // Step 3: Reset sequence
    await resetSequence();

    console.log(`
╔════════════════════════════════════════════════════════════════╗
║                                                                ║
║  ✅ RESET COMPLETE                                             ║
║                                                                ║
║  • All storage files deleted                                   ║
║  • All database records deleted                                ║
║  • Dataset ID sequence reset to 1                              ║
║                                                                ║
║  Next dataset will have ID: 1                                  ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝
    `);

  } catch (error) {
    console.error('\n❌ Error during reset:', error);
    process.exit(1);
  } finally {
    rl.close();
    process.exit(0);
  }
}

main();
