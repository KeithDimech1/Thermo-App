#!/usr/bin/env python3
"""
Break terminology/reference documents into individual section files.
Each major section (## level) becomes its own markdown file in a dedicated folder.
"""

import os
import re
from pathlib import Path
from typing import List, Tuple

def extract_metadata_and_toc(lines: List[str]) -> Tuple[List[str], int]:
    """
    Extract front matter (title, metadata) and TOC.
    Returns (metadata_lines, end_index).
    """
    metadata_lines = []
    i = 0

    # Find the end of TOC (look for the separator after TOC or first main section)
    in_toc = False
    for idx, line in enumerate(lines):
        if line.strip() == "## Table of Contents":
            in_toc = True
            metadata_lines.append(line)
        elif in_toc and (line.startswith("---") or (line.startswith("## ") and "Table of Contents" not in line)):
            # End of TOC found
            if line.startswith("---"):
                metadata_lines.append(line)
                return metadata_lines, idx + 1
            else:
                return metadata_lines, idx
        elif not in_toc or in_toc:
            metadata_lines.append(line)

    return metadata_lines, 0

def extract_sections(content: str, doc_name: str) -> List[Tuple[str, str, str]]:
    """
    Extract sections from markdown content.
    Returns list of (section_name, filename, content) tuples.
    """
    sections = []
    lines = content.split('\n')

    # Extract metadata and TOC
    metadata_lines, start_idx = extract_metadata_and_toc(lines)

    if metadata_lines:
        sections.append(("Metadata & TOC", "00-metadata-toc.md", '\n'.join(metadata_lines)))

    # Process main sections (## level headers)
    current_section_title = None
    current_section_content = []
    current_filename = None
    section_counter = 0

    for i in range(start_idx, len(lines)):
        line = lines[i]

        # Check for main section headers (## level, not ### or more)
        if re.match(r'^##\s+(?!#)', line):
            # Save previous section if exists
            if current_section_title and current_section_content:
                sections.append((
                    current_section_title,
                    current_filename,
                    '\n'.join(current_section_content).strip()
                ))

            # Start new section
            section_counter += 1
            section_title = line.replace('##', '').strip()

            # Clean section title for filename
            clean_title = re.sub(r'[^\w\s-]', '', section_title.lower())
            clean_title = re.sub(r'\s+', '-', clean_title)
            clean_title = clean_title[:60]  # Limit length

            current_section_title = section_title
            current_filename = f"{section_counter:02d}-{clean_title}.md"
            current_section_content = [f"# {section_title}\n"]
        else:
            # Add line to current section
            if current_section_content is not None:
                current_section_content.append(line)

    # Save last section
    if current_section_title and current_section_content:
        sections.append((
            current_section_title,
            current_filename,
            '\n'.join(current_section_content).strip()
        ))

    return sections

def create_index_file(sections: List[Tuple[str, str, str]], doc_title: str, original_path: str) -> str:
    """Create an index/README file for the document sections."""
    index_content = f"# {doc_title}\n\n"
    index_content += f"**Source:** `{original_path}`\n\n"
    index_content += "This document has been broken into individual section files for easier navigation and indexing.\n\n"
    index_content += "---\n\n"
    index_content += "## Contents\n\n"

    for section_name, filename, _ in sections:
        index_content += f"- [{section_name}](./{filename})\n"

    index_content += "\n---\n\n"
    index_content += "## File List\n\n"
    index_content += "| # | File | Section |\n"
    index_content += "|---|------|----------|\n"

    for idx, (section_name, filename, _) in enumerate(sections):
        index_content += f"| {idx} | `{filename}` | {section_name} |\n"

    index_content += "\n---\n\n"
    index_content += "## Usage\n\n"
    index_content += "Each section is self-contained and can be read independently. "
    index_content += "Cross-references between sections are preserved as they were in the original document.\n"

    return index_content

def process_document(doc_path: str, output_base: str, folder_name: str, doc_title: str):
    """Process a single document and break it into sections."""

    print(f"\nProcessing: {doc_title}")
    print(f"Input: {doc_path}")

    # Read the document
    with open(doc_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Extract sections
    sections = extract_sections(content, folder_name)
    print(f"Found {len(sections)} sections")

    # Create output directory
    output_dir = Path(output_base) / folder_name
    output_dir.mkdir(parents=True, exist_ok=True)
    print(f"Output directory: {output_dir}")

    # Write section files
    for section_name, filename, section_content in sections:
        output_file = output_dir / filename
        with open(output_file, 'w', encoding='utf-8') as f:
            f.write(section_content)
        print(f"  ✓ Created: {filename} ({len(section_content)} chars)")

    # Create index file
    index_content = create_index_file(sections, doc_title, doc_path)
    index_file = output_dir / "README.md"
    with open(index_file, 'w', encoding='utf-8') as f:
        f.write(index_content)
    print(f"  ✓ Created: README.md (index)")

    return len(sections), output_dir

def main():
    base_path = "/Users/keithdimech/Pathway/Dev/Clair/Wayne Test Project"
    output_base = f"{base_path}/build-data/learning/terminology-indexed"

    documents = [
        {
            "path": f"{base_path}/build-data/learning/terminology/qc-clinical-operations-research.md",
            "folder_name": "qc-clinical-operations-research",
            "title": "Quality Control in Clinical Immunoassay Testing: Deep Dive Research"
        },
        {
            "path": f"{base_path}/build-data/learning/terminology/qc-data-terminology-reference.md",
            "folder_name": "qc-data-terminology-reference",
            "title": "QC Data Terminology Reference"
        }
    ]

    print("=" * 80)
    print("Breaking Terminology Documents into Indexed Sections")
    print("=" * 80)

    total_sections = 0
    output_dirs = []

    for doc in documents:
        sections_count, output_dir = process_document(
            doc["path"],
            output_base,
            doc["folder_name"],
            doc["title"]
        )
        total_sections += sections_count
        output_dirs.append(output_dir)

    print("\n" + "=" * 80)
    print(f"✓ Complete! Created {total_sections} total section files")
    print(f"\nOutput locations:")
    for output_dir in output_dirs:
        print(f"  - {output_dir}")
    print("=" * 80)

if __name__ == "__main__":
    main()
