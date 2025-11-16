#!/usr/bin/env python3
"""
Examine specific pages of the PDF to understand table structure
"""

import pdfplumber

PDF_PATH = "/Users/keithdimech/Pathway/Dev/Clair/Thermo-App/build-data/learning/thermo-papers/pdfs/4D fault evolution revealed by footwall exhumation modelling_ A natural experiment in the Malawi rift.pdf"

def examine_page(pdf, page_num):
    """Examine a specific page"""
    print(f"\n{'='*80}")
    print(f"PAGE {page_num}")
    print(f"{'='*80}")

    page = pdf.pages[page_num - 1]

    # Get text
    text = page.extract_text()
    print("\nTEXT CONTENT (first 1000 chars):")
    print(text[:1000] if text else "No text")

    # Get words
    words = page.extract_words()
    print(f"\nTOTAL WORDS: {len(words)}")

    # Try different table extraction strategies
    strategies = [
        ('lines', 'lines'),
        ('text', 'text'),
        ('lines', 'text'),
        ('text', 'lines'),
    ]

    for v_strat, h_strat in strategies:
        print(f"\n--- Strategy: vertical={v_strat}, horizontal={h_strat} ---")
        table_settings = {
            'vertical_strategy': v_strat,
            'horizontal_strategy': h_strat,
        }
        tables = page.extract_tables(table_settings=table_settings)
        print(f"Tables found: {len(tables)}")

        for i, table in enumerate(tables, 1):
            if table:
                print(f"\nTable {i}:")
                print(f"  Rows: {len(table)}")
                print(f"  Cols: {len(table[0]) if table else 0}")
                print(f"  First 3 rows:")
                for j, row in enumerate(table[:3], 1):
                    # Show first 5 cells
                    cells = [str(c)[:30] if c else '' for c in row[:5]]
                    print(f"    Row {j}: {cells}")

def main():
    """Main"""
    with pdfplumber.open(PDF_PATH) as pdf:
        # Check pages around where we expect tables
        # Table 1 (FT) and Table 2 (U-Th-He) should be around pages 10-12
        pages_to_check = [9, 10, 11, 12]

        for page_num in pages_to_check:
            if page_num <= len(pdf.pages):
                examine_page(pdf, page_num)

if __name__ == "__main__":
    main()
