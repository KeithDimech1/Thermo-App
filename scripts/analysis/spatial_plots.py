#!/usr/bin/env python3
"""
Spatial Analysis Tools for Thermochronology
==========================================

Tools for spatial analysis of thermochronology data:
- Age-elevation plots with exhumation rate calculation
- Spatial transect plots (age vs latitude/longitude)
- MTL spatial trend analysis
- Exhumation rate maps (if sufficient spatial coverage)

Usage:
    # Age-elevation plot for dataset
    python spatial_plots.py --dataset-id 1 --plot age-elevation --method AFT --output aer.pdf

    # Spatial transect with multiple methods
    python spatial_plots.py --dataset-id 1 --plot transect --methods AFT,AHe --axis latitude --output transect.pdf

    # MTL spatial trends
    python spatial_plots.py --dataset-id 1 --plot mtl-trends --output mtl.pdf

Author: Claude Code (AusGeochem Platform)
Date: 2025-11-16
"""

import argparse
import sys
from pathlib import Path
import numpy as np
import pandas as pd
import plotly.graph_objects as go
from plotly.subplots import make_subplots
from scipy import stats
from typing import Optional, Tuple, Dict

# Add parent directory to path for imports
sys.path.append(str(Path(__file__).parent))
from utils.data_loaders import (
    load_age_elevation,
    load_spatial_transect,
    load_track_lengths,
    load_sample_ages,
    get_dataset_info
)

# ============================================================================
# AGE-ELEVATION PLOT WITH EXHUMATION RATE
# ============================================================================

def calculate_exhumation_rate(
    elevation_m: np.ndarray,
    ages_ma: np.ndarray,
    closure_temp_c: float = 110.0,
    geothermal_gradient_c_per_km: float = 25.0
) -> Dict[str, float]:
    """
    Calculate exhumation rate from age-elevation relationship.

    Formula: Exhumation rate = slope * (closure_temp / geothermal_gradient)

    Args:
        elevation_m: Elevation in meters
        ages_ma: Ages in Ma
        closure_temp_c: Closure temperature (°C, default 110 for AFT)
        geothermal_gradient_c_per_km: Geothermal gradient (°C/km, default 25)

    Returns:
        Dictionary with slope, intercept, r_squared, exhumation_rate_km_per_myr, etc.
    """
    # Linear regression: age = intercept + slope * elevation
    slope, intercept, r_value, p_value, std_err = stats.linregress(elevation_m, ages_ma)

    # Calculate exhumation rate
    # slope is in Ma/m, convert to km/Myr
    slope_ma_per_km = slope * 1000  # Ma/km

    # Exhumation rate (km/Myr) = slope (Ma/km) * (closure_temp / geothermal_gradient)
    exhumation_rate = abs(slope_ma_per_km) * (closure_temp_c / geothermal_gradient_c_per_km)

    # Uncertainty in exhumation rate
    exhumation_rate_error = abs(std_err * 1000) * (closure_temp_c / geothermal_gradient_c_per_km)

    return {
        'slope_ma_per_m': slope,
        'intercept_ma': intercept,
        'r_squared': r_value**2,
        'p_value': p_value,
        'std_err': std_err,
        'exhumation_rate_km_per_myr': exhumation_rate,
        'exhumation_rate_error': exhumation_rate_error,
        'closure_temp_c': closure_temp_c,
        'geothermal_gradient': geothermal_gradient_c_per_km
    }

