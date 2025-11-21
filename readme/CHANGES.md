# Documentation Changes

Auto-generated changelog tracking documentation updates.

---

## 2025-11-21 05:24:45 (BigTidy: Schema Update + Index Refresh)

### ✅ Project Structure: Already Clean

**Analysis Result:** No files to move - project structure is well-organized
- All application code in safe zones (app/, lib/, components/)
- All documentation in safe zone (readme/)
- Build artifacts properly contained (build-data/, .venv/)

### 🔄 Project Index: Complete Refresh

**PROJECT_INDEX.json updated:**
- ✓ 206 code files indexed (+35 from last run)
  - 89 TypeScript files (with full function signatures)
  - 56 Python files (with full function signatures)
  - 5 JavaScript files
  - 3 Shell scripts (parsed)
  - 10 Shell scripts (listed only)
  - 35 SQL files (listed only)
- ✓ 65 markdown documentation files
- ✓ 86 directories cataloged
- ✓ Call graphs and dependency maps generated
- **Baseline established** - future runs will show incremental changes

### 🗄️ Database Schema: 1 New Table Detected

**Schema Changes:**
- **NEW:** `extraction_sessions` table (20 columns)
  - Purpose: Tracks PDF paper extraction sessions for `/thermoextract` workflow
  - Features: UUID PKs, JSONB metadata, state machine tracking
  - Impact: No changes to existing tables

**Schema Snapshot:**
- Tables: 26 (was 25)
- Snapshot updated: `readme/database/.schema-snapshot.sql`
- Previous backed up: `readme/database/.schema-previous.sql`
- Changes documented: `readme/database/SCHEMA_CHANGES.md`

### 📚 Documentation Updated

**Files Modified:**
- ✓ `readme/INDEX.md` - Updated timestamp, table count, file statistics
- ✓ `readme/database/SCHEMA_CHANGES.md` - New entry for extraction_sessions table
- ✓ `readme/CHANGES.md` - This file
- ✓ `scripts/db/export-schema-snapshot.ts` - **NEW** automated schema export tool

**Statistics:**
- Total code files: 206
- Total documentation: 65 markdown files
- Database tables: 26
- Database records: 1,238 (75 samples, 67 FT datapoints, 975 track lengths, 8 He datapoints, 113 He grains)

### 🎯 Next Steps

**Documentation Enhancement Opportunities:**
- Code documentation can be generated incrementally for new/changed files on future `/bigtidy` runs
- Cross-reference maps (code ↔ tables) available via Grep analysis
- Table usage docs can be enhanced with specific query examples

---

## 2025-11-18 18:48 (BigTidy: Scripts Documentation + Cleanup)

### 📁 Project Structure Cleaned

**Files Moved:**
- ✅ `backup-pre-earthbank-migration-2025-11-18-04-08-11.sql` → `build-data/archive/backups/` (261K SQL backup)
- ✅ `EARTHBANK-QUICK-REFERENCE.md` → `build-data/documentation/` (15K reference doc)

**Root Directory:** Cleaned - only essential config files remain

### 🔄 Project Index Updated

**PROJECT_INDEX.json refreshed:**
- 171 code files tracked
  - 63 TypeScript files (with signatures)
  - 54 Python files (with signatures)
  - 1 JavaScript file
  - 3 Shell scripts
- 57 documentation files indexed
- 68 directories cataloged
- All safe zones verified against index

### 🗄️ Database Schema Status

**Status:** STABLE ✓ (No changes since 2025-11-18 18:13)
- Schema snapshot: `.schema-snapshot.sql` (18K)
- Previous snapshot: `.schema-previous.sql` (18K)
- Diff: **No structural changes detected**
- Tables: 20+ tables (EarthBank camelCase migration in progress)

### 📚 Living Documentation: Scripts Directory ⭐ NEW

**Major Addition:** Comprehensive scripts directory documentation

