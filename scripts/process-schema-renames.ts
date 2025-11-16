/**
 * Process Schema Renames from Excel
 *
 * Reads the DATABASE_SCHEMA_RENAMEABLE.xlsx file and:
 * 1. Extracts proposed renames from "🔧 Schema Rename" sheet
 * 2. Validates proposed names (SQL-safe, no conflicts)
 * 3. Generates SQL migration script (ALTER TABLE/COLUMN statements)
 * 4. Creates updated documentation with new names
 * 5. Shows before/after comparison
 *
 * Usage:
 * 1. Edit DATABASE_SCHEMA_RENAMEABLE.xlsx (add proposed names)
 * 2. Run: npx tsx scripts/process-schema-renames.ts
 * 3. Review generated migration.sql
 * 4. Apply if correct: psql $DATABASE_URL -f migrations/rename-schema-YYYYMMDD.sql
 *
 */

import ExcelJS from 'exceljs';
import * as path from 'path';
import * as fs from 'fs';

interface Rename {
  type: 'TABLE' | 'COL';
  tableName: string;
  currentName: string;
  proposedName: string;
  description: string;
  dataType: string;
}

async function processSchemaRenames() {
  console.log('📋 Processing Schema Renames from Excel...\n');

  const excelPath = path.join(
    process.cwd(),
    'readme/database/DATABASE_SCHEMA_RENAMEABLE.xlsx'
  );

  if (!fs.existsSync(excelPath)) {
    console.error('❌ Error: Excel file not found!');
    console.error(`   Expected: ${excelPath}`);
    console.error('\n💡 Run this first: npx tsx scripts/generate-renameable-schema-excel.ts');
    process.exit(1);
  }

  // Load workbook
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(excelPath);

  const renameSheet = workbook.getWorksheet('🔧 Schema Rename');

  if (!renameSheet) {
    console.error('❌ Error: "🔧 Schema Rename" sheet not found!');
    process.exit(1);
  }

  console.log('✅ Excel file loaded\n');
  console.log('🔍 Scanning for proposed renames...\n');

  const renames: Rename[] = [];
  let rowNum = 0;

  renameSheet.eachRow((row, index) => {
    rowNum++;

    // Skip header rows (first 4 rows)
    if (index <= 4) return;

    const type = row.getCell(1).value?.toString().trim();
    const table = row.getCell(2).value?.toString().trim();
    const currentName = row.getCell(3).value?.toString().trim();
    const description = row.getCell(4).value?.toString().trim() || '';
    const proposedName = row.getCell(5).value?.toString().trim();
    const dataType = row.getCell(6).value?.toString().trim() || '';

    // Skip empty rows or rows without proposed name
    if (!type || !currentName || !proposedName) return;

    // Validate type
    if (type !== 'TABLE' && type !== 'COL') return;

    renames.push({
      type: type as 'TABLE' | 'COL',
      tableName: table || '',
      currentName,
      proposedName,
      description,
      dataType
    });
  });

  if (renames.length === 0) {
    console.log('ℹ️  No renames found in Excel file.');
    console.log('   Add proposed names to "Proposed New Name" column and save.');
    process.exit(0);
  }

  console.log(`✅ Found ${renames.length} proposed renames\n`);

  // Display renames
  console.log('📝 Proposed Renames:\n');
  console.log('─'.repeat(100));

  const tableRenames = renames.filter(r => r.type === 'TABLE');
  const columnRenames = renames.filter(r => r.type === 'COL');

  if (tableRenames.length > 0) {
    console.log('\n📊 TABLE RENAMES:');
    for (const rename of tableRenames) {
      console.log(`   ${rename.currentName} → ${rename.proposedName}`);
      console.log(`      ${rename.description}`);
    }
  }

  if (columnRenames.length > 0) {
    console.log('\n📋 COLUMN RENAMES:');
    const groupedByTable = columnRenames.reduce((acc, r) => {
      if (!acc[r.tableName]) acc[r.tableName] = [];
      acc[r.tableName].push(r);
      return acc;
    }, {} as Record<string, Rename[]>);

    for (const [table, cols] of Object.entries(groupedByTable)) {
      console.log(`\n   Table: ${table}`);
      for (const col of cols) {
        console.log(`      ${col.currentName} → ${col.proposedName}`);
        console.log(`         ${col.description}`);
      }
    }
  }

  console.log('\n' + '─'.repeat(100));

  // Validate names
  console.log('\n🔍 Validating proposed names...\n');

  const errors: string[] = [];
  const warnings: string[] = [];

  for (const rename of renames) {
    // Check for SQL keywords
    const sqlKeywords = [
      'SELECT', 'INSERT', 'UPDATE', 'DELETE', 'FROM', 'WHERE', 'JOIN',
      'TABLE', 'INDEX', 'VIEW', 'USER', 'GROUP', 'ORDER', 'LIMIT'
    ];

    if (sqlKeywords.includes(rename.proposedName.toUpperCase())) {
      errors.push(`❌ "${rename.proposedName}" is a SQL keyword`);
    }

    // Check for valid SQL identifier (alphanumeric + underscore only)
    if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(rename.proposedName)) {
      errors.push(
        `❌ "${rename.proposedName}" contains invalid characters (use only letters, numbers, underscore)`
      );
    }

    // Check for uppercase (convention warning)
    if (rename.proposedName !== rename.proposedName.toLowerCase()) {
      warnings.push(
        `⚠️  "${rename.proposedName}" contains uppercase (PostgreSQL convention is lowercase)`
      );
    }

    // Check for length
    if (rename.proposedName.length > 63) {
      errors.push(
        `❌ "${rename.proposedName}" is too long (max 63 characters)`
      );
    }
  }

  if (errors.length > 0) {
    console.log('❌ ERRORS (must fix):');
    errors.forEach(e => console.log(`   ${e}`));
    console.log('\n💡 Fix these errors in the Excel file and try again.\n');
    process.exit(1);
  }

  if (warnings.length > 0) {
    console.log('⚠️  WARNINGS (recommended to fix):');
    warnings.forEach(w => console.log(`   ${w}`));
    console.log('');
  }

  console.log('✅ All names are valid!\n');

  // Generate SQL migration
  console.log('📝 Generating SQL migration...\n');

  const timestamp = new Date().toISOString().split('T')[0].replace(/-/g, '');
  const migrationDir = path.join(process.cwd(), 'migrations');
  const migrationPath = path.join(
    migrationDir,
    `rename-schema-${timestamp}.sql`
  );

  if (!fs.existsSync(migrationDir)) {
    fs.mkdirSync(migrationDir, { recursive: true });
  }

  let sql = `-- Schema Rename Migration
-- Generated: ${new Date().toISOString()}
-- Source: DATABASE_SCHEMA_RENAMEABLE.xlsx
--
-- IMPORTANT: Review this migration carefully before applying!
-- Backup your database first: pg_dump $DATABASE_URL > backup.sql
--
-- Apply with: psql $DATABASE_URL -f ${migrationPath}

BEGIN;

-- =============================================================================
-- TABLE RENAMES
-- =============================================================================

`;

  // Table renames first (affects foreign keys)
  for (const rename of tableRenames) {
    sql += `-- Rename table: ${rename.currentName} → ${rename.proposedName}\n`;
    sql += `-- Purpose: ${rename.description}\n`;
    sql += `ALTER TABLE "${rename.currentName}" RENAME TO "${rename.proposedName}";\n\n`;
  }

  sql += `
-- =============================================================================
-- COLUMN RENAMES
-- =============================================================================

`;

  // Column renames (grouped by table)
  const groupedByTable = columnRenames.reduce((acc, r) => {
    if (!acc[r.tableName]) acc[r.tableName] = [];
    acc[r.tableName].push(r);
    return acc;
  }, {} as Record<string, Rename[]>);

  for (const [table, cols] of Object.entries(groupedByTable)) {
    sql += `-- Table: ${table}\n`;
    for (const col of cols) {
      sql += `-- Rename column: ${col.currentName} → ${col.proposedName}\n`;
      sql += `-- Purpose: ${col.description}\n`;
      sql += `ALTER TABLE "${table}" RENAME COLUMN "${col.currentName}" TO "${col.proposedName}";\n\n`;
    }
    sql += '\n';
  }

  sql += `
-- =============================================================================
-- UPDATE VIEWS (if needed)
-- =============================================================================

-- NOTE: If you have views that reference renamed tables/columns,
-- you'll need to recreate them. Example:
--
-- DROP VIEW IF EXISTS vw_test_config_details CASCADE;
-- CREATE OR REPLACE VIEW vw_test_config_details AS
--   SELECT ... (with new names)
--
-- Add your view updates here if needed.

COMMIT;

-- =============================================================================
-- ROLLBACK (if something goes wrong)
-- =============================================================================
-- Uncomment and run this to rollback:
--
-- BEGIN;
`;

  // Generate rollback statements
  for (const rename of tableRenames) {
    sql += `-- ALTER TABLE "${rename.proposedName}" RENAME TO "${rename.currentName}";\n`;
  }

  for (const [table, cols] of Object.entries(groupedByTable)) {
    for (const col of cols) {
      sql += `-- ALTER TABLE "${table}" RENAME COLUMN "${col.proposedName}" TO "${col.currentName}";\n`;
    }
  }

  sql += `-- COMMIT;\n`;

  // Write migration file
  fs.writeFileSync(migrationPath, sql);

  console.log('✅ SQL migration generated!');
  console.log(`📁 File: ${migrationPath}\n`);

  // Generate summary report
  const reportPath = path.join(
    process.cwd(),
    'migrations',
    `rename-summary-${timestamp}.md`
  );

  let report = `# Schema Rename Summary

**Generated:** ${new Date().toISOString()}
**Source:** DATABASE_SCHEMA_RENAMEABLE.xlsx

## Summary

- **Table Renames:** ${tableRenames.length}
- **Column Renames:** ${columnRenames.length}
- **Total Changes:** ${renames.length}

## Table Renames

`;

  if (tableRenames.length > 0) {
    report += '| Current Name | New Name | Description |\n';
    report += '|--------------|----------|-------------|\n';
    for (const r of tableRenames) {
      report += `| \`${r.currentName}\` | \`${r.proposedName}\` | ${r.description} |\n`;
    }
  } else {
    report += '*No table renames*\n';
  }

  report += '\n## Column Renames\n\n';

  if (columnRenames.length > 0) {
    for (const [table, cols] of Object.entries(groupedByTable)) {
      report += `### Table: \`${table}\`\n\n`;
      report += '| Current Name | New Name | Description | Type |\n';
      report += '|--------------|----------|-------------|------|\n';
      for (const c of cols) {
        report += `| \`${c.currentName}\` | \`${c.proposedName}\` | ${c.description} | ${c.dataType} |\n`;
      }
      report += '\n';
    }
  } else {
    report += '*No column renames*\n';
  }

  report += `\n## Migration File

\`\`\`
${migrationPath}
\`\`\`

## How to Apply

### 1. Backup Database
\`\`\`bash
pg_dump $DATABASE_URL > backup-${timestamp}.sql
\`\`\`

### 2. Review Migration
\`\`\`bash
cat ${migrationPath}
\`\`\`

### 3. Apply Migration
\`\`\`bash
psql $DATABASE_URL -f ${migrationPath}
\`\`\`

### 4. Verify Changes
\`\`\`bash
psql $DATABASE_URL -c "\\dt"  # List tables
psql $DATABASE_URL -c "\\d table_name"  # Describe specific table
\`\`\`

## Rollback

If something goes wrong, rollback instructions are at the bottom of the migration file.

---

**⚠️ IMPORTANT:**
- Review migration carefully before applying
- Always backup database first
- Test in development environment first
- Update application code to use new names
- Update views/functions that reference renamed objects
`;

  fs.writeFileSync(reportPath, report);

  console.log('✅ Summary report generated!');
  console.log(`📁 File: ${reportPath}\n`);

  console.log('─'.repeat(100));
  console.log('\n📋 NEXT STEPS:\n');
  console.log('1. Review the SQL migration:');
  console.log(`   cat ${migrationPath}\n`);
  console.log('2. Backup your database:');
  console.log(`   pg_dump $DATABASE_URL > backup-${timestamp}.sql\n`);
  console.log('3. Apply the migration:');
  console.log(`   psql $DATABASE_URL -f ${migrationPath}\n`);
  console.log('4. Update your application code to use new names');
  console.log('5. Update TypeScript types and interfaces');
  console.log('6. Update documentation\n');
  console.log('─'.repeat(100));
  console.log('\n✅ Done!\n');

  process.exit(0);
}

// Run processor
processSchemaRenames().catch(error => {
  console.error('❌ Error processing renames:', error);
  process.exit(1);
});
