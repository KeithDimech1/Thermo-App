# /thermoextract - AI-Powered Thermochronology Data Extraction

**Purpose:** Extract thermochronology data from research papers using pdfplumber + AI analysis, validate against Kohn et al. (2024) standards, and import to database.

**Key Innovation:** Iterative AI-guided extraction with pdfplumber for reliable text extraction + AI structure understanding + validation loop

---

## Workflow Overview

```
1. Read paper-index.md → Get table locations & page numbers
2. Extract PDF pages → Isolate individual table pages
3. pdfplumber text extraction → Get raw text from each page
4. AI structure analysis → Understand headers & data patterns
5. Create extraction plan → Bespoke CSV generation strategy
6. Extract to CSV → Generate structured data file
7. AI validation → Review CSV for correctness
8. Retry loop → Delete & retry until perfect
9. Compare to Kohn 2024 → Check required fields
10. Calculate FAIR score → Rate completeness (0-100)
11. Transform to EarthBank → Map to import templates
12. Import to database → Load into Schema v2 tables
```

---

## Step 1: Load Paper Analysis

**Task:** Read the paper-index.md to identify tables and their exact page numbers

**File to read:**
```bash
build-data/learning/thermo-papers/PAPER_NAME/paper-index.md
```

**Extract from "📊 Data Tables in Paper" section:**

| Field | What to Extract | Example |
|-------|----------------|---------|
| **Table identifiers** | Table numbers/names | Table 1, Table 2, Table A2, Table A3 |
| **Page numbers** | Exact page(s) where table appears | Page 9, Pages 10-11 (spans 2 pages) |
| **Data type** | AFT/AHe/Chemistry | AFT ages, (U-Th-Sm)/He results |
| **Description** | Brief content summary | AFT results summary (35 samples) |


**Example from McMillan et al. (2024):**
```
Table 1: Page 9 - AFT results summary (35 samples) -
Table 2: Pages 10-11 - (U-Th-Sm)/He results (spans 2 pages) - 
Table A3: Page 36 - Durango reference material -
```

**Note:** Focus on HIGH priority tables first (AFT ages, count data, track lengths, AHe data)

---

## Step 2: Extract PDF Pages

**Task:** Isolate individual PDF pages containing each target table

**Tool:** Use existing script `scripts/extract_pdf_pages.py`

**Process:**
```bash
# For single-page table
python scripts/extract_pdf_pages.py \
  --pdf "build-data/learning/thermo-papers/PAPER_NAME/paper.pdf" \
  --pages 9 \
  --output "build-data/learning/thermo-papers/PAPER_NAME/extracted/table-1-page-9.pdf"

# For multi-page table (e.g., spans pages 10-11)
python scripts/extract_pdf_pages.py \
  --pdf "build-data/learning/thermo-papers/PAPER_NAME/paper.pdf" \
  --pages 10,11 \
  --output "build-data/learning/thermo-papers/PAPER_NAME/extracted/table-2-pages-10-11.pdf"
```

**Output:** Individual PDF files for each table in `extracted/` subdirectory

**Why this step?**
- Isolates table from rest of paper (removes noise)
- Allows focused text extraction on relevant pages only
- Enables page-specific pdfplumber configuration

---

## Step 3: Extract Text with pdfplumber

**Task:** Extract raw text from isolated PDF pages using pdfplumber

**Python Script Template:**
```python
import pdfplumber

# Open extracted PDF page
with pdfplumber.open("path/to/extracted/table-X.pdf") as pdf:
    for page in pdf.pages:
        # Extract text (preserves spacing/alignment)
        text = page.extract_text()

        # Save to text file
        with open("path/to/extracted/table-X-raw-text.txt", "w") as f:
            f.write(text)
```

**Output:** Raw text files in `extracted/` directory
- `table-1-page-9-raw-text.txt`
- `table-2-pages-10-11-raw-text.txt`
- etc.

**Why pdfplumber?**
- More reliable than pure AI vision for table text
- Preserves spacing and alignment (critical for column detection)
- Handles multi-column layouts better than OCR

---

## Step 4: AI Structure Analysis

**Task:** Use AI to analyze the first 10-20 lines of raw text and understand table structure

**Process:**
1. Read the raw text file
2. Extract first 10-20 lines (headers + 2-3 data rows)
3. Ask AI to analyze structure

**AI Analysis Prompt:**
```
You are analyzing a thermochronology data table extracted from a research paper.

Here are the first 15 lines of text from the table:
[PASTE RAW TEXT HERE]

Analyze the structure and answer:
1. What are the column headers? (exact text)
2. What delimiter separates columns? (tab, multiple spaces, comma?)
3. Are headers on one line or multiple lines?
4. What pattern do sample IDs follow? (regex)
5. How many columns are there?
6. Are there any footnote symbols or special characters in the data?
7. Are there any merged cells or spanning columns?
8. What numeric format is used? (decimal: . or ,)
9. How are uncertainties represented? (±, separate column, parentheses?)
10. Are there any non-data rows? (subtotals, averages, blank rows?)

Provide a concise structural summary.
```

**AI Output Example:**
```
Table Structure Analysis:
- Headers: Single line, tab-separated
- Columns: 24 columns detected
- Sample ID: Pattern "MU19-\d{2}" (e.g., MU19-05, MU19-18)
- Delimiter: Multiple spaces (aligned columns)
- Uncertainties: ± format in same cell (e.g., "125.3 ± 15.2")
- Special notes:
  * Column 3 has footnote markers (a, b, c)
  * Rows with "—" indicate no data
  * Last row is average (skip it)
```

---

## Step 5: Create Extraction Plan

**Task:** Based on AI structure analysis, create a bespoke Python extraction script

