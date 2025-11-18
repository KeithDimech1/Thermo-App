#!/bin/bash
# Import EarthBank CSVs - ZERO field mapping needed!
# Schema now matches CSV field names exactly

set -e  # Exit on error

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}=======================================${NC}"
echo -e "${BLUE}Import EarthBank CSVs${NC}"
echo -e "${BLUE}=======================================${NC}"

# Load environment from .env.local
if [ -f .env.local ]; then
    set -a
    source .env.local
    set +a
fi

DB_URL="${DIRECT_URL}"

# Function to import CSV
import_csv() {
    local csv_path="$1"
    local table_name="$2"

    if [ ! -f "$csv_path" ]; then
        echo -e "⏭️  Skipping (file not found): $csv_path"
        return
    fi

    echo -e "\n${BLUE}Importing:${NC} $(basename $csv_path)"

    # Use COPY - headers match database columns exactly!
    psql "$DB_URL" -c "\COPY \"$table_name\" FROM '$csv_path' WITH (FORMAT csv, HEADER true, NULL '');"

    if [ $? -eq 0 ]; then
        local count=$(psql "$DB_URL" -t -c "SELECT COUNT(*) FROM \"$table_name\";")
        echo -e "${GREEN}✅ Success${NC} - Total rows: $count"
    else
        echo -e "❌ Failed"
        exit 1
    fi
}

# Dataset 1: Malawi
echo -e "\n${BLUE}Dataset 1: Malawi Rift${NC}"
import_csv "build-data/learning/thermo-papers/Malawi-Rift-Footwall-Exhumation/FAIR/earthbank_samples_complete.csv" "earthbank_samples"
import_csv "build-data/learning/thermo-papers/Malawi-Rift-Footwall-Exhumation/FAIR/earthbank_ft_datapoints_complete.csv" "earthbank_ftDatapoints"
import_csv "build-data/learning/thermo-papers/Malawi-Rift-Footwall-Exhumation/FAIR/earthbank_ft_track_length_data_complete.csv" "earthbank_ftTrackLengthData"
import_csv "build-data/learning/thermo-papers/Malawi-Rift-Footwall-Exhumation/FAIR/earthbank_he_whole_grain_complete.csv" "earthbank_heWholeGrainData"

# Dataset 2: Peak 2021
echo -e "\n${BLUE}Dataset 2: Peak 2021 (Grand Canyon)${NC}"
import_csv "build-data/learning/thermo-papers/Peak(2021)-Grand-Canyon-Great-Unconformity-Geology/FAIR/earthbank_samples.csv" "earthbank_samples"
import_csv "build-data/learning/thermo-papers/Peak(2021)-Grand-Canyon-Great-Unconformity-Geology/FAIR/earthbank_he_datapoints.csv" "earthbank_heDatapoints"
import_csv "build-data/learning/thermo-papers/Peak(2021)-Grand-Canyon-Great-Unconformity-Geology/FAIR/earthbank_he_whole_grain_data.csv" "earthbank_heWholeGrainData"

# Dataset 3: Dusel-Bacon 2015
echo -e "\n${BLUE}Dataset 3: Dusel-Bacon 2015 (Alaska)${NC}"
import_csv "build-data/learning/thermo-papers/Dusel-Bacon(2015)-AFT-regional-exhumation-subtropical-Eocene-Alaska-CJES/FAIR/earthbank_samples.csv" "earthbank_samples"
import_csv "build-data/learning/thermo-papers/Dusel-Bacon(2015)-AFT-regional-exhumation-subtropical-Eocene-Alaska-CJES/FAIR/earthbank_ft_datapoints.csv" "earthbank_ftDatapoints"

# Final counts
echo -e "\n${GREEN}=======================================${NC}"
echo -e "${GREEN}✅ Import Complete${NC}"
echo -e "${GREEN}=======================================${NC}"

echo -e "\n${BLUE}Final row counts:${NC}"
psql "$DB_URL" <<EOF
SELECT
  'earthbank_samples' as table_name,
  COUNT(*) as rows
FROM "earthbank_samples"
UNION ALL
SELECT 'earthbank_ftDatapoints', COUNT(*) FROM "earthbank_ftDatapoints"
UNION ALL
SELECT 'earthbank_ftTrackLengthData', COUNT(*) FROM "earthbank_ftTrackLengthData"
UNION ALL
SELECT 'earthbank_heDatapoints', COUNT(*) FROM "earthbank_heDatapoints"
UNION ALL
SELECT 'earthbank_heWholeGrainData', COUNT(*) FROM "earthbank_heWholeGrainData"
ORDER BY table_name;
EOF
