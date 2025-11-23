#!/usr/bin/env npx tsx

/**
 * Comprehensive cleanup of old folders in BOTH extractions and datasets buckets
 * Removes all folders except those associated with active datasets
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'
import { query } from '@/lib/db/connection'

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function getActiveDatasets(): Promise<{ ids: number[], sessions: string[] }> {
  const datasets = await query<{ id: number }>(
    'SELECT id FROM datasets ORDER BY created_at DESC'
  )

  const sessions = await query<{ session_id: string }>(
    'SELECT session_id FROM extraction_sessions ORDER BY created_at DESC'
  )

  return {
    ids: datasets.map(d => d.id),
    sessions: sessions.map(s => s.session_id)
  }
}

async function listAllFolders(bucketName: string): Promise<string[]> {
  const { data, error } = await supabase.storage
    .from(bucketName)
    .list('', {
      limit: 1000,
      sortBy: { column: 'name', order: 'asc' }
    })

  if (error) {
    console.error(`❌ Error listing folders in ${bucketName}:`, error)
    return []
  }

  return data.map(item => item.name).filter(name => name && name.length > 0)
}

async function deleteFolderRecursively(bucketName: string, folderPath: string): Promise<boolean> {
  console.log(`   Deleting: ${bucketName}/${folderPath}`)

  // List all files in the folder
  const { data: files, error: listError } = await supabase.storage
    .from(bucketName)
    .list(folderPath, {
      limit: 1000
    })

  if (listError) {
    console.error(`   ❌ Error listing: ${listError.message}`)
    return false
  }

  // Delete files if any exist
  if (files && files.length > 0) {
    const filePaths = files.map(file => `${folderPath}/${file.name}`)
    const { error: deleteError } = await supabase.storage
      .from(bucketName)
      .remove(filePaths)

    if (deleteError) {
      console.error(`   ❌ Error deleting files: ${deleteError.message}`)
      return false
    }
    console.log(`   ✓ Deleted ${files.length} file(s)`)
  }

  // Try to remove the folder itself
  const { error: removeFolderError } = await supabase.storage
    .from(bucketName)
    .remove([folderPath])

  if (!removeFolderError) {
    console.log(`   ✓ Removed folder`)
  }

  return true
}

async function cleanExtractionsBucket(activeSessions: string[]) {
  console.log('\n📂 Cleaning EXTRACTIONS bucket...')
  const allFolders = await listAllFolders('extractions')
  console.log(`   Found ${allFolders.length} folders`)

  const foldersToDelete = allFolders.filter(folder => !activeSessions.includes(folder))
  const foldersToKeep = allFolders.filter(folder => activeSessions.includes(folder))

  console.log(`   Keeping: ${foldersToKeep.length} (${foldersToKeep.join(', ')})`)
  console.log(`   Deleting: ${foldersToDelete.length}`)

  let successCount = 0
  for (const folder of foldersToDelete) {
    const success = await deleteFolderRecursively('extractions', folder)
    if (success) successCount++
  }

  return { total: foldersToDelete.length, success: successCount }
}

async function cleanDatasetsBucket(activeDatasetIds: number[]) {
  console.log('\n📂 Cleaning DATASETS bucket...')
  const allFolders = await listAllFolders('datasets')
  console.log(`   Found ${allFolders.length} folders`)

  const activeDatasetStrings = activeDatasetIds.map(id => id.toString())
  const foldersToDelete = allFolders.filter(folder => !activeDatasetStrings.includes(folder))
  const foldersToKeep = allFolders.filter(folder => activeDatasetStrings.includes(folder))

  console.log(`   Keeping: ${foldersToKeep.length} (${foldersToKeep.join(', ')})`)
  console.log(`   Deleting: ${foldersToDelete.length} (${foldersToDelete.join(', ')})`)

  let successCount = 0
  for (const folder of foldersToDelete) {
    const success = await deleteFolderRecursively('datasets', folder)
    if (success) successCount++
  }

  return { total: foldersToDelete.length, success: successCount }
}

async function main() {
  console.log('🧹 COMPREHENSIVE STORAGE CLEANUP\n')
  console.log('━'.repeat(60))

  // Get active datasets and sessions
  console.log('📋 Fetching active datasets from database...')
  const { ids: activeDatasetIds, sessions: activeSessions } = await getActiveDatasets()

  console.log(`✓ Found ${activeDatasetIds.length} active datasets: ${activeDatasetIds.join(', ')}`)
  console.log(`✓ Found ${activeSessions.length} active sessions: ${activeSessions.join(', ')}`)

  // Clean both buckets
  const extractionsResult = await cleanExtractionsBucket(activeSessions)
  const datasetsResult = await cleanDatasetsBucket(activeDatasetIds)

  // Summary
  console.log('\n' + '━'.repeat(60))
  console.log('✨ CLEANUP COMPLETE!\n')
  console.log('EXTRACTIONS bucket:')
  console.log(`   ✓ Deleted: ${extractionsResult.success}/${extractionsResult.total} folders`)
  console.log(`   ✓ Kept: ${activeSessions.length} active sessions\n`)
  console.log('DATASETS bucket:')
  console.log(`   ✓ Deleted: ${datasetsResult.success}/${datasetsResult.total} folders`)
  console.log(`   ✓ Kept: ${activeDatasetIds.length} active datasets`)
  console.log('━'.repeat(60))
}

main().catch(console.error)
