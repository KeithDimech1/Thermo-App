/**
 * Migration Script: Schema v1 → Schema v2
 *
 * Migrates data from old tables to new datapoint-based architecture:
 * - ft_ages → ft_datapoints
 * - ft_counts → ft_count_data (with ft_datapoint_id linkage)
 * - ft_track_lengths → ft_track_length_data
 *
 * Run with: npx tsx scripts/db/migrate-v1-to-v2.ts
 */

import { query, transaction } from '../../lib/db/connection';

interface OldFTAges {
  id: number;
  sample_id: string;
  age_equation?: string;
  ft_age_type?: string;
  lambda_d?: string;
  lambda_f?: string;
  zeta_yr_cm2?: number;
  zeta_error_yr_cm2?: number;
  dosimeter?: string;
  rs_um?: number;
  q?: number;
  irradiation_reactor?: string;
  n_grains?: number;
  pooled_age_ma?: number;
  pooled_age_error_ma?: number;
  central_age_ma?: number;
  central_age_error_ma?: number;
  dispersion_pct?: number;
  p_chi2?: number; // Decimal (0.05), not percent!
}

interface OldFTCounts {
  id: number;
  sample_id: string;
  grain_id: string;
  ns?: number;
  rho_s_cm2?: number;
  u_ppm?: number;
  dpar_um?: number;
  dpar_sd_um?: number;
  dper_um?: number;
  dper_sd_um?: number;
  ni?: number;
  nd?: number;
  rho_i_cm2?: number;
  rho_d_cm2?: number;
  counting_area_cm2?: number;
  analyst?: string;
  laboratory?: string;
  analysis_date?: string;
}

interface OldFTTrackLengths {
  id: number;
  sample_id: string;
  grain_id?: string;
  track_id?: string;
  track_type?: string;
  mean_track_length_um?: number;
  mean_track_length_sd_um?: number;
  dpar_um?: number;
  angle_to_c_axis_deg?: number;
  n_confined_tracks?: number;
}

async function migrateFTAges(): Promise<Map<string, number>> {
  console.log('\n🔄 Migrating ft_ages → ft_datapoints...');

  const oldAges = await query<OldFTAges>('SELECT * FROM ft_ages ORDER BY id');
  console.log(`   Found ${oldAges.length} records in ft_ages`);

  const sampleToDatapointId = new Map<string, number>();

  for (const oldAge of oldAges) {
    // Generate unique datapoint_key
    const datapointKey = `${oldAge.sample_id}_DP001`;

    // Convert p_chi2 from decimal to percent (0.05 → 5.0)
    const p_chi2_pct = oldAge.p_chi2 ? oldAge.p_chi2 * 100 : null;

    const insertSql = `
      INSERT INTO ft_datapoints (
        sample_id,
        datapoint_key,
        n_grains,
        pooled_age_ma,
        pooled_age_error_ma,
        central_age_ma,
        central_age_error_ma,
        dispersion_pct,
        p_chi2_pct,
        age_equation,
        zeta_yr_cm2,
        zeta_error_yr_cm2,
        dosimeter,
        r_um,
        q_factor,
        lambda_d,
        lambda_f,
        irradiation_reactor,
        mineral_type
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, 'apatite'
      )
      RETURNING id
    `;

    const result = await query<{ id: number }>(insertSql, [
      oldAge.sample_id,
      datapointKey,
      oldAge.n_grains,
      oldAge.pooled_age_ma,
      oldAge.pooled_age_error_ma,
      oldAge.central_age_ma,
      oldAge.central_age_error_ma,
      oldAge.dispersion_pct,
      p_chi2_pct,
      oldAge.age_equation,
      oldAge.zeta_yr_cm2,
      oldAge.zeta_error_yr_cm2,
      oldAge.dosimeter,
      oldAge.rs_um,
      oldAge.q,
      oldAge.lambda_d,
      oldAge.lambda_f,
      oldAge.irradiation_reactor
    ]);

    if (result[0]) {
      sampleToDatapointId.set(oldAge.sample_id, result[0].id);
    }
  }

  console.log(`   ✅ Migrated ${sampleToDatapointId.size} records to ft_datapoints`);
  return sampleToDatapointId;
}

async function migrateFTCounts(sampleToDatapointId: Map<string, number>): Promise<void> {
  console.log('\n🔄 Migrating ft_counts → ft_count_data...');

  const oldCounts = await query<OldFTCounts>('SELECT * FROM ft_counts ORDER BY id');
  console.log(`   Found ${oldCounts.length} records in ft_counts`);

  let migrated = 0;
  let skipped = 0;

  for (const oldCount of oldCounts) {
    const ftDatapointId = sampleToDatapointId.get(oldCount.sample_id);

    if (!ftDatapointId) {
      console.log(`   ⚠️  Skipping grain ${oldCount.grain_id} - no matching ft_datapoint for sample ${oldCount.sample_id}`);
      skipped++;
      continue;
    }

    const insertSql = `
      INSERT INTO ft_count_data (
        ft_datapoint_id,
        grain_id,
        counting_area_cm2,
        ns,
        rho_s_cm2,
        ni,
        rho_i_cm2,
        nd,
        rho_d_cm2,
        dpar_um,
        dpar_error_um,
        dper_um,
        dper_error_um
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13
      )
      ON CONFLICT (ft_datapoint_id, grain_id) DO NOTHING
    `;

    await query(insertSql, [
      ftDatapointId,
      oldCount.grain_id,
      oldCount.counting_area_cm2,
      oldCount.ns,
      oldCount.rho_s_cm2,
      oldCount.ni,
      oldCount.rho_i_cm2,
      oldCount.nd,
      oldCount.rho_d_cm2,
      oldCount.dpar_um,
      oldCount.dpar_sd_um,
      oldCount.dper_um,
      oldCount.dper_sd_um
    ]);

    migrated++;
  }

  console.log(`   ✅ Migrated ${migrated} records to ft_count_data`);
  if (skipped > 0) {
    console.log(`   ⚠️  Skipped ${skipped} records (no matching datapoint)`);
  }
}

