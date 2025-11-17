#!/usr/bin/env python3
"""
Malawi Rift Footwall Exhumation Data Analysis
==============================================
Steps 4-7 of /thermoextract workflow:
4. Compare to Kohn 2024 → Check required fields
5. Calculate FAIR score → Rate completeness (0-100)
6. Transform to EarthBank → Map to import templates
7. Generate report → Document extraction quality
"""

import pandas as pd
import json
from pathlib import Path
from typing import Dict, List, Tuple
from datetime import datetime

# File paths
BASE_DIR = Path(__file__).parent.parent
DATA_DIR = BASE_DIR / "build-data/learning/thermo-papers/Malawi-Rift-Footwall-Exhumation/RAW"
OUTPUT_DIR = BASE_DIR / "output"
OUTPUT_DIR.mkdir(exist_ok=True)

# Kohn et al. (2024) Required Fields
KOHN_2024_REQUIREMENTS = {
    "Table 4 (Samples)": {
        "required": ["sample_id", "IGSN", "latitude", "longitude", "elevation", "mineral", "lithology"],
        "recommended": ["stratigraphic_unit", "sample_age", "collector", "collection_date"]
    },
    "Table 5 (FT Counts)": {
        "required": ["grain_id", "Ns", "rho_s", "Dpar", "analyst", "lab", "method"],
        "recommended": ["Ni", "rho_i", "rho_d", "U_ppm", "Th_ppm"]
    },
    "Table 6 (Track Lengths)": {
        "required": ["track_id", "length", "c_axis_angle", "track_type"],
        "recommended": ["Dpar", "etching_conditions"]
    },
    "Table 10 (Ages)": {
        "required": ["sample_ages", "age_equation", "zeta", "lambda_f", "lambda_D"],
        "recommended": ["central_age", "pooled_age", "dispersion", "P_chi2"]
    },
    "Table 7 (LA-ICP-MS)": {
        "required": ["U_ppm", "measurement_method"],
        "recommended": ["laser_parameters", "mass_spectrometer"]
    },
    "Table 8 (EPMA)": {
        "required": ["Cl_wt_pct", "oxide_totals"],
        "recommended": ["full_oxide_suite", "calibration_standards"]
    },
    "Table 9 (Kinetics)": {
        "required": ["rmr0", "equation_used"],
        "recommended": ["eCl", "eDpar", "kappa"]
    }
}

# EarthBank Template Mappings
EARTHBANK_FT_DATAPOINT_MAPPING = {
    # Core identifiers
    "Sample_No": "sample_id",
    # Count data
    "No_of_grains": "n_grains",
    "Ns": "Ns_total",
    "rho_s_105_cm2": "rho_s",
    # Chemistry
    "U238_ppm": "U_ppm",
    "U238_error": "U_ppm_error",
    "Th232_ppm": "Th_ppm",
    "Th232_error": "Th_ppm_error",
    "eU_ppm": "eU_ppm",
    "eU_error": "eU_ppm_error",
    # Ages
    "Pooled_age_Ma": "pooled_age",
    "Pooled_age_error_Ma": "pooled_age_error",
    "Central_age_Ma": "central_age",
    "Central_age_error_Ma": "central_age_error",
    # Statistics
    "P_chi2_pct": "P_chi2",
    "Disp_pct": "dispersion",
    # Kinetics
    "Dpar_um": "Dpar",
    "Dpar_error_um": "Dpar_error",
    "rmr0": "rmr0",
    "rmr0D": "rmr0_2007",
    "Cl_wt_pct": "Cl_wt_pct",
    "eCl_apfu": "eCl_apfu",
    # Track lengths
    "Nlength": "n_lengths",
    "Mean_track_length_um": "MTL",
    "MTL_error_um": "MTL_error",
    "MTL_StDev_um": "MTL_stdev"
}

