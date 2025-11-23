# Database Documentation

**AusGeochem Thermochronology Database - PostgreSQL (Supabase)**

This directory contains complete documentation for the thermochronology database schema.

---

## 📊 Entity Relationship Diagrams

**Start here to understand the database structure:**

### Visual Diagrams (Images) ⭐ BEST QUALITY

**Mermaid Diagrams (Recommended):**
- 🖼️ [database-erd-mermaid.png](./database-erd-mermaid.png) - Professional ERD (2384×1528 px, 446 KB)
- 📐 [database-erd-mermaid.svg](./database-erd-mermaid.svg) - Scalable vector (471 KB)

**Interactive Options:**
- 🌐 [schema.dbml](./schema.dbml) - Use with https://dbdiagram.io/ (interactive, collaborative)
- 🎨 [schema.puml](./schema.puml) - Use with https://plantuml.com/ (UML-style)

**See also:** [DIAGRAM_FORMATS.md](./DIAGRAM_FORMATS.md) - Complete format guide

### Text Documentation

### [DATABASE_ERD.md](./DATABASE_ERD.md) - Complete ERD
- Full Mermaid entity relationship diagram
- All 16 tables with fields and relationships
- Cardinality documentation
- Query patterns and examples
- FAIR principles implementation
- EarthBank template mapping
- **Use this for:** Complete technical reference

### [ERD_SIMPLE.md](./ERD_SIMPLE.md) - Quick Reference
- Simplified visual diagrams
- Table categories and hierarchy
- Common query examples
- Data flow illustrations
- **Use this for:** Quick lookups and onboarding

---

## 📋 Schema Files

### [SCHEMA_CHANGES.md](./SCHEMA_CHANGES.md)
- Schema version history
- Migration log
- Breaking changes

### Schema SQL Files
Located in `scripts/db/`:
- [`schema-earthbank-v2.sql`](../../scripts/db/schema-earthbank-v2.sql) - Production schema (1090 lines)
- [`schema-thermo.sql`](../../scripts/db/schema-thermo.sql) - Legacy schema v1

---

## 📖 Table Documentation (21 files)

Detailed documentation for each table is in [`tables/`](./tables/):

### Core Infrastructure (7 tables)
- [`datasets.md`](./tables/datasets.md) - Data packages with privacy controls
- [`people.md`](./tables/people.md) - ORCID-linked researchers
- [`samples.md`](./tables/samples.md) - Geological samples (PRIMARY TABLE)
- [`sample_people_roles.md`](./tables/sample_people_roles.md) - Sample provenance
- [`batches.md`](./tables/batches.md) - Analytical batches for QC
- [`reference_materials.md`](./tables/reference_materials.md) - QC standards
- [`mounts.md`](./tables/mounts.md) - Physical epoxy mounts
- [`grains.md`](./tables/grains.md) - Individual mineral grains

### Fission-Track Tables (5 tables)
- [`ft_datapoints.md`](./tables/ft_datapoints.md) - FT analytical sessions
- [`ft_count_data.md`](./tables/ft_count_data.md) - Grain-by-grain counts
- [`ft_single_grain_ages.md`](./tables/ft_single_grain_ages.md) - Individual grain ages
- [`ft_track_length_data.md`](./tables/ft_track_length_data.md) - Track measurements
- [`ft_binned_length_data.md`](./tables/ft_binned_length_data.md) - Binned histograms

**Legacy (v1) Tables:**
- [`ft_ages.md`](./tables/ft_ages.md) - Old single-age-per-sample table
- [`ft_counts.md`](./tables/ft_counts.md) - Old grain counts
- [`ft_track_lengths.md`](./tables/ft_track_lengths.md) - Old track lengths

### (U-Th)/He Tables (2 tables)
- [`he_datapoints.md`](./tables/he_datapoints.md) - He analytical sessions
- [`he_whole_grain_data.md`](./tables/he_whole_grain_data.md) - Grain chemistry & ages

**Legacy (v1) Tables:**
- [`ahe_grain_data.md`](./tables/ahe_grain_data.md) - Old (U-Th)/He grain data

### Linking Tables (2 tables)
- [`datapoint_people_roles.md`](./tables/datapoint_people_roles.md) - Datapoint provenance

---

## 🗂️ Database Structure

### Schema Version 2.0 (Current - EarthBank Compatible)

**Total Tables:** 16 (production) + 3 (legacy v1)

**Key Concept:** 1 sample → many datapoints (analytical sessions)

