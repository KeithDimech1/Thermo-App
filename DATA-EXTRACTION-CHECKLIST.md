# Data Extraction Checklist - AusGeochem Thermochronology App

**Purpose:** Ensure complete data extraction from papers to eliminate empty fields, nulls, and white space in the app.

**Last Updated:** 2025-11-18

---

## Overview

This checklist maps every field displayed in the app to what needs to be extracted from papers. Use this when running `/thermoextract` to ensure maximum data completeness.

---

## 1. DATASET/PUBLICATION METADATA

**Displayed on:** Datasets List, Dataset Overview Page, Dataset Card

### 🔴 CRITICAL - Always Extract
- [ ] **dataset_name** - Short identifier (e.g., "Malawi Rift 2012")
- [ ] **description** - 1-2 sentence summary of the study
- [ ] **doi** - Digital Object Identifier (e.g., "10.1130/B31234.1")
- [ ] **publication_year** - Year published
- [ ] **publication_journal** - Journal name
- [ ] **publication_volume_pages** - Volume(Issue):Pages (e.g., "124(3-4):456-478")
- [ ] **full_citation** - Complete formatted citation
- [ ] **authors** (array) - ALL author names in order
- [ ] **study_location** - Geographic region studied (e.g., "Malawi Rift, East Africa")
- [ ] **laboratory** - Lab where analysis was performed
- [ ] **mineral_analyzed** - Primary mineral (e.g., "Apatite", "Zircon")

### 🟡 HIGH PRIORITY - Extract if Available
- [ ] **pdf_url** - Link to full PDF
- [ ] **supplementary_files_url** - Link to supplementary data
- [ ] **sample_count** - Total number of samples
- [ ] **age_range_min_ma** - Youngest age in dataset
- [ ] **age_range_max_ma** - Oldest age in dataset
- [ ] **analysis_methods** (array) - Methods used (e.g., ["AFT-EDM", "AHe"])
- [ ] **key_findings** (array) - Main conclusions (3-5 bullet points)
- [ ] **analyst** - Person who performed analysis
- [ ] **collection_date** - When samples were collected

### 🟢 OPTIONAL - Extract if Mentioned
- [ ] **paper_summary** - AI-generated summary for internal use
- [ ] **study_area** - More detailed geographic description

---

## 2. SAMPLE METADATA

**Displayed on:** Sample List, Sample Detail Page

### 🔴 CRITICAL - Always Extract
- [ ] **sample_id** - Unique sample identifier from paper
- [ ] **igsn** - International Geo Sample Number (ESSENTIAL for FAIR compliance)
- [ ] **latitude** - Decimal degrees
- [ ] **longitude** - Decimal degrees
- [ ] **mineral_type** - Mineral analyzed for THIS sample (e.g., "apatite", "zircon")
- [ ] **lithology** - Rock type (e.g., "granite", "gneiss", "sandstone")

### 🟡 HIGH PRIORITY - Extract if Available
- [ ] **elevation_m** - Elevation in meters
- [ ] **sampling_location_information** - Location description
- [ ] **geodetic_datum** - Coordinate system (usually "WGS84")
- [ ] **sample_kind** - Sample type (e.g., "rock outcrop", "core", "detrital")
- [ ] **stratigraphic_unit** - Formation or unit name
- [ ] **location_name** - Place name (e.g., "Mount Mulanje")
- [ ] **location_description** - Detailed location info

### 🟢 OPTIONAL - Extract if Mentioned
- [ ] **sample_collection_method** - How collected
- [ ] **elevation_accuracy_m** - GPS precision
- [ ] **vertical_datum** - Elevation reference system
- [ ] **lat_long_precision_m** - Coordinate precision
- [ ] **depth_min_m** / **depth_max_m** - If depth sample
- [ ] **chronostratigraphic_unit_age** - Stratigraphic age
- [ ] **chronostrat_age_min_ma** / **chronostrat_age_max_ma** - Age constraints
- [ ] **collection_date_exact** - Exact collection date
- [ ] **last_known_sample_archive** - Where sample is stored
- [ ] **keywords** - Sample keywords
- [ ] **associated_references** - Related publications

---

## 3. FISSION-TRACK DATAPOINTS

**Displayed on:** Sample Detail Page (FT Analyses section)

### 3A. FT Datapoint Core Fields

