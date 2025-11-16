# reset-database.ts

**Path:** `scripts/db/reset-database.ts`
**Type:** Database Reset Script (DANGEROUS)
**Last Analyzed:** 2025-11-11
**File Size:** 150 lines

## What It Does

**⚠️ DANGER:** Drops all tables and data from the database. Use with extreme caution! Requires explicit user confirmation before executing. Useful for development iterations but should NEVER be run in production.

## Database Interactions

### Tables Dropped (ALL)
Drops all 8 tables in reverse dependency order:
1. **`cv_measurements`** - DROP TABLE CASCADE
2. **`test_configurations`** - DROP TABLE CASCADE
3. **`qc_samples`** - DROP TABLE CASCADE
4. **`assays`** - DROP TABLE CASCADE
5. **`manufacturers`** - DROP TABLE CASCADE
6. **`markers`** - DROP TABLE CASCADE
7. **`pathogens`** - DROP TABLE CASCADE
8. **`categories`** - DROP TABLE CASCADE

Also drops:
- All views (vw_test_config_details, vw_manufacturer_performance)
- All triggers and functions

### Operations Performed
- **DROP TABLE ... CASCADE** - Removes tables and dependent objects
- **DROP VIEW ... CASCADE** - Removes views
- Essentially runs the DROP section of `schema.sql`

## Key Features

### Safety Confirmations
**Three-step confirmation** process to prevent accidental data loss:

```
⚠️  WARNING: This will delete ALL data from the database!

Database: qc_results
Host:     localhost

Type 'reset' to confirm deletion: _
```

User must type exact word "reset" to proceed.

Then:
```
Are you absolutely sure? This cannot be undone! (yes/no): _
```

User must type "yes" to proceed.

If either confirmation fails, script exits safely.

### Database Information Display
Shows what will be deleted:
```
Database Details:
  Host:     localhost
  Port:     5432
  Database: qc_results
  Tables:   8

This will DELETE:
  • All 8 tables (categories, pathogens, markers, etc.)
  • All 461 rows of data
  • All database views
  • All triggers and functions
```

### Graceful Cancellation
```
❌ Reset cancelled. Database was not modified.
```
If user types anything other than expected confirmation.

## Key Exports

### Helper Function
- `askQuestion()` - Prompts user for input from command line

### Main Function
- `resetDatabase()` - Orchestrates the reset process with confirmations

## Dependencies

**External packages:**
- `pg` - PostgreSQL client
- `fs` - File system operations
- `path` - Path manipulation
- `readline` - Command-line input

**Schema file:**
- `scripts/db/schema.sql` - Reads DROP commands from here

## Used By

**NPM Scripts:**
- `npm run db:reset` - Reset database (interactive)

**Manual workflow:**
```bash
npm run db:reset   # Delete all data
npm run db:import  # Re-import data
npm run db:verify  # Verify import
```

## How It's Used

### Development Iterations
After changing schema or data:
```bash
npm run db:reset   # Clear old data
npm run db:schema  # Apply new schema
npm run db:import  # Import data with new structure
```

### Clean Slate
Start fresh during development:
```bash
npm run db:reset
npm run db:setup   # schema + import + verify
```

### Expected Output (Success)
```
⚠️  Database Reset Utility
========================================

⚠️  WARNING: This will delete ALL data from the database!

Database Details:
  Host:     localhost
  Port:     5432
  Database: qc_results

This will DELETE:
  • All tables and data (461 rows)
  • All views
  • All triggers and functions

Type 'reset' to confirm deletion: reset
Are you absolutely sure? This cannot be undone! (yes/no): yes

🔄 Resetting database...

✅ Database reset successfully!
========================================
All tables, views, and data have been deleted.

Next steps:
  1. Run: npm run db:schema
  2. Run: npm run db:import
  3. Run: npm run db:verify
========================================
```

### Expected Output (Cancelled)
```
⚠️  Database Reset Utility
========================================
...
Type 'reset' to confirm deletion: cancel

❌ Reset cancelled. Database was not modified.
```

## Safety Features

### Multiple Confirmations
Requires two explicit confirmations:
1. Type "reset" exactly
2. Type "yes" exactly

### Database Info Display
Shows exactly what will be deleted before proceeding.

### No Force Flag
Cannot bypass confirmations with command-line flag:
```bash
npm run db:reset --force  # ❌ Not supported!
```
Must always confirm interactively.

### Read-only by Default
Script reads database info first, only writes after confirmation.

### Clear Warnings
Prominent ⚠️  warnings throughout:
```
⚠️  WARNING: This will delete ALL data!
⚠️  This cannot be undone!
```

## Use Cases

### Schema Changes
After modifying `schema.sql`:
```bash
npm run db:reset    # Clear old schema
npm run db:schema   # Apply new schema
npm run db:import   # Import data
```

### Data Corrections
After fixing data in `qc-data.json`:
```bash
npm run db:reset
npm run db:import
npm run db:verify
```

### Testing Import Process
Test import script changes:
```bash
npm run db:reset
# Modify import-data.ts
npm run db:import   # Test changes
```

### Fresh Start
Remove all test data:
```bash
npm run db:reset
npm run db:setup
```

## When NOT to Use

### ❌ NEVER in Production
This script should **NEVER** be run on production databases:
- Use database backups instead
- Use migrations for schema changes
- Use UPDATE/DELETE for data corrections

### ❌ Not for Partial Cleanup
Don't use to delete specific records:
```bash
# Instead of: npm run db:reset
# Use SQL: DELETE FROM test_configurations WHERE id = 5;
```

### ❌ Not for Backup/Restore
Use `pg_dump` and `pg_restore` instead:
```bash
# Backup
pg_dump $DATABASE_URL > backup.sql

# Restore
psql $DATABASE_URL < backup.sql
```

## Notes

### Irreversible
Once executed, data is **permanently deleted**:
- No undo
- No backup created
- No confirmation email
- Immediate deletion

### Development Only
Intended for local development:
- Schema iterations
- Testing import scripts
- Cleaning test data
- Fresh start debugging

### Alternative: Drop Database
For complete cleanup (including database itself):
```bash
# More thorough than db:reset
dropdb qc_results
createdb qc_results
npm run db:setup
```

### Performance
Completes in <1 second:
- Simple DROP commands
- CASCADE handles dependencies
- No data migration

### Exit Codes
Returns appropriate exit codes:
- `0` - Reset successful
- `1` - Reset failed or cancelled

### Schema Consistency
After reset, you must:
1. Recreate schema: `npm run db:schema`
2. Import data: `npm run db:import`

Otherwise database is empty and unusable.

## Related Files
- `scripts/db/schema.sql` - Run after reset to recreate tables
- `scripts/db/import-data.ts` - Run after schema to restore data
- `scripts/db/README.md` - Complete setup guide

## Emergency Recovery

If you accidentally run this on production:
1. **STOP** - Don't run any more commands
2. Check database backups (Neon/Supabase have automatic backups)
3. Restore from backup:
   ```bash
   # Neon: Use Neon console to restore from point-in-time
   # Supabase: Use Supabase dashboard to restore
   # Local: pg_restore backup.sql
   ```
4. If no backups: Re-import from qc-data.json:
   ```bash
   npm run db:schema
   npm run db:import
   ```

**Prevention:**
- Use separate databases for dev/staging/production
- Never set production DATABASE_URL in local .env.local
- Use database roles with limited permissions
