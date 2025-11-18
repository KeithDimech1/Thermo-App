# AusGeochem Thermochronology Database - Entity Relationship Diagram

**Schema Version:** 2.0.0 (EarthBank-Compatible)
**Created:** 2025-11-18
**Standard:** Nixon et al. (2025), Kohn et al. (2024)

---

## Database Architecture Overview

**Core Concept:** 1 sample → many datapoints (analytical sessions)

**16 Tables:**
- **Core Infrastructure:** datasets, samples, people, batches, reference_materials, mounts, grains (7)
- **Fission-Track:** ft_datapoints, ft_count_data, ft_single_grain_ages, ft_track_length_data, ft_binned_length_data (5)
- **(U-Th)/He:** he_datapoints, he_whole_grain_data (2)
- **Linking:** sample_people_roles, datapoint_people_roles (2)

---

## Complete Entity Relationship Diagram

```mermaid
erDiagram
    %% ============================================================================
    %% CORE INFRASTRUCTURE
    %% ============================================================================

    datasets ||--o{ samples : "contains"
    datasets {
        int id PK
        varchar dataset_name
        text description
        varchar publication_doi
        varchar study_area
        varchar privacy_status "public|embargo|private"
        date embargo_date
        varchar data_package_doi
        varchar license
        date submission_date
    }

    people {
        int id PK
        varchar orcid UK "0000-0002-..."
        varchar name
        varchar email
        varchar affiliation
    }

    samples ||--o{ sample_people_roles : "has"
    people ||--o{ sample_people_roles : "involved_in"
    sample_people_roles {
        int id PK
        varchar sample_id FK
        int person_id FK
        varchar role "collector|investigator|analyst"
    }

    samples {
        varchar sample_id PK
        int dataset_id FK
        varchar igsn UK "Global ID"
        varchar sample_kind
        decimal latitude
        decimal longitude
        varchar geodetic_datum
        decimal elevation_m
        varchar vertical_datum
        varchar lithology
        varchar mineral_type
        varchar stratigraphic_unit
        decimal sample_age_ma
        date collection_date_exact
        int n_aft_grains
        int n_ahe_grains
    }

    batches {
        int id PK
        varchar batch_name UK
        date analysis_date
        varchar laboratory
        varchar irradiation_id
        varchar irradiation_reactor
        decimal thermal_neutron_dose
    }

    batches ||--o{ reference_materials : "contains"
    reference_materials {
        int id PK
        int batch_id FK
        varchar material_name "Durango|FCT|etc"
        varchar material_type "primary|secondary"
        decimal expected_age_ma
        decimal measured_age_ma
        decimal measured_age_error_ma
    }

    samples ||--o{ mounts : "has"
    mounts {
        int id PK
        varchar mount_id UK
        varchar mount_name
        varchar sample_id FK
        varchar etchant_chemical
        int etch_duration_seconds
        decimal etch_temperature_c
    }

    mounts ||--o{ grains : "contains"
    grains {
        int id PK
        varchar grain_id UK
        varchar mount_id FK
        varchar grain_identifier
        varchar grain_morphology
        varchar grain_quality
    }

    %% ============================================================================
    %% FISSION-TRACK DATAPOINTS (1 sample → many datapoints)
    %% ============================================================================

    samples ||--o{ ft_datapoints : "analyzed_by"
    batches ||--o{ ft_datapoints : "includes"
    ft_datapoints {
        int id PK
        varchar sample_id FK
        varchar datapoint_key UK "User-provided ID"
        int batch_id FK
        varchar laboratory
        varchar analyst_orcid
        timestamp analysis_date
        varchar ft_method "EDM|LA-ICP-MS|Population"
        varchar mineral_type
        int n_grains
        decimal mean_rho_s
        int total_Ns
        decimal mean_U_ppm
        decimal mean_Dpar_um
        decimal chi_square
        decimal P_chi2_pct
        decimal dispersion_pct
        decimal central_age_ma "★ Primary Age"
        decimal central_age_error_ma
        decimal pooled_age_ma
        decimal mean_track_length_um
        decimal zeta_yr_cm2 "EDM calibration"
    }

    ft_datapoints ||--o{ ft_count_data : "has"
    ft_count_data {
        int id PK
        int ft_datapoint_id FK
        varchar grain_id
        decimal counting_area_cm2
        int Ns "Spontaneous tracks"
        decimal rho_s_cm2
        int Ni "Induced tracks"
        decimal rho_i_cm2
        int Nd "Dosimeter tracks"
        decimal rho_d_cm2
        decimal Dpar_um "Kinetic parameter"
        text comments
    }

    ft_datapoints ||--o{ ft_single_grain_ages : "has"
    ft_single_grain_ages {
        int id PK
        int ft_datapoint_id FK
        varchar grain_id
        varchar mount_id
        decimal U_ppm
        decimal U_Ca_ratio
        decimal rmr0 "Annealing kinetics"
        decimal kappa
        decimal grain_age_ma
        decimal grain_age_error_ma
    }

    ft_datapoints ||--o{ ft_track_length_data : "has"
    ft_track_length_data {
        int id PK
        int ft_datapoint_id FK
        varchar grain_id
        varchar track_id
        varchar track_type "TINT|TINCLE|semi-track"
        decimal apparent_length_um
        decimal true_length_um "3D corrected"
        decimal angle_to_c_axis_deg
        decimal c_axis_corrected_length_um
        decimal Dpar_um
        decimal rmr0
    }

    ft_datapoints ||--o{ ft_binned_length_data : "has"
    ft_binned_length_data {
        int id PK
        int ft_datapoint_id FK
        varchar mount_id
        int bin_0_1_um
        int bin_1_2_um
        int bin_2_3_um
        text "... 20 bins total"
        int bin_19_20_um
        decimal Dpar_um
    }

    %% ============================================================================
    %% (U-Th)/He DATAPOINTS (1 sample → many datapoints)
    %% ============================================================================

    samples ||--o{ he_datapoints : "analyzed_by"
    batches ||--o{ he_datapoints : "includes"
    he_datapoints {
        int id PK
        varchar sample_id FK
        varchar datapoint_key UK
        int batch_id FK
        varchar laboratory
        varchar analyst_orcid
        timestamp analysis_date
        varchar mineral_type
        int n_aliquots
        decimal mean_uncorr_age_ma
        decimal weighted_mean_uncorr_age_ma
        decimal mswd_uncorr
        decimal mean_corr_age_ma "★ Primary Age"
        decimal mean_corr_age_error_ma
        decimal weighted_mean_corr_age_ma
        decimal mswd_corr
        varchar ft_correction_equation
        varchar eU_equation
    }

    he_datapoints ||--o{ he_whole_grain_data : "has"
    he_whole_grain_data {
        int id PK
        int he_datapoint_id FK
        varchar lab_no UK
        varchar grain_identifier
        varchar aliquot_type "single|multi|unknown"
        int n_grains_in_aliquot
        varchar crystal_integrity "whole|fragment|abraded"
        decimal length_um "Grain dimensions"
        decimal half_width_um
        decimal height_um
        decimal He_ncc "Helium amount"
        decimal U_ppm "Chemistry"
        decimal Th_ppm
        decimal Sm_ppm
        decimal eU_ppm "Effective U"
        decimal mass_mg
        decimal surface_area_mm2
        decimal volume_mm3
        decimal Rs_um "Sphere radius"
        decimal uncorr_age_ma
        decimal corr_age_ma "★ Ft-corrected age"
        decimal FT "Alpha ejection factor"
        varchar terminations "0T|1T|2T"
    }

    %% ============================================================================
    %% DATAPOINT-PEOPLE LINKING
    %% ============================================================================

    ft_datapoints ||--o{ datapoint_people_roles : "has"
    he_datapoints ||--o{ datapoint_people_roles : "has"
    people ||--o{ datapoint_people_roles : "involved_in"
    datapoint_people_roles {
        int id PK
        int datapoint_id FK "ft or he"
        varchar datapoint_type "ft|he|upb|trace"
        int person_id FK
        varchar role "analyst|technician|operator"
    }
```

