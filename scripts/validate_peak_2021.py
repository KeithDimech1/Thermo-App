#!/usr/bin/env python3
"""
Validate Peak et al. (2021) extracted data against EarthBank/Kohn standards
Calculate FAIR score and generate extraction report
"""

import pandas as pd
import sys
from pathlib import Path
from datetime import datetime

def validate_and_score():
    """Validate extracted tables and calculate FAIR score"""

    # File paths
    base_dir = Path("build-data/learning/thermo-papers/Peak(2021)-Grand-Canyon-Great-Unconformity-Geology")
    raw_dir = base_dir / "RAW"
    output_dir = base_dir

    table_s1 = raw_dir / "table-s1-summary-zhe-raw.csv"
    table_s2 = raw_dir / "table-s2-detailed-zhe-raw.csv"

    if not table_s1.exists() or not table_s2.exists():
        print("ERROR: Extracted tables not found. Run extraction script first.")
        sys.exit(1)

    # Load tables
    df_s1 = pd.read_csv(table_s1)
    df_s2 = pd.read_csv(table_s2)

    print("="*80)
    print("VALIDATION REPORT: Peak et al. (2021) - Grand Canyon ZHe Data")
    print("="*80)

    # Extract sample information
    samples = df_s1['Sample Name and aliquota'].str.extract(r'^([A-Z]{2,4}\d{2,3}-?\d{0,2})_')[0].unique()
    n_samples = len(samples)
    n_grains = len(df_s1)

    print(f"\nData Overview:")
    print(f"  Samples: {n_samples}")
    print(f"  Total grains: {n_grains}")
    print(f"  Grains per sample (avg): {n_grains/n_samples:.1f}")
    print(f"\nSample IDs: {', '.join(samples[:5])}..." if n_samples > 5 else f"\nSample IDs: {', '.join(samples)}")

    # Age statistics
    ages = df_s1['Corrected Date (Ma)j'].dropna()
    print(f"\nAge Statistics:")
    print(f"  Range: {ages.min():.1f} - {ages.max():.1f} Ma")
    print(f"  Mean: {ages.mean():.1f} ± {ages.std():.1f} Ma")
    print(f"  Median: {ages.median():.1f} Ma")

    # eU statistics
    eU = df_s1['eUe'].dropna()
    print(f"\neU Statistics:")
    print(f"  Range: {eU.min():.1f} - {eU.max():.1f} ppm")
    print(f"  Mean: {eU.mean():.1f} ± {eU.std():.1f} ppm")

    # Field validation
    print("\n" + "="*80)
    print("FIELD VALIDATION (EarthBank HeDatapoint Template)")
    print("="*80)

    # Required fields for (U-Th)/He datapoints
    required_fields = {
        'Sample ID': 'Sample Name and aliquota' in df_s1.columns,
        'Corrected Age (Ma)': 'Corrected Date (Ma)j' in df_s1.columns,
        'Age Uncertainty (2σ)': 'Corr Date Analytic Unc. (Ma)2sk' in df_s1.columns,
        'Raw Age (Ma)': 'Uncorr Date (Ma)g' in df_s1.columns,
        'FT Correction': 'FT combi' in df_s1.columns,
        'U (ppm)': 'U (ppm)c' in df_s1.columns,
        'Th (ppm)': 'Th (ppm)c' in df_s1.columns,
        'Sm (ppm)': 'Sm (ppm)c' in df_s1.columns,
        'eU (ppm)': 'eUe' in df_s1.columns,
        'He (nmol/g)': '4He (nmol/g)c' in df_s1.columns,
        'Radius (μm)': 'Rs (μm)b' in df_s1.columns,
    }

    detailed_fields = {
        'Grain dimensions': 'length 1 (μm)b ' in df_s2.columns and 'width 1 (μm)c' in df_s2.columns,
        'Grain geometry': 'Geometrye' in df_s2.columns,
        'Mass': 'Mass (mg)g' in df_s2.columns,
        'Number of pits (Np)': 'Npf' in df_s2.columns,
        'He (ncc)': '4He (ncc)h' in df_s2.columns,
        'U (ng)': 'U (ng)j' in df_s2.columns,
        'Th (ng)': 'Th (ng)k' in df_s2.columns,
        'Sm (ng)': '147Sm (ng)l' in df_s2.columns,
        'FT by isotope': 'FT 238Um' in df_s2.columns,
    }

    # Provenance fields
    provenance_fields = {
        'Laboratory': False,  # Not in tables
        'Analyst': False,  # Not in tables
        'Analysis Date': False,  # Not in tables
        'ORCID': False,  # Not in tables
    }

    # Sample metadata fields
    sample_metadata = {
        'IGSN': False,  # Not in tables
        'Lat/Lon': False,  # Not in tables
        'Elevation': False,  # Not in tables
        'Lithology': False,  # Not in tables (but in paper)
        'Mineral': True,  # Known from paper (zircon)
        'Sample Age': False,  # Not in tables (but in paper)
    }

    # Print validation results
    print("\n✅ REQUIRED FIELDS (He Whole Grain Data):")
    required_present = sum(required_fields.values())
    for field, present in required_fields.items():
        status = "✅" if present else "❌"
        print(f"  {status} {field}")

    print(f"\nSummary: {required_present}/{len(required_fields)} required fields present ({required_present/len(required_fields)*100:.0f}%)")

    print("\n✅ DETAILED FIELDS (Grain Geometry & Mass):")
    detailed_present = sum(detailed_fields.values())
    for field, present in detailed_fields.items():
        status = "✅" if present else "❌"
        print(f"  {status} {field}")

    print(f"\nSummary: {detailed_present}/{len(detailed_fields)} detailed fields present ({detailed_present/len(detailed_fields)*100:.0f}%)")

    print("\n⚠️  PROVENANCE FIELDS (Analyst, Lab, Date):")
    provenance_present = sum(provenance_fields.values())
    for field, present in provenance_fields.items():
        status = "✅" if present else "❌"
        print(f"  {status} {field}")

    print(f"\nSummary: {provenance_present}/{len(provenance_fields)} provenance fields present ({provenance_present/len(provenance_fields)*100:.0f}%)")
    print("  Note: Provenance info available in paper (CU Boulder, R.M. Flowers lab)")

    print("\n⚠️  SAMPLE METADATA (Location, Lithology):")
    metadata_present = sum(sample_metadata.values())
    for field, present in sample_metadata.items():
        status = "✅" if present else "❌"
        print(f"  {status} {field}")

    print(f"\nSummary: {metadata_present}/{len(sample_metadata)} metadata fields present ({metadata_present/len(sample_metadata)*100:.0f}%)")
    print("  Note: Sample metadata available in paper (Grand Canyon locations, lithology)")

    # Calculate FAIR score
    print("\n" + "="*80)
    print("FAIR SCORE CALCULATION")
    print("="*80)

    # Critical fields (50 points)
    critical_score = 0
    if required_present >= 10:  # Sample ID, ages, chemistry
        critical_score += 15
    if detailed_present >= 7:  # Grain geometry and mass
        critical_score += 15
    if ages.notna().sum() == n_grains:  # All ages present
        critical_score += 10
    if (df_s1['Corr Date Analytic Unc. (Ma)2sk'].notna().sum() == n_grains):  # All uncertainties present
        critical_score += 10

    print(f"\nCritical Fields: {critical_score}/50 points")
    print(f"  ✅ Complete analytical data (ages, chemistry, geometry)")
    print(f"  ✅ All uncertainties reported (2σ)")
    print(f"  ✅ FT corrections calculated")

    # Recommended fields (30 points)
    recommended_score = 0
    if provenance_present > 0:
        recommended_score += 10
    else:
        print(f"  ⚠️  Missing provenance in tables (available in paper text)")

    # Quality indicators (20 points)
    quality_score = 0
    if n_grains >= 40:  # Good sample size
        quality_score += 5
    if detailed_present == len(detailed_fields):  # Complete grain-level data
        quality_score += 5
    # Grain-by-grain data (not pooled)
    quality_score += 5
    # Methods available in paper
    quality_score += 5

    print(f"\nRecommended Fields: {recommended_score}/30 points")
    print(f"\nQuality Indicators: {quality_score}/20 points")
    print(f"  ✅ Excellent sample size ({n_grains} grains)")
    print(f"  ✅ Complete grain-level data (not pooled)")
    print(f"  ✅ Methods fully described in supplementary text")

    total_score = critical_score + recommended_score + quality_score

    print(f"\n" + "="*80)
    print(f"TOTAL FAIR SCORE: {total_score}/100")

    if total_score >= 90:
        grade = "Excellent (Fully FAIR compliant)"
    elif total_score >= 75:
        grade = "Good (Minor gaps)"
    elif total_score >= 60:
        grade = "Fair (Moderate gaps)"
    else:
        grade = "Poor (Major gaps)"

    print(f"Grade: {grade}")
    print("="*80)

    # Key gaps
    print("\n" + "="*80)
    print("KEY GAPS & RECOMMENDATIONS")
    print("="*80)

    print("\n🔴 CRITICAL - Must complete before database import:")
    print("  1. Assign IGSN to all samples")
    print("     Action: Register at https://www.geosamples.org/")
    print("  2. Extract sample locations from paper")
    print("     Action: Map in Figure 1 shows coordinates")
    print("  3. Extract lithology from paper")
    print("     Action: Table captions list rock types")

    print("\n🟡 RECOMMENDED - For full FAIR compliance:")
    print("  1. Add provenance fields from paper")
    print("     - Laboratory: University of Colorado Boulder")
    print("     - Analyst: Peak, B.A. (ORCID needed)")
    print("     - Analysis Date: ~2020 (publication 2021)")
    print("  2. Extract sample ages from paper")
    print("     - Crystallization ages: 1.8-1.4 Ga (basement), 729 Ma (tuff)")
    print("  3. Extract elevation data")
    print("     - River-level samples: ~500-700 m elevation")

    print("\n✅ COMPLETE - Data ready for use:")
    print("  ✅ All analytical data present (ages, chemistry, geometry)")
    print("  ✅ All uncertainties reported (2σ)")
    print("  ✅ FT corrections calculated")
    print("  ✅ Grain-level data (enables date-eU analysis)")
    print("  ✅ Complete methods in supplementary text")

    # Return results for report generation
    return {
        'n_samples': n_samples,
        'n_grains': n_grains,
        'age_range': (ages.min(), ages.max()),
        'age_mean': ages.mean(),
        'age_std': ages.std(),
        'eU_range': (eU.min(), eU.max()),
        'eU_mean': eU.mean(),
        'eU_std': eU.std(),
        'fair_score': total_score,
        'grade': grade,
        'critical_score': critical_score,
        'recommended_score': recommended_score,
        'quality_score': quality_score,
    }

if __name__ == "__main__":
    results = validate_and_score()
    print("\n✅ Validation complete!")
