#!/usr/bin/env python3
"""
Import Malawi Rift Data into PostgreSQL Database
=================================================
Step 7 (final): Import transformed data into EarthBank Schema v2
"""

import pandas as pd
import psycopg2
from psycopg2.extras import execute_values, RealDictCursor
from pathlib import Path
from datetime import datetime
import sys
import os

# Database connection
DIRECT_URL = "postgresql://neondb_owner:npg_a7j4RQTnJxcz@ep-fragrant-bush-ahfxu1xq-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require"

# File paths
BASE_DIR = Path(__file__).parent.parent
OUTPUT_DIR = BASE_DIR / "output"

def connect_db():
    """Connect to PostgreSQL database"""
    try:
        conn = psycopg2.connect(DIRECT_URL)
        print("✓ Connected to database")
        return conn
    except Exception as e:
        print(f"✗ Database connection failed: {e}")
        sys.exit(1)


def create_dataset(conn) -> int:
    """Create dataset record"""
    print("\n" + "="*80)
    print("Creating Dataset Record")
    print("="*80)

    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        # Check if dataset already exists
        cur.execute("""
            SELECT id FROM datasets
            WHERE dataset_name = 'Malawi Rift Footwall Exhumation'
        """)
        existing = cur.fetchone()

        if existing:
            dataset_id = existing['id']
            print(f"✓ Dataset already exists (ID: {dataset_id})")
            return dataset_id

        # Create new dataset
        cur.execute("""
            INSERT INTO datasets (
                dataset_name,
                description,
                created_at
            ) VALUES (
                'Malawi Rift Footwall Exhumation',
                'Thermochronology data from Malawi Rift footwall exhumation study. Includes AFT and (U-Th)/He analyses.',
                NOW()
            )
            RETURNING id
        """)
        dataset_id = cur.fetchone()['id']
        conn.commit()
        print(f"✓ Created dataset (ID: {dataset_id})")

    return dataset_id


def create_batches(conn) -> dict:
    """Create batch records for analytical sessions"""
    print("\n" + "="*80)
    print("Creating Batch Records")
    print("="*80)

    batch_names = ["B", "C", "D", "E"]
    batch_ids = {}

    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        for batch_name in batch_names:
            # Check if batch exists
            cur.execute("""
                SELECT id FROM batches
                WHERE batch_name = %s
            """, (f"Malawi-{batch_name}",))
            existing = cur.fetchone()

            if existing:
                batch_ids[batch_name] = existing['id']
                print(f"✓ Batch {batch_name} already exists (ID: {batch_ids[batch_name]})")
                continue

            # Create batch
            cur.execute("""
                INSERT INTO batches (
                    batch_name,
                    analysis_date
                ) VALUES (
                    %s,
                    '2019-01-01'  -- Estimated from sample names MU19-XX
                )
                RETURNING id
            """, (f"Malawi-{batch_name}",))
            batch_ids[batch_name] = cur.fetchone()['id']
            print(f"✓ Created batch {batch_name} (ID: {batch_ids[batch_name]})")

        conn.commit()

    return batch_ids


def create_reference_materials(conn, batch_ids: dict):
    """Create reference material records (Durango)"""
    print("\n" + "="*80)
    print("Creating Reference Material Records")
    print("="*80)

    ref_data = pd.read_csv(OUTPUT_DIR / "malawi_reference_materials.csv")

    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        records_inserted = 0
        for _, row in ref_data.iterrows():
            batch_id = batch_ids.get(row['batch_id'])
            if not batch_id:
                continue

            # Check if record exists
            cur.execute("""
                SELECT 1 FROM reference_materials
                WHERE material_name = %s AND batch_id = %s
            """, (row['standard_name'], batch_id))

            if cur.fetchone():
                continue

            # Insert reference material
            cur.execute("""
                INSERT INTO reference_materials (
                    material_name,
                    material_type,
                    batch_id,
                    expected_age_ma,
                    expected_age_error_ma,
                    measured_age_ma,
                    measured_age_error_ma
                ) VALUES (
                    %s, 'apatite', %s, %s, %s, %s, %s
                )
            """, (
                row['standard_name'],
                batch_id,
                row['accepted_age_Ma'],
                0.18,  # Published Durango error
                row['corrected_age_Ma'],
                row['age_error_Ma']
            ))
            records_inserted += 1

        conn.commit()
        print(f"✓ Inserted {records_inserted} reference material records")


