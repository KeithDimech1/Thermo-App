# Slash Commands Documentation

**Last Updated:** 2025-11-17
**Project:** AusGeochem Thermochronology Data Platform

---

## Overview

This project includes two specialized slash commands for extracting and analyzing thermochronology research papers. These commands work together to create a complete workflow from PDF analysis to database import.

**Commands:**
1. `/thermoanalysis` - Deep paper analysis with indexed navigation
2. `/thermoextract` - Zero-error data extraction and transformation

**Workflow:** `/thermoanalysis` → `/thermoextract` → Database Import

---

## Command 1: /thermoanalysis

**Purpose:** Create comprehensive, indexed analysis of thermochronology papers that integrates with `/thermoextract`

**Status:** ✅ Ready for use | ⏳ Production deployment after ERROR-005 schema migration

**Location:** `.claude/commands/thermoanalysis.md`

### What It Does

1. **Reads PDF thoroughly** - Complete analysis of paper content
2. **Creates organized folder structure** - Consistent project organization
3. **Extracts images with figure captions** - From PDF text (not inferred)
4. **Generates paper-index.md** - Quick reference with metadata
5. **Generates paper-analysis.md** - Full indexed analysis with anchors
6. **Generates figures.md** - Human-readable figure descriptions
7. **Generates image-metadata.json** - Structured data for database import
8. **Copies PDF to folder** - Single source of truth
9. **Validates completeness** - Ready for `/thermoextract` integration

### Output Structure

```
build-data/learning/thermo-papers/AUTHOR(YEAR)-TITLE-JOURNAL/
├── [PDF_NAME].pdf
├── paper-index.md              # ⭐ Quick reference
├── paper-analysis.md           # 📚 Full analysis
├── figures.md                  # 📋 Human-readable figure descriptions
├── text/                       # Plain text extraction
│   ├── plain-text.txt         # Full text (reusable)
│   └── text-index.md          # Discovered table locations
└── images/                     # 📸 Extracted figures
    ├── page_1_img_0.png       # Figure 1
    ├── page_3_img_1.png       # Figure 2
    ├── page_5_img_0.png       # Figure 3
    └── image-metadata.json    # Image catalog (JSON for DB import)
```

### Usage

```bash
/thermoanalysis
```

**Prompts:**
1. **PDF path** - Full path to the PDF file
2. **Paper folder name** (optional) - Format: `AUTHOR(YEAR)-TITLE-JOURNAL`
   - If not provided, derived from PDF filename

**Example:**
```
PDF path: /path/to/Peak(2021)-Grand-Canyon.pdf
Folder name: Peak(2021)-Grand-Canyon-Great-Unconformity-Geology
```

### Key Features

#### 1. Plain Text Extraction (IDEA-012)

**Token Efficiency:** Extract ONCE, reuse MANY times (~33% reduction in token usage)

```python
import fitz  # PyMuPDF

doc = fitz.open(pdf_path)
plain_text = []

for page_num, page in enumerate(doc, start=1):
    text = page.get_text("text")
    plain_text.append(f"--- PAGE {page_num} ---\n{text}\n")

# Save to file (reusable for extraction and validation)
text_file = text_dir / 'plain-text.txt'
with open(text_file, 'w', encoding='utf-8') as f:
    f.write('\n'.join(plain_text))
```

**Output:**
- `text/plain-text.txt` - Full text extraction (reusable)
- `text/text-index.md` - Discovered table locations

#### 2. Dynamic Table Discovery (IDEA-012)

**No hardcoded assumptions** - Works for ANY paper (1 table or 20+ tables)

```python
# Pattern matching for table references
table_pattern = r'(?:Table|TABLE)\s+([A-Z]?\d+[A-Za-z]?)'
matches = re.finditer(table_pattern, text_content)

# Detect table type from context (adaptive keywords)
if any(kw in context_lower for kw in ['fission', 'track', 'aft']):
    table_type = 'AFT'
elif any(kw in context_lower for kw in ['u-th', 'he', 'helium']):
    table_type = 'He'
```

**Features:**
- Discovers table types automatically (AFT/He/Metadata/Chemistry)
- Estimates page numbers
- Extracts surrounding context
- No manual configuration needed

#### 3. Image and Figure Caption Extraction (IDEA-008)

**Automatic matching** - Images paired with captions from PDF text

