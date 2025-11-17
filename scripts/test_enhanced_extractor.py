#!/usr/bin/env python3
"""
Test Enhanced UniversalThermoExtractor with thermoanalysis integration

Purpose: Verify that Step 1 enhancement finds all 5 tables in McMillan(2024)
"""

import sys
from pathlib import Path

# Add scripts to path
sys.path.insert(0, str(Path(__file__).parent))

from pdf.extraction_engine import UniversalThermoExtractor

def test_with_thermoanalysis():
    """Test enhanced extractor WITH thermoanalysis (should find 5 tables)"""

    paper_dir = Path("build-data/learning/thermo-papers/McMillan(2024)-Malawi-Rift-4D-Fault-Evolution")
    pdf_path = paper_dir / "McMillan-2024-Malawi-Rift.pdf"

    print("="*80)
    print("TEST: Enhanced UniversalThermoExtractor WITH thermoanalysis integration")
    print("="*80)
    print()

    print(f"📁 Paper directory: {paper_dir.name}")
    print(f"📄 PDF: {pdf_path.name}")
    print()

    # Check thermoanalysis outputs
    text_index = paper_dir / "text" / "text-index.md"
    if text_index.exists():
        print("✅ thermoanalysis outputs found")
        print(f"   - {text_index.relative_to(paper_dir)}")
        print()
    else:
        print("❌ ERROR: No thermoanalysis outputs found!")
        print(f"   Run /thermoanalysis on this paper first")
        return

    # Initialize enhanced extractor WITH paper_dir
    print("🔧 Initializing enhanced extractor with paper_dir...")
    extractor = UniversalThermoExtractor(
        pdf_path=str(pdf_path),
        cache_dir='./test_cache',
        paper_dir=paper_dir  # NEW: enables thermoanalysis integration
    )
    print("✅ Extractor initialized")
    print()

    # Analyze (should use thermoanalysis)
    print("📊 Analyzing document...")
    extractor.analyze()
    print()

    # Check results
    tables_found = len(extractor.structure.tables)
    print("="*80)
    print(f"RESULTS: Found {tables_found} tables")
    print("="*80)
    print()

    for table_id, info in extractor.structure.tables.items():
        print(f"  {table_id}:")
        print(f"    Type: {info['type']}")
        print(f"    Page: {info['page'] + 1} (1-indexed)")
        print(f"    Bbox: {info['bbox']}")
        print()

    # Verify we found all 5 tables
    expected_tables = ['Table 1', 'Table A2', 'Table 2', 'Table A3', 'Table A1']
    found_tables = list(extractor.structure.tables.keys())

    print("="*80)
    print("VERIFICATION")
    print("="*80)
    print()

    print(f"Expected: {len(expected_tables)} tables - {', '.join(expected_tables)}")
    print(f"Found:    {tables_found} tables - {', '.join(found_tables)}")
    print()

    missing = set(expected_tables) - set(found_tables)
    extra = set(found_tables) - set(expected_tables)

    if missing:
        print(f"❌ MISSING: {', '.join(missing)}")
    if extra:
        print(f"⚠️  EXTRA: {', '.join(extra)}")

    if tables_found == 5 and not missing:
        print("✅ SUCCESS: Found all 5 tables!")
        print()
        return True
    else:
        print(f"❌ FAILED: Expected 5 tables, found {tables_found}")
        print()
        return False


def test_without_thermoanalysis():
    """Test enhanced extractor WITHOUT thermoanalysis (backward compatibility)"""

    paper_dir = Path("build-data/learning/thermo-papers/Carraro(2024)-Zircon-Provenance-Colton-Formation")
    pdf_files = list(paper_dir.glob("*.pdf"))

    if not pdf_files:
        print("⚠️  No PDF found for Carraro paper, skipping test")
        return True

    pdf_path = pdf_files[0]

    print("="*80)
    print("TEST: Enhanced UniversalThermoExtractor WITHOUT thermoanalysis (fallback)")
    print("="*80)
    print()

    print(f"📄 PDF: {pdf_path.name}")
    print()

    # Initialize WITHOUT paper_dir
    print("🔧 Initializing extractor WITHOUT paper_dir (backward compatible)...")
    extractor = UniversalThermoExtractor(
        pdf_path=str(pdf_path),
        cache_dir='./test_cache'
        # NO paper_dir parameter
    )
    print("✅ Extractor initialized")
    print()

    # Analyze (should use semantic analysis fallback)
    print("📊 Analyzing document...")
    extractor.analyze()
    print()

    # Check results
    tables_found = len(extractor.structure.tables)
    print("="*80)
    print(f"RESULTS: Found {tables_found} tables (using semantic analysis)")
    print("="*80)
    print()

    for table_id, info in extractor.structure.tables.items():
        print(f"  {table_id}: {info['type']} (page {info['page'] + 1})")

    print()
    print("✅ Backward compatibility verified (no errors)")
    print()

    return True


if __name__ == "__main__":
    print("\n")

    # Test 1: WITH thermoanalysis (should find 5 tables)
    test1_passed = test_with_thermoanalysis()

    print("\n\n")

    # Test 2: WITHOUT thermoanalysis (backward compatible)
    test2_passed = test_without_thermoanalysis()

    print("\n")
    print("="*80)
    print("FINAL RESULTS")
    print("="*80)
    print(f"Test 1 (WITH thermoanalysis):    {'✅ PASSED' if test1_passed else '❌ FAILED'}")
    print(f"Test 2 (WITHOUT thermoanalysis): {'✅ PASSED' if test2_passed else '❌ FAILED'}")
    print()

    if test1_passed and test2_passed:
        print("✅ ALL TESTS PASSED - Enhancement successful!")
    else:
        print("❌ SOME TESTS FAILED - Review logs above")
    print("="*80)
    print()
