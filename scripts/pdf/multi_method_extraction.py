#!/usr/bin/env python3
"""
Multi-Method Table Extraction Orchestration

Purpose: Loop over discovered tables and extract with multiple methods
Author: Claude Code
Created: 2025-11-17 (IDEA-012 Phase 2)

Features:
- Read discovered tables from /thermoanalysis output
- Extract each table using 5 methods
- Score extractions with type-aware quality metrics
- Save all attempts to RAW/ folder
- Generate comparison report showing method scores
- Auto-select best method per table
"""

import logging
import json
from pathlib import Path
from typing import Dict, List, Optional, Tuple
import pandas as pd
import re

# Import extraction methods
from .table_extractors import (
    extract_table_from_text,
    extract_with_camelot_lattice,
    extract_with_camelot_stream,
    extract_with_pdfplumber,
    evaluate_extraction_quality
)

logger = logging.getLogger(__name__)


def extract_table_from_plain_text(
    text_file: Path,
    table_name: str,
    page_estimate: int
) -> Optional[pd.DataFrame]:
    """
    Extract table from plain-text.txt file using text parsing

    Args:
        text_file: Path to plain-text.txt
        table_name: Table identifier (e.g., "Table 1", "Table A2")
        page_estimate: Estimated page number

    Returns:
        DataFrame with extracted table data, or None if extraction failed
    """
    try:
        # Read plain text file
        with open(text_file, 'r', encoding='utf-8') as f:
            text_content = f.read()

        # Find table boundaries
        start_idx, end_idx = find_table_boundaries(text_content, table_name, page_estimate)

        if start_idx == -1 or end_idx == -1:
            logger.debug(f"    Could not find table boundaries for {table_name}")
            return None

        # Extract table text
        table_text = text_content[start_idx:end_idx]
        lines = table_text.strip().split('\n')

        if len(lines) < 2:
            logger.debug(f"    Table too short ({len(lines)} lines)")
            return None

        # Parse into rows (simple whitespace-based splitting)
        rows = []
        for line in lines:
            # Skip empty lines and separator lines (----)
            if not line.strip() or line.strip().startswith('---'):
                continue
            # Skip page markers
            if line.strip().startswith('--- PAGE'):
                continue
            # Split on multiple whitespace (2+ spaces or tabs)
            parts = re.split(r'\s{2,}|\t+', line.strip())
            if len(parts) > 1:  # Must have at least 2 columns
                rows.append(parts)

        if len(rows) < 2:
            logger.debug(f"    Not enough data rows ({len(rows)} rows)")
            return None

        # Assume first row is header
        df = pd.DataFrame(rows[1:], columns=rows[0])

        logger.debug(f"    Extracted {len(df)} rows × {len(df.columns)} cols from text")
        return df

    except Exception as e:
        logger.debug(f"    Text extraction failed: {e}")
        return None


def find_table_boundaries(
    text_content: str,
    table_name: str,
    page_estimate: int
) -> Tuple[int, int]:
    """
    Find start and end positions of table in plain text

    Args:
        text_content: Full text content
        table_name: Table identifier (e.g., "Table 1")
        page_estimate: Estimated page number

    Returns:
        Tuple of (start_index, end_index), or (-1, -1) if not found
    """
    # Normalize table name for searching (handle variations)
    search_patterns = [
        rf'\b{re.escape(table_name)}\b',  # Exact match
        rf'\b{re.escape(table_name)}[:\.\s]',  # With punctuation
        rf'\b{re.escape(table_name.upper())}\b',  # Uppercase
    ]

    start_idx = -1
    for pattern in search_patterns:
        match = re.search(pattern, text_content, re.IGNORECASE)
        if match:
            start_idx = match.start()
            break

    if start_idx == -1:
        return (-1, -1)

    # Find end of table (next table, figure, or page break)
    end_markers = [
        r'\bTable \d+',  # Next numbered table
        r'\bTable [A-Z]\d+',  # Next appendix table
        r'\bFigure \d+',  # Figure
        r'\bFig\. \d+',  # Figure abbreviation
        r'--- PAGE \d+ ---',  # Page break (if multiple pages away)
    ]

    # Search for end markers after start
    end_idx = len(text_content)  # Default to end of file
    search_start = start_idx + 100  # Skip table caption

    for pattern in end_markers:
        match = re.search(pattern, text_content[search_start:], re.IGNORECASE)
        if match:
            candidate_end = search_start + match.start()
            if candidate_end < end_idx:
                end_idx = candidate_end

    # Limit table size (max 200 lines)
    max_chars = 50000  # ~200 lines at 250 chars/line
    if end_idx - start_idx > max_chars:
        end_idx = start_idx + max_chars

    return (start_idx, end_idx)


