#!/usr/bin/env python3
"""
Extract all tables from McMillan 2024 PDF using pdfplumber
Preserves table structure and saves to CSV files
"""

import pdfplumber
import csv
import os
from pathlib import Path

# Configuration
PDF_PATH = "/Users/keithdimech/Pathway/Dev/Clair/Thermo-App/build-data/learning/thermo-papers/pdfs/4D fault evolution revealed by footwall exhumation modelling_ A natural experiment in the Malawi rift.pdf"
OUTPUT_DIR = "/Users/keithdimech/Pathway/Dev/Clair/Thermo-App/output"

# Table identification patterns
TABLE_PATTERNS = {
    'Table 1': {'name': 'FissionTrack', 'keywords': ['Sample', 'N grains', 'ρs', 'Ns', 'ρi', 'Ni', 'Central Age']},
    'Table 2': {'name': 'UThHe', 'keywords': ['Sample', 'Grain', 'U', 'Th', 'Sm', 'He', 'Ft', 'Raw age', 'Corrected age']},
    'Table A2': {'name': 'EMPA', 'keywords': ['Sample', 'SiO2', 'Al2O3', 'FeO', 'MgO', 'CaO']},
    'Table A3': {'name': 'Durango', 'keywords': ['Durango', 'Standard', 'track', 'length']}
}

def clean_cell(cell):
    """Clean cell content"""
    if cell is None:
        return ''
    return str(cell).strip()

def is_table_header(row, keywords):
    """Check if row contains table header keywords"""
    if not row:
        return False
    row_text = ' '.join([clean_cell(cell) for cell in row]).lower()
    matches = sum(1 for keyword in keywords if keyword.lower() in row_text)
    return matches >= len(keywords) * 0.5  # At least 50% of keywords match

def identify_table(table_data, page_num):
    """Identify which table this is based on content"""
    if not table_data or len(table_data) < 2:
        return None

    # Check first few rows for identifying keywords
    first_rows_text = ' '.join([
        ' '.join([clean_cell(cell) for cell in row])
        for row in table_data[:5]
    ]).lower()

    for table_id, config in TABLE_PATTERNS.items():
        keyword_matches = sum(1 for keyword in config['keywords'] if keyword.lower() in first_rows_text)
        if keyword_matches >= len(config['keywords']) * 0.5:
            return table_id

    return None

def extract_tables_from_pdf(pdf_path):
    """Extract all tables from PDF using pdfplumber"""
    print(f"Opening PDF: {pdf_path}")

    extracted_tables = {}
    table_counter = {}

    with pdfplumber.open(pdf_path) as pdf:
        print(f"Total pages: {len(pdf.pages)}")

        for page_num, page in enumerate(pdf.pages, 1):
            print(f"\n--- Page {page_num} ---")

            # Extract tables from page
            tables = page.extract_tables()

            if tables:
                print(f"Found {len(tables)} table(s) on page {page_num}")

                for table_idx, table in enumerate(tables, 1):
                    if not table or len(table) < 2:
                        continue

                    # Identify the table
                    table_id = identify_table(table, page_num)

                    if table_id:
                        # Track if we've seen this table before (for multi-page tables)
                        if table_id not in table_counter:
                            table_counter[table_id] = 1
                            extracted_tables[table_id] = []
                        else:
                            table_counter[table_id] += 1

                        print(f"  Table {table_idx}: Identified as {table_id} (occurrence {table_counter[table_id]})")
                        print(f"    Rows: {len(table)}, Columns: {len(table[0]) if table else 0}")

                        # Add to extracted data
                        # For continuation tables, skip header row
                        if table_counter[table_id] == 1:
                            extracted_tables[table_id].extend(table)
                        else:
                            # Skip header row for continuations
                            extracted_tables[table_id].extend(table[1:])
                    else:
                        print(f"  Table {table_idx}: Unidentified (rows: {len(table)})")
                        # Print first row to help identify
                        if table and len(table) > 0:
                            print(f"    First row: {[clean_cell(c) for c in table[0][:5]]}")
            else:
                print(f"No tables found on page {page_num}")

    return extracted_tables

def save_table_to_csv(table_data, table_id, config, output_dir):
    """Save table data to CSV file"""
    if not table_data:
        print(f"Warning: No data for {table_id}")
        return None

    filename = f"McMillan-2024-{config['name']}.csv"
    filepath = os.path.join(output_dir, filename)

    # Clean the data
    cleaned_data = []
    for row in table_data:
        cleaned_row = [clean_cell(cell) for cell in row]
        # Skip completely empty rows
        if any(cell.strip() for cell in cleaned_row):
            cleaned_data.append(cleaned_row)

    # Write to CSV
    with open(filepath, 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        writer.writerows(cleaned_data)

    print(f"\nSaved: {filename}")
    print(f"  Rows: {len(cleaned_data)}")
    print(f"  Columns: {len(cleaned_data[0]) if cleaned_data else 0}")

    # Show sample
    print(f"  First 3 rows:")
    for i, row in enumerate(cleaned_data[:3], 1):
        print(f"    {i}: {row[:5]}...")  # First 5 columns

    return filepath

def main():
    """Main execution"""
    print("="*80)
    print("McMillan 2024 PDF Table Extraction")
    print("="*80)

    # Create output directory
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    # Extract tables
    extracted_tables = extract_tables_from_pdf(PDF_PATH)

    print("\n" + "="*80)
    print("EXTRACTION SUMMARY")
    print("="*80)

    saved_files = []

    # Save each table
    for table_id, table_data in extracted_tables.items():
        if table_id in TABLE_PATTERNS:
            config = TABLE_PATTERNS[table_id]
            filepath = save_table_to_csv(table_data, table_id, config, OUTPUT_DIR)
            if filepath:
                saved_files.append(filepath)

    # Final summary
    print("\n" + "="*80)
    print("FINAL REPORT")
    print("="*80)
    print(f"\nTables extracted: {len(saved_files)}")
    print(f"Files saved to: {OUTPUT_DIR}")
    print(f"\nFiles created:")
    for filepath in saved_files:
        print(f"  - {os.path.basename(filepath)}")

    # Count specific tables
    print("\n" + "="*80)
    print("VALIDATION AGAINST EXPECTED RESULTS")
    print("="*80)

    for table_id, config in TABLE_PATTERNS.items():
        filename = f"McMillan-2024-{config['name']}.csv"
        filepath = os.path.join(OUTPUT_DIR, filename)
        if os.path.exists(filepath):
            with open(filepath, 'r') as f:
                reader = csv.reader(f)
                rows = list(reader)
                data_rows = len(rows) - 1  # Subtract header
                print(f"\n{table_id} ({config['name']}):")
                print(f"  Total rows: {len(rows)} (including header)")
                print(f"  Data rows: {data_rows}")
                if rows:
                    print(f"  Columns: {rows[0]}")
        else:
            print(f"\n{table_id}: NOT FOUND")

    print("\n" + "="*80)

if __name__ == "__main__":
    main()
