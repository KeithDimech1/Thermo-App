#!/usr/bin/env python3
"""
Test Extraction on All 5 Tables

Purpose: Verify that extraction works on all 5 tables discovered by thermoanalysis
"""

import sys
from pathlib import Path

# Add scripts to path
sys.path.insert(0, str(Path(__file__).parent))

from pdf.extraction_engine import UniversalThermoExtractor

def test_full_extraction():
    """Test full extraction workflow on McMillan(2024)"""

    paper_dir = Path("build-data/learning/thermo-papers/McMillan(2024)-Malawi-Rift-4D-Fault-Evolution")
    pdf_path = paper_dir / "McMillan-2024-Malawi-Rift.pdf"

    print("="*80)
    print("TEST: Full Extraction Workflow (Discovery + Extraction)")
    print("="*80)
    print()

    # Initialize with paper_dir
    print("Step 1: Initializing extractor...")
    extractor = UniversalThermoExtractor(
        pdf_path=str(pdf_path),
        cache_dir='./test_cache',
        paper_dir=paper_dir
    )
    print("✅ Initialized")
    print()

    # Analyze (use thermoanalysis)
    print("Step 2: Analyzing document...")
    extractor.analyze()
    print(f"✅ Found {len(extractor.structure.tables)} tables")
    print()

    # Extract all tables
    print("Step 3: Extracting tables...")
    tables = extractor.extract_all()
    print()

    # Show results
    print("="*80)
    print(f"EXTRACTION RESULTS: {len(tables)}/{len(extractor.structure.tables)} tables extracted")
    print("="*80)
    print()

    for table_id, df in tables.items():
        print(f"✅ {table_id}:")
        print(f"   - Dimensions: {len(df)} rows × {len(df.columns)} columns")
        print(f"   - Columns: {', '.join(df.columns[:8])}")
        if len(df.columns) > 8:
            print(f"              {', '.join(df.columns[8:16])}")
        if len(df.columns) > 16:
            print(f"              ... ({len(df.columns) - 16} more)")
        print()

    # Verify all 5 tables extracted
    expected_tables = ['Table 1', 'Table A2', 'Table 2', 'Table A3', 'Table A1']
    missing = set(expected_tables) - set(tables.keys())

    print("="*80)
    print("VERIFICATION")
    print("="*80)
    print()

    print(f"Expected: {len(expected_tables)} tables")
    print(f"Extracted: {len(tables)} tables")
    print()

    if missing:
        print(f"❌ MISSING: {', '.join(missing)}")
        print()
        return False
    else:
        print("✅ ALL 5 TABLES EXTRACTED SUCCESSFULLY!")
        print()
        return True


if __name__ == "__main__":
    success = test_full_extraction()

    print("="*80)
    if success:
        print("✅ TEST PASSED - Full extraction workflow working!")
    else:
        print("❌ TEST FAILED - Some tables missing")
    print("="*80)
    print()
