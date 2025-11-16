# Thermochronology Analysis Tools

Python-based statistical and spatial analysis tools for thermochronology data.

## Features

### Phase 1: Statistical Visualizations

- **Radial Plots (Galbraith Plots)** - Single-grain age distributions with standardized estimates
- **Age Histograms** - With kernel density estimate (KDE) overlays
- **Age Probability Density Plots** - Summed Gaussian PDFs for detrital analysis
- **P(χ²) vs Dispersion QA Plots** - Quality assessment scatter plots

### Phase 2: Spatial Analysis

- **Age-Elevation Plots** - With automatic exhumation rate calculation
- **Spatial Transect Plots** - Age vs latitude/longitude with multi-method overlay
- **MTL Spatial Trends** - Mean track length analysis with interpretation

## Installation

Ensure Python dependencies are installed:

```bash
source .venv/bin/activate
pip install plotly matplotlib scipy pandas numpy psycopg2-binary python-dotenv
```

## Usage

### Statistical Plots

```bash
# Radial plot for single sample
python scripts/analysis/statistical_plots.py --sample-id 1 --plot radial --output radial.pdf

# Age histogram for dataset
python scripts/analysis/statistical_plots.py --dataset-id 1 --plot histogram --kde --output hist.pdf

# Probability density plot
python scripts/analysis/statistical_plots.py --sample-id 1 --plot pdf --output pdf.pdf

# Quality assessment plot
python scripts/analysis/statistical_plots.py --dataset-id 1 --plot qa --output qa.png
```

### Spatial Analysis Plots

```bash
# Age-elevation plot with exhumation rate
python scripts/analysis/spatial_plots.py --dataset-id 1 --plot age-elevation \
    --method AFT --closure-temp 110 --geothermal-gradient 25 --output aer.pdf

# Spatial transect (multi-method)
python scripts/analysis/spatial_plots.py --dataset-id 1 --plot transect \
    --methods AFT,AHe --axis latitude --output transect.pdf

# MTL spatial trends
python scripts/analysis/spatial_plots.py --dataset-id 1 --plot mtl-trends \
    --axis latitude --output mtl.pdf
```

## Module Structure

```
scripts/analysis/
├── __init__.py                 # Package init
├── statistical_plots.py        # Statistical visualization tools
├── spatial_plots.py            # Spatial analysis tools
├── utils/
│   ├── __init__.py
│   └── data_loaders.py        # Database query helpers
└── README.md                   # This file
```

## Database Queries

All analysis tools use the `utils/data_loaders.py` module for database access. Key functions:

- `load_sample_ages()` - Sample-level ages (AFT, AHe)
- `load_ft_grain_ages()` - Single-grain FT ages for radial plots
- `load_ahe_grain_ages()` - Single-grain (U-Th)/He ages
- `load_age_elevation()` - Data for age-elevation plots
- `load_spatial_transect()` - Data for spatial transect plots
- `load_qa_statistics()` - P(χ²) and dispersion stats

## Output Formats

All plots support multiple output formats:

- **PNG** - Web/presentation (default: 800x600 or 900x700 px, 72 DPI)
- **PDF** - Publication quality (vector, 300 DPI)
- **HTML** - Interactive Plotly (pan, zoom, tooltips)
- **SVG** - Vector graphics for editing

## Exhumation Rate Calculation

Age-elevation plots automatically calculate exhumation rates using:

```
Exhumation Rate (km/Myr) = slope (Ma/km) × (closure_temp / geothermal_gradient)
```

**Default Parameters:**
- AFT closure temperature: 110°C (can override with `--closure-temp`)
- AHe closure temperature: 70°C
- Geothermal gradient: 25°C/km (can override with `--geothermal-gradient`)

## Examples

### Calculate exhumation rate for Malawi dataset

```bash
python scripts/analysis/spatial_plots.py --dataset-id 2 --plot age-elevation \
    --method AFT --closure-temp 110 --geothermal-gradient 25 \
    --output output/malawi-age-elevation.pdf
```

Expected output:
```
Exhumation rate: 0.123 ± 0.015 km/Myr
Saved age-elevation plot to: output/malawi-age-elevation.pdf
```

### Create multi-method transect

```bash
python scripts/analysis/spatial_plots.py --dataset-id 2 --plot transect \
    --methods AFT,AHe --axis latitude \
    --output output/malawi-transect.html
```

### Batch process all samples (radial plots)

```bash
# Create output directory
mkdir -p output/radial_plots

# Loop through sample IDs
for sample_id in {1..34}; do
    python scripts/analysis/statistical_plots.py \
        --sample-id $sample_id --plot radial \
        --output output/radial_plots/sample_${sample_id}_radial.pdf
done
```

## Technical Notes

### Radial Plot Mathematics

Radial plots (Galbraith plots) display single-grain ages using:

- **Standardized estimate (z):** `z = (age - central_age) / error`
- **Precision (p):** `p = 1 / error`

Points plotting within ±2σ (z = ±2) are consistent with the central age.

### Statistical Methods

- **KDE bandwidth:** Automatically determined using Scott's rule
- **Confidence intervals:** 95% CI calculated using standard error of prediction
- **Linear regression:** Scipy `stats.linregress()` with R², p-value

### Database Schema

Analysis tools expect the following tables:
- `samples` - Sample metadata (lat, lon, elevation, lithology)
- `ft_ages` - AFT sample-level ages (pooled, central, P(χ²), dispersion)
- `ft_counts` - AFT single-grain count data
- `ft_track_lengths` - Track length measurements
- `ahe_grain_data` - (U-Th)/He single-grain ages
- `datasets` - Dataset metadata

## References

**Literature:**
- Galbraith, R.F., 1988. Graphical display of estimates having differing standard errors. Technometrics 30(3), 271-281.
- Galbraith, R.F., 1990. The radial plot: Graphical assessment of spread in ages. Nuclear Tracks and Radiation Measurements 17(3), 207-214.
- Kohn et al., 2024. Interpreting and reporting fission-track chronological data. GSA Bulletin v.136, 3891-3920.

**Software:**
- Plotly: https://plotly.com/python/
- Matplotlib: https://matplotlib.org/
- SciPy: https://scipy.org/

## Author

Claude Code (AusGeochem Platform)
Date: 2025-11-16

## License

Part of the AusGeochem Thermochronology Database Platform