```python
# First pass: Extract all figure captions from text
fig_matches = re.finditer(
    r'(?:Figure|Fig\.?)\s+(\d+[A-Za-z]?)[\.:]\s*([^\n]+(?:\n(?![A-Z][a-z]+\s+\d+)[^\n]+)*)',
    text,
    re.IGNORECASE | re.MULTILINE
)

# Second pass: Extract images and match to captions
for page_num in range(len(doc)):
    page = doc[page_num]
    image_list = page.get_images()
    # Match images to figures based on page proximity
```

**Outputs:**
- `images/` directory - All extracted images
- `image-metadata.json` - Structured data (for database import)
- `figures.md` - Human-readable descriptions

**JSON Structure:**
```json
{
  "paper": "Author(Year)-Title",
  "total_images": 57,
  "total_figures_identified": 15,
  "figures_summary": {
    "Figure 1": {
      "description": "Full caption text from paper (not truncated)",
      "images": [
        {"filename": "page_3_img_0.jpeg", "page": 3}
      ]
    }
  },
  "images": [...]
}
```

#### 4. Indexed Navigation

**Fast section jumping** - No need to re-read entire analysis

**paper-index.md sections:**
- 📄 Paper Metadata
- 🗂️ Document Structure (navigation table)
- 📊 Data Tables in Paper
- 🎯 Quick Facts (for `/thermoextract` automation)
- 🔑 Key Findings
- 💾 Database Relevance
- 🚀 Implementation Priority

**paper-analysis.md sections (with anchors):**
1. Executive Summary
2. Key Problem Addressed
3. Methods/Study Design
4. Results
5. Data Tables in Paper
6. EDM vs LA-ICP-MS Comparison
7. Relevance to Database
8. Visualization Opportunities
9. Statistical/Analytical Implementation
10. Feature Ideas for Data Platform
11. Key Quotes
12. Action Items

**Navigation format:**
```markdown
[#anchor-name](./paper-analysis.md#anchor-name)
```

### Critical Metadata for /thermoextract Integration

**Quick Facts section (paper-index.md):**

```markdown
#### 🎯 Quick Facts (For /thermoextract Automation)

- **Study Location:** [Full location name, Country]
- **Coordinates:** [Lat/Lon range if provided]
- **Mineral Analyzed:** [apatite/zircon/titanite - lowercase]
- **Method:** [EDM/LA-ICP-MS/Both]
- **Sample ID Pattern:** `^[REGEX_PATTERN]$`
  - Examples:
    - `^MU\d{2}-\d{2}$` (matches MU19-05, MU20-12)
    - `^[A-Z]{2,4}\d{2}-\d{2,3}$` (matches XX19-05, XXXX20-123)
- **Column Naming:** [Numbered (0,1,2...) / Named (sample_id, age...) / Mixed]
- **Age Type:** [Pooled / Central / Both]
- **Has Track Lengths:** [Yes/No]
- **Has Chemistry Data:** [Yes/No - list what: Dpar, Cl, rmr0, etc]
```

### Quality Checks

**Before completion, validate:**

- [ ] All metadata fields populated
- [ ] Sample ID pattern is valid regex
- [ ] All tables listed with extractability status
- [ ] Primary data table identified
- [ ] Extracted figures section completed
- [ ] All Quick Facts completed
- [ ] At least 5 key findings
- [ ] Database relevance rating provided
- [ ] All 12 analysis sections present
- [ ] All sections have proper anchor tags
- [ ] Image metadata JSON created
- [ ] Figure descriptions from paper text (not inferred)

### Success Criteria

**A successful analysis should:**

1. **Enable fast navigation** - Jump to specific sections without re-reading
2. **Support /thermoextract** - Metadata is accurate and usable for automation
3. **Document methods** - Anyone can understand what was done
4. **Map to database** - Clear field-level mappings
5. **Provide examples** - Code snippets show implementation
6. **Be maintainable** - Clear structure, easy to update

**Ultimate test:**
- Can someone understand the paper in 10 minutes? ✅
- Can `/thermoextract` successfully extract data? ✅
- Can developers implement features from the mappings? ✅

---

## Command 2: /thermoextract

**Purpose:** Extract thermochronology data from PDFs with zero import errors

**Workflow:** Extract → Validate → Import (one successful attempt)

**Key Principle:** Data must be **perfect before import** - no manual fixes needed

**Location:** `.claude/commands/thermoextract.md`

### What It Does

