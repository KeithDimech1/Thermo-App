#!/usr/bin/env npx tsx

/**
 * Export Database Schema
 *
 * Exports the database schema in a bones-only format (tables, columns, constraints only)
 */

import { query, closePool } from '../../lib/db/connection'
import { writeFileSync } from 'fs'

async function exportSchema() {
  console.log('Exporting database schema...')

  try {
    // Get all tables
    const tables = await query<{ tablename: string }>(`
      SELECT tablename
      FROM pg_tables
      WHERE schemaname = 'public'
      ORDER BY tablename
    `)

    let schema = `-- Database Schema Snapshot
-- Generated: ${new Date().toISOString()}
-- Tables: ${tables.length}

`

    for (const { tablename } of tables) {
      // Get columns for each table
      const columns = await query<any>(`
        SELECT
          column_name,
          data_type,
          character_maximum_length,
          is_nullable,
          column_default
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = $1
        ORDER BY ordinal_position
      `, [tablename])

      // Get constraints
      const constraints = await query<any>(`
        SELECT
          tc.constraint_name,
          tc.constraint_type,
          kcu.column_name,
          ccu.table_name AS foreign_table_name,
          ccu.column_name AS foreign_column_name
        FROM information_schema.table_constraints AS tc
        LEFT JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        LEFT JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
          AND ccu.table_schema = tc.table_schema
        WHERE tc.table_schema = 'public'
          AND tc.table_name = $1
        ORDER BY tc.constraint_type, tc.constraint_name
      `, [tablename])

      // Build CREATE TABLE statement
      schema += `\nCREATE TABLE ${tablename} (\n`

      columns.forEach((col, i) => {
        let colDef = `  ${col.column_name} ${col.data_type}`
        if (col.character_maximum_length) {
          colDef += `(${col.character_maximum_length})`
        }
        if (col.is_nullable === 'NO') {
          colDef += ' NOT NULL'
        }
        if (col.column_default) {
          colDef += ` DEFAULT ${col.column_default}`
        }
        if (i < columns.length - 1) {
          colDef += ','
        }
        schema += colDef + '\n'
      })

      schema += `);\n`

      // Add constraints
      const pkConstraints = constraints.filter((c: any) => c.constraint_type === 'PRIMARY KEY')
      const fkConstraints = constraints.filter((c: any) => c.constraint_type === 'FOREIGN KEY')

      if (pkConstraints.length > 0) {
        const pkCols = pkConstraints.map((c: any) => c.column_name).join(', ')
        schema += `\nALTER TABLE ${tablename} ADD CONSTRAINT ${pkConstraints[0].constraint_name} PRIMARY KEY (${pkCols});\n`
      }

      fkConstraints.forEach((fk: any) => {
        if (fk.foreign_table_name) {
          schema += `\nALTER TABLE ${tablename} ADD CONSTRAINT ${fk.constraint_name} FOREIGN KEY (${fk.column_name}) REFERENCES ${fk.foreign_table_name}(${fk.foreign_column_name});\n`
        }
      })
    }

    // Write to file
    const outputPath = 'readme/database/.schema-snapshot.sql'
    writeFileSync(outputPath, schema)

    console.log(`\n✓ Schema exported to: ${outputPath}`)
    console.log(`  Tables exported: ${tables.length}`)

    // Show summary
    console.log('\nTables:')
    tables.forEach(({ tablename }) => {
      console.log(`  - ${tablename}`)
    })

  } catch (error) {
    console.error('ERROR: Schema export failed')
    console.error(error)
    process.exit(1)
  } finally {
    await closePool()
  }
}

exportSchema()