def create_age_elevation_plot(
    dataset_id: int,
    method: str = 'AFT',
    closure_temp: float = None,
    geothermal_gradient: float = 25.0,
    output_path: Optional[str] = None
) -> go.Figure:
    """
    Create age-elevation plot with exhumation rate calculation.

    Args:
        dataset_id: Dataset ID
        method: Dating method ('AFT' or 'AHe')
        closure_temp: Closure temperature (°C, default 110 for AFT, 70 for AHe)
        geothermal_gradient: Geothermal gradient (°C/km, default 25)
        output_path: Path to save plot

    Returns:
        Plotly Figure object
    """
    # Set default closure temperature
    if closure_temp is None:
        closure_temp = 110.0 if method == 'AFT' else 70.0

    # Load data
    data = load_age_elevation(dataset_id=dataset_id, method=method)

    if len(data) < 2:
        raise ValueError(f"Insufficient data for age-elevation plot (n={len(data)})")

    elevation = data['elevation_m'].values
    ages = data['age'].values
    age_errors = data['age_error'].values
    sample_names = data['sample_name'].values

    # Remove NaN values
    mask = ~(np.isnan(elevation) | np.isnan(ages))
    elevation = elevation[mask]
    ages = ages[mask]
    age_errors = age_errors[mask]
    sample_names = sample_names[mask]

    # Calculate exhumation rate
    exhum_stats = calculate_exhumation_rate(
        elevation, ages, closure_temp, geothermal_gradient
    )

    # Create regression line
    elev_range = np.linspace(elevation.min(), elevation.max(), 100)
    age_pred = exhum_stats['intercept_ma'] + exhum_stats['slope_ma_per_m'] * elev_range

    # Calculate 95% confidence interval
    # Standard error of prediction
    n = len(elevation)
    residuals = ages - (exhum_stats['intercept_ma'] + exhum_stats['slope_ma_per_m'] * elevation)
    s_res = np.sqrt(np.sum(residuals**2) / (n - 2))

    elev_mean = elevation.mean()
    se_line = s_res * np.sqrt(1/n + (elev_range - elev_mean)**2 / np.sum((elevation - elev_mean)**2))
    ci_95 = 1.96 * se_line

    # Create figure
    fig = go.Figure()

    # Add confidence interval
    fig.add_trace(go.Scatter(
        x=np.concatenate([elev_range, elev_range[::-1]]),
        y=np.concatenate([age_pred + ci_95, (age_pred - ci_95)[::-1]]),
        fill='toself',
        fillcolor='rgba(0, 100, 200, 0.2)',
        line=dict(color='rgba(255,255,255,0)'),
        hoverinfo='skip',
        showlegend=True,
        name='95% CI'
    ))

    # Add regression line
    fig.add_trace(go.Scatter(
        x=elev_range,
        y=age_pred,
        mode='lines',
        line=dict(color='red', width=2),
        name=f'Linear Fit (R²={exhum_stats["r_squared"]:.3f})'
    ))

    # Add data points with error bars
    fig.add_trace(go.Scatter(
        x=elevation,
        y=ages,
        mode='markers',
        marker=dict(size=10, color='darkblue', symbol='circle', line=dict(color='white', width=1)),
        error_y=dict(
            type='data',
            array=age_errors,
            visible=True,
            color='gray'
        ),
        text=sample_names,
        hovertemplate='%{text}<br>Elevation: %{x:.0f} m<br>Age: %{y:.1f} Ma<extra></extra>',
        name='Samples'
    ))

    # Layout
    dataset_info = get_dataset_info(dataset_id)
    dataset_name = dataset_info.get('dataset_name', f'Dataset {dataset_id}')

    fig.update_layout(
        title=dict(
            text=(
                f"Age-Elevation Plot: {dataset_name}<br>"
                f"<sub>{method} | n={len(elevation)} | "
                f"Exhumation Rate: {exhum_stats['exhumation_rate_km_per_myr']:.3f} ± "
                f"{exhum_stats['exhumation_rate_error']:.3f} km/Myr<br>"
                f"Closure Temp: {closure_temp:.0f}°C | "
                f"Geothermal Gradient: {geothermal_gradient:.0f}°C/km | "
                f"R²: {exhum_stats['r_squared']:.3f}</sub>"
            ),
            x=0.5,
            xanchor='center'
        ),
        xaxis_title='Elevation (m)',
        yaxis_title=f'{method} Age (Ma)',
        hovermode='closest',
        width=900,
        height=700,
        template='plotly_white',
        legend=dict(x=0.02, y=0.98, bgcolor='rgba(255,255,255,0.8)')
    )

    # Add regression equation as annotation
    equation_text = (
        f"Age = {exhum_stats['intercept_ma']:.1f} + "
        f"{exhum_stats['slope_ma_per_m']*1000:.4f} × Elevation<br>"
        f"Exhumation Rate: {exhum_stats['exhumation_rate_km_per_myr']:.3f} km/Myr"
    )

    fig.add_annotation(
        xref='paper', yref='paper',
        x=0.98, y=0.02,
        text=equation_text,
        showarrow=False,
        bgcolor='rgba(255,255,255,0.8)',
        bordercolor='gray',
        borderwidth=1,
        xanchor='right',
        yanchor='bottom'
    )

    # Save if requested
    if output_path:
        if output_path.endswith('.html'):
            fig.write_html(output_path)
        else:
            fig.write_image(output_path, width=900, height=700)
        print(f"Saved age-elevation plot to: {output_path}")
        print(f"Exhumation rate: {exhum_stats['exhumation_rate_km_per_myr']:.3f} ± "
              f"{exhum_stats['exhumation_rate_error']:.3f} km/Myr")

    return fig

