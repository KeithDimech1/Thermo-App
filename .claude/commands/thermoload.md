# /thermoload - Load Dataset with FAIR Assessment

**Purpose:** Create a dataset entry with paper metadata, upload files (PDF, CSVs, images), and perform FAIR compliance assessment - WITHOUT importing CSV data to database.

**Prerequisites:**
- Paper analyzed with `/thermoanalysis` (creates `paper-index.md`, `paper-analysis.md`)
- Data extracted with `/thermoextract` (creates `extracted/*.csv`, `images/`)

**Key Innovation:** Bridges extraction → database by creating dataset records with FAIR assessment, enabling web UI display before data import.

---

## ✅ SCHEMA: EarthBank camelCase (IDEA-014 Complete)

**Database Tables Used:**
- `datasets` - Main dataset metadata
- `fair_score_breakdown` - Detailed FAIR scoring
- `data_files` - File tracking (PDFs, CSVs, images)

**Critical:** This command does NOT import CSV data to `earthbank_*` tables - that's a separate workflow.

---

## Workflow Overview

```
0. Prompt for paper directory path
1. Parse paper metadata → Extract from paper-index.md
2. Create dataset record → Generate dataset ID
3. Upload files → Copy PDF, CSVs, images to public/data/
4. Track files → Insert data_files records
5. Perform FAIR analysis → Score against Kohn 2024 standards
6. Generate reports → Create fair-compliance.json + extraction-report.md
7. Update database → Insert fair_score_breakdown
8. Report success → Show dataset URL + FAIR score
```

**Critical Separation:** Steps 1-8 populate dataset metadata and FAIR assessment. CSV data import to `earthbank_*` tables is a separate command (future: `/thermoimport`).

---

## Step 0: Prompt for Paper Directory

**Task:** Ask user for the paper directory path containing extraction outputs

**Process:**

```python
print()
print('━' * 80)
print('/THERMOLOAD - DATASET LOADER WITH FAIR ASSESSMENT')
print('━' * 80)
print()
print('This command will:')
print('  1. Create a dataset entry with paper metadata')
print('  2. Upload files (PDF, CSVs, images) to public/data/')
print('  3. Perform FAIR compliance assessment')
print('  4. Generate FAIR reports')
print()
print('⚠️  NOTE: This does NOT import CSV data to database tables.')
print('   That is a separate step (future: /thermoimport)')
print()

# Prompt for directory
paper_dir = input('📂 Enter paper directory path (e.g., build-data/learning/papers/McMillan-2024-Malawi): ').strip()

# Validate path exists
from pathlib import Path
paper_path = Path(paper_dir)

if not paper_path.exists():
    print(f'❌ Error: Directory not found: {paper_dir}')
    exit(1)

# Check prerequisites
paper_index = paper_path / 'paper-index.md'
extracted_dir = paper_path / 'extracted'

if not paper_index.exists():
    print(f'❌ Error: paper-index.md not found!')
    print(f'   Run /thermoanalysis first to create paper metadata.')
    exit(1)

if not extracted_dir.exists():
    print(f'⚠️  Warning: extracted/ directory not found!')
    print(f'   Expected CSV files from /thermoextract.')
    proceed = input('   Continue anyway? (y/n): ').lower()
    if proceed != 'y':
        exit(1)

print()
print(f'✅ Paper directory: {paper_path.name}')
print()
```

**Output:**
- `paper_path` - Validated Path object
- `paper_index` - Path to paper-index.md
- `extracted_dir` - Path to extracted/ directory

---

## Step 1: Parse Paper Metadata

**Task:** Extract paper metadata from `paper-index.md` and map to `datasets` table fields

**Process:**

