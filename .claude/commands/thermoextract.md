# /thermoextract - Zero-Error Thermochronology Data Extraction

**Purpose:** Extract thermochronology data from PDFs with zero import errors
**Workflow:** Extract → Validate → Import (one successful attempt)
**Key Principle:** Data must be **perfect before import** - no manual fixes needed

---

## 🎯 What You'll Do

Execute a complete extraction workflow that produces **validated, import-ready data**:

1. **Extract** tables from PDF with auto-filtering of invalid rows
2. **Transform** to FAIR schema (4 normalized database tables)
3. **Validate** against database schema (catch ALL errors before import)
4. **Generate CSVs** ready for zero-error import
5. **Create extraction report** documenting the process

---

## 📋 Complete Workflow (All 8 Steps)

### STEP 1: Extract PDF Tables

```python
import sys
import pandas as pd
from pathlib import Path

# Get PDF path from user input (passed as argument)
pdf_path = '<PDF_PATH>'  # Will be provided by user

# Add scripts to path
sys.path.insert(0, str(Path.cwd()))

from scripts.pdf.extraction_engine import UniversalThermoExtractor

print('━' * 60)
print('STEP 1: EXTRACTING PDF TABLES')
print('━' * 60)
print()

# Initialize and run extraction
extractor = UniversalThermoExtractor(pdf_path)
extractor.analyze()
results = extractor.extract_all()

print(f'✅ Extracted {len(results)} tables')
for table_id, df in results.items():
    print(f'   - {table_id}: {len(df)} rows × {len(df.columns)} columns')
print()
```

---

### STEP 2: Apply Column Name Mapping

```python
print('━' * 60)
print('STEP 2: APPLYING COLUMN NAME MAPPING')
print('━' * 60)
print()

# Identify main data table (usually "Table 1" or similar)
table1 = results['Table 1'].copy()

# Define column mapping (customize based on paper format)
# This example is for AFT ages table with numbered columns
column_mapping = {
    '0': 'sample_id',
    '1': 'n_grains',
    '2': 'ns',
    '3': 'ps_cm2',
    '4': 'u_ppm',
    '5': 'th_ppm',
    '6': 'eu_ppm',
    '7': 'p_chi2_pct',
    '8': 'dispersion_pct',
    '9': 'pooled_age_ma',
    '10': 'central_age_ma',
    '11': 'dpar_um',
    '12': 'rmr0',
    '13': 'rmr0d',
    '14': 'cl_wt_pct',
    '15': 'ecl_apfu',
    '16': 'n_tracks',
    '17': 'mtl_um',
    '18': 'mtl_sd_um'
}

table1.rename(columns=column_mapping, inplace=True)

print(f'✅ Renamed {len(column_mapping)} columns')
print(f'   New columns: {list(table1.columns)[:5]}...')
print()
```

---

### STEP 3: Filter Invalid Rows (CRITICAL)

```python
print('━' * 60)
print('STEP 3: FILTERING INVALID ROWS')
print('━' * 60)
print()

# CRITICAL: Remove footer/header metadata BEFORE transformation
# Sample IDs must match pattern: XX##-## or XX##-### (e.g., MU19-05)
valid_samples = table1['sample_id'].astype(str).str.match(
    r'^[A-Z]{2,4}\d{2}-\d{2,3}$',
    na=False
)

print(f'   Total rows extracted: {len(table1)}')
print(f'   Valid sample rows: {valid_samples.sum()}')
print(f'   Invalid rows filtered: {len(table1) - valid_samples.sum()}')

if valid_samples.sum() == 0:
    print('❌ ERROR: No valid samples found!')
    print('   Check sample ID format or adjust pattern')
    sys.exit(1)

# Create clean dataset
table1_clean = table1[valid_samples].copy()

print(f'✅ Data cleaned: {len(table1_clean)} valid samples')
print()
```

**Why This Matters:**
- Malawi 2024 import: 51 extracted → 34 valid (17 invalid rows)
- Invalid rows cause: "value too long for character varying(50)"
- **Filter during extraction, not manually in CSV**

