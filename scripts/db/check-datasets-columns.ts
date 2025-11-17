import { query } from '../../lib/db/connection';

async function main() {
  const result = await query(`
    SELECT column_name, data_type
    FROM information_schema.columns
    WHERE table_name = 'datasets'
    ORDER BY ordinal_position
  `);

  console.log('datasets table columns:');
  result.forEach(row => console.log(`  - ${row.column_name}: ${row.data_type}`));

  process.exit(0);
}

main().catch(console.error);
