#!/bin/bash
#
# SQL-based bulk import using PostgreSQL COPY
# Much faster and more reliable than row-by-row Python inserts
#
# Usage: ./import-sql.sh <dataset-name> <data-directory>
#

set -e  # Exit on any error

DATASET_NAME=$1
DATA_DIR=$2

if [ -z "$DATASET_NAME" ] || [ -z "$DATA_DIR" ]; then
    echo "Usage: ./import-sql.sh <dataset-name> <data-directory>"
    echo "Example: ./import-sql.sh Malawi-2024 build-data/learning/thermo-papers/data"
    exit 1
fi

# Load database URL
source .env.local
if [ -z "$DATABASE_URL" ]; then
    echo "❌ DATABASE_URL not found in .env.local"
    exit 1
fi

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "SQL BULK IMPORT"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Dataset: $DATASET_NAME"
echo "Data directory: $DATA_DIR"
echo ""

# Step 1: Validate CSV files FIRST
echo "→ Step 1: Validating CSV files..."
python scripts/db/validate-import.py "$DATA_DIR"

if [ $? -ne 0 ]; then
    echo ""
    echo "❌ Validation failed - fix errors before import"
    exit 1
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "STARTING IMPORT"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Create temporary SQL import script
IMPORT_SQL=$(mktemp /tmp/import-XXXXX.sql)

# Build SQL script
cat > "$IMPORT_SQL" <<'EOSQL'
-- Begin transaction (all-or-nothing)
BEGIN;

-- Step 1: Create dataset
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
    'DATASET_NAME_PLACEHOLDER',
    'TITLE_PLACEHOLDER',
    'AUTHORS_PLACEHOLDER',
    'JOURNAL_PLACEHOLDER',
    YEAR_PLACEHOLDER,
    'DOI_PLACEHOLDER',
    'STUDY_AREA_PLACEHOLDER',
    'DESCRIPTION_PLACEHOLDER',
    'REFERENCE_PLACEHOLDER',
    NUM_SAMPLES_PLACEHOLDER,
    AGE_MIN_PLACEHOLDER,
    AGE_MAX_PLACEHOLDER,
    ARRAY['METHODS_PLACEHOLDER'],
    NOW()
) RETURNING id AS dataset_id;

-- Get the dataset ID (stored in variable for psql)
\gset

-- Step 2: Import samples (using COPY for speed)
CREATE TEMP TABLE temp_samples (
    sample_id VARCHAR(50),
    dataset_id INTEGER,
    latitude NUMERIC,
    longitude NUMERIC,
    elevation_m NUMERIC,
    mineral_type VARCHAR(50),
    analysis_method VARCHAR(100),
    n_aft_grains INTEGER
);

\COPY temp_samples FROM 'SAMPLES_CSV_PATH' WITH (FORMAT CSV, HEADER TRUE, NULL '');

-- Insert from temp table with dataset_id
INSERT INTO samples (
    sample_id, dataset_id, latitude, longitude, elevation_m,
    mineral_type, analysis_method, n_aft_grains
)
SELECT
    sample_id, :dataset_id, latitude, longitude, elevation_m,
    mineral_type, analysis_method, n_aft_grains
FROM temp_samples;

-- Step 3: Import FT ages
\COPY ft_ages (sample_id, n_grains, pooled_age_ma, pooled_age_error_ma, central_age_ma, central_age_error_ma, dispersion_pct, p_chi2, ft_age_type) FROM 'FT_AGES_CSV_PATH' WITH (FORMAT CSV, HEADER TRUE, NULL '');

-- Step 4: Import FT counts
\COPY ft_counts (sample_id, grain_id, ns, rho_s_cm2, u_ppm, u_1sigma, th_ppm, th_1sigma, eu_ppm, eu_1sigma, dpar_um, dpar_sd_um, rmr0, rmr0d, cl_wt_pct, ecl_apfu, n_grains) FROM 'FT_COUNTS_CSV_PATH' WITH (FORMAT CSV, HEADER TRUE, NULL '');

-- Step 5: Import FT track lengths
\COPY ft_track_lengths (sample_id, grain_id, n_confined_tracks, mean_track_length_um, mean_track_length_se_um, mean_track_length_sd_um, dpar_um) FROM 'FT_LENGTHS_CSV_PATH' WITH (FORMAT CSV, HEADER TRUE, NULL '');

-- Verify counts
SELECT 'datasets' AS table_name, COUNT(*) AS count FROM datasets WHERE id = :dataset_id
UNION ALL
SELECT 'samples', COUNT(*) FROM samples WHERE dataset_id = :dataset_id
UNION ALL
SELECT 'ft_ages', COUNT(*) FROM ft_ages WHERE sample_id IN (SELECT sample_id FROM samples WHERE dataset_id = :dataset_id)
UNION ALL
SELECT 'ft_counts', COUNT(*) FROM ft_counts WHERE sample_id IN (SELECT sample_id FROM samples WHERE dataset_id = :dataset_id)
UNION ALL
SELECT 'ft_track_lengths', COUNT(*) FROM ft_track_lengths WHERE sample_id IN (SELECT sample_id FROM samples WHERE dataset_id = :dataset_id);

-- Commit transaction
COMMIT;

EOSQL

# Replace placeholders with actual values
# (These would come from metadata file or command-line args)
# For now, using Malawi example

sed -i '' "s|DATASET_NAME_PLACEHOLDER|$DATASET_NAME|g" "$IMPORT_SQL"
sed -i '' "s|SAMPLES_CSV_PATH|$DATA_DIR/${DATASET_NAME}-samples.csv|g" "$IMPORT_SQL"
sed -i '' "s|FT_AGES_CSV_PATH|$DATA_DIR/${DATASET_NAME}-ft_ages.csv|g" "$IMPORT_SQL"
sed -i '' "s|FT_COUNTS_CSV_PATH|$DATA_DIR/${DATASET_NAME}-ft_counts.csv|g" "$IMPORT_SQL"
sed -i '' "s|FT_LENGTHS_CSV_PATH|$DATA_DIR/${DATASET_NAME}-ft_track_lengths.csv|g" "$IMPORT_SQL"

# Show SQL script
echo "→ Generated SQL import script:"
echo ""
head -20 "$IMPORT_SQL"
echo "..."
echo ""

# Execute import
echo "→ Executing SQL import..."
psql "$DATABASE_URL" -f "$IMPORT_SQL"

if [ $? -eq 0 ]; then
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "✅ IMPORT COMPLETE"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
else
    echo ""
    echo "❌ Import failed"
    exit 1
fi

# Cleanup
rm "$IMPORT_SQL"