def read_discovered_tables(paper_dir: Path) -> List[Dict]:
    """
    Read discovered tables from /thermoanalysis output

    Tries to read from:
    1. text/discovered_tables.json (if exists)
    2. text/text-index.md (parse table info)

    Args:
        paper_dir: Path to paper folder

    Returns:
        List of discovered table dicts with keys:
        - name: Table identifier (e.g., "Table 1", "Table A2")
        - type: Table type (AFT, He, Chemistry, Sample_Metadata, unknown)
        - page_estimate: Estimated page number
        - context: Context preview
    """
    # Try JSON first (machine-readable)
    json_path = paper_dir / 'text' / 'discovered_tables.json'
    if json_path.exists():
        logger.info(f"Reading discovered tables from {json_path}")
        with open(json_path, 'r') as f:
            return json.load(f)

    # Fall back to parsing text-index.md
    index_path = paper_dir / 'text' / 'text-index.md'
    if not index_path.exists():
        logger.warning(f"No text-index.md found at {index_path}")
        return []

    logger.info(f"Parsing discovered tables from {index_path}")

    with open(index_path, 'r') as f:
        content = f.read()

    # Parse markdown table
    tables = []
    in_table = False
    for line in content.split('\n'):
        if line.startswith('| Table |'):
            in_table = True
            continue
        if in_table and line.startswith('|') and not line.startswith('|----'):
            # Parse table row: | Table 1 | AFT | 9 | Context... |
            parts = [p.strip() for p in line.split('|')]
            if len(parts) >= 5 and parts[1]:  # Valid row
                tables.append({
                    'name': parts[1],
                    'type': parts[2],
                    'page_estimate': int(parts[3]) if parts[3].isdigit() else 1,
                    'context': parts[4][:150]
                })

    logger.info(f"Discovered {len(tables)} tables from text-index.md")
    return tables


def extract_table_all_methods(
    table_info: Dict,
    pdf_path: Path,
    text_file: Optional[Path] = None
) -> Dict[str, Optional[pd.DataFrame]]:
    """
    Extract table using all 5 methods

    Methods:
    1. text - Parse from plain-text.txt
    2. pdfplumber - Standard PDF table extraction
    3. camelot_lattice - Bordered table extraction
    4. camelot_stream - Borderless table extraction
    5. page_specific - Direct page text extraction (fallback)

    Args:
        table_info: Table metadata from discovery
        pdf_path: Path to PDF file
        text_file: Path to plain-text.txt (optional)

    Returns:
        Dict mapping method_name -> DataFrame (or None if failed)
    """
    results = {}
    table_name = table_info['name']
    table_type = table_info['type']
    page = table_info['page_estimate']

    logger.info(f"Extracting {table_name} ({table_type}) using 5 methods...")

    # METHOD 1: Text-based extraction
    if text_file and text_file.exists():
        try:
            logger.debug(f"  Method 1: text-based extraction...")
            # Note: extract_table_from_text needs table caption and page range
            df = extract_table_from_text(
                str(pdf_path),
                str(text_file),
                table_name,  # caption
                page - 1, page + 1  # page_range
            )
            results['method_1_text'] = df
            if df is not None:
                logger.debug(f"    → Success ({len(df)} rows × {len(df.columns)} cols)")
            else:
                logger.debug(f"    → No data extracted")
        except Exception as e:
            logger.warning(f"  Method 1 (text) failed: {e}")
            results['method_1_text'] = None
    else:
        logger.debug(f"  Method 1: skipped (no text file)")
        results['method_1_text'] = None

    # METHOD 2: pdfplumber
    try:
        logger.debug(f"  Method 2: pdfplumber...")
        # Note: extract_with_pdfplumber needs bbox
        # For now, extract whole page (we'll refine bbox detection later)
        df = extract_with_pdfplumber(str(pdf_path), page - 1, None)  # None = whole page
        results['method_2_pdfplumber'] = df
        if df is not None:
            logger.debug(f"    → Success ({len(df)} rows × {len(df.columns)} cols)")
        else:
            logger.debug(f"    → No data extracted")
    except Exception as e:
        logger.warning(f"  Method 2 (pdfplumber) failed: {e}")
        results['method_2_pdfplumber'] = None

    # METHOD 3: camelot lattice
    try:
        logger.debug(f"  Method 3: camelot lattice...")
        df = extract_with_camelot_lattice(str(pdf_path), page - 1, None)
        results['method_3_camelot_lattice'] = df
        if df is not None:
            logger.debug(f"    → Success ({len(df)} rows × {len(df.columns)} cols)")
        else:
            logger.debug(f"    → No data extracted")
    except Exception as e:
        logger.warning(f"  Method 3 (camelot lattice) failed: {e}")
        results['method_3_camelot_lattice'] = None

    # METHOD 4: camelot stream
    try:
        logger.debug(f"  Method 4: camelot stream...")
        df = extract_with_camelot_stream(str(pdf_path), page - 1, None)
        results['method_4_camelot_stream'] = df
        if df is not None:
            logger.debug(f"    → Success ({len(df)} rows × {len(df.columns)} cols)")
        else:
            logger.debug(f"    → No data extracted")
    except Exception as e:
        logger.warning(f"  Method 4 (camelot stream) failed: {e}")
        results['method_4_camelot_stream'] = None

    # METHOD 5: page-specific (fallback - same as method 2 for now)
    try:
        logger.debug(f"  Method 5: page-specific fallback...")
        # This is a placeholder - in production would use different strategy
        df = extract_with_pdfplumber(str(pdf_path), page - 1, None)
        results['method_5_page_specific'] = df
        if df is not None:
            logger.debug(f"    → Success ({len(df)} rows × {len(df.columns)} cols)")
        else:
            logger.debug(f"    → No data extracted")
    except Exception as e:
        logger.warning(f"  Method 5 (page-specific) failed: {e}")
        results['method_5_page_specific'] = None

    return results


