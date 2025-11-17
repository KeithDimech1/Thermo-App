# Database Schema Changes

**Auto-Generated:** This file tracks all schema changes detected by comparing snapshots.

---

## 2025-11-17 23:30 (MAJOR SCHEMA EXPANSION - v1 to v2)

### Schema Evolution: FAIR/EarthBank Architecture

**Type:** Major expansion - Schema v1 → Schema v2
**Impact:** 14 new tables added (6 → 20 tables total)
**Purpose:** Full EarthBank FAIR compliance (Nixon et al. 2025, Kohn et al. 2024)

### New Tables Added (14)

#### Core Infrastructure
- **batches** - Analytical batches linking unknowns to reference materials
- **reference_materials** - QC standards (Durango, Fish Canyon, etc.)
- **mounts** - Physical epoxy mounts containing grains
- **grains** - Individual grains within mounts (enables cross-method linking)
- **people** - Individuals involved in sample collection, analysis, or research
- **datapoint_people_roles** - Links datapoints to people with roles
- **sample_people_roles** - Links samples to people with roles

#### Fission-Track (EarthBank Schema)
- **ft_datapoints** - FT analytical sessions (EarthBank FT Datapoints sheet)
- **ft_count_data** - Grain-by-grain count data (EarthBank FTCountData sheet)
- **ft_single_grain_ages** - Single grain ages (EarthBank FTSingleGrain sheet)
- **ft_track_length_data** - Individual track measurements (EarthBank FTLengthData sheet)
- **ft_binned_length_data** - Binned length histograms (legacy format support)

#### (U-Th)/He (EarthBank Schema)
- **he_datapoints** - (U-Th)/He analytical sessions (EarthBank He Datapoints sheet)
- **he_whole_grain_data** - Grain-level (U-Th)/He results (EarthBank HeWholeGrain sheet)

### Existing Tables (3) - ENHANCED WITH FAIR METADATA

Core tables enhanced for EarthBank compatibility:

- **datasets** - Enhanced with privacy controls, DOI support, provenance fields
- **samples** - Expanded with FAIR metadata (collection dates, ORCID support)
- **ahe_grain_data** - Legacy (U-Th)/He grain data (being replaced by he_whole_grain_data)

### New Extensions
- **uuid-ossp** - UUID generation support

### New Functions
- **update_dataset_modified_date()** - Auto-update dataset modification timestamps

### Key Architectural Changes

**CRITICAL CONCEPT: DATAPOINT ARCHITECTURE**
- **Schema v2:** 1 sample → many datapoints (multiple analytical sessions)
- **Fully FAIR compliant:** Implements Nixon et al. (2025) EarthBank architecture
- **Kohn et al. (2024) compatible:** Supports full metadata reporting standards

**Why this matters:**
- Same sample can be analyzed multiple times (different labs, methods, dates)
- Each analytical session is a "datapoint" with full QC metadata
- Enables batch-level QC tracking with reference materials
- Supports ORCID-based provenance tracking
- Allows comparison of results across analytical sessions
- Direct import from EarthBank Excel templates
- Granular data storage (individual tracks, single grain ages)

### Schema Snapshot Comparison

**Previous schema (.schema-previous.sql):**
- 6 tables
- 1 extension (pg_trgm)
- 1 function (update_updated_at_column)

**Current schema (.schema-snapshot.sql):**
- 20 tables
- 2 extensions (pg_trgm, uuid-ossp)
- 2 functions (update_updated_at_column, update_dataset_modified_date)
- 2 views (vw_aft_complete, vw_sample_summary)

### Migration Notes

**Schema v2 - Clean Slate:**
- Old schema tables (ft_ages, ft_counts, ft_track_lengths) removed completely
- New datapoint-based architecture implemented
- All code updated to use schema v2 queries

**Application Architecture:**
- All queries use datapoint-aware functions
- `getSampleDetail()` returns arrays of datapoints (not single records)
- `getFTDatapointsBySample()` returns all FT analytical sessions
- `getHeDatapointsBySample()` returns all (U-Th)/He sessions

**API Structure:**
- `/api/samples/[id]` returns `SampleDetailResponse` (with datapoint arrays)
- `/api/tables/[name]` supports all 17 new schema v2 tables
- Statistics endpoints count datapoints (multiple per sample)

---

## 2025-11-12 18:03 (Schema Verification)

### No Schema Changes Detected

Verification run - no structural changes since 2025-11-11 baseline.

---

## 2025-11-11 (Initial Schema Documentation)

### Initial Schema Baseline Created

First schema snapshot captured. Contains 6 core tables for thermochronology data.

**Tables documented:**
- datasets
- samples
- ft_ages
- ft_counts
- ft_track_lengths
- ahe_grain_data

**Schema file:** `.schema-previous.sql`