1. **Extract tables from PDF** with auto-filtering of invalid rows
2. **Transform to FAIR schema** (4 normalized database tables)
3. **Validate against EarthBank templates** (catch ALL errors before import)
4. **Report missing fields** with actionable recommendations
5. **Generate CSVs** ready for zero-error import
6. **Create extraction report** documenting the process

### Complete Workflow (13 Steps)

#### STEP 0: Check for Existing Paper Analysis (NEW)

**Integrates with /thermoanalysis output**

```python
dataset_name = Path(pdf_path).stem
paper_dir = Path('build-data/learning/thermo-papers') / dataset_name
index_path = paper_dir / 'paper-index.md'

if index_path.exists():
    # Extract metadata from paper-index.md
    # - Authors, year, study location
    # - Mineral type, analysis method
    # - Sample ID pattern (regex)
    # - Primary data table
    # - Expected age range
```

**Benefits:**
- Faster table identification
- Better sample validation
- Automatic metadata population
- Age range validation

#### STEP 1: Multi-Method Table Extraction (IDEA-012)

**Enhanced extraction with comparison**

```python
from scripts.pdf.multi_method_extraction import extract_all_tables_multi_method

# Run multi-method extraction
all_results = extract_all_tables_multi_method(
    paper_dir=paper_dir,
    pdf_path=Path(pdf_path),
    output_dir=raw_dir
)

# Convert to results dict (table_name -> best_df)
results = {}
for result in all_results:
    table_name = result['table_info']['name']
    best_method = result['best_method']
    best_df = result['results'].get(best_method)

    if best_df is not None:
        results[table_name] = best_df
```

**Output:**
- RAW/ directory with extracted tables
- comparison-report.md (method performance)
- Best extraction method selected automatically

#### STEP 2: Apply Column Name Mapping

**Customize based on paper format**

```python
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
    # ... etc
}

table1.rename(columns=column_mapping, inplace=True)
```

#### STEP 3: Filter Invalid Rows (CRITICAL)

**Remove footer/header metadata BEFORE transformation**

```python
# Use pattern from analysis if available
if paper_metadata['has_analysis'] and paper_metadata['sample_id_pattern']:
    sample_pattern = paper_metadata['sample_id_pattern']
else:
    sample_pattern = r'^[A-Z]{2,4}\d{2}-\d{2,3}$'  # Default

# Dictionary to store cleaned tables
cleaned_tables = {}

# Loop through ALL extracted tables
for table_id, df in results.items():
    if 'Table 1' in table_id:
        # Main data: use sample ID pattern
        valid_rows = df['sample_id'].astype(str).str.match(sample_pattern, na=False)
        df_clean = df[valid_rows].copy()
        cleaned_tables[table_id] = df_clean

    elif 'EPMA' in table_id:
        # Chemistry: keep standard reference materials
        valid_rows = df[first_col].astype(str).str.contains(
            'urango|FCT|adagascar',
            case=False, na=False
        )
        df_clean = df[valid_rows].copy()
        cleaned_tables[table_id] = df_clean

    elif '(U-Th)/He' in table_id:
        # He QC: keep rows with analysis numbers
        valid_rows = df[analysis_col].notna()
        df_clean = df[valid_rows].copy()
        cleaned_tables[table_id] = df_clean
```

**Why This Matters:**
- Malawi 2024 import: 51 extracted → 34 valid (17 invalid rows)
- Invalid rows cause: "value too long for character varying(50)"
- **Filter during extraction, not manually in CSV**

#### STEP 4: Parse Ages with Errors

**Handle "245.3 ± 49.2" format**

```python
def parse_age_error(age_str):
    """
    Parse age string like '245.3 ± 49.2' into (age, error)
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

# Parse ages
pooled_ages = table1_clean['pooled_age_ma'].apply(lambda x: parse_age_error(x)[0])
pooled_errors = table1_clean['pooled_age_ma'].apply(lambda x: parse_age_error(x)[1])
```

#### STEP 5: Transform to FAIR Schema

**EarthBank Schema v2 (datapoint-based architecture)**

```python
# 1. Samples table
samples_df = pd.DataFrame({
    'sample_id': table1_clean['sample_id'],
    'dataset_id': 1,  # Placeholder
    'latitude': -13.5,  # Extract from Table A2 or analysis
    'longitude': 34.8,
    'elevation_m': None,
    'mineral_type': mineral_type,  # From analysis
    'analysis_method': analysis_method,  # From analysis
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

# 3. FT Counts table (grain-by-grain)
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
ft_lengths_df = pd.DataFrame({
    'sample_id': table1_clean['sample_id'],
    'grain_id': table1_clean['sample_id'] + '_pooled',
    'n_confined_tracks': pd.to_numeric(table1_clean['n_tracks'], errors='coerce').astype('Int64'),
    'mean_track_length_um': mtl,
    'mean_track_length_sd_um': pd.to_numeric(table1_clean['mtl_sd_um'], errors='coerce'),
    'dpar_um': dpar
})
```

