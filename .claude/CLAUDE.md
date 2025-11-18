# AusGeochem - Thermochronology Database

**Last Updated:** 2025-11-18
**Project:** AusGeochem Thermochronology Data Platform
**Type:** Next.js + PostgreSQL (Neon) + EarthBank FAIR Integration
**Purpose:** Extract, manage, and share geological dating data (fission-track & (U-Th)/He)

---

## ⚠️ SCHEMA MIGRATION IN PROGRESS (IDEA-014)

**Status:** Migrating from snake_case → EarthBank-native camelCase schema

**Current State (2025-11-18):**
- ✅ New tables created: `earthbank_samples`, `earthbank_ftDatapoints`, etc.
- ✅ All tables use exact EarthBank camelCase field names (e.g., `sampleName`, `centralAgeMa`, `pooledAgeMa`)
- ✅ UUID primary keys implemented (`id UUID DEFAULT uuid_generate_v4()`)
- 🚧 CSV import in progress
- ⏳ Application code not yet updated

**What's Changing:**
- **OLD:** `ft_datapoints.central_age_ma`, `samples.sample_id`
- **NEW:** `earthbank_ftDatapoints."centralAgeMa"`, `earthbank_samples."sampleName"`
- **Note:** Double-quotes required for camelCase in SQL queries

**Impact on Commands:**
- `/thermoextract` - Will need to output camelCase CSVs (not yet updated)
- `/thermoanalysis` - Will need to query new schema (not yet updated)
- Import scripts - Will be simplified (zero field translation needed)

**Branch:** `idea-014-earthbank-schema-migration`

**See:** `build-data/ideas/debug/IDEA-014-migrate-to-earthbank-native-schema-camelcase-1-1-template-mapping.md`

---

## 🎯 Project Identity

### What This Does
Database application for thermochronology (geological dating via radioactive decay & thermal history):
- **Extract data** from published papers → EarthBank templates → Database
- **Manage samples** with IGSN, location, lithology, analytical metadata
- **Track datapoints** (analytical sessions with full QC: lab, date, method, analyst, batch, standards)
- **Store granular data** (grain-by-grain counts, individual track measurements, single-grain ages)
- **FAIR compliant** (Findable, Accessible, Interoperable, Reusable per Nixon et al. 2025)

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

## 📖 Documentation Hierarchy (ALWAYS START HERE)

**Before ANY code changes:**
1. **Read `readme/INDEX.md`** - Living architectural documentation
2. Navigate to specific docs referenced
3. Only then search code if needed

**Key Documentation:**
- `readme/INDEX.md` - Complete architecture, workflows, decisions (⭐ PRIMARY SOURCE)
- `readme/database/SCHEMA_CHANGES.md` - Schema evolution log
- `documentation/definitions.md` - Field glossary (Pooled Age, Dpar, MTL, Ft, etc.)
- `build-data/documentation/foundation/` - Research papers (Kohn 2024, Nixon 2025)
- `build-data/assets/schemas/AusGeochem_ERD.md` - Full ERD specification

---

## 🔧 Slash Commands (Project-Specific)

**Custom workflows** available in `.claude/commands/`:

**Data Extraction & Import:**
- `/thermoextract` - Extract thermochronology data from published papers (PDF → EarthBank templates → CSV)
  - **Primary workflow:** AI-guided extraction with field validation, table detection, and EarthBank schema mapping
  - Outputs: Sample metadata, FT datapoints, He datapoints, grain-level data
  - Location: `.claude/commands/thermoextract.md`

**Data Analysis:**
- `/thermoanalysis` - Analyze thermochronology datasets (statistics, visualizations, QC checks)
  - Location: `.claude/commands/thermoanalysis.md`

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