```python
import re
from datetime import datetime

print('━' * 80)
print('STEP 1: PARSING PAPER METADATA')
print('━' * 80)
print()

# Read paper-index.md
with open(paper_index, 'r', encoding='utf-8') as f:
    index_content = f.read()

# Extract citation (first line after title)
citation_match = re.search(r'\*\*Citation:\*\*\s*(.+)', index_content)
full_citation = citation_match.group(1).strip() if citation_match else None

# Extract authors
authors_match = re.search(r'\*\*Authors:\*\*\s*(.+)', index_content)
if authors_match:
    authors_text = authors_match.group(1)
    # Parse "Name1 (Affiliation), Name2 (Affiliation), ..."
    # Extract just names
    authors = []
    for author_part in authors_text.split(','):
        # Remove affiliation in parentheses
        name = re.sub(r'\s*\([^)]+\)', '', author_part).strip()
        if name:
            authors.append(name)
else:
    authors = []

# Extract journal
journal_match = re.search(r'\*\*Journal:\*\*\s*([^,]+)', index_content)
publication_journal = journal_match.group(1).strip() if journal_match else None

# Extract year
year_match = re.search(r'\*\*Year:\*\*\s*(\d{4})', index_content)
publication_year = int(year_match.group(1)) if year_match else None

# Extract DOI
doi_match = re.search(r'\*\*DOI:\*\*\s*(https?://doi\.org/)?([^\s\n]+)', index_content)
doi = doi_match.group(2).strip() if doi_match else None

# Extract volume/pages
volume_match = re.search(r'Volume\s+(\d+)[,\s]+(?:Article\s+)?(\S+)', index_content)
if volume_match:
    publication_volume_pages = f"Volume {volume_match.group(1)}, {volume_match.group(2)}"
else:
    publication_volume_pages = None

# Extract PDF filename
pdf_filename_match = re.search(r'\*\*PDF Filename:\*\*\s*(.+\.pdf)', index_content)
pdf_filename = pdf_filename_match.group(1).strip() if pdf_filename_match else None

# Extract PDF URL
pdf_url_match = re.search(r'\*\*PDF URL:\*\*\s*(https?://[^\s\n]+)', index_content)
pdf_url = pdf_url_match.group(1).strip() if pdf_url_match else None

# Extract supplementary files URL
supp_match = re.search(r'\*\*Supplementary Files URL:\*\*\s*(https?://[^\s\n]+)', index_content)
supplementary_files_url = supp_match.group(1).strip() if supp_match else None
if supplementary_files_url and 'None' in supplementary_files_url:
    supplementary_files_url = None

# Extract study area/location
study_match = re.search(r'\*\*Study Area:\*\*\s*(.+)', index_content)
study_location = study_match.group(1).strip() if study_match else None

# Extract mineral analyzed
mineral_match = re.search(r'\*\*Method:\*\*\s*(?:Both\s+)?(?:AFT.*?and\s+)?(?:AHe)?\s*\(([^)]+)\)', index_content)
if mineral_match:
    mineral_text = mineral_match.group(1)
    if 'Apatite' in mineral_text or 'apatite' in mineral_text:
        mineral_analyzed = 'Apatite'
    elif 'Zircon' in mineral_text or 'zircon' in mineral_text:
        mineral_analyzed = 'Zircon'
    else:
        mineral_analyzed = mineral_text
else:
    mineral_analyzed = None

# Extract sample count
sample_count_match = re.search(r'\*\*Sample Count:\*\*\s*(\d+)', index_content)
sample_count = int(sample_count_match.group(1)) if sample_count_match else None

# Extract age range
age_range_match = re.search(r'\*\*Age Range:\*\*\s*~?(\d+)-(\d+)\s*Ma', index_content)
if age_range_match:
    age_range_min_ma = float(age_range_match.group(1))
    age_range_max_ma = float(age_range_match.group(2))
else:
    age_range_min_ma = None
    age_range_max_ma = None

# Extract laboratory
lab_match = re.search(r'\*\*Laboratory:\*\*\s*(.+)', index_content)
laboratory = lab_match.group(1).strip() if lab_match else None

# Generate dataset name (First author + Year)
if authors and publication_year:
    first_author_last = authors[0].split()[-1]  # Get last name
    dataset_name = f"{first_author_last} {publication_year}"
else:
    # Fallback to paper directory name
    dataset_name = paper_path.name.replace('-', ' ').title()

# Generate description
description = f"Thermochronology data from {full_citation}" if full_citation else None

print(f'✅ Dataset Name: {dataset_name}')
print(f'✅ Authors: {", ".join(authors)}')
print(f'✅ Journal: {publication_journal} ({publication_year})')
print(f'✅ DOI: {doi}')
print(f'✅ Study Location: {study_location}')
print(f'✅ Mineral: {mineral_analyzed}')
print(f'✅ Sample Count: {sample_count}')
if age_range_min_ma and age_range_max_ma:
    print(f'✅ Age Range: {age_range_min_ma}-{age_range_max_ma} Ma')
print()
```

**Output:**
- `dataset_name` - String (e.g., "McMillan 2024")
- `full_citation` - String
- `authors` - List of author names
- `publication_journal`, `publication_year`, `publication_volume_pages`
- `doi`, `pdf_url`, `supplementary_files_url`
- `study_location`, `mineral_analyzed`, `sample_count`
- `age_range_min_ma`, `age_range_max_ma`
- `laboratory`
- `description`

---

## Step 2: Create Dataset Database Record

**Task:** Insert dataset record into database and get new dataset ID

**Process:**

