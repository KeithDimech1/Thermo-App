#!/usr/bin/env python3
"""
Search for appendix tables (Table A2, Table A3) in the PDF
"""

import pdfplumber

PDF_PATH = "/Users/keithdimech/Pathway/Dev/Clair/Thermo-App/build-data/learning/thermo-papers/pdfs/4D fault evolution revealed by footwall exhumation modelling_ A natural experiment in the Malawi rift.pdf"

def search_for_tables(pdf):
    """Search for Table A2 and Table A3"""
    print("Searching for appendix tables...\n")

    for page_num, page in enumerate(pdf.pages, 1):
        text = page.extract_text() or ""

        # Look for table markers
        if 'Table A2' in text or 'Table A3' in text or 'EMPA' in text:
            print(f"="*80)
            print(f"Page {page_num}: Found appendix table reference")
            print(f"="*80)

            # Show some context
            lines = text.split('\n')
            for i, line in enumerate(lines):
                if 'Table A' in line or 'EMPA' in line or 'Durango' in line:
                    # Show this line and a few around it
                    start = max(0, i-2)
                    end = min(len(lines), i+10)
                    print("Context:")
                    for j in range(start, end):
                        marker = ">>> " if j == i else "    "
                        print(f"{marker}{lines[j]}")
                    print()
                    break

with pdfplumber.open(PDF_PATH) as pdf:
    print(f"Scanning {len(pdf.pages)} pages...\n")
    search_for_tables(pdf)
