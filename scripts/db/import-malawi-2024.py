#!/usr/bin/env python3
"""
Import Malawi 2024 extracted data to PostgreSQL database

Steps:
1. Create dataset record
2. Import samples (with dataset_id)
3. Import ft_ages
4. Import ft_counts
5. Import ft_track_lengths
6. Verify import success
"""

import sys
import os
import pandas as pd
import psycopg2
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables
load_dotenv('/Users/keithdimech/Pathway/Dev/Clair/Thermo-App/.env.local')

# Get database URL
DATABASE_URL = os.getenv('DATABASE_URL')
if not DATABASE_URL:
    print("❌ DATABASE_URL not found in .env.local")
    sys.exit(1)

# Data directory
DATA_DIR = Path('/Users/keithdimech/Pathway/Dev/Clair/Thermo-App/build-data/learning/thermo-papers/data')

print('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
print('IMPORTING MALAWI 2024 DATA')
print('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
print()

# Connect to database
print('→ Connecting to database...')
conn = psycopg2.connect(DATABASE_URL)
cur = conn.cursor()
print('✅ Connected')
print()

try:
    # ============================================================
    # STEP 1: Create Dataset Record
    # ============================================================
    print('STEP 1: Creating dataset record...')

    dataset_sql = """
    INSERT INTO datasets (
        dataset_name,
        title,
        authors,
        journal,
        year,
        doi,
        study_area,
        description,
        publication_reference,
        num_samples,
        age_range_min_ma,
        age_range_max_ma,
        analysis_methods,
        created_at
    ) VALUES (
        'Malawi-2024-McMillan',
        '4D fault evolution revealed by footwall exhumation modelling: A natural experiment in the Malawi rift',
        'Malcolm McMillan, Samuel C. Boone, Patrick Chindandali, Barry Kohn, Andrew Gleadow',
        'Journal of Structural Geology',
        2024,
        '10.1016/j.jsg.2024.105196',
        'Usisya fault scarp, Malawi Rift',
        'Apatite fission-track and (U-Th)/He thermochronology from footwall transect of the Usisya fault, Malawi Rift. Data used to constrain 4D fault evolution through exhumation modeling.',
        'McMillan et al. (2024) Journal of Structural Geology 187:105196',
        51,
        17.7,
        324.8,
        ARRAY['LA-ICP-MS AFT', '(U-Th)/He'],
        NOW()
    ) RETURNING id;
    """

    cur.execute(dataset_sql)
    dataset_id = cur.fetchone()[0]
    conn.commit()

    print(f'✅ Dataset created with ID: {dataset_id}')
    print()

    # ============================================================
    # STEP 2: Import Samples
    # ============================================================
    print('STEP 2: Importing samples...')

    samples_df = pd.read_csv(DATA_DIR / 'Malawi-2024-samples.csv')

    # Update dataset_id
    samples_df['dataset_id'] = dataset_id

    # Insert samples
    insert_count = 0
    for _, row in samples_df.iterrows():
        sample_sql = """
        INSERT INTO samples (
            sample_id, dataset_id, latitude, longitude, elevation_m,
            mineral_type, analysis_method, n_aft_grains
        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        ON CONFLICT (sample_id) DO NOTHING;
        """

        cur.execute(sample_sql, (
            row['sample_id'],
            row['dataset_id'],
            row['latitude'],
            row['longitude'],
            row['elevation_m'] if pd.notna(row['elevation_m']) else None,
            row['mineral_type'],
            row['analysis_method'],
            int(row['n_aft_grains']) if pd.notna(row['n_aft_grains']) else None
        ))
        insert_count += cur.rowcount

    conn.commit()
    print(f'✅ Imported {insert_count} samples')
    print()

    # ============================================================
    # STEP 3: Import FT Ages
    # ============================================================
    print('STEP 3: Importing FT ages...')

    ft_ages_df = pd.read_csv(DATA_DIR / 'Malawi-2024-ft_ages.csv')

    insert_count = 0
    for _, row in ft_ages_df.iterrows():
        ft_age_sql = """
        INSERT INTO ft_ages (
            sample_id, n_grains, pooled_age_ma, pooled_age_error_ma,
            central_age_ma, central_age_error_ma, dispersion_pct, p_chi2, ft_age_type
        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
        ON CONFLICT (sample_id) DO NOTHING;
        """

        cur.execute(ft_age_sql, (
            row['sample_id'],
            int(row['n_grains']) if pd.notna(row['n_grains']) else None,
            float(row['pooled_age_ma']) if pd.notna(row['pooled_age_ma']) else None,
            float(row['pooled_age_error_ma']) if pd.notna(row['pooled_age_error_ma']) else None,
            float(row['central_age_ma']) if pd.notna(row['central_age_ma']) else None,
            float(row['central_age_error_ma']) if pd.notna(row['central_age_error_ma']) else None,
            float(row['dispersion_pct']) if pd.notna(row['dispersion_pct']) else None,
            float(row['p_chi2']) if pd.notna(row['p_chi2']) else None,
            row['ft_age_type']
        ))
        insert_count += cur.rowcount

    conn.commit()
    print(f'✅ Imported {insert_count} FT age records')
    print()

    # ============================================================
    # STEP 4: Import FT Counts
    # ============================================================
    print('STEP 4: Importing FT counts...')

    ft_counts_df = pd.read_csv(DATA_DIR / 'Malawi-2024-ft_counts.csv')

    insert_count = 0
    for _, row in ft_counts_df.iterrows():
        ft_count_sql = """
        INSERT INTO ft_counts (
            sample_id, grain_id, ns, rho_s_cm2, u_ppm, u_1sigma,
            th_ppm, th_1sigma, eu_ppm, eu_1sigma, dpar_um, dpar_sd_um,
            rmr0, rmr0d, cl_wt_pct, ecl_apfu, n_grains
        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        ON CONFLICT (sample_id, grain_id) DO NOTHING;
        """

        cur.execute(ft_count_sql, (
            row['sample_id'],
            row['grain_id'],
            int(row['ns']) if pd.notna(row['ns']) else None,
            float(row['rho_s_cm2']) if pd.notna(row['rho_s_cm2']) else None,
            float(row['u_ppm']) if pd.notna(row['u_ppm']) else None,
            float(row['u_1sigma']) if pd.notna(row['u_1sigma']) else None,
            float(row['th_ppm']) if pd.notna(row['th_ppm']) else None,
            float(row['th_1sigma']) if pd.notna(row['th_1sigma']) else None,
            float(row['eu_ppm']) if pd.notna(row['eu_ppm']) else None,
            float(row['eu_1sigma']) if pd.notna(row['eu_1sigma']) else None,
            float(row['dpar_um']) if pd.notna(row['dpar_um']) else None,
            float(row['dpar_sd_um']) if pd.notna(row['dpar_sd_um']) else None,
            float(row['rmr0']) if pd.notna(row['rmr0']) else None,
            float(row['rmr0d']) if pd.notna(row['rmr0d']) else None,
            float(row['cl_wt_pct']) if pd.notna(row['cl_wt_pct']) else None,
            float(row['ecl_apfu']) if pd.notna(row['ecl_apfu']) else None,
            int(row['n_grains']) if pd.notna(row['n_grains']) else None
        ))
        insert_count += cur.rowcount

    conn.commit()
    print(f'✅ Imported {insert_count} FT count records')
    print()

    # ============================================================
    # STEP 5: Import FT Track Lengths
    # ============================================================
    print('STEP 5: Importing FT track lengths...')

    ft_lengths_df = pd.read_csv(DATA_DIR / 'Malawi-2024-ft_track_lengths.csv')

    insert_count = 0
    for _, row in ft_lengths_df.iterrows():
        ft_length_sql = """
        INSERT INTO ft_track_lengths (
            sample_id, grain_id, n_confined_tracks, mean_track_length_um,
            mean_track_length_se_um, mean_track_length_sd_um, dpar_um
        ) VALUES (%s, %s, %s, %s, %s, %s, %s)
        ON CONFLICT (sample_id, grain_id) DO NOTHING;
        """

        cur.execute(ft_length_sql, (
            row['sample_id'],
            row['grain_id'],
            int(row['n_confined_tracks']) if pd.notna(row['n_confined_tracks']) else None,
            float(row['mean_track_length_um']) if pd.notna(row['mean_track_length_um']) else None,
            float(row['mean_track_length_se_um']) if pd.notna(row['mean_track_length_se_um']) else None,
            float(row['mean_track_length_sd_um']) if pd.notna(row['mean_track_length_sd_um']) else None,
            float(row['dpar_um']) if pd.notna(row['dpar_um']) else None
        ))
        insert_count += cur.rowcount

    conn.commit()
    print(f'✅ Imported {insert_count} FT track length records')
    print()

    # ============================================================
    # STEP 6: Verification
    # ============================================================
    print('STEP 6: Verifying import...')
    print()

    # Count records
    cur.execute("SELECT COUNT(*) FROM datasets WHERE id = %s", (dataset_id,))
    dataset_count = cur.fetchone()[0]

    cur.execute("SELECT COUNT(*) FROM samples WHERE dataset_id = %s", (dataset_id,))
    sample_count = cur.fetchone()[0]

    cur.execute("""
        SELECT COUNT(*) FROM ft_ages
        WHERE sample_id IN (SELECT sample_id FROM samples WHERE dataset_id = %s)
    """, (dataset_id,))
    ft_age_count = cur.fetchone()[0]

    cur.execute("""
        SELECT COUNT(*) FROM ft_counts
        WHERE sample_id IN (SELECT sample_id FROM samples WHERE dataset_id = %s)
    """, (dataset_id,))
    ft_count_count = cur.fetchone()[0]

    cur.execute("""
        SELECT COUNT(*) FROM ft_track_lengths
        WHERE sample_id IN (SELECT sample_id FROM samples WHERE dataset_id = %s)
    """, (dataset_id,))
    ft_length_count = cur.fetchone()[0]

    print('✅ Import verification:')
    print(f'   - Datasets: {dataset_count}')
    print(f'   - Samples: {sample_count}')
    print(f'   - FT Ages: {ft_age_count}')
    print(f'   - FT Counts: {ft_count_count}')
    print(f'   - FT Track Lengths: {ft_length_count}')
    print()

    # Show sample data
    cur.execute("""
        SELECT s.sample_id, s.mineral_type, fa.central_age_ma, fa.central_age_error_ma
        FROM samples s
        JOIN ft_ages fa ON s.sample_id = fa.sample_id
        WHERE s.dataset_id = %s
        ORDER BY s.sample_id
        LIMIT 5
    """, (dataset_id,))

    print('Sample data (first 5):')
    print('─' * 80)
    for row in cur.fetchall():
        print(f'  {row[0]}: {row[1]} - {row[2]:.1f} ± {row[3]:.1f} Ma')
    print('─' * 80)
    print()

    print('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    print('IMPORT COMPLETE ✅')
    print('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    print()
    print(f'Dataset ID: {dataset_id}')
    print(f'Total records imported: {dataset_count + sample_count + ft_age_count + ft_count_count + ft_length_count}')
    print()

except Exception as e:
    print(f'❌ Import failed: {e}')
    conn.rollback()
    raise

finally:
    cur.close()
    conn.close()
    print('→ Database connection closed')