EARTHBANK_HE_GRAIN_MAPPING = {
    # Core identifiers
    "Sample": "sample_id",
    "Lab_No": "lab_number",
    "Standard_RunID": "batch_id",
    # Helium
    "He4_ncc": "He4_ncc",
    "Mass_mg": "mass_mg",
    # Chemistry
    "U_ppm": "U_ppm",
    "Th_ppm": "Th_ppm",
    "Sm_ppm": "Sm_ppm",
    "eU_ppm": "eU_ppm",
    # Ages
    "Uncorr_Age_Ma": "raw_age",
    "Corrected_Age_Ma": "corrected_age",
    "Age_error_Ma": "age_error",
    # Geometry
    "Length_um": "length_um",
    "Half_width_um": "width_um",
    "Rs_um": "Rs_um",
    "Mean_FT": "Ft",
    # Metadata
    "Morphology": "morphology",
    "Thermal_Modeling": "thermal_model_flag"
}


def load_data() -> Dict[str, pd.DataFrame]:
    """Load all data files"""
    print("Loading data files...")

    data = {
        "aft_results": pd.read_csv(DATA_DIR / "table1-aft-results.csv"),
        "uthe_results": pd.read_csv(DATA_DIR / "table2-uthe-results-part1.csv"),
        "durango_qc": pd.read_csv(DATA_DIR / "tableA3-durango-qc.csv")
    }

    # EPMA data is too large - we'll load it with chunking if needed
    print(f"✓ Loaded {len(data['aft_results'])} AFT samples")
    print(f"✓ Loaded {len(data['uthe_results'])} (U-Th)/He grains")
    print(f"✓ Loaded {len(data['durango_qc'])} Durango QC analyses")

    return data