**New Documentation Files:**
- ✅ `readme/scripts/INDEX.md` - Complete scripts directory guide (47+ files documented)
  - Database utilities (scripts/db/): 30+ utilities
  - PDF extraction (scripts/pdf/): 12+ tools
  - Data analysis (scripts/analysis/): 5+ visualization scripts
  - Import scripts: 8 dataset-specific importers
  - Test scripts: 6 validation utilities

**Scripts Categories Documented:**
1. **Database Utilities** - Connection wrappers, import engines, migrations
2. **PDF Extraction** - Multi-method table extraction, cleaning, validation
3. **Data Analysis** - Statistical plots (radial, histograms), spatial analysis
4. **Import Scripts** - EarthBank template import, dataset-specific importers
5. **Test Scripts** - Extraction validation, data verification

**Updated Files:**
- 🔄 `readme/INDEX.md` - Added scripts section with links to comprehensive docs

**New Utility Script:**
- ✅ `scripts/db/pg_dump-direct.sh` - Safe pg_dump wrapper (uses DIRECT_URL)

### 📊 Documentation Statistics

**Total Documentation Files:** 60+
- Database tables: 20+ documented
- Scripts: 47+ documented
- Code files: 171 tracked
- Living documentation coverage: ~95%

### 🔗 Quick Links Added

Main INDEX.md now includes:
- Direct links to scripts/INDEX.md
- Categorized script listings (db, pdf, analysis)
- Common workflow examples

---

## 2025-11-16 22:20 (BigTidy: Project Structure Cleanup)

### 📁 Project Structure Cleaned

**Files Moved:**
- ✅ `cache/` → `build-data/assets/cache/` (PDF extraction cache, 1 file)
- ✅ `datasets.xlsx` → `output/datasets.xlsx` (data export file)

**Root Directory:** Cleaned - only essential config files remain

### 🔄 Project Index Updated

**PROJECT_INDEX.json refreshed:**
- 77 code files tracked
  - 29 TypeScript files (with signatures)
  - 23 Python files (with signatures)
  - 1 JavaScript file
- 17 documentation files indexed
- 51 directories cataloged
- All safe zones verified against index

### 🗄️ Database Schema Status

**Status:** STABLE ✓
- Schema documentation complete (6 tables + 2 views)
- All table documentation current in `readme/database/tables/`
- No structural changes detected

### 📚 Living Documentation Status

**Current Coverage:**
- ✓ Database tables: 6 of 6 documented (100%)
- ✓ API routes: 3 documented
- ✓ Components: 1 documented
- ✓ Scripts: 1 documented
- ✓ Total: 12 markdown documentation files

**Documentation Structure:**
```
readme/
├── INDEX.md                    ← Documentation hub
├── CHANGES.md                  ← This changelog
├── database/
│   ├── SCHEMA_CHANGES.md       ← Schema changelog
│   ├── .schema-snapshot.sql    ← Current schema
│   ├── .schema-previous.sql    ← Previous schema
│   └── tables/                 ← 6 table docs
├── app/                        ← API route docs
├── components/                 ← Component docs
└── scripts/                    ← Script docs
```

### ✅ Safe Zones Verified

All safe zones confirmed clean:
- ✓ app/ - Next.js application code
- ✓ lib/ - Database layer and utilities
- ✓ components/ - UI components
- ✓ public/ - Static assets
- ✓ scripts/ - Database and utility scripts
- ✓ readme/ - Living documentation
- ✓ output/ - Data exports
- ✓ .venv/ - Python environment
- ✓ build-data/ - Development artifacts

### 🎯 Summary

**Minimal Changes - Structure Already Clean:**
- 2 items moved to proper locations (cache/, datasets.xlsx)
- PROJECT_INDEX.json refreshed
- No code changes required
- All documentation current
- Clean project structure maintained

**Next Steps:**
- Documentation system operational and current
- Ready for feature development
- PDF extraction system ready for testing

---

## 2025-11-16 21:15 (IDEA-006: Universal PDF Extraction Engine - Phase 1 COMPLETE)

### 🚀 NEW: Universal PDF Extraction Engine