```python
import psycopg2
from psycopg2.extras import Json
import os
from dotenv import load_dotenv

print('━' * 80)
print('STEP 2: CREATING DATASET RECORD')
print('━' * 80)
print()

# Load database connection
load_dotenv('.env.local')
DATABASE_URL = os.getenv('DATABASE_URL')

conn = psycopg2.connect(DATABASE_URL)
cur = conn.cursor()

# Insert dataset
insert_sql = """
INSERT INTO datasets (
    dataset_name,
    description,
    full_citation,
    publication_year,
    publication_journal,
    publication_volume_pages,
    doi,
    pdf_filename,
    pdf_url,
    supplementary_files_url,
    study_location,
    mineral_analyzed,
    sample_count,
    age_range_min_ma,
    age_range_max_ma,
    authors,
    laboratory,
    created_at
) VALUES (
    %s, %s, %s, %s, %s, %s, %s, %s, %s, %s,
    %s, %s, %s, %s, %s, %s, %s, NOW()
)
RETURNING id;
"""

cur.execute(insert_sql, (
    dataset_name,
    description,
    full_citation,
    publication_year,
    publication_journal,
    publication_volume_pages,
    doi,
    pdf_filename,
    pdf_url,
    supplementary_files_url,
    study_location,
    mineral_analyzed,
    sample_count,
    age_range_min_ma,
    age_range_max_ma,
    authors,
    laboratory
))

dataset_id = cur.fetchone()[0]
conn.commit()

print(f'✅ Created dataset record: ID = {dataset_id}')
print(f'   Name: {dataset_name}')
print()
```

**Output:**
- `dataset_id` - Integer ID of newly created dataset
- `conn`, `cur` - Database connection (keep open for later inserts)

---

## File Type Standards

**CRITICAL:** All file types use centralized constants from `lib/constants/file-types.ts`

**Supported File Types:**
- `FILE_TYPES.PDF` = 'pdf' - PDF documents
- `FILE_TYPES.CSV` = 'csv' - CSV data files
- `FILE_TYPES.IMAGE_PNG` = 'image/png' - PNG images (tables, figures)
- `FILE_TYPES.IMAGE_JPG` = 'image/jpeg' - JPEG images
- `FILE_TYPES.IMAGE_TIFF` = 'image/tiff' - TIFF images

**Why Centralized Constants:**
- ✅ Prevents UI/database mismatches
- ✅ Single source of truth
- ✅ Type safety with TypeScript
- ✅ Consistent across upload scripts and display components

**Used By:**
- `/thermoload` script (`scripts/db/load-dataset-from-paper.ts`)
- Download section component (`components/datasets/DownloadSection.tsx`)
- Any future file upload functionality

---

## Step 3: Upload Files to Public Directory

**Task:** Copy PDF, CSVs, and images to `public/data/datasets/[dataset-id]/`

**Process:**

```python
import shutil

print('━' * 80)
print('STEP 3: UPLOADING FILES')
print('━' * 80)
print()

# Create dataset directory
dataset_dir = Path(f'public/data/datasets/{dataset_id}')
dataset_dir.mkdir(parents=True, exist_ok=True)

uploaded_files = []

# 3.1: Upload PDF
print('📄 Uploading PDF...')
pdf_files = list(paper_path.glob('*.pdf'))
if pdf_files:
    pdf_source = pdf_files[0]  # Take first PDF
    pdf_dest = dataset_dir / pdf_source.name
    shutil.copy2(pdf_source, pdf_dest)

    pdf_size = pdf_dest.stat().st_size
    uploaded_files.append({
        'type': 'pdf',
        'source': pdf_source,
        'dest': pdf_dest,
        'size': pdf_size
    })
    print(f'   ✅ {pdf_source.name} ({pdf_size / 1024 / 1024:.2f} MB)')
else:
    print(f'   ⚠️  No PDF found in {paper_path}')

print()

# 3.2: Upload CSVs
print('📊 Uploading extracted CSVs...')
csv_dir = dataset_dir / 'csv'
csv_dir.mkdir(exist_ok=True)

csv_files = list(extracted_dir.glob('*.csv')) if extracted_dir.exists() else []
for csv_file in csv_files:
    csv_dest = csv_dir / csv_file.name
    shutil.copy2(csv_file, csv_dest)

    csv_size = csv_dest.stat().st_size
    # Count rows
    with open(csv_dest, 'r') as f:
        row_count = sum(1 for line in f) - 1  # Exclude header

    uploaded_files.append({
        'type': 'csv',
        'source': csv_file,
        'dest': csv_dest,
        'size': csv_size,
        'rows': row_count
    })
    print(f'   ✅ {csv_file.name} ({row_count} rows, {csv_size / 1024:.1f} KB)')

print(f'   Total CSVs: {len(csv_files)}')
print()

# 3.3: Upload table images
print('🖼️  Uploading table screenshots...')
tables_dir = dataset_dir / 'tables'
tables_dir.mkdir(exist_ok=True)

images_tables_path = paper_path / 'images' / 'tables'
table_images = list(images_tables_path.glob('*.png')) if images_tables_path.exists() else []
for img_file in table_images:
    img_dest = tables_dir / img_file.name
    shutil.copy2(img_file, img_dest)

    img_size = img_dest.stat().st_size
    uploaded_files.append({
        'type': 'image/png',
        'source': img_file,
        'dest': img_dest,
        'size': img_size,
        'description': 'Table screenshot'
    })
    print(f'   ✅ {img_file.name} ({img_size / 1024:.1f} KB)')

print(f'   Total table images: {len(table_images)}')
print()

# 3.4: Upload figure images
print('📈 Uploading figure images...')
figures_dir = dataset_dir / 'figures'
figures_dir.mkdir(exist_ok=True)

images_figures_path = paper_path / 'images' / 'figures'
figure_images = list(images_figures_path.glob('*.png')) if images_figures_path.exists() else []
for img_file in figure_images:
    img_dest = figures_dir / img_file.name
    shutil.copy2(img_file, img_dest)

    img_size = img_dest.stat().st_size
    uploaded_files.append({
        'type': 'image/png',
        'source': img_file,
        'dest': img_dest,
        'size': img_size,
        'description': 'Figure'
    })
    print(f'   ✅ {img_file.name} ({img_size / 1024:.1f} KB)')

print(f'   Total figures: {len(figure_images)}')
print()

total_size = sum(f['size'] for f in uploaded_files)
print(f'📦 Total files uploaded: {len(uploaded_files)} ({total_size / 1024 / 1024:.2f} MB)')
print()
```

