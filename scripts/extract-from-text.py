#!/usr/bin/env python3
"""
Extract table data from PDF text when table detection doesn't work well
Parse the actual text content line by line
"""

import pdfplumber
import csv
import os
import re

PDF_PATH = "/Users/keithdimech/Pathway/Dev/Clair/Thermo-App/build-data/learning/thermo-papers/pdfs/4D fault evolution revealed by footwall exhumation modelling_ A natural experiment in the Malawi rift.pdf"
OUTPUT_DIR = "/Users/keithdimech/Pathway/Dev/Clair/Thermo-App/output"

def extract_table2_from_text(pdf):
    """Extract Table 2 (U-Th-He) by parsing text directly"""
    print("="*80)
    print("Extracting Table 2 - (U-Th)/He from text")
    print("="*80)

    # Header columns based on what we see in the PDF
    header = [
        'Sample', 'Lab No.', 'Standard Run ID', '4He (ncc)', 'Mass (mg)',
        'Mean FT', 'U ppm', 'Th ppm', 'Sm ppm', 'eU ppm',
        'Uncorr. Age (Ma)', 'Age [Ma±1σ]', 'Length (μm)', 'Half-width (μm)',
        'Rs (μm)', 'Morphology', 'Tt Model'
    ]

    all_data = [header]

    # Check pages 10-12 (0-indexed: 9-11)
    for page_idx in range(9, 12):
        if page_idx >= len(pdf.pages):
            continue

        page = pdf.pages[page_idx]
        page_num = page_idx + 1
        text = page.extract_text() or ""

        print(f"\nProcessing page {page_num}...")

        lines = text.split('\n')

        for line in lines:
            # Look for data lines that start with sample numbers
            # Pattern: MU19-XX followed by a lab number
            match = re.match(r'^(MU19-\d+)\s+(\d+)\s+([A-E])\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)\s+([\d.±]+)\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)\s+([012]T)\s*(.*)$', line)

            if match:
                row = list(match.groups())
                all_data.append(row)

            # Also look for median lines (summary statistics)
            elif 'median±IQR' in line:
                # These are summary rows, could extract if needed
                continue

    print(f"\nExtracted {len(all_data)-1} data rows")
    return all_data

def extract_table1_from_text(pdf):
    """Extract Table 1 (Fission Track) by parsing text"""
    print("\n" + "="*80)
    print("Extracting Table 1 - Fission Track from text")
    print("="*80)

    header = [
        'Sample No.', 'No. of grains', 'Ns', 'ρs [10^5 cm^-2]',
        '238U [ppm±1σ]', '232Th [ppm±1σ]', 'eU [ppm±1σ]',
        'P(χ2) [%]', 'Disp. [%]', 'Pooled age [Ma±1σ]', 'Central age [Ma±1σ]',
        'Dpar [μm±1σ]', 'rmr0b', 'rmr0Dc', 'Cl [wt%]', 'eCl [apfu]',
        'N length', 'Mean track length [μm±se]', 'MTL St.Dev. [μm]'
    ]

    all_data = [header]

    # Page 9 (0-indexed: 8)
    page = pdf.pages[8]
    text = page.extract_text() or ""

    print("\nProcessing page 9...")

    lines = text.split('\n')

    for line in lines:
        # Look for sample data lines starting with MU19-
        if line.strip().startswith('MU19-'):
            # Split by whitespace
            parts = line.split()

            if len(parts) >= 10:  # Should have many fields
                all_data.append(parts)

    print(f"Extracted {len(all_data)-1} data rows")
    return all_data

def save_csv(data, filename):
    """Save data to CSV"""
    filepath = os.path.join(OUTPUT_DIR, filename)

    with open(filepath, 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        writer.writerows(data)

    print(f"\nSaved: {filename} ({len(data)} rows)")
    return filepath

def show_summary(filepath):
    """Show summary of extracted file"""
    with open(filepath, 'r') as f:
        reader = csv.reader(f)
        rows = list(reader)

    print(f"\nFile: {os.path.basename(filepath)}")
    print(f"  Total rows: {len(rows)}")
    print(f"  Data rows: {len(rows) - 1}")
    print(f"  Columns: {len(rows[0])}")
    print(f"\n  First 3 data rows:")
    for i, row in enumerate(rows[1:4], 1):
        print(f"    {i}: {row[:6]}...")

def main():
    """Main execution"""
    print("="*80)
    print("McMillan 2024 - Text-Based Table Extraction")
    print("="*80)
    print()

    os.makedirs(OUTPUT_DIR, exist_ok=True)

    with pdfplumber.open(PDF_PATH) as pdf:
        # Extract Table 2 (U-Th-He)
        table2_data = extract_table2_from_text(pdf)
        if table2_data and len(table2_data) > 1:
            path2 = save_csv(table2_data, "McMillan-2024-Table2-UThHe-text.csv")
            show_summary(path2)

        # Extract Table 1 (Fission Track)
        table1_data = extract_table1_from_text(pdf)
        if table1_data and len(table1_data) > 1:
            path1 = save_csv(table1_data, "McMillan-2024-Table1-FissionTrack-text.csv")
            show_summary(path1)

    print("\n" + "="*80)
    print(f"Output directory: {OUTPUT_DIR}")
    print("="*80)

if __name__ == "__main__":
    main()
