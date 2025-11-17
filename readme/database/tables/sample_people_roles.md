# Table: `sample_people_roles`

**Last Updated:** 2025-11-18 06:56:00

## Purpose

Links **samples to people with specific roles** for sample-level provenance. Tracks **who collected samples**, who led the field project, and who is the principal investigator.

This is **sample-level attribution** (vs `datapoint_people_roles` for analytical-level attribution).

Critical for:
- **Field work credit:** Recognize sample collectors
- **Project leadership:** Track PIs and project leads
- **Data provenance:** Who collected where and when
- **Collaboration tracking:** Multi-person field campaigns

## Schema

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | integer | PK, NOT NULL | Unique identifier |
| `sample_id` | varchar(50) | FK → samples.sample_id, NOT NULL | Sample |
| `person_id` | integer | FK → people.id, NOT NULL | Person |
| `role` | varchar(50) | NOT NULL | Role: 'collector', 'PI', 'project_lead', 'field_assistant' |
| `created_at` | timestamp | DEFAULT now() | Record creation timestamp |

## Relationships

### Foreign Keys
- `sample_id` → `samples.sample_id` (sample)
- `person_id` → `people.id` (researcher with ORCID)

### Referenced By
- None (junction table)

## Used By (Code Files)

**Currently:** Not actively queried (infrastructure table)

**Future use:**
- Sample provenance reports
- Collector attribution in publications
- Field campaign tracking

## Business Rules

1. **Multiple roles per sample:** One person can have multiple roles
2. **Multiple people per role:** Multiple collectors allowed (field team)
3. **ORCID tracking:** Links to `people` table with ORCID identifiers
4. **Recommended roles:**
   - **collector:** Person who physically collected the sample
   - **PI:** Principal investigator (grant holder)
   - **project_lead:** Field project leader
   - **field_assistant:** Field team member
   - **geologist:** Local geologist providing guidance

## Common Roles

### collector
- **Definition:** Person who physically collected the rock sample
- **Credit:** Primary field work attribution
- **ORCID:** Should be included in data citations

### PI (Principal Investigator)
- **Definition:** Grant holder, project overseer
- **Credit:** Overall project leadership
- **ORCID:** Required for funding acknowledgments

### project_lead
- **Definition:** Field campaign leader (may differ from PI)
- **Credit:** Field logistics, site selection
- **ORCID:** Field work leadership credit

### field_assistant
- **Definition:** Team member assisting with sample collection
- **Credit:** Supporting field work
- **ORCID:** Collaborative field work acknowledgment

## EarthBank Integration

Maps to **EarthBank sample provenance:**
- Collector ORCID
- PI ORCID
- Field team members
- Enables proper academic attribution

## Common Queries

```sql
-- Get all people involved with a sample
SELECT
  s.sample_id,
  p.name,
  p.orcid,
  spr.role
FROM sample_people_roles spr
JOIN samples s ON spr.sample_id = s.sample_id
JOIN people p ON spr.person_id = p.id
WHERE s.sample_id = 'MAL-001'
ORDER BY spr.role;

-- Find all samples collected by a researcher
SELECT
  s.sample_id,
  s.latitude,
  s.longitude,
  s.collection_date,
  s.lithology
FROM samples s
JOIN sample_people_roles spr ON s.sample_id = spr.sample_id
JOIN people p ON spr.person_id = p.id
WHERE p.orcid = '0000-0001-2345-6789'
  AND spr.role = 'collector'
ORDER BY s.collection_date;

-- Get all collectors for a dataset
SELECT DISTINCT
  p.name,
  p.orcid,
  p.affiliation,
  COUNT(DISTINCT s.sample_id) AS n_samples
FROM samples s
JOIN sample_people_roles spr ON s.sample_id = spr.sample_id
JOIN people p ON spr.person_id = p.id
WHERE s.dataset_id = 1
  AND spr.role = 'collector'
GROUP BY p.id, p.name, p.orcid, p.affiliation
ORDER BY n_samples DESC;

-- Find samples with multiple collectors (field teams)
SELECT
  s.sample_id,
  STRING_AGG(p.name, ', ') AS collectors
FROM samples s
JOIN sample_people_roles spr ON s.sample_id = spr.sample_id
JOIN people p ON spr.person_id = p.id
WHERE spr.role = 'collector'
GROUP BY s.sample_id
HAVING COUNT(*) > 1;
```

## Data Citation Example

**Proper attribution with ORCID:**
> "Samples collected by Jane Doe (ORCID: 0000-0001-2345-6789) and John Smith (ORCID: 0000-0002-3456-7890) during the 2022 Malawi Rift field campaign led by Maria Garcia (ORCID: 0000-0003-4567-8901). Project PI: Robert Johnson (ORCID: 0000-0004-5678-9012)."

## Field Campaign Tracking

```sql
-- Reconstruct field campaign from sample provenance
SELECT
  s.collection_date,
  COUNT(DISTINCT s.sample_id) AS samples_collected,
  STRING_AGG(DISTINCT p.name, ', ') AS field_team
FROM samples s
JOIN sample_people_roles spr ON s.sample_id = spr.sample_id
JOIN people p ON spr.person_id = p.id
WHERE s.dataset_id = 1
  AND spr.role IN ('collector', 'field_assistant', 'project_lead')
GROUP BY s.collection_date
ORDER BY s.collection_date;
```

## Provenance vs Analytical Roles

**Sample-level (this table):**
- Field work: collector, project_lead, field_assistant
- Project oversight: PI
- Timing: During sample collection

**Datapoint-level (datapoint_people_roles):**
- Lab work: analyst, operator, technician
- Timing: During analytical session (months/years after collection)

## FAIR Compliance

**Required for FAIR data:**
1. **Collector ORCID:** Who collected the sample
2. **Collection date:** When sample was collected
3. **Project attribution:** PI and project leadership
4. **Persistent identifiers:** ORCID survives name changes

## Notes

- **Academic credit:** Proper attribution in data publications
- **ORCID essential:** Persistent researcher identifiers
- **Multi-person teams:** Field work is collaborative (multiple roles allowed)
- **Grant requirements:** Many funders require proper data attribution
- **Future expansion:** Could add role start/end dates, role descriptions
- **Complements analytical roles:** Sample collection (here) + analysis (datapoint_people_roles)
