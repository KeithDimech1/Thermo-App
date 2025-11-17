#!/usr/bin/env python3
"""
Generic EarthBank Template Importer
====================================
Import data directly from EarthBank Excel templates into PostgreSQL database.

Supports:
- Sample.template.v2025-04-16.xlsx
- FTDatapoint.template.v2024-11-11.xlsx
- HeDatapoint.template.v2024-11-11.xlsx
- GCDatapoint.template.v2024-11-11.xlsx

Usage:
    python scripts/import_earthbank_templates.py <template_file> [--dataset-name "Name"]
"""

import pandas as pd
import psycopg2
from psycopg2.extras import RealDictCursor
from pathlib import Path
import sys
import argparse
from datetime import datetime
from typing import Dict, List, Optional, Tuple

# Database connection
DIRECT_URL = "postgresql://neondb_owner:npg_a7j4RQTnJxcz@ep-fragrant-bush-ahfxu1xq-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require"

# Column mappings: EarthBank → Database
SAMPLE_COLUMN_MAP = {
    "IGSN": "igsn",
    "Latitude": "latitude",
    "Longitude": "longitude",
    "Elevation (m)": "elevation_m",
    "Geodetic Datum": "geodetic_datum",
    "Vertical Datum": "vertical_datum",
    "Lat/Long Precision (m)": "lat_long_precision_m",
    "Lithology": "lithology",
    "Mineral": "mineral_type",
    "Sample Kind": "sample_kind",
    "Sample Method": "sample_method",
    "Sample Depth (m)": "sample_depth_m",
    "Sampling Location Information": "sampling_location_information",
    "Stratigraphic Unit": "stratigraphic_unit",
    "Chronostratigraphic Unit Age": "chronostratigraphic_unit_age",
    "Sample Age (Ma)": "sample_age_ma",
    "Sample Collector": "sample_collector",
    "Collection Date": "collection_date",
    "Analyst": "analyst",
    "Analysis Method": "analysis_method",
    "Last Known Sample Archive": "last_known_sample_archive",
    "Associated References": "associated_references"
}

FT_DATAPOINT_COLUMN_MAP = {
    # Core identifiers
    "Sample ID": "sample_id",
    "Datapoint Key": "datapoint_key",
    "Batch ID": "batch_id",

    # Lab info
    "Laboratory": "laboratory",
    "Analyst ORCID": "analyst_orcid",
    "Analysis Date": "analysis_date",
    "Publication DOI": "publication_doi",

    # Method
    "Mineral": "mineral_type",
    "FT Method": "ft_method",
    "FT Software": "ft_software",
    "FT Algorithm": "ft_algorithm",
    "U Determination Method": "u_determination_method",

    # Count data
    "N Grains": "n_grains",
    "Total Area (cm²)": "total_area_cm2",
    "Mean ρs": "mean_rho_s",
    "Total Ns": "total_ns",
    "Mean ρi": "mean_rho_i",
    "Total Ni": "total_ni",
    "Mean ρd": "mean_rho_d",
    "Total Nd": "total_nd",
    "Dosimeter": "dosimeter",

    # Chemistry
    "Mean U (ppm)": "mean_u_ppm",
    "SD U (ppm)": "sd_u_ppm",

    # Kinetics
    "Mean Dpar (μm)": "mean_dpar_um",
    "SE Dpar (μm)": "se_dpar_um",
    "N Dpar Measurements": "n_dpar_measurements",
    "Mean Dper (μm)": "mean_dper_um",
    "SE Dper (μm)": "se_dper_um",
    "N Dper Measurements": "n_dper_measurements",
    "Mean rmr₀": "mean_rmr0",
    "SD rmr₀": "sd_rmr0",
    "Mean κ": "mean_kappa",
    "SD κ": "sd_kappa",
    "rmr₀ Equation": "rmr0_equation",

    # Statistics
    "χ²": "chi_square",
    "P(χ²) (%)": "p_chi2_pct",
    "Dispersion (%)": "dispersion_pct",

    # Ages
    "Age Equation": "age_equation",
    "Mean Age (Ma)": "mean_age_ma",
    "Mean Age Error (Ma)": "mean_age_error_ma",
    "Central Age (Ma)": "central_age_ma",
    "Central Age Error (Ma)": "central_age_error_ma",
    "Pooled Age (Ma)": "pooled_age_ma",
    "Pooled Age Error (Ma)": "pooled_age_error_ma",
    "Population Age (Ma)": "population_age_ma",
    "Population Age Error (Ma)": "population_age_error_ma",
    "Age Error Type": "age_error_type",
    "Age Comment": "age_comment",

    # Track lengths
    "Mean Track Length (μm)": "mean_track_length_um",
    "SE Mean Track Length (μm)": "se_mean_track_length_um",
    "N Track Measurements": "n_track_measurements",
    "SD Track Length (μm)": "sd_track_length_um",

    # Etching
    "²⁵²Cf Irradiation": "cf252_irradiation",
    "Etchant Chemical": "etchant_chemical",
    "Etch Duration (s)": "etch_duration_seconds",
    "Etch Temperature (°C)": "etch_temperature_c",

    # Calibration
    "ζ (yr·cm²)": "zeta_yr_cm2",
    "ζ Error (yr·cm²)": "zeta_error_yr_cm2",
    "ζ Error Type": "zeta_error_type",
    "r (μm)": "r_um",
    "λD": "lambda_d",
    "λf": "lambda_f",
    "q": "q_factor",

    # Irradiation
    "Irradiation Reactor": "irradiation_reactor",
    "Thermal Neutron Dose": "thermal_neutron_dose",
    "Irradiation Batch ID": "irradiation_batch_id"
}