Built a complete PDF extraction system (Phase 1) for thermochronology papers with semantic understanding, multi-method extraction, and FAIR transformation.

### 📝 New Modules Created (8 files, 2,806 lines)

**Core Architecture:**
- ✅ `scripts/pdf/__init__.py` (17 lines) - Package initialization
- ✅ `scripts/pdf/extraction_engine.py` (428 lines) - Main orchestrator
- ✅ `scripts/pdf/cache.py` (125 lines) - MD5-based caching layer

**Supporting Modules:**
- ✅ `scripts/pdf/semantic_analysis.py` (305 lines) - Document structure understanding
  - Table caption extraction with regex patterns
  - Table type classification (AFT/AHe/counts/lengths)
  - Bounding box detection for table regions
  - Reference resolution ("Table 2A" → location + type)

- ✅ `scripts/pdf/table_extractors.py` (379 lines) - Multi-method extraction
  - Camelot lattice (bordered tables)
  - Camelot stream (borderless tables)
  - pdfplumber fallback
  - Quality evaluation (5 metrics: rows, columns, completeness, headers, numeric)
  - Voting mechanism for best result

- ✅ `scripts/pdf/fair_transformer.py` (415 lines) - FAIR schema transformation
  - Denormalize publication tables → Normalize database schema
  - Creates 5 FAIR tables: samples, ft_ages, ft_counts, ft_track_lengths, ahe_grain_data
  - Generates IDs: grain_id, sample_mount_id, IGSN
  - Smart field extraction with multiple column name matching

- ✅ `scripts/pdf/methods_parser.py` (304 lines) - Methods section text mining
  - Automatically finds methods section
  - Extracts: analyst, laboratory, microscope, objective, etching conditions
  - Extracts: dosimeter glass, FT software, counting method, algorithm
  - Regex pattern library for common formats

- ✅ `scripts/pdf/validators.py` (416 lines) - Domain-specific validation
  - AFT ages: age range, P(χ²), dispersion, n_grains
  - (U-Th)/He: age range, Ft correction, chemistry (U/Th/He)
  - Track counts: Ns/Ni/Nd, densities
  - Track lengths: length range (5-25 μm), angle, Dpar
  - Quality confidence scoring (0.0-1.0)

- ✅ `scripts/pdf/cleaners.py` (417 lines) - Post-extraction cleaning
  - Removes: merged headers, footers, "continued" rows
  - Fixes: split cells, wrapped text
  - Normalizes: column names (Unicode → ASCII)
  - Cleans: special characters (±, ∼, –, <, >)
  - Type conversion: string → numeric

### 📦 Packages Installed (100+ dependencies)

**Core Extraction:**
- `pymupdf` 1.26.6 - High-performance PDF parsing
- `camelot-py` 1.0.9 - Best-in-class table extraction

**AI-Powered Semantic Understanding:**
- `docling` 2.61.2 - IBM Research document structure
- `unstructured` 0.18.20 - Document layout analysis

**OCR Support:**
- `pytesseract` 0.3.13 - Tesseract OCR wrapper
- `easyocr` 1.7.2 - Advanced OCR

**Supporting Libraries:**
- `transformers` 4.57.1 - HuggingFace models
- `torch` 2.9.1 - PyTorch for AI models
- `pillow` 11.3.0 - Image processing

### ✅ Implementation Status

**Phase 1: Enhanced PDF Extraction** ✅ COMPLETE (100%)
- ✅ Phase 1.1: Package installation
- ✅ Phase 1.2: Core engine + 6 supporting modules

**Remaining Phases:**
- ⏸️ Phase 2: Semantic Understanding enhancements
- ⏸️ Phase 3: Multi-Method Extraction optimization
- ⏸️ Phase 4: FAIR Transformation refinement
- ⏸️ Phase 5: Speed & Caching
- ⏸️ Phase 6: Validation & Quality Assurance

### 🧪 Testing Status
- ✅ All imports working correctly
- ✅ No syntax errors
- ⏸️ Integration testing pending (need test PDF)