# ============================================================================
# SPATIAL TRANSECT PLOT
# ============================================================================

def create_spatial_transect_plot(
    dataset_id: int,
    methods: list = ['AFT'],
    axis: str = 'latitude',
    include_mtl: bool = True,
    output_path: Optional[str] = None
) -> go.Figure:
    """
    Create spatial transect plot (age vs latitude/longitude).

    Args:
        dataset_id: Dataset ID
        methods: List of dating methods to include (['AFT'], ['AHe'], or ['AFT', 'AHe'])
        axis: Spatial axis ('latitude' or 'longitude')
        include_mtl: Include mean track length subplot (AFT only)
        output_path: Path to save plot

    Returns:
        Plotly Figure object
    """
    # Load data
    transect_data = load_spatial_transect(
        dataset_id=dataset_id,
        methods=methods,
        axis=axis
    )

    if len(transect_data) == 0:
        raise ValueError("No data available for transect plot")

    # Determine number of subplots
    n_rows = 2 if (include_mtl and 'AFT' in methods) else 1
    subplot_titles = ['Thermochronology Ages']
    if n_rows == 2:
        subplot_titles.append('Mean Track Length (MTL)')

    # Create subplots
    fig = make_subplots(
        rows=n_rows,
        cols=1,
        shared_xaxes=True,
        vertical_spacing=0.1,
        subplot_titles=subplot_titles,
        row_heights=[0.7, 0.3] if n_rows == 2 else [1.0]
    )

    # Color scheme
    colors = {'AFT': 'darkblue', 'AHe': 'darkred', 'MTL': 'gray'}

    # Plot ages for each method
    for method in methods:
        method_data = transect_data[transect_data['method'] == method]

        if len(method_data) > 0:
            fig.add_trace(
                go.Scatter(
                    x=method_data[axis],
                    y=method_data['age'],
                    mode='markers+lines',
                    name=f'{method} Age',
                    marker=dict(size=10, color=colors.get(method, 'black')),
                    line=dict(color=colors.get(method, 'black'), width=2),
                    error_y=dict(
                        type='data',
                        array=method_data['age_error'],
                        visible=True
                    ),
                    text=method_data['sample_name'],
                    hovertemplate='%{text}<br>%{x:.4f}°<br>Age: %{y:.1f} Ma<extra></extra>'
                ),
                row=1, col=1
            )

    # Plot MTL if requested and AFT data available
    if include_mtl and 'AFT' in methods:
        aft_data = transect_data[transect_data['method'] == 'AFT']
        if 'mtl' in aft_data.columns and aft_data['mtl'].notna().any():
            fig.add_trace(
                go.Scatter(
                    x=aft_data[axis],
                    y=aft_data['mtl'],
                    mode='markers+lines',
                    name='MTL',
                    marker=dict(size=8, color='gray', symbol='square'),
                    line=dict(color='gray', width=2),
                    text=aft_data['sample_name'],
                    hovertemplate='%{text}<br>%{x:.4f}°<br>MTL: %{y:.2f} μm<extra></extra>'
                ),
                row=2, col=1
            )

    # Layout
    dataset_info = get_dataset_info(dataset_id)
    dataset_name = dataset_info.get('dataset_name', f'Dataset {dataset_id}')

    axis_label = axis.capitalize()
    methods_str = ' + '.join(methods)

    fig.update_layout(
        title=dict(
            text=(
                f"Spatial Transect: {dataset_name}<br>"
                f"<sub>{methods_str} | n={len(transect_data)} samples</sub>"
            ),
            x=0.5,
            xanchor='center'
        ),
        hovermode='closest',
        width=1000,
        height=600 if n_rows == 1 else 800,
        template='plotly_white',
        showlegend=True
    )

    # Update axes
    fig.update_xaxes(title_text=f'{axis_label} (°)', row=n_rows, col=1)
    fig.update_yaxes(title_text='Age (Ma)', row=1, col=1)
    if n_rows == 2:
        fig.update_yaxes(title_text='MTL (μm)', row=2, col=1)

    # Save if requested
    if output_path:
        if output_path.endswith('.html'):
            fig.write_html(output_path)
        else:
            fig.write_image(output_path, width=1000, height=600 if n_rows == 1 else 800)
        print(f"Saved spatial transect plot to: {output_path}")

    return fig

