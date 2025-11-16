# Thermochronology Data Import Workflow

**Last Updated:** 2025-11-16
**Purpose:** Zero-error import workflow for thermochronology data

---

## 🎯 Lessons Learned

### What Went Wrong (First Malawi Import)

1. **Invalid data in CSVs** - Footer text extracted as sample rows
2. **Schema mismatches** - Column names didn't match database
3. **No pre-validation** - Errors discovered during import, not before
4. **Manual fixes required** - Multiple failed attempts and cleanups

### The Fix: Validate Early, Import Once

**New Principle:** By the time we run `import`, data must be **perfect and validated**.

---

## 📋 New Workflow (Zero Errors)

### Step 1: Extract from PDF

```bash
/thermoextract 'path/to/paper.pdf'
```

**What it does:**
- Extracts tables from PDF
- **Auto-filters invalid rows** using sample ID pattern (`^[A-Z]{2,4}\d{2}-\d{2,3}$`)
- Transforms to FAIR schema (4 separate tables)
- Generates CSV files

**Output:**
- `<dataset>-samples.csv`
- `<dataset>-ft_ages.csv`
- `<dataset>-ft_counts.csv`
- `<dataset>-ft_track_lengths.csv`
- `<dataset>-extraction-report.md`

**Key Improvements:**
- ✅ Filters out footer/header metadata during extraction
- ✅ Validates sample ID format
- ✅ Removes duplicate rows
- ✅ Parses ages with errors ("245.3 ± 49.2" → separate columns)

---

### Step 2: Validate BEFORE Import

```bash
python scripts/db/validate-import.py build-data/learning/thermo-papers/data
```

**What it checks:**
1. **Schema compliance**
   - All required columns present
   - No extra columns that would fail insert
   - Column names match database exactly

2. **Data type validation**
   - String lengths within limits (e.g., sample_id < 50 chars)
   - Numeric fields are actually numeric
   - No nulls in required fields

3. **Sample ID format**
   - Pattern: `XX##-###` (e.g., MU19-05)
   - No duplicates
   - No invalid characters

4. **Foreign key integrity**
   - All referenced sample_ids exist (or will exist)

5. **Data quality**
   - Ages within geological ranges
   - Error values reasonable

**Output:**
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PRE-IMPORT VALIDATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

→ Validating Malawi-2024-samples.csv...
  ✅ VALID (34 rows)

→ Validating Malawi-2024-ft_ages.csv...
  ✅ VALID (34 rows)

→ Validating Malawi-2024-ft_counts.csv...
  ✅ VALID (34 rows)

→ Validating Malawi-2024-ft_track_lengths.csv...
  ✅ VALID (34 rows)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ ALL FILES VALID - READY FOR IMPORT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**If validation fails:**
```
→ Validating Malawi-2024-samples.csv...
  ❌ INVALID
     ERROR: Column 'sample_id': value too long (219 > 50)
       Value: All analysis were performed by M. McMillan...
     ERROR: Invalid sample_id format: ['All analysis...', 'nan', ...]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
❌ VALIDATION FAILED - FIX ERRORS BEFORE IMPORT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**DO NOT PROCEED TO IMPORT IF VALIDATION FAILS**

---

### Step 3: Import to Database

**Option A: SQL Bulk Import (RECOMMENDED - Fastest)**

```bash
./scripts/db/import-sql.sh Malawi-2024 build-data/learning/thermo-papers/data
```

**Advantages:**
- ✅ Bulk loading using PostgreSQL `COPY` (10-100x faster)
- ✅ Transaction-based (all-or-nothing)
- ✅ Rollback on any error
- ✅ Built-in verification

**Option B: Python Import (More flexible)**

```bash
python scripts/db/import-malawi-2024.py
```

**Use when:**
- Need custom transformations during import
- Need detailed logging
- Testing new import patterns

---

## 🔒 Data Safety Guarantees

### Before Import
1. ✅ **Validation passes** - All CSV files schema-compliant
2. ✅ **Sample IDs valid** - Match pattern, no duplicates
3. ✅ **String lengths safe** - No overflow errors
4. ✅ **Foreign keys ready** - Parent records exist or will be created

### During Import
1. ✅ **Transaction-wrapped** - All-or-nothing (rollback on error)
2. ✅ **Constraints enforced** - Database validates data integrity
3. ✅ **No partial imports** - Either complete success or nothing

### After Import
1. ✅ **Record counts verified** - All rows imported
2. ✅ **Foreign keys validated** - All relationships intact
3. ✅ **Sample data checked** - Spot-check first 5 records

---

## 🎓 Best Practices

### 1. Always Run Validation First

```bash
# GOOD ✅
python scripts/db/validate-import.py <data-dir>
./scripts/db/import-sql.sh <dataset> <data-dir>

