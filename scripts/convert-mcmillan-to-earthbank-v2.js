const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const BASE_PATH = '/Users/keithdimech/Pathway/Dev/Clair/Thermo-App/build-data/learning/thermo-papers/McMillan(2024)-4D-Fault-Evolution-Malawi-Rift/Supplementary/Malawi Rift Usisya Border Fault Footwall Thermochronology';
const OUTPUT_PATH = '/Users/keithdimech/Pathway/Dev/Clair/Thermo-App/build-data/learning/thermo-papers/McMillan(2024)-4D-Fault-Evolution-Malawi-Rift/FAIR';

console.log('='.repeat(80));
console.log('MCMILLAN(2024) SUPPLEMENTARY → EARTHBANK SCHEMA CONVERSION (v2 - CORRECTED)');
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

// Map to earthbank_samples schema (exact column names)
const earthbankSamples = samplesData.map(row => ({
  sampleID: row.sampleName || '',
  IGSN: row.igsn || '',
  latitude: row.latitude || null,
  longitude: row.longitude || null,
  elevationM: row.elevationGround || null,
  geodeticDatum: row.geodeticDatum || 'WGS84',
  verticalDatum: row.verticalDatum || 'mean sea level',
  mineral: 'apatite',
  mineralType: 'apatite',
  lithology: row.material || '',
  sampleKind: row.sampleKind || 'Rock',
  datasetID: '', // Will be filled after creating dataset entry
  locationDescription: row.locationDescription || '',
}));

console.log(`Output: ${earthbankSamples.length} samples mapped to earthbank_samples schema`);
console.log();

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

