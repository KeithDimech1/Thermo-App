#!/bin/bash
# Import transformed EarthBank CSVs into camelCase schema
# Uses psql COPY with field mapping

set -e  # Exit on error

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Import EarthBank CSVs to camelCase Schema${NC}"
echo -e "${BLUE}========================================${NC}"

# Load environment
if [ -f .env.local ]; then
    export $(cat .env.local | grep -v '^#' | xargs)
fi

DB_URL="${DIRECT_URL}"

# Function to import CSV with psql
import_csv() {
    local csv_path="$1"
    local table_name="$2"
    local field_mapping="$3"

    echo -e "\n${BLUE}Importing:${NC} $(basename $csv_path)"
    echo -e "${BLUE}Into table:${NC} $table_name"

    # Use psql with COPY command
    psql "$DB_URL" <<EOF
\copy $table_name ($field_mapping) FROM '$csv_path' WITH (FORMAT csv, HEADER true, NULL '');
EOF

    if [ $? -eq 0 ]; then
        # Count rows
        local count=$(psql "$DB_URL" -t -c "SELECT COUNT(*) FROM $table_name;")
        echo -e "${GREEN}✅ Imported successfully${NC} - Total rows: $count"
    else
        echo -e "${RED}❌ Import failed${NC}"
        exit 1
    fi
}

# Dataset 1: Malawi Rift
echo -e "\n${BLUE}========================================${NC}"
echo -e "${BLUE}Dataset 1: Malawi Rift${NC}"
echo -e "${BLUE}========================================${NC}"

# Samples (sampleID → sampleName mapping)
import_csv \
    "build-data/learning/thermo-papers/Malawi-Rift-Footwall-Exhumation/FAIR/earthbank_samples_complete.csv" \
    "earthbank_samples" \
    '"sampleName", "datasetID", "mineral", "material", "latitude", "longitude"'

# FT Datapoints
import_csv \
    "build-data/learning/thermo-papers/Malawi-Rift-Footwall-Exhumation/FAIR/earthbank_ft_datapoints_complete.csv" \
    "earthbank_ftDatapoints" \
    '"sampleName", "datapointName", "laboratory", "ftCharacterisationMethod", "noOfGrains", "ns", "rhoS", "uCont", "uStandardDeviation", "dPar", "dParStandardError", "chi2pct", "dispersion", "pooledAgeMa", "pooledAgeUncertaintyMa", "centralAgeMa", "centralAgeUncertaintyMa", "mtl", "stdDevMu", "nTracks", "mineral"'

# FT Track Length Data
import_csv \
    "build-data/learning/thermo-papers/Malawi-Rift-Footwall-Exhumation/FAIR/earthbank_ft_track_length_data_complete.csv" \
    "earthbank_ftTrackLengthData" \
    '"datapointName", "grainName", "trackID", "trackType", "trackLength", "cAxisAngle", "dPar"'

# He Whole Grain Data
import_csv \
    "build-data/learning/thermo-papers/Malawi-Rift-Footwall-Exhumation/FAIR/earthbank_he_whole_grain_complete.csv" \
    "earthbank_heWholeGrainData" \
    '"datapointName", "aliquotID", "he4Concentration", "aliquotMass", "uConcentration", "thConcentration", "smConcentration", "eU", "uncorrectedHeAge", "uncorrectedHeAgeUncertainty", "ft", "correctedHeAge", "correctedHeAgeUncertainty"'

# Dataset 2: Peak 2021
echo -e "\n${BLUE}========================================${NC}"
echo -e "${BLUE}Dataset 2: Peak 2021 (Grand Canyon)${NC}"
echo -e "${BLUE}========================================${NC}"

import_csv \
    "build-data/learning/thermo-papers/Peak(2021)-Grand-Canyon-Great-Unconformity-Geology/FAIR/earthbank_samples.csv" \
    "earthbank_samples" \
    '"sampleName", "igsn", "latitude", "longitude", "elevationGround", "geodeticDatum", "verticalDatum", "mineral", "material", "sampleKind", "ageMin", "person", "collectDateMin"'

import_csv \
    "build-data/learning/thermo-papers/Peak(2021)-Grand-Canyon-Great-Unconformity-Geology/FAIR/earthbank_he_datapoints.csv" \
    "earthbank_heDatapoints" \
    '"sampleName", "datapointName", "ftCharacterisationMethod", "laboratory", "analyst", "analysisDate", "numAliquots", "meanCorrectedHeAge", "meanCorrectedHeAgeUncertainty", "meanUncorrectedHeAge"'

import_csv \
    "build-data/learning/thermo-papers/Peak(2021)-Grand-Canyon-Great-Unconformity-Geology/FAIR/earthbank_he_whole_grain_data.csv" \
    "earthbank_heWholeGrainData" \
    '"datapointName", "aliquotID", "correctedHeAge", "correctedHeAgeUncertainty", "ft", "eU"'

# Dataset 3: Dusel-Bacon 2015
echo -e "\n${BLUE}========================================${NC}"
echo -e "${BLUE}Dataset 3: Dusel-Bacon 2015 (Alaska)${NC}"
echo -e "${BLUE}========================================${NC}"

import_csv \
    "build-data/learning/thermo-papers/Dusel-Bacon(2015)-AFT-regional-exhumation-subtropical-Eocene-Alaska-CJES/FAIR/earthbank_samples.csv" \
    "earthbank_samples" \
    '"sampleName", "igsn", "latitude", "longitude", "elevationGround", "geodeticDatum", "verticalDatum", "sampleKind", "material", "mineral"'

import_csv \
    "build-data/learning/thermo-papers/Dusel-Bacon(2015)-AFT-regional-exhumation-subtropical-Eocene-Alaska-CJES/FAIR/earthbank_ft_datapoints.csv" \
    "earthbank_ftDatapoints" \
    '"sampleName", "datapointName", "pooledAgeMa", "centralAgeMa", "mtl"'

echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}✅ All datasets imported successfully${NC}"
echo -e "${GREEN}========================================${NC}"

# Show final counts
echo -e "\n${BLUE}Final row counts:${NC}"
psql "$DB_URL" <<EOF
SELECT 'earthbank_samples' as table_name, COUNT(*) as rows FROM "earthbank_samples"
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