**Output:**
- `uploaded_files` - List of dicts with file metadata
- Files copied to `public/data/datasets/[dataset-id]/`

---

## Step 4: Track Files in Database

**Task:** Insert records into `data_files` table for all uploaded files

**Process:**

```python
print('━' * 80)
print('STEP 4: TRACKING FILES IN DATABASE')
print('━' * 80)
print()

file_insert_sql = """
INSERT INTO data_files (
    dataset_id,
    file_name,
    file_path,
    file_type,
    display_name,
    file_size_bytes,
    row_count,
    description,
    created_at,
    updated_at
) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, NOW(), NOW());
"""

for file_info in uploaded_files:
    file_name = file_info['dest'].name
    file_path = str(file_info['dest'].relative_to(Path('public')))  # Relative to public/
    file_type = file_info['type']
    file_size = file_info['size']
    row_count = file_info.get('rows', None)
    description = file_info.get('description', None)

    # Display name based on type
    if file_type == 'pdf':
        display_name = 'Full Paper (PDF)'
    elif file_type == 'csv':
        # Clean up CSV name for display
        display_name = file_name.replace('_extracted.csv', '').replace('_', ' ').title()
    else:
        display_name = file_name

    cur.execute(file_insert_sql, (
        dataset_id,
        file_name,
        file_path,
        file_type,
        display_name,
        file_size,
        row_count,
        description
    ))

conn.commit()

print(f'✅ Tracked {len(uploaded_files)} files in data_files table')
print()
```

**Output:**
- File records inserted into `data_files` table

---

## Step 5: Perform FAIR Analysis

**Task:** Analyze extracted CSVs against Kohn 2024 standards and calculate FAIR score

**Process:**

