# Living Documentation Changes Log

**Last Updated:** 2025-11-18 07:15:00

Auto-generated log of documentation updates from `/bigtidy` runs.

---

## 2025-11-18 07:15:00

### ✅ Project Structure Cleanup + Schema Migration Analysis

**Phase 1 & 2: Structure Cleanup**
- ✅ Moved 3 documentation files from root → `build-data/documentation/`
- ✅ Moved 1 backup SQL file → `build-data/archive/`
- ✅ Updated PROJECT_INDEX.json (172 code files, 57 docs)
- ✅ All safe zones verified clean

**Files Moved:**
- `SUPPLEMENTARY-FILES-SUMMARY.md` → `build-data/documentation/`
- `DATA-EXTRACTION-CHECKLIST.md` → `build-data/documentation/`
- `EARTHBANK-TEMPLATE-SCHEMA.md` → `build-data/documentation/`
- `backup-pre-earthbank-migration-20251118-150558.sql` → `build-data/archive/`

**Phase 3: Schema Migration Analysis** 🚨

#### Critical Finding: Schema Split Detected

**Old Schema (Deprecated):** 12 files still reference `ft_ages`, `ft_datapoints`, `he_datapoints`
**New Schema (EarthBank):** 12 files use `earthbank_ftDatapoints`, `earthbank_samples`, etc.

**Most Critical Issue:**
- ⚠️ `lib/db/queries.ts` - Main query layer uses **100% old schema** (11+ SQL queries)
- ⚠️ `app/api/datasets/[id]/table-counts/route.ts` - Uses old schema
- ✅ `app/api/tables/[name]/route.ts` - Already migrated to new schema
- ✅ `app/datasets/page.tsx` - Already migrated to new schema

**Generated Documentation:**
- ✅ `readme/code-quality/SCHEMA_USAGE_ANALYSIS.md` - Comprehensive schema split analysis
- ✅ Identified 12 files using old schema vs 12 using new schema
- ✅ Created migration roadmap (4 phases)
- ✅ Listed all breaking changes (table names + field names)

**Migration Status:**
- **Phase 1 (Critical):** Migrate `lib/db/queries.ts` to use `earthbank_*` tables
- **Phase 2:** Update API routes (`table-counts`, `stats`, `analysis/ages`)
- **Phase 3:** Update or deprecate legacy scripts
- **Phase 4:** Update Python analysis scripts

### New Files Created
- `readme/code-quality/SCHEMA_USAGE_ANALYSIS.md` (comprehensive)

### Files Updated
- `readme/BIGTIDY_CHANGES.md` (this file)
- `PROJECT_INDEX.json` (refreshed)

### Statistics

**Project Structure:**
- Files moved: 4
- Root directory: Clean ✓
- Build-data organized: ✓

**Schema Analysis:**
- Tables in database: 25 (old schema: 19, new schema: 6+)
- Files using old schema: 12
- Files using new schema: 12
- Critical files needing migration: 2 (`lib/db/queries.ts`, `table-counts/route.ts`)

**Code Analysis:**
- Total code files: 172
- Files with database queries: 24+
- Main query interface: `lib/db/queries.ts` (needs migration!)
- New query interface: `lib/db/earthbank-queries.ts` (ready but unused)

### Key Findings

**Schema Migration Status:**
- 🚨 **INCOMPLETE** - Codebase split between old and new schemas
- 🚨 **BLOCKER** - Main query layer (`lib/db/queries.ts`) still uses old schema
- ✅ **PROGRESS** - 3 pages already migrated (datasets, datasets/[id], tables/[name])
- ✅ **READY** - New types exist (`lib/types/earthbank-types.ts`)
- ✅ **READY** - New queries exist (`lib/db/earthbank-queries.ts`)

**Recommended Next Actions:**
1. Create ERROR-012: Schema Migration Incomplete
2. Migrate `lib/db/queries.ts` to use `earthbank_*` tables
3. Update field names from snake_case → camelCase (with double quotes)
4. Update API routes to use new schema
5. Test thoroughly before removing old tables

### Related Issues
- **IDEA-014:** Migrate to EarthBank Native Schema (camelCase 1:1 template mapping) - IN PROGRESS
- **ERROR-011:** Schema Mismatch - Analysis API uses deleted ft_ages table (ARCHIVED)
- **New:** ERROR-012 (to be created) - Schema Migration Incomplete

---

## 2025-11-18 01:35:00

### ✅ First Living Documentation Run Complete

**Phase 1 & 2: Structure Analysis**
- ✅ Project structure verified - already perfectly organized
- ✅ All safe zones validated against PROJECT_INDEX.json
- ✅ No files needed to be moved
- ✅ Root directory clean (only essential config files)

