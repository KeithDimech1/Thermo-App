const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const BASE_PATH = '/Users/keithdimech/Pathway/Dev/Clair/Thermo-App/build-data/learning/thermo-papers/McMillan(2024)-4D-Fault-Evolution-Malawi-Rift/Supplementary/Malawi Rift Usisya Border Fault Footwall Thermochronology';
const OUTPUT_PATH = '/Users/keithdimech/Pathway/Dev/Clair/Thermo-App/build-data/learning/thermo-papers/McMillan(2024)-4D-Fault-Evolution-Malawi-Rift/FAIR';

console.log('='.repeat(80));
console.log('MCMILLAN(2024) SUPPLEMENTARY → EARTHBANK SCHEMA CONVERSION');
console.log('='.repeat(80));
console.log();

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_PATH)) {
  fs.mkdirSync(OUTPUT_PATH, { recursive: true });
}

// ============================================================================
// STEP 1: SAMPLES
// ============================================================================
console.log('STEP 1: Converting Samples...');
console.log('-'.repeat(80));

const samplesWorkbook = XLSX.readFile(path.join(BASE_PATH, 'Samples/Samples.xlsx'));
const samplesData = XLSX.utils.sheet_to_json(samplesWorkbook.Sheets['Samples']);

console.log(`Input: ${samplesData.length} samples from Samples.xlsx`);

// Map to earthbank_samples schema
const earthbankSamples = samplesData.map(row => ({
  sampleID: row.sampleName || '',
  sampleName: row.sampleName || '',
  IGSN: row.igsn || '',
  sampleKind: row.sampleKind || 'Rock',
  sampleMethod: row.sampleMethod || '',
  materialType: row.material || '',
  lithology: row.material || '',
  mineralType: 'apatite',
  latitude: row.latitude || null,
  longitude: row.longitude || null,
  latLonPrecision: row.latLonPrecision || '',
  elevationM: row.elevationGround || null,
  geodeticDatum: row.geodeticDatum || 'WGS84',
  verticalDatum: row.verticalDatum || 'mean sea level',
  locationName: row.locationName || '',
  locationDescription: row.locationDescription || '',
  datasetID: '7', // Wells(2012) is ID 7, we'll need to create McMillan entry
}));

console.log(`Output: ${earthbankSamples.length} samples mapped to earthbank_samples schema`);
console.log();

// Write CSV
const samplesCSV = XLSX.utils.json_to_sheet(earthbankSamples);
const samplesWorkbookOut = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(samplesWorkbookOut, samplesCSV, 'Samples');
XLSX.writeFile(samplesWorkbookOut, path.join(OUTPUT_PATH, 'earthbank_samples.csv'), { bookType: 'csv' });
console.log(`✅ Written: earthbank_samples.csv`);
console.log();

// ============================================================================
// STEP 2: FT DATAPOINTS
// ============================================================================
console.log('STEP 2: Converting FT Datapoints...');
console.log('-'.repeat(80));

const ftWorkbook = XLSX.readFile(path.join(BASE_PATH, 'Fission Track/Fission Track.xlsx'));
const ftDatapointsData = XLSX.utils.sheet_to_json(ftWorkbook.Sheets['FT Datapoints']);

console.log(`Input: ${ftDatapointsData.length} FT datapoints from Fission Track.xlsx`);

// Map to earthbank_ftDatapoints schema
const earthbankFTDatapoints = ftDatapointsData.map(row => ({
  datapointName: row.datapointName || '',
  sampleID: row.sampleName || '',
  laboratory: row.laboratory || '',
  analyst: row.analyst || '',
  mineralType: row.mineral || 'Apatite',
  referenceMaterial: row.referenceMaterial || '',
  ftMethod: row.ftCharacterisationMethod || '',
  ftAnalyticalSoftware: row.ftAnalyticalSoftware || '',
  ftAnalyticalAlgorithm: row.ftAnalyticalAlgorithm || '',
  numGrains: row.numGrains || null,
  centralAgeMa: row.centralAgeMa || null,
  centralAgeErrorMa: row.centralAgeUncertaintyMa || null,
  centralAgeUncertaintyType: row.centralAgeUncertaintyType || '',
  pooledAgeMa: row.pooledAgeMa || null,
  pooledAgeErrorMa: row.pooledAgeUncertaintyMa || null,
  pooledAgeUncertaintyType: row.pooledAgeUncertaintyType || '',
  dispersionPct: row.dispersionPct || null,
  pChi2Pct: row.pChi2Pct || null,
  meanTrackLengthUm: row.meanTrackLengthUm || null,
  stdDevTrackLength: row.stdDevTrackLengthUm || null,
  numTrackMeasurements: row.numTrackMeasurements || null,
  zetaValue: row.zetaValue || null,
  zetaUncertainty: row.zetaUncertainty || null,
  zetaUncertaintyType: row.zetaUncertaintyType || '',
  zetaReferenceMaterial: row.zetaReferenceMaterial || '',
  dPar: row.dPar || null,
  dParUncertainty: row.dParUncertainty || null,
  analysisDate: row.analysisDate || '',
  etchingTime: row.etchingTime || null,
  etchingTemperature: row.etchingTemperature || null,
  uPpm: row.uCont || null,
  uErrorPpm: row.uUncertainty || null,
}));

