#!/usr/bin/env python3
"""
Statistical Visualization Tools for Thermochronology
===================================================

Tools for creating statistical visualizations of thermochronology data:
- Radial plots (Galbraith plots)
- Age histograms with KDE
- Age probability density plots
- P(χ²) vs dispersion QA plots

Usage:
    # Radial plot for single sample
    python statistical_plots.py --sample-id 1 --plot radial --output radial.pdf

    # Histogram with KDE for dataset
    python statistical_plots.py --dataset-id 1 --plot histogram --output hist.pdf

    # QA plot for all samples
    python statistical_plots.py --dataset-id 1 --plot qa --output qa.png

Author: Claude Code (AusGeochem Platform)
Date: 2025-11-16
"""

import argparse
import sys
from pathlib import Path
import numpy as np
import pandas as pd
import plotly.graph_objects as go
import plotly.express as px
from plotly.subplots import make_subplots
import matplotlib.pyplot as plt
from scipy import stats
from typing import Optional, Tuple, List

# Add parent directory to path for imports
sys.path.append(str(Path(__file__).parent))
from utils.data_loaders import (
    load_ft_grain_ages,
    load_ahe_grain_ages,
    load_qa_statistics,
    get_sample_info,
    get_dataset_info
)

# ============================================================================
# RADIAL PLOT (Galbraith Plot)
# ============================================================================

def calculate_radial_coordinates(
    ages: np.ndarray,
    errors: np.ndarray,
    central_age: float
) -> Tuple[np.ndarray, np.ndarray]:
    """
    Calculate radial plot coordinates from ages and errors.

    Args:
        ages: Array of single-grain ages (Ma)
        errors: Array of 1σ errors (Ma)
        central_age: Central age for reference (Ma)

    Returns:
        Tuple of (standardized_estimates, precisions)
    """
    # Standardized estimate: z = (age - central_age) / error
    z = (ages - central_age) / errors

    # Precision: p = 1 / error
    precision = 1.0 / errors

    return z, precision

def create_radial_plot(
    sample_id: int,
    method: str = 'AFT',
    output_path: Optional[str] = None,
    interactive: bool = True
) -> go.Figure:
    """
    Create Galbraith radial plot for single-grain age distribution.

    Args:
        sample_id: Sample ID from database
        method: Dating method ('AFT' or 'AHe')
        output_path: Path to save plot (optional)
        interactive: Use Plotly (True) or Matplotlib (False)

    Returns:
        Plotly Figure object
    """
    # Load sample info
    sample_info = get_sample_info(sample_id)
    if not sample_info:
        raise ValueError(f"Sample ID {sample_id} not found")

    # Load grain data
    if method == 'AFT':
        grain_data = load_ft_grain_ages(sample_id)
        ages = grain_data['grain_age_ma'].values
        errors = grain_data['grain_age_error_ma'].values
        central_age = sample_info.get('central_age_ma', np.median(ages))
    else:  # AHe
        grain_data = load_ahe_grain_ages(sample_id)
        ages = grain_data['corrected_age_ma'].values
        errors = grain_data['corrected_age_error_ma'].values
        central_age = np.median(ages)

    # Remove NaN values
    mask = ~(np.isnan(ages) | np.isnan(errors) | (errors == 0))
    ages = ages[mask]
    errors = errors[mask]

    if len(ages) == 0:
        raise ValueError(f"No valid grain data for sample {sample_id}")

    # Calculate radial coordinates
    z, precision = calculate_radial_coordinates(ages, errors, central_age)

    # Create figure
    if interactive:
        fig = go.Figure()

        # Add grain points
        fig.add_trace(go.Scatter(
            x=z,
            y=precision,
            mode='markers',
            marker=dict(size=8, color='darkblue', opacity=0.7),
            text=[f"Grain {i+1}<br>Age: {age:.1f} ± {err:.1f} Ma"
                  for i, (age, err) in enumerate(zip(ages, errors))],
            hovertemplate='%{text}<br>z: %{x:.2f}<br>Precision: %{y:.2f}<extra></extra>',
            name='Grains'
        ))

        # Add central age line (z=0)
        y_range = [0, precision.max() * 1.1]
        fig.add_shape(
            type='line',
            x0=0, y0=y_range[0],
            x1=0, y1=y_range[1],
            line=dict(color='red', width=2, dash='dash'),
        )

        # Add ±2σ bands
        for sigma in [-2, 2]:
            fig.add_shape(
                type='line',
                x0=sigma, y0=y_range[0],
                x1=sigma, y1=y_range[1],
                line=dict(color='gray', width=1, dash='dot'),
            )

        # Layout
        sample_name = sample_info.get('sample_name', f'Sample {sample_id}')
        dispersion = sample_info.get('dispersion', 0)
        p_chi2 = sample_info.get('p_chi_squared', 0)

        fig.update_layout(
            title=dict(
                text=(
                    f"Radial Plot: {sample_name}<br>"
                    f"<sub>Central Age: {central_age:.1f} Ma | "
                    f"Dispersion: {dispersion:.1%} | "
                    f"P(χ²): {p_chi2:.3f} | "
                    f"n={len(ages)}</sub>"
                ),
                x=0.5,
                xanchor='center'
            ),
            xaxis_title='Standardized Estimate (z)',
            yaxis_title='Precision (1/σ)',
            hovermode='closest',
            showlegend=False,
            width=800,
            height=600,
            template='plotly_white'
        )

        fig.update_xaxes(gridcolor='lightgray', zeroline=True, zerolinecolor='black')
        fig.update_yaxes(gridcolor='lightgray')

    else:
        # Matplotlib version
        fig, ax = plt.subplots(figsize=(10, 6))

        # Plot grains
        ax.scatter(z, precision, s=50, color='darkblue', alpha=0.7, edgecolors='black', linewidth=0.5)

        # Central age line
        ax.axvline(0, color='red', linestyle='--', linewidth=2, label=f'Central age: {central_age:.1f} Ma')

        # ±2σ bands
        ax.axvline(-2, color='gray', linestyle=':', linewidth=1)
        ax.axvline(2, color='gray', linestyle=':', linewidth=1)

        # Labels
        sample_name = sample_info.get('sample_name', f'Sample {sample_id}')
        dispersion = sample_info.get('dispersion', 0)
        p_chi2 = sample_info.get('p_chi_squared', 0)

        ax.set_xlabel('Standardized Estimate (z)', fontsize=12)
        ax.set_ylabel('Precision (1/σ)', fontsize=12)
        ax.set_title(
            f"Radial Plot: {sample_name}\n"
            f"Central Age: {central_age:.1f} Ma | Dispersion: {dispersion:.1%} | "
            f"P(χ²): {p_chi2:.3f} | n={len(ages)}",
            fontsize=14
        )
        ax.legend()
        ax.grid(True, alpha=0.3)

    # Save if output path provided
    if output_path:
        if interactive:
            if output_path.endswith('.html'):
                fig.write_html(output_path)
            else:
                fig.write_image(output_path, width=800, height=600)
        else:
            plt.savefig(output_path, dpi=300, bbox_inches='tight')
        print(f"Saved radial plot to: {output_path}")

    return fig

