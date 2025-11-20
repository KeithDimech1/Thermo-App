# /thermoextract - AI-Powered Thermochronology Data Extraction

**Purpose:** Extract thermochronology data from research papers using pdfplumber + AI analysis, validate against Kohn et al. (2024) standards, and import to database.

**Key Innovation:** Iterative AI-guided extraction with pdfplumber for reliable text extraction + AI structure understanding + validation loop

---

## ✅ SCHEMA: EarthBank camelCase (IDEA-014 Complete)

**Database Schema:** EarthBank-native camelCase schema
- **Tables:** `earthbank_samples`, `earthbank_ftDatapoints`, `earthbank_heDatapoints`, etc.
- **Fields:** camelCase naming (e.g., `sampleID`, `centralAgeMa`, `pooledAgeMa`)
- **Primary Keys:** UUID with `uuid_generate_v4()`
- **Foreign Keys:** String-based (e.g., `sampleID`, `datapointName`)

**Extraction Output:** This command should now output camelCase CSVs matching EarthBank schema
- Old: `sample_id`, `central_age_ma`, `pooled_age_ma`
- New: `sampleID`, `centralAgeMa`, `pooledAgeMa`

**Migration Status:** Phase 6 complete (2025-11-18)
**See:** `build-data/ideas/debug/IDEA-014-INDEX.md` for migration details

---

## Workflow Overview

```
0.2. Resolve DOIs → Convert DOIs to download URLs (optional)
0.3. Download supplementary files → Auto-download with retry (OSF, Zenodo, etc.) (optional)
0.4. Validate downloads → Check file integrity and contents (optional)
1. Read paper-index.md → Get table locations, page numbers, supplementary URLs (from /thermoanalysis)
2. AI structure analysis → Understand headers & data patterns
3. Create extraction plan → Bespoke CSV generation strategy
4. Extract to CSV → Multi-format approach (text + table-index.json + screenshots)
   → Read from text/plain-text.txt using line numbers
   → Cross-validate with images/tables/*.png screenshots
   → AI-guided extraction for complex/multi-page tables
5. Validate extraction → Check column count, empty columns, data ranges
5.1. AI Image Extraction (fallback) → Direct extraction from screenshots if validation fails
6. Retry loop → Delete & retry until perfect (MAX 3 attempts per table)

→ Quality & Import Phase moved to new command /thermovalidate:
   - Compare to Kohn 2024 standards
   - Calculate FAIR score
   - Transform to EarthBank camelCase schema
   - Import to database
   - Generate SQL metadata
```

**Major Changes:**
- ✅ **Removed Steps 0.1, 0.5, 2, 3** - Preprocessing done by /thermoanalysis
- ✅ **Updated Step 1** - Loads supplementary URLs from paper-index.md
- ✅ **Updated Step 6** - Multi-format extraction using table-index.json
- ✅ **Added Step 7.1** - AI image extraction fallback
- ✅ **Removed Steps 9-14** - Quality & Import Phase moved to new command

---

## 🚨 CRITICAL EXTRACTION RULES

**BEFORE starting extraction, understand these NON-NEGOTIABLE requirements:**

### 1. Extract ALL Tables (No Exceptions)

**Rule:** EVERY table marked "extractable: YES" in paper-index.md MUST be extracted

- ❌ **WRONG:** "Extract Table 1 and Table 2, skip Table A1/A2/A3 for later"
- ✅ **CORRECT:** "Extract ALL tables (Table 1, 2, A1, A2, A3) before marking extraction complete"

**Why:** 50-70% of data is in "supplementary" appendix tables (A1, A2, A3) - skipping these loses:
- Grain-by-grain ages (Table A1)
- Individual track length measurements (Table A2)
- Reference material QC data (Table A3)

**Priority** determines extraction ORDER (HIGH first, MEDIUM second), NOT whether to extract

### 2. Extract ALL Columns (No Partial Extraction)

**Rule:** EVERY column in the source table MUST appear in the extracted CSV

- ❌ **WRONG:** Extract 12/24 columns and mark table "complete"
- ✅ **CORRECT:** Extract ≥90% of columns, validate with Step 7.1, retry if <90%

**Why:** Missing columns = lost data. Examples of commonly missed columns:
- rmr0D (kinetic parameter)
- Cl wt% (chlorine content)
- eCl apfu (effective chlorine)
- Analyst names, dates, batch IDs

**Validation enforces this:** Step 7.1 fails extraction if column count <90% of source

### 3. Validate Before Proceeding (Mandatory)

**Rule:** NO table is "complete" until ALL validation checks pass (Steps 7.1-7.4)

- ❌ **WRONG:** Extract CSV → move to next table
- ✅ **CORRECT:** Extract CSV → validate (column count, empty cols, ranges) → retry if fails → THEN next table

**Why:** Without validation:
- Empty columns go undetected (parsing failures)
- Values in wrong columns (age data in U column, etc.)
- Missing rows/samples

**Auto-retry:** If validation fails, Step 8 automatically retries up to 3 times

### 4. Download Supplementary Data First (Steps 0.1-0.4)

**Rule:** ALWAYS attempt to download supplementary data from DOIs/URLs before PDF extraction

- ❌ **WRONG:** See no `supplementary/` directory → proceed with PDF extraction
- ✅ **CORRECT:** Parse paper for DOIs → download files → validate → use if available → fall back to PDF

