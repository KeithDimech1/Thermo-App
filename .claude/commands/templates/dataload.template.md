# /{{PROJECT_NAME}}load - Dataset Loading with FAIR Assessment

**Purpose:** Load extracted {{DATA_TYPE}} data into database with FAIR compliance assessment and metadata generation

**Key Features:**
- Automated dataset record creation
- File upload to public directory
- FAIR compliance scoring
- Multi-format support (CSV + JSON + SQL)
- Database metadata population

---

## Workflow Overview

```
1. Read extraction results → Get extracted CSVs/JSON/SQL
2. Create dataset record → Generate unique dataset ID
3. Upload files → Copy to public directory
4. Assess FAIR compliance → Score against {{STANDARDS_NAME}} standards
5. Import to database → Execute SQL or load CSVs
6. Generate reports → JSON + Markdown summaries
```

---

## Prerequisites

**Required files (from /{{PROJECT_NAME}}extract):**
- `extracted/*.csv` - Tabular data
- `extracted/*.json` - Structured data with metadata
- `extracted/*.sql` - INSERT statements (optional)
- `{{INDEX_FILENAME}}` - Paper metadata

**Database connection:**
- `.env.local` with `DATABASE_URL` and `DIRECT_URL`
- {{PROJECT_NAME}} schema deployed
- Tables: {{#DB_TABLES}}{{TABLE_NAME}}{{/DB_TABLES}}

---

## Step 1: Load Extraction Results

**Task:** Read extracted data files and paper metadata

```python
import json
from pathlib import Path
import pandas as pd

paper_dir = Path('build-data/learning/{{PAPERS_DIR}}/PAPER_NAME')
extracted_dir = paper_dir / 'extracted'

# Load paper metadata
with open(paper_dir / '{{INDEX_FILENAME}}', 'r') as f:
    index_content = f.read()

# Parse metadata
metadata = {
    'title': '{{EXAMPLE_TITLE}}',
    'authors': '{{EXAMPLE_AUTHORS}}',
    'year': {{EXAMPLE_YEAR}},
    '{{CUSTOM_FIELD_1}}': '{{EXAMPLE_VALUE_1}}',
    '{{CUSTOM_FIELD_2}}': '{{EXAMPLE_VALUE_2}}'
}

# Load extracted data files
csv_files = list(extracted_dir.glob('*.csv'))
json_files = list(extracted_dir.glob('*.json'))
sql_files = list(extracted_dir.glob('*.sql'))

print(f'📊 Found {len(csv_files)} CSV file(s)')
print(f'📊 Found {len(json_files)} JSON file(s)')
print(f'📊 Found {len(sql_files)} SQL file(s)')
```

---

## Step 2: Create Dataset Record

**Task:** Generate unique dataset ID and create database record

```python
import hashlib
from datetime import datetime

# Generate unique dataset ID
dataset_name = f"{metadata['authors'].split(',')[0]}{metadata['year']}-{{PROJECT_NAME}}"
dataset_id = dataset_name.lower().replace(' ', '-')

# Create dataset record
dataset_record = {
    'id': dataset_id,
    'name': dataset_name,
    'description': f"{{DATA_TYPE}} data from {metadata['title']}",
    'created_at': datetime.now().isoformat(),
    '{{CITATION_FIELD}}': f"{metadata['authors']} ({metadata['year']}). {metadata['title']}. {{PUBLICATION_TYPE}}.",
    '{{METADATA_FIELD_1}}': metadata['{{CUSTOM_FIELD_1}}'],
    '{{METADATA_FIELD_2}}': metadata['{{CUSTOM_FIELD_2}}'],
    'file_count': len(csv_files) + len(json_files) + len(sql_files),
    'row_count': sum(len(pd.read_csv(f)) for f in csv_files),
    'column_count': sum(len(pd.read_csv(f).columns) for f in csv_files)
}

print(f'✅ Created dataset: {dataset_id}')
```

---

## Step 3: Upload Files to Public Directory

**Task:** Copy files to public directory for download access

```python
import shutil

# Create public directory
public_dir = Path('public/datasets') / dataset_id
public_dir.mkdir(parents=True, exist_ok=True)

# Copy all extracted files
uploaded_files = []

for file in csv_files + json_files + sql_files:
    dest = public_dir / file.name
    shutil.copy2(file, dest)

    uploaded_files.append({
        'filename': file.name,
        'format': file.suffix[1:].upper(),
        'size': file.stat().st_size,
        'path': f'/datasets/{dataset_id}/{file.name}'
    })

    print(f'✅ Uploaded: {file.name} ({file.stat().st_size / 1024:.1f} KB)')

print(f'📁 Files uploaded to: {public_dir}')
```

---

## Step 4: Assess FAIR Compliance

**Task:** Score dataset against {{STANDARDS_NAME}} standards

### FAIR Principles Assessment

**Findable:**
{{#FINDABLE_CRITERIA}}
- {{CRITERION}}: {{DESCRIPTION}}
{{/FINDABLE_CRITERIA}}

**Accessible:**
{{#ACCESSIBLE_CRITERIA}}
- {{CRITERION}}: {{DESCRIPTION}}
{{/ACCESSIBLE_CRITERIA}}

**Interoperable:**
{{#INTEROPERABLE_CRITERIA}}
- {{CRITERION}}: {{DESCRIPTION}}
{{/INTEROPERABLE_CRITERIA}}

**Reusable:**
{{#REUSABLE_CRITERIA}}
- {{CRITERION}}: {{DESCRIPTION}}
{{/REUSABLE_CRITERIA}}

```python
# FAIR scoring logic
fair_score = {
    'findable': 0,
    'accessible': 0,
    'interoperable': 0,
    'reusable': 0
}

# Score based on {{STANDARDS_NAME}} requirements
{{#SCORING_RULES}}
if {{CONDITION}}:
    fair_score['{{CATEGORY}}'] += {{POINTS}}  # {{EXPLANATION}}
{{/SCORING_RULES}}

# Calculate overall FAIR score
total_score = sum(fair_score.values())
max_score = {{MAX_FAIR_SCORE}}
fair_percentage = (total_score / max_score) * 100

print(f'📊 FAIR Score: {fair_percentage:.1f}% ({total_score}/{max_score} points)')
print(f'   Findable: {fair_score["findable"]} points')
print(f'   Accessible: {fair_score["accessible"]} points')
print(f'   Interoperable: {fair_score["interoperable"]} points')
print(f'   Reusable: {fair_score["reusable"]} points')
```

---

## Step 5: Import to Database

**Task:** Load data into {{PROJECT_NAME}} database

### Option A: Execute SQL Files (Recommended)

```python
import subprocess
from pathlib import Path

# Load database connection from .env.local
from dotenv import load_dotenv
import os

load_dotenv('.env.local')
db_url = os.getenv('DIRECT_URL')  # Use DIRECT_URL for migrations

# Execute SQL files
for sql_file in sql_files:
    print(f'🔄 Executing: {sql_file.name}')

    result = subprocess.run(
        ['psql', db_url, '-f', str(sql_file)],
        capture_output=True,
        text=True
    )

    if result.returncode == 0:
        print(f'✅ Success: {sql_file.name}')
    else:
        print(f'❌ Error: {sql_file.name}')
        print(result.stderr)
```

### Option B: Load CSVs via Python (Alternative)

```python
import psycopg2
from psycopg2 import sql

conn = psycopg2.connect(db_url)
cursor = conn.cursor()

for csv_file in csv_files:
    # Determine target table based on filename
    table_name = '{{TABLE_MAPPING_LOGIC}}'  # Map CSV → DB table

    # Load CSV
    df = pd.read_csv(csv_file)

    # Generate INSERT statements
    for _, row in df.iterrows():
        columns = ', '.join(f'"{col}"' for col in df.columns)
        placeholders = ', '.join(['%s'] * len(df.columns))

        query = sql.SQL('INSERT INTO {table} ({columns}) VALUES ({values})').format(
            table=sql.Identifier(table_name),
            columns=sql.SQL(columns),
            values=sql.SQL(placeholders)
        )

        cursor.execute(query, tuple(row))

    conn.commit()
    print(f'✅ Imported: {csv_file.name} → {table_name}')

cursor.close()
conn.close()
```

---

## Step 6: Populate Database Metadata

**Task:** Create dataset record and file tracking entries in database

```python
# Insert dataset record
cursor.execute('''
    INSERT INTO {{DATASETS_TABLE}} (
        id,
        name,
        description,
        {{CITATION_FIELD}},
        {{METADATA_FIELD_1}},
        {{METADATA_FIELD_2}},
        fair_score,
        created_at
    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
''', (
    dataset_id,
    dataset_name,
    dataset_record['description'],
    dataset_record['{{CITATION_FIELD}}'],
    dataset_record['{{METADATA_FIELD_1}}'],
    dataset_record['{{METADATA_FIELD_2}}'],
    fair_percentage,
    datetime.now()
))

# Insert file tracking records
for file_info in uploaded_files:
    cursor.execute('''
        INSERT INTO {{FILES_TABLE}} (
            dataset_id,
            filename,
            format,
            size_bytes,
            public_path
        ) VALUES (%s, %s, %s, %s, %s)
    ''', (
        dataset_id,
        file_info['filename'],
        file_info['format'],
        file_info['size'],
        file_info['path']
    ))

conn.commit()
print(f'✅ Database metadata populated')
```

---

## Step 7: Generate Reports

**Task:** Create JSON + Markdown reports summarizing the import

### 7.1: JSON Report

```python
report = {
    'dataset_id': dataset_id,
    'dataset_name': dataset_name,
    'import_date': datetime.now().isoformat(),
    'paper_metadata': metadata,
    'fair_assessment': {
        'overall_score': fair_percentage,
        'breakdown': fair_score,
        'max_score': max_score
    },
    'files_uploaded': uploaded_files,
    'data_summary': {
        'total_rows': dataset_record['row_count'],
        'total_columns': dataset_record['column_count'],
        'table_count': len(csv_files)
    },
    'database_tables_populated': [
        {{#DB_TABLES}}'{{TABLE_NAME}}',{{/DB_TABLES}}
    ]
}

report_file = paper_dir / 'load-report.json'
with open(report_file, 'w') as f:
    json.dump(report, f, indent=2)

print(f'✅ Created: load-report.json')
```

### 7.2: Markdown Report

```python
report_md = f'''# {{PROJECT_NAME}} Data Load Report

**Dataset ID:** {dataset_id}
**Import Date:** {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}

---

## Paper Metadata

- **Title:** {metadata['title']}
- **Authors:** {metadata['authors']}
- **Year:** {metadata['year']}
- **{{CUSTOM_FIELD_1}}:** {metadata['{{CUSTOM_FIELD_1}}']}
- **{{CUSTOM_FIELD_2}}:** {metadata['{{CUSTOM_FIELD_2}}']}

---

## FAIR Assessment

**Overall Score:** {fair_percentage:.1f}% ({total_score}/{max_score} points)

| Principle | Score | Description |
|-----------|-------|-------------|
| **Findable** | {fair_score["findable"]} | {{FINDABLE_DESCRIPTION}} |
| **Accessible** | {fair_score["accessible"]} | {{ACCESSIBLE_DESCRIPTION}} |
| **Interoperable** | {fair_score["interoperable"]} | {{INTEROPERABLE_DESCRIPTION}} |
| **Reusable** | {fair_score["reusable"]} | {{REUSABLE_DESCRIPTION}} |

---

## Files Uploaded

| File | Format | Size | Path |
|------|--------|------|------|
'''

for file_info in uploaded_files:
    report_md += f"| {file_info['filename']} | {file_info['format']} | {file_info['size'] / 1024:.1f} KB | {file_info['path']} |\\n"

report_md += f'''

---

## Data Summary

- **Total Rows:** {dataset_record['row_count']:,}
- **Total Columns:** {dataset_record['column_count']}
- **Tables:** {len(csv_files)}

---

## Database Tables Populated

{{#DB_TABLES}}
- `{{TABLE_NAME}}`
{{/DB_TABLES}}

---

**Generated by:** /{{PROJECT_NAME}}load | **Project:** {{PROJECT_NAME}}
'''

report_md_file = paper_dir / 'load-report.md'
with open(report_md_file, 'w') as f:
    f.write(report_md)

print(f'✅ Created: load-report.md')
```

---

## Final Summary

```python
print()
print('━' * 80)
print('✅ DATA LOAD COMPLETE')
print('━' * 80)
print()

print(f'📊 Dataset: {dataset_id}')
print(f'📊 FAIR Score: {fair_percentage:.1f}%')
print(f'📊 Files Uploaded: {len(uploaded_files)}')
print(f'📊 Total Rows: {dataset_record["row_count"]:,}')
print()

print('📁 Reports Generated:')
print(f'   - {report_file.name}')
print(f'   - {report_md_file.name}')
print()

print('🌐 Access Data:')
print(f'   - Web UI: http://localhost:3000/datasets/{dataset_id}')
print(f'   - API: /api/datasets/{dataset_id}')
print(f'   - Files: /datasets/{dataset_id}/*.{{csv,json,sql}}')
print()
```

---

## 🔧 CUSTOMIZATION POINTS

**To adapt this command for {{PROJECT_NAME}}:**

1. **Database tables** (throughout): Map data files to database tables
2. **FAIR criteria** (line 93): Define domain-specific FAIR requirements
3. **Scoring rules** (line 123): Implement {{STANDARDS_NAME}} scoring logic
4. **Metadata fields** (line 64): Define dataset metadata fields
5. **Table mapping** (line 189): Define CSV → DB table mapping logic
6. **Citation format** (line 49): Define how citations are formatted
7. **Public path** (line 75): Define where files are served from

---

**End of template** | Generated from: `dataload.template.md` | Project: {{PROJECT_NAME}}