HE_DATAPOINT_COLUMN_MAP = {
    # Core identifiers
    "Sample ID": "sample_id",
    "Datapoint Key": "datapoint_key",
    "Batch ID": "batch_id",

    # Lab info
    "Laboratory": "laboratory",
    "Analyst ORCID": "analyst_orcid",
    "Analysis Date": "analysis_date",
    "Publication DOI": "publication_doi",

    # Method
    "Mineral": "mineral_type",
    "Mount ID": "mount_id",

    # Summary statistics
    "N Aliquots": "n_aliquots",
    "Mean Uncorr Age (Ma)": "mean_uncorr_age_ma",
    "Mean Uncorr Age Error (Ma)": "mean_uncorr_age_error_ma",
    "Mean Uncorr Age Error Type": "mean_uncorr_age_error_type",
    "Weighted Mean Uncorr Age (Ma)": "weighted_mean_uncorr_age_ma",
    "Weighted Mean Uncorr Age Error (Ma)": "weighted_mean_uncorr_age_error_ma",
    "Weighted Mean Uncorr Age Error Type": "weighted_mean_uncorr_age_error_type",
    "MSWD Uncorr": "mswd_uncorr",
    "95% Conf Uncorr (Ma)": "conf95_uncorr_ma",
    "χ² Uncorr (%)": "chi2_uncorr_pct",
    "IQR Uncorr (Ma)": "iqr_uncorr_ma",

    "Mean Corr Age (Ma)": "mean_corr_age_ma",
    "Mean Corr Age Error (Ma)": "mean_corr_age_error_ma",
    "Mean Corr Age Error Type": "mean_corr_age_error_type",
    "Weighted Mean Corr Age (Ma)": "weighted_mean_corr_age_ma",
    "Weighted Mean Corr Age Error (Ma)": "weighted_mean_corr_age_error_ma",
    "Weighted Mean Corr Age Error Type": "weighted_mean_corr_age_error_type",
    "MSWD Corr": "mswd_corr",
    "95% Conf Corr (Ma)": "conf95_corr_ma",
    "χ² Corr (%)": "chi2_corr_pct",
    "IQR Corr (Ma)": "iqr_corr_ma",

    # Methods
    "Uncertainty Description": "uncertainty_description",
    "Ablation Pit Volume Method": "ablation_pit_volume_method",
    "Ablation Pit Volume Software": "ablation_pit_volume_software",
    "He Measurement Method": "he_measurement_method",
    "Parent Isotope Method": "parent_isotope_method",
    "SA/V Equation": "surface_area_volume_equation",
    "Alpha Stopping Distance Ref": "alpha_stopping_distance_ref",
    "Ft Correction Equation": "ft_correction_equation",
    "ESR SA/V Equation": "esr_sa_v_equation",
    "ESR Ft Equation": "esr_ft_equation",
    "eU Equation": "eu_equation",
    "He Age Approach": "he_age_approach",
    "Corr Age Method": "corr_age_method"
}

