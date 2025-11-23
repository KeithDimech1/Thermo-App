/**
 * Transform RAW Malawi data to FAIR format and import to database
 *
 * Reads:
 * - table1-aft-results.csv (35 AFT samples)
 * - tableA2.csv (1027 track lengths)
 * - table2-uthe-results-part1.csv (64 He grains)
 * - tableA3-durango-qc.csv (10 QC standards)
 *
 * Creates FAIR exports and imports to Supabase database
 */

import { readFileSync, writeFileSync } from 'fs';
import { parse } from 'csv-parse/sync';
import { stringify } from 'csv-stringify/sync';
import { query } from '../../lib/db/connection';

const RAW_DIR = 'build-data/learning/thermo-papers/Malawi-Rift-Footwall-Exhumation/RAW';
const FAIR_DIR = 'build-data/learning/thermo-papers/Malawi-Rift-Footwall-Exhumation/FAIR';

interface RawAFT {
  Sample_No: string;
  No_of_grains: number;
  Ns: number;
  rho_s_105_cm2: number;
  U238_ppm: number;
  U238_error: number;
  Th232_ppm: number;
  Th232_error: number;
  eU_ppm: number;
  eU_error: number;
  P_chi2_pct: number;
  Disp_pct: number;
  Pooled_age_Ma: number;
  Pooled_age_error_Ma: number;
  Central_age_Ma: number;
  Central_age_error_Ma: number;
  Dpar_um: number;
  Dpar_error_um: number;
  rmr0: number;
  rmr0D: number;
  Cl_wt_pct: number;
  eCl_apfu: number;
  Nlength: number;
  Mean_track_length_um: number;
  MTL_error_um: number;
  MTL_StDev_um: number;
}

interface RawTrackLength {
  Sample: string;
  Grain_id: string;
  Track_id: string;
  Length_um: number;
  Angle_deg: number;
  Dpar_um: number;
}

interface RawHeGrain {
  sample_id: string;
  lab_number: string;
  batch_id: string;
  He4_ncc: number;
  mass_mg: number;
  U_ppm: number;
  Th_ppm: number;
  Sm_ppm: number;
  eU_ppm: number;
  raw_age_Ma: number;
  raw_age_error_Ma: number;
  Ft: number;
  corr_age_Ma: number;
  corr_age_error_Ma: number;
}