**Output:**
- samples.csv
- ft_ages.csv
- ft_counts.csv
- ft_track_lengths.csv

#### STEP 6: Setup Output Directory Structure

**Integrated with /thermoanalysis**

```python
dataset_name = Path(pdf_path).stem
paper_dir = Path('build-data/learning/thermo-papers') / dataset_name

raw_dir = paper_dir / 'RAW'
fair_dir = paper_dir / 'FAIR'

raw_dir.mkdir(parents=True, exist_ok=True)
fair_dir.mkdir(parents=True, exist_ok=True)
```

**Structure:**
```
paper-dir/
├── paper-index.md              (from /thermoanalysis)
├── paper-analysis.md          (from /thermoanalysis)
├── images/                    (from /thermoanalysis)
├── RAW/                       (original extracted data)
│   ├── table-1-raw.csv
│   ├── table-2-raw.csv
│   └── table-1-cleaned.csv
├── FAIR/                      (EarthBank schema v2)
│   ├── samples.csv
│   ├── ft-datapoints.csv
│   ├── ft-count-data.csv
│   ├── ft-length-data.csv
│   └── import.sql
└── [PDF]
```

#### STEP 7: Save Cleaned Tables

**Only cleaned versions saved (raw extractions discarded)**

```python
for table_id, df_clean in cleaned_tables.items():
    table_filename = table_id.lower().replace(' ', '-') + '-cleaned.csv'
    df_clean.to_csv(raw_dir / table_filename, index=False)
```

#### STEP 8: Map to EarthBank Templates

**FAIR compliance (Kohn et al. 2024, Nixon et al. 2025)**

```python
from pathlib import Path
import openpyxl

# Load EarthBank templates
template_dir = Path('build-data/learning/thermo-papers/earthbanktemplates')
sample_template = template_dir / 'Sample.template.v2025-04-16.xlsx'
ft_template = template_dir / 'FTDatapoint.template.v2024-11-11.xlsx'

# Read template structure
sample_wb = openpyxl.load_workbook(sample_template)
ft_wb = openpyxl.load_workbook(ft_template)

# Map our data to EarthBank template fields
field_mappings_sample = {
    'sample_id': 'sample_id',
    'latitude': 'latitude',
    'longitude': 'longitude',
    'elevation_m': 'elevation',
    'mineral_type': 'mineral',
    'analysis_method': 'method',
}

field_mappings_ft = {
    'sample_id': 'sample_id',
    'n_grains': 'num_grains',
    'pooled_age_ma': 'pooled_age',
    'central_age_ma': 'central_age',
    'dispersion_pct': 'dispersion',
    'p_chi2': 'P_chi2',
    # ... etc
}

# Generate EarthBank-compatible CSVs
earthbank_samples.to_csv(fair_dir / 'earthbank_samples.csv', index=False)
earthbank_ft.to_csv(fair_dir / 'earthbank_ft_data.csv', index=False)
```

**Templates supported:**
- Sample.template.v2025-04-16.xlsx
- FTDatapoint.template.v2024-11-11.xlsx
- HeDatapoint.template.v2024-11-11.xlsx

#### STEP 9: Validate EarthBank Templates

**Catch ALL errors before import**

```python
validation_errors = []
validation_warnings = []

# Required fields (per Kohn et al. 2024 Table 4)
required_sample_fields = [
    'sample_id', 'latitude', 'longitude', 'elevation',
    'geodetic_datum', 'vertical_datum', 'mineral', 'lithology'
]

for field in required_sample_fields:
    if field not in earthbank_samples.columns:
        validation_errors.append(f'Missing required sample field: {field}')
    elif earthbank_samples[field].isna().all():
        validation_warnings.append(f'Sample field "{field}" is entirely empty')

# Check coordinate validity
lat_values = pd.to_numeric(earthbank_samples['latitude'], errors='coerce')
if (lat_values.abs() > 90).any():
    validation_errors.append('Latitude values out of range (-90 to 90)')

# Check age validity
ages = pd.to_numeric(earthbank_ft['central_age'], errors='coerce')
if (ages < 0).any():
    validation_errors.append('Negative ages detected')

# Also run internal validation
result = subprocess.run([
    'python', 'scripts/db/validate-import.py', str(fair_dir)
], capture_output=True, text=True)
```

