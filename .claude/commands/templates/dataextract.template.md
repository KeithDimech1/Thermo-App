# /{{PROJECT_NAME}}extract - AI-Powered Data Extraction

**Purpose:** Extract {{DATA_TYPE}} data from {{DOCUMENT_TYPE}} using AI analysis, validate against {{STANDARDS_NAME}} standards, and export to multiple formats

**Key Innovation:** Iterative AI-guided extraction with PDF analysis + AI structure understanding + validation loop

---

## ✅ SCHEMA: {{PROJECT_NAME}} Database Schema

**Database Schema:** {{PROJECT_NAME}} schema
- **Tables:** {{#DB_TABLES}}{{TABLE_NAME}}{{/DB_TABLES}}
- **Fields:** {{NAMING_CONVENTION}} naming (e.g., {{EXAMPLE_FIELDS}})
- **Primary Keys:** {{PK_STRATEGY}}
- **Foreign Keys:** {{FK_STRATEGY}}

**Extraction Output:** This command outputs {{OUTPUT_FORMAT}} matching {{PROJECT_NAME}} schema

---

## Workflow Overview

```
1. Read {{INDEX_FILENAME}} → Get table locations, page numbers, supplementary URLs
2. AI structure analysis → Understand headers & data patterns
3. Create extraction plan → Bespoke extraction strategy
4. Extract to multiple formats → CSV + JSON + SQL
5. Validate extraction → Check completeness, data ranges
6. Retry loop → Delete & retry until perfect (MAX 3 attempts per table)
```

---

## 🚨 CRITICAL EXTRACTION RULES

**BEFORE starting extraction, understand these NON-NEGOTIABLE requirements:**

### 1. Extract ALL Tables (No Exceptions)

**Rule:** EVERY table marked "extractable: YES" in {{INDEX_FILENAME}} MUST be extracted

- ❌ **WRONG:** "Extract main tables, skip supplementary for later"
- ✅ **CORRECT:** "Extract ALL tables before marking extraction complete"

**Why:** {{SUPPLEMENTARY_IMPORTANCE_EXPLANATION}}

**Priority** determines extraction ORDER, NOT whether to extract

### 2. Extract ALL Columns (No Partial Extraction)

**Rule:** EVERY column in the source table MUST appear in the extracted output

- ❌ **WRONG:** Extract 12/24 columns and mark table "complete"
- ✅ **CORRECT:** Extract ≥90% of columns, validate, retry if <90%

**Validation enforces this:** Fails extraction if column count <90% of source

### 3. Validate Before Proceeding (Mandatory)

**Rule:** NO table is "complete" until ALL validation checks pass

- ❌ **WRONG:** Extract → move to next table
- ✅ **CORRECT:** Extract → validate → retry if fails → THEN next table

**Auto-retry:** If validation fails, automatically retries up to 3 times

---

## Step 1: Load Paper Analysis

**Task:** Read the {{INDEX_FILENAME}} to identify tables and their exact page numbers

**File to read:**
```bash
build-data/learning/{{PAPERS_DIR}}/PAPER_NAME/{{INDEX_FILENAME}}
```

**Extract from "📊 Data Tables" section:**

| Field | What to Extract | Example |
|-------|----------------|---------|
| **Table identifiers** | Table numbers/names | {{TABLE_ID_EXAMPLES}} |
| **Page numbers** | Exact page(s) where table appears | Page 9, Pages 10-11 (spans 2 pages) |
| **Data type** | {{DATA_TYPE_EXAMPLES}} | {{DATA_TYPE_EXAMPLE_VALUES}} |
| **Description** | Brief content summary | {{CONTENT_DESCRIPTION_EXAMPLES}} |

**CRITICAL:** Extract ALL tables marked as "extractable: YES" - NO tables are optional!

---

## Step 2: AI Structure Analysis

**Task:** Use AI to analyze table structure from PDF pages

**Process:**
1. Load table PDF from `images/tables/`
2. Extract structure information
3. Ask AI to analyze

**AI Analysis Prompt:**
```
You are analyzing a {{DATA_TYPE}} data table extracted from a {{DOCUMENT_TYPE}}.

Here is the table from pages {{PAGE_RANGE}}:
[TABLE PDF CONTENT]

Analyze the structure and answer:
1. What are the column headers? (exact text)
2. What delimiter separates columns?
3. Are headers on one line or multiple lines?
4. What pattern do {{ENTITY_NAME}} IDs follow? (regex)
5. How many columns are there?
6. Are there any footnote symbols or special characters?
7. Are there any merged cells or spanning columns?
8. What numeric format is used? (decimal: . or ,)
9. How are uncertainties represented? (±, separate column, parentheses?)
10. Are there any non-data rows? (subtotals, averages, blank rows?)

Provide a concise structural summary.
```

**AI Output Example:**
```
Table Structure Analysis:
- Headers: Single line, space-separated
- Columns: {{EXAMPLE_COLUMN_COUNT}} columns detected
- {{ENTITY_NAME}} ID: Pattern "{{EXAMPLE_ID_PATTERN}}"
- Delimiter: Multiple spaces (aligned columns)
- Uncertainties: ± format in same cell
- Special notes:
  * {{SPECIAL_NOTE_EXAMPLES}}
```

---

## Step 3: Create Extraction Plan

**Task:** Based on AI structure analysis, create extraction strategy

**Extraction Methods:**
1. **Text extraction** (primary) - Fast, from plain-text.txt
2. **PDF extraction** (validation) - From PDF pages, better structure
3. **AI extraction** (fallback) - Direct AI reading of PDF

**Output formats:**
- **CSV:** Clean tabular data
- **JSON:** Structured data with metadata
- **SQL:** INSERT statements for direct database import

---

## Step 4: Extract to Multiple Formats

### 4.1: Load Table Index

```python
import json
from pathlib import Path

paper_dir = Path('build-data/learning/{{PAPERS_DIR}}/PAPER_NAME')
table_index_file = paper_dir / 'table-index.json'

with open(table_index_file, 'r') as f:
    table_index = json.load(f)

print(f'✅ Loaded table index with {len(table_index["tables"])} tables')
```

### 4.2: Extract from PDF Pages

```python
# Select table to extract
table_name = '{{EXAMPLE_TABLE_NAME}}'
table_info = next(t for t in table_index['tables'] if t['name'] == table_name)

# Load table PDF
pdf_file = paper_dir / table_info['pdf_pages']['file']
pages = table_info['pdf_pages']['pages']

print(f'📄 Extracting {table_name}')
print(f'   PDF: {pdf_file.name}')
print(f'   Pages: {pages[0]}-{pages[-1]} ({len(pages)} pages)')

# Use AI to parse table structure and extract data
# [AI analyzes PDF and generates structured output]
```

### 4.3: Generate Multiple Formats

```python
import pandas as pd
import json

# Create DataFrame from extracted data
df = pd.DataFrame(extracted_data)

# 1. Export to CSV
csv_file = paper_dir / 'extracted' / f'{table_name.lower().replace(" ", "_")}.csv'
df.to_csv(csv_file, index=False)

# 2. Export to JSON
json_file = csv_file.with_suffix('.json')
data_json = {
    'table_name': table_name,
    'extracted_date': datetime.now().isoformat(),
    'row_count': len(df),
    'column_count': len(df.columns),
    'columns': df.columns.tolist(),
    'data': df.to_dict(orient='records')
}
with open(json_file, 'w') as f:
    json.dump(data_json, f, indent=2)

# 3. Export to SQL
sql_file = csv_file.with_suffix('.sql')
# Generate INSERT statements based on {{PROJECT_NAME}} schema
```

**CSV Requirements:**
- Headers must be clean ({{NAMING_CONVENTION}})
- One row per {{ENTITY_NAME}}
- Numeric columns must be pure numbers
- Uncertainty in separate column from value
- Missing data as empty cells (not "—" or "n.d.")
- {{ENTITY_NAME}} IDs validated against pattern: {{ID_REGEX}}
- Multi-page tables combined into single file

---

## Step 5: Comprehensive Validation (MANDATORY)

**Task:** Validate extracted data - NO extraction is complete without passing validation

### 5.1: Column Count Validation

```python
# Count columns in source vs. extracted
expected_columns = {{EXPECTED_COLUMN_COUNT}}  # From table structure analysis
actual_columns = len(df.columns)

completeness = (actual_columns / expected_columns) * 100

if completeness < 90:
    print(f'❌ VALIDATION FAILED: Column count mismatch')
    print(f'   Expected: ≥{expected_columns * 0.9:.0f} columns')
    print(f'   Found: {actual_columns} columns')
    validation_passed = False
else:
    print(f'✅ Column count OK ({completeness:.1f}% complete)')
    validation_passed = True
```

### 5.2: Empty Column Detection

```python
# Find columns that are completely empty
empty_cols = []
for col in df.columns:
    if df[col].isna().all() or (df[col].astype(str).str.strip() == '').all():
        empty_cols.append(col)

empty_pct = (len(empty_cols) / len(df.columns)) * 100

if empty_pct > 10:
    print(f'❌ VALIDATION FAILED: {empty_pct:.1f}% of columns are empty')
    validation_passed = False
else:
    print(f'✅ No empty columns detected')
```

### 5.3: Data Range Validation

```python
# Define expected ranges for {{PROJECT_NAME}} data
expected_ranges = {
{{#VALIDATION_RANGES}}
    '{{FIELD_NAME}}': ({{MIN_VALUE}}, {{MAX_VALUE}}),  # {{FIELD_DESCRIPTION}}
{{/VALIDATION_RANGES}}
}

range_violations = []

for col, (min_val, max_val) in expected_ranges.items():
    if col in df.columns:
        col_numeric = pd.to_numeric(df[col], errors='coerce')
        out_of_range = col_numeric[(col_numeric < min_val) | (col_numeric > max_val)]

        if len(out_of_range) > 0:
            range_violations.append({
                'column': col,
                'violations': len(out_of_range),
                'examples': out_of_range.head(3).tolist()
            })

if range_violations:
    print(f'⚠️ Found {len(range_violations)} column(s) with out-of-range values')
    # May indicate values in wrong columns
```

### 5.4: {{ENTITY_NAME}} ID Validation

```python
# Expected pattern from {{PROJECT_NAME}}
id_pattern = r'{{ID_REGEX}}'

if '{{ENTITY_ID_FIELD}}' in df.columns:
    valid_ids = df['{{ENTITY_ID_FIELD}}'].str.match(id_pattern, na=False)
    invalid_count = (~valid_ids).sum()

    if invalid_count > len(df) * 0.1:  # >10% invalid
        print(f'❌ VALIDATION FAILED: {invalid_count} invalid {{ENTITY_NAME}} IDs')
        validation_passed = False
    else:
        print('✅ All {{ENTITY_NAME}} IDs match expected pattern')
```

---

## Step 6: Automatic Retry Loop (On Validation Failure)

**Trigger condition:** `validation_passed = False`

```python
max_retries = 3
retry_count = 0

while not validation_passed and retry_count < max_retries:
    retry_count += 1
    print(f'🔄 RETRY ATTEMPT {retry_count}/{max_retries}')

    # Analyze failures and adjust extraction strategy
    # Delete failed files
    # Re-extract with fixes
    # Re-validate

    if validation_passed:
        print(f'✅ Retry successful on attempt {retry_count}!')
        break
```

**Failure handling:**
- After 3 failed attempts: Mark table as "INCOMPLETE"
- Log failures for manual review
- Continue with other tables
- Generate warning in final report

---

## Step 7: AI-Guided PDF Extraction (Fallback)

**Task:** If text-based extraction fails, use AI to directly extract from PDF pages

**Trigger condition:**
- `validation_passed = False` after 2+ retry attempts
- OR text extraction returns <90% column coverage

**Process:**
```python
# Load table PDF
pdf_file = table_info['pdf_pages']['file']
pages = table_info['pdf_pages']['pages']

print(f'📄 Loading table PDF: {pdf_file}')
print(f'🤖 Using AI to extract table structure from PDF pages...')

# [AI analyzes PDF pages to:]
# - Identify column headers
# - Extract all data rows from native PDF text layer
# - Handle multi-page tables (stitch together)
# - Detect footnotes and exclude from data
# - Handle merged cells and complex layouts
# - Output structured data in all 3 formats (CSV + JSON + SQL)
```

**Benefits:**
- ✅ Better text extraction than PNG OCR
- ✅ Handles visual complexity (merged cells, rotated text)
- ✅ Multi-page stitching
- ⚠️ Higher cost (AI extraction more expensive)

---

## Final Summary Report

```python
print()
print('━' * 80)
print('✅ EXTRACTION WORKFLOW COMPLETE')
print('━' * 80)
print()

print('📂 Paper Directory:', paper_dir.name)
print()

print('📊 Extraction Results:')
print(f'   ✅ Tables extracted: {len(extracted_tables)}')
print(f'   ✅ Output formats: CSV + JSON + SQL')
print()

print('📁 Output Files:')
print('   - extracted/*.csv (tabular data)')
print('   - extracted/*.json (structured data with metadata)')
print('   - extracted/*.sql (INSERT statements for database)')
print()

print('🚀 Next Steps:')
print('   1. Review extraction quality in CSV files')
print('   2. Check validation report for any warnings')
print('   3. Run /{{PROJECT_NAME}}load to import to database')
print()
```

---

## 🔧 CUSTOMIZATION POINTS

**To adapt this command for {{PROJECT_NAME}}:**

1. **Entity naming** (throughout): Define what items are called (samples, patients, etc.)
2. **ID pattern** (line 92): Define regex for {{ENTITY_NAME}} IDs
3. **Validation ranges** (line 329): Define expected data ranges per field
4. **Table types** (line 54): List table categories to extract
5. **Output schema** (line 260): Define database table/column mappings
6. **Standards** (line 3): Reference relevant reporting standards

---

**End of template** | Generated from: `dataextract.template.md` | Project: {{PROJECT_NAME}}