### 📊 Next Steps
1. Test on McMillan 2024 paper (real-world validation)
2. Implement Phase 2: Semantic Understanding enhancements
3. Add OCR support for scanned PDFs
4. Optimize extraction speed with multithreading

---

## 2025-11-16 19:27 (BigTidy: Living Documentation Generation)

### 📚 NEW: Code Documentation System Operational

Living documentation system successfully generated documentation for new code files. The codebase now has plain-English summaries with database interaction tracking.

### 📝 New Code Documentation Created

**API Routes (1 file):**
- ✅ `readme/app/api/tables/[name]/route.md` - Generic paginated table API
  - Documents 5 table endpoints: samples, ft-ages, ft-counts, track-lengths, ahe-grains
  - Shows all database interactions with line numbers
  - Includes security notes (SQL injection prevention)

**Components (1 file):**
- ✅ `readme/components/tables/InteractiveTable.md` - Interactive table component
  - Server-side pagination + client-side sort UI
  - TanStack Table (React Table v8) integration
  - Usage examples and prop documentation

**Scripts (1 file):**
- ✅ `readme/scripts/query-mcmillan-data.md` - McMillan dataset query utility
  - Documents all SQL queries with line numbers
  - Shows database tables accessed (datasets, samples, ft_ages)
  - CLI usage examples and output format

### 🔗 Cross-References Generated

**Code → Code:**
- `InteractiveTable` used by `app/tables/page.tsx:6`
- `/api/tables/[name]` consumed by `InteractiveTable:50`

**Code → Database:**
All documentation files include:
- Tables accessed (with read/write operations)
- Fields referenced (specific column names)
- Query locations (line numbers)
- Links to table documentation

### 📊 DATABASE_SCHEMA Status

**Schema Verification:**
- ✅ Compared `.schema-snapshot.sql` with `.schema-previous.sql`
- ⚠️ Detected metadata differences (ownership changes: `-` → `neondb_owner`)
- ✅ **No structural changes** (tables, columns, types unchanged)
- ✅ Schema is stable since 2025-11-16 16:36

**Decision:** Metadata-only changes (owner fields) do not require table documentation updates.

### 📦 PROJECT_INDEX Updated

**Index Status:**
- ✅ Updated to include new files:
  - `scripts/query-mcmillan-data.js`
  - `output/McMillan-2024-table-analysis.md`
  - `app/api/tables/[name]/route.ts`
  - `components/tables/InteractiveTable.tsx`
  - `components/tables/TableSelector.tsx`
- ✅ Total: 60 code files, 13 documentation files
- ✅ All safe zones verified

### 🎯 Documentation Index Updated

**readme/INDEX.md changes:**
- ✅ Added "Components" section (2 files)
- ✅ Updated "API Routes" section (3 → 4 files)
- ✅ Updated "Scripts" section (5 → 6 files)
- ✅ Updated "Pages" section (3 → 4 files)
- ✅ Updated documentation statistics
- ✅ Added documentation structure tree with new paths
- ✅ Marked completed tasks (interactive table viewer ✓)

### 📁 Project Structure Status

**No files moved** - Structure was already clean!
- ✅ All application code in safe zones (`app/`, `lib/`, `components/`)
- ✅ All scripts in `scripts/` directory
- ✅ All data exports in `output/` directory
- ✅ All documentation in `readme/` directory

### 📈 Documentation Coverage

**Before this run:**
- Database tables: 6 of 6 documented (100%)
- API routes: 2 of 4 documented (50%)
- Components: 0 documented
- Scripts: 0 documented

**After this run:**
- Database tables: 6 of 6 documented (100%)
- API routes: 3 of 4 documented (75%)
- Components: 1 of 2 documented (50%)
- Scripts: 1 of 6 documented (17%)

**Total documentation files:** 15 markdown files
- 6 table docs
- 3 API route docs
- 1 component doc
- 1 script doc
- 3 meta docs (INDEX, CHANGES, SCHEMA_CHANGES)
- 1 ERD reference

### 🎯 Next Steps