HE_GRAIN_COLUMN_MAP = {
    # Identifiers
    "Lab No": "lab_no",
    "Grain Identifier": "grain_identifier",
    "Aliquot Type": "aliquot_type",
    "N Grains in Aliquot": "n_grains_in_aliquot",

    # Crystal properties
    "Crystal Integrity": "crystal_integrity",
    "Grain Morphology": "grain_morphology",
    "Assumed Geometry": "assumed_geometry",

    # Dimensions
    "Length (μm)": "length_um",
    "Length SD (μm)": "length_um_sd",
    "Half-Width (μm)": "half_width_um",
    "Width SD (μm)": "width_um_sd",
    "Height (μm)": "height_um",
    "Height SD (μm)": "height_um_sd",
    "Measurement Method": "measurement_method",
    "Crystal Faces Measured": "crystal_faces_measured",

    # Helium
    "⁴He (ncc)": "he_ncc",
    "He Measurement Method": "he_measurement_method",
    "He Extraction Temp (°C)": "he_extraction_temperature_c",
    "He Extraction Duration (min)": "he_extraction_duration_min",
    "He Extraction Method": "he_extraction_method",
    "He Blank (ncc)": "he_blank_ncc",
    "He Blank Error (ncc)": "he_blank_error_ncc",

    # Chemistry
    "U (ppm)": "u_ppm",
    "U Error (ppm)": "u_ppm_error",
    "Th (ppm)": "th_ppm",
    "Th Error (ppm)": "th_ppm_error",
    "Sm (ppm)": "sm_ppm",
    "Sm Error (ppm)": "sm_ppm_error",
    "eU (ppm)": "eu_ppm",
    "U Measurement Method": "u_measurement_method",
    "U Blank (ppm)": "u_blank_ppm",
    "Th Blank (ppm)": "th_blank_ppm",
    "Sm Blank (ppm)": "sm_blank_ppm",
    "Spike ²³⁸U/²³⁵U": "spike_u238_u235_ratio",
    "Spike ²³²Th/²²⁹Th": "spike_th232_th229_ratio",

    # Geometry calculations
    "Mass (mg)": "mass_mg",
    "SA (mm²)": "surface_area_mm2",
    "Volume (mm³)": "volume_mm3",
    "SA/V": "sa_v_ratio",
    "Rs (μm)": "rs_um",
    "ESR SA/V (μm)": "esr_sa_v_um",
    "ESR Ft (μm)": "esr_ft_um",
    "SA/V Calc Equation": "sa_v_calc_equation",
    "Ft Correction Equation": "ft_correction_equation",
    "Alpha Stopping Distance Ref": "alpha_stopping_distance_ref",

    # Ages
    "Uncorr Age (Ma)": "uncorr_age_ma",
    "Uncorr Age Error (Ma)": "uncorr_age_error_ma",
    "Corr Age (Ma)": "corr_age_ma",
    "Corr Age Error (Ma)": "corr_age_error_ma",
    "Corr Age 1σ (Ma)": "corr_age_1sigma_ma",
    "Ft": "ft",
    "Error Type": "error_type",
    "eU Equation": "eu_equation",
    "He Age Approach": "he_age_approach",

    # Constants
    "λ ²³⁸U": "lambda_u238",
    "λ ²³²Th": "lambda_th232",
    "λ ¹⁴⁷Sm": "lambda_sm147",

    # Metadata
    "Terminations": "terminations",
    "Std Run": "std_run",
    "Thermal Model": "thermal_model"
}


