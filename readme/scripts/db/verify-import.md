# verify-import.ts

**Path:** `scripts/db/verify-import.ts`
**Type:** Database Validation Script
**Last Analyzed:** 2025-11-11
**File Size:** 250+ lines

## What It Does

Comprehensive validation script that runs 20+ automated tests to verify database import succeeded correctly. Tests row counts, foreign key integrity, data constraints, view functionality, and sample queries.

## Database Interactions

### Tables Read (All 8 tables)
- **`categories`** - Verify 8 rows, check valid names
- **`pathogens`** - Verify 16 rows, check FK to categories
- **`markers`** - Verify 28 rows, check FKs to pathogens + categories
- **`manufacturers`** - Verify 9 rows
- **`assays`** - Verify 132 rows, check FK to manufacturers
- **`qc_samples`** - Verify 16 rows
- **`test_configurations`** - Verify 132 rows, check FKs to markers + assays + qc_samples
- **`cv_measurements`** - Verify 132 rows, check FK to test_configurations

### Views Read
- **`vw_test_config_details`** - Verify joins work correctly
- **`vw_manufacturer_performance`** - Verify aggregation logic

### Operations Performed
- **SELECT COUNT(*)** - Row count validation
- **SELECT ... WHERE FK IS NULL** - Orphaned record detection
- **SELECT ... WHERE [constraint]** - Data validation
- **Complex JOINs** - Relationship verification

## Test Categories

### 1. Table Row Counts
Verifies exact row counts match expectations:
```
✅ categories                 8 rows
✅ pathogens                  16 rows
✅ markers                    28 rows
✅ manufacturers              9 rows
✅ assays                     132 rows
✅ qc_samples                 16 rows
✅ test_configurations        132 rows
✅ cv_measurements            132 rows
```

### 2. Foreign Key Relationships
Checks all FKs reference valid records:
```
✅ Markers → Pathogens       All references valid
✅ Markers → Categories      All references valid
✅ Assays → Manufacturers    All references valid
✅ Configs → Markers         All references valid
✅ Configs → Assays          All references valid
✅ Configs → QC Samples      All references valid
✅ CV Measurements → Configs All references valid
```

### 3. Data Integrity
Validates CHECK constraints and ranges:
```
✅ Quality ratings           All valid (excellent/good/acceptable/poor)
✅ Test types                All valid (serology/nat/both)
✅ CV percentages            All 0-100 range
✅ Event counts              All non-negative
✅ No NULL violations        Required fields populated
```

### 4. View Functionality
Tests database views work correctly:
```
✅ vw_test_config_details    Returns 132 rows
✅ All joins successful      No NULL manufacturer/marker names
✅ vw_manufacturer_performance Returns 9 rows (1 per manufacturer)
✅ Aggregations correct      Counts sum to 132
```

### 5. Sample Queries
Executes realistic queries:
```
✅ CMV tests query           Returns expected results
✅ Abbott configs query      Manufacturer filter works
✅ Excellent quality query   Rating filter works
✅ Search functionality      Text search returns matches
```

## Key Exports

### Helper Functions
- `log()` - Colored console logging (pass/fail/info)

### Test Functions
- `testTableCounts()` - Validates row counts (8 tables)
- `testForeignKeys()` - Validates all FK relationships (7 FK checks)
- `testDataIntegrity()` - Validates constraints and ranges (5 checks)
- `testViews()` - Validates database views (2 views)
- `testSampleQueries()` - Runs real-world queries (4 queries)

### Statistics
- `showStatistics()` - Displays database statistics summary

### Main Function
- `verify()` - Orchestrates all tests and reports results

## Dependencies

**External packages:**
- `pg` - PostgreSQL client

**Internal dependencies:**
- None (standalone validation)

## Used By

**NPM Scripts:**
- `npm run db:verify` - Run validation standalone
- `npm run db:setup` - Automatically runs after import

## How It's Used

### Standalone Verification
```bash
# After import
npm run db:verify
```

### Automatic Verification
```bash
# Complete setup (includes verification)
npm run db:setup
```

### Expected Output

