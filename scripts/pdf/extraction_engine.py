#!/usr/bin/env python3
"""
Universal Thermochronology PDF Extraction Engine

Purpose: Dataset/paper/journal-neutral extraction with semantic understanding
Author: Claude Code
Created: 2025-11-16
Status: Phase 1 - Core implementation

Features:
- Multi-method table extraction (camelot + pdfplumber + voting)
- Semantic table classification (AFT/AHe/counts/lengths)
- FAIR schema transformation
- Methods section metadata mining
- Multi-threaded processing
- Caching layer
"""

import logging
from pathlib import Path
from typing import Dict, List, Optional, Tuple
import pandas as pd

# Core extraction libraries
try:
    import camelot
    import fitz  # pymupdf
    import pdfplumber
except ImportError as e:
    logging.error(f"Missing required package: {e}")
    raise

# Local imports
from .cache import PDFCache
from .semantic_analysis import DocumentStructure
from .table_extractors import (
    extract_table_from_text,  # PRIMARY text-based extraction
    extract_with_camelot_lattice,
    extract_with_camelot_stream,
    extract_with_pdfplumber,
    evaluate_extraction_quality
)
from .fair_transformer import FAIRTransformer
from .methods_parser import MethodsParser
from .validators import validate_by_type
from .cleaners import clean_extracted_table
from .extraction_validator import ExtractionValidator

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class UniversalThermoExtractor:
    """
    Dataset/paper/journal-neutral extraction engine

    Workflow:
    1. Analyze document structure (semantic understanding)
    2. Extract all tables using multi-method voting
    3. Transform to FAIR schema
    4. Validate data quality

    Example:
        extractor = UniversalThermoExtractor('paper.pdf')
        extractor.analyze()
        data = extractor.extract_all()
        fair_data = extractor.transform_to_fair()
        validation = extractor.validate(fair_data)
    """

    def __init__(self, pdf_path: str, cache_dir: str = './cache', paper_dir: Optional[Path] = None):
        """
        Initialize extractor

        Args:
            pdf_path: Path to PDF file
            cache_dir: Directory for caching results
            paper_dir: Optional path to paper directory (for thermoanalysis integration)
        """
        self.pdf_path = Path(pdf_path)
        if not self.pdf_path.exists():
            raise FileNotFoundError(f"PDF not found: {pdf_path}")

        self.paper_dir = Path(paper_dir) if paper_dir else None
        self.cache = PDFCache(cache_dir)
        self.structure = None  # Document structure (DocumentStructure object)
        self.metadata = None   # Paper metadata (dict)
        self.tables = {}       # Extracted tables (dict of DataFrames)
        self.fair_data = {}    # FAIR-transformed data

        logger.info(f"Initialized extractor for: {self.pdf_path.name}")

    def analyze(self) -> 'UniversalThermoExtractor':
        """
        Step 1: Analyze document structure

        - Check for thermoanalysis outputs (use if available)
        - Fall back to PDF semantic analysis if not available
        - Build table reference map ("Table 2A" → actual location)
        - Classify table types (AFT/AHe/counts/lengths)
        - Extract paper metadata
        - Parse methods section for lab metadata

        Returns:
            self (for chaining)
        """
        logger.info("=" * 60)
        logger.info("STEP 1: Analyzing document structure")
        logger.info("=" * 60)

        # Check cache first
        cached = self.cache.get(str(self.pdf_path), 'structure')
        if cached:
            logger.info("✓ Using cached document structure")
            self.structure, self.metadata = cached
            return self

        # Check for thermoanalysis outputs (IDEA-012 integration)
        if self.paper_dir and (self.paper_dir / 'text' / 'text-index.md').exists():
            logger.info("✅ Found thermoanalysis outputs - using discovered tables")
            self._load_from_thermoanalysis()
        else:
            if self.paper_dir:
                logger.info("⚠️  No thermoanalysis found - using semantic analysis (slower)")
            self._analyze_pdf_directly()

        # Cache results
        self.cache.set(str(self.pdf_path), 'structure', (self.structure, self.metadata))

        return self

    def _analyze_pdf_directly(self):
        """
        Analyze PDF directly using semantic analysis

        This is the original analyze() logic, used when thermoanalysis not available.
        """
        # Build document structure
        logger.info("→ Building document structure...")
        self.structure = DocumentStructure(str(self.pdf_path))
        self.structure.build_reference_map()

        logger.info(f"✓ Found {len(self.structure.tables)} tables")
        for table_id, table_info in self.structure.tables.items():
            logger.info(f"  - {table_id}: {table_info['type']} (page {table_info['page']})")

        # Extract metadata
        logger.info("→ Extracting paper metadata...")
        self.metadata = self._extract_metadata()
        logger.info(f"✓ Paper: {self.metadata.get('title', 'Unknown')[:60]}...")

        # Parse methods section
        logger.info("→ Parsing methods section...")
        methods_parser = MethodsParser()
        methods_metadata = methods_parser.parse_methods(self._get_full_text())
        self.metadata.update(methods_metadata)
        logger.info(f"✓ Extracted metadata: {len(methods_metadata)} fields")

    def _load_from_thermoanalysis(self):
        """
        Load discovered tables from thermoanalysis outputs

        Reads text/text-index.md and builds structure.tables from discovered metadata.
        Still needs to detect bboxes for extraction.
        """
        import re

        # Read text-index.md
        index_path = self.paper_dir / 'text' / 'text-index.md'
        logger.info(f"→ Reading discovered tables from {index_path.name}...")

        with open(index_path, 'r', encoding='utf-8') as f:
            content = f.read()

        # Parse markdown table
        discovered = []
        in_table = False

        for line in content.split('\n'):
            if line.startswith('| Table |'):
                in_table = True
                continue
            if in_table and line.startswith('|') and not line.startswith('|----'):
                # Parse table row: | Table 1 | AFT | 9 | Context... |
                parts = [p.strip() for p in line.split('|')]
                if len(parts) >= 5 and parts[1]:  # Valid row
                    discovered.append({
                        'name': parts[1],
                        'type': parts[2],
                        'page': int(parts[3]) if parts[3].isdigit() else 1,
                        'context': parts[4][:150]
                    })
            elif in_table and not line.startswith('|'):
                break

        logger.info(f"✓ Found {len(discovered)} tables from thermoanalysis")

        # Initialize structure (need this for bbox detection)
        self.structure = DocumentStructure(str(self.pdf_path))

        # Build structure.tables from discovered metadata
        for table_info in discovered:
            table_name = table_info['name']
            table_type = table_info['type']
            page_1indexed = table_info['page']
            page_0indexed = page_1indexed - 1  # Convert to 0-indexed

            # Use whole-page bbox (thermoanalysis doesn't provide caption bboxes)
            # Pass None as caption_bbox to use fallback logic
            bbox = self.structure._find_table_bbox(page_0indexed, None)

            self.structure.tables[table_name] = {
                'type': table_type,
                'page': page_0indexed,
                'bbox': bbox,
                'caption': f"{table_name} - {table_info['context']}"
            }
            logger.info(f"  - {table_name}: {table_type} (page {page_1indexed})")

        # Close PDF after bbox detection
        if self.structure.pdf:
            self.structure.pdf.close()
            self.structure.pdf = None

        logger.info(f"✓ Loaded {len(self.structure.tables)} tables from thermoanalysis")

        # Load metadata from paper-index.md if available
        paper_index_path = self.paper_dir / 'paper-index.md'
        if paper_index_path.exists():
            logger.info("→ Loading metadata from paper-index.md...")
            self.metadata = self._load_metadata_from_index(paper_index_path)
            logger.info(f"✓ Loaded metadata: {len(self.metadata)} fields")
        else:
            # Fall back to extracting metadata from PDF
            logger.info("→ Extracting paper metadata from PDF...")
            self.metadata = self._extract_metadata()
            logger.info(f"✓ Extracted metadata: {len(self.metadata)} fields")

    def _load_metadata_from_index(self, index_path: Path) -> Dict:
        """Load paper metadata from paper-index.md"""
        import re

        metadata = {}

        with open(index_path, 'r', encoding='utf-8') as f:
            content = f.read()

        # Extract metadata using regex
        patterns = {
            'title': r'\*\*Title:\*\* (.+)',
            'authors': r'\*\*Authors:\*\* (.+)',
            'year': r'\*\*Year:\*\* (\d{4})',
            'journal': r'\*\*Journal:\*\* (.+)',
            'doi': r'\*\*DOI:\*\* (.+)',
            'study_location': r'\*\*Study Area:\*\* (.+)',
            'mineral_type': r'\*\*Mineral Type:\*\* (.+)',
            'analysis_method': r'\*\*Analysis Method:\*\* (.+)',
        }

        for key, pattern in patterns.items():
            match = re.search(pattern, content)
            if match:
                metadata[key] = match.group(1).strip()

        return metadata

    def extract_all(self) -> Dict[str, pd.DataFrame]:
        """
        Step 2: Extract all tables using multi-method voting

        - Use type-specific extraction strategies
        - Try multiple methods (camelot lattice/stream, pdfplumber)
        - Vote on best result based on quality metrics
        - Clean and validate extracted data

        Returns:
            Dictionary of table_id → DataFrame
        """
        logger.info("=" * 60)
        logger.info("STEP 2: Extracting tables")
        logger.info("=" * 60)

        if not self.structure:
            raise RuntimeError("Must call analyze() first")

        # Check cache
        cached = self.cache.get(str(self.pdf_path), 'tables')
        if cached:
            logger.info("✓ Using cached table extractions")
            self.tables = cached
            return self.tables

        # Extract each table
        for table_id, table_info in self.structure.tables.items():
            logger.info(f"\n→ Extracting {table_id} ({table_info['type']})...")

            # Multi-method extraction with progressive fallback
            df = self._extract_table_with_progressive_fallback(
                table_info['page'],
                table_info['bbox'],
                table_info['type']
            )

            if df is not None:
                # Clean data
                df = clean_extracted_table(df, table_info['type'])

                # Validate (for reporting only, don't block extraction)
                validation = validate_by_type(df, table_info['type'])

                # ALWAYS save the table regardless of validation
                self.tables[table_id] = df

                # Log validation results
                if validation['valid']:
                    logger.info(f"✓ Extracted {len(df)} rows (confidence: {validation['confidence']:.0%})")
                else:
                    logger.warning(f"⚠ Extracted {len(df)} rows with validation warnings: {validation['issues']}")
            else:
                logger.warning(f"✗ Extraction failed for {table_id}")

        # Cache results
        self.cache.set(str(self.pdf_path), 'tables', self.tables)

        logger.info(f"\n✓ Successfully extracted {len(self.tables)} tables")
        return self.tables

    def transform_to_fair(self) -> Dict[str, pd.DataFrame]:
        """
        Step 3: Transform to FAIR-compliant schema

        - Denormalize publication tables → Normalize database schema
        - Add metadata fields from methods section
        - Generate required IDs (grain_id, sample_mount_id)
        - Split combined tables into separate FAIR tables

        Returns:
            Dictionary of table_name → DataFrame
            (samples, ft_ages, ft_counts, ft_track_lengths, ahe_grain_data)
        """
        logger.info("=" * 60)
        logger.info("STEP 3: Transforming to FAIR schema")
        logger.info("=" * 60)

        if not self.tables:
            raise RuntimeError("Must call extract_all() first")

        # Check cache
        cached = self.cache.get(str(self.pdf_path), 'fair_data')
        if cached:
            logger.info("✓ Using cached FAIR transformation")
            self.fair_data = cached
            return self.fair_data

        # Transform
        transformer = FAIRTransformer()
        self.fair_data = transformer.transform(self.tables, self.metadata)

        # Log results
        logger.info("✓ FAIR transformation complete:")
        for table_name, df in self.fair_data.items():
            logger.info(f"  - {table_name}: {len(df)} records, {len(df.columns)} fields")

        # Cache results
        self.cache.set(str(self.pdf_path), 'fair_data', self.fair_data)

        return self.fair_data

    def validate(self, data: Optional[Dict[str, pd.DataFrame]] = None) -> Dict:
        """
        Step 4: Validate data quality

        Args:
            data: Data to validate (defaults to self.fair_data)

        Returns:
            Validation report with quality metrics
        """
        logger.info("=" * 60)
        logger.info("STEP 4: Validating data quality")
        logger.info("=" * 60)

        if data is None:
            data = self.fair_data

        if not data:
            raise RuntimeError("No data to validate")

        validation_report = {
            'overall_valid': True,
            'tables': {},
            'summary': {}
        }

        # Validate each table
        for table_name, df in data.items():
            validation = validate_by_type(df, table_name)
            validation_report['tables'][table_name] = validation

            if not validation['valid']:
                validation_report['overall_valid'] = False
                logger.warning(f"✗ {table_name}: {len(validation['issues'])} issues")
            else:
                logger.info(f"✓ {table_name}: Valid (confidence: {validation['confidence']:.0%})")

        # Summary statistics
        total_records = sum(len(df) for df in data.values())
        total_fields = sum(len(df.columns) for df in data.values())

        validation_report['summary'] = {
            'total_tables': len(data),
            'total_records': total_records,
            'total_fields': total_fields,
            'overall_confidence': sum(v['confidence'] for v in validation_report['tables'].values()) / len(data)
        }

        logger.info(f"\n✓ Validation complete: {total_records} records, {total_fields} fields")

        return validation_report

    # Helper methods

    def _extract_table_with_progressive_fallback(
        self,
        page: int,
        bbox: Tuple[float, float, float, float],
        table_type: str,
        quality_threshold: float = 0.6
    ) -> Optional[pd.DataFrame]:
        """
        Extract table using progressive fallback strategy

        Strategy:
        1. Try text_extraction first (fastest, our bulletproof method)
        2. If quality < threshold → try Camelot methods (lattice + stream)
        3. If still poor → try pdfplumber (slowest fallback)
        4. Return best result from all attempted methods

        Args:
            page: Page number (0-indexed)
            bbox: Bounding box (x0, y0, x1, y1)
            table_type: Table type for type-specific extraction
            quality_threshold: Minimum quality score to accept (0.0-1.0)

        Returns:
            Best DataFrame or None if all methods fail
        """
        results = []

        # LEVEL 1: Try text extraction (fastest)
        logger.info(f"  → Trying text extraction (fast)...")
        try:
            df = extract_table_from_text(str(self.pdf_path), page, bbox, table_type)
            if df is not None and not df.empty:
                score = evaluate_extraction_quality(df, table_type)
                results.append(('text_extraction', df, score))
                logger.info(f"    ✓ Text extraction: quality {score:.2f}")

                # Accept if quality is good enough
                if score >= quality_threshold:
                    logger.info(f"  → Quality threshold met ({score:.2f} >= {quality_threshold}), using text extraction")
                    return df
                else:
                    logger.info(f"  → Quality below threshold ({score:.2f} < {quality_threshold}), trying more methods...")
            else:
                logger.info(f"    ✗ Text extraction returned no data")
        except Exception as e:
            logger.warning(f"    ✗ Text extraction failed: {e}")

        # LEVEL 2: Try Camelot methods (medium speed)
        logger.info(f"  → Trying Camelot methods (medium speed)...")
        camelot_methods = [
            ('camelot_lattice', extract_with_camelot_lattice),
            ('camelot_stream', extract_with_camelot_stream)
        ]

        for method_name, extractor in camelot_methods:
            try:
                df = extractor(str(self.pdf_path), page, bbox, table_type)
                if df is not None and not df.empty:
                    score = evaluate_extraction_quality(df, table_type)
                    results.append((method_name, df, score))
                    logger.info(f"    ✓ {method_name}: quality {score:.2f}")
                else:
                    logger.info(f"    ✗ {method_name}: no data")
            except Exception as e:
                logger.debug(f"    ✗ {method_name}: {e}")

        # Check if we have a good result from Camelot
        if results:
            best_so_far = max(results, key=lambda x: x[2])
            if best_so_far[2] >= quality_threshold:
                logger.info(f"  → Quality threshold met with {best_so_far[0]} ({best_so_far[2]:.2f})")
                return best_so_far[1]

        # LEVEL 3: Try pdfplumber (slowest, last resort)
        logger.info(f"  → Trying pdfplumber (slowest fallback)...")
        try:
            df = extract_with_pdfplumber(str(self.pdf_path), page, bbox, table_type)
            if df is not None and not df.empty:
                score = evaluate_extraction_quality(df, table_type)
                results.append(('pdfplumber', df, score))
                logger.info(f"    ✓ pdfplumber: quality {score:.2f}")
            else:
                logger.info(f"    ✗ pdfplumber: no data")
        except Exception as e:
            logger.debug(f"    ✗ pdfplumber: {e}")

        # Return best result from all methods
        if not results:
            logger.warning(f"  ✗ All extraction methods failed")
            return None

        best_method, best_df, best_score = max(results, key=lambda x: x[2])
        logger.info(f"  → Best method: {best_method} (quality: {best_score:.2f})")

        return best_df

    def _extract_metadata(self) -> Dict:
        """Extract paper metadata from PDF"""
        metadata = {}

        # Open PDF
        doc = fitz.open(str(self.pdf_path))

        # Extract from PDF metadata
        pdf_meta = doc.metadata
        if pdf_meta:
            metadata['title'] = pdf_meta.get('title', '')
            metadata['author'] = pdf_meta.get('author', '')

        # Extract from first page text
        first_page = doc[0].get_text()

        # Extract DOI
        import re
        doi_match = re.search(r'10\.\d{4,}\/[^\s]+', first_page)
        if doi_match:
            metadata['doi'] = doi_match.group(0)

        # Extract year
        year_match = re.search(r'20\d{2}', first_page)
        if year_match:
            metadata['year'] = int(year_match.group(0))

        doc.close()

        return metadata

    def _get_full_text(self) -> str:
        """Extract full text from PDF"""
        doc = fitz.open(str(self.pdf_path))
        text = ""
        for page in doc:
            text += page.get_text()
        doc.close()
        return text


