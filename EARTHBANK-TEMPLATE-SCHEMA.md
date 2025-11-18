# EarthBank Template Schema Documentation

**Generated:** 2025-11-18
**Source Files:**
- Sample.template.v2025-04-16.xlsx
- FTDatapoint.template.v2024-11-11.xlsx
- HeDatapoint.template.v2024-11-11.xlsx

**Location:** `/Users/keithdimech/Pathway/Dev/Clair/Thermo-App/build-data/learning/archive/earthbanktemplates/`

---

## Table of Contents

1. [Sample Template](#sample-template)
2. [Fission Track (FT) Datapoint Template](#fission-track-ft-datapoint-template)
3. [Helium (He) Datapoint Template](#helium-he-datapoint-template)
4. [Controlled Vocabularies (Lookup Tables)](#controlled-vocabularies)

---

## Sample Template

**File:** `Sample.template.v2025-04-16.xlsx`

### Sheet Structure

- **Samples** - Main data entry sheet (30 columns)
- **Sample Props** - Extended properties (key-value pairs)
- **Column Descriptions** - Field documentation
- **Lookup tables** - Controlled vocabularies

### Sample Field Definitions

The Sample template does not include a "Field Definitions" sheet with database technical names. The schema is defined by the column headers in the "Samples" sheet.

#### Main Samples Sheet Columns (30 fields)

1. **Sample ID** - ID of sample, usually assigned by sample collector (Must be unique within whole AusGeochem)
2. **IGSN** - An International Generic Sample Number; to be assigned by the collector, analyst or, in cases where no IGSN exists at the time of data upload, please create using IGSN minting tool on AusGeochem
3. **Sample Material Type** - The type of sample material; Selectable from list (rock, Gas, soil, loose sediment, fossil, mineral, vein, ore, etc.)
4. **Collection Method** - The sample collection method; Selectable from list (e.g. grab, core, drilling, cutting, etc.)
5. **Lithology/Mineral** - The composition or type of rock sample, e.g. sandstone, limestone, chert, coal. Selectable from list. Supported by mindat.org
6. **Additional Sample Info** - Additional information about sample (kind, collection method, lithology/mineral)
7. **Latitude** - A geographic coordinate that specifies the north–south position of a point on the Earth's surface (in decimal degrees)
8. **Longitude** - A geographic coordinate that specifies the east–west position of a point on the Earth's surface (in decimal degrees)
9. **Coordinate Precision** - The precision of the reported latitude and longitude, determined from GPS or estimated on the method and vintage of a lat/long determination
10. **Elevation** - Elevation of (sampling) location, at ground level (above mean sea level) (auto determined for surface samples from lat/long, if not defined)
11. **Min Depth** - Minimum depth of (rock) sample when collected from below the surface; If sample collected from surface automatically 0m; important for core, well, or dredge samples
12. **Max Depth** - Maximum depth of (rock) sample when collected from below the surface; If sample collected from surface automatically 0m; important for core, well, or dredge samples
13. **Depth Accuracy** - Accuracy of depth measurement (m)
14. **Elevation Notes** - Additional information on the elevation measurement or value e.g. accuracy or slope steepness, if necessary
15. **Location Type** - Type of sampling location; Selectable from list (e.g. outcrop, well location, etc.)
16. **Location Name** - Name of sampling location, insert by the collector
17. **Location Description** - Additional information about the sample location, such as outcrop description or physiographic feature
18. **Geological Unit** - Geological name of the unit from which sample was collected. AusGeochem uses the Geoscience Australia geological unit database for localities within Australia. In cases where samples are from outside Australia, users can manually enter the unit name
19. **Min Stratigraphic Age** - Chronostratigraphic age of the unit sample was collected from
20. **Max Stratigraphic Age** - Chronostratigraphic age of the unit sample was collected from
21. **Stratigraphic Info** - any stratigraphic-related information if necessary
22. **Collection Date Min** - The minimum date sample was collected. The range of dates is only required if the exact sample collection date is unknown
23. **Collection Date Max** - The maximum date sample was collected. The range of dates is only required if the exact sample collection date is unknown
24. **Involved People** - The person who performed a particular task associated with the sample; Selectable from list; If not in the list create (here)
25. **Person Role** - Role of person in sample collection and/or analysis, selectable from list (e.g. collector, chief investigator, investigator, analyst, laboratory technician, co-author, etc.)
26. **Sample Archive** - Last known location where sample material is archived; Selectable from list (e.g. Geoscience Australia, etc.); If not in the list create (here)
27. **Archive Notes** - Additional information about the sample archive
28. **Funding/Grant ID** - Funding/grant ID
29. **Reference DOI** - Reference DOI (if one exists)
30. **Keywords** - A keyword to mark your data. Multiple keywords can be separated by comma (e.g. keywordA, keywordB, keywordC)

#### Sample Props Sheet

For extended properties (key-value pairs):
- **sampleName** - Links to sample in Samples sheet
- **propName** - Property name
- **propValue** - Property value

### Sample Lookup Tables

- **Sample Kind** (16 values): Ore, Xenolith, Regolith, Meteorite, Organic material, Loose sediment, Soil, Fluid, Fossil, Mineral, etc.
- **Sampling Method** (11 values): Cuttings, Core, Dredge, Unknown, Auger, Other, Hand Sample, Grab, vial, thin section, etc.
- **Lithology** (10,184 values): Comprehensive list from mindat.org including Unknown, A-type granite, Abellaite, etc.
- **Location Kind** (9 values): Unknown, Outcrop location, Section location, Other, Borehole/well, Mine (open-pit), Mine (underground), Boulder, Mine
- **Person Role** (11 values): Unknown, Laboratory manager, Laboratory technician, Chief investigator, Principal investigator, Investigator, Collector, Analyst, First author, Co-author, etc.
- **Last Known Sample Archive** (37 values): Unknown, Natural History Museum of London, Mineral Resources Tasmania, Geological Survey of Victoria, etc.
- **Tectonic Setting** (31 values): Unknown, Abyssal Hill, Back-arc Basin, Continental Rift, Convergent Margin, etc.

---

## Fission Track (FT) Datapoint Template

**File:** `FTDatapoint.template.v2024-11-11.xlsx`

### Sheet Structure

- **FT Datapoints** - Main datapoint metadata (70 columns)
- **FTCountData** - Per-grain counting data (15 columns)
- **FTSingleGrain** - Single grain analytical results (15 columns)
- **FTLengthData** - Individual track length measurements (23 columns)
- **FTBinnedLengthData** - Binned track length distributions (31 columns)
- **Datapoint Props** - Extended properties (key-value pairs)
- **Lookup Tables** - Controlled vocabularies
- **Field Definitions - FTDataPoint** - Schema documentation
- **Field Definitions - FTCountData** - Schema documentation
- **Field Definitions - FTSingleGra** - Schema documentation
- **Field Definitions - FTLengthDat** - Schema documentation
- **Field Definitions - FTBinnedLen** - Schema documentation

---

### FT Datapoints Sheet (70 fields)

#### Identification & Context (11 fields)

| Database Name | Datatype | Display Name |
|--------------|----------|--------------|
| `[key]` | String | DataPoint Name (used to reference from other sheets) |
| `sampleID` | String | Sample Name |
| `referenceMaterial` | List | Reference Material |
| `[description]` | Text | Brief description of sample |
| `literature` | List | Associated Literature |
| `laboratory` | List | Laboratory |
| `analyst` | List | Analyst |
| `[funding]` | Text | Funding/grant |
| `analysisDate` | Time | Analysis Date-Time |
| `mineral` | List | Mineral Type |
| `batchID` | String | Batch ID (if applicable) |

#### Analytical Method (6 fields)

| Database Name | Datatype | Display Name |
|--------------|----------|--------------|
| `ftCharacterisationMethod` | List | FT Characterisation Method |
| `ftAnalyticalSoftware` | List | FT Analytical Software |
| `ftAnalyticalAlgorithm` | List | FT Analytical Algorithm |
| `ftUDeterminationTechnique` | List | FT U Determination Technique |
| `etchant` | List | Etchant |
| `etchingTime` | Float | Etchant Time |
| `etchingTemp` | Float | Etchant Temperature |
| `cfIrradiation` | Boolean | Cf Irradiation Y/N? |

#### Track Density Measurements (8 fields)

| Database Name | Datatype | Display Name |
|--------------|----------|--------------|
| `noOfGrains` | Integer | No. of Grains |
| `area` | Float | Area |
| `rhod` | Float | ρd (dosimeter track density) |
| `nd` | Integer | Nd (total dosimeter tracks) |
| `rhoS` | Float | ρs (spontaneous track density) |
| `ns` | Integer | Ns (total spontaneous tracks) |
| `rhoi` | Float | ρi (induced track density) |
| `ni` | Integer | Ni (total induced tracks) |
| `dosimeter` | List | Dosimeter |

#### Uranium & Composition (4 fields)

| Database Name | Datatype | Display Name |
|--------------|----------|--------------|
| `uCont` | Float | Mean U Content |
| `uStandardDeviation` | Float | U Standard Deviation |
| `uCaRatio` | Float | Mean U/Ca Ratio |
| `uCaRatioStandardDeviation` | Float | U/Ca Ratio Standard Deviation |

#### Etch Pit Measurements (8 fields)

| Database Name | Datatype | Display Name |
|--------------|----------|--------------|
| `dPar` | Float | Mean Dpar (parallel to c-axis) |
| `dParStandardError` | Float | Dpar Standard Error |
| `dParNumTotal` | Integer | Total Number of Dpar Measurements |
| `dPer` | Float | Mean Dper (perpendicular to c-axis) |
| `dPerStandardError` | Float | Dper Standard Error |
| `dPerNumTotal` | Integer | Total Number of Dper Measurements |

#### Annealing Parameters (5 fields)

| Database Name | Datatype | Display Name |
|--------------|----------|--------------|
| `rmr0` | Float | Mean rmr0 |
| `rmr0StandardDeviation` | Float | rmr0 Standard Deviation |
| `rmr0Equation` | List | rmr0 Equation |
| `kParameter` | Float | Mean κ (kappa parameter) |
| `kParameterStandardDeviation` | Float | κ Standard Deviation |

#### Age Results (12 fields)

| Database Name | Datatype | Display Name |
|--------------|----------|--------------|
| `meanAgeMa` | Float | FT Mean Age |
| `meanUncertaintyMa` | Float | FT Mean Age Uncertainty |
| `centralAgeMa` | Float | FT Central Age |
| `centralAgeUncertaintyMa` | Float | FT Central Age Uncertainty |
| `pooledAgeMa` | Float | FT Pooled Age |
| `pooledAgeUncertaintyMa` | Float | FT Pooled Age Uncertainty |
| `popAgeMa` | Float | FT Population Age |
| `popAgeUncertaintyMa` | Float | FT Population Age Uncertainty |
| `ageUncertaintyType` | List | Age Uncertainty Type |
| `chi2pct` | Float | P(χ²) |
| `dispersion` | Float | Dispersion |
| `ageComment` | Text | Comment |

#### Track Length Data (4 fields)

| Database Name | Datatype | Display Name |
|--------------|----------|--------------|
| `mtl` | Float | MTL (Mean Track Length) |
| `nTracks` | Integer | No. Tracks |
| `mtl1se` | Float | MTL Standard Error |
| `stdDevMu` | Float | MTL Standard Deviation |

#### Age Calculation Constants (10 fields)

| Database Name | Datatype | Display Name |
|--------------|----------|--------------|
| `ftAgeEquation` | List | FT Age Equation |
| `zetaCalibration` | Float | ζ Calibration |
| `zetaUncertainty` | Float | ζ Calibration Uncertainty |
| `zetaUncertaintyType` | List | ζ Uncertainty Type |
| `etchableRange` | Float | R (etchable fission track range) |
| `lambda` | List | λ (total 238U decay constant) |
| `lambdaF` | List | λf (fission decay constant) |
| `qEfficiencyFactor` | Float | q (detection efficiency factor) |
| `irradiationReactor` | List | Irradiation Reactor |
| `neutronDose` | Integer | Thermal Neutron Dose |

---

### FTCountData Sheet (15 fields)

Per-grain fission track counting data:

| Database Name | Datatype | Display Name |
|--------------|----------|--------------|
| `name` | String | DataPoint Name (references FT Datapoints) |
| `grainName` | String | Grain ID |
| `area` | Float | Area |
| `rhoS` | Float | ρs (spontaneous track density) |
| `ns` | Integer | Ns (spontaneous tracks) |
| `rhoi` | Float | ρi (induced track density) |
| `ni` | Integer | Ni (induced tracks) |
| `dPar` | Float | Dpar |
| `dParUncertainty` | Float | Dpar Uncertainty |
| `dParNum` | Integer | Number of Dpar Measurements |
| `dPer` | Float | Dper |
| `dPerUncertainty` | Float | Dper Uncertainty |
| `dPerNum` | Integer | Number of Dper Measurements |
| `uncertaintyType` | List | Uncertainty Type |
| `comment` | Text | Comment |

---

### FTSingleGrain Sheet (15 fields)

Single grain age determinations:

| Database Name | Datatype | Display Name |
|--------------|----------|--------------|
| `name` | String | DataPoint Name |
| `mountID` | String | Mount ID (FT Count) |
| `grainName` | String | Grain ID |
| `etchingTime` | Float | Etching Time |
| `uCont` | Float | U Content |
| `uUncertainty` | Float | U Uncertainty |
| `uCaRatio` | Float | U/Ca Ratio |
| `uCaRatioUncertainty` | Float | U/Ca Ratio Uncertainty |
| `uUncertaintyType` | List | U Uncertainty Type |
| `ageMa` | Float | FT Age |
| `ageUncertaintyMa` | Float | FT Age Uncertainty |
| `ageUncertaintyType` | List | Age Uncertainty Type |
| `rmr0` | Float | rmr0 |
| `kParameter` | Float | κ |
| `comment` | Text | Comment |

---

### FTLengthData Sheet (23 fields)

Individual confined track length measurements:

| Database Name | Datatype | Display Name |
|--------------|----------|--------------|
| `name` | String | DataPoint Name |
| `mountID` | String | Mount ID (FT Lengths) |
| `etchingTime` | Float | Etchant Time |
| `grainName` | String | Grain ID |
| `trackID` | String | Track ID |
| `trackType` | List | Track Type |
| `apparentLength` | Float | Apparent Length |
| `correctedZDepth` | Float | Corrected z-Depth |
| `trackLength` | Float | Track Length |
| `azimuth` | Float | Azimuth |
| `dip` | Float | Dip |
| `cAxisAngle` | Float | c-Axis Angle |
| `cAxisCorrectedLength` | Float | c-Axis Angle Corrected Length |
| `dPar` | Float | Dpar |
| `dParUncertainty` | Float | Dpar Uncertainty |
| `dParNum` | Integer | Number of Dpar Measurements |
| `dPer` | Float | Dper |
| `dPerUncertainty` | Float | Dper Uncertainty |
| `dPerNum` | Integer | Number of Dper Measurements |
| `uncertaintyType` | List | Uncertainty Type |
| `rmr0` | Float | rmr0 |
| `kParameter` | Float | κ |
| `comment` | Text | Comment |

---

### FTBinnedLengthData Sheet (31 fields)

Binned track length distributions:

| Database Name | Datatype | Display Name |
|--------------|----------|--------------|
| `name` | String | DataPoint Name |
| `mountID` | String | Mount ID (FT Lengths) |
| `etchingTime` | Float | Etchant Time |
| `i0x1` | Integer | 0-1 μm Bin |
| `i1x2` | Integer | 1-2 μm Bin |
| `i2x3` | Integer | 2-3 μm Bin |
| `i3x4` | Integer | 3-4 μm Bin |
| `i4x5` | Integer | 4-5 μm Bin |
| `i5x6` | Integer | 5-6 μm Bin |
| `i6x7` | Integer | 6-7 μm Bin |
| `i7x8` | Integer | 7-8 μm Bin |
| `i8x9` | Integer | 8-9 μm Bin |
| `i9x10` | Integer | 9-10 μm Bin |
| `i10x11` | Integer | 10-11 μm Bin |
| `i11x12` | Integer | 11-12 μm Bin |
| `i12x13` | Integer | 12-13 μm Bin |
| `i13x14` | Integer | 13-14 μm Bin |
| `i14x15` | Integer | 14-15 μm Bin |
| `i15x16` | Integer | 15-16 μm Bin |
| `i16x17` | Integer | 16-17 μm Bin |
| `i17x18` | Integer | 17-18 μm Bin |
| `i18x19` | Integer | 18-19 μm Bin |
| `i19x20` | Integer | 19-20 μm Bin |
| `dParAvg` | Float | Dpar |
| `dParError` | Float | Dpar Uncertainty |
| `dParNumTotal` | Integer | Number of Dpar Measurements |
| `dPer` | Float | Dper |
| `dPerError` | Float | Dper Uncertainty |
| `dPerNumTotal` | Integer | Number of Dper Measurements |
| `uncertaintyType` | List | Uncertainty Type |
| `comment` | Text | Comment |

---

## Helium (He) Datapoint Template

**File:** `HeDatapoint.template.v2024-11-11.xlsx`

### Sheet Structure

- **He Datapoints** - Main datapoint metadata (46 columns)
- **HeWholeGrain** - Whole grain (U-Th)/He data (75 columns)
- **HeInSitu** - In-situ (U-Th)/He data (46 columns)
- **Datapoint Props** - Extended properties (key-value pairs)
- **Lookup Tables** - Controlled vocabularies
- **Field Definitions - HeDataPoint** - Schema documentation
- **Field Definitions - HeWholeGrai** - Schema documentation
- **Field Definitions - HeInSitu** - Schema documentation

---

### He Datapoints Sheet (46 fields)

#### Identification & Context (12 fields)

| Database Name | Datatype | Display Name |
|--------------|----------|--------------|
| `datapointName` | String | DataPoint Name |
| `datapackageName` | String | Datapackage |
| `sampleID` | String | Sample Name |
| `referenceMaterial` | List | Reference Material |
| `[description]` | Text | Brief description |
| `literature` | List | Associated Literature |
| `laboratory` | List | Laboratory |
| `analyst` | List | Analyst |
| `[funding]` | Text | Funding/grant |
| `analysisDate` | Time | Analysis Date-Time |
| `mineral` | List | Mineral Type |
| `mountID` | String | Mount ID (if appropriate) |
| `batchID` | String | Batch ID (if applicable) |

#### Sample Statistics (1 field)

| Database Name | Datatype | Display Name |
|--------------|----------|--------------|
| `numAliquots` | Integer | Number of Aliquots |

#### Uncorrected Age Results (9 fields)

| Database Name | Datatype | Display Name |
|--------------|----------|--------------|
| `meanUncorrectedHeAge` | Float | Mean Uncorrected He Age |
| `meanUncorrectedHeAgeUncertainty` | Float | Mean Uncorrected He Age Uncertainty |
| `meanUncorrectedHeAgeUncertaintyType` | List | Mean Uncorrected Age Uncertainty Type |
| `weightedMeanUncorrectedHeAge` | Float | Weighted Uncorrected Mean He Age |
| `weightedMeanUncorrectedHeAgeUncertainty` | Float | Weighted Uncorrected Mean He Age Uncertainty |
| `weightedMeanUncorrectedHeAgeUncertaintyType` | List | Weighted Uncorrected Mean Age Uncertainty Type |
| `mswdUncorrected` | Float | MSWD of Weighted Mean Uncorrected Age |
| `confidenceInterval95Uncorrected` | Float | Weighted Mean Uncorrected Age 95% Confidence Interval |
| `chi2pctUncorrected` | Float | Weighted Mean Uncorrected Age P(χ²) |
| `iqrUncorrected` | Float | Uncorrected Age Interquartile Range (IQR) |

#### Corrected Age Results (9 fields)

| Database Name | Datatype | Display Name |
|--------------|----------|--------------|
| `meanCorrectedHeAge` | Float | Mean Corrected He Age |
| `meanCorrectedHeAgeUncertainty` | Float | Mean Corrected He Age Uncertainty |
| `meanCorrectedHeAgeUncertaintyType` | List | Uncertainty Type |
| `weightedMeanCorrectedHeAge` | Float | Weighted Mean Corrected He Age |
| `weightedMeanCorrectedHeAgeUncertainty` | Float | Weighted Mean Corrected He Age Uncertainty |
| `weightedMeanCorrectedHeAgeUncertaintyType` | List | Uncertainty Type |
| `mswdCorrected` | Float | MSWD of Weighted Mean Corrected Age |
| `confidenceInterval95Corrected` | Float | Weighted Mean Corrected Age 95% Confidence Interval |
| `chi2pctCorrected` | Float | Weighted Mean Corrected Age P(χ²) |
| `iqrCorrected` | Float | Corrected Age Interquartile Range (IQR) |

#### Analytical Method (11 fields)

| Database Name | Datatype | Display Name |
|--------------|----------|--------------|
| `uncertaintyComment` | String | Uncertainty Factors Comment |
| `pitMeasuringTechnique` | List | Ablation Pit Measuring Technique |
| `pitVolumeSoftware` | List | Pit Volume Determination Software |
| `insituHeTechnique` | List | In-Situ He Measurement Technique |
| `insituParentTechnique` | List | In-Situ Parent Isotope Measurement Technique |
| `grainDimensionEquations` | List | Grain Dimensions Equations Reference |
| `alphaStopDistRef` | List | Alpha Stopping Distances Reference |
| `ftEquation` | List | FT Equation |
| `rSVequation` | List | Rsv Equation |
| `rFTequation` | List | Rft Equation |
| `eUEquation` | List | eU Equation |
| `heAgeEquation` | List | He Age Equation |
| `correctedHeAgeMethod` | List | Corrected He Age Determination Method |

---

### HeWholeGrain Sheet (75 fields)

#### Identification (4 fields)

| Database Name | Datatype | Display Name |
|--------------|----------|--------------|
| `datapointName` | String | DataPoint Name |
| `aliquotID` | String | Aliquot ID |
| `aliquotType` | List | Aliquot Type |
| `numAliquots` | Integer | Number of Aliquot Grains |

#### Grain Characteristics (5 fields)

| Database Name | Datatype | Display Name |
|--------------|----------|--------------|
| `crysFrag` | List | Crystal Fragmentation |
| `aliquotMorphology` | List | Aliquot Morphology |
| `aliquotGeometry` | List | Assumed Aliquot Geometry |

#### Grain Dimensions (12 fields)

| Database Name | Datatype | Display Name |
|--------------|----------|--------------|
| `aliquotLength` | Float | Aliquot Length |
| `avgAliquotLengthSD` | Float | Average Aliquot Length Standard Deviation |
| `aliquotWidth` | Float | Aliquot Width |
| `avgAliquotWidthSD` | Float | Average Aliquot Width Standard Deviation |
| `aliquotHeight` | Float | Aliquot Height |
| `avgAliquotHeightSD` | Float | Average Aliquot Height Standard Deviation |
| `aliquotSurfaceArea` | Float | Surface Area |
| `avgAliquotSurfaceAreaSD` | Float | Average Surface Area Standard Deviation |
| `aliquotVolume` | Float | Volume |
| `avgAliquotVolumeSD` | Float | Average Volume Standard Deviation |
| `pyrTerminationHeight1` | Float | Pyramidal Termination Height 1 |
| `pyrTerminationHeight1SD` | Float | Average Pyramidal Termination Height 1 Standard Deviation |
| `pyrTerminationHeight2` | Float | Pyramidal Termination Height 2 |
| `pyrTerminationHeight2SD` | Float | Average Pyramidal Termination Height 2 Standard Deviation |

#### Alpha Ejection Correction (7 fields)

| Database Name | Datatype | Display Name |
|--------------|----------|--------------|
| `vsRatio` | Float | V/S Ratio |
| `ft` | Float | FT (alpha ejection correction) |
| `ftUncertainty` | Float | FT Uncertainty |
| `ftUncertaintyType` | List | Uncertainty Type |
| `rSV` | Float | RSV (equivalent spherical radius via surface area/volume) |
| `rFT` | Float | RFT (equivalent spherical radius via FT) |

#### Mass Determination (10 fields)

| Database Name | Datatype | Display Name |
|--------------|----------|--------------|
| `assumedMineralDensity` | Float | Assumed Mineral Density |
| `caContent` | Float | Ca Content |
| `caContentUncertainty` | Float | Ca Content Uncertainty |
| `caContentUncertaintyType` | List | Uncertainty Type |
| `zrContent` | Float | Zr Content |
| `zrContentUncertainty` | Float | Zr Content Uncertainty |
| `zrContentUncertaintyType` | List | Uncertainty Type |
| `minChemFormula` | Float | Assumed Mineral Chemical Formula |
| `aliquotMass` | Float | Estimated Aliquot Mass |
| `aliquotMassUncertainty` | Float | Estimated Aliquot Mass Uncertainty |
| `aliquotMassUncertaintyType` | List | Uncertainty Type |

#### Helium Content (6 fields)

| Database Name | Datatype | Display Name |
|--------------|----------|--------------|
| `he4Amount` | Float | 4He Absolute Amount |
| `he4AmountUncertainty` | Float | 4He Absolute Amount Uncertainty |
| `he4AmountUncertaintyType` | List | Uncertainty Type |
| `he4Concentration` | Float | 4He Concentration |
| `he4ConcentrationUncertainty` | Float | 4He Concentration Uncertainty |
| `he4ConcentrationUncertaintyType` | List | Uncertainty Type |

#### Uranium Content (6 fields)

| Database Name | Datatype | Display Name |
|--------------|----------|--------------|
| `uAmount` | Float | U Absolute Amount |
| `uAmountUncertainty` | Float | U Absolute Amount Uncertainty |
| `uAmountUncertaintyType` | List | Uncertainty Type |
| `uConcentration` | Float | U Concentration |
| `uConcentrationUncertainty` | Float | U Concentration Uncertainty |
| `uConcentrationUncertaintyType` | List | Uncertainty Type |

#### Thorium Content (6 fields)

| Database Name | Datatype | Display Name |
|--------------|----------|--------------|
| `thAmount` | Float | Th Absolute Amount |
| `thAmountUncertainty` | Float | Th Absolute Amount Uncertainty |
| `thAmountUncertaintyType` | List | Uncertainty Type |
| `thConcentration` | Float | Th Concentration [ppm] |
| `thConcentrationUncertainty` | Float | Th Concentration Uncertainty [ppm] |
| `thConcentrationUncertaintyType` | List | Uncertainty Type |

#### Samarium Content (6 fields)

| Database Name | Datatype | Display Name |
|--------------|----------|--------------|
| `smAmount` | Float | Sm Absolute Amount |
| `smAmountUncertainty` | Float | Sm Absolute Amount Uncertainty |
| `smAmountUncertaintyType` | List | Uncertainty Type |
| `smConcentration` | Float | Sm Concentration |
| `smConcentrationUncertainty` | Float | Sm Concentration Uncertainty |
| `smConcentrationUncertaintyType` | List | Uncertainty Type |

#### Derived Isotope Ratios (5 fields)

| Database Name | Datatype | Display Name |
|--------------|----------|--------------|
| `thURatio` | Float | Th/U |
| `eU` | Float | eU (effective uranium) |
| `eUUncertainty` | Float | eU Uncertainty |
| `eUUncertaintyType` | List | Uncertainty Type |

#### Age Results (9 fields)

| Database Name | Datatype | Display Name |
|--------------|----------|--------------|
| `uncorrectedHeAge` | Float | Uncorrected He Age |
| `uncorrectedHeAgeUncertainty` | Float | Uncorrected He Age Uncertainty |
| `uncorrectedHeAgeUncertaintyType` | List | Uncertainty Type |
| `correctedHeAge` | Float | Corrected He Age |
| `tau` | Float | Total Analytical Uncertainty (Corrected Age) |
| `tauUncertaintyType` | List | Uncertainty Type |
| `tauFT` | Float | Total Analytical Uncertainty + FT (Corrected Age) |
| `tauFTUncertaintyType` | List | Uncertainty Type |
| `comment` | Text | Comment |

---

### HeInSitu Sheet (46 fields)

#### Identification (4 fields)

| Database Name | Datatype | Display Name |
|--------------|----------|--------------|
| `datapointName` | String | DataPoint Name |
| `grainID` | String | Grain ID |
| `pitID` | String | Pit ID |
| `crysFrag` | List | Crystal Fragmentation |

#### Pit Volume Measurements (6 fields)

| Database Name | Datatype | Display Name |
|--------------|----------|--------------|
| `pitVolume` | Float | He Measurement Pit Volume |
| `pitVolumeUncertainty` | Float | He Measurement Pit Volume Uncertainty |
| `pitVolumeUncertaintyType` | List | Uncertainty Type |
| `parentPitVolume` | Float | Parent Isotopes Measurement Pit Volume |
| `parentPitVolumeUncertainty` | Float | Parent Isotopes Measurement Pit Volume Uncertainty |
| `parentPitVolumeUncertaintyType` | List | Uncertainty Type |

#### Helium Content (6 fields)

| Database Name | Datatype | Display Name |
|--------------|----------|--------------|
| `he4Amount` | Float | 4He Absolute Amount |
| `he4AmountUncertainty` | Float | 4He Absolute Amount Uncertainty |
| `he4AmountUncertaintyType` | List | Uncertainty Type |
| `he4Concentration` | Float | 4He Concentration |
| `he4ConcentrationUncertainty` | Float | 4He Concentration Uncertainty |
| `he4ConcentrationUncertaintyType` | List | Uncertainty Type |

#### Uranium Content (6 fields)

| Database Name | Datatype | Display Name |
|--------------|----------|--------------|
| `uAmount` | Float | U Absolute Amount |
| `uAmountUncertainty` | Float | U Absolute Amount Uncertainty |
| `uAmountUncertaintyType` | List | Uncertainty Type |
| `uConcentration` | Float | U Concentration |
| `uConcentrationUncertainty` | Float | U Concentration Uncertainty |
| `uConcentrationUncertaintyType` | List | Uncertainty Type |

#### Thorium Content (6 fields)

| Database Name | Datatype | Display Name |
|--------------|----------|--------------|
| `thAmount` | Float | Th Absolute Amount |
| `thAmountUncertainty` | Float | Th Absolute Amount Uncertainty |
| `thAmountUncertaintyType` | List | Uncertainty Type |
| `thConcentration` | Float | Th Concentration [ppm] |
| `thConcentrationUncertainty` | Float | Th Concentration Uncertainty [ppm] |
| `thConcentrationUncertaintyType` | List | Uncertainty Type |

#### Samarium Content (6 fields)

| Database Name | Datatype | Display Name |
|--------------|----------|--------------|
| `smAmount` | Float | Sm Absolute Amount |
| `smAmountUncertainty` | Float | Sm Absolute Amount Uncertainty |
| `smAmountUncertaintyType` | List | Uncertainty Type |
| `smConcentration` | Float | Sm Concentration |
| `smConcentrationUncertainty` | Float | Sm Concentration Uncertainty |
| `smConcentrationUncertaintyType` | List | Uncertainty Type |

#### Derived Values (4 fields)

| Database Name | Datatype | Display Name |
|--------------|----------|--------------|
| `eU` | Float | eU |
| `eUUncertainty` | Float | eU Uncertainty |
| `eUUncertaintyType` | List | Uncertainty Type |
| `pitRelationship` | List | Relationship of He and Parent Isotopes Measurement Locations |

#### Age Results (7 fields)

| Database Name | Datatype | Display Name |
|--------------|----------|--------------|
| `uncorrectedHeAge` | Float | Uncorrected He Age |
| `uncorrectedHeAgeUncertainty` | Float | Uncorrected He Age Uncertainty |
| `uncorrectedHeAgeUncertaintyType` | List | Uncertainty Type |
| `ageCalibrationFactor` | Float | Age Calibration Factor (if applicable) |
| `correctedHeAge` | Float | Calibration Factor Corrected He Age (if applicable) |
| `tau` | Float | Calibration Factor Corrected He Age Uncertainty (if applicable) |
| `tauUncertaintyType` | List | Uncertainty Type |
| `comment` | Text | Comment |

---

## Controlled Vocabularies

### Common (All Templates)

**Uncertainty Type** (19 values):
- 1 sigma
- 2 sigma
- 95% confidence
- 1 standard error
- 2 standard error
- 1 sigma internal
- 2 sigma internal
- 95% confidence internal
- 1 sigma external
- 2 sigma external
- 95% confidence external
- Other
- Unknown
- Undefined
- Duplicate sample
- Duplicate analytical session
- Duplicate aliquot
- Replicate
- Standard deviation

### FT-Specific Lookup Tables

**Mineral Type** (5 values):
- Apatite
- Zircon
- Titanite
- Monazite
- Glass

**Reference Material** (48 values): Including Durango, Fish Canyon Tuff, M257, M127, 91500, OG1/OGC, Mud Tank, Z6266, GJ-1, R33, QNQG, etc.

**FT Characterisation Method** (3 values):
- External detector method (EDM)
- LA-ICP-MS
- Population method

**Track Type** (5 values):
- Confined track-in-track (TINT)
- Confined track-in-cleavage (TINCLE)
- Semi-track
- Surface track
- Other

### He-Specific Lookup Tables

**Reference Material** (48 values): Same as FT (M257, M127, 91500, OG1/OGC, Mud Tank, Z6266, GJ-1, R33, QNQG, etc.)

**Aliquot Type** (3 values):
- Single-grain
- Multi-grain
- Unknown

**Crystal Fragmentation** (5 values):
- Whole
- Fragmented
- Abraded
- Mixed
- Unknown

**Aliquot Morphology** (6 values):
- Euhedral
- Subhedral
- Anhedral
- Fragment
- Mixed
- Unknown

**Assumed Aliquot Geometry** (8 values):
- Hexagonal prism
- Tetragonal prism
- Ellipsoid
- Sphere
- Irregular
- Mixed
- Unknown
- Other

---

## Key Schema Insights

### Hierarchical Data Structure

**Sample → Datapoint → Grain Data**

1. **Sample** (Sample template)
   - Geographic location, lithology, collection metadata
   - IGSN (International Geo Sample Number) required for FAIR compliance
   - Links to people, publications, institutions

2. **Datapoint** (FT/He Datapoint templates)
   - One analytical session for a sample
   - Batch ID links unknowns to reference materials
   - Method metadata (lab, date, analyst, technique)

3. **Grain-level data** (Count/SingleGrain/Length/WholeGrain/InSitu)
   - Individual measurements from the analytical session
   - Enables recalculation, remodeling, QC assessment

### Uncertainty Reporting

All age and measurement uncertainties require:
1. **Value** - The uncertainty magnitude
2. **Type** - The statistical meaning (1σ, 2σ, 95% CI, standard error, etc.)

This dual reporting enables proper statistical comparison across datasets.

### Age Calculation Flexibility

**Fission Track** supports 4 age types:
- Mean age (simple arithmetic average)
- Central age (accounts for overdispersion)
- Pooled age (all tracks treated as one population)
- Population age (external detector method calibration)

**Helium** supports 2 age types:
- Uncorrected age (raw measurement)
- Corrected age (alpha ejection FT correction applied)

Both support mean vs. weighted mean calculations.

### QC Metrics Included

- **Chi-square test (P(χ²))** - Tests single population hypothesis
- **Dispersion** - Measures age scatter (0-1 scale)
- **MSWD** - Mean Square Weighted Deviation
- **IQR** - Interquartile range (robust dispersion measure)

---

## Database Implementation Notes

### Required vs. Optional Fields

**Critical Required Fields:**
- Sample: `sampleID`, `IGSN`, `latitude`, `longitude`
- FT Datapoint: `sampleID`, `mineral`, `analysisDate`, track densities (ρs, ρi, ρd)
- He Datapoint: `sampleID`, `mineral`, `analysisDate`, `numAliquots`
- Grain data: `datapointName` (foreign key), grain/aliquot ID

**Optional but Recommended:**
- All uncertainty measurements with uncertainty type
- Batch ID (critical for QC linking unknowns to standards)
- Analyst ORCID (enables researcher tracking)
- Literature DOI (enables dataset-publication linking)

### Referential Integrity

1. **Datapoint → Sample**: `sampleID` must exist in Sample table
2. **Grain Data → Datapoint**: `datapointName`/`name` must exist in respective Datapoint table
3. **Batch ID**: String field linking multiple datapoints analyzed together
4. **Reference Material**: If populated, sample is a secondary standard (not a geosample)

### Lookup Table Implementation

Most `List` type fields reference controlled vocabularies in Lookup Tables sheets. Implementation options:

1. **ENUM types** - For small, stable lists (uncertainty types, mineral types)
2. **Foreign key tables** - For large or evolving lists (lithology via mindat.org)
3. **JSON validation** - For flexibility with schema evolution

### Units

**Lengths**: μm (micrometers)
**Areas**: cm² (square centimeters)
**Track densities**: tracks/cm²
**Ages**: Ma (megayears, millions of years)
**Concentrations**: ppm (parts per million) or μg/g
**Temperatures**: °C (Celsius)
**Masses**: ng (nanograms)
**Volumes**: μm³ (cubic micrometers)

---

## Schema Version History

- **Sample template**: v2025-04-16 (latest)
- **FT Datapoint template**: v2024-11-11
- **He Datapoint template**: v2024-11-11

Template versioning uses `YYYY-MM-DD` format for date-based tracking.

---

**End of Schema Documentation**
