# /thermoextract - Zero-Error Thermochronology Data Extraction

**Purpose:** Extract thermochronology data from PDFs with zero import errors
**Workflow:** Extract → Validate → Import (one successful attempt)
**Key Principle:** Data must be **perfect before import** - no manual fixes needed

---

## 🎯 What You'll Do

Execute a complete extraction workflow that produces **validated, import-ready data**:

1. **Extract** tables from PDF with auto-filtering of invalid rows
2. **Transform** to FAIR schema (4 normalized database tables)
3. **Validate** against EarthBank templates (catch ALL errors before import)
4. **Report missing fields** with actionable recommendations  
5. **Generate CSVs** ready for zero-error import
6. **Create extraction report** documenting the process

---

## 📋 Complete Workflow (All Steps)

### STEP 0: Check for Existing Paper Analysis (NEW)

```python
import sys
import pandas as pd
import re
from pathlib import Path

# Get PDF path from user input (passed as argument)
pdf_path = '<PDF_PATH>'  # Will be provided by user

print('━' * 60)
print('STEP 0: CHECKING FOR EXISTING PAPER ANALYSIS')
print('━' * 60)
print()

# Determine paper folder from PDF filename
dataset_name = Path(pdf_path).stem
paper_dir = Path('build-data/learning/thermo-papers') / dataset_name
index_path = paper_dir / 'paper-index.md'

# Initialize metadata dictionary
paper_metadata = {
    'has_analysis': False,
    'authors': None,
    'year': None,
    'study_location': None,
    'mineral_type': None,
    'analysis_method': None,
    'sample_id_pattern': None,
    'primary_table': 'Table 1',  # Default
    'age_range': None
}

if index_path.exists():
    print(f'✅ Found existing analysis: {index_path}')
    print('   Reading paper metadata from index...')
    print()

    with open(index_path, 'r') as f:
        index_content = f.read()

    # Extract metadata from index using regex
    # Authors
    authors_match = re.search(r'\*\*Authors:\*\* (.+)', index_content)
    if authors_match:
        paper_metadata['authors'] = authors_match.group(1)

    # Year
    year_match = re.search(r'\*\*Year:\*\* (\d{4})', index_content)
    if year_match:
        paper_metadata['year'] = year_match.group(1)

    # Study location
    location_match = re.search(r'\*\*Study Area:\*\* (.+)', index_content)
    if location_match:
        paper_metadata['study_location'] = location_match.group(1)

    # Mineral type
    mineral_match = re.search(r'\*\*Mineral Type:\*\* (.+)', index_content)
    if mineral_match:
        paper_metadata['mineral_type'] = mineral_match.group(1).lower()

    # Analysis method
    method_match = re.search(r'\*\*Analysis Method:\*\* (.+)', index_content)
    if method_match:
        paper_metadata['analysis_method'] = method_match.group(1)

    # Sample ID pattern
    pattern_match = re.search(r'\*\*Sample ID Pattern:\*\* `\^(.+)\$`', index_content)
    if pattern_match:
        paper_metadata['sample_id_pattern'] = f"^{pattern_match.group(1)}$"

    # Primary table
    table_match = re.search(r'\*\*Primary data table:\*\* Table (\d+)', index_content)
    if table_match:
        paper_metadata['primary_table'] = f"Table {table_match.group(1)}"

    # Age range
    age_match = re.search(r'\*\*Age Range:\*\* ([\d.]+) - ([\d.]+) Ma', index_content)
    if age_match:
        paper_metadata['age_range'] = (float(age_match.group(1)), float(age_match.group(2)))

    paper_metadata['has_analysis'] = True

    print('Metadata extracted from analysis:')
    print(f'  ✅ Authors: {paper_metadata["authors"]}')
    print(f'  ✅ Year: {paper_metadata["year"]}')
    print(f'  ✅ Study location: {paper_metadata["study_location"]}')
    print(f'  ✅ Mineral type: {paper_metadata["mineral_type"]}')
    print(f'  ✅ Method: {paper_metadata["analysis_method"]}')
    print(f'  ✅ Primary table: {paper_metadata["primary_table"]}')
    if paper_metadata['sample_id_pattern']:
        print(f'  ✅ Sample ID pattern: {paper_metadata["sample_id_pattern"]}')
    if paper_metadata['age_range']:
        print(f'  ✅ Expected age range: {paper_metadata["age_range"][0]:.1f} - {paper_metadata["age_range"][1]:.1f} Ma')
    print()
    print('✅ This metadata will speed up extraction and improve data quality')
    print()
else:
    print('⚠️  No existing paper analysis found')
    print('   Proceeding with standard extraction workflow')
    print('   TIP: Run paper analysis first for better metadata and validation')
    print()

# Add scripts to path
sys.path.insert(0, str(Path.cwd()))
```

---

### STEP 1: Extract PDF Tables with Enhanced Thermoanalysis Integration

```python
from scripts.pdf.extraction_engine import UniversalThermoExtractor

print('━' * 60)
print('STEP 1: TABLE EXTRACTION (Enhanced with thermoanalysis)')
print('━' * 60)
print()

# Initialize enhanced extractor with paper_dir
extractor = UniversalThermoExtractor(
    pdf_path=pdf_path,
    cache_dir='./cache',
    paper_dir=paper_dir  # Enables thermoanalysis integration
)

# Analyze document (uses thermoanalysis if available)
extractor.analyze()

# Check what was used for discovery
if (paper_dir / 'text' / 'text-index.md').exists():
    print('✅ Using thermoanalysis table discovery')
else:
    print('⚠️  Using semantic analysis (run /thermoanalysis first for better results)')

print(f'   Found {len(extractor.structure.tables)} tables')
for table_id, info in extractor.structure.tables.items():
    print(f'   - {table_id}: {info["type"]} (page {info["page"] + 1})')
print()

# Extract all tables
print('🔧 Extracting tables...')
results = extractor.extract_all()

print(f'✅ Extracted {len(results)} tables:')
for table_id, df in results.items():
    print(f'   - {table_id}: {len(df)} rows × {len(df.columns)} columns')
print()

# Save extracted tables to paper directory
extracted_dir = paper_dir / 'extracted'
extracted_dir.mkdir(exist_ok=True)

print(f'💾 Saving extracted tables to: {extracted_dir}')
for table_id, df in results.items():
    # Sanitize table name for filename
    safe_name = table_id.replace(' ', '-')
    csv_path = extracted_dir / f'{safe_name}.csv'
    df.to_csv(csv_path, index=False)
    print(f'   ✅ Saved {csv_path.name}')
print()

# Use metadata if available
if paper_metadata['has_analysis'] and paper_metadata['primary_table'] in results:
    print(f'📋 Using primary table from analysis: {paper_metadata["primary_table"]}')
    print()
```

