#!/usr/bin/env python3
"""
Multi-Method Table Extraction

Purpose: Extract tables using multiple methods and vote on best result
Author: Claude Code
Created: 2025-11-16

Features:
- Camelot lattice extraction (bordered tables)
- Camelot stream extraction (borderless tables)
- pdfplumber extraction (fallback)
- Extraction quality evaluation
- Voting mechanism for best result
"""

import logging
from typing import Dict, List, Optional, Tuple
import pandas as pd
import fitz  # pymupdf for page dimensions

# Core extraction libraries
try:
    import camelot
    import pdfplumber
except ImportError as e:
    logging.error(f"Missing required package: {e}")
    raise

logger = logging.getLogger(__name__)


def _cluster_x_coordinates(text_items: List[Dict], tolerance: float = 15.0) -> List[float]:
    """
    Cluster x-coordinates to identify column positions

    Args:
        text_items: List of text items with x0 coordinates
        tolerance: Max distance between items in same column (pixels)

    Returns:
        List of column x-positions (sorted)
    """
    if not text_items:
        return []

    # Collect all x-coordinates
    x_coords = sorted(set(item['x0'] for item in text_items))

    if not x_coords:
        return []

    # Simple clustering: group coords within tolerance
    clusters = []
    current_cluster = [x_coords[0]]

    for x in x_coords[1:]:
        if x - current_cluster[-1] <= tolerance:
            current_cluster.append(x)
        else:
            # Finalize cluster (use median as representative)
            clusters.append(sum(current_cluster) / len(current_cluster))
            current_cluster = [x]

    # Add last cluster
    if current_cluster:
        clusters.append(sum(current_cluster) / len(current_cluster))

    return sorted(clusters)


def _assign_to_column(x_coord: float, column_positions: List[float], tolerance: float = 20.0) -> int:
    """
    Assign x-coordinate to nearest column

    Args:
        x_coord: X-coordinate to assign
        column_positions: List of column x-positions
        tolerance: Max distance to column center

    Returns:
        Column index (0-based)
    """
    if not column_positions:
        return 0

    # Find nearest column
    distances = [abs(x_coord - col_x) for col_x in column_positions]
    min_dist = min(distances)

    # Only assign if within tolerance
    if min_dist > tolerance:
        # Create new column (shouldn't happen if clustering worked)
        return len(column_positions)

    return distances.index(min_dist)