```python
import pandas as pd
import json

print('━' * 80)
print('STEP 5: PERFORMING FAIR ANALYSIS')
print('━' * 80)
print()

# Load field mapping from transform-fair-csv-headers.ts
# (Simplified - in real implementation, import the actual mapping)
EARTHBANK_FIELDS = {
    'samples': [
        'sampleID', 'IGSN', 'latitude', 'longitude', 'elevationM',
        'lithology', 'mineral', 'datasetID'
    ],
    'ft_datapoints': [
        'datapointName', 'sampleID', 'centralAgeMa', 'pooledAgeMa',
        'dispersion', 'pChi2', 'nGrains', 'uPpm', 'dPar', 'mtl'
    ],
    'ft_track_lengths': [
        'grainName', 'trackID', 'lengthUm', 'cAxisAngleDeg', 'dPar'
    ],
    'he_datapoints': [
        'datapointName', 'sampleID', 'correctedHeAge', 'uncorrectedHeAge',
        'ft', 'uConcentration', 'thConcentration', 'eU'
    ]
}

# Analyze each CSV
fair_data = {
    'dataset_name': dataset_name,
    'assessment_date': datetime.now().isoformat(),
    'kohn_2024_compliance': {},
    'fair_categories': {},
    'summary': {},
    'strengths': [],
    'gaps': []
}

# Table 4: Sample Metadata (max 15 points)
print('📋 Analyzing Table 4: Sample Metadata...')
sample_csvs = [f for f in csv_files if 'sample' in f.name.lower()]
if sample_csvs:
    sample_df = pd.read_csv(csv_dir / sample_csvs[0].name)
    sample_cols = set(sample_df.columns)

    # Check for required fields
    required_fields = {'sampleID', 'IGSN', 'latitude', 'longitude', 'elevationM', 'lithology', 'mineral'}
    present_fields = required_fields.intersection(sample_cols)

    table4_score = int((len(present_fields) / len(required_fields)) * 15)
    table4_pct = (len(present_fields) / len(required_fields)) * 100

    fair_data['kohn_2024_compliance']['table_4_samples'] = {
        'applicable': True,
        'score': table4_score,
        'max_score': 15,
        'percentage': table4_pct,
        'present_fields': list(present_fields),
        'missing_fields': list(required_fields - present_fields)
    }

    print(f'   Score: {table4_score}/15 ({table4_pct:.0f}%)')
    print(f'   Present: {", ".join(present_fields)}')
    if required_fields - present_fields:
        print(f'   Missing: {", ".join(required_fields - present_fields)}')
else:
    fair_data['kohn_2024_compliance']['table_4_samples'] = {
        'applicable': False,
        'score': 0,
        'max_score': 15
    }
    print('   ⚠️  No sample data found')

print()

# Table 5: FT Count Data (max 15 points)
print('📋 Analyzing Table 5: FT Count Data...')
ft_csvs = [f for f in csv_files if 'ft' in f.name.lower() and 'count' in f.name.lower()]
if ft_csvs:
    ft_df = pd.read_csv(csv_dir / ft_csvs[0].name)
    ft_cols = set(ft_df.columns)

    required_fields = {'Ns', 'Ni', 'Nd', 'rhoS', 'rhoI', 'uPpm'}
    present_fields = required_fields.intersection(ft_cols)

    table5_score = int((len(present_fields) / len(required_fields)) * 15)
    table5_pct = (len(present_fields) / len(required_fields)) * 100

    fair_data['kohn_2024_compliance']['table_5_ft_counts'] = {
        'applicable': True,
        'score': table5_score,
        'max_score': 15,
        'percentage': table5_pct,
        'present_fields': list(present_fields),
        'missing_fields': list(required_fields - present_fields)
    }

    print(f'   Score: {table5_score}/15 ({table5_pct:.0f}%)')
else:
    fair_data['kohn_2024_compliance']['table_5_ft_counts'] = {
        'applicable': False,
        'score': 0,
        'max_score': 15
    }
    print('   ⚠️  No FT count data found')

print()

# Table 6: Track Length Data (max 10 points)
print('📋 Analyzing Table 6: Track Length Data...')
length_csvs = [f for f in csv_files if 'track' in f.name.lower() or 'length' in f.name.lower()]
if length_csvs:
    length_df = pd.read_csv(csv_dir / length_csvs[0].name)
    length_cols = set(length_df.columns)

    required_fields = {'lengthUm', 'cAxisAngleDeg', 'dPar'}
    present_fields = required_fields.intersection(length_cols)

    table6_score = int((len(present_fields) / len(required_fields)) * 10)
    table6_pct = (len(present_fields) / len(required_fields)) * 100

    fair_data['kohn_2024_compliance']['table_6_track_lengths'] = {
        'applicable': True,
        'score': table6_score,
        'max_score': 10,
        'percentage': table6_pct,
        'present_fields': list(present_fields),
        'missing_fields': list(required_fields - present_fields)
    }

    print(f'   Score: {table6_score}/10 ({table6_pct:.0f}%)')
else:
    fair_data['kohn_2024_compliance']['table_6_track_lengths'] = {
        'applicable': False,
        'score': 0,
        'max_score': 10
    }
    print('   ⚠️  No track length data found')

print()

# Table 10: FT Ages (max 10 points)
print('📋 Analyzing Table 10: FT Ages...')
age_csvs = [f for f in csv_files if 'age' in f.name.lower() or 'datapoint' in f.name.lower()]
if age_csvs:
    age_df = pd.read_csv(csv_dir / age_csvs[0].name)
    age_cols = set(age_df.columns)

    required_fields = {'centralAgeMa', 'pooledAgeMa', 'dispersion', 'pChi2'}
    present_fields = required_fields.intersection(age_cols)

    table10_score = int((len(present_fields) / len(required_fields)) * 10)
    table10_pct = (len(present_fields) / len(required_fields)) * 100

    fair_data['kohn_2024_compliance']['table_10_ft_ages'] = {
        'applicable': True,
        'score': table10_score,
        'max_score': 10,
        'percentage': table10_pct,
        'present_fields': list(present_fields),
        'missing_fields': list(required_fields - present_fields)
    }

    print(f'   Score: {table10_score}/10 ({table10_pct:.0f}%)')
else:
    fair_data['kohn_2024_compliance']['table_10_ft_ages'] = {
        'applicable': False,
        'score': 0,
        'max_score': 10
    }
    print('   ⚠️  No age data found')

print()

# Calculate FAIR category scores (25 points each)
print('📊 Calculating FAIR category scores...')

# Findable (25 points)
findable_score = 25  # Start with full points
findable_reasons = []
if not doi:
    findable_score -= 5
    findable_reasons.append('Missing DOI (-5)')
if not authors:
    findable_score -= 5
    findable_reasons.append('Missing authors (-5)')
if not full_citation:
    findable_score -= 5
    findable_reasons.append('Missing citation (-5)')

fair_data['fair_categories']['findable'] = {
    'score': findable_score,
    'max_score': 25,
    'percentage': (findable_score / 25) * 100,
    'reasoning': '; '.join(findable_reasons) if findable_reasons else 'Complete metadata present'
}
print(f'   Findable: {findable_score}/25')

# Accessible (25 points)
accessible_score = 25
accessible_reasons = []
if not pdf_url:
    accessible_score -= 10
    accessible_reasons.append('No PDF URL (-10)')
if not len(csv_files):
    accessible_score -= 15
    accessible_reasons.append('No data files (-15)')

fair_data['fair_categories']['accessible'] = {
    'score': accessible_score,
    'max_score': 25,
    'percentage': (accessible_score / 25) * 100,
    'reasoning': '; '.join(accessible_reasons) if accessible_reasons else 'Data fully accessible'
}
print(f'   Accessible: {accessible_score}/25')

# Interoperable (25 points) - Based on EarthBank schema compliance
interop_score = int((len(csv_files) / max(len(csv_files), 1)) * 25)  # Simplified
fair_data['fair_categories']['interoperable'] = {
    'score': interop_score,
    'max_score': 25,
    'percentage': (interop_score / 25) * 100,
    'reasoning': f'{len(csv_files)} EarthBank-compatible CSV files present'
}
print(f'   Interoperable: {interop_score}/25')

# Reusable (25 points) - Based on provenance and documentation
reusable_score = 25
reusable_reasons = []
if not laboratory:
    reusable_score -= 5
    reusable_reasons.append('Missing laboratory (-5)')
if not study_location:
    reusable_score -= 5
    reusable_reasons.append('Missing study location (-5)')

fair_data['fair_categories']['reusable'] = {
    'score': reusable_score,
    'max_score': 25,
    'percentage': (reusable_score / 25) * 100,
    'reasoning': '; '.join(reusable_reasons) if reusable_reasons else 'Complete provenance metadata'
}
print(f'   Reusable: {reusable_score}/25')

print()

# Calculate total score
total_score = findable_score + accessible_score + interop_score + reusable_score

# Assign grade
if total_score >= 90:
    grade = 'A'
elif total_score >= 80:
    grade = 'B'
elif total_score >= 70:
    grade = 'C'
elif total_score >= 60:
    grade = 'D'
else:
    grade = 'F'

fair_data['summary'] = {
    'total_score': total_score,
    'max_score': 100,
    'percentage': total_score,
    'grade': grade
}

print(f'━' * 40)
print(f'📊 TOTAL FAIR SCORE: {total_score}/100 (Grade {grade})')
print(f'━' * 40)
print()

# Identify strengths and gaps
if total_score >= 90:
    fair_data['strengths'].append('Excellent FAIR compliance across all categories')
if findable_score == 25:
    fair_data['strengths'].append('Complete findability metadata (DOI, authors, citation)')
if accessible_score == 25:
    fair_data['strengths'].append('Data fully accessible with PDF and data files')
if len(csv_files) > 5:
    fair_data['strengths'].append(f'Rich dataset with {len(csv_files)} data tables')

if not doi:
    fair_data['gaps'].append('Add DOI for persistent identification')
if not pdf_url:
    fair_data['gaps'].append('Provide PDF URL for paper access')
if table4_score < 12:
    fair_data['gaps'].append('Improve sample metadata completeness (IGSN, location)')

# Save fair-compliance.json
fair_json_path = paper_path / 'fair-compliance.json'
with open(fair_json_path, 'w') as f:
    json.dump(fair_data, f, indent=2)

print(f'✅ Saved FAIR analysis: {fair_json_path}')
print()
```

