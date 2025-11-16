# schema.sql

**Path:** `scripts/db/schema.sql`
**Type:** Database DDL (Data Definition Language)
**Last Analyzed:** 2025-11-11
**File Size:** 350+ lines

## What It Does

Creates the complete PostgreSQL database schema for QC Results, including 8 normalized tables, 2 views, indexes, constraints, and comments. Designed for both local PostgreSQL and cloud databases (Neon, Supabase).

## Database Tables Created

### Core Reference Tables
1. **`categories`** - Disease category groupings (8 rows)
   - TORCH, Hepatitis, Retrovirus, COVID-19, EBV, etc.

2. **`pathogens`** - Infectious organisms (16 rows)
   - CMV, HIV, HCV, HBV, Toxoplasma, Rubella, etc.

3. **`markers`** - Test markers (28 rows)
   - anti-CMV IgG, HBsAg, anti-HIV, etc.

4. **`manufacturers`** - Equipment manufacturers (9 rows)
   - Abbott, Roche, Siemens, Bio-Rad, etc.

5. **`assays`** - Testing platforms (132 rows)
   - ARCHITECT CMV IgG, Elecsys Anti-HBs, etc.

6. **`qc_samples`** - QC control materials (16 rows)
   - Optitrol 1, Optitrol 2, Optitrol 3, etc.

### Data Tables
7. **`test_configurations`** - Unique marker+assay+QC combinations (132 rows)
   - Links marker, assay, QC sample
   - Stores test type, quality rating, events examined

8. **`cv_measurements`** - Coefficient of Variation performance data (132 rows)
   - CV <10%, 10-15%, 15-20%, >20% breakdowns
   - Counts and percentages for each threshold

## Database Views Created

### `vw_test_config_details`
Complete test configuration details with all joins:
- Marker name, pathogen, category
- Assay name, platform, methodology
- Manufacturer name
- QC sample name
- CV performance breakdown
- Quality rating

Equivalent to `getTestConfigDetails()` function in lib/utils/qc-data-loader.ts

### `vw_manufacturer_performance`
Performance summary by manufacturer:
- Total configurations
- Average CV <10% percentage
- Count of excellent/good/acceptable/poor ratings
- Overall performance metrics

Equivalent to `getManufacturerPerformance()` function

## Key Features

### Referential Integrity
- Foreign keys enforce relationships
- ON DELETE RESTRICT prevents orphaned records
- Cascading updates where appropriate

### Data Validation
- CHECK constraints for enum values
- NOT NULL constraints for required fields
- UNIQUE constraints prevent duplicates

### Performance Optimization
- Indexes on foreign key columns
- Full-text search index on marker names (using pg_trgm)
- Composite indexes for common query patterns

### Normalization
- 3NF (Third Normal Form) design
- No redundant data storage
- Single source of truth for each entity

### PostgreSQL Extensions
- `pg_trgm` - Fuzzy text search capabilities

### Timestamps
- `created_at` on all tables (default: CURRENT_TIMESTAMP)
- `updated_at` on key tables with auto-update trigger

### Comments
- Table-level comments explain purpose
- Column-level comments provide context

## How It's Used

### Initial Setup
```bash
# Run once to create schema
npm run db:schema

# Or manually with psql
psql $DATABASE_URL -f scripts/db/schema.sql
```

### Schema Reset (WARNING: Deletes all data!)
```bash
npm run db:reset
```

The script:
1. Drops all existing tables, views, functions (CASCADE)
2. Creates fresh schema
3. Idempotent (safe to re-run)

## Database Relationships

```
categories (8)
  └─→ pathogens (16)
       └─→ markers (28) ────────┐
                                 │
manufacturers (9)                │
  └─→ assays (132) ──────────────┼─→ test_configurations (132)
                                 │         └─→ cv_measurements (132)
qc_samples (16) ─────────────────┘
```

## Dependencies

**External:**
- PostgreSQL 14+ (or compatible: Neon, Supabase, Railway, etc.)
- `pg_trgm` extension (for text search)

**Related Files:**
- `lib/types/qc-data.ts` - TypeScript interfaces matching these tables
- `scripts/db/import-data.ts` - Imports data into these tables
- `scripts/db/verify-import.ts` - Validates schema and data integrity
- `build-data/assets/qc-data.json` - Source data to import

## Used By

**NPM Scripts:**
- `npm run db:schema` - Creates/updates schema
- `npm run db:reset` - Drops and recreates schema
- `npm run db:setup` - Complete setup (schema + import + verify)

**Import Process:**
- `scripts/db/import-data.ts` - Inserts data in dependency order

**Verification:**
- `scripts/db/verify-import.ts` - Tests foreign keys, counts, constraints

## Example Queries

### Get All CMV Tests
```sql
SELECT * FROM vw_test_config_details
WHERE marker_name LIKE '%CMV%'
ORDER BY cv_lt_10_percentage DESC;
```

### Compare Manufacturers
```sql
SELECT * FROM vw_manufacturer_performance
ORDER BY avg_cv_lt_10_pct DESC;
```

### Find Poor Performers
```sql
SELECT marker_name, assay_name, manufacturer_name, cv_gt_20_percentage
FROM vw_test_config_details
WHERE cv_gt_20_percentage > 20
ORDER BY cv_gt_20_percentage DESC;
```

### Full-Text Search for Hepatitis Tests
```sql
SELECT * FROM vw_test_config_details
WHERE marker_name % 'Hepatitis B'  -- Fuzzy match with pg_trgm
OR category_name = 'Hepatitis';
```

## Notes

### Design Decisions

**Why 8 tables?**
- Normalized to eliminate redundancy
- Each entity has single source of truth
- Easier to maintain and update

**Why separate cv_measurements table?**
- Keeps test_configurations lean
- Easy to add more CV metrics later
- 1:1 relationship (could be combined, but separated for clarity)

**Why views?**
- Pre-joins frequently accessed data
- Simpler queries in application code
- Performance (views can be materialized if needed)

### Compatibility

**Works with:**
- ✅ Local PostgreSQL 14+
- ✅ Neon (serverless Postgres)
- ✅ Supabase
- ✅ Railway
- ✅ Vercel Postgres
- ✅ Any PostgreSQL-compatible database

**Extensions required:**
- `pg_trgm` (usually available by default)

### Safety Features

**Idempotent:**
- Safe to run multiple times
- DROP IF EXISTS prevents errors
- Clean slate on each run

**Data Protection:**
- Foreign keys use RESTRICT (not CASCADE)
- Prevents accidental data loss
- Must delete in reverse dependency order

### Next Steps

After schema creation:
1. Import data: `npm run db:import`
2. Verify: `npm run db:verify`
3. Start querying from Next.js app

## Related Files
- `build-data/documentation/DATABASE-SCHEMA.md` - Complete schema reference (45 pages)
- `lib/types/qc-data.ts` - TypeScript interfaces matching this schema
- `scripts/db/import-data.ts` - Data import using this schema
- `scripts/db/README.md` - Complete setup guide
