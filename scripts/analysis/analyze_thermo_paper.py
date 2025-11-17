#!/usr/bin/env python3
"""
Comprehensive thermochronology paper analysis script.

Creates indexed documentation with:
- Plain text extraction
- Table discovery
- Image extraction with caption matching
- Structured metadata for /thermoextract integration
"""

import re
import json
import sys
from pathlib import Path
from datetime import datetime

try:
    import fitz  # PyMuPDF
except ImportError:
    print("❌ PyMuPDF not installed. Installing...")
    import subprocess
    subprocess.check_call([sys.executable, "-m", "pip", "install", "PyMuPDF"])
    import fitz


def extract_plain_text(pdf_path, output_dir):
    """Extract plain text from PDF for reusable analysis."""
    print('━' * 60)
    print('STEP 1.5: EXTRACTING PLAIN TEXT FROM PDF')
    print('━' * 60)
    print()

    text_dir = output_dir / 'text'
    text_dir.mkdir(exist_ok=True)

    doc = fitz.open(pdf_path)
    plain_text = []
    total_pages = len(doc)

    for page_num, page in enumerate(doc, start=1):
        text = page.get_text("text")
        plain_text.append(f"--- PAGE {page_num} ---\n{text}\n")

    # Save to file
    text_file = text_dir / 'plain-text.txt'
    with open(text_file, 'w', encoding='utf-8') as f:
        f.write('\n'.join(plain_text))

    print(f'✅ Extracted plain text from {total_pages} pages')
    print(f'✅ Saved to: {text_file}')
    print()

    doc.close()
    return text_file, total_pages


def discover_tables(text_file):
    """Dynamically discover tables in PDF text using pattern matching."""
    print('━' * 60)
    print('STEP 1.6: DISCOVERING TABLES IN PDF')
    print('━' * 60)
    print()

    with open(text_file, 'r', encoding='utf-8') as f:
        text_content = f.read()

    discovered_tables = []

    # Pattern: "Table X" references (flexible numbering)
    table_pattern = r'(?:Table|TABLE)\s+([A-Z]?\d+[A-Za-z]?)'
    matches = re.finditer(table_pattern, text_content)

    seen_tables = set()

    for match in matches:
        table_ref = match.group(0)
        table_num = match.group(1)

        if table_num in seen_tables:
            continue
        seen_tables.add(table_num)

        # Get surrounding context
        context = text_content[match.start():match.end()+300]

        # Detect table type from context
        table_type = 'unknown'
        context_lower = context.lower()

        if any(kw in context_lower for kw in ['fission', 'track', 'aft', 'apatite fission']):
            table_type = 'AFT'
        elif any(kw in context_lower for kw in ['u-th', 'he', 'helium', '(u-th)/he', 'ahe']):
            table_type = 'He'
        elif any(kw in context_lower for kw in ['sample', 'location', 'coordinate', 'lithology']):
            table_type = 'Sample_Metadata'
        elif any(kw in context_lower for kw in ['empa', 'chemistry', 'mineral composition', 'wt%', 'apfu']):
            table_type = 'Chemistry'

        # Estimate page number
        page_estimate = text_content[:match.start()].count('--- PAGE') + 1

        discovered_tables.append({
            'name': table_ref,
            'number': table_num,
            'type': table_type,
            'page_estimate': page_estimate,
            'context': context[:200]
        })

    print(f'✅ Discovered {len(discovered_tables)} tables:')
    for table in discovered_tables:
        print(f'   - {table["name"]} (Type: {table["type"]}, Page: ~{table["page_estimate"]})')
    print()

    return discovered_tables


def create_text_index(text_dir, total_pages, discovered_tables):
    """Generate text index with discovered table metadata."""
    print('━' * 60)
    print('STEP 1.7: GENERATING TEXT INDEX')
    print('━' * 60)
    print()

    text_index_path = text_dir / 'text-index.md'

    with open(text_index_path, 'w') as f:
        f.write("# Plain Text Index\n\n")
        f.write("**Source:** Extracted from PDF using PyMuPDF\n")
        f.write(f"**Total Pages:** {total_pages}\n")
        f.write(f"**Tables Discovered:** {len(discovered_tables)}\n\n")
        f.write("---\n\n")

        f.write("## Discovered Tables\n\n")
        f.write("| Table | Type | Page (est.) | Context Preview |\n")
        f.write("|-------|------|-------------|------------------|\n")
        for table in discovered_tables:
            context_preview = table['context'][:60].replace('\n', ' ').replace('|', '/') + '...'
            f.write(f"| {table['name']} | {table['type']} | {table['page_estimate']} | {context_preview} |\n")

        f.write("\n---\n\n")
        f.write("## File Structure\n\n")
        f.write("- `plain-text.txt` - Full text extraction (reusable)\n")
        f.write("- `text-index.md` - This file (discovered table locations)\n")
        f.write("\n---\n\n")
        f.write("**Next Steps:**\n")
        f.write("- Run `/thermoextract` to extract tables using multi-method approach\n")
        f.write("- Extraction will use this index for faster table identification\n")

    print(f'✅ Created text index: {text_index_path}')
    print()

    return text_index_path