```
📋 QC Results Database Verification
========================================

📋 Testing table row counts...
✅ categories                 8 rows
✅ pathogens                  16 rows
✅ markers                    28 rows
✅ manufacturers              9 rows
✅ assays                     132 rows
✅ qc_samples                 16 rows
✅ test_configurations        132 rows
✅ cv_measurements            132 rows

All counts match expected values ✓

🔗 Testing foreign key relationships...
✅ Markers → Pathogens       All references valid
✅ Markers → Categories      All references valid
✅ Assays → Manufacturers    All references valid
✅ Test Configs → Markers    All references valid
✅ Test Configs → Assays     All references valid
✅ Test Configs → QC Samples All references valid
✅ CV Measurements → Configs All references valid

All foreign keys valid ✓

📊 Testing data integrity...
✅ Quality ratings           All valid
✅ Test types                All valid
✅ CV percentages in range   0-100%
✅ No orphaned records       All FKs valid
✅ No NULL violations        Required fields populated

Data integrity checks passed ✓

👁️  Testing views...
✅ vw_test_config_details    132 rows returned
✅ vw_manufacturer_performance 9 rows returned

Views working correctly ✓

🔍 Testing sample queries...
✅ CMV tests query           Found 8 results
✅ Abbott configs            Found 48 results
✅ Excellent quality         Found 48 results
✅ Search "Hepatitis B"      Found 5 results

Sample queries successful ✓

========================================
📊 Database Statistics
========================================
Total Configurations: 132
Quality Breakdown:
  Excellent: 48 (36.4%)
  Good: 29 (22.0%)
  Acceptable: 27 (20.5%)
  Poor: 28 (21.2%)

Manufacturers: 9
Average CV <10%: 52.3%

========================================
✅ All tests passed! ✨
Database is ready to use!
========================================
```

## Error Detection

### Row Count Mismatch
```
❌ markers                    25 rows (expected 28)
FAILED: Missing 3 marker records
```

### Foreign Key Violations
```
❌ Orphaned markers found!
  Found 3 markers with invalid pathogen_id
  Marker IDs: 15, 18, 23
```

### Data Constraint Violations
```
❌ Invalid quality ratings found!
  Found 2 configs with rating 'invalid'
  Valid values: excellent, good, acceptable, poor, unknown
```

### View Errors
```
❌ vw_test_config_details returned 0 rows
Check if view was created correctly
```

## Test Coverage

### What's Tested
- ✅ All 8 tables have correct row counts
- ✅ All 7 foreign key relationships are valid
- ✅ All CHECK constraints are satisfied
- ✅ All percentages are in valid range (0-100)
- ✅ All required fields are populated
- ✅ Both views return expected row counts
- ✅ Sample queries return results
- ✅ Text search functionality works

### What's NOT Tested
- ❌ Performance/query speed (use EXPLAIN ANALYZE)
- ❌ Concurrent access (use pgbench)
- ❌ Backup/restore (manual testing)
- ❌ Application integration (E2E tests)

## Use Cases

### Post-Import Validation
After running `npm run db:import`, verify everything worked:
```bash
npm run db:verify
```

### After Schema Changes
After modifying `schema.sql`, verify constraints still hold:
```bash
npm run db:reset
npm run db:import
npm run db:verify
```

### Continuous Integration
Include in CI pipeline:
```yaml
# .github/workflows/test.yml
- run: npm run db:setup  # Creates schema + imports + verifies
```

### Database Health Check
Periodically verify production database integrity:
```bash
# In production
npm run db:verify
```

## Notes

### Read-Only
This script only reads data, never writes:
- Safe to run in production
- No risk of data corruption
- Can run multiple times

### Fast Execution
Completes in ~2-3 seconds:
- No heavy computations
- Simple COUNT and JOIN queries
- Indexed foreign key lookups

### Comprehensive
Catches common issues:
- Missing data (row count checks)
- Broken relationships (FK validation)
- Invalid data (constraint checks)
- Schema problems (view verification)

### Exit Codes
Returns appropriate exit codes for CI:
- `0` - All tests passed
- `1` - One or more tests failed

### Extensibility
Easy to add more tests:
```typescript
// Add custom validation
async function testCustomLogic() {
  const result = await pool.query(`
    SELECT * FROM test_configurations
    WHERE events_examined > 100
  `);
  log(`Large sample sizes: ${result.rowCount} configs`, 'pass');
}
```

## Related Files
- `scripts/db/import-data.ts` - Must run before this script
- `scripts/db/schema.sql` - Defines tables and views being tested
- `lib/types/qc-data.ts` - Type definitions for validation
- `scripts/db/README.md` - Complete setup guide
