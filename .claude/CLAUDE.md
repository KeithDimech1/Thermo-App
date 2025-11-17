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

## 🗄️ Database Architecture - Schema v2 (EarthBank FAIR)

### CRITICAL CONCEPT: Datapoint-Based Architecture

**Schema Philosophy:**
- **1 sample → many datapoints** (multiple analytical sessions)
- **FAIR Compliant:** Nixon et al. (2025) EarthBank architecture
- **Fully Compatible:** Kohn et al. (2024) reporting standards
- **Direct Import:** EarthBank Excel template ingestion

**Why Datapoints Matter:**
- Same sample can be analyzed multiple times (different labs/methods/dates)
- Each analytical session = 1 datapoint with complete QC metadata
- Batch-level QC tracking with reference materials (Durango, Fish Canyon)
- ORCID-based provenance tracking (who collected, analyzed, published)
- Granular data storage (individual tracks, single grain ages)

---

### Core Infrastructure Tables (7)

**Data Management:**
- `datasets` - Data packages with privacy controls, embargo dates, DOI
- `samples` - Geological samples with IGSN, location, lithology (PRIMARY TABLE)

**Provenance & QC:**
- `people` - Researchers with ORCID identifiers
- `sample_people_roles` - Links samples → people (collector, PI, etc.)
- `datapoint_people_roles` - Links datapoints → people (analyst, operator)
- `batches` - Analytical batches linking unknowns to reference materials
- `reference_materials` - QC standards (Durango apatite, Fish Canyon zircon)

**Physical Sample Tracking:**
- `mounts` - Epoxy mounts containing grains
- `grains` - Individual grains (enables cross-method linking: FT + He + U-Pb)

---

### Fission-Track Tables (5) - EarthBank FTDatapoint Template

**Datapoint-Level (Analytical Sessions):**
- `ft_datapoints` - FT analytical sessions (lab, date, method, analyst, summary stats)
  - Contains: Pooled age, central age, dispersion, P(χ²), MTL, Dpar
  - Links to: sample_id, batch_id, analyst (via people)
  - Maps to: EarthBank "FT Datapoints" sheet (70+ columns)

**Grain-Level Data (Linked to Datapoints):**
- `ft_count_data` - Grain-by-grain count data (Ns, ρs, U ppm, Dpar)
  - Maps to: EarthBank "FTCountData" sheet
  - Links to: ft_datapoint_id

- `ft_single_grain_ages` - Individual grain ages (not just pooled)
  - Maps to: EarthBank "FTSingleGrain" sheet
  - Links to: ft_datapoint_id

- `ft_track_length_data` - Individual track measurements (length, c-axis angle)
  - Maps to: EarthBank "FTLengthData" sheet
  - Links to: ft_datapoint_id

- `ft_binned_length_data` - Binned length histograms (legacy format support)
  - Maps to: EarthBank "FTBinnedLengthData" sheet
  - Links to: ft_datapoint_id

---

### (U-Th)/He Tables (3) - EarthBank HeDatapoint Template

**Datapoint-Level (Analytical Sessions):**
- `he_datapoints` - (U-Th)/He analytical sessions (lab, date, method, summary stats)
  - Contains: Mean ages (corrected/uncorrected), QC stats (χ², MSWD)
  - Links to: sample_id, batch_id
  - Maps to: EarthBank "He Datapoints" sheet (46+ columns)

**Grain-Level Data:**
- `he_whole_grain_data` - Complete grain-level (U-Th)/He results (75+ columns!)
  - Contains: Grain dimensions, volumes, FT corrections, chemistry, ages
  - Maps to: EarthBank "HeWholeGrain" sheet
  - Links to: he_datapoint_id

- `ahe_grain_data` - Legacy (U-Th)/He data (being phased out in favor of he_whole_grain_data)

---

### Data Hierarchy (Sample → Datapoint → Grain)

```
datasets (dataset_id)
  └── samples (sample_id, IGSN)
      ├── ft_datapoints (multiple analytical sessions)
      │   ├── ft_count_data (grain-level counts)
      │   ├── ft_single_grain_ages (grain ages)
      │   ├── ft_track_length_data (individual tracks)
      │   └── ft_binned_length_data (binned histograms)
      │
      └── he_datapoints (multiple analytical sessions)
          └── he_whole_grain_data (grain-level chemistry & ages)
```

---

### Key Fields Explained

**Datapoint Concepts:**
- **Datapoint** - One analytical session (specific lab, date, method, analyst)
- **Batch** - Group of analyses run together (links unknowns to reference materials)
- **Reference Material** - Standards with known ages (Durango, Fish Canyon, Mt. Dromedary)

