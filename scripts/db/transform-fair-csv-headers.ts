#!/usr/bin/env tsx
/**
 * Transform FAIR CSV headers from snake_case to EarthBank canonical camelCase
 *
 * Usage: npx tsx scripts/db/transform-fair-csv-headers.ts
 */

import * as fs from 'fs';
import * as path from 'path';

// Comprehensive mapping to EarthBank canonical camelCase
// Handles: snake_case, Title_Case, Display Names (with spaces)
const HEADER_MAPPING: Record<string, string> = {
  // Sample fields (multiple input formats)
  'sample_id': 'sampleID',
  'Sample': 'sampleID',
  'Sample ID': 'sampleID',

  'dataset_id': 'datasetID',
  'IGSN': 'IGSN',  // Keep uppercase

  'latitude': 'latitude',
  'Latitude': 'latitude',

  'longitude': 'longitude',
  'Longitude': 'longitude',

  'elevation_m': 'elevationM',
  'Elevation_m': 'elevationM',
  'Elevation (m)': 'elevationM',
  'Elevation': 'elevationM',

  'geodetic_datum': 'geodeticDatum',
  'Geodetic_Datum': 'geodeticDatum',

  'vertical_datum': 'verticalDatum',
  'Vertical_Datum': 'verticalDatum',

  'mineral': 'mineral',
  'Mineral': 'mineral',
  'mineral_type': 'mineral',

  'lithology': 'lithology',
  'Lithology': 'lithology',

  'sample_kind': 'sampleKind',
  'Sample_Kind': 'sampleKind',

  'sample_age_ma': 'sampleAgeMa',
  'Sample_Age_Ma': 'sampleAgeMa',

  'collector': 'collector',
  'Collector': 'collector',

  'collection_date': 'collectionDate',
  'Collection_Date': 'collectionDate',
  'collection_year': 'collectionYear',
  'Collection_Year': 'collectionYear',

  'n_aft_grains': 'nAFTGrains',
  'n_ahe_grains': 'nAHeGrains',

  'quadrangle': 'quadrangle',
  'Quadrangle': 'quadrangle',

  'fault_block': 'faultBlock',
  'Fault_Block': 'faultBlock',

  'igneous_age_ma': 'igneousAgeMa',
  'Igneous_Age_Ma': 'igneousAgeMa',

  'igneous_age_error_ma': 'igneousAgeErrorMa',
  'Igneous_Age_Error_Ma': 'igneousAgeErrorMa',

  'project': 'project',
  'Project': 'project',

  'country': 'country',
  'Country': 'country',

  'state_province': 'stateProvince',
  'State_Province': 'stateProvince',

  'location_description': 'locationDescription',
  'Location_Description': 'locationDescription',

  // FT Datapoint fields (multiple input formats)
  'datapoint_key': 'datapointName',
  'Datapoint_Key': 'datapointName',
  'Datapoint_ID': 'datapointName',

  'ft_method': 'ftMethod',
  'Method': 'ftMethod',

  'laboratory': 'laboratory',
  'Laboratory': 'laboratory',
  'Lab_No': 'labNumber',

  'analyst': 'analyst',
  'Analyst': 'analyst',

  'analysis_date': 'analysisDate',
  'Analysis_Date': 'analysisDate',

  'n_grains': 'nGrains',
  'Num_Grains': 'nGrains',

  'total_ns': 'totalNs',
  'Ns': 'totalNs',

  'mean_rho_s': 'rhoS',

  'mean_u_ppm': 'uPpm',
  'U_ppm': 'uPpm',

  'sd_u_ppm': 'uPpmStdDev',

  'mean_dpar_um': 'dPar',
  'Mean_Dpar_um': 'dPar',

  'se_dpar_um': 'dParUncertainty',

  'p_chi2_pct': 'pChi2',
  'Chi2_Probability': 'pChi2',

  'dispersion_pct': 'dispersion',
  'Dispersion_Pct': 'dispersion',

  'pooled_age_ma': 'pooledAgeMa',
  'Pooled_Age_Ma': 'pooledAgeMa',

  'pooled_age_error_ma': 'pooledAgeUncertainty',
  'Pooled_Age_1s_Ma': 'pooledAgeUncertainty',

  'central_age_ma': 'centralAgeMa',
  'Central_Age_Ma': 'centralAgeMa',

  'central_age_error_ma': 'centralAgeUncertainty',
  'Central_Age_1s_Ma': 'centralAgeUncertainty',

  'mean_track_length_um': 'mtl',
  'Mean_Track_Length_um': 'mtl',

  'mean_track_length_1s_um': 'mtlUncertainty',
  'Mean_Track_Length_1s_um': 'mtlUncertainty',

  'sd_track_length_um': 'stdDevMu',
  'SD_Track_Length_um': 'stdDevMu',

  'n_track_measurements': 'nTracks',
  'Num_Tracks': 'nTracks',

  'Sigma_P_Omega_cm2': 'sigmaP',
  'Sigma_P_Omega_Error_cm2': 'sigmaPError',
  'P_Zeta': 'zeta',
  'P_Zeta_1s': 'zetaUncertainty',

  // FT Track Length fields
  'grain_id': 'grainName',
  'track_id': 'trackID',
  'track_type': 'trackType',
  'apparent_length_um': 'lengthUm',
  'angle_to_c_axis_deg': 'cAxisAngleDeg',
  'dpar_um': 'dPar',

  // (U-Th)/He datapoint fields (multiple input formats)
  'Mean_Corrected_Age_Ma': 'meanCorrectedAgeMa',
  'Mean_Corrected_Age_1s_Ma': 'meanCorrectedAgeUncertainty',
  'Mean_Uncorrected_Age_Ma': 'meanUncorrectedAgeMa',
  'Notes': 'notes',

  // (U-Th)/He grain-level fields
  'Grain_ID': 'grainName',

  'Corrected_Age_Ma': 'correctedHeAge',
  'he4_corr_age_ma': 'correctedHeAge',

  'Corrected_Age_1s_Ma': 'correctedHeAgeUncertainty',
  'he4_corr_age_error_ma': 'correctedHeAgeUncertainty',

  'Raw_Age_Ma': 'uncorrectedHeAge',
  'he4_uncorr_age_ma': 'uncorrectedHeAge',

  'Raw_Age_1s_Ma': 'uncorrectedHeAgeUncertainty',
  'he4_uncorr_age_error_ma': 'uncorrectedHeAgeUncertainty',

  'FT': 'ft',
  'ft_value': 'ft',

  'He_nmol_g': 'heNmolG',
  'He_nmol_g_1s': 'heNmolGUncertainty',

  'He_ncc': 'he4Concentration',
  'he4_ncc': 'he4Concentration',
  'He_ncc_1s': 'he4ConcentrationUncertainty',

  'U_ppm': 'uConcentration',
  'u_ppm': 'uConcentration',
  'U_ppm_1s': 'uConcentrationUncertainty',

  'U_ng': 'uNg',
  'U_ng_1s': 'uNgUncertainty',

  'Th_ppm': 'thConcentration',
  'th_ppm': 'thConcentration',
  'Th_ppm_1s': 'thConcentrationUncertainty',

  'Th_ng': 'thNg',
  'Th_ng_1s': 'thNgUncertainty',

  'Sm_ppm': 'smConcentration',
  'sm_ppm': 'smConcentration',
  'Sm_ppm_1s': 'smConcentrationUncertainty',

  'Sm_ng': 'smNg',
  'Sm_ng_1s': 'smNgUncertainty',

  'eU_ppm': 'eU',
  'eu_ppm': 'eU',
  'eU_ppm_1s': 'eUUncertainty',

  'Rs_um': 'rsUm',

  'Mass_mg': 'massMg',
  'mass_mg': 'massMg',

  'Geometry': 'geometry',
  'Length_um': 'lengthUm',
  'Width_um': 'widthUm',

  'FT_U238': 'ftU238',
  'FT_U235': 'ftU235',
  'FT_Th232': 'ftTh232',
  'FT_Sm147': 'ftSm147',

  'Num_Pits': 'numPits',
};

