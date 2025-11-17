# Slash Commands - Critical Fixes

**Date:** 2025-11-17
**Purpose:** Actionable code fixes for critical issues identified in quality review

**Related Report:** `SLASH_COMMANDS_QUALITY_REPORT.md`

---

## How to Apply These Fixes

Each fix below is ready to copy-paste into the respective command file. Fixes are organized by priority:

- 🔴 **CRITICAL** - Fix before next use (data integrity/stability)
- 🟡 **IMPORTANT** - Fix this week (usability/quality)

---

## 🔴 CRITICAL-001: Dynamic Dataset ID Generation

**File:** `.claude/commands/thermoextract.md`
**Location:** STEP 5, line ~410
**Replace this block:**

```python
samples_df = pd.DataFrame({
    'sample_id': table1_clean['sample_id'],
    'dataset_id': 1,  # Placeholder (will be updated on import)
    'latitude': -13.5,  # Placeholder (extract from Table A2 if available or use from analysis)
    'longitude': 34.8,
    'elevation_m': None,
    'mineral_type': mineral_type,
    'analysis_method': analysis_method,
    'n_aft_grains': pd.to_numeric(table1_clean['n_grains'], errors='coerce')
})
```

**With this:**

```python
# Determine dataset_id dynamically
print('Determining dataset_id...')

# Option 1: Query database for next available ID
try:
    result = subprocess.run([
        'psql', os.environ['DATABASE_URL'],
        '-c', 'SELECT COALESCE(MAX(id), 0) + 1 FROM datasets;',
        '-t', '-A'  # -t: tuples only, -A: unaligned
    ], capture_output=True, text=True, timeout=10)

    if result.returncode == 0:
        dataset_id = int(result.stdout.strip())
        print(f'   ✅ Next available dataset_id: {dataset_id}')
    else:
        raise Exception(f'Database query failed: {result.stderr}')

except Exception as e:
    print(f'   ⚠️  Could not query database: {e}')
    print(f'   Enter dataset_id manually (check database for next available):')
    dataset_id = int(input('   dataset_id: '))

print(f'   Using dataset_id: {dataset_id}')
print()

samples_df = pd.DataFrame({
    'sample_id': table1_clean['sample_id'],
    'dataset_id': dataset_id,  # ✅ Dynamic
    'latitude': -13.5,  # Placeholder (extract from Table A2 if available or use from analysis)
    'longitude': 34.8,
    'elevation_m': None,
    'mineral_type': mineral_type,
    'analysis_method': analysis_method,
    'n_aft_grains': pd.to_numeric(table1_clean['n_grains'], errors='coerce')
})
```

**Why this matters:**
- Prevents all imports from overwriting dataset 1
- Enables proper multi-dataset architecture
- Allows safe parallel data extraction

---

## 🔴 CRITICAL-002: Error Handling in Image Extraction

**File:** `.claude/commands/thermoanalysis.md`
**Location:** STEP 1.8, lines 290-335
**Replace the image extraction loop:**

```python
# Second pass: Extract images
for page_num in range(len(doc)):
    page = doc[page_num]
    image_list = page.get_images()

    for img_index, img in enumerate(image_list):
        xref = img[0]
        base_image = doc.extract_image(xref)
        image_bytes = base_image["image"]
        image_ext = base_image["ext"]

        # Save image
        image_filename = f"page_{page_num + 1}_img_{img_index}.{image_ext}"
        image_path = images_dir / image_filename

        with open(image_path, "wb") as img_file:
            img_file.write(image_bytes)
```

**With this:**

