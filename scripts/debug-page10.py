#!/usr/bin/env python3
"""
Debug page 10 to find all U-Th-He data
"""

import pdfplumber

PDF_PATH = "/Users/keithdimech/Pathway/Dev/Clair/Thermo-App/build-data/learning/thermo-papers/pdfs/4D fault evolution revealed by footwall exhumation modelling_ A natural experiment in the Malawi rift.pdf"

def debug_page(pdf, page_num):
    """Debug specific page"""
    page = pdf.pages[page_num - 1]

    print(f"="*80)
    print(f"PAGE {page_num} - FULL TEXT")
    print(f"="*80)
    text = page.extract_text()
    print(text)

    print(f"\n"*2)
    print(f"="*80)
    print(f"PAGE {page_num} - TABLE EXTRACTION ATTEMPTS")
    print(f"="*80)

    # Try all strategies
    strategies = [
        ('lines', 'lines'),
        ('text', 'text'),
        ('lines', 'text'),
        ('text', 'lines'),
    ]

    for v, h in strategies:
        print(f"\n--- Strategy: vertical={v}, horizontal={h} ---")
        settings = {
            'vertical_strategy': v,
            'horizontal_strategy': h,
        }
        tables = page.extract_tables(table_settings=settings)

        if tables:
            for i, table in enumerate(tables, 1):
                print(f"\nTable {i}: {len(table)} rows x {len(table[0]) if table else 0} cols")
                if table:
                    print("First 5 rows:")
                    for j, row in enumerate(table[:5], 1):
                        print(f"  {j}: {[str(c)[:30] for c in row[:6]]}")

with pdfplumber.open(PDF_PATH) as pdf:
    debug_page(pdf, 10)
