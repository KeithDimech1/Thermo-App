# Table: `ft_datapoints`

**Purpose:** Fission-track analytical sessions (EarthBank FT Datapoints sheet)

**Last Schema Update:** 2025-11-17

---

## Overview

**CRITICAL TABLE:** Core of Schema v2 architecture. Replaces single-analysis-per-sample model with datapoint-based architecture. Each record represents one analytical session for a sample. A sample can have multiple datapoints (e.g., analyzed at different labs, with different methods, at different times).

Maps directly to EarthBank "FT Datapoints" sheet for FAIR data submission.

---

## Schema (Key Fields)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | integer | PK, AUTO | Unique datapoint identifier |
| sample_id | varchar(50) | NOT NULL, FK → samples | Sample analyzed |
| datapoint_key | varchar(100) | NOT NULL, UNIQUE | User-provided unique identifier |
| batch_id | integer | FK → batches | Analytical batch for QC |
| laboratory | varchar(200) | | Lab where analysis performed |
| analyst_orcid | varchar(50) | | Analyst ORCID (for provenance) |
| analysis_date | timestamp | | When analysis performed |
| publication_doi | varchar(100) | | Associated publication |
| mineral_type | varchar(50) | | Mineral analyzed (apatite, zircon) |
| ft_method | varchar(50) | | EDM, LA-ICP-MS, or Population |
| ft_software | varchar(100) | | Analysis software |
| ft_algorithm | varchar(50) | | Age calculation algorithm |
| n_grains | integer | | Number of grains analyzed |
| central_age_ma | numeric(10,2) | | Central age (Ma) |
| central_age_error_ma | numeric(10,2) | | 1σ error on central age |
| pooled_age_ma | numeric(10,2) | | Pooled age (Ma) |
| pooled_age_error_ma | numeric(10,2) | | 1σ error on pooled age |
| dispersion_pct | numeric(6,4) | | Age dispersion (%) |
| P_chi2_pct | numeric(6,3) | | P(χ²) test statistic |
| mean_track_length_um | numeric(6,3) | | Mean track length (µm) |
| zeta_yr_cm2 | numeric(12,6) | | Zeta calibration (EDM) |
| dosimeter | varchar(50) | | Dosimeter glass type (EDM) |
| created_at | timestamp | DEFAULT now() | Record creation |

*Full schema: 42 fields total - see database for complete list*

---

## Relationships

**Foreign Keys (Parents):**
- `sample_id` → `samples.sample_id` (CASCADE DELETE)
- `batch_id` → `batches.id`

**Referenced By (Children):**
- `ft_count_data.ft_datapoint_id` → Grain-by-grain count data
- `ft_single_grain_ages.ft_datapoint_id` → Single grain ages
- `ft_track_length_data.ft_datapoint_id` → Individual track measurements
- `ft_binned_length_data.ft_datapoint_id` → Binned length histograms

**Indexes:**
- `idx_ft_datapoints_sample` on `sample_id`
- `idx_ft_datapoints_key` on `datapoint_key`
- `idx_ft_datapoints_batch` on `batch_id`
- `idx_ft_datapoints_central_age` on `central_age_ma`

---

## Used By (Code Files)

**Primary Queries:**
- `lib/db/queries.ts` (lines 211-256)
  - `getFTDatapointsBySample()` - Get all datapoints for sample
  - `getFTDatapointById()` - Get single datapoint
  - `getFTCountDataByDatapoint()` - Get count data
  - `getFTSingleGrainAgesByDatapoint()` - Get single grain ages
  - `getFTTrackLengthDataByDatapoint()` - Get track length data

**Legacy Compatibility:**
- `lib/db/queries.ts` (lines 620-656)
  - `getFTAgesBySample()` - Maps first datapoint to FTAges type

**Type Definition:**
- `lib/types/thermo-data.ts` (lines 233-327)
  - Interface: `FTDatapoint`

---

## Business Rules

### Datapoint Architecture

**Old (v1):** 1 sample → 1 analysis
**New (v2):** 1 sample → many datapoints

**Why?**
- Same sample analyzed multiple times (different labs, methods, dates)
- Each analytical session is a "datapoint" with full QC metadata
- Enables batch-level QC tracking with reference materials
- Supports ORCID-based provenance tracking

### Field Usage by Method

**EDM (External Detector Method):**
- Requires: `zeta_yr_cm2`, `dosimeter`, `irradiation_reactor`
- Neutron irradiation needed: `thermal_neutron_dose`
- Age calculated via zeta calibration

**LA-ICP-MS:**
- Requires: `R_um` (absolute U measurement)
- No irradiation needed
- Direct age measurement via U-Pb

**Population Method:**
- For detrital samples with mixed ages
- Uses mixture modeling

### Statistical Fields

- **χ² test:** Tests if analytical uncertainties explain scatter
- **P(χ²):** P-value (>5% suggests homogeneous population)
- **Dispersion:** Overdispersion parameter (0% = Poisson, >0% = geological complexity)

---

## Common Queries

```sql
-- Get all datapoints for a sample (with child data counts)
SELECT
  ftd.*,
  COUNT(DISTINCT fcd.id) as n_count_data,
  COUNT(DISTINCT ftld.id) as n_track_lengths
FROM ft_datapoints ftd
LEFT JOIN ft_count_data fcd ON ftd.id = fcd.ft_datapoint_id
LEFT JOIN ft_track_length_data ftld ON ftd.id = ftld.ft_datapoint_id
WHERE ftd.sample_id = $1
GROUP BY ftd.id
ORDER BY ftd.analysis_date DESC;

-- Find datapoints by method and age range
SELECT * FROM ft_datapoints
WHERE ft_method = 'LA-ICP-MS'
  AND central_age_ma BETWEEN $1 AND $2
ORDER BY central_age_ma;
```

---

## EarthBank Integration

**EarthBank Sheet:** FT Datapoints (EarthBank template v2024-11-11)

**Required Fields for Upload:**
- datapoint_key, sample_id, mineral_type, ft_method
- central_age_ma, central_age_error_ma
- n_grains, mean_track_length_um

**Reference:** Kohn et al. (2024) Table 10 - Age reporting standards
