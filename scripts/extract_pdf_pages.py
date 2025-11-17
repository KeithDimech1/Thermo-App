#!/usr/bin/env python3
"""
Extract specific pages from large PDF files for table extraction.
Workaround for PDFs that exceed Claude's 32MB reading limit.
"""

import sys
from pathlib import Path
from pypdf import PdfReader, PdfWriter

def extract_pages(input_pdf: str, output_pdf: str, pages: list[int]) -> None:
    """
    Extract specific pages from a PDF.

    Args:
        input_pdf: Path to input PDF
        output_pdf: Path to output PDF
        pages: List of page numbers to extract (0-indexed)
    """
    reader = PdfReader(input_pdf)
    writer = PdfWriter()

    for page_num in pages:
        if 0 <= page_num < len(reader.pages):
            writer.add_page(reader.pages[page_num])
        else:
            print(f"Warning: Page {page_num} out of range (PDF has {len(reader.pages)} pages)")

    with open(output_pdf, 'wb') as f:
        writer.write(f)

    print(f"Extracted {len(pages)} pages to {output_pdf}")
    print(f"Output file size: {Path(output_pdf).stat().st_size / 1024 / 1024:.2f} MB")

if __name__ == "__main__":
    if len(sys.argv) < 4:
        print("Usage: extract_pdf_pages.py <input_pdf> <output_pdf> <page1,page2,...>")
        print("Example: extract_pdf_pages.py input.pdf output.pdf 8,9,10")
        sys.exit(1)

    input_pdf = sys.argv[1]
    output_pdf = sys.argv[2]
    pages = [int(p) - 1 for p in sys.argv[3].split(',')]  # Convert to 0-indexed

    extract_pages(input_pdf, output_pdf, pages)
