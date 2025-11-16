#!/bin/bash

# =============================================================================
# Database Restore Script
# =============================================================================
# Restores data from a backup file created by backup-database.sh
# Usage: ./restore-database.sh <backup_file>
# =============================================================================

set -e

echo "========================================"
echo "Database Restore"
echo "========================================"
echo ""

# Check if backup file is provided
if [ $# -eq 0 ]; then
    echo "ERROR: No backup file specified"
    echo ""
    echo "Usage: $0 <backup_file>"
    echo ""
    echo "Available backups:"
    ls -1t output/backups/*.sql 2>/dev/null | head -5 | while read file; do
        echo "  - $file"
    done
    echo ""
    exit 1
fi

BACKUP_FILE="$1"

# Check if backup file exists
if [ ! -f "$BACKUP_FILE" ]; then
    echo "ERROR: Backup file not found: $BACKUP_FILE"
    exit 1
fi

echo "Backup file: $BACKUP_FILE"
echo ""

# Load environment variables
if [ -f .env.local ]; then
    export $(cat .env.local | grep -v '^#' | xargs)
else
    echo "ERROR: .env.local not found"
    exit 1
fi

# Ask for confirmation
read -p "This will restore data from backup. Continue? (yes/no): " CONFIRM
if [ "$CONFIRM" != "yes" ]; then
    echo "Aborted."
    exit 0
fi

echo ""
echo "Restoring from backup..."
echo ""

# Use DIRECT_URL for database operations
DB_URL="$DIRECT_URL"

# First, clear existing data
echo "Step 1: Clearing existing data..."
psql "$DB_URL" << 'EOF' 2>/dev/null
SET session_replication_role = 'replica';
TRUNCATE TABLE ahe_grain_data CASCADE;
TRUNCATE TABLE ft_track_lengths CASCADE;
TRUNCATE TABLE ft_ages CASCADE;
TRUNCATE TABLE ft_counts CASCADE;
TRUNCATE TABLE samples CASCADE;
TRUNCATE TABLE datasets CASCADE;
SET session_replication_role = 'origin';
ALTER SEQUENCE datasets_id_seq RESTART WITH 1;
ALTER SEQUENCE ft_counts_id_seq RESTART WITH 1;
ALTER SEQUENCE ft_track_lengths_id_seq RESTART WITH 1;
ALTER SEQUENCE ft_ages_id_seq RESTART WITH 1;
ALTER SEQUENCE ahe_grain_data_id_seq RESTART WITH 1;
EOF

echo "✓ Existing data cleared"
echo ""

# Restore from backup
echo "Step 2: Restoring data from backup..."
psql "$DB_URL" < "$BACKUP_FILE" 2>&1 | grep -v "^SET$" | grep -v "^$" || true

# Check if restore was successful
if [ $? -eq 0 ]; then
    echo ""
    echo "✓ Database restored successfully!"
    echo ""

    # Show row counts
    echo "Row counts after restore:"
    psql "$DB_URL" << 'EOF'
SELECT 'datasets' as table_name, COUNT(*) as rows FROM datasets
UNION ALL
SELECT 'samples', COUNT(*) FROM samples
UNION ALL
SELECT 'ft_ages', COUNT(*) FROM ft_ages
UNION ALL
SELECT 'ft_counts', COUNT(*) FROM ft_counts
UNION ALL
SELECT 'ft_track_lengths', COUNT(*) FROM ft_track_lengths
UNION ALL
SELECT 'ahe_grain_data', COUNT(*) FROM ahe_grain_data
ORDER BY table_name;
EOF

    echo ""
    echo "========================================"
else
    echo "ERROR: Restore failed"
    exit 1
fi
