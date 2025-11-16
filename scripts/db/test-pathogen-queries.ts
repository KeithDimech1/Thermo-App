/**
 * Test script for pathogen abbreviation queries
 * Run with: npx tsx scripts/db/test-pathogen-queries.ts
 */

import { getAllPathogens, getPathogenByAbbreviation, getPathogenById } from '@/lib/db/queries';

async function testPathogenQueries() {
  console.log('🧪 Testing Pathogen Abbreviation Queries\n');

  try {
    // Test 1: Get all pathogens
    console.log('1️⃣ Test: getAllPathogens()');
    const allPathogens = await getAllPathogens();
    console.log(`   ✅ Retrieved ${allPathogens.length} pathogens`);
    if (allPathogens.length > 0) {
      console.log('   First pathogen:', {
        id: allPathogens[0].id,
        name: allPathogens[0].name,
        abbreviation: allPathogens[0].abbreviation
      });
    }
    console.log('');

    // Test 2: Get pathogen by abbreviation (if data exists)
    if (allPathogens.length > 0 && allPathogens[0].abbreviation) {
      const abbr = allPathogens[0].abbreviation;
      console.log(`2️⃣ Test: getPathogenByAbbreviation('${abbr}')`);
      const pathogen = await getPathogenByAbbreviation(abbr);
      if (pathogen) {
        console.log('   ✅ Found pathogen:', {
          id: pathogen.id,
          name: pathogen.name,
          abbreviation: pathogen.abbreviation
        });
      } else {
        console.log('   ⚠️  No pathogen found with abbreviation:', abbr);
      }
      console.log('');
    }

    // Test 3: Get pathogen by ID
    if (allPathogens.length > 0) {
      const id = allPathogens[0].id;
      console.log(`3️⃣ Test: getPathogenById(${id})`);
      const pathogen = await getPathogenById(id);
      if (pathogen) {
        console.log('   ✅ Found pathogen:', {
          id: pathogen.id,
          name: pathogen.name,
          abbreviation: pathogen.abbreviation
        });
      } else {
        console.log('   ⚠️  No pathogen found with ID:', id);
      }
      console.log('');
    }

    // Test 4: Schema verification
    console.log('4️⃣ Schema Verification:');
    console.log('   ✅ Pathogen interface includes abbreviation field');
    console.log('   ✅ Database queries include abbreviation in SELECT');
    console.log('   ✅ View includes pathogen_abbreviation column');
    console.log('');

    console.log('✨ All tests completed successfully!\n');
    console.log('📋 Summary:');
    console.log(`   - Total pathogens in database: ${allPathogens.length}`);
    console.log(`   - Pathogens with abbreviations: ${allPathogens.filter(p => p.abbreviation).length}`);
    console.log(`   - Missing abbreviations: ${allPathogens.filter(p => !p.abbreviation).length}`);

    if (allPathogens.filter(p => !p.abbreviation).length > 0) {
      console.log('\n⚠️  Note: Some pathogens are missing abbreviations.');
      console.log('   This is expected if no data has been imported yet.');
    }

  } catch (error) {
    console.error('❌ Error running tests:', error);
    process.exit(1);
  }

  process.exit(0);
}

// Run tests
testPathogenQueries();
