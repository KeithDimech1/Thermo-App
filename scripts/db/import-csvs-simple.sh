#!/bin/bash
# Import EarthBank CSVs - Direct psql COPY (no field mapping!)
set -e

echo "========================================="
echo "Import EarthBank CSVs"
echo "========================================="

# Get absolute paths
PROJECT_ROOT=$(pwd)

# Malawi
echo -e "\n=== Dataset 1: Malawi Rift ==="
npm run db:psql <<EOF
\COPY "earthbank_samples" ("sampleID", "datasetID", "mineralType", "lithology", "latitude", "longitude", "nAFTGrains", "nAHeGrains") FROM '${PROJECT_ROOT}/build-data/learning/thermo-papers/Malawi-Rift-Footwall-Exhumation/FAIR/earthbank_samples_complete.csv' WITH (FORMAT csv, HEADER true, NULL '');
\COPY "earthbank_ftDatapoints" ("sampleID", "datapointName", "laboratory", "ftMethod", "nGrains", "totalNs", "rhoS", "uPpm", "uPpmStdDev", "dPar", "dParUncertainty", "pChi2", "dispersion", "pooledAgeMa", "pooledAgeUncertainty", "centralAgeMa", "centralAgeUncertainty", "mtl", "stdDevMu", "nTracks", "mineralType") FROM '${PROJECT_ROOT}/build-data/learning/thermo-papers/Malawi-Rift-Footwall-Exhumation/FAIR/earthbank_ft_datapoints_complete.csv' WITH (FORMAT csv, HEADER true, NULL '');
\COPY "earthbank_ftTrackLengthData" ("sampleID", "datapointName", "grainName", "trackID", "trackType", "lengthUm", "cAxisAngleDeg", "dPar") FROM '${PROJECT_ROOT}/build-data/learning/thermo-papers/Malawi-Rift-Footwall-Exhumation/FAIR/earthbank_ft_track_length_data_complete.csv' WITH (FORMAT csv, HEADER true, NULL '');
\COPY "earthbank_heWholeGrainData" ("sampleID", "datapointName", "grainName", "he4Concentration", "massMg", "uConcentration", "thConcentration", "smConcentration", "eU", "uncorrectedHeAge", "uncorrectedHeAgeUncertainty", "ft", "correctedHeAge", "correctedHeAgeUncertainty") FROM '${PROJECT_ROOT}/build-data/learning/thermo-papers/Malawi-Rift-Footwall-Exhumation/FAIR/earthbank_he_whole_grain_complete.csv' WITH (FORMAT csv, HEADER true, NULL '');
EOF

# Peak
echo -e "\n=== Dataset 2: Peak 2021 (Grand Canyon) ==="
npm run db:psql <<EOF
\COPY "earthbank_samples" ("sampleID", "IGSN", "latitude", "longitude", "elevationM", "geodeticDatum", "verticalDatum", "mineral", "lithology", "sampleKind", "sampleAgeMa", "collector", "collectionDate") FROM '${PROJECT_ROOT}/build-data/learning/thermo-papers/Peak(2021)-Grand-Canyon-Great-Unconformity-Geology/FAIR/earthbank_samples.csv' WITH (FORMAT csv, HEADER true, NULL '');
\COPY "earthbank_heDatapoints" ("sampleID", "datapointName", "ftMethod", "laboratory", "analyst", "analysisDate", "nGrains", "meanCorrectedAgeMa", "meanCorrectedAgeUncertainty", "meanUncorrectedAgeMa", "notes") FROM '${PROJECT_ROOT}/build-data/learning/thermo-papers/Peak(2021)-Grand-Canyon-Great-Unconformity-Geology/FAIR/earthbank_he_datapoints.csv' WITH (FORMAT csv, HEADER true, NULL '');
\COPY "earthbank_heWholeGrainData" ("datapointName", "grainName", "correctedHeAge", "correctedHeAgeUncertainty", "uncorrectedHeAge", "uncorrectedHeAgeUncertainty", "ft", "heNmolG", "heNmolGUncertainty", "he4Concentration", "he4ConcentrationUncertainty", "uConcentration", "uConcentrationUncertainty", "uNg", "uNgUncertainty", "thConcentration", "thConcentrationUncertainty", "thNg", "thNgUncertainty", "smConcentration", "smConcentrationUncertainty", "smNg", "smNgUncertainty", "eU", "eUUncertainty", "rsUm", "massMg", "geometry", "lengthUm", "widthUm", "ftU238", "ftU235", "ftTh232", "ftSm147", "numPits") FROM '${PROJECT_ROOT}/build-data/learning/thermo-papers/Peak(2021)-Grand-Canyon-Great-Unconformity-Geology/FAIR/earthbank_he_whole_grain_data.csv' WITH (FORMAT csv, HEADER true, NULL '');
EOF

# Dusel-Bacon
echo -e "\n=== Dataset 3: Dusel-Bacon 2015 (Alaska) ==="
npm run db:psql <<EOF
\COPY "earthbank_samples" ("sampleID", "IGSN", "latitude", "longitude", "elevationM", "geodeticDatum", "verticalDatum", "sampleKind", "lithology", "mineral", "quadrangle", "faultBlock", "igneousAgeMa", "igneousAgeErrorMa", "collector", "collectionYear", "project", "country", "stateProvince", "locationDescription") FROM '${PROJECT_ROOT}/build-data/learning/thermo-papers/Dusel-Bacon(2015)-AFT-regional-exhumation-subtropical-Eocene-Alaska-CJES/FAIR/earthbank_samples.csv' WITH (FORMAT csv, HEADER true, NULL '');
\COPY "earthbank_ftDatapoints" ("sampleID", "datapointName", "labNumber", "pooledAgeMa", "pooledAgeUncertainty", "centralAgeMa", "centralAgeUncertainty", "mtl", "mtlUncertainty", "stdDevMu", "nTracks", "nGrains", "dPar", "ftMethod", "uConcentration", "totalNs", "sigmaP", "sigmaPError", "zeta", "zetaUncertainty", "pChi2", "dispersion", "laboratory", "analyst", "analysisDate") FROM '${PROJECT_ROOT}/build-data/learning/thermo-papers/Dusel-Bacon(2015)-AFT-regional-exhumation-subtropical-Eocene-Alaska-CJES/FAIR/earthbank_ft_datapoints.csv' WITH (FORMAT csv, HEADER true, NULL '');
EOF

# Final counts
echo -e "\n========================================="
echo "✅ Import Complete"
echo "========================================="

npm run db:psql <<EOF
SELECT 'earthbank_samples' as table_name, COUNT(*) as rows FROM "earthbank_samples"
UNION ALL SELECT 'earthbank_ftDatapoints', COUNT(*) FROM "earthbank_ftDatapoints"
UNION ALL SELECT 'earthbank_ftTrackLengthData', COUNT(*) FROM "earthbank_ftTrackLengthData"
UNION ALL SELECT 'earthbank_heDatapoints', COUNT(*) FROM "earthbank_heDatapoints"
UNION ALL SELECT 'earthbank_heWholeGrainData', COUNT(*) FROM "earthbank_heWholeGrainData"
ORDER BY table_name;
EOF
