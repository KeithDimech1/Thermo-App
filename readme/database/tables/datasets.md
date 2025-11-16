# Table: `datasets`

**Purpose:** Data packages with privacy controls, embargo dates, and DOI assignment

**Last Updated:** 2025-11-16

---

## Overview

The `datasets` table manages data packages for FAIR data principles. Each dataset can contain multiple samples and has privacy settings, embargo dates, and optional DOI for publication.

**Key Features:**
- Top-level organizational unit
- Privacy controls (public, embargo, private)
- Embargo dates (typically 2 years)
- DOI assignment for published datasets
- Supports FAIR data principles

---

## Schema (Key Fields)

| Column | Type | Description |
|--------|------|-------------|
| `id` | integer | PRIMARY KEY |
| `name` | varchar(200) | Dataset name |
| `description` | text | Description of dataset |
| `privacy_status` | varchar(50) | 'public', 'embargo', or 'private' |
| `embargo_date` | date | When data becomes public |
| `doi` | varchar(100) | Digital Object Identifier |
| `created_at` | timestamp | When dataset created |
| `created_by` | varchar(100) | Creator/owner |

---

## Relationships

### No Parents
This is a top-level table.

### Referenced By (Children)
- `samples.dataset_id` → this table (many:1)

---

## Used By

**Database Queries:**
- `lib/db/queries.ts`
  - `getDatasetStats(datasetId)` - Statistics for dataset
  - `getAllSamples({ dataset_id: 1 })` - Filter samples by dataset

**API Routes:**
- `app/api/stats/route.ts` - Dataset statistics

---

## Key Concepts

**Privacy Status:**
- **public** - Anyone can access data
- **embargo** - Private until embargo_date, then public
- **private** - Only authorized users

**Embargo Period:**
- Typically 2 years from submission
- Optional 1-year extension
- Protects researcher priority for publication

**DOI (Digital Object Identifier):**
- Assigned when dataset is published
- Enables permanent citation
- Links to published papers

**FAIR Principles:**
- **Findable** - DOI, metadata
- **Accessible** - Public after embargo
- **Interoperable** - Standardized schema
- **Reusable** - Clear licensing and attribution

---

## Example Data

```
id: 1
name: "Eastern Australia Thermochronology"
privacy_status: "public"
embargo_date: null (no embargo)
doi: "10.5281/zenodo.1234567"
created_by: "J. Smith"
```

---

**See also:**
- `samples.md` - Samples within datasets
