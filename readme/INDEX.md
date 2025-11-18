# AusGeochem Thermochronology - Living Documentation

**Last Updated:** 2025-11-17
**Project:** Next.js + PostgreSQL Thermochronology Database
**Schema Version:** 2.0 (EarthBank FAIR Architecture)

---

## Quick Start

**New to this codebase?** Start here:
1. Read [Database Schema Changes](database/SCHEMA_CHANGES.md) - **CRITICAL: Schema v1 → v2 migration**
2. Understand the [Datapoint Architecture](#key-concepts) (1 sample → many analyses)
3. Check [Database Tables](#database-tables) for schema reference
4. Review [Code Documentation](#code-documentation) for query patterns

**Looking for something specific?**
- Database changes: [SCHEMA_CHANGES.md](database/SCHEMA_CHANGES.md)
- Table documentation: [database/tables/](database/tables/)
- Code usage: [Code by Category](#code-documentation)

---

## Key Concepts

### Schema v2: Datapoint Architecture

**CRITICAL CHANGE:** The database evolved from single-analysis-per-sample to multiple-analyses-per-sample.

**Old (Schema v1 - DEPRECATED):**
```
1 sample → 1 AFT analysis → stored in ft_ages table (REMOVED)
```

**New (Schema v2):**
```
1 sample → many datapoints → each is an analytical session
                          → can be from different labs
                          → can use different methods
                          → full QC metadata per session
```

**Why it matters:**
- Same sample analyzed multiple times for validation
- Inter-laboratory comparison possible
- ORCID-based provenance tracking
- Batch-level QC with reference materials
- **100% EarthBank FAIR compliant**

**Code Impact:**
- Use `getFTDatapointsBySample()` → returns array
- ~~Use `getFTAgesBySample()`~~ → deprecated (returns first datapoint only)

---

## Database Documentation

### Schema Changes

[📄 SCHEMA_CHANGES.md](database/SCHEMA_CHANGES.md) - Complete schema evolution log

**Latest:** 2025-11-17 - Major expansion (6 → 20 tables) for EarthBank FAIR compliance

### Database Tables (20)

#### Core Infrastructure (7 tables)
- [datasets](database/tables/datasets.md) - Data packages with DOI, privacy controls
- [samples](database/tables/samples.md) - **PRIMARY TABLE** - Geological samples with IGSN
- [batches](database/tables/batches.md) - Analytical batches linking unknowns to standards
- [reference_materials](database/tables/reference_materials.md) - QC standards (Durango, etc.)
- [people](database/tables/people.md) - Individuals (ORCID-based provenance)
- [mounts](database/tables/mounts.md) - Physical epoxy mounts
- [grains](database/tables/grains.md) - Individual grains within mounts

#### Fission-Track Data (5 tables)
- [ft_datapoints](database/tables/ft_datapoints.md) - **CORE TABLE** - FT analytical sessions
- [ft_count_data](database/tables/ft_count_data.md) - Grain-by-grain count data
- [ft_single_grain_ages](database/tables/ft_single_grain_ages.md) - Single grain ages
- [ft_track_length_data](database/tables/ft_track_length_data.md) - Individual track measurements
- [ft_binned_length_data](database/tables/ft_binned_length_data.md) - Binned length histograms

#### (U-Th)/He Data (2 tables)
- [he_datapoints](database/tables/he_datapoints.md) - (U-Th)/He analytical sessions
- [he_whole_grain_data](database/tables/he_whole_grain_data.md) - Grain-level (U-Th)/He results

#### Provenance Linking (2 tables)
- [sample_people_roles](database/tables/sample_people_roles.md) - Sample→People→Roles
- [datapoint_people_roles](database/tables/datapoint_people_roles.md) - Datapoint→People→Roles

#### Legacy Tables (4 tables - Schema v1 compatibility)
- [ahe_grain_data](database/tables/ahe_grain_data.md) - (U-Th)/He grain data (DEPRECATED)

**Note:** ft_ages, ft_counts, ft_track_lengths removed in v2

#### Views (2)
- `vw_aft_complete` - Complete AFT data (ages + lengths + counts)
- `vw_sample_summary` - Sample-level statistics with AFT and AHe data

---

## Code Documentation

### Database Layer (2 files)

**[lib/db/connection.md](lib/db/connection.md)** - PostgreSQL connection pool
- Singleton pattern for Neon serverless
- Auto-loads `.env.local` for scripts
- Query execution, transactions, health checks

**lib/db/queries.ts** - All SQL queries
- 30+ query functions
- Schema v2 datapoint-aware
- Backward compatibility for v1 code

### Type Definitions (1 file)

**lib/types/thermo-data.ts** - TypeScript types
- Maps to PostgreSQL schema
- FAIR data standard compliance
- Both v1 and v2 type definitions
  - `getFTLengthsBySample()` - Track length data
  - `getAHeGrainsBySample()` - (U-Th)/He data
  - `getDatasetStats()` - Statistics
  - `searchSamplesByLocation()` - Spatial queries
- **Tables accessed (v2):** samples, ft_datapoints, ft_count_data, ft_track_length_data, he_whole_grain_data, ahe_grain_data, datasets

### 📦 Type Definitions (1 file)

**`lib/types/thermo-data.ts`** (240 lines)
- TypeScript interfaces for all database tables
- Filter types for queries
- Response types for API endpoints
- Types:
  - `Sample` - Sample table row
  - `FTAges` - Fission-track ages
  - `FTCounts` - Track count data
  - `FTTrackLengths` - Track length data
  - `AHeGrainData` - (U-Th)/He data
  - `SampleFilters` - Query filters
  - `PaginatedResponse<T>` - API responses

### 🌐 API Routes (4 files)

**[`app/api/samples/route.ts`](app/api/samples/route.md)** (documented)
- GET `/api/samples` - List samples with filtering
- Supports: dataset_id, mineral_type, lithology filters
- Pagination: limit, offset

**[`app/api/samples/[id]/route.ts`](app/api/samples/[id]/route.md)** (documented)
- GET `/api/samples/[id]` - Get single sample with all data
- Returns (v2): sample + ft_datapoints + ft_count_data + ft_track_length_data + he_whole_grain_data + ahe_grain_data

**[`app/api/tables/[name]/route.ts`](app/api/tables/[name]/route.md)** ⭐ **NEW**
- GET `/api/tables/[name]` - Generic paginated table data endpoint
- Supports: samples, ft-ages, ft-counts, track-lengths, ahe-grains
- Features: Sorting, pagination, column filtering
- Used by: Interactive table viewer

**`app/api/stats/route.ts`**
- GET `/api/stats?dataset_id=1` - Dataset statistics
- Returns: total samples, AFT count, AHe count, age ranges

### 🖥️ Pages (4 files)

**`app/page.tsx`**
- Homepage - Sample list
- Server component
- Fetches samples from API

**`app/samples/page.tsx`**
- Samples list page
- Filtering UI
- Pagination

**`app/samples/[id]/page.tsx`**
- Sample detail page
- Shows all FT and (U-Th)/He data for one sample
- Dynamic route

**`app/tables/page.tsx`** ⭐ **NEW**
- Interactive table viewer page
- Table selector + sortable/paginated table
- Uses: InteractiveTable component

### 🧩 Components (2 files)

**[`components/tables/InteractiveTable.tsx`](components/tables/InteractiveTable.md)** ⭐ **NEW**
- Reusable sortable, paginated table component
- Features: Server-side pagination, client-side sort UI
- Uses: TanStack Table (React Table v8)
- Consumes: `/api/tables/[name]` endpoint

**`components/tables/TableSelector.tsx`** ⭐ **NEW**
- Dropdown selector for choosing which table to view
- Options: Samples, FT Ages, FT Counts, Track Lengths, AHe Grains

### 🔧 Utilities (1 file)

**`lib/utils/cn.ts`**
- CSS class merging utility
- Uses `clsx` and `tailwind-merge`

### 🛠️ Scripts (6 files)

**[`scripts/query-mcmillan-data.js`](scripts/query-mcmillan-data.md)** ⭐ **NEW**
- Query and display McMillan 2024 Malawi Rift dataset
- CLI utility for data exploration
- Shows: Dataset metadata, sample ages, summary statistics

**`scripts/db/import-thermo-data.ts`**
- Import CSV data into database
- Handles (v2): samples, ft_datapoints, ft_count_data, ft_track_length_data, he_whole_grain_data
- Transaction-safe imports

**`scripts/db/schema-thermo.sql`**
- Complete database schema for thermochronology
- 6 tables + 2 views
- Foreign keys, constraints, indexes

**`scripts/db/test-connection.ts`**
- Test database connectivity
- Verify Neon connection

**`scripts/db/reset-database.ts`**
- Drop and recreate schema
- **DESTRUCTIVE** - Use with caution

**`scripts/db/migrations/`**
- Database migration scripts

---

## 🔧 Slash Commands

**[SLASH_COMMANDS.md](SLASH_COMMANDS.md)** ⭐ **NEW** - Complete slash command reference

Two specialized commands for extracting and analyzing thermochronology research papers:

1. **`/thermoanalysis`** - Deep paper analysis with indexed navigation
   - Reads PDFs thoroughly
   - Extracts images with figure captions
   - Creates indexed documentation
   - Discovers tables dynamically
   - Prepares metadata for extraction

2. **`/thermoextract`** - Zero-error data extraction
   - Multi-method table extraction
   - Transform to FAIR schema (EarthBank compatible)
   - Validate before import
   - Generate SQL import scripts
   - Integrated with /thermoanalysis

**Workflow:** `/thermoanalysis` → `/thermoextract` → Database Import

### Quality Analysis

**[SLASH_COMMANDS_QUALITY_REPORT.md](SLASH_COMMANDS_QUALITY_REPORT.md)** 🔍 **NEW** - Comprehensive quality review
- **Overall Score:** 7.5/10 (GOOD)
- **Critical Issues:** 4 identified
- **Important Issues:** 8 identified
- **Security Analysis:** ✅ No critical vulnerabilities
- **Performance Analysis:** Bottlenecks documented

**[SLASH_COMMANDS_CRITICAL_FIXES.md](SLASH_COMMANDS_CRITICAL_FIXES.md)** 🔧 **NEW** - Actionable code fixes
- Ready-to-apply code replacements
- Phase 1: Critical fixes (1-2 hours)
- Phase 2: Important fixes (2-3 hours)
- Testing scenarios and verification commands

---

## 📊 Documentation Statistics

**Code Files:** 22 TypeScript/JavaScript files
**Scripts:** 6 database utilities
**Documentation:** 6 markdown files (code docs) + 6 table docs + 6 meta docs
**Database Tables:** 6 tables + 2 views
**Slash Commands:** 2 specialized extraction workflows (with quality analysis)

**Lines of Code:**
- `lib/db/queries.ts`: ~400 lines (database queries)
- `lib/types/thermo-data.ts`: ~240 lines (type definitions)
- `lib/db/connection.ts`: ~208 lines (connection pool)
- `components/tables/InteractiveTable.tsx`: ~208 lines (table component)
- `app/api/tables/[name]/route.ts`: ~134 lines (generic table API)

---

## 🎯 Documentation Structure

```
readme/
├── INDEX.md                                    ← You are here
├── CHANGES.md                                  ← What's new (changelog)
├── SLASH_COMMANDS.md                           ⭐ NEW - Extraction workflow docs
├── SLASH_COMMANDS_QUALITY_REPORT.md            🔍 NEW - Quality analysis (7.5/10)
├── SLASH_COMMANDS_CRITICAL_FIXES.md            🔧 NEW - Ready-to-apply fixes
├── app/api/                                    ← API route documentation
│   ├── samples/
│   └── tables/[name]/route.md                 ⭐ NEW
├── components/tables/                          ⭐ NEW
│   └── InteractiveTable.md
├── scripts/                                    ⭐ NEW
│   └── query-mcmillan-data.md
└── database/
    ├── SCHEMA_CHANGES.md                       ← Schema migration log
    └── tables/                                 ← Table documentation (v2 schema)
        ├── samples.md
        ├── datasets.md
        ├── ft_datapoints.md                    ← NEW (v2)
        ├── ft_count_data.md                    ← NEW (v2)
        ├── ft_track_length_data.md             ← NEW (v2)
        ├── he_datapoints.md                    ← NEW (v2)
        ├── he_whole_grain_data.md              ← NEW (v2)
        ├── ahe_grain_data.md                   ← DEPRECATED (v1 legacy)
        └── deprecated/                         ← Archived v1 docs
            ├── ft_ages.md
            ├── ft_counts.md
            └── ft_track_lengths.md
```

**Reference Documentation:**
- `build-data/assets/schemas/AusGeochem_ERD.md` - Full ERD specification
- `.claude/CLAUDE.md` - Domain concepts and project overview

---

## 🔍 How to Use This Documentation

**I want to...**

**...understand what tables exist**
→ Read `database/SCHEMA_CHANGES.md` (2025-11-16 entry)
→ See `.claude/CLAUDE.md` § Database Architecture

**...query the database**
→ Use functions in `lib/db/queries.ts`
→ See code examples in `.claude/CLAUDE.md` § Quick Reference

**...understand thermochronology concepts**
→ Read `.claude/CLAUDE.md` § Key Domain Concepts
→ Check `build-data/learning/thermo-papers/`

**...extract data from a research paper**
→ Read `SLASH_COMMANDS.md` (complete workflow)
→ Run `/thermoanalysis` first (paper analysis)
→ Then run `/thermoextract` (data extraction)
→ Result: Zero-error database import

**...add a new feature**
→ Check `lib/db/queries.ts` for existing patterns
→ Add types to `lib/types/thermo-data.ts`
→ Create API route in `app/api/`
→ Build page in `app/`

**...import data**
→ Use `scripts/db/import-thermo-data.ts`
→ Place CSV files in `build-data/assets/source-data/thermo/`

---

## 🚀 Next Steps

**Documentation To Do:**
- [x] Create table docs for 6 tables ✅ (2025-11-16)
- [x] Document API routes (3 of 4 documented) ✅
- [x] Document key components (InteractiveTable) ✅
- [x] Document utility scripts (query-mcmillan-data) ✅
- [x] Document slash commands ✅ (2025-11-17)
- [x] Quality review of slash commands ✅ (2025-11-17)
- [ ] Apply critical fixes to slash commands (4 issues)
- [ ] Create code → table cross-reference map (partial - in table docs)
- [ ] Document remaining pages and components

**Slash Command Improvements:**
- [ ] Apply Phase 1 critical fixes (1-2 hours) - See SLASH_COMMANDS_CRITICAL_FIXES.md
- [ ] Apply Phase 2 important fixes (2-3 hours)
- [ ] Test extraction workflow with fixes
- [ ] Update command files with improvements

**Feature Development:**
- [x] Interactive table viewer with sorting/pagination ✅
- [ ] Advanced filtering UI
- [ ] Data visualization (age plots, histograms)
- [ ] CSV export functionality
- [ ] Map view (sample locations)

---

**Last Updated:** 2025-11-17 (Slash commands documentation added)
**Next Review:** After adding data visualization features