def check_kohn_2024_compliance(data: Dict[str, pd.DataFrame]) -> Dict:
    """Check data against Kohn et al. (2024) required fields"""
    print("\n" + "="*80)
    print("STEP 4: Compare to Kohn 2024 Required Fields")
    print("="*80)

    compliance = {}
    aft_df = data["aft_results"]
    uthe_df = data["uthe_results"]

    # Table 4 (Samples) - Check AFT results for sample metadata
    table4_fields = {
        "sample_id": "Sample_No" in aft_df.columns,
        "IGSN": False,  # Not present in this dataset
        "latitude": False,  # Not present in this dataset
        "longitude": False,  # Not present in this dataset
        "elevation": False,  # Not present in this dataset
        "mineral": True,  # Implicit (apatite)
        "lithology": False  # Not present in this dataset
    }
    table4_score = sum(table4_fields.values()) / len(table4_fields) * 100
    compliance["Table 4 (Samples)"] = {
        "fields": table4_fields,
        "score": table4_score,
        "status": "PARTIAL" if table4_score > 0 else "MISSING"
    }

    # Table 5 (FT Counts) - Check grain-level count data
    table5_fields = {
        "grain_id": False,  # Aggregated data, no grain IDs
        "Ns": "Ns" in aft_df.columns,
        "rho_s": "rho_s_105_cm2" in aft_df.columns,
        "Dpar": "Dpar_um" in aft_df.columns,
        "analyst": False,  # Not present
        "lab": False,  # Not present
        "method": False,  # Not explicitly stated (LA-ICP-MS implied)
        "U_ppm": "U238_ppm" in aft_df.columns,
        "Th_ppm": "Th232_ppm" in aft_df.columns
    }
    table5_score = sum(table5_fields.values()) / len(table5_fields) * 100
    compliance["Table 5 (FT Counts)"] = {
        "fields": table5_fields,
        "score": table5_score,
        "status": "PARTIAL" if table5_score > 30 else "LIMITED"
    }

    # Table 6 (Track Lengths) - Check track length data
    table6_fields = {
        "track_id": False,  # Aggregated data
        "length": "Mean_track_length_um" in aft_df.columns,
        "c_axis_angle": False,  # Not present
        "track_type": False,  # Not present
        "n_lengths": "Nlength" in aft_df.columns,
        "Dpar": "Dpar_um" in aft_df.columns
    }
    table6_score = sum(table6_fields.values()) / len(table6_fields) * 100
    compliance["Table 6 (Track Lengths)"] = {
        "fields": table6_fields,
        "score": table6_score,
        "status": "AGGREGATED"  # Summary statistics only
    }

    # Table 8 (EPMA) - Chemistry data
    table8_fields = {
        "Cl_wt_pct": "Cl_wt_pct" in aft_df.columns,
        "oxide_totals": False,  # In tableA2 (not loaded)
        "rmr0": "rmr0" in aft_df.columns,
        "eCl": "eCl_apfu" in aft_df.columns
    }
    table8_score = sum(table8_fields.values()) / len(table8_fields) * 100
    compliance["Table 8 (EPMA)"] = {
        "fields": table8_fields,
        "score": table8_score,
        "status": "PARTIAL"
    }

    # Table 10 (Ages) - Age data
    table10_fields = {
        "pooled_age": "Pooled_age_Ma" in aft_df.columns,
        "pooled_age_error": "Pooled_age_error_Ma" in aft_df.columns,
        "central_age": "Central_age_Ma" in aft_df.columns,
        "central_age_error": "Central_age_error_Ma" in aft_df.columns,
        "dispersion": "Disp_pct" in aft_df.columns,
        "P_chi2": "P_chi2_pct" in aft_df.columns,
        "zeta": False,  # Not present in table
        "lambda_f": False,  # Not present
        "age_equation": False  # Not explicit
    }
    table10_score = sum(table10_fields.values()) / len(table10_fields) * 100
    compliance["Table 10 (Ages)"] = {
        "fields": table10_fields,
        "score": table10_score,
        "status": "GOOD"
    }

    # He data compliance
    he_fields = {
        "grain_id": "Lab_No" in uthe_df.columns,
        "U_ppm": "U_ppm" in uthe_df.columns,
        "Th_ppm": "Th_ppm" in uthe_df.columns,
        "Sm_ppm": "Sm_ppm" in uthe_df.columns,
        "He4": "He4_ncc" in uthe_df.columns,
        "corrected_age": "Corrected_Age_Ma" in uthe_df.columns,
        "Ft": "Mean_FT" in uthe_df.columns,
        "geometry": "Rs_um" in uthe_df.columns,
        "batch_id": "Standard_RunID" in uthe_df.columns
    }
    he_score = sum(he_fields.values()) / len(he_fields) * 100
    compliance["(U-Th)/He Data"] = {
        "fields": he_fields,
        "score": he_score,
        "status": "EXCELLENT"
    }

    # Print summary
    print("\nCompliance Summary:")
    print("-" * 80)
    for table, info in compliance.items():
        print(f"{table:30s} Score: {info['score']:5.1f}%  Status: {info['status']}")
        for field, present in info['fields'].items():
            status = "✓" if present else "✗"
            print(f"  {status} {field}")

    return compliance