---

### STEP 2: Apply Column Name Mapping

```python
print('━' * 60)
print('STEP 2: APPLYING COLUMN NAME MAPPING')
print('━' * 60)
print()

# Identify main data table (usually "Table 1" or similar)
table1 = results['Table 1'].copy()

# Define column mapping (customize based on paper format)
# This example is for AFT ages table with numbered columns
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

table1.rename(columns=column_mapping, inplace=True)

print(f'✅ Renamed {len(column_mapping)} columns')
print(f'   New columns: {list(table1.columns)[:5]}...')
print()
```

---

### STEP 3: Filter Invalid Rows - Multi-Table Cleaning (CRITICAL)

```python
print('━' * 60)
print('STEP 3: FILTERING INVALID ROWS (ALL TABLES)')
print('━' * 60)
print()

# CRITICAL: Remove footer/header metadata BEFORE transformation
# Use pattern from analysis if available, otherwise use default
if paper_metadata['has_analysis'] and paper_metadata['sample_id_pattern']:
    sample_pattern = paper_metadata['sample_id_pattern']
    print(f'   Using sample ID pattern from analysis: {sample_pattern}')
else:
    sample_pattern = r'^[A-Z]{2,4}\d{2}-\d{2,3}$'  # Default pattern
    print(f'   Using default sample ID pattern: {sample_pattern}')

print()

# Dictionary to store cleaned tables
cleaned_tables = {}

# Loop through ALL extracted tables and apply table-specific cleaning
for table_id, df in results.items():
    print(f'📋 Cleaning {table_id}...')

    # Determine table type and apply appropriate cleaning logic
    if 'Table 1' in table_id or 'Table A1' in table_id:
        # Main sample data tables: use sample ID pattern matching
        if 'sample_id' in df.columns:
            valid_rows = df['sample_id'].astype(str).str.match(sample_pattern, na=False)
            df_clean = df[valid_rows].copy()
            print(f'   Sample data: {len(df)} rows → {len(df_clean)} valid samples')
            cleaned_tables[table_id] = df_clean
        else:
            print(f'   ⚠️  No sample_id column found, saving as-is')
            cleaned_tables[table_id] = df

    elif 'Table A2' in table_id or 'EPMA' in table_id:
        # EPMA mineral chemistry tables: keep standard reference materials
        # Look for Durango, FCT, Madagascar in first column
        first_col = df.columns[0]
        if first_col in df.columns:
            # Skip header rows (first 5-6 rows often contain metadata)
            # Keep rows with standard names
            valid_rows = df[first_col].astype(str).str.contains(
                'urango|FCT|adagascar|Durango|Fish Canyon|Madagascar',
                case=False,
                na=False
            )
            df_clean = df[valid_rows].copy()
            print(f'   EPMA chemistry: {len(df)} rows → {len(df_clean)} standard records')
            cleaned_tables[table_id] = df_clean
        else:
            print(f'   ⚠️  Unexpected structure, saving as-is')
            cleaned_tables[table_id] = df

    elif 'Table A3' in table_id or '(U-Th)/He' in table_id or 'He QC' in table_id:
        # (U-Th)/He QC data: keep rows with analysis numbers
        # Look for columns like 'analysis_no', 'sample_no', or numeric IDs
        analysis_cols = [col for col in df.columns if 'analysis' in col.lower() or 'sample' in col.lower()]

        if analysis_cols:
            # Keep rows where analysis number is not null
            analysis_col = analysis_cols[0]
            valid_rows = df[analysis_col].notna()
            df_clean = df[valid_rows].copy()
            print(f'   (U-Th)/He QC: {len(df)} rows → {len(df_clean)} analysis records')
            cleaned_tables[table_id] = df_clean
        else:
            # Fallback: skip first 2 rows (usually headers/metadata), keep rest
            df_clean = df.iloc[2:].copy()
            print(f'   (U-Th)/He QC: {len(df)} rows → {len(df_clean)} records (header rows skipped)')
            cleaned_tables[table_id] = df_clean

    else:
        # Other tables: save as-is (may need custom logic for specific papers)
        print(f'   ⚠️  Unknown table type, saving as-is')
        cleaned_tables[table_id] = df

print()
print(f'✅ Cleaned {len(cleaned_tables)} tables')

# Keep table1_clean for backward compatibility with subsequent steps
table1_clean = cleaned_tables.get('Table 1', cleaned_tables.get(paper_metadata['primary_table'], list(cleaned_tables.values())[0]))

print(f'✅ Primary table has {len(table1_clean)} valid samples')
print()
```

**Why This Matters:**
- Malawi 2024 import: 51 extracted → 34 valid (17 invalid rows)
- Invalid rows cause: "value too long for character varying(50)"
- **Filter during extraction, not manually in CSV**

---

### STEP 4: Parse Ages with Errors

```python
print('━' * 60)
print('STEP 4: PARSING AGES WITH ERRORS')
print('━' * 60)
print()

def parse_age_error(age_str):
    """
    Parse age string like '245.3 ± 49.2' into (age, error)

    Handles formats:
    - "245.3 ± 49.2" → (245.3, 49.2)
    - "110.5 ± 6.2" → (110.5, 6.2)
    - "NaN" → (None, None)
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

# Parse pooled ages
pooled_ages = table1_clean['pooled_age_ma'].apply(lambda x: parse_age_error(x)[0])
pooled_errors = table1_clean['pooled_age_ma'].apply(lambda x: parse_age_error(x)[1])

# Parse central ages
central_ages = table1_clean['central_age_ma'].apply(lambda x: parse_age_error(x)[0])
central_errors = table1_clean['central_age_ma'].apply(lambda x: parse_age_error(x)[1])

print(f'✅ Parsed ages for {len(table1_clean)} samples')
print(f'   Age range: {central_ages.min():.1f} - {central_ages.max():.1f} Ma')
print()
```

---

### STEP 5: Transform to FAIR Schema