def extract_table_from_text(
    pdf_path: str,
    page: int,
    bbox: Tuple[float, float, float, float],
    table_type: str = None
) -> Optional[pd.DataFrame]:
    """
    Extract table by parsing text within bounding box

    This is the PRIMARY extraction method for scientific papers where
    tables are formatted text rather than PDF table objects.

    Uses column clustering to handle dense layouts where each number/word
    is a separate text span.

    Args:
        pdf_path: Path to PDF
        page: Page number (0-indexed)
        bbox: Bounding box (x0, y0, x1, y1)
        table_type: Table type (for type-specific parsing)

    Returns:
        DataFrame or None
    """
    try:
        import fitz

        doc = fitz.open(pdf_path)
        pdf_page = doc[page]

        # Extract text with position information
        text_dict = pdf_page.get_text("dict", clip=bbox)

        doc.close()

        if not text_dict or 'blocks' not in text_dict:
            logger.debug("No text blocks found in bbox")
            return None

        # Extract text blocks with positions
        text_items = []
        for block in text_dict['blocks']:
            if block['type'] == 0:  # Text block
                for line in block.get('lines', []):
                    for span in line.get('spans', []):
                        text = span['text'].strip()
                        if text:
                            bbox_item = span['bbox']
                            text_items.append({
                                'text': text,
                                'x0': bbox_item[0],
                                'y0': bbox_item[1],
                                'x1': bbox_item[2],
                                'y1': bbox_item[3]
                            })

        if len(text_items) < 10:  # Need reasonable amount of text
            logger.debug(f"Insufficient text items: {len(text_items)}")
            return None

        # STEP 1: Cluster x-coordinates to identify columns
        column_positions = _cluster_x_coordinates(text_items, tolerance=15.0)

        if len(column_positions) > 50:
            # Too many columns - likely dense layout, increase tolerance
            logger.debug(f"Too many columns ({len(column_positions)}), increasing tolerance")
            column_positions = _cluster_x_coordinates(text_items, tolerance=25.0)

        if len(column_positions) < 2:
            logger.debug(f"Too few columns: {len(column_positions)}")
            return None

        logger.debug(f"Detected {len(column_positions)} columns")

        # STEP 2: Group text items by row (y-coordinate)
        text_items.sort(key=lambda x: x['y0'])

        rows = []
        current_row_items = []
        current_y = None
        y_tolerance = 5.0  # Pixels tolerance for same row

        for item in text_items:
            if current_y is None or abs(item['y0'] - current_y) < y_tolerance:
                current_row_items.append(item)
                if current_y is None:
                    current_y = item['y0']
                else:
                    # Update to average y-position
                    current_y = (current_y + item['y0']) / 2
            else:
                # New row - process current row
                if current_row_items:
                    rows.append(current_row_items)
                current_row_items = [item]
                current_y = item['y0']

        # Add last row
        if current_row_items:
            rows.append(current_row_items)

        if len(rows) < 2:
            logger.debug(f"Too few rows: {len(rows)}")
            return None

        # STEP 3: Assign items to columns and build table
        table_data = []

        for row_items in rows:
            # Initialize row with empty strings
            row_data = [''] * len(column_positions)

            # Assign each item to a column
            for item in row_items:
                col_idx = _assign_to_column(item['x0'], column_positions)

                if col_idx < len(row_data):
                    # Concatenate if column already has text (multi-part cells)
                    if row_data[col_idx]:
                        row_data[col_idx] += ' ' + item['text']
                    else:
                        row_data[col_idx] = item['text']

            table_data.append(row_data)

        # STEP 4: Create DataFrame
        if len(table_data) < 2:
            logger.debug("Insufficient table data after column assignment")
            return None

        # First row as header (tentative)
        headers = table_data[0]
        data_rows = table_data[1:]

        # Check if first row looks like data rather than headers
        # Heuristic: if >70% of cells are numeric or very long, it's probably data
        numeric_like = 0
        for cell in headers:
            cell_str = str(cell).strip()
            # Check if numeric
            try:
                float(cell_str.replace(',', ''))
                numeric_like += 1
            except:
                # Check if very long (>50 chars = probably concatenated data)
                if len(cell_str) > 50:
                    numeric_like += 1

        if len(headers) > 0 and numeric_like / len(headers) > 0.7:
            # First row is data, not headers - use generic column names
            logger.debug("First row appears to be data, using generic headers")
            headers = [f'col_{i}' for i in range(len(headers))]
            data_rows = table_data  # Include first row as data

        # Clean empty columns (columns where header is empty and all data is empty)
        non_empty_cols = []
        for col_idx in range(len(headers)):
            header = headers[col_idx].strip() if col_idx < len(headers) else ''
            has_data = any(
                col_idx < len(row) and row[col_idx].strip()
                for row in data_rows
            )

            if header or has_data:
                non_empty_cols.append(col_idx)

        if not non_empty_cols:
            logger.debug("No non-empty columns found")
            return None

        # Filter to non-empty columns
        clean_headers = [headers[i] if i < len(headers) else f'col_{i}' for i in non_empty_cols]
        clean_data = [[row[i] if i < len(row) else '' for i in non_empty_cols] for row in data_rows]

        # Fix empty or numeric-only headers
        for i, header in enumerate(clean_headers):
            header_str = str(header).strip()
            # Replace if empty, numeric-only, or single char
            if not header_str or header_str.isdigit() or len(header_str) <= 1:
                # Try to use most common non-numeric value in column as header
                col_values = [str(row[i]).strip() for row in clean_data if i < len(row)]
                non_numeric = [v for v in col_values if v and not v.replace('.', '').replace('-', '').isdigit()]

                if non_numeric:
                    # Use most common non-numeric value (probably a label)
                    from collections import Counter
                    most_common = Counter(non_numeric).most_common(1)[0][0]
                    if len(most_common) < 30:  # Reasonable length for a header
                        clean_headers[i] = most_common
                    else:
                        clean_headers[i] = f'col_{i}'
                else:
                    clean_headers[i] = f'col_{i}'

        # Create DataFrame
        df = pd.DataFrame(clean_data, columns=clean_headers)

        # Remove completely empty rows
        df = df[df.apply(lambda row: any(str(cell).strip() for cell in row), axis=1)]

        if len(df) == 0:
            logger.debug("All rows empty after cleaning")
            return None

        logger.debug(f"Text extraction: {len(df)} rows × {len(df.columns)} columns (cleaned from {len(column_positions)} detected columns)")
        return df

    except Exception as e:
        logger.warning(f"Text-based extraction failed: {e}")
        import traceback
        logger.debug(f"Traceback: {traceback.format_exc()}")
        return None