**Why:** 30-40% of papers host complete datasets externally (OSF, Zenodo, etc.)
- Supplementary Excel files are cleaner than PDF tables
- Grain-level data often ONLY in supplementary files
- Saves 30-60 minutes of PDF extraction time

**New workflow:** Steps 0.1-0.4 detect and download automatically (no manual intervention)

---


## Step 0.2: Resolve DOIs to Download URLs

**Task:** For each DOI found, resolve to actual download URLs and identify file types

**Why this is critical:**
- DOIs are **persistent identifiers** but don't directly link to files
- Need to resolve through doi.org → actual repository → download links
- Different repositories have different URL structures (Zenodo vs OSF vs Figshare)

**Process:**

```python
import requests
from bs4 import BeautifulSoup
import time

print()
print('━' * 80)
print('STEP 0.2: RESOLVING DOIs TO DOWNLOAD URLs')
print('━' * 80)
print()

download_links = []

# Process DOIs
for doi in supplementary_sources['dois']:
    print(f'🔗 Resolving DOI: {doi}')

    try:
        # Follow DOI redirect
        response = requests.get(doi, allow_redirects=True, timeout=10)
        final_url = response.url

        print(f'   → Resolved to: {final_url}')

        # Parse HTML to find download links
        soup = BeautifulSoup(response.content, 'html.parser')

        # Look for common download link patterns
        for link in soup.find_all('a', href=True):
            href = link['href']

            # Check if it's a data file
            if any(ext in href.lower() for ext in ['.xlsx', '.xls', '.csv', '.zip', '.tar', '.gz']):
                # Make absolute URL if relative
                if href.startswith('/'):
                    from urllib.parse import urlparse
                    parsed = urlparse(final_url)
                    full_url = f'{parsed.scheme}://{parsed.netloc}{href}'
                elif not href.startswith('http'):
                    full_url = f'{final_url.rstrip("/")}/{href}'
                else:
                    full_url = href

                if full_url not in download_links:
                    download_links.append(full_url)
                    print(f'   ✅ Found file: {Path(full_url).name}')

    except Exception as e:
        print(f'   ❌ Error resolving DOI: {e}')
        continue

    time.sleep(0.5)  # Rate limiting
    print()

# Add direct URLs
for url in supplementary_sources['urls']:
    if url not in download_links:
        download_links.append(url)
        print(f'✅ Direct URL added: {url}')

print()
print(f'📦 Total download links identified: {len(download_links)}')
print()

print('━' * 80)
print()
```

**Output:**
- `download_links` list containing all file URLs to download
- Prints resolved URLs and detected file types

---

## Step 0.3: Download Supplementary Files with Retry

**Task:** Download all identified files to `supplementary/` directory with error handling and retry logic

**Process:**

```python
from pathlib import Path
import requests
import time

print()
print('━' * 80)
print('STEP 0.3: DOWNLOADING SUPPLEMENTARY FILES')
print('━' * 80)
print()

# Create supplementary directory
paper_dir = Path('build-data/learning/thermo-papers/PAPER_NAME')
supplementary_dir = paper_dir / 'supplementary'
supplementary_dir.mkdir(exist_ok=True)

downloaded_files = []
max_retries = 3

for url in download_links:
    filename = Path(url).name

    # Sanitize filename
    filename = filename.split('?')[0]  # Remove query params
    if not filename:
        filename = f'supplementary_file_{len(downloaded_files)+1}.dat'

    output_path = supplementary_dir / filename

    print(f'📥 Downloading: {filename}')
    print(f'   From: {url}')

    # Retry loop
    for attempt in range(max_retries):
        try:
            response = requests.get(url, timeout=60, stream=True)
            response.raise_for_status()

            # Download with progress
            total_size = int(response.headers.get('content-length', 0))

            with open(output_path, 'wb') as f:
                if total_size == 0:
                    f.write(response.content)
                else:
                    downloaded = 0
                    for chunk in response.iter_content(chunk_size=8192):
                        f.write(chunk)
                        downloaded += len(chunk)
                        progress = (downloaded / total_size) * 100
                        print(f'   Progress: {progress:.1f}%', end='\r')

            file_size = output_path.stat().st_size
            print(f'   ✅ Downloaded: {file_size / 1024 / 1024:.2f} MB')

            downloaded_files.append({
                'path': output_path,
                'size': file_size,
                'url': url
            })

            break  # Success, exit retry loop

        except Exception as e:
            if attempt < max_retries - 1:
                wait_time = 2 ** attempt  # Exponential backoff
                print(f'   ⚠️ Attempt {attempt + 1} failed: {e}')
                print(f'   Retrying in {wait_time} seconds...')
                time.sleep(wait_time)
            else:
                print(f'   ❌ Failed after {max_retries} attempts: {e}')

    print()

# Create download log
log_path = supplementary_dir / 'README.md'
with open(log_path, 'w') as f:
    f.write('# Supplementary Data Downloads\n\n')
    f.write(f'**Downloaded:** {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}\n')
    f.write(f'**Source:** Automated download via /thermoextract\n\n')
    f.write('## Files\n\n')

    for file in downloaded_files:
        f.write(f'- **{file["path"].name}** ({file["size"] / 1024 / 1024:.2f} MB)\n')
        f.write(f'  - Source: {file["url"]}\n')

    if download_links and not downloaded_files:
        f.write('\n⚠️ No files successfully downloaded\n')

print(f'✅ Downloaded {len(downloaded_files)}/{len(download_links)} files to supplementary/')
print(f'📝 Download log created: {log_path}')
print()

print('━' * 80)
print()
```