def create_samples(conn, dataset_id: int) -> dict:
    """Create sample records"""
    print("\n" + "="*80)
    print("Creating Sample Records")
    print("="*80)

    ft_data = pd.read_csv(OUTPUT_DIR / "malawi_ft_datapoints.csv")
    he_data = pd.read_csv(OUTPUT_DIR / "malawi_he_whole_grain.csv")

    # Get unique sample names (convert all to strings)
    ft_samples = set(str(x) for x in ft_data['sample_id'].unique())
    he_samples = set(str(x) for x in he_data['sample_id'].unique())
    sample_names = ft_samples | he_samples
    sample_id_map = {}

    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        for sample_name in sorted(sample_names):
            # Check if sample exists
            cur.execute("""
                SELECT sample_id FROM samples
                WHERE sample_id = %s
            """, (sample_name,))
            existing = cur.fetchone()

            if existing:
                sample_id_map[sample_name] = existing['sample_id']
                continue

            # Create sample - sample_id is the actual sample name (like IGSN)
            cur.execute("""
                INSERT INTO samples (
                    sample_id,
                    dataset_id,
                    mineral_type,
                    collection_date
                ) VALUES (
                    %s, %s, 'apatite', '2019-01-01'
                )
                RETURNING sample_id
            """, (sample_name, dataset_id))
            sample_id_map[sample_name] = cur.fetchone()['sample_id']

        conn.commit()
        print(f"✓ Created {len(sample_id_map)} sample records")

    return sample_id_map


def import_ft_datapoints(conn, sample_ids: dict):
    """Import fission-track datapoints"""
    print("\n" + "="*80)
    print("Importing FT Datapoints")
    print("="*80)

    ft_data = pd.read_csv(OUTPUT_DIR / "malawi_ft_datapoints.csv")

    with conn.cursor() as cur:
        records_inserted = 0
        for _, row in ft_data.iterrows():
            sample_id = sample_ids.get(row['sample_id'])
            if not sample_id:
                print(f"⚠ Sample not found: {row['sample_id']}")
                continue

            # Check if datapoint exists
            cur.execute("""
                SELECT 1 FROM ft_datapoints
                WHERE sample_id = %s
            """, (sample_id,))

            if cur.fetchone():
                continue

            # Insert FT datapoint with mapped columns
            cur.execute("""
                INSERT INTO ft_datapoints (
                    sample_id,
                    mineral_type,
                    ft_method,
                    analysis_date,
                    n_grains,
                    total_ns,
                    mean_rho_s,
                    mean_u_ppm,
                    pooled_age_ma,
                    pooled_age_error_ma,
                    central_age_ma,
                    central_age_error_ma,
                    dispersion_pct,
                    p_chi2_pct,
                    mean_dpar_um,
                    se_dpar_um,
                    mean_rmr0,
                    mean_track_length_um,
                    se_mean_track_length_um,
                    n_track_measurements,
                    sd_track_length_um
                ) VALUES (
                    %s, 'apatite', 'LA-ICP-MS', '2019-01-01',
                    %s, %s, %s, %s, %s,
                    %s, %s, %s, %s, %s,
                    %s, %s, %s, %s, %s,
                    %s, %s
                )
            """, (
                sample_id,
                int(row['n_grains']) if pd.notna(row['n_grains']) else None,
                int(row['Ns_total']) if pd.notna(row['Ns_total']) else None,
                float(row['rho_s']) if pd.notna(row['rho_s']) else None,
                float(row['U_ppm']) if pd.notna(row['U_ppm']) else None,
                float(row['pooled_age']) if pd.notna(row['pooled_age']) else None,
                float(row['pooled_age_error']) if pd.notna(row['pooled_age_error']) else None,
                float(row['central_age']) if pd.notna(row['central_age']) else None,
                float(row['central_age_error']) if pd.notna(row['central_age_error']) else None,
                float(row['dispersion']) if pd.notna(row['dispersion']) else None,
                float(row['P_chi2']) if pd.notna(row['P_chi2']) else None,
                float(row['Dpar']) if pd.notna(row['Dpar']) else None,
                float(row['Dpar_error']) if pd.notna(row['Dpar_error']) else None,
                float(row['rmr0']) if pd.notna(row['rmr0']) else None,
                float(row['MTL']) if pd.notna(row['MTL']) else None,
                float(row['MTL_error']) if pd.notna(row['MTL_error']) else None,
                int(row['n_lengths']) if pd.notna(row['n_lengths']) else None,
                float(row['MTL_stdev']) if pd.notna(row['MTL_stdev']) else None
            ))
            records_inserted += 1

        conn.commit()
        print(f"✓ Inserted {records_inserted} FT datapoint records")


