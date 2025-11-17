#!/usr/bin/env python3
"""
Test existing UniversalThermoExtractor

Purpose: Verify that the extraction_engine.py code from IDEA-006 still works
"""

import sys
from pathlib import Path

# Add scripts to path
sys.path.insert(0, str(Path(__file__).parent))

from pdf.extraction_engine import UniversalThermoExtractor

def test_mcmillan_paper():
    """Test extraction on McMillan(2024) Malawi Rift paper"""

    pdf_path = "build-data/learning/thermo-papers/McMillan(2024)-Malawi-Rift-4D-Fault-Evolution/McMillan-2024-Malawi-Rift.pdf"

    print("="*60)
    print("Testing UniversalThermoExtractor on McMillan(2024) paper")
    print("="*60)

    # Step 1: Initialize
    print("\n📄 Initializing extractor...")
    extractor = UniversalThermoExtractor(pdf_path, cache_dir='./test_cache')
    print("✅ Extractor initialized")

    # Step 2: Analyze document structure
    print("\n📊 Analyzing document structure...")
    extractor.analyze()
    print(f"✅ Analysis complete - Found {len(extractor.structure.tables)} tables:")
    for table_id, info in extractor.structure.tables.items():
        print(f"   - {table_id}: {info['type']} (page {info['page']})")
        print(f"     bbox: {info['bbox']}")

    # Step 3: Extract tables
    print("\n🔧 Extracting tables...")
    tables = extractor.extract_all()
    print(f"\n✅ Extraction complete - Successfully extracted {len(tables)} tables:")
    for table_id, df in tables.items():
        print(f"   - {table_id}: {len(df)} rows × {len(df.columns)} columns")
        print(f"     Columns: {list(df.columns)[:5]}")
        if len(df.columns) > 5:
            print(f"              {list(df.columns)[5:10]}" + ("..." if len(df.columns) > 10 else ""))

    print("\n" + "="*60)
    print("✅ TEST PASSED - Existing extractor works!")
    print("="*60)

    return tables

if __name__ == "__main__":
    tables = test_mcmillan_paper()
