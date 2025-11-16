#!/usr/bin/env python3
"""
Break research papers into individual section files for better indexing.
Each major section becomes its own markdown file.
"""

import os
import re
from pathlib import Path
from typing import List, Tuple

def extract_sections(content: str, paper_name: str) -> List[Tuple[str, str, str]]:
    """
    Extract sections from markdown content.
    Returns list of (section_name, filename, content) tuples.
    """
    sections = []

    # Split by major section headers (### level)
    lines = content.split('\n')

    current_section = None
    current_content = []
    current_filename = None
    section_counter = 0

    # Extract title and metadata first
    title_lines = []
    i = 0
    while i < len(lines) and not lines[i].startswith('## [PAGE'):
        title_lines.append(lines[i])
        i += 1

    if title_lines:
        sections.append(("00-metadata", "00-metadata.md", '\n'.join(title_lines)))

    # Process rest of document
    for line in lines[i:]:
        # Check for major section headers (### level, not #### or #####)
        if re.match(r'^###\s+(?!#)', line):
            # Save previous section if exists
            if current_section and current_content:
                sections.append((current_section, current_filename, '\n'.join(current_content)))

            # Start new section
            section_counter += 1
            section_title = line.replace('###', '').strip()

            # Clean section title for filename
            clean_title = re.sub(r'[^\w\s-]', '', section_title.lower())
            clean_title = re.sub(r'\s+', '-', clean_title)
            clean_title = clean_title[:50]  # Limit length

            current_section = section_title
            current_filename = f"{section_counter:02d}-{clean_title}.md"
            current_content = [f"# {section_title}\n"]
        else:
            if current_content is not None:
                current_content.append(line)

    # Save last section
    if current_section and current_content:
        sections.append((current_section, current_filename, '\n'.join(current_content)))

    return sections

def create_index_file(sections: List[Tuple[str, str, str]], paper_title: str) -> str:
    """Create an index/README file for the paper sections."""
    index_content = f"# {paper_title}\n\n"
    index_content += "## Contents\n\n"
    index_content += "This paper has been broken into individual section files for easier navigation and indexing:\n\n"

    for section_name, filename, _ in sections:
        if filename != "00-metadata.md":
            index_content += f"- [{section_name}](./{filename})\n"

    index_content += "\n## Files\n\n"
    for section_name, filename, _ in sections:
        index_content += f"- `{filename}` - {section_name}\n"

    return index_content

def process_paper(paper_path: str, output_base: str, paper_short_name: str, paper_title: str):
    """Process a single paper and break it into sections."""

    print(f"\nProcessing: {paper_title}")
    print(f"Input: {paper_path}")

    # Read the paper
    with open(paper_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Extract sections
    sections = extract_sections(content, paper_short_name)
    print(f"Found {len(sections)} sections")

    # Create output directory
    output_dir = Path(output_base) / paper_short_name
    output_dir.mkdir(parents=True, exist_ok=True)
    print(f"Output directory: {output_dir}")

    # Write section files
    for section_name, filename, section_content in sections:
        output_file = output_dir / filename
        with open(output_file, 'w', encoding='utf-8') as f:
            f.write(section_content)
        print(f"  ✓ Created: {filename}")

    # Create index file
    index_content = create_index_file(sections, paper_title)
    index_file = output_dir / "README.md"
    with open(index_file, 'w', encoding='utf-8') as f:
        f.write(index_content)
    print(f"  ✓ Created: README.md")

    return len(sections)

def main():
    base_path = "/Users/keithdimech/Pathway/Dev/Clair/Wayne Test Project"

    # Output directory for indexed papers
    output_base = f"{base_path}/build-data/learning/papers-indexed"

    papers = [
        {
            "path": f"{base_path}/build-data/learning/text/Dimech (2020) - Does a change in quality control results influence the sensitivity of an anti-HCV test/Dimech_2020_HCV_Sensitivity_QC_Change.md",
            "short_name": "dimech-2020-hcv-qc",
            "title": "Dimech (2020) - HCV QC Sensitivity Study"
        },
        {
            "path": f"{base_path}/build-data/learning/text/Dimech (2025) - Cost-benefit analysis of two quality control approaches for infectious disease testing/Dimech_2025_QC_Cost_Benefit_Analysis.md",
            "short_name": "dimech-2025-qc-cost-benefit",
            "title": "Dimech (2025) - QC Cost-Benefit Analysis"
        }
    ]

    print("=" * 70)
    print("Breaking Research Papers into Indexed Sections")
    print("=" * 70)

    total_sections = 0
    for paper in papers:
        sections_count = process_paper(
            paper["path"],
            output_base,
            paper["short_name"],
            paper["title"]
        )
        total_sections += sections_count

    print("\n" + "=" * 70)
    print(f"✓ Complete! Created {total_sections} total section files")
    print(f"Output location: {output_base}")
    print("=" * 70)

if __name__ == "__main__":
    main()
