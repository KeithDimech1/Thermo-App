#!/usr/bin/env python3
"""
Test script for enhanced image extraction with figure captions.
This will update the existing image-metadata.json for McMillan(2024) paper.
"""

import json
import re
from pathlib import Path
import fitz  # PyMuPDF

# Paths
PAPER_DIR = Path(__file__).parent.parent / "build-data/learning/thermo-papers/McMillan(2024)-Malawi-Rift-4D-Fault-Evolution"
PDF_PATH = PAPER_DIR / "4D fault evolution revealed by footwall exhumation modelling_ A natural experiment in the Malawi rift.pdf"
IMAGES_DIR = PAPER_DIR / "images"
METADATA_PATH = IMAGES_DIR / "image-metadata.json"

def extract_figure_captions(pdf_path):
    """Extract all figure captions from the PDF text."""
    print("━" * 60)
    print("EXTRACTING FIGURE CAPTIONS FROM PDF")
    print("━" * 60)
    print()

    doc = fitz.open(pdf_path)
    figure_captions = {}

    for page_num in range(len(doc)):
        page = doc[page_num]
        text = page.get_text()

        # Find figure captions (common patterns)
        # Pattern matches: "Figure X. Caption" or "Fig. X. Caption"
        # Handles multi-line captions
        fig_matches = re.finditer(
            r'(?:Figure|Fig\.?)\s+(\d+[A-Za-z]?)[\.:]\s*([^\n]+(?:\n(?![A-Z][a-z]+\s+\d+)[^\n]+)*)',
            text,
            re.IGNORECASE | re.MULTILINE
        )

        for match in fig_matches:
            fig_num = match.group(1)
            caption = match.group(2).strip()
            # Clean up caption (remove extra whitespace)
            caption = re.sub(r'\s+', ' ', caption)
            # DO NOT truncate - keep full description for database import

            # Store with page number for context
            figure_captions[f"Figure {fig_num}"] = {
                "page": page_num + 1,
                "caption": caption
            }

    doc.close()

    print(f"✅ Found {len(figure_captions)} figure captions")
    for fig_name, fig_data in sorted(figure_captions.items(), key=lambda x: x[1]["page"]):
        print(f"   - {fig_name} (page {fig_data['page']}): {fig_data['caption'][:80]}...")
    print()

    return figure_captions

def create_figures_markdown(images_dir, figures_summary):
    """Create a human-readable markdown file with figure descriptions."""
    figures_md_path = images_dir.parent / "figures.md"

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
            # Add embedded image preview (first image only to keep file size reasonable)
            f.write(f"![{fig_name}](./images/{fig_data['images'][0]['filename']})\n")
            f.write("\n---\n\n")

    print(f"✅ Created figures.md for human-readable descriptions")
    return figures_md_path

def enhance_image_metadata(metadata_path, figure_captions):
    """Add figure captions to existing image metadata."""
    print("━" * 60)
    print("ENHANCING IMAGE METADATA")
    print("━" * 60)
    print()

    # Read existing metadata
    with open(metadata_path, 'r') as f:
        metadata = json.load(f)

    # Match images to figure captions
    matched_count = 0
    for img in metadata["images"]:
        page = img["page"]

        # Try to match image to figure caption based on page
        matched_figure = None
        description = None

        for fig_name, fig_data in figure_captions.items():
            # Match if figure is on same page or adjacent pages (±1)
            if abs(fig_data["page"] - page) <= 1:
                if matched_figure is None:
                    matched_figure = fig_name
                    description = fig_data["caption"]
                # If multiple figures near this page, prefer exact page match
                elif fig_data["page"] == page:
                    matched_figure = fig_name
                    description = fig_data["caption"]

        # Add figure information if matched
        if matched_figure and description:
            img["figure_number"] = matched_figure
            img["description"] = description
            matched_count += 1

    # Create figures summary
    figures_summary = {}
    for img in metadata["images"]:
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

    # Update metadata
    metadata["total_figures_identified"] = len(figures_summary)
    metadata["figures_summary"] = figures_summary

    # Save enhanced metadata
    with open(metadata_path, 'w') as f:
        json.dump(metadata, f, indent=2)

    print(f"✅ Enhanced metadata saved: {metadata_path.name}")
    print(f"   - Total images: {metadata['total_images']}")
    print(f"   - Matched to figures: {matched_count}")
    print(f"   - Figures identified: {len(figures_summary)}")
    print(f"   - Unmatched images: {metadata['total_images'] - matched_count}")
    print()

    return figures_summary

def main():
    """Main function."""
    print()
    print("=" * 60)
    print("ENHANCED IMAGE EXTRACTION TEST")
    print("Paper: McMillan(2024) - Malawi Rift 4D Fault Evolution")
    print("=" * 60)
    print()

    # Check if files exist
    if not PDF_PATH.exists():
        print(f"❌ PDF not found: {PDF_PATH}")
        return

    if not METADATA_PATH.exists():
        print(f"❌ Metadata not found: {METADATA_PATH}")
        return

    # Extract figure captions from PDF
    figure_captions = extract_figure_captions(PDF_PATH)

    # Enhance existing metadata with captions
    figures_summary = enhance_image_metadata(METADATA_PATH, figure_captions)

    # Create human-readable markdown file
    figures_md_path = create_figures_markdown(IMAGES_DIR, figures_summary)

    print()
    print("✅ TEST COMPLETE")
    print()
    print("Files created/updated:")
    print(f"   - {METADATA_PATH.name} (JSON for database import)")
    print(f"   - {figures_md_path.name} (Markdown for human readability)")
    print()
    print("Next steps:")
    print("1. Review figures.md for full descriptions")
    print("2. Review image-metadata.json structure")
    print("3. If satisfied, this will be integrated into /thermoanalysis")
    print()

if __name__ == "__main__":
    main()
