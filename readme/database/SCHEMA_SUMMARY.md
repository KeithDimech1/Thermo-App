# Database Schema Summary

**Last Updated:** 2025-11-18 01:24:40
**Database:** AusGeochem Thermochronology (Neon PostgreSQL)
**Total Tables:** 19

Auto-generated overview of all database tables.

---

## Tables

| Table Name | Purpose | Columns | Relationships |
|------------|---------|---------|---------------|
| `datasets` | Data packages with publication metadata | 18 | Referenced by data_files, samples |
| `samples` | Geological samples (PRIMARY TABLE) | 15+ | Links to ft_datapoints, he_datapoints |
| `ft_datapoints` | Fission-track analytical sessions | 30+ | References samples, batches; links to ft_count_data, ft_single_grain_ages, ft_track_length_data |
| `he_datapoints` | (U-Th)/He analytical sessions | 25+ | References samples, batches; links to he_whole_grain_data |
| `ft_count_data` | Grain-by-grain FT count data | 20+ | References ft_datapoints |
| `ft_single_grain_ages` | Individual grain FT ages | 10+ | References ft_datapoints |
| `ft_track_length_data` | Track length measurements | 12+ | References ft_datapoints |
| `ft_binned_length_data` | Binned track length histograms | 8+ | References ft_datapoints |
| `he_whole_grain_data` | (U-Th)/He grain chemistry & ages | 30+ | References he_datapoints |
| `batches` | Analytical batches for QC | 9 | Referenced by ft_datapoints, he_datapoints, reference_materials |
| `reference_materials` | QC standards (Durango, FCT) | 10+ | References batches |
| `people` | ORCID-linked researchers | 5 | Referenced by sample_people_roles, datapoint_people_roles |
| `sample_people_roles` | Sample provenance tracking | 4 | References samples, people |
| `datapoint_people_roles` | Datapoint provenance tracking | 5 | References people (ft/he datapoints) |
| `grains` | Individual mineral grains | 8+ | References samples |
| `mounts` | Physical epoxy mounts | 6+ | References samples |
| `data_files` | File tracking for datasets | 10 | References datasets |
| `fair_score_breakdown` | FAIR compliance scoring | 12 | References datasets |
| `ahe_grain_data` | Legacy (U-Th)/He data (v1) | 17 | References samples (old schema) |

---

## Table Details

### Core Infrastructure (7 tables)

#### `datasets`
- **Purpose:** Data packages with privacy controls, embargo dates, and DOI assignment
- **Columns:** 18 fields (id, dataset_name, doi, publication metadata, study details)
- **Foreign Keys:** None (top-level table)
- **Referenced By:** data_files, fair_score_breakdown, samples
- **Documentation:** [tables/datasets.md](tables/datasets.md)

#### `samples`
- **Purpose:** Geological samples - PRIMARY TABLE for thermochronology data
- **Columns:** 15+ fields (sample_id, IGSN, location, lithology, mineral type)
- **Foreign Keys:** dataset_id → datasets
- **Referenced By:** ft_datapoints, he_datapoints, sample_people_roles, grains, mounts
- **Documentation:** [tables/samples.md](tables/samples.md)

#### `people`
- **Purpose:** ORCID-linked researchers (analysts, collectors, operators)
- **Columns:** 5 fields (id, orcid, name, email, affiliation)
- **Foreign Keys:** None
- **Referenced By:** sample_people_roles, datapoint_people_roles
- **Documentation:** [tables/people.md](tables/people.md)

#### `batches`
- **Purpose:** Analytical batches for QC tracking
- **Columns:** 9 fields (batch_name, analysis_date, laboratory, irradiation details)
- **Foreign Keys:** None
- **Referenced By:** ft_datapoints, he_datapoints, reference_materials
- **Documentation:** [tables/batches.md](tables/batches.md)

#### `reference_materials`
- **Purpose:** QC standards (Durango apatite, Fish Canyon zircon)
- **Columns:** 10+ fields (standard name, measured ages, uncertainties)
- **Foreign Keys:** batch_id → batches
- **Referenced By:** None
- **Documentation:** [tables/reference_materials.md](tables/reference_materials.md)

#### `grains`
- **Purpose:** Individual mineral grains
- **Columns:** 8+ fields (grain_id, dimensions, mass, terminations)
- **Foreign Keys:** sample_id → samples
- **Referenced By:** FT and He grain-level data
- **Documentation:** [tables/grains.md](tables/grains.md)

#### `mounts`
- **Purpose:** Physical epoxy mounts containing samples
- **Columns:** 6+ fields (mount_id, preparation_date, lab, notes)
- **Foreign Keys:** sample_id → samples
- **Referenced By:** None
- **Documentation:** [tables/mounts.md](tables/mounts.md)

---

### Fission-Track Tables (5 tables)

#### `ft_datapoints`
- **Purpose:** Fission-track analytical sessions (one per sample analysis)
- **Columns:** 30+ fields (central_age_ma, pooled_age_ma, dispersion, P(χ²), n_grains, zeta, analyst, lab)
- **Foreign Keys:** sample_id → samples, batch_id → batches
- **Referenced By:** ft_count_data, ft_single_grain_ages, ft_track_length_data, ft_binned_length_data
- **Documentation:** [tables/ft_datapoints.md](tables/ft_datapoints.md)

#### `ft_count_data`
- **Purpose:** Grain-by-grain fission-track count data
- **Columns:** 20+ fields (Ns, Ni, Nd, ρs, ρi, ρd, U_ppm, Dpar, grain_id)
- **Foreign Keys:** ft_datapoint_id → ft_datapoints
- **Referenced By:** None
- **Documentation:** [tables/ft_count_data.md](tables/ft_count_data.md)

