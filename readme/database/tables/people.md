# Table: `people`

**Last Updated:** 2025-11-18 06:54:00

## Purpose

Stores **researcher information with ORCID identifiers** for provenance tracking. Enables **FAIR data attribution** - every sample collection, analysis, and publication can be traced to specific researchers.

Critical for:
- **Data provenance:** Who collected samples? Who analyzed them?
- **Academic attribution:** Credit researchers in data citations
- **Persistent identifiers:** ORCID prevents name ambiguity
- **Collaboration tracking:** Multi-lab, multi-researcher projects

## Schema

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | integer | PK, NOT NULL | Unique identifier |
| `orcid` | varchar(50) | CHECK: ORCID or name required | **ORCID identifier (e.g., "0000-0001-2345-6789")** |
| `name` | varchar(200) | NOT NULL | Researcher name |
| `email` | varchar(200) | | Contact email |
| `affiliation` | varchar(300) | | Institution/university |
| `created_at` | timestamp | DEFAULT now() | Record creation timestamp |

**CHECK constraint:** At least one of (orcid, name) must be NOT NULL

## Relationships

### Foreign Keys
- None (root table)

### Referenced By
- `sample_people_roles.person_id` → This table (sample-level roles)
- `datapoint_people_roles.person_id` → This table (datapoint-level roles)
- `ft_datapoints.analyst_orcid` → `people.orcid` (implicit link)
- `he_datapoints.analyst_orcid` → `people.orcid` (implicit link)

## Used By (Code Files)

**Import:**
- `scripts/db/import-earthbank-templates.ts` - Creates people records from ORCID fields

**Queries:**
- `lib/db/queries.ts:getAllPeople()` - List all researchers
- `lib/db/queries.ts:getPersonById()` - Get researcher details
- `lib/db/queries.ts:getPersonByOrcid()` - Lookup by ORCID

## Business Rules

1. **ORCID preferred:** Use ORCID when available (persistent, globally unique)
2. **Name fallback:** If no ORCID, store name (but watch for duplicates)
3. **Unique ORCIDs:** Each ORCID can only appear once
4. **Multiple names per ORCID:** Same person may have name variants (maiden name, initials)
5. **Affiliation changes:** Track current affiliation (or add history table)

## Key Concepts

### ORCID (Open Researcher and Contributor ID)
- **Format:** 16-digit identifier (e.g., 0000-0001-2345-6789)
- **Purpose:** Persistent researcher identifier (survives name changes, moves)
- **Registration:** Free at https://orcid.org/
- **Adoption:** Required by many journals, funders

### Why ORCID Matters
- **Name ambiguity:** "J. Smith" could be hundreds of people
- **Name changes:** Marriage, cultural naming conventions
- **International names:** Various transliterations, character sets
- **Institution moves:** Researchers change affiliations

### Roles (from junction tables)
**Sample-level (sample_people_roles):**
- collector: Collected the sample
- PI: Principal investigator
- project_lead: Led the field project

**Datapoint-level (datapoint_people_roles):**
- analyst: Performed the analysis
- operator: Operated the equipment
- technician: Prepared the samples

## EarthBank Integration

Maps to **EarthBank provenance fields:**
- Collector ORCID
- Analyst ORCID
- PI ORCID
- Full name and affiliation

## Common Queries

```sql
-- Find person by ORCID
SELECT
  id,
  orcid,
  name,
  affiliation
FROM people
WHERE orcid = '0000-0001-2345-6789';

-- Get all analysts (people who performed analyses)
SELECT DISTINCT
  p.name,
  p.orcid,
  p.affiliation,
  COUNT(dpr.id) AS n_datapoints
FROM people p
JOIN datapoint_people_roles dpr ON p.id = dpr.person_id
WHERE dpr.role = 'analyst'
GROUP BY p.id, p.name, p.orcid, p.affiliation
ORDER BY n_datapoints DESC;

-- Get all samples collected by a researcher
SELECT
  s.sample_id,
  s.latitude,
  s.longitude,
  s.collection_date
FROM samples s
JOIN sample_people_roles spr ON s.sample_id = spr.sample_id
JOIN people p ON spr.person_id = p.id
WHERE p.orcid = '0000-0001-2345-6789'
  AND spr.role = 'collector'
ORDER BY s.collection_date;

-- Find researchers without ORCID
SELECT
  name,
  email,
  affiliation
FROM people
WHERE orcid IS NULL;
```

## Data Attribution Example

**Publication citation with ORCID:**
> "Samples collected by Jane Doe (ORCID: 0000-0001-2345-6789) in 2022.
> Fission-track analysis by John Smith (ORCID: 0000-0002-3456-7890) at University of Melbourne.
> (U-Th)/He analysis by Maria Garcia (ORCID: 0000-0003-4567-8901) at Stanford University."

## ORCID Lookup/Validation

**Validate ORCID format:**
```sql
-- Check for valid ORCID format (XXXX-XXXX-XXXX-XXXX)
SELECT
  orcid,
  name,
  CASE
    WHEN orcid ~ '^\d{4}-\d{4}-\d{4}-\d{3}[0-9X]$' THEN 'Valid'
    ELSE 'Invalid format'
  END AS orcid_status
FROM people
WHERE orcid IS NOT NULL;
```

**ORCID API integration (future):**
- Auto-populate name, affiliation from ORCID.org
- Validate ORCID exists
- Fetch updated affiliation

## Quality Control

1. **Verify ORCIDs:** Check format, confirm exists at https://orcid.org/
2. **Deduplicate names:** Same person may have multiple entries (merge them)
3. **Update affiliations:** Keep current (or add affiliation history)
4. **Require ORCID:** Especially for new data submissions

## Notes

- **FAIR compliance:** ORCID-based attribution is FAIR best practice
- **Academic recognition:** Proper attribution in data publications
- **Persistent identifiers:** Survives name changes, institution moves
- **Global standard:** Used by publishers, funders, repositories
- **Privacy:** ORCID is public information (users choose what to share)
- **Future expansion:** Could add more metadata (CV, expertise, past projects)
