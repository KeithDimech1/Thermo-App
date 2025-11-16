# EDCNet - QC Results Database with AI Plugins

**Last Updated:** 2025-11-16
**Project:** EDCNet (External Disease Control Network)
**Type:** Next.js Application with PostgreSQL (Neon)
**Purpose:** Pathogen and viral QC results database with AI-powered diagnostic plugins

---

## 🎯 Project Overview

### What is EDCNet?

EDCNet is a quality control performance database for diagnostic assays that test for pathogens and viruses. The system tracks:
- **200-500 test configurations** (unique combinations of marker + assay + QC sample)
- **CV measurements** (Coefficient of Variation - precision/reproducibility metrics)
- **40-60 biomarkers** (antibodies and antigens for various pathogens)
- **50-80 diagnostic assays** (CLIA, ELISA, PCR, ECLIA, CMIA platforms)
- **15-25 manufacturers** (Abbott, Roche, DiaSorin, Bio-Rad, etc.)
- **20-30 pathogens** (infectious agents being tested)

### AI Plugin Architecture

**Current Focus:** Designing AI plugins for:
1. **Automated QC analysis** - Pattern recognition in CV data
2. **Performance prediction** - ML models for test quality forecasting
3. **Anomaly detection** - Identifying outlier measurements
4. **Regulatory compliance** - Auto-flagging tests that don't meet thresholds
5. **Comparative analytics** - Manufacturer/assay performance insights

**Tech Stack for AI:**
- Python integration (`.venv/` for ML models)
- Data export via `output/` directory
- API endpoints for AI model inference
- Real-time analysis via server components

---

## 📖 Living Documentation (ALWAYS START HERE)

**⭐ PRIMARY SOURCE:** `readme/INDEX.md` - Complete architectural overview

**Before ANY code changes:**
1. Read `readme/INDEX.md` (documentation hub)
2. Navigate to specific docs referenced
3. Only then search code if needed

**Key Documentation:**
- `readme/database/SCHEMA_SUMMARY.md` - Database overview (8 tables + 2 views)
- `readme/database/CODE_USAGE.md` - Which code uses which tables
- `readme/lib/db/queries.md` - All 28+ SQL query functions
- `readme/lib/db/connection.md` - PostgreSQL connection pool

---

## 🗄️ Database Architecture

### Core Tables (Read-Only Application)

**Test Configuration & Metrics:**
- `test_configurations` - Unique marker+assay+QC combinations (CORE TABLE)
- `cv_measurements` - Performance metrics (CV percentages, 1:1 with configs)

**Reference Data:**
- `markers` - Biomarkers (IgG, IgM, Antigens)
- `assays` - Diagnostic platforms (CLIA, ELISA, PCR)
- `manufacturers` - Test kit manufacturers
- `pathogens` - Infectious agents
- `categories` - Disease categories
- `qc_samples` - QC materials

**Pre-Aggregated Views:**
- `vw_test_config_details` - Pre-joined config data (fast queries)
- `vw_manufacturer_performance` - Pre-aggregated stats (dashboard)

### CV (Coefficient of Variation) Thresholds

**Quality Ratings:**
- **<10% CV:** Excellent (suitable for critical tests like HIV screening)
- **10-15% CV:** Acceptable (routine clinical use)
- **>15% CV:** Poor (may not meet regulatory requirements)

**Overall Quality Rating:**
- **Excellent:** CV <10% for ≥80% of measurements
- **Good:** CV <10% for 60-79% of measurements
- **Acceptable:** CV <10% for 40-59% of measurements
- **Poor:** CV <10% for <40% of measurements

---

## 📁 Project-Specific Safe Zones

**Application Code (NEVER moved by `/tidy`):**
- `app/` - Next.js App Router (7 routes, 9 API endpoints)
- `components/` - React UI components (15+ components)
- `lib/` - Business logic & database layer
  - `lib/db/connection.ts` - PostgreSQL pool (208 lines, singleton)
  - `lib/db/queries.ts` - All SQL queries (773 lines, 28+ functions)
- `public/` - Static assets (images, icons)
- `scripts/` - Database utilities, import scripts (19 scripts)
- `readme/` - Living documentation (14 files, 100% DB coverage)
- `output/` - AI-generated exports (CSV, reports, analysis)

**AI/ML Infrastructure:**
- `.venv/` - Python virtual environment (for ML models)
- `scripts/ai/` - AI plugin scripts (if added)
- `output/summaries/` - AI-generated summaries
- `output/exports/` - Data exports for ML training

**Development Artifacts (build-data/):**
- `build-data/documentation/` - Architecture specs, deployment guides, data extraction instructions
- `build-data/learning/` - Research notes, QC papers, thermochronology studies, AI model research
  - `learning/thermo-papers/` - Thermochronology research papers and summaries
  - `learning/qc-papers/` - QC methodology research
