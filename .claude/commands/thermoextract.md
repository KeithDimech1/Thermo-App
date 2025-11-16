# Thermochronology Data Extraction Command

**Purpose:** Extract, validate, and upload thermochronology data from research papers to database

**Instructions Location:** `/Users/keithdimech/Pathway/Dev/Clair/Thermo-App/build-data/documentation/THERMO_DATA_EXTRACTION_INSTRUCTIONS.md`

---

## 🎯 Your Task

Execute the **8-step automated data extraction workflow** from the PDF provided by the user.

**Full instructions:** Read `/Users/keithdimech/Pathway/Dev/Clair/Thermo-App/build-data/documentation/THERMO_DATA_EXTRACTION_INSTRUCTIONS.md` for complete workflow details.

---

## 📋 Workflow Steps

Execute these steps in order:

### STEP 1: Paper Metadata Extraction (2-3 min)
- Extract: Title, authors, journal, year, DOI, study location
- Extract: Methods, number of samples, age range
- Validate: Required fields present, is geochronology paper
- Output: JSON metadata object

### STEP 2: FAIR Compliance Check (3-5 min)
- Validate against Kohn et al. (2024) standards
- Check: Tables 4, 5, 6, 10 required fields
- Score: EXCELLENT (90-100%), GOOD (70-89%), POOR (<70%)
- Output: FAIR compliance report with pass/fail items

### STEP 3: Data Extraction (5-10 min)
- Priority 1: Sample metadata (Table 4) → CSV
- Priority 2: Fission-track ages (Table 10) → CSV
- Priority 3: Track counts (Table 5, if available) → CSV
- Priority 4: Track lengths (Table 6, if available) → CSV
- Priority 5: (U-Th)/He data (if applicable) → CSV
- Rules: Extract ALL samples, use NULL for missing, preserve precision

### STEP 4: Geospatial & Dataset Verification (2-3 min)
- Coordinate check: Explicit lat/lon? UTM? Map only?
- Dataset link check: DOI repository? Supplementary files?
- Validation: PASS (all coords), PARTIAL (study area), FAIL (none)
- Output: Geospatial availability report

### STEP 5: Paper Summarization (3-5 min)
- Study focus (1-2 sentences)
- Study area with coordinates
- Methods and sample count
- Key findings (3 bullet points)
- Sample provenance (collector, date, location)
- Data quality summary
- Output: Brief markdown summary

### STEP 6: Data Validation (3-5 min)
- Range validation: Ages 0-4500 Ma, valid coordinates
- Statistical validation: P(χ²) in [0,1], dispersion ≥ 0
- Cross-reference validation: Unique sample IDs, foreign keys exist
- Output: Validation report with pass/fail/warn counts

### STEP 7: Database Upload (2-3 min)
- Database: `neondb` on Neon (ep-fragrant-bush-ahfxu1xq)
- Tables: datasets → samples → ft_ages → ft_counts → ft_track_lengths → ahe_grain_data
- Transaction: BEGIN → inserts → validation → COMMIT (or ROLLBACK on error)
- Output: Upload report with row counts

### STEP 8: Final Report Generation (1-2 min)
- Create comprehensive extraction report
- Include: Metadata, FAIR score, geospatial data, validation results, findings
- Save to: `/build-data/learning/thermo-papers/reports/[Paper-Name]-extraction-report.md`
- Output: Complete markdown report

---

## ✅ Quality Gates

**REJECT if:**
- ❌ Not a thermochronology/geochronology paper
- ❌ Missing title, authors, or year
- ❌ No numerical data (review paper only)

**WARN if:**
- ⚠️ FAIR score < 70% (POOR quality)
- ⚠️ Missing coordinates
- ⚠️ No dataset link ("available upon request")
- ⚠️ Validation errors found

**PROCEED if:**
- ✅ FAIR score ≥ 70%
- ✅ Data validates successfully
- ✅ At least sample locations + ages extracted

---

## 📁 File Outputs

Generate these files in `/build-data/learning/thermo-papers/`:

```
├── pdfs/
│   └── [Paper-Name].pdf                          # Input (already exists)
├── extracts/
│   └── [Paper-Name]-extract.txt                  # Raw extraction
├── reports/
│   └── [Paper-Name]-extraction-report.md         # Final report
└── data/
    ├── [Paper-Name]-samples.csv                  # For database import
    ├── [Paper-Name]-ages.csv
    ├── [Paper-Name]-counts.csv                   # If available
    └── [Paper-Name]-lengths.csv                  # If available
```

---

## 🗄️ Database Configuration

**Connection:** Already configured in `.env.local`

```
DATABASE_URL=postgresql://neondb_owner:...@ep-fragrant-bush-ahfxu1xq-pooler...
DIRECT_URL=postgresql://neondb_owner:...@ep-fragrant-bush-ahfxu1xq...
```