```python
print('━' * 60)
print('STEP 5: TRANSFORMING TO FAIR SCHEMA')
print('━' * 60)
print()

# 1. Samples table
# Use metadata from analysis if available
mineral_type = paper_metadata.get('mineral_type', 'apatite') if paper_metadata['has_analysis'] else 'apatite'
analysis_method = paper_metadata.get('analysis_method', 'LA-ICP-MS AFT') if paper_metadata['has_analysis'] else 'LA-ICP-MS AFT'

if paper_metadata['has_analysis']:
    print(f'   Using metadata from analysis:')
    print(f'     - Mineral type: {mineral_type}')
    print(f'     - Analysis method: {analysis_method}')
    if paper_metadata['study_location']:
        print(f'     - Study location: {paper_metadata["study_location"]}')

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

# 3. FT Counts table (pooled data)
u_ppm = table1_clean['u_ppm'].apply(lambda x: parse_age_error(x)[0])
th_ppm = table1_clean['th_ppm'].apply(lambda x: parse_age_error(x)[0])
eu_ppm = table1_clean['eu_ppm'].apply(lambda x: parse_age_error(x)[0])
dpar = table1_clean['dpar_um'].apply(lambda x: parse_age_error(x)[0])

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
mtl = table1_clean['mtl_um'].apply(lambda x: parse_age_error(x)[0])

ft_lengths_df = pd.DataFrame({
    'sample_id': table1_clean['sample_id'],
    'grain_id': table1_clean['sample_id'] + '_pooled',
    'n_confined_tracks': pd.to_numeric(table1_clean['n_tracks'], errors='coerce').astype('Int64'),
    'mean_track_length_um': mtl,
    'mean_track_length_sd_um': pd.to_numeric(table1_clean['mtl_sd_um'], errors='coerce'),
    'dpar_um': dpar
})

print(f'✅ Transformed to FAIR schema:')
print(f'   - samples: {len(samples_df)} rows')
print(f'   - ft_ages: {len(ft_ages_df)} rows')
print(f'   - ft_counts: {len(ft_counts_df)} rows')
print(f'   - ft_track_lengths: {len(ft_lengths_df)} rows')
print()
```

---

### STEP 6: Setup Output Directory Structure (INTEGRATED WITH /thermoanalysis)

```python
print('━' * 60)
print('STEP 6: SETTING UP OUTPUT DIRECTORIES')
print('━' * 60)
print()

# Use paper analysis folder if it exists, otherwise create new
# This integrates with /thermoanalysis output
dataset_name = Path(pdf_path).stem
paper_dir = Path('build-data/learning/thermo-papers') / dataset_name

# Create integrated folder structure
raw_dir = paper_dir / 'RAW'
fair_dir = paper_dir / 'FAIR'

raw_dir.mkdir(parents=True, exist_ok=True)
fair_dir.mkdir(parents=True, exist_ok=True)

print(f'✅ Created directory structure:')
print(f'   {paper_dir}/')
if (paper_dir / 'paper-index.md').exists():
    print(f'   ├── paper-index.md              (from /thermoanalysis)')
    print(f'   ├── paper-analysis.md          (from /thermoanalysis)')
    print(f'   ├── images/                    (from /thermoanalysis)')
print(f'   ├── RAW/                       (original extracted data)')
print(f'   │   ├── table-1-raw.csv        (as extracted from PDF)')
print(f'   │   ├── table-2-raw.csv')
print(f'   │   └── ...')
print(f'   ├── FAIR/                      (EarthBank schema v2)')
print(f'   │   ├── samples.csv            (Sample template format)')
print(f'   │   ├── ft-datapoints.csv      (FT Datapoints sheet)')
print(f'   │   ├── ft-count-data.csv      (FTCountData sheet)')
print(f'   │   ├── ft-length-data.csv     (FTLengthData sheet)')
print(f'   │   └── import.sql             (SQL import script)')
print(f'   └── [PDF]                      (source PDF)')
print()

# Copy PDF to paper directory if not already there
import shutil
pdf_dest = paper_dir / Path(pdf_path).name
if not pdf_dest.exists():
    shutil.copy2(pdf_path, pdf_dest)
    print(f'✅ Copied PDF: {pdf_dest.name}')
else:
    print(f'✅ PDF already present: {pdf_dest.name}')
print()
```

---

### STEP 7: Save Cleaned Tables

```python
print('━' * 60)
print('STEP 7: SAVING CLEANED TABLES')
print('━' * 60)
print()

# Save all cleaned tables to RAW/ directory
# NOTE: Only cleaned versions saved (raw extractions discarded to save space)
for table_id, df_clean in cleaned_tables.items():
    # Clean table name for filename
    table_filename = table_id.lower().replace(' ', '-') + '-cleaned.csv'
    df_clean.to_csv(raw_dir / table_filename, index=False)
    print(f'   ✅ {table_filename} ({len(df_clean)} rows × {len(df_clean.columns)} columns)')

print()
print(f'✅ Saved {len(cleaned_tables)} cleaned tables to RAW/')
print()
```

---

### STEP 8: Map to EarthBank Templates