def import_he_data(conn, sample_ids: dict, batch_ids: dict):
    """Import (U-Th)/He grain data"""
    print("\n" + "="*80)
    print("Importing (U-Th)/He Grain Data")
    print("="*80)

    he_data = pd.read_csv(OUTPUT_DIR / "malawi_he_whole_grain.csv")

    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        # First, create he_datapoints (one per sample)
        sample_datapoints = {}
        for sample_name in he_data['sample_id'].unique():
            sample_id = sample_ids.get(sample_name)
            if not sample_id:
                continue

            # Check if he_datapoint exists for this sample
            cur.execute("""
                SELECT id FROM he_datapoints
                WHERE sample_id = %s
            """, (sample_id,))
            existing = cur.fetchone()

            if existing:
                sample_datapoints[sample_name] = existing['id']
                continue

            # Get batch_id from first grain of this sample
            first_grain = he_data[he_data['sample_id'] == sample_name].iloc[0]
            batch_id = batch_ids.get(first_grain['batch_id'])

            # Create he_datapoint
            cur.execute("""
                INSERT INTO he_datapoints (
                    sample_id,
                    batch_id,
                    mineral_type,
                    analysis_date
                ) VALUES (
                    %s, %s, 'apatite', '2019-01-01'
                )
                RETURNING id
            """, (sample_id, batch_id))
            sample_datapoints[sample_name] = cur.fetchone()['id']

        conn.commit()
        print(f"✓ Created {len(sample_datapoints)} He datapoint records")

        # Now insert grain-level data
        records_inserted = 0
        for _, row in he_data.iterrows():
            he_datapoint_id = sample_datapoints.get(row['sample_id'])
            if not he_datapoint_id:
                continue

            # Check if grain exists
            cur.execute("""
                SELECT 1 FROM he_whole_grain_data
                WHERE he_datapoint_id = %s AND lab_no = %s
            """, (he_datapoint_id, row['lab_number']))

            if cur.fetchone():
                continue

            # Insert grain data
            cur.execute("""
                INSERT INTO he_whole_grain_data (
                    he_datapoint_id,
                    lab_no,
                    he_ncc,
                    mass_mg,
                    u_ppm,
                    th_ppm,
                    sm_ppm,
                    eu_ppm,
                    uncorr_age_ma,
                    corr_age_ma,
                    corr_age_1sigma_ma,
                    ft,
                    length_um,
                    half_width_um,
                    rs_um,
                    grain_morphology
                ) VALUES (
                    %s, %s, %s, %s, %s, %s, %s, %s, %s, %s,
                    %s, %s, %s, %s, %s, %s
                )
            """, (
                he_datapoint_id,
                row['lab_number'],
                float(row['He4_ncc']) if pd.notna(row['He4_ncc']) else None,
                float(row['mass_mg']) if pd.notna(row['mass_mg']) else None,
                float(row['U_ppm']) if pd.notna(row['U_ppm']) else None,
                float(row['Th_ppm']) if pd.notna(row['Th_ppm']) else None,
                float(row['Sm_ppm']) if pd.notna(row['Sm_ppm']) else None,
                float(row['eU_ppm']) if pd.notna(row['eU_ppm']) else None,
                float(row['raw_age']) if pd.notna(row['raw_age']) else None,
                float(row['corrected_age']) if pd.notna(row['corrected_age']) else None,
                float(row['age_error']) if pd.notna(row['age_error']) else None,
                float(row['Ft']) if pd.notna(row['Ft']) else None,
                float(row['length_um']) if pd.notna(row['length_um']) else None,
                float(row['width_um']) if pd.notna(row['width_um']) else None,
                float(row['Rs_um']) if pd.notna(row['Rs_um']) else None,
                row['morphology'] if pd.notna(row['morphology']) else None
            ))
            records_inserted += 1

        conn.commit()
        print(f"✓ Inserted {records_inserted} He grain records")


def verify_import(conn):
    """Verify data was imported correctly"""
    print("\n" + "="*80)
    print("Verifying Import")
    print("="*80)

    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        # Count records
        cur.execute("""
            SELECT
                (SELECT COUNT(*) FROM datasets WHERE dataset_name = 'Malawi Rift Footwall Exhumation') as datasets,
                (SELECT COUNT(*) FROM samples WHERE dataset_id IN
                    (SELECT id FROM datasets WHERE dataset_name = 'Malawi Rift Footwall Exhumation')) as samples,
                (SELECT COUNT(*) FROM batches WHERE batch_name LIKE 'Malawi-%') as batches,
                (SELECT COUNT(*) FROM reference_materials WHERE material_name = 'Durango') as ref_materials,
                (SELECT COUNT(*) FROM ft_datapoints) as ft_datapoints,
                (SELECT COUNT(*) FROM he_datapoints) as he_datapoints,
                (SELECT COUNT(*) FROM he_whole_grain_data) as he_grains
        """)
        counts = cur.fetchone()

        print("\nRecord Counts:")
        print(f"  Datasets:            {counts['datasets']}")
        print(f"  Samples:             {counts['samples']}")
        print(f"  Batches:             {counts['batches']}")
        print(f"  Reference Materials: {counts['ref_materials']}")
        print(f"  FT Datapoints:       {counts['ft_datapoints']}")
        print(f"  He Datapoints:       {counts['he_datapoints']}")
        print(f"  He Grains:           {counts['he_grains']}")


def main():
    """Main import workflow"""
    print("="*80)
    print("IMPORTING MALAWI RIFT DATA TO DATABASE")
    print("="*80)

    # Connect to database
    conn = connect_db()

    try:
        # Create dataset
        dataset_id = create_dataset(conn)

        # Create batches
        batch_ids = create_batches(conn)

        # Create reference materials
        create_reference_materials(conn, batch_ids)

        # Create samples
        sample_ids = create_samples(conn, dataset_id)

        # Import FT datapoints
        import_ft_datapoints(conn, sample_ids)

        # Import He data
        import_he_data(conn, sample_ids, batch_ids)

        # Verify import
        verify_import(conn)

        print("\n" + "="*80)
        print("IMPORT COMPLETE!")
        print("="*80)

    except Exception as e:
        print(f"\n✗ Import failed: {e}")
        conn.rollback()
        raise
    finally:
        conn.close()


if __name__ == "__main__":
    main()
