# ⚠️ Table Documentation - OUTDATED

**Last Updated:** 2025-11-21

---

## CRITICAL NOTICE

**These table documentation files are OUTDATED and refer to the OLD database schema (26 tables).**

**Current Status:**
- **Database:** Supabase PostgreSQL (59 tables)
- **Migration:** Completed 2025-11-21 (Neon → Supabase, ERROR-021)
- **Schema Version:** Post-migration v2.1

**What Changed:**
- Database platform: Neon → Supabase
- Table count: 26 → 59 tables (+33 new tables)
- Schema now contains TWO data models:
  1. **Thermochronology** (18 tables) - Original purpose
  2. **Business/Materials** (41 tables) - Construction/materials management

---

## Table Documentation Status

### Outdated Files (24 files)

All `.md` files in this directory document the OLD database schema:

**Thermochronology Tables (Old Schema):**
- `samples.md` - ⚠️ Outdated
- `datasets.md` - ⚠️ Outdated
- `ft_datapoints.md` - ⚠️ Outdated
- `ft_count_data.md` - ⚠️ Outdated
- `ft_track_length_data.md` - ⚠️ Outdated
- `he_datapoints.md` - ⚠️ Outdated
- `he_whole_grain_data.md` - ⚠️ Outdated
- `batches.md` - ⚠️ Outdated
- `people.md` - ⚠️ Outdated
- `reference_materials.md` - ⚠️ Outdated
- (and 14 more files...)

**Dropped Tables (No longer in Supabase):**
- EarthBank camelCase tables (`earthbank_*`) - Removed
- `extraction_sessions` - Removed
- `dataset_people_roles` - Removed

### Missing Documentation (41 new tables)

**Business/Materials tables added in Supabase migration have NO documentation yet:**

- `materials`, `companies`, `deliveries`, `projects`
- `material_types`, `material_subtypes`, `material_forms`
- `emission_source`, `cv_measurements`, `epd_documents`
- `assays`, `manufacturers`, `depots`, `transport_modes`
- (and 27 more tables...)

---

## Current Schema Information

**For current schema information, see:**
- **`readme/database/SCHEMA_SUMMARY.md`** - Overview of all 59 tables
- **`readme/database/SCHEMA_CHANGES.md`** - Migration details
- **`readme/database/.schema-snapshot.sql`** - Current Supabase schema (bones)

---

## Next Steps

**To refresh this documentation:**

1. **Archive old docs:**
   ```bash
   mkdir -p build-data/documentation/database-old-schema/
   mv readme/database/tables/*.md build-data/documentation/database-old-schema/
   ```

2. **Generate new docs for 59 Supabase tables:**
   - Run `/bigtidy` with full Phase 3 code analysis
   - Or manually create docs for each table
   - Use `SCHEMA_SUMMARY.md` as template

3. **Update ERD diagrams:**
   - Regenerate `readme/database/erd/*.{png,svg,mmd}`
   - Update for 59-table schema

---

**Migration Date:** 2025-11-21
**Migration Tracking:** ERROR-021
**Documentation Status:** ⚠️ REFRESH PENDING