---

### STEP 4: Parse Ages with Errors

```python
print('━' * 60)
print('STEP 4: PARSING AGES WITH ERRORS')
print('━' * 60)
print()

def parse_age_error(age_str):
    """
    Parse age string like '245.3 ± 49.2' into (age, error)

    Handles formats:
    - "245.3 ± 49.2" → (245.3, 49.2)
    - "110.5 ± 6.2" → (110.5, 6.2)
    - "NaN" → (None, None)
    """
    if pd.isna(age_str) or str(age_str).strip() == '':
        return None, None

    try:
        parts = str(age_str).split('±')
        age = float(parts[0].strip())
        error = float(parts[1].strip()) if len(parts) > 1 else None
        return age, error
    except:
        return None, None

# Parse pooled ages
pooled_ages = table1_clean['pooled_age_ma'].apply(lambda x: parse_age_error(x)[0])
pooled_errors = table1_clean['pooled_age_ma'].apply(lambda x: parse_age_error(x)[1])

# Parse central ages
central_ages = table1_clean['central_age_ma'].apply(lambda x: parse_age_error(x)[0])
central_errors = table1_clean['central_age_ma'].apply(lambda x: parse_age_error(x)[1])

print(f'✅ Parsed ages for {len(table1_clean)} samples')
print(f'   Age range: {central_ages.min():.1f} - {central_ages.max():.1f} Ma')
print()
```

---

### STEP 5: Transform to FAIR Schema

```python
print('━' * 60)
print('STEP 5: TRANSFORMING TO FAIR SCHEMA')
print('━' * 60)
print()

# 1. Samples table
samples_df = pd.DataFrame({
    'sample_id': table1_clean['sample_id'],
    'dataset_id': 1,  # Placeholder (will be updated on import)
    'latitude': -13.5,  # Placeholder (extract from Table A2 if available)
    'longitude': 34.8,
    'elevation_m': None,
    'mineral_type': 'apatite',
    'analysis_method': 'LA-ICP-MS AFT',
    'n_aft_grains': pd.to_numeric(table1_clean['n_grains'], errors='coerce')
})

# 2. FT Ages table
ft_ages_df = pd.DataFrame({
    'sample_id': table1_clean['sample_id'],
    'n_grains': pd.to_numeric(table1_clean['n_grains'], errors='coerce'),
    'pooled_age_ma': pooled_ages,
    'pooled_age_error_ma': pooled_errors,
    'central_age_ma': central_ages,
    'central_age_error_ma': central_errors,
    'dispersion_pct': pd.to_numeric(table1_clean['dispersion_pct'], errors='coerce'),
    'p_chi2': pd.to_numeric(table1_clean['p_chi2_pct'], errors='coerce') / 100,
    'ft_age_type': 'central'
})

# 3. FT Counts table (pooled data)
u_ppm = table1_clean['u_ppm'].apply(lambda x: parse_age_error(x)[0])
th_ppm = table1_clean['th_ppm'].apply(lambda x: parse_age_error(x)[0])
eu_ppm = table1_clean['eu_ppm'].apply(lambda x: parse_age_error(x)[0])
dpar = table1_clean['dpar_um'].apply(lambda x: parse_age_error(x)[0])

ft_counts_df = pd.DataFrame({
    'sample_id': table1_clean['sample_id'],
    'grain_id': table1_clean['sample_id'] + '_pooled',
    'ns': pd.to_numeric(table1_clean['ns'], errors='coerce').astype('Int64'),
    'rho_s_cm2': pd.to_numeric(table1_clean['ps_cm2'], errors='coerce'),
    'u_ppm': u_ppm,
    'th_ppm': th_ppm,
    'eu_ppm': eu_ppm,
    'dpar_um': dpar,
    'rmr0': pd.to_numeric(table1_clean['rmr0'], errors='coerce'),
    'cl_wt_pct': pd.to_numeric(table1_clean['cl_wt_pct'], errors='coerce'),
    'n_grains': pd.to_numeric(table1_clean['n_grains'], errors='coerce')
})

# 4. FT Track Lengths table
mtl = table1_clean['mtl_um'].apply(lambda x: parse_age_error(x)[0])

ft_lengths_df = pd.DataFrame({
    'sample_id': table1_clean['sample_id'],
    'grain_id': table1_clean['sample_id'] + '_pooled',
    'n_confined_tracks': pd.to_numeric(table1_clean['n_tracks'], errors='coerce').astype('Int64'),
    'mean_track_length_um': mtl,
    'mean_track_length_sd_um': pd.to_numeric(table1_clean['mtl_sd_um'], errors='coerce'),
    'dpar_um': dpar
})

print(f'✅ Transformed to FAIR schema:')
print(f'   - samples: {len(samples_df)} rows')
print(f'   - ft_ages: {len(ft_ages_df)} rows')
print(f'   - ft_counts: {len(ft_counts_df)} rows')
print(f'   - ft_track_lengths: {len(ft_lengths_df)} rows')
print()
```

