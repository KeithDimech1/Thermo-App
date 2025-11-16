# Database Schema Changes

Auto-generated changelog of schema modifications detected by `/bigtidy` autodoc system.

---

## 2025-11-11 (Initial Schema Documentation)

### ✅ Initial Schema Baseline Created

This is the **first schema snapshot** for the QC-Results project.

**Schema Details:**
- **PostgreSQL Version:** 17.5
- **Database:** Neon (neondb)
- **Total Tables:** 8
- **Total Views:** 2

**Tables Documented:**
1. ✅ `categories` - Disease categories (10-15 rows)
2. ✅ `pathogens` - Infectious agents (20-30 rows)
3. ✅ `markers` - Test biomarkers (40-60 rows)
4. ✅ `manufacturers` - Test manufacturers (15-25 rows)
5. ✅ `assays` - Diagnostic test platforms (50-80 rows)
6. ✅ `qc_samples` - Quality control materials (10-20 rows)
7. ✅ `test_configurations` - Test combinations (200-500 rows) ⭐ CORE TABLE
8. ✅ `cv_measurements` - Performance metrics (200-500 rows)

**Views Documented:**
1. ✅ `vw_manufacturer_performance` - Aggregated manufacturer stats
2. ✅ `vw_test_config_details` - Denormalized config details

**Key Features:**
- Fully normalized schema (3NF)
- Foreign key constraints enforced
- Check constraints for data validation
- Unique constraints prevent duplicates
- Timestamp audit trails
- pg_trgm extension for text search

**No changes detected** - This is the baseline.

---

## 2025-11-12 18:03 (Schema Verification)

### ✅ No Schema Changes Detected

**Schema Status:** STABLE ✓
**Comparison:**
- Previous snapshot: 2025-11-11
- Current snapshot: 2025-11-12
- Result: **Identical** - no modifications

**Tables Verified:**
- ✅ categories - No changes
- ✅ pathogens - No changes
- ✅ markers - No changes
- ✅ manufacturers - No changes
- ✅ assays - No changes
- ✅ qc_samples - No changes
- ✅ test_configurations - No changes
- ✅ cv_measurements - No changes

**Code Impact:** None - No code updates required

---

---

## 🚨 2025-11-16 (MAJOR SCHEMA MIGRATION)

### ❌ Complete Database Replacement Detected

**THIS IS A CRITICAL BREAKING CHANGE** - The database has been **completely replaced** with a different schema.

**Previous Schema:** QC Results Database (Diagnostic Assays)
- ❌ Dropped: categories, pathogens, markers, manufacturers
- ❌ Dropped: assays, qc_samples
- ❌ Dropped: test_configurations, cv_measurements
- ❌ Dropped: vw_manufacturer_performance, vw_test_config_details
- **Purpose:** Quality control performance tracking for diagnostic tests

**Current Schema:** Thermochronology Database (Geological Dating)
- ✅ Created: `datasets` - Data packages with privacy/DOI
- ✅ Created: `samples` - Geological samples with IGSN, location, lithology
- ✅ Created: `ft_ages` - Fission-Track age determinations
- ✅ Created: `ft_counts` - Fission-Track grain count data
- ✅ Created: `ft_track_lengths` - Fission-Track confined length measurements
- ✅ Created: `ahe_grain_data` - (U-Th)/He grain data
- ✅ Created: `vw_aft_complete` - AFT complete data view
- ✅ Created: `vw_sample_summary` - Sample summary view
- **Purpose:** Thermochronology data for AusGeochem platform

**Schema Design Reference:**
- ERD: `build-data/assets/schemas/AusGeochem_ERD.md`
- Based on FAIR data principles (Findable, Accessible, Interoperable, Reusable)
- Supports multiple dating methods: Fission-Track, (U-Th)/He, U-Pb
- Includes quality control via dosimeter/reference material tracking

**Current Table Structure:**

**1. datasets (Data Packages)**
- Purpose: Privacy control, embargo dates, DOI assignment
- Foreign Keys: None (top of hierarchy)

**2. samples (Geological Samples)**
- Purpose: Core sample metadata with IGSN, location, lithology
- Foreign Keys: dataset_id → datasets
- Key Fields: igsn (global ID), latitude/longitude, mineral_type
- Grain Counts: n_aft_grains, n_ahe_grains

**3. ft_ages (Fission-Track Ages)**
- Purpose: Calculated AFT ages (pooled, central, mixed model)
- Foreign Keys: sample_id → samples
- Key Fields: pooled_age_ma, central_age_ma, dispersion_pct, p_chi2
- 1:1 relationship with samples

**4. ft_counts (Fission-Track Counts)**
- Purpose: Grain-by-grain spontaneous/induced track counts
- Foreign Keys: sample_id → samples
- Key Fields: Ns, Ni, Nd (track counts), rho_s, rho_i, rho_d (densities)

**5. ft_track_lengths (Confined Track Lengths)**
- Purpose: Individual track length measurements
- Foreign Keys: sample_id → samples
- Key Fields: length_um, angle_degrees, c_axis_angle

**6. ahe_grain_data ((U-Th)/He Grain Data)**
- Purpose: Single grain (U-Th)/He age determinations
- Foreign Keys: sample_id → samples
- Key Fields: corrected_age_ma, U_ppm, Th_ppm, He4_nmol_g, Ft_correction

**Views:**
- `vw_aft_complete` - Joins samples + ft_ages + ft_counts + ft_track_lengths
- `vw_sample_summary` - Aggregates sample-level statistics

**⚠️ DOCUMENTATION IMPACT:**

The following files are **COMPLETELY OUTDATED** and describe the OLD schema:
- ❌ `readme/database/tables/categories.md`
- ❌ `readme/database/tables/pathogens.md`
- ❌ `readme/database/tables/markers.md`
- ❌ `readme/database/tables/manufacturers.md`
- ❌ `readme/database/tables/assays.md`
- ❌ `readme/database/tables/qc_samples.md`
- ❌ `readme/database/tables/test_configurations.md`
- ❌ `readme/database/tables/cv_measurements.md`
- ❌ `readme/database/SCHEMA_SUMMARY.md` (describes QC schema)
- ❌ `readme/database/CODE_USAGE.md` (references QC tables)
- ⚠️ `.claude/CLAUDE.md` (describes "EDCNet - QC Results Database")

**🔧 ACTION REQUIRED:**

1. ✅ Schema snapshot updated (2025-11-16)
2. ⚠️ Need to regenerate table documentation for thermochronology schema
3. ⚠️ Need to update SCHEMA_SUMMARY.md
4. ⚠️ Need to analyze code for references to old QC tables
5. ⚠️ Need to update CLAUDE.md project description
6. ⚠️ Need to regenerate CODE_USAGE.md with actual table usage

**Migration Notes:**
- This is a complete database replacement, not a schema evolution
- No data migration path exists (different domains entirely)
- Old documentation preserved in git history
- New schema follows AusGeochem ERD specification

---

## Future Updates

Schema changes will be automatically detected on subsequent `/bigtidy` runs by comparing:
- `.schema-snapshot.sql` (current) vs `.schema-previous.sql` (previous run)

**Changes tracked:**
- ✅ New tables
- ✅ Dropped tables
- ✅ New columns
- ✅ Dropped columns
- ✅ Column type changes
- ✅ Foreign key modifications
- ⚠️ Impacted code files

---

**Last Updated:** 2025-11-16
**Next Check:** Run `/bigtidy` to detect schema changes