- `build-data/prototypes/` - AI plugin prototypes, POCs, experiments
- `build-data/archive/` - Deprecated code, old implementations
- `build-data/assets/` - Source data, schemas, design files
  - `assets/source-data/thermo/` - Thermochronology data extracts (CSV, transformed FAIR data)
  - `assets/schemas/` - Database ERD diagrams
- `build-data/errors/` - Error tracking system (for /error-mark and /debug-mode)
  - `errors/live-errors.md` - Active bugs and errors
  - `errors/resolved-errors.md` - Historical error archive
- `build-data/ideas/` - Feature ideas and implementation tracking (for /idea-log and /idea-mode)
  - `ideas/live-ideas.md` - Active feature ideas
  - `ideas/implemented-ideas.md` - Completed features archive

---

## 🤖 AI Plugin Development Patterns

### Data Export for ML Training
```bash
# Export patterns
output/exports/cv-training-data.csv      # Training data for CV prediction
output/exports/manufacturer-stats.json   # Aggregated stats for analysis
output/reports/anomaly-detection.json    # Outlier detection results
```

### Python Integration
```bash
# AI scripts location
scripts/ai/cv-predictor.py              # CV prediction model
scripts/ai/anomaly-detector.py          # Outlier detection
scripts/ai/compliance-checker.py        # Regulatory compliance
```

### API Endpoints for AI
```bash
# AI-specific endpoints
app/api/ai/predict-cv/route.ts          # CV prediction inference
app/api/ai/detect-anomalies/route.ts    # Real-time anomaly detection
app/api/ai/compare-assays/route.ts      # Comparative analytics
```

---

## 🔑 Key Domain Concepts

### Quality Control Workflow
1. **Test Configuration** - Define marker + assay + QC sample combination
2. **Run QC Tests** - Multiple measurements across different lots/batches
3. **Calculate CV** - Coefficient of variation = (Std Dev / Mean) × 100%
4. **Assess Quality** - Compare CV against thresholds
5. **Generate Reports** - Performance summaries, compliance checks

### Diagnostic Test Types
- **CLIA** - Chemiluminescent Immunoassay (automated, high throughput)
- **ELISA** - Enzyme-Linked Immunosorbent Assay (standard, manual/automated)
- **PCR** - Polymerase Chain Reaction (nucleic acid detection)
- **ECLIA** - Electrochemiluminescent Immunoassay (Roche platform)
- **CMIA** - Chemiluminescent Microparticle Immunoassay (Abbott platform)

### Antibody Types
- **IgG** - Long-term immunity indicator
- **IgM** - Recent/acute infection indicator
- **Antigen** - Direct pathogen detection

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

## 🎨 UI Components for QC Data

**Visualization Components:**
- CV trend charts (showing variation over time)
- Performance comparison tables (manufacturer vs manufacturer)
- Quality rating badges (color-coded by threshold)
- Anomaly alerts (AI-detected outliers)
- Compliance indicators (regulatory thresholds)

**Dashboard Components:**
- Manufacturer performance overview
- Top/bottom performing assays
- Recent QC test results
- Alerts for failing tests

---

## 🚀 Quick Reference

### Database Queries
```typescript
// Most common patterns
import {
  getTestConfigWithCV,           // Single config with CV data
  getTestConfigsByManufacturer,  // Filter by manufacturer
  getMarkersByPathogen,           // Related markers
  getManufacturerPerformance     // Aggregated stats
} from '@/lib/db/queries'
```

### Data Flow
```
API Route → lib/db/queries.ts → lib/db/connection.ts → PostgreSQL (Neon)
```

### Documentation Updates
```bash
/bigtidycheck    # Comprehensive quality analysis + DB schema check
/index           # Update PROJECT_INDEX.json
```

---

## 🔬 Research & QC Papers

**Location:** `build-data/learning/qc-papers/`

Store research on:
- CV calculation methodologies
- Regulatory thresholds (FDA, CE-IVD)
- Industry standards (CLSI, CAP)
- Manufacturer specifications
- AI/ML papers on QC prediction

---

## 📋 Project-Specific Notes

### Current State (as of 2025-11-15)
- ✅ Complete database schema (8 tables + 2 views)
- ✅ 28+ query functions documented
- ✅ Frontend UI components implemented
- ✅ API endpoints operational
- 🚧 AI plugins in design phase
- 🚧 ML model training pipeline pending
- 🚧 Anomaly detection system planned

### Immediate Priorities
1. Design AI plugin architecture
2. Export training data for CV prediction models
3. Implement anomaly detection algorithms
4. Build regulatory compliance checker
5. Create comparative analytics engine

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

**Note:** This file is auto-loaded by Claude Code on every session. For global commands and workflows, see `~/.claude/CLAUDE.md`. This file focuses on EDCNet-specific architecture, domain knowledge, and AI plugin development.