class EarthBankImporter:
    """Import EarthBank Excel templates into PostgreSQL database"""

    def __init__(self, db_url: str = DIRECT_URL):
        self.db_url = db_url
        self.conn = None
        self.dataset_id = None

    def connect(self):
        """Connect to database"""
        try:
            self.conn = psycopg2.connect(self.db_url)
            print("✓ Connected to database")
        except Exception as e:
            print(f"✗ Database connection failed: {e}")
            sys.exit(1)

    def close(self):
        """Close database connection"""
        if self.conn:
            self.conn.close()

    def get_or_create_dataset(self, name: str, description: str = None) -> int:
        """Get existing dataset or create new one"""
        with self.conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("""
                SELECT id FROM datasets
                WHERE dataset_name = %s
            """, (name,))
            existing = cur.fetchone()

            if existing:
                self.dataset_id = existing['id']
                print(f"✓ Using existing dataset: {name} (ID: {self.dataset_id})")
                return self.dataset_id

            # Create new dataset
            cur.execute("""
                INSERT INTO datasets (dataset_name, description, created_at)
                VALUES (%s, %s, NOW())
                RETURNING id
            """, (name, description))
            self.dataset_id = cur.fetchone()['id']
            self.conn.commit()
            print(f"✓ Created dataset: {name} (ID: {self.dataset_id})")

        return self.dataset_id

    def import_sample_template(self, file_path: Path):
        """Import Sample template"""
        print("\n" + "="*80)
        print(f"Importing Sample Template: {file_path.name}")
        print("="*80)

        # Read Excel file
        try:
            df = pd.read_excel(file_path, sheet_name="Samples")
            print(f"✓ Loaded {len(df)} samples from Excel")
        except Exception as e:
            print(f"✗ Failed to read Excel: {e}")
            return

        # Import samples
        with self.conn.cursor() as cur:
            records_inserted = 0
            records_updated = 0

            for idx, row in df.iterrows():
                # Get IGSN (primary key)
                igsn = row.get("IGSN")
                if pd.isna(igsn) or str(igsn).strip() == "":
                    print(f"⚠ Row {idx+2}: No IGSN, skipping")
                    continue

                # Check if sample exists
                cur.execute("SELECT sample_id FROM samples WHERE igsn = %s", (igsn,))
                existing = cur.fetchone()

                # Map columns
                data = {}
                for eb_col, db_col in SAMPLE_COLUMN_MAP.items():
                    if eb_col in row and pd.notna(row[eb_col]):
                        data[db_col] = row[eb_col]

                # Add dataset_id
                data['dataset_id'] = self.dataset_id

                if existing:
                    # Update existing sample
                    sample_id = existing[0]
                    set_clause = ", ".join([f"{k} = %s" for k in data.keys()])
                    values = list(data.values()) + [sample_id]
                    cur.execute(f"UPDATE samples SET {set_clause} WHERE sample_id = %s", values)
                    records_updated += 1
                else:
                    # Insert new sample (sample_id = igsn)
                    data['sample_id'] = igsn
                    cols = ", ".join(data.keys())
                    placeholders = ", ".join(["%s"] * len(data))
                    cur.execute(f"INSERT INTO samples ({cols}) VALUES ({placeholders})", list(data.values()))
                    records_inserted += 1

            self.conn.commit()
            print(f"✓ Inserted {records_inserted} samples, updated {records_updated} samples")

    def import_ft_template(self, file_path: Path):
        """Import FT Datapoint template"""
        print("\n" + "="*80)
        print(f"Importing FT Datapoint Template: {file_path.name}")
        print("="*80)

        # Read sheets
        try:
            xls = pd.ExcelFile(file_path)
            print(f"✓ Found sheets: {', '.join(xls.sheet_names)}")
        except Exception as e:
            print(f"✗ Failed to read Excel: {e}")
            return

        # Import FT Datapoints sheet
        if "FT Datapoints" in xls.sheet_names:
            self._import_ft_datapoints(xls)

        # Import FTCountData sheet
        if "FTCountData" in xls.sheet_names:
            self._import_ft_count_data(xls)

        # Import FTSingleGrain sheet
        if "FTSingleGrain" in xls.sheet_names:
            self._import_ft_single_grain(xls)

        # Import FTLengthData sheet
        if "FTLengthData" in xls.sheet_names:
            self._import_ft_length_data(xls)

        # Import FTBinnedLengthData sheet
        if "FTBinnedLengthData" in xls.sheet_names:
            self._import_ft_binned_length_data(xls)

    def _import_ft_datapoints(self, xls: pd.ExcelFile):
        """Import FT Datapoints sheet"""
        df = pd.read_excel(xls, sheet_name="FT Datapoints")
        print(f"\n→ Importing FT Datapoints: {len(df)} records")

        with self.conn.cursor(cursor_factory=RealDictCursor) as cur:
            records_inserted = 0

            for idx, row in df.iterrows():
                # Get required fields
                sample_id = row.get("Sample ID")
                datapoint_key = row.get("Datapoint Key")

                if pd.isna(sample_id) or pd.isna(datapoint_key):
                    print(f"⚠ Row {idx+2}: Missing Sample ID or Datapoint Key, skipping")
                    continue

                # Check if sample exists
                cur.execute("SELECT sample_id FROM samples WHERE sample_id = %s", (sample_id,))
                if not cur.fetchone():
                    print(f"⚠ Row {idx+2}: Sample {sample_id} not found, skipping")
                    continue

                # Check if datapoint exists
                cur.execute("SELECT id FROM ft_datapoints WHERE datapoint_key = %s", (datapoint_key,))
                if cur.fetchone():
                    continue  # Skip existing

                # Map columns
                data = {"sample_id": sample_id, "datapoint_key": datapoint_key}
                for eb_col, db_col in FT_DATAPOINT_COLUMN_MAP.items():
                    if eb_col in row and pd.notna(row[eb_col]):
                        data[db_col] = row[eb_col]

                # Insert
                cols = ", ".join(data.keys())
                placeholders = ", ".join(["%s"] * len(data))
                try:
                    cur.execute(f"INSERT INTO ft_datapoints ({cols}) VALUES ({placeholders})", list(data.values()))
                    records_inserted += 1
                except Exception as e:
                    print(f"⚠ Row {idx+2}: Insert failed - {e}")

            self.conn.commit()
            print(f"✓ Inserted {records_inserted} FT datapoints")

    def _import_ft_count_data(self, xls: pd.ExcelFile):
        """Import FTCountData sheet"""
        df = pd.read_excel(xls, sheet_name="FTCountData")
        print(f"\n→ Importing FT Count Data: {len(df)} records")

        with self.conn.cursor(cursor_factory=RealDictCursor) as cur:
            records_inserted = 0

            for idx, row in df.iterrows():
                datapoint_key = row.get("Datapoint Key")
                if pd.isna(datapoint_key):
                    continue

                # Get ft_datapoint_id
                cur.execute("SELECT id FROM ft_datapoints WHERE datapoint_key = %s", (datapoint_key,))
                result = cur.fetchone()
                if not result:
                    print(f"⚠ Row {idx+2}: Datapoint {datapoint_key} not found")
                    continue

                ft_datapoint_id = result['id']

                # Map and insert (simplified - add full mapping as needed)
                try:
                    cur.execute("""
                        INSERT INTO ft_count_data (ft_datapoint_id, grain_number)
                        VALUES (%s, %s)
                    """, (ft_datapoint_id, row.get("Grain Number")))
                    records_inserted += 1
                except:
                    pass  # Skip duplicates

            self.conn.commit()
            print(f"✓ Inserted {records_inserted} FT count records")

    def _import_ft_single_grain(self, xls: pd.ExcelFile):
        """Import FTSingleGrain sheet"""
        print("→ FTSingleGrain import not yet implemented")

    def _import_ft_length_data(self, xls: pd.ExcelFile):
        """Import FTLengthData sheet"""
        print("→ FTLengthData import not yet implemented")

    def _import_ft_binned_length_data(self, xls: pd.ExcelFile):
        """Import FTBinnedLengthData sheet"""
        print("→ FTBinnedLengthData import not yet implemented")

    def import_he_template(self, file_path: Path):
        """Import He Datapoint template"""
        print("\n" + "="*80)
        print(f"Importing He Datapoint Template: {file_path.name}")
        print("="*80)

        # Read sheets
        try:
            xls = pd.ExcelFile(file_path)
            print(f"✓ Found sheets: {', '.join(xls.sheet_names)}")
        except Exception as e:
            print(f"✗ Failed to read Excel: {e}")
            return

        # Import He Datapoints sheet
        if "He Datapoints" in xls.sheet_names:
            self._import_he_datapoints(xls)

        # Import HeWholeGrain sheet
        if "HeWholeGrain" in xls.sheet_names:
            self._import_he_whole_grain(xls)

    def _import_he_datapoints(self, xls: pd.ExcelFile):
        """Import He Datapoints sheet"""
        df = pd.read_excel(xls, sheet_name="He Datapoints")
        print(f"\n→ Importing He Datapoints: {len(df)} records")

        with self.conn.cursor(cursor_factory=RealDictCursor) as cur:
            records_inserted = 0

            for idx, row in df.iterrows():
                sample_id = row.get("Sample ID")
                datapoint_key = row.get("Datapoint Key")

                if pd.isna(sample_id) or pd.isna(datapoint_key):
                    continue

                # Check if sample exists
                cur.execute("SELECT sample_id FROM samples WHERE sample_id = %s", (sample_id,))
                if not cur.fetchone():
                    print(f"⚠ Row {idx+2}: Sample {sample_id} not found")
                    continue

                # Check if datapoint exists
                cur.execute("SELECT id FROM he_datapoints WHERE datapoint_key = %s", (datapoint_key,))
                if cur.fetchone():
                    continue

                # Map columns
                data = {"sample_id": sample_id, "datapoint_key": datapoint_key}
                for eb_col, db_col in HE_DATAPOINT_COLUMN_MAP.items():
                    if eb_col in row and pd.notna(row[eb_col]):
                        data[db_col] = row[eb_col]

                # Insert
                cols = ", ".join(data.keys())
                placeholders = ", ".join(["%s"] * len(data))
                try:
                    cur.execute(f"INSERT INTO he_datapoints ({cols}) VALUES ({placeholders})", list(data.values()))
                    records_inserted += 1
                except Exception as e:
                    print(f"⚠ Row {idx+2}: Insert failed - {e}")

            self.conn.commit()
            print(f"✓ Inserted {records_inserted} He datapoints")

    def _import_he_whole_grain(self, xls: pd.ExcelFile):
        """Import HeWholeGrain sheet"""
        df = pd.read_excel(xls, sheet_name="HeWholeGrain")
        print(f"\n→ Importing He Whole Grain: {len(df)} records")

        with self.conn.cursor(cursor_factory=RealDictCursor) as cur:
            records_inserted = 0

            for idx, row in df.iterrows():
                datapoint_key = row.get("Datapoint Key")
                if pd.isna(datapoint_key):
                    continue

                # Get he_datapoint_id
                cur.execute("SELECT id FROM he_datapoints WHERE datapoint_key = %s", (datapoint_key,))
                result = cur.fetchone()
                if not result:
                    print(f"⚠ Row {idx+2}: Datapoint {datapoint_key} not found")
                    continue

                he_datapoint_id = result['id']

                # Map columns
                data = {"he_datapoint_id": he_datapoint_id}
                for eb_col, db_col in HE_GRAIN_COLUMN_MAP.items():
                    if eb_col in row and pd.notna(row[eb_col]):
                        data[db_col] = row[eb_col]

                # Insert
                cols = ", ".join(data.keys())
                placeholders = ", ".join(["%s"] * len(data))
                try:
                    cur.execute(f"INSERT INTO he_whole_grain_data ({cols}) VALUES ({placeholders})", list(data.values()))
                    records_inserted += 1
                except Exception as e:
                    print(f"⚠ Row {idx+2}: Insert failed - {e}")

            self.conn.commit()
            print(f"✓ Inserted {records_inserted} He grain records")