# ============================================================================
# MTL SPATIAL TRENDS
# ============================================================================

def create_mtl_trends_plot(
    dataset_id: int,
    axis: str = 'latitude',
    output_path: Optional[str] = None
) -> go.Figure:
    """
    Create plot showing MTL spatial trends with interpretation.

    Args:
        dataset_id: Dataset ID
        axis: Spatial axis ('latitude' or 'longitude')
        output_path: Path to save plot

    Returns:
        Plotly Figure object
    """
    # Load sample ages with MTL data
    sample_data = load_sample_ages(dataset_id=dataset_id, method='AFT')

    # Filter samples with MTL data
    sample_data = sample_data[sample_data['mean_track_length_um'].notna()]

    if len(sample_data) < 2:
        raise ValueError("Insufficient MTL data for trends plot")

    # Create figure with two subplots
    fig = make_subplots(
        rows=2, cols=1,
        subplot_titles=['Mean Track Length vs Position', 'MTL Distribution by Sample'],
        row_heights=[0.6, 0.4],
        vertical_spacing=0.15
    )

    # Plot 1: MTL vs spatial position
    fig.add_trace(
        go.Scatter(
            x=sample_data[axis],
            y=sample_data['mean_track_length_um'],
            mode='markers+lines',
            marker=dict(size=10, color='darkgreen'),
            line=dict(color='darkgreen', width=2),
            name='MTL',
            text=sample_data['sample_name'],
            hovertemplate='%{text}<br>%{x:.4f}°<br>MTL: %{y:.2f} μm<extra></extra>'
        ),
        row=1, col=1
    )

    # Add reference lines for interpretation
    # MTL > 14 μm = minimal annealing
    # MTL 12-14 μm = moderate annealing
    # MTL < 12 μm = significant annealing
    fig.add_hline(y=14, line_dash='dash', line_color='green',
                  annotation_text='Minimal annealing', row=1, col=1)
    fig.add_hline(y=12, line_dash='dash', line_color='orange',
                  annotation_text='Significant annealing', row=1, col=1)

    # Plot 2: MTL distribution (box plot)
    fig.add_trace(
        go.Box(
            y=sample_data['mean_track_length_um'],
            name='MTL Distribution',
            marker_color='darkgreen',
            boxmean='sd'  # Show mean and standard deviation
        ),
        row=2, col=1
    )

    # Layout
    dataset_info = get_dataset_info(dataset_id)
    dataset_name = dataset_info.get('dataset_name', f'Dataset {dataset_id}')

    axis_label = axis.capitalize()
    mtl_mean = sample_data['mean_track_length_um'].mean()
    mtl_std = sample_data['mean_track_length_um'].std()

    fig.update_layout(
        title=dict(
            text=(
                f"MTL Spatial Trends: {dataset_name}<br>"
                f"<sub>n={len(sample_data)} | Mean MTL: {mtl_mean:.2f} ± {mtl_std:.2f} μm</sub>"
            ),
            x=0.5,
            xanchor='center'
        ),
        hovermode='closest',
        width=900,
        height=800,
        template='plotly_white',
        showlegend=False
    )

    # Update axes
    fig.update_xaxes(title_text=f'{axis_label} (°)', row=1, col=1)
    fig.update_yaxes(title_text='MTL (μm)', row=1, col=1)
    fig.update_yaxes(title_text='MTL (μm)', row=2, col=1)

    # Save if requested
    if output_path:
        if output_path.endswith('.html'):
            fig.write_html(output_path)
        else:
            fig.write_image(output_path, width=900, height=800)
        print(f"Saved MTL trends plot to: {output_path}")

    return fig