**Template Generator Prompt:**
```
Based on the structure analysis, generate a Python script to extract this table to CSV.

Requirements:
- Use pandas for dataframe operations
- Handle [DELIMITER TYPE] delimiter
- Extract column headers: [LIST HEADERS]
- Sample ID regex: [REGEX PATTERN]
- Skip non-data rows: [SPECIFY ROWS TO SKIP]
- Split uncertainty columns (e.g., "125.3 ± 15.2" → two columns: value, error)
- Remove footnote symbols from data
- Handle missing data markers (—, n.d., <LOD)
- Output CSV with clean column names

Script should be robust and handle edge cases.
```

**AI generates:** Custom Python extraction script
- `extract_table_1.py`
- `extract_table_2.py`
- etc.

**Example script structure:**
```python
import pandas as pd
import re

# Read raw text
with open("table-1-raw-text.txt", "r") as f:
    lines = f.readlines()

# Skip header rows and footers
data_lines = lines[2:-1]  # Based on structure analysis

# Split columns (adjust delimiter based on analysis)
rows = []
for line in data_lines:
    # Custom parsing logic based on AI recommendations
    cols = re.split(r'\s{2,}', line.strip())  # 2+ spaces = delimiter
    rows.append(cols)

# Create dataframe
df = pd.DataFrame(rows, columns=HEADERS)

# Clean data
df = df[df['Sample_ID'].str.match(r'MU19-\d{2}')]  # Filter valid samples
df = df.replace('—', None)  # Missing data

# Split uncertainty columns
# ... (custom logic based on format)

# Export to CSV
df.to_csv("table-1-extracted.csv", index=False)
```

---

## Step 6: Extract to CSV

**Task:** Run the bespoke extraction script and generate CSV

**Process:**
```bash
cd build-data/learning/thermo-papers/PAPER_NAME/extracted/
python extract_table_1.py
```

**Output:** Clean CSV file
- `table-1-extracted.csv`

**CSV Requirements:**
- Headers must be clean (no special characters)
- One row per sample/grain/datapoint
- Numeric columns must be pure numbers (no ± symbols)
- Uncertainty in separate column from value
- Missing data as empty cells (not "—" or "n.d.")
- Sample IDs validated against expected pattern

---

## Step 7: AI Validation

**Task:** Use AI to review the extracted CSV and verify correctness

**Process:**
1. Read the CSV file
2. Compare to original raw text (spot check 3-5 rows)
3. Validate column count, data types, sample IDs
4. Check for extraction errors

**AI Validation Prompt:**
```
I extracted this CSV from a thermochronology data table.

CSV preview (first 5 rows):
[PASTE CSV ROWS]

Original text (corresponding lines):
[PASTE RAW TEXT LINES]

Validation checklist:
1. Do sample IDs match? ✓ / ✗
2. Do numeric values match? ✓ / ✗
3. Are uncertainties in separate columns? ✓ / ✗
4. Are all columns present? (expected: 24, found: __)
5. Are there any parsing errors? (merged cells, split values, etc.)
6. Does the data make scientific sense? (ages positive, uncertainties reasonable)

If any validation fails, describe the issue and recommend fixes.
```

**AI Output:**
- ✅ **PASS** - CSV is correct, proceed to next step
- ❌ **FAIL** - CSV has errors, see issues below

---

## Step 8: Retry Loop (If Validation Fails)

**Task:** If AI validation detects errors, delete CSV and retry extraction

**Process:**
```bash
# Delete incorrect CSV
rm table-1-extracted.csv

# Review AI feedback
# Adjust extraction script (extract_table_1.py) based on issues

# Re-run extraction
python extract_table_1.py

# Re-run AI validation (Step 7)
```

**Retry until:**
- AI validation passes all checks
- Spot-checked rows match original text exactly
- Column count and data types are correct

**Maximum retries:** 3 attempts
- If still failing after 3 tries, flag for manual review

---

## Step 9: Compare to Kohn (2024) Standards

**Task:** Validate extracted CSV against required fields from Kohn et al. (2024) Table 4-10

**Reference files:**
- `/build-data/learning/archive/01-Kohn-2024-Reporting-Standards.md`
- `/build-data/assets/source-data/thermo/table-data/table-05-fission-track-counts.csv` (field requirements)
- `/build-data/assets/source-data/thermo/table-data/table-10-fission-track-ages.csv` (age requirements)

**Check for each table type:**

**Table 4 - Geosample Metadata:**
- Required: sample_id, IGSN, lat, lon, elevation, mineral, lithology
- Recommended: collector, collection_date, stratigraphic_unit

**Table 5 - Fission-Track Counts:**
- Required: grain_id, Ns, ρs, Dpar, analyst, lab, method
- EDM-specific: Ni, ρi, Nd, ρd, dosimeter
- LA-ICP-MS-specific: U ppm, counting area

**Table 6 - Track Lengths:**
- Required: track_id, length, c-axis angle, analyst
- Recommended: Dpar, etching conditions

**Table 10 - Ages:**
- Required: central_age, dispersion, P(χ²), n_grains, zeta, λf, λD
- Recommended: pooled_age, analyst, laboratory

**Output:** Validation report showing:
```
✅ Required fields present: 8/10 (80%)
⚠️  Missing required: IGSN, collector
⚠️  Missing recommended: stratigraphic_unit, collection_date
```

---

## Step 10: Calculate FAIR Score

**Task:** Rate data completeness on 0-100 scale

**Scoring rubric:**

**Critical Fields (50 points):**
- Sample metadata (IGSN, location, mineral) → 15 pts
- Count data (Ns, ρs, Dpar) → 15 pts
- Age calculation params (zeta, λf, λD) → 10 pts
- Statistical data (dispersion, P(χ²)) → 10 pts

**Recommended Fields (30 points):**
- Provenance (analyst, lab, date) → 10 pts
- Track lengths (MTL, SD) → 10 pts
- Kinetic parameters (Cl, rmr₀) → 10 pts

**Quality Indicators (20 points):**
- Secondary standards reported → 5 pts
- Grain-level data (not just pooled) → 5 pts
- Complete methods description → 5 pts
- Uncertainty propagation → 5 pts

