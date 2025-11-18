# Slash Command: /thermoextract

**Path:** `.claude/commands/thermoextract.md`
**Type:** Custom Slash Command
**Last Analyzed:** 2025-11-18

## What It Does

Extracts thermochronology data from research papers using a hybrid pdfplumber + AI approach, validates against Kohn et al. (2024) FAIR standards, transforms to EarthBank format, and imports to PostgreSQL database (Schema v2).

**Key Innovation:** Iterative AI-guided extraction with pdfplumber for reliable text extraction + AI structure understanding + validation loop + retry mechanism until perfect.

## Purpose

Complete end-to-end data extraction pipeline:

1. **Load metadata** from `/thermoanalysis` output (paper-index.md)
2. **Extract PDF pages** containing tables (isolate from noise)
3. **Extract text** using pdfplumber (preserves spacing/alignment)
4. **AI structure analysis** (understand headers, delimiters, patterns)
5. **Generate bespoke extraction scripts** (custom Python per table)
6. **Extract to CSV** with validation
7. **Retry loop** (delete & retry until AI validation passes)
8. **Validate against Kohn 2024** (check required fields)
9. **Calculate FAIR score** (0-100 completeness rating)
10. **Transform to EarthBank** templates (Excel-compatible CSV)
11. **Import to database** (Schema v2 PostgreSQL tables)
12. **Generate SQL metadata scripts** (populate datasets table)

## Usage

```bash
/thermoextract
```

**Prerequisites:**
- ✅ Paper analyzed with `/thermoanalysis` first
- ✅ `paper-index.md` exists with table locations and page numbers
- ✅ PDF readable (not corrupted or image-only scans)
- ✅ Python environment: pdfplumber, pandas, openpyxl, requests
- ✅ Database configured: `DIRECT_URL` in `.env.local`

**Expected Time:**
- Per table: 5-10 minutes (extraction + validation + retry if needed)
- Typical paper (2-3 tables): 15-30 minutes
- Complex paper (5+ tables): 45-60 minutes

## Workflow Steps (13 Steps)

### Step 1: Load Paper Analysis
**Reads:** `paper-index.md` (from `/thermoanalysis`)

**Extracts:**
- Table identifiers (Table 1, Table 2, Table A2, etc.)
- **Exact page numbers** (single page: "9", multi-page: "10-11")
- Data types (AFT/AHe/Chemistry)
- Priority flags (HIGH/MEDIUM/LOW)

**Example Metadata:**
```markdown
| Table # | Page(s) | Description | Data Type | Priority |
|---------|---------|-------------|-----------|----------|
| Table 1 | 9 | AFT results (35 samples) | AFT ages | HIGH |
| Table 2 | 10-11 | (U-Th-Sm)/He (2 pages) | AHe data | HIGH |
```

**Output:** List of tables to extract with page locations

---

### Step 2: Extract PDF Pages
**Tool:** `scripts/extract_pdf_pages.py`

**Process:**
```bash
# Single-page table
python scripts/extract_pdf_pages.py \
  --pdf "paper.pdf" \
  --pages 9 \
  --output "extracted/table-1-page-9.pdf"

# Multi-page table (spans 2 pages)
python scripts/extract_pdf_pages.py \
  --pdf "paper.pdf" \
  --pages 10,11 \
  --output "extracted/table-2-pages-10-11.pdf"
```

**Why:** Isolates table from rest of paper (removes headers, footers, other noise)

**Output:** Individual PDF files per table in `extracted/` directory

---

### Step 3: Extract Text with pdfplumber
**Uses:** pdfplumber library (Python)

**Process:**
```python
import pdfplumber

with pdfplumber.open("extracted/table-1-page-9.pdf") as pdf:
    for page in pdf.pages:
        text = page.extract_text()  # Preserves spacing/alignment
        with open("extracted/table-1-raw-text.txt", "w") as f:
            f.write(text)
```

**Why pdfplumber?**
- More reliable than pure AI vision for table text
- Preserves spacing/alignment (critical for column detection)
- Handles multi-column layouts better than OCR

**Output:** Raw text files (`table-X-raw-text.txt`)

---

### Step 4: AI Structure Analysis
**Reads:** First 10-20 lines of raw text

