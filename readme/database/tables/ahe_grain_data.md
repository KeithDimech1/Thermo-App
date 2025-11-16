# Table: `ahe_grain_data`

**Purpose:** Single grain (U-Th)/He ages with chemistry (U, Th, He concentrations)

**Last Updated:** 2025-11-16

---

## Overview

The `ahe_grain_data` table stores (U-Th)/He dating results. Each row is one grain analysis including He-4 content, U-Th-Sm concentrations, Ft correction, and calculated ages.

**Key Features:**
- Multiple grains per sample (typically 3-8)
- Raw age and Ft-corrected age
- U, Th, Sm chemistry
- Grain geometry (Ft correction factor)

---

## Schema (Key Fields)

| Column | Type | Description |
|--------|------|-------------|
| `id` | integer | PRIMARY KEY |
| `sample_id` | varchar(50) | FK → samples |
| `lab_no` | varchar(50) | Laboratory grain identifier |
| `corrected_age_ma` | numeric | Ft-corrected age (Ma) |
| `corrected_age_error_ma` | numeric | 1σ error on corrected age |
| `raw_age_ma` | numeric | Raw age before Ft correction |
| `U_ppm` | numeric | Uranium concentration (ppm) |
| `Th_ppm` | numeric | Thorium concentration (ppm) |
| `Sm_ppm` | numeric | Samarium concentration (ppm) |
| `He4_nmol_g` | numeric | Helium-4 content (nmol/g) |
| `Ft_correction` | numeric | Alpha ejection correction factor |
| `eU_ppm` | numeric | Effective uranium (U + 0.235×Th) |

---

## Relationships

- `sample_id` → `samples(sample_id)` ON DELETE CASCADE

---

## Used By

**Database Queries:**
- `lib/db/queries.ts`
  - `getAHeGrainsBySample(sampleId)` - Get all (U-Th)/He grains

**API Routes:**
- `app/api/samples/[id]/route.ts` - Returns ahe_grain_data array

---

## Key Concepts

**(U-Th)/He Dating:**
- Measures He-4 from alpha decay of U-238, U-235, Th-232
- Lower closure temperature than fission-track (~70°C vs ~110°C)
- Sensitive to near-surface thermal history

**Ft Correction:**
- Alpha particles can escape grain surface (alpha ejection)
- Ft = fraction of He retained
- Corrected age = Raw age / Ft
- Depends on grain size and shape

**Effective Uranium (eU):**
- eU = U + 0.235 × Th
- Accounts for Th contribution to He production
- Th produces less He per atom than U

**Typical Ages:**
- Apatite (U-Th)/He: 5-200 Ma
- Older if cooled slowly, younger if rapid exhumation

---

**See also:**
- `samples.md` - Sample metadata
- `ft_ages.md` - Fission-track ages (higher temperature)