```
datasets (data packages)
  └── samples (geological samples - PRIMARY)
      ├── ft_datapoints (FT analyses) → many grain-level records
      │   ├── ft_count_data
      │   ├── ft_single_grain_ages
      │   ├── ft_track_length_data
      │   └── ft_binned_length_data
      │
      └── he_datapoints (He analyses) → many grain-level records
          └── he_whole_grain_data

batches (QC tracking)
  ├── ft_datapoints (unknowns)
  ├── he_datapoints (unknowns)
  └── reference_materials (standards)

people (ORCID researchers)
  ├── sample_people_roles → samples
  └── datapoint_people_roles → ft/he_datapoints
```

---

## 🔑 Quick Access

### Most Important Tables

1. **samples** - Start here for all queries (PRIMARY TABLE)
   - Geological sample metadata (FAIR Table 4)
   - Location, lithology, mineral type
   - Links to all analytical data

2. **ft_datapoints** - Fission-track analytical sessions
   - Contains central_age_ma (primary FT age)
   - One sample can have multiple FT analyses

3. **he_datapoints** - (U-Th)/He analytical sessions
   - Contains mean_corr_age_ma (primary He age)
   - One sample can have multiple He analyses

4. **ft_count_data** - Grain-by-grain FT count data
   - Ns, Ni, Nd, ρs (track densities)
   - Dpar (kinetic parameter)

5. **he_whole_grain_data** - Grain-level (U-Th)/He results
   - U, Th, Sm, eU chemistry
   - FT correction factor
   - Corrected age per grain

### Key Relationships

- **samples.sample_id** → **ft_datapoints.sample_id** (1:many)
- **samples.sample_id** → **he_datapoints.sample_id** (1:many)
- **ft_datapoints.id** → **ft_count_data.ft_datapoint_id** (1:many)
- **he_datapoints.id** → **he_whole_grain_data.he_datapoint_id** (1:many)
- **batches.id** → **ft_datapoints.batch_id** (1:many)
- **batches.id** → **reference_materials.batch_id** (1:many)

---

## 📚 Standards & Compliance

### FAIR Data Principles

Our schema implements **FAIR** (Findable, Accessible, Interoperable, Reusable):

- **Findable:** IGSN, DOI, complete metadata
- **Accessible:** Privacy controls (public/embargo/private)
- **Interoperable:** EarthBank templates, Kohn et al. (2024) standards
- **Reusable:** Provenance (ORCID), QC (batches), granular data

### EarthBank Compatibility

Direct import/export with EarthBank Excel templates:
- Sample.template.v2025-04-16.xlsx
- FTDatapoint.template.v2024-11-11.xlsx
- HeDatapoint.template.v2024-11-11.xlsx

### Kohn et al. (2024) Compliance

Implements FAIR Tables 4-10 from GSA Bulletin consensus paper:
- Table 4: Samples → `samples`
- Table 5: FT Counts → `ft_count_data`
- Table 6: Track Lengths → `ft_track_length_data`
- Table 10: Ages → `ft_datapoints`

---

## 🚀 Getting Started

### 1. Understand the Schema
```bash
# Read the ERDs
readme/database/ERD_SIMPLE.md      # Quick overview
readme/database/DATABASE_ERD.md    # Complete reference
```

### 2. Explore Table Documentation
```bash
# Core tables
readme/database/tables/samples.md
readme/database/tables/ft_datapoints.md
readme/database/tables/he_datapoints.md
```

### 3. Run Sample Queries
```sql
-- Get all samples with ages
SELECT s.sample_id, s.lithology,
       ftd.central_age_ma as ft_age,
       hed.mean_corr_age_ma as he_age
FROM samples s
LEFT JOIN ft_datapoints ftd ON s.sample_id = ftd.sample_id
LEFT JOIN he_datapoints hed ON s.sample_id = hed.sample_id;
```

### 4. Import Data
```bash
# Using EarthBank templates
npx tsx scripts/db/import-earthbank-templates.ts --file path/to/template.xlsx
```

---

## 📖 References

**EarthBank Platform:**
- Nixon, A.L., et al., 2025. FAIR geochemistry framework. *Chemical Geology*, v. 696, 123092.
- Platform: https://earthbank.auscope.org.au/

**Data Reporting Standards:**
- Kohn, B.P., et al., 2024. FT data reporting. *GSA Bulletin*, v. 136, no. 9/10, p. 3891–3920.

**Project Documentation:**
- [.claude/CLAUDE.md](../../.claude/CLAUDE.md) - Project overview
- [PROJECT_INDEX.json](../../PROJECT_INDEX.json) - Architectural snapshot

---

**Schema Version:** 2.0.0 (EarthBank-compatible)
**Last Updated:** 2025-11-18
**Database:** PostgreSQL 14+ / Supabase PostgreSQL