**Output:**
- Files downloaded to `supplementary/` directory
- `README.md` log file documenting what was downloaded
- `downloaded_files` list for validation

---

## Step 0.4: Validate Downloaded Files

**Task:** Verify file integrity and inspect contents before using

**Process:**

```python
import pandas as pd
from pathlib import Path

print()
print('━' * 80)
print('STEP 0.4: VALIDATING DOWNLOADED FILES')
print('━' * 80)
print()

valid_data_files = []

for file_info in downloaded_files:
    file_path = file_info['path']
    file_size = file_info['size']

    print(f'🔍 Validating: {file_path.name}')

    # Check file size
    if file_size == 0:
        print(f'   ❌ File is empty (0 bytes)')
        continue

    if file_size < 100:
        print(f'   ⚠️ File very small ({file_size} bytes) - may be error page')
        continue

    # Try to read based on file type
    try:
        if file_path.suffix in ['.xlsx', '.xls']:
            xl = pd.ExcelFile(file_path)
            sheets = xl.sheet_names

            print(f'   ✅ Valid Excel file')
            print(f'   Sheets ({len(sheets)}): {", ".join(sheets[:5])}{"..." if len(sheets) > 5 else ""}')

            valid_data_files.append({
                'path': file_path,
                'type': 'excel',
                'sheets': sheets
            })

        elif file_path.suffix == '.csv':
            df = pd.read_csv(file_path, nrows=1)
            columns = df.columns.tolist()

            print(f'   ✅ Valid CSV file')
            print(f'   Columns ({len(columns)}): {", ".join(columns[:5])}{"..." if len(columns) > 5 else ""}')

            valid_data_files.append({
                'path': file_path,
                'type': 'csv',
                'columns': columns
            })

        else:
            print(f'   ℹ️  Unknown file type: {file_path.suffix}')

    except Exception as e:
        print(f'   ❌ Validation failed: {e}')

    print()

print(f'✅ {len(valid_data_files)}/{len(downloaded_files)} files validated successfully')

if valid_data_files:
    print(f'📊 Valid data files ready for extraction')
else:
    print(f'⚠️  No valid data files found - proceeding with PDF extraction')

print()
print('━' * 80)
print()
```

**Output:**
- `valid_data_files` list with file type and structure info
- Validation report showing which files can be used

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

**CRITICAL:** Extract ALL tables marked as "extractable: YES" in paper-index.md - NO tables are optional!

**Priority determines extraction ORDER, not whether to extract:**
- **HIGH priority:** Extract first (AFT ages, count data, track lengths, AHe data)
- **MEDIUM priority:** Extract after HIGH (reference materials, supplementary data)
- **ALL priorities:** MUST be extracted before marking extraction "complete"

### Load Supplementary Data URLs from paper-index.md

**Extract from "File Information" section:**

```python
import re
from pathlib import Path

paper_dir = Path('build-data/learning/papers/PAPER_NAME')
paper_index = paper_dir / 'paper-index.md'

print('━' * 80)
print('LOADING PAPER METADATA & SUPPLEMENTARY URLs')
print('━' * 80)
print()

# Read paper-index.md
with open(paper_index, 'r') as f:
    index_content = f.read()

# Extract supplementary files URL
supp_url_match = re.search(r'\*\*Supplementary Files URL:\*\*\s*(\S+)', index_content)
supplementary_url = None

if supp_url_match:
    url = supp_url_match.group(1)
    if url != "None":
        supplementary_url = url
        print(f'✅ Found supplementary data URL: {supplementary_url}')
        print('   (Detected by /thermoanalysis)')
    else:
        print('ℹ️  No supplementary data URL in paper')
else:
    print('ℹ️  No supplementary data URL field in paper-index.md')

print()
```

**Note:** Supplementary URLs are automatically detected by `/thermoanalysis` (Step 8) and saved in paper-index.md. If a URL is found, you may want to download the files using Steps 0.2-0.4 before proceeding with PDF extraction.

### Additional Resources from `/thermoanalysis` - NEW

When reading `paper-index.md`, also note these additional files created by `/thermoanalysis`:

**1. Visual Table Reference:**
- **File:** `tables.md`
- **Contains:** Visual screenshots of all tables with page numbers
- **Use:** Quick visual verification of table structure before extraction
- **Location:** `build-data/learning/thermo-papers/PAPER_NAME/tables.md`

**2. Table Screenshots:**
- **Directory:** `images/tables/`
- **Contains:** High-resolution PNG screenshots (2x zoom) of each table
- **Format:** `table_1_page_9.png`, `table_2_page_10.png`, etc.
- **Use:** OCR fallback if pdfplumber fails (see Step 3.5)
- **Location:** `build-data/learning/thermo-papers/PAPER_NAME/images/tables/`

**3. Image Analysis:**
- **File:** `images/image-metadata.json`
- **Contains:** Extracted figures with captions and relevance ratings
- **Use:** Future feature - extract data from figures (radial plots, histograms)
- **Location:** `build-data/learning/thermo-papers/PAPER_NAME/images/image-metadata.json`

