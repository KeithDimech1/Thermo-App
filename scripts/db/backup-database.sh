#!/bin/bash

# =============================================================================
# Database Backup Script
# =============================================================================
# Creates a complete backup of the thermochronology database
# Output: Timestamped backup file in output/backups/
# =============================================================================

set -e

echo "========================================"
echo "Database Backup"
echo "========================================"

# Load environment variables
if [ -f .env.local ]; then
    export $(cat .env.local | grep -v '^#' | xargs)
else
    echo "ERROR: .env.local not found"
    exit 1
fi

# Create backup directory
BACKUP_DIR="output/backups"
mkdir -p "$BACKUP_DIR"

# Generate timestamp for backup filename
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/thermo_backup_${TIMESTAMP}.sql"

echo "Backup file: $BACKUP_FILE"
echo ""

# Extract connection details from DIRECT_URL
# Format: postgresql://user:pass@host:port/dbname?sslmode=require
DB_URL="$DIRECT_URL"

echo "Starting backup..."
echo ""

# Use pg_dump to create backup (data only, no schema drops)
pg_dump "$DB_URL" \
  --data-only \
  --inserts \
  --no-owner \
  --no-privileges \
  --file="$BACKUP_FILE"

# Check if backup was successful
if [ $? -eq 0 ]; then
    FILESIZE=$(du -h "$BACKUP_FILE" | cut -f1)
    echo ""
    echo "✓ Backup completed successfully!"
    echo "  File: $BACKUP_FILE"
    echo "  Size: $FILESIZE"
    echo ""

    # Count rows in backup
    INSERTS=$(grep -c "^INSERT INTO" "$BACKUP_FILE" || true)
    echo "  Total INSERT statements: $INSERTS"
    echo ""

    # Show table-specific counts
    echo "  Data by table:"
    grep "^INSERT INTO" "$BACKUP_FILE" | cut -d' ' -f3 | sort | uniq -c | while read count table; do
        echo "    - $table: $count rows"
    done
    echo ""
    echo "========================================"
else
    echo "ERROR: Backup failed"
    exit 1
fi
