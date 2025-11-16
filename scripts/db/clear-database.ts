#!/usr/bin/env npx tsx

/**
 * Clear Database Script
 *
 * Clears all data from the thermochronology database while keeping schema intact
 * WARNING: This operation cannot be undone! Make a backup first!
 */

import { getPool, closePool } from '../../lib/db/connection'

async function clearDatabase() {
  console.log('========================================')
  console.log('Clear Database')
  console.log('========================================')
  console.log('')
  console.log('⚠️  WARNING: Clearing ALL data!')
  console.log('   Schema will remain intact (tables, views, triggers)')
  console.log('')

  try {
    const pool = getPool()
    const client = await pool.connect()

    try {
      await client.query('BEGIN')

      console.log('Truncating tables (CASCADE will handle foreign keys)...')
      await client.query('TRUNCATE TABLE datasets CASCADE')

      console.log('Resetting sequences...')
      await client.query('ALTER SEQUENCE datasets_id_seq RESTART WITH 1')
      await client.query('ALTER SEQUENCE ft_counts_id_seq RESTART WITH 1')
      await client.query('ALTER SEQUENCE ft_track_lengths_id_seq RESTART WITH 1')
      await client.query('ALTER SEQUENCE ft_ages_id_seq RESTART WITH 1')
      await client.query('ALTER SEQUENCE ahe_grain_data_id_seq RESTART WITH 1')

      await client.query('COMMIT')

      console.log('')
      console.log('✓ Database cleared successfully!')
      console.log('')
      console.log('All tables are now empty.')
      console.log('Schema (tables, views, triggers) remains intact.')
      console.log('')
      console.log('========================================')

    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    } finally {
      client.release()
    }

  } catch (error) {
    console.error('ERROR: Clear operation failed')
    console.error(error)
    process.exit(1)
  } finally {
    await closePool()
  }
}

clearDatabase()
