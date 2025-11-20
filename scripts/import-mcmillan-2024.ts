/**
 * Import McMillan(2024) Malawi Rift dataset from AusGeochem supplementary files
 *
 * Data source: Transformed from AusGeochem Excel files to EarthBank camelCase schema
 * Location: build-data/learning/thermo-papers/Gawthorpe(2050)-Malawi-Rift-Fault-Evolution-Geoscience/FAIR/
 *
 * Expected import:
 * - 34 samples → earthbank_samples
 * - 68 FT datapoints → earthbank_ftDatapoints (34 samples, rest are QC standards)
 * - 140 He grains → earthbank_heWholeGrainData
 * - 3502 track lengths → earthbank_ftTrackLengthData
 */

import { getPool } from '../lib/db/connection'
import * as fs from 'fs'
import * as path from 'path'
import { parse } from 'csv-parse/sync'

const pool = getPool()

const FAIR_DIR = path.join(
  __dirname,
  '../build-data/learning/thermo-papers/Gawthorpe(2050)-Malawi-Rift-Fault-Evolution-Geoscience/FAIR'
)

interface Sample {
  sampleID: string
  IGSN?: string
  latitude: number
  longitude: number
  elevationM: number
  lithology: string
  sampleKind: string
  locationName: string
  mineralType: string
  datasetName: string
}

interface FTDatapoint {
  datapointName: string
  sampleID?: string
  laboratory: string
  analyst: string
  mineralName: string
  ftMethod: string
  numGrains?: number
  rhoS?: number
  ns?: number
  uPpm?: number
  dpar?: number
  rmr0?: number
  pChi2?: number
  dispersionPct?: number
  centralAgeMa?: number
  centralAgeErrorMa?: number
  meanTrackLengthUm?: number
  trackLengthStdDev?: number
  numTracksLengthMeasured?: number
}

interface HeGrain {
  datapointName: string
  grainID: string  // Will map to grainName in DB
  grainLengthUm?: number  // Will map to lengthUm
  grainWidthUm?: number  // Will map to widthUm
  ftValue?: number  // Will map to ft
  sphericalRadiusUm?: number  // Will map to rsUm
  grainMassUg?: number  // Will map to massMg (convert ug to mg!)
  uPpm?: number  // Will map to uConcentration
  thPpm?: number  // Will map to thConcentration
  smPpm?: number  // Will map to smConcentration
  euPpm?: number  // Will map to eU
  rawHeAgeMa?: number  // Will map to uncorrectedHeAge
  correctedHeAgeMa?: number  // Will map to correctedHeAge
}

interface TrackLength {
  datapointName: string
  trackLengthUm: number
  cAxisAngle?: number
}

function readCSV<T>(filename: string): T[] {
  const csvPath = path.join(FAIR_DIR, filename)
  const fileContent = fs.readFileSync(csvPath, 'utf-8')
  const records = parse(fileContent, {
    columns: true,
    skip_empty_lines: true,
    cast: true,
    cast_date: false
  })
  return records as T[]
}