**Fission-Track Fields:**
- **Pooled Age** - Age from all grain data combined (assumes single population)
- **Central Age** - Age accounting for overdispersion (random effects model)
- **Dispersion** - Measure of age scatter (>0% indicates geological complexity or U zoning)
- **P(χ²)** - Chi-square probability (tests if scatter explained by analytical uncertainty)
- **Ns, Ni, Nd** - Spontaneous, induced, dosimeter track counts
- **ρs, ρi, ρd** - Track densities (tracks/cm²)
- **Dpar** - Etch pit diameter parallel to c-axis (kinetic parameter)
- **MTL** - Mean track length (indicates thermal history)

**(U-Th)/He Fields:**
- **Corrected Age** - Age after alpha ejection correction (uses grain geometry)
- **FT** - Alpha ejection correction factor (0.6-0.9 typical)
- **eU** - Effective uranium (U + 0.235 × Th, accounts for daughter production)
- **Rs** - Sphere radius (for FT calculation)

**Provenance Fields:**
- **IGSN** - International Geo Sample Number (global unique identifier)
- **ORCID** - Open Researcher & Contributor ID (persistent researcher identifier)
- **Batch ID** - Links analyses to QC standards

---

## 🌐 EarthBank Integration & FAIR Principles

### What is EarthBank?

**EarthBank** (formerly AusGeochem) is a FAIR geochemistry platform developed by AuScope for storing, managing, and sharing geological data globally.

**Key Publication:** Nixon, A.L., Boone, S.C., Gréau, Y., et al., 2025. Volcanoes to vugs: Demonstrating a FAIR geochemistry framework with a diverse application of major and trace element data through the AuScope EarthBank platform. *Chemical Geology*, v. 696, 123092.

**Platform:** https://earthbank.auscope.org.au/

---

### FAIR Data Principles

Our schema implements **FAIR** (Findable, Accessible, Interoperable, Reusable) standards:

**Findable:**
- IGSN (International Geo Sample Numbers) for global sample identification
- DOI assignment for datasets (citable identifiers)
- Complete metadata for discoverability

**Accessible:**
- Privacy controls (public/restricted/embargoed)
- Embargo dates for unpublished data
- API access for programmatic retrieval

**Interoperable:**
- EarthBank template compatibility (direct import/export)
- Kohn et al. (2024) reporting standards (FAIR Table 4-10)
- Controlled vocabularies for method names, lithology, etc.

**Reusable:**
- Complete provenance (ORCID-linked people)
- Batch/QC metadata for quality assessment
- Granular data storage (enables independent age recalculation)
- Full analytical session metadata (enables thermal history remodeling)

---

### EarthBank Excel Templates

Our schema directly maps to EarthBank import templates:

**Sample Template** (`Sample.template.v2025-04-16.xlsx`)
- Maps to: `samples` table (30 columns)
- Contains: IGSN, location, lithology, collection metadata

**FT Datapoint Template** (`FTDatapoint.template.v2024-11-11.xlsx`)
- Maps to: `ft_datapoints`, `ft_count_data`, `ft_single_grain_ages`, `ft_track_length_data`, `ft_binned_length_data`
- Contains: 70+ columns of FT analytical session data
- Sheets: "FT Datapoints", "FTCountData", "FTSingleGrain", "FTLengthData", "FTBinnedLengthData"

**He Datapoint Template** (`HeDatapoint.template.v2024-11-11.xlsx`)
- Maps to: `he_datapoints`, `he_whole_grain_data`
- Contains: 46+ columns of (U-Th)/He analytical session data
- Sheets: "He Datapoints", "HeWholeGrain", "HeInSitu"

**Template Location:** `build-data/learning/thermo-papers/earthbanktemplates/`

---

### Import/Export Workflow

**Import to Database** (using `/thermoextract` command):
1. Extract data from published papers (PDF → structured data)
2. Map fields to EarthBank template columns
3. Import Excel templates via `scripts/db/import-earthbank-templates.ts`
4. Validate data integrity and relationships

**Export to EarthBank:**
1. Query database for complete dataset
2. Generate EarthBank-compatible Excel files
3. Upload to https://earthbank.auscope.org.au/
4. Mint DOI for dataset citation

**Bidirectional Compatibility:**
- Data imported from EarthBank can be queried in our app
- Data extracted from papers can be exported to EarthBank
- Full metadata preservation in both directions

---

### Kohn et al. (2024) Compliance

Our schema implements **all required tables** from the landmark community consensus paper:

**Citation:** Kohn, B.P., Ketcham, R.A., Vermeesch, P., Boone, S.C., et al., 2024. Interpreting and reporting fission-track chronological data. *GSA Bulletin*, v. 136, no. 9/10, p. 3891–3920.

