"""
Data Loaders for Thermochronology Analysis
==========================================

Database query helpers for loading thermochronology data for analysis.

Usage:
    from utils.data_loaders import load_sample_ages, load_ft_grain_ages

    # Load sample-level AFT ages
    samples = load_sample_ages(dataset_id=1, method='AFT')

    # Load single-grain ages for radial plot
    grains = load_ft_grain_ages(sample_id=1)

Author: Claude Code (AusGeochem Platform)
Date: 2025-11-16
"""

import os
import psycopg2
from psycopg2.extras import RealDictCursor
from dotenv import load_dotenv
from pathlib import Path
from typing import List, Dict, Optional, Any
import pandas as pd

# Load environment variables from .env.local
env_path = Path(__file__).parent.parent.parent.parent / '.env.local'
load_dotenv(dotenv_path=env_path)

def get_connection():
    """
    Get PostgreSQL database connection.

    Returns:
        psycopg2 connection object

    Raises:
        RuntimeError: If DATABASE_URL not set in environment
    """
    database_url = os.getenv('DATABASE_URL')

    if not database_url:
        raise RuntimeError(
            'DATABASE_URL not found in environment. '
            'Please ensure .env.local exists with DATABASE_URL.'
        )

    return psycopg2.connect(database_url)

def query_to_dataframe(query: str, params: tuple = None) -> pd.DataFrame:
    """
    Execute SQL query and return results as pandas DataFrame.

    Args:
        query: SQL query string
        params: Query parameters (optional)

    Returns:
        pandas DataFrame with query results
    """
    conn = get_connection()
    try:
        df = pd.read_sql_query(query, conn, params=params)
        return df
    finally:
        conn.close()

def query_to_dict(query: str, params: tuple = None) -> List[Dict[str, Any]]:
    """
    Execute SQL query and return results as list of dictionaries.

    Args:
        query: SQL query string
        params: Query parameters (optional)

    Returns:
        List of dictionaries (one per row)
    """
    conn = get_connection()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(query, params)
            return [dict(row) for row in cur.fetchall()]
    finally:
        conn.close()

# ============================================================================
# SAMPLE-LEVEL DATA LOADERS
# ============================================================================

def load_sample_ages(
    dataset_id: Optional[int] = None,
    method: str = 'AFT',
    include_location: bool = True
) -> pd.DataFrame:
    """
    Load sample-level thermochronology ages.

    Args:
        dataset_id: Filter by dataset ID (optional)
        method: Dating method ('AFT', 'AHe', 'ZFT', 'ZHe')
        include_location: Include lat/lon/elevation columns

    Returns:
        DataFrame with columns: sample_id, igsn, age, age_error, elevation, etc.
    """
    query = """
        SELECT
            s.sample_id,
            s.igsn,
            s.latitude,
            s.longitude,
            s.elevation_m,
            s.lithology,
            s.mineral_type,
            fa.pooled_age_ma as age,
            fa.pooled_age_error_ma as age_error,
            fa.central_age_ma,
            fa.dispersion_pct as dispersion,
            fa.p_chi2 as p_chi_squared,
            fa.n_grains,
            d.dataset_name,
            d.id as dataset_id
        FROM samples s
        JOIN ft_ages fa ON s.sample_id = fa.sample_id
        JOIN datasets d ON s.dataset_id = d.id
        WHERE s.mineral_type = %s
    """

    params = [method.lower()]

    if dataset_id:
        query += " AND d.id = %s"
        params.append(dataset_id)

    query += " ORDER BY s.elevation_m DESC"

    return query_to_dataframe(query, tuple(params))

def load_ahe_sample_ages(
    dataset_id: Optional[int] = None,
    aggregate_method: str = 'median'
) -> pd.DataFrame:
    """
    Load (U-Th)/He sample-level ages (aggregated from single grains).

    Args:
        dataset_id: Filter by dataset ID (optional)
        aggregate_method: How to aggregate single-grain ages ('median', 'mean')

    Returns:
        DataFrame with sample-level AHe ages
    """
    agg_func = 'MEDIAN' if aggregate_method == 'median' else 'AVG'

    query = f"""
        SELECT
            s.sample_id,
            s.igsn,
            s.latitude,
            s.longitude,
            s.elevation_m,
            {agg_func}(ahe.corrected_age_ma) as age,
            STDDEV(ahe.corrected_age_ma) as age_stddev,
            COUNT(ahe.id) as n_grains,
            d.dataset_name,
            d.id as dataset_id
        FROM samples s
        JOIN ahe_grain_data ahe ON s.sample_id = ahe.sample_id
        JOIN datasets d ON s.dataset_id = d.id
    """

    params = []

    if dataset_id:
        query += " WHERE d.id = %s"
        params.append(dataset_id)

    query += " GROUP BY s.sample_id, s.igsn, s.latitude, s.longitude, s.elevation_m, d.dataset_name, d.id"
    query += " ORDER BY s.elevation_m DESC"

    return query_to_dataframe(query, tuple(params) if params else None)

