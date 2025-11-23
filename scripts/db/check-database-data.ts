import { query } from '../../lib/db/connection';

async function main() {
  console.log('📊 Checking Supabase database contents:\n');

  // Simple count queries
  const tables = [
    'samples', 'datasets',
    'ft_ages', 'ft_datapoints', 'ft_count_data',
    'ft_counts', 'ft_track_length_data', 'ft_track_lengths',
    'ahe_grain_data', 'he_whole_grain_data', 'he_datapoints'
  ];

  console.log('Table Row Counts:');
  for (const table of tables) {
    try {
      const result = await query<{ count: string }>(`SELECT COUNT(*)::text as count FROM ${table}`);
      console.log(`   ${table}: ${result[0].count} rows`);
    } catch (err: any) {
      if (err.code === '42P01') {
        console.log(`   ${table}: [TABLE DOES NOT EXIST]`);
      } else {
        console.log(`   ${table}: [ERROR: ${err.message}]`);
      }
    }
  }

  process.exit(0);
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