**🔴 CRITICAL - Always Extract**
- [ ] **datapoint_key** - Unique identifier for this analysis session
- [ ] **sample_id** - Link to sample
- [ ] **laboratory** - Where analysis performed
- [ ] **analysis_date** - When analyzed
- [ ] **ft_method** - Method (e.g., "EDM", "LA-ICP-MS")
- [ ] **mineral_type** - Mineral (apatite/zircon)

**🟡 HIGH PRIORITY - Age Results**
- [ ] **central_age_ma** - Central age (Ma)
- [ ] **central_age_error_ma** - Central age uncertainty
- [ ] **pooled_age_ma** - Pooled age (Ma)
- [ ] **pooled_age_error_ma** - Pooled age uncertainty
- [ ] **n_grains** - Number of grains counted
- [ ] **dispersion_pct** - Age dispersion (%)
- [ ] **P_chi2_pct** - P(χ²) statistic (%)

**🟡 HIGH PRIORITY - Track Length Data**
- [ ] **mean_track_length_um** - Mean track length (μm)
- [ ] **sd_track_length_um** - Standard deviation
- [ ] **n_track_measurements** - Number of tracks measured

**🟢 OPTIONAL - Method Details**
- [ ] **ft_software** - Software used (e.g., "Trackkey", "FastTracks")
- [ ] **ft_algorithm** - Age calculation algorithm
- [ ] **zeta_yr_cm2** - Zeta calibration factor (EDM only)
- [ ] **zeta_error_yr_cm2** - Zeta uncertainty
- [ ] **dosimeter** - Dosimeter glass (e.g., "CN5", "IRMM-540")
- [ ] **irradiation_reactor** - Reactor name
- [ ] **etchant_chemical** - Etchant (e.g., "5.5M HNO₃")
- [ ] **etch_duration_seconds** - Etch time
- [ ] **etch_temperature_c** - Etch temperature
- [ ] **lambda_D** - Decay constant (³²³⁸U)
- [ ] **lambda_f** - Decay constant (spontaneous)

### 3B. FT Count Data (Grain-by-Grain)

**🔴 CRITICAL - Extract if Paper has Grain-Level Data**
For EACH grain:
- [ ] **grain_id** - Grain identifier
- [ ] **Ns** - Spontaneous track count
- [ ] **Ni** - Induced track count
- [ ] **rho_s_cm2** - Spontaneous track density
- [ ] **rho_i_cm2** - Induced track density
- [ ] **counting_area_cm2** - Area counted

**🟡 HIGH PRIORITY - Kinetic Parameters**
- [ ] **Dpar_um** - Dpar measurement (μm)
- [ ] **U_ppm** - Uranium concentration (ppm)

### 3C. FT Track Length Data (Individual Tracks)

**🟡 HIGH PRIORITY - Extract if Paper has Track-Level Data**
For EACH track:
- [ ] **grain_id** - Which grain
- [ ] **track_id** - Track identifier
- [ ] **true_length_um** - Measured length (μm)
- [ ] **track_type** - Type ("TINT", "TINCLE", "semi-track")
- [ ] **angle_to_c_axis_deg** - Crystallographic angle

---

## 4. (U-Th)/He DATAPOINTS

**Displayed on:** Sample Detail Page (He Analyses section)

### 4A. He Datapoint Core Fields

**🔴 CRITICAL - Always Extract**
- [ ] **datapoint_key** - Unique identifier for this analysis session
- [ ] **sample_id** - Link to sample
- [ ] **laboratory** - Where analysis performed
- [ ] **analysis_date** - When analyzed
- [ ] **he_analysis_method** - Method used
- [ ] **mineral_type** - Mineral (apatite/zircon)

**🟡 HIGH PRIORITY - Age Results**
- [ ] **mean_he4_corr_age_ma** - Mean corrected age (Ma)
- [ ] **se_mean_he4_corr_age_ma** - Standard error
- [ ] **n_aliquots** - Number of aliquots/grains
- [ ] **chi_square** - Chi-square statistic
- [ ] **MSWD** - Mean Square Weighted Deviation

**🟢 OPTIONAL - Method Details**
- [ ] **he_software** - Software used
- [ ] **he_measurement_mass_spec** - Mass spectrometer
- [ ] **he_analysis_gas_purity_method** - Gas purity method
- [ ] **he_alpha_stopping_power_calc** - Ft calculation method

