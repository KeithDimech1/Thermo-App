# Table: `he_whole_grain_data`

**Last Updated:** 2025-11-18 06:51:00

## Purpose

Stores **complete grain-level (U-Th)/He data** including grain dimensions, chemistry, He measurements, and calculated ages. This is the **most detailed (U-Th)/He table** with **75+ columns** of data per grain.

Essential for:
- **Age calculation reproducibility:** All inputs preserved
- **Ft correction verification:** Grain geometry and alpha stopping distances
- **Quality control:** He blanks, U-Th-Sm measurements, error propagation
- **Research applications:** U-Th-Sm zoning, grain size effects, radiation damage

## Schema (Key Fields - 75+ total!)

### Identity & Metadata
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | integer | PK, NOT NULL | Unique identifier |
| `he_datapoint_id` | integer | FK → he_datapoints.id, NOT NULL | Parent analytical session |
| `lab_no` | varchar(50) | | Lab sample number |
| `grain_identifier` | varchar(100) | | Grain ID (e.g., "a1", "grain-01") |
| `aliquot_type` | varchar(20) | | 'single grain' or 'multi-grain' |
| `n_grains_in_aliquot` | integer | | Number of grains (usually 1) |

### Grain Morphology
| `crystal_integrity` | varchar(20) | | 'whole', 'fragment', 'broken' |
| `grain_morphology` | varchar(50) | | 'euhedral', 'subhedral', 'rounded' |
| `assumed_geometry` | varchar(50) | | 'hexagonal prism', 'sphere', 'ellipsoid' |
| `length_um` | numeric(10,2) | | **Grain length (μm)** |
| `half_width_um` | numeric(10,2) | | **Half-width (μm)** |
| `height_um` | numeric(10,2) | | Height (μm) |
| `measurement_method` | varchar(100) | | Measurement technique |

### He Measurements
| `he_ncc` | numeric(12,6) | | **Helium-4 content (ncc)** |
| `he_measurement_method` | varchar(100) | | Quadrupole MS, noble gas MS |
| `he_extraction_temperature_c` | numeric(6,2) | | Extraction temp (usually 1000-1200°C) |
| `he_blank_ncc` | numeric(12,6) | | He blank correction |
| `he_blank_error_ncc` | numeric(12,6) | | Blank uncertainty |

### Parent Isotope Chemistry
| `u_ppm` | numeric(10,3) | | **Uranium concentration (ppm)** |
| `u_ppm_error` | numeric(10,3) | | U uncertainty |
| `th_ppm` | numeric(10,3) | | **Thorium concentration (ppm)** |
| `th_ppm_error` | numeric(10,3) | | Th uncertainty |
| `sm_ppm` | numeric(10,3) | | Samarium concentration (ppm) |
| `eu_ppm` | numeric(10,3) | | **Effective uranium (eU)** |
| `u_measurement_method` | varchar(100) | | ICP-MS, isotope dilution |

### Grain Geometry & Ft Correction
| `surface_area_mm2` | numeric(10,6) | | Grain surface area |
| `volume_mm3` | numeric(10,6) | | Grain volume |
| `sa_v_ratio` | numeric(10,6) | | Surface area / volume ratio |
| `rs_um` | numeric(10,2) | | **Equivalent sphere radius (μm)** |
| `esr_sa_v_um` | numeric(10,2) | | ESR from SA/V ratio |
| `esr_ft_um` | numeric(10,2) | | ESR from Ft factor |
| `ft_correction_equation` | varchar(100) | | Ft equation (Farley 1996, Ketcham 2011) |

### Calculated Ages
| `uncorr_age_ma` | numeric(10,2) | | **Uncorrected age (Ma)** |
| `uncorr_age_error_ma` | numeric(10,2) | | Uncertainty |
| `corr_age_ma` | numeric(10,2) | | **Corrected age (Ma)** |
| `corr_age_error_ma` | numeric(10,2) | | **Uncertainty** |
| `ft` | numeric(6,4) | | **Alpha ejection correction factor (0.6-0.9)** |
| `error_type` | varchar(20) | | Error type (1σ, 2σ, SE) |

### Methodology
| `he_age_approach` | varchar(100) | | Age calculation approach |
| `lambda_u238` | varchar(30) | | U-238 decay constant |
| `lambda_th232` | varchar(30) | | Th-232 decay constant |
| `lambda_sm147` | varchar(30) | | Sm-147 decay constant |
| `created_at` | timestamp | DEFAULT now() | Record creation timestamp |

## Relationships

### Foreign Keys
- `he_datapoint_id` → `he_datapoints.id` (parent analytical session)