---

## Key Relationships

### 1. Sample Hierarchy (Core Data Flow)

```
datasets (1)
  └── samples (*)
      ├── ft_datapoints (*) ← Multiple FT analyses per sample
      │   ├── ft_count_data (*) ← Grain-by-grain counts
      │   ├── ft_single_grain_ages (*) ← Individual grain ages
      │   ├── ft_track_length_data (*) ← Track measurements
      │   └── ft_binned_length_data (*) ← Binned histograms
      │
      └── he_datapoints (*) ← Multiple (U-Th)/He analyses per sample
          └── he_whole_grain_data (*) ← Grain-level chemistry & ages
```

### 2. Quality Control Chain

```
batches (analytical session)
  ├── ft_datapoints (*) ← Unknowns
  ├── he_datapoints (*) ← Unknowns
  └── reference_materials (*) ← Standards (Durango, FCT, etc.)
```

### 3. Provenance Tracking

```
people (ORCID-linked researchers)
  ├── sample_people_roles (*) → samples
  │   └── Roles: collector, chief_investigator, investigator
  │
  └── datapoint_people_roles (*) → ft/he_datapoints
      └── Roles: analyst, lab_technician, operator
```

### 4. Physical Sample Tracking

```
samples (geological sample)
  └── mounts (*) ← Epoxy mounts
      └── grains (*) ← Individual mineral grains
          ├── Cross-method linking (FT + He + U-Pb)
          └── Referenced in ft_count_data, ft_track_length_data, he_whole_grain_data
```