### 4B. He Whole Grain Data (Single-Grain Ages)

**🔴 CRITICAL - Extract if Paper has Grain-Level Data**
For EACH grain:
- [ ] **grain_id** - Grain identifier
- [ ] **he4_corr_age_ma** - Corrected age (Ma)
- [ ] **he4_corr_age_error_ma** - Age uncertainty
- [ ] **eU_ppm** - Effective uranium (ppm)
- [ ] **Ft_value** - Alpha ejection correction factor

**🟡 HIGH PRIORITY - Chemistry**
- [ ] **U_ppm** - Uranium concentration
- [ ] **Th_ppm** - Thorium concentration
- [ ] **Sm_ppm** - Samarium concentration
- [ ] **He4_ncc** - Helium amount (ncc)

**🟡 HIGH PRIORITY - Dimensions**
- [ ] **length_um** - Grain length (μm)
- [ ] **width_um** - Grain width (μm)
- [ ] **mass_ug** - Grain mass (μg)

**🟢 OPTIONAL - Advanced**
- [ ] **he4_uncorr_age_ma** - Uncorrected age
- [ ] **Ft_correction_model** - Ft model used
- [ ] **grain_morphology** - Grain shape description
- [ ] **grain_quality** - Quality assessment
- [ ] **pyramidal_termination_lengths_um** - Termination dimensions

---

## 5. PEOPLE & PROVENANCE

**Displayed on:** Dataset Overview, FAIR Assessment

### 🔴 CRITICAL - Always Extract
- [ ] **Author names** - ALL authors in order
- [ ] **Analyst name** - Person who performed analysis

### 🟡 HIGH PRIORITY - Extract for FAIR Compliance
- [ ] **Author ORCIDs** - ORCID identifiers for authors
- [ ] **Analyst ORCID** - ORCID for analyst
- [ ] **Collector name(s)** - Who collected samples

### 🟢 OPTIONAL
- [ ] **Affiliation** - Institution for each person
- [ ] **Email** - Contact information

---

## 6. BATCH & QC TRACKING

**Displayed on:** (Future QC dashboards)

### 🟡 HIGH PRIORITY - Extract if Available
- [ ] **batch_name** - Batch identifier
- [ ] **reference_materials** - Standards used (e.g., "Durango apatite", "Fish Canyon zircon")
- [ ] **measured_age_ma** - Measured age of standard
- [ ] **expected_age_ma** - Known age of standard
- [ ] **irradiation_id** - Irradiation session ID
- [ ] **thermal_neutron_dose** - Neutron fluence

---

## 7. FAIR ASSESSMENT DATA

**Displayed on:** Dataset FAIR Assessment Page

### AUTO-CALCULATED (but extraction quality affects score)
- [ ] **findable_score** - Based on DOI, IGSN, metadata completeness
- [ ] **accessible_score** - Based on data availability
- [ ] **interoperable_score** - Based on standard formats
- [ ] **reusable_score** - Based on provenance, QC data
- [ ] **table4_score** - Sample metadata completeness (max 15)
- [ ] **table5_score** - FT count data completeness (max 15)
- [ ] **table6_score** - Track length data completeness (max 10)
- [ ] **table10_score** - Age calculation metadata (max 10)

---

## EXTRACTION PRIORITY MATRIX

### Tier 1: MINIMUM VIABLE DATASET
To display basic information without empty fields:
1. Dataset: name, description, authors, journal, year, DOI
2. Samples: sample_id, IGSN, lat/lon, mineral_type, lithology
3. Datapoints: datapoint_key, laboratory, central_age_ma, pooled_age_ma, n_grains

### Tier 2: FULL STANDARD COMPLIANCE (Kohn et al. 2024)
To achieve FAIR score >75:
1. All Tier 1 fields
2. Age uncertainties for ALL ages
3. Dispersion, P(χ²) statistics
4. Track length data (mean, SD, n)
5. People with ORCIDs
6. Analysis dates
7. Method details (ft_method, ft_software)

