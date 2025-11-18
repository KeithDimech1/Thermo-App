# EarthBank Data Import Workflow

**Last Updated:** 2025-11-18 (IDEA-014)
**Schema:** EarthBank camelCase (earthbank_* tables)

---

## ✅ Recommended Workflow (Updated for IDEA-014)

### Step 1: Transform Excel/CSV to camelCase Headers

```bash
npx tsx scripts/db/transform-fair-csv-headers.ts <input.csv>
```

**What this does:**
- Reads CSV with any header format (snake_case, camelCase, etc.)
- Transforms to EarthBank canonical camelCase field names
- Outputs to `*_earthbank.csv` with correct headers
- Maps fields according to EarthBank templates (v2024-2025)

**Example:**
```bash
# Input: samples_raw.csv (sample_id, elevation_m)
# Output: samples_earthbank.csv (sampleName, elevationGround)
npx tsx scripts/db/transform-fair-csv-headers.ts data/samples_raw.csv
```

### Step 2: Import CSVs to Database

```bash
./scripts/db/import-earthbank-csvs.sh
```

**What this does:**
- Imports camelCase CSVs using PostgreSQL COPY
- Uses DIRECT_URL for migrations (required for schema changes)
- Imports to earthbank_* tables:
  - `earthbank_samples`
  - `earthbank_ftDatapoints`
  - `earthbank_ftTrackLengthData`
  - `earthbank_heDatapoints`
  - `earthbank_heWholeGrainData`
- Shows row counts after import
- Validates data integrity

**Example:**
```bash
# Edit script to point to your CSVs
# Then run:
./scripts/db/import-earthbank-csvs.sh
```

---

## ⚠️ Deprecated Workflows (DO NOT USE)

### ❌ TypeScript Import Scripts (Not Updated for IDEA-014)

These scripts use the OLD snake_case schema and have NOT been migrated:

- ❌ `scripts/db/import-earthbank-templates.ts` - Uses old `samples`, `ft_datapoints` tables
- ❌ `scripts/db/import-thermo-data.ts` - Uses old schema
- ❌ `scripts/db/migrate-v1-to-v2.ts` - Legacy migration

**Why deprecated:**
- Use snake_case table names (samples, not earthbank_samples)
- Use snake_case field names (sample_id, not sampleID)
- Would require 2-3 hours to update (1200+ lines)
- Shell script workflow is faster and simpler

**If you accidentally run them:**
- They show a 5-second warning with correct workflow
- Press Ctrl+C to cancel

---

## Schema Details

### Table Names (camelCase with earthbank_ prefix)

```
earthbank_samples              # Sample metadata
earthbank_ftDatapoints         # Fission-track analytical sessions
earthbank_ftCountData          # Grain-by-grain count data
earthbank_ftSingleGrainAges    # Single grain ages
earthbank_ftTrackLengthData    # Individual track measurements
earthbank_ftBinnedLengthData   # Length histograms
earthbank_heDatapoints         # (U-Th)/He analytical sessions
earthbank_heWholeGrainData     # He grain-level results
```

### Field Names (camelCase - matches EarthBank templates exactly)

**Samples:**
```
sampleName, IGSN, latitude, longitude, elevationGround,
geodeticDatum, verticalDatum, mineral, material, sampleKind
```

**FT Datapoints:**
```
sampleName, datapointName, centralAgeMa, pooledAgeMa,
centralAgeUncertaintyMa, pooledAgeUncertaintyMa, nGrains,
mtl, stdDevMu, pChi2, dispersion, dPar
```

**He Datapoints:**
```
sampleName, datapointName, meanCorrectedHeAge,
meanCorrectedHeAgeUncertainty, numAliquots
```

**He Grain Data:**
```
datapointName, aliquotID, correctedHeAge, correctedHeAgeUncertainty,
uncorrectedHeAge, ft, eU, uConcentration, thConcentration
```

---

## SQL Queries (PostgreSQL with case-sensitive identifiers)

When querying the new schema, you MUST use double-quoted identifiers:

```sql
-- ✅ CORRECT
SELECT "sampleName", "centralAgeMa"
FROM earthbank_ftDatapoints
WHERE "datasetID" = 'uuid-...';

-- ❌ WRONG (PostgreSQL lowercases unquoted identifiers)
SELECT sampleName, centralAgeMa
FROM earthbank_ftDatapoints;
```

### Using TypeScript Queries

Use the migrated query functions:

```typescript
import {
  getAllSamples,
  getSampleById,
  getFTDatapointsBySample
} from '@/lib/db/earthbank-queries';

// Returns camelCase objects
const { data: samples } = await getAllSamples({}, 50, 0);
// { sampleID: "MU19-05", centralAgeMa: 125.3, ... }
```

---

## Testing

After import, verify data:

```bash
# Run test suite
npx tsx scripts/db/test-earthbank-queries.ts

# Check row counts
./scripts/db/psql-direct.sh -c "
SELECT 'earthbank_samples' as table, COUNT(*) FROM earthbank_samples
UNION ALL
SELECT 'earthbank_ftDatapoints', COUNT(*) FROM \"earthbank_ftDatapoints\"
ORDER BY table;
"
```

---

## Migration Reference

See complete migration documentation:
- **IDEA-014 Log:** `build-data/ideas/debug/IDEA-014-migrate-to-earthbank-native-schema-camelcase-1-1-template-mapping.md`
- **Schema DDL:** `scripts/db/migrations/007_create_earthbank_tables.sql`
- **Live Ideas:** `build-data/ideas/live-ideas.md`

---

## Troubleshooting

### "column does not exist" error

**Problem:** Query uses snake_case field name
```sql
-- ❌ Error: column "sample_id" does not exist
SELECT sample_id FROM earthbank_samples;
```

**Solution:** Use double-quoted camelCase
```sql
-- ✅ Works
SELECT "sampleID" FROM earthbank_samples;
```

### "relation does not exist" error

**Problem:** Using old table name
```sql
-- ❌ Error: relation "samples" does not exist
SELECT * FROM samples;
```

**Solution:** Use earthbank_ prefix
```sql
-- ✅ Works
SELECT * FROM earthbank_samples;
```

### Import fails with field not found

**Problem:** CSV has wrong headers (snake_case or old names)

**Solution:** Run transform script first
```bash
npx tsx scripts/db/transform-fair-csv-headers.ts your-data.csv
# Creates your-data_earthbank.csv with correct headers
```

---

**End of Import Workflow Documentation**
