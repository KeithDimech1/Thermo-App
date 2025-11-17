# Table: `batches`

**Purpose:** Analytical batches linking unknowns to reference materials for QC

**Last Schema Update:** 2025-11-17

---

## Overview

Tracks analytical batches that group samples analyzed together. Each batch links to reference materials (standards) analyzed in the same session for quality control. Critical for data validation and inter-laboratory comparison.

---

## Schema

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | integer | PK, AUTO | Unique batch identifier |
| batch_name | varchar(200) | NOT NULL, UNIQUE | Batch name (user-defined) |
| analysis_date | date | | Date of analysis session |
| laboratory | varchar(200) | | Laboratory where analysis performed |
| analytical_session | varchar(200) | | Session identifier (lab-specific) |
| irradiation_id | varchar(100) | | Irradiation identifier (FT only) |
| irradiation_reactor | varchar(100) | | Reactor used for neutron irradiation |
| thermal_neutron_dose | numeric(18,2) | | Neutron fluence (neutrons/cm²) |
| created_at | timestamp | DEFAULT now() | Record creation timestamp |

---

## Relationships

**Referenced By (Children):**
- `ft_datapoints.batch_id` → Foreign key link to FT analytical sessions
- `he_datapoints.batch_id` → Foreign key link to He analytical sessions
- `reference_materials.batch_id` → QC standards analyzed in batch

**Indexes:**
- `idx_batches_date` on `analysis_date`
- `idx_batches_name` on `batch_name`

---

## Used By (Code Files)

**Queries:**
- `lib/db/queries.ts` (lines 430-448)
  - `getAllBatches()` - Get all batches
  - `getBatchById()` - Get single batch
  - `getReferenceMaterialsByBatch()` - Get QC standards

---

## Business Rules

1. **Batch uniqueness:** Each batch_name must be unique across database
2. **FT-specific fields:** irradiation_* fields only populated for EDM fission-track batches
3. **QC requirement:** Each batch should have at least one reference material
4. **Date tracking:** analysis_date should match datapoint analysis dates

---

## Common Queries

```sql
-- Get batch with all reference materials
SELECT b.*, json_agg(rm.*) as reference_materials
FROM batches b
LEFT JOIN reference_materials rm ON b.id = rm.batch_id
WHERE b.id = $1
GROUP BY b.id;

-- Find batches by date range
SELECT * FROM batches
WHERE analysis_date BETWEEN $1 AND $2
ORDER BY analysis_date DESC;
```

---

## EarthBank Integration

**EarthBank Mapping:** This table supports the batch_id field in FT Datapoints and He Datapoints sheets.

**Reference:** Nixon et al. (2025) - EarthBank FAIR geochemistry framework