### Tier 3: COMPLETE REUSABILITY
To achieve FAIR score >90:
1. All Tier 2 fields
2. Grain-by-grain count data (Ns, Ni, rho_s, rho_i)
3. Individual track length measurements
4. Single-grain He ages and chemistry
5. Batch/QC data (reference materials)
6. Calibration factors (zeta, dosimeter)
7. Etching conditions
8. Complete sample provenance

---

## COMMON DATA GAPS TO WATCH FOR

### 🚨 Frequent Missing Fields
1. **IGSN** - Often not assigned in older papers → REQUEST or GENERATE
2. **Analysis dates** - Often not stated → Check acknowledgments, methods
3. **Laboratory** - Sometimes implied but not explicit → Extract from affiliations
4. **Geodetic datum** - Usually WGS84 but often not stated → ASSUME and note
5. **Uncertainties** - Sometimes only 1σ or 2σ stated → STANDARDIZE to 1σ
6. **Track length SD** - Sometimes only SE given → CALCULATE from SE and n

### 📊 Data in Figures/Tables Only
- Age-elevation data → Extract from figures (OCR or manual)
- Radial plots → Extract grain ages if not in tables
- Track length histograms → Extract binned data
- Spatial maps → Extract coordinates

### 🔍 Data in Supplementary Materials
- Grain-by-grain data → ALWAYS check supplementary files
- Individual track lengths → Often ONLY in supplementary
- Full sample coordinates → May be in supplementary tables
- Reference material data → Usually in supplementary

---

## VERIFICATION CHECKLIST

Before finalizing extraction, verify:

### ✅ Dataset Level
- [ ] No placeholder text in description
- [ ] All authors included (not just "et al.")
- [ ] DOI link is valid and works
- [ ] Age range matches min/max of sample ages

### ✅ Sample Level
- [ ] Every sample has lat/lon OR location description
- [ ] IGSN assigned or marked for assignment
- [ ] Mineral type consistent with analysis method
- [ ] Elevation reasonable for stated location

### ✅ Datapoint Level
- [ ] Central age ≈ pooled age (or reason for difference)
- [ ] Dispersion explained if >15%
- [ ] Track length ~12-14 μm (AFT) or flagged if unusual
- [ ] Grain count matches count data rows

### ✅ Grain-Level Data
- [ ] Sum of Ns matches total_Ns in datapoint
- [ ] Grain ages roughly consistent with central age
- [ ] No obvious data entry errors (e.g., 999, -1)

---

## EXTRACTION WORKFLOW

### Step 1: Initial Assessment (5 min)
- [ ] Scan paper for data tables
- [ ] Identify which methods used (AFT, AHe, both)
- [ ] Check for supplementary files
- [ ] Estimate data completeness tier (1, 2, or 3)

### Step 2: Metadata Extraction (10 min)
- [ ] Extract all publication info
- [ ] Create dataset entry
- [ ] Extract author list with ORCIDs if available

### Step 3: Sample Extraction (15-30 min)
- [ ] Extract all samples from tables
- [ ] Get coordinates (from table, map, or text)
- [ ] Assign/request IGSNs
- [ ] Extract lithology and descriptions

### Step 4: Analytical Data Extraction (30-60 min)
- [ ] Extract FT datapoint summary (ages, stats)
- [ ] Extract He datapoint summary
- [ ] Extract grain-by-grain data if available
- [ ] Extract track length data if available

### Step 5: QC & Validation (10 min)
- [ ] Run verification checklist
- [ ] Check for nulls in critical fields
- [ ] Validate age ranges
- [ ] Ensure consistency across tables

### Step 6: Import & Review (5 min)
- [ ] Import to database
- [ ] View in app (all pages)
- [ ] Check for white space or "null" text
- [ ] Fix any display issues

---

## TOOLS & REFERENCES

### Extraction Tools
- `/thermoextract` - AI-powered extraction command
- Adobe Acrobat - PDF table extraction
- Tabula - Extract tables from PDFs
- WebPlotDigitizer - Extract data from figures

### Reference Documents
- `documentation/definitions.md` - Field glossary
- `build-data/documentation/foundation/01-Kohn-2024-Reporting-Standards.md` - Standards reference
- `readme/INDEX.md` - Architecture & data flow

### Validation Scripts
- `scripts/db/verify-connection.sh` - Test database
- View at `http://localhost:3000` after import

---

**END OF CHECKLIST** | For questions, see `readme/INDEX.md` or `/thermoextract` documentation
