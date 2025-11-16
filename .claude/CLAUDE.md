# AusGeochem - Thermochronology Database

**Last Updated:** 2025-11-16
**Project:** AusGeochem Thermochronology Data Platform
**Type:** Next.js Application with PostgreSQL (Neon)
**Purpose:** Geological sample dating data for fission-track and (U-Th)/He thermochronology

---

## 🎯 Project Overview

### What is This Application?

This is a thermochronology database application for geological dating. The system tracks:
- **Geological samples** with IGSN (International Geo Sample Numbers)
- **Fission-Track (FT) dating** - Age determinations, track counts, track lengths
- **(U-Th)/He dating** - Single grain age data with chemistry
- **Sample metadata** - Location, lithology, mineral type, elevation
- **Data packages** - Privacy controls and DOI assignment

### Key Concepts

**Thermochronology** = Dating geological samples using radioactive decay and thermal history
- **Fission-Track (AFT)** - Tracks from uranium-238 fission in minerals (apatite, zircon)
- **(U-Th)/He** - Helium retention in minerals (apatite, zircon)
- **Age determinations** - When rocks cooled below closure temperature (~110°C for AFT)

**Data Structure:**
- 1 sample → 1 ft_ages record (pooled/central age)
- 1 sample → many ft_counts records (grain-by-grain count data)
- 1 sample → many ft_track_lengths records (individual track measurements)
- 1 sample → many ahe_grain_data records (single grain (U-Th)/He ages)

---

## 📖 Living Documentation (ALWAYS START HERE)

**⭐ PRIMARY SOURCE:** `readme/INDEX.md` - Complete architectural overview

**Before ANY code changes:**
1. Read `readme/INDEX.md` (documentation hub)
2. Navigate to specific docs referenced
3. Only then search code if needed

**Key Documentation:**
- `readme/database/SCHEMA_CHANGES.md` - Database schema change log
- `build-data/assets/schemas/AusGeochem_ERD.md` - Full database ERD specification

---

## 🗄️ Database Architecture

### Core Tables (Read-Only Application)

**Data Management:**
- `datasets` - Data packages with privacy controls, embargo dates, DOI

**Sample Data:**
- `samples` - Geological samples with IGSN, location, lithology (PRIMARY TABLE)

**Fission-Track Data:**
- `ft_ages` - Pooled/central age determinations (1:1 with samples)
- `ft_counts` - Grain-by-grain spontaneous/induced track counts
- `ft_track_lengths` - Individual confined track length measurements

**(U-Th)/He Data:**
- `ahe_grain_data` - Single grain (U-Th)/He ages with chemistry

**Pre-Aggregated Views:**
- `vw_aft_complete` - Complete AFT data (samples + ages + counts + lengths)
- `vw_sample_summary` - Sample-level statistics and grain counts

### Key Fields Explained

**IGSN** - International Geo Sample Number (global unique identifier)
**Pooled Age** - Age calculated from all grains combined
**Central Age** - Age accounting for overdispersion
**Dispersion** - Measure of age scatter (>0% = geological complexity)
**P(χ²)** - Statistical test for age homogeneity
**Ns, Ni, Nd** - Spontaneous, induced, dosimeter track counts
**ρs, ρi, ρd** - Track densities
**Ft correction** - Alpha ejection correction for (U-Th)/He ages

---

## 📁 Project-Specific Safe Zones

**Application Code (NEVER moved by `/tidy`):**
- `app/` - Next.js App Router (sample pages, API routes)
- `lib/` - Business logic & database layer
  - `lib/db/connection.ts` - PostgreSQL pool (Neon connection)
  - `lib/db/queries.ts` - All SQL queries for thermochronology data
  - `lib/types/thermo-data.ts` - TypeScript type definitions
- `public/` - Static assets
- `scripts/` - Database utilities, import scripts
- `readme/` - Living documentation
- `output/` - Data exports

**AI/ML Infrastructure:**
- `.venv/` - Python virtual environment (for future ML models)
- `scripts/ai/` - AI plugin scripts (if added)

**Development Artifacts (build-data/):**
- `build-data/documentation/` - Architecture specs, deployment guides
- `build-data/learning/` - Research notes, thermochronology papers
  - `learning/thermo-papers/` - Thermochronology research
