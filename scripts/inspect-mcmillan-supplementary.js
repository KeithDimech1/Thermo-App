const XLSX = require('xlsx');
const path = require('path');

const BASE_PATH = '/Users/keithdimech/Pathway/Dev/Clair/Thermo-App/build-data/learning/thermo-papers/McMillan(2024)-4D-Fault-Evolution-Malawi-Rift/Supplementary/Malawi Rift Usisya Border Fault Footwall Thermochronology';

const files = [
  { name: 'Samples', path: path.join(BASE_PATH, 'Samples/Samples.xlsx') },
  { name: 'Fission Track', path: path.join(BASE_PATH, 'Fission Track/Fission Track.xlsx') },
  { name: 'Helium', path: path.join(BASE_PATH, 'Helium/Helium.xlsx') },
  { name: 'Geochem', path: path.join(BASE_PATH, 'Geochem/Geochem.xlsx') },
];

console.log('='.repeat(80));
console.log('MCMILLAN(2024) SUPPLEMENTARY DATA INSPECTION');
console.log('='.repeat(80));
console.log();

files.forEach(({ name, path: filePath }) => {
  console.log('-'.repeat(80));
  console.log(`FILE: ${name}`);
  console.log('-'.repeat(80));

  try {
    const workbook = XLSX.readFile(filePath);
    console.log(`Sheets (${workbook.SheetNames.length}): ${workbook.SheetNames.join(', ')}`);
    console.log();

    workbook.SheetNames.forEach(sheetName => {
      const sheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(sheet);

      console.log(`  Sheet: "${sheetName}"`);
      console.log(`    Rows: ${data.length}`);

      if (data.length > 0) {
        const columns = Object.keys(data[0]);
        console.log(`    Columns (${columns.length}): ${columns.slice(0, 10).join(', ')}${columns.length > 10 ? '...' : ''}`);
        console.log(`    Preview (first row):`);
        const firstRow = data[0];
        Object.entries(firstRow).slice(0, 8).forEach(([key, value]) => {
          console.log(`      ${key}: ${value}`);
        });
      }
      console.log();
    });
  } catch (error) {
    console.log(`  ERROR: ${error.message}`);
    console.log();
  }
});

console.log('='.repeat(80));
