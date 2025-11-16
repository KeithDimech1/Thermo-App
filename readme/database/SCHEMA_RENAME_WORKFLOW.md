# Database Schema Rename Workflow

**Last Updated:** 2025-11-13

---

## 📋 Overview

This workflow allows you to propose and apply database schema renames (tables and columns) using Excel as the interface, then automatically generate SQL migration scripts.

## 🎯 Purpose

- **Collaborative naming:** Share Excel file with team to propose better names
- **Documentation:** See current names with technical descriptions
- **Safe migrations:** Auto-generate reviewed SQL with rollback
- **Version control:** Track name changes over time

---

## 🔄 Complete Workflow

### Step 1: Generate Renameable Excel

```bash
npx tsx scripts/generate-renameable-schema-excel.ts
```

**Output:** `readme/database/DATABASE_SCHEMA_RENAMEABLE.xlsx`

This creates an Excel workbook with:
- **🔧 Schema Rename** sheet (PRIMARY) - Edit table/column names here
- **Overview** sheet - Database summary
- **Relationships** sheet - Foreign keys

### Step 2: Open Excel and Propose Renames

```bash
open readme/database/DATABASE_SCHEMA_RENAMEABLE.xlsx
```

In the **"🔧 Schema Rename"** sheet:

1. Find the table or column you want to rename
2. Look at the **"Current Description"** to understand what it does
3. Enter your proposed new name in **"Proposed New Name"** column (highlighted in yellow/green)
4. Save the file

**Example:**

| Type  | Table              | Current Name      | Current Description                    | Proposed New Name      |
|-------|-------------------|-------------------|----------------------------------------|------------------------|
| TABLE |                   | cv_measurements   | Coefficient of variation performance... | performance_metrics    |
| COL   | pathogens         | abbreviation      | Short code (e.g., CMV, HIV, HCV)       | pathogen_code          |
| COL   | test_configurations | quality_rating  | excellent, good, acceptable, poor...   | quality_grade          |

### Step 3: Process Renames and Generate SQL

```bash
npx tsx scripts/process-schema-renames.ts
```

This script will:
1. ✅ Read your proposed renames from Excel
2. ✅ Validate names (SQL-safe, no keywords, proper format)
3. ✅ Show summary of all proposed changes
4. ✅ Generate SQL migration script
5. ✅ Generate markdown summary report

**Output Files:**
- `migrations/rename-schema-YYYYMMDD.sql` - SQL migration
- `migrations/rename-summary-YYYYMMDD.md` - Summary report

### Step 4: Review Generated SQL

```bash
cat migrations/rename-schema-YYYYMMDD.sql
```

The generated SQL includes:
- Table renames (`ALTER TABLE ... RENAME TO ...`)
- Column renames (`ALTER TABLE ... RENAME COLUMN ... TO ...`)
- Comments explaining each change
- Rollback instructions (commented out)
- Wrapped in transaction (`BEGIN`/`COMMIT`)

**Example SQL:**
```sql
BEGIN;

-- Rename table: cv_measurements → performance_metrics
-- Purpose: Coefficient of variation performance metrics
ALTER TABLE "cv_measurements" RENAME TO "performance_metrics";

-- Table: pathogens
-- Rename column: abbreviation → pathogen_code
-- Purpose: Short code (e.g., CMV, HIV, HCV)
ALTER TABLE "pathogens" RENAME COLUMN "abbreviation" TO "pathogen_code";

COMMIT;
```

### Step 5: Backup Database

**⚠️ CRITICAL:** Always backup before running migrations!

```bash
# Backup entire database
pg_dump $DATABASE_URL > backup-$(date +%Y%m%d).sql

# Or backup just the schema
pg_dump --schema-only $DATABASE_URL > schema-backup-$(date +%Y%m%d).sql
```

### Step 6: Test in Development (Recommended)

If you have a dev/staging database:

```bash
# Apply to dev database first
psql $DEV_DATABASE_URL -f migrations/rename-schema-YYYYMMDD.sql

# Test your application
npm run dev

# If good, proceed to production
# If bad, rollback (instructions in migration file)
```

### Step 7: Apply Migration to Production

```bash
# Apply the migration
psql $DATABASE_URL -f migrations/rename-schema-YYYYMMDD.sql

# Verify changes
psql $DATABASE_URL -c "\dt"  # List all tables
psql $DATABASE_URL -c "\d table_name"  # Describe specific table
```

### Step 8: Update Application Code

After renaming in database, update:

1. **TypeScript Types:**
   ```typescript
   // lib/types/qc-data.ts
   interface PerformanceMetrics {  // was: CvMeasurements
     id: number;
     // ...
   }
   ```

2. **Database Queries:**
   ```typescript
   // lib/db/queries.ts
   const sql = `SELECT * FROM performance_metrics WHERE ...`;  // was: cv_measurements
   ```

3. **Views (if any):**
   ```sql
   -- May need to recreate views that reference renamed objects
   DROP VIEW IF EXISTS vw_test_config_details CASCADE;
   CREATE VIEW vw_test_config_details AS ...
   ```

4. **Documentation:**
   - Regenerate Excel: `npx tsx scripts/generate-renameable-schema-excel.ts`
   - Update ERD if needed
   - Update README files

---

## 🛡️ Validation Rules

The processor validates proposed names:

### ✅ Valid Names
- Start with letter or underscore: `my_table`, `_temp`
- Contain only letters, numbers, underscores: `table_name_2`
- Lowercase (PostgreSQL convention): `my_table`
- Max 63 characters