#### `ft_single_grain_ages`
- **Purpose:** Individual grain fission-track ages
- **Columns:** 10+ fields (grain_id, age_ma, age_error_ma, U_ppm)
- **Foreign Keys:** ft_datapoint_id → ft_datapoints
- **Referenced By:** None
- **Documentation:** [tables/ft_single_grain_ages.md](tables/ft_single_grain_ages.md)

#### `ft_track_length_data`
- **Purpose:** Individual track length measurements
- **Columns:** 12+ fields (track_id, grain_id, track_length_um, angle_to_c_axis_deg, Dpar)
- **Foreign Keys:** ft_datapoint_id → ft_datapoints
- **Referenced By:** None
- **Documentation:** [tables/ft_track_length_data.md](tables/ft_track_length_data.md)

#### `ft_binned_length_data`
- **Purpose:** Binned track length histograms
- **Columns:** 8+ fields (bin_min_um, bin_max_um, count, percentage)
- **Foreign Keys:** ft_datapoint_id → ft_datapoints
- **Referenced By:** None
- **Documentation:** [tables/ft_binned_length_data.md](tables/ft_binned_length_data.md)

---

### (U-Th)/He Tables (2 tables)

#### `he_datapoints`
- **Purpose:** (U-Th)/He analytical sessions (one per sample analysis)
- **Columns:** 25+ fields (mean_corr_age_ma, n_grains, analyst, lab, analysis_date)
- **Foreign Keys:** sample_id → samples, batch_id → batches
- **Referenced By:** he_whole_grain_data
- **Documentation:** [tables/he_datapoints.md](tables/he_datapoints.md)

#### `he_whole_grain_data`
- **Purpose:** Grain-level (U-Th)/He chemistry and corrected ages
- **Columns:** 30+ fields (grain_id, U_ppm, Th_ppm, Sm_ppm, eU_ppm, He_ncc, uncorr_age_ma, corr_age_ma, Ft)
- **Foreign Keys:** he_datapoint_id → he_datapoints
- **Referenced By:** None
- **Documentation:** [tables/he_whole_grain_data.md](tables/he_whole_grain_data.md)

---

### Linking Tables (2 tables)

#### `sample_people_roles`
- **Purpose:** Track sample provenance (who collected, when, where)
- **Columns:** 4 fields (sample_id, person_id, role, created_at)
- **Foreign Keys:** sample_id → samples, person_id → people
- **Referenced By:** None
- **Documentation:** [tables/sample_people_roles.md](tables/sample_people_roles.md)

#### `datapoint_people_roles`
- **Purpose:** Track datapoint provenance (analyst, operator, reviewer)
- **Columns:** 5 fields (datapoint_id, datapoint_type, person_id, role, created_at)
- **Foreign Keys:** person_id → people (datapoint_id links to ft/he_datapoints)
- **Referenced By:** None
- **Documentation:** [tables/datapoint_people_roles.md](tables/datapoint_people_roles.md)

---

### File & Metadata Tables (2 tables)

#### `data_files`
- **Purpose:** Track downloadable files for datasets (RAW, FAIR, PDF, Images)
- **Columns:** 10 fields (dataset_id, file_name, file_path, file_type, size, row_count)
- **Foreign Keys:** dataset_id → datasets
- **Referenced By:** None
- **Documentation:** [tables/data_files.md](tables/data_files.md)

#### `fair_score_breakdown`
- **Purpose:** Track FAIR compliance scores (Findable, Accessible, Interoperable, Reusable)
- **Columns:** 12 fields (dataset_id, table4_score, findable_score, total_score, grade)
- **Foreign Keys:** dataset_id → datasets
- **Referenced By:** None
- **Documentation:** [tables/fair_score_breakdown.md](tables/fair_score_breakdown.md)

---

### Legacy Tables (1 table - v1 schema)

#### `ahe_grain_data`
- **Purpose:** OLD (U-Th)/He grain data (schema v1 - being migrated to v2)
- **Columns:** 17 fields
- **Foreign Keys:** sample_id → samples
- **Referenced By:** None
- **Status:** ⚠️ Legacy - use he_datapoints + he_whole_grain_data for new data
- **Documentation:** [tables/ahe_grain_data.md](tables/ahe_grain_data.md)

---

## Database Architecture

### Critical Concept: Datapoints

**1 sample → many datapoints → many grains**

A **datapoint** = one analytical session (specific lab, date, method, analyst). Same sample can be analyzed multiple times.

**Why this matters:**
- Enables independent age recalculation
- Supports thermal history remodeling
- Allows QC assessment across batches
- Facilitates large-scale meta-analysis

### Schema Compliance

**EarthBank FAIR Integration:**
- Schema v2 implements Nixon et al. (2025) EarthBank standards
- Direct import/export with EarthBank Excel templates
- FAIR-compliant metadata (Findable, Accessible, Interoperable, Reusable)

**Kohn et al. (2024) Reporting Standards:**
- Implements FAIR Tables 4-10 from GSA Bulletin consensus paper
- Table 4: Samples → `samples`
- Table 5: FT Counts → `ft_count_data`
- Table 6: Track Lengths → `ft_track_length_data`
- Table 10: Ages → `ft_datapoints`

---

**For detailed table documentation, see `/readme/database/tables/`**
**For schema changes history, see [SCHEMA_CHANGES.md](SCHEMA_CHANGES.md)**
**For code usage map, see [CODE_USAGE.md](CODE_USAGE.md)**

**Generated by:** `/bigtidy` living documentation system
**Next update:** Run `/bigtidy` to refresh schema snapshot and documentation