**4. Supplementary Data:**
- **Directory:** `supplemental/`
- **Contains:** Downloaded Excel/CSV files from OSF/Zenodo (if available)
- **Use:** Primary data source (checked in Step 0.5)
- **Location:** `build-data/learning/thermo-papers/PAPER_NAME/supplemental/`

**Quick Pre-Flight Check:**
```python
from pathlib import Path

paper_dir = Path('build-data/learning/thermo-papers/PAPER_NAME')

print('📋 Available Resources from /thermoanalysis:')
print()

if (paper_dir / 'paper-index.md').exists():
    print('✅ paper-index.md (table locations & metadata)')
else:
    print('❌ paper-index.md MISSING - run /thermoanalysis first!')

if (paper_dir / 'tables.md').exists():
    print('✅ tables.md (visual table reference)')
else:
    print('⚠️  tables.md not found (optional - for visual verification)')

if (paper_dir / 'images' / 'tables').exists():
    table_screenshots = list((paper_dir / 'images' / 'tables').glob('*.png'))
    print(f'✅ {len(table_screenshots)} table screenshot(s) (OCR fallback)')
else:
    print('⚠️  images/tables/ not found (optional - for OCR fallback)')

if (paper_dir / 'supplemental').exists():
    data_files = list((paper_dir / 'supplemental').glob('*.xlsx')) + \
                 list((paper_dir / 'supplemental').glob('*.csv'))
    print(f'✅ {len(data_files)} supplemental data file(s) (PRIORITY - use these!)')
else:
    print('ℹ️  No supplementary data (will extract from PDF)')

print()
```

**Workflow Decision Tree:**
```
Is supplemental/ directory present?
├─ YES → Use Step 0.5 (supplementary import) → SKIP PDF extraction
└─ NO  → Continue with PDF extraction
        ├─ Does pdfplumber work?
        │  ├─ YES → Use pdfplumber text (Step 3)
        │  └─ NO  → Use OCR fallback with table screenshots (Step 3.5)
        └─ Validate with tables.md visual reference (Step 7.5)
```

---
## Step 2: AI Structure Analysis

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

## Step 3: Create Extraction Plan

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

## Step 4: Extract to CSV (Multi-Format Approach)

**Task:** Extract table data using coordinated multi-format approach - text extraction + visual validation

**Key Innovation:** Use table-index.json to coordinate extraction from multiple sources for maximum accuracy

**Prerequisites (created by /thermoanalysis):**
- `tables.md` - Visual reference with table descriptions
- `table-index.json` - Links text ranges, PDF pages, and screenshots
- `text/plain-text.txt` - Full paper text with line numbers
- `images/tables/*.png` - High-resolution table screenshots

**Process:**

### 6.1: Load Table Index

```python
import json
from pathlib import Path

paper_dir = Path('build-data/learning/papers/PAPER_NAME')
table_index_file = paper_dir / 'table-index.json'

print('━' * 80)
print('STEP 6.1: LOADING TABLE INDEX')
print('━' * 80)
print()

# Load table index created by /thermoanalysis
with open(table_index_file, 'r') as f:
    table_index = json.load(f)

print(f'✅ Loaded table index with {len(table_index["tables"])} tables')
print()

# Show available formats for each table
for table_info in table_index['tables']:
    table_name = table_info['table_name']
    print(f'📊 {table_name}:')
    print(f'   - Text: Lines {table_info["text_location"]["start_line"]}-{table_info["text_location"]["end_line"]}')
    print(f'   - PDF: Page(s) {table_info["pdf_location"]["pages"]}')
    print(f'   - Images: {len(table_info["screenshots"])} screenshot(s)')
    print()
```

### 6.2: Extract from Text (Primary Method)

```python
print('━' * 80)
print(f'STEP 6.2: EXTRACTING TABLE FROM TEXT')
print('━' * 80)
print()

# Select table to extract
table_name = 'Table 1'  # From paper-index.md extraction list
table_info = next(t for t in table_index['tables'] if t['table_name'] == table_name)

# Read text file
text_file = paper_dir / 'text' / 'plain-text.txt'
with open(text_file, 'r') as f:
    all_lines = f.readlines()

# Extract table text using line numbers
start_line = table_info['text_location']['start_line']
end_line = table_info['text_location']['end_line']
table_text = ''.join(all_lines[start_line-1:end_line])

print(f'✅ Extracted {table_name} from text:')
print(f'   Lines: {start_line}-{end_line} ({end_line - start_line + 1} lines)')
print(f'   Pages: {table_info["pdf_location"]["pages"]}')
print()

# Use AI to parse table structure
print('🤖 Using AI to analyze table structure...')
print()
# [AI analysis of table_text to identify:]
# - Column headers
# - Data rows
# - Multi-page continuation (if table spans pages)
# - Column alignment/separators
# - Data types per column
```

### 6.3: Cross-Validate with Table Screenshots

