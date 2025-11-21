# AusGeochem - Thermochronology Database

**Last Updated:** 2025-11-18
**Project:** AusGeochem Thermochronology Data Platform
**Type:** Next.js + PostgreSQL (Neon) + EarthBank FAIR Integration
**Purpose:** Extract, manage, and share geological dating data (fission-track & (U-Th)/He)

---

## ✅ SCHEMA MIGRATION COMPLETE (IDEA-014)

**Status:** ✅ EarthBank-native camelCase schema migration COMPLETE (2025-11-18)

**Schema Version:** v2.1 (EarthBank-Inspired camelCase)

**Current State (2025-11-18 23:50 - Phase 7):**
- ✅ New tables created: `earthbank_samples`, `earthbank_ftDatapoints`, `earthbank_heDatapoints`, `earthbank_ftTrackLengthData`, `earthbank_heWholeGrainData`
- ✅ All tables use EarthBank-inspired camelCase field names (e.g., `sampleID`, `centralAgeMa`, `pooledAgeMa`)
- ⚠️ **Note:** Field names are inspired by but don't exactly match EarthBank templates (see IDEA-015)
- ✅ UUID primary keys implemented (`id UUID DEFAULT uuid_generate_v4()`)
- ✅ Application code updated (Phase 5-6: all API routes and UI components)
- ✅ TypeScript compilation: 0 errors
- ✅ Data integrity: 100% validated (1,238 records migrated, zero data loss)
- ✅ Testing complete (Phase 6: all integrity checks passed)
- ✅ Documentation updated (Phase 7: SCHEMA_CHANGES.md complete)

**Schema:**
- **Tables:** `earthbank_samples`, `earthbank_ftDatapoints`, `earthbank_heDatapoints`, `earthbank_ftTrackLengthData`, `earthbank_heWholeGrainData`
- **Note:** Double-quotes required for camelCase in SQL queries
- **Foreign Keys:** String-based (`sampleID`, `datapointName`)
- **Primary Keys:** UUID with `uuid_generate_v4()`

**Critical SQL Syntax:**
```sql
-- ✅ CORRECT: Use double-quotes for camelCase columns
SELECT "sampleID", "centralAgeMa" FROM earthbank_ftDatapoints;

-- ❌ WRONG: Unquoted will be lowercased by PostgreSQL
SELECT sampleID, centralAgeMa FROM earthbank_ftDatapoints;
```

**What Changed:**
- **OLD:** `ft_datapoints.central_age_ma`, `samples.sample_id`
- **NEW:** `earthbank_ftDatapoints."centralAgeMa"`, `earthbank_samples."sampleID"`

**Import/Export:**
- Minimal field translation needed (camelCase → camelCase with name differences)
- `/thermoextract` - Outputs camelCase CSVs (field mapping may be needed for EarthBank templates)
- Import scripts - Use `earthbank_*` tables directly
- Export scripts - Direct column mapping (no snake_case conversion)
- **Note:** Our field names differ from EarthBank templates (e.g., `numGrains` vs `noOfGrains`) - see IDEA-015

**Migration Stats:**
- 1,238 records migrated (75 samples, 67 FT datapoints, 975 track lengths, 8 He datapoints, 113 He grains)
- 98 camelCase columns across 5 tables
- 0 data loss, 100% referential integrity

**Branch:** `idea-014-earthbank-schema-migration`

**Documentation:**
- **Quick Reference:** `build-data/ideas/debug/IDEA-014-INDEX.md`
- **Full Implementation Log:** `build-data/ideas/debug/IDEA-014-migrate-to-earthbank-native-schema-camelcase-1-1-template-mapping.md`
- **Schema Changes:** `readme/database/SCHEMA_CHANGES.md` (migration documented)
- **Migration Guide:** See SCHEMA_CHANGES.md "Migration Guide" section

**Next Phase:** Phase 8 - Cutover & Cleanup (optional - old tables can remain for rollback)

---

## 🎯 Project Identity

### What This Does
Database application for thermochronology (geological dating via radioactive decay & thermal history):
- **Extract data** from published papers → EarthBank templates → Database
- **Manage samples** with IGSN, location, lithology, analytical metadata
- **Track datapoints** (analytical sessions with full QC: lab, date, method, analyst, batch, standards)
- **Store granular data** (grain-by-grain counts, individual track measurements, single-grain ages)
- **FAIR compliant** (Findable, Accessible, Interoperable, Reusable per Nixon et al. 2025)