```python
# Second pass: Extract images
failed_extractions = 0

for page_num in range(len(doc)):
    page = doc[page_num]
    image_list = page.get_images()

    for img_index, img in enumerate(image_list):
        try:
            xref = img[0]
            base_image = doc.extract_image(xref)

            # Validate extracted data
            if not base_image or "image" not in base_image:
                print(f'   ⚠️  Skipping invalid image on page {page_num + 1} (index {img_index})')
                failed_extractions += 1
                continue

            image_bytes = base_image["image"]

            # Skip zero-size or very small images (likely artifacts)
            if len(image_bytes) < 100:  # Less than 100 bytes
                print(f'   ⚠️  Skipping tiny image on page {page_num + 1} ({len(image_bytes)} bytes)')
                failed_extractions += 1
                continue

            image_ext = base_image.get("ext", "png")

            # Save image
            image_filename = f"page_{page_num + 1}_img_{img_index}.{image_ext}"
            image_path = images_dir / image_filename

            with open(image_path, "wb") as img_file:
                img_file.write(image_bytes)

            # Record metadata (rest of code continues...)

        except KeyError as e:
            print(f'   ⚠️  Image extraction error on page {page_num + 1}: Missing key {e}')
            failed_extractions += 1
            continue

        except Exception as e:
            print(f'   ⚠️  Failed to extract image on page {page_num + 1}: {e}')
            failed_extractions += 1
            continue

if failed_extractions > 0:
    print()
    print(f'⚠️  {failed_extractions} images failed to extract (non-critical)')
    print()
```

**Why this matters:**
- Prevents command from crashing on corrupted images
- Handles PDFs with non-standard image formats
- Provides clear feedback on extraction issues

---

## 🔴 CRITICAL-003: Safe SQL Script Generation

**File:** `.claude/commands/thermoextract.md`
**Location:** STEP 11, line ~1000
**Add at top of STEP 11:**

```python
import shlex  # For safe shell quoting

print('━' * 60)
print('STEP 11: GENERATING SQL IMPORT SCRIPT')
print('━' * 60)
print()
```

**Replace the import script generation:**

```python
import_script = f"""-- SQL Import Script for {dataset_name}
-- Generated: {pd.Timestamp.now().strftime("%Y-%m-%d %H:%M:%S")}

\\copy samples(...) FROM '{fair_dir.absolute()}/samples.csv' WITH (FORMAT CSV, HEADER TRUE, NULL '');
```

**With this:**

```python
# Sanitize dataset name for SQL comments
safe_dataset_name = dataset_name.replace("'", "''").replace('\n', ' ')

# Use absolute paths with proper quoting
samples_path = shlex.quote(str(fair_dir.absolute() / 'samples.csv'))
ft_datapoints_path = shlex.quote(str(fair_dir.absolute() / 'ft-datapoints.csv'))
ft_count_path = shlex.quote(str(fair_dir.absolute() / 'ft-count-data.csv'))
ft_length_path = shlex.quote(str(fair_dir.absolute() / 'ft-length-data.csv'))

import_script = f"""-- SQL Import Script for {safe_dataset_name}
-- Generated: {pd.Timestamp.now().strftime("%Y-%m-%d %H:%M:%S")}
-- EarthBank Schema v2 Compatible

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- IMPORT SAMPLES
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

\\copy samples(sample_id, igsn, sample_kind, sampling_method, lithology_mineral, sample_info, latitude, longitude, lat_long_precision, elevation_m, min_depth_m, max_depth_m, depth_precision_m, elevation_info, location_kind, location_name, location_info, geological_unit, chronostrat_age_min, chronostrat_age_max) FROM {samples_path} WITH (FORMAT CSV, HEADER TRUE, NULL '');

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- IMPORT FT DATAPOINTS
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

\\copy ft_datapoints(datapoint_key, sample_id, sec_ref_material, sample_info, publication_id, laboratory, analyst_orcid, funding_grant, analysis_datetime, mineral, batch_id, ft_counting_method, digital_ft_software, digital_ft_algorithm, u_measurement_method, n_grains_counted, pooled_age_ma, pooled_age_1s_ma, central_age_ma, central_age_1s_ma, dispersion_pct, P_chi2_pct, zeta_value, zeta_1s, mean_track_length_um, mean_track_length_1s_um, std_dev_track_length_um) FROM {ft_datapoints_path} WITH (FORMAT CSV, HEADER TRUE, NULL '');
```