**AI Analyzes:**
1. Column headers (exact text)
2. Delimiter type (tab, multiple spaces, comma?)
3. Header structure (single line or multi-line?)
4. Sample ID pattern (regex)
5. Column count
6. Footnote symbols or special characters
7. Merged cells or spanning columns
8. Numeric format (decimal: `.` or `,`)
9. Uncertainty representation (±, separate column, parentheses?)
10. Non-data rows (subtotals, averages, blank rows)

**Example Output:**
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

**Output:** Structural summary for extraction script generation

---

### Step 5: Create Extraction Plan
**Based on:** AI structure analysis

**Generates:** Custom Python extraction script per table

**Example Script:**
```python
import pandas as pd
import re

# Read raw text
with open("table-1-raw-text.txt", "r") as f:
    lines = f.readlines()

# Skip header rows and footers
data_lines = lines[2:-1]  # Based on structure analysis

# Split columns (2+ spaces = delimiter)
rows = []
for line in data_lines:
    cols = re.split(r'\s{2,}', line.strip())
    rows.append(cols)

# Create dataframe
df = pd.DataFrame(rows, columns=HEADERS)

# Filter valid samples (regex from AI analysis)
df = df[df['Sample_ID'].str.match(r'MU19-\d{2}')]

# Clean missing data markers
df = df.replace('—', None)

# Split uncertainty columns
# ... (custom logic)

# Export
df.to_csv("table-1-extracted.csv", index=False)
```

**Output:** `extract_table_X.py` scripts

---

### Step 6: Extract to CSV
**Runs:** Bespoke extraction script

```bash
cd extracted/
python extract_table_1.py
```

**CSV Requirements:**
- Clean headers (no special characters)
- One row per sample/grain/datapoint
- Numeric columns = pure numbers (no ± symbols)
- Uncertainties in separate columns
- Missing data as empty cells (not "—" or "n.d.")
- Sample IDs validated against expected pattern

**Output:** `table-X-extracted.csv`

---

### Step 7: AI Validation
**Compares:** Extracted CSV vs original raw text (spot-checks 3-5 rows)

**Validation Checklist:**
1. ✓ Sample IDs match?
2. ✓ Numeric values match?
3. ✓ Uncertainties in separate columns?
4. ✓ All columns present? (expected vs found count)
5. ✓ Any parsing errors? (merged cells, split values)
6. ✓ Data makes scientific sense? (ages positive, uncertainties reasonable)

**Result:**
- ✅ **PASS** → Proceed to Step 9
- ❌ **FAIL** → Go to Step 8 (retry)

---

### Step 8: Retry Loop (If Validation Fails)
**Process:**
```bash
# Delete incorrect CSV
rm table-1-extracted.csv

# Review AI feedback
# Adjust extraction script based on issues

# Re-run extraction
python extract_table_1.py

# Re-run AI validation (Step 7)
```

**Maximum Retries:** 3 attempts
- If still failing after 3 tries → Flag for manual review

**Common Issues Fixed:**
- Wrong delimiter detected
- Multi-row headers not combined
- Footnote symbols not removed
- Merged cells split incorrectly

---

### Step 9: Compare to Kohn (2024) Standards
**References:**
- `build-data/learning/archive/01-Kohn-2024-Reporting-Standards.md`
- `build-data/assets/source-data/thermo/table-data/table-05-fission-track-counts.csv`
- `build-data/assets/source-data/thermo/table-data/table-10-fission-track-ages.csv`

**Validates:**

**Table 4 - Geosample Metadata:**
- Required: sample_id, IGSN, lat, lon, elevation, mineral, lithology
- Recommended: collector, collection_date, stratigraphic_unit

**Table 5 - Fission-Track Counts:**
- Required: grain_id, Ns, ρs, Dpar, analyst, lab, method
- EDM: Ni, ρi, Nd, ρd, dosimeter
- LA-ICP-MS: U ppm, counting area

**Table 6 - Track Lengths:**
- Required: track_id, length, c-axis angle, analyst
- Recommended: Dpar, etching conditions

**Table 10 - Ages:**
- Required: central_age, dispersion, P(χ²), n_grains, zeta, λf, λD
- Recommended: pooled_age, analyst, laboratory

**Output:**
```
✅ Required fields present: 18/22 (82%)
⚠️  Missing required: IGSN, analyst_orcid
⚠️  Missing recommended: stratigraphic_unit, collection_date
```

