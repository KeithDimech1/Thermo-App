# Table: `ft_counts`

**Purpose:** Grain-by-grain fission-track count data (Ns, Ni, Nd, track densities)

**Last Updated:** 2025-11-16

---

## Overview

The `ft_counts` table stores individual grain track count data for fission-track dating. Each row represents counts from one grain (spontaneous tracks Ns, induced tracks Ni, dosimeter tracks Nd).

**Key Features:**
- Many grains per sample (typically 15-30)
- Raw count data (Ns, Ni, Nd)
- Calculated track densities (ρs, ρi, ρd)
- Individual grain ages

---

## Schema (Key Fields)

| Column | Type | Description |
|--------|------|-------------|
| `id` | integer | PRIMARY KEY |
| `sample_id` | varchar(50) | FK → samples |
| `grain_no` | integer | Grain number (1, 2, 3...) |
| `Ns` | integer | Spontaneous track count |
| `Ni` | integer | Induced track count |
| `Nd` | integer | Dosimeter track count |
| `rho_s` | numeric | Spontaneous track density (tracks/cm²) |
| `rho_i` | numeric | Induced track density |
| `rho_d` | numeric | Dosimeter track density |
| `U_ppm` | numeric | Uranium concentration (ppm) |
| `grain_age_ma` | numeric | Individual grain age (Ma) |

---

## Relationships

- `sample_id` → `samples(sample_id)` ON DELETE CASCADE

---

## Used By

**Database Queries:**
- `lib/db/queries.ts`
  - `getFTCountsBySample(sampleId)` - Get all grain counts for sample

**API Routes:**
- `app/api/samples/[id]/route.ts` - Returns ft_counts array

---

## Key Concepts

**Track Counts:**
- **Ns** - Spontaneous fission tracks (from U-238 in grain)
- **Ni** - Induced tracks (from neutron irradiation)
- **Nd** - Dosimeter tracks (known U concentration)

**Track Densities:**
- ρs = Ns / Area
- ρi = Ni / Area
- ρd = Nd / Area
- Used to calculate age: Age ∝ (ρs / ρi)

**Typical Values:**
- Ns: 50-500 counts per grain
- Ni: 1000-5000 counts per grain
- More counts = better precision

---

**See also:**
- `samples.md` - Sample metadata
- `ft_ages.md` - Calculated ages