---

### STEP 6: Validate Before Import (NEW - Critical!)

```python
print('━' * 60)
print('STEP 6: VALIDATING DATA (PRE-IMPORT)')
print('━' * 60)
print()

# Save CSVs to temporary directory for validation
dataset_name = Path(pdf_path).stem[:50]  # Use PDF filename
output_dir = Path('build-data/learning/thermo-papers/data')
output_dir.mkdir(parents=True, exist_ok=True)

samples_df.to_csv(output_dir / f'{dataset_name}-samples.csv', index=False)
ft_ages_df.to_csv(output_dir / f'{dataset_name}-ft_ages.csv', index=False)
ft_counts_df.to_csv(output_dir / f'{dataset_name}-ft_counts.csv', index=False)
ft_lengths_df.to_csv(output_dir / f'{dataset_name}-ft_track_lengths.csv', index=False)

# Run validation script
import subprocess
result = subprocess.run([
    'python', 'scripts/db/validate-import.py', str(output_dir)
], capture_output=True, text=True)

print(result.stdout)

if result.returncode != 0:
    print('❌ VALIDATION FAILED')
    print('   Fix errors before attempting import')
    print()
    print('Common issues:')
    print('   - sample_id too long (limit: 50 chars)')
    print('   - Invalid sample_id format')
    print('   - Missing required columns')
    print('   - NULL values in required fields')
    sys.exit(1)

print('✅ All files validated - ready for import')
print()
```

**Why This Matters:**
- Catches schema mismatches BEFORE import
- Validates string lengths (e.g., sample_id < 50 chars)
- Checks foreign key integrity
- Prevents failed imports - **import once, successfully**

---

### STEP 7: Generate Final CSVs

```python
print('━' * 60)
print('STEP 7: GENERATING CSV FILES')
print('━' * 60)
print()

print(f'✅ Generated CSV files:')
print(f'   - {dataset_name}-samples.csv ({len(samples_df)} rows)')
print(f'   - {dataset_name}-ft_ages.csv ({len(ft_ages_df)} rows)')
print(f'   - {dataset_name}-ft_counts.csv ({len(ft_counts_df)} rows)')
print(f'   - {dataset_name}-ft_track_lengths.csv ({len(ft_lengths_df)} rows)')
print()
```

---

### STEP 8: Create Extraction Report

