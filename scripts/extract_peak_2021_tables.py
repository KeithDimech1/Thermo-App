#!/usr/bin/env python3
"""
Extract ZHe tables from Peak et al. (2021) supplemental Excel file
"""

import pandas as pd
import sys
from pathlib import Path

def extract_tables():
    """Extract Table S1 and S2 from Peak et al. Excel file"""

    # File paths
    excel_file = Path("build-data/learning/thermo-papers/Peak(2021)-Grand-Canyon-Great-Unconformity-Geology/supplemental/Tables_Peaketal_GrandCanyonPaleotopography.xlsx")
    output_dir = Path("build-data/learning/thermo-papers/Peak(2021)-Grand-Canyon-Great-Unconformity-Geology/RAW")

    if not excel_file.exists():
        print(f"ERROR: Excel file not found: {excel_file}")
        sys.exit(1)

    output_dir.mkdir(parents=True, exist_ok=True)

    print(f"Reading Excel file: {excel_file}")

    # Get list of all sheets
    excel = pd.ExcelFile(excel_file)
    print(f"\nAvailable sheets: {excel.sheet_names}")

    # Extract Table S1 - Summary ZHe data
    print("\n" + "="*60)
    print("Extracting Table S1 (Summary ZHe Data)")
    print("="*60)

    try:
        # Read with first row as header (row 0 contains column names)
        df_s1 = pd.read_excel(excel_file, sheet_name='Table S1. Summary ZHe Data', header=0)

        # Skip empty rows and header rows (rows 1-3 are section headers/empty)
        df_s1 = df_s1[df_s1.iloc[:, 0].notna() & ~df_s1.iloc[:, 0].str.contains('Lower Granite Gorge|Upper Granite Gorge|Sample Name|CP06-65, Diamond', regex=True, na=False)]

        print(f"Table S1 shape: {df_s1.shape[0]} rows × {df_s1.shape[1]} columns")
        print(f"Columns: {list(df_s1.columns)}")

        # Save to CSV
        output_s1 = output_dir / "table-s1-summary-zhe-raw.csv"
        df_s1.to_csv(output_s1, index=False)
        print(f"✅ Saved to: {output_s1}")
        print(f"   Preview (first 5 rows):\n{df_s1.head()}")

    except Exception as e:
        print(f"❌ Failed to extract Table S1: {e}")

    # Extract Table S2 - Detailed ZHe data
    print("\n" + "="*60)
    print("Extracting Table S2 (Detailed ZHe Data)")
    print("="*60)

    try:
        # Read with first row as header (row 0 contains column names)
        df_s2 = pd.read_excel(excel_file, sheet_name='Table S2. Detailed ZHe Data', header=0)

        # Skip empty rows and header rows
        df_s2 = df_s2[df_s2.iloc[:, 0].notna() & ~df_s2.iloc[:, 0].str.contains('Lower Granite Gorge|Upper Granite Gorge|Sample Name|CP06-65, Diamond', regex=True, na=False)]

        print(f"Table S2 shape: {df_s2.shape[0]} rows × {df_s2.shape[1]} columns")
        print(f"Columns: {list(df_s2.columns)}")

        # Save to CSV
        output_s2 = output_dir / "table-s2-detailed-zhe-raw.csv"
        df_s2.to_csv(output_s2, index=False)
        print(f"✅ Saved to: {output_s2}")
        print(f"   Preview (first 5 rows):\n{df_s2.head()}")

    except Exception as e:
        print(f"❌ Failed to extract Table S2: {e}")

    print("\n" + "="*60)
    print("✅ Extraction complete!")
    print("="*60)

if __name__ == "__main__":
    extract_tables()