# ============================================================================
# SINGLE-GRAIN DATA LOADERS (for radial plots, histograms)
# ============================================================================

def load_ft_grain_ages(sample_id: str) -> pd.DataFrame:
    """
    Load single-grain fission-track ages for radial plot analysis.

    Args:
        sample_id: Sample ID (string, e.g. 'MU19-05')

    Returns:
        DataFrame with columns: grain_id, age, age_error, ns, ni, etc.
    """
    query = """
        SELECT
            fc.id,
            fc.grain_id,
            fc.rho_s_cm2,
            fc.ns,
            fc.ni,
            fc.rho_i_cm2,
            fc.u_ppm,
            -- Calculate single-grain age from count data
            -- Age = (1 / lambda_f) * ln(1 + (lambda_f / lambda_d) * (rho_s / rho_i) * (rho_d / rho_std))
            -- Simplified: Use ratio method for now (rho_s / rho_i) * pooled_age
            (fc.rho_s_cm2 / NULLIF(fc.rho_i_cm2, 0)) * (SELECT pooled_age_ma FROM ft_ages WHERE sample_id = %s) as grain_age_ma,
            -- Approximate error (Poisson statistics)
            ((fc.rho_s_cm2 / NULLIF(fc.rho_i_cm2, 0)) * (SELECT pooled_age_ma FROM ft_ages WHERE sample_id = %s)) *
                SQRT(1.0 / NULLIF(fc.ns, 0) + 1.0 / NULLIF(fc.ni, 0)) as grain_age_error_ma
        FROM ft_counts fc
        WHERE fc.sample_id = %s
        AND fc.ns > 0 AND fc.ni > 0  -- Exclude grains with zero counts
        ORDER BY fc.grain_id
    """

    return query_to_dataframe(query, (sample_id, sample_id, sample_id))

def load_ahe_grain_ages(sample_id: str) -> pd.DataFrame:
    """
    Load single-grain (U-Th)/He ages.

    Args:
        sample_id: Sample ID (string, e.g. 'MU19-05')

    Returns:
        DataFrame with columns: grain_id, raw_age, corrected_age, ft, u_ppm, etc.
    """
    query = """
        SELECT
            id as grain_id,
            grain_number,
            raw_age_ma,
            raw_age_error_ma,
            corrected_age_ma,
            corrected_age_error_ma,
            ft_correction,
            u_ppm,
            th_ppm,
            sm_ppm,
            grain_mass_ug,
            he_4_nmol_g,
            morphology
        FROM ahe_grain_data
        WHERE sample_id = %s
        AND corrected_age_ma IS NOT NULL  -- Exclude failed grains
        ORDER BY grain_number
    """

    return query_to_dataframe(query, (sample_id,))

def load_track_lengths(sample_id: str) -> pd.DataFrame:
    """
    Load fission-track length measurements.

    Args:
        sample_id: Sample ID (string, e.g. 'MU19-05')

    Returns:
        DataFrame with columns: length_um, angle_to_c_axis, dpar, etc.
    """
    query = """
        SELECT
            id,
            track_number,
            track_length_um,
            angle_to_c_axis_deg,
            dpar_um,
            etch_time_sec
        FROM ft_track_lengths
        WHERE sample_id = %s
        AND track_length_um IS NOT NULL
        ORDER BY track_number
    """

    return query_to_dataframe(query, (sample_id,))

# ============================================================================
# SPATIAL DATA LOADERS (for transects, age-elevation plots)
# ============================================================================

def load_spatial_transect(
    dataset_id: int,
    methods: List[str] = ['AFT'],
    axis: str = 'latitude'
) -> pd.DataFrame:
    """
    Load data for spatial transect analysis (age vs latitude/longitude).

    Args:
        dataset_id: Dataset ID
        methods: List of dating methods to include
        axis: 'latitude' or 'longitude'

    Returns:
        DataFrame with spatial data for transect plotting
    """
    if axis not in ['latitude', 'longitude']:
        raise ValueError("axis must be 'latitude' or 'longitude'")

    results = []

    # Load AFT data if requested
    if 'AFT' in methods or 'aft' in methods:
        query = f"""
            SELECT
                s.{axis},
                s.longitude,
                s.latitude,
                s.elevation_m,
                s.sample_id as sample_name,
                fa.central_age_ma as age,
                fa.central_age_error_ma as age_error,
                fa.dispersion_pct as dispersion,
                fa.p_chi2 as p_chi_squared,
                NULL as mtl,
                'AFT' as method
            FROM samples s
            JOIN ft_ages fa ON s.sample_id = fa.sample_id
            WHERE s.dataset_id = %s
            ORDER BY s.{axis}
        """
        aft_data = query_to_dataframe(query, (dataset_id,))
        results.append(aft_data)

    # Load AHe data if requested
    if 'AHe' in methods or 'ahe' in methods:
        query = f"""
            SELECT
                s.{axis},
                s.longitude,
                s.latitude,
                s.elevation_m,
                s.sample_id as sample_name,
                PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY ahe.corrected_age_ma) as age,
                STDDEV(ahe.corrected_age_ma) / SQRT(COUNT(*)) as age_error,
                COUNT(*) as n_grains,
                'AHe' as method
            FROM samples s
            JOIN ahe_grain_data ahe ON s.sample_id = ahe.sample_id
            WHERE s.dataset_id = %s
            GROUP BY s.sample_id, s.{axis}, s.longitude, s.latitude, s.elevation_m
            ORDER BY s.{axis}
        """
        ahe_data = query_to_dataframe(query, (dataset_id,))
        results.append(ahe_data)

    # Combine all methods
    if results:
        return pd.concat(results, ignore_index=True)
    else:
        return pd.DataFrame()

