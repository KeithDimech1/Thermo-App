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

## Schema (Complete Fields)

| Column | Type | Description |
|--------|------|-------------|
| `id` | integer | PRIMARY KEY |
| `dataset_name` | varchar(200) | Dataset name |
| `description` | text | Description of dataset |
| **Publication Information** |
| `doi` | varchar(100) | Publication DOI (Digital Object Identifier) |
| `publication_reference` | text | Full publication reference text |
| `full_citation` | text | Complete citation (formatted) |
| `publication_year` | integer | Year of publication (e.g., 2021) |
| `publication_journal` | varchar(200) | Journal name |
| `publication_volume_pages` | varchar(100) | Volume and page numbers |
| **File Links** |
| `pdf_filename` | varchar(500) | PDF filename (local storage) |
| `pdf_url` | text | URL to PDF file (external link) |
| `supplementary_files_url` | text | URL to supplementary data repository (OSF, Zenodo, Figshare, etc.) |
| **Study Metadata** |
| `study_area` | varchar(200) | Geographic study area |
| `study_location` | text | Detailed location description |
| `laboratory` | varchar(200) | Laboratory where analysis was conducted |
| `mineral_analyzed` | varchar(100) | Primary mineral analyzed (apatite, zircon, etc.) |
| `sample_count` | integer | Number of samples in dataset |
| `age_range_min_ma` | numeric(10,2) | Minimum age (Ma) |
| `age_range_max_ma` | numeric(10,2) | Maximum age (Ma) |
| **Analysis Metadata** |
| `authors` | text[] | Array of author names |
| `collection_date` | date | Sample collection date |
| `analysis_methods` | text[] | Array of analysis methods used |
| `paper_summary` | text | Summary of paper findings |
| `key_findings` | text[] | Array of key findings |
| **FAIR Scoring** |
| `fair_score` | integer | Overall FAIR score (0-100) |
| `fair_reasoning` | text | Explanation of FAIR score |
| `extraction_report_url` | text | URL to extraction report |
| **Audit** |
| `created_at` | timestamp | When dataset created |

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