#### STEP 10: Report Missing Information

**Actionable recommendations**

```python
missing_info = {
    'sample_critical': [],      # Required for EarthBank
    'sample_recommended': [],   # Improves data quality
    'ft_critical': [],          # Required for EarthBank
    'ft_recommended': [],       # Improves data quality
    'empty_values': []          # Partial data
}

# Check for missing fields
sample_critical_fields = [
    'IGSN', 'lithology', 'collector', 'collection_date'
]

ft_critical_fields = [
    'zeta', 'zeta_error', 'analyst', 'laboratory',
    'analysis_date', 'microscope', 'etching_conditions'
]

# Generate completeness score
total_critical = len(sample_critical_fields) + len(ft_critical_fields)
missing_critical = len(missing_info['sample_critical']) + len(missing_info['ft_critical'])
completeness_pct = ((total_critical - missing_critical) / total_critical) * 100
```

**Completeness ratings:**
- ≥90%: ✅ EXCELLENT - Ready for EarthBank upload
- ≥75%: 🟡 GOOD - Some manual extraction needed
- ≥50%: 🟠 MODERATE - Significant manual work required
- <50%: 🔴 INCOMPLETE - Contact paper authors

#### STEP 11: Generate SQL Import Script

**Zero-error import**

```python
import_script = f"""-- SQL Import Script for {dataset_name}
-- Generated: {pd.Timestamp.now().strftime("%Y-%m-%d %H:%M:%S")}
-- EarthBank Schema v2 Compatible

-- IMPORT SAMPLES
\\copy samples(...) FROM '{fair_dir.absolute()}/samples.csv' WITH (FORMAT CSV, HEADER TRUE, NULL '');

-- IMPORT FT DATAPOINTS
\\copy ft_datapoints(...) FROM '{fair_dir.absolute()}/ft-datapoints.csv' WITH (FORMAT CSV, HEADER TRUE, NULL '');

-- IMPORT FT COUNT DATA
\\copy ft_count_data(...) FROM '{fair_dir.absolute()}/ft-count-data.csv' WITH (FORMAT CSV, HEADER TRUE, NULL '');

-- IMPORT FT TRACK LENGTH DATA
\\copy ft_track_length_data(...) FROM '{fair_dir.absolute()}/ft-length-data.csv' WITH (FORMAT CSV, HEADER TRUE, NULL '');

-- VERIFICATION
SELECT 'Import complete: ' ||
    (SELECT COUNT(*) FROM samples) || ' samples, ' ||
    (SELECT COUNT(*) FROM ft_datapoints) || ' datapoints';
"""

with open(fair_dir / 'import.sql', 'w') as f:
    f.write(import_script)
```

#### STEP 12: Validate Before Import (CRITICAL!)

**Final validation before database import**

```python
result = subprocess.run([
    'python', 'scripts/db/validate-import.py', str(fair_dir)
], capture_output=True, text=True)

if result.returncode != 0:
    print('❌ VALIDATION FAILED')
    print('   Fix errors before attempting import')
    sys.exit(1)

print('✅ All files validated - ready for import')
```

**Common issues caught:**
- sample_id too long (limit: 50 chars)
- Invalid sample_id format
- Missing required columns
- NULL values in required fields

#### STEP 13: Create Extraction Report

**Documentation for future reference**

```python
with open(report_path, 'w') as f:
    f.write(f'''# Thermochronology Data Extraction Report

**Paper:** {dataset_name}
**Extracted:** {pd.Timestamp.now().strftime("%Y-%m-%d")}

## Extraction Summary

**Tables Extracted:** {len(results)}
**Valid Samples:** {len(table1_clean)}
**Age Range:** {central_ages.min():.1f} - {central_ages.max():.1f} Ma

## Data Quality

✅ **Sample ID Validation:** All samples match pattern
✅ **Schema Validation:** All CSV files passed pre-import validation
✅ **No Null Values:** Required fields populated
✅ **Foreign Keys:** All relationships valid

## Next Steps

### Import to Database

```bash
psql "$DATABASE_URL" -f {fair_dir}/import.sql
```

### Deploy to Vercel

```bash
cp -r {paper_dir} public/data/datasets/
```
''')
```

