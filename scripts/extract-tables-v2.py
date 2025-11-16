#!/usr/bin/env python3
"""
Extract tables from McMillan 2024 PDF with proper table detection settings
"""

import pdfplumber
import csv
import os
import re

PDF_PATH = "/Users/keithdimech/Pathway/Dev/Clair/Thermo-App/build-data/learning/thermo-papers/pdfs/4D fault evolution revealed by footwall exhumation modelling_ A natural experiment in the Malawi rift.pdf"
OUTPUT_DIR = "/Users/keithdimech/Pathway/Dev/Clair/Thermo-App/output"

def clean_cell(cell):
    """Clean cell content"""
    if cell is None:
        return ''
    return str(cell).strip()

def extract_tables_with_context(pdf_path):
    """Extract tables with page context"""
    extracted = []

    with pdfplumber.open(pdf_path) as pdf:
        print(f"Scanning {len(pdf.pages)} pages for tables...\n")

        for page_num, page in enumerate(pdf.pages, 1):
            # Get page text to identify tables
            text = page.extract_text() or ""

            # Look for table markers
            has_table_marker = any([
                'Table 1' in text,
                'Table 2' in text,
                'Table A2' in text,
                'Table A3' in text,
                'Fission-track' in text,
                '(U–Th)' in text,
                'U-Th' in text,
                'EMPA' in text,
                'Durango' in text
            ])

            if has_table_marker or (8 <= page_num <= 15) or (page_num >= 40):
                # Try to extract tables with text-based strategy
                table_settings = {
                    'vertical_strategy': 'text',
                    'horizontal_strategy': 'text',
                    'intersection_tolerance': 3,
                }

                tables = page.extract_tables(table_settings=table_settings)

                if tables:
                    for table_idx, table in enumerate(tables):
                        if table and len(table) > 2:  # At least 3 rows
                            # Get context from page text
                            table_name = None
                            if 'Table 1' in text and 'Fission-track' in text:
                                table_name = 'Table 1 - Fission-track'
                            elif 'Table 2' in text or '(U–Th)' in text or 'U-Th' in text:
                                table_name = 'Table 2 - U-Th-He'
                            elif 'Table A2' in text and 'EMPA' in text:
                                table_name = 'Table A2 - EMPA'
                            elif 'Table A3' in text and 'Durango' in text:
                                table_name = 'Table A3 - Durango'
                            else:
                                # Try to detect from table content
                                first_rows = ' '.join([' '.join([clean_cell(c) for c in row]) for row in table[:3]])
                                if any(x in first_rows for x in ['ρs', 'Ns', 'Ni', 'Central Age']):
                                    table_name = 'Table 1 - Fission-track'
                                elif any(x in first_rows for x in ['U', 'Th', 'He', 'Ft', 'Raw age']):
                                    table_name = 'Table 2 - U-Th-He'

                            if table_name:
                                print(f"Page {page_num}: Found {table_name}")
                                print(f"  Rows: {len(table)}, Cols: {len(table[0])}")
                                extracted.append({
                                    'name': table_name,
                                    'page': page_num,
                                    'data': table
                                })

    return extracted

def merge_table_parts(extracted):
    """Merge multi-page table parts"""
    merged = {}

    for item in extracted:
        base_name = item['name'].split(' - ')[0]  # Get 'Table 1', 'Table 2', etc.

        if base_name not in merged:
            merged[base_name] = {
                'name': item['name'],
                'pages': [item['page']],
                'data': item['data']
            }
        else:
            # Append data (skip header if it's a continuation)
            merged[base_name]['pages'].append(item['page'])
            # Simple heuristic: if first row looks like header, skip it
            first_row = ' '.join([clean_cell(c) for c in item['data'][0]])
            if any(x in first_row for x in ['Sample', 'Grain', 'able', 'Table']):
                merged[base_name]['data'].extend(item['data'][1:])
            else:
                merged[base_name]['data'].extend(item['data'])

    return merged

def save_to_csv(table_info, output_dir):
    """Save table to CSV"""
    # Create clean filename
    clean_name = table_info['name'].replace(' - ', '-').replace(' ', '-')
    filename = f"McMillan-2024-{clean_name}.csv"
    filepath = os.path.join(output_dir, filename)

    # Clean and filter data
    cleaned = []
    for row in table_info['data']:
        cleaned_row = [clean_cell(cell) for cell in row]
        # Skip empty rows
        if any(cell.strip() for cell in cleaned_row):
            cleaned.append(cleaned_row)

    # Write CSV
    with open(filepath, 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        writer.writerows(cleaned)

    return filepath, len(cleaned)

def main():
    """Main execution"""
    print("="*80)
    print("McMillan 2024 Table Extraction (v2)")
    print("="*80)
    print()

    os.makedirs(OUTPUT_DIR, exist_ok=True)

    # Extract all tables
    extracted = extract_tables_with_context(PDF_PATH)

    if not extracted:
        print("\nNo tables found!")
        return

    print(f"\nFound {len(extracted)} table part(s)")
    print()

    # Merge multi-page tables
    merged = merge_table_parts(extracted)

    print("="*80)
    print("Merged Tables")
    print("="*80)

    saved_files = []

    for table_id, table_info in merged.items():
        print(f"\n{table_id}: {table_info['name']}")
        print(f"  Pages: {table_info['pages']}")
        print(f"  Total rows: {len(table_info['data'])}")

        # Save to CSV
        filepath, row_count = save_to_csv(table_info, OUTPUT_DIR)
        saved_files.append((filepath, row_count))

        print(f"  Saved: {os.path.basename(filepath)} ({row_count} rows)")

        # Show sample
        print(f"  Sample (first 3 rows):")
        for i, row in enumerate(table_info['data'][:3], 1):
            print(f"    {i}: {row[:5]}...")

    # Final summary
    print("\n" + "="*80)
    print("EXTRACTION SUMMARY")
    print("="*80)
    print(f"\nFiles created: {len(saved_files)}")
    for filepath, row_count in saved_files:
        print(f"  - {os.path.basename(filepath)}: {row_count} rows")

    print(f"\nOutput directory: {OUTPUT_DIR}")

    # Validation
    print("\n" + "="*80)
    print("VALIDATION")
    print("="*80)

    for filepath, row_count in saved_files:
        with open(filepath, 'r', encoding='utf-8') as f:
            reader = csv.reader(f)
            rows = list(reader)
            if rows:
                print(f"\n{os.path.basename(filepath)}:")
                print(f"  Columns: {len(rows[0])}")
                print(f"  Column headers: {rows[0][:10]}")
                print(f"  Data rows (excluding header): {row_count - 1}")

if __name__ == "__main__":
    main()
