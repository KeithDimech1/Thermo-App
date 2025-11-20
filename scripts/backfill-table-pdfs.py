#!/usr/bin/env python3
"""
Backfill script: Convert existing PNG table screenshots to combined PDF pages.
For the McMillan(2024) paper directory.
"""

import json
from pathlib import Path
from datetime import datetime
import fitz  # PyMuPDF

# Configuration
PAPER_DIR = Path("/Users/keithdimech/Pathway/Dev/Clair/Thermo-App/build-data/learning/papers/McMillan(2024)-4D-fault-evolution-footwall-exhumation-Malawi-rift-Journal-of-Structural-Geology")
SOURCE_PDF = PAPER_DIR / "4D fault evolution revealed by footwall exhumation modelling_ A natural experiment in the Malawi rift.pdf"
TABLES_DIR = PAPER_DIR / "images" / "tables"
EXTRACTED_DIR = PAPER_DIR / "extracted"

# Table definitions based on existing PNG files
TABLES = [
    {
        "name": "Table 1",
        "number": "1",
        "type": "AFT ages",
        "pages": [9],  # Single occurrence
        "is_multipage": False
    },
    {
        "name": "Table 1",
        "number": "1",
        "type": "AFT ages",
        "pages": [12],  # Second occurrence
        "is_multipage": False
    },
    {
        "name": "Table 2",
        "number": "2",
        "type": "(U-Th)/He ages",
        "pages": [10, 11],
        "is_multipage": True
    },
    {
        "name": "Table A2",
        "number": "A2",
        "type": "Track length data",
        "pages": list(range(22, 37)),  # Pages 22-36
        "is_multipage": True
    },
    {
        "name": "Table A3",
        "number": "A3",
        "type": "Reference materials",
        "pages": [36],
        "is_multipage": False
    }
]

def create_combined_pdfs():
    """Create combined PDF files from source PDF pages."""
    print("=" * 80)
    print("BACKFILLING TABLE PDFs")
    print("=" * 80)
    print()

    source_doc = fitz.open(SOURCE_PDF)
    table_pdfs = []

    # Track unique tables (handle Table 1 appearing twice)
    table_counter = {}

    for table in TABLES:
        table_name = table['name']
        table_num = table['number']
        pages = table['pages']
        is_multipage = table['is_multipage']

        # Handle duplicate table names (Table 1 appears on pages 9 and 12)
        if table_name in table_counter:
            table_counter[table_name] += 1
            occurrence = table_counter[table_name]
        else:
            table_counter[table_name] = 1
            occurrence = 1

        # Create new PDF for this table
        table_pdf = fitz.open()

        # Extract pages from source document
        for page_num in pages:
            if 1 <= page_num <= len(source_doc):
                table_pdf.insert_pdf(source_doc, from_page=page_num-1, to_page=page_num-1)

        # Generate filename
        table_filename = table_name.lower().replace(' ', '_').replace('.', '')

        if len(pages) == 1:
            # Single page table
            pdf_filename = f"{table_filename}_page_{pages[0]}.pdf"
        else:
            # Multi-page table (combine into single PDF)
            pdf_filename = f"{table_filename}_page_{pages[0]}-{pages[-1]}.pdf"

        pdf_path_out = TABLES_DIR / pdf_filename
        table_pdf.save(str(pdf_path_out))
        table_pdf.close()

        # Record metadata
        table_pdf_info = {
            "table_name": table_name,
            "table_type": table['type'],
            "pages": pages,
            "filename": f"tables/{pdf_filename}",
            "is_multipage": is_multipage or len(pages) > 1,
            "page_count": len(pages),
            "occurrence": occurrence
        }

        table_pdfs.append(table_pdf_info)

        if len(pages) == 1:
            print(f"✅ Extracted {table_name} (page {pages[0]}) → {pdf_filename}")
        else:
            print(f"✅ Extracted {table_name} (pages {pages[0]}-{pages[-1]}) → {pdf_filename}")

        # Show file size
        file_size = pdf_path_out.stat().st_size
        print(f"   Size: {file_size / 1024:.1f} KB")
        print()

    source_doc.close()

    print(f"✅ Created {len(table_pdfs)} table PDF(s)")
    print()

    return table_pdfs