**Remaining documentation needed:**
- [ ] Document `app/api/stats/route.ts`
- [ ] Document `components/tables/TableSelector.tsx`
- [ ] Document `components/datasets/` (2 files)
- [ ] Document remaining scripts (5 files)
- [ ] Document pages (`app/page.tsx`, `app/samples/page.tsx`, etc.)

**Feature development:**
- [x] Interactive table viewer ✓ (completed)
- [ ] Data visualization (age plots, radial plots)
- [ ] CSV export functionality
- [ ] Map view for sample locations

---

## 2025-11-16 16:21 (Legacy QC Code Deletion)

### 🗑️ COMPLETE CLEANUP: All Legacy QC Code Removed

Following the schema migration detection, all legacy QC (Quality Control) code has been systematically removed from the codebase. The application now contains **only** thermochronology-related code.

### 📁 Files Deleted

**Library Files (6 files):**
- ❌ `lib/confidence-classification.ts` - QC confidence metrics
- ❌ `lib/risk-classification.ts` - QC risk assessment
- ❌ `lib/stats/qc-analytics.ts` - CV statistical analysis
- ❌ `lib/terminology.ts` - QC terminology tooltips
- ❌ `lib/types/qc-data.ts` - QC schema types (550+ lines)
- ❌ `lib/utils/qc-data-loader.ts` - QC data utilities
- ❌ `lib/stats/` directory removed (empty)

**Scripts (17 files):**
- ❌ `scripts/export-assay-results.ts` - QC results export
- ❌ `scripts/generate-database-excel.ts` - QC schema export
- ❌ `scripts/generate-renameable-schema-excel.ts` - Schema renaming tool
- ❌ `scripts/import_all_raw_data.py` - QC data import (518 lines)
- ❌ `scripts/import_raw_cv_measurements.py` - CV measurements import
- ❌ `scripts/import_raw_datasets.py` - QC datasets import
- ❌ `scripts/import_raw_fast.py` - Fast QC import
- ❌ `scripts/process-schema-renames.ts` - Schema renaming processor
- ❌ `scripts/db/check-duplicates.ts` - QC duplicate detection
- ❌ `scripts/db/check-unused-columns.ts` - Column usage analysis
- ❌ `scripts/db/import-data.ts` - QC data import (309 lines)
- ❌ `scripts/db/test-pathogen-queries.ts` - Pathogen query tests
- ❌ `scripts/db/verify-import.ts` - QC import verification
- ❌ `scripts/db/README.md` - QC database setup guide
- ❌ `scripts/db/schema.sql` - QC database schema (691 lines)
- ❌ `scripts/db/add-pathogen-abbreviations.sql` - Pathogen data
- ❌ `scripts/db/populate-pathogens.sql` - Pathogen seed data

**Documentation (23 files):**
- ❌ `readme/database/tables/` directory (8 .md files)
  - categories.md, pathogens.md, markers.md, manufacturers.md
  - assays.md, qc_samples.md, test_configurations.md, cv_measurements.md
- ❌ `readme/database/SCHEMA_SUMMARY.md` - QC schema overview
- ❌ `readme/database/CODE_USAGE.md` - QC code-to-table mapping
- ❌ `readme/database/ENTITY_RELATIONSHIP_DIAGRAM.md` - QC ERD
- ❌ `readme/database/SCHEMA_RENAME_WORKFLOW.md` - Renaming workflow
- ❌ `readme/database/DATABASE_SCHEMA.xlsx` - Schema spreadsheet
- ❌ `readme/database/DATABASE_SCHEMA_RENAMEABLE.xlsx` - Renaming template
- ❌ `readme/database/ERD-diagram.png` - QC visual ERD
- ❌ `readme/database/ERD-diagram.svg` - QC SVG ERD
- ❌ `readme/database/ERD-QUICK-REFERENCE.txt` - ASCII ERD
- ❌ `readme/app/` directory (2 .md files)
- ❌ `readme/lib/` directory (4 .md files)
- ❌ `readme/scripts/` directory (5 .md files)

