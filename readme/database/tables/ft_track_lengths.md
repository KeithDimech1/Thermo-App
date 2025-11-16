# Table: `ft_track_lengths`

**Purpose:** Individual confined track length measurements for thermal history modeling

**Last Updated:** 2025-11-16

---

## Overview

The `ft_track_lengths` table stores individual measurements of confined fission-track lengths. Track lengths provide information about the thermal history of the sample (how fast it cooled).

**Key Features:**
- Many tracks per sample (typically 50-200)
- Length measurements in micrometers (μm)
- Angle to c-axis (crystal orientation)
- Used for thermal history modeling

---

## Schema (Key Fields)

| Column | Type | Description |
|--------|------|-------------|
| `id` | integer | PRIMARY KEY |
| `sample_id` | varchar(50) | FK → samples |
| `track_no` | integer | Track number (1, 2, 3...) |
| `length_um` | numeric(6,3) | Track length in micrometers |
| `angle_degrees` | numeric(5,2) | Angle to c-axis (degrees) |
| `c_axis_angle` | numeric(5,2) | Crystallographic angle |
| `Dpar` | numeric(5,3) | Etch pit diameter (proxy for composition) |

---

## Relationships

- `sample_id` → `samples(sample_id)` ON DELETE CASCADE

---

## Used By

**Database Queries:**
- `lib/db/queries.ts`
  - `getFTLengthsBySample(sampleId)` - Get all track lengths

**API Routes:**
- `app/api/samples/[id]/route.ts` - Returns ft_track_lengths array

---

## Key Concepts

**Track Length:**
- Shorter tracks = more annealing (hotter thermal history)
- Longer tracks = less annealing (cooler/faster cooling)
- Typical range: 10-16 μm

**Mean Track Length (MTL):**
- Average of all lengths
- MTL > 14 μm = fast cooling
- MTL < 12 μm = slow cooling or reheating

**Angle Correction:**
- Tracks measured at different angles appear different lengths
- c-axis angle correction normalizes to same orientation

---

**See also:**
- `samples.md` - Sample metadata
- `ft_ages.md` - Age data
