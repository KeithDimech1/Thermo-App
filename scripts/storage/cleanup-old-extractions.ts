#!/usr/bin/env npx tsx

/**
 * Cleanup old extraction folders from Supabase Storage
 * Removes all folders except those associated with active extraction sessions
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
  console.error('❌ Missing required environment variables:')
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✓' : '✗')
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✓' : '✗')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function getActiveSessions(): Promise<string[]> {
  const rows = await query<{ session_id: string }>(
    'SELECT session_id FROM extraction_sessions ORDER BY created_at DESC'
  )
  return rows.map(row => row.session_id)
}

async function listAllFolders(): Promise<string[]> {
  const { data, error } = await supabase.storage
    .from('extractions')
    .list('', {
      limit: 1000,
      sortBy: { column: 'name', order: 'asc' }
    })

  if (error) {
    console.error('❌ Error listing folders:', error)
    return []
  }

  // Filter to only folders (they don't have extensions typically)
  // and match the extract-* pattern
  return data
    .filter(item => item.name.startsWith('extract-'))
    .map(item => item.name)
}

async function deleteFolder(folderPath: string): Promise<boolean> {
  console.log(`   Deleting folder: ${folderPath}`)

  // First, list all files in the folder
  const { data: files, error: listError } = await supabase.storage
    .from('extractions')
    .list(folderPath, {
      limit: 1000
    })

  if (listError) {
    console.error(`   ❌ Error listing files in ${folderPath}:`, listError)
    return false
  }

  if (!files || files.length === 0) {
    console.log(`   ℹ️  Folder ${folderPath} is empty`)
    // Still try to remove the empty folder directory
    const { error: removeFolderError } = await supabase.storage
      .from('extractions')
      .remove([folderPath])

    if (removeFolderError) {
      console.log(`   ℹ️  Could not remove empty folder (might not exist)`)
    }
    return true
  }

  // Delete all files in the folder
  const filePaths = files.map(file => `${folderPath}/${file.name}`)

  const { error: deleteError } = await supabase.storage
    .from('extractions')
    .remove(filePaths)

  if (deleteError) {
    console.error(`   ❌ Error deleting files in ${folderPath}:`, deleteError)
    return false
  }

  console.log(`   ✓ Deleted ${files.length} files from ${folderPath}`)

  // Now remove the empty folder directory itself
  const { error: removeFolderError } = await supabase.storage
    .from('extractions')
    .remove([folderPath])

  if (removeFolderError) {
    console.log(`   ⚠️  Files deleted but folder directory may still be visible`)
  } else {
    console.log(`   ✓ Removed folder directory`)
  }

  return true
}

async function main() {
  console.log('🧹 Cleaning up old extraction folders...\n')

  // Get active sessions from database
  console.log('📋 Fetching active extraction sessions from database...')
  const activeSessions = await getActiveSessions()
  console.log(`✓ Found ${activeSessions.length} active sessions:`)
  activeSessions.forEach(session => console.log(`   - ${session}`))
  console.log()

  // List all folders in storage
  console.log('📂 Listing all folders in Supabase Storage...')
  const allFolders = await listAllFolders()
  console.log(`✓ Found ${allFolders.length} total folders`)
  console.log()

  // Find folders to delete
  const foldersToDelete = allFolders.filter(folder => !activeSessions.includes(folder))
  const foldersToKeep = allFolders.filter(folder => activeSessions.includes(folder))

  console.log(`✓ Keeping ${foldersToKeep.length} folders:`)
  foldersToKeep.forEach(folder => console.log(`   - ${folder}`))
  console.log()

  console.log(`🗑️  Deleting ${foldersToDelete.length} old folders:`)
  if (foldersToDelete.length === 0) {
    console.log('   (none to delete)')
    console.log('\n✨ All clean! No old folders to remove.')
    return
  }

  // Confirm deletion
  console.log()
  console.log('⚠️  This will permanently delete the following folders:')
  foldersToDelete.forEach(folder => console.log(`   - ${folder}`))
  console.log()

  // Delete folders
  let successCount = 0
  let failCount = 0

  for (const folder of foldersToDelete) {
    const success = await deleteFolder(folder)
    if (success) {
      successCount++
    } else {
      failCount++
    }
  }

  console.log()
  console.log('━'.repeat(60))
  console.log(`✨ Cleanup complete!`)
  console.log(`   ✓ Deleted: ${successCount} folders`)
  console.log(`   ✗ Failed: ${failCount} folders`)
  console.log(`   ✓ Kept: ${foldersToKeep.length} folders (active sessions)`)
  console.log('━'.repeat(60))
}

main().catch(console.error)
