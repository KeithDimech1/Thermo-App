# Table: `earthbank_samples`

**Last Schema Update:** 2025-11-24 07:55:00
**Schema Version:** v2.1 (EarthBank camelCase Native)
**Row Count:** ~75 samples (as of 2025-11-18 migration)

## Purpose

Primary sample metadata table for thermochronology specimens using EarthBank FAIR-compliant camelCase field names. Each sample represents a physical rock/mineral specimen with location, lithology, and collection metadata. This is the central table that links to all analytical datapoints (FT and He).

**Key Features:**
- IGSN (International Geo Sample Number) for global sample identification
- Geographic coordinates with datum specifications
- Mineral and lithology classifications
- Dataset grouping for published papers
- Links to multiple analytical sessions (datapoints)

## Schema (Bones)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | uuid | PK, NOT NULL, DEFAULT uuid_generate_v4() | Internal UUID primary key |
| `sampleID` | varchar(255) | NOT NULL, UNIQUE | Sample identifier (e.g., "07PAC01") |
| `IGSN` | varchar(20) | UNIQUE | International Geo Sample Number (FAIR compliance) |
| `latitude` | numeric(10,6) | | Latitude in decimal degrees |
| `longitude` | numeric(10,6) | | Longitude in decimal degrees |
| `elevationM` | numeric(10,2) | | Elevation in meters |
| `geodeticDatum` | varchar(50) | | Geographic datum (e.g., "WGS84") |
| `verticalDatum` | varchar(50) | | Vertical datum for elevation |
| `mineral` | varchar(100) | | Mineral analyzed (e.g., "apatite", "zircon") |
| `mineralType` | varchar(100) | | Specific mineral variety |
| `lithology` | varchar(100) | | Rock type (e.g., "granite", "sandstone") |
| `sampleKind` | varchar(100) | | Sample category |
| `sampleAgeMa` | numeric(10,2) | | Stratigraphic age in Ma (if known) |
| `collector` | varchar(255) | | Person who collected the sample |
| `collectionDate` | date | | Date of collection |
| `collectionYear` | integer | | Year of collection |
| `datasetID` | varchar(100) | | Links to published paper/dataset |
| `nAFTGrains` | integer | | Number of apatite fission-track grains |
| `nAHeGrains` | integer | | Number of apatite (U-Th)/He grains |
| `quadrangle` | varchar(255) | | Topographic quadrangle name |
| `faultBlock` | varchar(100) | | Fault block designation |
| `igneousAgeMa` | numeric(10,2) | | Crystallization age (if igneous) |
| `igneousAgeErrorMa` | numeric(10,2) | | Error on crystallization age |
| `project` | varchar(255) | | Research project name |
| `country` | varchar(100) | | Country of origin |
| `stateProvince` | varchar(100) | | State or province |
| `locationDescription` | text | | Detailed location description |
| `createdAt` | timestamp | DEFAULT CURRENT_TIMESTAMP | Record creation timestamp |
| `updatedAt` | timestamp | DEFAULT CURRENT_TIMESTAMP | Last update timestamp |

**Indexes:**
- Primary key on `id` (UUID)
- Unique constraints on `sampleID` and `IGSN`
- B-tree indexes on: `sampleID`, `IGSN`, `datasetID`, `(latitude, longitude)`

## Relationships

### Foreign Keys
This table has no outbound foreign keys (it's a root table).

### Referenced By
- `earthbank_ftDatapoints.sampleID` → References this table (ON DELETE CASCADE)
- `earthbank_heDatapoints.sampleID` → References this table (ON DELETE CASCADE)

**Note:** Uses string-based foreign keys (`sampleID`) rather than integer IDs for human readability and FAIR compliance.

## Used By (Code Files)

**Write Operations (INSERT/UPDATE/DELETE):**
- `scripts/import-mcmillan-2024.ts` - Imports sample data from McMillan 2024 paper
- `scripts/import-mcmillan-2024-complete.ts` - Complete dataset import
- `scripts/db/transform-and-import-malawi.ts` - Malawi dataset transformation
- `scripts/db/transform-fair-csv-headers.ts` - CSV header transformation for FAIR format

**Read Operations (SELECT):**
- `lib/db/earthbank-queries.ts` - Core query functions for earthbank schema
- `app/datasets/page.tsx` - Dataset listing page
- `app/datasets/[id]/page.tsx` - Dataset detail view
- `app/api/tables/[name]/route.ts` - Generic table API endpoint
- `app/api/datasets/[id]/table-counts/route.ts` - Table record counts
- `app/api/analysis/ages/route.ts` - Age analysis API
- `lib/extraction/field-mappings.ts` - Field mapping utilities

## Business Rules

**Required Fields:**
- `sampleID` - Must be unique across all samples
- `IGSN` - Recommended for FAIR compliance (unique if provided)

**Geographic Data:**
- Coordinates stored in decimal degrees (numeric precision 10,6)
- Datum specifications required for reproducibility
- Index on `(latitude, longitude)` for spatial queries

**Analytical Counts:**
- `nAFTGrains` and `nAHeGrains` track grain counts per sample
- These are summary fields (actual grain data in related tables)

**Cascading Deletes:**
- Deleting a sample cascades to all related datapoints
- Ensures referential integrity across earthbank schema

## EarthBank Compliance

**FAIR Principles:**
- ✅ **Findable:** IGSN provides globally unique identifier
- ✅ **Accessible:** Location and collection metadata documented
- ✅ **Interoperable:** camelCase field names match EarthBank templates
- ✅ **Reusable:** Complete provenance (collector, date, project)

**Field Naming:**
- All fields use camelCase (e.g., `sampleID`, `elevationM`, `collectionDate`)
- Direct 1:1 mapping to EarthBank CSV templates
- No translation layer needed for import/export

## Recent Changes

**2025-11-18 (IDEA-014):** Table created during EarthBank schema migration
- Migrated from `samples` table (snake_case) → `earthbank_samples` (camelCase)
- 75 samples migrated with 100% data integrity
- Added UUID primary keys with `uuid_generate_v4()`
- String-based foreign keys for human readability

## Related Tables

→ [earthbank_ftDatapoints](earthbank_ftDatapoints.md) - Fission-track analytical sessions
→ [earthbank_heDatapoints](earthbank_heDatapoints.md) - (U-Th)/He analytical sessions
→ [datasets](datasets.md) - Published paper metadata (via `datasetID`)

## Critical SQL Syntax

```sql
-- ✅ CORRECT: Use double-quotes for camelCase columns
SELECT "sampleID", "IGSN", "mineral"
FROM earthbank_samples
WHERE "datasetID" = 'McMillan_2024';

-- ❌ WRONG: Unquoted will be lowercased by PostgreSQL
SELECT sampleID, IGSN FROM earthbank_samples; -- FAILS!
```

**Always use double-quotes for camelCase column names in SQL queries.**
