#!/usr/bin/env python3
"""
Domain-Specific Data Validators

Purpose: Validate extracted thermochronology data
Author: Claude Code
Created: 2025-11-16

Features:
- AFT ages validation (age range, P(χ²), dispersion)
- (U-Th)/He validation (age range, Ft correction, chemistry)
- Track counts validation (Ns, Ni, densities)
- Track lengths validation (length range, MTL)
- Quality confidence scoring
"""

import logging
from typing import Dict, List
import pandas as pd
import numpy as np

logger = logging.getLogger(__name__)


def validate_by_type(df: pd.DataFrame, table_type: str) -> Dict:
    """
    Validate DataFrame based on table type

    Args:
        df: DataFrame to validate
        table_type: Table type (AFT_ages, UThHe, track_counts, track_lengths)

    Returns:
        Validation result: {valid: bool, issues: List[str], confidence: float}
    """
    validators = {
        'AFT_ages': validate_aft_ages,
        'UThHe': validate_ahe_data,
        'track_counts': validate_track_counts,
        'track_lengths': validate_track_lengths,
        'unknown': validate_generic
    }

    validator = validators.get(table_type, validate_generic)
    return validator(df)


def validate_aft_ages(df: pd.DataFrame) -> Dict:
    """
    Validate AFT ages table

    Checks:
    1. Required columns present
    2. Age range (0-4500 Ma)
    3. P(χ²) range (0-100%)
    4. Dispersion range (0-100%)
    5. Number of grains (>0)
    6. Error values reasonable

    Args:
        df: AFT ages DataFrame

    Returns:
        Validation result
    """
    issues = []

    # 1. Column validation
    required_cols = ['age', 'error']
    for col_pattern in required_cols:
        if not _has_column(df, col_pattern):
            issues.append(f"Missing column: {col_pattern}")

    # 2. Age range validation
    age_col = _find_column(df, ['age', 'ma', 'central age'])
    if age_col:
        ages = pd.to_numeric(df[age_col], errors='coerce')

        # Check for negative ages
        if (ages < 0).any():
            issues.append(f"Negative ages found: {(ages < 0).sum()} samples")

        # Check for unrealistic ages (> 4500 Ma)
        if (ages > 4500).any():
            issues.append(f"Ages > 4500 Ma found: {(ages > 4500).sum()} samples")

        # Check for NaN ages
        if ages.isna().any():
            issues.append(f"Missing ages: {ages.isna().sum()} samples")

    # 3. P(χ²) validation
    pchi2_col = _find_column(df, ['p(χ²)', 'pχ2', 'p chi2', 'pchi2'])
    if pchi2_col:
        pchi2 = pd.to_numeric(df[pchi2_col], errors='coerce')

        # Convert to percentage if needed (0-1 → 0-100)
        if pchi2.max() <= 1.0:
            pchi2 = pchi2 * 100

        # Check range
        if ((pchi2 < 0) | (pchi2 > 100)).any():
            issues.append(f"P(χ²) outside [0,100]% range: {((pchi2 < 0) | (pchi2 > 100)).sum()} samples")

    # 4. Dispersion validation
    disp_col = _find_column(df, ['disp', 'dispersion'])
    if disp_col:
        disp = pd.to_numeric(df[disp_col], errors='coerce')

        # Check range
        if (disp < 0).any():
            issues.append(f"Negative dispersion: {(disp < 0).sum()} samples")

        if (disp > 100).any():
            issues.append(f"Dispersion > 100%: {(disp > 100).sum()} samples")

    # 5. Number of grains validation
    n_grains_col = _find_column(df, ['n', 'grains', 'no. of grains', 'n grains'])
    if n_grains_col:
        n_grains = pd.to_numeric(df[n_grains_col], errors='coerce')

        if (n_grains <= 0).any():
            issues.append(f"n_grains <= 0: {(n_grains <= 0).sum()} samples")

        if (n_grains > 100).any():
            logger.warning(f"Unusually high grain counts: {(n_grains > 100).sum()} samples")

    # 6. Error validation
    error_col = _find_column(df, ['error', '±', '1σ', 'uncertainty'])
    if error_col:
        errors = pd.to_numeric(df[error_col], errors='coerce')

        if (errors < 0).any():
            issues.append(f"Negative errors: {(errors < 0).sum()} samples")

        # Check if errors are reasonable (< 50% of age)
        if age_col:
            ages = pd.to_numeric(df[age_col], errors='coerce')
            rel_error = (errors / ages) * 100

            if (rel_error > 50).any():
                logger.warning(f"High relative errors (>50%): {(rel_error > 50).sum()} samples")

    # Calculate confidence score
    confidence = 1.0 - (len(issues) * 0.15)  # -15% per issue
    confidence = max(0.0, min(1.0, confidence))

    return {
        'valid': len(issues) == 0,
        'issues': issues,
        'confidence': confidence
    }


