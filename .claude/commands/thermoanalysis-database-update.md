# Thermoanalysis Database Update Instructions

**Purpose:** Instructions for populating the database with complete paper metadata and FAIR scores after `/thermoanalysis` completion

**When to use:** After completing all analysis steps in `/thermoanalysis` command

---

## STEP 6: Populate Database with Paper Metadata and FAIR Scores

**Actions:**

### 6.1 Extract Metadata from Analysis Files

```python
import json
from pathlib import Path

print('━' * 60)
print('EXTRACTING METADATA FOR DATABASE POPULATION')
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
    # Extract scores from the markdown tables
    # (Regex patterns to extract score values)

    import re

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
        print('   Database will be populated with basic metadata only')

else:
    print('ℹ️  No extraction-report.md found (run /thermoextract to generate)')
    print('   Database will be populated with basic metadata only')

print()
```

### 6.2 Prepare SQL Script for Database Population

```python
import re

# Extract metadata from paper-index.md
full_citation = re.search(r'\*\*Full Citation:\*\*\s*(.+)', index_content)
authors_match = re.search(r'\*\*Authors:\*\*\s*(.+)', index_content)
year_match = re.search(r'\*\*Year:\*\*\s*(\d{4})', index_content)
journal_match = re.search(r'\*\*Journal:\*\*\s*(.+)', index_content)
volume_pages_match = re.search(r'\*\*Volume/Pages:\*\*\s*(.+)', index_content)
doi_match = re.search(r'\*\*DOI:\*\*\s*([^\s]+)', index_content)
location_match = re.search(r'\*\*Study Location:\*\*\s*(.+)', index_content)
mineral_match = re.search(r'\*\*Mineral Analyzed:\*\*\s*(\w+)', index_content)
sample_count_match = re.search(r'\*\*Sample Count:\*\*\s*(\d+)', index_content)
age_range_match = re.search(r'\*\*Age Range:\*\*\s*([\d.]+)\s*-\s*([\d.]+)\s*Ma', index_content)
paper_summary_match = re.search(r'## Executive Summary\n\n(.+?)\n\n', index_content, re.DOTALL)

# Build metadata dictionary
metadata = {
    'full_citation': full_citation.group(1).strip() if full_citation else None,
    'authors': authors_match.group(1).strip().split(', ') if authors_match else [],
    'publication_year': int(year_match.group(1)) if year_match else None,
    'publication_journal': journal_match.group(1).strip() if journal_match else None,
    'publication_volume_pages': volume_pages_match.group(1).strip() if volume_pages_match else None,
    'doi': doi_match.group(1).strip() if doi_match else None,
    'study_location': location_match.group(1).strip() if location_match else None,
    'mineral_analyzed': mineral_match.group(1).strip().lower() if mineral_match else None,
    'sample_count': int(sample_count_match.group(1)) if sample_count_match else None,
    'age_range_min_ma': float(age_range_match.group(1)) if age_range_match else None,
    'age_range_max_ma': float(age_range_match.group(2)) if age_range_match else None,
    'paper_summary': paper_summary_match.group(1).strip() if paper_summary_match else None,
    'pdf_filename': pdf_path.name,
    'pdf_url': f'/api/datasets/{{dataset_id}}/files/pdf/main-paper'  # Will be replaced with actual dataset_id
}

# Generate SQL update script
sql_script = paper_dir / 'update-database-metadata.sql'

with open(sql_script, 'w') as f:
    f.write(f"-- Database metadata update for {dataset_name}\n")
    f.write(f"-- Generated by /thermoanalysis command\n")
    f.write(f"-- Run with: psql \"$DATABASE_URL\" -f {sql_script}\n\n")

    f.write("-- Update datasets table\n")
    f.write("UPDATE datasets SET\n")

    if metadata['full_citation']:
        f.write(f"  full_citation = '{metadata['full_citation'].replace(\"'\", \"''\")}',\n")
    if metadata['publication_year']:
        f.write(f"  publication_year = {metadata['publication_year']},\n")
    if metadata['publication_journal']:
        f.write(f"  publication_journal = '{metadata['publication_journal'].replace(\"'\", \"''\")}',\n")
    if metadata['publication_volume_pages']:
        f.write(f"  publication_volume_pages = '{metadata['publication_volume_pages'].replace(\"'\", \"''\")}',\n")
    if metadata['study_location']:
        f.write(f"  study_location = '{metadata['study_location'].replace(\"'\", \"''\")}',\n")
    if metadata['pdf_filename']:
        f.write(f"  pdf_filename = '{metadata['pdf_filename']}',\n")
    if metadata['mineral_analyzed']:
        f.write(f"  mineral_analyzed = '{metadata['mineral_analyzed']}',\n")
    if metadata['sample_count']:
        f.write(f"  sample_count = {metadata['sample_count']},\n")
    if metadata['age_range_min_ma']:
        f.write(f"  age_range_min_ma = {metadata['age_range_min_ma']},\n")
    if metadata['age_range_max_ma']:
        f.write(f"  age_range_max_ma = {metadata['age_range_max_ma']},\n")
    if metadata['paper_summary']:
        summary_escaped = metadata['paper_summary'].replace("'", "''").replace("\n", " ")
        f.write(f"  paper_summary = '{summary_escaped}',\n")

    f.write("  last_modified_date = CURRENT_DATE\n")
    f.write("WHERE dataset_name LIKE '%DATASET_NAME%';  -- REPLACE WITH ACTUAL DATASET NAME\n\n")

    # Add FAIR score breakdown if available
    if fair_breakdown_data:
        f.write("-- Insert FAIR score breakdown\n")
        f.write("INSERT INTO fair_score_breakdown (\n")
        f.write("  dataset_id,\n")
        f.write("  table4_score, table5_score, table6_score, table10_score,\n")
        f.write("  findable_score, accessible_score, interoperable_score, reusable_score,\n")
        f.write("  total_score, grade\n")
        f.write(") VALUES (\n")
        f.write("  (SELECT id FROM datasets WHERE dataset_name LIKE '%DATASET_NAME%'),  -- REPLACE\n")
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

    f.write("-- Verify the update\n")
    f.write("SELECT id, dataset_name, publication_year, publication_journal, study_location, ")
    f.write("mineral_analyzed, sample_count, age_range_min_ma, age_range_max_ma\n")
    f.write("FROM datasets\n")
    f.write("WHERE dataset_name LIKE '%DATASET_NAME%';\n\n")  # REPLACE

    if fair_breakdown_data:
        f.write("-- Verify FAIR score\n")
        f.write("SELECT dataset_id, table4_score, table5_score, table6_score, table10_score, ")
        f.write("findable_score, accessible_score, interoperable_score, reusable_score, total_score, grade\n")
        f.write("FROM fair_score_breakdown\n")
        f.write("WHERE dataset_id = (SELECT id FROM datasets WHERE dataset_name LIKE '%DATASET_NAME%');\n")

print(f'✅ Created SQL script: {sql_script}')
print()
print('📋 Next steps to populate database:')
print('   1. Edit the SQL script and replace %DATASET_NAME% with the actual dataset name')
print('   2. Run: psql "$DATABASE_URL" -f update-database-metadata.sql')
print('   3. Or manually run the SQL statements in your database client')
print()
```

