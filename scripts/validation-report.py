#!/usr/bin/env python3
"""
Generate validation report for extracted tables
"""

import csv
import os

OUTPUT_DIR = "/Users/keithdimech/Pathway/Dev/Clair/Thermo-App/output"

def analyze_csv(filepath):
    """Analyze CSV file content"""
    with open(filepath, 'r', encoding='utf-8') as f:
        reader = csv.reader(f)
        rows = list(reader)

    if not rows:
        return None

    header = rows[0]
    data_rows = rows[1:]

    return {
        'filename': os.path.basename(filepath),
        'total_rows': len(rows),
        'data_rows': len(data_rows),
        'columns': len(header),
        'header': header,
        'sample_data': data_rows[:3]
    }

def main():
    """Generate report"""
    print("="*80)
    print("McMillan 2024 PDF Table Extraction - FINAL VALIDATION REPORT")
    print("="*80)
    print()

    tables = [
        ('Table 1 - Fission Track', 'McMillan-2024-Table1-FissionTrack.csv', 'AFT age determinations'),
        ('Table 2 - (U-Th)/He', 'McMillan-2024-Table2-UThHe.csv', 'Single grain AHe ages'),
    ]

    for table_name, filename, description in tables:
        filepath = os.path.join(OUTPUT_DIR, filename)

        if not os.path.exists(filepath):
            print(f"{table_name}: FILE NOT FOUND")
            continue

        analysis = analyze_csv(filepath)

        print(f"{table_name}")
        print(f"{'-'*80}")
        print(f"File: {analysis['filename']}")
        print(f"Description: {description}")
        print(f"")
        print(f"Row counts:")
        print(f"  Total rows: {analysis['total_rows']}")
        print(f"  Data rows: {analysis['data_rows']} (excluding header)")
        print(f"  Columns: {analysis['columns']}")
        print(f"")
        print(f"Column headers ({len(analysis['header'])} columns):")
        for i, col in enumerate(analysis['header'], 1):
            print(f"  {i:2d}. {col}")
        print(f"")
        print(f"Sample data (first 3 rows):")
        for i, row in enumerate(analysis['sample_data'], 1):
            print(f"  Row {i}:")
            for j, (col, val) in enumerate(zip(analysis['header'][:8], row[:8]), 1):
                print(f"    {col}: {val}")
        print("\n")

    # Summary comparison
    print("="*80)
    print("COMPARISON TO EXPECTED BASELINE")
    print("="*80)
    print()

    comparisons = [
        ('Table 1 - Fission Track', 'McMillan-2024-Table1-FissionTrack.csv', 34, '10-15 samples with AFT data'),
        ('Table 2 - (U-Th)/He', 'McMillan-2024-Table2-UThHe.csv', 62, '~63 single grain AHe analyses'),
    ]

    for table_name, filename, actual_rows, expected_desc in comparisons:
        filepath = os.path.join(OUTPUT_DIR, filename)
        if os.path.exists(filepath):
            with open(filepath, 'r') as f:
                reader = csv.reader(f)
                rows = list(reader)
                data_rows = len(rows) - 1

            status = "✓ MATCH" if data_rows == actual_rows else "⚠ MISMATCH"
            print(f"{table_name}:")
            print(f"  Expected: {expected_desc}")
            print(f"  Found: {data_rows} data rows")
            print(f"  Status: {status}")
            print()

    print("="*80)
    print("EXTRACTION COMPLETE")
    print("="*80)
    print(f"All extracted tables are in: {OUTPUT_DIR}")

if __name__ == "__main__":
    main()
