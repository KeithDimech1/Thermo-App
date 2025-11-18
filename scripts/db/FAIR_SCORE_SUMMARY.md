# FAIR Score Summary: Database Papers Comparison

**Generated:** 2025-11-18
**Database:** AusGeochem Thermochronology Platform

---

## Overview

Both papers in the database have been assessed for FAIR (Findable, Accessible, Interoperable, Reusable) data compliance using the Kohn et al. (2024) GSA Bulletin standards for thermochronology data reporting.

| Paper | Overall Score | Grade | Key Method |
|-------|---------------|-------|------------|
| **McMillan et al. (2024)** - Malawi Rift | **92/100** | **A** | Apatite Fission-Track (AFT) |
| **Peak (2021)** - Grand Canyon | **70/100** | **C** | Zircon (U-Th)/He (ZHe) |

---

## Detailed Score Breakdown

### McMillan et al. (2024) - Malawi Rift Footwall Exhumation
**Overall: 92/100 (Grade A)**

| Category | Score | Key Strengths | Minor Gaps |
|----------|-------|---------------|------------|
| **Findable** | 24/25 | ✅ IGSN assigned<br>✅ DOI minted (AusGeochem)<br>✅ Complete lat/lon | ⚠️ No regional map link |
| **Accessible** | 25/25 | ✅ Public (no embargo)<br>✅ AusGeochem web + API<br>✅ Open CSV/Excel | - |
| **Interoperable** | 23/25 | ✅ EarthBank compatible<br>✅ Kohn 2024 field names<br>✅ Controlled vocabularies | ⚠️ Some fields in methods text<br>⚠️ Kinetic params not grain-linked |
| **Reusable** | 20/25 | ✅ Complete provenance (ORCID)<br>✅ Batch/QC metadata (Durango)<br>✅ Statistical params<br>✅ Single-grain data | ⚠️ Zeta not in table<br>⚠️ No analyst ORCID<br>⚠️ No thermal model paths |

**Kohn et al. (2024) Table Scores:**
- **Table 4 (Geosample Metadata):** 15/15 - Perfect compliance
- **Table 5 (FT Count Data):** 13/15 - Missing Ni/ρi/Nd/ρd (N/A for LA-ICP-MS method)
- **Table 10 (Ages):** 8/10 - Minor gaps in zeta/λf/λD placement

**What Makes This Paper Exemplary:**
1. **IGSN Assignment:** All samples have International Geo Sample Numbers (global findability)
2. **Public Platform:** Data accessible via AusGeochem platform (web UI + API)
3. **QC Tracking:** Durango apatite reference material data included (enables quality assessment)
4. **ORCID Provenance:** Scott Boone (collector) linked by ORCID
5. **EarthBank Native:** Data extracted directly to EarthBank templates during analysis

---

### Peak (2021) - Grand Canyon Great Unconformity
**Overall: 70/100 (Grade C)**

| Category | Score | Key Strengths | Significant Gaps |
|----------|-------|---------------|------------------|
| **Findable** | 10/25 | ✅ Sample IDs clear<br>✅ DOI (OSF) | ❌ NO IGSN<br>⚠️ Lat/lon in paper, not tables |
| **Accessible** | 22/25 | ✅ OSF open access<br>✅ Gold OA paper (CC-BY)<br>✅ CSV/Excel formats | ⚠️ Metadata fragmented |
| **Interoperable** | 23/25 | ✅ EarthBank compatible<br>✅ Standard units/terms | ⚠️ Provenance in paper text |
| **Reusable** | 15/25 | ✅ Complete analytical data<br>✅ Full uncertainties<br>✅ Zonation profiles<br>✅ Ft corrections | ❌ NO IGSN<br>❌ NO batch/QC data<br>⚠️ Provenance fragmented |

**Kohn et al. (2024) Table Scores:**
- **Table 4 (Geosample Metadata):** 8/15 - Missing IGSN, collector, dates; metadata in paper
- **Table 5 (FT Count Data):** N/A - ZHe dataset (not fission-track)
- **Table 10 (Ages):** 9/10 - Excellent age data, minor provenance gaps

**What Limits This Paper's Score:**
1. **No IGSN:** Samples not globally traceable (-15 points across categories)
2. **No Batch QC:** No reference material standards reported (-5 points Reusable)
3. **Metadata Fragmentation:** Analyst, lab, lithology in paper text, not data tables (-8 points)
4. **Pre-FAIR Era:** Published 2021, predates widespread FAIR adoption

**What This Paper Does Well:**
- **50 single-grain ZHe ages** with complete chemistry (U, Th, Sm, eU, He)
- **LA-ICP-MS zonation profiles** for 7-8 grains per sample (advanced technique)
- **Full uncertainty propagation** (2σ analytical errors)
- **Thermal history models** (HeFTy inverse models, though not in structured format)
- **Open data repository** (OSF) with Excel/CSV downloads

---

## Key Differences Explaining the 22-Point Gap

### McMillan 2024 (92/100) vs Peak 2021 (70/100)

| Factor | McMillan 2024 | Peak 2021 | Impact |
|--------|---------------|-----------|--------|
| **IGSN** | ✅ All samples | ❌ None | -15 pts |
| **Batch/QC** | ✅ Durango standard | ❌ None | -5 pts |
| **Provenance** | ✅ In data tables | ⚠️ In paper text | -3 pts |
| **Platform** | ✅ AusGeochem (FAIR-native) | ⚠️ OSF (general repository) | +1 pt |
| **ORCID** | ✅ Boone ORCID linked | ❌ No ORCID | -1 pt |
| **Year** | 2024 (FAIR-era) | 2021 (pre-FAIR) | Context |

