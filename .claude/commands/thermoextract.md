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
| **Priority** | HIGH/MEDIUM/LOW | PRIMARY, HIGH, LOW |

**Example from McMillan et al. (2024):**
```
Table 1: Page 9 - AFT results summary (35 samples) - ✅ PRIMARY
Table 2: Pages 10-11 - (U-Th-Sm)/He results (spans 2 pages) - ✅ HIGH
Table A3: Page 36 - Durango reference material - ✅ LOW
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

## Step 4: Calculate FAIR Score

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

## Step 5: Transform to EarthBank Templates

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

## Step 6: Identify Missing Critical Information

**Task:** Generate actionable report of missing metadata

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

## Step 7: Generate Extraction Report

**Task:** Document extraction quality and next steps

**Report template:**

```markdown
# Extraction Report: [PAPER NAME]

**Extracted:** [DATE]
**FAIR Score:** [XX]/100 ([GRADE])

---

## Summary

**Tables extracted:** X
**Samples:** XX valid samples
**Age range:** X.X - XX.X Ma
**Mineral:** [apatite/zircon]
**Method:** [EDM/LA-ICP-MS]

---

## Data Completeness

### Critical Fields (XX/50 points)
✅ Count data complete (Ns, ρs, Dpar)
✅ Ages calculated (central age, dispersion)
⚠️  Missing zeta calibration factor
❌ No IGSN assigned

### Recommended Fields (XX/30 points)
✅ Track length data present
⚠️  Kinetic parameters partial (Dpar only, no Cl)
❌ No secondary standards reported

### Quality Indicators (XX/20 points)
✅ Grain-level data included
✅ Complete methods description
⚠️  Uncertainty propagation partial
❌ No reference materials QC

---

## FAIR Assessment

**Findable (X/25):**
- ❌ No IGSN (sample not globally findable)
- ✅ Lat/lon coordinates provided
- ⚠️  Incomplete location metadata

**Accessible (X/25):**
- ✅ Data extracted to open format (CSV)
- ✅ All tables accessible
- ⚠️  Some fields require paper text extraction

**Interoperable (X/25):**
- ✅ EarthBank template format
- ✅ Standard field names
- ⚠️  Some units need conversion

**Reusable (X/25):**
- ⚠️  Missing calibration parameters (zeta)
- ⚠️  Partial provenance (no analyst ORCID)
- ✅ Statistical parameters complete

---

## File Structure

```
[PAPER_NAME]/
├── paper-index.md              (from /thermoanalysis)
├── paper-analysis.md           (from /thermoanalysis)
├── RAW/
│   ├── table-1-raw.csv         (XX rows × YY cols)
│   ├── table-a2-raw.csv        (XX rows × YY cols)
│   └── table-a3-raw.csv        (XX rows × YY cols)
├── FAIR/
│   ├── earthbank_samples.csv           (XX samples)
│   ├── earthbank_ft_datapoints.csv     (XX datapoints)
│   ├── earthbank_ft_count_data.csv     (XX grains)
│   └── earthbank_ft_length_data.csv    (XX tracks)
├── [PDF_NAME].pdf
└── extraction-report.md         (this file)
```

---

## Next Steps

### 1. Complete Critical Metadata
- [ ] Assign IGSN to all samples
- [ ] Extract zeta calibration factor from paper
- [ ] Identify analyst and laboratory
- [ ] Populate collection metadata

### 2. Import to Database
```bash
# Option A: Import EarthBank templates
python scripts/db/import-earthbank-templates.py FAIR/

# Option B: Import via SQL
psql "$DATABASE_URL" -f FAIR/import.sql
```

### 3. Deploy to Production
```bash
# Copy dataset to public directory
cp -r [PAPER_NAME] public/data/datasets/

# Update database metadata
psql "$DATABASE_URL" -c "UPDATE datasets SET fair_score = [XX], ..."
```

### 4. Upload to EarthBank
- Complete missing critical fields
- Upload templates to https://earthbank.auscope.org.au/
- Mint DOI for dataset citation

---

## Missing Information Summary

**ACTION REQUIRED before database import:**
1. Extract zeta calibration from methods section
2. Register samples for IGSN assignment
3. Extract analyst/lab information from acknowledgments

**RECOMMENDED for FAIR compliance:**
1. Find QC data for secondary standards
2. Get complete etching conditions
3. Obtain collection dates from authors

**OPTIONAL for enhanced quality:**
1. Measure Cl content for kinetic parameters
2. Get stratigraphic ages if available
3. Link to related datasets (same study area)

---

**Extraction completed successfully.**
**Ready for manual metadata completion and database import.**
```

---

## Usage

**Command:**
```
/thermoextract path/to/paper.pdf
```

**Requirements:**
1. Paper must have been analyzed with `/thermoanalysis` first
2. PDF must be readable (not corrupted)
3. Tables must be on pages identified in paper-index.md

**Expected time:** 5-10 minutes per paper (depending on number of tables)

**Output location:** `build-data/learning/thermo-papers/[PAPER_NAME]/`

---

## Success Criteria

✅ **Extraction successful if:**
- All tables identified by `/thermoanalysis` extracted to RAW CSVs
- FAIR score calculated (any score acceptable, documents quality)
- EarthBank templates generated (even with missing fields)
- Extraction report documents what's missing

❌ **Extraction failed if:**
- Cannot read PDF pages
- Tables not where paper-index.md says they are
- Claude cannot interpret table structure
- No samples match expected pattern

---

## Advantages Over Old Approach

**Old approach (broken):**
- 1455 lines of inline Python code
- Complex multi-method extraction scripts
- Manual row filtering needed
- 13 separate steps

**New approach (this):**
- ~200 lines of clear instructions
- AI-powered direct PDF reading
- Automatic validation against standards
- 7 logical steps

**Key improvements:**
1. ✅ Leverages Claude AI vision (no extraction scripts)
2. ✅ Validates against Kohn 2024 standards
3. ✅ Calculates FAIR score automatically
4. ✅ Maps directly to EarthBank templates
5. ✅ Integrates with `/thermoanalysis` output
6. ✅ Generates actionable missing field report

---

**Ready to extract!** Run `/thermoextract path/to/paper.pdf` to start.
