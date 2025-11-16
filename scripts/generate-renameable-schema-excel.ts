/**
 * Generate Renameable Database Schema Excel Workbook
 *
 * Creates an Excel file with:
 * 1. RENAME SHEET (front) - Edit table/column names here
 * 2. All other documentation sheets with current names
 * 3. Companion script to process renames and generate SQL migrations
 *
 * Workflow:
 * 1. Open Excel, go to "Schema Rename" sheet
 * 2. Enter new names in "Proposed New Name" column
 * 3. Save Excel file
 * 4. Run: npx tsx scripts/process-schema-renames.ts
 * 5. Review generated SQL migration and updated documentation
 *
 * Usage: npx tsx scripts/generate-renameable-schema-excel.ts
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

async function generateRenameableSchemaExcel() {
  console.log('📊 Generating Renameable Database Schema Excel Workbook...\n');

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
  // SHEET 1: SCHEMA RENAME (PRIMARY SHEET - EDIT HERE!)
  // ============================================================================
  console.log('📝 Creating Schema Rename sheet (PRIMARY EDITING SHEET)...');
  const renameSheet = workbook.addWorksheet('🔧 Schema Rename', {
    views: [{ state: 'frozen', xSplit: 0, ySplit: 3 }]
  });

  // Title and instructions
  renameSheet.mergeCells('A1:G1');
  renameSheet.getCell('A1').value = '🔧 SCHEMA RENAME WORKSHEET - Edit Names Here';
  renameSheet.getCell('A1').font = { size: 18, bold: true, color: { argb: 'FFFFFF' } };
  renameSheet.getCell('A1').fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'D32F2F' }
  };
  renameSheet.getCell('A1').alignment = { horizontal: 'center', vertical: 'middle' };
  renameSheet.getRow(1).height = 35;

  // Instructions
  renameSheet.mergeCells('A2:G2');
  const instructionsCell = renameSheet.getCell('A2');
  instructionsCell.value = '📋 INSTRUCTIONS: Enter new names in "Proposed New Name" column, save file, then run: npx tsx scripts/process-schema-renames.ts';
  instructionsCell.font = { size: 11, italic: true };
  instructionsCell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFF3E0' }
  };
  instructionsCell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
  renameSheet.getRow(2).height = 30;

  renameSheet.addRow([]);

  // Headers
  const renameHeaderRow = renameSheet.addRow([
    'Type',
    'Table',
    'Current Name',
    'Current Description',
    'Proposed New Name',
    'Data Type',
    'Status'
  ]);
  renameHeaderRow.font = { bold: true, color: { argb: 'FFFFFF' } };
  renameHeaderRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: '1976D2' }
  };
  renameHeaderRow.height = 25;

  // Add table renames first
  const tables = [
    'categories', 'pathogens', 'markers', 'manufacturers',
    'assays', 'assay_lots', 'qc_samples', 'test_configurations',
    'cv_measurements'
  ];

  let rowNum = 5;
  for (const tableName of tables) {
    const desc = tableDescriptions[tableName];
    const row = renameSheet.addRow([
      'TABLE',
      '',
      tableName,
      desc.purpose,
      '', // Proposed new name - user edits this
      '',
      'Current'
    ]);

    // Highlight editable cell
    row.getCell(5).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'E8F5E9' }
    };

    // Bold table rows
    row.font = { bold: true };
    rowNum++;
  }

  // Add separator
  renameSheet.addRow([]);
  rowNum++;

  // Add column renames
  const groupedTables = tableInfo.reduce((acc, row) => {
    if (!acc[row.table_name]) acc[row.table_name] = [];
    acc[row.table_name].push(row);
    return acc;
  }, {} as Record<string, TableInfo[]>);

  // Technical descriptions for common columns
  const getColumnDescription = (tableName: string, columnName: string): string => {
    // Generic columns
    if (columnName === 'id') return 'Auto-incrementing primary key';
    if (columnName === 'created_at') return 'Timestamp when record created';
    if (columnName === 'updated_at') return 'Timestamp when record last modified';
    if (columnName === 'name') return 'Human-readable identifier';

    // Foreign keys
    if (columnName === 'category_id') return 'FK to categories table';
    if (columnName === 'pathogen_id') return 'FK to pathogens table';
    if (columnName === 'marker_id') return 'FK to markers table';
    if (columnName === 'manufacturer_id') return 'FK to manufacturers table';
    if (columnName === 'assay_id') return 'FK to assays table';
    if (columnName === 'assay_lot_id') return 'FK to assay_lots table (optional)';
    if (columnName === 'qc_sample_id') return 'FK to qc_samples table';
    if (columnName === 'test_config_id') return 'FK to test_configurations table (1:1)';

    // Specific columns by table
    if (tableName === 'categories') {
      if (columnName === 'description') return 'Detailed category description';
    }
    if (tableName === 'pathogens') {
      if (columnName === 'abbreviation') return 'Short code (e.g., CMV, HIV, HCV)';
      if (columnName === 'scientific_name') return 'Latin/scientific pathogen name';
      if (columnName === 'transmission_route') return 'How pathogen spreads (e.g., blood, airborne)';
      if (columnName === 'clinical_significance') return 'Medical importance and impact';
    }
    if (tableName === 'markers') {
      if (columnName === 'antibody_type') return 'IgG, IgM, Total, or Antigen';
      if (columnName === 'marker_type') return 'Antibody, Antigen, or Nucleic Acid';
      if (columnName === 'clinical_use') return 'When this marker is clinically used';
      if (columnName === 'interpretation_positive') return 'What a positive result means';
      if (columnName === 'interpretation_negative') return 'What a negative result means';
    }
    if (tableName === 'manufacturers') {
      if (columnName === 'country') return 'Country of origin';
      if (columnName === 'website') return 'Company website URL';
      if (columnName === 'total_assays') return 'Count of assays from this manufacturer';
    }
    if (tableName === 'assays') {
      if (columnName === 'platform') return 'Instrument/analyzer name (e.g., ARCHITECT)';
      if (columnName === 'methodology') return 'Test method (CLIA, ELISA, PCR, etc.)';
      if (columnName === 'automation_level') return 'Fully/Semi/Manual automation';
      if (columnName === 'throughput') return 'Testing capacity (High/Medium/Low)';
    }
    if (tableName === 'assay_lots') {
      if (columnName === 'lot_number') return 'Manufacturer batch/lot identifier';
      if (columnName === 'manufacture_date') return 'When lot was produced';
      if (columnName === 'expiration_date') return 'When lot expires';
      if (columnName === 'qc_release_date') return 'When lot passed QC and released';
      if (columnName === 'notes') return 'Additional lot information';
    }
    if (tableName === 'qc_samples') {
      if (columnName === 'manufacturer') return 'QC sample vendor (e.g., Bio-Rad)';
      if (columnName === 'lot_number') return 'QC sample lot identifier';
      if (columnName === 'matrix_type') return 'Sample type (Serum, Plasma, etc.)';
      if (columnName === 'concentration_level') return 'Analyte level (High/Medium/Low)';
      if (columnName === 'expiration_date') return 'When QC sample expires';
      if (columnName === 'notes') return 'Additional QC sample information';
    }
    if (tableName === 'test_configurations') {
      if (columnName === 'test_type') return 'serology, nat, or both';
      if (columnName === 'quality_rating') return 'excellent, good, acceptable, poor, unknown';
      if (columnName === 'events_examined') return 'Number of test runs analyzed';
      if (columnName === 'include_in_analysis') return 'Boolean: include in curated dataset';
      if (columnName === 'notes') return 'Additional configuration notes';
    }
    if (tableName === 'cv_measurements') {
      if (columnName === 'cv_lt_10_count') return 'Number of results with CV <10%';
      if (columnName === 'cv_lt_10_percentage') return '% of results with CV <10% (excellent)';
      if (columnName === 'cv_10_15_count') return 'Number of results with CV 10-15%';
      if (columnName === 'cv_10_15_percentage') return '% of results with CV 10-15% (good)';
      if (columnName === 'cv_15_20_count') return 'Number of results with CV 15-20%';
      if (columnName === 'cv_15_20_percentage') return '% of results with CV 15-20% (acceptable)';
      if (columnName === 'cv_gt_20_count') return 'Number of results with CV >20%';
      if (columnName === 'cv_gt_20_percentage') return '% of results with CV >20% (poor)';
      if (columnName === 'mean_cv') return 'Average CV across all measurements';
      if (columnName === 'median_cv') return 'Median CV (50th percentile)';
      if (columnName === 'std_dev_cv') return 'Standard deviation of CV values';
      if (columnName === 'measurement_date') return 'When CV measurements were taken';
    }

    return '';
  };

  for (const tableName of tables) {
    const columns = groupedTables[tableName] || [];

    for (const col of columns) {
      const description = getColumnDescription(tableName, col.column_name);

      const row = renameSheet.addRow([
        'COL',
        tableName,
        col.column_name,
        description,
        '', // Proposed new name - user edits this
        col.data_type,
        'Current'
      ]);

      // Highlight editable cell
      row.getCell(5).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFF9C4' }
      };
      rowNum++;
    }

    // Add separator between tables
    renameSheet.addRow([]);
    rowNum++;
  }

  // Column widths
  renameSheet.getColumn(1).width = 8;   // Type
  renameSheet.getColumn(2).width = 25;  // Table
  renameSheet.getColumn(3).width = 28;  // Current Name
  renameSheet.getColumn(4).width = 55;  // Current Description
  renameSheet.getColumn(5).width = 35;  // Proposed New Name (EDITABLE)
  renameSheet.getColumn(6).width = 15;  // Data Type
  renameSheet.getColumn(7).width = 12;  // Status

  // Add legend at bottom
  const legendStartRow = rowNum + 2;
  renameSheet.mergeCells(`A${legendStartRow}:B${legendStartRow}`);
  renameSheet.getCell(`A${legendStartRow}`).value = 'LEGEND:';
  renameSheet.getCell(`A${legendStartRow}`).font = { bold: true };

  renameSheet.getCell(`A${legendStartRow + 1}`).value = 'Green cells =';
  renameSheet.getCell(`B${legendStartRow + 1}`).value = 'Edit table names here';
  renameSheet.getCell(`B${legendStartRow + 1}`).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'E8F5E9' }
  };

  renameSheet.getCell(`A${legendStartRow + 2}`).value = 'Yellow cells =';
  renameSheet.getCell(`B${legendStartRow + 2}`).value = 'Edit column names here';
  renameSheet.getCell(`B${legendStartRow + 2}`).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFF9C4' }
  };

  // ============================================================================
  // SHEET 2: Overview
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
  // Save workbook
  // ============================================================================
  const outputPath = path.join(process.cwd(), 'readme/database/DATABASE_SCHEMA_RENAMEABLE.xlsx');
  await workbook.xlsx.writeFile(outputPath);

  console.log('\n✅ Renameable Excel workbook generated successfully!');
  console.log(`📁 File: ${outputPath}`);
  console.log('\n📊 Sheets created:');
  console.log('  1. 🔧 Schema Rename - ⭐ EDIT TABLE/COLUMN NAMES HERE ⭐');
  console.log('  2. Overview - Database summary');
  console.log('  3. Relationships - Foreign key relationships');
  console.log('\n📝 Next Steps:');
  console.log('  1. Open the Excel file');
  console.log('  2. Go to "🔧 Schema Rename" sheet');
  console.log('  3. Enter new names in "Proposed New Name" column (highlighted cells)');
  console.log('  4. Save the file');
  console.log('  5. Run: npx tsx scripts/process-schema-renames.ts');
  console.log('  6. Review generated SQL migration and updated docs');

  process.exit(0);
}

// Run generator
generateRenameableSchemaExcel().catch(error => {
  console.error('❌ Error generating Excel:', error);
  process.exit(1);
});
