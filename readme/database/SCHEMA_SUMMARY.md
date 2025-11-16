# QC Results Database Schema

**Database:** Neon PostgreSQL (neondb)
**Last Schema Update:** 2025-11-11
**PostgreSQL Version:** 17.5
**Total Tables:** 8
**Total Views:** 2

---

## 📊 Quick Overview

This database stores quality control (QC) performance data for diagnostic assays across multiple manufacturers, markers, and pathogens. It tracks coefficient of variation (CV) measurements to assess test reliability.

### Purpose
- Store QC performance metrics for diagnostic tests
- Track manufacturer and assay performance over time
- Enable comparison of test configurations
- Support quality rating assessments

### Key Relationships
```
categories → pathogens → markers
                          ↓
manufacturers → assays → test_configurations → cv_measurements
                          ↓
                       qc_samples
```

---

## 📋 Tables

### 1. **categories** - Disease Categories
**Purpose:** Top-level classification of pathogens
**Rows:** ~10-15 categories
**Key Fields:** name, description

Examples: Hepatitis Viruses, Retroviruses, TORCH Panel, Blood-Borne Pathogens

→ [Full documentation](tables/categories.md)

---

### 2. **pathogens** - Infectious Agents
**Purpose:** Specific pathogens being tested
**Rows:** ~20-30 pathogens
**Key Fields:** name, category_id
**Relationships:**
- `category_id` → `categories.id`

Examples: HIV, HBV, HCV, CMV, Toxoplasma, HSV

→ [Full documentation](tables/pathogens.md)

---

### 3. **markers** - Test Markers
**Purpose:** Specific markers (antibodies, antigens, nucleic acids) being measured
**Rows:** ~40-60 markers
**Key Fields:** name, pathogen_id, antibody_type, marker_type, clinical_use
**Relationships:**
- `pathogen_id` → `pathogens.id`
- `category_id` → `categories.id`

**Marker Types:**
- Antibody (IgG, IgM, Total)
- Antigen
- Nucleic Acid (PCR)

Examples: HIV-1/2 Ab, HCV IgG, CMV DNA, Toxoplasma IgM

→ [Full documentation](tables/markers.md)

---

### 4. **manufacturers** - Test Kit Manufacturers
**Purpose:** Companies that produce diagnostic assays
**Rows:** ~15-25 manufacturers
**Key Fields:** name, country, website, total_assays

Examples: Abbott, Roche, Siemens, Bio-Rad, DiaSorin

→ [Full documentation](tables/manufacturers.md)

---

### 5. **assays** - Diagnostic Test Systems
**Purpose:** Specific test platforms and methodologies
**Rows:** ~50-80 assays
**Key Fields:** name, manufacturer_id, platform, methodology, automation_level
**Relationships:**
- `manufacturer_id` → `manufacturers.id`

**Methodologies:** CLIA, ELISA, PCR, ECLIA, CMIA

Examples: ARCHITECT HIV Ag/Ab Combo, cobas HCV, LIAISON Toxo IgG

→ [Full documentation](tables/assays.md)

---

### 6. **qc_samples** - Quality Control Materials
**Purpose:** Commercial QC samples used for testing
**Rows:** ~10-20 samples
**Key Fields:** name, manufacturer, lot_number, matrix, expiration_date

**Matrix Types:** Serum, Plasma

Examples: Bio-Rad Immunology Plus, BIOKÉ QC samples

→ [Full documentation](tables/qc_samples.md)

---

### 7. **test_configurations** ⭐ CORE TABLE
**Purpose:** Unique combinations of marker + assay + QC sample
**Rows:** ~200-500 configurations
**Key Fields:** marker_id, assay_id, qc_sample_id, test_type, quality_rating
**Relationships:**
- `marker_id` → `markers.id`
- `assay_id` → `assays.id`
- `qc_sample_id` → `qc_samples.id`

**Test Types:** serology, nat (nucleic acid testing), both

**Quality Ratings:** excellent, good, acceptable, poor, unknown

This is the **central table** that connects everything together.

→ [Full documentation](tables/test_configurations.md)

---

### 8. **cv_measurements** - Performance Metrics
**Purpose:** Coefficient of variation measurements for each test configuration
**Rows:** ~200-500 measurements (1:1 with test_configurations)
**Key Fields:** test_configuration_id, cv_lt_10_percentage, cv_10_to_15, cv_gt_15
**Relationships:**
- `test_configuration_id` → `test_configurations.id`

