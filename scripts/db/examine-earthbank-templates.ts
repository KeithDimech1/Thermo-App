#!/usr/bin/env npx tsx
/**
 * Examine EarthBank Template Structures
 *
 * This script reads EarthBank Excel templates and displays their structure
 * to help build the import pipeline.
 *
 * Usage: npx tsx scripts/db/examine-earthbank-templates.ts
 */

import * as ExcelJS from 'exceljs';
import * as path from 'path';
import * as fs from 'fs';

const TEMPLATES_DIR = path.join(__dirname, '../../build-data/learning/archive/earthbanktemplates');

const TEMPLATES = [
  'FTDatapoint.template.v2024-11-11.xlsx',
  'HeDatapoint.template.v2024-11-11.xlsx',
  'Sample.template.v2025-04-16.xlsx',
  'GCDatapoint.template.v2024-11-11.xlsx'
];

interface TemplateInfo {
  filename: string;
  sheets: {
    name: string;
    columnCount: number;
    rowCount: number;
    columns: string[];
    sampleRows?: any[];
  }[];
}

async function examineTemplate(filename: string): Promise<TemplateInfo> {
  const filePath = path.join(TEMPLATES_DIR, filename);

  if (!fs.existsSync(filePath)) {
    throw new Error(`Template file not found: ${filePath}`);
  }

  // Read the Excel file
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);

  const info: TemplateInfo = {
    filename,
    sheets: []
  };

  // Examine each sheet
  for (const worksheet of workbook.worksheets) {
    const jsonData: any[][] = [];

    // Convert worksheet to 2D array
    worksheet.eachRow((row, rowNumber) => {
      const rowData: any[] = [];
      row.eachCell((cell, colNumber) => {
        rowData[colNumber - 1] = cell.value;
      });
      jsonData.push(rowData);
    });

    // Get column names (first row)
    const columns = (jsonData[0] as any[]) || [];

    // Get sample rows (first 3 data rows after header)
    const sampleRows = jsonData.slice(1, 4).map((row: any) => {
      const obj: any = {};
      columns.forEach((col: string, idx: number) => {
        if (col) {
          obj[col] = row[idx];
        }
      });
      return obj;
    });

    info.sheets.push({
      name: worksheet.name,
      columnCount: columns.length,
      rowCount: jsonData.length - 1, // Exclude header
      columns: columns.filter((col: string) => col), // Remove empty columns
      sampleRows
    });
  }

  return info;
}

async function main() {
  console.log('='.repeat(80));
  console.log('EarthBank Template Structure Analysis');
  console.log('='.repeat(80));
  console.log();

  for (const template of TEMPLATES) {
    try {
      console.log(`\n${'='.repeat(80)}`);
      console.log(`📄 ${template}`);
      console.log('='.repeat(80));

      const info = await examineTemplate(template);

      for (const sheet of info.sheets) {
        console.log(`\n📊 Sheet: "${sheet.name}"`);
        console.log(`   Columns: ${sheet.columnCount}`);
        console.log(`   Data Rows: ${sheet.rowCount}`);
        console.log();
        console.log('   Column Names:');

        // Group columns for better readability
        const chunks = [];
        for (let i = 0; i < sheet.columns.length; i += 3) {
          chunks.push(sheet.columns.slice(i, i + 3));
        }

        chunks.forEach((chunk, idx) => {
          const startNum = idx * 3 + 1;
          const items = chunk.map((col, i) => `${startNum + i}. ${col}`);
          console.log(`      ${items.join(' | ')}`);
        });

        // Show sample data if available
        if (sheet.sampleRows && sheet.sampleRows.length > 0) {
          console.log('\n   Sample Data (first row):');
          const firstRow = sheet.sampleRows[0];
          const sampleColumns = Object.keys(firstRow).slice(0, 5); // Show first 5 columns
          sampleColumns.forEach(col => {
            const value = firstRow[col];
            if (value !== undefined && value !== null && value !== '') {
              console.log(`      ${col}: ${value}`);
            }
          });
        }
      }

      console.log();
    } catch (error) {
      console.error(`❌ Error examining ${template}:`, error);
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log('Analysis Complete');
  console.log('='.repeat(80));
}

main().catch(console.error);