**Why this matters:**
- Prevents SQL generation errors on unusual paper names
- Handles special characters safely
- More robust path handling

---

## 🔴 CRITICAL-004: File Validation Before Import

**File:** `.claude/commands/thermoextract.md`
**Location:** STEP 12, line ~1080
**Replace the validation section:**

```python
print('━' * 60)
print('STEP 12: VALIDATING DATA (PRE-IMPORT)')
print('━' * 60)
print()

# Run validation script on FAIR directory
import subprocess
result = subprocess.run([
    'python', 'scripts/db/validate-import.py', str(fair_dir)
], capture_output=True, text=True)

print(result.stdout)

if result.returncode != 0:
    print('❌ VALIDATION FAILED')
    print('   Fix errors before attempting import')
    sys.exit(1)
```

**With this:**

```python
print('━' * 60)
print('STEP 12: VALIDATING DATA (PRE-IMPORT)')
print('━' * 60)
print()

# STEP 12.1: Validate files exist and are non-empty
print('Checking CSV files...')

required_files = ['samples.csv', 'ft-datapoints.csv', 'ft-count-data.csv', 'ft-length-data.csv']
missing_files = []
empty_files = []

for filename in required_files:
    filepath = fair_dir / filename
    if not filepath.exists():
        missing_files.append(filename)
    elif filepath.stat().st_size == 0:
        empty_files.append(filename)
    else:
        print(f'   ✅ {filename} ({filepath.stat().st_size:,} bytes)')

if missing_files:
    print()
    print(f'❌ MISSING FILES: {", ".join(missing_files)}')
    print(f'   Expected location: {fair_dir}/')
    sys.exit(1)

if empty_files:
    print()
    print(f'⚠️  WARNING: Empty files detected: {", ".join(empty_files)}')
    print(f'   These files have zero bytes and will cause import errors.')
    response = input('Continue anyway? (y/N): ')
    if response.lower() != 'y':
        sys.exit(1)

print()

# STEP 12.2: Validate validation script exists
validation_script = Path('scripts/db/validate-import.py')
if not validation_script.exists():
    print(f'⚠️  Validation script not found: {validation_script}')
    print('   Cannot run pre-import validation.')
    print()
    response = input('Continue without validation? (y/N): ')
    if response.lower() != 'y':
        print('   Aborting. Create validation script or skip this check.')
        sys.exit(1)
else:
    print(f'Running validation script: {validation_script}')
    print()

    # Run validation
    result = subprocess.run([
        'python', str(validation_script), str(fair_dir)
    ], capture_output=True, text=True)

    print(result.stdout)

    if result.returncode != 0:
        print()
        print('❌ VALIDATION FAILED')
        print('   Review errors above and fix before attempting import')
        print()
        print('Common issues:')
        print('   - sample_id too long (limit: 50 chars)')
        print('   - Invalid sample_id format (check pattern in paper-index.md)')
        print('   - Missing required columns')
        print('   - NULL values in required fields')
        print()
        sys.exit(1)

print()
print('✅ All files validated - ready for import')
print()
```

**Why this matters:**
- Catches missing files early
- Provides clear error messages
- Prevents cryptic import failures
- Validates validation script exists

---

## 🟡 IMPORTANT-001: Column Type Detection

**File:** `.claude/commands/thermoextract.md`
**Location:** STEP 2, after line ~215
**Replace the column mapping block:**

```python
print('━' * 60)
print('STEP 2: APPLYING COLUMN NAME MAPPING')
print('━' * 60)
print()

# Identify main data table (usually "Table 1" or similar)
table1 = results['Table 1'].copy()

# Define column mapping (customize based on paper format)
column_mapping = {
    '0': 'sample_id',
    '1': 'n_grains',
    # ...
}

table1.rename(columns=column_mapping, inplace=True)
```

**With this:**