---

### Step 10: Calculate FAIR Score
**Rubric:**

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

**Grade Scale:**
- 90-100: Excellent (fully FAIR compliant)
- 75-89: Good (minor gaps)
- 60-74: Fair (moderate gaps)
- <60: Poor (major gaps)

**Example Output:**
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

**Output:** `extraction-report.md` with FAIR score breakdown

---

### Step 11: Transform to EarthBank Templates
**Reference Templates:**
- `build-data/learning/archive/earthbanktemplates/Sample.template.v2025-04-16.xlsx`
- `build-data/learning/archive/earthbanktemplates/FTDatapoint.template.v2024-11-11.xlsx`
- `build-data/learning/archive/earthbanktemplates/HeDatapoint.template.v2024-11-11.xlsx`

**Mapping Process:**

**Map 1: Samples → Sample.template**
```
RAW → EarthBank:
- sample_id → Sample
- latitude → Latitude
- longitude → Longitude
- elevation_m → Elevation (m)
- mineral_type → Mineral
- lithology → Lithology

Add defaults:
- geodetic_datum → "WGS84"
- vertical_datum → "mean sea level"
- sample_kind → "in situ rock"
```

**Map 2: Count/Age Data → FTDatapoint.template**

Sheet: "FT Datapoints"
```
- sample_id → Sample
- n_grains → Num_Grains
- central_age_ma → Central_Age
- central_age_error_ma → Central_Age_1s
- dispersion_pct → Dispersion
- P_chi2 → P_chi2
```

Sheet: "FTCountData"
```
- grain_id → Grain_ID
- Ns → Ns
- rho_s_cm2 → rho_s
- U_ppm → U_ppm
- Dpar_um → Dpar
```

Sheet: "FTLengthData"
```
- track_id → Track_ID
- grain_id → Grain_ID
- track_length_um → Fission_Track_Length
- angle_to_c_axis_deg → C_Axis_Angle
```

**Output:** `FAIR/` directory with EarthBank-compatible CSVs:
- `earthbank_samples.csv`
- `earthbank_ft_datapoints.csv`
- `earthbank_ft_count_data.csv`
- `earthbank_ft_length_data.csv`

---

### Step 12: Import to Database
**Database:** PostgreSQL (Schema v2)
**Connection:** Uses `DIRECT_URL` from `.env.local`

**Schema v2 Tables:**
1. `samples` - Sample metadata (sample_id, igsn, lat, lon, elevation_m, mineral_type, lithology)
2. `ft_datapoints` - FT analytical sessions (sample_id FK, datapoint_key, central_age_ma, pooled_age_ma, n_grains, dispersion_pct, P_chi2_pct, zeta_yr_cm2, laboratory, analyst_orcid, analysis_date)
3. `ft_count_data` - Grain-level counts (ft_datapoint_id FK, grain_id, Ns, rho_s_cm2, U_ppm, Dpar_um)
4. `ft_track_length_data` - Track measurements (ft_datapoint_id FK, track_id, grain_id, track_length_um, angle_to_c_axis_deg)
5. `he_whole_grain_data` - (U-Th)/He data (75+ columns)

**Import Process:**

**Option A: TypeScript import script (recommended)**
```bash
npx tsx scripts/import_[dataset_name].ts
```

**Option B: SQL COPY commands**
```sql
COPY samples(sample_id, igsn, lat, lon, ...)
FROM '/path/to/earthbank_samples.csv'
DELIMITER ',' CSV HEADER;
```

**Import Script Pattern:**
```typescript
import { pool } from '@/lib/db/connection'

async function importData() {
  const client = await pool.connect()

  try {
    await client.query('BEGIN')

    // 1. Import samples
    // 2. Import ft_datapoints (get ID)
    // 3. Import ft_count_data (use datapoint ID as FK)
    // 4. Import ft_track_length_data (use datapoint ID as FK)

    await client.query('COMMIT')
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}
```

**Post-Import Validation:**
```sql
-- Check sample count
SELECT COUNT(*) FROM samples WHERE sample_id LIKE 'MU19-%';

-- Check datapoint count
SELECT COUNT(*) FROM ft_datapoints
JOIN samples ON ft_datapoints.sample_id = samples.sample_id
WHERE samples.sample_id LIKE 'MU19-%';

-- Verify age ranges
SELECT MIN(central_age_ma), MAX(central_age_ma), AVG(central_age_ma)
FROM ft_datapoints
WHERE sample_id LIKE 'MU19-%';
```