// Map to earthbank_ftDatapoints schema (exact column names from source)
const earthbankFTDatapoints = ftDatapointsData.map(row => ({
  datapointName: row.datapointName || '',
  sampleID: row.sampleName || '',
  laboratory: row.laboratory || '',
  analyst: row.analyst || '',
  ftMethod: row.ftCharacterisationMethod || '',
  mineralType: row.mineral || 'Apatite',
  nGrains: row.noOfGrains || null,
  totalNs: row.ns || null,
  rhoS: row.rhoS || null,
  centralAgeMa: row.centralAgeMa || null,
  centralAgeUncertainty: row.centralAgeUncertaintyMa || null,
  dispersion: row.dispersion || null,
  pChi2: row.chi2pct || null,
  mtl: row.mtl || null,
  mtlUncertainty: row.mtl1se || null,
  stdDevMu: row.stdDevMu || null,
  nTracks: row.nTracks || null,
  dPar: row.dPar || null,
  dParUncertainty: row.dParStandardError || null,
  uPpm: row.uCont || null,
  uPpmStdDev: row.uStandardDeviation || null,
  zeta: row.zetaCalibration || null,
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
// STEP 3: FT TRACK LENGTH DATA
// ============================================================================
console.log('STEP 3: Converting FT Track Length Data...');
console.log('-'.repeat(80));

const ftLengthData = XLSX.utils.sheet_to_json(ftWorkbook.Sheets['FTLengthData']);
console.log(`Input: ${ftLengthData.length} track length measurements`);

// Map to earthbank_ftTrackLengthData schema (exact column names)
const earthbankFTLengthData = ftLengthData.map(row => ({
  datapointName: row.datapointName || '',
  trackType: row.trackType || '',
  lengthUm: row.trackLength || null,
  cAxisAngleDeg: row.cAxisAngle || null,
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
// STEP 4: HE DATAPOINTS
// ============================================================================
console.log('STEP 4: Converting He Datapoints...');
console.log('-'.repeat(80));

const heWorkbook = XLSX.readFile(path.join(BASE_PATH, 'Helium/Helium.xlsx'));
const heDatapointsData = XLSX.utils.sheet_to_json(heWorkbook.Sheets['He Datapoints']);

console.log(`Input: ${heDatapointsData.length} He datapoints (includes standards)`);

// Filter out reference materials (Durango) - keep only sample datapoints
const heDatapointsSamples = heDatapointsData.filter(row => row.sampleName && row.sampleName.trim() !== '');

console.log(`Filtered: ${heDatapointsSamples.length} sample datapoints (excluded ${heDatapointsData.length - heDatapointsSamples.length} standards)`);

// Map to earthbank_heDatapoints schema (exact column names)
const earthbankHeDatapoints = heDatapointsSamples.map(row => ({
  datapointName: row.datapointName || '',
  sampleID: row.sampleName || '',
  laboratory: row.laboratory || '',
  analyst: row.analyst || '',
  nGrains: row.numAliquots || null,
  meanCorrectedAgeMa: row.weightedMeanCorrectedHeAge || row.meanCorrectedHeAge || null,
  meanCorrectedAgeUncertainty: row.weightedMeanCorrectedHeAgeUncertainty || row.meanCorrectedHeAgeUncertainty || null,
  meanUncorrectedAgeMa: row.meanUncorrectedHeAge || null,
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
// STEP 5: HE WHOLE GRAIN DATA
// ============================================================================
console.log('STEP 5: Converting He Whole Grain Data...');
console.log('-'.repeat(80));

const heWholeGrainData = XLSX.utils.sheet_to_json(heWorkbook.Sheets['HeWholeGrain']);
console.log(`Input: ${heWholeGrainData.length} He aliquots/grains`);

// Map to earthbank_heWholeGrainData schema (exact column names)
const earthbankHeWholeGrain = heWholeGrainData.map(row => ({
  datapointName: row.datapointName || '',
  grainName: row.aliquotID ? String(row.aliquotID) : '',
  correctedHeAge: row.correctedHeAgeMa || null,
  correctedHeAgeUncertainty: row.correctedHeAgeUncertaintyMa || null,
  uncorrectedHeAge: row.rawHeAgeMa || null,
  uncorrectedHeAgeUncertainty: row.rawHeAgeUncertaintyMa || null,
  ft: row.ft || null,
  rsUm: row.rSV || null,
  massMg: row.aliquotMass ? row.aliquotMass / 1000 : null, // Convert µg to mg
  heNmolG: row.he4Amount || null,
  uConcentration: row.uCont || null,
  uConcentrationUncertainty: row.uUncertainty || null,
  thConcentration: row.thCont || null,
  thConcentrationUncertainty: row.thUncertainty || null,
  smConcentration: row.smCont || null,
  smConcentrationUncertainty: row.smUncertainty || null,
  eU: row.eU || null,
  lengthUm: row.aliquotLength || null,
  widthUm: row.aliquotWidth || null,
  geometry: row.aliquotMorphology || '',
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
console.log('CONVERSION COMPLETE (v2 - CORRECTED COLUMN NAMES)');
console.log('='.repeat(80));
console.log();
console.log('Generated FAIR CSV files with database-aligned column names:');
console.log(`  1. earthbank_samples.csv              (${earthbankSamples.length} rows)`);
console.log(`  2. earthbank_ftDatapoints.csv         (${earthbankFTDatapoints.length} rows)`);
console.log(`  3. earthbank_ftTrackLengthData.csv    (${earthbankFTLengthData.length} rows)`);
console.log(`  4. earthbank_heDatapoints.csv         (${earthbankHeDatapoints.length} rows)`);
console.log(`  5. earthbank_heWholeGrainData.csv     (${earthbankHeWholeGrain.length} rows)`);
console.log();
console.log(`Total records: ${earthbankSamples.length + earthbankFTDatapoints.length + earthbankFTLengthData.length + earthbankHeDatapoints.length + earthbankHeWholeGrain.length}`);
console.log();
console.log(`Output directory: ${OUTPUT_PATH}`);
console.log();
console.log('Next step: Run inspect-earthbank-mappings.js to verify alignment');
console.log();