function transformCSVHeaders(inputPath: string, outputPath: string): void {
  console.log(`\n📄 Processing: ${path.basename(inputPath)}`);

  // Read CSV file
  const content = fs.readFileSync(inputPath, 'utf-8');
  const lines = content.split('\n');

  if (lines.length === 0) {
    console.log('   ⚠️  Empty file - skipping');
    return;
  }

  // Transform header row
  const oldHeaders = lines[0].split(',');
  const newHeaders = oldHeaders.map(header => {
    const trimmed = header.trim();
    const mapped = HEADER_MAPPING[trimmed];

    if (mapped) {
      console.log(`   ✓ ${trimmed} → ${mapped}`);
      return mapped;
    } else if (trimmed === '') {
      return '';
    } else {
      console.log(`   ⚠️  No mapping for: ${trimmed} (keeping as-is)`);
      return trimmed;
    }
  });

  // Reconstruct CSV with new headers
  lines[0] = newHeaders.join(',');
  const transformedContent = lines.join('\n');

  // Write to output
  fs.writeFileSync(outputPath, transformedContent, 'utf-8');
  console.log(`   ✅ Saved: ${path.basename(outputPath)}`);
}

// Process all 3 FAIR datasets
const datasets = [
  {
    name: 'Malawi Rift',
    path: 'build-data/learning/thermo-papers/Malawi-Rift-Footwall-Exhumation/FAIR',
    files: [
      'earthbank_samples_complete.csv',
      'earthbank_ft_datapoints_complete.csv',
      'earthbank_ft_track_length_data_complete.csv',
      'earthbank_he_whole_grain_complete.csv'
    ]
  },
  {
    name: 'Peak 2021 (Grand Canyon)',
    path: 'build-data/learning/thermo-papers/Peak(2021)-Grand-Canyon-Great-Unconformity-Geology/FAIR',
    files: [
      'earthbank_samples.csv',
      'earthbank_he_datapoints.csv',
      'earthbank_he_whole_grain_data.csv'
    ]
  },
  {
    name: 'Dusel-Bacon 2015 (Alaska)',
    path: 'build-data/learning/thermo-papers/Dusel-Bacon(2015)-AFT-regional-exhumation-subtropical-Eocene-Alaska-CJES/FAIR',
    files: [
      'earthbank_samples.csv',
      'earthbank_ft_datapoints.csv'
    ]
  }
];

console.log('🔄 Transforming FAIR CSV Headers: snake_case → camelCase');
console.log('══════════════════════════════════════════════════════\n');

let totalFiles = 0;
let totalTransformations = 0;

for (const dataset of datasets) {
  console.log(`\n📦 Dataset: ${dataset.name}`);
  console.log(`📁 Path: ${dataset.path}`);

  for (const filename of dataset.files) {
    const inputPath = path.join(dataset.path, filename);
    const outputPath = path.join(dataset.path, filename); // Overwrite in place

    if (!fs.existsSync(inputPath)) {
      console.log(`\n📄 ${filename}`);
      console.log(`   ⚠️  File not found - skipping`);
      continue;
    }

    transformCSVHeaders(inputPath, outputPath);
    totalFiles++;
  }
}

console.log('\n══════════════════════════════════════════════════════');
console.log(`✅ Transformation complete!`);
console.log(`📊 Files processed: ${totalFiles}`);
console.log('\n🎯 Next steps:');
console.log('   1. Review transformed CSV headers');
console.log('   2. Create EarthBank schema tables (Phase 2)');
console.log('   3. Import CSVs directly into new tables');
