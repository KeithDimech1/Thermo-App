# Table: `grains`

**Last Updated:** 2025-11-18 06:52:00

## Purpose

Provides a **physical inventory of individual grains** across all analytical methods. Enables **cross-method data linking** - the same physical grain can be analyzed by multiple techniques (FT, He, U-Pb, trace elements).

This table is the **foundation for multi-method studies**:
- Same grain: FT age + (U-Th)/He age + U-Pb age
- Enables direct comparison of closure temperatures
- Tracks grain quality and morphology
- Links physical grains to mount locations

## Schema

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | integer | PK, NOT NULL | Unique identifier |
| `grain_id` | varchar(100) | UNIQUE, NOT NULL | **Global grain identifier** |
| `mount_id` | varchar(50) | FK → mounts.mount_id | Sample mount containing grain |
| `grain_identifier` | varchar(100) | | Local grain label (e.g., "a1", "G3") |
| `grain_morphology` | varchar(50) | | Shape: 'euhedral', 'subhedral', 'rounded', 'fragment' |
| `grain_quality` | varchar(50) | | Quality: 'excellent', 'good', 'fair', 'poor', 'broken' |
| `created_at` | timestamp | DEFAULT now() | Record creation timestamp |

## Relationships

### Foreign Keys
- `mount_id` → `mounts.mount_id` (parent mount)

### Referenced By
- **Implicitly linked** via grain_id matching in:
  - `ft_count_data.grain_id`
  - `ft_single_grain_ages.grain_id`
  - `ft_track_length_data.grain_id`
  - `he_whole_grain_data.grain_identifier`

## Used By (Code Files)

**Currently:** Not actively used (infrastructure table for future multi-method studies)

**Future applications:**
- Cross-method age comparison
- Grain selection for additional analyses
- Quality control across methods

## Business Rules

1. **Unique grain_id:** Each physical grain has one entry
2. **Grain naming convention:** Recommended: `{sample_id}_{mount_id}_{grain_number}`
   - Example: `MAL-001_M1_G05`
3. **Cross-method linking:** grain_id used to match across analytical tables
4. **Mount association:** Grains belong to one mount
5. **Quality tracking:** Documents grain condition for data interpretation

## Key Concepts

### Grain Morphology
- **Euhedral:** Well-formed crystal faces (highest quality)
- **Subhedral:** Partially formed faces (good quality)
- **Rounded:** Weathered/abraded (common in detrital samples)
- **Fragment:** Broken grain (may have incomplete data)

### Grain Quality
- **Excellent:** Perfect crystal, no inclusions, clear
- **Good:** Minor inclusions, good clarity
- **Fair:** Some inclusions or cracks, acceptable
- **Poor:** Heavy inclusions, cracks, low quality data expected
- **Broken:** Fragmented (problematic for He Ft correction)

### Multi-Method Workflow

**Same grain analyzed by multiple methods:**

1. **Initial selection:** Pick grain from sample, assign grain_id
2. **Mount preparation:** Embed in epoxy (mount_id)
3. **FT analysis:** Count tracks, measure lengths
4. **Polish/re-etch:** Prepare for He analysis
5. **He analysis:** Degas, measure He + U-Th-Sm
6. **Optional:** U-Pb dating, trace elements

**Benefits:**
- Direct age comparison (no inter-grain variability)
- Closure temperature constraints (He < FT < U-Pb)
- Single grain thermal history

## EarthBank Integration

Maps to **EarthBank grain tracking**:
- Global grain identifiers
- Mount location tracking
- Morphology and quality metadata
- Enables cross-method data synthesis

## Common Queries

```sql
-- Get all grains for a sample mount
SELECT
  grain_id,
  grain_identifier,
  grain_morphology,
  grain_quality
FROM grains
WHERE mount_id = 'MAL-001-M1'
ORDER BY grain_identifier;

-- Find grains analyzed by multiple methods
SELECT
  g.grain_id,
  g.grain_quality,
  COUNT(DISTINCT CASE WHEN fc.id IS NOT NULL THEN 'FT' END) AS has_ft,
  COUNT(DISTINCT CASE WHEN he.id IS NOT NULL THEN 'He' END) AS has_he
FROM grains g
LEFT JOIN ft_count_data fc ON g.grain_id = fc.grain_id
LEFT JOIN he_whole_grain_data he ON g.grain_id = he.grain_identifier
GROUP BY g.grain_id, g.grain_quality
HAVING COUNT(DISTINCT CASE WHEN fc.id IS NOT NULL THEN 'FT' END) > 0
   AND COUNT(DISTINCT CASE WHEN he.id IS NOT NULL THEN 'He' END) > 0;

-- Grain quality distribution for a mount
SELECT
  grain_quality,
  COUNT(*) AS n_grains
FROM grains
WHERE mount_id = 'MAL-001-M1'
GROUP BY grain_quality
ORDER BY n_grains DESC;
```

## Multi-Method Age Comparison

```sql
-- Compare FT and He ages for same grains
SELECT
  g.grain_id,
  ftages.grain_age_ma AS ft_age_ma,
  heages.corr_age_ma AS he_age_ma,
  ftages.grain_age_ma - heages.corr_age_ma AS age_diff_ma
FROM grains g
JOIN ft_single_grain_ages ftages ON g.grain_id = ftages.grain_id
JOIN he_whole_grain_data heages ON g.grain_id = heages.grain_identifier
WHERE g.mount_id = 'MAL-001-M1'
ORDER BY age_diff_ma DESC;
```

## Typical Closure Temperatures

When same grain has multiple ages:
- **U-Pb (zircon):** ~900°C
- **U-Pb (apatite):** ~450-550°C
- **FT (apatite):** ~110°C (60-120°C range)
- **He (apatite):** ~70°C (40-90°C range)
- **He (zircon):** ~180°C (140-200°C range)

**Expected:** He age ≤ FT age ≤ U-Pb age (for monotonic cooling)

## Notes

- **Infrastructure table:** Enables future multi-method integration
- **Not heavily used yet:** Most projects use single methods
- **Critical for multi-chronometer studies:** Double-dating (FT+He), triple-dating (U-Pb+FT+He)
- **Grain tracking:** Prevents re-analysis confusion
- **Quality documentation:** Helps interpret outlier ages
- **Future expansion:** Can add grain images, detailed notes, archive locations
