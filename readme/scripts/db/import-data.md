# import-data.ts

**Path:** `scripts/db/import-data.ts`
**Type:** Database Import Script
**Last Analyzed:** 2025-11-11
**File Size:** 300+ lines

## What It Does

Transaction-safe data import script that loads 461 rows from `qc-data.json` into PostgreSQL database across 8 tables. Includes progress reporting, error handling, and idempotent imports (safe to re-run).

## Database Interactions

### Tables Written (in dependency order)
1. **`categories`** - INSERT 8 rows
   - Disease categories (TORCH, Hepatitis, etc.)

2. **`pathogens`** - INSERT 16 rows
   - Infectious organisms (CMV, HIV, HCV, etc.)

3. **`markers`** - INSERT 28 rows
   - Test markers (anti-CMV IgG, HBsAg, etc.)

4. **`manufacturers`** - INSERT 9 rows
   - Equipment manufacturers (Abbott, Roche, etc.)

5. **`assays`** - INSERT 132 rows
   - Testing platforms (ARCHITECT, Elecsys, etc.)

6. **`qc_samples`** - INSERT 16 rows
   - QC control materials (Optitrol series)

7. **`test_configurations`** - INSERT 132 rows
   - Unique marker+assay+QC combinations
   - Links: marker_id, assay_id, qc_sample_id (FKs)

8. **`cv_measurements`** - INSERT 132 rows
   - Coefficient of Variation performance data
   - Links: config_id (FK to test_configurations)

**Total:** 461 rows imported

### Operations Performed
- **INSERT** with ON CONFLICT UPDATE (upsert pattern)
- **BEGIN/COMMIT transaction** (atomic - all or nothing)
- **ROLLBACK on error** (ensures consistency)

## Key Features

### Transaction Safety
```typescript
await client.query('BEGIN');
try {
  // Import all 8 tables
  await client.query('COMMIT');
} catch (error) {
  await client.query('ROLLBACK');
  throw error;
}
```
If any step fails, entire import is rolled back.

### Idempotent Imports
```sql
INSERT INTO categories (id, name, description)
VALUES ($1, $2, $3)
ON CONFLICT (id) DO UPDATE
SET name = EXCLUDED.name,
    description = EXCLUDED.description
```
Safe to re-run without creating duplicates.

### Progress Reporting
```
📊 Importing 8 categories...
  Categories: [████████████████████] 8/8 (100.0%)
✅ Imported successfully

📊 Importing 16 pathogens...
  Pathogens: [████████████████████] 16/16 (100.0%)
✅ Imported successfully
```
Real-time progress bars with emoji indicators.

### SSL Auto-Detection
```typescript
const useSSL = DATABASE_URL.includes('neon.tech') ||
               DATABASE_URL.includes('supabase');

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: useSSL ? { rejectUnauthorized: false } : undefined
});
```
Automatically enables SSL for cloud databases.

## Key Exports

### Helper Functions
- `log()` - Colored console logging (info/success/error/warn)
- `logProgress()` - Progress bar rendering with percentages
- `loadQCData()` - Loads and parses qc-data.json

### Import Functions (one per table)
- `importCategories(client, data)`
- `importPathogens(client, data)`
- `importMarkers(client, data)`
- `importManufacturers(client, data)`
- `importAssays(client, data)`
- `importQCSamples(client, data)`
- `importTestConfigurations(client, data)`
- `importCVMeasurements(client, data)`

### Main Function
- `importData()` - Orchestrates entire import process

## Dependencies

**External packages:**
- `pg` - PostgreSQL client for Node.js
- `fs` - File system operations
- `path` - Path manipulation

**Internal dependencies:**
- `lib/types/qc-data.ts` - Type definitions

**Data file:**
- `build-data/assets/qc-data.json` - Source data (140KB)

## Used By

**NPM Scripts:**
- `npm run db:import` - Run import standalone
- `npm run db:setup` - Schema + import + verify

**Related Scripts:**
- `scripts/db/verify-import.ts` - Validates import succeeded
- `scripts/db/reset-database.ts` - Clears data before re-import

## How It's Used

### Standalone Import
```bash
# After schema is created
npm run db:import
```

### Full Setup
```bash
# Complete database setup
npm run db:setup
# Runs: schema.sql → import-data.ts → verify-import.ts
```

### Expected Output
```
📊 Database Connection Test
========================================
✅ Connection successful!

📊 Importing 8 categories...
  Categories: [████████████████████] 8/8 (100.0%)
📊 Importing 16 pathogens...
  Pathogens: [████████████████████] 16/16 (100.0%)
📊 Importing 28 markers...
  Markers: [████████████████████] 28/28 (100.0%)
...

✅ Transaction committed successfully!
========================================
✅ Import completed successfully!
========================================

Duration: 2.34s
Categories: 8
Pathogens: 16
Markers: 28
Manufacturers: 9
Assays: 132
QC Samples: 16
Test Configurations: 132
CV Measurements: 132
Total rows: 461
```

## Error Handling

### Connection Errors
```
❌ Error: DATABASE_URL environment variable not set
Please create .env.local with your database connection string.
```

### Import Errors
```
❌ Import failed!
Error: Foreign key violation - pathogen_id 999 does not exist
Rolling back transaction...
```
All changes are reverted on error.

### Data Validation Errors
```
❌ Error inserting marker:
Check constraint violation: antibody_type must be IgG, IgM, Antigen, etc.
```

## Import Order (Critical!)

Tables must be imported in dependency order:
```
categories (no dependencies)
  ↓
pathogens (needs categories)
  ↓
markers (needs pathogens + categories)

manufacturers (no dependencies)
  ↓
assays (needs manufacturers)

qc_samples (no dependencies)
  ↓
test_configurations (needs markers + assays + qc_samples)
  ↓
cv_measurements (needs test_configurations)
```

Violating this order will cause foreign key errors.

## Notes

### Performance
- Imports 461 rows in ~2-3 seconds
- Uses parameterized queries (SQL injection safe)
- Single transaction (atomic consistency)

### Idempotency
Safe to run multiple times:
- ON CONFLICT DO UPDATE overwrites existing rows
- No duplicate data created
- Useful for:
  - Testing/development iterations
  - Schema changes (reset + reimport)
  - Data corrections

### Environment Variables
Requires `.env.local` with:
```env
DATABASE_URL=postgresql://user:pass@host/database
# or
POSTGRES_URL=postgresql://...
```

### SSL/TLS
Automatically detects cloud databases:
- Neon → SSL enabled
- Supabase → SSL enabled
- Local PostgreSQL → No SSL

### Transaction Isolation
Uses default READ COMMITTED isolation level:
- Other connections see data only after COMMIT
- Partial imports are invisible to other queries
- Ensures consistency

## Related Files
- `scripts/db/schema.sql` - Must run before this script
- `scripts/db/verify-import.ts` - Run after to validate
- `build-data/assets/qc-data.json` - Source data file
- `lib/types/qc-data.ts` - Type definitions
- `scripts/db/README.md` - Complete setup guide
- `.env.local.example` - Database configuration template