**Grade scale:**
- 90-100: Excellent (fully FAIR compliant)
- 75-89: Good (minor gaps)
- 60-74: Fair (moderate gaps)
- <60: Poor (major gaps)

**Example output:**
```
FAIR Score: 82/100 (Good)

Breakdown:
  Critical fields: 42/50 ✅
  Recommended fields: 24/30 ⚠️
  Quality indicators: 16/20 ✅

Key gaps:
  - No IGSN assigned
  - Missing analyst ORCID
  - No secondary standards reported
```

---

## Step 11: Transform to EarthBank Templates

**Task:** Map extracted data to EarthBank Excel template format

**Reference templates:**
- `build-data/learning/archive/earthbanktemplates/Sample.template.v2025-04-16.xlsx`
- `build-data/learning/archive/earthbanktemplates/FTDatapoint.template.v2024-11-11.xlsx`
- `build-data/learning/archive/earthbanktemplates/HeDatapoint.template.v2024-11-11.xlsx`

**Mapping process:**

### Map 1: Samples Table → Sample.template
```
RAW field → EarthBank field:
- sample_id → Sample
- latitude → Latitude
- longitude → Longitude
- elevation_m → Elevation (m)
- mineral_type → Mineral
- lithology → Lithology

Add required fields:
- geodetic_datum → "WGS84" (default)
- vertical_datum → "mean sea level" (default)
- sample_kind → "in situ rock" (default)
```

### Map 2: Count/Age Data → FTDatapoint.template

**Sheet: "FT Datapoints"**
```
RAW field → EarthBank field:
- sample_id → Sample
- n_grains → Num_Grains
- central_age_ma → Central_Age
- central_age_error_ma → Central_Age_1s
- dispersion_pct → Dispersion
- P_chi2 → P_chi2
- zeta → Zeta
- analyst → Analyst
- laboratory → Laboratory
```

**Sheet: "FTCountData"**
```
RAW field → EarthBank field:
- grain_id → Grain_ID
- Ns → Ns
- rho_s_cm2 → rho_s
- U_ppm → U_ppm
- Dpar_um → Dpar
- Dpar_sd_um → Dpar_1s
```

**Sheet: "FTLengthData"**
```
RAW field → EarthBank field:
- track_id → Track_ID
- grain_id → Grain_ID
- track_length_um → Fission_Track_Length
- angle_to_c_axis_deg → C_Axis_Angle
- Dpar_um → Dpar
```

**Output:** EarthBank-compatible CSV files in `FAIR/` directory:
- `earthbank_samples.csv`
- `earthbank_ft_datapoints.csv`
- `earthbank_ft_count_data.csv`
- `earthbank_ft_length_data.csv`

---

## Step 12: Import to Database

**Task:** Load validated and transformed data into Schema v2 PostgreSQL database

**Database Configuration:**
```bash
# Required in .env.local
DIRECT_URL="postgresql://neondb_owner:npg_a7j4RQTnJxcz@ep-fragrant-bush-ahfxu1xq.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require"
```

**Schema v2 Tables to Populate:**

### Samples Table
```typescript
// Read from: earthbank_samples.csv
// Target table: samples
// Fields: sample_id, igsn, lat, lon, elevation_m, mineral_type, lithology
```

### FT Datapoints Table
```typescript
// Read from: earthbank_ft_datapoints.csv
// Target table: ft_datapoints
// Key fields:
// - sample_id (FK to samples)
// - datapoint_key (unique identifier)
// - central_age_ma, central_age_error_ma
// - pooled_age_ma, pooled_age_error_ma
// - n_grains, dispersion_pct, P_chi2_pct
// - mean_track_length_um
// - zeta_yr_cm2, dosimeter
// - laboratory, analyst_orcid, analysis_date
```

### FT Count Data Table
```typescript
// Read from: earthbank_ft_count_data.csv
// Target table: ft_count_data
// Fields:
// - ft_datapoint_id (FK to ft_datapoints)
// - grain_id
// - Ns, rho_s_cm2, U_ppm, Dpar_um
```

### FT Track Length Data Table
```typescript
// Read from: earthbank_ft_track_length_data.csv
// Target table: ft_track_length_data
// Fields:
// - ft_datapoint_id (FK to ft_datapoints)
// - track_id, grain_id
// - track_length_um, angle_to_c_axis_deg
```

### He Whole Grain Data Table
```typescript
// Read from: earthbank_he_whole_grain_data.csv (if AHe data present)
// Target table: he_whole_grain_data
// Fields: (75+ columns - see readme/database/tables/he_datapoints.md)
```

**Import Process:**

**Option A: TypeScript import script (recommended)**
```bash
# Create import script: scripts/import_mcmillan_2024.ts
npx tsx scripts/import_mcmillan_2024.ts
```

**Option B: SQL COPY commands**
```sql
-- Import samples
COPY samples(sample_id, igsn, lat, lon, elevation_m, ...)
FROM '/path/to/earthbank_samples.csv'
DELIMITER ',' CSV HEADER;

-- Import ft_datapoints
COPY ft_datapoints(sample_id, datapoint_key, central_age_ma, ...)
FROM '/path/to/earthbank_ft_datapoints.csv'
DELIMITER ',' CSV HEADER;

-- Import ft_count_data (with FK lookups)
-- ... (similar for other tables)
```