```python
print('━' * 80)
print(f'STEP 6.3: CROSS-VALIDATING WITH SCREENSHOTS')
print('━' * 80)
print()

# Load table screenshots
screenshots = table_info['screenshots']
print(f'📸 Found {len(screenshots)} screenshot(s):')
for screenshot in screenshots:
    print(f'   - {screenshot["filename"]} (Page {screenshot["page"]})')
print()

# Use AI to verify structure
print('🤖 Using AI to verify extraction against visual screenshots...')
print()
# [AI compares text extraction with screenshot images to:]
# - Verify column count matches
# - Check for missing rows
# - Validate data alignment
# - Detect parsing errors (merged columns, split rows, etc.)
```

### 6.4: Generate CSV

```python
print('━' * 80)
print(f'STEP 6.4: GENERATING CSV')
print('━' * 80)
print()

import pandas as pd

# [AI converts parsed table structure to pandas DataFrame]
# - Clean headers (no special characters)
# - One row per sample/grain/datapoint
# - Numeric columns as pure numbers (no ± symbols)
# - Uncertainty in separate columns
# - Missing data as empty cells (not "—" or "n.d.")

# Save CSV
output_dir = paper_dir / 'extracted'
output_dir.mkdir(exist_ok=True)
csv_file = output_dir / f'{table_name.lower().replace(" ", "_")}_extracted.csv'

df.to_csv(csv_file, index=False)

print(f'✅ Created CSV: {csv_file.name}')
print(f'   Rows: {len(df)}')
print(f'   Columns: {len(df.columns)}')
print(f'   Column names: {", ".join(df.columns.tolist())}')
print()
```

**Output:** Clean CSV file(s) in `extracted/`
- `table_1_extracted.csv`
- `table_2_extracted.csv`
- etc.

**CSV Requirements:**
- Headers must be clean (no special characters)
- One row per sample/grain/datapoint
- Numeric columns must be pure numbers (no ± symbols)
- Uncertainty in separate column from value
- Missing data as empty cells (not "—" or "n.d.")
- Sample IDs validated against expected pattern
- Multi-page tables combined into single CSV

**Key Benefits of Multi-Format Approach:**
- ✅ **Text extraction** provides base structure (fast, machine-readable)
- ✅ **Screenshot validation** catches parsing errors (visual verification)
- ✅ **AI coordination** handles complex layouts (multi-page, merged cells, footnotes)
- ✅ **table-index.json** ensures consistency across all formats

---

## Step 5: Comprehensive Validation (MANDATORY)

**Task:** Validate extracted CSV against raw table data with automated checks - NO extraction is complete without passing validation

**Why this is CRITICAL:**
- **50-70% of extractions** have partial data loss without validation
- **Empty columns** indicate parsing failures
- **Missing columns** mean important data was lost
- **Wrong data ranges** catch values in incorrect columns

**Validation Checks (ALL must pass):**

### 7.1: Column Count Validation

```python
import pandas as pd
import re
from pathlib import Path

print()
print('━' * 80)
print('STEP 7.1: COLUMN COUNT VALIDATION')
print('━' * 80)
print()

# Load extracted CSV
csv_file = Path('extracted/table-1-extracted.csv')
df = pd.read_csv(csv_file)

# Count columns in raw table header
raw_text_file = Path('extracted/table-1-page-9-raw-text.txt')
with open(raw_text_file, 'r') as f:
    lines = f.readlines()

# Find header line (contains "Sample" and column names)
header_line = None
for line in lines[:20]:  # Check first 20 lines
    if 'Sample' in line and 'No.' in line:
        header_line = line
        break

if header_line:
    # Count distinct column names in header
    # Split by 2+ spaces to separate columns
    header_parts = re.split(r'\s{2,}', header_line.strip())
    expected_columns = len([p for p in header_parts if p and p != 'SampleNo.'])

    print(f'📊 Raw table columns: ~{expected_columns}')
    print(f'📊 Extracted CSV columns: {len(df.columns)}')
    print()

    # Calculate completeness
    completeness = (len(df.columns) / max(expected_columns, 1)) * 100

    if completeness < 90:
        print(f'❌ VALIDATION FAILED: Column count mismatch')
        print(f'   Expected: ≥{expected_columns * 0.9:.0f} columns (90% of {expected_columns})')
        print(f'   Found: {len(df.columns)} columns')
        print(f'   Completeness: {completeness:.1f}%')
        print()
        print('   Missing columns may include critical data!')
        validation_passed = False
    else:
        print(f'✅ Column count OK ({completeness:.1f}% complete)')
        validation_passed = True

else:
    print('⚠️ Could not detect expected column count from raw text')
    validation_passed = True  # Skip this check if header not found

print()
print('━' * 80)
print()
```

### 7.2: Empty Column Detection

```python
print()
print('━' * 80)
print('STEP 7.2: EMPTY COLUMN DETECTION')
print('━' * 80)
print()

# Find columns that are completely empty
empty_cols = []
for col in df.columns:
    if df[col].isna().all() or (df[col].astype(str).str.strip() == '').all():
        empty_cols.append(col)

print(f'📊 Total columns: {len(df.columns)}')
print(f'📊 Empty columns: {len(empty_cols)}')
print()

if empty_cols:
    print('❌ VALIDATION WARNING: Empty columns detected')
    print()
    for col in empty_cols[:10]:  # Show first 10
        print(f'   - {col}')
    if len(empty_cols) > 10:
        print(f'   ... and {len(empty_cols) - 10} more')
    print()

    # Fail if >10% of columns are empty (excludes truly optional fields)
    empty_pct = (len(empty_cols) / len(df.columns)) * 100

    if empty_pct > 10:
        print(f'❌ VALIDATION FAILED: {empty_pct:.1f}% of columns are empty')
        print('   This indicates a parsing failure!')
        validation_passed = False
    else:
        print(f'⚠️ WARNING: {len(empty_cols)} empty column(s) (may be optional fields)')
else:
    print('✅ No empty columns detected')

print()
print('━' * 80)
print()
```