# ============================================================================
# AGE HISTOGRAM WITH KDE
# ============================================================================

def create_age_histogram(
    sample_id: Optional[int] = None,
    dataset_id: Optional[int] = None,
    method: str = 'AFT',
    bins: int = 20,
    kde: bool = True,
    output_path: Optional[str] = None
) -> go.Figure:
    """
    Create age histogram with optional KDE overlay.

    Args:
        sample_id: Single sample ID (mutually exclusive with dataset_id)
        dataset_id: Dataset ID for multi-sample histogram
        method: Dating method ('AFT' or 'AHe')
        bins: Number of histogram bins
        kde: Add kernel density estimate overlay
        output_path: Path to save plot (optional)

    Returns:
        Plotly Figure object
    """
    # Load data
    if sample_id:
        if method == 'AFT':
            grain_data = load_ft_grain_ages(sample_id)
            ages = grain_data['grain_age_ma'].values
        else:
            grain_data = load_ahe_grain_ages(sample_id)
            ages = grain_data['corrected_age_ma'].values
        title_suffix = f"Sample {sample_id}"
    elif dataset_id:
        from utils.data_loaders import load_sample_ages, load_ahe_sample_ages
        if method == 'AFT':
            sample_data = load_sample_ages(dataset_id=dataset_id, method='AFT')
            ages = sample_data['age'].values
        else:
            sample_data = load_ahe_sample_ages(dataset_id=dataset_id)
            ages = sample_data['age'].values
        dataset_info = get_dataset_info(dataset_id)
        title_suffix = dataset_info.get('dataset_name', f'Dataset {dataset_id}')
    else:
        raise ValueError("Must provide either sample_id or dataset_id")

    # Remove NaN
    ages = ages[~np.isnan(ages)]

    if len(ages) == 0:
        raise ValueError("No valid age data")

    # Create figure
    fig = go.Figure()

    # Add histogram
    fig.add_trace(go.Histogram(
        x=ages,
        nbinsx=bins,
        name='Ages',
        marker_color='lightblue',
        marker_line_color='darkblue',
        marker_line_width=1,
        opacity=0.7
    ))

    # Add KDE if requested
    if kde and len(ages) > 3:
        # Calculate KDE
        kde_obj = stats.gaussian_kde(ages)
        x_range = np.linspace(ages.min(), ages.max(), 200)
        kde_values = kde_obj(x_range)

        # Scale KDE to match histogram
        hist_max = np.histogram(ages, bins=bins)[0].max()
        kde_scaled = kde_values * (hist_max / kde_values.max()) * 1.1

        fig.add_trace(go.Scatter(
            x=x_range,
            y=kde_scaled,
            mode='lines',
            name='KDE',
            line=dict(color='red', width=2),
            fill='tozeroy',
            fillcolor='rgba(255, 0, 0, 0.1)'
        ))

    # Layout
    fig.update_layout(
        title=dict(
            text=(
                f"Age Distribution: {title_suffix}<br>"
                f"<sub>{method} | n={len(ages)} | "
                f"Mean: {ages.mean():.1f} Ma | Median: {np.median(ages):.1f} Ma</sub>"
            ),
            x=0.5,
            xanchor='center'
        ),
        xaxis_title=f'{method} Age (Ma)',
        yaxis_title='Frequency',
        hovermode='x unified',
        barmode='overlay',
        width=800,
        height=600,
        template='plotly_white'
    )

    # Save if requested
    if output_path:
        if output_path.endswith('.html'):
            fig.write_html(output_path)
        else:
            fig.write_image(output_path, width=800, height=600)
        print(f"Saved histogram to: {output_path}")

    return fig