### Key Lessons Learned

#### Problem 1: Invalid Data in CSVs

**What went wrong:** Footer text extracted as sample rows (219 chars → overflow)

**Fix:** Filter invalid rows during extraction using sample ID pattern

```python
valid_samples = df['sample_id'].str.match(r'^[A-Z]{2,4}\d{2}-\d{2,3}$')
```

#### Problem 2: No Pre-Import Validation

**What went wrong:** Errors discovered during import attempt (3 failures)

**Fix:** Validate against database schema BEFORE import

```python
python scripts/db/validate-import.py <data-dir>
```

#### Problem 3: Schema Mismatches

**What went wrong:** `study_location` vs `study_area`, wrong constraint names

**Fix:** Validation script checks actual database schema

**Result:** Catch ALL errors before import attempt

### SQL vs Python Import

#### Use SQL COPY (Recommended)

```bash
./scripts/db/import-sql.sh AUTHOR(YEAR)-TITLE build-data/learning/thermo-papers/AUTHOR(YEAR)-TITLE/FAIR
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

#### Use Python (Alternative)

```bash
python scripts/db/import-dataset.py build-data/learning/thermo-papers/AUTHOR(YEAR)-TITLE/FAIR
```

**Advantages:**
- ✅ More flexible (complex transformations)
- ✅ Better error logging
- ✅ Easier debugging

**Use for:**
- Development/testing
- Custom transformations
- Small datasets (<1000 rows)

### Success Metrics

**Before improvements:**
- ❌ 3 failed import attempts
- ❌ 17 rows lost to manual CSV editing
- ❌ Multiple database cleanups required

**After improvements:**
- ✅ 1 successful import (first attempt)
- ✅ Zero rows lost (filtered during extraction)
- ✅ Zero manual editing
- ✅ Zero database cleanups

### Database Metadata Import

**After successful data import, add metadata for dataset page:**

```sql
-- Update datasets table
UPDATE datasets SET
  paper_summary = '<One-paragraph summary>',
  fair_score = <0-100>,
  fair_reasoning = '<Detailed explanation>',
  key_findings = ARRAY[
    '<Finding 1>',
    '<Finding 2>',
    '<Finding 3>'
  ],
  extraction_report_url = '/data/datasets/<id>/<dataset>-extraction-report.md'
WHERE id = <dataset_id>;

-- Register data files
INSERT INTO data_files (
  dataset_id, file_name, file_path, file_type,
  display_name, row_count, description
) VALUES
  (<id>, 'samples.csv', '/data/datasets/AUTHOR(YEAR)-TITLE/FAIR/samples.csv',
   'fair_schema', 'Samples', <rows>, 'FAIR-compliant samples data'),
  -- ... etc
```

**Copy files to public directory:**

```bash
cp -r build-data/learning/thermo-papers/AUTHOR(YEAR)-TITLE \
   public/data/datasets/
```

**What this enables:**
- ✅ FAIR Score Badge (color-coded 0-100 rating)
- ✅ Paper Summary (one-paragraph overview)
- ✅ Key Findings (bullet list)
- ✅ FAIR Compliance Analysis
- ✅ Downloadable Files (all CSVs + original + report)
- ✅ Download All as ZIP

---

## Integration Between Commands

### Workflow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    /thermoanalysis                          │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ 1. Read PDF thoroughly                                │  │
│  │ 2. Extract plain text (text/plain-text.txt)          │  │
│  │ 3. Discover tables dynamically (text/text-index.md)  │  │
│  │ 4. Extract images + captions (images/)               │  │
│  │ 5. Generate paper-index.md (metadata)                │  │
│  │ 6. Generate paper-analysis.md (full analysis)        │  │
│  │ 7. Generate figures.md (human-readable)              │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            ↓
                  Metadata for automation
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                     /thermoextract                          │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ STEP 0: Check for existing analysis                  │  │
│  │         ↓ Load metadata from paper-index.md          │  │
│  │ STEP 1: Multi-method extraction (uses text-index)    │  │
│  │ STEP 3: Filter invalid rows (uses sample pattern)    │  │
│  │ STEP 5: Transform to FAIR (uses metadata)            │  │
│  │ STEP 8: Map to EarthBank templates                   │  │
│  │ STEP 9: Validate against schema                      │  │
│  │ STEP 11: Generate SQL import script                  │  │
│  │ STEP 12: Final validation                            │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            ↓
                   Zero-error import
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                    Database Import                          │
│                                                             │
│  psql "$DATABASE_URL" -f FAIR/import.sql                   │
│                                                             │
│  ✅ 1 successful import (first attempt)                     │
│  ✅ Zero manual editing                                     │
│  ✅ Zero database cleanups                                  │
└─────────────────────────────────────────────────────────────┘
```