# BAD ❌
./scripts/db/import-sql.sh <dataset> <data-dir>  # No validation!
```

### 2. Clean Data During Extraction

The extraction script now filters invalid rows automatically:

```python
# Filter to valid sample IDs
valid_samples = df['sample_id'].str.match(r'^[A-Z]{2,4}\d{2}-\d{2,3}$', na=False)
df_clean = df[valid_samples].copy()
```

**Never manually edit CSVs** - Fix the extraction script instead.

### 3. Use SQL for Bulk Imports

- Python: Good for <1000 rows or complex logic
- SQL COPY: Best for >1000 rows or production imports

### 4. Check Extraction Report

Review `<dataset>-extraction-report.md` before import:
- Number of samples
- Age ranges
- Data quality warnings
- Missing coordinates

---

## 📁 File Organization

```
build-data/learning/thermo-papers/
├── pdfs/                           # Original papers
│   └── 4D fault evolution....pdf
├── data/                           # Extracted data (CSV)
│   ├── Malawi-2024-samples.csv
│   ├── Malawi-2024-ft_ages.csv
│   ├── Malawi-2024-ft_counts.csv
│   └── Malawi-2024-ft_track_lengths.csv
└── reports/                        # Extraction reports
    └── Malawi-2024-extraction-report.md
```

---

## 🔍 Troubleshooting

### Validation Fails: "Column value too long"

**Cause:** Footer/header metadata extracted as rows

**Fix:** Re-run extraction (it now auto-filters invalid rows)

```bash
/thermoextract 'path/to/paper.pdf'
```

### Validation Fails: "Invalid sample_id format"

**Cause:** Sample IDs don't match expected pattern

**Fix:** Check extraction report - may need custom ID pattern

### Import Fails: "Foreign key violation"

**Cause:** Importing child tables before parent

**Fix:** Use provided import scripts (correct order built-in)

### Import Fails: "Duplicate key"

**Cause:** Data already imported

**Fix:** Check if dataset already exists:

```sql
SELECT * FROM datasets WHERE dataset_name = 'Malawi-2024';
```

---

## 📊 Success Metrics

### First Malawi Import (Before Fixes)
- ❌ 3 failed attempts
- ❌ Manual CSV editing required
- ❌ Data loss (51 → 34 rows)
- ❌ 4 different error types

### Expected Going Forward
- ✅ 1 successful attempt (first time)
- ✅ No manual editing
- ✅ No data loss (valid rows preserved)
- ✅ Zero import errors

---

## 🚀 Quick Reference

```bash
# Complete workflow
/thermoextract 'paper.pdf'
python scripts/db/validate-import.py build-data/learning/thermo-papers/data
./scripts/db/import-sql.sh Dataset-2024 build-data/learning/thermo-papers/data

# Expected output
✅ Extraction complete (3 tables, 34 samples)
✅ All files valid - ready for import
✅ Import complete (137 records)
```

---

**Remember:** If validation fails, **STOP**. Fix the extraction script, not the CSV files.
