#!/usr/bin/env npx tsx
/**
 * Clean He CSV data to fix import issues
 *
 * Issues fixed:
 * 1. Peak heDatapoints: analysisDate "2020" → "2020-01-01" (full ISO date)
 * 2. Peak heWholeGrainData: numPits "2.0" → "2" (integer format)
 * 3. Malawi heWholeGrainData: Empty sampleID and grainName (generate placeholders)
 */

import fs from 'fs';
import path from 'path';

const BASE_DIR = '/Users/keithdimech/Pathway/Dev/Clair/Thermo-App/build-data/learning/thermo-papers';

// File paths
const files = {
  peakHeDatapoints: path.join(BASE_DIR, 'Peak(2021)-Grand-Canyon-Great-Unconformity-Geology/FAIR/earthbank_he_datapoints.csv'),
  peakHeWholeGrain: path.join(BASE_DIR, 'Peak(2021)-Grand-Canyon-Great-Unconformity-Geology/FAIR/earthbank_he_whole_grain_data.csv'),
  malawiHeWholeGrain: path.join(BASE_DIR, 'Malawi-Rift-Footwall-Exhumation/FAIR/earthbank_he_whole_grain_complete.csv'),
};

console.log('🧹 Cleaning He CSV data...\n');

// =======================
// 1. Peak heDatapoints - Fix timestamp format
// =======================
console.log('📅 Fixing Peak heDatapoints timestamp format...');
const peakHeDatapointsContent = fs.readFileSync(files.peakHeDatapoints, 'utf-8');
const peakHeDatapointsLines = peakHeDatapointsContent.split('\n');
const peakHeDatapointsHeader = peakHeDatapointsLines[0];
const peakHeDatapointsCols = peakHeDatapointsHeader.split(',');
const analysisDateIdx = peakHeDatapointsCols.indexOf('analysisDate');

console.log(`  - Found analysisDate at column ${analysisDateIdx}`);

const peakHeDatapointsFixed = [peakHeDatapointsHeader];
let timestampFixCount = 0;

for (let i = 1; i < peakHeDatapointsLines.length; i++) {
  const line = peakHeDatapointsLines[i];
  if (!line.trim()) continue;

  const cols = line.split(',');

  // Fix year-only dates: "2020" → "2020-01-01"
  if (cols[analysisDateIdx] && /^\d{4}$/.test(cols[analysisDateIdx].trim())) {
    cols[analysisDateIdx] = `${cols[analysisDateIdx]}-01-01`;
    timestampFixCount++;
  }

  peakHeDatapointsFixed.push(cols.join(','));
}

fs.writeFileSync(files.peakHeDatapoints, peakHeDatapointsFixed.join('\n'));
console.log(`  ✅ Fixed ${timestampFixCount} timestamp values\n`);

// =======================
// 2. Peak heWholeGrainData - Fix decimal integers
// =======================
console.log('🔢 Fixing Peak heWholeGrainData decimal integers...');
const peakHeWholeGrainContent = fs.readFileSync(files.peakHeWholeGrain, 'utf-8');
const peakHeWholeGrainLines = peakHeWholeGrainContent.split('\n');
const peakHeWholeGrainHeader = peakHeWholeGrainLines[0];
const peakHeWholeGrainCols = peakHeWholeGrainHeader.split(',');
const numPitsIdx = peakHeWholeGrainCols.indexOf('numPits');

console.log(`  - Found numPits at column ${numPitsIdx}`);

const peakHeWholeGrainFixed = [peakHeWholeGrainHeader];
let decimalFixCount = 0;

for (let i = 1; i < peakHeWholeGrainLines.length; i++) {
  const line = peakHeWholeGrainLines[i];
  if (!line.trim()) continue;

  const cols = line.split(',');

  // Fix decimal integers: "2.0" → "2"
  if (cols[numPitsIdx] && /^\d+\.0+$/.test(cols[numPitsIdx].trim())) {
    cols[numPitsIdx] = Math.floor(parseFloat(cols[numPitsIdx])).toString();
    decimalFixCount++;
  }

  peakHeWholeGrainFixed.push(cols.join(','));
}

fs.writeFileSync(files.peakHeWholeGrain, peakHeWholeGrainFixed.join('\n'));
console.log(`  ✅ Fixed ${decimalFixCount} decimal integer values\n`);

// =======================
// 3. Malawi heWholeGrainData - Fix empty fields
// =======================
console.log('🔧 Fixing Malawi heWholeGrainData empty fields...');
const malawiHeWholeGrainContent = fs.readFileSync(files.malawiHeWholeGrain, 'utf-8');
const malawiHeWholeGrainLines = malawiHeWholeGrainContent.split('\n');
const malawiHeWholeGrainHeader = malawiHeWholeGrainLines[0];
const malawiHeWholeGrainCols = malawiHeWholeGrainHeader.split(',');

const sampleIDIdx = malawiHeWholeGrainCols.indexOf('sampleID');
const datapointNameIdx = malawiHeWholeGrainCols.indexOf('datapointName');
const grainNameIdx = malawiHeWholeGrainCols.indexOf('grainName');

console.log(`  - Found sampleID at column ${sampleIDIdx}`);
console.log(`  - Found datapointName at column ${datapointNameIdx}`);
console.log(`  - Found grainName at column ${grainNameIdx}`);

const malawiHeWholeGrainFixed = [malawiHeWholeGrainHeader];
let sampleIDFixCount = 0;
let datapointNameFixCount = 0;
let grainNameFixCount = 0;
let grainCounter = 1;

for (let i = 1; i < malawiHeWholeGrainLines.length; i++) {
  const line = malawiHeWholeGrainLines[i];
  if (!line.trim()) continue;

  const cols = line.split(',');

  // Fix empty sampleID (use "MALAWI_UNKNOWN")
  if (!cols[sampleIDIdx] || cols[sampleIDIdx].trim() === '') {
    cols[sampleIDIdx] = 'MALAWI_UNKNOWN';
    sampleIDFixCount++;
  }

  // Fix empty datapointName (use "undefined_HE001" from data)
  if (!cols[datapointNameIdx] || cols[datapointNameIdx].trim() === '') {
    cols[datapointNameIdx] = 'undefined_HE001';
    datapointNameFixCount++;
  }

  // Fix empty grainName (generate unique grain IDs)
  if (!cols[grainNameIdx] || cols[grainNameIdx].trim() === '') {
    cols[grainNameIdx] = `grain_${String(grainCounter).padStart(3, '0')}`;
    grainNameFixCount++;
    grainCounter++;
  }

  malawiHeWholeGrainFixed.push(cols.join(','));
}

fs.writeFileSync(files.malawiHeWholeGrain, malawiHeWholeGrainFixed.join('\n'));
console.log(`  ✅ Fixed ${sampleIDFixCount} empty sampleID values`);
console.log(`  ✅ Fixed ${datapointNameFixCount} empty datapointName values`);
console.log(`  ✅ Fixed ${grainNameFixCount} empty grainName values\n`);

// =======================
// Summary
// =======================
console.log('✅ All He CSV data cleaned successfully!\n');
console.log('Summary:');
console.log(`  - Peak heDatapoints: ${timestampFixCount} timestamps fixed`);
console.log(`  - Peak heWholeGrainData: ${decimalFixCount} decimal integers fixed`);
console.log(`  - Malawi heWholeGrainData: ${sampleIDFixCount + datapointNameFixCount + grainNameFixCount} empty fields fixed`);
console.log('\n✅ Ready for CSV import!');
