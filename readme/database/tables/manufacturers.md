# Table: `manufacturers`

**Purpose:** Companies that produce diagnostic assays and test systems
**Last Schema Update:** 2025-11-11
**Estimated Row Count:** ~15-25 manufacturers
**Growth Rate:** Slow (established industry players)

---

## Purpose

Stores information about **diagnostic test manufacturers** - the companies that produce assays and test platforms. This is a reference/lookup table used to organize assays by manufacturer and calculate manufacturer-level performance statistics.

---

## Schema (Bones)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | integer | PK, AUTO | Unique identifier |
| `name` | varchar(100) | NOT NULL, UNIQUE | Company name |
| `country` | varchar(100) | NULL | Country of origin/headquarters |
| `website` | varchar(200) | NULL | Company website URL |
| `total_assays` | integer | DEFAULT 0 | Cached count of assays (denormalized) |
| `created_at` | timestamp | DEFAULT now() | When record was created |

---

## Relationships

### No Parents
This is a top-level reference table with no foreign keys.

### Referenced By (Children)
- **`assays.manufacturer_id`** → `manufacturers.id`
  Each assay belongs to one manufacturer

---

## Unique Constraints

**Unique:** `name`

Each manufacturer name must be unique in the database.

---

## Used By (Code Files)

### API Routes
- `app/api/manufacturers/route.ts` - GET all manufacturers with performance stats
- `app/api/manufacturers/[id]/route.ts` - GET single manufacturer with assays and configs
- `app/api/configs/route.ts` - Filter configs by manufacturer (via assays)

### Server Components
- `app/(dashboard)/manufacturers/page.tsx` - List all manufacturers
- `app/(dashboard)/manufacturers/[id]/page.tsx` - Manufacturer detail page
- `app/(dashboard)/dashboard/page.tsx` - Dashboard manufacturer stats

### UI Components
- `components/filters/FilterPanel.tsx` - Manufacturer filter dropdown
- `components/dashboard/TopPerformers.tsx` - Top performing manufacturers

### Database Queries
- `lib/db/queries.ts`:
  - `getAllManufacturers()` - Returns `ManufacturerPerformance[]` with aggregated stats
  - `getManufacturerById()` - Single manufacturer with performance metrics
  - `getManufacturerByName()` - Lookup by name
  - `getAssaysByManufacturerId()` - All assays for a manufacturer
  - `getConfigsByManufacturerId()` - All test configs using manufacturer's assays

### Views
- **`vw_manufacturer_performance`** - Pre-aggregated performance metrics:
  - total_configs
  - avg_cv_lt_10_pct
  - excellent_count, good_count, acceptable_count, poor_count

---

## Example Data

### Major Manufacturers

| Name | Country | Focus Area |
|------|---------|------------|
| Abbott Diagnostics | USA | Immunoassays, PCR (ARCHITECT, RealTime) |
| Roche Diagnostics | Switzerland | Immunoassays, PCR (cobas) |
| Siemens Healthineers | Germany | Immunoassays, automation (ADVIA, Atellica) |
| DiaSorin | Italy | CLIA systems (LIAISON) |
| Bio-Rad Laboratories | USA | ELISA, QC materials |
| Ortho Clinical Diagnostics | USA | Immunoassays, blood screening |
| bioMérieux | France | Microbiology, immunoassays |
| Beckman Coulter | USA | Immunoassays, automation |

---

## Common Query Patterns

### Get manufacturer with performance stats
```sql
SELECT *
FROM vw_manufacturer_performance
WHERE id = $1;
```

### Get top performers
```sql
SELECT *
FROM vw_manufacturer_performance
ORDER BY avg_cv_lt_10_pct DESC
LIMIT 10;
```

### Get manufacturer's assays and configs
```sql
SELECT
  m.*,
  a.id as assay_id,
  a.name as assay_name,
  COUNT(tc.id) as config_count
FROM manufacturers m
JOIN assays a ON m.id = a.manufacturer_id
LEFT JOIN test_configurations tc ON a.id = tc.assay_id
WHERE m.id = $1
GROUP BY m.id, a.id, a.name
ORDER BY a.name;
```

---

## Business Rules

### total_assays Field
- **Denormalized:** Stores cached count of assays
- **Updated:** When assays are added/removed
- **Alternative:** Calculate dynamically with JOIN to assays table

### Name Standardization
- Use full company names: "Abbott Diagnostics" not "Abbott"
- Include "Diagnostics" or "Healthcare" division if applicable
- Avoid abbreviations except for well-known brands

---

## Recent Changes

**2025-11-11:** Initial schema documented
- No recent modifications detected
- Schema is stable

---

## Related Tables

- **[assays](assays.md)** - Child table (manufacturers produce assays)
- **[test_configurations](test_configurations.md)** - Via assays
- **[cv_measurements](cv_measurements.md)** - Via assays and test_configurations

---

## Performance Notes

### Indexes
- Primary key index on `id` (automatic)
- Unique index on `name`

### Query Optimization
- **Use `vw_manufacturer_performance` for aggregated stats** (faster than JOINs)
- Cache manufacturer list for dropdowns (rarely changes)
- `total_assays` provides quick count without JOIN

---

## Data Quality Checks

```sql
-- Manufacturers without assays
SELECT m.*
FROM manufacturers m
LEFT JOIN assays a ON m.id = a.manufacturer_id
WHERE a.id IS NULL;

-- Verify total_assays count
SELECT
  m.id,
  m.name,
  m.total_assays as cached_count,
  COUNT(a.id) as actual_count
FROM manufacturers m
LEFT JOIN assays a ON m.id = a.manufacturer_id
GROUP BY m.id, m.name, m.total_assays
HAVING m.total_assays != COUNT(a.id);
```

---

**Generated:** 2025-11-11
**Last Verified:** 2025-11-11
**Schema Version:** 1.0.0
