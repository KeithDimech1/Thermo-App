#!/usr/bin/env python3
"""
Extraction Validation & Merging

Purpose: Compare extraction results from multiple methods, detect discrepancies,
         and intelligently merge to get the best possible data

Author: Claude Code
Created: 2025-11-16

Features:
- Multi-method comparison
- Discrepancy detection (structure, values, quality)
- Smart reconciliation strategies
- Audit trail generation
"""

import logging
from typing import Dict, List, Optional, Tuple, Any
import pandas as pd
import numpy as np
from collections import Counter

logger = logging.getLogger(__name__)


class ExtractionValidator:
    """
    Validate and merge extraction results from multiple methods
    """

    def __init__(self):
        self.audit_log = []

    def validate_and_merge(
        self,
        table_id: str,
        extractions: Dict[str, Dict[str, Any]]
    ) -> Tuple[pd.DataFrame, Dict]:
        """
        Compare extractions and merge to best result

        Args:
            table_id: Table identifier (e.g., "Table 1")
            extractions: Dict of {method_name: {'data': DataFrame, 'quality': float}}

        Returns:
            (merged_dataframe, audit_entry)
        """
        logger.info(f"Validating extractions for {table_id}")

        if not extractions:
            return None, {'error': 'No extractions provided'}

        # If only one extraction, no validation needed
        if len(extractions) == 1:
            method, result = list(extractions.items())[0]
            return result['data'], {
                'table_id': table_id,
                'methods_compared': 1,
                'discrepancies': [],
                'resolution': 'single_method',
                'confidence': result['quality']
            }

        # Compare all extraction methods
        discrepancies = self._detect_discrepancies(table_id, extractions)

        # Choose reconciliation strategy
        if not discrepancies:
            # No conflicts - use highest quality
            best_method, best_result = max(
                extractions.items(),
                key=lambda x: x[1]['quality']
            )

            audit_entry = {
                'table_id': table_id,
                'methods_compared': len(extractions),
                'discrepancies': [],
                'resolution': 'highest_quality',
                'winning_method': best_method,
                'confidence': best_result['quality']
            }

            return best_result['data'], audit_entry

        else:
            # Conflicts found - reconcile
            merged_df, resolution = self._reconcile_discrepancies(
                table_id,
                extractions,
                discrepancies
            )

            audit_entry = {
                'table_id': table_id,
                'methods_compared': len(extractions),
                'discrepancies': discrepancies,
                'resolution': resolution['strategy'],
                'confidence': resolution['confidence'],
                'details': resolution.get('details', {})
            }

            return merged_df, audit_entry

    def _detect_discrepancies(
        self,
        table_id: str,
        extractions: Dict[str, Dict]
    ) -> List[Dict]:
        """
        Detect differences between extraction methods

        Returns:
            List of discrepancy dictionaries
        """
        discrepancies = []

        # Convert to list for comparison
        methods = list(extractions.keys())
        dfs = [extractions[m]['data'] for m in methods]

        # 1. Structure discrepancies (row/column counts)
        row_counts = [len(df) for df in dfs]
        col_counts = [len(df.columns) for df in dfs]

        if len(set(row_counts)) > 1:
            discrepancies.append({
                'type': 'row_count',
                'severity': 'high',
                'methods': {m: rc for m, rc in zip(methods, row_counts)},
                'message': f'Row counts differ: {dict(zip(methods, row_counts))}'
            })

        if len(set(col_counts)) > 1:
            discrepancies.append({
                'type': 'column_count',
                'severity': 'medium',
                'methods': {m: cc for m, cc in zip(methods, col_counts)},
                'message': f'Column counts differ: {dict(zip(methods, col_counts))}'
            })

        # 2. Header discrepancies
        headers = [list(df.columns) for df in dfs]
        if len(set(tuple(h) for h in headers)) > 1:
            discrepancies.append({
                'type': 'headers',
                'severity': 'medium',
                'methods': {m: h for m, h in zip(methods, headers)},
                'message': 'Column headers differ between methods'
            })

        # 3. Cell value discrepancies (if same dimensions)
        if len(set(row_counts)) == 1 and len(set(col_counts)) == 1:
            cell_diffs = self._compare_cell_values(dfs, methods)
            if cell_diffs:
                discrepancies.append({
                    'type': 'cell_values',
                    'severity': 'low',
                    'differences': cell_diffs,
                    'message': f'Found {len(cell_diffs)} cells with different values'
                })

        return discrepancies

    def _compare_cell_values(
        self,
        dfs: List[pd.DataFrame],
        methods: List[str]
    ) -> List[Dict]:
        """
        Compare cell-by-cell values between DataFrames

        Returns:
            List of cell differences
        """
        if len(dfs) < 2:
            return []

        # Use first DataFrame as reference
        ref_df = dfs[0]
        differences = []

        for i, compare_df in enumerate(dfs[1:], 1):
            method_name = methods[i]

            # Compare each cell
            for row_idx in range(min(len(ref_df), len(compare_df))):
                for col_idx in range(min(len(ref_df.columns), len(compare_df.columns))):
                    ref_val = ref_df.iloc[row_idx, col_idx]
                    comp_val = compare_df.iloc[row_idx, col_idx]

                    # Skip if both are NaN
                    if pd.isna(ref_val) and pd.isna(comp_val):
                        continue

                    # Compare values
                    if not self._values_equivalent(ref_val, comp_val):
                        differences.append({
                            'row': row_idx,
                            'col': col_idx,
                            'reference_method': methods[0],
                            'reference_value': ref_val,
                            'compare_method': method_name,
                            'compare_value': comp_val,
                            'numeric_diff': self._numeric_difference(ref_val, comp_val)
                        })

        return differences

    def _values_equivalent(self, val1: Any, val2: Any, tolerance: float = 0.01) -> bool:
        """
        Check if two values are equivalent

        Args:
            val1, val2: Values to compare
            tolerance: Numeric tolerance (1% by default)

        Returns:
            True if equivalent
        """
        # Both NaN
        if pd.isna(val1) and pd.isna(val2):
            return True

        # One NaN, one not
        if pd.isna(val1) or pd.isna(val2):
            return False

        # Both numeric
        try:
            num1 = float(val1)
            num2 = float(val2)

            # Check relative difference
            if num1 == 0 and num2 == 0:
                return True
            elif num1 == 0 or num2 == 0:
                return abs(num1 - num2) < tolerance
            else:
                rel_diff = abs(num1 - num2) / max(abs(num1), abs(num2))
                return rel_diff < tolerance

        except (ValueError, TypeError):
            pass

        # String comparison (case-insensitive, strip whitespace)
        str1 = str(val1).strip().lower()
        str2 = str(val2).strip().lower()

        return str1 == str2

    def _numeric_difference(self, val1: Any, val2: Any) -> Optional[float]:
        """Calculate numeric difference if both values are numeric"""
        try:
            return abs(float(val1) - float(val2))
        except (ValueError, TypeError):
            return None

    def _reconcile_discrepancies(
        self,
        table_id: str,
        extractions: Dict[str, Dict],
        discrepancies: List[Dict]
    ) -> Tuple[pd.DataFrame, Dict]:
        """
        Reconcile discrepancies using intelligent strategies

        Returns:
            (merged_dataframe, resolution_info)
        """
        logger.info(f"Reconciling {len(discrepancies)} discrepancies for {table_id}")

        # Get discrepancy types
        disc_types = {d['type'] for d in discrepancies}

        # Strategy 1: Row count discrepancy
        if 'row_count' in disc_types:
            return self._resolve_row_count_discrepancy(extractions, discrepancies)

        # Strategy 2: Column discrepancy
        if 'column_count' in disc_types or 'headers' in disc_types:
            return self._resolve_column_discrepancy(extractions, discrepancies)

        # Strategy 3: Cell value discrepancy
        if 'cell_values' in disc_types:
            return self._resolve_cell_value_discrepancy(extractions, discrepancies)

        # Fallback: use highest quality
        best_method, best_result = max(
            extractions.items(),
            key=lambda x: x[1]['quality']
        )

        return best_result['data'], {
            'strategy': 'fallback_highest_quality',
            'confidence': best_result['quality'],
            'winning_method': best_method
        }

    def _resolve_row_count_discrepancy(
        self,
        extractions: Dict[str, Dict],
        discrepancies: List[Dict]
    ) -> Tuple[pd.DataFrame, Dict]:
        """
        Resolve row count discrepancies

        Strategy:
        1. If quality scores differ significantly (>0.2), use higher quality
        2. If scores are close, use method with MORE rows (less likely to miss data)
        3. Flag for human review if very different (>20% difference)
        """
        # Get row count discrepancy
        row_disc = next(d for d in discrepancies if d['type'] == 'row_count')

        # Get quality scores
        qualities = {m: extractions[m]['quality'] for m in extractions.keys()}

        # Check if quality scores differ significantly
        max_quality = max(qualities.values())
        max_method = max(qualities.keys(), key=lambda m: qualities[m])

        # If one method has significantly higher quality (>0.2 difference)
        quality_threshold = 0.2
        significant_diff = any(
            max_quality - q > quality_threshold
            for m, q in qualities.items() if m != max_method
        )

        if significant_diff:
            # Use highest quality method
            return extractions[max_method]['data'], {
                'strategy': 'highest_quality_significant_diff',
                'confidence': max_quality,
                'winning_method': max_method,
                'reason': f'Quality difference > {quality_threshold}'
            }

        # Quality scores are close - use method with more rows
        row_counts = row_disc['methods']
        max_rows_method = max(row_counts.keys(), key=lambda m: row_counts[m])
        max_rows = row_counts[max_rows_method]

        # Check if row count difference is suspicious (>20%)
        min_rows = min(row_counts.values())
        row_diff_pct = (max_rows - min_rows) / max_rows

        if row_diff_pct > 0.2:
            # Large difference - flag for review
            logger.warning(f"Large row count difference ({row_diff_pct:.0%}) - may need review")

        return extractions[max_rows_method]['data'], {
            'strategy': 'max_rows_close_quality',
            'confidence': qualities[max_rows_method],
            'winning_method': max_rows_method,
            'reason': f'Used method with most rows ({max_rows})',
            'row_diff_pct': row_diff_pct,
            'needs_review': row_diff_pct > 0.2
        }

    def _resolve_column_discrepancy(
        self,
        extractions: Dict[str, Dict],
        discrepancies: List[Dict]
    ) -> Tuple[pd.DataFrame, Dict]:
        """
        Resolve column discrepancies

        Strategy:
        1. Use method with best column headers (non-numeric, descriptive)
        2. If headers similar, use method with more columns
        3. Attempt to merge columns if possible
        """
        # Score header quality for each method
        header_scores = {}

        for method, result in extractions.items():
            df = result['data']
            headers = list(df.columns)

            # Score based on:
            # - Non-numeric headers (better)
            # - Descriptive length (better)
            # - Non-empty headers (better)

            score = 0

            for header in headers:
                header_str = str(header).strip()

                # Non-empty: +1
                if header_str and header_str.lower() not in ['nan', 'none']:
                    score += 1

                # Non-numeric: +2
                if not header_str.isdigit():
                    score += 2

                # Descriptive (>2 chars): +1
                if len(header_str) > 2:
                    score += 1

                # Contains underscore (structured): +1
                if '_' in header_str:
                    score += 1

            header_scores[method] = score

        # Choose method with best headers
        best_headers_method = max(header_scores.keys(), key=lambda m: header_scores[m])

        return extractions[best_headers_method]['data'], {
            'strategy': 'best_column_headers',
            'confidence': extractions[best_headers_method]['quality'],
            'winning_method': best_headers_method,
            'header_scores': header_scores,
            'reason': f'Best header quality (score: {header_scores[best_headers_method]})'
        }

    def _resolve_cell_value_discrepancy(
        self,
        extractions: Dict[str, Dict],
        discrepancies: List[Dict]
    ) -> Tuple[pd.DataFrame, Dict]:
        """
        Resolve cell value discrepancies

        Strategy:
        1. For each differing cell, use value from higher-quality method
        2. If numeric difference > 10%, flag for review
        3. Create merged DataFrame with best values
        """
        # Get cell value discrepancy
        cell_disc = next(d for d in discrepancies if d['type'] == 'cell_values')
        differences = cell_disc['differences']

        # Use highest quality method as base
        qualities = {m: extractions[m]['quality'] for m in extractions.keys()}
        base_method = max(qualities.keys(), key=lambda m: qualities[m])
        merged_df = extractions[base_method]['data'].copy()

        # Track which cells were changed
        changes_made = []
        flagged_cells = []

        for diff in differences:
            row = diff['row']
            col = diff['col']

            # Determine which value to use
            ref_method = diff['reference_method']
            comp_method = diff['compare_method']

            # Use value from higher quality method
            if qualities[comp_method] > qualities[ref_method]:
                # Update cell with compare value
                merged_df.iloc[row, col] = diff['compare_value']

                changes_made.append({
                    'row': row,
                    'col': col,
                    'from': diff['reference_value'],
                    'to': diff['compare_value'],
                    'reason': f'{comp_method} had higher quality'
                })

            # Flag if numeric difference > 10%
            if diff['numeric_diff'] is not None:
                ref_val = float(diff['reference_value'])
                if ref_val != 0:
                    pct_diff = diff['numeric_diff'] / abs(ref_val)
                    if pct_diff > 0.1:
                        flagged_cells.append({
                            'row': row,
                            'col': col,
                            'values': {
                                ref_method: diff['reference_value'],
                                comp_method: diff['compare_value']
                            },
                            'pct_diff': pct_diff,
                            'reason': 'Large numeric difference'
                        })

        return merged_df, {
            'strategy': 'cell_by_cell_merge',
            'confidence': qualities[base_method],
            'base_method': base_method,
            'changes_made': len(changes_made),
            'flagged_cells': len(flagged_cells),
            'needs_review': len(flagged_cells) > 0,
            'details': {
                'changes': changes_made[:10],  # Limit to first 10
                'flagged': flagged_cells
            }
        }


def validate_extraction_batch(
    tables: Dict[str, Dict[str, Dict]]
) -> Tuple[Dict[str, pd.DataFrame], List[Dict]]:
    """
    Validate and merge multiple table extractions

    Args:
        tables: Dict of {table_id: {method: {'data': df, 'quality': score}}}

    Returns:
        (validated_tables, audit_log)
    """
    validator = ExtractionValidator()
    validated_tables = {}
    audit_log = []

    for table_id, extractions in tables.items():
        merged_df, audit_entry = validator.validate_and_merge(table_id, extractions)

        if merged_df is not None:
            validated_tables[table_id] = merged_df
            audit_log.append(audit_entry)

    return validated_tables, audit_log