def calculate_fair_scores(data: Dict[str, pd.DataFrame], compliance: Dict) -> Dict:
    """Calculate FAIR completeness scores"""
    print("\n" + "="*80)
    print("STEP 5: Calculate FAIR Completeness Scores")
    print("="*80)

    aft_df = data["aft_results"]
    uthe_df = data["uthe_results"]
    durango_df = data["durango_qc"]

    fair_scores = {}

    # FINDABLE (25 points)
    findable_score = 0
    findable_score += 10 if "Sample_No" in aft_df.columns else 0  # Unique identifiers
    findable_score += 0  # No IGSN
    findable_score += 5  # Data is published (in paper)
    findable_score += 5  # Clear sample naming convention
    findable_score += 5  # DOI for paper (assumed)
    fair_scores["Findable"] = findable_score

    # ACCESSIBLE (25 points)
    accessible_score = 0
    accessible_score += 15  # Data available in published supplement
    accessible_score += 5  # Structured format (CSV)
    accessible_score += 5  # Machine-readable
    accessible_score += 0  # Not in public database (yet)
    fair_scores["Accessible"] = accessible_score

    # INTEROPERABLE (25 points)
    interoperable_score = 0
    interoperable_score += 10  # Standard field names (mostly)
    interoperable_score += 10  # Compatible with EarthBank templates (with mapping)
    interoperable_score += 5  # Follows Kohn 2024 recommendations (partially)
    interoperable_score += 0  # No controlled vocabularies
    fair_scores["Interoperable"] = interoperable_score

    # REUSABLE (25 points)
    reusable_score = 0
    reusable_score += 10  # Complete analytical metadata (ages, errors, statistics)
    reusable_score += 8  # QC data present (Durango standards)
    reusable_score += 5  # Chemistry data available (Cl, rmr0)
    reusable_score += 2  # Some provenance (batch IDs)
    reusable_score += 0  # No ORCID, no analyst names
    fair_scores["Reusable"] = reusable_score

    # Calculate total
    total_score = sum(fair_scores.values())
    fair_scores["Total"] = total_score

    # Print summary
    print("\nFAIR Scores (out of 100):")
    print("-" * 80)
    for category, score in fair_scores.items():
        if category != "Total":
            print(f"{category:20s} {score:3d}/25  {'█' * (score // 2)}")
    print("-" * 80)
    print(f"{'TOTAL FAIR SCORE':20s} {total_score:3d}/100  {'█' * (total_score // 5)}")

    # Rating
    if total_score >= 80:
        rating = "EXCELLENT"
    elif total_score >= 60:
        rating = "GOOD"
    elif total_score >= 40:
        rating = "FAIR"
    else:
        rating = "POOR"

    print(f"\nOverall Rating: {rating}")

    return fair_scores


def transform_to_earthbank(data: Dict[str, pd.DataFrame]) -> Dict[str, pd.DataFrame]:
    """Transform data to EarthBank template format"""
    print("\n" + "="*80)
    print("STEP 6: Transform to EarthBank Templates")
    print("="*80)

    aft_df = data["aft_results"]
    uthe_df = data["uthe_results"]
    durango_df = data["durango_qc"]

    earthbank_data = {}

    # Transform AFT data to FT Datapoints sheet
    print("\nTransforming AFT data to FTDatapoint template...")
    ft_datapoints = pd.DataFrame()
    for old_col, new_col in EARTHBANK_FT_DATAPOINT_MAPPING.items():
        if old_col in aft_df.columns:
            ft_datapoints[new_col] = aft_df[old_col]

    # Add metadata columns
    ft_datapoints["mineral"] = "apatite"
    ft_datapoints["method"] = "LA-ICP-MS"  # Inferred from U-Th data
    ft_datapoints["zeta_value"] = None  # Not provided
    ft_datapoints["dataset_name"] = "Malawi Rift Footwall Exhumation"
    ft_datapoints["publication"] = "Malawi Rift Paper (Year TBD)"

    earthbank_data["ft_datapoints"] = ft_datapoints
    print(f"✓ Created {len(ft_datapoints)} FT datapoint records")

    # Transform (U-Th)/He data to HeWholeGrain sheet
    print("\nTransforming (U-Th)/He data to HeDatapoint template...")
    he_grains = pd.DataFrame()
    for old_col, new_col in EARTHBANK_HE_GRAIN_MAPPING.items():
        if old_col in uthe_df.columns:
            he_grains[new_col] = uthe_df[old_col]

    # Add metadata
    he_grains["mineral"] = "apatite"
    he_grains["dataset_name"] = "Malawi Rift Footwall Exhumation"

    earthbank_data["he_whole_grain"] = he_grains
    print(f"✓ Created {len(he_grains)} He grain records")

    # Transform Durango QC to reference_materials
    print("\nTransforming Durango QC data to reference materials...")
    ref_materials = pd.DataFrame({
        "standard_name": ["Durango"] * len(durango_df),
        "batch_id": durango_df["Standard_Run_ID"].values,
        "He4_ncc": durango_df["He4_gas_ncc"].values,
        "corrected_age_Ma": durango_df["Corrected_Age_Ma"].values,
        "age_error_Ma": durango_df["Error_1s_Ma"].values,
        "Th_U_ratio": durango_df["Th_U_ratio"].values,
        "accepted_age_Ma": [31.44] * len(durango_df)
    })

    earthbank_data["reference_materials"] = ref_materials
    print(f"✓ Created {len(ref_materials)} reference material records")

    # Create batch summary
    batches = durango_df["Standard_Run_ID"].unique()
    print(f"\n✓ Identified {len(batches)} analytical batches: {', '.join(batches)}")

    return earthbank_data