**Import Script Template:**
```typescript
import { pool } from '@/lib/db/connection'
import { readCSV } from '@/lib/utils/csv'

async function importMcMillan2024() {
  const client = await pool.connect()

  try {
    await client.query('BEGIN')

    // 1. Import samples
    const samples = await readCSV('FAIR/earthbank_samples.csv')
    for (const sample of samples) {
      await client.query(`
        INSERT INTO samples (sample_id, igsn, lat, lon, elevation_m, ...)
        VALUES ($1, $2, $3, $4, $5, ...)
        ON CONFLICT (sample_id) DO NOTHING
      `, [sample.sample_id, sample.igsn, ...])
    }

    // 2. Import ft_datapoints
    const datapoints = await readCSV('FAIR/earthbank_ft_datapoints.csv')
    for (const dp of datapoints) {
      const result = await client.query(`
        INSERT INTO ft_datapoints (sample_id, datapoint_key, ...)
        VALUES ($1, $2, ...)
        RETURNING id
      `, [dp.sample_id, dp.datapoint_key, ...])

      const datapointId = result.rows[0].id

      // 3. Import ft_count_data for this datapoint
      const counts = await readCSV('FAIR/earthbank_ft_count_data.csv')
      const dpCounts = counts.filter(c => c.datapoint_key === dp.datapoint_key)
      for (const count of dpCounts) {
        await client.query(`
          INSERT INTO ft_count_data (ft_datapoint_id, grain_id, ...)
          VALUES ($1, $2, ...)
        `, [datapointId, count.grain_id, ...])
      }

      // 4. Import track length data
      // ... (similar pattern)
    }

    await client.query('COMMIT')
    console.log('Import successful!')
  } catch (error) {
    await client.query('ROLLBACK')
    console.error('Import failed:', error)
  } finally {
    client.release()
  }
}

importMcMillan2024()
```

**Validation After Import:**
```sql
-- Check sample count
SELECT COUNT(*) FROM samples WHERE sample_id LIKE 'MU19-%';

-- Check datapoint count
SELECT COUNT(*) FROM ft_datapoints
JOIN samples ON ft_datapoints.sample_id = samples.sample_id
WHERE samples.sample_id LIKE 'MU19-%';

-- Check count data (should be n_grains × n_samples total rows)
SELECT COUNT(*) FROM ft_count_data
JOIN ft_datapoints ON ft_count_data.ft_datapoint_id = ft_datapoints.id
JOIN samples ON ft_datapoints.sample_id = samples.sample_id
WHERE samples.sample_id LIKE 'MU19-%';

-- Verify age ranges
SELECT
  MIN(central_age_ma) as min_age,
  MAX(central_age_ma) as max_age,
  AVG(central_age_ma) as avg_age
FROM ft_datapoints
JOIN samples ON ft_datapoints.sample_id = samples.sample_id
WHERE samples.sample_id LIKE 'MU19-%';
```

**Expected Results (McMillan et al. 2024):**
- 35 samples (MU19-05 through MU19-XX)
- 35 ft_datapoints (1 per sample - LA-ICP-MS method)
- ~875 ft_count_data rows (assuming ~25 grains per sample)
- ~2000+ ft_track_length_data rows (confined tracks)
- Age range: ~100-325 Ma (AFT central ages)

**Success Criteria:**
- ✅ All samples imported without errors
- ✅ Foreign key relationships intact
- ✅ Age ranges match paper Table 1
- ✅ Sample IDs match expected pattern
- ✅ No NULL values in required fields

**Troubleshooting:**
- **FK constraint errors:** Ensure samples imported before datapoints
- **Duplicate key errors:** Check for duplicate sample_id or datapoint_key
- **Type errors:** Verify numeric columns are properly cast (not strings)
- **Missing data:** Check for NULL values in required fields

---

## Missing Information Identification

**Task:** Document gaps that require manual data entry or author contact

**Critical missing fields report:**

**Sample Metadata:**
```
🔴 CRITICAL - IGSN missing for all 34 samples
   Action: Register samples at https://www.geosamples.org/

🔴 CRITICAL - Collector not specified
   Action: Extract from paper acknowledgments/author affiliations

🟡 RECOMMENDED - Collection date not provided
   Action: Check field methods section or contact authors
```

**Analytical Metadata:**
```
🔴 CRITICAL - Zeta calibration factor not reported
   Action: Extract from methods section or Table/Supplementary

🔴 CRITICAL - Laboratory/analyst not specified
   Action: Extract from acknowledgments

🟡 RECOMMENDED - Analysis date missing
   Action: Check methods or table captions
```

**Quality Control:**
```
🟡 RECOMMENDED - No secondary standards reported
   Action: Check supplementary materials for Durango/FCT results

🟡 RECOMMENDED - Etching conditions not detailed
   Action: Extract from methods section
```

**Where to find missing info:**
- **Methods section** - Zeta, dosimeter, etching conditions, equipment
- **Acknowledgments** - Analyst names, laboratory facilities
- **Table captions** - Analysis dates, standards
- **Supplementary materials** - QC data, full analytical parameters
- **Author affiliations** - Laboratory locations

---

## Output Directory Structure

**After successful extraction, the paper directory should contain:**

```
build-data/learning/thermo-papers/PAPER_NAME/
├── paper-index.md                          # From /thermoanalysis
├── paper-analysis.md                       # From /thermoanalysis
├── paper.pdf                               # Original PDF
├── extracted/
│   ├── table-1-page-9.pdf                  # Isolated PDF pages
│   ├── table-1-page-9-raw-text.txt         # pdfplumber output
│   ├── extract_table_1.py                  # Custom extraction script
│   ├── table-1-extracted.csv               # Final validated CSV
│   ├── table-2-pages-10-11.pdf
│   ├── table-2-pages-10-11-raw-text.txt
│   ├── extract_table_2.py
│   └── table-2-extracted.csv
├── FAIR/
│   ├── earthbank_samples.csv               # EarthBank format (XX samples)
│   ├── earthbank_ft_datapoints.csv         # EarthBank format (XX datapoints)
│   ├── earthbank_ft_count_data.csv         # EarthBank format (XX grains)
│   └── earthbank_ft_length_data.csv        # EarthBank format (XX tracks)
└── extraction-report.md                    # FAIR score & completeness

```

---

## Usage

**Command:**
```bash
/thermoextract
```

**Prerequisites:**
1. ✅ Paper must have been analyzed with `/thermoanalysis` first
2. ✅ `paper-index.md` exists with table locations and page numbers
3. ✅ PDF is readable (not corrupted or image-only scans)
4. ✅ Python environment has `pdfplumber` and `pandas` installed

