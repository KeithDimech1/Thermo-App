#!/usr/bin/env python3
"""
Extract individual table pages as separate PDF files.
This is the missing STEP 5 from /thermoanalysis that didn't execute.
"""

import fitz  # PyMuPDF
from pathlib import Path
import sys
import json

def extract_table_pdfs(paper_dir: Path):
    """
    Extract individual table pages as separate PDFs.

    Args:
        paper_dir: Path to paper directory (e.g., McMillan(2024)-4D-fault-evolution...)
    """
    # Find the PDF file in the directory
    pdf_files = list(paper_dir.glob("*.pdf"))
    if not pdf_files:
        print(f"❌ No PDF found in {paper_dir}")
        return

    pdf_path = pdf_files[0]
    print(f"📄 Processing: {pdf_path.name}")
    print()

    # Create extracted directory
    extracted_dir = paper_dir / 'extracted'
    extracted_dir.mkdir(exist_ok=True)

    # Load paper-index.md to get table information
    index_file = paper_dir / 'paper-index.md'
    if not index_file.exists():
        print(f"❌ paper-index.md not found in {paper_dir}")
        return

    # Parse table info from paper-index.md
    # Format: | **Table 1** | **9-11** | ...
    tables = []
    with open(index_file, 'r', encoding='utf-8') as f:
        in_table_section = False
        for line in f:
            if '## 📊 Data Tables in Paper' in line:
                in_table_section = True
                continue

            if in_table_section and line.startswith('|') and '**Table' in line:
                parts = [p.strip() for p in line.split('|')]
                if len(parts) >= 4:
                    # Extract table name and pages
                    table_name = parts[1].replace('**', '').strip()
                    pages_str = parts[2].replace('**', '').strip()

                    # Parse page range
                    if '-' in pages_str and not pages_str.startswith('Table'):
                        # Multi-page: "9-11"
                        try:
                            start, end = map(int, pages_str.split('-'))
                            pages = list(range(start, end + 1))
                        except ValueError:
                            # Single page or complex format
                            try:
                                pages = [int(pages_str)]
                            except ValueError:
                                print(f"⚠️  Skipping {table_name}: Could not parse pages '{pages_str}'")
                                continue
                    else:
                        # Single page
                        try:
                            pages = [int(pages_str)]
                        except ValueError:
                            print(f"⚠️  Skipping {table_name}: Could not parse pages '{pages_str}'")
                            continue

                    # Get table number
                    table_num = table_name.replace('Table ', '').replace('Appendix', 'A')

                    tables.append({
                        'name': table_name,
                        'number': table_num,
                        'pages': pages
                    })

    if not tables:
        print("❌ No tables found in paper-index.md")
        return

    print(f"📊 Found {len(tables)} tables to extract:")
    for t in tables:
        print(f"   - {t['name']}: pages {t['pages']}")
    print()

    # Open PDF and extract tables
    pdf_doc = fitz.open(pdf_path)
    extracted_tables = []

    print('━' * 60)
    print('EXTRACTING TABLE PDF SECTIONS')
    print('━' * 60)
    print()

    for table in tables:
        table_name = table['name']
        table_num = table['number']
        pages = table['pages']

        if not pages:
            print(f'⚠️  Skipping {table_name}: No pages detected')
            continue

        # Create output filename
        if len(pages) == 1:
            output_filename = f"table-{table_num}-page-{pages[0]}.pdf"
        else:
            output_filename = f"table-{table_num}-page-{pages[0]}-{pages[-1]}.pdf"

        output_path = extracted_dir / output_filename

        # Create new PDF with only the table pages
        table_pdf = fitz.open()  # New empty PDF

        for page_num in pages:
            # PyMuPDF uses 0-based indexing
            if 0 <= (page_num - 1) < len(pdf_doc):
                table_pdf.insert_pdf(pdf_doc, from_page=page_num-1, to_page=page_num-1)
            else:
                print(f'⚠️  Page {page_num} out of range (PDF has {len(pdf_doc)} pages)')

        # Save table PDF
        if len(table_pdf) > 0:
            table_pdf.save(str(output_path))
            table_pdf.close()

            extracted_tables.append({
                'table_name': table_name,
                'table_num': table_num,
                'pages': pages,
                'pdf_file': output_filename,
                'pdf_path': str(output_path.relative_to(paper_dir))
            })

            print(f'✅ Extracted {table_name}: {output_filename} ({len(pages)} page(s))')
        else:
            print(f'⚠️  Skipping {table_name}: No valid pages found')

    pdf_doc.close()
    print()
    print(f'✅ Extracted {len(extracted_tables)} tables as separate PDFs')
    print()

    # Save extraction metadata
    metadata_file = extracted_dir / 'extraction-metadata.json'
    with open(metadata_file, 'w', encoding='utf-8') as f:
        json.dump({
            'pdf_name': pdf_path.name,
            'total_tables': len(extracted_tables),
            'tables': extracted_tables
        }, f, indent=2)

    print(f'📄 Metadata saved to: {metadata_file.relative_to(paper_dir)}')
    print()
    print('🎉 Table PDF extraction complete!')
    print()
    print('Next steps:')
    print('   1. Verify extracted PDFs in extracted/ directory')
    print('   2. Run /thermoextract to extract data from tables')


if __name__ == '__main__':
    if len(sys.argv) != 2:
        print("Usage: python extract-table-pdfs.py <paper_directory>")
        print()
        print("Example:")
        print("  python extract-table-pdfs.py 'build-data/learning/papers/McMillan(2024)-4D-fault-evolution-footwall-exhumation-Malawi-rift-J-Struct-Geol'")
        sys.exit(1)

    paper_dir = Path(sys.argv[1])

    if not paper_dir.exists():
        print(f"❌ Directory not found: {paper_dir}")
        sys.exit(1)

    extract_table_pdfs(paper_dir)