```python
print('━' * 60)
print('STEP 8: CREATING EXTRACTION REPORT')
print('━' * 60)
print()

report_dir = Path('build-data/learning/thermo-papers/reports')
report_dir.mkdir(parents=True, exist_ok=True)

report_path = report_dir / f'{dataset_name}-extraction-report.md'

with open(report_path, 'w') as f:
    f.write(f'''# Thermochronology Data Extraction Report

**Paper:** {dataset_name}
**Extracted:** {pd.Timestamp.now().strftime("%Y-%m-%d")}

---

## Extraction Summary

**Tables Extracted:** {len(results)}/{len(extractor.structure.tables)}
**Valid Samples:** {len(table1_clean)} (filtered from {len(table1)} total rows)
**Age Range:** {central_ages.min():.1f} - {central_ages.max():.1f} Ma

---

## Data Quality

✅ **Sample ID Validation:** All {len(table1_clean)} samples match pattern `^[A-Z]{{2,4}}\\d{{2}}-\\d{{2,3}}$`
✅ **Schema Validation:** All CSV files passed pre-import validation
✅ **No Null Values:** Required fields populated
✅ **Foreign Keys:** All relationships valid

---

## Generated Files

- `{dataset_name}-samples.csv` ({len(samples_df)} rows)
- `{dataset_name}-ft_ages.csv` ({len(ft_ages_df)} rows)
- `{dataset_name}-ft_counts.csv` ({len(ft_counts_df)} rows)
- `{dataset_name}-ft_track_lengths.csv` ({len(ft_lengths_df)} rows)

---

## Next Steps

### Import to Database

**Option A: SQL Bulk Import (RECOMMENDED)**
```bash
./scripts/db/import-sql.sh {dataset_name} build-data/learning/thermo-papers/data
```

**Option B: Python Import**
```bash
python scripts/db/import-malawi-2024.py
```

**Expected Result:** ✅ Zero errors, one successful import

---

**Report Generated:** {report_path}
''')

print(f'✅ Extraction report created: {report_path}')
print()
```

---

## ✅ Final Summary

```python
print('━' * 60)
print('EXTRACTION COMPLETE')
print('━' * 60)
print()
print('Summary:')
print(f'  ✅ Tables extracted: {len(results)}')
print(f'  ✅ Valid samples: {len(table1_clean)} (filtered {len(table1) - len(table1_clean)} invalid)')
print(f'  ✅ Schema validated: PASS')
print(f'  ✅ CSV files generated: 4')
print(f'  ✅ Age range: {central_ages.min():.1f} - {central_ages.max():.1f} Ma')
print()
print('Next steps:')
print(f'  1. Review extraction report: {report_path}')
print(f'  2. Import to database (zero errors expected):')
print(f'     ./scripts/db/import-sql.sh {dataset_name} build-data/learning/thermo-papers/data')
print()
print('Files:')
print(f'  - Data: build-data/learning/thermo-papers/data/{dataset_name}-*.csv')
print(f'  - Report: {report_path}')
print()
```

---

## 🎓 Key Lessons Learned

### Problem 1: Invalid Data in CSVs
**What went wrong:** Footer text extracted as sample rows (219 chars → overflow)
**Fix:** Filter invalid rows during extraction using sample ID pattern
**Code:** `valid_samples = df['sample_id'].str.match(r'^[A-Z]{2,4}\d{2}-\d{2,3}$')`

### Problem 2: No Pre-Import Validation
**What went wrong:** Errors discovered during import attempt (3 failures)
**Fix:** Validate against database schema BEFORE import
**Code:** `python scripts/db/validate-import.py <data-dir>`

### Problem 3: Schema Mismatches
**What went wrong:** `study_location` vs `study_area`, wrong constraint names
**Fix:** Validation script checks actual database schema
**Result:** Catch ALL errors before import attempt

---

## 📊 SQL vs Python Import

### Use SQL COPY (Recommended)
```bash
./scripts/db/import-sql.sh Dataset-2024 build-data/learning/thermo-papers/data
```

**Advantages:**
- ✅ 10-100x faster (bulk loading)
- ✅ Transaction-safe (all-or-nothing)
- ✅ Simpler code
- ✅ Native database operation

**Use for:**
- Production imports
- Large datasets (>1000 rows)
- When speed matters

### Use Python (Alternative)
```bash
python scripts/db/import-dataset.py
```

**Advantages:**
- ✅ More flexible (complex transformations)
- ✅ Better error logging
- ✅ Easier debugging

**Use for:**
- Development/testing
- Custom transformations
- Small datasets (<1000 rows)

