# Database Schema Summary

**Last Updated:** 2025-11-21 (Post-Supabase Migration)
**Database:** AusGeochem Thermochronology (Supabase PostgreSQL)
**Total Tables:** 59
**Region:** AWS Singapore (ap-southeast-1)

Auto-generated overview of all database tables.

---

## ⚠️ SCHEMA MIGRATION NOTICE

**This database has been migrated from Neon to Supabase (ERROR-021).**

The schema now contains **TWO distinct data models**:

1. **Thermochronology Data Model** (original purpose - 18 tables)
   - Fission-track and (U-Th)/He geochronology data
   - EarthBank FAIR-compliant structure

2. **Business/Materials Model** (new - 41 tables)
   - Construction materials, deliveries, projects
   - Carbon tracking, supplier management
   - Appears to be a separate application domain

**Note:** Individual table documentation in `readme/database/tables/` refers to the OLD Neon schema (26 tables) and is now outdated. Documentation refresh pending.

---

## Tables Overview (59 total)

### Thermochronology Tables (18 tables) 🔬

**Core Data:**
- `samples` - Geological samples with IGSN, location, lithology
- `datasets` - Published papers and data sources
- `people` - Researchers, analysts, operators (ORCID tracked)
- `batches` - Analytical batches with QC standards
- `reference_materials` - Age/composition standards (Durango, Fish Canyon)
- `mounts` - Physical sample mounts
- `grains` - Individual mineral grains

**Fission-Track (FT) Data:**
- `ft_datapoints` - FT analytical sessions
- `ft_count_data` - Spontaneous/induced track counts
- `ft_single_grain_ages` - Individual grain ages
- `ft_track_length_data` - Track length measurements (full distribution)
- `ft_binned_length_data` - Binned track length distributions

**(U-Th)/He Data:**
- `ahe_grain_data` - Legacy He grain data (old schema)
- `he_datapoints` - He analytical sessions
- `he_whole_grain_data` - He grain chemistry and ages

**Junction Tables:**
- `sample_people_roles` - Sample → People relationships
- `datapoint_people_roles` - Datapoint → People relationships

**Metadata:**
- `data_files` - Associated data files
- `dataset_files` - Dataset supplementary files

---

### Business/Materials Tables (41 tables) 🏗️

**Materials & Products:**
- `materials` - Construction materials master table
- `material_types` - Material type taxonomy
- `material_subtypes` - Subtype classifications
- `material_forms` - Physical forms (bags, bulk, etc.)
- `material_attributes` - Custom material attributes
- `material_attribute_values` - Attribute values
- `material_variant_configs` - Material variants
- `material_variant_attributes` - Variant-specific attributes
- `alias_material` - Material name aliases
- `alias_mappings` - General alias system
- `units` - Units of measure
- `categories` - Material categories

**Supply Chain:**
- `companies` - Suppliers, manufacturers, contractors
- `manufacturers` - Product manufacturers
- `depots` - Supply depots/locations
- `depot_distances` - Depot distance matrix
- `transport_modes` - Transport methods
- `deliveries` - Actual deliveries
- `raw_deliveries` - Raw delivery data
- `upload_templates` - Data upload templates

**Projects:**
- `projects` - Construction projects
- `project_statuses` - Project status tracking
- `project_access` - User access control
- `project_address` - Project addresses
- `project_cost_codes` - Cost code tracking
- `sites` - Project sites
- `postcodes` - Postcode geodata

**Environmental/Carbon:**
- `emission_source` - Emissions sources
- `epd_documents` - Environmental Product Declarations
- `cv_measurements` - Carbon value measurements
- `markers` - Data quality markers

**Testing/QC:**
- `assays` - Laboratory assays
- `assay_lots` - Assay lot tracking
- `test_configurations` - Test configurations
- `qc_samples` - Quality control samples
- `pathogens` - Pathogen data

**Metadata:**
- `fair_score_breakdown` - FAIR data scoring
- `design_packages` - Design package metadata

**Legacy/Backup:**
- `location_types_backup` - Backup table
- `locations_backup` - Backup table

---

## Key Relationships

### Thermochronology Model

```
datasets (papers)
    ↓
samples (IGSN)
    ↓
ft_datapoints / he_datapoints (analytical sessions)
    ↓
grains / ft_count_data / ft_track_length_data / he_whole_grain_data
```

**Cross-cutting:**
- `batches` → `reference_materials` (QC standards)
- `people` → `samples`, `datapoints` (via junction tables)

### Business/Materials Model

```
projects
    ↓
deliveries
    ↓
materials → companies (suppliers)
    ↓
emission_source → cv_measurements (carbon tracking)
```

---

## Database Statistics

**Estimated Row Counts** (as of migration):
- `samples`: ~75 rows
- `ft_datapoints`: ~67 rows
- `ft_track_length_data`: ~975 rows
- `he_whole_grain_data`: ~113 rows
- Business tables: Unknown (new migration)

**Schema Version:** v2.1 (EarthBank-inspired camelCase for thermochronology tables)

---

## Documentation Structure

```
/readme/database/
├── .schema-snapshot.sql        ← Current Supabase schema (59 tables)
├── .schema-previous.sql        ← Previous Neon schema (26 tables)
├── SCHEMA_SUMMARY.md          ← This file
├── SCHEMA_CHANGES.md          ← Change log
├── CODE_USAGE.md              ← Code → Database cross-references
├── /tables/                    ← ⚠️ OUTDATED - refers to old Neon schema
│   ├── samples.md
│   ├── ft_datapoints.md
│   └── ... (24 files, all need refresh)
└── /erd/                       ← ⚠️ OUTDATED - old ERD diagrams
    ├── database-erd-mermaid.png
    └── ... (9 files, all need refresh)
```

---

## Next Steps

**Documentation Refresh Needed:**
1. Archive old `tables/*.md` files (Neon schema era)
2. Generate new table docs for all 59 Supabase tables
3. Regenerate ERD diagrams
4. Clarify project purpose (thermochronology vs materials management?)
5. Update CODE_USAGE.md with new schema cross-references

---

**For detailed connection information, see:** `.claude/CLAUDE.md` → Database Connection section
**For schema bones, see:** `.schema-snapshot.sql` (59 tables, Supabase PostgreSQL)