console.log(`Output: ${earthbankFTDatapoints.length} datapoints mapped to earthbank_ftDatapoints schema`);
console.log();

const ftDatapointsCSV = XLSX.utils.json_to_sheet(earthbankFTDatapoints);
const ftDatapointsWorkbookOut = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(ftDatapointsWorkbookOut, ftDatapointsCSV, 'FT Datapoints');
XLSX.writeFile(ftDatapointsWorkbookOut, path.join(OUTPUT_PATH, 'earthbank_ftDatapoints.csv'), { bookType: 'csv' });
console.log(`✅ Written: earthbank_ftDatapoints.csv`);
console.log();

// ============================================================================
// STEP 3: FT COUNT DATA (Grain-level)
// ============================================================================
console.log('STEP 3: Converting FT Count Data (grain-level)...');
console.log('-'.repeat(80));

const ftCountData = XLSX.utils.sheet_to_json(ftWorkbook.Sheets['FTCountData']);
console.log(`Input: ${ftCountData.length} grain count records`);

const earthbankFTCountData = ftCountData.map(row => ({
  datapointName: row.datapointName || '',
  grainID: row.grainName || '',
  rhoS: row.rhoS || null,
  ns: row.ns || null,
  dPar: row.dPar || null,
  dParUncertainty: row.dParUncertainty || null,
}));

console.log(`Output: ${earthbankFTCountData.length} grain records mapped`);
console.log();

const ftCountDataCSV = XLSX.utils.json_to_sheet(earthbankFTCountData);
const ftCountDataWorkbookOut = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(ftCountDataWorkbookOut, ftCountDataCSV, 'FT Count Data');
XLSX.writeFile(ftCountDataWorkbookOut, path.join(OUTPUT_PATH, 'earthbank_ftCountData.csv'), { bookType: 'csv' });
console.log(`✅ Written: earthbank_ftCountData.csv`);
console.log();

// ============================================================================
// STEP 4: FT TRACK LENGTH DATA
// ============================================================================
console.log('STEP 4: Converting FT Track Length Data...');
console.log('-'.repeat(80));

const ftLengthData = XLSX.utils.sheet_to_json(ftWorkbook.Sheets['FTLengthData']);
console.log(`Input: ${ftLengthData.length} track length measurements`);

const earthbankFTLengthData = ftLengthData.map(row => ({
  datapointName: row.datapointName || '',
  trackType: row.trackType || '',
  etchingTime: row.etchingTime || null,
  trackLengthUm: row.trackLength || null,
  cAxisAngle: row.cAxisAngle || null,
  dPar: row.dPar || null,
}));

console.log(`Output: ${earthbankFTLengthData.length} track measurements mapped to earthbank_ftTrackLengthData schema`);
console.log();

const ftLengthDataCSV = XLSX.utils.json_to_sheet(earthbankFTLengthData);
const ftLengthDataWorkbookOut = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(ftLengthDataWorkbookOut, ftLengthDataCSV, 'Track Lengths');
XLSX.writeFile(ftLengthDataWorkbookOut, path.join(OUTPUT_PATH, 'earthbank_ftTrackLengthData.csv'), { bookType: 'csv' });
console.log(`✅ Written: earthbank_ftTrackLengthData.csv`);
console.log();

// ============================================================================
// STEP 5: HE DATAPOINTS
// ============================================================================
console.log('STEP 5: Converting He Datapoints...');
console.log('-'.repeat(80));

const heWorkbook = XLSX.readFile(path.join(BASE_PATH, 'Helium/Helium.xlsx'));
const heDatapointsData = XLSX.utils.sheet_to_json(heWorkbook.Sheets['He Datapoints']);

console.log(`Input: ${heDatapointsData.length} He datapoints (includes standards)`);

// Filter out reference materials (Durango) - keep only sample datapoints
const heDatapointsSamples = heDatapointsData.filter(row => row.sampleName && row.sampleName.trim() !== '');

console.log(`Filtered: ${heDatapointsSamples.length} sample datapoints (excluded ${heDatapointsData.length - heDatapointsSamples.length} standards)`);

