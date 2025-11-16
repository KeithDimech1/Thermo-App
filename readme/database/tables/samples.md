# Table: `samples`

**Purpose:** Core table storing geological sample metadata with IGSN, location, and lithology

**Last Updated:** 2025-11-16

---

## Overview

The `samples` table is the **primary table** in the thermochronology database. Each row represents one geological sample with unique IGSN (International Geo Sample Number), GPS coordinates, lithology, and related metadata.

**Key Features:**
- Global unique identifier (IGSN)
- WGS84 coordinates with precision tracking
- Mineral type (apatite, zircon)
- Grain counts for AFT and (U-Th)/He analyses
- References to dataset (privacy/embargo control)

---

## Schema (Key Fields)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `sample_id` | varchar(50) | PRIMARY KEY | Sample identifier |
| `dataset_id` | integer | FK → datasets | Data package reference |
| `igsn` | varchar(20) | UNIQUE | International Geo Sample Number |
| `latitude` | numeric(10,7) | - | Decimal degrees (WGS84) |
| `longitude` | numeric(10,7) | - | Decimal degrees (WGS84) |
| `elevation_m` | numeric(8,2) | - | Elevation in meters |
| `lithology` | varchar(100) | - | Rock type (granite, sandstone, etc.) |
| `mineral_type` | varchar(50) | - | apatite, zircon, etc. |
| `n_aft_grains` | integer | - | Number of grains with AFT data |
| `n_ahe_grains` | integer | - | Number of grains with (U-Th)/He data |
| `analyst` | varchar(100) | - | Person who analyzed sample |
| `analysis_method` | varchar(100) | - | EDM, LA-ICP-MS, etc. |

**Full schema:** 28 columns total (see `.schema-snapshot.sql`)

---

## Relationships

### Foreign Keys (Parents)
- `dataset_id` → `datasets(id)` - Data package with privacy controls

### Referenced By (Children)
- `ft_ages.sample_id` → this table (1:1) - Fission-track age data
- `ft_counts.sample_id` → this table (1:many) - Track count data
- `ft_track_lengths.sample_id` → this table (1:many) - Track length data
- `ahe_grain_data.sample_id` → this table (1:many) - (U-Th)/He grain data

---

## Used By (Code Files)

**Database Queries:**
- `lib/db/queries.ts` - All sample query functions
  - `getAllSamples()` - List with filtering
  - `getSampleById()` - Single sample
  - `getSampleDetail()` - With all related data
  - `searchSamplesByLocation()` - Spatial queries

**API Routes:**
- `app/api/samples/route.ts` - GET /api/samples
- `app/api/samples/[id]/route.ts` - GET /api/samples/:id
- `app/api/stats/route.ts` - Dataset statistics

**Pages:**
- `app/page.tsx` - Homepage sample list
- `app/samples/page.tsx` - Sample browser
- `app/samples/[id]/page.tsx` - Sample detail view

---

## Key Concepts

**IGSN (International Geo Sample Number):**
- Global unique identifier for geological samples
- Format: IEXXX0000 (9 characters)
- Enables cross-referencing across databases

**Coordinate System:**
- **Geodetic datum:** WGS84 (default)
- **Vertical datum:** Mean sea level (default)
- **Precision:** `lat_long_precision_m` field tracks GPS accuracy

**Grain Counts:**
- `n_aft_grains` - How many grains have fission-track data
- `n_ahe_grains` - How many grains have (U-Th)/He data
- Used for data completeness assessment

---

## Common Queries

```typescript
// Get all apatite samples
const apatiteSamples = await getAllSamples({ mineral_type: 'apatite' });

// Get samples in specific area
const samples = await searchSamplesByLocation(
  -35.0, -33.0,  // lat range
  140.0, 142.0   // lon range
);

// Get complete sample data
const sample = await getSampleDetail('AUS001');
```

---

## Notes

- **Read-only in application** - Data imported via scripts only
- **IGSN is globally unique** - Enables data sharing with other platforms
- **Location required** - All samples must have valid GPS coordinates
- **Elevation optional** - Some samples may not have elevation data

---

**See also:**
- `ft_ages.md` - Fission-track age data
- `ahe_grain_data.md` - (U-Th)/He data
- `datasets.md` - Data packages