---

## 🚀 Success Metrics

### Before Improvements
- ❌ 3 failed import attempts
- ❌ 17 rows lost to manual CSV editing
- ❌ Multiple database cleanups required

### After Improvements
- ✅ 1 successful import (first attempt)
- ✅ Zero rows lost (filtered during extraction)
- ✅ Zero manual editing
- ✅ Zero database cleanups

---

## 💾 Database Metadata Import (For Dataset Page Display)

After successful data import, add metadata to make it visible on the dataset page:

### Required Metadata Fields

```sql
-- Update datasets table with extraction metadata
UPDATE datasets SET
  paper_summary = '<One-paragraph summary of paper findings>',
  fair_score = <0-100>,
  fair_reasoning = '<Detailed explanation of FAIR score>',
  key_findings = ARRAY[
    '<Finding 1>',
    '<Finding 2>',
    '<Finding 3>',
    ...
  ],
  extraction_report_url = '/data/datasets/<id>/<dataset>-extraction-report.md'
WHERE id = <dataset_id>;
```

### Register Data Files for Download

```sql
-- Insert file records into data_files table
INSERT INTO data_files (
  dataset_id, file_name, file_path, file_type,
  display_name, row_count, description,
  created_at, updated_at
) VALUES
  -- FAIR schema files
  (<id>, '<dataset>-samples.csv', '/data/datasets/<id>/<dataset>-samples.csv',
   'fair_schema', 'Samples', <rows>, 'FAIR-compliant samples data', NOW(), NOW()),
  (<id>, '<dataset>-ft_ages.csv', '/data/datasets/<id>/<dataset>-ft_ages.csv',
   'fair_schema', 'FT Ages', <rows>, 'FAIR-compliant ft_ages data', NOW(), NOW()),
  (<id>, '<dataset>-ft_counts.csv', '/data/datasets/<id>/<dataset>-ft_counts.csv',
   'fair_schema', 'FT Counts', <rows>, 'FAIR-compliant ft_counts data', NOW(), NOW()),
  (<id>, '<dataset>-ft_track_lengths.csv', '/data/datasets/<id>/<dataset>-ft_track_lengths.csv',
   'fair_schema', 'FT Track Lengths', <rows>, 'FAIR-compliant ft_track_lengths data', NOW(), NOW()),

  -- Original table (if extracted)
  (<id>, '<dataset>-original.csv', '/data/datasets/<id>/<dataset>-original.csv',
   'original_table', 'Original Table', <rows>, 'Original extracted data from Table X', NOW(), NOW()),

  -- Extraction report
  (<id>, '<dataset>-extraction-report.md', '/data/datasets/<id>/<dataset>-extraction-report.md',
   'report', 'Extraction Report', NULL, 'Data extraction report', NOW(), NOW());
```

### Copy Files to Public Directory

```bash
# Create dataset directory
mkdir -p public/data/datasets/<dataset_id>

# Copy all extracted files
cp build-data/learning/thermo-papers/data/<dataset>-*.csv \
   public/data/datasets/<dataset_id>/

# Copy extraction report
cp build-data/learning/thermo-papers/reports/<dataset>-extraction-report.md \
   public/data/datasets/<dataset_id>/
```

### What This Enables

After completing the metadata import:

**Dataset Page** (`/datasets/<id>`) will display:
- ✅ **FAIR Score Badge** - Color-coded 0-100 rating (green ≥90, yellow ≥75, orange ≥60, red <60)
- ✅ **Paper Summary** - One-paragraph research overview (blue highlight)
- ✅ **Key Findings** - Bullet list of major results (green highlight)
- ✅ **FAIR Compliance Analysis** - Detailed reasoning (amber highlight)
- ✅ **Downloadable Files** - All FAIR schema CSVs + original tables + report
- ✅ **Download All as ZIP** - Single-click archive download

**Example:** https://thermo-app.vercel.app/datasets/4

---

**Ready to extract!** Run this workflow with your PDF path to generate validated, import-ready CSV files.