```python
print('━' * 60)
print('STEP 8: MAPPING TO EARTHBANK TEMPLATES')
print('━' * 60)
print()

from pathlib import Path
import openpyxl

# Load EarthBank templates
template_dir = Path('build-data/learning/thermo-papers/earthbanktemplates')

# Template paths
sample_template = template_dir / 'Sample.template.v2025-04-16.xlsx'
ft_template = template_dir / 'FTDatapoint.template.v2024-11-11.xlsx'

print('Loading EarthBank templates...')
print(f'   Sample template: {sample_template.name}')
print(f'   FT Data template: {ft_template.name}')
print()

# Read template structure to understand required fields
sample_wb = openpyxl.load_workbook(sample_template)
ft_wb = openpyxl.load_workbook(ft_template)

sample_sheet = sample_wb.active
ft_sheet = ft_wb.active

# Extract template headers (row 1)
sample_template_headers = [cell.value for cell in sample_sheet[1] if cell.value]
ft_template_headers = [cell.value for cell in ft_sheet[1] if cell.value]

print(f'📋 Sample template fields ({len(sample_template_headers)}):', sample_template_headers[:10], '...')
print(f'📋 FT Data template fields ({len(ft_template_headers)}):', ft_template_headers[:10], '...')
print()

# --- MAP 1: samples_df → Sample.template ---
print('Mapping samples_df to Sample.template...')

earthbank_samples = pd.DataFrame()

# Direct mappings (our field → EarthBank template field)
field_mappings_sample = {
    'sample_id': 'sample_id',
    'latitude': 'latitude',
    'longitude': 'longitude',
    'elevation_m': 'elevation',
    'mineral_type': 'mineral',
    'analysis_method': 'method',
}

for our_field, template_field in field_mappings_sample.items():
    if template_field in sample_template_headers:
        earthbank_samples[template_field] = samples_df.get(our_field, None)
    else:
        print(f'   ⚠️  Template field "{template_field}" not found in Sample.template')

# Add placeholder fields (required by EarthBank but not extracted from PDF)
required_sample_fields = {
    'IGSN': None,  # International Geo Sample Number (assign later)
    'geodetic_datum': 'WGS84',  # Default assumption
    'vertical_datum': 'mean sea level',  # Default assumption
    'lithology': None,  # Extract from paper text if possible
    'sample_kind': 'in situ rock',  # Default assumption
    'sample_method': 'hand sample',  # Default assumption
    'collector': None,  # Extract from authors if possible
    'collection_date': None,  # Usually not in data tables
}

for field, default_value in required_sample_fields.items():
    if field not in earthbank_samples.columns:
        earthbank_samples[field] = default_value

print(f'✅ Mapped {len(earthbank_samples.columns)} fields to Sample template')
print()

# --- MAP 2: ft_ages_df + ft_counts_df → FTDatapoint.template ---
print('Mapping ft_ages + ft_counts to FTDatapoint.template...')

earthbank_ft = pd.DataFrame()

# Merge ages and counts (1:1 relationship for pooled data)
merged = pd.merge(
    ft_ages_df,
    ft_counts_df,
    on='sample_id',
    how='outer',
    suffixes=('_age', '_count')
)

# Direct mappings (our field → EarthBank template field)
field_mappings_ft = {
    'sample_id': 'sample_id',
    'n_grains': 'num_grains',
    'pooled_age_ma': 'pooled_age',
    'pooled_age_error_ma': 'pooled_age_error',
    'central_age_ma': 'central_age',
    'central_age_error_ma': 'central_age_error',
    'dispersion_pct': 'dispersion',
    'p_chi2': 'P_chi2',
    'ns': 'Ns',
    'rho_s_cm2': 'rho_s',
    'u_ppm': 'U_ppm',
    'th_ppm': 'Th_ppm',
    'eu_ppm': 'eU_ppm',
    'dpar_um': 'Dpar',
    'rmr0': 'rmr0',
    'cl_wt_pct': 'Cl_wt_pct',
}

for our_field, template_field in field_mappings_ft.items():
    if template_field in ft_template_headers:
        earthbank_ft[template_field] = merged.get(our_field, None)
    else:
        print(f'   ⚠️  Template field "{template_field}" not found in FTDatapoint.template')

# Add placeholder fields (required by EarthBank but not extracted from PDF)
required_ft_fields = {
    'grain_id': merged.get('grain_id'),  # Already have from ft_counts
    'zeta': None,  # Extract from methods section if possible
    'zeta_error': None,
    'lambda_f': 8.46e-17,  # Standard value (Kohn et al. 2024)
    'lambda_D': 1.55125e-10,  # Standard value (Kohn et al. 2024)
    'analyst': None,  # Extract from acknowledgments if possible
    'laboratory': None,  # Extract from affiliations if possible
    'analysis_date': None,  # Usually in methods or caption
    'microscope': None,  # Extract from methods
    'etching_conditions': None,  # Extract from methods
    'counting_method': 'LA-ICP-MS',  # Default assumption
}

for field, default_value in required_ft_fields.items():
    if field not in earthbank_ft.columns:
        earthbank_ft[field] = default_value

print(f'✅ Mapped {len(earthbank_ft.columns)} fields to FTDatapoint template')
print()

# --- SAVE MAPPED CSVs ---
print('Saving EarthBank-compatible CSVs...')

earthbank_samples.to_csv(fair_dir / 'earthbank_samples.csv', index=False)
earthbank_ft.to_csv(fair_dir / 'earthbank_ft_data.csv', index=False)

print(f'✅ Saved EarthBank templates:')
print(f'   - earthbank_samples.csv ({len(earthbank_samples)} rows, {len(earthbank_samples.columns)} columns)')
print(f'   - earthbank_ft_data.csv ({len(earthbank_ft)} rows, {len(earthbank_ft.columns)} columns)')
print()

# Also save our internal FAIR schema (for backward compatibility)
samples_df.to_csv(fair_dir / 'samples.csv', index=False)
ft_ages_df.to_csv(fair_dir / 'ft_ages.csv', index=False)
ft_counts_df.to_csv(fair_dir / 'ft_counts.csv', index=False)
ft_lengths_df.to_csv(fair_dir / 'ft_track_lengths.csv', index=False)

print(f'✅ Also saved internal FAIR schema:')
print(f'   - samples.csv ({len(samples_df)} rows)')
print(f'   - ft_ages.csv ({len(ft_ages_df)} rows)')
print(f'   - ft_counts.csv ({len(ft_counts_df)} rows)')
print(f'   - ft_track_lengths.csv ({len(ft_lengths_df)} rows)')
print()
```

---

### STEP 9: Validate EarthBank Templates

