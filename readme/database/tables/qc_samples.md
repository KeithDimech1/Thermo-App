# Table: `qc_samples`

**Purpose:** Commercial quality control materials used for assay validation
**Last Schema Update:** 2025-11-11
**Estimated Row Count:** ~10-20 samples
**Growth Rate:** Slow (established QC products)

---

## Purpose

Stores information about **quality control samples** - commercially available reference materials used to validate assay performance. These are standardized materials with known reactivity levels.

---

## Schema (Bones)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | integer | PK, AUTO | Unique identifier |
| `name` | varchar(200) | NOT NULL, UNIQUE(name, lot_number) | QC sample product name |
| `manufacturer` | varchar(100) | NULL | QC manufacturer (not assay manufacturer) |
| `lot_number` | varchar(100) | NULL | Specific lot/batch identifier |
| `matrix` | varchar(50) | DEFAULT 'Serum' | Sample type (Serum, Plasma, etc.) |
| `expiration_date` | date | NULL | When sample expires |
| `description` | text | NULL | Additional information |
| `created_at` | timestamp | DEFAULT now() | When record was created |

---

## Relationships

### No Parents
Reference table with no foreign keys.

### Referenced By (Children)
- **`test_configurations.qc_sample_id`** → `qc_samples.id`
  Each configuration uses a specific QC sample

---

## Unique Constraints

**Unique Index:** (name, lot_number)

Ensures each QC sample + lot combination is unique. Different lots of the same QC product are tracked separately.

---

## Example Data

### Common QC Products

| Name | Manufacturer | Matrix |
|------|--------------|--------|
| Bio-Rad Immunology Plus | Bio-Rad | Serum |
| BIOKÉ QC Serology | BIOKÉ | Serum |
| PreciControl Multi | Roche | Serum/Plasma |
| QUALITROL | Ortho Clinical | Plasma |

---

## Used By (Code Files)

### Database Queries
- `lib/db/queries.ts`:
  - `getAllConfigs()` - Joins with qc_samples for display
  - `getConfigById()` - Includes QC sample details

---

## Common Query Patterns

### Get all configs using a QC sample
```sql
SELECT tc.*, qc.name as qc_sample_name
FROM test_configurations tc
JOIN qc_samples qc ON tc.qc_sample_id = qc.id
WHERE qc.id = $1;
```

### Get active QC samples (not expired)
```sql
SELECT *
FROM qc_samples
WHERE expiration_date IS NULL OR expiration_date > CURRENT_DATE
ORDER BY name;
```

---

## Business Rules

### Matrix Types
- **Serum:** Most common (blood serum)
- **Plasma:** Alternative matrix (EDTA, heparin, citrate)
- Some assays are matrix-specific

### Lot Tracking
- Different lots may have slightly different reactivity
- Performance can vary by lot
- Track lot_number for reproducibility

---

## Related Tables

- **[test_configurations](test_configurations.md)** - Child table (configs use QC samples)

---

**Generated:** 2025-11-11
**Schema Version:** 1.0.0