# ============================================================================
# AGE PROBABILITY DENSITY PLOT
# ============================================================================

def create_probability_density_plot(
    sample_id: int,
    method: str = 'AFT',
    output_path: Optional[str] = None
) -> go.Figure:
    """
    Create age probability density plot (summed Gaussian PDFs).

    Useful for detrital samples with multi-peak age distributions.

    Args:
        sample_id: Sample ID
        method: Dating method ('AFT' or 'AHe')
        output_path: Path to save plot

    Returns:
        Plotly Figure object
    """
    # Load grain data
    if method == 'AFT':
        grain_data = load_ft_grain_ages(sample_id)
        ages = grain_data['grain_age_ma'].values
        errors = grain_data['grain_age_error_ma'].values
    else:
        grain_data = load_ahe_grain_ages(sample_id)
        ages = grain_data['corrected_age_ma'].values
        errors = grain_data['corrected_age_error_ma'].values

    # Remove NaN
    mask = ~(np.isnan(ages) | np.isnan(errors) | (errors == 0))
    ages = ages[mask]
    errors = errors[mask]

    if len(ages) == 0:
        raise ValueError(f"No valid grain data for sample {sample_id}")

    # Create age range
    age_min = max(0, ages.min() - 3 * errors.max())
    age_max = ages.max() + 3 * errors.max()
    x_range = np.linspace(age_min, age_max, 500)

    # Calculate summed PDF
    pdf_sum = np.zeros_like(x_range)
    for age, error in zip(ages, errors):
        pdf_sum += stats.norm.pdf(x_range, loc=age, scale=error)

    # Normalize
    pdf_sum /= len(ages)

    # Create figure
    fig = go.Figure()

    fig.add_trace(go.Scatter(
        x=x_range,
        y=pdf_sum,
        mode='lines',
        name='Probability Density',
        line=dict(color='darkgreen', width=2),
        fill='tozeroy',
        fillcolor='rgba(0, 128, 0, 0.2)'
    ))

    # Add individual grain lines
    for i, (age, error) in enumerate(zip(ages, errors)):
        grain_pdf = stats.norm.pdf(x_range, loc=age, scale=error) / len(ages)
        fig.add_trace(go.Scatter(
            x=x_range,
            y=grain_pdf,
            mode='lines',
            line=dict(color='lightgray', width=0.5),
            showlegend=False,
            hoverinfo='skip'
        ))

    # Layout
    sample_info = get_sample_info(sample_id)
    sample_name = sample_info.get('sample_name', f'Sample {sample_id}')

    fig.update_layout(
        title=dict(
            text=(
                f"Age Probability Density: {sample_name}<br>"
                f"<sub>{method} | n={len(ages)}</sub>"
            ),
            x=0.5,
            xanchor='center'
        ),
        xaxis_title=f'{method} Age (Ma)',
        yaxis_title='Probability Density',
        hovermode='x unified',
        width=800,
        height=600,
        template='plotly_white'
    )

    # Save if requested
    if output_path:
        if output_path.endswith('.html'):
            fig.write_html(output_path)
        else:
            fig.write_image(output_path, width=800, height=600)
        print(f"Saved probability density plot to: {output_path}")

    return fig

# ============================================================================
# P(χ²) VS DISPERSION QA PLOT
# ============================================================================