def create_table_index(table_pdfs):
    """Create table-index.json linking all formats."""
    print("=" * 80)
    print("CREATING TABLE INDEX")
    print("=" * 80)
    print()

    table_index = {
        "metadata": {
            "pdf_name": SOURCE_PDF.name,
            "folder_name": PAPER_DIR.name,
            "total_tables": len(set(t['table_name'] for t in table_pdfs)),
            "extraction_date": datetime.now().isoformat(),
            "backfilled": True
        },
        "tables": []
    }

    for table_pdf in table_pdfs:
        table_name = table_pdf['table_name']
        pages = table_pdf['pages']

        table_entry = {
            "name": table_name,
            "number": table_pdf['table_name'].split()[-1],  # Extract number
            "type": table_pdf['table_type'],
            "locations": {
                "text_file": {
                    "file": "text/plain-text.txt",
                    "start_line": None,  # Not available in backfill
                    "end_line": None
                },
                "pdf_section": {
                    "file": None,  # Could link to extracted/ PDFs if needed
                    "pages": pages
                },
                "pdf_pages": {
                    "file": table_pdf['filename'],
                    "pages": pages,
                    "bbox": None  # Not available from PNG screenshots
                }
            },
            "metadata": {
                "column_positions": None,
                "context_preview": f"Table on page(s) {pages[0]}-{pages[-1]}" if len(pages) > 1 else f"Table on page {pages[0]}"
            }
        }

        table_index["tables"].append(table_entry)

    # Save table index
    table_index_path = PAPER_DIR / 'table-index.json'
    with open(table_index_path, 'w', encoding='utf-8') as f:
        json.dump(table_index, f, indent=2, ensure_ascii=False)

    print(f"✅ Created: {table_index_path.name}")
    print(f"✅ Linked {len(table_index['tables'])} table occurrence(s)")
    print()

    # Print summary
    print("Table Index Summary:")
    for entry in table_index["tables"]:
        pdf_file = entry["locations"]["pdf_pages"]["file"]
        pages = entry["locations"]["pdf_pages"]["pages"]
        if len(pages) == 1:
            print(f"   - {entry['name']}: PDF-Pages (page {pages[0]})")
        else:
            print(f"   - {entry['name']}: PDF-Pages ({len(pages)} pages)")
    print()

    return table_index


def create_tables_md(table_pdfs):
    """Create tables.md with PDF download links."""
    print("=" * 80)
    print("CREATING TABLES.MD")
    print("=" * 80)
    print()

    tables_md_path = PAPER_DIR / 'tables.md'

    with open(tables_md_path, 'w') as f:
        f.write("# Extracted Tables\n\n")
        f.write("**Source:** PDF pages extracted directly from source document\n")
        f.write("**Generated:** Backfilled from PNG screenshots\n\n")
        f.write("---\n\n")

        # Group by table name but preserve order
        seen = set()
        for table_pdf in table_pdfs:
            table_name = table_pdf['table_name']
            table_type = table_pdf['table_type']
            pages = table_pdf['pages']
            filename = table_pdf['filename']
            is_multipage = table_pdf['is_multipage']
            occurrence = table_pdf.get('occurrence', 1)

            # Create unique key for grouping
            key = f"{table_name}_{'_'.join(map(str, pages))}"
            if key in seen:
                continue
            seen.add(key)

            # Handle multiple occurrences
            if occurrence > 1:
                f.write(f"## {table_name} (Occurrence {occurrence})\n\n")
            else:
                f.write(f"## {table_name}\n\n")

            f.write(f"**Type:** {table_type}\n")

            if is_multipage or len(pages) > 1:
                f.write(f"**Pages:** {pages[0]}-{pages[-1]} ({len(pages)} pages)\n\n")
            else:
                f.write(f"**Page:** {pages[0]}\n\n")

            # Link to PDF (download link, not embedded)
            pdf_filename = filename.split('/')[-1]
            f.write(f"[Download {table_name} PDF](./images/{filename})\n\n")

            f.write("---\n\n")

    print(f"✅ Created: {tables_md_path.name}")
    print()


def main():
    """Main backfill process."""
    print()
    print("📋 Backfilling McMillan(2024) paper with PDF table pages")
    print(f"📁 Paper directory: {PAPER_DIR.name}")
    print()

    # Step 1: Create combined PDF files
    table_pdfs = create_combined_pdfs()

    # Step 2: Create table-index.json
    table_index = create_table_index(table_pdfs)

    # Step 3: Create tables.md
    create_tables_md(table_pdfs)

    # Summary
    print()
    print("=" * 80)
    print("BACKFILL COMPLETE")
    print("=" * 80)
    print()
    print(f"✅ Created {len(table_pdfs)} table PDF(s) in images/tables/")
    print(f"✅ Created table-index.json")
    print(f"✅ Created tables.md")
    print()

    # Calculate space saved
    png_total = sum(f.stat().st_size for f in TABLES_DIR.glob("*.png"))
    pdf_total = sum(f.stat().st_size for f in TABLES_DIR.glob("*.pdf"))

    print(f"📊 File size comparison:")
    print(f"   PNG files (20): {png_total / 1024 / 1024:.2f} MB")
    print(f"   PDF files ({len(table_pdfs)}): {pdf_total / 1024 / 1024:.2f} MB")
    print(f"   Savings: {(png_total - pdf_total) / 1024 / 1024:.2f} MB ({(1 - pdf_total/png_total)*100:.1f}%)")
    print()

    print("🗑️  You can now delete the PNG files:")
    print(f"   rm {TABLES_DIR}/*.png")
    print()


if __name__ == "__main__":
    main()