**Expected time:**
- **Per table:** 5-10 minutes (extraction + validation + retry if needed)
- **Typical paper (2-3 tables):** 15-30 minutes
- **Complex paper (5+ tables):** 45-60 minutes

**Output locations:**
- **Extracted CSVs:** `build-data/learning/thermo-papers/PAPER_NAME/extracted/`
- **EarthBank templates:** `build-data/learning/thermo-papers/PAPER_NAME/FAIR/`
- **Database:** PostgreSQL (DIRECT_URL connection)

---

## Success Criteria

### ✅ Extraction Successful If:

**Stage 1-8 (CSV Extraction):**
- ✅ All HIGH priority tables extracted from paper-index.md
- ✅ pdfplumber text extraction succeeds for all pages
- ✅ AI structure analysis identifies headers and delimiters correctly
- ✅ Bespoke extraction scripts generated for each table
- ✅ AI validation passes (spot-checked rows match original text)
- ✅ CSV files have correct column count and data types
- ✅ Sample IDs match expected pattern from paper-index.md

**Stage 9-12 (Validation & Import):**
- ✅ Required fields from Kohn et al. (2024) present (≥80%)
- ✅ FAIR score calculated and documented (any score acceptable)
- ✅ EarthBank templates generated (valid CSV format)
- ✅ Database import succeeds without FK constraint errors
- ✅ Post-import validation queries return expected counts
- ✅ Age ranges match paper values

### ❌ Extraction Failed If:

**PDF/Text Extraction Failures:**
- ❌ PDF pages cannot be read (corrupted file)
- ❌ pdfplumber returns empty text (image-only PDF, needs OCR)
- ❌ Tables not on pages specified in paper-index.md

**Structure Analysis Failures:**
- ❌ AI cannot identify column delimiters (unusual table format)
- ❌ Headers span multiple lines in unparseable way
- ❌ Merged cells or complex spanning columns break extraction

**Validation Failures:**
- ❌ CSV validation fails 3+ times (script cannot parse table correctly)
- ❌ Sample IDs don't match expected pattern (wrong table extracted)
- ❌ Column count wildly different from expected
- ❌ Numeric values cannot be parsed (wrong delimiter, merged cells)

**Database Import Failures:**
- ❌ FK constraint errors (missing parent records)
- ❌ Duplicate key errors (sample_id or datapoint_key conflicts)
- ❌ Type casting errors (strings in numeric columns)
- ❌ Required fields are NULL

**When extraction fails:**
1. Review AI structure analysis output
2. Manually inspect raw text file to verify pdfplumber output
3. Adjust extraction script based on table-specific quirks
4. If 3 retries fail, flag for manual review or contact paper authors

---

## Advantages Over Previous Approach