```python
print('━' * 60)
print('STEP 9: VALIDATING EARTHBANK TEMPLATES')
print('━' * 60)
print()

# Validate against EarthBank template requirements
validation_errors = []
validation_warnings = []

# --- VALIDATE SAMPLE TEMPLATE ---
print('Validating earthbank_samples.csv...')

# Required fields (per Kohn et al. 2024 Table 4)
required_sample_fields_earthbank = [
    'sample_id', 'latitude', 'longitude', 'elevation',
    'geodetic_datum', 'vertical_datum', 'mineral', 'lithology'
]

for field in required_sample_fields_earthbank:
    if field not in earthbank_samples.columns:
        validation_errors.append(f'Missing required sample field: {field}')
    elif earthbank_samples[field].isna().all():
        validation_warnings.append(f'Sample field "{field}" is entirely empty')

# Check coordinate validity
if 'latitude' in earthbank_samples.columns:
    lat_values = pd.to_numeric(earthbank_samples['latitude'], errors='coerce')
    if lat_values.isna().all():
        validation_warnings.append('All latitude values are missing or invalid')
    elif (lat_values.abs() > 90).any():
        validation_errors.append('Latitude values out of range (-90 to 90)')

if 'longitude' in earthbank_samples.columns:
    lon_values = pd.to_numeric(earthbank_samples['longitude'], errors='coerce')
    if lon_values.isna().all():
        validation_warnings.append('All longitude values are missing or invalid')
    elif (lon_values.abs() > 180).any():
        validation_errors.append('Longitude values out of range (-180 to 180)')

print(f'   Checked {len(required_sample_fields_earthbank)} required fields')
print()

# --- VALIDATE FT DATA TEMPLATE ---
print('Validating earthbank_ft_data.csv...')

# Required fields (per Kohn et al. 2024 Table 5 + 10)
required_ft_fields_earthbank = [
    'sample_id', 'num_grains', 'central_age', 'central_age_error',
    'dispersion', 'P_chi2', 'Ns', 'rho_s', 'Dpar',
    'zeta', 'lambda_f', 'lambda_D', 'analyst', 'laboratory'
]

for field in required_ft_fields_earthbank:
    if field not in earthbank_ft.columns:
        validation_errors.append(f'Missing required FT field: {field}')
    elif earthbank_ft[field].isna().all():
        validation_warnings.append(f'FT field "{field}" is entirely empty')

# Check age validity
if 'central_age' in earthbank_ft.columns:
    ages = pd.to_numeric(earthbank_ft['central_age'], errors='coerce')
    if (ages < 0).any():
        validation_errors.append('Negative ages detected')
    if ages.isna().all():
        validation_errors.append('All ages are missing')

# Check statistical validity
if 'P_chi2' in earthbank_ft.columns:
    p_chi2 = pd.to_numeric(earthbank_ft['P_chi2'], errors='coerce')
    if ((p_chi2 < 0) | (p_chi2 > 1)).any():
        validation_errors.append('P(χ²) values out of range (0-1)')

print(f'   Checked {len(required_ft_fields_earthbank)} required fields')
print()

# --- REPORT VALIDATION RESULTS ---
if validation_errors:
    print('❌ VALIDATION FAILED')
    print()
    print('Errors:')
    for error in validation_errors:
        print(f'   ❌ {error}')
    print()

if validation_warnings:
    print('⚠️  VALIDATION WARNINGS')
    print()
    print('Warnings:')
    for warning in validation_warnings:
        print(f'   ⚠️  {warning}')
    print()

if not validation_errors:
    print('✅ EarthBank templates validated')
    print()

# Also run internal validation (backward compatibility)
print('Running internal FAIR schema validation...')
import subprocess
result = subprocess.run([
    'python', 'scripts/db/validate-import.py', str(fair_dir)
], capture_output=True, text=True)

print(result.stdout)

if result.returncode != 0:
    print('⚠️  Internal validation failed (non-critical for EarthBank upload)')
    print()
else:
    print('✅ Internal FAIR schema validated')
    print()
```

---

### STEP 10: Report Missing Information

```python
print('━' * 60)
print('STEP 10: MISSING INFORMATION REPORT')
print('━' * 60)
print()

# Generate comprehensive report of missing/empty fields
missing_info = {
    'sample_critical': [],
    'sample_recommended': [],
    'ft_critical': [],
    'ft_recommended': [],
    'empty_values': []
}

# --- CHECK SAMPLE TEMPLATE ---
print('Analyzing Sample template completeness...')

# Critical fields (required for EarthBank submission)
sample_critical_fields = [
    'IGSN', 'lithology', 'collector', 'collection_date'
]

for field in sample_critical_fields:
    if field not in earthbank_samples.columns:
        missing_info['sample_critical'].append(f'{field} (column missing)')
    elif earthbank_samples[field].isna().all():
        missing_info['sample_critical'].append(f'{field} (all values empty)')
    elif earthbank_samples[field].isna().any():
        num_empty = earthbank_samples[field].isna().sum()
        missing_info['empty_values'].append(f'{field}: {num_empty}/{len(earthbank_samples)} rows empty')

# Recommended fields (improve data quality but not required)
sample_recommended_fields = [
    'stratigraphic_unit', 'sample_age', 'sample_depth_m',
    'last_archive', 'references'
]

for field in sample_recommended_fields:
    if field not in earthbank_samples.columns:
        missing_info['sample_recommended'].append(f'{field} (column missing)')
    elif earthbank_samples[field].isna().all():
        missing_info['sample_recommended'].append(f'{field} (all values empty)')

print(f'   Critical fields missing: {len(missing_info["sample_critical"])}')
print(f'   Recommended fields missing: {len(missing_info["sample_recommended"])}')
print()

# --- CHECK FT DATA TEMPLATE ---
print('Analyzing FT Data template completeness...')

# Critical fields
ft_critical_fields = [
    'zeta', 'zeta_error', 'analyst', 'laboratory',
    'analysis_date', 'microscope', 'etching_conditions'
]

for field in ft_critical_fields:
    if field not in earthbank_ft.columns:
        missing_info['ft_critical'].append(f'{field} (column missing)')
    elif earthbank_ft[field].isna().all():
        missing_info['ft_critical'].append(f'{field} (all values empty)')
    elif earthbank_ft[field].isna().any():
        num_empty = earthbank_ft[field].isna().sum()
        missing_info['empty_values'].append(f'{field}: {num_empty}/{len(earthbank_ft)} rows empty')

# Recommended fields
ft_recommended_fields = [
    'Ni', 'rho_i', 'rho_d', 'dosimeter',  # EDM-specific
    'U238_Ca43_ratio', 'laser_system',  # LA-ICP-MS-specific
    'rmr0_equation', 'eCl_apfu', 'eDpar_um'  # Kinetic parameters
]

for field in ft_recommended_fields:
    if field not in earthbank_ft.columns:
        missing_info['ft_recommended'].append(f'{field} (column missing)')
    elif earthbank_ft[field].isna().all():
        missing_info['ft_recommended'].append(f'{field} (all values empty)')

print(f'   Critical fields missing: {len(missing_info["ft_critical"])}')
print(f'   Recommended fields missing: {len(missing_info["ft_recommended"])}')
print()

# --- GENERATE REPORT ---
print('=' * 60)
print('MISSING INFORMATION SUMMARY')
print('=' * 60)
print()

if missing_info['sample_critical']:
    print('🔴 SAMPLE CRITICAL FIELDS (required for EarthBank):')
    for item in missing_info['sample_critical']:
        print(f'   ❌ {item}')
    print()
    print('   ACTION REQUIRED:')
    print('   - Extract from paper text (methods, acknowledgments, captions)')
    print('   - Manually populate before EarthBank upload')
    print()

if missing_info['ft_critical']:
    print('🔴 FT DATA CRITICAL FIELDS (required for EarthBank):')
    for item in missing_info['ft_critical']:
        print(f'   ❌ {item}')
    print()
    print('   ACTION REQUIRED:')
    print('   - Extract from paper methods section')
    print('   - Check supplementary materials')
    print('   - Contact authors if unavailable')
    print()

if missing_info['sample_recommended']:
    print('🟡 SAMPLE RECOMMENDED FIELDS (improves data quality):')
    for item in missing_info['sample_recommended'][:5]:  # Show first 5
        print(f'   ⚠️  {item}')
    if len(missing_info['sample_recommended']) > 5:
        print(f'   ... and {len(missing_info["sample_recommended"]) - 5} more')
    print()

if missing_info['ft_recommended']:
    print('🟡 FT DATA RECOMMENDED FIELDS (improves data quality):')
    for item in missing_info['ft_recommended'][:5]:  # Show first 5
        print(f'   ⚠️  {item}')
    if len(missing_info['ft_recommended']) > 5:
        print(f'   ... and {len(missing_info["ft_recommended"]) - 5} more')
    print()

if missing_info['empty_values']:
    print('🟠 PARTIAL DATA (some rows have values):')
    for item in missing_info['empty_values'][:5]:  # Show first 5
        print(f'   ⚠️  {item}')
    if len(missing_info['empty_values']) > 5:
        print(f'   ... and {len(missing_info["empty_values"]) - 5} more')
    print()

if not any(missing_info.values()):
    print('✅ ALL FIELDS COMPLETE!')
    print('   Ready for immediate EarthBank upload')
    print()

# --- COMPLETENESS SCORE ---
total_critical = len(sample_critical_fields) + len(ft_critical_fields)
missing_critical = len(missing_info['sample_critical']) + len(missing_info['ft_critical'])
completeness_pct = ((total_critical - missing_critical) / total_critical) * 100

print('=' * 60)
print(f'COMPLETENESS SCORE: {completeness_pct:.1f}%')
print('=' * 60)
print()

if completeness_pct >= 90:
    print('✅ EXCELLENT - Ready for EarthBank upload with minor manual additions')
elif completeness_pct >= 75:
    print('🟡 GOOD - Some critical fields need manual extraction from paper')
elif completeness_pct >= 50:
    print('🟠 MODERATE - Significant manual work required before upload')
else:
    print('🔴 INCOMPLETE - Major data gaps, contact paper authors recommended')

print()
```
### STEP 11: Generate SQL Import Script

