#!/usr/bin/env node
/**
 * ⚠️ DEPRECATED - NOT UPDATED FOR EARTHBANK SCHEMA (IDEA-014)
 *
 * This script uses the OLD snake_case schema (samples, ft_datapoints, ft_ages)
 * and has NOT been migrated to the new EarthBank camelCase schema.
 *
 * If you need to query McMillan 2024 data, use the application UI or update this script:
 * - Replace: samples → earthbank_samples
 * - Replace: ft_datapoints → earthbank_ftDatapoints
 * - Replace: sample_id → sampleID, central_age_ma → centralAgeMa
 *
 * See: build-data/ideas/debug/IDEA-014-INDEX.md
 *
 * ---
 *
 * Query McMillan 2024 Malawi Rift data from Neon database (LEGACY)
 * Run: node scripts/query-mcmillan-data.js
 */

console.error('\n⚠️  WARNING: This script uses the OLD schema and may not work.\n');

require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function queryMcMillanData() {
  const client = await pool.connect();

  try {
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('McMillan 2024 - Malawi Rift Data');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Get dataset info
    const dataset = await client.query(`
      SELECT * FROM datasets WHERE id = 2
    `);

    if (dataset.rows.length === 0) {
      console.log('❌ Dataset not found!\n');
      return;
    }

    const ds = dataset.rows[0];
    console.log('📊 DATASET INFO:');
    console.log(`  ID: ${ds.id}`);
    console.log(`  Name: ${ds.dataset_name}`);
    console.log(`  DOI: ${ds.doi}`);
    console.log(`  Study Area: ${ds.study_area}`);
    console.log(`  Analyst: ${ds.analyst}`);
    console.log(`  Lab: ${ds.laboratory}\n`);

    // Get all samples with ages
    const samples = await client.query(`
      SELECT
        s.sample_id,
        s.lithology,
        fa.central_age_ma,
        fa.central_age_error_ma,
        fa.pooled_age_ma,
        fa.pooled_age_error_ma,
        fa.dispersion_pct,
        fa.p_chi2,
        fa.n_grains
      FROM samples s
      LEFT JOIN ft_ages fa ON s.sample_id = fa.sample_id
      WHERE s.dataset_id = 2
      ORDER BY fa.central_age_ma
    `);

    console.log(`📋 SAMPLE DATA (${samples.rows.length} total):\n`);
    console.log('Sample ID    | Central Age (Ma)  | Pooled Age (Ma)   | Grains | Lithology');
    console.log('─'.repeat(90));

    samples.rows.forEach(s => {
      const centralAge = s.central_age_ma ? `${parseFloat(s.central_age_ma).toFixed(1)} ± ${parseFloat(s.central_age_error_ma).toFixed(1)}` : 'N/A';
      const pooledAge = s.pooled_age_ma ? `${parseFloat(s.pooled_age_ma).toFixed(1)} ± ${parseFloat(s.pooled_age_error_ma).toFixed(1)}` : 'N/A';
      const lithology = s.lithology.substring(0, 25);

      console.log(
        `${s.sample_id.padEnd(12)} | ${centralAge.padEnd(17)} | ${pooledAge.padEnd(17)} | ${String(s.n_grains).padEnd(6)} | ${lithology}`
      );
    });

    // Summary statistics
    const stats = await client.query(`
      SELECT
        COUNT(*) as total_samples,
        MIN(central_age_ma) as min_age,
        MAX(central_age_ma) as max_age,
        AVG(central_age_ma) as avg_age,
        AVG(n_grains) as avg_grains
      FROM ft_ages fa
      JOIN samples s ON fa.sample_id = s.sample_id
      WHERE s.dataset_id = 2
    `);

    const st = stats.rows[0];
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 SUMMARY STATISTICS');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`Total Samples: ${st.total_samples}`);
    console.log(`Age Range: ${st.min_age.toFixed(1)} - ${st.max_age.toFixed(1)} Ma`);
    console.log(`Average Age: ${st.avg_age.toFixed(1)} Ma`);
    console.log(`Avg Grains/Sample: ${st.avg_grains.toFixed(0)}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('✅ Data successfully retrieved from Neon database\n');

  } finally {
    client.release();
    await pool.end();
  }
}

queryMcMillanData().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
