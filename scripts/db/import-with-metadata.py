#!/usr/bin/env python3
"""
Complete import with metadata for Malawi 2024 dataset

Imports:
1. Dataset record with summary and FAIR analysis
2. Sample data
3. FT ages, counts, track lengths
4. File records for downloads
"""

import sys
import pandas as pd
import psycopg2
from pathlib import Path
from dotenv import load_dotenv
import os

# Load environment
load_dotenv('.env.local')
DATABASE_URL = os.getenv('DATABASE_URL')

# Data directory
DATA_DIR = Path('build-data/learning/thermo-papers/data')

print('━' * 80)
print('COMPLETE IMPORT WITH METADATA')
print('━' * 80)
print()

# Connect to database
conn = psycopg2.connect(DATABASE_URL)
cur = conn.cursor()

try:
    # STEP 1: Create dataset with full metadata
    print('→ Step 1: Creating dataset with metadata...')

    cur.execute("""
        INSERT INTO datasets (
            dataset_name,
            description,
            publication_reference,
            doi,
            study_area,
            authors,
            analysis_methods,
            paper_summary,
            fair_score,
            fair_reasoning,
            key_findings,
            extraction_report_url,
            created_at
        ) VALUES (
            %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, NOW()
        ) RETURNING id
    """, (
        'Malawi-2024-McMillan',
        'Apatite fission-track and (U-Th)/He thermochronology from footwall transect of the Usisya fault, Malawi Rift',
        'McMillan et al. (2024) Journal of Structural Geology 187:105196',
        '10.1016/j.jsg.2024.105196',
        'Usisya fault scarp, Malawi Rift',
        ['Malcolm McMillan', 'Samuel C. Boone', 'Patrick Chindandali', 'Barry Kohn', 'Andrew Gleadow'],
        ['LA-ICP-MS AFT', '(U-Th)/He'],
        'Footwall exhumation modeling constrained by thermochronology reveals 4D fault evolution in the Malawi Rift. Vertical transects of AFT and (U-Th)/He ages show diachronous footwall uplift, initially isolated fault segments, and later propagation forming the through-going Usisya fault system.',
        95,  # FAIR score
        'Excellent FAIR compliance: Sample IDs provided, ages with uncertainties, statistical parameters (P(χ²), dispersion), kinetic parameters (Dpar, rmr, Cl), track length statistics, and public dataset available (AusGeochem). Only minor issue: coordinates not in main table but available in supplementary data.',
        [
            'Diachronous footwall uplift revealed by along-strike age variations',
            'Initially isolated fault segments with pronounced exhumation at centers',
            'Later onset of exhumation marks fault propagation and linkage',
            'Age range: 17-325 Ma (Miocene to Carboniferous)',
            'Strain partitioning between footwall and intra-basinal faulting'
        ],
        '/data/datasets/1/Malawi-2024-extraction-report.md'
    ))

    dataset_id = cur.fetchone()[0]
    conn.commit()
    print(f'✅ Dataset created: ID {dataset_id}')
    print()

    # STEP 2: Import samples
    print('→ Step 2: Importing samples...')
    samples_df = pd.read_csv(DATA_DIR / 'Malawi-2024-samples.csv')

    for _, row in samples_df.iterrows():
        cur.execute("""
            INSERT INTO samples (
                sample_id, dataset_id, latitude, longitude, elevation_m,
                mineral_type, analysis_method, n_aft_grains
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        """, (
            row['sample_id'], dataset_id, row['latitude'], row['longitude'],
            row['elevation_m'] if pd.notna(row['elevation_m']) else None,
            row['mineral_type'], row['analysis_method'],
            int(row['n_aft_grains']) if pd.notna(row['n_aft_grains']) else None
        ))

    conn.commit()
    print(f'✅ Imported {len(samples_df)} samples')
    print()

    # STEP 3: Import FT datapoints (Schema v2)
    print('→ Step 3: Importing FT datapoints (Schema v2)...')
    ft_ages_df = pd.read_csv(DATA_DIR / 'Malawi-2024-ft_ages.csv')

    # Map sample_id to ft_datapoint_id for later use
    sample_to_datapoint = {}

    for _, row in ft_ages_df.iterrows():
        # Generate unique datapoint key
        datapoint_key = f"{row['sample_id']}_FT_001"

        cur.execute("""
            INSERT INTO ft_datapoints (
                sample_id, datapoint_key, n_grains,
                pooled_age_ma, pooled_age_error_ma,
                central_age_ma, central_age_error_ma,
                dispersion_pct, p_chi2_pct,
                ft_method, mineral_type
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING id
        """, (
            row['sample_id'], datapoint_key,
            int(row['n_grains']) if pd.notna(row['n_grains']) else None,
            float(row['pooled_age_ma']) if pd.notna(row['pooled_age_ma']) else None,
            float(row['pooled_age_error_ma']) if pd.notna(row['pooled_age_error_ma']) else None,
            float(row['central_age_ma']) if pd.notna(row['central_age_ma']) else None,
            float(row['central_age_error_ma']) if pd.notna(row['central_age_error_ma']) else None,
            float(row['dispersion_pct']) if pd.notna(row['dispersion_pct']) else None,
            float(row['p_chi2']) * 100 if pd.notna(row['p_chi2']) else None,  # Convert to percent
            'LA-ICP-MS',  # Default method for Malawi dataset
            'apatite'  # Default mineral for Malawi dataset
        ))

        ft_datapoint_id = cur.fetchone()[0]
        sample_to_datapoint[row['sample_id']] = ft_datapoint_id

    conn.commit()
    print(f'✅ Imported {len(ft_ages_df)} FT datapoints')
    print()

    # STEP 4: Import FT count data (Schema v2)
    print('→ Step 4: Importing FT count data (Schema v2)...')
    ft_counts_df = pd.read_csv(DATA_DIR / 'Malawi-2024-ft_counts.csv')

    for _, row in ft_counts_df.iterrows():
        # Get ft_datapoint_id from mapping
        sample_id = row['sample_id']
        if sample_id not in sample_to_datapoint:
            print(f"⚠️  Warning: No datapoint for sample {sample_id}, skipping count data")
            continue

        ft_datapoint_id = sample_to_datapoint[sample_id]

        cur.execute("""
            INSERT INTO ft_count_data (
                ft_datapoint_id, grain_id, ns, rho_s_cm2,
                dpar_um, dpar_error_um
            ) VALUES (%s, %s, %s, %s, %s, %s)
        """, (
            ft_datapoint_id, row['grain_id'],
            int(row['ns']) if pd.notna(row['ns']) else None,
            float(row['rho_s_cm2']) if pd.notna(row['rho_s_cm2']) else None,
            float(row['dpar_um']) if pd.notna(row['dpar_um']) else None,
            float(row['dpar_sd_um']) if pd.notna(row['dpar_sd_um']) else None
        ))

    conn.commit()
    print(f'✅ Imported {len(ft_counts_df)} FT count records')
    print()

    # STEP 5: Import FT track length data (Schema v2)
    print('→ Step 5: Importing FT track length data (Schema v2)...')
    ft_lengths_df = pd.read_csv(DATA_DIR / 'Malawi-2024-ft_track_lengths.csv')

    for _, row in ft_lengths_df.iterrows():
        # Get ft_datapoint_id from mapping
        sample_id = row['sample_id']
        if sample_id not in sample_to_datapoint:
            print(f"⚠️  Warning: No datapoint for sample {sample_id}, skipping track length data")
            continue

        ft_datapoint_id = sample_to_datapoint[sample_id]

        # Generate unique track_id (since we have summary stats, not individual tracks)
        track_id = f"{row['grain_id']}_summary"

        cur.execute("""
            INSERT INTO ft_track_length_data (
                ft_datapoint_id, grain_id, track_id, track_type,
                true_length_um, dpar_um, dpar_error_um
            ) VALUES (%s, %s, %s, %s, %s, %s, %s)
        """, (
            ft_datapoint_id, row['grain_id'], track_id, 'TINT',
            float(row['mean_track_length_um']) if pd.notna(row['mean_track_length_um']) else None,
            float(row['dpar_um']) if pd.notna(row['dpar_um']) else None,
            float(row['mean_track_length_se_um']) if pd.notna(row['mean_track_length_se_um']) else None
        ))

    conn.commit()
    print(f'✅ Imported {len(ft_lengths_df)} FT track length records')
    print()

    # STEP 6: Register data files (Schema v2)
    print('→ Step 6: Registering data files (Schema v2)...')

    files = [
        ('fair_schema', 'Malawi-2024-samples.csv', f'/data/datasets/{dataset_id}/Malawi-2024-samples.csv', 'samples', 34),
        ('fair_schema', 'Malawi-2024-ft_datapoints.csv', f'/data/datasets/{dataset_id}/Malawi-2024-ft_datapoints.csv', 'ft_datapoints', 34),
        ('fair_schema', 'Malawi-2024-ft_count_data.csv', f'/data/datasets/{dataset_id}/Malawi-2024-ft_count_data.csv', 'ft_count_data', 34),
        ('fair_schema', 'Malawi-2024-ft_track_length_data.csv', f'/data/datasets/{dataset_id}/Malawi-2024-ft_track_length_data.csv', 'ft_track_length_data', 34),
        ('original_table', 'Malawi-2024-ahe_raw.csv', f'/data/datasets/{dataset_id}/Malawi-2024-ahe_raw.csv', 'Table A3', 11),
        ('report', 'Malawi-2024-extraction-report.md', f'/data/datasets/{dataset_id}/Malawi-2024-extraction-report.md', None, None)
    ]

    for file_type, file_name, file_path, table_name, row_count in files:
        cur.execute("""
            INSERT INTO dataset_files (dataset_id, file_type, file_name, file_path, table_name, row_count)
            VALUES (%s, %s, %s, %s, %s, %s)
        """, (dataset_id, file_type, file_name, file_path, table_name, row_count))

    conn.commit()
    print(f'✅ Registered {len(files)} data files')
    print()

    # Update extraction report URL with correct dataset ID
    cur.execute("""
        UPDATE datasets
        SET extraction_report_url = %s
        WHERE id = %s
    """, (f'/data/datasets/{dataset_id}/Malawi-2024-extraction-report.md', dataset_id))
    conn.commit()

    # Move files to correct directory
    print(f'→ Moving files to /public/data/datasets/{dataset_id}/')
    import shutil
    src_dir = Path('public/data/datasets/4')
    dest_dir = Path(f'public/data/datasets/{dataset_id}')
    dest_dir.mkdir(parents=True, exist_ok=True)

    if src_dir.exists():
        for file in src_dir.glob('*'):
            shutil.copy(file, dest_dir / file.name)

    print(f'✅ Files moved to dataset {dataset_id} directory')
    print()

    print('━' * 80)
    print('IMPORT COMPLETE')
    print('━' * 80)
    print()
    print(f'Dataset ID: {dataset_id}')
    print(f'Samples: {len(samples_df)}')
    print(f'FT Ages: {len(ft_ages_df)}')
    print(f'FT Counts: {len(ft_counts_df)}')
    print(f'FT Lengths: {len(ft_lengths_df)}')
    print(f'Files: {len(files)}')
    print(f'FAIR Score: 95/100')
    print()
    print(f'View at: https://thermo-app.vercel.app/datasets/{dataset_id}')

except Exception as e:
    print(f'❌ Import failed: {e}')
    conn.rollback()
    raise

finally:
    cur.close()
    conn.close()