def score_extraction_results(
    results: Dict[str, Optional[pd.DataFrame]],
    table_type: str
) -> Dict[str, float]:
    """
    Score all extraction results using type-aware quality metrics

    Args:
        results: Dict mapping method_name -> DataFrame
        table_type: Expected table type (AFT, He, Chemistry, etc.)

    Returns:
        Dict mapping method_name -> quality_score (0.0-1.2)
    """
    scores = {}

    for method_name, df in results.items():
        if df is None or len(df) == 0:
            scores[method_name] = 0.0
        else:
            score = evaluate_extraction_quality(df, table_type)
            scores[method_name] = score

    return scores


def select_best_method(
    results: Dict[str, Optional[pd.DataFrame]],
    scores: Dict[str, float]
) -> Tuple[str, Optional[pd.DataFrame], float]:
    """
    Select best extraction method based on quality scores

    Args:
        results: Dict mapping method_name -> DataFrame
        scores: Dict mapping method_name -> score

    Returns:
        Tuple of (best_method_name, best_df, best_score)
    """
    if not scores:
        return ('none', None, 0.0)

    # Find method with highest score
    best_method = max(scores, key=scores.get)
    best_score = scores[best_method]
    best_df = results[best_method]

    return (best_method, best_df, best_score)


def save_extraction_results(
    table_info: Dict,
    results: Dict[str, Optional[pd.DataFrame]],
    scores: Dict[str, float],
    best_method: str,
    output_dir: Path
) -> None:
    """
    Save all extraction attempts to RAW/ folder

    Creates:
    - RAW/table-N-method-1-text.csv
    - RAW/table-N-method-2-pdfplumber.csv
    - RAW/table-N-method-3-camelot-lattice.csv
    - RAW/table-N-method-4-camelot-stream.csv
    - RAW/table-N-method-5-page-specific.csv
    - RAW/table-N-best.csv (symlink or copy of best method)

    Args:
        table_info: Table metadata
        results: All extraction results
        scores: All scores
        best_method: Name of best method
        output_dir: Path to RAW/ folder
    """
    output_dir.mkdir(parents=True, exist_ok=True)

    table_name = table_info['name']
    # Sanitize table name for filename
    safe_name = re.sub(r'[^a-zA-Z0-9]', '-', table_name).lower()

    logger.info(f"Saving extraction results for {table_name} to {output_dir}")

    # Save all method attempts
    for method_name, df in results.items():
        if df is not None and len(df) > 0:
            filename = f"table-{safe_name}-{method_name}.csv"
            filepath = output_dir / filename
            df.to_csv(filepath, index=False)
            logger.debug(f"  Saved {filename} (score: {scores.get(method_name, 0.0):.2f})")

    # Save best result
    best_df = results.get(best_method)
    if best_df is not None:
        best_filename = f"table-{safe_name}-best.csv"
        best_filepath = output_dir / best_filename
        best_df.to_csv(best_filepath, index=False)
        logger.info(f"  ⭐ Best: {best_method} (score: {scores.get(best_method, 0.0):.2f})")