const earthbankHeDatapoints = heDatapointsSamples.map(row => ({
  datapointName: row.datapointName || '',
  sampleID: row.sampleName || '',
  laboratory: row.laboratory || '',
  analyst: row.analyst || '',
  mineralType: row.mineral || 'Apatite',
  referenceMaterial: row.referenceMaterial || '',
  batchID: row.batchID || '',
  numAliquots: row.numAliquots || null,
  weightedMeanCorrectedHeAgeMa: row.weightedMeanCorrectedHeAge || null,
  weightedMeanCorrectedHeAgeUncertaintyMa: row.weightedMeanCorrectedHeAgeUncertainty || null,
  weightedMeanCorrectedHeAgeUncertaintyType: row.weightedMeanCorrectedHeAgeUncertaintyType || '',
  meanCorrectedHeAgeMa: row.meanCorrectedHeAge || null,
  meanCorrectedHeAgeUncertaintyMa: row.meanCorrectedHeAgeUncertainty || null,
  meanUncorrectedHeAgeMa: row.meanUncorrectedHeAge || null,
  chiSquare: row.chiSquare || null,
  mswd: row.mswd || null,
  analysisDate: row.analysisDate || '',
}));

console.log(`Output: ${earthbankHeDatapoints.length} datapoints mapped to earthbank_heDatapoints schema`);
console.log();

const heDatapointsCSV = XLSX.utils.json_to_sheet(earthbankHeDatapoints);
const heDatapointsWorkbookOut = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(heDatapointsWorkbookOut, heDatapointsCSV, 'He Datapoints');
XLSX.writeFile(heDatapointsWorkbookOut, path.join(OUTPUT_PATH, 'earthbank_heDatapoints.csv'), { bookType: 'csv' });
console.log(`✅ Written: earthbank_heDatapoints.csv`);
console.log();

// ============================================================================
// STEP 6: HE WHOLE GRAIN DATA
// ============================================================================
console.log('STEP 6: Converting He Whole Grain Data...');
console.log('-'.repeat(80));

const heWholeGrainData = XLSX.utils.sheet_to_json(heWorkbook.Sheets['HeWholeGrain']);
console.log(`Input: ${heWholeGrainData.length} He aliquots/grains`);

const earthbankHeWholeGrain = heWholeGrainData.map(row => ({
  datapointName: row.datapointName || '',
  grainID: row.aliquotID || '',
  aliquotType: row.aliquotType || '',
  aliquotMorphology: row.aliquotMorphology || '',
  grainLengthUm: row.aliquotLength || null,
  grainWidthUm: row.aliquotWidth || null,
  ftValue: row.ft || null,
  rSV: row.rSV || null,
  grainMassUg: row.aliquotMass || null,
  he4Amount: row.he4Amount || null,
  he4Uncertainty: row.he4Uncertainty || null,
  uPpm: row.uCont || null,
  uUncertainty: row.uUncertainty || null,
  thPpm: row.thCont || null,
  thUncertainty: row.thUncertainty || null,
  smPpm: row.smCont || null,
  smUncertainty: row.smUncertainty || null,
  eUPpm: row.eU || null,
  rawHeAgeMa: row.rawHeAgeMa || null,
  rawHeAgeUncertaintyMa: row.rawHeAgeUncertaintyMa || null,
  correctedHeAgeMa: row.correctedHeAgeMa || null,
  correctedHeAgeUncertaintyMa: row.correctedHeAgeUncertaintyMa || null,
}));

console.log(`Output: ${earthbankHeWholeGrain.length} grains mapped to earthbank_heWholeGrainData schema`);
console.log();

const heWholeGrainCSV = XLSX.utils.json_to_sheet(earthbankHeWholeGrain);
const heWholeGrainWorkbookOut = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(heWholeGrainWorkbookOut, heWholeGrainCSV, 'He Whole Grain');
XLSX.writeFile(heWholeGrainWorkbookOut, path.join(OUTPUT_PATH, 'earthbank_heWholeGrainData.csv'), { bookType: 'csv' });
console.log(`✅ Written: earthbank_heWholeGrainData.csv`);
console.log();

// ============================================================================
// SUMMARY
// ============================================================================
console.log('='.repeat(80));
console.log('CONVERSION COMPLETE');
console.log('='.repeat(80));
console.log();
console.log('Generated FAIR CSV files:');
console.log(`  1. earthbank_samples.csv              (${earthbankSamples.length} rows)`);
console.log(`  2. earthbank_ftDatapoints.csv         (${earthbankFTDatapoints.length} rows)`);
console.log(`  3. earthbank_ftCountData.csv          (${earthbankFTCountData.length} rows)`);
console.log(`  4. earthbank_ftTrackLengthData.csv    (${earthbankFTLengthData.length} rows)`);
console.log(`  5. earthbank_heDatapoints.csv         (${earthbankHeDatapoints.length} rows)`);
console.log(`  6. earthbank_heWholeGrainData.csv     (${earthbankHeWholeGrain.length} rows)`);
console.log();
console.log(`Total records: ${earthbankSamples.length + earthbankFTDatapoints.length + earthbankFTCountData.length + earthbankFTLengthData.length + earthbankHeDatapoints.length + earthbankHeWholeGrain.length}`);
console.log();
console.log(`Output directory: ${OUTPUT_PATH}`);
console.log();
