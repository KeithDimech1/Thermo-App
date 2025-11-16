/**
 * Generate Database Schema Excel Workbook
 *
 * Creates a comprehensive Excel file documenting the database schema:
 * - Overview/Summary
 * - Tables list with descriptions
 * - Relationships/Foreign keys
 * - Detailed schema for each table
 * - Data dictionary
 * - ERD reference
 *
 * Usage: npx tsx scripts/generate-database-excel.ts
 */

// Load environment variables
import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(process.cwd(), '.env.local') });

import ExcelJS from 'exceljs';
import { query } from '../lib/db/connection.js';
import * as path from 'path';

interface TableInfo {
  table_name: string;
  column_name: string;
  data_type: string;
  is_nullable: string;
  column_default: string | null;
  character_maximum_length: number | null;
}

interface ForeignKeyInfo {
  constraint_name: string;
  table_name: string;
  column_name: string;
  foreign_table_name: string;
  foreign_column_name: string;
}

interface TableDescription {
  table_name: string;
  purpose: string;
  estimated_rows: string;
}

async function generateDatabaseExcel() {
  console.log('📊 Generating Database Schema Excel Workbook...\n');

  // Create new workbook
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'QC Results Database';
  workbook.created = new Date();

  // Define table metadata
  const tableDescriptions: Record<string, TableDescription> = {
    'categories': {
      table_name: 'categories',
      purpose: 'Disease categories (TORCH, Hepatitis, etc.)',
      estimated_rows: '10-15'
    },
    'pathogens': {
      table_name: 'pathogens',
      purpose: 'Infectious agents (CMV, HIV, HCV, etc.)',
      estimated_rows: '20-30'
    },
    'markers': {
      table_name: 'markers',
      purpose: 'Test markers (antibodies, antigens, nucleic acids)',
      estimated_rows: '40-60'
    },
    'manufacturers': {
      table_name: 'manufacturers',
      purpose: 'Test kit manufacturers (Abbott, Roche, etc.)',
      estimated_rows: '15-25'
    },
    'assays': {
      table_name: 'assays',
      purpose: 'Diagnostic test systems and platforms',
      estimated_rows: '50-80'
    },
    'assay_lots': {
      table_name: 'assay_lots',
      purpose: 'Assay production batches with lot numbers',
      estimated_rows: '100-200'
    },
    'qc_samples': {
      table_name: 'qc_samples',
      purpose: 'Quality control materials used for testing',
      estimated_rows: '10-20'
    },
    'test_configurations': {
      table_name: 'test_configurations',
      purpose: 'Unique combinations of marker + assay + QC sample (CORE TABLE)',
      estimated_rows: '200-500'
    },
    'cv_measurements': {
      table_name: 'cv_measurements',
      purpose: 'Coefficient of variation performance metrics (1:1 with test_configurations)',
      estimated_rows: '200-500'
    }
  };

  // Get all table columns from database
  console.log('🔍 Fetching schema information...');
  const tableInfoSql = `
    SELECT
      table_name,
      column_name,
      data_type,
      is_nullable,
      column_default,
      character_maximum_length
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name IN (
        'categories', 'pathogens', 'markers', 'manufacturers',
        'assays', 'assay_lots', 'qc_samples', 'test_configurations',
        'cv_measurements'
      )
    ORDER BY table_name, ordinal_position
  `;

  const tableInfo = await query<TableInfo>(tableInfoSql);

  // Get foreign keys
  const foreignKeysSql = `
    SELECT
      tc.constraint_name,
      tc.table_name,
      kcu.column_name,
      ccu.table_name AS foreign_table_name,
      ccu.column_name AS foreign_column_name
    FROM information_schema.table_constraints AS tc
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
    WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_schema = 'public'
      AND tc.table_name IN (
        'categories', 'pathogens', 'markers', 'manufacturers',
        'assays', 'assay_lots', 'qc_samples', 'test_configurations',
        'cv_measurements'
      )
    ORDER BY tc.table_name, kcu.column_name
  `;

  const foreignKeys = await query<ForeignKeyInfo>(foreignKeysSql);

  console.log('✅ Schema information retrieved\n');

  // ============================================================================
  // SHEET 1: Overview
  // ============================================================================
  console.log('📄 Creating Overview sheet...');
  const overviewSheet = workbook.addWorksheet('Overview', {
    views: [{ state: 'frozen', xSplit: 0, ySplit: 1 }]
  });

  // Title
  overviewSheet.mergeCells('A1:F1');
  overviewSheet.getCell('A1').value = 'QC Results Database Schema';
  overviewSheet.getCell('A1').font = { size: 18, bold: true, color: { argb: 'FFFFFF' } };
  overviewSheet.getCell('A1').fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: '1976D2' }
  };
  overviewSheet.getCell('A1').alignment = { horizontal: 'center', vertical: 'middle' };
  overviewSheet.getRow(1).height = 30;

  // Metadata
  overviewSheet.addRow([]);
  overviewSheet.addRow(['Database:', 'Neon PostgreSQL']);
  overviewSheet.addRow(['Generated:', new Date().toISOString()]);
  overviewSheet.addRow(['Schema Version:', '1.0.0']);
  overviewSheet.addRow(['Total Tables:', '9']);
  overviewSheet.addRow(['Total Views:', '2']);
  overviewSheet.addRow([]);

  // Purpose
  overviewSheet.addRow(['Purpose:']).font = { bold: true, size: 12 };
  overviewSheet.addRow(['This database stores quality control (QC) performance data for diagnostic assays.']);
  overviewSheet.addRow(['It tracks coefficient of variation (CV) measurements to assess test reliability']);
  overviewSheet.addRow(['across multiple manufacturers, markers, and pathogens.']);
  overviewSheet.addRow([]);

  // Table summary header
  overviewSheet.addRow(['Table Summary']).font = { bold: true, size: 14 };
  const headerRow = overviewSheet.addRow(['Table Name', 'Purpose', 'Estimated Rows']);
  headerRow.font = { bold: true };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'E3F2FD' }
  };

  // Add tables
  const tables = [
    'categories', 'pathogens', 'markers', 'manufacturers',
    'assays', 'assay_lots', 'qc_samples', 'test_configurations',
    'cv_measurements'
  ];

  for (const tableName of tables) {
    const desc = tableDescriptions[tableName];
    overviewSheet.addRow([
      tableName,
      desc.purpose,
      desc.estimated_rows
    ]);
  }

  // Column widths
  overviewSheet.getColumn(1).width = 25;
  overviewSheet.getColumn(2).width = 60;
  overviewSheet.getColumn(3).width = 15;

  // ============================================================================
  // SHEET 2: All Tables Details
  // ============================================================================
  console.log('📄 Creating Tables Details sheet...');
  const tablesSheet = workbook.addWorksheet('Tables Details', {
    views: [{ state: 'frozen', xSplit: 0, ySplit: 1 }]
  });

  const tablesHeaderRow = tablesSheet.addRow([
    'Table Name',
    'Column Name',
    'Data Type',
    'Nullable',
    'Default',
    'Max Length',
    'Description'
  ]);
  tablesHeaderRow.font = { bold: true, color: { argb: 'FFFFFF' } };
  tablesHeaderRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: '1976D2' }
  };

  // Group by table
  const groupedTables = tableInfo.reduce((acc, row) => {
    if (!acc[row.table_name]) acc[row.table_name] = [];
    acc[row.table_name].push(row);
    return acc;
  }, {} as Record<string, TableInfo[]>);

  for (const tableName of tables) {
    const columns = groupedTables[tableName] || [];

    for (const col of columns) {
      let description = '';

      // Add context based on column name
      if (col.column_name === 'id') description = 'Primary Key';
      else if (col.column_name.endsWith('_id')) description = 'Foreign Key';
      else if (col.column_name === 'created_at') description = 'Timestamp when record was created';
      else if (col.column_name === 'updated_at') description = 'Timestamp when record was last updated';
      else if (col.column_name === 'name') description = 'Human-readable name';

      tablesSheet.addRow([
        tableName,
        col.column_name,
        col.data_type,
        col.is_nullable === 'YES' ? 'Yes' : 'No',
        col.column_default || '',
        col.character_maximum_length || '',
        description
      ]);
    }

    // Add separator row
    tablesSheet.addRow([]);
  }

  // Column widths
  tablesSheet.getColumn(1).width = 25;
  tablesSheet.getColumn(2).width = 25;
  tablesSheet.getColumn(3).width = 15;
  tablesSheet.getColumn(4).width = 10;
  tablesSheet.getColumn(5).width = 20;
  tablesSheet.getColumn(6).width = 12;
  tablesSheet.getColumn(7).width = 40;

  // ============================================================================
  // SHEET 3: Relationships (Foreign Keys)
  // ============================================================================
  console.log('📄 Creating Relationships sheet...');
  const relationshipsSheet = workbook.addWorksheet('Relationships', {
    views: [{ state: 'frozen', xSplit: 0, ySplit: 1 }]
  });

  const relHeaderRow = relationshipsSheet.addRow([
    'From Table',
    'From Column',
    'To Table',
    'To Column',
    'Relationship Type',
    'Constraint Name'
  ]);
  relHeaderRow.font = { bold: true, color: { argb: 'FFFFFF' } };
  relHeaderRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'F57C00' }
  };

  for (const fk of foreignKeys) {
    relationshipsSheet.addRow([
      fk.table_name,
      fk.column_name,
      fk.foreign_table_name,
      fk.foreign_column_name,
      'many:1',
      fk.constraint_name
    ]);
  }

  // Column widths
  relationshipsSheet.getColumn(1).width = 25;
  relationshipsSheet.getColumn(2).width = 25;
  relationshipsSheet.getColumn(3).width = 25;
  relationshipsSheet.getColumn(4).width = 25;
  relationshipsSheet.getColumn(5).width = 15;
  relationshipsSheet.getColumn(6).width = 35;

  // ============================================================================
  // SHEET 4: Individual Table Sheets
  // ============================================================================
  console.log('📄 Creating individual table sheets...');

  for (const tableName of tables) {
    const columns = groupedTables[tableName] || [];
    const desc = tableDescriptions[tableName];

    const sheet = workbook.addWorksheet(tableName, {
      views: [{ state: 'frozen', xSplit: 0, ySplit: 3 }]
    });

    // Title
    sheet.mergeCells('A1:E1');
    sheet.getCell('A1').value = `Table: ${tableName}`;
    sheet.getCell('A1').font = { size: 16, bold: true, color: { argb: 'FFFFFF' } };
    sheet.getCell('A1').fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '388E3C' }
    };
    sheet.getCell('A1').alignment = { horizontal: 'center' };

    // Metadata
    sheet.addRow(['Purpose:', desc.purpose]);
    sheet.addRow(['Estimated Rows:', desc.estimated_rows]);
    sheet.addRow([]);

    // Column header
    const colHeaderRow = sheet.addRow([
      'Column Name',
      'Data Type',
      'Nullable',
      'Default',
      'Key Type'
    ]);
    colHeaderRow.font = { bold: true };
    colHeaderRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'E8F5E9' }
    };

    // Add columns
    for (const col of columns) {
      let keyType = '';
      if (col.column_name === 'id') keyType = 'PRIMARY KEY';
      else if (col.column_name.endsWith('_id')) {
        const fk = foreignKeys.find(
          fk => fk.table_name === tableName && fk.column_name === col.column_name
        );
        if (fk) {
          keyType = `FK → ${fk.foreign_table_name}.${fk.foreign_column_name}`;
        }
      }

      sheet.addRow([
        col.column_name,
        col.data_type,
        col.is_nullable === 'YES' ? 'Yes' : 'No',
        col.column_default || '',
        keyType
      ]);
    }

    // Column widths
    sheet.getColumn(1).width = 25;
    sheet.getColumn(2).width = 20;
    sheet.getColumn(3).width = 10;
    sheet.getColumn(4).width = 25;
    sheet.getColumn(5).width = 35;
  }

  // ============================================================================
  // SHEET 5: ERD Reference
  // ============================================================================
  console.log('📄 Creating ERD Reference sheet...');
  const erdSheet = workbook.addWorksheet('ERD Reference', {
    views: [{ state: 'frozen', xSplit: 0, ySplit: 1 }]
  });

  erdSheet.mergeCells('A1:D1');
  erdSheet.getCell('A1').value = 'Entity Relationship Diagram Reference';
  erdSheet.getCell('A1').font = { size: 16, bold: true, color: { argb: 'FFFFFF' } };
  erdSheet.getCell('A1').fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: '7B1FA2' }
  };
  erdSheet.getCell('A1').alignment = { horizontal: 'center' };
  erdSheet.getRow(1).height = 30;

  erdSheet.addRow([]);
  erdSheet.addRow(['Visual ERD Files:']).font = { bold: true, size: 12 };
  erdSheet.addRow(['• readme/database/ERD-diagram.png']);
  erdSheet.addRow(['• readme/database/ERD-diagram.svg']);
  erdSheet.addRow(['• readme/database/ENTITY_RELATIONSHIP_DIAGRAM.md']);
  erdSheet.addRow([]);

  erdSheet.addRow(['Key Relationships:']).font = { bold: true, size: 12 };
  erdSheet.addRow([]);

  const erdHeaderRow = erdSheet.addRow(['Parent Table', 'Child Table', 'Relationship', 'Description']);
  erdHeaderRow.font = { bold: true };
  erdHeaderRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'E1BEE7' }
  };

  const relationships = [
    ['categories', 'pathogens', '1:many', 'One category has many pathogens'],
    ['categories', 'markers', '1:many', 'One category has many markers (denormalized)'],
    ['pathogens', 'markers', '1:many', 'One pathogen has many markers'],
    ['manufacturers', 'assays', '1:many', 'One manufacturer produces many assays'],
    ['assays', 'assay_lots', '1:many', 'One assay has many production lots'],
    ['markers', 'test_configurations', '1:many', 'One marker tested by many configs'],
    ['assays', 'test_configurations', '1:many', 'One assay used in many configs'],
    ['qc_samples', 'test_configurations', '1:many', 'One QC sample used in many configs'],
    ['assay_lots', 'test_configurations', '1:many', 'One lot used in many configs (optional)'],
    ['test_configurations', 'cv_measurements', '1:1', 'Each config has exactly one measurement set']
  ];

  for (const [parent, child, rel, desc] of relationships) {
    erdSheet.addRow([parent, child, rel, desc]);
  }

  erdSheet.getColumn(1).width = 25;
  erdSheet.getColumn(2).width = 25;
  erdSheet.getColumn(3).width = 15;
  erdSheet.getColumn(4).width = 50;

  // ============================================================================
  // Save workbook
  // ============================================================================
  const outputPath = path.join(process.cwd(), 'readme/database/DATABASE_SCHEMA.xlsx');
  await workbook.xlsx.writeFile(outputPath);

  console.log('\n✅ Excel workbook generated successfully!');
  console.log(`📁 File: ${outputPath}`);
  console.log('\n📊 Sheets created:');
  console.log('  1. Overview - Database summary and table list');
  console.log('  2. Tables Details - All columns for all tables');
  console.log('  3. Relationships - Foreign key relationships');
  console.log('  4-12. Individual table sheets (9 tables)');
  console.log('  13. ERD Reference - Entity relationship diagram info');
  console.log('\n✨ Total sheets:', workbook.worksheets.length);

  process.exit(0);
}

// Run generator
generateDatabaseExcel().catch(error => {
  console.error('❌ Error generating Excel:', error);
  process.exit(1);
});