**CV Thresholds:**
- **< 10%:** Excellent precision
- **10-15%:** Acceptable precision
- **> 15%:** Poor precision

→ [Full documentation](tables/cv_measurements.md)

---

## 📈 Views

### 1. **vw_manufacturer_performance**
**Purpose:** Aggregated performance metrics by manufacturer
**Includes:** Total configs, avg CV <10%, quality rating counts
**Used by:** Dashboard, manufacturer detail pages, API routes

### 2. **vw_test_config_details**
**Purpose:** Denormalized view joining all tables for easy querying
**Includes:** All test configuration details with related entities
**Used by:** Search, filtering, comparison features

---

## 🔗 Common Query Patterns

### Get all test configurations for a marker
```sql
SELECT * FROM test_configurations WHERE marker_id = ?
```

### Get manufacturer performance summary
```sql
SELECT * FROM vw_manufacturer_performance WHERE name = ?
```

### Get high-performing tests (CV <10% > 80%)
```sql
SELECT tc.*, cv.cv_lt_10_percentage
FROM test_configurations tc
JOIN cv_measurements cv ON tc.id = cv.test_configuration_id
WHERE cv.cv_lt_10_percentage > 80
ORDER BY cv.cv_lt_10_percentage DESC
```

### Compare assays for the same marker
```sql
SELECT tc.*, a.name as assay_name, m.name as marker_name, cv.cv_lt_10_percentage
FROM test_configurations tc
JOIN assays a ON tc.assay_id = a.id
JOIN markers m ON tc.marker_id = m.id
JOIN cv_measurements cv ON tc.id = cv.test_configuration_id
WHERE tc.marker_id = ?
ORDER BY cv.cv_lt_10_percentage DESC
```

---

## 🔐 Constraints & Validation

### Foreign Key Constraints
- All relationship columns have FK constraints with CASCADE on delete
- Maintains referential integrity across the schema

### Check Constraints
- **Quality ratings:** Must be one of: excellent, good, acceptable, poor, unknown
- **Test types:** Must be one of: serology, nat, both
- **Antibody types:** Must be one of: IgG, IgM, Antigen, Antibody (Total), Other
- **Marker types:** Must be one of: Antibody, Antigen, Nucleic Acid
- **Methodologies:** Must be one of: CLIA, ELISA, PCR, ECLIA, CMIA
- **Automation levels:** Must be one of: Fully Automated, Semi-Automated, Manual

### Unique Constraints
- **Manufacturers:** Unique name
- **Categories:** Unique name
- **Pathogens:** Unique (name, category_id)
- **Markers:** Unique (name, pathogen_id)
- **Assays:** Unique (name, manufacturer_id)
- **QC Samples:** Unique (name, lot_number)
- **Test Configurations:** Unique (marker_id, assay_id, qc_sample_id)

---

## 📊 Data Statistics

| Table | Estimated Rows | Growth Rate |
|-------|----------------|-------------|
| categories | 10-15 | Stable |
| pathogens | 20-30 | Slow growth |
| markers | 40-60 | Moderate growth |
| manufacturers | 15-25 | Slow growth |
| assays | 50-80 | Moderate growth |
| qc_samples | 10-20 | Slow growth |
| test_configurations | 200-500 | **Active growth** |
| cv_measurements | 200-500 | **Active growth** |

**Note:** test_configurations and cv_measurements grow as new assay/QC combinations are tested.

---

## 🗺️ Schema Design Principles

1. **Normalized Structure:** 3NF normalization reduces data redundancy
2. **Denormalized Views:** Pre-joined views for common queries (performance)
3. **Audit Trails:** created_at/updated_at timestamps on key tables
4. **Soft Deletes:** Not implemented (use CASCADE deletes carefully)
5. **Text Search:** pg_trgm extension enables fuzzy search on names
6. **Quality Ratings:** Calculated from CV measurements, stored for quick filtering

---

## 📖 Related Documentation

- **Table Details:** See [tables/](tables/) folder for individual table docs
- **Code Usage:** See [CODE_USAGE.md](CODE_USAGE.md) for which code accesses which tables
- **Schema Changes:** See [SCHEMA_CHANGES.md](SCHEMA_CHANGES.md) for modification history
- **Database Connection:** See [lib/db/connection.md](../lib/db/connection.md)
- **Query Functions:** See [lib/db/queries.md](../lib/db/queries.md)

---

**Generated:** 2025-11-11 by `/bigtidy` autodoc system
**Schema Version:** 1.0.0
**Last Verified:** 2025-11-11