---

## Table Categories & Cardinality

### Core Infrastructure (7 tables)

| Table | Primary Key | Foreign Keys | Cardinality |
|-------|-------------|--------------|-------------|
| **datasets** | id | - | 1 dataset : many samples |
| **people** | id | - | 1 person : many roles |
| **samples** | sample_id | dataset_id | 1 sample : many datapoints |
| **sample_people_roles** | id | sample_id, person_id | Many-to-many link |
| **batches** | id | - | 1 batch : many datapoints & ref materials |
| **reference_materials** | id | batch_id | Many standards per batch |
| **mounts** | id | sample_id | 1 sample : many mounts |
| **grains** | id | mount_id | 1 mount : many grains |

### Fission-Track Tables (5 tables)

| Table | Primary Key | Foreign Keys | Cardinality |
|-------|-------------|--------------|-------------|
| **ft_datapoints** | id | sample_id, batch_id | 1 sample : many datapoints |
| **ft_count_data** | id | ft_datapoint_id | 1 datapoint : many grains |
| **ft_single_grain_ages** | id | ft_datapoint_id | 1 datapoint : many grain ages |
| **ft_track_length_data** | id | ft_datapoint_id | 1 datapoint : many tracks |
| **ft_binned_length_data** | id | ft_datapoint_id | 1 datapoint : 1 histogram |

### (U-Th)/He Tables (2 tables)

| Table | Primary Key | Foreign Keys | Cardinality |
|-------|-------------|--------------|-------------|
| **he_datapoints** | id | sample_id, batch_id | 1 sample : many datapoints |
| **he_whole_grain_data** | id | he_datapoint_id | 1 datapoint : many grains |

### Linking Tables (2 tables)

| Table | Primary Key | Foreign Keys | Cardinality |
|-------|-------------|--------------|-------------|
| **sample_people_roles** | id | sample_id, person_id | Many-to-many |
| **datapoint_people_roles** | id | datapoint_id, person_id | Many-to-many (polymorphic) |

---

## Critical Schema Features

### 1. Datapoint Architecture (v2 vs v1)