**FAIR Tables Implemented:**
- **Table 4 (Samples):** → `samples` table - Geosample metadata (IGSN, location, lithology)
- **Table 5 (FT Counts):** → `ft_count_data` table - Grain-by-grain count data
- **Table 6 (Track Lengths):** → `ft_track_length_data` table - Individual track measurements
- **Table 7 (LA-ICP-MS):** → Columns in `ft_count_data` (U ppm, spot metadata)
- **Table 8 (EPMA):** → Future implementation (mineral chemistry)
- **Table 9 (Kinetics):** → Columns in `ft_datapoints` (Dpar, rmr₀, kappa)
- **Table 10 (Ages):** → `ft_datapoints` table - Calculated ages, statistical parameters
- **Table 11 (Thermal Models):** → Future implementation (t-T paths)

**Why This Matters:**
- Enables independent age recalculation with updated decay constants
- Allows thermal history remodeling with new annealing models
- Supports large-scale data synthesis and meta-analysis
- Facilitates machine learning applications on standardized data

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
# .env.local (REQUIRED for migrations and scripts)
DATABASE_URL="postgresql://user:pass@host:port/db?sslmode=require"  # Pooled (Neon)
DIRECT_URL="postgresql://user:pass@host:port/db?sslmode=require"    # Direct connection
```

**Connection Pattern:**
- Use `lib/db/connection.ts` for all database access
- **Auto-loads `.env.local`** - Works in both Next.js and standalone scripts
- Connection pool with SSL for Neon
- Query helpers: `query()`, `queryOne()`, `transaction()`
- Slow query detection (>1000ms logged)

**Why both URLs?**
- `DATABASE_URL` - Pooled connection for app (faster for serverless)
- `DIRECT_URL` - Direct connection for migrations (required by Prisma/schema changes)

**Environment Loading Fix (2025-11-16):**
- `lib/db/connection.ts` now auto-loads `.env.local` when environment vars missing
- This fixes TypeScript scripts run with `npx tsx` (they bypass Next.js env loading)
- Pattern: Check if env vars exist → if not, load from `.env.local`

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

## 📚 Research References & Foundational Papers

### Nixon et al. (2025) - EarthBank FAIR Geochemistry Platform

**Citation:** Nixon, A.L., Boone, S.C., Gréau, Y., et al., 2025. Volcanoes to vugs: Demonstrating a FAIR geochemistry framework with a diverse application of major and trace element data through the AuScope EarthBank platform. Chemical Geology, v. 696, 123092.

**Key Insights:**
- **EarthBank = AusGeochem** - The platform was rebranded in 2025 to reflect international availability
- **FAIR data architecture** - Relational database linking geochemistry, geochronology, and thermochronology
- **Multi-data type integration** - Samples can have FT ages, (U-Th)/He ages, U-Pb ages, and geochemistry linked
- **Analytical session tracking** - Records instrument metadata, operator, calibration values (critical for QC)
- **Reference materials** - Stores standard results alongside unknowns for quality assessment
- **DOI minting** - Datasets assigned citable identifiers for academic publication
- **Web-based tools** - Interactive plotting, spatial visualization, custom calculations via API

**Relevance to This Project:**
- Our `/thermoextract` tool produces **EarthBank-compatible CSV templates**
- We follow the **4-table FAIR schema**: samples → fission_track_counts → track_lengths → ages
- Extraction workflow targets **upload to EarthBank** for global data sharing
- Templates located: `build-data/learning/thermo-papers/earthbanktemplates/`

**EarthBank Templates:**
- `FTDatapoint.template.v2024-11-11.xlsx` - Fission-track data submission template
- `Sample.template.v2025-04-16.xlsx` - Sample metadata template
- `HeDatapoint.template.v2024-11-11.xlsx` - (U-Th)/He data template
- `GCDatapoint.template.v2024-11-11.xlsx` - Geochemistry data template

---

### Kohn et al. (2024) - FT Data Reporting Standards

**Citation:** Kohn, B.P., Ketcham, R.A., Vermeesch, P., Boone, S.C., et al., 2024. Interpreting and reporting fission-track chronological data. GSA Bulletin, v. 136, no. 9/10, p. 3891–3920.

**Executive Summary:**
Landmark community consensus paper providing comprehensive guidelines for FAIR fission-track data reporting. Synthesizes 50+ years of methodological development and establishes standardized metadata schemas through **11 detailed tables** covering geosample collection, analytical methods (EDM vs LA-ICP-MS), statistical analysis, kinetic parameters, and thermal history modeling. Critical for enabling independent age recalculation, thermal history remodeling, large-scale data synthesis, and AI-powered analysis.

**Key Problems Addressed:**
1. **Inconsistent reporting** across laboratories impedes data comparison and reuse
2. **Methodological evolution** (LA-ICP-MS, digital analysis) requires updated schemas
3. **FAIR principles** not systematically applied to thermochronology
4. **Machine learning applications** require large, consistently formatted datasets
5. **Regional syntheses** hampered by inability to recalculate ages with updated constants

**Critical Findings:**
- **Most FT ages are model ages** - Zeta calibration produces ages valid only when thermal histories match standards
- **LA-ICP-MS advantages:** Rapid (days vs weeks), simultaneous U-Pb + trace elements, no irradiation
- **EDM advantages:** Matched Poisson design, higher accuracy, handles U zoning better
- **Overdispersion:** LA-ICP-MS ages more dispersed due to U-zoning and higher analytical precision
- **Kinetic controls:** Cl content shifts PAZ from ~60-120°C (F-apatite) to ~100-160°C (Cl-rich)

**Database Schema Specification (Tables 4-11):**
The paper provides **complete field-level specifications** for thermochronology databases:

| Table | Purpose | Required Fields | Recommended Fields |
|-------|---------|----------------|-------------------|
| **Table 4: Samples** | Geosample metadata | sample_id, IGSN, lat/lon, elevation, mineral, lithology | stratigraphic_unit, sample_age, collector |
| **Table 5: FT Counts** | Grain-by-grain counts | grain_id, Ns, ρs, Dpar, analyst, lab, method | Ni, ρi, ρd (EDM); U ppm (LA-ICP-MS) |
| **Table 6: Track Lengths** | Confined track measurements | track_id, length, c-axis angle, track_type | Dpar, 3D correction, etching conditions |
| **Table 7: LA-ICP-MS** | Elemental analysis | spot_id, U238 ppm, laser params, mass spec | All measured elements, depth-weighting |
| **Table 8: EPMA** | Mineral chemistry | spot_id, oxide wt%, totals | Stoichiometry, calibration standards |
| **Table 9: Kinetics** | Annealing parameters | grain_id, rmr₀, equation used | eCl, eDpar, kappa |
| **Table 10: Ages** | Calculated ages | grain/sample ages, age equation, zeta, λf, λD | Peak ages (detrital), dispersion, P(χ²) |
| **Table 11: Thermal Models** | Thermal history | model code/version, annealing model, constraints | t-T paths, goodness-of-fit, all parameters |

**Statistical Methods:**
- **Chi-square test (χ²):** Tests if analytical uncertainties explain scatter
- **Central age:** Lognormal random effects model accounting for overdispersion
- **Mixture modeling:** Peak fitting for detrital samples (use cautiously)
- **Radial plots:** Bivariate visualization of single-grain ages and precisions

**Analytical Methods Compared:**

| Feature | EDM | LA-ICP-MS |
|---------|-----|-----------|
| Turnaround | Weeks (irradiation) | Days |
| Precision | Lower (Poisson) | Higher (mass spec) |
| Accuracy | Higher (matched design) | Lower (U zoning) |
| U-Pb dating | Separate analysis | Same session |
| Zero-count grains | Straightforward | Complex |
| Equipment cost | Lower | Higher |

**Relevance to This Project:**
- Our **database schema directly implements Tables 4-10** (thermal modeling support pending)
- `/thermoextract` command **extracts and validates all required fields** per Kohn et al.
- **Age calculation functions** follow equations 5 (EDM), 10 (LA-ICP-MS) from paper
- **Quality metrics:** We track χ², P(χ²), dispersion, MSWD per recommendations
- **FAIR compliance:** IGSN assignment, controlled vocabularies, complete metadata capture

**Implementation Status:**
- ✅ Core schema (samples, ft_counts, track_lengths, ft_ages, ahe_grain_data)
- ✅ Required fields from Tables 4-6, 10
- ✅ Statistical calculations (χ², central age, dispersion)
- 🚧 LA-ICP-MS metadata (Table 7) - partial support
- 🚧 EPMA chemistry (Table 8) - not yet implemented
- 🚧 Kinetic parameters (Table 9) - calculated but not stored separately
- 🚧 Thermal models (Table 11) - future feature

---

### Additional Resources

**Key Papers in `build-data/learning/thermo-papers/`:**
- Kohn et al. (2024) - Reporting standards (see above)
- Nixon et al. (2025) - EarthBank platform (see above)
- See folder for additional thermochronology research papers

**Database Specifications:**
- `build-data/assets/schemas/AusGeochem_ERD.md` - Full ERD specification
- `build-data/documentation/Nixon et al., 2025.pdf` - Complete EarthBank paper

**EarthBank Integration:**
- Templates: `build-data/learning/thermo-papers/earthbanktemplates/`
- Extraction workflow: `/thermoextract` command
- Target: Upload to https://earthbank.auscope.org.au/

---

**Note:** This file is auto-loaded by Claude Code on every session. For global commands and workflows, see `~/.claude/CLAUDE.md`. This file focuses on thermochronology-specific architecture, domain knowledge, and geological dating concepts.