### 7.3: Data Range Validation

```python
print()
print('━' * 80)
print('STEP 7.3: DATA RANGE VALIDATION')
print('━' * 80)
print()

# Define expected ranges for thermochronology data
expected_ranges = {
    'centralAgeMa': (0, 500),       # Central ages: 0-500 Ma
    'pooledAgeMa': (0, 500),         # Pooled ages: 0-500 Ma
    'meanTrackLengthUm': (5, 20),    # Track lengths: 5-20 μm
    'stdDevTrackLength': (0, 5),     # Std dev: 0-5 μm
    'dPar': (0, 5),                  # Dpar: 0-5 μm
    'numGrains': (1, 200),           # Grain count: 1-200
    'uPpm': (0, 500),                # Uranium: 0-500 ppm
    'thPpm': (0, 500),               # Thorium: 0-500 ppm
}

range_violations = []

for col, (min_val, max_val) in expected_ranges.items():
    if col in df.columns:
        # Convert to numeric
        col_numeric = pd.to_numeric(df[col], errors='coerce')

        # Check range
        out_of_range = col_numeric[(col_numeric < min_val) | (col_numeric > max_val)]

        if len(out_of_range) > 0:
            range_violations.append({
                'column': col,
                'expected': f'{min_val}-{max_val}',
                'violations': len(out_of_range),
                'examples': out_of_range.head(3).tolist()
            })

            print(f'⚠️ {col}: {len(out_of_range)} value(s) outside expected range')
            print(f'   Expected: {min_val}-{max_val}')
            print(f'   Found: {out_of_range.head(3).tolist()}')
            print()

if not range_violations:
    print('✅ All values within expected ranges')
else:
    print(f'⚠️ Found {len(range_violations)} column(s) with out-of-range values')
    print('   This may indicate values in wrong columns!')

    # Fail if >50% of values in a critical column are out of range
    for violation in range_violations:
        if violation['column'] in ['centralAgeMa', 'pooledAgeMa', 'meanTrackLengthUm']:
            violation_pct = (violation['violations'] / len(df)) * 100
            if violation_pct > 50:
                print(f'❌ VALIDATION FAILED: {violation["column"]} has {violation_pct:.1f}% invalid values')
                validation_passed = False

print()
print('━' * 80)
print()
```

### 7.4: Sample ID Validation

```python
print()
print('━' * 80)
print('STEP 7.4: SAMPLE ID VALIDATION')
print('━' * 80)
print()

# Expected pattern from paper-index.md (e.g., MU19-XX, MU20-XX)
sample_id_pattern = r'^MU\d{2}-\d{2}$'

if 'sampleID' in df.columns:
    valid_ids = df['sampleID'].str.match(sample_id_pattern, na=False)
    invalid_count = (~valid_ids).sum()

    print(f'📊 Total samples: {len(df)}')
    print(f'📊 Valid sample IDs: {valid_ids.sum()}')
    print(f'📊 Invalid sample IDs: {invalid_count}')
    print()

    if invalid_count > 0:
        print(f'⚠️ Invalid sample IDs detected:')
        for invalid_id in df[~valid_ids]['sampleID'].head(5):
            print(f'   - {invalid_id}')
        print()

        if invalid_count > len(df) * 0.1:  # >10% invalid
            print(f'❌ VALIDATION FAILED: {invalid_count} invalid sample IDs ({invalid_count / len(df) * 100:.1f}%)')
            validation_passed = False
    else:
        print('✅ All sample IDs match expected pattern')
else:
    print('⚠️ No sampleID column found')

print()
print('━' * 80)
print()
```

### 7.5: Final Validation Summary

```python
print()
print('━' * 80)
print('VALIDATION SUMMARY')
print('━' * 80)
print()

if validation_passed:
    print('✅ ALL VALIDATION CHECKS PASSED')
    print()
    print(f'✓ Column count: {len(df.columns)} columns')
    print(f'✓ Empty columns: {len(empty_cols)} ({len(empty_cols) / len(df.columns) * 100:.1f}%)')
    print(f'✓ Data ranges: All values within expected limits')
    print(f'✓ Sample IDs: All valid')
    print()
    print('→ Proceeding to next step')
else:
    print('❌ VALIDATION FAILED')
    print()
    print('Critical issues detected:')
    print('   - Column count mismatch OR')
    print('   - Too many empty columns OR')
    print('   - Values in wrong columns OR')
    print('   - Invalid sample IDs')
    print()
    print('→ Triggering retry loop (Step 8)')

print()
print('━' * 80)
print()
```

**Output:**
- `validation_passed` boolean (True/False)
- Detailed report of ALL validation checks
- Specific failures listed with recommended fixes
- Auto-triggers Step 7.1 (AI image extraction) if text extraction fails repeatedly

---

## Step 5.1: AI-Guided Image Extraction (Fallback on Validation Failure)

