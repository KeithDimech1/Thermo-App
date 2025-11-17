# EarthBank Template Importer - User Guide

## Overview

The **EarthBank Template Importer** (`import_earthbank_templates.py`) is a generic tool for importing data directly from EarthBank Excel templates into your PostgreSQL database.

**Supported Templates:**
- ✅ **Sample.template.v2025-04-16.xlsx** - Sample metadata
- ✅ **FTDatapoint.template.v2024-11-11.xlsx** - Fission-track data (multi-sheet)
- ✅ **HeDatapoint.template.v2024-11-11.xlsx** - (U-Th)/He data (multi-sheet)
- ⚠️ **GCDatapoint.template.v2024-11-11.xlsx** - Geochemistry (not yet implemented)

---

## Quick Start

### 1. Basic Usage

```bash
# Import a sample template
python scripts/import_earthbank_templates.py \
    build-data/learning/archive/earthbanktemplates/Sample.template.v2025-04-16.xlsx \
    --dataset-name "My Dataset Name"

# Import FT datapoints (assumes samples already imported)
python scripts/import_earthbank_templates.py \
    build-data/learning/archive/earthbanktemplates/FTDatapoint.template.v2024-11-11.xlsx \
    --dataset-name "My Dataset Name"

# Import He datapoints
python scripts/import_earthbank_templates.py \
    build-data/learning/archive/earthbanktemplates/HeDatapoint.template.v2024-11-11.xlsx \
    --dataset-name "My Dataset Name"
```

### 2. With Custom Description

```bash
python scripts/import_earthbank_templates.py \
    path/to/template.xlsx \
    --dataset-name "Malawi Rift Study" \
    --dataset-description "Thermochronology data from Malawi Rift footwall exhumation"
```

---

## Workflow

### Step 1: Prepare Your Excel Files