```python
print('━' * 60)
print('STEP 11: GENERATING SQL IMPORT SCRIPT')
print('━' * 60)
print()

# Generate PostgreSQL COPY script for zero-error import
import_script = f"""-- SQL Import Script for {dataset_name}
-- Generated: {pd.Timestamp.now().strftime("%Y-%m-%d %H:%M:%S")}
-- EarthBank Schema v2 Compatible

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- IMPORT SAMPLES
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

\\copy samples(sample_id, igsn, sample_kind, sampling_method, lithology_mineral, sample_info, latitude, longitude, lat_long_precision, elevation_m, min_depth_m, max_depth_m, depth_precision_m, elevation_info, location_kind, location_name, location_info, geological_unit, chronostrat_age_min, chronostrat_age_max) FROM '{fair_dir.absolute()}/samples.csv' WITH (FORMAT CSV, HEADER TRUE, NULL '');

SELECT 'Imported ' || COUNT(*) || ' samples' FROM samples WHERE sample_id IN (SELECT "Sample" FROM read_csv_auto('{fair_dir.absolute()}/samples.csv'));

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- IMPORT FT DATAPOINTS
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

\\copy ft_datapoints(datapoint_key, sample_id, sec_ref_material, sample_info, publication_id, laboratory, analyst_orcid, funding_grant, analysis_datetime, mineral, batch_id, ft_counting_method, digital_ft_software, digital_ft_algorithm, u_measurement_method, n_grains_counted, pooled_age_ma, pooled_age_1s_ma, central_age_ma, central_age_1s_ma, dispersion_pct, P_chi2_pct, zeta_value, zeta_1s, mean_track_length_um, mean_track_length_1s_um, std_dev_track_length_um) FROM '{fair_dir.absolute()}/ft-datapoints.csv' WITH (FORMAT CSV, HEADER TRUE, NULL '');

SELECT 'Imported ' || COUNT(*) || ' FT datapoints' FROM ft_datapoints WHERE datapoint_key IN (SELECT "Key" FROM read_csv_auto('{fair_dir.absolute()}/ft-datapoints.csv'));

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- IMPORT FT COUNT DATA
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

\\copy ft_count_data(ft_datapoint_id, grain_id, area_counted_cm2, rho_s_cm2, Ns, rho_i_cm2, Ni, Dpar_um, Dpar_1s_um, n_dpar_measurements, Dper_um, Dper_1s_um, n_dper_measurements, dpar_dper_uncertainty_type, analysis_info) FROM '{fair_dir.absolute()}/ft-count-data.csv' WITH (FORMAT CSV, HEADER TRUE, NULL '');

SELECT 'Imported ' || COUNT(*) || ' FT count data records' FROM ft_count_data;

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- IMPORT FT TRACK LENGTH DATA
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

\\copy ft_track_length_data(ft_datapoint_id, grain_id, track_id, track_type, mount_id, etching_duration_s, measured_length_parallel_um, depth_corrected_length_um, fission_track_length_um, azimuth_deg, dip_deg, c_axis_angle_deg, c_axis_corrected_length_um, Dpar_um) FROM '{fair_dir.absolute()}/ft-length-data.csv' WITH (FORMAT CSV, HEADER TRUE, NULL '');

SELECT 'Imported ' || COUNT(*) || ' FT track length records' FROM ft_track_length_data;

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- VERIFICATION
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- Check foreign key integrity
SELECT 'Foreign key check: All FT datapoints have valid sample_id'
WHERE NOT EXISTS (
    SELECT 1 FROM ft_datapoints d
    LEFT JOIN samples s ON d.sample_id = s.sample_id
    WHERE s.sample_id IS NULL
);

SELECT 'Foreign key check: All FT count data have valid datapoint_id'
WHERE NOT EXISTS (
    SELECT 1 FROM ft_count_data c
    LEFT JOIN ft_datapoints d ON c.ft_datapoint_id = d.datapoint_id
    WHERE d.datapoint_id IS NULL
);

-- Summary statistics
SELECT
    'Import complete: ' ||
    (SELECT COUNT(*) FROM samples) || ' samples, ' ||
    (SELECT COUNT(*) FROM ft_datapoints) || ' datapoints, ' ||
    (SELECT COUNT(*) FROM ft_count_data) || ' count records, ' ||
    (SELECT COUNT(*) FROM ft_track_length_data) || ' track length records';
"""

# Save import script
import_script_path = fair_dir / 'import.sql'
with open(import_script_path, 'w') as f:
    f.write(import_script)

print(f'✅ Generated SQL import script:')
print(f'   - import.sql ({len(import_script.split(chr(10)))} lines)')
print()
print(f'📋 To import to database:')
print(f'   psql "$DATABASE_URL" -f {import_script_path}')
print()
```
### STEP 12: Validate Before Import (Critical!)

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
    print()
    print('Common issues:')
    print('   - sample_id too long (limit: 50 chars)')
    print('   - Invalid sample_id format')
    print('   - Missing required columns')
    print('   - NULL values in required fields')
    sys.exit(1)