**Tables (6 total):**
1. `datasets` - Paper metadata
2. `samples` - Sample locations and lithology
3. `ft_ages` - Fission-track ages
4. `ft_counts` - Count data (optional)
5. `ft_track_lengths` - Track lengths (optional)
6. `ahe_grain_data` - (U-Th)/He data (optional)

**Schema:** `/scripts/db/schema-thermo.sql`

---

## 📊 FAIR Validation Checklist

**Reference:** Kohn et al. (2024) GSA Bulletin v.136, p.3891-3920

**Check against:**
- Table 4: Sample ID, lat/lon, elevation, lithology, mineral type
- Table 5: Ns, Ni/[U], counting area, method, analyst, laboratory
- Table 6: Mean length, SD, n tracks, Dpar
- Table 10: Ages, errors, age type, P(χ²), dispersion, n grains

**Score:** Count passed checks / total checks × 100%

---

## 🚀 Execution Example

**User provides PDF:**
```
User: "Extract thermo data from build-data/learning/thermo-papers/pdfs/Smith-2020-Alps.pdf"
```

**Your response format:**
```
/thermoextract mode activated

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
THERMOCHRONOLOGY DATA EXTRACTION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📄 Paper: Smith et al. (2020) - Alpine exhumation...

STEP 1: Extracting metadata... ✅
  - Authors: Smith, A.B., Johnson, C.D., et al.
  - Journal: Tectonics
  - Year: 2020
  - DOI: 10.1029/2020TC006123
  - Study: Swiss Alps exhumation
  - Samples: 28 bedrock samples
  - Age range: 5.2-45.8 Ma

STEP 2: Checking FAIR compliance... ✅ (88% - GOOD)
  - Passed: 22/25 checks
  - Failed: 3 checks (Dpar not tabulated, no public dataset, missing zeta)
  - Recommendation: Acceptable quality for import

STEP 3: Extracting data... ✅
  - Samples: 28 rows → samples.csv
  - Ages: 28 rows → ages.csv
  - Track lengths: 28 rows → lengths.csv
  - Counts: 0 rows (not tabulated)
  - AHe: 0 rows (FT-only study)

STEP 4: Verifying geospatial data... ✅
  - Coordinates: ✅ All 28 samples (±0.001° precision)
  - Dataset link: ❌ No public repository
  - Recommendation: Coordinates enable GIS integration

STEP 5: Summarizing paper... ✅
  - Study focus: Alpine exhumation rates from AFT
  - Location: Swiss Alps (46.5°N, 8.2°E)
  - Key finding: Rapid Pliocene exhumation (>500 m/Myr)

STEP 6: Validating data... ✅
  - Range checks: ✅ 28/28 samples pass
  - Statistical checks: ✅ 27/28 pass (1 warning: large error)
  - Cross-reference: ✅ No foreign key errors

STEP 7: Uploading to database... ✅
  - Transaction started
  - Dataset created: ID #3
  - Samples inserted: 28 rows
  - Ages inserted: 28 rows
  - Track lengths inserted: 28 rows
  - Total: 85 records
  - Transaction COMMITTED ✅

STEP 8: Generating report... ✅
  - Report: build-data/learning/thermo-papers/reports/Smith-2020-extraction-report.md
  - Data files: build-data/learning/thermo-papers/data/Smith-2020-*.csv

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
EXTRACTION COMPLETE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Paper: Smith et al. (2020) Swiss Alps
FAIR Score: 88% (GOOD)
Data Extracted: 85 records
Database: ✅ COMMITTED (Dataset ID #3)
Quality: ⭐⭐⭐⭐ (4/5 stars)

📄 Full report: build-data/learning/thermo-papers/reports/Smith-2020-extraction-report.md
```

---

## ⚠️ Important Notes

1. **Read full instructions first:** Before starting, read the complete workflow in THERMO_DATA_EXTRACTION_INSTRUCTIONS.md
2. **Execute sequentially:** Complete each step before moving to next
3. **Validate before upload:** Step 6 must PASS before Step 7
4. **Transaction safety:** Wrap all database operations in BEGIN/COMMIT
5. **Generate all outputs:** Create extraction report + CSV files + validation log
6. **Use existing schema:** Tables already exist - use schema-thermo.sql as reference
7. **Preserve precision:** Don't round ages/coordinates - use exact values from paper
8. **Flag missing data:** Use NULL in CSV for missing fields, note in report

---

## 🎯 Success Criteria

**Extraction considered successful if:**
- ✅ FAIR score ≥ 70%
- ✅ Data validation passes (no critical errors)
- ✅ Database upload commits successfully
- ✅ Extraction report generated
- ✅ At minimum: samples + ages extracted

**Time estimate:** 20-30 minutes total for typical paper

---

**Ready to extract!** Provide the PDF path to begin.