### ❌ Invalid Names
- SQL keywords: `SELECT`, `TABLE`, `INDEX`, `USER`
- Special characters: `my-table`, `my.table`, `my table`
- Start with number: `2_tables`
- Too long: `this_is_a_very_long_table_name_that_exceeds_sixty_three_characters`

### ⚠️ Warnings
- Uppercase letters: `MyTable` → recommend `my_table`
- Mixed case: `myTable` → recommend `my_table`

---

## 📊 Excel Sheet Structure

### 🔧 Schema Rename Sheet

| Column | Description | Editable |
|--------|-------------|----------|
| Type | TABLE or COL | No |
| Table | Parent table name | No |
| Current Name | Existing name in database | No |
| Current Description | Brief technical description | No |
| **Proposed New Name** | ✏️ **EDIT THIS** | ✅ **YES** |
| Data Type | PostgreSQL data type | No |
| Status | Current/Renamed | No |

**Color Coding:**
- 🟢 **Green cells** - Table name proposals
- 🟡 **Yellow cells** - Column name proposals

---

## 🔄 Rollback

If migration causes issues, rollback instructions are at the bottom of each migration file.

**Manual Rollback:**
```sql
BEGIN;

-- Reverse table renames
ALTER TABLE "new_table_name" RENAME TO "old_table_name";

-- Reverse column renames
ALTER TABLE "table_name" RENAME COLUMN "new_col" TO "old_col";

COMMIT;
```

**From Backup:**
```bash
# Restore from backup (nuclear option)
psql $DATABASE_URL < backup-YYYYMMDD.sql
```

---

## 📁 File Organization

```
project/
├── readme/database/
│   └── DATABASE_SCHEMA_RENAMEABLE.xlsx    # Edit this
├── migrations/
│   ├── rename-schema-20251113.sql         # Generated SQL
│   └── rename-summary-20251113.md         # Generated summary
└── scripts/
    ├── generate-renameable-schema-excel.ts   # Step 1
    └── process-schema-renames.ts             # Step 3
```

---

## 💡 Best Practices

### Naming Conventions

**Tables:**
- Use plural nouns: `users`, `orders`, `test_configurations`
- Describe what the table stores: `performance_metrics` not `data`
- Keep under 30 characters if possible

**Columns:**
- Use singular nouns: `name`, `created_at`, `user_id`
- Foreign keys end in `_id`: `user_id`, `order_id`
- Booleans start with `is_` or `has_`: `is_active`, `has_shipped`
- Timestamps end in `_at` or `_date`: `created_at`, `expire_date`

### Migration Strategy

**When to Rename:**
- ✅ Before launch (no production data)
- ✅ During scheduled maintenance
- ✅ When names are genuinely confusing
- ✅ When consolidating schemas

**When NOT to Rename:**
- ❌ Just for aesthetics (if current names work fine)
- ❌ During high-traffic periods
- ❌ Without team consensus
- ❌ Without updating all dependent code

---

## 🔧 Troubleshooting

### "Excel file not found"
```bash
# Generate it first
npx tsx scripts/generate-renameable-schema-excel.ts
```

### "No renames found"
- Open Excel file
- Go to "🔧 Schema Rename" sheet
- Add names in "Proposed New Name" column (yellow/green cells)
- Save file

### "Invalid SQL keyword"
- Avoid reserved words: SELECT, TABLE, INDEX, etc.
- Add prefix or suffix: `table_data`, `user_index_key`

### "Views/Functions broken after rename"
- Views reference old names - need to recreate
- Check migration file for view update section
- Run `\dv` in psql to see affected views

### "Foreign keys not working"
- Table renames are handled first
- Column renames come after
- Foreign key constraints should auto-update

---

## 📚 Related Documentation

- **ERD:** [ENTITY_RELATIONSHIP_DIAGRAM.md](ENTITY_RELATIONSHIP_DIAGRAM.md)
- **Schema Summary:** [SCHEMA_SUMMARY.md](SCHEMA_SUMMARY.md)
- **Individual Tables:** [tables/](tables/) folder
- **Code Usage:** [CODE_USAGE.md](CODE_USAGE.md)

---

## 🎓 Example: Complete Rename Workflow

Let's rename `cv_measurements` to `performance_metrics`:

```bash
# 1. Generate Excel
npx tsx scripts/generate-renameable-schema-excel.ts

# 2. Edit Excel
# Open: readme/database/DATABASE_SCHEMA_RENAMEABLE.xlsx
# Find row: TABLE | | cv_measurements | ...
# Enter in "Proposed New Name": performance_metrics
# Save file

# 3. Generate migration
npx tsx scripts/process-schema-renames.ts

# Output:
# ✅ Found 1 proposed renames
# 📊 TABLE RENAMES:
#    cv_measurements → performance_metrics
# ✅ SQL migration generated!
# 📁 File: migrations/rename-schema-20251113.sql

# 4. Review SQL
cat migrations/rename-schema-20251113.sql

# 5. Backup
pg_dump $DATABASE_URL > backup.sql

# 6. Apply
psql $DATABASE_URL -f migrations/rename-schema-20251113.sql

# 7. Verify
psql $DATABASE_URL -c "\d performance_metrics"

# 8. Update code
# Update all references in:
# - lib/types/qc-data.ts
# - lib/db/queries.ts
# - app/**/*.tsx

# 9. Regenerate docs
npx tsx scripts/generate-renameable-schema-excel.ts
```

---

**Generated:** 2025-11-13
**Version:** 1.0.0