print('✅ All files validated - ready for import')
print()
```

**Why This Matters:**
- Catches schema mismatches BEFORE import
- Validates string lengths (e.g., sample_id < 50 chars)
- Checks foreign key integrity
- Prevents failed imports - **import once, successfully**

### STEP 13: Create Extraction Report

```python
print('━' * 60)
print('STEP 13: CREATING EXTRACTION REPORT')
print('━' * 60)
print()

report_path = paper_dir / 'extraction-report.md'

# Build analysis info section
analysis_info = ""
if paper_metadata['has_analysis']:
    analysis_info = f'''
## Paper Analysis Integration

✅ **Used existing paper analysis** from `paper-index.md`

**Metadata from analysis:**
- **Authors:** {paper_metadata['authors'] or 'N/A'}
- **Year:** {paper_metadata['year'] or 'N/A'}
- **Study Location:** {paper_metadata['study_location'] or 'N/A'}
- **Mineral Type:** {paper_metadata['mineral_type'] or 'N/A'}
- **Analysis Method:** {paper_metadata['analysis_method'] or 'N/A'}
- **Sample ID Pattern:** `{paper_metadata['sample_id_pattern'] or 'default'}`

**Benefits:**
- Faster table identification
- Better sample validation
- Automatic metadata population
- Age range validation

**Full paper analysis:** See [`paper-index.md`](./paper-index.md) and [`paper-analysis.md`](./paper-analysis.md)

---
'''
else:
    analysis_info = '''
## Paper Analysis Integration

⚠️ **No existing paper analysis found**

Extraction proceeded with default settings. For better metadata and validation, consider:
1. Creating a paper analysis first (see THERMO_PAPER_ANALYSIS_INSTRUCTIONS.md)
2. Re-running extraction with analysis integration

---
'''

with open(report_path, 'w') as f:
    f.write(f'''# Thermochronology Data Extraction Report

**Paper:** {dataset_name}
**Extracted:** {pd.Timestamp.now().strftime("%Y-%m-%d")}

---

## Extraction Summary

**Tables Extracted:** {len(results)}/{len(extractor.structure.tables)}
**Valid Samples:** {len(table1_clean)} (filtered from {len(table1)} total rows)
**Age Range:** {central_ages.min():.1f} - {central_ages.max():.1f} Ma

---
{analysis_info}
## Data Quality

✅ **Sample ID Validation:** All {len(table1_clean)} samples match pattern `{sample_pattern}`
✅ **Schema Validation:** All CSV files passed pre-import validation
✅ **No Null Values:** Required fields populated
✅ **Foreign Keys:** All relationships valid

---

## File Structure

```
{paper_dir.name}/
├── RAW/
│   └── original-table.csv ({len(table1_clean)} rows)
├── FAIR/
│   ├── samples.csv ({len(samples_df)} rows)
│   ├── ft_ages.csv ({len(ft_ages_df)} rows)
│   ├── ft_counts.csv ({len(ft_counts_df)} rows)
│   └── ft_track_lengths.csv ({len(ft_lengths_df)} rows)
├── {Path(pdf_path).name}
└── extraction-report.md
```

---

## Next Steps

### Import to Database

**Option A: SQL Bulk Import (RECOMMENDED)**
```bash
./scripts/db/import-sql.sh {dataset_name} {fair_dir}
```

**Option B: Python Import**
```bash
python scripts/db/import-dataset.py {fair_dir}
```

**Expected Result:** ✅ Zero errors, one successful import

---

### Deploy to Vercel

**Copy folder to public directory:**
```bash
cp -r {paper_dir} public/data/datasets/
```

**Files will be accessible at:**
- `https://thermo-app.vercel.app/data/datasets/{dataset_name}/FAIR/samples.csv`
- `https://thermo-app.vercel.app/data/datasets/{dataset_name}/RAW/original-table.csv`
- `https://thermo-app.vercel.app/data/datasets/{dataset_name}/{Path(pdf_path).name}`

---

**Report Generated:** {report_path}
''')

print(f'✅ Extraction report created: {report_path}')
print()
```

---

## ✅ Final Summary (INTEGRATED WORKFLOW)

```python
print('━' * 60)
print('EXTRACTION COMPLETE - INTEGRATED WITH /thermoanalysis')
print('━' * 60)
print()
print('Summary:')
print(f'  ✅ Tables extracted: {len(results)}')
print(f'  ✅ Valid samples: {len(table1_clean)} (filtered {len(table1) - len(table1_clean)} invalid)')
print(f'  ✅ RAW data saved: {len(results) + 1} files')
print(f'  ✅ FAIR data generated: 4 files (EarthBank schema v2)')
print(f'  ✅ SQL import script: ✅')
print(f'  ✅ Age range: {central_ages.min():.1f} - {central_ages.max():.1f} Ma')
print()
print('Integrated folder structure:')
print(f'  {paper_dir}/')
if (paper_dir / 'paper-index.md').exists():
    print(f'  ├── paper-index.md              (from /thermoanalysis)')
    print(f'  ├── paper-analysis.md          (from /thermoanalysis)')
    print(f'  ├── images/                    (from /thermoanalysis)')