**Output:**
- `fair_data` - Dictionary with complete FAIR assessment
- `fair-compliance.json` - Saved to paper directory
- `total_score`, `grade` - Overall FAIR metrics

---

## Step 6: Generate FAIR Report

**Task:** Create human-readable `extraction-report.md` with FAIR assessment

**Process:**

```python
print('━' * 80)
print('STEP 6: GENERATING FAIR REPORT')
print('━' * 80)
print()

report_path = paper_path / 'extraction-report.md'

with open(report_path, 'w') as f:
    f.write(f'# FAIR Assessment Report: {dataset_name}\n\n')
    f.write(f'**Generated:** {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}\n\n')
    f.write('---\n\n')

    # Executive Summary
    f.write('## Executive Summary\n\n')
    f.write(f'**FAIR Score:** {total_score}/100 (Grade {grade})\n\n')
    f.write(f'**Dataset:** {dataset_name}\n')
    f.write(f'**Citation:** {full_citation}\n\n')

    # FAIR Category Breakdown
    f.write('## FAIR Assessment\n\n')
    f.write('| Category | Score | Percentage |\n')
    f.write('|----------|-------|------------|\n')
    f.write(f'| Findable | {findable_score}/25 | {findable_score/25*100:.0f}% |\n')
    f.write(f'| Accessible | {accessible_score}/25 | {accessible_score/25*100:.0f}% |\n')
    f.write(f'| Interoperable | {interop_score}/25 | {interop_score/25*100:.0f}% |\n')
    f.write(f'| Reusable | {reusable_score}/25 | {reusable_score/25*100:.0f}% |\n')
    f.write(f'| **TOTAL** | **{total_score}/100** | **{total_score}%** |\n\n')

    # Kohn 2024 Compliance
    f.write('## Kohn et al. (2024) Compliance\n\n')
    f.write('| Table | Description | Score | Percentage |\n')
    f.write('|-------|-------------|-------|------------|\n')

    for table_key, table_data in fair_data['kohn_2024_compliance'].items():
        if table_data['applicable']:
            table_name = table_key.replace('_', ' ').title()
            f.write(f'| {table_name} | | {table_data["score"]}/{table_data["max_score"]} | {table_data["percentage"]:.0f}% |\n')

    f.write('\n')

    # Data Inventory
    f.write('## Data Inventory\n\n')
    f.write(f'- **Samples:** {sample_count if sample_count else "Unknown"}\n')
    f.write(f'- **CSV Files:** {len(csv_files)}\n')
    f.write(f'- **Table Images:** {len(table_images)}\n')
    f.write(f'- **Figure Images:** {len(figure_images)}\n')
    f.write(f'- **Total File Size:** {total_size / 1024 / 1024:.2f} MB\n\n')

    # Strengths
    if fair_data['strengths']:
        f.write('## Strengths\n\n')
        for strength in fair_data['strengths']:
            f.write(f'- {strength}\n')
        f.write('\n')

    # Gaps
    if fair_data['gaps']:
        f.write('## Areas for Improvement\n\n')
        for gap in fair_data['gaps']:
            f.write(f'- {gap}\n')
        f.write('\n')

    # References
    f.write('## References\n\n')
    f.write('- **Kohn et al. (2024)** - Reporting standards for thermochronology data. GSA Bulletin.\n')
    f.write('- **Nixon et al. (2025)** - EarthBank: A FAIR platform for geological data. Chemical Geology.\n')

print(f'✅ Generated FAIR report: {report_path}')
print()
```