1. Download EarthBank templates from:
   - [EarthBank Platform](https://earthbank.auscope.org.au/)
   - OR use templates in `build-data/learning/archive/earthbanktemplates/`

2. Fill in your data following EarthBank guidelines

### Step 2: Import Samples First

**Always import samples before datapoints!**

```bash
python scripts/import_earthbank_templates.py \
    your_filled_sample_template.xlsx \
    --dataset-name "Your Study Name"
```

This creates:
- Dataset record in `datasets` table
- Sample records in `samples` table (using IGSN as primary key)

### Step 3: Import Datapoints

Once samples are imported, you can import analytical data:

**For Fission-Track Data:**
```bash
python scripts/import_earthbank_templates.py \
    your_filled_ft_template.xlsx \
    --dataset-name "Your Study Name"
```

This imports multiple sheets:
- ✅ **FT Datapoints** → `ft_datapoints` table
- ✅ **FTCountData** → `ft_count_data` table
- 🚧 **FTSingleGrain** → `ft_single_grain_ages` (coming soon)
- 🚧 **FTLengthData** → `ft_track_length_data` (coming soon)
- 🚧 **FTBinnedLengthData** → `ft_binned_length_data` (coming soon)

**For (U-Th)/He Data:**
```bash
python scripts/import_earthbank_templates.py \
    your_filled_he_template.xlsx \
    --dataset-name "Your Study Name"
```

This imports:
- ✅ **He Datapoints** → `he_datapoints` table
- ✅ **HeWholeGrain** → `he_whole_grain_data` table

---

## Column Mappings

The importer automatically maps EarthBank column names to database schema:

### Sample Template Mapping

| EarthBank Column | Database Column |
|------------------|----------------|
| IGSN | igsn (primary key) |
| Latitude | latitude |
| Longitude | longitude |
| Elevation (m) | elevation_m |
| Mineral | mineral_type |
| Lithology | lithology |
| Sample Collector | sample_collector |
| Collection Date | collection_date |

### FT Datapoint Mapping (70+ columns)

| EarthBank Column | Database Column |
|------------------|----------------|
| Sample ID | sample_id (foreign key) |
| Datapoint Key | datapoint_key (primary key) |
| Batch ID | batch_id |
| N Grains | n_grains |
| Mean ρs | mean_rho_s |
| Total Ns | total_ns |
| Pooled Age (Ma) | pooled_age_ma |
| Central Age (Ma) | central_age_ma |
| Dispersion (%) | dispersion_pct |
| P(χ²) (%) | p_chi2_pct |

**See `FT_DATAPOINT_COLUMN_MAP` in script for complete mapping (70+ fields)**

### He Datapoint Mapping (46+ columns)

| EarthBank Column | Database Column |
|------------------|----------------|
| Sample ID | sample_id |
| Datapoint Key | datapoint_key |
| Batch ID | batch_id |
| N Aliquots | n_aliquots |
| Mean Corr Age (Ma) | mean_corr_age_ma |
| MSWD Corr | mswd_corr |

**See `HE_DATAPOINT_COLUMN_MAP` in script for complete mapping (46+ fields)**

### He Grain Mapping (75+ columns)

| EarthBank Column | Database Column |
|------------------|----------------|
| Lab No | lab_no |
| ⁴He (ncc) | he_ncc |
| U (ppm) | u_ppm |
| Th (ppm) | th_ppm |
| Corr Age (Ma) | corr_age_ma |
| Ft | ft |
| Rs (μm) | rs_um |

**See `HE_GRAIN_COLUMN_MAP` in script for complete mapping (75+ fields)**

---

## Required Fields

### For Samples
- **IGSN** (primary key - must be unique)

### For FT Datapoints
- **Sample ID** (must exist in `samples` table)
- **Datapoint Key** (unique identifier for this analytical session)

### For He Datapoints
- **Sample ID** (must exist in `samples` table)
- **Datapoint Key** (unique identifier for this analytical session)

### For He Grains
- **Datapoint Key** (must exist in `he_datapoints` table)
- **Lab No** or **Grain Identifier**

---

## Error Handling

The importer provides detailed feedback:

```
✓ Connected to database
✓ Using existing dataset: My Dataset (ID: 5)
✓ Loaded 34 samples from Excel
⚠ Row 12: No IGSN, skipping
⚠ Row 25: Sample MU19-XX not found, skipping
✓ Inserted 32 samples, updated 2 samples
```

**Common Issues:**
1. **"Sample not found"** → Import samples before datapoints
2. **"No IGSN"** → IGSN column is empty in Excel
3. **"Datapoint Key required"** → Datapoint Key column missing/empty
4. **"Insert failed"** → Check column name spelling (case-sensitive!)

---

## Database Schema Compatibility

The importer maps to **EarthBank Schema v2** (datapoint-based architecture):

```
datasets
  └── samples (IGSN)
      ├── ft_datapoints (analytical sessions)
      │   ├── ft_count_data (grain counts)
      │   ├── ft_single_grain_ages
      │   ├── ft_track_length_data
      │   └── ft_binned_length_data
      │
      └── he_datapoints (analytical sessions)
          └── he_whole_grain_data (grain chemistry & ages)
```

---

## Advanced Usage

### Update Existing Records

The importer intelligently handles existing data:

**For Samples:**
- If IGSN exists → **Updates** record with new data
- If IGSN new → **Inserts** new record

**For Datapoints:**
- If Datapoint Key exists → **Skips** (no update)
- If Datapoint Key new → **Inserts** new record

### Batch Import Multiple Files

```bash
# Import in correct order
python scripts/import_earthbank_templates.py samples.xlsx --dataset-name "Study A"
python scripts/import_earthbank_templates.py ft_data.xlsx --dataset-name "Study A"
python scripts/import_earthbank_templates.py he_data.xlsx --dataset-name "Study A"
```

### Programmatic Usage

```python
from scripts.import_earthbank_templates import EarthBankImporter
from pathlib import Path

# Create importer
importer = EarthBankImporter()
importer.connect()

# Create dataset
dataset_id = importer.get_or_create_dataset(
    name="My Study",
    description="Description here"
)

# Import templates
importer.import_sample_template(Path("samples.xlsx"))
importer.import_ft_template(Path("ft_data.xlsx"))
importer.import_he_template(Path("he_data.xlsx"))

importer.close()
```

---

## Future Enhancements

🚧 **Planned Features:**
- [ ] FT single grain ages import
- [ ] FT track length data import
- [ ] FT binned length data import
- [ ] Geochemistry template support
- [ ] Batch import via directory scan
- [ ] Data validation before import
- [ ] Duplicate detection & merging
- [ ] Export database back to EarthBank templates

---

## Examples

### Example 1: Import Peak et al. (2021) Data

```bash
# 1. Fill Sample template with Peak 2021 sample metadata
# 2. Import samples
python scripts/import_earthbank_templates.py \
    data/peak_2021_samples.xlsx \
    --dataset-name "Peak et al. 2021" \
    --dataset-description "Thermochronology from Peak et al. 2021"

# 3. Fill FT template with analytical data
# 4. Import FT data
python scripts/import_earthbank_templates.py \
    data/peak_2021_ft.xlsx \
    --dataset-name "Peak et al. 2021"
```

### Example 2: Import Malawi Rift Data

```bash
# Use pre-filled templates
python scripts/import_earthbank_templates.py \
    build-data/learning/thermo-papers/Malawi-Rift-Footwall-Exhumation/earthbank_samples.xlsx \
    --dataset-name "Malawi Rift Footwall Exhumation"

python scripts/import_earthbank_templates.py \
    build-data/learning/thermo-papers/Malawi-Rift-Footwall-Exhumation/earthbank_ft.xlsx \
    --dataset-name "Malawi Rift Footwall Exhumation"

python scripts/import_earthbank_templates.py \
    build-data/learning/thermo-papers/Malawi-Rift-Footwall-Exhumation/earthbank_he.xlsx \
    --dataset-name "Malawi Rift Footwall Exhumation"
```

---

## Troubleshooting

### Check Database Connection

```bash
python3 -c "
import psycopg2
conn = psycopg2.connect('postgresql://neondb_owner:...')
print('✓ Connection successful')
conn.close()
"
```

### Verify Imports

```sql
-- Count imported records
SELECT
    (SELECT COUNT(*) FROM datasets) as datasets,
    (SELECT COUNT(*) FROM samples) as samples,
    (SELECT COUNT(*) FROM ft_datapoints) as ft_datapoints,
    (SELECT COUNT(*) FROM he_datapoints) as he_datapoints,
    (SELECT COUNT(*) FROM he_whole_grain_data) as he_grains;
```

### Common Fixes

1. **Excel file corrupted:**
   - Re-download template
   - Save as `.xlsx` (not `.xls` or `.xlsm`)

2. **Column names don't match:**
   - Check for extra spaces
   - Verify spelling (case-sensitive)
   - Use exact names from EarthBank templates

3. **Foreign key violations:**
   - Import samples before datapoints
   - Verify Sample ID matches IGSN in samples table
   - Check Datapoint Key is unique

---

## Support

**Issues:** https://github.com/anthropics/claude-code/issues
**EarthBank:** https://earthbank.auscope.org.au/
**Schema Docs:** `build-data/assets/schemas/AusGeochem_ERD.md`

---

**Created:** 2025-11-18
**Version:** 1.0
**Compatible with:** EarthBank Schema v2 (datapoint-based)
