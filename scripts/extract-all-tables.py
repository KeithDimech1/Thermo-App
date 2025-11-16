#!/usr/bin/env python3
"""
Complete table extraction for McMillan 2024 PDF
Handles multi-page tables and different formats
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
    cleaned = str(cell).strip()
    cleaned = cleaned.replace('\n', ' ')
    return cleaned

def parse_multi_row_cell(cell_value):
    """Split cells containing multiple rows"""
    if not cell_value:
        return []
    parts = str(cell_value).strip().split('\n')
    return [p.strip() for p in parts if p.strip()]

def get_page_text(page):
    """Get cleaned text from page"""
    text = page.extract_text() or ""
    return text

def extract_table_1_fission_track(pdf):
    """Extract Table 1 - Fission Track (Page 9)"""
    print("="*80)
    print("TABLE 1 - FISSION TRACK")
    print("="*80)

    page = pdf.pages[8]  # Page 9

    # Check if this is the right page
    text = get_page_text(page)
    if 'Table1' not in text and 'Fission' not in text:
        print("ERROR: Page 9 doesn't contain Table 1")
        return None

    table_settings = {
        'vertical_strategy': 'text',
        'horizontal_strategy': 'lines',
    }

    tables = page.extract_tables(table_settings=table_settings)
    if not tables or len(tables) == 0:
        print("ERROR: No tables found")
        return None

    table = tables[0]
    print(f"Raw extraction: {len(table)} rows x {len(table[0])} cols")

    # Extract header and data
    header = [clean_cell(h) for h in table[0]]

    extracted_rows = [header]

    if len(table) > 1:
        data_row = table[1]
        split_data = []
        for cell in data_row:
            split_data.append(parse_multi_row_cell(cell))

        max_samples = max(len(col) for col in split_data)
        print(f"Samples found: {max_samples}")

        for i in range(max_samples):
            row = []
            for col_data in split_data:
                if i < len(col_data):
                    row.append(col_data[i])
                else:
                    row.append('')
            extracted_rows.append(row)

    print(f"Extracted: {len(extracted_rows)-1} data rows")
    return extracted_rows

def extract_table_2_uthhe(pdf):
    """Extract Table 2 - (U-Th)/He (Pages 10-11 main data)"""
    print("\n" + "="*80)
    print("TABLE 2 - (U-Th)/He")
    print("="*80)

    all_data = []
    header = None

    # Scan pages 10-11 (and possibly 12 if continuation)
    target_pages = [9, 10, 11]  # 0-indexed pages 10, 11, 12

    for page_idx in target_pages:
        if page_idx >= len(pdf.pages):
            continue

        page = pdf.pages[page_idx]
        page_num = page_idx + 1
        text = get_page_text(page)

        # Check if this page has (U-Th)/He data
        if not any(x in text for x in ['Table2', 'U-Th', 'U–Th', 'He', 'StadardRun']):
            print(f"Page {page_num}: No U-Th/He data detected, skipping")
            continue

        print(f"\nPage {page_num}:")

        # Try to extract table
        table_settings = {
            'vertical_strategy': 'text',
            'horizontal_strategy': 'lines',
        }

        tables = page.extract_tables(table_settings=table_settings)

        if not tables:
            print(f"  No tables extracted")
            continue

        for table_idx, table in enumerate(tables):
            if not table or len(table) == 0:
                continue

            print(f"  Table {table_idx+1}: {len(table)} rows x {len(table[0])} cols")

            # First table or first page - capture header
            if not header:
                header = [clean_cell(h) for h in table[0]]
                print(f"  Header captured: {header[:5]}...")

            # Extract data rows
            start_row = 1 if len(table) > 1 else 0

            for row_idx in range(start_row, len(table)):
                data_row = table[row_idx]

                # Check if this is a multi-row compressed format
                sample_cell = str(data_row[0]) if len(data_row) > 0 else ""

                if '\n' in sample_cell:
                    # Compressed format - split it out
                    split_data = []
                    for cell in data_row:
                        split_data.append(parse_multi_row_cell(cell))

                    max_rows = max(len(col) for col in split_data) if split_data else 0

                    for i in range(max_rows):
                        row = []
                        for col_data in split_data:
                            if i < len(col_data):
                                row.append(col_data[i])
                            else:
                                row.append('')
                        all_data.append(row)

                    print(f"  Extracted {max_rows} rows from compressed format")
                else:
                    # Single row format
                    row = [clean_cell(cell) for cell in data_row]
                    # Skip if it's a header repetition
                    if 'Sample' not in row[0] and 'Lab' not in row[0]:
                        all_data.append(row)

    # Combine
    if header:
        final_table = [header] + all_data
        print(f"\nTotal extracted: {len(all_data)} data rows")
        return final_table
    else:
        print("\nERROR: No header found")
        return None

def save_to_csv(data, filename, output_dir):
    """Save to CSV"""
    if not data:
        return None

    filepath = os.path.join(output_dir, filename)

    with open(filepath, 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        writer.writerows(data)

    print(f"\nSaved: {filename}")
    return filepath

def validate_extraction(filepath, expected_desc):
    """Validate extracted data"""
    with open(filepath, 'r', encoding='utf-8') as f:
        reader = csv.reader(f)
        rows = list(reader)

    if not rows:
        print("  ERROR: Empty file")
        return

    print(f"\nValidation for {os.path.basename(filepath)}:")
    print(f"  Total rows: {len(rows)}")
    print(f"  Data rows: {len(rows) - 1}")
    print(f"  Columns: {len(rows[0])}")
    print(f"  Column headers: {rows[0]}")
    print(f"\n  Sample data (first 3 rows):")
    for i, row in enumerate(rows[1:4], 1):
        print(f"    {i}: {row[:6]}...")

    print(f"\n  {expected_desc}")

def main():
    """Main execution"""
    print("="*80)
    print("McMillan 2024 - Complete Table Extraction")
    print("="*80)
    print()

    os.makedirs(OUTPUT_DIR, exist_ok=True)

    with pdfplumber.open(PDF_PATH) as pdf:
        print(f"PDF: {len(pdf.pages)} pages\n")

        # Extract Table 1
        ft_data = extract_table_1_fission_track(pdf)
        if ft_data:
            ft_path = save_to_csv(ft_data, "McMillan-2024-Table1-FissionTrack.csv", OUTPUT_DIR)
            if ft_path:
                validate_extraction(ft_path, "Expected: ~10-15 samples with AFT data")

        # Extract Table 2
        uthe_data = extract_table_2_uthhe(pdf)
        if uthe_data:
            uthe_path = save_to_csv(uthe_data, "McMillan-2024-Table2-UThHe.csv", OUTPUT_DIR)
            if uthe_path:
                validate_extraction(uthe_path, "Expected: ~63 AHe grain analyses")

    print("\n" + "="*80)
    print("EXTRACTION COMPLETE")
    print("="*80)
    print(f"Output directory: {OUTPUT_DIR}")

if __name__ == "__main__":
    main()