def create_qa_plot(
    dataset_id: Optional[int] = None,
    output_path: Optional[str] = None
) -> go.Figure:
    """
    Create P(χ²) vs dispersion scatter plot for quality assessment.

    Args:
        dataset_id: Dataset ID (optional, all samples if None)
        output_path: Path to save plot

    Returns:
        Plotly Figure object
    """
    # Load QA statistics
    qa_data = load_qa_statistics(dataset_id=dataset_id)

    if len(qa_data) == 0:
        raise ValueError("No QA data available")

    # Create figure
    fig = px.scatter(
        qa_data,
        x='dispersion',
        y='p_chi_squared',
        color='quality',
        size='n_grains',
        hover_data=['sample_name', 'central_age_ma', 'n_grains'],
        color_discrete_map={
            'good': 'green',
            'marginal': 'orange',
            'poor': 'red'
        },
        title='Quality Assessment: P(χ²) vs Dispersion',
        labels={
            'dispersion': 'Dispersion',
            'p_chi_squared': 'P(χ²)',
            'quality': 'Quality',
            'n_grains': 'Number of Grains'
        }
    )

    # Add reference lines
    # P(χ²) = 0.05 (marginal quality threshold)
    fig.add_hline(y=0.05, line_dash='dash', line_color='orange',
                  annotation_text='P(χ²) = 0.05', annotation_position='right')

    # P(χ²) = 0.01 (poor quality threshold)
    fig.add_hline(y=0.01, line_dash='dash', line_color='red',
                  annotation_text='P(χ²) = 0.01', annotation_position='right')

    # Layout
    dataset_info = get_dataset_info(dataset_id) if dataset_id else {}
    dataset_name = dataset_info.get('dataset_name', 'All Datasets')

    fig.update_layout(
        title=dict(
            text=(
                f"Quality Assessment: {dataset_name}<br>"
                f"<sub>n={len(qa_data)} samples</sub>"
            ),
            x=0.5,
            xanchor='center'
        ),
        width=900,
        height=700,
        template='plotly_white'
    )

    fig.update_xaxes(title_text='Dispersion (%)', tickformat='.0%')
    fig.update_yaxes(title_text='P(χ²)', type='log')

    # Save if requested
    if output_path:
        if output_path.endswith('.html'):
            fig.write_html(output_path)
        else:
            fig.write_image(output_path, width=900, height=700)
        print(f"Saved QA plot to: {output_path}")

    return fig

# ============================================================================
# CLI INTERFACE
# ============================================================================

def main():
    """Command-line interface for statistical plots."""
    parser = argparse.ArgumentParser(
        description='Create statistical visualizations for thermochronology data'
    )

    parser.add_argument(
        '--plot',
        choices=['radial', 'histogram', 'pdf', 'qa'],
        required=True,
        help='Type of plot to create'
    )

    parser.add_argument('--sample-id', type=int, help='Sample ID from database')
    parser.add_argument('--dataset-id', type=int, help='Dataset ID from database')
    parser.add_argument(
        '--method',
        choices=['AFT', 'AHe'],
        default='AFT',
        help='Dating method (default: AFT)'
    )
    parser.add_argument('--bins', type=int, default=20, help='Number of histogram bins')
    parser.add_argument('--no-kde', action='store_true', help='Disable KDE overlay')
    parser.add_argument('--output', '-o', help='Output file path (PNG, PDF, HTML, SVG)')
    parser.add_argument(
        '--matplotlib',
        action='store_true',
        help='Use Matplotlib instead of Plotly'
    )

    args = parser.parse_args()

    # Validate arguments
    if args.plot in ['radial', 'pdf'] and not args.sample_id:
        parser.error(f"--sample-id required for {args.plot} plot")

    if args.plot == 'histogram' and not (args.sample_id or args.dataset_id):
        parser.error("--sample-id or --dataset-id required for histogram")

    # Create plot
    try:
        if args.plot == 'radial':
            fig = create_radial_plot(
                sample_id=args.sample_id,
                method=args.method,
                output_path=args.output,
                interactive=not args.matplotlib
            )
        elif args.plot == 'histogram':
            fig = create_age_histogram(
                sample_id=args.sample_id,
                dataset_id=args.dataset_id,
                method=args.method,
                bins=args.bins,
                kde=not args.no_kde,
                output_path=args.output
            )
        elif args.plot == 'pdf':
            fig = create_probability_density_plot(
                sample_id=args.sample_id,
                method=args.method,
                output_path=args.output
            )
        elif args.plot == 'qa':
            fig = create_qa_plot(
                dataset_id=args.dataset_id,
                output_path=args.output
            )

        # Show plot if no output file specified
        if not args.output:
            if not args.matplotlib:
                fig.show()
            else:
                plt.show()

    except Exception as e:
        print(f"Error creating plot: {e}", file=sys.stderr)
        sys.exit(1)

if __name__ == '__main__':
    main()
