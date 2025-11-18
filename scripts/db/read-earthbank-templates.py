#!/usr/bin/env python3
"""
Read EarthBank Excel templates and extract exact column structure.
This will be used to create database tables that match the templates exactly.
"""

import pandas as pd
import sys
from pathlib import Path

def read_template(filepath: Path):
    """Read an Excel template and print all sheets with their columns."""
    print(f"\n{'='*80}")
    print(f"File: {filepath.name}")
    print(f"{'='*80}\n")

    # Read all sheets
    excel_file = pd.ExcelFile(filepath)

    for sheet_name in excel_file.sheet_names:
        df = pd.read_excel(filepath, sheet_name=sheet_name)

        print(f"Sheet: {sheet_name}")
        print(f"Columns ({len(df.columns)}):")

        # Print columns with index
        for i, col in enumerate(df.columns, 1):
            print(f"  {i:3d}. {col}")

        # Get data types
        print(f"\nData types:")
        for col in df.columns:
            dtype = df[col].dtype
            # Get first non-null value as example
            example = df[col].dropna().head(1).values
            example_str = f" (e.g., {example[0]})" if len(example) > 0 else ""
            print(f"  {col}: {dtype}{example_str}")

        print()

def main():
    templates_dir = Path("/Users/keithdimech/Pathway/Dev/Clair/Thermo-App/build-data/learning/archive/earthbanktemplates")

    # Read all templates
    templates = sorted(templates_dir.glob("*.xlsx"))

    for template in templates:
        try:
            read_template(template)
        except Exception as e:
            print(f"Error reading {template.name}: {e}")
            continue

if __name__ == "__main__":
    main()
