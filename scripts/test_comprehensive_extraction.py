#!/usr/bin/env python3
"""
Comprehensive Extraction Test

Purpose: Compare what happens with and without thermoanalysis text files
"""

import sys
from pathlib import Path
import pandas as pd

# Add scripts to path
sys.path.insert(0, str(Path(__file__).parent))

from pdf.extraction_engine import UniversalThermoExtractor

def test_with_thermoanalysis():
    """Test extraction with thermoanalysis already run"""

    paper_dir = Path("build-data/learning/thermo-papers/McMillan(2024)-Malawi-Rift-4D-Fault-Evolution")
    pdf_path = paper_dir / "McMillan-2024-Malawi-Rift.pdf"

    print("="*80)
    print("TEST 1: UniversalThermoExtractor WITH thermoanalysis outputs")
    print("="*80)
    print()

    # Check what thermoanalysis created
    text_dir = paper_dir / "text"
    if text_dir.exists():
        print("✅ Thermoanalysis outputs found:")
        for file in text_dir.glob("*"):
            size_kb = file.stat().st_size / 1024
            print(f"   - {file.name} ({size_kb:.1f} KB)")
        print()

        # Show what's in text-index.md
        text_index = text_dir / "text-index.md"
        if text_index.exists():
            print("📋 Tables discovered by thermoanalysis:")
            with open(text_index, 'r') as f:
                content = f.read()
                # Find the table with discovered tables
                in_table = False
                for line in content.split('\n'):
                    if line.startswith('| Table |'):
                        in_table = True
                        continue
                    if in_table and line.startswith('|') and not line.startswith('|----'):
                        parts = [p.strip() for p in line.split('|')]
                        if len(parts) >= 5 and parts[1]:
                            print(f"   - {parts[1]} ({parts[2]}) on page {parts[3]}")
                    elif in_table and not line.startswith('|'):
                        break
            print()
    else:
        print("❌ No thermoanalysis outputs found")
        print()

    # Now run UniversalThermoExtractor
    print("🔧 Running UniversalThermoExtractor...")
    print()

    extractor = UniversalThermoExtractor(str(pdf_path), cache_dir='./test_cache')

    # Analyze
    print("Step 1: Analyzing...")
    extractor.analyze()
    print(f"✅ Found {len(extractor.structure.tables)} tables:")
    for table_id, info in extractor.structure.tables.items():
        print(f"   - {table_id}: {info['type']} (page {info['page']})")
    print()

    # Extract
    print("Step 2: Extracting...")
    tables = extractor.extract_all()
    print(f"✅ Extracted {len(tables)} tables:")
    for table_id, df in tables.items():
        print(f"   - {table_id}: {len(df)} rows × {len(df.columns)} columns")
        # Show first few column names
        print(f"     Columns: {', '.join(df.columns[:5])}")
        if len(df.columns) > 5:
            print(f"              {', '.join(df.columns[5:10])}")
        # Show first row of data
        if len(df) > 0:
            first_row = df.iloc[0].to_dict()
            sample_data = {k: str(v)[:20] + '...' if len(str(v)) > 20 else v
                          for k, v in list(first_row.items())[:3]}
            print(f"     Sample: {sample_data}")
        print()

    return tables


def test_without_thermoanalysis():
    """Test extraction on a paper without thermoanalysis"""

    # Use a different paper that hasn't been analyzed
    paper_dir = Path("build-data/learning/thermo-papers/Carraro(2024)-Zircon-Provenance-Colton-Formation")

    # Find the PDF
    pdf_files = list(paper_dir.glob("*.pdf"))
    if not pdf_files:
        print("⚠️  No PDF found in Carraro paper directory")
        return {}

    pdf_path = pdf_files[0]

    print("="*80)
    print("TEST 2: UniversalThermoExtractor WITHOUT thermoanalysis outputs")
    print("="*80)
    print()

    print(f"📄 Paper: {pdf_path.name}")
    print()

    # Check if thermoanalysis was run
    text_dir = paper_dir / "text"
    if text_dir.exists():
        print("⚠️  Note: This paper HAS thermoanalysis outputs")
        print("   (Using it anyway to show what UniversalThermoExtractor does)")
        print()
    else:
        print("✅ Clean test - no thermoanalysis outputs")
        print()

    # Run UniversalThermoExtractor
    print("🔧 Running UniversalThermoExtractor...")
    print()

    extractor = UniversalThermoExtractor(str(pdf_path), cache_dir='./test_cache')

    # Analyze
    print("Step 1: Analyzing...")
    extractor.analyze()
    print(f"✅ Found {len(extractor.structure.tables)} tables:")
    for table_id, info in extractor.structure.tables.items():
        print(f"   - {table_id}: {info['type']} (page {info['page']})")
    print()

    # Extract
    print("Step 2: Extracting...")
    tables = extractor.extract_all()
    print(f"✅ Extracted {len(tables)} tables:")
    for table_id, df in tables.items():
        print(f"   - {table_id}: {len(df)} rows × {len(df.columns)} columns")
    print()

    return tables


def compare_approaches():
    """Show side-by-side comparison"""

    print("="*80)
    print("COMPARISON: What does UniversalThermoExtractor use?")
    print("="*80)
    print()

    print("📊 Data Sources Used by UniversalThermoExtractor:")
    print()
    print("1. semantic_analysis.py (DocumentStructure):")
    print("   ✅ Reads PDF directly with PyMuPDF")
    print("   ✅ Finds table captions using regex")
    print("   ✅ Detects table bboxes (coordinates)")
    print("   ✅ Classifies table types (AFT/He/Chemistry)")
    print("   ❌ Does NOT use text/plain-text.txt")
    print("   ❌ Does NOT use text/text-index.md")
    print()

    print("2. extraction methods (table_extractors.py):")
    print("   ✅ extract_table_from_text() - Reads PDF pages with PyMuPDF")
    print("   ✅ extract_with_camelot() - Reads PDF directly")
    print("   ✅ extract_with_pdfplumber() - Reads PDF directly")
    print("   ❌ Does NOT use text/plain-text.txt")
    print()

    print("3. Caching:")
    print("   ✅ Caches analysis results")
    print("   ✅ Caches extraction results")
    print("   ✅ Cache key: PDF path")
    print()

    print("="*80)
    print("OPPORTUNITY: How could we enhance it with thermoanalysis?")
    print("="*80)
    print()

    print("Potential enhancements:")
    print()
    print("1. Use text/text-index.md for table discovery:")
    print("   - Skip PDF parsing for table captions")
    print("   - Use pre-discovered table metadata")
    print("   - Faster startup (already have page numbers)")
    print()

    print("2. Use text/plain-text.txt for text extraction:")
    print("   - extract_table_from_text() could read from this file")
    print("   - No need to re-read PDF pages")
    print("   - Consistent text (same extraction as analysis)")
    print()

    print("3. Use discovered table types:")
    print("   - thermoanalysis already classified tables")
    print("   - More accurate than caption-based classification")
    print()

    print("4. Use paper-index.md metadata:")
    print("   - Authors, year, study location")
    print("   - Sample ID patterns")
    print("   - Expected age ranges")
    print("   - Better validation and data quality")
    print()


if __name__ == "__main__":
    # Test 1: With thermoanalysis
    tables1 = test_with_thermoanalysis()
    print()
    print()

    # Test 2: Without thermoanalysis
    tables2 = test_without_thermoanalysis()
    print()
    print()

    # Comparison
    compare_approaches()
    print()
    print("="*80)
    print("✅ COMPREHENSIVE TEST COMPLETE")
    print("="*80)
