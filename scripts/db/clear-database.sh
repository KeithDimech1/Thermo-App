#!/bin/bash

# =============================================================================
# Clear Database Script
# =============================================================================
# Clears all data from the thermochronology database
# IMPORTANT: This keeps the schema intact (tables, views, triggers)
# WARNING: This operation cannot be undone! Make a backup first!
# =============================================================================

set -e

echo "========================================"
echo "Clear Database"
echo "========================================"
echo ""
echo "⚠️  WARNING: This will delete ALL data!"
echo "   Schema will remain intact (tables, views, triggers)"
echo ""

# Load environment variables
if [ -f .env.local ]; then
    export $(cat .env.local | grep -v '^#' | xargs)
else
    echo "ERROR: .env.local not found"
    exit 1
fi

# Ask for confirmation
read -p "Are you sure you want to clear the database? (yes/no): " CONFIRM
if [ "$CONFIRM" != "yes" ]; then
    echo "Aborted."
    exit 0
fi

echo ""
echo "Clearing database tables..."
echo ""

# Use DIRECT_URL for database operations
DB_URL="$DIRECT_URL"

# SQL to truncate all tables in correct order (respecting foreign keys)
psql "$DB_URL" << 'EOF'
-- Disable triggers temporarily to avoid foreign key issues
SET session_replication_role = 'replica';

-- Truncate all tables (in order to respect foreign keys)
TRUNCATE TABLE ahe_grain_data CASCADE;
TRUNCATE TABLE ft_track_lengths CASCADE;
TRUNCATE TABLE ft_ages CASCADE;
TRUNCATE TABLE ft_counts CASCADE;
TRUNCATE TABLE samples CASCADE;
TRUNCATE TABLE datasets CASCADE;

-- Re-enable triggers
SET session_replication_role = 'origin';

-- Reset sequences
ALTER SEQUENCE datasets_id_seq RESTART WITH 1;
ALTER SEQUENCE ft_counts_id_seq RESTART WITH 1;
ALTER SEQUENCE ft_track_lengths_id_seq RESTART WITH 1;
ALTER SEQUENCE ft_ages_id_seq RESTART WITH 1;
ALTER SEQUENCE ahe_grain_data_id_seq RESTART WITH 1;

-- Show confirmation
SELECT 'All tables cleared successfully' AS status;
EOF

# Check if clear was successful
if [ $? -eq 0 ]; then
    echo ""
    echo "✓ Database cleared successfully!"
    echo ""
    echo "All tables are now empty."
    echo "Schema (tables, views, triggers) remains intact."
    echo ""
    echo "To restore data, run:"
    echo "  ./scripts/db/restore-database.sh <backup_file>"
    echo ""
    echo "========================================"
else
    echo "ERROR: Clear operation failed"
    exit 1
fi
