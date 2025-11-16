#!/usr/bin/env python3
"""
Final table extraction from McMillan 2024 PDF
Uses optimal extraction strategy for each table type
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
    # Convert to string and clean
    cleaned = str(cell).strip()
    # Remove newlines within cells (but preserve content)
    cleaned = cleaned.replace('\n', ' ')
    return cleaned

def parse_multi_row_cell(cell_value):
    """Split cells that contain multiple rows of data"""
    if not cell_value:
        return []
    # Split by newline
    parts = str(cell_value).strip().split('\n')
    return [p.strip() for p in parts if p.strip()]

def extract_fission_track_table(pdf):
    """Extract Table 1 - Fission Track data from page 9"""
    print("Extracting Table 1 - Fission Track...")

    page = pdf.pages[8]  # Page 9 (0-indexed)

    # Use text/lines strategy which gives us the data
    table_settings = {
        'vertical_strategy': 'text',
        'horizontal_strategy': 'lines',
    }

    tables = page.extract_tables(table_settings=table_settings)

    if not tables:
        print("  ERROR: No tables found on page 9")
        return None

    table = tables[0]
    print(f"  Raw table: {len(table)} rows x {len(table[0])} cols")

    # The table has compressed all data rows into one row
    # We need to split them out
    if len(table) < 2:
        print("  ERROR: Table has < 2 rows")
        return None

    header_row = table[0]
    data_row = table[1] if len(table) > 1 else None

    # Clean header
    header = [clean_cell(h) for h in header_row]

    # Parse data rows
    extracted_rows = [header]

    if data_row:
        # Each cell in data_row contains multiple samples separated by newlines
        # We need to split them
        split_data = []
        for cell in data_row:
            split_data.append(parse_multi_row_cell(cell))

        # Find max number of samples
        max_samples = max(len(col) for col in split_data)
        print(f"  Detected {max_samples} samples in compressed data")

        # Reconstruct rows
        for i in range(max_samples):
            row = []
            for col_data in split_data:
                if i < len(col_data):
                    row.append(col_data[i])
                else:
                    row.append('')
            extracted_rows.append(row)

    print(f"  Extracted: {len(extracted_rows)} rows (including header)")
    return extracted_rows

def extract_uthe_table(pdf):
    """Extract Table 2 - (U-Th)/He data from pages 10-11"""
    print("Extracting Table 2 - (U-Th)/He...")

    all_data = []
    header = None

    # Pages 10 and 11
    for page_num in [9, 10]:  # 0-indexed
        print(f"  Processing page {page_num + 1}...")
        page = pdf.pages[page_num]

        table_settings = {
            'vertical_strategy': 'text',
            'horizontal_strategy': 'lines',
        }

        tables = page.extract_tables(table_settings=table_settings)

        if not tables:
            print(f"    No tables found")
            continue

        table = tables[0]
        print(f"    Raw table: {len(table)} rows x {len(table[0])} cols")

        if not header and len(table) > 0:
            # First page - capture header
            header = [clean_cell(h) for h in table[0]]
            print(f"    Header: {header[:5]}...")

        # Process data rows (similar to FT table)
        if len(table) > 1:
            data_row = table[1]
            split_data = []
            for cell in data_row:
                split_data.append(parse_multi_row_cell(cell))

            max_rows = max(len(col) for col in split_data)
            print(f"    Detected {max_rows} data entries")

            for i in range(max_rows):
                row = []
                for col_data in split_data:
                    if i < len(col_data):
                        row.append(col_data[i])
                    else:
                        row.append('')
                all_data.append(row)

    # Combine header and data
    if header:
        final_table = [header] + all_data
        print(f"  Total extracted: {len(final_table)} rows (including header)")
        return final_table
    else:
        print("  ERROR: No header found")
        return None

def save_to_csv(data, filename, output_dir):
    """Save data to CSV"""
    if not data:
        print(f"  ERROR: No data to save for {filename}")
        return None

    filepath = os.path.join(output_dir, filename)

    with open(filepath, 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        writer.writerows(data)

    print(f"  Saved: {filename} ({len(data)} rows)")
    return filepath

def show_sample(filepath, num_rows=3):
    """Display sample of CSV file"""
    with open(filepath, 'r', encoding='utf-8') as f:
        reader = csv.reader(f)
        rows = list(reader)

    if not rows:
        print("  Empty file!")
        return

    print(f"  Columns ({len(rows[0])}): {rows[0][:8]}...")
    print(f"  Sample (first {min(num_rows, len(rows)-1)} data rows):")
    for i, row in enumerate(rows[1:num_rows+1], 1):
        # Show first few columns
        display = [str(c)[:20] for c in row[:6]]
        print(f"    {i}: {display}")

def main():
    """Main execution"""
    print("="*80)
    print("McMillan 2024 Table Extraction - FINAL VERSION")
    print("="*80)
    print()

    os.makedirs(OUTPUT_DIR, exist_ok=True)

    with pdfplumber.open(PDF_PATH) as pdf:
        saved_files = []

        # Extract Table 1 - Fission Track
        ft_data = extract_fission_track_table(pdf)
        if ft_data:
            filepath = save_to_csv(ft_data, "McMillan-2024-Table1-FissionTrack.csv", OUTPUT_DIR)
            if filepath:
                saved_files.append(('Table 1 - Fission Track', filepath))
                show_sample(filepath)

        print()

        # Extract Table 2 - (U-Th)/He
        uthe_data = extract_uthe_table(pdf)
        if uthe_data:
            filepath = save_to_csv(uthe_data, "McMillan-2024-Table2-UThHe.csv", OUTPUT_DIR)
            if filepath:
                saved_files.append(('Table 2 - (U-Th)/He', filepath))
                show_sample(filepath)

    # Final summary
    print("\n" + "="*80)
    print("EXTRACTION SUMMARY")
    print("="*80)

    if saved_files:
        print(f"\nSuccessfully extracted {len(saved_files)} table(s):")
        for table_name, filepath in saved_files:
            with open(filepath, 'r') as f:
                reader = csv.reader(f)
                rows = list(reader)
                data_rows = len(rows) - 1
                cols = len(rows[0]) if rows else 0
                print(f"\n{table_name}:")
                print(f"  File: {os.path.basename(filepath)}")
                print(f"  Data rows: {data_rows}")
                print(f"  Columns: {cols}")
    else:
        print("\nNo tables extracted!")

    print(f"\nOutput directory: {OUTPUT_DIR}")
    print("="*80)

if __name__ == "__main__":
    main()