### 🌐 Paper-Agnostic Philosophy (CRITICAL)

**The extraction commands work on ANY research paper, not just thermochronology papers.**

**Core Principle:** EXTRACT FIRST, VALIDATE LATER

- `/thermoanalysis` - Analyzes ANY PDF, extracts tables/figures/metadata regardless of field
- `/thermoextract` - Extracts table data from ANY paper type
- `/thermoload` - Loads dataset and performs FAIR assessment on ANY paper

**Why this matters:**
- ✅ Commands do their job regardless of paper content
- ✅ If data doesn't match thermochronology schema → Low FAIR score
- ✅ But CSVs, tables, and figures are still available for download
- ✅ Users can manually correct or use data as-is
- ❌ Don't block extraction because data "doesn't look right"
- ❌ Don't refuse to process non-thermochronology papers

**The quality gate is FAIR scoring, not extraction blocking.**

### Critical Architecture Concept: Datapoints

**1 sample → many datapoints → many grains**

A **datapoint** = one analytical session (specific lab, date, method, analyst). Same sample can be analyzed multiple times. Each datapoint links to:
- Batch (QC standards: Durango apatite, Fish Canyon zircon)
- People (ORCID-tracked: analyst, operator)
- Grain-level data (FT counts, track lengths, He chemistry)

**Why:** Enables independent age recalculation, thermal history remodeling, QC assessment, and large-scale meta-analysis.

**Schema:** Nixon et al. (2025) EarthBank + Kohn et al. (2024) reporting standards
- Core: `datasets`, `samples`, `people`, `batches`, `reference_materials`
- FT: `ft_datapoints` → `ft_count_data`, `ft_single_grain_ages`, `ft_track_length_data`, `ft_binned_length_data`
- He: `he_datapoints` → `he_whole_grain_data`

---

## 📖 Documentation Hierarchy (MANDATORY - ENFORCED BY HOOK)

**🚨 CRITICAL: This is ENFORCED via user-prompt-submit hook - NOT optional! 🚨**

**BEFORE using Grep/Glob/search OR making ANY code changes:**

1. **MUST READ `readme/INDEX.md` FIRST** - Living architectural documentation (explains "why" and relationships)
2. **MUST CHECK `PROJECT_INDEX.json`** - Current state snapshot (1,238 records, EarthBank schema status)
3. **Navigate to specific docs referenced** (SCHEMA_CHANGES.md, definitions.md, etc.)
4. **ONLY THEN use code search tools** (Grep/Glob) if still needed

**WHY THIS IS MANDATORY:**
- Direct code search wastes tokens and misses critical context
- Documentation explains architectural decisions and relationships
- PROJECT_INDEX.json contains current schema state (critical for IDEA-014 migration)
- Prevents breaking changes and redundant work

**Key Documentation:**
- `readme/INDEX.md` - Complete architecture, workflows, decisions (⭐ PRIMARY SOURCE)
- `PROJECT_INDEX.json` - Automated snapshot of current codebase state (⭐ CURRENT STATE)
- `readme/database/SCHEMA_CHANGES.md` - Schema evolution log
- `documentation/definitions.md` - Field glossary (Pooled Age, Dpar, MTL, Ft, etc.)
- `build-data/documentation/foundation/` - Research papers (Kohn 2024, Nixon 2025)
- `build-data/assets/schemas/AusGeochem_ERD.md` - Full ERD specification

**Hook Location:** `.claude/hooks/user-prompt-submit.sh` (runs before every prompt)

---

## 🔧 Slash Commands (Project-Specific)

**Custom workflows** available in `.claude/commands/`:

**🌐 Data Extraction & Import (Paper-Agnostic - Works on ANY research paper):**

- `/thermoanalysis` - Deep paper analysis with indexed navigation
  - **Philosophy:** ANALYZE EVERYTHING regardless of paper type
  - Extracts tables, figures, metadata from ANY PDF
  - Location: `.claude/commands/thermoanalysis.md`

