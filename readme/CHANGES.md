# Documentation Changes

Auto-generated changelog tracking documentation updates.

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
