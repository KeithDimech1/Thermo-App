#!/bin/bash
# Import He CSV data (Peak and Malawi datasets)

set -e  # Exit on error

echo "🚀 Importing He CSV data..."
echo ""

BASE_DIR="/Users/keithdimech/Pathway/Dev/Clair/Thermo-App/build-data/learning/thermo-papers"

# =======================
# Peak 2021 (Grand Canyon)
# =======================
echo "📊 Peak 2021 (Grand Canyon) - He Datapoints"
PEAK_HE_DP="${BASE_DIR}/Peak(2021)-Grand-Canyon-Great-Unconformity-Geology/FAIR/earthbank_he_datapoints.csv"
npm run db:psql << EOF
\\COPY "earthbank_heDatapoints" ("sampleID","datapointName","ftMethod","laboratory","analyst","analysisDate","nGrains","meanCorrectedAgeMa","meanCorrectedAgeUncertainty","meanUncorrectedAgeMa","notes") FROM '${PEAK_HE_DP}' WITH (FORMAT csv, HEADER true);
EOF
echo "  ✅ Peak He datapoints imported"
echo ""

echo "📊 Peak 2021 (Grand Canyon) - He Whole Grain Data"
PEAK_HE_WG="${BASE_DIR}/Peak(2021)-Grand-Canyon-Great-Unconformity-Geology/FAIR/earthbank_he_whole_grain_data.csv"
npm run db:psql << EOF
\\COPY "earthbank_heWholeGrainData" ("datapointName","grainName","correctedHeAge","correctedHeAgeUncertainty","uncorrectedHeAge","uncorrectedHeAgeUncertainty","ft","heNmolG","heNmolGUncertainty","he4Concentration","he4ConcentrationUncertainty","uConcentration","uConcentrationUncertainty","uNg","uNgUncertainty","thConcentration","thConcentrationUncertainty","thNg","thNgUncertainty","smConcentration","smConcentrationUncertainty","smNg","smNgUncertainty","eU","eUUncertainty","rsUm","massMg","geometry","lengthUm","widthUm","ftU238","ftU235","ftTh232","ftSm147","numPits") FROM '${PEAK_HE_WG}' WITH (FORMAT csv, HEADER true);
EOF
echo "  ✅ Peak He whole grain data imported"
echo ""

# =======================
# Malawi Rift Footwall Exhumation
# =======================
echo "📊 Malawi Rift - He Whole Grain Data"
MALAWI_HE_WG="${BASE_DIR}/Malawi-Rift-Footwall-Exhumation/FAIR/earthbank_he_whole_grain_complete.csv"
npm run db:psql << EOF
\\COPY "earthbank_heWholeGrainData" ("sampleID","datapointName","grainName","he4Concentration","massMg","uConcentration","thConcentration","smConcentration","eU","uncorrectedHeAge","uncorrectedHeAgeUncertainty","ft","correctedHeAge","correctedHeAgeUncertainty") FROM '${MALAWI_HE_WG}' WITH (FORMAT csv, HEADER true);
EOF
echo "  ✅ Malawi He whole grain data imported"
echo ""

# =======================
# Summary
# =======================
echo "✅ All He CSV data imported successfully!"
echo ""
echo "Verifying row counts..."
npm run db:psql << EOF
SELECT
  'earthbank_heDatapoints' AS table_name,
  COUNT(*) AS row_count
FROM "earthbank_heDatapoints"
UNION ALL
SELECT
  'earthbank_heWholeGrainData' AS table_name,
  COUNT(*) AS row_count
FROM "earthbank_heWholeGrainData";
EOF