- `/thermoextract` - AI-powered table data extraction
  - **Philosophy:** EXTRACT FIRST, VALIDATE LATER
  - Works on any paper type - quality issues → low FAIR score, not blocked extraction
  - Outputs: CSVs, table screenshots, validation reports
  - Location: `.claude/commands/thermoextract.md`

- `/thermoload` - Load dataset with FAIR assessment
  - **Philosophy:** LOAD EVERYTHING - FAIR scores determine quality, not gatekeeping
  - Creates dataset records, uploads files, performs FAIR assessment
  - Works on papers from any research field
  - Location: `.claude/commands/thermoload.md`

**Global Hooks Available:**
Project has been initialized with `/setupproject`. The following global commands work:

**Error & Debug:**
- `/error-mark` - Research and log errors (sequential: ERROR-001, ERROR-002, etc.)
- `/debug-mode` - Systematic debugging with audit trail
- `/resolve ERROR-XXX` - Archive fixed errors

**Ideas & Features:**
- `/idea-log` - Log feature ideas (sequential: IDEA-001, IDEA-002, etc.)
- `/idea-mode` - Implement with audit trail
- `/resolve IDEA-XXX` - Archive completed ideas

**Quality & Snapshots:**
- `/index` - Update PROJECT_INDEX.json (architectural snapshot)
- `/bigtidycheck` - Comprehensive quality analysis

**Sequential Numbering:**
- Errors tracked in `build-data/errors/.next-error-number` (current: 12)
- Ideas tracked in `build-data/ideas/.next-idea-number` (current: 14)

---

## 📊 Database Connection (Critical)

**Environment Setup:**
```bash
# .env.local (REQUIRED for migrations and scripts)
DATABASE_URL="postgresql://user:pass@host:port/neondb?sslmode=require"  # Pooled (Neon serverless)
DIRECT_URL="postgresql://user:pass@host:port/neondb?sslmode=require"    # Direct (migrations only)
```

**⚠️ CRITICAL: Never use `psql "$DIRECT_URL"` directly!**

`.env.local` variables are **NOT exported to shell** - `$DIRECT_URL` will be empty and psql will connect to the WRONG database!

**✅ ALWAYS use these safe wrapper scripts:**
```bash
# Direct connection (migrations, imports, DDL)
npm run db:psql
./scripts/db/psql-direct.sh

# Pooled connection (queries, DML)
npm run db:psql-pooled
./scripts/db/psql-pooled.sh

# Verify you're connected to neondb
npm run db:verify-connection
```

**Connection Pattern:**
- **Use `lib/db/connection.ts` for TypeScript database access**
- **Use `scripts/db/psql-*.sh` for shell/psql commands**
- Auto-loads `.env.local` (works in Next.js AND standalone TypeScript scripts)
- Connection pool with SSL for Neon
- Helpers: `query()`, `queryOne()`, `transaction()`
- Slow query detection (>1000ms logged)

**Why both URLs?**
- `DATABASE_URL` - Pooled for serverless (faster cold starts)
- `DIRECT_URL` - Direct for migrations (Prisma requirement)

**See:** `scripts/db/README.md` for full documentation

---

## 🚀 Quick Reference

### Common Database Queries
```typescript
import {
  getAllSamples,           // Get samples with filtering
  getSampleById,           // Single sample by ID
  getSampleDetail,         // Sample with all FT + He data
  getFTDatapointsBySample, // FT analytical sessions
  getHeDatapointsBySample, // He analytical sessions
  getDatasetStats          // Dataset statistics
} from '@/lib/db/queries'
```

### Data Flow
```
PDF Paper → /thermoextract → EarthBank Templates (Excel) → Import Script → PostgreSQL (Neon)
                                                                           ↓
                               Next.js App ← API Routes ← lib/db/queries.ts
```

### Import Workflow
```bash
# 1. Extract data from paper
/thermoextract                           # Interactive AI extraction

# 2. Import to database
npx tsx scripts/db/import-earthbank-templates.ts <file.xlsx>

# 3. Verify import
npm run dev                               # Check at localhost:3000
```

### EarthBank Template Locations
```
build-data/learning/thermo-papers/earthbanktemplates/
├── Sample.template.v2025-04-16.xlsx         # Sample metadata
├── FTDatapoint.template.v2024-11-11.xlsx    # Fission-track data
└── HeDatapoint.template.v2024-11-11.xlsx    # (U-Th)/He data
```