**Output:**
- `extraction-report.md` - Human-readable FAIR report

---

## Step 7: Update Database with FAIR Scores

**Task:** Insert FAIR score breakdown into `fair_score_breakdown` table and update dataset

**Process:**

```python
print('━' * 80)
print('STEP 7: UPDATING DATABASE WITH FAIR SCORES')
print('━' * 80)
print()

# Insert fair_score_breakdown
fair_insert_sql = """
INSERT INTO fair_score_breakdown (
    dataset_id,
    total_score,
    grade,
    findable_score,
    findable_reasoning,
    accessible_score,
    accessible_reasoning,
    interoperable_score,
    interoperable_reasoning,
    reusable_score,
    reusable_reasoning,
    table4_score,
    table4_reasoning,
    table5_score,
    table5_reasoning,
    table6_score,
    table6_reasoning,
    table10_score,
    table10_reasoning,
    created_at,
    updated_at
) VALUES (
    %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s,
    %s, %s, %s, %s, %s, %s, %s, %s, NOW(), NOW()
);
"""

cur.execute(fair_insert_sql, (
    dataset_id,
    total_score,
    grade,
    findable_score,
    fair_data['fair_categories']['findable']['reasoning'],
    accessible_score,
    fair_data['fair_categories']['accessible']['reasoning'],
    interop_score,
    fair_data['fair_categories']['interoperable']['reasoning'],
    reusable_score,
    fair_data['fair_categories']['reusable']['reasoning'],
    fair_data['kohn_2024_compliance'].get('table_4_samples', {}).get('score', None),
    ', '.join(fair_data['kohn_2024_compliance'].get('table_4_samples', {}).get('missing_fields', [])),
    fair_data['kohn_2024_compliance'].get('table_5_ft_counts', {}).get('score', None),
    ', '.join(fair_data['kohn_2024_compliance'].get('table_5_ft_counts', {}).get('missing_fields', [])),
    fair_data['kohn_2024_compliance'].get('table_6_track_lengths', {}).get('score', None),
    ', '.join(fair_data['kohn_2024_compliance'].get('table_6_track_lengths', {}).get('missing_fields', [])),
    fair_data['kohn_2024_compliance'].get('table_10_ft_ages', {}).get('score', None),
    ', '.join(fair_data['kohn_2024_compliance'].get('table_10_ft_ages', {}).get('missing_fields', []))
))

# Update dataset with fair_score
update_dataset_sql = """
UPDATE datasets
SET fair_score = %s
WHERE id = %s;
"""

cur.execute(update_dataset_sql, (total_score, dataset_id))

conn.commit()

print(f'✅ Inserted FAIR score breakdown')
print(f'✅ Updated dataset.fair_score = {total_score}')
print()
```

