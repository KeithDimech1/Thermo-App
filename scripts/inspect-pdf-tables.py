#!/usr/bin/env python3
"""
Inspect PDF structure to find tables with different detection settings
"""

import pdfplumber
from pdfplumber.utils import extract_text, get_bbox_overlap

PDF_PATH = "/Users/keithdimech/Pathway/Dev/Clair/Thermo-App/build-data/learning/thermo-papers/pdfs/4D fault evolution revealed by footwall exhumation modelling_ A natural experiment in the Malawi rift.pdf"

def inspect_page(page, page_num):
    """Inspect a single page for table content"""
    # Get text to search for table keywords
    text = page.extract_text()

    # Search for table indicators
    table_keywords = ['Table 1', 'Table 2', 'Table A2', 'Table A3', 'Fission-track', 'U-Th', 'EMPA', 'Durango']
    found_keywords = [kw for kw in table_keywords if kw in text]

    if found_keywords:
        print(f"\n{'='*80}")
        print(f"Page {page_num}: Found keywords: {found_keywords}")
        print(f"{'='*80}")

        # Try different table settings
        settings = [
            {'vertical_strategy': 'lines', 'horizontal_strategy': 'lines'},
            {'vertical_strategy': 'text', 'horizontal_strategy': 'text'},
            {'vertical_strategy': 'lines', 'horizontal_strategy': 'text'},
            {'vertical_strategy': 'text', 'horizontal_strategy': 'lines'},
            {'vertical_strategy': 'lines', 'horizontal_strategy': 'lines', 'snap_tolerance': 3},
            {'vertical_strategy': 'text', 'horizontal_strategy': 'text', 'intersection_tolerance': 3},
        ]

        for i, setting in enumerate(settings, 1):
            tables = page.extract_tables(table_settings=setting)
            if tables:
                print(f"\nSetting {i} ({setting}): Found {len(tables)} table(s)")
                for j, table in enumerate(tables, 1):
                    print(f"  Table {j}: {len(table)} rows x {len(table[0]) if table else 0} cols")
                    if table and len(table) > 0:
                        # Show first row
                        print(f"    First row: {table[0][:3]}...")
                        if len(table) > 1:
                            print(f"    Second row: {table[1][:3]}...")
                return True

    return False

def main():
    """Main inspection"""
    print("Inspecting PDF for tables...")

    with pdfplumber.open(PDF_PATH) as pdf:
        print(f"Total pages: {len(pdf.pages)}")

        # Focus on likely pages (10-20 for main tables, 40+ for appendix)
        target_pages = list(range(10, 21)) + list(range(40, min(len(pdf.pages), 70)))

        for page_num in target_pages:
            if page_num <= len(pdf.pages):
                page = pdf.pages[page_num - 1]
                inspect_page(page, page_num)

if __name__ == "__main__":
    main()