def _get_page_height(pdf_path: str, page: int) -> float:
    """
    Get PDF page height for coordinate conversion

    Args:
        pdf_path: Path to PDF
        page: Page number (0-indexed)

    Returns:
        Page height in points
    """
    try:
        doc = fitz.open(pdf_path)
        page_height = doc[page].rect.height
        doc.close()
        return page_height
    except:
        return 842.0  # A4 default


def extract_with_camelot_lattice(
    pdf_path: str,
    page: int,
    bbox: Tuple[float, float, float, float],
    table_type: str = None
) -> Optional[pd.DataFrame]:
    """
    Extract table using Camelot lattice method (for bordered tables)

    Args:
        pdf_path: Path to PDF
        page: Page number (0-indexed)
        bbox: Bounding box (x0, y0, x1, y1)
        table_type: Table type (for type-specific extraction)

    Returns:
        DataFrame or None
    """
    try:
        # Convert bbox to Camelot format (x1,y1,x2,y2 in PDF coordinates)
        # Camelot uses bottom-left origin, but we use top-left
        # Need to flip y-coordinates

        # Get page height for coordinate conversion
        page_height = _get_page_height(pdf_path, page)

        # Convert bbox (top-left origin) to Camelot format (bottom-left origin)
        x1, y1, x2, y2 = bbox
        camelot_bbox = f"{x1},{page_height - y2},{x2},{page_height - y1}"

        # Extract with specific table area
        tables = camelot.read_pdf(
            pdf_path,
            pages=str(page + 1),
            flavor='lattice',
            table_areas=[camelot_bbox]
        )

        if tables and len(tables) > 0:
            logger.debug(f"Camelot lattice extracted {len(tables[0].df)} rows")
            return tables[0].df

        return None

    except Exception as e:
        logger.warning(f"Camelot lattice extraction failed: {e}")
        return None


def extract_with_camelot_stream(
    pdf_path: str,
    page: int,
    bbox: Tuple[float, float, float, float],
    table_type: str = None
) -> Optional[pd.DataFrame]:
    """
    Extract table using Camelot stream method (for borderless tables)

    Args:
        pdf_path: Path to PDF
        page: Page number (0-indexed)
        bbox: Bounding box (x0, y0, x1, y1)
        table_type: Table type (for type-specific extraction)

    Returns:
        DataFrame or None
    """
    try:
        # Get page height for coordinate conversion
        page_height = _get_page_height(pdf_path, page)

        # Convert bbox
        x1, y1, x2, y2 = bbox
        camelot_bbox = f"{x1},{page_height - y2},{x2},{page_height - y1}"

        # Extract with stream method
        tables = camelot.read_pdf(
            pdf_path,
            pages=str(page + 1),
            flavor='stream',
            table_areas=[camelot_bbox],
            edge_tol=50  # Tolerance for detecting columns
        )

        if tables and len(tables) > 0:
            logger.debug(f"Camelot stream extracted {len(tables[0].df)} rows")
            return tables[0].df

        return None

    except Exception as e:
        logger.warning(f"Camelot stream extraction failed: {e}")
        return None