- `build-data/assets/` - Source data, schemas
  - `assets/source-data/thermo/` - Thermochronology data extracts
  - `assets/schemas/AusGeochem_ERD.md` - Database ERD specification
- `build-data/errors/` - Error tracking system
- `build-data/ideas/` - Feature ideas and implementation tracking

---

## 🔑 Key Domain Concepts

### Sample Collection Workflow
1. **Sample Collection** - Field collection of rock samples with GPS coordinates
2. **Mineral Separation** - Extract apatite or zircon grains
3. **Analysis** - Fission-track dating (EDM or LA-ICP-MS) or (U-Th)/He analysis
4. **Age Calculation** - Compute pooled age, central age, dispersion
5. **Data Upload** - Store in database with IGSN, metadata

### Fission-Track Dating Process
- **Mount grains** - Embed in epoxy, polish, etch to reveal tracks
- **Count tracks** - Spontaneous (Ns), induced (Ni), dosimeter (Nd)
- **Calculate age** - Using zeta calibration, decay constants
- **Measure lengths** - Confined track lengths for thermal history

### (U-Th)/He Dating Process
- **Single grain analysis** - Pick individual apatite or zircon grains
- **He measurement** - Extract and measure He-4 content
- **U-Th-Sm measurement** - Dissolution and ICP-MS analysis
- **Ft correction** - Correct for alpha ejection based on grain geometry
- **Age calculation** - Raw age and corrected age

---

## 📊 Database Connection

**Critical Configuration:**
```bash
# .env.local (REQUIRED for migrations)
DIRECT_URL="postgresql://user:pass@host:5432/dbname"  # Direct connection
DATABASE_URL="postgresql://..."                        # Pooled connection (Neon)
```

**Connection Pattern:**
- Use `lib/db/connection.ts` for all database access
- Connection pool with SSL for Neon
- Query helpers: `query()`, `queryOne()`, `transaction()`
- Slow query detection (>1000ms logged)

---

## 🚀 Quick Reference

### Database Queries
```typescript
// Most common patterns
import {
  getAllSamples,           // Get samples with filtering
  getSampleById,           // Single sample by ID
  getSampleDetail,         // Sample with all FT + AHe data
  getFTAgesBySample,       // FT ages for sample
  getFTCountsBySample,     // FT grain counts
  getAHeGrainsBySample,    // (U-Th)/He grain data
  getDatasetStats          // Dataset statistics
} from '@/lib/db/queries'
```

### Data Flow
```
API Route → lib/db/queries.ts → lib/db/connection.ts → PostgreSQL (Neon)
```

### Documentation Updates
```bash
/index           # Update PROJECT_INDEX.json
```

---

## 📋 Project-Specific Notes

### Current State (as of 2025-11-16)
- ✅ Complete database schema (6 tables + 2 views)
- ✅ All QC legacy code removed
- ✅ Clean thermochronology-only codebase
- ✅ Import scripts operational
- 🚧 Table documentation pending
- 🚧 UI components for data visualization pending

### Immediate Priorities
1. Create table documentation for 6 tables
2. Build sample list and detail pages
3. Add filtering and search
4. Create data visualization components (age plots, histograms)
5. Implement data export functionality

---

## 🌐 Production Deployment

**Hosting:** Vercel
**Database:** Neon PostgreSQL (serverless)
**Environment:** Production config in `.env.local.example`

**Build Command:**
```bash
npm run build    # Next.js production build
```

---

## 📚 Research References

**Key Papers on AusGeochem:**
- See `build-data/learning/thermo-papers/` for research papers
- ERD specification in `build-data/assets/schemas/AusGeochem_ERD.md`

**Thermochronology Fundamentals:**
- Fission-Track dating methodology
- (U-Th)/He thermochronometry
- Thermal history modeling
- FAIR data principles for geoscience

---

**Note:** This file is auto-loaded by Claude Code on every session. For global commands and workflows, see `~/.claude/CLAUDE.md`. This file focuses on thermochronology-specific architecture, domain knowledge, and geological dating concepts.