### 6.3 Populate data_files Table

```python
# Generate SQL for data_files table
files_sql = paper_dir / 'populate-data-files.sql'

with open(files_sql, 'w') as f:
    f.write("-- Populate data_files table with extracted files\n")
    f.write(f"-- Dataset: {dataset_name}\n\n")

    # Get list of all files created
    raw_files = list((paper_dir / 'RAW').glob('*.csv')) if (paper_dir / 'RAW').exists() else []
    fair_files = list((paper_dir / 'FAIR').glob('*.csv')) if (paper_dir / 'FAIR').exists() else []
    pdf_files = [pdf_path]

    dataset_id_placeholder = '(SELECT id FROM datasets WHERE dataset_name LIKE \'%DATASET_NAME%\')'

    # Insert RAW files
    for file_path in raw_files:
        file_size = file_path.stat().st_size
        file_name = file_path.name
        relative_path = f'/build-data/learning/thermo-papers/{dataset_name}/RAW/{file_name}'

        f.write(f"INSERT INTO data_files (dataset_id, file_name, file_path, file_type, file_size_bytes)\n")
        f.write(f"VALUES ({dataset_id_placeholder}, '{file_name}', '{relative_path}', 'RAW', {file_size})\n")
        f.write(f"ON CONFLICT DO NOTHING;\n\n")

    # Insert FAIR files
    for file_path in fair_files:
        file_size = file_path.stat().st_size
        file_name = file_path.name
        relative_path = f'/build-data/learning/thermo-papers/{dataset_name}/FAIR/{file_name}'

        f.write(f"INSERT INTO data_files (dataset_id, file_name, file_path, file_type, file_size_bytes)\n")
        f.write(f"VALUES ({dataset_id_placeholder}, '{file_name}', '{relative_path}', 'EarthBank', {file_size})\n")
        f.write(f"ON CONFLICT DO NOTHING;\n\n")

    # Insert PDF
    file_size = pdf_path.stat().st_size
    file_name = pdf_path.name
    relative_path = f'/build-data/learning/thermo-papers/{dataset_name}/{file_name}'

    f.write(f"INSERT INTO data_files (dataset_id, file_name, file_path, file_type, file_size_bytes, display_name)\n")
    f.write(f"VALUES ({dataset_id_placeholder}, '{file_name}', '{relative_path}', 'PDF', {file_size}, 'Main Paper PDF')\n")
    f.write(f"ON CONFLICT DO NOTHING;\n\n")

    # Insert images folder as folder entry
    images_dir = paper_dir / 'images'
    if images_dir.exists():
        relative_path = f'/build-data/learning/thermo-papers/{dataset_name}/images'
        f.write(f"INSERT INTO data_files (dataset_id, file_name, file_path, file_type, is_folder, folder_path, display_name)\n")
        f.write(f"VALUES ({dataset_id_placeholder}, 'images-archive', '{relative_path}', 'Images', TRUE, '{relative_path}', 'Extracted Figures')\n")
        f.write(f"ON CONFLICT DO NOTHING;\n\n")

print(f'✅ Created data files SQL script: {files_sql}')
print()
```

---

## Summary

After running `/thermoanalysis`, you'll have two SQL scripts:
1. `update-database-metadata.sql` - Updates dataset metadata and FAIR scores
2. `populate-data-files.sql` - Populates the data_files table

**Manual steps required:**
1. Replace `%DATASET_NAME%` placeholders with actual dataset name
2. Run both SQL scripts against the database
3. Verify the data was populated correctly

**Future enhancement:** Automate this by adding a parameter to `/thermoanalysis` for the dataset ID