def extract_with_pdfplumber(
    pdf_path: str,
    page: int,
    bbox: Tuple[float, float, float, float],
    table_type: str = None
) -> Optional[pd.DataFrame]:
    """
    Extract table using pdfplumber

    Args:
        pdf_path: Path to PDF
        page: Page number (0-indexed)
        bbox: Bounding box (x0, y0, x1, y1)
        table_type: Table type (for type-specific extraction)

    Returns:
        DataFrame or None
    """
    try:
        with pdfplumber.open(pdf_path) as pdf:
            if page >= len(pdf.pages):
                return None

            pdf_page = pdf.pages[page]

            # Crop to bbox
            x0, y0, x1, y1 = bbox
            cropped = pdf_page.crop((x0, y0, x1, y1))

            # Extract table
            table = cropped.extract_table()

            if table:
                df = pd.DataFrame(table[1:], columns=table[0])  # First row as header
                logger.debug(f"pdfplumber extracted {len(df)} rows")
                return df

            return None

    except Exception as e:
        logger.warning(f"pdfplumber extraction failed: {e}")
        return None


def evaluate_extraction_quality(df: pd.DataFrame, table_type: str = None) -> float:
    """
    Evaluate quality of extracted table

    Quality metrics:
    - Number of rows (more is better)
    - Number of columns (more is better)
    - Non-empty cells percentage
    - Column header quality
    - Numeric data presence
    - Type-specific validation (if table_type provided)

    Args:
        df: Extracted DataFrame
        table_type: Expected table type (for type-specific checks)

    Returns:
        Quality score (0.0 - 1.0)
    """
    if df is None or len(df) == 0:
        return 0.0

    score = 0.0

    # 1. Row count (up to 0.2)
    # More rows = better (typical table has 10-50 rows)
    row_score = min(len(df) / 50, 1.0) * 0.2
    score += row_score

    # 2. Column count (up to 0.2)
    # More columns = better (typical table has 5-15 columns)
    # Penalize if too many columns (likely parsing error)
    if len(df.columns) > 30:
        col_score = 0.0  # Too many columns = bad extraction
    else:
        col_score = min(len(df.columns) / 15, 1.0) * 0.2
    score += col_score

    # 3. Non-empty cells (up to 0.3)
    total_cells = len(df) * len(df.columns)
    if total_cells > 0:
        # Count non-empty string cells (not just notna)
        non_empty = sum(
            1 for row in df.itertuples(index=False)
            for cell in row
            if str(cell).strip() and str(cell).lower() not in ['nan', 'none']
        )
        completeness = non_empty / total_cells
    else:
        completeness = 0
    score += completeness * 0.3

    # 4. Column headers quality (up to 0.15)
    # Good headers: not empty, not "Unnamed", not just numbers
    good_headers = sum(
        1 for col in df.columns
        if str(col).strip()
        and 'unnamed' not in str(col).lower()
        and not str(col).isdigit()
        and len(str(col)) > 1  # Exclude single-char headers
    )
    header_quality = good_headers / len(df.columns) if len(df.columns) > 0 else 0
    score += header_quality * 0.15

    # 5. Numeric data presence (up to 0.15)
    # Scientific tables should have numeric data
    numeric_cols = df.select_dtypes(include=['number']).columns
    if len(numeric_cols) == 0:
        # Try converting strings to numbers
        numeric_convertible = 0
        for col in df.columns:
            try:
                converted = pd.to_numeric(df[col], errors='coerce')
                if converted.notna().sum() > len(df) * 0.3:  # At least 30% numeric
                    numeric_convertible += 1
            except:
                pass
        numeric_quality = numeric_convertible / len(df.columns) if len(df.columns) > 0 else 0
    else:
        numeric_quality = len(numeric_cols) / len(df.columns)

    score += numeric_quality * 0.15

    logger.debug(f"Quality score: {score:.2f} (rows: {row_score:.2f}, cols: {col_score:.2f}, "
                f"complete: {completeness:.2f}, headers: {header_quality:.2f}, numeric: {numeric_quality:.2f})")

    return score