### Referenced By
- None (leaf table)

## Used By (Code Files)

**Import:**
- `scripts/db/import-earthbank-templates.ts` - Imports from EarthBank "HeWholeGrain" sheet

**Queries:**
- `lib/db/queries.ts:getHeGrainDataByDatapoint()` - Retrieve grain-level He data
- `lib/db/queries.ts:getAHeData()` - Query (U-Th)/He data with filters

## Business Rules

1. **Complete chemistry:** U, Th (Sm optional) required for age calculation
2. **Grain geometry:** Length, width measured (height optional)
3. **Ft correction:** Critical for accurate ages (10-40% difference)
4. **Equivalent sphere radius (Rs):** Used in Ft calculation
5. **Effective uranium (eU):** eU = U + 0.235 × Th (accounts for Th alpha production)
6. **Quality control:** He blanks, U-Th blanks, spike ratios documented

## Key Concepts

### Effective Uranium (eU)
```
eU (ppm) = U (ppm) + 0.235 × Th (ppm)
```
- Accounts for Th-232 decay producing He-4
- 0.235 = ratio of alphas from Th-232 vs U-238 decay chains
- Higher eU → higher precision (more He-4 produced)

### Alpha Ejection Correction (Ft)
- **Problem:** Alpha particles travel ~20 μm in minerals
- **Effect:** Grains lose He from outer ~20 μm shell
- **Ft factor:** Fraction of He retained (depends on grain size/geometry)
- **Typical Ft:** 0.65-0.85 for apatite, 0.75-0.90 for zircon

**Ft equations:**
- **Farley et al. (1996):** Original spherical grain approximation
- **Ketcham et al. (2011):** Improved for realistic geometries

### Grain Size Effects
- **Small grains (<60 μm):** Low Ft, large correction, higher uncertainty
- **Large grains (>100 μm):** High Ft, small correction, better precision
- **Broken grains:** Problematic (unknown original size → uncertain Ft)

## EarthBank Integration

Maps to **EarthBank HeWholeGrain sheet:**
- Complete 75+ column grain-level dataset
- All chemistry, geometry, methodology
- Enables full age recalculation
- FAIR compliant data preservation

## Common Queries

```sql
-- Get grain-level (U-Th)/He data
SELECT
  grain_identifier,
  u_ppm,
  th_ppm,
  eu_ppm,
  he_ncc,
  uncorr_age_ma,
  corr_age_ma,
  ft,
  length_um,
  half_width_um,
  rs_um
FROM he_whole_grain_data
WHERE he_datapoint_id = (
  SELECT id FROM he_datapoints WHERE sample_id = 'MAL-001'
)
ORDER BY grain_identifier;

-- Find grains with high eU (high precision)
SELECT
  grain_identifier,
  u_ppm,
  th_ppm,
  eu_ppm,
  corr_age_ma,
  corr_age_error_ma,
  100.0 * corr_age_error_ma / corr_age_ma AS rel_error_pct
FROM he_whole_grain_data
WHERE he_datapoint_id = 123
ORDER BY eu_ppm DESC;

-- Check Ft correction magnitude
SELECT
  grain_identifier,
  uncorr_age_ma,
  corr_age_ma,
  ft,
  100.0 * (corr_age_ma - uncorr_age_ma) / uncorr_age_ma AS correction_pct,
  rs_um
FROM he_whole_grain_data
WHERE he_datapoint_id = 123
ORDER BY correction_pct DESC;

-- Grain size distribution
SELECT
  AVG(length_um) AS avg_length,
  STDDEV(length_um) AS sd_length,
  MIN(length_um) AS min_length,
  MAX(length_um) AS max_length,
  AVG(rs_um) AS avg_rs
FROM he_whole_grain_data
WHERE he_datapoint_id = 123;
```

## Quality Control Checks

1. **He blank:** Should be <<1% of sample He
2. **U-Th blanks:** Should be negligible compared to grain content
3. **Grain integrity:** Whole grains preferred (fragments problematic)
4. **Ft factor:** Should be 0.6-0.9 (outside range indicates issues)
5. **Age reproducibility:** Grains should agree within ~10-20%

## Notes

- **Most comprehensive table:** 75+ columns per grain
- **FAIR gold standard:** Complete data for reproducibility
- **Ft correction essential:** Can change ages by 10-40%
- **Grain size matters:** Larger grains = better precision
- **eU calculation:** Critical for thermal modeling (radiation damage)
- **EarthBank compatible:** Direct import/export from templates
- **Replaces ahe_grain_data:** This is the modern, comprehensive format
