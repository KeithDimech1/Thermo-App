#!/usr/bin/env python3
"""
Transform Peak et al. (2021) extracted data to EarthBank HeDatapoint template format
"""

import pandas as pd
import sys
from pathlib import Path
import re

def transform_to_earthbank():
    """Transform RAW CSV tables to EarthBank format"""

    # File paths
    base_dir = Path("build-data/learning/thermo-papers/Peak(2021)-Grand-Canyon-Great-Unconformity-Geology")
    raw_dir = base_dir / "RAW"
    fair_dir = base_dir / "FAIR"

    table_s1 = raw_dir / "table-s1-summary-zhe-raw.csv"
    table_s2 = raw_dir / "table-s2-detailed-zhe-raw.csv"

    if not table_s1.exists() or not table_s2.exists():
        print("ERROR: Extracted tables not found. Run extraction script first.")
        sys.exit(1)

    # Load tables
    df_s1 = pd.read_csv(table_s1)
    df_s2 = pd.read_csv(table_s2)

    print("="*80)
    print("TRANSFORMING TO EARTHBANK TEMPLATE FORMAT")
    print("="*80)

    # 1. Create Samples table
    print("\n1. Creating earthbank_samples.csv...")

    # Extract unique samples
    df_s1['sample_id'] = df_s1['Sample Name and aliquota'].str.extract(r'^([A-Z]{2,4}\d{2,3}-?\d{0,2})_')[0]
    samples = df_s1.groupby('sample_id').first().reset_index()

    samples_earthbank = pd.DataFrame({
        'Sample': samples['sample_id'],
        'IGSN': '',  # To be assigned
        'Latitude': '',  # From paper Figure 1
        'Longitude': '',  # From paper Figure 1
        'Elevation (m)': '',  # River level (~500-700m)
        'Geodetic_Datum': 'WGS84',
        'Vertical_Datum': 'mean sea level',
        'Mineral': 'zircon',
        'Lithology': '',  # From paper text
        'Sample_Kind': 'in situ rock',
        'Sample_Age_Ma': '',  # From paper (1.8-1.4 Ga basement, 729 Ma tuff)
        'Collector': '',  # From paper acknowledgments
        'Collection_Date': '',
    })

    output_samples = fair_dir / "earthbank_samples.csv"
    samples_earthbank.to_csv(output_samples, index=False)
    print(f"   ✅ Saved {len(samples_earthbank)} samples to: {output_samples}")

    # 2. Create He Datapoints table (one per sample)
    print("\n2. Creating earthbank_he_datapoints.csv...")

    # Group by sample for datapoint-level summary
    datapoints = []
    for sample_id, group in df_s1.groupby('sample_id'):
        # Calculate mean ages for the sample
        mean_corrected = group['Corrected Date (Ma)j'].mean()
        mean_uncorrected = group['Uncorr Date (Ma)g'].mean()
        n_grains = len(group)
        std_corrected = group['Corrected Date (Ma)j'].std()

        datapoints.append({
            'Sample': sample_id,
            'Datapoint_ID': f"{sample_id}_ZHe_01",
            'Method': 'ZHe',
            'Laboratory': 'University of Colorado Boulder',
            'Analyst': 'Peak, B.A.',
            'Analysis_Date': '2020',  # Approximate
            'Num_Grains': n_grains,
            'Mean_Corrected_Age_Ma': round(mean_corrected, 2),
            'Mean_Corrected_Age_1s_Ma': round(std_corrected, 2) if pd.notna(std_corrected) else '',
            'Mean_Uncorrected_Age_Ma': round(mean_uncorrected, 2),
            'Notes': 'ZHe with LA-ICP-MS zonation profiling',
        })

    datapoints_earthbank = pd.DataFrame(datapoints)
    output_datapoints = fair_dir / "earthbank_he_datapoints.csv"
    datapoints_earthbank.to_csv(output_datapoints, index=False)
    print(f"   ✅ Saved {len(datapoints_earthbank)} datapoints to: {output_datapoints}")

    # 3. Create He Whole Grain Data table
    print("\n3. Creating earthbank_he_whole_grain_data.csv...")

    # Merge S1 and S2 data
    df_merged = df_s1.merge(
        df_s2,
        left_on='Sample Name and aliquota',
        right_on='Sample Name and aliquota',
        how='left'
    )

    # Map to EarthBank HeWholeGrain template
    he_grain_data = pd.DataFrame({
        'Datapoint_ID': df_merged['sample_id'] + '_ZHe_01',
        'Grain_ID': df_merged['Sample Name and aliquota'],
        'Corrected_Age_Ma': df_merged['Corrected Date (Ma)j'],
        'Corrected_Age_1s_Ma': df_merged['Corr Date Analytic Unc. (Ma)2sk'] / 2,  # Convert 2σ to 1σ
        'Raw_Age_Ma': df_merged['Uncorr Date (Ma)g'],
        'Raw_Age_1s_Ma': df_merged['Uncorr Date Analytic Unc. (Ma) 2s h'] / 2,  # Convert 2σ to 1σ
        'FT': df_merged['FT combi'],
        'He_nmol_g': df_merged['4He (nmol/g)c'],
        'He_nmol_g_1s': df_merged['±d'],
        'He_ncc': df_merged['4He (ncc)h'],
        'He_ncc_1s': df_merged['±i'],
        'U_ppm': df_merged['U (ppm)c'],
        'U_ppm_1s': df_merged['±d.1'],
        'U_ng': df_merged['U (ng)j'],
        'U_ng_1s': df_merged['±i.1'],
        'Th_ppm': df_merged['Th (ppm)c'],
        'Th_ppm_1s': df_merged['±d.2'],
        'Th_ng': df_merged['Th (ng)k'],
        'Th_ng_1s': df_merged['±i.2'],
        'Sm_ppm': df_merged['Sm (ppm)c'],
        'Sm_ppm_1s': df_merged['±d.3'],
        'Sm_ng': df_merged['147Sm (ng)l'],
        'Sm_ng_1s': df_merged['±h'],
        'eU_ppm': df_merged['eUe'],
        'eU_ppm_1s': df_merged['±f'],
        'Rs_um': df_merged['Rs (μm)b'],
        'Mass_mg': df_merged['Mass (mg)g'],
        'Geometry': df_merged['Geometrye'],
        'Length_um': df_merged['length 1 (μm)b '],
        'Width_um': df_merged['width 1 (μm)c'],
        'FT_U238': df_merged['FT 238Um'],
        'FT_U235': df_merged['FT 235Um'],
        'FT_Th232': df_merged['FT 232Thm'],
        'FT_Sm147': df_merged['FT 147Smm'],
        'Num_Pits': df_merged['Npf'],
    })

    output_grain_data = fair_dir / "earthbank_he_whole_grain_data.csv"
    he_grain_data.to_csv(output_grain_data, index=False)
    print(f"   ✅ Saved {len(he_grain_data)} grains to: {output_grain_data}")

    print("\n" + "="*80)
    print("✅ TRANSFORMATION COMPLETE!")
    print("="*80)

    print("\nOutput Files:")
    print(f"  1. {output_samples} ({len(samples_earthbank)} samples)")
    print(f"  2. {output_datapoints} ({len(datapoints_earthbank)} datapoints)")
    print(f"  3. {output_grain_data} ({len(he_grain_data)} grains)")

    print("\nNext Steps:")
    print("  1. Complete missing sample metadata (IGSN, lat/lon, lithology)")
    print("  2. Validate data integrity (eU calculations, Ft corrections)")
    print("  3. Import to database via import scripts")
    print("  4. Upload to EarthBank platform")

    return {
        'n_samples': len(samples_earthbank),
        'n_datapoints': len(datapoints_earthbank),
        'n_grains': len(he_grain_data),
    }

if __name__ == "__main__":
    results = transform_to_earthbank()
    print("\n✅ Done!")