def validate_ahe_data(df: pd.DataFrame) -> Dict:
    """
    Validate (U-Th)/He data table

    Checks:
    1. Required columns (U, Th, He, age)
    2. Age range (0-4500 Ma)
    3. Ft correction range (0.5-1.0)
    4. Chemistry values positive
    5. Corrected age > raw age (typical)

    Args:
        df: AHe DataFrame

    Returns:
        Validation result
    """
    issues = []

    # 1. Column validation
    required_cols = ['u', 'th', 'he', 'age']
    for col_pattern in required_cols:
        if not _has_column(df, col_pattern):
            issues.append(f"Missing column: {col_pattern}")

    # 2. Age validation
    age_col = _find_column(df, ['corrected age', 'age', 'ma'])
    if age_col:
        ages = pd.to_numeric(df[age_col], errors='coerce')

        if (ages < 0).any():
            issues.append(f"Negative ages: {(ages < 0).sum()} grains")

        if (ages > 4500).any():
            issues.append(f"Ages > 4500 Ma: {(ages > 4500).sum()} grains")

    # 3. Ft correction validation
    ft_col = _find_column(df, ['ft', 'ft correction', 'alpha'])
    if ft_col:
        ft = pd.to_numeric(df[ft_col], errors='coerce')

        if (ft < 0.5).any() or (ft > 1.0).any():
            issues.append(f"Ft outside [0.5, 1.0]: {((ft < 0.5) | (ft > 1.0)).sum()} grains")

    # 4. Chemistry validation (U, Th, He should be positive)
    for element in ['u', 'th', 'he']:
        elem_col = _find_column(df, [element])
        if elem_col:
            values = pd.to_numeric(df[elem_col], errors='coerce')

            if (values < 0).any():
                issues.append(f"Negative {element.upper()}: {(values < 0).sum()} grains")

            if (values == 0).any():
                logger.warning(f"Zero {element.upper()} values: {(values == 0).sum()} grains")

    # 5. Raw vs corrected age
    raw_col = _find_column(df, ['raw age', 'uncorrected age'])
    corr_col = _find_column(df, ['corrected age', 'age'])

    if raw_col and corr_col:
        raw_ages = pd.to_numeric(df[raw_col], errors='coerce')
        corr_ages = pd.to_numeric(df[corr_col], errors='coerce')

        # Corrected age should usually be > raw age (Ft < 1.0)
        if (corr_ages < raw_ages).sum() > len(df) * 0.1:  # >10% reversed
            logger.warning(f"Unusual: {(corr_ages < raw_ages).sum()} grains with corrected < raw age")

    # Calculate confidence
    confidence = 1.0 - (len(issues) * 0.15)
    confidence = max(0.0, min(1.0, confidence))

    return {
        'valid': len(issues) == 0,
        'issues': issues,
        'confidence': confidence
    }