**Phase 3: Living Documentation Generation**

#### Database Schema
- ✅ Downloaded current schema from Neon PostgreSQL (19 tables)
- ✅ Generated schema snapshot: `database/.schema-snapshot.sql`
- ✅ Created comprehensive schema summary: `database/SCHEMA_SUMMARY.md`
- ✅ Identified table relationships and foreign keys
- ✅ Documented all 19 tables with purpose and column counts

**Tables Documented:**
- Core Infrastructure: datasets, samples, people, batches, reference_materials, grains, mounts
- Fission-Track: ft_datapoints, ft_count_data, ft_single_grain_ages, ft_track_length_data, ft_binned_length_data
- (U-Th)/He: he_datapoints, he_whole_grain_data
- Linking: sample_people_roles, datapoint_people_roles
- Metadata: data_files, fair_score_breakdown
- Legacy: ahe_grain_data (v1 schema)

#### Code Documentation
- ✅ Analyzed 132 files from PROJECT_INDEX.json
- ✅ Detected database interactions in 25+ code files
- ✅ Generated code-to-database cross-reference map: `database/CODE_USAGE.md`
- ✅ Mapped all queries through `lib/db/queries.ts`
- ✅ Identified import scripts and migration utilities

**Files with Database Access:**
- **Primary Interface:** `lib/db/queries.ts` (ALL queries)
- **Import Scripts:** 5 files (EarthBank templates, Malawi data, v1→v2 migration)
- **API Routes:** 5 files (datasets, samples, analysis endpoints)
- **Analysis Scripts:** 3 Python files (statistical plots, spatial plots, data loaders)
- **UI Components:** 7 files (dataset cards, FAIR scores, download sections)

**Most Accessed Tables:**
1. `samples` - 25+ files
2. `ft_datapoints` - 20+ files
3. `he_datapoints` - 15+ files
4. `datasets` - 12+ files
5. `ft_count_data` - 8+ files

#### Cross-Reference Maps
- ✅ Created comprehensive code → database mapping
- ✅ Documented read vs write operations for each table
- ✅ Listed line numbers for all database interactions
- ✅ Identified which components use which tables

### Documentation Structure Created

```
/readme/
├── database/
│   ├── .schema-snapshot.sql          ← Schema bones (19 tables)
│   ├── SCHEMA_SUMMARY.md             ← All tables overview
│   ├── CODE_USAGE.md                 ← Code ↔ tables map
│   └── tables/                       ← Existing individual table docs
├── DATABASE_FIELD_REFERENCE.md       ← Field reference guide
├── INDEX.md                          ← Master index (existing)
└── BIGTIDY_CHANGES.md               ← This file (NEW)
```

### Statistics

**Database:**
- Total tables: 19
- Schema downloaded: Yes ✓
- Previous snapshot: None (first run)
- Schema changes detected: N/A (baseline)

**Code Analysis:**
- Total files in project: 132
- Files with DB access: 25+
- Primary query interface: `lib/db/queries.ts`
- Import scripts: 5
- API routes with DB: 5
- UI components with DB: 7
- Analysis scripts: 3

**Documentation Generated:**
- New files: 3 (schema snapshot, schema summary, code usage map)
- Updated files: 1 (this changelog)
- Tables documented: 19
- Code files analyzed: 132

### Key Findings

**Architecture Patterns:**
- ✅ **Excellent separation:** 99% of reads go through `lib/db/queries.ts`
- ✅ **Zero direct SQL in UI:** All components use query functions
- ✅ **Dedicated import scripts:** Write operations isolated in scripts/db/
- ✅ **Strong typing:** TypeScript interfaces match database schema
- ✅ **Connection pooling:** Efficient connection management in lib/db/connection.ts

**Database Design:**
- ✅ **Datapoint-centric:** 1 sample → many datapoints → many grains (excellent for QC)
- ✅ **FAIR compliant:** EarthBank integration + Kohn 2024 standards
- ✅ **Provenance tracking:** People + roles for samples and datapoints
- ✅ **Batch QC:** Reference materials linked to batches

### Next Steps

**For Future Runs:**
1. Schema comparison (detect changes vs baseline)
2. Incremental updates (only analyze changed files)
3. Generate code documentation for individual files
4. Track schema evolution over time

**For Developers:**
- All database queries documented in `database/CODE_USAGE.md`
- Schema overview at `database/SCHEMA_SUMMARY.md`
- Field reference at `DATABASE_FIELD_REFERENCE.md`
- Individual table docs in `database/tables/`

---

**Generated by:** `/bigtidy` living documentation system
**Runtime:** ~2 minutes
**Tokens used:** ~15k
**Next update:** Run `/bigtidy` to detect schema changes and update documentation
