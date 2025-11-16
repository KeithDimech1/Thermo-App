# Table: `ft_ages`

**Purpose:** Fission-track age determinations (pooled age, central age, dispersion)

**Last Updated:** 2025-11-16

---

## Overview

The `ft_ages` table stores calculated fission-track ages for samples. Each sample has **at most one** ft_ages record containing pooled age, central age, dispersion, and statistical parameters.

**Key Features:**
- 1:1 relationship with samples
- Pooled age (simple average)
- Central age (accounts for overdispersion)
- Dispersion measure (geological complexity)
- P(χ²) test for age homogeneity

---

## Schema (Key Fields)

| Column | Type | Description |
|--------|------|-------------|
| `id` | integer | PRIMARY KEY |
| `sample_id` | varchar(50) | FK → samples (UNIQUE) |
| `pooled_age_ma` | numeric(10,2) | Pooled age in millions of years |
| `pooled_age_error_ma` | numeric(10,2) | 1σ error on pooled age |
| `central_age_ma` | numeric(10,2) | Central age in Ma |
| `central_age_error_ma` | numeric(10,2) | 1σ error on central age |
| `dispersion_pct` | numeric(6,3) | Dispersion percentage |
| `p_chi2` | numeric(8,6) | P(χ²) probability |
| `n_grains` | integer | Number of grains dated |
| `zeta_yr_cm2` | numeric(12,6) | Zeta calibration factor |
| `dosimeter` | varchar(50) | Dosimeter glass type |

**Full schema:** 23 columns total

---

## Relationships

### Foreign Keys
- `sample_id` → `samples(sample_id)` ON DELETE CASCADE

### Check Constraints
- `ft_age_type` IN ('pooled', 'central', 'mixed')

---

## Used By

**Database Queries:**
- `lib/db/queries.ts`
  - `getFTAgesBySample(sampleId)` - Get ages for sample
  - `getSampleDetail(sampleId)` - Returns sample + ft_ages

**API Routes:**
- `app/api/samples/[id]/route.ts` - Includes ft_ages in response

**Pages:**
- `app/samples/[id]/page.tsx` - Displays age data

---

## Key Concepts

**Pooled Age:**
- Simple average of all grain ages
- Assumes all grains come from same population
- Used when dispersion is low (<5%)

**Central Age:**
- Weighted mean accounting for overdispersion
- More robust when ages scatter
- Preferred for most geological applications

**Dispersion:**
- Measure of age scatter beyond analytical uncertainty
- 0% = all grains have same age (simple thermal history)
- >5% = geological complexity (partial resetting, mixed populations)

**P(χ²):**
- Probability that ages are homogeneous
- >5% = pass (pooled age valid)
- <5% = fail (use central age)

---

## Example Data

```
sample_id: AUS001
pooled_age_ma: 85.3 ± 5.2 Ma
central_age_ma: 87.1 ± 6.8 Ma
dispersion_pct: 12.4%
p_chi2: 0.002 (fail - use central age)
n_grains: 25
```

---

**See also:**
- `samples.md` - Sample metadata
- `ft_counts.md` - Grain-by-grain track counts
- `ft_track_lengths.md` - Track length data