async function migrateFTTrackLengths(sampleToDatapointId: Map<string, number>): Promise<void> {
  console.log('\n🔄 Migrating ft_track_lengths → ft_track_length_data...');

  const oldLengths = await query<OldFTTrackLengths>('SELECT * FROM ft_track_lengths ORDER BY id');
  console.log(`   Found ${oldLengths.length} records in ft_track_lengths`);

  let migrated = 0;
  let skipped = 0;

  for (const oldLength of oldLengths) {
    const ftDatapointId = sampleToDatapointId.get(oldLength.sample_id);

    if (!ftDatapointId) {
      console.log(`   ⚠️  Skipping track ${oldLength.track_id || oldLength.id} - no matching ft_datapoint for sample ${oldLength.sample_id}`);
      skipped++;
      continue;
    }

    // Generate track_id if missing
    const trackId = oldLength.track_id || `TRK_${oldLength.id}`;
    const grainId = oldLength.grain_id || `GRAIN_${oldLength.id}`;

    const insertSql = `
      INSERT INTO ft_track_length_data (
        ft_datapoint_id,
        grain_id,
        track_id,
        track_type,
        apparent_length_um,
        angle_to_c_axis_deg,
        dpar_um
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7
      )
      ON CONFLICT DO NOTHING
    `;

    await query(insertSql, [
      ftDatapointId,
      grainId,
      trackId,
      oldLength.track_type || 'confined',
      oldLength.mean_track_length_um,
      oldLength.angle_to_c_axis_deg,
      oldLength.dpar_um
    ]);

    migrated++;
  }

  console.log(`   ✅ Migrated ${migrated} records to ft_track_length_data`);
  if (skipped > 0) {
    console.log(`   ⚠️  Skipped ${skipped} records (no matching datapoint)`);
  }
}

async function validateMigration(): Promise<void> {
  console.log('\n🔍 Validating migration...');

  const [oldStats, newStats] = await Promise.all([
    query<{ table: string; count: string }>(`
      SELECT 'ft_ages' as table, COUNT(*)::text as count FROM ft_ages
      UNION ALL
      SELECT 'ft_counts' as table, COUNT(*)::text as count FROM ft_counts
      UNION ALL
      SELECT 'ft_track_lengths' as table, COUNT(*)::text as count FROM ft_track_lengths
    `),
    query<{ table: string; count: string }>(`
      SELECT 'ft_datapoints' as table, COUNT(*)::text as count FROM ft_datapoints
      UNION ALL
      SELECT 'ft_count_data' as table, COUNT(*)::text as count FROM ft_count_data
      UNION ALL
      SELECT 'ft_track_length_data' as table, COUNT(*)::text as count FROM ft_track_length_data
    `)
  ]);

  console.log('\n   📊 Record Counts:');
  console.log('   OLD SCHEMA:');
  oldStats.forEach(row => console.log(`      ${row.table}: ${row.count}`));
  console.log('   NEW SCHEMA:');
  newStats.forEach(row => console.log(`      ${row.table}: ${row.count}`));

  // Check sample coverage
  const coverageCheck = await query<{ old_samples: string; new_samples: string }>(`
    SELECT
      (SELECT COUNT(DISTINCT sample_id) FROM ft_ages)::text as old_samples,
      (SELECT COUNT(DISTINCT sample_id) FROM ft_datapoints)::text as new_samples
  `);

  console.log(`\n   📋 Sample Coverage:`);
  console.log(`      ft_ages samples: ${coverageCheck[0].old_samples}`);
  console.log(`      ft_datapoints samples: ${coverageCheck[0].new_samples}`);
}

async function main() {
  console.log('🚀 Starting Schema v1 → v2 Migration');
  console.log('====================================\n');

  // Debug: Show connection info
  const dbUrl = process.env.DATABASE_URL || process.env.DIRECT_URL;
  if (dbUrl) {
    const url = new URL(dbUrl);
    console.log(`📡 Connecting to database: ${url.hostname}/${url.pathname.slice(1)}`);
  }

  // Debug: List tables
  try {
    const tables = await query<{ tablename: string }>(`
      SELECT tablename FROM pg_tables
      WHERE schemaname = 'public'
      AND tablename IN ('ft_ages', 'ft_datapoints')
      ORDER BY tablename
    `);
    console.log(`📋 Found tables:`, tables.map(t => t.tablename).join(', '));
  } catch (err) {
    console.error('❌ Failed to list tables:', err);
  }

  try {
    // Check if ft_datapoints already has data
    const existingCount = await query<{ count: string }>('SELECT COUNT(*)::text as count FROM ft_datapoints');
    const count = parseInt(existingCount[0].count, 10);

    if (count > 0) {
      console.log(`⚠️  ft_datapoints already contains ${count} records.`);
      console.log('   This script will add more records. Continue? (Ctrl+C to abort)');
      await new Promise(resolve => setTimeout(resolve, 3000));
    }

    // Perform migration
    const sampleToDatapointId = await migrateFTAges();
    await migrateFTCounts(sampleToDatapointId);
    await migrateFTTrackLengths(sampleToDatapointId);

    // Validate
    await validateMigration();

    console.log('\n✅ Migration completed successfully!');
    console.log('\n📝 Next steps:');
    console.log('   1. Verify data in new tables');
    console.log('   2. Update application code to use new tables');
    console.log('   3. Consider archiving old tables (DO NOT DELETE until verified)');

  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    throw error;
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
