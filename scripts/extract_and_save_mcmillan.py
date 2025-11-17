#!/usr/bin/env python3
"""
Extract and Save McMillan(2024) Tables

Purpose: Extract all tables and save to paper directory structure
"""

import sys
from pathlib import Path
import pandas as pd

# Add scripts to path
sys.path.insert(0, str(Path(__file__).parent))

from pdf.extraction_engine import UniversalThermoExtractor

def extract_and_save():
    """Extract tables and save to paper directory"""

    paper_dir = Path("build-data/learning/thermo-papers/McMillan(2024)-Malawi-Rift-4D-Fault-Evolution")
    pdf_path = paper_dir / "McMillan-2024-Malawi-Rift.pdf"

    print("="*80)
    print("EXTRACTING AND SAVING TABLES TO PAPER DIRECTORY")
    print("="*80)
    print()

    print(f"📁 Paper directory: {paper_dir}")
    print(f"📄 PDF: {pdf_path.name}")
    print()

    # Initialize extractor with paper_dir
    print("Step 1: Initializing extractor...")
    extractor = UniversalThermoExtractor(
        pdf_path=str(pdf_path),
        cache_dir='./cache',
        paper_dir=paper_dir
    )
    print("✅ Initialized")
    print()

    # Analyze (use thermoanalysis)
    print("Step 2: Analyzing document...")
    extractor.analyze()

    if (paper_dir / 'text' / 'text-index.md').exists():
        print("✅ Using thermoanalysis table discovery")
    else:
        print("⚠️  Using semantic analysis")

    print(f"   Found {len(extractor.structure.tables)} tables:")
    for table_id, info in extractor.structure.tables.items():
        print(f"   - {table_id}: {info['type']} (page {info['page'] + 1})")
    print()

    # Extract all tables
    print("Step 3: Extracting tables...")
    results = extractor.extract_all()
    print(f"✅ Extracted {len(results)} tables")
    print()

    # Save to paper directory
    extracted_dir = paper_dir / 'extracted'
    extracted_dir.mkdir(exist_ok=True)

    print(f"Step 4: Saving to {extracted_dir}")
    print()

    for table_id, df in results.items():
        # Sanitize table name for filename
        safe_name = table_id.replace(' ', '-')
        csv_path = extracted_dir / f'{safe_name}.csv'

        # Save CSV
        df.to_csv(csv_path, index=False)

        print(f"✅ Saved: {csv_path.name}")
        print(f"   - Dimensions: {len(df)} rows × {len(df.columns)} columns")
        print(f"   - Columns: {', '.join(df.columns[:10])}")
        if len(df.columns) > 10:
            print(f"              ... ({len(df.columns) - 10} more)")
        print()

    # Show final directory structure
    print("="*80)
    print("FINAL DIRECTORY STRUCTURE")
    print("="*80)
    print()
    print(f"{paper_dir.name}/")
    print(f"├── text/")
    print(f"│   ├── plain-text.txt")
    print(f"│   └── text-index.md")
    print(f"├── extracted/  ← NEW")
    for csv_file in sorted(extracted_dir.glob("*.csv")):
        print(f"│   ├── {csv_file.name}")
    print(f"└── {pdf_path.name}")
    print()

    print("="*80)
    print("✅ COMPLETE - All tables extracted and saved!")
    print("="*80)
    print()

if __name__ == "__main__":
    extract_and_save()
