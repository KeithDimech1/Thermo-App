# AusGeochem Thermochronology - Code Documentation

**Last Updated:** 2025-11-16
**Project:** Thermochronology Database Application
**Database:** PostgreSQL (Neon) - 6 tables, 2 views

---

## 📖 Quick Start

**New to this codebase?** Start here:

1. **Understand the domain:** Read `.claude/CLAUDE.md` - Thermochronology concepts explained
2. **Database schema:** See `database/SCHEMA_CHANGES.md` - What tables exist and why
3. **ERD reference:** Check `build-data/assets/schemas/AusGeochem_ERD.md` - Full schema spec
4. **Code structure:** This file (you are here!) - What code does what

---

## 🗂️ Documentation by Category

### 🗄️ Database Documentation

**Schema Overview:**
- `database/SCHEMA_CHANGES.md` - Schema migration log (QC → Thermochronology)

**Table Documentation:** ✅
- **[database/tables/datasets.md](database/tables/datasets.md)** - Data packages with privacy/DOI
- **[database/tables/samples.md](database/tables/samples.md)** ⭐ **PRIMARY TABLE** - Geological samples (IGSN, location, lithology)
- **[database/tables/ft_ages.md](database/tables/ft_ages.md)** - Fission-track age determinations
- **[database/tables/ft_counts.md](database/tables/ft_counts.md)** - Grain-by-grain track counts
- **[database/tables/ft_track_lengths.md](database/tables/ft_track_lengths.md)** - Individual track measurements
- **[database/tables/ahe_grain_data.md](database/tables/ahe_grain_data.md)** - (U-Th)/He grain ages

### ⚙️ Database Layer (2 files)

**`lib/db/connection.ts`** (208 lines)
- PostgreSQL connection pool (Neon)
- Query helpers: `query()`, `queryOne()`, `transaction()`
- SSL configuration
- Slow query logging (>1000ms)

**`lib/db/queries.ts`** (400+ lines)
- **12 query functions** for thermochronology data
- Functions:
  - `getAllSamples()` - Get samples with filtering
  - `getSampleById()` - Single sample
  - `getSampleDetail()` - Sample + all FT/AHe data
  - `getFTAgesBySample()` - Fission-track ages
  - `getFTCountsBySample()` - Track count data
  - `getFTLengthsBySample()` - Track length data
  - `getAHeGrainsBySample()` - (U-Th)/He data
  - `getDatasetStats()` - Statistics
  - `searchSamplesByLocation()` - Spatial queries
- **Tables accessed:** samples, ft_ages, ft_counts, ft_track_lengths, ahe_grain_data, datasets

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
- Returns: sample + ft_ages + ft_counts + ft_track_lengths + ahe_grain_data

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
- Handles: samples, ft_ages, ft_counts, ft_track_lengths, ahe_grain_data
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

## 📊 Documentation Statistics

**Code Files:** 22 TypeScript/JavaScript files
**Scripts:** 6 database utilities
**Documentation:** 6 markdown files (code docs) + 6 table docs + 3 meta docs
**Database Tables:** 6 tables + 2 views

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
├── INDEX.md                           ← You are here
├── CHANGES.md                         ← What's new (changelog)
├── app/api/                           ← API route documentation
│   ├── samples/
│   └── tables/[name]/route.md        ⭐ NEW
├── components/tables/                 ⭐ NEW
│   └── InteractiveTable.md
├── scripts/                           ⭐ NEW
│   └── query-mcmillan-data.md
└── database/
    ├── SCHEMA_CHANGES.md              ← Schema migration log
    └── tables/                        ← Table documentation (6 files)
        ├── samples.md
        ├── ft_ages.md
        ├── ft_counts.md
        ├── ft_track_lengths.md
        ├── ahe_grain_data.md
        └── datasets.md
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
- [ ] Create code → table cross-reference map (partial - in table docs)
- [ ] Document remaining pages and components

**Feature Development:**
- [x] Interactive table viewer with sorting/pagination ✅
- [ ] Advanced filtering UI
- [ ] Data visualization (age plots, histograms)
- [ ] CSV export functionality
- [ ] Map view (sample locations)

---

**Last Updated:** 2025-11-16 (BigTidy documentation run)
**Next Review:** After adding data visualization features