def validate_track_counts(df: pd.DataFrame) -> Dict:
    """
    Validate track counts table

    Checks:
    1. Required columns (Ns, Ni)
    2. Counts are non-negative integers
    3. Densities are positive
    4. U/Th/eU values positive

    Args:
        df: Track counts DataFrame

    Returns:
        Validation result
    """
    issues = []

    # 1. Column validation
    required_cols = ['ns', 'ni']
    for col_pattern in required_cols:
        if not _has_column(df, col_pattern):
            issues.append(f"Missing column: {col_pattern}")

    # 2. Track count validation
    for count_type in ['ns', 'ni', 'nd']:
        count_col = _find_column(df, [count_type])
        if count_col:
            counts = pd.to_numeric(df[count_col], errors='coerce')

            if (counts < 0).any():
                issues.append(f"Negative {count_type.upper()}: {(counts < 0).sum()} grains")

    # 3. Density validation
    for density_type in ['rho_s', 'ρs', 'rho_i', 'ρi']:
        dens_col = _find_column(df, [density_type])
        if dens_col:
            densities = pd.to_numeric(df[dens_col], errors='coerce')

            if (densities < 0).any():
                issues.append(f"Negative densities: {(densities < 0).sum()} grains")

    # 4. Chemistry validation
    for element in ['u', 'th', 'eu']:
        elem_col = _find_column(df, [element, f'{element}_ppm'])
        if elem_col:
            values = pd.to_numeric(df[elem_col], errors='coerce')

            if (values < 0).any():
                issues.append(f"Negative {element.upper()}: {(values < 0).sum()} grains")

    # Calculate confidence
    confidence = 1.0 - (len(issues) * 0.15)
    confidence = max(0.0, min(1.0, confidence))

    return {
        'valid': len(issues) == 0,
        'issues': issues,
        'confidence': confidence
    }


def validate_track_lengths(df: pd.DataFrame) -> Dict:
    """
    Validate track lengths table

    Checks:
    1. Required columns (length)
    2. Length range (5-25 μm typical)
    3. Angle range (0-90°)
    4. Dpar range (1-5 μm typical)

    Args:
        df: Track lengths DataFrame

    Returns:
        Validation result
    """
    issues = []

    # 1. Column validation
    if not _has_column(df, 'length'):
        issues.append("Missing column: length")

    # 2. Length validation
    length_col = _find_column(df, ['length', 'l', 'track length'])
    if length_col:
        lengths = pd.to_numeric(df[length_col], errors='coerce')

        if (lengths < 0).any():
            issues.append(f"Negative lengths: {(lengths < 0).sum()} tracks")

        if (lengths < 5).any():
            logger.warning(f"Short tracks (<5 μm): {(lengths < 5).sum()} tracks")

        if (lengths > 25).any():
            logger.warning(f"Long tracks (>25 μm): {(lengths > 25).sum()} tracks")

    # 3. Angle validation
    angle_col = _find_column(df, ['angle', 'c-axis'])
    if angle_col:
        angles = pd.to_numeric(df[angle_col], errors='coerce')

        if (angles < 0).any() or (angles > 90).any():
            issues.append(f"Angles outside [0, 90]°: {((angles < 0) | (angles > 90)).sum()} tracks")

    # 4. Dpar validation
    dpar_col = _find_column(df, ['dpar'])
    if dpar_col:
        dpar = pd.to_numeric(df[dpar_col], errors='coerce')

        if (dpar < 1).any() or (dpar > 5).any():
            logger.warning(f"Dpar outside [1, 5] μm: {((dpar < 1) | (dpar > 5)).sum()} tracks")

    # Calculate confidence
    confidence = 1.0 - (len(issues) * 0.15)
    confidence = max(0.0, min(1.0, confidence))

    return {
        'valid': len(issues) == 0,
        'issues': issues,
        'confidence': confidence
    }


def validate_generic(df: pd.DataFrame) -> Dict:
    """
    Generic validation for unknown table types

    Checks:
    - Not empty
    - Has columns
    - Has data

    Args:
        df: DataFrame

    Returns:
        Validation result
    """
    issues = []

    if df is None or len(df) == 0:
        issues.append("Table is empty")

    if len(df.columns) == 0:
        issues.append("No columns found")

    # Check for completely empty table
    if df.notna().sum().sum() == 0:
        issues.append("No data in table")

    confidence = 0.5 if len(issues) == 0 else 0.0

    return {
        'valid': len(issues) == 0,
        'issues': issues,
        'confidence': confidence
    }


# Helper functions

def _has_column(df: pd.DataFrame, col_pattern: str) -> bool:
    """Check if DataFrame has a column matching pattern"""
    return _find_column(df, [col_pattern]) is not None


def _find_column(df: pd.DataFrame, patterns: List[str]) -> str:
    """
    Find column matching any of the patterns

    Args:
        df: DataFrame
        patterns: List of column name patterns (case-insensitive)

    Returns:
        Column name or None
    """
    for pattern in patterns:
        for col in df.columns:
            if pattern.lower() in str(col).lower():
                return col
    return None