### Key File Paths
```
lib/db/connection.ts           # Database connection pool
lib/db/queries.ts              # All SQL queries
lib/types/thermo-data.ts       # TypeScript type definitions
scripts/db/                    # Import scripts, migrations
output/                        # Extraction outputs (CSV, reports)
```

---

## 📁 Project-Specific Safe Zones

**Application Code (NEVER moved by `/tidy`):**
```
app/                    # Next.js App Router (pages, API routes)
lib/                    # Business logic & database layer
public/                 # Static assets
scripts/                # Database utilities, import scripts
readme/                 # Living documentation
output/                 # Data extraction outputs
documentation/          # Field definitions, guides
```

**Development Artifacts:**
```
build-data/
├── learning/thermo-papers/    # Research papers, EarthBank templates
├── assets/source-data/thermo/ # Extracted data (CSV, JSON)
├── assets/schemas/            # Database ERD specifications
├── errors/                    # Error tracking system
└── ideas/                     # Feature ideas & implementation tracking
```

**AI/ML Infrastructure:**
```
.venv/                  # Python virtual environment (for future ML)
scripts/ai/             # AI plugin scripts (if added)
```

---

## 📋 Current State & Priorities

### Production Status (as of 2025-11-18)
- ✅ Complete Schema v2 (EarthBank FAIR + Kohn 2024 compliant)
- ✅ Import scripts operational (EarthBank template ingestion)
- ✅ `/thermoextract` command (AI-powered PDF extraction)
- ✅ Database connection (Neon serverless PostgreSQL)
- 🚧 UI components (sample list, detail pages, visualizations)
- 🚧 Data export (database → EarthBank templates)
- 🚧 Advanced analysis (radial plots, thermal modeling)

### Next Priorities
1. Build sample list page with filtering (mineral, location, dataset)
2. Create sample detail page (show all datapoints + grain data)
3. Add data visualization components (age histograms, radial plots, track length distributions)
4. Implement export to EarthBank templates (reverse workflow)
5. Add batch/QC tracking UI (reference material performance)

---

## 🌐 Production Deployment

**Hosting:** Vercel (serverless Next.js)
**Database:** Neon PostgreSQL (serverless, auto-scaling)
**Environment:** `.env.local.example` template provided

**Build:**
```bash
npm run build              # Production build
vercel --prod              # Deploy to production
```

---

## 🔍 Common Tasks

### Extract Data from Paper
```bash
/thermoextract
# Follow prompts: upload PDF → AI extraction → validate → export templates
```

### Import EarthBank Template
```bash
npx tsx scripts/db/import-earthbank-templates.ts output/dataset_name.xlsx
```

### Query Database
```typescript
// In API route or script
import { getSampleDetail } from '@/lib/db/queries'

const sample = await getSampleDetail('SAMPLE-001')
// Returns: sample + all FT datapoints + He datapoints + grain data
```

### Update Documentation
```bash
/index                     # Update PROJECT_INDEX.json
# Then commit changes to readme/ as needed
```

---

## 📚 Research Foundation

**Core Publications:**
- **Kohn et al. (2024)** - GSA Bulletin - FAIR reporting standards (Tables 4-11 schema spec)
- **Nixon et al. (2025)** - Chemical Geology - EarthBank FAIR platform architecture

**Full summaries:** `build-data/documentation/foundation/`
- `01-Kohn-2024-Reporting-Standards.md` - Complete analysis of field requirements

**When to reference:** If encountering data validation issues, schema questions, or need to understand "why" behind field choices, consult these papers.

---

## ⚠️ Critical Reminders

1. **Datapoint architecture** - Always think: sample → datapoints → grains (not sample → ages directly)
2. **IGSN required** - Samples MUST have International Geo Sample Number for FAIR compliance
3. **Batch QC** - Link unknowns to reference materials in batches (enables quality assessment)
4. **Sequential logging** - Errors use `.next-error-number`, ideas use `.next-idea-number`
5. **Living docs first** - Read `readme/INDEX.md` before code changes (saves tokens, prevents mistakes)

---

**End of CLAUDE.md** | For global settings see `~/.claude/CLAUDE.md` | For field definitions see `documentation/definitions.md`