```python
print('━' * 60)
print('STEP 2: DETECTING COLUMN NAMING AND MAPPING')
print('━' * 60)
print()

# Identify main data table
primary_table_name = paper_metadata.get('primary_table', 'Table 1') if paper_metadata['has_analysis'] else 'Table 1'

if primary_table_name not in results:
    print(f'⚠️  Primary table "{primary_table_name}" not found in extracted results')
    print(f'   Available tables: {list(results.keys())}')
    print()
    primary_table_name = input('Enter correct table name: ')

table1 = results[primary_table_name].copy()

print(f'Processing primary table: {primary_table_name}')
print(f'   Original columns: {list(table1.columns)}')
print()

# Detect column naming pattern
first_col = str(table1.columns[0])

if first_col.isdigit() or first_col in ['0', '1', '2', 'Unnamed: 0']:
    print('   ✅ Detected: Numbered columns (0, 1, 2...)')
    print('   Applying numbered column mapping...')
    print()

    # Define numbered column mapping
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

    # Only rename columns that exist
    existing_mapping = {k: v for k, v in column_mapping.items() if k in table1.columns}
    table1.rename(columns=existing_mapping, inplace=True)

    print(f'   Renamed {len(existing_mapping)} columns')

elif 'sample' in first_col.lower() or 'id' in first_col.lower():
    print('   ✅ Detected: Named columns')
    print('   Normalizing column names (lowercase, underscores)...')
    print()

    # Normalize column names
    table1.columns = [
        col.lower()
           .replace(' ', '_')
           .replace('-', '_')
           .replace('(', '')
           .replace(')', '')
           .strip()
        for col in table1.columns
    ]

    print(f'   Normalized columns: {list(table1.columns)[:5]}...')

else:
    print(f'   ⚠️  Unclear column naming pattern')
    print(f'   First column: "{first_col}"')
    print(f'   All columns: {list(table1.columns)}')
    print()
    print('   Options:')
    print('     1. Manually edit column_mapping dict below')
    print('     2. Skip column mapping (use existing names)')
    print()
    response = input('Choose option (1/2): ')

    if response == '1':
        print()
        print('   Edit the column_mapping dictionary in STEP 2 and re-run.')
        sys.exit(0)
    else:
        print('   Using existing column names')

print()
print(f'   Final columns: {list(table1.columns)}')
print()
```

**Why this matters:**
- Handles both numbered and named columns
- Provides fallback for edge cases
- Clear feedback on detection results

---

## 🟡 IMPORTANT-002: Age Range Validation

**File:** `.claude/commands/thermoextract.md`
**Location:** STEP 4, after line ~380
**Add after parsing ages:**

```python
print(f'✅ Parsed ages for {len(table1_clean)} samples')
print(f'   Age range: {central_ages.min():.1f} - {max_age:.1f} Ma')
print()
```

**Replace with:**

```python
# Validate age range
min_age = central_ages.min()
max_age = central_ages.max()
mean_age = central_ages.mean()
median_age = central_ages.median()

print(f'✅ Parsed ages for {len(table1_clean)} samples')
print(f'   Age range: {min_age:.1f} - {max_age:.1f} Ma')
print(f'   Mean: {mean_age:.1f} Ma')
print(f'   Median: {median_age:.1f} Ma')
print()

# Check for obviously invalid ages
validation_errors = []

if (central_ages < 0).any():
    negative_count = (central_ages < 0).sum()
    validation_errors.append(f'Negative ages detected ({negative_count} samples)')

if (central_ages > 4600).any():  # Older than Earth
    ancient_count = (central_ages > 4600).sum()
    validation_errors.append(f'Ages > 4600 Ma detected ({ancient_count} samples) - older than Earth!')

if pd.isna(central_ages).all():
    validation_errors.append('All ages are NULL/NaN - parsing failed completely')

if validation_errors:
    print('❌ AGE VALIDATION ERRORS:')
    for error in validation_errors:
        print(f'   ❌ {error}')
    print()
    print('   This indicates:')
    print('     1. Column mapping is incorrect')
    print('     2. Age parsing logic failed')
    print('     3. Units are wrong (Ma vs ka)')
    print()
    sys.exit(1)

# Check against expected range from paper analysis
if paper_metadata['has_analysis'] and paper_metadata.get('age_range'):
    expected_min, expected_max = paper_metadata['age_range']

    print(f'Comparing to expected age range from paper analysis:')
    print(f'   Expected: {expected_min:.1f} - {expected_max:.1f} Ma')
    print(f'   Extracted: {min_age:.1f} - {max_age:.1f} Ma')

    # Allow 20% tolerance for rounding and variation
    tolerance = 0.20
    min_threshold = expected_min * (1 - tolerance)
    max_threshold = expected_max * (1 + tolerance)

    if min_age < min_threshold or max_age > max_threshold:
        print(f'   ⚠️  Age range mismatch (outside 20% tolerance)')
        print(f'   This may indicate parsing errors or column mapping issues.')
        print()
        response = input('Continue anyway? (y/N): ')
        if response.lower() != 'y':
            sys.exit(1)
    else:
        print(f'   ✅ Age ranges match (within tolerance)')

print()
```