**Success Criteria:**
- ✅ All samples imported without errors
- ✅ Foreign key relationships intact
- ✅ Age ranges match paper values
- ✅ Sample IDs match expected pattern
- ✅ No NULL values in required fields

**Output:** Data loaded into database

---

### Step 13: Generate Database Metadata SQL Scripts
**Reads:**
- `paper-index.md` - Extract metadata (citation, authors, year, journal, DOI, location, lab, mineral, sample count, age range)
- `extraction-report.md` - Extract FAIR scores (if exists)

**Generates:**

**1. `update-database-metadata.sql`**
```sql
-- Update datasets table
UPDATE datasets SET
  full_citation = 'McMillan et al. (2024)...',
  publication_year = 2024,
  publication_journal = 'Journal Name',
  doi = '10.xxxx/xxxxx',
  study_location = 'Malawi Rift, Malawi',
  laboratory = 'University of Arizona',
  mineral_analyzed = 'apatite',
  sample_count = 35,
  age_range_min_ma = 18.9,
  age_range_max_ma = 324.8,
  last_modified_date = CURRENT_DATE
WHERE dataset_name = 'McMillan(2024)-Malawi-Rift';

-- Insert FAIR score breakdown (if extraction-report.md exists)
INSERT INTO fair_score_breakdown (
  dataset_id, table4_score, table5_score, table6_score, table10_score,
  findable_score, accessible_score, interoperable_score, reusable_score,
  total_score, grade
) VALUES (
  (SELECT id FROM datasets WHERE dataset_name = 'McMillan(2024)-Malawi-Rift'),
  12, 13, 8, 9, 20, 18, 22, 22, 82, 'B'
)
ON CONFLICT (dataset_id) DO UPDATE SET ...;
```

**2. `populate-data-files.sql`**
```sql
-- Insert RAW CSV files
INSERT INTO data_files (dataset_id, file_name, file_path, file_type, file_size_bytes)
VALUES (
  (SELECT id FROM datasets WHERE dataset_name = 'McMillan(2024)-Malawi-Rift'),
  'table-1-cleaned.csv',
  '/build-data/learning/thermo-papers/McMillan(2024)-Malawi-Rift/RAW/table-1-cleaned.csv',
  'RAW',
  245678
);

-- Insert FAIR/EarthBank CSV files
-- Insert main paper PDF
-- Insert images folder
```

**To Execute:**
```bash
cd build-data/learning/thermo-papers/[PAPER_NAME]/
psql "$DATABASE_URL" -f update-database-metadata.sql
psql "$DATABASE_URL" -f populate-data-files.sql
```

**Output:** SQL scripts ready to execute (no manual placeholder replacement needed)

---

## Output Directory Structure

```
build-data/learning/thermo-papers/PAPER_NAME/
├── paper-index.md                   # From /thermoanalysis
├── paper-analysis.md                # From /thermoanalysis
├── paper.pdf                        # Original PDF
├── extracted/
│   ├── table-1-page-9.pdf           # Isolated PDF pages
│   ├── table-1-raw-text.txt         # pdfplumber output
│   ├── extract_table_1.py           # Custom extraction script
│   ├── table-1-extracted.csv        # Validated CSV
│   ├── table-2-pages-10-11.pdf
│   ├── table-2-raw-text.txt
│   ├── extract_table_2.py
│   └── table-2-extracted.csv
├── FAIR/
│   ├── earthbank_samples.csv        # EarthBank format
│   ├── earthbank_ft_datapoints.csv
│   ├── earthbank_ft_count_data.csv
│   └── earthbank_ft_length_data.csv
├── extraction-report.md             # FAIR score & completeness
├── update-database-metadata.sql     # Dataset metadata SQL
└── populate-data-files.sql          # File tracking SQL
```

## Database Interactions