def extract_images(pdf_path, output_dir):
    """Extract images and match with figure captions."""
    print('━' * 60)
    print('STEP 1.8: EXTRACTING IMAGES FROM PDF')
    print('━' * 60)
    print()

    images_dir = output_dir / 'images'
    images_dir.mkdir(exist_ok=True)

    doc = fitz.open(pdf_path)
    extracted_images = []

    # First pass: Extract figure captions
    figure_captions = {}
    for page_num in range(len(doc)):
        page = doc[page_num]
        text = page.get_text()

        # Find figure captions
        fig_matches = re.finditer(
            r'(?:Figure|Fig\.?)\s+(\d+[A-Za-z]?)[\.:]\s*([^\n]+(?:\n(?![A-Z][a-z]+\s+\d+)[^\n]+)*)',
            text,
            re.IGNORECASE | re.MULTILINE
        )

        for match in fig_matches:
            fig_num = match.group(1)
            caption = match.group(2).strip()
            caption = re.sub(r'\s+', ' ', caption)

            figure_captions[f"Figure {fig_num}"] = {
                "page": page_num + 1,
                "caption": caption
            }

    # Second pass: Extract images
    for page_num in range(len(doc)):
        page = doc[page_num]
        image_list = page.get_images()

        for img_index, img in enumerate(image_list):
            xref = img[0]
            base_image = doc.extract_image(xref)
            image_bytes = base_image["image"]
            image_ext = base_image["ext"]

            # Save image
            image_filename = f"page_{page_num + 1}_img_{img_index}.{image_ext}"
            image_path = images_dir / image_filename

            with open(image_path, "wb") as img_file:
                img_file.write(image_bytes)

            # Match to figure caption
            matched_figure = None
            description = None

            for fig_name, fig_data in figure_captions.items():
                if abs(fig_data["page"] - (page_num + 1)) <= 1:
                    if matched_figure is None:
                        matched_figure = fig_name
                        description = fig_data["caption"]

            # Record metadata
            image_metadata = {
                "filename": image_filename,
                "page": page_num + 1,
                "index": img_index,
                "format": image_ext,
                "width": base_image["width"],
                "height": base_image["height"]
            }

            if matched_figure and description:
                image_metadata["figure_number"] = matched_figure
                image_metadata["description"] = description

            extracted_images.append(image_metadata)

    print(f'✅ Extracted {len(extracted_images)} images from {len(doc)} pages')
    print(f'✅ Found {len(figure_captions)} figure captions')
    print()

    doc.close()
    return extracted_images, figure_captions


def create_image_metadata(images_dir, pdf_name, dataset_name, extracted_images, figure_captions):
    """Generate image metadata JSON for database import."""
    # Create figures summary
    figures_summary = {}
    for img in extracted_images:
        if "figure_number" in img:
            fig_num = img["figure_number"]
            if fig_num not in figures_summary:
                figures_summary[fig_num] = {
                    "description": img["description"],
                    "images": []
                }
            figures_summary[fig_num]["images"].append({
                "filename": img["filename"],
                "page": img["page"]
            })

    metadata = {
        "paper": dataset_name,
        "pdf": pdf_name,
        "total_images": len(extracted_images),
        "total_figures_identified": len(figures_summary),
        "extracted_date": datetime.now().isoformat(),
        "figures_summary": figures_summary,
        "images": extracted_images
    }

    metadata_path = images_dir / 'image-metadata.json'
    with open(metadata_path, 'w') as f:
        json.dump(metadata, f, indent=2)

    print(f'✅ Image metadata saved: {metadata_path}')
    print(f'   - {len(figures_summary)} figures identified with descriptions')
    print(f'   - {len(extracted_images) - sum(1 for img in extracted_images if "figure_number" in img)} images without captions')
    print()

    return metadata_path, figures_summary


def create_figures_md(output_dir, figures_summary):
    """Generate human-readable figures markdown."""
    figures_md_path = output_dir / 'figures.md'

    with open(figures_md_path, 'w') as f:
        f.write("# Extracted Figures and Descriptions\n\n")
        f.write("**Source:** Extracted directly from PDF text\n\n")
        f.write("---\n\n")

        for fig_name in sorted(figures_summary.keys(), key=lambda x: int(re.search(r'\d+', x).group())):
            fig_data = figures_summary[fig_name]
            f.write(f"## {fig_name}\n\n")
            f.write(f"**Page:** {fig_data['images'][0]['page']}\n\n")
            f.write(f"**Description:**\n{fig_data['description']}\n\n")
            f.write(f"**Image Files:**\n")
            for img in fig_data['images']:
                f.write(f"- [images/{img['filename']}](./images/{img['filename']}) (page {img['page']})\n")
            f.write(f"\n**Preview:**\n")
            f.write(f"![{fig_name}](./images/{fig_data['images'][0]['filename']})\n")
            f.write("\n---\n\n")

    print(f'✅ Created figures.md for human-readable descriptions')
    print()

    return figures_md_path