**Why this matters:**
- Catches parsing errors early
- Validates against paper metadata
- Prevents import of invalid ages

---

## 🟡 IMPORTANT-005: Duplicate Sample ID Check

**File:** `.claude/commands/thermoextract.md`
**Location:** STEP 3, after line ~335
**Add after filtering:**

```python
print(f'✅ Primary table has {len(table1_clean)} valid samples')
print()
```

**Replace with:**

```python
print(f'✅ Filtered table: {len(table1)} rows → {len(table1_clean)} valid samples')

# Check for duplicate sample IDs
duplicate_samples = table1_clean['sample_id'][table1_clean['sample_id'].duplicated()]

if len(duplicate_samples) > 0:
    print()
    print(f'❌ ERROR: Duplicate sample IDs detected')
    print()

    # Show duplicates with counts
    print('   Duplicates found:')
    for sample_id in duplicate_samples.unique():
        count = (table1_clean['sample_id'] == sample_id).sum()
        print(f'     - {sample_id} (appears {count} times)')

    print()
    print('   This usually indicates:')
    print('     1. Same sample analyzed multiple times (use ft_datapoints for multi-datapoint data)')
    print('     2. Table parsing error (footer/header rows not properly filtered)')
    print('     3. Multi-aliquot data (should have different grain_id, not sample_id)')
    print()
    print('   Fix:')
    print('     - Review sample ID pattern in STEP 3')
    print('     - Check if this is a multi-datapoint paper')
    print('     - Verify invalid row filtering is working correctly')
    print()
    sys.exit(1)

print(f'✅ All sample IDs are unique ({len(table1_clean)} samples)')
print()
```

**Why this matters:**
- Catches duplicate sample IDs before import
- Prevents primary key violations
- Provides clear guidance on cause

---

## 🟡 IMPORTANT-008: Dependency Checks

**File:** Both `.claude/commands/thermoanalysis.md` and `.claude/commands/thermoextract.md`
**Location:** Add new STEP 0 at the beginning, before existing STEP 0

**Add this as the very first step:**

```python
print('━' * 60)
print('STEP 0: CHECKING DEPENDENCIES')
print('━' * 60)
print()

import sys

# Required packages with import names and package names
required_packages = {
    'pandas': 'pandas',
    'numpy': 'numpy',
    'fitz': 'PyMuPDF',
    'openpyxl': 'openpyxl',
    'PIL': 'Pillow',
    're': 'BUILT-IN',  # Standard library
    'json': 'BUILT-IN',
    'subprocess': 'BUILT-IN',
}

missing_packages = []
print('Checking required packages:')

for import_name, package_name in required_packages.items():
    try:
        __import__(import_name)
        status = '✅' if package_name != 'BUILT-IN' else '✓'
        print(f'   {status} {package_name}')
    except ImportError:
        print(f'   ❌ {package_name} (not installed)')
        if package_name != 'BUILT-IN':
            missing_packages.append(package_name)

if missing_packages:
    print()
    print(f'❌ Missing required packages: {", ".join(missing_packages)}')
    print()
    print('   Install with:')
    print(f'   pip install {" ".join(missing_packages)}')
    print()
    print('   Or install all at once:')
    print('   pip install pandas numpy PyMuPDF openpyxl Pillow')
    print()
    sys.exit(1)

print()
print('✅ All dependencies installed')
print()

# Check Python version
import sys
py_version = sys.version_info

print(f'Python version: {py_version.major}.{py_version.minor}.{py_version.micro}')

if py_version.major < 3 or (py_version.major == 3 and py_version.minor < 8):
    print(f'⚠️  WARNING: Python 3.8+ recommended (you have {py_version.major}.{py_version.minor})')
    print()
else:
    print('✅ Python version OK')

print()
```