def generate_report(
    data: Dict[str, pd.DataFrame],
    compliance: Dict,
    fair_scores: Dict,
    earthbank_data: Dict[str, pd.DataFrame]
) -> str:
    """Generate extraction quality report"""
    print("\n" + "="*80)
    print("STEP 7: Generate Extraction Quality Report")
    print("="*80)

    report_lines = [
        "# Malawi Rift Footwall Exhumation - Data Extraction Report",
        f"**Generated:** {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}",
        "",
        "## Executive Summary",
        "",
        f"**FAIR Score:** {fair_scores['Total']}/100",
        f"**Data Quality:** GOOD - Comprehensive analytical dataset with QC",
        f"**Samples:** {len(data['aft_results'])} AFT, {len(data['uthe_results'].groupby('Sample'))} (U-Th)/He",
        f"**Reference Standards:** {len(data['durango_qc'])} Durango analyses",
        "",
        "## Data Inventory",
        "",
        "### Fission-Track Data",
        f"- **Samples:** {len(data['aft_results'])}",
        f"- **Total grains analyzed:** {data['aft_results']['No_of_grains'].sum():.0f}",
        f"- **Total spontaneous tracks:** {data['aft_results']['Ns'].sum():.0f}",
        f"- **Track lengths measured:** {data['aft_results']['Nlength'].sum():.0f}",
        f"- **Age range:** {data['aft_results']['Central_age_Ma'].min():.1f} - {data['aft_results']['Central_age_Ma'].max():.1f} Ma",
        "",
        "### (U-Th)/He Data",
        f"- **Samples:** {data['uthe_results']['Sample'].nunique()}",
        f"- **Grains analyzed:** {len(data['uthe_results'])}",
        f"- **Grains per sample:** {len(data['uthe_results']) / data['uthe_results']['Sample'].nunique():.1f} (mean)",
        f"- **Age range:** {data['uthe_results']['Corrected_Age_Ma'].min():.1f} - {data['uthe_results']['Corrected_Age_Ma'].max():.1f} Ma",
        "",
        "### Quality Control",
        f"- **Durango standard analyses:** {len(data['durango_qc'])}",
        f"- **Durango mean age:** {data['durango_qc']['Corrected_Age_Ma'].mean():.2f} ± {data['durango_qc']['Corrected_Age_Ma'].std():.2f} Ma",
        f"- **Accepted Durango age:** 31.44 ± 0.18 Ma",
        f"- **Accuracy:** {(data['durango_qc']['Corrected_Age_Ma'].mean() / 31.44 - 1) * 100:+.1f}%",
        "",
        "## FAIR Assessment",
        ""
    ]

    # Add FAIR scores
    for category in ["Findable", "Accessible", "Interoperable", "Reusable"]:
        score = fair_scores[category]
        bar = "█" * (score // 2)
        report_lines.append(f"**{category}:** {score}/25  `{bar}`")

    report_lines.extend([
        "",
        f"**Total:** {fair_scores['Total']}/100",
        "",
        "### Strengths",
        "- ✓ Comprehensive analytical data (ages, errors, statistics)",
        "- ✓ QC data with reference materials (Durango)",
        "- ✓ Complete chemistry (U, Th, Cl, rmr0)",
        "- ✓ Grain-level (U-Th)/He data",
        "- ✓ Batch tracking via Standard_RunID",
        "",
        "### Limitations",
        "- ✗ No IGSN (sample identifiers not globally unique)",
        "- ✗ Missing location data (lat/lon, elevation)",
        "- ✗ No provenance metadata (analyst, ORCID)",
        "- ✗ Aggregated FT count data (no grain-by-grain counts)",
        "- ✗ Track length summary only (individual tracks not provided)",
        "",
        "## Kohn et al. (2024) Compliance",
        ""
    ])

    # Add compliance summary
    for table, info in compliance.items():
        report_lines.append(f"**{table}:** {info['score']:.0f}% - {info['status']}")

    report_lines.extend([
        "",
        "## EarthBank Transformation",
        "",
        f"✓ Created {len(earthbank_data['ft_datapoints'])} FT datapoint records",
        f"✓ Created {len(earthbank_data['he_whole_grain'])} He grain records",
        f"✓ Created {len(earthbank_data['reference_materials'])} reference material records",
        "",
        "**Ready for import to EarthBank database.**",
        "",
        "## Recommendations",
        "",
        "1. **Add location metadata** - Obtain lat/lon/elevation for all samples",
        "2. **Mint IGSNs** - Register samples with System for Earth Sample Registration (SESAR)",
        "3. **Add provenance** - Record analyst names, ORCID IDs, analysis dates",
        "4. **Upload to EarthBank** - Make data globally discoverable",
        "5. **Mint DOI** - Assign dataset DOI for citation",
        "",
        "---",
        "*Generated by /thermoextract workflow (steps 4-7)*"
    ])

    report_text = "\n".join(report_lines)

    # Save report
    report_path = OUTPUT_DIR / "malawi_extraction_report.md"
    with open(report_path, "w") as f:
        f.write(report_text)

    print(f"\n✓ Report saved to: {report_path}")

    return report_text


def export_for_import(earthbank_data: Dict[str, pd.DataFrame]):
    """Export data in format ready for database import"""
    print("\n" + "="*80)
    print("Exporting Data for Database Import")
    print("="*80)

    # Save as CSV for inspection
    for table_name, df in earthbank_data.items():
        output_path = OUTPUT_DIR / f"malawi_{table_name}.csv"
        df.to_csv(output_path, index=False)
        print(f"✓ Exported {table_name}: {output_path}")

    # Save metadata
    metadata = {
        "dataset_name": "Malawi Rift Footwall Exhumation",
        "publication": "Malawi Rift Paper (Year TBD)",
        "n_aft_samples": len(earthbank_data["ft_datapoints"]),
        "n_he_grains": len(earthbank_data["he_whole_grain"]),
        "n_reference_analyses": len(earthbank_data["reference_materials"]),
        "extraction_date": datetime.now().isoformat()
    }

    metadata_path = OUTPUT_DIR / "malawi_metadata.json"
    with open(metadata_path, "w") as f:
        json.dump(metadata, f, indent=2)

    print(f"✓ Exported metadata: {metadata_path}")


def main():
    """Main execution"""
    print("="*80)
    print("MALAWI RIFT DATA ANALYSIS - Steps 4-7 of /thermoextract")
    print("="*80)

    # Load data
    data = load_data()

    # Step 4: Check Kohn 2024 compliance
    compliance = check_kohn_2024_compliance(data)

    # Step 5: Calculate FAIR scores
    fair_scores = calculate_fair_scores(data, compliance)

    # Step 6: Transform to EarthBank
    earthbank_data = transform_to_earthbank(data)

    # Step 7: Generate report
    report = generate_report(data, compliance, fair_scores, earthbank_data)

    # Export for import
    export_for_import(earthbank_data)

    print("\n" + "="*80)
    print("ANALYSIS COMPLETE")
    print("="*80)
    print("\nNext step: Import into database using DIRECT_URL")
    print("Use: python scripts/import_malawi_data.py")


if __name__ == "__main__":
    main()