def load_age_elevation(
    dataset_id: int,
    method: str = 'AFT',
    min_elevation: Optional[float] = None,
    max_elevation: Optional[float] = None
) -> pd.DataFrame:
    """
    Load data for age-elevation plot analysis.

    Args:
        dataset_id: Dataset ID
        method: Dating method ('AFT', 'AHe')
        min_elevation: Minimum elevation filter (optional)
        max_elevation: Maximum elevation filter (optional)

    Returns:
        DataFrame with age and elevation data
    """
    if method.upper() == 'AFT':
        query = """
            SELECT
                s.sample_id,
                s.elevation_m,
                s.latitude,
                s.longitude,
                fa.central_age_ma as age,
                fa.central_age_error_ma as age_error,
                fa.n_grains
            FROM samples s
            JOIN ft_ages fa ON s.sample_id = fa.sample_id
            WHERE s.dataset_id = %s
        """
    else:  # AHe
        query = """
            SELECT
                s.sample_id,
                s.elevation_m,
                s.latitude,
                s.longitude,
                PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY ahe.corrected_age_ma) as age,
                STDDEV(ahe.corrected_age_ma) / SQRT(COUNT(*)) as age_error,
                COUNT(*) as n_grains
            FROM samples s
            JOIN ahe_grain_data ahe ON s.sample_id = ahe.sample_id
            WHERE s.dataset_id = %s
            GROUP BY s.sample_id, s.elevation_m, s.latitude, s.longitude
        """

    params = [dataset_id]

    if min_elevation is not None:
        query += " AND s.elevation_m >= %s"
        params.append(min_elevation)

    if max_elevation is not None:
        query += " AND s.elevation_m <= %s"
        params.append(max_elevation)

    query += " ORDER BY s.elevation_m DESC"

    return query_to_dataframe(query, tuple(params))

# ============================================================================
# QUALITY ASSESSMENT DATA LOADERS
# ============================================================================

def load_qa_statistics(dataset_id: Optional[int] = None) -> pd.DataFrame:
    """
    Load P(χ²) and dispersion statistics for quality assessment plots.

    Args:
        dataset_id: Filter by dataset ID (optional)

    Returns:
        DataFrame with QA statistics
    """
    query = """
        SELECT
            s.sample_id,
            s.igsn,
            fa.central_age_ma,
            fa.dispersion_pct as dispersion,
            fa.p_chi2 as p_chi_squared,
            fa.n_grains,
            d.dataset_name,
            CASE
                WHEN fa.p_chi2 >= 0.05 THEN 'good'
                WHEN fa.p_chi2 >= 0.01 THEN 'marginal'
                ELSE 'poor'
            END as quality
        FROM samples s
        JOIN ft_ages fa ON s.sample_id = fa.sample_id
        JOIN datasets d ON s.dataset_id = d.id
    """

    params = []

    if dataset_id:
        query += " WHERE d.id = %s"
        params.append(dataset_id)

    query += " ORDER BY fa.dispersion DESC"

    return query_to_dataframe(query, tuple(params) if params else None)

# ============================================================================
# DATASET METADATA
# ============================================================================

def get_dataset_info(dataset_id: int) -> Dict[str, Any]:
    """
    Get dataset metadata.

    Args:
        dataset_id: Dataset ID

    Returns:
        Dictionary with dataset information
    """
    query = """
        SELECT
            id,
            dataset_name,
            doi,
            authors,
            year,
            journal,
            study_area,
            description
        FROM datasets
        WHERE id = %s
    """

    results = query_to_dict(query, (dataset_id,))
    return results[0] if results else {}

def get_sample_info(sample_id: str) -> Dict[str, Any]:
    """
    Get sample metadata.

    Args:
        sample_id: Sample ID (string, e.g. 'MU19-05')

    Returns:
        Dictionary with sample information
    """
    query = """
        SELECT
            s.*,
            d.dataset_name,
            fa.central_age_ma,
            fa.central_age_error_ma,
            fa.dispersion_pct as dispersion,
            fa.p_chi2 as p_chi_squared
        FROM samples s
        LEFT JOIN datasets d ON s.dataset_id = d.id
        LEFT JOIN ft_ages fa ON s.sample_id = fa.sample_id
        WHERE s.sample_id = %s
    """

    results = query_to_dict(query, (sample_id,))
    return results[0] if results else {}
