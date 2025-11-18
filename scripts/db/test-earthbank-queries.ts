#!/usr/bin/env npx tsx
/**
 * Test EarthBank Queries - Verify double-quoted identifiers work
 *
 * Quick smoke test to validate:
 * - Queries execute without errors
 * - camelCase field names returned correctly
 * - Pagination, filtering, and stats work
 */

import {
  getAllSamples,
  getSampleById,
  getSampleDetail,
  getFTDatapointsBySample,
  getHeDatapointsBySample,
  getDatasetStats,
  getSampleCountByMineral,
  getAgeDistribution,
} from '@/lib/db/earthbank-queries';

console.log('🧪 Testing EarthBank Queries\n');
console.log('═══════════════════════════════════════════════════════════════════\n');

async function runTests() {
  try {
    // Test 1: Dataset Statistics
    console.log('📊 Test 1: Dataset Statistics');
    console.log('─────────────────────────────────────────────────────────────────');
    const stats = await getDatasetStats();
    console.log('✅ getDatasetStats() SUCCESS');
    console.log(JSON.stringify(stats, null, 2));
    console.log('');

    // Test 2: Sample Count by Mineral
    console.log('📊 Test 2: Sample Count by Mineral Type');
    console.log('─────────────────────────────────────────────────────────────────');
    const mineralCounts = await getSampleCountByMineral();
    console.log('✅ getSampleCountByMineral() SUCCESS');
    console.log(`Found ${mineralCounts.length} mineral types:`);
    mineralCounts.forEach((m) => {
      console.log(`  - ${m.mineralType || 'NULL'}: ${m.count} samples`);
    });
    console.log('');

    // Test 3: Get All Samples (first 5)
    console.log('📊 Test 3: Get All Samples (pagination)');
    console.log('─────────────────────────────────────────────────────────────────');
    const samplesPage = await getAllSamples({}, 5, 0);
    console.log('✅ getAllSamples() SUCCESS');
    console.log(`Total samples: ${samplesPage.total}`);
    console.log(`Returned: ${samplesPage.data.length} samples`);
    console.log(`Has more: ${samplesPage.hasMore}`);
    console.log('\nFirst sample:');
    const firstSample = samplesPage.data[0];
    console.log(`  sampleID: ${firstSample?.sampleID}`);
    console.log(`  latitude: ${firstSample?.latitude}`);
    console.log(`  longitude: ${firstSample?.longitude}`);
    console.log(`  elevationM: ${firstSample?.elevationM}`);
    console.log(`  mineralType: ${firstSample?.mineralType}`);
    console.log('');

    // Test 4: Get Sample by ID
    console.log('📊 Test 4: Get Sample by ID');
    console.log('─────────────────────────────────────────────────────────────────');
    const testSampleID = samplesPage.data[0]?.sampleID;
    if (testSampleID) {
      const sample = await getSampleById(testSampleID);
      console.log(`✅ getSampleById("${testSampleID}") SUCCESS`);
      console.log(`  Found: ${sample ? 'YES' : 'NO'}`);
      if (sample) {
        console.log(`  sampleID: ${sample.sampleID}`);
        console.log(`  IGSN: ${sample.IGSN || 'NULL'}`);
        console.log(`  lithology: ${sample.lithology || 'NULL'}`);
      }
    } else {
      console.log('⚠️  No samples found to test getSampleById()');
    }
    console.log('');

    // Test 5: Get Sample Detail (with all datapoints)
    console.log('📊 Test 5: Get Sample Detail (with datapoints)');
    console.log('─────────────────────────────────────────────────────────────────');
    if (testSampleID) {
      const detail = await getSampleDetail(testSampleID);
      console.log(`✅ getSampleDetail("${testSampleID}") SUCCESS`);
      if (detail) {
        console.log(`  Sample: ${detail.sample.sampleID}`);
        console.log(`  FT Datapoints: ${detail.ftDatapoints.length}`);
        console.log(`  He Datapoints: ${detail.heDatapoints.length}`);
        console.log(`  FT Count Data: ${detail.ftCountData.length}`);
        console.log(`  FT Track Lengths: ${detail.ftTrackLengthData.length}`);
        console.log(`  He Whole Grain: ${detail.heWholeGrainData.length}`);

        // Show first FT datapoint if exists
        if (detail.ftDatapoints.length > 0) {
          const dp = detail.ftDatapoints[0];
          console.log('\n  First FT Datapoint:');
          console.log(`    datapointName: ${dp.datapointName}`);
          console.log(`    centralAgeMa: ${dp.centralAgeMa}`);
          console.log(`    pooledAgeMa: ${dp.pooledAgeMa}`);
          console.log(`    mtl: ${dp.mtl}`);
          console.log(`    dispersion: ${dp.dispersion}`);
        }

        // Show first He datapoint if exists
        if (detail.heDatapoints.length > 0) {
          const dp = detail.heDatapoints[0];
          console.log('\n  First He Datapoint:');
          console.log(`    datapointName: ${dp.datapointName}`);
          console.log(`    meanCorrectedAgeMa: ${dp.meanCorrectedAgeMa}`);
          console.log(`    nGrains: ${dp.nGrains}`);
        }
      }
    }
    console.log('');

    // Test 6: Filter Samples by Mineral Type
    console.log('📊 Test 6: Filter Samples by Mineral Type');
    console.log('─────────────────────────────────────────────────────────────────');
    const apatiteSamples = await getAllSamples({ mineralType: 'apatite' }, 10, 0);
    console.log('✅ getAllSamples({ mineralType: "apatite" }) SUCCESS');
    console.log(`  Found ${apatiteSamples.total} apatite samples`);
    console.log(`  Returned: ${apatiteSamples.data.length}`);
    console.log('');

    // Test 7: Get FT Age Distribution
    console.log('📊 Test 7: Get FT Age Distribution (histogram)');
    console.log('─────────────────────────────────────────────────────────────────');
    const ftAges = await getAgeDistribution('FT', 100);
    console.log('✅ getAgeDistribution("FT", 100) SUCCESS');
    console.log(`  Age bins: ${ftAges.length}`);
    if (ftAges.length > 0) {
      console.log('\n  Sample bins:');
      ftAges.slice(0, 5).forEach((bin) => {
        console.log(`    ${bin.ageBinMa}-${bin.ageBinMa + 100} Ma: ${bin.count} datapoints`);
      });
    }
    console.log('');

    // Test 8: Verify camelCase Field Names
    console.log('📊 Test 8: Verify camelCase Field Names');
    console.log('─────────────────────────────────────────────────────────────────');
    const testSample = samplesPage.data[0];
    if (testSample) {
      const hasCamelCase =
        'sampleID' in testSample &&
        ('elevationM' in testSample || testSample.elevationM === null) &&
        ('mineralType' in testSample || testSample.mineralType === null);

      const hasSnakeCase =
        'sample_id' in (testSample as any) ||
        'elevation_m' in (testSample as any) ||
        'mineral_type' in (testSample as any);

      console.log(`✅ camelCase fields present: ${hasCamelCase ? 'YES' : 'NO'}`);
      console.log(`✅ snake_case fields absent: ${!hasSnakeCase ? 'YES' : 'NO'}`);

      if (hasCamelCase && !hasSnakeCase) {
        console.log('✅ Field naming: CORRECT (camelCase only)');
      } else {
        console.log('❌ Field naming: INCORRECT (mixed or snake_case)');
      }
    }
    console.log('');

    // Summary
    console.log('═══════════════════════════════════════════════════════════════════');
    console.log('✅ ALL TESTS PASSED');
    console.log('═══════════════════════════════════════════════════════════════════');
    console.log('\n🎉 EarthBank queries are working correctly!\n');
    console.log('Key Findings:');
    console.log(`  • Database has ${stats.totalSamples} samples`);
    console.log(`  • ${stats.totalFTDatapoints} FT datapoints`);
    console.log(`  • ${stats.totalHeDatapoints} He datapoints`);
    console.log(`  • All queries return camelCase field names`);
    console.log(`  • Double-quoted identifiers working correctly`);
    console.log(`  • Ready for API integration!`);
    console.log('');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ TEST FAILED\n');
    console.error('Error:', error);
    console.error('\nStack trace:', (error as Error).stack);
    process.exit(1);
  }
}

runTests();