### Shared Metadata

**From /thermoanalysis to /thermoextract:**

| Metadata Field | Source | Used By /thermoextract |
|----------------|--------|------------------------|
| Authors | paper-index.md | Extraction report |
| Year | paper-index.md | Dataset naming |
| Study location | paper-index.md | `samples.latitude/longitude` |
| Mineral type | paper-index.md | `samples.mineral_type` |
| Analysis method | paper-index.md | `samples.analysis_method` |
| Sample ID pattern | paper-index.md | Invalid row filtering |
| Primary table | paper-index.md | Table identification |
| Age range | paper-index.md | Age validation |
| Table locations | text-index.md | Multi-method extraction |

### Best Practices

**Always run /thermoanalysis first:**
1. Provides metadata for faster extraction
2. Documents paper structure for future reference
3. Enables automatic validation
4. Creates reusable plain text extraction

**Benefits of integrated workflow:**
- **33% token reduction** - Plain text extracted once, reused many times
- **Faster extraction** - Table discovery uses text-index.md
- **Better validation** - Sample pattern from analysis catches invalid rows
- **Automatic metadata** - Mineral type, method, location pre-populated
- **Complete documentation** - From analysis to extraction to import

---

## Technical Details

### Dependencies

**Python packages:**
```python
import pandas as pd
import numpy as np
import re
import json
from pathlib import Path
import fitz  # PyMuPDF
import openpyxl
import subprocess
```

**Required templates:**
```
build-data/learning/thermo-papers/earthbanktemplates/
├── Sample.template.v2025-04-16.xlsx
├── FTDatapoint.template.v2024-11-11.xlsx
└── HeDatapoint.template.v2024-11-11.xlsx
```

**Required scripts:**
```
scripts/
├── pdf/
│   ├── extraction_engine.py            # PDF table extraction
│   ├── multi_method_extraction.py      # IDEA-012 multi-method
│   └── table_extractors.py             # Table-specific extractors
└── db/
    ├── validate-import.py               # Pre-import validation
    ├── import-dataset.py                # Python import
    └── import-sql.sh                    # SQL bulk import
```

### File Naming Conventions

**Paper folder:**
```
Format: AUTHOR(YEAR)-TITLE-JOURNAL
Example: Peak(2021)-Grand-Canyon-Great-Unconformity-Geology
```

**CSV files:**
```
RAW/
  table-1-raw.csv           # Original extraction
  table-1-cleaned.csv       # After invalid row filtering
  table-2-raw.csv

FAIR/
  samples.csv               # EarthBank Sample template
  ft-datapoints.csv         # EarthBank FT Datapoints sheet
  ft-count-data.csv         # EarthBank FTCountData sheet
  ft-length-data.csv        # EarthBank FTLengthData sheet
  import.sql                # SQL import script
```

### EarthBank Template Mapping

**Schema compliance:**
- Kohn et al. (2024) - FT data reporting standards (GSA Bulletin)
- Nixon et al. (2025) - EarthBank FAIR geochemistry platform (Chemical Geology)

**Mapping tables:**

| Our Table | EarthBank Template | EarthBank Sheet |
|-----------|-------------------|-----------------|
| samples.csv | Sample.template.v2025-04-16.xlsx | Sample |
| ft-datapoints.csv | FTDatapoint.template.v2024-11-11.xlsx | FT Datapoints |
| ft-count-data.csv | FTDatapoint.template.v2024-11-11.xlsx | FTCountData |
| ft-length-data.csv | FTDatapoint.template.v2024-11-11.xlsx | FTLengthData |

**Required fields (Kohn et al. 2024):**

**Table 4 (Samples):**
- sample_id, IGSN, latitude, longitude, elevation
- geodetic_datum, vertical_datum, mineral, lithology

**Table 5 (FT Counts):**
- grain_id, Ns, ρs, Dpar, analyst, lab, method
- Ni, ρi, ρd (EDM); U ppm (LA-ICP-MS)

**Table 10 (Ages):**
- grain/sample ages, age equation, zeta, λf, λD
- Peak ages (detrital), dispersion, P(χ²)

---

## Troubleshooting

### Common Issues

