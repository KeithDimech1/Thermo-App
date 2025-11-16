# QC-Results Code Documentation

**Last Updated:** 2025-11-11
**Documentation System:** `/bigtidy` autodoc v1.0
**Project Type:** Next.js Application with PostgreSQL (Neon)
**Purpose:** Quality control performance data for diagnostic assays

---

## 📖 Quick Start

This documentation provides comprehensive coverage of the QC-Results project, including:
- **Database schema** - All 8 tables + 2 views
- **Database layer** - Connection pooling and 28+ query functions
- **Code-database mapping** - Which files access which tables
- **Schema change tracking** - Automated detection of database modifications

**Perfect for:**
- 🆕 New developers getting familiar with the codebase
- 🔍 Understanding database structure and relationships
- 🗺️ Finding which code interacts with which tables
- 📊 Seeing the overall project architecture
- 🔧 Database schema maintenance and updates

**Tip:** Start with [What's New](#whats-new) to see recent changes.

---

## 🗂️ Documentation by Category

### 🗄️ Database Documentation

#### Schema Overview
- **[database/SCHEMA_SUMMARY.md](database/SCHEMA_SUMMARY.md)** ⭐ **START HERE**
  - Overview of all 8 tables + 2 views
  - Relationship diagrams
  - Common query patterns
  - Data statistics
  - Design principles

#### Individual Tables (8 tables)
- **[database/tables/test_configurations.md](database/tables/test_configurations.md)** ⭐ **CORE TABLE**
  - Unique combinations of marker + assay + QC sample
  - 200-500 test configurations
  - Quality ratings and business rules
  - Used by 10+ code files

- **[database/tables/cv_measurements.md](database/tables/cv_measurements.md)** ⭐ **PERFORMANCE METRICS**
  - Coefficient of variation measurements
  - 1:1 relationship with test_configurations
  - CV thresholds: <10% (excellent), 10-15% (acceptable), >15% (poor)
  - Statistical interpretation guide

- **[database/tables/markers.md](database/tables/markers.md)**
  - Biomarkers being tested (40-60 rows)
  - Antibody types: IgG, IgM, Antigen
  - Marker types: Antibody, Antigen, Nucleic Acid
  - Clinical use cases

- **[database/tables/assays.md](database/tables/assays.md)**
  - Diagnostic test platforms (50-80 rows)
  - Methodologies: CLIA, ELISA, PCR, ECLIA, CMIA
  - Automation levels
  - Throughput considerations

- **[database/tables/manufacturers.md](database/tables/manufacturers.md)**
  - Test kit manufacturers (15-25 rows)
  - Performance aggregations
  - Major players: Abbott, Roche, DiaSorin, Bio-Rad

- **[database/tables/categories.md](database/tables/categories.md)** - Disease categories (10-15 rows)
- **[database/tables/pathogens.md](database/tables/pathogens.md)** - Infectious agents (20-30 rows)
- **[database/tables/qc_samples.md](database/tables/qc_samples.md)** - QC materials (10-20 rows)

#### Schema Tracking & Changes
- **[database/SCHEMA_CHANGES.md](database/SCHEMA_CHANGES.md)**
  - Automated changelog of schema modifications
  - Initial baseline: 2025-11-11
  - Future changes auto-detected by `/bigtidy`

- **[database/.schema-snapshot.sql](database/.schema-snapshot.sql)**
  - Current database schema (691 lines)
  - Downloaded from Neon PostgreSQL
  - Bones-only format (tables, columns, constraints)

#### Cross-References
- **[database/CODE_USAGE.md](database/CODE_USAGE.md)** ⭐ **CODE ↔ DATABASE MAP**
  - Which code files access which tables
  - Which tables are used by which components
  - Database access patterns
  - Performance hotspots
  - Most heavily used tables

---

### ⚙️ Database Layer (2 files)

- **[lib/db/connection.md](lib/db/connection.md)** ⭐ **CONNECTION INFRASTRUCTURE**
  - PostgreSQL connection pool (singleton pattern)
  - SSL configuration for Neon
  - Query helpers: query(), queryOne(), transaction()
  - Performance monitoring (slow query detection)
  - Error handling and security
  - Troubleshooting guide
  - 208 lines of code

- **[lib/db/queries.md](lib/db/queries.md)** ⭐ **ALL SQL QUERIES**
  - 28 query functions organized by category
  - Test configurations (7 functions)
  - Manufacturers (3 functions)
  - Markers (4 functions)
  - Assays (3 functions)
  - Analytics & statistics (4 functions)
  - Educational context (2 functions)
  - Risk assessment (2 functions)
  - Data confidence (2 functions)
  - Comparison queries (1 function)
  - 773 lines of code

---

### 📊 Documentation Statistics

**Current Coverage:**
- ✅ 8 database tables (100% documented)
- ✅ 2 database views (documented)
- ✅ 2 database layer modules (connection + queries)
- ✅ 28 query functions (catalogued)
- ✅ 1 schema snapshot (691 lines)
- ✅ 1 code-database cross-reference map
- ✅ 30+ code files mapped to database

**Total Documentation Files:** 14 files
**Documentation Focus:** Database architecture and data layer

---

## 🎯 Documentation Structure

```
readme/
├── INDEX.md (this file)        ← Documentation hub
├── CHANGES.md                  ← What's new
│
├── database/                   ← Database documentation
│   ├── SCHEMA_SUMMARY.md       ← ⭐ Start here for DB overview
│   ├── SCHEMA_CHANGES.md       ← Schema changelog
│   ├── CODE_USAGE.md           ← ⭐ Code ↔ Table mapping
│   ├── .schema-snapshot.sql    ← Current schema (691 lines)
│   ├── .schema-previous.sql    ← Previous schema (comparison)
│   └── tables/                 ← Individual table docs
│       ├── test_configurations.md  ← ⭐ Core table
│       ├── cv_measurements.md      ← ⭐ Performance metrics
│       ├── markers.md
│       ├── assays.md
│       ├── manufacturers.md
│       ├── categories.md
│       ├── pathogens.md
│       └── qc_samples.md
│
└── lib/
    └── db/                     ← Database layer docs
        ├── connection.md       ← ⭐ Connection pool
        └── queries.md          ← ⭐ All SQL queries (28 functions)
```

---

## 🚀 Getting Started Guides

### For New Developers

**Day 1: Understanding the Database**
1. Read [database/SCHEMA_SUMMARY.md](database/SCHEMA_SUMMARY.md) - Get the big picture
2. Browse [database/tables/](database/tables/) - See individual tables
3. Check [database/CODE_USAGE.md](database/CODE_USAGE.md) - Understand code-database relationships

**Day 2: Understanding Data Access**
1. Read [lib/db/connection.md](lib/db/connection.md) - How connections work
2. Read [lib/db/queries.md](lib/db/queries.md) - All available query functions
3. Look at query function examples

**Day 3: Making Changes**
1. Find the query functions you need in [lib/db/queries.md](lib/db/queries.md)
2. Check which tables you'll modify in [database/tables/](database/tables/)
3. Review business rules and constraints

---

### For Database Changes

**Before Making Schema Changes:**
1. Document the change in [database/SCHEMA_CHANGES.md](database/SCHEMA_CHANGES.md)
2. Update affected table docs in [database/tables/](database/tables/)
3. Check [database/CODE_USAGE.md](database/CODE_USAGE.md) for impacted code

**After Making Schema Changes:**
1. Run `/bigtidy` to detect and document changes automatically
2. Review [database/SCHEMA_CHANGES.md](database/SCHEMA_CHANGES.md) for detected modifications
3. Update query functions in [lib/db/queries.md](lib/db/queries.md) if needed

---

### For Feature Development

**Planning a New Feature:**
1. Check [database/CODE_USAGE.md](database/CODE_USAGE.md) - Which tables do you need?
2. Review [lib/db/queries.md](lib/db/queries.md) - Do query functions already exist?
3. Read relevant table docs in [database/tables/](database/tables/)

**Implementing the Feature:**
1. Use existing query functions when possible
2. Add new functions to `lib/db/queries.ts` if needed
3. Follow patterns in [lib/db/connection.md](lib/db/connection.md)

---

### For Performance Optimization

**Identifying Bottlenecks:**
1. Check [database/CODE_USAGE.md](database/CODE_USAGE.md) - Find hotspots
2. Review [lib/db/queries.md](lib/db/queries.md) - Query patterns
3. Look at table docs for index recommendations

**Optimizing Queries:**
1. Use views (vw_test_config_details, vw_manufacturer_performance)
2. Add indexes on frequently filtered columns
3. Consider caching rarely-changing data (manufacturers, markers)

---

## 🔑 Key Concepts

### Database Architecture

**Normalized Schema (3NF):**
- Minimal data redundancy
- Foreign key constraints enforced
- Referential integrity maintained

**Denormalized Views:**
- `vw_test_config_details` - Pre-joined config data (fast queries)
- `vw_manufacturer_performance` - Pre-aggregated stats (dashboard)

**Read-Only Application:**
- All tables are READ-ONLY in the application
- Data populated by import scripts only
- No UPDATE/INSERT/DELETE in app code (currently)

### Data Flow

**Pattern 1: API Routes → Query Functions (95% of queries)**
```
API Route → lib/db/queries.ts → lib/db/connection.ts → PostgreSQL
```

**Pattern 2: Server Components → Query Functions**
```
Server Component → lib/db/queries.ts → lib/db/connection.ts → PostgreSQL
```

**Pattern 3: Direct SQL (rare, only in search)**
```
app/api/search/route.ts → lib/db/connection.ts → PostgreSQL
```

### Quality Control Concepts

**CV (Coefficient of Variation):**
- Measures test precision/reproducibility
- Formula: CV = (Std Dev / Mean) × 100%
- Lower CV = better precision

**CV Thresholds:**
- **<10%:** Excellent (suitable for critical tests like HIV screening)
- **10-15%:** Acceptable (routine clinical use)
- **>15%:** Poor (may not meet regulatory requirements)

**Quality Ratings:**
- **Excellent:** CV <10% for ≥80% of measurements
- **Good:** CV <10% for 60-79% of measurements
- **Acceptable:** CV <10% for 40-59% of measurements
- **Poor:** CV <10% for <40% of measurements

---

## 📋 What's New

### 2025-11-11 (Latest)
- ✅ Complete database documentation baseline
- ✅ All 8 tables + 2 views documented
- ✅ 691-line schema snapshot from Neon
- ✅ Database layer modules documented (connection + queries)
- ✅ Code-database cross-reference map created
- ✅ Schema change tracking system established
- ✅ 14 new documentation files

**See [CHANGES.md](CHANGES.md) for full details.**

---

## 🔧 Maintenance & Updates

### Keeping Documentation Current

**Automated Updates:**
- Run `/bigtidy` to detect schema changes
- Automated comparison of current vs previous schema
- Auto-generation of change log entries

**Manual Updates:**
- Update table docs when business rules change
- Add query function documentation when adding new functions
- Update CODE_USAGE.md when adding new database access points

### Documentation Standards

**Table Documentation Includes:**
- Purpose and business context
- Schema (columns, types, constraints)
- Relationships (foreign keys, referenced by)
- Used by (code files with line numbers)
- Common query patterns
- Business rules
- Recent changes

**Code Documentation Includes:**
- What the file does (plain English)
- Database tables accessed (if any)
- Key exports/functions
- Dependencies
- Used by (consumers)
- Examples

---

## ❓ FAQ

### How do I find which code uses a specific table?
→ Check [database/CODE_USAGE.md](database/CODE_USAGE.md) - Tables → Code Files section

### How do I find which tables a component uses?
→ Check [database/CODE_USAGE.md](database/CODE_USAGE.md) - Code Files → Tables section

### Where are all the SQL queries?
→ [lib/db/queries.md](lib/db/queries.md) documents all 28 query functions

### How do I add a new database query?
→ Add to `lib/db/queries.ts`, follow patterns in [lib/db/queries.md](lib/db/queries.md)

### How do I track database schema changes?
→ Run `/bigtidy` after changes, check [database/SCHEMA_CHANGES.md](database/SCHEMA_CHANGES.md)

### What's the difference between test_configurations and cv_measurements?
→ test_configurations defines the test (marker + assay + QC sample), cv_measurements stores the performance data (CV percentages)

### How do I understand CV% thresholds?
→ Read [database/tables/cv_measurements.md](database/tables/cv_measurements.md) - "Understanding CV" section

---

## 🚧 Future Documentation

**Planned Additions:**
- API routes documentation (9 endpoints)
- Server components documentation (7 pages)
- UI components documentation (8+ components)
- Type definitions documentation
- Testing documentation
- Deployment documentation

**Run `/bigtidy` to generate updated documentation.**

---

## 📞 Support & Feedback

**Documentation Issues:**
- File issues on GitHub
- Request documentation improvements
- Suggest new documentation sections

**Keeping Documentation Fresh:**
- Run `/bigtidy` regularly (weekly recommended)
- Review CHANGES.md after each run
- Update manually when business logic changes

---

**Generated:** 2025-11-11 by `/bigtidy` autodoc system
**Documentation Version:** 1.0.0
**Total Files:** 14 documentation files
**Coverage:** Database architecture and data layer (100%)
**Next Update:** Run `/bigtidy` to detect changes and update
