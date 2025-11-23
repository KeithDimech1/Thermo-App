# query-mcmillan-data.js

**Path:** `scripts/query-mcmillan-data.js`
**Type:** Node.js Script
**Last Analyzed:** 2025-11-16
**File Size:** 109 lines

## What It Does

A command-line utility script that queries and displays thermochronology data from the McMillan 2024 Malawi Rift dataset. Provides formatted console output showing dataset metadata, sample ages, and summary statistics.

## Database Interactions

### Tables Used
- **`datasets`** (read: select)
  - Fields: `id`, `dataset_name`, `doi`, `study_area`, `analyst`, `laboratory`
  - Operations: SELECT dataset record by ID
  - Lines: 24-26

- **`samples`** (read: select)
  - Fields: `sample_id`, `lithology`, `dataset_id`
  - Operations: JOIN with ft_ages, filter by dataset_id
  - Lines: 43-58

- **`ft_ages`** (read: select)
  - Fields: `sample_id`, `central_age_ma`, `central_age_error_ma`, `pooled_age_ma`, `pooled_age_error_ma`, `dispersion_pct`, `p_chi2`, `n_grains`
  - Operations: JOIN with samples, aggregate statistics (MIN, MAX, AVG)
  - Lines: 43-58, 75-85

### Key Queries

```sql
-- Get dataset metadata (line 24)
SELECT * FROM datasets WHERE id = 2

-- Get all samples with age data (lines 43-58)
SELECT
  s.sample_id,
  s.lithology,
  fa.central_age_ma,
  fa.central_age_error_ma,
  fa.pooled_age_ma,
  fa.pooled_age_error_ma,
  fa.dispersion_pct,
  fa.p_chi2,
  fa.n_grains
FROM samples s
LEFT JOIN ft_ages fa ON s.sample_id = fa.sample_id
WHERE s.dataset_id = 2
ORDER BY fa.central_age_ma

-- Calculate summary statistics (lines 75-85)
SELECT
  COUNT(*) as total_samples,
  MIN(central_age_ma) as min_age,
  MAX(central_age_ma) as max_age,
  AVG(central_age_ma) as avg_age,
  AVG(n_grains) as avg_grains
FROM ft_ages fa
JOIN samples s ON fa.sample_id = s.sample_id
WHERE s.dataset_id = 2
```

### Database Documentation
→ See [datasets table docs](../readme/database/tables/datasets.md)
→ See [samples table docs](../readme/database/tables/samples.md)
→ See [ft_ages table docs](../readme/database/tables/ft_ages.md)

## Key Exports
- `queryMcMillanData()` - Main async function that executes queries and displays results

## Script Usage

```bash
# Run the script
node scripts/query-mcmillan-data.js

# Or make it executable and run directly
chmod +x scripts/query-mcmillan-data.js
./scripts/query-mcmillan-data.js
```

## Output Format

The script displays:
1. **Dataset Info** - Metadata about the McMillan 2024 dataset
2. **Sample Table** - All samples sorted by age with central/pooled ages
3. **Summary Statistics** - Total samples, age range, averages

Example output:
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
McMillan 2024 - Malawi Rift Data
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 DATASET INFO:
  ID: 2
  Name: McMillan 2024 - Malawi Rift
  DOI: 10.1029/2023TC008091
  ...

📋 SAMPLE DATA (15 total):
Sample ID    | Central Age (Ma)  | Pooled Age (Ma)   | Grains | Lithology
───────────────────────────────────────────────────────────────────────────────
MW-001       | 12.5 ± 1.2        | 12.3 ± 1.0        | 20     | Granite
...

📊 SUMMARY STATISTICS
Total Samples: 15
Age Range: 8.2 - 125.3 Ma
Average Age: 45.6 Ma
Avg Grains/Sample: 18
```

## Dependencies

**External packages:**
- dotenv (loads .env.local)
- pg (PostgreSQL client)

**Internal imports:**
- None (standalone script)

## Configuration

**Environment Variables (from .env.local):**
- `DATABASE_URL` - PostgreSQL connection string for Supabase database

**Hardcoded Values:**
- Dataset ID: `2` (McMillan 2024 - Malawi Rift)

## Used By
- Manual data exploration and verification
- Quality assurance checks after data import
- Example/reference for querying the database

## Notes
- **Purpose:** Development utility for exploring imported dataset
- **Dataset-specific:** Hardcoded to query dataset_id = 2 only
- **Error handling:** Catches and displays database errors gracefully
- **Connection management:** Properly releases client and closes pool
- **Output formatting:** Uses emoji and box drawing characters for readability
- **SSL:** Configured for Supabase PostgreSQL (SSL required)

## Related Files
- `scripts/db/import-thermo-data.ts` - Script that imports the data this script queries
- `lib/db/connection.ts` - Application database connection (different pattern)
- `.env.local` - Contains DATABASE_URL configuration