**Task:** If text-based extraction fails validation after retry, use AI to directly extract from table screenshot images

**Trigger condition:**
- `validation_passed = False` after 2+ retry attempts from text
- OR text extraction returns <90% column coverage
- OR major data alignment issues detected

**Why this step:**
- Some PDFs have image-only tables (scanned documents)
- Complex table layouts may not parse well from text
- Visual AI extraction can handle merged cells, rotated text, footnotes better
- **Last resort:** Higher token cost but higher accuracy for difficult tables

**Process:**

```python
print('━' * 80)
print('STEP 7.1: AI-GUIDED IMAGE EXTRACTION (FALLBACK)')
print('━' * 80)
print()

print('⚠️  Text extraction failed validation')
print('🤖 Switching to AI visual extraction from table screenshots')
print()

# Load table screenshots from table-index.json
table_info = table_index['tables'][current_table_index]
screenshots = table_info['screenshots']

print(f'📸 Loading {len(screenshots)} screenshot(s) for {table_name}:')
for screenshot in screenshots:
    print(f'   - {screenshot["filename"]} (Page {screenshot["page"]})')
print()

# Use AI to directly read table from images
print('🤖 Using AI vision to extract table structure from images...')
print()

# [AI analyzes screenshots to:]
# - Identify column headers (even if rotated/styled)
# - Extract all data rows
# - Handle multi-page tables (stitch together)
# - Detect footnotes and exclude from data
# - Handle merged cells and complex layouts
# - Output structured CSV

# Validation checkpoint
print('✅ Validating AI-extracted data...')
print()

# [Run same validation checks as Step 7]
# - Column count
# - Empty columns
# - Data ranges
# - Row count

print(f'✅ AI extraction complete: {csv_file.name}')
print(f'   Method: Visual AI extraction')
print(f'   Rows: {len(df)}')
print(f'   Columns: {len(df.columns)}')
print()
```

**Output:**
- CSV file extracted from visual analysis of screenshot images
- Higher accuracy for complex tables
- Same validation checks applied

**Key Benefits:**
- ✅ **Fallback for difficult tables** (scanned PDFs, complex layouts)
- ✅ **Handles visual complexity** (merged cells, rotated headers, footnotes)
- ✅ **Multi-page stitching** (AI recognizes continuation patterns)
- ⚠️ **Higher cost** (vision tokens more expensive than text)

**When to use:**
- Text extraction fails validation 2+ times
- PDF is image-only (scanned document)
- Table has complex visual layout (merged cells, rotated text)
- Column alignment issues in text extraction

---

## Step 6: Automatic Retry Loop (On Validation Failure)

**Task:** If validation fails, automatically retry extraction with fixes

**Trigger condition:** `validation_passed = False` from Step 7

**Process:**

```python
print()
print('━' * 80)
print('STEP 8: RETRY LOOP (VALIDATION FAILED)')
print('━' * 80)
print()

max_retries = 3
retry_count = 0

while not validation_passed and retry_count < max_retries:
    retry_count += 1

    print(f'🔄 RETRY ATTEMPT {retry_count}/{max_retries}')
    print()

    # Analyze failures and adjust extraction strategy
    if len(empty_cols) > 5:
        print('📝 Issue: Too many empty columns')
        print('   Fix: Adjust column delimiter detection')
        print('   - Try splitting by single space instead of multiple spaces')
        print('   - Check for tab characters in raw text')
        print()

    if range_violations:
        print('📝 Issue: Values in wrong columns')
        print('   Fix: Re-map ± pattern extraction order')
        print('   - Verify which ± value corresponds to which field')
        print('   - Check if column headers are split across multiple lines')
        print()

    # Delete failed CSV
    csv_file.unlink()
    print(f'🗑️  Deleted: {csv_file.name}')
    print()

    # Regenerate extraction script with fixes
    print('🔧 Regenerating extraction script with fixes...')

    # [HERE: AI would regenerate extract_table_X.py with adjustments]
    # For example:
    # - Change delimiter from r'\s{2,}' to r'\s+' or '\t'
    # - Adjust ± value extraction order
    # - Add more robust column mapping

    # Re-run extraction
    print('▶️  Re-running extraction...')
    # exec(open('extract_table_1.py').read())

    # Re-run validation (Steps 7.1-7.5)
    print('🔍 Re-running validation...')
    # [Repeat validation checks from Step 7]

    # Update validation_passed based on new results
    # validation_passed = <result of re-validation>

    if validation_passed:
        print(f'✅ Retry successful on attempt {retry_count}!')
        break
    else:
        print(f'❌ Retry {retry_count} failed')
        if retry_count < max_retries:
            print(f'   Attempting retry {retry_count + 1}...')
            print()

# Final outcome
if not validation_passed:
    print()
    print('━' * 80)
    print('❌ EXTRACTION FAILED AFTER 3 RETRIES')
    print('━' * 80)
    print()
    print('This table requires manual intervention:')
    print(f'   1. Review raw text: {raw_text_file}')
    print(f'   2. Inspect extraction script: extract_table_1.py')
    print(f'   3. Manually adjust column mapping')
    print(f'   4. OR flag for manual data entry')
    print()
    print('⚠️ Proceeding with other tables, but this table is INCOMPLETE')
    print()

print('━' * 80)
print()
```