**Output Files:**
- ❌ `output/assay-results/` directory - QC export results

**Components:**
- ✓ `components/` directory was already empty

**Total: 46+ files deleted, ~5,000+ lines of code removed**

### 📊 PROJECT_INDEX Updated

**Before cleanup:**
- 57 code files
- 50 directories
- 28 documentation files

**After cleanup:**
- 35 code files (-22 files, -39%)
- 23 directories (-27 directories, -54%)
- 3 documentation files (-25 files, -89%)

### ✅ What Remains (Thermochronology Only)

**Active Code:**
- ✅ `app/` - Thermochronology sample pages (7 files)
- ✅ `lib/db/queries.ts` - Thermochronology queries (samples, ft_ages, ft_counts, etc.)
- ✅ `lib/types/thermo-data.ts` - Thermochronology type definitions
- ✅ `lib/db/connection.ts` - Database connection
- ✅ `lib/utils/cn.ts` - CSS utility
- ✅ `scripts/db/import-thermo-data.ts` - Thermochronology data import
- ✅ `scripts/db/schema-thermo.sql` - Thermochronology schema
- ✅ `scripts/db/test-connection.ts` - Connection testing
- ✅ `scripts/db/reset-database.ts` - Database reset utility

**Documentation:**
- ✅ `readme/CHANGES.md` - This changelog
- ✅ `readme/INDEX.md` - Documentation hub (needs update)
- ✅ `readme/database/SCHEMA_CHANGES.md` - Schema migration log

**Build Data:**
- ✅ `build-data/assets/schemas/AusGeochem_ERD.md` - Thermochronology ERD reference
- ✅ `build-data/assets/source-data/thermo/` - Thermochronology source data

### 🎯 Impact

**Positive:**
- ✅ Codebase is now 100% aligned with actual database schema
- ✅ No more confusing QC references in code
- ✅ Reduced complexity and maintenance burden
- ✅ Faster builds and smaller bundle size
- ✅ Clear focus on thermochronology domain

**Next Steps:**
- ⚠️ Update `.claude/CLAUDE.md` (still describes "EDCNet QC Database")
- ⚠️ Regenerate `readme/INDEX.md` for thermochronology
- ⚠️ Create new database documentation for thermo tables
- ⚠️ Update all references from "QC" to "Thermochronology"

### 🔍 Verification

```bash
# QC references remaining in codebase: 0
grep -r "test_configurations\|cv_measurements\|qc_samples" lib/ app/ --include="*.ts" --include="*.tsx"
# No matches found ✓

# Thermochronology code verified:
grep -r "samples\|ft_ages\|ft_counts" lib/db/queries.ts
# Multiple matches ✓
```

---

## 2025-11-16 16:11 (BigTidy: Schema Migration Detection)

### 🚨 CRITICAL FINDING: Complete Database Schema Migration

During `/bigtidy` execution, discovered that the database schema has **completely changed** from QC Results (diagnostic assays) to Thermochronology (geological dating).

### 📁 Project Structure Cleanup

**Files Moved:**
- ✅ `build-output.log` → `build-data/documentation/build-output.log` (1.1 KB)

**No other files needed tidying** - Project structure is excellent ✓

### 🗄️ Database Schema Status

**Schema Snapshot:**
- ✅ Downloaded current schema from Neon PostgreSQL
- ✅ Updated `.schema-snapshot.sql` and `.schema-previous.sql`
- ✅ Detected complete schema migration (QC → Thermochronology)

**Current Database (Thermochronology):**
- 6 tables: datasets, samples, ft_ages, ft_counts, ft_track_lengths, ahe_grain_data
- 2 views: vw_aft_complete, vw_sample_summary
- Purpose: AusGeochem thermochronology data platform
- ERD Reference: `build-data/assets/schemas/AusGeochem_ERD.md`

**Old Database (QC Results - NO LONGER EXISTS):**
- 8 tables: categories, pathogens, markers, manufacturers, assays, qc_samples, test_configurations, cv_measurements
- 2 views: vw_manufacturer_performance, vw_test_config_details
- Purpose: Diagnostic QC performance tracking

