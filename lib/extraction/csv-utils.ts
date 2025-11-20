/**
 * CSV Generation and Validation Utilities for IDEA-015 Phase 3
 * Handles CSV parsing, validation, and field mapping
 */

import type { TableMapping } from './field-mappings';
import { validateFieldValue } from './field-mappings';

/**
 * Generate field mapping description for Claude prompt
 */
export function generateFieldMappingDescription(mapping: TableMapping): string {
  let description = `**Table: ${mapping.tableName}** - ${mapping.description}\n\n`;
  description += `**Fields:**\n\n`;

  for (const field of mapping.fields) {
    description += `- **${field.earthbankField}**${field.required ? ' (REQUIRED)' : ''}\n`;
    description += `  - Description: ${field.description}\n`;
    description += `  - Data Type: ${field.dataType}\n`;
    if (field.unit) {
      description += `  - Unit: ${field.unit}\n`;
    }
    description += `  - Common aliases: ${field.aliases.join(', ')}\n`;

    if (field.validationRules) {
      const rules: string[] = [];
      if (field.validationRules.min !== undefined) {
        rules.push(`min: ${field.validationRules.min}`);
      }
      if (field.validationRules.max !== undefined) {
        rules.push(`max: ${field.validationRules.max}`);
      }
      if (field.validationRules.pattern) {
        rules.push(`pattern: ${field.validationRules.pattern}`);
      }
      if (rules.length > 0) {
        description += `  - Validation: ${rules.join(', ')}\n`;
      }
    }
    description += `\n`;
  }

  return description;
}

/**
 * Parse CSV string to array of objects
 */
export function parseCSV(csvText: string): Array<Record<string, string>> {
  // Remove markdown code blocks if present
  const cleanedCSV = csvText
    .replace(/```csv\n?/g, '')
    .replace(/```\n?/g, '')
    .trim();

  const lines = cleanedCSV.split('\n').filter(line => line.trim());

  if (lines.length === 0) {
    throw new Error('CSV is empty');
  }

  // Parse header row
  const headers = parseCSVLine(lines[0]!);

  if (headers.length === 0) {
    throw new Error('CSV has no headers');
  }

  // Parse data rows
  const rows: Array<Record<string, string>> = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]!);

    if (values.length === 0) continue; // Skip empty lines

    const row: Record<string, string> = {};
    for (let j = 0; j < headers.length; j++) {
      row[headers[j]!] = values[j] || '';
    }
    rows.push(row);
  }

  return rows;
}

/**
 * Parse a single CSV line, handling quoted values
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      // Handle escaped quotes ("")
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++; // Skip next quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  result.push(current.trim());
  return result;
}

/**
 * Validate CSV data against field mapping
 */
export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  rowCount: number;
  columnCount: number;
}

export interface ValidationError {
  row: number;
  field: string;
  message: string;
}

export interface ValidationWarning {
  row: number;
  field: string;
  message: string;
}

export function validateCSV(
  csvData: Array<Record<string, string>>,
  mapping: TableMapping
): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  if (csvData.length === 0) {
    errors.push({ row: 0, field: '', message: 'CSV contains no data rows' });
    return { valid: false, errors, warnings, rowCount: 0, columnCount: 0 };
  }

  const headers = Object.keys(csvData[0]!);
  const columnCount = headers.length;

  // Check for required fields
  const requiredFields = mapping.fields.filter(f => f.required);
  for (const required of requiredFields) {
    if (!headers.includes(required.earthbankField)) {
      errors.push({
        row: 0,
        field: required.earthbankField,
        message: `Required field "${required.earthbankField}" is missing from CSV headers`,
      });
    }
  }

  // Validate each row
  csvData.forEach((row, index) => {
    const rowNumber = index + 2; // +2 because: 0-indexed + header row

    for (const header of headers) {
      const value = row[header];

      // Find field mapping for this header
      const field = mapping.fields.find(f => f.earthbankField === header);

      if (!field) {
        // Unknown field - warning only
        warnings.push({
          row: rowNumber,
          field: header,
          message: `Column "${header}" is not in the EarthBank field mapping`,
        });
        continue;
      }

      // Validate field value
      const validation = validateFieldValue(field, value);
      if (!validation.valid) {
        errors.push({
          row: rowNumber,
          field: header,
          message: validation.error!,
        });
      }
    }
  });

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    rowCount: csvData.length,
    columnCount,
  };
}

/**
 * Convert array of objects back to CSV string
 */
export function arrayToCSV(data: Array<Record<string, any>>): string {
  if (data.length === 0) {
    return '';
  }

  const headers = Object.keys(data[0]!);
  const rows: string[] = [];

  // Add header row
  rows.push(headers.join(','));

  // Add data rows
  for (const row of data) {
    const values = headers.map(header => {
      const value = row[header];

      if (value === null || value === undefined) {
        return '';
      }

      const stringValue = String(value);

      // Quote if contains comma, quote, or newline
      if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }

      return stringValue;
    });

    rows.push(values.join(','));
  }

  return rows.join('\n');
}

/**
 * Preview CSV data (first N rows)
 */
export function previewCSV(csvData: Array<Record<string, string>>, maxRows: number = 5): {
  headers: string[];
  rows: Array<Record<string, string>>;
  totalRows: number;
} {
  const headers = csvData.length > 0 ? Object.keys(csvData[0]!) : [];
  const rows = csvData.slice(0, maxRows);

  return {
    headers,
    rows,
    totalRows: csvData.length,
  };
}

/**
 * Get CSV statistics
 */
export function getCSVStats(csvData: Array<Record<string, string>>): {
  totalRows: number;
  totalColumns: number;
  completeness: number; // Percentage of non-empty cells
  fieldStats: Array<{
    field: string;
    filled: number;
    empty: number;
    fillRate: number;
  }>;
} {
  if (csvData.length === 0) {
    return {
      totalRows: 0,
      totalColumns: 0,
      completeness: 0,
      fieldStats: [],
    };
  }

  const headers = Object.keys(csvData[0]!);
  const totalRows = csvData.length;
  const totalColumns = headers.length;
  const totalCells = totalRows * totalColumns;

  let filledCells = 0;
  const fieldStats = headers.map(field => {
    let filled = 0;
    let empty = 0;

    for (const row of csvData) {
      const value = row[field];
      if (value && value.trim() !== '') {
        filled++;
        filledCells++;
      } else {
        empty++;
      }
    }

    return {
      field,
      filled,
      empty,
      fillRate: totalRows > 0 ? (filled / totalRows) * 100 : 0,
    };
  });

  const completeness = totalCells > 0 ? (filledCells / totalCells) * 100 : 0;

  return {
    totalRows,
    totalColumns,
    completeness,
    fieldStats,
  };
}