**Why this matters:**
- Catches missing dependencies before long workflows start
- Saves time by failing fast
- Provides clear installation instructions

---

## Implementation Checklist

### Phase 1: Critical Fixes (Do First) ✅

- [ ] Apply CRITICAL-001 (Dynamic dataset_id)
- [ ] Apply CRITICAL-002 (Image extraction error handling)
- [ ] Apply CRITICAL-003 (Safe SQL generation)
- [ ] Apply CRITICAL-004 (File validation)

**Estimated time:** 1-2 hours
**Impact:** Prevents data corruption and crashes

### Phase 2: Important Fixes (Do This Week) ⚠️

- [ ] Apply IMPORTANT-001 (Column type detection)
- [ ] Apply IMPORTANT-002 (Age range validation)
- [ ] Apply IMPORTANT-005 (Duplicate sample check)
- [ ] Apply IMPORTANT-008 (Dependency checks)

**Estimated time:** 2-3 hours
**Impact:** Improves reliability and user experience

### Phase 3: Remaining Important Fixes (Next Week) 📝

- [ ] IMPORTANT-003 (Progress reporting)
- [ ] IMPORTANT-004 (Sample ID pattern validation)
- [ ] IMPORTANT-006 (Coordinate extraction)
- [ ] IMPORTANT-007 (Multi-datapoint support)

**Estimated time:** 4-5 hours
**Impact:** Feature completeness

---

## Testing After Fixes

After applying fixes, test with these scenarios:

### Test Case 1: Normal Paper (Happy Path)
- Paper: McMillan 2024 Malawi Rift
- Expected: Clean extraction, no errors

### Test Case 2: Paper with Named Columns
- Paper with column headers like "Sample ID", "Age (Ma)"
- Tests: IMPORTANT-001 (column detection)

### Test Case 3: Paper with Duplicate Samples
- Artificially duplicate a sample row
- Tests: IMPORTANT-005 (duplicate detection)

### Test Case 4: Corrupted PDF
- PDF with missing/corrupted images
- Tests: CRITICAL-002 (error handling)

### Test Case 5: Edge Case Ages
- Modify CSV to have negative age or > 4600 Ma
- Tests: IMPORTANT-002 (age validation)

---

## Verification Commands

After applying fixes, verify with:

```bash
# 1. Check Python syntax
python -m py_compile scripts/extraction-test.py

# 2. Test dependency check
python -c "import pandas, numpy, fitz, openpyxl, PIL; print('All imports OK')"

# 3. Test dataset_id query (requires DATABASE_URL)
psql "$DATABASE_URL" -c "SELECT COALESCE(MAX(id), 0) + 1 FROM datasets;"

# 4. Validate a FAIR directory
python scripts/db/validate-import.py build-data/learning/thermo-papers/TEST/FAIR/
```

---

## Rollback Plan

If fixes cause issues:

1. **Git restore original files:**
   ```bash
   git checkout .claude/commands/thermoanalysis.md
   git checkout .claude/commands/thermoextract.md
   ```

2. **Document what went wrong in:**
   - `build-data/errors/ERROR-XXX.md`

3. **Revert specific fix:**
   - Keep other fixes, only remove problematic one
   - Document which combination works

---

**Document Version:** 1.0
**Created:** 2025-11-17
**Status:** Ready for implementation
**Next Review:** After Phase 1 fixes applied