# ============================================================================
# CLI INTERFACE
# ============================================================================

def main():
    """Command-line interface for spatial analysis plots."""
    parser = argparse.ArgumentParser(
        description='Create spatial analysis plots for thermochronology data'
    )

    parser.add_argument(
        '--plot',
        choices=['age-elevation', 'transect', 'mtl-trends'],
        required=True,
        help='Type of plot to create'
    )

    parser.add_argument('--dataset-id', type=int, required=True, help='Dataset ID from database')
    parser.add_argument(
        '--method',
        choices=['AFT', 'AHe'],
        default='AFT',
        help='Dating method for age-elevation plot (default: AFT)'
    )
    parser.add_argument(
        '--methods',
        help='Comma-separated list of methods for transect (e.g., AFT,AHe)'
    )
    parser.add_argument(
        '--axis',
        choices=['latitude', 'longitude'],
        default='latitude',
        help='Spatial axis for transect (default: latitude)'
    )
    parser.add_argument(
        '--closure-temp',
        type=float,
        help='Closure temperature in °C (default: 110 for AFT, 70 for AHe)'
    )
    parser.add_argument(
        '--geothermal-gradient',
        type=float,
        default=25.0,
        help='Geothermal gradient in °C/km (default: 25)'
    )
    parser.add_argument('--no-mtl', action='store_true', help='Exclude MTL subplot from transect')
    parser.add_argument('--output', '-o', help='Output file path (PNG, PDF, HTML, SVG)')

    args = parser.parse_args()

    # Parse methods for transect
    if args.plot == 'transect':
        if args.methods:
            methods = [m.strip() for m in args.methods.split(',')]
        else:
            methods = ['AFT']
    else:
        methods = [args.method]

    # Create plot
    try:
        if args.plot == 'age-elevation':
            fig = create_age_elevation_plot(
                dataset_id=args.dataset_id,
                method=args.method,
                closure_temp=args.closure_temp,
                geothermal_gradient=args.geothermal_gradient,
                output_path=args.output
            )
        elif args.plot == 'transect':
            fig = create_spatial_transect_plot(
                dataset_id=args.dataset_id,
                methods=methods,
                axis=args.axis,
                include_mtl=not args.no_mtl,
                output_path=args.output
            )
        elif args.plot == 'mtl-trends':
            fig = create_mtl_trends_plot(
                dataset_id=args.dataset_id,
                axis=args.axis,
                output_path=args.output
            )

        # Show plot if no output file specified
        if not args.output:
            fig.show()

    except Exception as e:
        print(f"Error creating plot: {e}", file=sys.stderr)
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == '__main__':
    main()