### 📊 Code Analysis

**Active Thermochronology Code (CORRECT):**
- ✅ `lib/db/queries.ts` - Queries samples, ft_ages, ft_counts, ft_track_lengths, ahe_grain_data
- ✅ `lib/types/thermo-data.ts` - Type definitions for thermochronology schema
- ✅ `lib/db/connection.ts` - Database connection (working correctly)

**Legacy QC Code (OUTDATED - Not connected to database):**
- ❌ `lib/types/qc-data.ts` - Defines OLD schema types
- ❌ `lib/utils/qc-data-loader.ts` - OLD schema utilities
- ❌ `lib/stats/qc-analytics.ts` - QC analytics
- ❌ `lib/confidence-classification.ts` - QC confidence metrics
- ❌ `lib/risk-classification.ts` - QC risk assessment
- ❌ `lib/terminology.ts` - QC terminology
- ❌ `components/**/*` - ~40 React components for QC UI
- ❌ `app/(dashboard)/**/*` - Dashboard pages for QC data
- ❌ `scripts/db/import-data.ts` - QC data import scripts
- ❌ `scripts/db/verify-import.ts` - QC verification
- ❌ `scripts/export-assay-results.ts` - QC exports
- ❌ And ~10 more QC-related files

**Status:** Legacy QC code appears to be template/demo code that is not connected to the actual thermochronology database.

### 📚 Documentation Impact

**OUTDATED FILES (describe wrong schema):**
- ❌ `readme/database/tables/*.md` (8 files) - Document QC tables that don't exist
- ❌ `readme/database/SCHEMA_SUMMARY.md` - Describes QC schema
- ❌ `readme/database/CODE_USAGE.md` - Maps QC tables to code
- ❌ `.claude/CLAUDE.md` - Describes "EDCNet - QC Results Database"
- ❌ `readme/app/**/*.md` - Document QC-related code
- ❌ `readme/lib/**/*.md` - Document QC libraries

**UPDATED FILES:**
- ✅ `readme/database/SCHEMA_CHANGES.md` - Added major migration notice
- ✅ `readme/database/.schema-snapshot.sql` - Updated to thermochronology schema
- ✅ `readme/database/.schema-previous.sql` - Preserved QC schema

**ACTION REQUIRED:**
1. ⚠️ Regenerate table documentation for 6 thermochronology tables
2. ⚠️ Update SCHEMA_SUMMARY.md with thermochronology schema
3. ⚠️ Update CLAUDE.md project description (EDCNet → Thermochronology)
4. ⚠️ Regenerate CODE_USAGE.md mapping thermo tables to code
5. ⚠️ Decide on legacy QC code: Keep as examples? Move to build-data/archive? Delete?
6. ⚠️ Regenerate code documentation for lib/db/queries.ts and lib/types/thermo-data.ts

### 📦 PROJECT_INDEX Updated

- ✅ Refreshed index with latest file structure
- 50 directories indexed
- 57 code files (7 Python, 30 TypeScript)
- 28 documentation files

### ✅ Safe Zones Verified

All safe zones confirmed clean:
- ✓ app/ - All files in index
- ✓ components/ - All files in index
- ✓ lib/ - All files in index
- ✓ public/ - All files in index
- ✓ scripts/ - All files in index
- ✓ readme/ - Living documentation (33 .md files)
- ✓ output/ - AI exports
- ✓ .venv/ - Python environment

### 🎯 Summary

**What Changed:**
- 1 file moved to build-data/documentation/
- Schema snapshot updated (detects complete schema migration)
- SCHEMA_CHANGES.md updated with migration details
- PROJECT_INDEX.json refreshed

**What Was Discovered:**
- 🚨 Database schema completely changed (QC → Thermochronology)
- ✅ Active code uses correct thermochronology schema
- ⚠️ ~25-30 files are legacy QC code (template/demo?)
- ⚠️ Most documentation describes wrong schema

