/**
 * Populate dataset_people_roles with authors from datasets
 *
 * This script:
 * 1. Extracts authors from datasets.authors array OR full_citation
 * 2. Inserts unique authors into people table
 * 3. Creates relationships in dataset_people_roles with author order
 *
 * Run: npx tsx scripts/db/populate-dataset-authors.ts
 */

import { query, transaction } from '@/lib/db/connection';
import { PoolClient } from 'pg';

interface Dataset {
  id: number;
  dataset_name: string;
  authors: string[] | null;
  full_citation: string | null;
}

interface Person {
  id: number;
  name: string;
}

/**
 * Extract authors from a citation string
 * Format: "LastName, I.N., LastName2, I.N., and LastName3, I.N., YEAR. Title..."
 */
function extractAuthorsFromCitation(citation: string): string[] {
  if (!citation) return [];

  // Find the part before the year (e.g., "2015.", "2024.")
  const yearMatch = citation.match(/^(.*?),?\s+\d{4}\./);
  if (!yearMatch) return [];

  const authorsPart = yearMatch[1];

  // Split by commas and handle "and"
  const parts = authorsPart.split(',').map(s => s.trim());

  const authors: string[] = [];
  let currentAuthor = '';

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];

    // Handle "and LastName" case
    if (part.startsWith('and ')) {
      const name = part.replace(/^and\s+/, '');
      if (i + 1 < parts.length) {
        // Next part is initials
        authors.push(`${name}, ${parts[i + 1]}`);
        i++; // Skip next part
      } else {
        authors.push(name);
      }
      continue;
    }

    // If this looks like a last name (not initials)
    if (part && !part.match(/^[A-Z]\.[A-Z]\.?$/)) {
      currentAuthor = part;
    } else if (currentAuthor) {
      // This is initials for the previous last name
      authors.push(`${currentAuthor}, ${part}`);
      currentAuthor = '';
    }
  }

  return authors.filter(a => a.length > 0);
}

/**
 * Parse PostgreSQL array string to JavaScript array
 */
function parsePostgresArray(val: any): string[] {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  if (typeof val === 'string') {
    return val
      .replace(/^\{/, '')
      .replace(/\}$/, '')
      .split(',')
      .map(s => s.replace(/^"/, '').replace(/"$/, '').trim())
      .filter(s => s.length > 0);
  }
  return [];
}

/**
 * Get or create person by name
 */
async function getOrCreatePerson(name: string, client: PoolClient): Promise<number> {
  // Check if person exists
  const existing = await client.query<Person>(`
    SELECT id, name FROM people WHERE name = $1 LIMIT 1
  `, [name]);

  if (existing.rows.length > 0) {
    return existing.rows[0].id;
  }

  // Insert new person
  const result = await client.query<{ id: number }>(`
    INSERT INTO people (name)
    VALUES ($1)
    RETURNING id
  `, [name]);

  return result.rows[0].id;
}

async function main() {
  console.log('🔄 Starting author extraction and population...\n');

  // Get all datasets
  const datasets = await query<Dataset>(`
    SELECT id, dataset_name, authors, full_citation
    FROM datasets
    ORDER BY id
  `);

  console.log(`📊 Found ${datasets.length} datasets\n`);

  let totalAuthorsProcessed = 0;
  let totalRelationshipsCreated = 0;

  for (const dataset of datasets) {
    console.log(`\n📄 Processing: ${dataset.dataset_name} (ID: ${dataset.id})`);

    // Get authors from either array or citation
    let authorNames: string[] = [];

    if (dataset.authors) {
      authorNames = parsePostgresArray(dataset.authors);
      console.log(`   ✓ Found ${authorNames.length} authors in array`);
    } else if (dataset.full_citation) {
      authorNames = extractAuthorsFromCitation(dataset.full_citation);
      console.log(`   ✓ Extracted ${authorNames.length} authors from citation`);
    }

    if (authorNames.length === 0) {
      console.log(`   ⚠️  No authors found`);
      continue;
    }

    // Process each author in a transaction
    await transaction(async (client) => {
      for (let i = 0; i < authorNames.length; i++) {
        const authorName = authorNames[i];
        const authorOrder = i + 1; // 1-indexed

        // Get or create person
        const personId = await getOrCreatePerson(authorName, client);

        // Check if relationship already exists
        const existing = await client.query(`
          SELECT id FROM dataset_people_roles
          WHERE dataset_id = $1 AND person_id = $2 AND role = 'author'
        `, [dataset.id, personId]);

        if (existing.rows.length === 0) {
          // Create relationship
          await client.query(`
            INSERT INTO dataset_people_roles (dataset_id, person_id, role, author_order)
            VALUES ($1, $2, 'author', $3)
          `, [dataset.id, personId, authorOrder]);

          totalRelationshipsCreated++;
        }

        totalAuthorsProcessed++;
      }
    });

    console.log(`   ✅ Processed ${authorNames.length} authors`);
  }

  console.log(`\n✅ Complete!`);
  console.log(`   Authors processed: ${totalAuthorsProcessed}`);
  console.log(`   Relationships created: ${totalRelationshipsCreated}`);

  // Show summary
  const stats = await query<{ total_people: string, total_relationships: string }>(`
    SELECT
      (SELECT COUNT(*) FROM people)::text as total_people,
      (SELECT COUNT(*) FROM dataset_people_roles)::text as total_relationships
  `);

  console.log(`\n📊 Final Stats:`);
  console.log(`   Total people in database: ${stats[0].total_people}`);
  console.log(`   Total dataset-author relationships: ${stats[0].total_relationships}`);

  process.exit(0);
}

main().catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});