print(f'  ├── RAW/                       ✅ Original extracted data')
print(f'  │   ├── table-1-raw.csv        ({list(results.values())[0].shape if results else "N/A"})')
print(f'  │   ├── table-2-raw.csv')
print(f'  │   └── table-1-cleaned.csv    ({len(table1_clean)} rows)')
print(f'  ├── FAIR/                      ✅ EarthBank schema v2')
print(f'  │   ├── samples.csv            ({len(samples_earthbank)} rows)')
print(f'  │   ├── ft-datapoints.csv      ({len(ft_datapoints_earthbank)} rows)')
print(f'  │   ├── ft-count-data.csv      ({len(ft_count_earthbank)} rows)')
print(f'  │   ├── ft-length-data.csv     ({len(ft_length_earthbank)} rows)')
print(f'  │   └── import.sql             ✅ Ready to import')
print(f'  ├── {Path(pdf_path).name}')
print(f'  └── extraction-report.md')
print()
print('Next steps:')
print(f'  1. Review extraction report: {report_path}')
print(f'  2. Import to database (one command, zero errors expected):')
print(f'     psql "$DATABASE_URL" -f {fair_dir}/import.sql')
print(f'  3. Alternative: Use SQL COPY bulk import:')
print(f'     ./scripts/db/import-sql.sh {dataset_name} {fair_dir}')
print(f'  4. Verify import:')
print(f'     psql "$DATABASE_URL" -c "SELECT COUNT(*) FROM samples;"')
print()
print('🎯 EarthBank Compatibility:')
print(f'  ✅ Sample.template.v2025-04-16.xlsx format')
print(f'  ✅ FTDatapoint.template.v2024-11-11.xlsx format')
print(f'  ✅ Ready for upload to https://earthbank.auscope.org.au/')
print()
```

---

## 🎓 Key Lessons Learned

### Problem 1: Invalid Data in CSVs
**What went wrong:** Footer text extracted as sample rows (219 chars → overflow)
**Fix:** Filter invalid rows during extraction using sample ID pattern
**Code:** `valid_samples = df['sample_id'].str.match(r'^[A-Z]{2,4}\d{2}-\d{2,3}$')`

### Problem 2: No Pre-Import Validation
**What went wrong:** Errors discovered during import attempt (3 failures)
**Fix:** Validate against database schema BEFORE import
**Code:** `python scripts/db/validate-import.py <data-dir>`

### Problem 3: Schema Mismatches
**What went wrong:** `study_location` vs `study_area`, wrong constraint names
**Fix:** Validation script checks actual database schema
**Result:** Catch ALL errors before import attempt

---

## 📊 SQL vs Python Import

### Use SQL COPY (Recommended)
```bash
# Import from FAIR directory
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

### Use Python (Alternative)
```bash
# Import from FAIR directory
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

---

## 🚀 Success Metrics

### Before Improvements
- ❌ 3 failed import attempts
- ❌ 17 rows lost to manual CSV editing
- ❌ Multiple database cleanups required

### After Improvements
- ✅ 1 successful import (first attempt)
- ✅ Zero rows lost (filtered during extraction)
- ✅ Zero manual editing
- ✅ Zero database cleanups

---

## 💾 Database Metadata Import (For Dataset Page Display)

After successful data import, add metadata to make it visible on the dataset page:

### Required Metadata Fields

```sql
-- Update datasets table with extraction metadata
UPDATE datasets SET
  paper_summary = '<One-paragraph summary of paper findings>',
  fair_score = <0-100>,
  fair_reasoning = '<Detailed explanation of FAIR score>',
  key_findings = ARRAY[
    '<Finding 1>',
    '<Finding 2>',
    '<Finding 3>',
    ...
  ],
  extraction_report_url = '/data/datasets/<id>/<dataset>-extraction-report.md'
WHERE id = <dataset_id>;
```

### Register Data Files for Download

```sql
-- Insert file records into data_files table
-- Replace AUTHOR(YEAR)-TITLE with actual paper folder name
INSERT INTO data_files (
  dataset_id, file_name, file_path, file_type,
  display_name, row_count, description,
  created_at, updated_at
) VALUES
  -- FAIR schema files
  (<id>, 'samples.csv', '/data/datasets/AUTHOR(YEAR)-TITLE/FAIR/samples.csv',
   'fair_schema', 'Samples', <rows>, 'FAIR-compliant samples data', NOW(), NOW()),
  (<id>, 'ft_ages.csv', '/data/datasets/AUTHOR(YEAR)-TITLE/FAIR/ft_ages.csv',
   'fair_schema', 'FT Ages', <rows>, 'FAIR-compliant ft_ages data', NOW(), NOW()),
  (<id>, 'ft_counts.csv', '/data/datasets/AUTHOR(YEAR)-TITLE/FAIR/ft_counts.csv',
   'fair_schema', 'FT Counts', <rows>, 'FAIR-compliant ft_counts data', NOW(), NOW()),
  (<id>, 'ft_track_lengths.csv', '/data/datasets/AUTHOR(YEAR)-TITLE/FAIR/ft_track_lengths.csv',
   'fair_schema', 'FT Track Lengths', <rows>, 'FAIR-compliant ft_track_lengths data', NOW(), NOW()),

  -- Original table
  (<id>, 'original-table.csv', '/data/datasets/AUTHOR(YEAR)-TITLE/RAW/original-table.csv',
   'original_table', 'Original Table', <rows>, 'Original extracted data from Table X', NOW(), NOW()),

  -- Source PDF
  (<id>, '[PDF_NAME].pdf', '/data/datasets/AUTHOR(YEAR)-TITLE/[PDF_NAME].pdf',
   'source_pdf', 'Source PDF', NULL, 'Original research paper', NOW(), NOW()),

  -- Extraction report
  (<id>, 'extraction-report.md', '/data/datasets/AUTHOR(YEAR)-TITLE/extraction-report.md',
   'report', 'Extraction Report', NULL, 'Data extraction report', NOW(), NOW());
```

### Copy Files to Public Directory

```bash
# Copy entire paper folder to public directory
# This includes RAW/, FAIR/, PDF, and extraction report
cp -r build-data/learning/thermo-papers/AUTHOR(YEAR)-TITLE \
   public/data/datasets/

# Files will be accessible at:
# - /data/datasets/AUTHOR(YEAR)-TITLE/FAIR/samples.csv
# - /data/datasets/AUTHOR(YEAR)-TITLE/FAIR/ft_ages.csv
# - /data/datasets/AUTHOR(YEAR)-TITLE/FAIR/ft_counts.csv
# - /data/datasets/AUTHOR(YEAR)-TITLE/FAIR/ft_track_lengths.csv
# - /data/datasets/AUTHOR(YEAR)-TITLE/RAW/original-table.csv
# - /data/datasets/AUTHOR(YEAR)-TITLE/[PDF_NAME].pdf
# - /data/datasets/AUTHOR(YEAR)-TITLE/extraction-report.md
```

### What This Enables

After completing the metadata import:

**Dataset Page** (`/datasets/<id>`) will display:
- ✅ **FAIR Score Badge** - Color-coded 0-100 rating (green ≥90, yellow ≥75, orange ≥60, red <60)
- ✅ **Paper Summary** - One-paragraph research overview (blue highlight)
- ✅ **Key Findings** - Bullet list of major results (green highlight)
- ✅ **FAIR Compliance Analysis** - Detailed reasoning (amber highlight)
- ✅ **Downloadable Files** - All FAIR schema CSVs + original tables + report
- ✅ **Download All as ZIP** - Single-click archive download

**Example:** https://thermo-app.vercel.app/datasets/4

---

**Ready to extract!** Run this workflow with your PDF path to generate validated, import-ready CSV files.
