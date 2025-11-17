# Table: `mounts`

**Last Updated:** 2025-11-18 06:53:00

## Purpose

Tracks **epoxy sample mounts** used in thermochronology sample preparation. A mount is a physical epoxy disk containing mineral grains that are polished and etched for analysis.

Critical for:
- **Batch processing:** Multiple samples in one mount
- **Etching documentation:** Etch conditions (acid, temperature, duration)
- **Re-analysis tracking:** Same mount can be re-etched, re-analyzed
- **Quality control:** Etching affects track revelation and Dpar

## Schema

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | integer | PK, NOT NULL | Unique identifier |
| `mount_id` | varchar(50) | UNIQUE, NOT NULL | **Mount identifier (e.g., "M-2024-001")** |
| `mount_name` | varchar(200) | | Descriptive name |
| `mount_date` | date | | Date mount was prepared |
| `sample_id` | varchar(50) | FK → samples.sample_id | Primary sample (if single-sample mount) |
| `etchant_chemical` | varchar(100) | | Etchant used (e.g., "5.5M HNO₃") |
| `etch_duration_seconds` | integer | | Etch time in seconds (typically 20-40s for apatite) |
| `etch_temperature_c` | numeric(5,2) | | Etch temperature (typically 21°C for apatite) |
| `created_at` | timestamp | DEFAULT now() | Record creation timestamp |

## Relationships

### Foreign Keys
- `sample_id` → `samples.sample_id` (primary sample)

### Referenced By
- `grains.mount_id` → This table (grains in mount)
- `ft_binned_length_data.mount_id` → This table
- `ft_single_grain_ages.mount_id` → This table
- `ft_track_length_data.mount_id` → This table
- `he_datapoints.mount_id` → This table

## Used By (Code Files)

**Currently:** Not directly queried (infrastructure table)

**Future use:** Mount inventory, etching QC, re-analysis tracking

## Business Rules

1. **Unique mount_id:** Each physical mount has one record
2. **Multiple samples:** One mount can contain multiple samples (but sample_id stores primary)
3. **Etching documentation:** Critical for reproducibility (affects Dpar, track revelation)
4. **Multiple etching:** Same mount can be re-etched (create new mount_id or add etch history)
5. **Standard etching (apatite):**
   - 5.5M HNO₃ (nitric acid)
   - 21°C ± 1°C
   - 20 seconds (standard protocol - Donelick et al. 2005)

## Key Concepts

### Etching Process
1. **Polish mount:** Create smooth surface (0.25 μm diamond)
2. **Clean:** Remove polishing debris
3. **Etch:** Immerse in acid to reveal tracks
4. **Rinse:** Stop etching, clean mount
5. **Dry:** Prepare for microscopy

### Etching Variables
- **Acid concentration:** Higher = faster etching
- **Temperature:** Higher = faster etching
- **Duration:** Longer = larger track etch pits
- **Mineral type:** Apatite (20s), zircon (different protocol)

### Dpar Dependence on Etching
- **Under-etched:** Small Dpar, tracks hard to see
- **Optimal:** Dpar ~2-3 μm for apatite
- **Over-etched:** Large Dpar, track detail lost

## Etching Standards

**Apatite (Standard - Donelick et al. 2005):**
- 5.5M HNO₃
- 21°C
- 20 seconds

**Zircon:**
- KOH + NaOH eutectic (or HF-HCl)
- Variable time/temperature protocols
- Much more variable than apatite

## EarthBank Integration

Maps to **EarthBank mount metadata:**
- Mount identifiers
- Etching conditions
- Preparation dates
- Enables reproducibility of etching protocols

## Common Queries

```sql
-- Get etching conditions for a mount
SELECT
  mount_id,
  etchant_chemical,
  etch_temperature_c,
  etch_duration_seconds,
  mount_date
FROM mounts
WHERE mount_id = 'M-2024-001';

-- Find mounts with non-standard etching (for quality control)
SELECT
  mount_id,
  etchant_chemical,
  etch_temperature_c,
  etch_duration_seconds
FROM mounts
WHERE etch_temperature_c NOT BETWEEN 20 AND 22
   OR etch_duration_seconds NOT BETWEEN 18 AND 22;

-- Get all samples in a mount
SELECT
  m.mount_id,
  m.mount_name,
  g.grain_id,
  s.sample_id
FROM mounts m
LEFT JOIN grains g ON m.mount_id = g.mount_id
LEFT JOIN samples s ON g.grain_id LIKE s.sample_id || '%'
WHERE m.mount_id = 'M-2024-001';
```

## Mount Naming Conventions

**Recommended format:**
- Lab code + year + sequential number
- Example: `UCL-2024-045`

**Alternative formats:**
- `M-{date}-{number}` (e.g., `M-20241115-001`)
- `{sample_id}-M{number}` (e.g., `MAL-001-M1`)

## Quality Control

**Etching checks:**
1. **Temperature control:** ±1°C of target (use water bath)
2. **Time precision:** ±1 second (use timer)
3. **Acid concentration:** Check periodically (titration)
4. **Reproducibility:** Etch standards with samples (Durango apatite)

**Signs of poor etching:**
- Tracks not visible or poorly revealed
- Dpar too small (<1.5 μm) or too large (>4 μm)
- Inconsistent track revelation across mount

## Re-etching Protocol

If initial etch is poor:
1. **Re-polish:** Remove old etch pits
2. **Clean thoroughly**
3. **Re-etch:** Adjust conditions if needed
4. **Create new mount record:** Document re-etch

**Note:** Track lengths may change with etching - always document conditions!

## Notes

- **Critical metadata:** Etching affects Dpar, track revelation
- **Reproducibility:** Well-documented etching enables method replication
- **Quality control:** Mount-level tracking of etching conditions
- **Multi-sample mounts:** Common for batch processing (cost-effective)
- **Archive:** Mounts can be stored for years (re-analysis possible)
- **FAIR compliance:** Complete etching documentation required