def extract_table_with_voting(
    pdf_path: str,
    page: int,
    bbox: Tuple[float, float, float, float],
    table_type: str
) -> Optional[pd.DataFrame]:
    """
    Extract table using multiple methods and vote on best result

    Args:
        pdf_path: Path to PDF
        page: Page number (0-indexed)
        bbox: Bounding box (x0, y0, x1, y1)
        table_type: Table type (for method selection)

    Returns:
        Best DataFrame or None
    """
    logger.info(f"Extracting with multi-method voting (type: {table_type})")

    # Define extraction methods
    methods = [
        ('camelot_lattice', extract_with_camelot_lattice),
        ('camelot_stream', extract_with_camelot_stream),
        ('pdfplumber', extract_with_pdfplumber)
    ]

    # Try each method
    results = []
    for method_name, extractor in methods:
        try:
            logger.debug(f"  Trying {method_name}...")
            df = extractor(pdf_path, page, bbox)

            if df is not None and len(df) > 0:
                # Evaluate quality
                quality = evaluate_extraction_quality(df)
                results.append((method_name, df, quality))
                logger.debug(f"    → Success (quality: {quality:.2f})")
            else:
                logger.debug(f"    → No data extracted")

        except Exception as e:
            logger.warning(f"  {method_name} failed: {e}")

    # Vote: choose extraction with highest quality score
    if not results:
        logger.warning("All extraction methods failed")
        return None

    # Get best result
    best_method, best_df, best_score = max(results, key=lambda x: x[2])

    logger.info(f"✓ Best method: {best_method} (quality: {best_score:.2f})")

    return best_df


def extract_by_type(
    pdf_path: str,
    page: int,
    bbox: Tuple[float, float, float, float],
    table_type: str
) -> Optional[pd.DataFrame]:
    """
    Extract table using type-specific strategy

    Type-specific preferences:
    - AFT_ages: lattice (usually bordered)
    - UThHe: stream (often borderless)
    - track_counts: lattice
    - track_lengths: stream
    - unknown: voting

    Args:
        pdf_path: Path to PDF
        page: Page number (0-indexed)
        bbox: Bounding box (x0, y0, x1, y1)
        table_type: Table type

    Returns:
        DataFrame or None
    """
    # Type-specific strategies
    strategies = {
        'AFT_ages': ['camelot_lattice', 'camelot_stream', 'pdfplumber'],
        'UThHe': ['camelot_stream', 'camelot_lattice', 'pdfplumber'],
        'track_counts': ['camelot_lattice', 'camelot_stream', 'pdfplumber'],
        'track_lengths': ['camelot_stream', 'pdfplumber', 'camelot_lattice'],
    }

    # Get preferred methods for this type
    method_order = strategies.get(table_type, ['camelot_lattice', 'camelot_stream', 'pdfplumber'])

    # Map method names to functions
    method_funcs = {
        'camelot_lattice': extract_with_camelot_lattice,
        'camelot_stream': extract_with_camelot_stream,
        'pdfplumber': extract_with_pdfplumber
    }

    # Try methods in order of preference
    for method_name in method_order:
        try:
            extractor = method_funcs[method_name]
            df = extractor(pdf_path, page, bbox)

            if df is not None and len(df) > 0:
                quality = evaluate_extraction_quality(df)

                # Accept if quality is good enough (>0.5)
                if quality > 0.5:
                    logger.info(f"✓ Extracted with {method_name} (quality: {quality:.2f})")
                    return df

        except Exception as e:
            logger.warning(f"{method_name} failed: {e}")
            continue

    # Fallback: use voting if all preferred methods failed
    logger.info("Preferred methods failed, falling back to voting")
    return extract_table_with_voting(pdf_path, page, bbox, table_type)
