#!/usr/bin/env npx tsx

/**
 * Backfill Authors to People Table
 *
 * Populates the `people` table and `dataset_people_roles` table
 * with authors from existing datasets.
 *
 * For each dataset with authors:
 * 1. Parse authors array
 * 2. Add each author to people table (if not exists)
 * 3. Link author to dataset via dataset_people_roles
 *
 * Run: npx tsx scripts/db/backfill-authors.ts
 */

import { query, queryOne } from '@/lib/db/connection';

interface Dataset {
  id: number;
  dataset_name: string;
  authors: string[] | string | null;
}

async function populateAuthors(datasetId: number, authors: string[]): Promise<number> {
  let linkedCount = 0;

  for (const authorName of authors) {
    if (!authorName || authorName.trim().length === 0) {
      continue; // Skip empty names
    }

    const cleanName = authorName.trim();

    // Check if person already exists (case-insensitive)
    let person = await queryOne<{ id: number }>(
      'SELECT id FROM people WHERE LOWER(name) = LOWER($1)',
      [cleanName]
    );

    // If person doesn't exist, create them
    if (!person) {
      person = await queryOne<{ id: number }>(
        'INSERT INTO people (name, created_at) VALUES ($1, NOW()) RETURNING id',
        [cleanName]
      );
      console.log(`  ✓ Created new person: ${cleanName} (ID: ${person!.id})`);
    } else {
      console.log(`  → Found existing person: ${cleanName} (ID: ${person.id})`);
    }

    // Link person to dataset (if not already linked)
    const result = await query(
      `INSERT INTO dataset_people_roles (dataset_id, person_id, role, created_at)
       VALUES ($1, $2, 'author', NOW())
       ON CONFLICT (dataset_id, person_id, role) DO NOTHING
       RETURNING id`,
      [datasetId, person!.id]
    );

    if (result.length > 0) {
      linkedCount++;
      console.log(`  ✓ Linked to dataset`);
    } else {
      console.log(`  → Already linked`);
    }
  }

  return linkedCount;
}

function parseAuthors(authorsField: string[] | string | null): string[] {
  if (!authorsField) {
    return [];
  }

  // If already an array
  if (Array.isArray(authorsField)) {
    return authorsField.filter(a => a && a.trim().length > 0);
  }

  // If it's a PostgreSQL array string like {Author1,Author2}
  if (typeof authorsField === 'string') {
    // Remove { and } and split by comma
    const cleaned = authorsField
      .replace(/^\{/, '')
      .replace(/\}$/, '')
      .split(',')
      .map(a => a.replace(/^"/, '').replace(/"$/, '').trim())
      .filter(a => a.length > 0);

    return cleaned;
  }

  return [];
}

async function main() {
  console.log('🔄 Backfilling authors to people table...\n');

  // Get all datasets with authors
  const datasets = await query<Dataset>(
    'SELECT id, dataset_name, authors FROM datasets WHERE authors IS NOT NULL ORDER BY id'
  );

  console.log(`Found ${datasets.length} datasets with authors\n`);

  let totalAuthorsCreated = 0;
  let totalLinksCreated = 0;

  for (const dataset of datasets) {
    console.log(`\n📄 Dataset ${dataset.id}: ${dataset.dataset_name}`);

    const authors = parseAuthors(dataset.authors);

    if (authors.length === 0) {
      console.log('  ⚠️  No authors found (empty array)');
      continue;
    }

    console.log(`  Found ${authors.length} authors: ${authors.join(', ')}`);

    const linkedCount = await populateAuthors(dataset.id, authors);
    totalLinksCreated += linkedCount;
    totalAuthorsCreated += authors.length;
  }

  // Get final counts
  const peopleCount = await queryOne<{ count: string }>(
    'SELECT COUNT(*) as count FROM people'
  );

  const linksCount = await queryOne<{ count: string }>(
    'SELECT COUNT(*) as count FROM dataset_people_roles WHERE role = \'author\''
  );

  console.log('\n' + '='.repeat(60));
  console.log('✅ Backfill complete!');
  console.log('='.repeat(60));
  console.log(`Total people in database: ${peopleCount?.count || 0}`);
  console.log(`Total author links: ${linksCount?.count || 0}`);
  console.log(`New links created: ${totalLinksCreated}`);
  console.log('='.repeat(60) + '\n');
}

main().catch(console.error);