**Old Schema (v1):**
- 1 sample → 1 FT age
- 1 sample → 1 (U-Th)/He age
- No re-analysis capability

**New Schema (v2):**
- 1 sample → **many FT datapoints** (different labs, methods, dates)
- 1 sample → **many (U-Th)/He datapoints**
- Full analytical session metadata

### 2. FAIR Principles Implementation

| Principle | Implementation |
|-----------|----------------|
| **Findable** | IGSN (global ID), DOI assignment, complete metadata |
| **Accessible** | Privacy controls (public/embargo/private), API access |
| **Interoperable** | EarthBank templates, Kohn et al. (2024) standards |
| **Reusable** | Provenance (ORCID), QC (batches), granular data storage |

### 3. EarthBank Template Mapping

| EarthBank Template | Database Tables |
|--------------------|-----------------|
| **Sample.template** | samples (30 cols) |
| **FT Datapoints** | ft_datapoints (70+ cols) |
| **FTCountData** | ft_count_data |
| **FTSingleGrain** | ft_single_grain_ages |
| **FTLengthData** | ft_track_length_data |
| **FTBinnedLengthData** | ft_binned_length_data |
| **He Datapoints** | he_datapoints (46+ cols) |
| **HeWholeGrain** | he_whole_grain_data (75+ cols) |

### 4. Kohn et al. (2024) Compliance

| FAIR Table | Database Implementation |
|------------|------------------------|
| **Table 4 (Samples)** | samples table |
| **Table 5 (FT Counts)** | ft_count_data |
| **Table 6 (Track Lengths)** | ft_track_length_data |
| **Table 7 (LA-ICP-MS)** | Columns in ft_count_data |
| **Table 9 (Kinetics)** | Columns in ft_datapoints, ft_track_length_data |
| **Table 10 (Ages)** | ft_datapoints, ft_single_grain_ages |

---

## Unique Constraints & Indexes

### Primary Keys
- All tables have `id SERIAL PRIMARY KEY` except:
  - `samples.sample_id VARCHAR(50) PRIMARY KEY`

### Unique Constraints
- `people.orcid` - ORCID must be unique
- `samples.igsn` - International Geo Sample Number
- `batches.batch_name`
- `mounts.mount_id`
- `grains.grain_id`
- `ft_datapoints.datapoint_key` - User-provided unique ID
- `he_datapoints.datapoint_key`
- `he_whole_grain_data.lab_no`
- `sample_people_roles(sample_id, person_id, role)` - Composite unique
- `ft_count_data(ft_datapoint_id, grain_id)` - Composite unique
- `ft_single_grain_ages(ft_datapoint_id, grain_id)` - Composite unique
- `ft_track_length_data(ft_datapoint_id, grain_id, track_id)` - Composite unique

### Key Indexes
- **Location:** `samples(latitude, longitude)` - Geographic queries
- **Age:** `ft_datapoints(central_age_ma)`, `he_whole_grain_data(corr_age_ma)` - Age filtering
- **Mineral:** `samples(mineral_type)` - Material filtering
- **Privacy:** `datasets(privacy_status)` - Access control
- **Provenance:** `people(orcid)`, `people(name)` - Researcher lookup

---

## Views (Backward Compatibility)

### vw_sample_summary
**Purpose:** One-row-per-sample summary (v1 compatibility)
**Logic:** Selects first/latest datapoint per sample

```sql
SELECT
  sample_id,
  (first ft_datapoint).central_age_ma,
  (avg of all he grains).corr_age_ma
FROM samples
```

### vw_aft_complete
**Purpose:** Complete AFT data (first datapoint)
**Logic:** Joins samples → first ft_datapoint

---

## Data Types & Precision