**Total Gap:** ~22-25 points explained primarily by **IGSN**, **QC data**, and **provenance tracking**

---

## Actionable Improvements for Peak (2021)

To raise the score from **70/100 (C)** to **85+/100 (B/A)**:

### Critical (Required for Grade B)
1. **Assign IGSN to all 8 samples** (+10 points)
   - Register at https://www.geosamples.org/
   - Update database with IGSN values
   - Impact: Findable +10, Reusable +5

2. **Extract metadata from paper to structured tables** (+5 points)
   - Analyst: Peak, B.A.
   - Lab: University of Colorado Boulder
   - Analysis date: ~2020 (approximate)
   - Lithology descriptions for each sample
   - Impact: Findable +3, Reusable +2

### Important (For Grade A)
3. **Add batch/reference material QC data** (+3 points, if available)
   - Contact authors for Fish Canyon zircon standard data
   - Document analytical session quality control
   - Impact: Reusable +3

4. **Lookup ORCID for authors** (+2 points)
   - Peak, B.A.
   - Flowers, R.M.
   - Macdonald, F.A.
   - Cottle, J.M.
   - Impact: Findable +1, Reusable +1

**Potential Final Score:** 85-90/100 (Grade B+/A-)

---

## Grading Scale (Kohn et al. 2024)

| Grade | Score Range | Interpretation |
|-------|-------------|----------------|
| **A** | 90-100 | Excellent FAIR compliance - publication-ready |
| **B** | 80-89 | Good compliance - minor gaps acceptable |
| **C** | 70-79 | Fair compliance - moderate gaps, data usable |
| **D** | 60-69 | Poor compliance - significant gaps |
| **F** | <60 | Failing - major compliance issues |

---

## Database Implementation

### Table Schema
```sql
CREATE TABLE fair_score_breakdown (
  id SERIAL PRIMARY KEY,
  dataset_id INTEGER UNIQUE REFERENCES datasets(id),

  -- Kohn et al. (2024) Table-level scores
  table4_score INTEGER CHECK (0-15),  -- Geosample Metadata
  table5_score INTEGER CHECK (0-15),  -- FT Count Data
  table6_score INTEGER CHECK (0-10),  -- Track Lengths
  table10_score INTEGER CHECK (0-10), -- Ages

  -- FAIR category scores (25 points each)
  findable_score INTEGER CHECK (0-25),
  accessible_score INTEGER CHECK (0-25),
  interoperable_score INTEGER CHECK (0-25),
  reusable_score INTEGER CHECK (0-25),

  -- Overall
  total_score INTEGER CHECK (0-100),
  grade VARCHAR(2),

  -- Audit
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Query Examples

**Get full FAIR breakdown for a dataset:**
```sql
SELECT
  d.dataset_name,
  f.total_score,
  f.grade,
  f.findable_score AS findable,
  f.findable_reasoning,
  f.accessible_score AS accessible,
  f.accessible_reasoning,
  f.interoperable_score AS interoperable,
  f.interoperable_reasoning,
  f.reusable_score AS reusable,
  f.reusable_reasoning
FROM datasets d
JOIN fair_score_breakdown f ON d.id = f.dataset_id
WHERE d.id = 2;  -- Peak 2021
```

**Compare FAIR scores across datasets:**
```sql
SELECT
  d.dataset_name,
  f.total_score || '/100 (' || f.grade || ')' AS overall,
  f.findable_score || '/25' AS findable,
  f.accessible_score || '/25' AS accessible,
  f.interoperable_score || '/25' AS interoperable,
  f.reusable_score || '/25' AS reusable
FROM datasets d
LEFT JOIN fair_score_breakdown f ON d.id = f.dataset_id
ORDER BY f.total_score DESC NULLS LAST;
```

**Find datasets with missing IGSN:**
```sql
SELECT
  d.dataset_name,
  f.total_score,
  f.findable_score,
  COUNT(s.sample_id) AS total_samples,
  COUNT(s.igsn) AS samples_with_igsn
FROM datasets d
JOIN fair_score_breakdown f ON d.id = f.dataset_id
JOIN samples s ON d.id = s.dataset_id
WHERE f.findable_reasoning LIKE '%NO IGSN%'
GROUP BY d.dataset_name, f.total_score, f.findable_score;
```

---

## References

**FAIR Data Standards:**
- Kohn, B.P., Ketcham, R.A., Vermeesch, P., Boone, S.C., et al., 2024. Interpreting and reporting fission-track chronological data. GSA Bulletin, v. 136, no. 9/10, p. 3891–3920. https://doi.org/10.1130/B37245.1

- Nixon, A.L., Boone, S.C., Gréau, Y., et al., 2025. Volcanoes to vugs: Demonstrating a FAIR geochemistry framework with a diverse application of major and trace element data through the AuScope EarthBank platform. Chemical Geology, v. 696, 123092.

**Papers Assessed:**
- McMillan, M., Boone, S.C., Chindandali, P., Kohn, B., Gleadow, A., 2024. 4D fault evolution revealed by footwall exhumation modelling: A natural experiment in the Malawi rift. Journal of Structural Geology 187, 105196. https://doi.org/10.1016/j.jsg.2024.105196

- Peak, B.A., Flowers, R.M., Macdonald, F.A., Cottle, J.M., 2021. Zircon (U-Th)/He thermochronology reveals pre-Great Unconformity paleotopography in the Grand Canyon region, USA. Geology, v. 49, no. 12, p. 1462–1466. https://doi.org/10.1130/G49116.1

---

**Last Updated:** 2025-11-18
**Next Review:** When new datasets are added to the database
