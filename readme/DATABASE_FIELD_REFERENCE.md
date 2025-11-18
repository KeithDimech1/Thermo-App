# Database Field Reference - Datasets Table

**Last Updated:** 2025-11-18
**Purpose:** Complete reference for all fields in the `datasets` table with datatypes

---

## Publication Information

| Field Name | Data Type | Max Length | Description | Example |
|------------|-----------|------------|-------------|---------|
| `doi` | VARCHAR | 100 | Publication DOI (Digital Object Identifier) | `https://doi.org/10.1016/j.jsg.2024.105196` |
| `full_citation` | TEXT | unlimited | Complete formatted citation | `Peak, B.A., Hourigan, J.K., Stockli, D.F., Finzel, E.S., 2021...` |
| `publication_year` | INTEGER | - | Year of publication | `2021` |
| `publication_journal` | VARCHAR | 200 | Journal name | `Journal of Structural Geology` |
| `publication_volume_pages` | VARCHAR | 100 | Volume and page numbers | `187, 105196` |
| `publication_reference` | TEXT | unlimited | Full publication reference text | (legacy field, use full_citation) |

## File Links

| Field Name | Data Type | Max Length | Description | Example |
|------------|-----------|------------|-------------|---------|
| `pdf_filename` | VARCHAR | 500 | PDF filename (local storage) | `Peak-2021-Malawi-Rift.pdf` |
| `pdf_url` | TEXT | unlimited | URL to PDF file (external link) | `https://example.com/paper.pdf` |
| `supplementary_files_url` | TEXT | unlimited | URL to supplementary data repository (OSF, Zenodo, Figshare, AusGeochem, etc.) | `https://osf.io/abc12/` |

## Study Metadata

| Field Name | Data Type | Max Length | Description | Example |
|------------|-----------|------------|-------------|---------|
| `laboratory` | VARCHAR | 200 | Laboratory where analysis was conducted | `Melbourne Thermochronology Laboratory` |
| `study_area` | VARCHAR | 200 | Geographic study area | `Central Basin, Malawi Rift` |
| `study_location` | TEXT | unlimited | Detailed location description | `Lake Malawi western margin (~11-13°S latitude)` |
| `mineral_analyzed` | VARCHAR | 100 | Primary mineral analyzed (lowercase) | `apatite`, `zircon`, `titanite` |
| `sample_count` | INTEGER | - | Number of samples in dataset | `35` |
| `age_range_min_ma` | NUMERIC | (10,2) | Minimum age in Ma | `100.50` |
| `age_range_max_ma` | NUMERIC | (10,2) | Maximum age in Ma | `325.75` |

## Analysis Metadata

| Field Name | Data Type | Max Length | Description | Example |
|------------|-----------|------------|-------------|---------|
| `authors` | TEXT[] | unlimited | Array of author names | `{Malcolm McMillan, Samuel C. Boone, Patrick Chindandali}` |
| `collection_date` | DATE | - | Sample collection date | `2019-06-15` |
| `analysis_methods` | TEXT[] | unlimited | Array of analysis methods used | `{AFT, AHe, LA-ICP-MS}` |
| `paper_summary` | TEXT | unlimited | Summary of paper findings | `This study uses thermochronology to...` |
| `key_findings` | TEXT[] | unlimited | Array of key findings | `{Finding 1, Finding 2, Finding 3}` |

## FAIR Scoring

| Field Name | Data Type | Max Length | Description | Example |
|------------|-----------|------------|-------------|---------|
| `fair_score` | INTEGER | - | Overall FAIR score (0-100) | `82` |
| `fair_reasoning` | TEXT | unlimited | Explanation of FAIR score | `Score based on completeness of...` |
| `extraction_report_url` | TEXT | unlimited | URL to extraction report | `/reports/extraction-report.md` |

## Core Fields

| Field Name | Data Type | Max Length | Description | Example |
|------------|-----------|------------|-------------|---------|
| `id` | INTEGER | - | PRIMARY KEY (auto-increment) | `1` |
| `dataset_name` | VARCHAR | 200 | Dataset name | `Malawi-Rift-Footwall-Exhumation` |
| `description` | TEXT | unlimited | Description of dataset | `Thermochronology data from...` |
| `created_at` | TIMESTAMP | - | When dataset was created | `2025-11-18 10:30:00` |

---

## Important Notes

### Field Changes (2025-11-18)
- ✅ **Added:** `supplementary_files_url` (TEXT) - Link to external data repositories
- ❌ **Removed:** `analyst` field (should be tracked at datapoint level, not dataset level)

### Current Dataset
**We only have:** Peak et al. (2021), Malawi Rift Footwall Exhumation
- Publication year: 2021
- Analyst field has been removed (not applicable at dataset level)

### Required for /thermoanalysis Extraction
When running `/thermoanalysis`, ensure these fields are extracted from the paper:
1. ✅ Full citation
2. ✅ Publication year
3. ✅ Publication journal
4. ✅ Publication volume/pages
5. ✅ DOI
6. ✅ Laboratory (check methods/acknowledgments)
7. ✅ Supplementary files URL (check "Data Availability" sections)
8. ✅ Study location
9. ✅ Mineral analyzed
10. ✅ Sample count
11. ✅ Age range

### Required for /thermoextract Upload
When running `/thermoextract`, the SQL generation will automatically extract these fields from `paper-index.md` and populate the database. No manual intervention needed if paper-index.md is complete.

---

## Example Dataset Record

```sql
INSERT INTO datasets (
  dataset_name,
  doi,
  full_citation,
  publication_year,
  publication_journal,
  publication_volume_pages,
  laboratory,
  study_location,
  mineral_analyzed,
  sample_count,
  age_range_min_ma,
  age_range_max_ma,
  supplementary_files_url,
  pdf_filename
) VALUES (
  'Peak-2021-Malawi-Rift',
  'https://doi.org/10.1016/j.jsg.2024.105196',
  'Peak, B.A., Hourigan, J.K., Stockli, D.F., Finzel, E.S., 2021. Zircon (U-Th)/He thermochronology reveals...',
  2021,
  'Journal of Structural Geology',
  '187, 105196',
  'Melbourne Thermochronology Laboratory',
  'Central Basin, Malawi Rift, East African Rift System',
  'apatite',
  35,
  100.50,
  325.75,
  'https://osf.io/abc12/',
  'Peak-2021-Malawi-Rift.pdf'
);
```

---

## Database Schema

```sql
-- View current schema
\d datasets

-- Verify field types
SELECT
  column_name,
  data_type,
  character_maximum_length,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'datasets'
ORDER BY ordinal_position;
```

---

## References

- **Schema Documentation:** `readme/database/tables/datasets.md`
- **Database ERD:** `readme/database/DATABASE_ERD.md`
- **Migration:** `scripts/db/migrations/add-supplementary-files-remove-analyst.sql`
- **/thermoanalysis Command:** `.claude/commands/thermoanalysis.md`
- **/thermoextract Command:** `.claude/commands/thermoextract.md`