**Retry Strategy:**
1. Analyze which validation check failed
2. Apply targeted fix:
   - **Column count low** → Adjust delimiter (try tabs, single space, etc.)
   - **Empty columns** → Re-map column positions, check header spanning
   - **Range violations** → Re-order ± value extraction, verify column mapping
   - **Invalid sample IDs** → Fix regex pattern or cleaning logic

3. Delete failed CSV
4. Regenerate extraction script with fixes
5. Re-run extraction + validation
6. Maximum 3 attempts

**Failure handling:**
- After 3 failed attempts: Mark table as "INCOMPLETE"
- Log failures for manual review
- Continue with other tables (don't abort entire extraction)
- Generate warning in final report

**Success criteria:**
- ALL validation checks pass (Steps 7.1-7.4)
- No critical failures remain
- Proceed to Step 9 (Kohn 2024 comparison)


## Final Summary Report

**After all steps complete, print summary:**

```python
print()
print('━' * 80)
print('✅ EXTRACTION WORKFLOW COMPLETE')
print('━' * 80)
print()

print('📂 Paper Directory:', paper_dir.name)
print()

print('📊 Extraction Results:')
if use_supplementary:
    print('   ✅ Source: Supplementary data files (OSF/Zenodo)')
    print(f'   ✅ Files processed: {len(data_files)}')
else:
    print('   ✅ Source: PDF table extraction')
    print(f'   ✅ Tables extracted: {len(list(extracted_dir.glob("*-extracted.csv")))}')

print(f'   ✅ EarthBank CSVs: {len(list(fair_dir.glob("*.csv")))} file(s)')
print()

print('📁 Output Files:')
print('   - FAIR/*.csv (ready for database import)')
print('   - extraction-report.md (FAIR score & completeness)')
print('   - update-database-metadata.sql (dataset metadata)')
print('   - populate-data-files.sql (file tracking)')
print()

print('⏱️  Time Elapsed:')
print(f'   - Duration: {duration_str} ({minutes + (hours * 60)} minutes)')
print()

print('💰 Token Usage:')
print(f'   - Total tokens: {total_tokens:,}')
print(f'   - Estimated cost: ${total_cost:.2f}')
print()

print('🚀 Next Steps:')
print('   1. Review extraction-report.md for FAIR score')
print('   2. Review FAIR/*.csv files for data quality')
print('   3. Run SQL scripts to populate database:')
print(f'      psql "$DATABASE_URL" -f {paper_dir}/update-database-metadata.sql')
print(f'      psql "$DATABASE_URL" -f {paper_dir}/populate-data-files.sql')
print('   4. Import FAIR/*.csv files using import scripts')
print()

print('━' * 80)
print()
```

---

## Future Enhancement: Figure Data Extraction

**Status:** Not yet implemented (planned feature)

**Concept:** Extract quantitative data directly from figures (radial plots, histograms, probability density plots)

**Data Source:** `images/image-metadata.json` from `/thermoanalysis`
- Contains extracted figures with captions
- Includes relevance analysis (HIGH = data figures, LOW = conceptual)

**Potential Implementation:**

```python
import json
from pathlib import Path

# Load image metadata
paper_dir = Path('build-data/learning/thermo-papers/PAPER_NAME')
metadata_file = paper_dir / 'images' / 'image-metadata.json'

with open(metadata_file, 'r') as f:
    image_data = json.load(f)

# Filter for high-value data figures
high_value_figures = image_data.get('image_analysis', {}).get('high_value', [])

print(f'📊 Found {len(high_value_figures)} high-value data figure(s)')
print()

for fig in high_value_figures:
    fig_name = fig['name']
    description = fig['description'].lower()

    # Detect figure type
    if 'radial' in description:
        print(f'   {fig_name}: Radial plot detected')
        # Extract: Single-grain ages, central age, dispersion
        # Method: Computer vision + coordinate extraction

    elif 'histogram' in description or 'probability' in description:
        print(f'   {fig_name}: Age distribution detected')
        # Extract: Age bins, frequencies
        # Method: Plot digitizer

    elif 'track length' in description:
        print(f'   {fig_name}: Track length distribution detected')
        # Extract: Length bins, frequencies, MTL
        # Method: Plot digitizer

    elif 'elevation' in description or 'profile' in description:
        print(f'   {fig_name}: Age-elevation profile detected')
        # Extract: Sample elevations, ages
        # Method: Coordinate extraction from scatter plot

print()
```

**Use Cases:**
1. **Papers without data tables** - Some papers only show radial plots/histograms
2. **Quality control** - Compare extracted table data vs. figure data
3. **Grain-level data** - Radial plots show individual grain ages not in tables
4. **Verification** - Cross-check central ages from figures vs. tables

**Tools to Explore:**
- **WebPlotDigitizer** - Manual plot digitization (https://automeris.io/WebPlotDigitizer/)
- **OpenCV** - Computer vision for plot detection
- **pytesseract** - OCR for axis labels and values
- **scikit-image** - Image processing for scatter plot extraction

**Priority:** LOW - Focus on table extraction first
**Complexity:** HIGH - Requires computer vision + domain-specific plot parsing
**Benefits:** MEDIUM - Useful for ~10-20% of papers lacking complete tables

---

**Ready to extract!** Run `/thermoextract` to start the complete workflow from PDF → Database.
