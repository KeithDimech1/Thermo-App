# Scripts Directory Documentation

**Path:** `scripts/`
**Last Updated:** 2025-11-18 18:48:00
**Total Scripts:** 47+ files across 3 main categories

## What This Directory Does

The `scripts/` directory contains utilities for data extraction, database management, and analysis of thermochronology data. These scripts support the full workflow from PDF papers to database import and scientific visualization.

---

## Quick Navigation

- [Database Utilities](#database-utilities-scriptsdb) - Import, migration, schema management
- [PDF Extraction](#pdf-extraction-scriptspdf) - Multi-method table extraction engine
- [Data Analysis](#data-analysis-scriptsanalysis) - Statistical plots, spatial analysis
- [Import Scripts](#import-scripts-root-level) - One-off dataset imports
- [Test Scripts](#test-scripts) - Validation and testing utilities

---

## Database Utilities (scripts/db/)

**Purpose:** Database connection, migrations, imports, and schema management

### Core Infrastructure

**`psql-direct.sh`** - Safe PostgreSQL wrapper
- Uses `DIRECT_URL` from `.env.local`
- Prevents wrong database connections
- Usage: `./scripts/db/psql-direct.sh [psql args]`

**`psql-pooled.sh`** - Pooled connection wrapper
- Uses `DATABASE_URL` for serverless queries
- For read operations and DML

**`pg_dump-direct.sh`** - Schema dump wrapper (NEW)
- Safe pg_dump using `DIRECT_URL`
- Used by `/bigtidy` for schema snapshots

**`verify-connection.sh`** - Connection tester
- Verifies you're connected to correct database (neondb)

### Import Scripts

**`import-earthbank-templates.ts`** - Main import engine
- Reads EarthBank Excel templates
- Imports samples, FT datapoints, He datapoints
- Handles grain-level data
- See: `scripts/EARTHBANK_IMPORT_GUIDE.md`

**`import-thermo-data.ts`** - CSV import utility
- Legacy CSV import (deprecated for EarthBank workflow)

### Migration Scripts

**`migrate-v1-to-v2.ts`** - Schema migration
- Migrated old schema → EarthBank-compliant v2
- Historical reference only

**`run-migration.ts`** - Migration runner
- Applies Prisma migrations

### Utility Scripts

**`test-connection.ts`** - Test database connection
**`test-earthbank-queries.ts`** - Test query functions
**`check-neon-data.ts`** - Verify Neon data integrity
**`check-datasets-columns.ts`** - Schema validation
**`export-schema.ts`** - Export schema snapshot
**`generate-schema-snapshot.ts`** - Generate schema docs
**`reset-database.ts`** - ⚠️ **DANGEROUS** - Drops all tables
**`clear-database.ts`** - Delete all data (keep schema)

### Data Population

**`populate-dataset-authors.ts`** - Extract authors from citations
**`populate-malawi-files.ts`** - Populate file metadata
**`transform-and-import-malawi.ts`** - Malawi dataset import
**`update-malawi-metadata.ts`** - Update Malawi metadata
**`backdate-fair-compliance.ts`** - Generate FAIR scores retrospectively

### Shell Scripts

**`import-csvs.sh`** - Batch CSV import (legacy)
**`import-earthbank-csvs.sh`** - EarthBank CSV import
**`import-sql.sh`** - SQL file import

---

## PDF Extraction (scripts/pdf/)

**Purpose:** Multi-method table extraction engine for scientific papers

### Core Engine

**`extraction_engine.py`** - Main extraction orchestrator
- Coordinates multiple extraction methods
- Caching system for intermediate results
- Quality scoring for extracted tables
- Used by `/thermoextract` command

**`multi_method_extraction.py`** - Multi-method strategy
- Tries: pdfplumber, camelot, tabula-py
- Selects best result based on quality score

**`table_extractors.py`** - Individual extractors
- pdfplumber-based extraction
- Camelot lattice/stream
- Tabula integration

### Data Processing

**`cleaners.py`** - Table cleaning utilities
- Remove headers/footers
- Merge split rows (multi-line cells)
- Fix wrapped cells
- Normalize column names
- Convert to numeric types

**`validators.py`** - Data validation
- Check for required columns
- Validate numeric ranges
- Detect duplicate rows

**`semantic_analysis.py`** - Intelligent parsing
- Detect table types (Sample, FTDatapoint, HeDatapoint)
- Extract column headers with context
- Identify units and uncertainty

### Specialized Extractors

**`extract_malawi_rift.py`** - Malawi Rift paper extraction
- Paper-specific extraction logic
- Example of custom extractor

**`methods_parser.py`** - Methods section parser
- Extract analytical methods metadata
- Parse laboratory information

### Transformation

**`fair_transformer.py`** - EarthBank transformer
- Converts extracted data → EarthBank template format
- Maps field names to schema
- Validates FAIR compliance

### Utilities

**`cache.py`** - Extraction caching system
- Caches intermediate results (text, tables, images)
- Speeds up re-runs during debugging

---

## Data Analysis (scripts/analysis/)

**Purpose:** Scientific visualization and statistical analysis

### Statistical Plots

**`statistical_plots.py`** - Core statistical visualizations
- **Radial plots** - Single-grain age precision analysis
- **Age histograms** - Sample or dataset age distributions
- **Probability density plots** - Kernel density estimation
- **QA plots** - Quality assessment (P(χ²), dispersion)

**Key functions:**
- `create_radial_plot(sample_id, method='AFT')` - Radial/Galbraith plot
- `create_age_histogram(dataset_id, bins=20, kde=True)` - Age distribution
- `create_probability_density_plot(sample_id)` - Probability density function
- `create_qa_plot(dataset_id)` - Quality metrics overview

### Spatial Analysis

**`spatial_plots.py`** - Geospatial visualizations
- **Age-elevation plots** - Exhumation rate calculations
- **Spatial transects** - Age vs. latitude/longitude
- **MTL trends** - Mean track length spatial patterns

**Key functions:**
- `create_age_elevation_plot(dataset_id, method='AFT')` - Age-elevation relationship
- `create_spatial_transect_plot(dataset_id, axis='latitude')` - Spatial trends
- `create_mtl_trends_plot(dataset_id)` - Track length patterns

### Data Loaders

**`analysis/utils/data_loaders.py`** - Database query utilities
- `load_sample_ages(dataset_id, method='AFT')` → DataFrame
- `load_ft_grain_ages(sample_id)` → DataFrame
- `load_ahe_grain_ages(sample_id)` → DataFrame
- `load_track_lengths(sample_id)` → DataFrame
- `load_age_elevation(dataset_id)` → DataFrame

### Paper Analysis

**`analyze_thermo_paper.py`** - Paper extraction workflow
- Extract plain text from PDF
- Discover tables dynamically
- Create text index with table locations
- Extract images with captions
- Generate extraction metadata

---

## Import Scripts (Root Level)

**Purpose:** One-off dataset imports (specific papers)

**`import_earthbank_templates.py`** - Python EarthBank importer
- Alternative to TypeScript import
- Class-based importer with transaction support

**`import_malawi_data.py`** - Malawi Rift dataset
- Mudd et al. (2018) data import
- Sample metadata + FT + (U-Th)/He data

**`import_peak_2021.py`** - Peak et al. (2021) dataset
- Table S1 and S2 extraction + import

**`transform_peak_2021_earthbank.py`** - Peak data transformer
- Convert Peak et al. → EarthBank format

**`validate_peak_2021.py`** - Peak data validator
- Verify imported Peak data

**`complete_malawi_extraction.py`** - Full Malawi extraction
- End-to-end extraction for Malawi paper

---

## Test Scripts

**Purpose:** Validation and testing utilities

**`test_comprehensive_extraction.py`** - Full extraction pipeline test
**`test_enhanced_extractor.py`** - Enhanced extractor validation
**`test_existing_extractor.py`** - Legacy extractor test
**`test_extraction_all_5_tables.py`** - Multi-table extraction test
**`test_idea012_phase2.py`** - IDEA-012 implementation test
**`test-enhanced-image-extraction.py`** - Image extraction validator

---

## Legacy / Deprecated Scripts

**Purpose:** Historical scripts (reference only)

**`extract-tables-*.py`** - Early extraction attempts
- `extract-tables-final.py`
- `extract-tables-v2.py`
- `extract-tables-mcmillan.py`
- `extract-all-tables.py`

**Superseded by:** `scripts/pdf/extraction_engine.py` (multi-method engine)

**`extract_and_save_mcmillan.py`** - McMillan paper extraction
**`extract_pdf_pages.py`** - PDF page extraction utility
**`extract-from-text.py`** - Text-based table parsing

---

## Utility Scripts

**`break-papers-into-sections.py`** - Split papers into sections
- Breaks PDF papers into manageable markdown sections
- Creates section index

**`break-terminology-docs.py`** - Split terminology docs
- Breaks field definition docs into sections

**`generate-erd.dot` / `generate-erd-simple.dot`** - ERD generators
- GraphViz DOT files for database schema visualization

**`pre-deploy-check.sh`** - Pre-deployment validation
- Runs before Vercel deployment

**`query-mcmillan-data.js`** - McMillan data queries (Node.js)
**`search-appendix-tables.py`** - Search PDF appendices for tables
**`validation-report.py`** - Generate validation reports
**`analyze_raw_data_sheets.py`** - Analyze raw Excel sheets

---

## SQL Scripts

**`create_peak_samples.sql`** - Peak dataset sample creation
**`update_peak_2021_metadata.sql`** - Update Peak metadata
**`update_peak_2021_metadata_fixed.sql`** - Fixed metadata update

---

## Common Workflows

### 1. Import EarthBank Template

```bash
# Use TypeScript importer
npx tsx scripts/db/import-earthbank-templates.ts path/to/template.xlsx

# Or Python importer
python3 scripts/import_earthbank_templates.py path/to/template.xlsx
```

### 2. Extract Data from PDF

```bash
# Use /thermoextract command (recommended)
/thermoextract

# Or run extraction engine directly
python3 scripts/pdf/extraction_engine.py path/to/paper.pdf
```

### 3. Generate Plots

```bash
# Radial plot for a sample
python3 scripts/analysis/statistical_plots.py --sample-id SAMPLE-001 --type radial

# Age histogram for dataset
python3 scripts/analysis/statistical_plots.py --dataset-id 1 --type histogram

# Age-elevation plot
python3 scripts/analysis/spatial_plots.py --dataset-id 1 --type age-elevation
```

### 4. Database Operations

```bash
# Connect to database
npm run db:psql

# Test connection
npx tsx scripts/db/test-connection.ts

# Export schema
npx tsx scripts/db/export-schema.ts

# ⚠️ Reset database (DANGEROUS)
npx tsx scripts/db/reset-database.ts
```

---

## Documentation

**`EARTHBANK_IMPORT_GUIDE.md`** - Comprehensive import guide
- EarthBank template structure
- Import workflow
- Troubleshooting

**`README.md`** (in scripts/db/) - Database utilities guide
- Connection patterns
- Import workflows
- Migration procedures

---

## Dependencies

**Python packages:**
- pandas - Data manipulation
- openpyxl - Excel reading
- psycopg2 - PostgreSQL connection
- pdfplumber - PDF extraction
- camelot-py - Table extraction
- plotly - Scientific visualization
- numpy, scipy - Statistical analysis

**Node.js packages:**
- exceljs - Excel template reading
- @vercel/postgres - Neon connection
- tsx - TypeScript execution

---

## Notes

- **Database scripts:** Always use safe wrappers (`psql-direct.sh`, `psql-pooled.sh`)
- **Import order:** Datasets → Samples → Datapoints → Grain data
- **Extraction:** Use `/thermoextract` command (wraps extraction_engine.py)
- **Analysis:** Load data with `data_loaders.py`, visualize with plot scripts

---

**For detailed script documentation, see:**
- `readme/scripts/db/` - Database script docs
- `readme/scripts/pdf/` - PDF extraction docs
- `readme/scripts/analysis/` - Analysis script docs