async function importDataset() {
  const client = await pool.connect()

  try {
    await client.query('BEGIN')

    console.log('━'.repeat(80))
    console.log('IMPORTING MCMILLAN(2024) MALAWI RIFT DATASET')
    console.log('━'.repeat(80))
    console.log()

    // ============================================================================
    // 1. IMPORT SAMPLES
    // ============================================================================
    console.log('1️⃣ Importing samples...')
    const samples = readCSV<Sample>('earthbank_samples.csv')

    let samplesImported = 0
    for (const sample of samples) {
      await client.query(
        `
        INSERT INTO "earthbank_samples" (
          "sampleID", "IGSN", "latitude", "longitude", "elevationM",
          "lithology", "sampleKind", "locationDescription", "mineral", "datasetID"
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        ON CONFLICT ("sampleID") DO UPDATE SET
          "IGSN" = EXCLUDED."IGSN",
          "latitude" = EXCLUDED."latitude",
          "longitude" = EXCLUDED."longitude",
          "elevationM" = EXCLUDED."elevationM"
        `,
        [
          sample.sampleID,
          sample.IGSN || null,
          sample.latitude,
          sample.longitude,
          sample.elevationM,
          sample.lithology,
          sample.sampleKind,
          sample.locationName || null, // Map to locationDescription
          sample.mineralType || 'apatite', // Map to mineral
          sample.datasetName || 'McMillan(2024)-Malawi-Rift' // Map to datasetID
        ]
      )
      samplesImported++
    }

    console.log(`   ✅ Imported ${samplesImported} samples`)
    console.log()

    // ============================================================================
    // 2. IMPORT FT DATAPOINTS
    // ============================================================================
    console.log('2️⃣ Importing FT datapoints...')
    const ftDatapoints = readCSV<FTDatapoint>('earthbank_ftDatapoints.csv')

    let ftImported = 0
    let ftSkipped = 0

    for (const dp of ftDatapoints) {
      // Skip QC standards (no sampleID)
      if (!dp.sampleID || dp.sampleID.trim() === '') {
        ftSkipped++
        continue
      }

      // Convert dispersion from percentage to fraction (0-100 → 0-1)
      const dispersion = dp.dispersionPct != null ? dp.dispersionPct / 100 : null

      await client.query(
        `
        INSERT INTO "earthbank_ftDatapoints" (
          "datapointName", "sampleID", "laboratory", "analyst",
          "mineralType", "ftMethod", "nGrains", "rhoS", "totalNs", "uPpm",
          "dPar", "pChi2", "dispersion",
          "centralAgeMa", "centralAgeUncertainty",
          "mtl", "stdDevMu", "nTracks"
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
        ON CONFLICT ("datapointName") DO UPDATE SET
          "centralAgeMa" = EXCLUDED."centralAgeMa",
          "centralAgeUncertainty" = EXCLUDED."centralAgeUncertainty"
        `,
        [
          dp.datapointName,
          dp.sampleID,
          dp.laboratory,
          dp.analyst,
          dp.mineralName,  // Maps to mineralType
          dp.ftMethod,
          dp.numGrains || null,  // Maps to nGrains
          dp.rhoS || null,
          dp.ns || null,  // Maps to totalNs
          dp.uPpm || null,
          dp.dpar || null,  // Maps to dPar
          dp.pChi2 || null,
          dispersion,  // Converted from percentage
          dp.centralAgeMa || null,
          dp.centralAgeErrorMa || null,  // Maps to centralAgeUncertainty
          dp.meanTrackLengthUm || null,  // Maps to mtl
          dp.trackLengthStdDev || null,  // Maps to stdDevMu
          dp.numTracksLengthMeasured || null  // Maps to nTracks
        ]
      )
      ftImported++
    }

    console.log(`   ✅ Imported ${ftImported} FT datapoints`)
    console.log(`   ⏭️ Skipped ${ftSkipped} QC standards (no sampleID)`)
    console.log()

    // ============================================================================
    // 3. CREATE HE DATAPOINTS (required before importing grains)
    // ============================================================================
    console.log('3️⃣ Creating He datapoints...')
    const heGrains = readCSV<HeGrain>('earthbank_heWholeGrainData.csv')

    // Get list of valid sampleIDs from database
    const validSamples = await client.query(`
      SELECT "sampleID" FROM "earthbank_samples"
      WHERE "datasetID" = 'McMillan(2024)-Malawi-Rift'
    `)
    const validSampleIDs = new Set(validSamples.rows.map(r => r.sampleID))

    // Extract unique datapointNames and create datapoints
    const uniqueDatapoints = new Map<string, { sampleID: string; date: string }>()
    let heGrainsSkipped = 0
    for (const grain of heGrains) {
      if (!uniqueDatapoints.has(grain.datapointName)) {
        // Parse datapointName: "MU19-48 2024-04-05 #3" → sampleID "MU19-48", date "2024-04-05"
        const parts = grain.datapointName.split(' ')
        const sampleID = parts[0]
        const date = parts[1] || ''

        // Only add if sampleID exists in database (skip QC standards)
        if (validSampleIDs.has(sampleID)) {
          uniqueDatapoints.set(grain.datapointName, { sampleID, date })
        } else {
          heGrainsSkipped++
        }
      }
    }

    let heDatapointsCreated = 0
    for (const [datapointName, info] of uniqueDatapoints) {
      await client.query(
        `
        INSERT INTO "earthbank_heDatapoints" (
          "datapointName", "sampleID", "laboratory", "analyst", "analysisDate"
        )
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT ("datapointName") DO NOTHING
        `,
        [
          datapointName,
          info.sampleID,
          'Melbourne Thermochronology',
          'Malcolm McMillan (0000-0002-5375-5680)',
          info.date || null
        ]
      )
      heDatapointsCreated++
    }

    console.log(`   ✅ Created ${heDatapointsCreated} He datapoints`)
    if (heGrainsSkipped > 0) {
      console.log(`   ⏭️ Skipped ${heGrainsSkipped} QC standard grains (no matching sample)`)
    }
    console.log()

    // ============================================================================
    // 4. IMPORT HE WHOLE GRAIN DATA
    // ============================================================================
    console.log('4️⃣ Importing He whole grain data...')

    let heImported = 0
    let heSkipped = 0
    for (const grain of heGrains) {
      // Skip grains whose datapoints weren't created (QC standards)
      if (!uniqueDatapoints.has(grain.datapointName)) {
        heSkipped++
        continue
      }

      // Convert mass from ug to mg (divide by 1000)
      const massMg = grain.grainMassUg ? grain.grainMassUg / 1000 : null

      await client.query(
        `
        INSERT INTO "earthbank_heWholeGrainData" (
          "datapointName", "grainName", "lengthUm", "widthUm",
          "ft", "rsUm", "massMg",
          "uConcentration", "thConcentration", "smConcentration", "eU",
          "uncorrectedHeAge", "correctedHeAge"
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        ON CONFLICT ("datapointName", "grainName") DO UPDATE SET
          "correctedHeAge" = EXCLUDED."correctedHeAge",
          "uncorrectedHeAge" = EXCLUDED."uncorrectedHeAge"
        `,
        [
          grain.datapointName,
          grain.grainID,  // Maps to grainName
          grain.grainLengthUm || null,
          grain.grainWidthUm || null,
          grain.ftValue || null,
          grain.sphericalRadiusUm || null,
          massMg,  // Converted from ug to mg
          grain.uPpm || null,
          grain.thPpm || null,
          grain.smPpm || null,
          grain.euPpm || null,
          grain.rawHeAgeMa || null,
          grain.correctedHeAgeMa || null
        ]
      )
      heImported++
    }

    console.log(`   ✅ Imported ${heImported} He grains`)
    if (heSkipped > 0) {
      console.log(`   ⏭️ Skipped ${heSkipped} QC standard grains`)
    }
    console.log()

    // ============================================================================
    // 5. IMPORT FT TRACK LENGTH DATA (BATCH INSERT)
    // ============================================================================
    console.log('5️⃣ Importing FT track length data...')
    const trackLengths = readCSV<TrackLength>('earthbank_ftTrackLengthData.csv')

    // Batch insert in chunks of 500 for performance
    const BATCH_SIZE = 500
    let tracksImported = 0

    for (let i = 0; i < trackLengths.length; i += BATCH_SIZE) {
      const batch = trackLengths.slice(i, i + BATCH_SIZE)

      // Build VALUES clause with placeholders
      const values = batch.map((_, idx) => {
        const offset = idx * 3
        return `($${offset + 1}, $${offset + 2}, $${offset + 3})`
      }).join(', ')

      // Flatten parameters array
      const params = batch.flatMap(track => [
        track.datapointName,
        track.trackLengthUm,
        track.cAxisAngle || null
      ])

      await client.query(
        `INSERT INTO "earthbank_ftTrackLengthData"
         ("datapointName", "lengthUm", "cAxisAngleDeg")
         VALUES ${values}`,
        params
      )

      tracksImported += batch.length
      if (i % 1000 === 0 && i > 0) {
        console.log(`   ... ${tracksImported} / ${trackLengths.length}`)
      }
    }

    console.log(`   ✅ Imported ${tracksImported} track length measurements`)
    console.log()

    await client.query('COMMIT')

    console.log('━'.repeat(80))
    console.log('IMPORT SUCCESSFUL!')
    console.log('━'.repeat(80))
    console.log()
    console.log('Summary:')
    console.log(`  ✅ ${samplesImported} samples`)
    console.log(`  ✅ ${ftImported} FT datapoints`)
    console.log(`  ✅ ${heDatapointsCreated} He datapoints`)
    console.log(`  ✅ ${heImported} He grains`)
    console.log(`  ✅ ${tracksImported} track lengths`)
    console.log()

    // Verification queries
    console.log('━'.repeat(80))
    console.log('VERIFICATION')
    console.log('━'.repeat(80))
    console.log()

    const sampleCount = await client.query(`
      SELECT COUNT(*) FROM "earthbank_samples"
      WHERE "datasetID" = 'McMillan(2024)-Malawi-Rift'
    `)
    console.log(`✅ Samples in database: ${sampleCount.rows[0].count}`)

    const ftCount = await client.query(`
      SELECT COUNT(*) FROM "earthbank_ftDatapoints"
      WHERE "sampleID" IN (
        SELECT "sampleID" FROM "earthbank_samples"
        WHERE "datasetID" = 'McMillan(2024)-Malawi-Rift'
      )
    `)
    console.log(`✅ FT datapoints in database: ${ftCount.rows[0].count}`)

    const ageRange = await client.query(`
      SELECT
        MIN("centralAgeMa") as min_age,
        MAX("centralAgeMa") as max_age,
        AVG("centralAgeMa") as avg_age
      FROM "earthbank_ftDatapoints"
      WHERE "sampleID" IN (
        SELECT "sampleID" FROM "earthbank_samples"
        WHERE "datasetID" = 'McMillan(2024)-Malawi-Rift'
      )
      AND "centralAgeMa" IS NOT NULL
    `)
    console.log(`✅ Age range: ${ageRange.rows[0].min_age.toFixed(1)} - ${ageRange.rows[0].max_age.toFixed(1)} Ma (avg: ${ageRange.rows[0].avg_age.toFixed(1)})`)

    const trackCount = await client.query(`
      SELECT COUNT(*) FROM "earthbank_ftTrackLengthData"
      WHERE "datapointName" IN (
        SELECT "datapointName" FROM "earthbank_ftDatapoints"
        WHERE "sampleID" IN (
          SELECT "sampleID" FROM "earthbank_samples"
          WHERE "datasetID" = 'McMillan(2024)-Malawi-Rift'
        )
      )
    `)
    console.log(`✅ Track lengths in database: ${trackCount.rows[0].count}`)

    console.log()

  } catch (error) {
    await client.query('ROLLBACK')
    console.error('❌ Import failed:', error)
    throw error
  } finally {
    client.release()
  }
}

// Run import
importDataset()
  .then(() => {
    console.log('✅ All done!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('Fatal error:', error)
    process.exit(1)
  })