| Column Type | Precision | Example Values |
|-------------|-----------|----------------|
| **Ages** | DECIMAL(10, 2) | 234.56 Ma |
| **Errors** | DECIMAL(10, 2) | 12.34 Ma |
| **Track Densities** | DECIMAL(12, 2) | 1234567.89 tracks/cm² |
| **Lengths** | DECIMAL(6, 3) | 14.567 µm |
| **Coordinates** | DECIMAL(10, 7) | -34.1234567 |
| **U Concentrations** | DECIMAL(10, 3) | 123.456 ppm |
| **ORCIDs** | VARCHAR(50) | 0000-0002-1825-0097 |
| **ISGNs** | VARCHAR(20) | IGSN1234567890 |

---

## Triggers

### update_samples_updated_at
- **Table:** samples
- **Action:** BEFORE UPDATE
- **Effect:** Sets `updated_at = CURRENT_TIMESTAMP`

### update_datasets_modified_date
- **Table:** datasets
- **Action:** BEFORE UPDATE
- **Effect:** Sets `last_modified_date = CURRENT_DATE`

---

## Foreign Key Cascades

| Relationship | ON DELETE | Rationale |
|--------------|-----------|-----------|
| datasets → samples | CASCADE | Delete samples when dataset deleted |
| samples → ft_datapoints | CASCADE | Delete analyses when sample deleted |
| samples → he_datapoints | CASCADE | Delete analyses when sample deleted |
| ft_datapoints → ft_count_data | CASCADE | Delete grain data with datapoint |
| people → sample_people_roles | CASCADE | Remove roles when person deleted |
| batches → reference_materials | CASCADE | Delete QC data with batch |
| samples → mounts | SET NULL | Keep mount if sample deleted |
| mounts → grains | SET NULL | Keep grain if mount deleted |

---

## Sample Query Patterns

### Get Sample with All FT Datapoints
```sql
SELECT s.sample_id, s.lithology, s.mineral_type,
       ftd.central_age_ma, ftd.analysis_date, ftd.laboratory
FROM samples s
LEFT JOIN ft_datapoints ftd ON s.sample_id = ftd.sample_id
WHERE s.sample_id = 'MAL001'
ORDER BY ftd.analysis_date DESC;
```

### Get FT Datapoint with All Grain Data
```sql
SELECT ftd.datapoint_key, ftd.central_age_ma,
       fcd.grain_id, fcd.Ns, fcd.rho_s_cm2, fcd.Dpar_um
FROM ft_datapoints ftd
LEFT JOIN ft_count_data fcd ON ftd.id = fcd.ft_datapoint_id
WHERE ftd.sample_id = 'MAL001';
```

### Get Sample with Provenance
```sql
SELECT s.sample_id, p.name, p.orcid, spr.role
FROM samples s
JOIN sample_people_roles spr ON s.sample_id = spr.sample_id
JOIN people p ON spr.person_id = p.id
WHERE s.sample_id = 'MAL001';
```

### Get QC Data for Batch
```sql
SELECT b.batch_name, b.analysis_date,
       rm.material_name, rm.expected_age_ma, rm.measured_age_ma,
       (rm.measured_age_ma - rm.expected_age_ma) as age_offset_ma
FROM batches b
JOIN reference_materials rm ON b.id = rm.batch_id
WHERE b.batch_name = 'Batch-2024-001';
```

---

## References

**EarthBank Platform:**
- Nixon, A.L., Boone, S.C., Gréau, Y., et al., 2025. Volcanoes to vugs: Demonstrating a FAIR geochemistry framework. *Chemical Geology*, v. 696, 123092.

**Data Reporting Standards:**
- Kohn, B.P., Ketcham, R.A., Vermeesch, P., Boone, S.C., et al., 2024. Interpreting and reporting fission-track chronological data. *GSA Bulletin*, v. 136, no. 9/10, p. 3891–3920.

**Platform:**
- EarthBank: https://earthbank.auscope.org.au/

---

**Version History:**
- v2.0.0 (2025-11-17): EarthBank-compatible datapoint architecture
- v1.0.0 (2024): Original display-optimized schema

**Last Updated:** 2025-11-18
