# Table: `datapoint_people_roles`

**Last Updated:** 2025-11-18 06:45:00

## Purpose

Links analytical datapoints (FT, He, U-Pb, trace element) to people with specific roles. Enables tracking of **who performed what analysis** with full ORCID-based provenance.

This table is part of the **FAIR provenance system** - every analytical session can be traced to specific researchers.

## Schema

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | integer | PK, NOT NULL | Unique identifier |
| `datapoint_id` | integer | FK, NOT NULL | ID of analytical datapoint |
| `datapoint_type` | varchar(20) | NOT NULL, CHECK | Type of datapoint: 'ft', 'he', 'upb', 'trace' |
| `person_id` | integer | FK → people.id, NOT NULL | Person performing role |
| `role` | varchar(50) | NOT NULL | Role type (analyst, operator, PI) |
| `created_at` | timestamp | DEFAULT now() | Record creation timestamp |

## Relationships

### Foreign Keys
- `person_id` → `people.id` (researcher with ORCID)
- `datapoint_id` → Variable (depends on `datapoint_type`):
  - 'ft' → `ft_datapoints.id`
  - 'he' → `he_datapoints.id`
  - 'upb' → Future U-Pb table
  - 'trace' → Future trace element table

### Referenced By
- None (junction table)

## Used By (Code Files)

**Currently:** Not directly queried in application code (infrastructure table)

**Future use:** Provenance queries, analyst performance tracking, ORCID attribution

## Business Rules

1. **Datapoint type constraint:** Must be one of: 'ft', 'he', 'upb', 'trace'
2. **Multiple roles allowed:** Same person can have multiple roles for one datapoint
3. **ORCID tracking:** Links to `people` table which stores ORCID identifiers
4. **Polymorphic relationship:** `datapoint_id` references different tables based on `datapoint_type`

## Common Roles

- **analyst:** Person who performed the analysis
- **operator:** Equipment operator (e.g., LA-ICP-MS)
- **PI:** Principal investigator overseeing the work
- **technician:** Lab technician who prepared samples

## EarthBank Integration

Maps to **EarthBank provenance fields:**
- Analyst ORCID
- Operator ORCID
- PI ORCID

## Example Query

```sql
-- Get all analysts for FT datapoints in a dataset
SELECT
  dp.datapoint_key,
  p.name AS analyst_name,
  p.orcid,
  dpr.role
FROM datapoint_people_roles dpr
JOIN people p ON dpr.person_id = p.id
JOIN ft_datapoints dp ON dpr.datapoint_id = dp.id
WHERE dpr.datapoint_type = 'ft'
  AND dp.sample_id IN (SELECT sample_id FROM samples WHERE dataset_id = 1);
```

## Notes

- **FAIR compliance:** Enables complete provenance tracking
- **Multi-method support:** Same structure for all analytical methods
- **Future expansion:** Ready for U-Pb and trace element data
- **ORCID integration:** Persistent researcher identifiers prevent name ambiguity