**Tables Written:**
- `samples` (write: insert) - Sample metadata
- `ft_datapoints` (write: insert) - FT analytical sessions
- `ft_count_data` (write: insert) - Grain-level count data
- `ft_track_length_data` (write: insert) - Track measurements
- `he_whole_grain_data` (write: insert) - (U-Th)/He data (if applicable)
- `datasets` (write: update) - Paper metadata (via SQL script)
- `fair_score_breakdown` (write: insert/update) - FAIR scores (via SQL script)
- `data_files` (write: insert) - File tracking (via SQL script)

**Key Queries:**

**Import samples:**
```typescript
await client.query(`
  INSERT INTO samples (sample_id, igsn, lat, lon, elevation_m, mineral_type, lithology)
  VALUES ($1, $2, $3, $4, $5, $6, $7)
  ON CONFLICT (sample_id) DO NOTHING
`, [sample.sample_id, sample.igsn, ...])
```

**Import ft_datapoints:**
```typescript
const result = await client.query(`
  INSERT INTO ft_datapoints (
    sample_id, datapoint_key, central_age_ma, central_age_error_ma,
    pooled_age_ma, pooled_age_error_ma, n_grains, dispersion_pct,
    P_chi2_pct, zeta_yr_cm2, laboratory, analyst_orcid, analysis_date
  )
  VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
  RETURNING id
`, [...])

const datapointId = result.rows[0].id
```

**Import ft_count_data (uses datapoint ID as FK):**
```typescript
await client.query(`
  INSERT INTO ft_count_data (
    ft_datapoint_id, grain_id, Ns, rho_s_cm2, U_ppm, Dpar_um
  )
  VALUES ($1, $2, $3, $4, $5, $6)
`, [datapointId, count.grain_id, ...])
```

**Validation queries:**
```sql
-- Sample count
SELECT COUNT(*) FROM samples WHERE sample_id LIKE 'MU19-%';

-- Age range
SELECT MIN(central_age_ma), MAX(central_age_ma), AVG(central_age_ma)
FROM ft_datapoints
WHERE sample_id IN (SELECT sample_id FROM samples WHERE sample_id LIKE 'MU19-%');

-- Grain count
SELECT COUNT(*) FROM ft_count_data
WHERE ft_datapoint_id IN (
  SELECT id FROM ft_datapoints WHERE sample_id LIKE 'MU19-%'
);
```

## Dependencies

**External Packages:**
- `pdfplumber` - PDF text extraction
- `pandas` - CSV manipulation
- `openpyxl` - Excel file handling (EarthBank templates)
- `requests` - OSF/Zenodo downloads

**Internal Imports:**
- `@/lib/db/connection` - PostgreSQL pool
- `scripts/extract_pdf_pages.py` - PDF page isolation

**File Dependencies:**
- `paper-index.md` - Table locations from `/thermoanalysis`
- `text/table-pages.json` - Exact page numbers from `/thermoanalysis`
- `.env.local` - `DIRECT_URL` database connection
- `build-data/learning/archive/01-Kohn-2024-Reporting-Standards.md` - Field requirements
- `build-data/learning/archive/earthbanktemplates/*.xlsx` - EarthBank templates

## Success Criteria

### ✅ Extraction Successful If:

**Stages 1-8 (CSV Extraction):**
- All HIGH priority tables extracted
- pdfplumber text extraction succeeds
- AI structure analysis identifies headers/delimiters correctly
- Bespoke extraction scripts generated
- AI validation passes (spot-checked rows match original)
- CSV files have correct column count and data types
- Sample IDs match expected pattern

**Stages 9-13 (Validation & Import):**
- Required fields from Kohn et al. (2024) present (≥80%)
- FAIR score calculated and documented
- EarthBank templates generated (valid CSV format)
- Database import succeeds without FK constraint errors
- Post-import validation queries return expected counts
- Age ranges match paper values
- SQL metadata scripts generated successfully

### ❌ Extraction Failed If:

**PDF/Text Extraction Failures:**
- PDF pages cannot be read (corrupted)
- pdfplumber returns empty text (image-only PDF, needs OCR)
- Tables not on pages specified in paper-index.md

**Structure Analysis Failures:**
- AI cannot identify column delimiters (unusual format)
- Headers span multiple lines in unparseable way
- Merged cells or complex spanning columns break extraction

**Validation Failures:**
- CSV validation fails 3+ times (script cannot parse correctly)
- Sample IDs don't match expected pattern (wrong table extracted)
- Column count wildly different from expected
- Numeric values cannot be parsed (wrong delimiter)

