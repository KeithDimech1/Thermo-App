#!/usr/bin/env python3
"""
Semantic Document Structure Analysis

Purpose: Understand PDF structure and classify tables
Author: Claude Code
Created: 2025-11-16

Features:
- Build table reference map ("Table 2A" → actual location + type)
- Classify table types (AFT ages, U-Th-He, counts, track lengths)
- Caption extraction and parsing
- Bounding box detection
"""

import logging
import re
from pathlib import Path
from typing import Dict, List, Optional, Tuple
import fitz  # pymupdf

logger = logging.getLogger(__name__)


class DocumentStructure:
    """Understand document layout and semantics"""

    def __init__(self, pdf_path: str):
        """
        Initialize document structure analyzer

        Args:
            pdf_path: Path to PDF file
        """
        self.pdf_path = Path(pdf_path)
        self.pdf = fitz.open(str(self.pdf_path))
        self.tables = {}  # table_id → {type, page, bbox, caption}
        self.full_text = ""

    def build_reference_map(self) -> Dict:
        """
        Map 'Table 2A' → actual table location + type

        Steps:
        1. Find all captions
        2. Extract table content
        3. Classify table type
        4. Store mapping

        Returns:
            Dictionary of table_id → table_info
        """
        logger.info("Building table reference map...")

        # Extract all text first
        self.full_text = ""
        for page in self.pdf:
            self.full_text += page.get_text()

        # Find all table captions
        captions = self._extract_table_captions()
        logger.info(f"Found {len(captions)} table captions")

        # Build reference map
        for caption_info in captions:
            table_id = caption_info['id']
            page_num = caption_info['page']
            caption_text = caption_info['caption']

            # Classify table type
            table_type = self.classify_table_from_caption(caption_text)

            # Find table bounding box
            bbox = self._find_table_bbox(page_num, caption_info['caption_bbox'])

            # Store in map
            self.tables[table_id] = {
                'type': table_type,
                'page': page_num,
                'bbox': bbox,
                'caption': caption_text
            }

            logger.debug(f"  {table_id}: {table_type} (page {page_num})")

        # Close PDF after analysis (enables caching)
        self.pdf.close()
        self.pdf = None

        return self.tables

    def _extract_table_captions(self) -> List[Dict]:
        """
        Find all table captions in document

        Returns:
            List of caption dictionaries with id, page, caption text, bbox
        """
        captions = []

        # Pattern for scientific table captions
        # Matches: "Table 1", "Table 2A", "Table S1", etc.
        # Optional period/colon: some papers have "Table 1:" others "Table 1 "
        # Requires caption to start with uppercase letter (avoid "(continued)" matches)
        pattern = r'(?:^|\n)\s*Table\s+([A-Z]?\d+[A-Z]?)\s*[.:]?\s*([A-Z][^\n]{10,300})'

        for page_num in range(len(self.pdf)):
            page = self.pdf[page_num]
            text = page.get_text()

            # Find caption matches
            for match in re.finditer(pattern, text, re.IGNORECASE | re.MULTILINE):
                table_id = match.group(1).strip()
                caption_text = match.group(2).strip()

                # Skip false positives (continuation markers, etc.)
                if caption_text.lower().startswith('(continued)'):
                    continue
                if caption_text.startswith('(') and len(caption_text) < 30:
                    continue

                # Normalize table ID (e.g., "2a" → "2A")
                if table_id[-1].isalpha():
                    table_id = table_id[:-1] + table_id[-1].upper()

                # Find caption bounding box (for bbox detection)
                caption_bbox = self._find_text_bbox(page, match.group(0)[:50])

                captions.append({
                    'id': f"Table {table_id}",
                    'page': page_num,
                    'caption': caption_text,
                    'caption_bbox': caption_bbox
                })

        return captions

    def _find_text_bbox(self, page, text_snippet: str, fuzzy: bool = True) -> Optional[Tuple]:
        """
        Find bounding box of text snippet on page

        Args:
            page: PyMuPDF page object
            text_snippet: Text to search for (full caption match)
            fuzzy: Allow fuzzy matching

        Returns:
            (x0, y0, x1, y1) or None
        """
        # Extract table ID from snippet (e.g., "TABLE 1" from "\nTABLE 1. ILLUSTRATIVE...")
        import re
        table_id_match = re.search(r'TABLE\s+([A-Z]?\d+[A-Z]?)', text_snippet, re.IGNORECASE)
        if not table_id_match:
            return None

        table_id = table_id_match.group(0)  # e.g., "TABLE 1"

        # Search for table ID on page
        text_instances = page.search_for(table_id, flags=fitz.TEXT_PRESERVE_WHITESPACE)

        if not text_instances:
            return None

        # Filter instances to reasonable caption locations
        # Captions are usually:
        # - In the left 70% of the page (not far right margin)
        # - Not in the very bottom 20% of the page
        page_width = page.rect.width
        page_height = page.rect.height

        valid_instances = []
        for rect in text_instances:
            # Check if in reasonable location
            if rect.x0 < page_width * 0.7 and rect.y0 < page_height * 0.8:
                valid_instances.append(rect)

        if not valid_instances:
            # Fallback: use first match
            valid_instances = text_instances

        # Return the topmost valid instance (earliest on page)
        topmost = min(valid_instances, key=lambda r: r.y0)
        return (topmost.x0, topmost.y0, topmost.x1, topmost.y1)

    def _find_table_bbox(self, page_num: int, caption_bbox: Optional[Tuple]) -> Tuple:
        """
        Find table bounding box below caption

        Strategy:
        - Table usually starts below caption
        - Extends to next section or page bottom
        - Full page width or slightly inset
        - Handles rotated pages (90° rotation)

        Args:
            page_num: Page number
            caption_bbox: Caption bounding box (x0, y0, x1, y1) - may be in rotated coords

        Returns:
            Table bounding box (x0, y0, x1, y1)
        """
        page = self.pdf[page_num]
        page_rect = page.rect

        # Check if page is rotated
        rotation = page.rotation

        # For rotated pages (90°), caption coords are in original system
        # which doesn't match page.rect. Use simple fallback for now.
        if rotation != 0:
            # Use generous bbox that covers most of page
            # Tables on rotated pages typically span full width/height
            x0 = page_rect.x0 + 50
            x1 = page_rect.x1 - 50
            y0 = page_rect.y0 + 100  # Start from top
            y1 = page_rect.y1 - 50   # Go to bottom
            return (x0, y0, x1, y1)

        # Default: full page width, below caption
        x0 = page_rect.x0 + 50  # Left margin
        x1 = page_rect.x1 - 50  # Right margin

        if caption_bbox:
            # Start below caption
            y0 = caption_bbox[3] + 10  # 10pt below caption bottom
        else:
            # Fallback: start 100pt from top
            y0 = page_rect.y0 + 100

        # End at page bottom minus margin (or next section)
        y1 = page_rect.y1 - 50

        return (x0, y0, x1, y1)

    def classify_table_from_caption(self, caption: str) -> str:
        """
        Classify table type from caption text

        Args:
            caption: Table caption text

        Returns:
            Table type: 'AFT_ages', 'UThHe', 'track_counts', 'track_lengths', 'unknown'
        """
        caption_lower = caption.lower()

        # AFT ages table
        aft_keywords = ['apatite fission', 'fission-track', 'ft age', 'aft age',
                        'central age', 'pooled age', 'dispersion', 'p(χ²)']
        if any(kw in caption_lower for kw in aft_keywords):
            return 'AFT_ages'

        # (U-Th)/He table
        he_keywords = ['(u-th)/he', 'u-th-he', 'helium', 'ahe age', 'ahe data',
                       'single grain', 'grain age', 'ft correction']
        if any(kw in caption_lower for kw in he_keywords):
            return 'UThHe'

        # Track counts table
        count_keywords = ['track count', 'track densit', 'spontaneous track',
                          'induced track', 'ns', 'ni', 'ρs', 'ρi']
        if any(kw in caption_lower for kw in count_keywords):
            return 'track_counts'

        # Track lengths table
        length_keywords = ['track length', 'confined track', 'mtl', 'mean track length',
                           'length distribution', 'c-axis']
        if any(kw in caption_lower for kw in length_keywords):
            return 'track_lengths'

        # Default
        logger.warning(f"Could not classify table from caption: {caption[:60]}...")
        return 'unknown'

    def classify_table(self, table_content: str, caption: str) -> str:
        """
        Determine table type from content + caption

        Args:
            table_content: Extracted table content (text)
            caption: Table caption

        Returns:
            Table type
        """
        # First try caption
        caption_type = self.classify_table_from_caption(caption)
        if caption_type != 'unknown':
            return caption_type

        # Fallback: analyze content
        content_lower = table_content.lower()

        # Check for column headers
        patterns = {
            'AFT_ages': ['age', 'ma', 'p(χ²)', 'dispersion', '±'],
            'UThHe': ['u', 'th', 'he', 'ft', 'corrected age', 'raw age'],
            'track_counts': ['ns', 'ni', 'ρs', 'ρi', 'rho_s', 'rho_i'],
            'track_lengths': ['length', 'mtl', 'μm', 'dpar', 'c-axis']
        }

        scores = {}
        for table_type, keywords in patterns.items():
            score = sum(1 for kw in keywords if kw in content_lower)
            scores[table_type] = score

        # Return type with highest score
        if max(scores.values()) > 0:
            return max(scores, key=scores.get)

        return 'unknown'

    def resolve_reference(self, ref_text: str) -> Optional[Dict]:
        """
        Resolve table reference to table object

        Args:
            ref_text: Reference text (e.g., "Table 2A")

        Returns:
            Table info dict or None
        """
        # Normalize reference (e.g., "table 2a" → "Table 2A")
        ref_text = ref_text.strip()
        if not ref_text.startswith('Table'):
            ref_text = 'Table ' + ref_text

        return self.tables.get(ref_text)

    def get_table_info(self, table_id: str) -> Optional[Dict]:
        """Get table information by ID"""
        return self.tables.get(table_id)

    def get_tables_by_type(self, table_type: str) -> List[str]:
        """
        Get all table IDs of a specific type

        Args:
            table_type: Table type to filter by

        Returns:
            List of table IDs
        """
        return [
            table_id
            for table_id, info in self.tables.items()
            if info['type'] == table_type
        ]

    def __del__(self):
        """Close PDF on cleanup"""
        if hasattr(self, 'pdf') and self.pdf is not None:
            self.pdf.close()