def main():
    """Main CLI"""
    parser = argparse.ArgumentParser(description="Import EarthBank Excel templates into database")
    parser.add_argument("template", type=Path, help="Path to EarthBank template file")
    parser.add_argument("--dataset-name", type=str, help="Dataset name (required for new datasets)")
    parser.add_argument("--dataset-description", type=str, help="Dataset description")

    args = parser.parse_args()

    # Validate file
    if not args.template.exists():
        print(f"✗ File not found: {args.template}")
        sys.exit(1)

    # Determine template type
    template_name = args.template.name.lower()

    # Create importer
    importer = EarthBankImporter()
    importer.connect()

    try:
        # Get/create dataset
        dataset_name = args.dataset_name or f"Import from {args.template.stem}"
        importer.get_or_create_dataset(dataset_name, args.dataset_description)

        # Import based on template type
        if "sample" in template_name:
            importer.import_sample_template(args.template)
        elif "ftdatapoint" in template_name or "ft" in template_name:
            importer.import_ft_template(args.template)
        elif "hedatapoint" in template_name or "he" in template_name:
            importer.import_he_template(args.template)
        elif "gcdatapoint" in template_name or "gc" in template_name:
            print("⚠ Geochemistry import not yet implemented")
        else:
            print(f"⚠ Unknown template type: {template_name}")
            sys.exit(1)

        print("\n" + "="*80)
        print("IMPORT COMPLETE")
        print("="*80)

    except Exception as e:
        print(f"\n✗ Import failed: {e}")
        importer.conn.rollback()
        raise
    finally:
        importer.close()


if __name__ == "__main__":
    main()