async function main() {
  console.log('🚀 Starting FAIR transformation and import\n');

  // Step 1: Read RAW data
  console.log('📖 Step 1: Reading RAW CSV files...');

  const aftRaw = parse(readFileSync(`${RAW_DIR}/table1-aft-results.csv`), {
    columns: true,
    skip_empty_lines: true,
    relax_column_count: true,
    trim: true
  }) as RawAFT[];
  console.log(`   ✓ AFT results: ${aftRaw.length} samples`);

  const trackLengthsRaw = parse(readFileSync(`${RAW_DIR}/tableA2.csv`), {
    columns: true,
    skip_empty_lines: true,
    relax_column_count: true,
    trim: true
  }) as RawTrackLength[];
  console.log(`   ✓ Track lengths: ${trackLengthsRaw.length} measurements`);

  const heGrainsRaw = parse(readFileSync(`${RAW_DIR}/table2-uthe-results-part1.csv`), {
    columns: true,
    skip_empty_lines: true,
    relax_column_count: true,
    trim: true
  }) as RawHeGrain[];
  console.log(`   ✓ (U-Th)/He grains: ${heGrainsRaw.length} grains`);

  // Step 2: Transform to FAIR format
  console.log('\n🔄 Step 2: Transforming to FAIR format...');

  // 2a. Create samples.csv
  const uniqueSamples = [...new Set(aftRaw.map(r => r.Sample_No))];
  const samplesFair = uniqueSamples.map(sampleId => {
    const aftData = aftRaw.find(r => r.Sample_No === sampleId);
    return {
      sample_id: sampleId,
      dataset_id: 5, // Malawi Rift dataset
      mineral_type: 'apatite',
      lithology: 'Precambrian basement',
      latitude: -13.5, // Approximate - would need exact coordinates from paper
      longitude: 34.8,
      n_aft_grains: aftData?.No_of_grains || 0,
      n_ahe_grains: heGrainsRaw.filter(g => g.sample_id === sampleId).length
    };
  });
  writeFileSync(`${FAIR_DIR}/earthbank_samples_complete.csv`, stringify(samplesFair, { header: true }));
  console.log(`   ✓ Samples: ${samplesFair.length} samples → earthbank_samples_complete.csv`);

  // Helper to parse number or null
  const parseNum = (val: any): number | null => {
    if (val === '' || val === null || val === undefined) return null;
    const num = Number(val);
    return isNaN(num) ? null : num;
  };

  // 2b. Create ft_datapoints.csv
  const ftDatapointsFair = aftRaw.map(row => ({
    sample_id: row.Sample_No,
    datapoint_key: `${row.Sample_No}_DP001`,
    laboratory: 'University of Melbourne',
    ft_method: 'LA-ICP-MS',
    n_grains: parseNum(row.No_of_grains),
    total_ns: parseNum(row.Ns),
    mean_rho_s: parseNum(row.rho_s_105_cm2),
    mean_u_ppm: parseNum(row.U238_ppm),
    sd_u_ppm: parseNum(row.U238_error),
    mean_dpar_um: parseNum(row.Dpar_um),
    se_dpar_um: parseNum(row.Dpar_error_um),
    p_chi2_pct: parseNum(row.P_chi2_pct),
    dispersion_pct: parseNum(row.Disp_pct),
    pooled_age_ma: parseNum(row.Pooled_age_Ma),
    pooled_age_error_ma: parseNum(row.Pooled_age_error_Ma),
    central_age_ma: parseNum(row.Central_age_Ma),
    central_age_error_ma: parseNum(row.Central_age_error_Ma),
    mean_track_length_um: parseNum(row.Mean_track_length_um),
    sd_track_length_um: parseNum(row.MTL_StDev_um),
    n_track_measurements: parseNum(row.Nlength),
    mineral_type: 'apatite'
  }));
  writeFileSync(`${FAIR_DIR}/earthbank_ft_datapoints_complete.csv`, stringify(ftDatapointsFair, { header: true }));
  console.log(`   ✓ FT Datapoints: ${ftDatapointsFair.length} datapoints → earthbank_ft_datapoints_complete.csv`);

  // 2c. Create ft_track_length_data.csv (filter out reference materials)
  const trackLengthsFair = trackLengthsRaw
    .filter(row => {
      // Only include tracks from actual samples (MU19-XX format), not reference materials
      return row.Sample && row.Sample.match(/^MU\d+-\d+$/);
    })
    .map((row, idx) => ({
      sample_id: row.Sample,
      datapoint_key: `${row.Sample}_DP001`,
      grain_id: row.Grain_id || `GRAIN_${idx + 1}`, // Provide default if missing
      track_id: row.Track_id || `TRK_${idx + 1}`,
      track_type: 'confined',
      apparent_length_um: parseNum(row.Length_um),
      angle_to_c_axis_deg: parseNum(row.Angle_deg),
      dpar_um: parseNum(row.Dpar_um)
    }));
  writeFileSync(`${FAIR_DIR}/earthbank_ft_track_length_data_complete.csv`, stringify(trackLengthsFair, { header: true }));
  console.log(`   ✓ Track Lengths: ${trackLengthsFair.length} tracks → earthbank_ft_track_length_data_complete.csv`);

  // 2d. Create he_whole_grain_data.csv (group by sample to get datapoint_id)
  const heDatapointMap = new Map<string, number>();
  const uniqueHeSamples = [...new Set(heGrainsRaw.map(g => g.sample_id))];

  const heGrainsFair = heGrainsRaw.map(row => ({
    sample_id: row.sample_id,
    datapoint_key: `${row.sample_id}_HE001`,
    grain_id: row.lab_number,
    he4_ncc: row.He4_ncc,
    mass_mg: row.mass_mg,
    u_ppm: row.U_ppm,
    th_ppm: row.Th_ppm,
    sm_ppm: row.Sm_ppm,
    eu_ppm: row.eU_ppm,
    he4_uncorr_age_ma: row.raw_age_Ma,
    he4_uncorr_age_error_ma: row.raw_age_error_Ma,
    ft_value: row.Ft,
    he4_corr_age_ma: row.corr_age_Ma,
    he4_corr_age_error_ma: row.corr_age_error_Ma
  }));
  writeFileSync(`${FAIR_DIR}/earthbank_he_whole_grain_complete.csv`, stringify(heGrainsFair, { header: true }));
  console.log(`   ✓ He Grains: ${heGrainsFair.length} grains → earthbank_he_whole_grain_complete.csv`);

  // Step 3: Import to database
  console.log('\n💾 Step 3: Importing to database...');

  // 3a. Import samples (update existing or insert new)
  console.log('   Importing samples...');
  for (const sample of samplesFair) {
    await query(`
      INSERT INTO samples (sample_id, dataset_id, mineral_type, lithology, latitude, longitude, n_aft_grains, n_ahe_grains)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (sample_id)
      DO UPDATE SET
        n_aft_grains = EXCLUDED.n_aft_grains,
        n_ahe_grains = EXCLUDED.n_ahe_grains
    `, [sample.sample_id, sample.dataset_id, sample.mineral_type, sample.lithology,
        sample.latitude, sample.longitude, sample.n_aft_grains, sample.n_ahe_grains]);
  }
  console.log(`   ✓ Samples: ${samplesFair.length} imported/updated`);

  // 3b. Import ft_datapoints
  console.log('   Importing FT datapoints...');
  const datapointIdMap = new Map<string, number>();

  for (const dp of ftDatapointsFair) {
    const result = await query<{ id: number }>(`
      INSERT INTO ft_datapoints (
        sample_id, datapoint_key, laboratory, ft_method, n_grains,
        total_ns, mean_rho_s, mean_u_ppm, sd_u_ppm,
        mean_dpar_um, se_dpar_um, p_chi2_pct, dispersion_pct,
        pooled_age_ma, pooled_age_error_ma, central_age_ma, central_age_error_ma,
        mean_track_length_um, sd_track_length_um, n_track_measurements, mineral_type
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)
      ON CONFLICT (datapoint_key) DO UPDATE SET
        n_grains = EXCLUDED.n_grains,
        central_age_ma = EXCLUDED.central_age_ma
      RETURNING id
    `, [dp.sample_id, dp.datapoint_key, dp.laboratory, dp.ft_method, dp.n_grains,
        dp.total_ns, dp.mean_rho_s, dp.mean_u_ppm, dp.sd_u_ppm,
        dp.mean_dpar_um, dp.se_dpar_um, dp.p_chi2_pct, dp.dispersion_pct,
        dp.pooled_age_ma, dp.pooled_age_error_ma, dp.central_age_ma, dp.central_age_error_ma,
        dp.mean_track_length_um, dp.sd_track_length_um, dp.n_track_measurements, dp.mineral_type]);

    if (result[0]) {
      datapointIdMap.set(dp.datapoint_key, result[0].id);
    }
  }
  console.log(`   ✓ FT Datapoints: ${ftDatapointsFair.length} imported`);

  // 3c. Import track lengths
  console.log('   Importing track lengths...');
  let trackCount = 0;
  for (const track of trackLengthsFair) {
    const datapointId = datapointIdMap.get(track.datapoint_key);
    if (!datapointId) {
      console.log(`   ⚠️  Skipping track ${track.track_id} - no datapoint found for ${track.datapoint_key}`);
      continue;
    }

    await query(`
      INSERT INTO ft_track_length_data (
        ft_datapoint_id, grain_id, track_id, track_type,
        apparent_length_um, angle_to_c_axis_deg, dpar_um
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT DO NOTHING
    `, [datapointId, track.grain_id, track.track_id, track.track_type,
        track.apparent_length_um, track.angle_to_c_axis_deg, track.dpar_um]);
    trackCount++;
  }
  console.log(`   ✓ Track Lengths: ${trackCount} imported`);

  // 3d. Import He datapoints (create summary datapoint for each sample)
  console.log('   Importing He datapoints...');
  const heDatapointIdMap = new Map<string, number>();

  for (const sampleId of uniqueHeSamples) {
    const grains = heGrainsRaw.filter(g => g.sample_id === sampleId);
    const corrAges = grains.map(g => g.corr_age_Ma).filter(a => a > 0);
    const meanAge = corrAges.reduce((a, b) => a + b, 0) / corrAges.length;
    const se = Math.sqrt(corrAges.reduce((sum, age) => sum + Math.pow(age - meanAge, 2), 0) / corrAges.length) / Math.sqrt(corrAges.length);

    const result = await query<{ id: number }>(`
      INSERT INTO he_datapoints (
        sample_id, datapoint_key, laboratory, he_analysis_method,
        n_aliquots, mean_he4_corr_age_ma, se_mean_he4_corr_age_ma
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (datapoint_key) DO UPDATE SET
        n_aliquots = EXCLUDED.n_aliquots
      RETURNING id
    `, [sampleId, `${sampleId}_HE001`, 'University of Melbourne', 'conventional',
        grains.length, meanAge, se]);

    if (result[0]) {
      heDatapointIdMap.set(sampleId, result[0].id);
    }
  }
  console.log(`   ✓ He Datapoints: ${uniqueHeSamples.length} imported`);

  // 3e. Import He grains
  console.log('   Importing He grains...');
  let heGrainCount = 0;
  for (const grain of heGrainsFair) {
    const datapointId = heDatapointIdMap.get(grain.sample_id);
    if (!datapointId) {
      console.log(`   ⚠️  Skipping grain ${grain.grain_id} - no datapoint found`);
      continue;
    }

    await query(`
      INSERT INTO he_whole_grain_data (
        he_datapoint_id, grain_id, he4_ncc_per_mg, mass_mg,
        u_ppm, th_ppm, sm_ppm, eu_ppm,
        he4_uncorr_age_ma, he4_uncorr_age_error_ma,
        ft_value, he4_corr_age_ma, he4_corr_age_error_ma
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      ON CONFLICT DO NOTHING
    `, [datapointId, grain.grain_id, grain.he4_ncc, grain.mass_mg,
        grain.u_ppm, grain.th_ppm, grain.sm_ppm, grain.eu_ppm,
        grain.he4_uncorr_age_ma, grain.he4_uncorr_age_error_ma,
        grain.ft_value, grain.he4_corr_age_ma, grain.he4_corr_age_error_ma]);
    heGrainCount++;
  }
  console.log(`   ✓ He Grains: ${heGrainCount} imported`);

  // Step 4: Verify
  console.log('\n✅ Step 4: Verification...');
  const [samples, ftDp, ftTracks, heDp, heGrains] = await Promise.all([
    query('SELECT COUNT(*) as count FROM samples WHERE dataset_id = 5'),
    query('SELECT COUNT(*) as count FROM ft_datapoints'),
    query('SELECT COUNT(*) as count FROM ft_track_length_data'),
    query('SELECT COUNT(*) as count FROM he_datapoints'),
    query('SELECT COUNT(*) as count FROM he_whole_grain_data')
  ]);

  console.log('   Database counts:');
  console.log(`   - Samples: ${samples[0].count}`);
  console.log(`   - FT Datapoints: ${ftDp[0].count}`);
  console.log(`   - FT Track Lengths: ${ftTracks[0].count}`);
  console.log(`   - He Datapoints: ${heDp[0].count}`);
  console.log(`   - He Grains: ${heGrains[0].count}`);

  console.log('\n🎉 Import complete!');
  process.exit(0);
}

main().catch(err => {
  console.error('\n❌ Error:', err);
  process.exit(1);
});