def extract_from_pdf(pdf_path: str, cache_dir: str = './cache') -> Dict:
    """
    Convenience function for full extraction workflow

    Args:
        pdf_path: Path to PDF file
        cache_dir: Cache directory

    Returns:
        Dictionary with all extraction results
    """
    extractor = UniversalThermoExtractor(pdf_path, cache_dir)

    # Run full workflow
    extractor.analyze()
    tables = extractor.extract_all()
    fair_data = extractor.transform_to_fair()
    validation = extractor.validate()

    return {
        'metadata': extractor.metadata,
        'tables': tables,
        'fair_data': fair_data,
        'validation': validation
    }


if __name__ == "__main__":
    import sys

    if len(sys.argv) < 2:
        print("Usage: python extraction_engine.py <pdf_file>")
        sys.exit(1)

    pdf_path = sys.argv[1]

    # Run extraction
    results = extract_from_pdf(pdf_path)

    # Print summary
    print("\n" + "=" * 60)
    print("EXTRACTION COMPLETE")
    print("=" * 60)
    print(f"Paper: {results['metadata'].get('title', 'Unknown')}")
    print(f"Tables extracted: {len(results['tables'])}")
    print(f"FAIR tables: {len(results['fair_data'])}")
    print(f"Validation: {'PASS' if results['validation']['overall_valid'] else 'FAIL'}")
    print(f"Total records: {results['validation']['summary']['total_records']}")