### Old Approach (Broken - backup saved as backup-2025-11-16.md):
- ❌ 1455 lines of inline Python code in slash command
- ❌ Hardcoded extraction logic (couldn't adapt to different table formats)
- ❌ Pure AI vision (unreliable for complex tables)
- ❌ No validation loop (extracted once, hoped for best)
- ❌ No database import (stopped at CSV generation)
- ❌ 13 conceptual steps but incomplete implementation

### New Approach (This):
- ✅ **12 clear, executable steps** with specific tools and prompts
- ✅ **pdfplumber + AI hybrid** (reliable text extraction + intelligent structure understanding)
- ✅ **Bespoke extraction scripts** per table (adapts to different formats)
- ✅ **AI validation loop** (iterative correction until perfect)
- ✅ **Complete end-to-end** (PDF → CSV → EarthBank → Database)
- ✅ **Kohn 2024 compliance checking** (field-level validation)
- ✅ **FAIR score calculation** (quantifies data completeness)
- ✅ **TypeScript import scripts** (Schema v2 integration)

### Key Innovations:
1. **Page-level extraction** - Isolates tables from noise (Step 2)
2. **AI structure analysis** - Understands headers/delimiters without hardcoding (Step 4)
3. **Generated extraction scripts** - Creates custom Python parsers per table (Step 5)
4. **Validation with retry** - AI reviews CSV, fixes errors iteratively (Steps 7-8)
5. **Database integration** - Complete import to Schema v2 tables (Step 12)

---

## Example Workflow (McMillan et al. 2024)

```bash
# 1. Read paper-index.md
# Identifies: Table 1 (page 9), Table 2 (pages 10-11), Table A3 (page 36)

# 2. Extract PDF pages
python scripts/extract_pdf_pages.py --pdf paper.pdf --pages 9 \
  --output extracted/table-1-page-9.pdf

# 3. Extract text with pdfplumber
# Generates: table-1-page-9-raw-text.txt

# 4. AI structure analysis
# Result: 24 columns, space-delimited, "MU19-\d{2}" pattern, ± uncertainties

# 5. Create extraction script
# AI generates: extract_table_1.py

# 6. Extract to CSV
python extracted/extract_table_1.py
# Output: table-1-extracted.csv

# 7. AI validation
# Spot-checks 5 rows → ✅ PASS (all values match)

# 8. Retry loop
# (Skipped - validation passed first time)

# 9. Compare to Kohn 2024
# Result: 18/22 required fields present (82%)

# 10. Calculate FAIR score
# Result: 78/100 (Good) - missing IGSN and analyst ORCID

# 11. Transform to EarthBank
# Generates 4 CSV files in FAIR/ directory

# 12. Import to database
npx tsx scripts/import_mcmillan_2024.ts
# Result: 35 samples, 35 datapoints, 875 count records imported ✅
```

---

---

## Step 13: Generate Database Metadata SQL Scripts

**Task:** After successful extraction and import, generate SQL scripts to populate `datasets` table metadata and FAIR scores

**Process:**

### 13.1 Extract Metadata from Analysis Files

```python
import re
from pathlib import Path

print()
print('━' * 60)
print('STEP 13: GENERATING DATABASE METADATA SQL SCRIPTS')
print('━' * 60)
print()

# Read paper-index.md to extract metadata
index_file = paper_dir / 'paper-index.md'
with open(index_file, 'r', encoding='utf-8') as f:
    index_content = f.read()

# Read extraction-report.md if exists (for FAIR scores)
extraction_report = paper_dir / 'extraction-report.md'
fair_breakdown_data = None

if extraction_report.exists():
    with open(extraction_report, 'r', encoding='utf-8') as f:
        extraction_content = f.read()

    # Parse FAIR scores from extraction-report.md
    # Extract Table 4-10 scores
    table4_match = re.search(r'Table 4.*?(\d+)/15', extraction_content, re.DOTALL)
    table5_match = re.search(r'Table 5.*?(\d+)/15', extraction_content, re.DOTALL)
    table6_match = re.search(r'Table 6.*?(\d+)/10', extraction_content, re.DOTALL)
    table10_match = re.search(r'Table 10.*?(\d+)/10', extraction_content, re.DOTALL)

    # Extract FAIR category scores
    findable_match = re.search(r'Findable.*?(\d+)/25', extraction_content, re.DOTALL)
    accessible_match = re.search(r'Accessible.*?(\d+)/25', extraction_content, re.DOTALL)
    interoperable_match = re.search(r'Interoperable.*?(\d+)/25', extraction_content, re.DOTALL)
    reusable_match = re.search(r'Reusable.*?(\d+)/25', extraction_content, re.DOTALL)

    # Extract total score and grade
    total_score_match = re.search(r'Total FAIR Score:\s*(\d+)/100', extraction_content)
    grade_match = re.search(r'Grade:\s*([A-F])', extraction_content)

    if all([table4_match, table5_match, table6_match, table10_match,
            findable_match, accessible_match, interoperable_match, reusable_match,
            total_score_match, grade_match]):
        fair_breakdown_data = {
            'table4_score': int(table4_match.group(1)),
            'table5_score': int(table5_match.group(1)),
            'table6_score': int(table6_match.group(1)),
            'table10_score': int(table10_match.group(1)),
            'findable_score': int(findable_match.group(1)),
            'accessible_score': int(accessible_match.group(1)),
            'interoperable_score': int(interoperable_match.group(1)),
            'reusable_score': int(reusable_match.group(1)),
            'total_score': int(total_score_match.group(1)),
            'grade': grade_match.group(1)
        }

        print(f'✅ Extracted FAIR score breakdown from extraction-report.md')
        print(f'   Overall Score: {fair_breakdown_data["total_score"]}/100 (Grade {fair_breakdown_data["grade"]})')
    else:
        print('⚠️  Could not extract complete FAIR scores from extraction-report.md')
        print('   SQL scripts will include basic metadata only')
else:
    print('ℹ️  No extraction-report.md found')
    print('   SQL scripts will include basic metadata only')

print()
```

### 13.2 Generate SQL Script for Dataset Metadata

```python
# Extract metadata from paper-index.md
full_citation = re.search(r'\*\*Full Citation:\*\*\s*(.+)', index_content)
authors_match = re.search(r'\*\*Authors:\*\*\s*(.+)', index_content)
year_match = re.search(r'\*\*Year:\*\*\s*(\d{4})', index_content)
journal_match = re.search(r'\*\*Journal:\*\*\s*(.+)', index_content)
volume_pages_match = re.search(r'\*\*Volume/Pages:\*\*\s*(.+)', index_content)
doi_match = re.search(r'\*\*DOI:\*\*\s*(https?://[^\s]+|10\.\d{4,}/[^\s]+)', index_content)
location_match = re.search(r'\*\*(?:Study Location|Region):\*\*\s*(.+)', index_content)
laboratory_match = re.search(r'\*\*Laboratory:\*\*\s*(.+)', index_content)
mineral_match = re.search(r'\*\*Mineral Type:\*\*\s*(\w+)', index_content)
sample_count_match = re.search(r'\*\*Sample Count:\*\*\s*(\d+)', index_content)
age_range_match = re.search(r'\*\*Age Range:\*\*\s*([\d.]+)\s*-\s*([\d.]+)\s*Ma', index_content)
paper_summary_match = re.search(r'## Executive Summary\n\n(.+?)\n\n', index_content, re.DOTALL)
supplementary_url_match = re.search(r'\*\*Supplementary Files URL:\*\*\s*(https?://[^\s]+)', index_content)
pdf_url_match = re.search(r'\*\*PDF URL:\*\*\s*(https?://[^\s]+)', index_content)

# Build metadata dictionary
metadata = {
    'full_citation': full_citation.group(1).strip() if full_citation else None,
    'publication_year': int(year_match.group(1)) if year_match else None,
    'publication_journal': journal_match.group(1).strip() if journal_match else None,
    'publication_volume_pages': volume_pages_match.group(1).strip() if volume_pages_match else None,
    'doi': doi_match.group(1).strip() if doi_match else None,
    'study_location': location_match.group(1).strip() if location_match else None,
    'laboratory': laboratory_match.group(1).strip() if laboratory_match else None,
    'mineral_analyzed': mineral_match.group(1).strip().lower() if mineral_match else None,
    'sample_count': int(sample_count_match.group(1)) if sample_count_match else None,
    'age_range_min_ma': float(age_range_match.group(1)) if age_range_match else None,
    'age_range_max_ma': float(age_range_match.group(2)) if age_range_match else None,
    'paper_summary': paper_summary_match.group(1).strip() if paper_summary_match else None,
    'pdf_filename': pdf_path.name if pdf_path else None,
    'pdf_url': pdf_url_match.group(1).strip() if pdf_url_match else None,
    'supplementary_files_url': supplementary_url_match.group(1).strip() if supplementary_url_match else None
}

# Generate SQL update script
sql_script = paper_dir / 'update-database-metadata.sql'
dataset_name = paper_dir.name  # Use folder name as dataset identifier

with open(sql_script, 'w') as f:
    f.write(f"-- Database metadata update for {dataset_name}\n")
    f.write(f"-- Generated by /thermoextract command\n")
    f.write(f"-- Run with: psql \"$DATABASE_URL\" -f {sql_script.name}\n\n")

    f.write("-- Update datasets table\n")
    f.write("UPDATE datasets SET\n")

    updates = []
    if metadata['full_citation']:
        updates.append(f"  full_citation = '{metadata['full_citation'].replace(\"'\", \"''\")}',\n")
    if metadata['publication_year']:
        updates.append(f"  publication_year = {metadata['publication_year']},\n")
    if metadata['publication_journal']:
        updates.append(f"  publication_journal = '{metadata['publication_journal'].replace(\"'\", \"''\")}',\n")
    if metadata['publication_volume_pages']:
        updates.append(f"  publication_volume_pages = '{metadata['publication_volume_pages'].replace(\"'\", \"''\")}',\n")
    if metadata['doi']:
        updates.append(f"  doi = '{metadata['doi'].replace(\"'\", \"''\")}',\n")
    if metadata['study_location']:
        updates.append(f"  study_location = '{metadata['study_location'].replace(\"'\", \"''\")}',\n")
    if metadata['laboratory']:
        updates.append(f"  laboratory = '{metadata['laboratory'].replace(\"'\", \"''\")}',\n")
    if metadata['pdf_filename']:
        updates.append(f"  pdf_filename = '{metadata['pdf_filename']}',\n")
    if metadata['pdf_url']:
        updates.append(f"  pdf_url = '{metadata['pdf_url']}',\n")
    if metadata['supplementary_files_url']:
        updates.append(f"  supplementary_files_url = '{metadata['supplementary_files_url']}',\n")
    if metadata['mineral_analyzed']:
        updates.append(f"  mineral_analyzed = '{metadata['mineral_analyzed']}',\n")
    if metadata['sample_count']:
        updates.append(f"  sample_count = {metadata['sample_count']},\n")
    if metadata['age_range_min_ma']:
        updates.append(f"  age_range_min_ma = {metadata['age_range_min_ma']},\n")
    if metadata['age_range_max_ma']:
        updates.append(f"  age_range_max_ma = {metadata['age_range_max_ma']},\n")
    if metadata['paper_summary']:
        summary_escaped = metadata['paper_summary'].replace("'", "''").replace("\n", " ")
        updates.append(f"  paper_summary = '{summary_escaped}',\n")

    if updates:
        f.write(''.join(updates))
        f.write("  last_modified_date = CURRENT_DATE\n")
        f.write(f"WHERE dataset_name = '{dataset_name}';\n\n")

    # Add FAIR score breakdown if available
    if fair_breakdown_data:
        f.write("-- Insert or update FAIR score breakdown\n")
        f.write("INSERT INTO fair_score_breakdown (\n")
        f.write("  dataset_id,\n")
        f.write("  table4_score, table5_score, table6_score, table10_score,\n")
        f.write("  findable_score, accessible_score, interoperable_score, reusable_score,\n")
        f.write("  total_score, grade\n")
        f.write(") VALUES (\n")
        f.write(f"  (SELECT id FROM datasets WHERE dataset_name = '{dataset_name}'),\n")
        f.write(f"  {fair_breakdown_data['table4_score']}, {fair_breakdown_data['table5_score']}, ")
        f.write(f"{fair_breakdown_data['table6_score']}, {fair_breakdown_data['table10_score']},\n")
        f.write(f"  {fair_breakdown_data['findable_score']}, {fair_breakdown_data['accessible_score']}, ")
        f.write(f"{fair_breakdown_data['interoperable_score']}, {fair_breakdown_data['reusable_score']},\n")
        f.write(f"  {fair_breakdown_data['total_score']}, '{fair_breakdown_data['grade']}'\n")
        f.write(")\n")
        f.write("ON CONFLICT (dataset_id) DO UPDATE SET\n")
        f.write("  table4_score = EXCLUDED.table4_score,\n")
        f.write("  table5_score = EXCLUDED.table5_score,\n")
        f.write("  table6_score = EXCLUDED.table6_score,\n")
        f.write("  table10_score = EXCLUDED.table10_score,\n")
        f.write("  findable_score = EXCLUDED.findable_score,\n")
        f.write("  accessible_score = EXCLUDED.accessible_score,\n")
        f.write("  interoperable_score = EXCLUDED.interoperable_score,\n")
        f.write("  reusable_score = EXCLUDED.reusable_score,\n")
        f.write("  total_score = EXCLUDED.total_score,\n")
        f.write("  grade = EXCLUDED.grade,\n")
        f.write("  updated_at = CURRENT_TIMESTAMP;\n\n")

    # Add verification queries
    f.write("-- Verify the update\n")
    f.write("SELECT id, dataset_name, publication_year, publication_journal, study_location, ")
    f.write("mineral_analyzed, sample_count, age_range_min_ma, age_range_max_ma\n")
    f.write("FROM datasets\n")
    f.write(f"WHERE dataset_name = '{dataset_name}';\n\n")

    if fair_breakdown_data:
        f.write("-- Verify FAIR score\n")
        f.write("SELECT dataset_id, table4_score, table5_score, table6_score, table10_score, ")
        f.write("findable_score, accessible_score, interoperable_score, reusable_score, total_score, grade\n")
        f.write("FROM fair_score_breakdown\n")
        f.write(f"WHERE dataset_id = (SELECT id FROM datasets WHERE dataset_name = '{dataset_name}');\n")

print(f'✅ Created SQL script: {sql_script.name}')
print()
```

### 13.3 Generate SQL Script for Data Files

```python
# Generate SQL for data_files table
files_sql = paper_dir / 'populate-data-files.sql'

with open(files_sql, 'w') as f:
    f.write("-- Populate data_files table with extracted files\n")
    f.write(f"-- Dataset: {dataset_name}\n")
    f.write(f"-- Generated by /thermoextract command\n\n")

    # Get list of all files created
    raw_files = list((paper_dir / 'RAW').glob('*.csv')) if (paper_dir / 'RAW').exists() else []
    fair_files = list((paper_dir / 'FAIR').glob('*.csv')) if (paper_dir / 'FAIR').exists() else []

    dataset_id_expr = f"(SELECT id FROM datasets WHERE dataset_name = '{dataset_name}')"

    # Insert RAW files
    if raw_files:
        f.write("-- Insert RAW CSV files\n")
        for file_path in raw_files:
            file_size = file_path.stat().st_size
            file_name = file_path.name
            relative_path = f'/build-data/learning/thermo-papers/{dataset_name}/RAW/{file_name}'

            f.write(f"INSERT INTO data_files (dataset_id, file_name, file_path, file_type, file_size_bytes)\n")
            f.write(f"VALUES ({dataset_id_expr}, '{file_name}', '{relative_path}', 'RAW', {file_size})\n")
            f.write(f"ON CONFLICT DO NOTHING;\n\n")

    # Insert FAIR files
    if fair_files:
        f.write("-- Insert FAIR/EarthBank CSV files\n")
        for file_path in fair_files:
            file_size = file_path.stat().st_size
            file_name = file_path.name
            relative_path = f'/build-data/learning/thermo-papers/{dataset_name}/FAIR/{file_name}'

            f.write(f"INSERT INTO data_files (dataset_id, file_name, file_path, file_type, file_size_bytes)\n")
            f.write(f"VALUES ({dataset_id_expr}, '{file_name}', '{relative_path}', 'EarthBank', {file_size})\n")
            f.write(f"ON CONFLICT DO NOTHING;\n\n")

    # Insert PDF if path is known
    if metadata.get('pdf_filename'):
        f.write("-- Insert main paper PDF\n")
        # Try to find the PDF file
        pdf_candidates = list(paper_dir.glob('*.pdf'))
        if pdf_candidates:
            pdf_file = pdf_candidates[0]  # Take first PDF found
            file_size = pdf_file.stat().st_size
            file_name = pdf_file.name
            relative_path = f'/build-data/learning/thermo-papers/{dataset_name}/{file_name}'

            f.write(f"INSERT INTO data_files (dataset_id, file_name, file_path, file_type, file_size_bytes, display_name)\n")
            f.write(f"VALUES ({dataset_id_expr}, '{file_name}', '{relative_path}', 'PDF', {file_size}, 'Main Paper PDF')\n")
            f.write(f"ON CONFLICT DO NOTHING;\n\n")

    # Insert images folder if exists
    images_dir = paper_dir / 'images'
    if images_dir.exists():
        relative_path = f'/build-data/learning/thermo-papers/{dataset_name}/images'
        f.write("-- Insert images folder\n")
        f.write(f"INSERT INTO data_files (dataset_id, file_name, file_path, file_type, is_folder, folder_path, display_name)\n")
        f.write(f"VALUES ({dataset_id_expr}, 'images-archive', '{relative_path}', 'Images', TRUE, '{relative_path}', 'Extracted Figures')\n")
        f.write(f"ON CONFLICT DO NOTHING;\n\n")

    # Add verification query
    f.write("-- Verify files were inserted\n")
    f.write("SELECT file_name, file_type, file_size_bytes, display_name\n")
    f.write("FROM data_files\n")
    f.write(f"WHERE dataset_id = {dataset_id_expr}\n")
    f.write("ORDER BY file_type, file_name;\n")

print(f'✅ Created data files SQL script: {files_sql.name}')
print()
```

### 13.4 Summary of Generated Scripts

```python
print('━' * 60)
print('DATABASE METADATA SQL SCRIPTS GENERATED')
print('━' * 60)
print()
print(f'📁 Location: {paper_dir}')
print()
print('📄 Files created:')
print(f'   1. {sql_script.name} - Dataset metadata + FAIR scores')
print(f'   2. {files_sql.name} - Data files tracking')
print()
print('📋 To populate the database:')
print(f'   cd {paper_dir}')
print(f'   psql "$DATABASE_URL" -f {sql_script.name}')
print(f'   psql "$DATABASE_URL" -f {files_sql.name}')
print()
print('✅ Extraction and SQL generation complete!')
print()
```

**Output Files:**
- `update-database-metadata.sql` - Updates `datasets` table with paper metadata and FAIR scores
- `populate-data-files.sql` - Inserts file records into `data_files` table

**Benefits:**
- ✅ No manual placeholder replacement needed (uses actual dataset name from folder)
- ✅ Automatically includes FAIR scores if extraction-report.md exists
- ✅ Tracks all RAW, FAIR, PDF, and image files
- ✅ Includes verification queries to check results
- ✅ Ready to execute immediately after generation

---

## Updated Output Directory Structure

**After successful extraction, the paper directory will contain:**

```
build-data/learning/thermo-papers/PAPER_NAME/
├── paper-index.md                          # From /thermoanalysis
├── paper-analysis.md                       # From /thermoanalysis
├── paper.pdf                               # Original PDF
├── extracted/
│   ├── table-1-page-9.pdf                  # Isolated PDF pages
│   ├── table-1-page-9-raw-text.txt         # pdfplumber output
│   ├── extract_table_1.py                  # Custom extraction script
│   ├── table-1-extracted.csv               # Final validated CSV
│   ├── table-2-pages-10-11.pdf
│   ├── table-2-pages-10-11-raw-text.txt
│   ├── extract_table_2.py
│   └── table-2-extracted.csv
├── FAIR/
│   ├── earthbank_samples.csv               # EarthBank format (XX samples)
│   ├── earthbank_ft_datapoints.csv         # EarthBank format (XX datapoints)
│   ├── earthbank_ft_count_data.csv         # EarthBank format (XX grains)
│   └── earthbank_ft_length_data.csv        # EarthBank format (XX tracks)
├── extraction-report.md                    # FAIR score & completeness
├── update-database-metadata.sql            # NEW: Dataset metadata SQL
└── populate-data-files.sql                 # NEW: File tracking SQL

```

---

**Ready to extract!** Run `/thermoextract` to start the complete workflow from PDF → Database.