**Database Import Failures:**
- FK constraint errors (missing parent records)
- Duplicate key errors (sample_id or datapoint_key conflicts)
- Type casting errors (strings in numeric columns)
- Required fields are NULL

**When Extraction Fails:**
1. Review AI structure analysis output
2. Manually inspect raw text file (verify pdfplumber output)
3. Adjust extraction script based on table-specific quirks
4. If 3 retries fail → Flag for manual review or contact authors

## Advantages Over Previous Approach

### Old Approach (backup-2025-11-16.md):
- ❌ 1455 lines of inline Python code
- ❌ Hardcoded extraction logic (couldn't adapt)
- ❌ Pure AI vision (unreliable for complex tables)
- ❌ No validation loop
- ❌ No database import
- ❌ Incomplete implementation

### New Approach (Current):
- ✅ **12 clear, executable steps** with specific tools
- ✅ **pdfplumber + AI hybrid** (reliable text + intelligent understanding)
- ✅ **Bespoke extraction scripts** per table (adapts to formats)
- ✅ **AI validation loop** (iterative correction until perfect)
- ✅ **Complete end-to-end** (PDF → CSV → EarthBank → Database)
- ✅ **Kohn 2024 compliance checking** (field-level validation)
- ✅ **FAIR score calculation** (quantifies completeness)
- ✅ **TypeScript import scripts** (Schema v2 integration)
- ✅ **SQL metadata generation** (automatic database population)

### Key Innovations:
1. **Page-level extraction** - Isolates tables from noise
2. **AI structure analysis** - Understands headers/delimiters without hardcoding
3. **Generated extraction scripts** - Creates custom Python parsers per table
4. **Validation with retry** - AI reviews CSV, fixes errors iteratively
5. **Database integration** - Complete import to Schema v2 tables
6. **Automatic SQL generation** - No manual placeholder replacement

## Notes

- **Status:** ✅ Production ready (replaces backup-2025-11-16.md approach)
- **Integration:** Requires `/thermoanalysis` to run first (creates paper-index.md with table locations)
- **Database Schema:** Uses Schema v2 tables (ft_datapoints, ft_count_data, ft_track_length_data, he_whole_grain_data)
- **Error Handling:** Maximum 3 retry attempts per table before flagging for manual review
- **FAIR Compliance:** Validates against Kohn et al. (2024) standards (Tables 4-10)

## Related Files

**Uses:**
- `.claude/commands/thermoextract.md` - This command file (1247 lines)
- `scripts/extract_pdf_pages.py` - PDF page isolation
- `lib/db/connection.ts` - Database pool connection

**Reads:**
- `paper-index.md` - Table locations (from `/thermoanalysis`)
- `text/table-pages.json` - Exact page numbers (from `/thermoanalysis`)
- `.env.local` - Database connection (`DIRECT_URL`)
- `build-data/learning/archive/01-Kohn-2024-Reporting-Standards.md` - Field requirements
- `build-data/learning/archive/earthbanktemplates/*.xlsx` - EarthBank templates

**Creates:**
- `extracted/table-X-page-Y.pdf` - Isolated PDF pages
- `extracted/table-X-raw-text.txt` - pdfplumber text output
- `extracted/extract_table_X.py` - Bespoke extraction scripts
- `extracted/table-X-extracted.csv` - Validated CSVs
- `FAIR/earthbank_*.csv` - EarthBank-compatible CSVs
- `extraction-report.md` - FAIR score breakdown
- `update-database-metadata.sql` - Dataset metadata SQL
- `populate-data-files.sql` - File tracking SQL

**Feeds:**
- Database tables: `samples`, `ft_datapoints`, `ft_count_data`, `ft_track_length_data`, `he_whole_grain_data`
- Database tables (via SQL): `datasets`, `fair_score_breakdown`, `data_files`

**Documentation:**
- `readme/database/tables/samples.md` - Schema v2 sample metadata
- `readme/database/tables/ft_datapoints.md` - FT analytical sessions
- `readme/database/tables/ft_count_data.md` - Grain-level counts
- `readme/database/tables/ft_track_length_data.md` - Track measurements
- `readme/database/tables/he_whole_grain_data.md` - (U-Th)/He data

---

**Created:** 2025-11-18
**Last Updated:** 2025-11-18