#### Issue 1: Sample ID pattern not matching

**Symptom:** All rows filtered out, 0 valid samples

**Cause:** Regex pattern doesn't match actual sample IDs

**Fix:**
1. Check Table 1 in PDF for sample ID format
2. Examples: MU19-05, XXXX20-123, ABC-001
3. Update pattern in paper-index.md:
   - `^MU\d{2}-\d{2}$` (MU19-05)
   - `^[A-Z]{2,4}\d{2}-\d{2,3}$` (flexible)

#### Issue 2: Column mapping incorrect

**Symptom:** KeyError: 'sample_id' not in columns

**Cause:** Column names don't match expected format

**Fix:**
1. Check Table 1 header row
2. Update column_mapping in STEP 2
3. Handle numbered columns (0,1,2...) vs named columns

#### Issue 3: Validation fails on import

**Symptom:** "value too long for character varying(50)"

**Cause:** sample_id exceeds database field length

**Fix:**
1. Check cleaned_tables sample_id lengths
2. Ensure invalid rows were filtered (STEP 3)
3. Adjust sample_id pattern to be more strict

#### Issue 4: Missing critical metadata

**Symptom:** Completeness score <50%

**Cause:** Fields like zeta, analyst, laboratory not in PDF tables

**Fix:**
1. Check paper methods section (zeta value)
2. Check acknowledgments (laboratory, analyst)
3. Contact paper authors if unavailable
4. Document in extraction report

#### Issue 5: Image extraction incomplete

**Symptom:** Figures without descriptions in image-metadata.json

**Cause:** Caption text not on same page as image

**Fix:**
1. Check figures.md for caption text
2. Manually match images to figures
3. Update image-metadata.json if needed
4. Document in paper-index.md

### Debug Mode

**Enable verbose output:**

```python
# In STEP 1 (extraction)
extractor = UniversalThermoExtractor(pdf_path, verbose=True)

# In STEP 3 (filtering)
print(f'Sample IDs before filtering:')
print(df['sample_id'].head(20))

print(f'Sample IDs after filtering:')
print(df_clean['sample_id'].head(20))
```

**Check intermediate files:**

```bash
# Verify RAW extraction
ls -lh build-data/learning/thermo-papers/AUTHOR(YEAR)-TITLE/RAW/

# Check FAIR schema
head -20 build-data/learning/thermo-papers/AUTHOR(YEAR)-TITLE/FAIR/samples.csv

# Validate SQL script
cat build-data/learning/thermo-papers/AUTHOR(YEAR)-TITLE/FAIR/import.sql
```

---

## Future Enhancements

### Planned Improvements

**IDEA-012 (In Progress):**
- ✅ Plain text extraction (token efficiency)
- ✅ Dynamic table discovery (no hardcoded assumptions)
- ✅ Multi-method extraction comparison
- 🚧 Automated method selection based on quality metrics

**IDEA-008 (Completed):**
- ✅ Image extraction from PDFs
- ✅ Figure caption matching
- ✅ JSON metadata for database import
- ✅ Human-readable figures.md

**Future ideas:**
- AI-powered column mapping (GPT-4 Vision)
- Automatic IGSN lookup and validation
- Batch processing multiple papers
- Interactive extraction report (web UI)
- Direct EarthBank upload API

---

## References

**Key papers:**

1. Kohn, B.P., et al., 2024. Interpreting and reporting fission-track chronological data. GSA Bulletin, v. 136, no. 9/10, p. 3891–3920.
   - Defines FAIR data reporting standards (Tables 4-11)
   - Community consensus on required metadata fields

2. Nixon, A.L., et al., 2025. Volcanoes to vugs: Demonstrating a FAIR geochemistry framework. Chemical Geology, v. 696, 123092.
   - EarthBank platform architecture
   - Template specifications and field definitions

**Documentation:**
- `.claude/CLAUDE.md` - Project-specific instructions
- `readme/INDEX.md` - Living documentation hub
- `readme/database/SCHEMA_CHANGES.md` - Database changelog
- `build-data/assets/schemas/AusGeochem_ERD.md` - Full ERD specification

---

**Last Updated:** 2025-11-17 by Claude Code

**Questions or issues?** Check:
1. This documentation
2. Command files: `.claude/commands/thermoanalysis.md`, `.claude/commands/thermoextract.md`
3. Project CLAUDE.md: `.claude/CLAUDE.md`
4. Report issues: https://github.com/anthropics/claude-code/issues