def extract_metadata_from_text(text_file):
    """Extract key paper metadata from plain text."""
    print('━' * 60)
    print('EXTRACTING PAPER METADATA')
    print('━' * 60)
    print()

    with open(text_file, 'r', encoding='utf-8') as f:
        text = f.read()

    metadata = {}

    # Extract title (usually first substantial text)
    title_match = re.search(r'--- PAGE 1 ---\n(.+?)\n', text)
    if title_match:
        metadata['title'] = title_match.group(1).strip()

    # Extract DOI
    doi_match = re.search(r'(?:doi|DOI)[:\s]+([0-9.]+/[^\s]+)', text)
    if doi_match:
        metadata['doi'] = doi_match.group(1)

    # Extract year from text patterns
    year_match = re.search(r'(?:19|20)\d{2}', text[:2000])
    if year_match:
        metadata['year'] = year_match.group(0)

    # Look for thermochronology indicators
    if 'fission' in text.lower() and 'track' in text.lower():
        metadata['has_ft'] = True
    if '(u-th)/he' in text.lower() or 'helium' in text.lower():
        metadata['has_he'] = True

    # Look for mineral types
    if 'apatite' in text.lower():
        metadata['mineral'] = 'apatite'
    elif 'zircon' in text.lower():
        metadata['mineral'] = 'zircon'

    print('✅ Extracted metadata:')
    for key, value in metadata.items():
        print(f'   - {key}: {value}')
    print()

    return metadata


def main():
    """Main execution workflow."""
    if len(sys.argv) < 2:
        print("Usage: python analyze_thermo_paper.py <pdf_path> [folder_name]")
        sys.exit(1)

    pdf_path = Path(sys.argv[1])
    if not pdf_path.exists():
        print(f"❌ PDF not found: {pdf_path}")
        sys.exit(1)

    # Determine folder name
    if len(sys.argv) >= 3:
        folder_name = sys.argv[2]
    else:
        folder_name = pdf_path.stem

    # Setup output directory
    output_dir = Path('build-data/learning/thermo-papers') / folder_name
    output_dir.mkdir(parents=True, exist_ok=True)

    print('=' * 60)
    print('THERMOCHRONOLOGY PAPER ANALYSIS')
    print('=' * 60)
    print(f'PDF: {pdf_path}')
    print(f'Output: {output_dir}')
    print('=' * 60)
    print()

    # STEP 1.5: Extract plain text
    text_file, total_pages = extract_plain_text(pdf_path, output_dir)

    # STEP 1.6: Discover tables
    discovered_tables = discover_tables(text_file)

    # STEP 1.7: Create text index
    create_text_index(output_dir / 'text', total_pages, discovered_tables)

    # STEP 1.8: Extract images
    extracted_images, figure_captions = extract_images(pdf_path, output_dir)

    # Create image metadata
    create_image_metadata(
        output_dir / 'images',
        pdf_path.name,
        folder_name,
        extracted_images,
        figure_captions
    )

    # Create figures.md
    create_figures_md(output_dir,
        {k: v for k, v in
         {fig_name: {"description": fig_data["caption"],
                     "images": [{"filename": img["filename"], "page": img["page"]}
                               for img in extracted_images
                               if img.get("figure_number") == fig_name]}
          for fig_name, fig_data in figure_captions.items()}.items()
         if v["images"]})

    # Extract metadata
    metadata = extract_metadata_from_text(text_file)

    # Final report
    print('=' * 60)
    print('✅ EXTRACTION COMPLETE')
    print('=' * 60)
    print()
    print(f'📂 Output directory: {output_dir}')
    print(f'📄 Total pages: {total_pages}')
    print(f'📊 Tables discovered: {len(discovered_tables)}')
    print(f'📸 Images extracted: {len(extracted_images)}')
    print(f'🖼️  Figures identified: {len(figure_captions)}')
    print()
    print('Files created:')
    print(f'  - text/plain-text.txt')
    print(f'  - text/text-index.md')
    print(f'  - images/ ({len(extracted_images)} files)')
    print(f'  - images/image-metadata.json')
    print(f'  - figures.md')
    print()
    print('🚀 Next steps:')
    print('  1. Review extracted content')
    print('  2. Create paper-index.md manually')
    print('  3. Create paper-analysis.md manually')
    print('  4. Run /thermoextract for data table extraction')
    print()


if __name__ == '__main__':
    main()