**Output:**
- FAIR scores saved to database

---

## Step 8: Report Success

**Task:** Display summary and provide links to user

**Process:**

```python
print('━' * 80)
print('✅ DATASET LOAD COMPLETE')
print('━' * 80)
print()

print(f'📊 Dataset: {dataset_name}')
print(f'   ID: {dataset_id}')
print(f'   FAIR Score: {total_score}/100 (Grade {grade})')
print()

print(f'📁 Files Uploaded:')
print(f'   - PDFs: {len([f for f in uploaded_files if f["type"] == "pdf"])}')
print(f'   - CSVs: {len([f for f in uploaded_files if f["type"] == "csv"])}')
print(f'   - Images: {len([f for f in uploaded_files if f["type"] == "image/png"])}')
print(f'   - Total Size: {total_size / 1024 / 1024:.2f} MB')
print()

print(f'📈 FAIR Breakdown:')
print(f'   - Findable: {findable_score}/25')
print(f'   - Accessible: {accessible_score}/25')
print(f'   - Interoperable: {interop_score}/25')
print(f'   - Reusable: {reusable_score}/25')
print()

print(f'🌐 View Dataset:')
print(f'   - Overview: http://localhost:3000/datasets/{dataset_id}')
print(f'   - FAIR Assessment: http://localhost:3000/datasets/{dataset_id}/fair')
print(f'   - Data Files: http://localhost:3000/datasets/{dataset_id}/data')
print()

print(f'📄 Reports Generated:')
print(f'   - FAIR JSON: {fair_json_path}')
print(f'   - FAIR Report: {report_path}')
print()

print('🎯 Next Steps:')
print('   1. Review FAIR assessment at /datasets/{}/fair'.format(dataset_id))
print('   2. (Optional) Import CSV data to database with /thermoimport (future command)')
print('   3. Publish dataset to production')
print()

# Close database connection
cur.close()
conn.close()

print('━' * 80)
print()
```

**Output:**
- Summary report with links
- Database connection closed

---

## Success Criteria

After running `/thermoload`, the following should be true:

- [x] Dataset entry created in `datasets` table with all metadata
- [x] PDF uploaded to `public/data/datasets/[id]/`
- [x] All CSVs uploaded to `public/data/datasets/[id]/csv/`
- [x] All images uploaded to `public/data/datasets/[id]/tables|figures/`
- [x] All files tracked in `data_files` table
- [x] FAIR analysis complete with Kohn 2024 compliance scores
- [x] `fair-compliance.json` generated in paper directory
- [x] `extraction-report.md` generated (human-readable)
- [x] `fair_score_breakdown` record inserted
- [x] User can view dataset at `/datasets/[id]`
- [x] User can view FAIR assessment at `/datasets/[id]/fair`

---

## Important Notes

1. **NO CSV Data Import:** This command does NOT import CSV data to `earthbank_*` tables. That's a separate workflow.

2. **File Paths:** All file paths in `data_files` table are relative to `public/` directory.

3. **FAIR Scoring:** Simplified scoring based on field presence. Real implementation should use `lib/db/fair-compliance.ts` for comprehensive assessment.

4. **Error Handling:** Command should gracefully handle missing files and provide clear error messages.

5. **Database Schema:** Assumes `datasets`, `fair_score_breakdown`, and `data_files` tables exist with appropriate columns.

---

**Ready to load datasets!** Run `/thermoload` to populate the database with paper metadata and FAIR assessments.
