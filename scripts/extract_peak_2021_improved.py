#!/usr/bin/env python3
"""
Extract ZHe tables from Peak et al. (2021) with proper header handling
"""

import pandas as pd
import sys
from pathlib import Path

def extract_tables():
    """Extract Table S1 and S2 with proper header detection"""

    excel_file = Path("build-data/learning/thermo-papers/Peak(2021)-Grand-Canyon-Great-Unconformity-Geology/supplemental/Tables_Peaketal_GrandCanyonPaleotopography.xlsx")
    output_dir = Path("build-data/learning/thermo-papers/Peak(2021)-Grand-Canyon-Great-Unconformity-Geology/RAW")

    if not excel_file.exists():
        print(f"ERROR: Excel file not found: {excel_file}")
        sys.exit(1)

    output_dir.mkdir(parents=True, exist_ok=True)

    # Extract Table S1
    print("="*60)
    print("Extracting Table S1 (Summary ZHe Data)")
    print("="*60)

    try:
        # Read Excel file without treating any row as header first
        df_raw = pd.read_excel(excel_file, sheet_name='Table S1. Summary ZHe Data', header=None)

        # Find the header row (contains "Sample Name")
        header_row_idx = None
        for idx, row in df_raw.iterrows():
            if pd.notna(row[0]) and 'Sample Name' in str(row[0]):
                header_row_idx = idx
                break

        if header_row_idx is None:
            print("ERROR: Could not find header row")
            sys.exit(1)

        print(f"Found header row at index: {header_row_idx}")

        # Re-read with proper header
        df_s1 = pd.read_excel(excel_file, sheet_name='Table S1. Summary ZHe Data', header=header_row_idx)

        # Remove rows that are section headers or empty
        # Keep only rows that start with sample names (pattern: letters + numbers + underscore)
        df_s1 = df_s1[df_s1.iloc[:, 0].astype(str).str.match(r'^[A-Z]{2,4}\d{2,3}.*_.*', na=False)]

        print(f"Table S1 shape: {df_s1.shape[0]} rows × {df_s1.shape[1]} columns")
        print(f"Columns:\n{df_s1.columns.tolist()}")

        # Save to CSV
        output_s1 = output_dir / "table-s1-summary-zhe-raw.csv"
        df_s1.to_csv(output_s1, index=False)
        print(f"\n✅ Saved to: {output_s1}")
        print(f"\nPreview (first 3 rows):\n{df_s1.head(3).to_string()}")
        print(f"\nSample count: {df_s1.shape[0]}")

    except Exception as e:
        print(f"❌ Failed to extract Table S1: {e}")
        import traceback
        traceback.print_exc()

    # Extract Table S2
    print("\n" + "="*60)
    print("Extracting Table S2 (Detailed ZHe Data)")
    print("="*60)

    try:
        # Read Excel file without treating any row as header first
        df_raw = pd.read_excel(excel_file, sheet_name='Table S2. Detailed ZHe Data', header=None)

        # Find the header row
        header_row_idx = None
        for idx, row in df_raw.iterrows():
            if pd.notna(row[0]) and 'Sample Name' in str(row[0]):
                header_row_idx = idx
                break

        if header_row_idx is None:
            print("ERROR: Could not find header row")
            sys.exit(1)

        print(f"Found header row at index: {header_row_idx}")

        # Re-read with proper header
        df_s2 = pd.read_excel(excel_file, sheet_name='Table S2. Detailed ZHe Data', header=header_row_idx)

        # Remove rows that are section headers or empty
        df_s2 = df_s2[df_s2.iloc[:, 0].astype(str).str.match(r'^[A-Z]{2,4}\d{2,3}.*_.*', na=False)]

        print(f"Table S2 shape: {df_s2.shape[0]} rows × {df_s2.shape[1]} columns")
        print(f"Columns:\n{df_s2.columns.tolist()}")

        # Save to CSV
        output_s2 = output_dir / "table-s2-detailed-zhe-raw.csv"
        df_s2.to_csv(output_s2, index=False)
        print(f"\n✅ Saved to: {output_s2}")
        print(f"\nPreview (first 3 rows):\n{df_s2.head(3).to_string()}")
        print(f"\nSample count: {df_s2.shape[0]}")

    except Exception as e:
        print(f"❌ Failed to extract Table S2: {e}")
        import traceback
        traceback.print_exc()

    print("\n" + "="*60)
    print("✅ Extraction complete!")
    print("="*60)

if __name__ == "__main__":
    extract_tables()