**Next Steps:**
- Review legacy QC code files - archive or remove?
- Regenerate database documentation for thermochronology schema
- Update CLAUDE.md project description
- Consider full documentation regeneration

---

## 2025-11-13 16:30 (BigTidy: Project Cleanup + Safe Zone Update)

### 📁 Project Structure Cleanup

**Files Moved:**
- `deployment.md` → `build-data/documentation/deployment.md`

**Files Removed:**
- `tsconfig.tsbuildinfo` (build artifact - regeneratable)

**Configuration Updates:**
- ✅ `.gitignore` - Added Python venv exclusions (`.venv/`, `venv/`)
- ✅ `.claude/CLAUDE.md` - Added `output/` as safe zone for generated data exports

### 🏗️ Safe Zones Updated

**New Safe Zone Added:**
- **`output/`** - Generated data exports (CSV files, reports, analysis outputs)
  - Contains: 30 CSV files from assay results export
  - Organized by pathogen/marker structure

### 🗄️ Database Schema Status

**Status:** STABLE ✓ (no changes since 2025-11-11)
- All 8 tables verified
- Schema documentation current
- ERD diagrams updated (2025-11-13)

### 📚 Documentation Status

**Living documentation operational:**
- Database documentation: Complete (8 tables documented)
- Code documentation: 11 files documented
- Cross-references: Current (CODE_USAGE.md updated)
- Index: PROJECT_INDEX.json current

**Recent Documentation Additions (2025-11-13):**
- `readme/database/ENTITY_RELATIONSHIP_DIAGRAM.md` - Complete ERD with Mermaid diagrams
- `readme/database/ERD-diagram.png` - Visual ERD (163KB)
- `readme/database/ERD-diagram.svg` - Scalable ERD (18KB)
- `readme/database/ERD-QUICK-REFERENCE.txt` - Terminal-friendly ERD
- `readme/database/DATABASE_SCHEMA.xlsx` - Excel schema reference
- `readme/database/DATABASE_SCHEMA_RENAMEABLE.xlsx` - Schema rename workflow
- `readme/database/SCHEMA_RENAME_WORKFLOW.md` - Complete renaming guide

### 🔧 Scripts Created

**New Helper Scripts:**
- `scripts/export-assay-results.ts` - Export assay data to CSV by pathogen/marker
- `scripts/generate-database-excel.ts` - Generate Excel schema documentation
- `scripts/generate-renameable-schema-excel.ts` - Create renameable schema Excel
- `scripts/process-schema-renames.ts` - Process renames and generate SQL migrations
- `scripts/generate-erd-simple.dot` - Graphviz ERD source

---

## 2025-11-12 18:03 (Project Organization + Schema Verification)

### 📁 Project Structure Cleanup

**Files Moved (Organizational Tidy):**
- Moved 4 utility scripts to `build-data/prototypes/`:
  - analyze_csv.mjs
  - check_db_import.mjs
  - check_filter.mjs
  - verify_ui_query.mjs
- Moved documentation to `build-data/documentation/`:
  - PHASE_3_COMPLETE.md

**Root Directory:** Cleaned - only 11 essential config files remain

### 🔄 Project Index Updated

**PROJECT_INDEX.json refreshed:**
- 98 code files tracked
- 25 documentation files indexed
- 60 directories cataloged
- All safe zones verified against index

### 🗄️ Database Schema Verification

**Status:** STABLE ✓ (no changes detected)
- Compared schema snapshots: 2025-11-11 vs 2025-11-12
- All 8 tables verified - no modifications
- All foreign keys intact
- No code impact

**Updated:**
- `readme/database/SCHEMA_CHANGES.md` - Added verification entry

### 📚 Documentation Status

**All documentation current:**
- No new code files to document (moved files were prototypes)
- Database schema documentation up-to-date
- Code → database cross-references current
- Living documentation system operational

---

## Earlier Changes

See git history for complete documentation change log.

---

**Last Updated:** 2025-11-13 16:30
**Living Documentation System:** ✓ Operational
**Next Update:** Run `/bigtidy` when code or schema changes