def generate_comparison_report(
    all_table_results: List[Dict],
    output_dir: Path
) -> None:
    """
    Generate markdown comparison report showing method scores

    Args:
        all_table_results: List of dicts with keys:
            - table_info: Table metadata
            - results: Extraction results
            - scores: Quality scores
            - best_method: Best method name
        output_dir: Path to RAW/ folder
    """
    report_path = output_dir / 'comparison-report.md'

    logger.info(f"Generating comparison report: {report_path}")

    with open(report_path, 'w') as f:
        f.write("# Multi-Method Table Extraction Comparison\n\n")
        f.write("**Generated by:** IDEA-012 Phase 2 Multi-Method Extraction\n")
        f.write("**Purpose:** Compare extraction quality across methods\n\n")
        f.write("---\n\n")

        f.write("## Summary\n\n")
        f.write(f"**Total Tables:** {len(all_table_results)}\n\n")

        # Count successes per method
        method_success = {
            'method_1_text': 0,
            'method_2_pdfplumber': 0,
            'method_3_camelot_lattice': 0,
            'method_4_camelot_stream': 0,
            'method_5_page_specific': 0
        }
        best_method_counts = {}

        for result in all_table_results:
            for method in method_success:
                if result['results'].get(method) is not None:
                    method_success[method] += 1

            best = result['best_method']
            best_method_counts[best] = best_method_counts.get(best, 0) + 1

        f.write("**Method Success Rates:**\n")
        for method, count in method_success.items():
            pct = (count / len(all_table_results) * 100) if all_table_results else 0
            f.write(f"- {method}: {count}/{len(all_table_results)} ({pct:.0f}%)\n")

        f.write("\n**Best Method Selection:**\n")
        for method, count in sorted(best_method_counts.items(), key=lambda x: x[1], reverse=True):
            f.write(f"- {method}: {count} tables\n")

        f.write("\n---\n\n")

        # Detailed results per table
        f.write("## Detailed Results\n\n")

        for i, result in enumerate(all_table_results, 1):
            table_info = result['table_info']
            scores = result['scores']
            best_method = result['best_method']
            best_score = scores.get(best_method, 0.0)

            f.write(f"### {i}. {table_info['name']} ({table_info['type']})\n\n")
            f.write(f"**Page:** {table_info['page_estimate']}\n\n")
            f.write(f"**Best Method:** `{best_method}` (score: {best_score:.2f})\n\n")

            f.write("**All Method Scores:**\n\n")
            f.write("| Method | Score | Status |\n")
            f.write("|--------|-------|--------|\n")

            for method in sorted(scores.keys()):
                score = scores[method]
                status = "✅ Best" if method == best_method else ("✓ Good" if score > 0.7 else ("⚠ Poor" if score > 0 else "❌ Failed"))
                f.write(f"| {method} | {score:.2f} | {status} |\n")

            f.write("\n---\n\n")

    logger.info(f"✓ Comparison report saved: {report_path}")


def extract_all_tables_multi_method(
    paper_dir: Path,
    pdf_path: Path,
    output_dir: Path
) -> List[Dict]:
    """
    Main orchestration function: Extract all discovered tables using multiple methods

    Args:
        paper_dir: Path to paper folder (contains text/ folder)
        pdf_path: Path to PDF file
        output_dir: Path to RAW/ folder (will be created)

    Returns:
        List of all table extraction results
    """
    # Step 1: Read discovered tables
    discovered_tables = read_discovered_tables(paper_dir)

    if not discovered_tables:
        logger.warning("No tables discovered - nothing to extract")
        return []

    logger.info(f"Found {len(discovered_tables)} tables to extract")

    # Step 2: Extract each table with all methods
    text_file = paper_dir / 'text' / 'plain-text.txt'

    all_results = []

    for table_info in discovered_tables:
        logger.info(f"\n{'='*60}")
        logger.info(f"Processing: {table_info['name']} ({table_info['type']})")
        logger.info(f"{'='*60}\n")

        # Extract with all methods
        results = extract_table_all_methods(table_info, pdf_path, text_file)

        # Score all results
        scores = score_extraction_results(results, table_info['type'])

        # Select best method
        best_method, best_df, best_score = select_best_method(results, scores)

        # Save results
        save_extraction_results(table_info, results, scores, best_method, output_dir)

        # Store for report
        all_results.append({
            'table_info': table_info,
            'results': results,
            'scores': scores,
            'best_method': best_method,
            'best_score': best_score
        })

    # Step 3: Generate comparison report
    generate_comparison_report(all_results, output_dir)

    logger.info(f"\n{'='*60}")
    logger.info(f"✓ Multi-method extraction complete!")
    logger.info(f"  Tables processed: {len(all_results)}")
    logger.info(f"  Results saved to: {output_dir}")
    logger.info(f"{'='*60}\n")

    return all_results
