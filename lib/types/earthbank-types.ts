/**
 * EarthBank-Native TypeScript Type Definitions - Schema v3
 *
 * CRITICAL: This file uses exact EarthBank camelCase field names
 * Maps 1:1 to database schema (earthbank_* tables)
 * NO translation layer - direct column mapping
 *
 * Based on:
 * - EarthBank Templates (Nixon et al. 2025)
 * - FAIR data standards (Kohn et al. 2024)
 *
 * Migration: IDEA-014 (snake_case → camelCase)
 * Database: PostgreSQL with double-quoted identifiers: "sampleID", "centralAgeMa"
 *
 * @module lib/types/earthbank-types
 * @version 3.0.0
 */

// =============================================================================
// EARTHBANK CORE TYPES (camelCase - Schema v3)
// =============================================================================

/**
 * EarthBank Dataset (HYBRID - queries old datasets table, returns camelCase)
 * Note: Dataset table has NOT been migrated to earthbank_datasets yet
 * This type is used for transformed data from old snake_case schema
 */
export interface EarthBankDataset {
  id: string; // Integer ID converted to string
  datasetName: string;
  description?: string | null;
  publicationReference?: string | null;
  doi?: string | null;
  fullCitation?: string | null;
  publicationYear?: number | null;
  publicationJournal?: string | null;
  publicationVolumePages?: string | null;
  studyLocation?: string | null;
  pdfFilename?: string | null;
  pdfUrl?: string | null;
  supplementaryFilesUrl?: string | null;
  studyArea?: string | null;
  mineralAnalyzed?: string | null;
  sampleCount?: number | null;
  ageRangeMinMa?: number | null;
  ageRangeMaxMa?: number | null;
  authors?: string[] | string | null; // Can be array or PostgreSQL array string
  collectionDate?: Date | string | null;
  analyst?: string | null;
  laboratory?: string | null;
  analysisMethods?: string[] | string | null; // Can be array or PostgreSQL array string
  createdAt?: Date | string | null;
}

export interface EarthBankSample {
  id: string; // UUID primary key
  sampleID: string; // Natural key (unique)
  datasetID?: string | null; // Changed to string for UUID compatibility

  // Sample identification
  IGSN?: string | null;

  // Sample classification
  sampleKind?: string | null;
  sampleCollectionMethod?: string | null;
  sampleKindAdditionalInfo?: string | null;

  // Geographic location
  latitude?: number | null;
  longitude?: number | null;
  geodeticDatum?: string | null;
  latLonPrecision?: number | null;
  latLonPrecisionMethod?: string | null;

  // Elevation and depth
  elevationM?: number | null;
  elevationGround?: number | null; // EarthBank template name
  verticalDatum?: string | null;
  elevationAccuracy?: number | null;
  elevationAdditionalInfo?: string | null;
  depthMin?: number | null;
  depthMax?: number | null;
  depthAccuracy?: number | null;

  // Location description
  locationKind?: string | null;
  locationName?: string | null;
  locationDescription?: string | null;
  samplingLocationInformation?: string | null;

  // Sample characteristics
  lithology?: string | null;
  mineralType?: string | null;
  mineral?: string | null; // Alias

  // Analytical summary (grain counts from datapoints)
  nAFTGrains?: number | null; // Total AFT grains analyzed
  nAHeGrains?: number | null; // Total AHe grains analyzed

  // Stratigraphic context
  stratigraphicUnit?: string | null;
  unitName?: string | null; // EarthBank template name
  chronostratigraphicUnitAge?: string | null;
  chronostratAgeMin?: number | null;
  chronostratAgeMax?: number | null;
  sampleAgeMa?: number | null;
  stratigraphicInfo?: string | null;

  // Collection provenance
  collectionDateMin?: Date | null;
  collectionDateMax?: Date | null;
  collectionDate?: Date | null;
  collectionYear?: number | null;
  collector?: string | null;

  // Archive and documentation
  lastKnownSampleArchive?: string | null;
  archiveAdditionalInfo?: string | null;
  fundingGrantID?: string | null;
  associatedReferences?: string | null;
  keywords?: string | null;

  // Geographic admin
  country?: string | null;
  stateProvince?: string | null;
  quadrangle?: string | null;
  faultBlock?: string | null;

  // Project/study context
  project?: string | null;

  // Metadata
  createdAt?: Date;
  updatedAt?: Date;
}

export interface EarthBankFTDatapoint {
  id: string; // UUID primary key
  sampleID: string; // Foreign key to samples
  datapointName: string; // Natural key (unique)
  batchID?: number | null;

  // Provenance
  laboratory?: string | null;
  labNumber?: string | null;
  analyst?: string | null;
  analystORCID?: string | null;
  analysisDate?: Date | null;
  publicationDOI?: string | null;

  // Method metadata
  mineralType?: string | null;
  ftMethod?: string | null; // EDM, LA-ICP-MS, Population
  ftCharacterisationMethod?: string | null; // EarthBank template name
  ftSoftware?: string | null;
  ftAlgorithm?: string | null;
  uDeterminationMethod?: string | null;

  // Whole-rock summary stats
  nGrains?: number | null;
  noOfGrains?: number | null; // Alias
  totalArea?: number | null;
  rhoS?: number | null; // mean_rho_s
  totalNs?: number | null;
  rhoI?: number | null; // mean_rho_i
  totalNi?: number | null;
  rhoD?: number | null; // mean_rho_d
  totalNd?: number | null;
  dosimeter?: string | null;

  // Kinetic parameters (aggregate)
  uPpm?: number | null;
  uPpmStdDev?: number | null;
  uCont?: number | null; // EarthBank template name
  uStandardDeviation?: number | null; // EarthBank template name
  dPar?: number | null;
  dParUncertainty?: number | null;
  nDparMeasurements?: number | null;
  dPer?: number | null;
  dPerUncertainty?: number | null;
  nDperMeasurements?: number | null;
  rmr0?: number | null;
  rmr0StdDev?: number | null;
  kappa?: number | null;
  kappaStdDev?: number | null;
  rmr0Equation?: string | null;

  // Statistical tests
  chiSquare?: number | null;
  chi2?: number | null; // Alias
  pChi2?: number | null; // P(χ²) percentage
  chi2pct?: number | null; // EarthBank template name
  dispersion?: number | null; // Dispersion percentage
  dispersionPct?: number | null;

  // Age results
  ageEquation?: string | null;
  meanAge?: number | null;
  meanAgeMa?: number | null;
  meanAgeError?: number | null;
  meanAgeErrorMa?: number | null;
  centralAgeMa?: number | null;
  centralAgeError?: number | null;
  centralAgeErrorMa?: number | null;
  centralAgeUncertainty?: number | null; // EarthBank template name
  pooledAgeMa?: number | null;
  pooledAgeError?: number | null;
  pooledAgeErrorMa?: number | null;
  pooledAgeUncertainty?: number | null; // EarthBank template name
  populationAge?: number | null;
  populationAgeMa?: number | null;
  populationAgeError?: number | null;
  populationAgeErrorMa?: number | null;
  ageErrorType?: string | null;
  uncertaintyType?: string | null; // EarthBank template name
  ageComment?: string | null;

  // Track length summary
  mtl?: number | null; // Mean track length
  meanTrackLength?: number | null;
  meanTrackLengthUm?: number | null;
  mtlUncertainty?: number | null;
  stdDevMu?: number | null; // Standard deviation
  nTracks?: number | null; // Number of track measurements
  nTrackMeasurements?: number | null;

  // Etching conditions
  cf252Irradiation?: boolean | null;
  etchantChemical?: string | null;
  etchDuration?: number | null;
  etchDurationSeconds?: number | null;
  etchTemperature?: number | null;
  etchTemperatureC?: number | null;

  // Calibration (EDM method)
  zeta?: number | null;
  zetaYrCm2?: number | null;
  zetaError?: number | null;
  zetaErrorYrCm2?: number | null;
  zetaErrorType?: string | null;

  // Absolute dating (LA-ICP-MS method)
  rUm?: number | null;

  // Decay constants
  lambdaD?: string | null;
  lambdaF?: string | null;
  qFactor?: number | null;

  // Irradiation (EDM only)
  irradiationReactor?: string | null;
  thermalNeutronDose?: number | null;
  irradiationBatchID?: string | null;

  // Igneous age context (from Dusel-Bacon dataset)
  igneousAgeMa?: number | null;
  igneousAgeErrorMa?: number | null;

  // Metadata
  notes?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface EarthBankFTCountData {
  id: string; // UUID primary key
  datapointName: string; // Foreign key to ftDatapoints
  grainName: string;

  // Count data
  countingArea?: number | null;
  countingAreaCm2?: number | null;
  ns?: number | null;
  rhoS?: number | null;
  rhosPerCm2?: number | null;
  ni?: number | null;
  rhoI?: number | null;
  rhoiPerCm2?: number | null;
  nd?: number | null;
  rhoD?: number | null;
  rhodPerCm2?: number | null;

  // Kinetic parameters (grain-specific)
  dPar?: number | null;
  dParUm?: number | null;
  dParError?: number | null;
  dParErrorUm?: number | null;
  nDparMeasurements?: number | null;
  dPer?: number | null;
  dPerUm?: number | null;
  dPerError?: number | null;
  dPerErrorUm?: number | null;
  nDperMeasurements?: number | null;
  dParDperErrorType?: string | null;

  // Comments
  comments?: string | null;

  createdAt?: Date;
}

export interface EarthBankFTSingleGrainAge {
  id: string; // UUID primary key
  datapointName: string; // Foreign key to ftDatapoints
  grainName: string;
  mountID?: string | null;

  // Etching
  etchDuration?: number | null;
  etchDurationSeconds?: number | null;

  // Chemistry
  uPpm?: number | null;
  uPpmError?: number | null;
  uCaRatio?: number | null;
  uCaRatioError?: number | null;
  uCaErrorType?: string | null;

  // Kinetic parameters
  rmr0?: number | null;
  kParameter?: number | null;
  kappa?: number | null;

  // Age
  ageMa?: number | null;
  grainAgeMa?: number | null;
  ageUncertainty?: number | null;
  ageUncertaintyMa?: number | null;
  grainAgeError?: number | null;
  grainAgeErrorMa?: number | null;
  ageErrorType?: string | null;

  // Comments
  comments?: string | null;

  createdAt?: Date;
}

export interface EarthBankFTTrackLengthData {
  id: string; // UUID primary key
  sampleID?: string | null; // Optional direct link to sample
  datapointName: string; // Foreign key to ftDatapoints
  grainName: string;
  trackID?: string | null;

  // Track classification
  trackType?: 'TINT' | 'TINCLE' | 'semi-track' | string | null;
  mountID?: string | null;
  etchDuration?: number | null;
  etchDurationSeconds?: number | null;

  // Length measurements
  lengthUm?: number | null;
  apparentLength?: number | null;
  apparentLengthUm?: number | null;
  correctedZDepth?: number | null;
  correctedZDepthUm?: number | null;
  trueLength?: number | null;
  trueLengthUm?: number | null;

  // Orientation
  azimuth?: number | null;
  azimuthDeg?: number | null;
  dip?: number | null;
  dipDeg?: number | null;
  cAxisAngle?: number | null;
  cAxisAngleDeg?: number | null;
  cAxisCorrectedLength?: number | null;
  cAxisCorrectedLengthUm?: number | null;

  // Kinetic parameters (for this grain)
  dPar?: number | null;
  dParUm?: number | null;
  dParError?: number | null;
  dParErrorUm?: number | null;
  nDparMeasurements?: number | null;
  dPer?: number | null;
  dPerUm?: number | null;
  dPerError?: number | null;
  dPerErrorUm?: number | null;
  nDperMeasurements?: number | null;
  dParDperErrorType?: string | null;

  // Composition
  rmr0?: number | null;
  kappa?: number | null;

  // Comments
  comments?: string | null;

  createdAt?: Date;
}

export interface EarthBankFTBinnedLengthData {
  id: string; // UUID primary key
  datapointName: string; // Foreign key to ftDatapoints
  mountID?: string | null;
  etchDuration?: number | null;
  etchDurationSeconds?: number | null;

  // Histogram bins (20 bins of 1 µm each)
  // EarthBank uses format: i0x1, i1x2, i2x3, etc.
  i0x1?: number | null;
  i1x2?: number | null;
  i2x3?: number | null;
  i3x4?: number | null;
  i4x5?: number | null;
  i5x6?: number | null;
  i6x7?: number | null;
  i7x8?: number | null;
  i8x9?: number | null;
  i9x10?: number | null;
  i10x11?: number | null;
  i11x12?: number | null;
  i12x13?: number | null;
  i13x14?: number | null;
  i14x15?: number | null;
  i15x16?: number | null;
  i16x17?: number | null;
  i17x18?: number | null;
  i18x19?: number | null;
  i19x20?: number | null;

  // Kinetic parameters
  dPar?: number | null;
  dParUm?: number | null;
  dParError?: number | null;
  dParErrorUm?: number | null;
  nDparMeasurements?: number | null;
  dPer?: number | null;
  dPerUm?: number | null;
  dPerError?: number | null;
  dPerErrorUm?: number | null;
  nDperMeasurements?: number | null;
  dParDperErrorType?: string | null;

  // Comments
  comments?: string | null;

  createdAt?: Date;
}

export interface EarthBankHeDatapoint {
  id: string; // UUID primary key
  sampleID: string; // Foreign key to samples
  datapointName: string; // Natural key (unique)
  batchID?: number | null;

  // Provenance
  laboratory?: string | null;
  analyst?: string | null;
  analystORCID?: string | null;
  analysisDate?: Date | null;
  publicationDOI?: string | null;

  // Method metadata
  mineralType?: string | null;
  ftMethod?: string | null; // Often "ZHe", "AHe", etc.
  heAnalysisMethod?: string | null;
  heSoftware?: string | null;
  heMeasurementMassSpec?: string | null;

  // Aliquot characteristics
  nGrains?: number | null;
  nAliquots?: number | null;
  meanRadius?: number | null;
  meanRadiusUm?: number | null;
  meanMass?: number | null;
  meanMassUg?: number | null;

  // Helium analysis
  heAnalysisGasPurityMethod?: string | null;
  heAnalysisPitVolumeSoftware?: string | null;
  heAlphaStoppingPowerCalc?: string | null;

  // Summary statistics
  meanUncorrectedAgeMa?: number | null;
  meanUncorrectedAge?: number | null;
  meanUncorrectedAgeUncertainty?: number | null;
  meanCorrectedAgeMa?: number | null;
  meanCorrectedAge?: number | null;
  meanCorrectedAgeUncertainty?: number | null;
  weightedMeanUncorrectedAge?: number | null;
  weightedMeanUncorrectedAgeMa?: number | null;
  weightedMeanUncorrectedAgeError?: number | null;
  weightedMeanUncorrectedAgeErrorMa?: number | null;
  weightedMeanCorrectedHeAge?: number | null;
  weightedMeanCorrectedAgeMa?: number | null;
  weightedMeanCorrectedAgeError?: number | null;
  weightedMeanCorrectedAgeErrorMa?: number | null;

  // QC statistics
  chiSquare?: number | null;
  chi2?: number | null;
  chi2pct?: number | null;
  chi2pctCorrected?: number | null;
  MSWD?: number | null;
  IQR?: number | null;
  IQRPct?: number | null;

  // Notes
  notes?: string | null;

  createdAt?: Date;
  updatedAt?: Date;
}

export interface EarthBankHeWholeGrainData {
  id: string; // UUID primary key
  sampleID?: string | null; // Optional direct link to sample
  datapointName: string; // Foreign key to heDatapoints
  grainName: string;
  mountID?: string | null;

  // Grain dimensions
  lengthUm?: number | null;
  length?: number | null;
  lengthError?: number | null;
  lengthErrorUm?: number | null;
  widthUm?: number | null;
  width?: number | null;
  widthError?: number | null;
  widthErrorUm?: number | null;
  heightUm?: number | null;
  height?: number | null;
  pyramidalTerminationLengths?: string | null; // Comma-separated
  pyramidalTerminationLengthsUm?: string | null;
  grainShape?: string | null;
  geometry?: number | null; // 1, 2, 3 (shape code)

  // Volumes and surfaces
  rawVolume?: number | null;
  rawVolumeUm3?: number | null;
  surfaceArea?: number | null;
  surfaceAreaUm2?: number | null;
  saToVolRatio?: number | null;

  // Equivalent spherical radius
  rsUm?: number | null;
  rs?: number | null;

  // Ft corrections
  ft?: number | null; // Alpha ejection correction factor
  ftValue?: number | null;
  ftCorrectionModel?: string | null;

  // Isotope-specific Ft factors
  ftU238?: number | null;
  ftU235?: number | null;
  ftTh232?: number | null;
  ftSm147?: number | null;

  // Parent isotopes (absolute amounts)
  he4Concentration?: number | null;
  He4ncc?: number | null;
  He4nccError?: number | null;
  U238ng?: number | null;
  U238ngError?: number | null;
  Th232ng?: number | null;
  Th232ngError?: number | null;
  Sm147ng?: number | null;
  Sm147ngError?: number | null;

  // Parent isotopes (concentrations)
  uConcentration?: number | null;
  uPpm?: number | null;
  uPpmError?: number | null;
  uConcentrationUncertainty?: number | null;
  uNg?: number | null;
  uNgUncertainty?: number | null;

  thConcentration?: number | null;
  thPpm?: number | null;
  thPpmError?: number | null;
  thConcentrationUncertainty?: number | null;
  thNg?: number | null;
  thNgUncertainty?: number | null;

  smConcentration?: number | null;
  smPpm?: number | null;
  smPpmError?: number | null;
  smConcentrationUncertainty?: number | null;
  smNg?: number | null;
  smNgUncertainty?: number | null;

  eU?: number | null;
  eUPpm?: number | null;
  eUPpmError?: number | null;
  eUUncertainty?: number | null;

  // Helium (concentration)
  heNmolG?: number | null;
  heNmolGUncertainty?: number | null;
  He4nmolG?: number | null;
  He4nmolGError?: number | null;

  // Ages
  uncorrectedHeAge?: number | null;
  uncorrectedHeAgeMa?: number | null;
  uncorrectedHeAgeUncertainty?: number | null;
  he4UncorrAge?: number | null;
  he4UncorrAgeMa?: number | null;
  he4UncorrAgeError?: number | null;
  he4UncorrAgeErrorMa?: number | null;

  correctedHeAge?: number | null;
  correctedHeAgeMa?: number | null;
  correctedHeAgeUncertainty?: number | null;
  he4CorrAge?: number | null;
  he4CorrAgeMa?: number | null;
  he4CorrAgeError?: number | null;
  he4CorrAgeErrorMa?: number | null;

  ageErrorType?: string | null;

  // Mass and density
  massMg?: number | null;
  mass?: number | null;
  massError?: number | null;
  massErrorUg?: number | null;
  massErrorMg?: number | null;
  density?: number | null;
  densityGCm3?: number | null;

  // Grain characterization
  grainMorphology?: string | null;
  grainQuality?: string | null;
  mineralType?: string | null;

  // Other isotopes
  U235ng?: number | null;
  He3fcc?: number | null;

  // Ratios
  ThURatio?: number | null;
  SmEURatio?: number | null;

  // In-situ specific
  numPits?: number | null; // Number of laser ablation pits
  aliquotVolume?: number | null;

  // Comments
  comments?: string | null;

  createdAt?: Date;
}

// =============================================================================
// API RESPONSE TYPES (EarthBank-compatible)
// =============================================================================

export interface EarthBankSampleDetailResponse {
  sample: EarthBankSample;
  ftDatapoints: EarthBankFTDatapoint[];
  heDatapoints: EarthBankHeDatapoint[];
  ftCountData: EarthBankFTCountData[];
  heWholeGrainData: EarthBankHeWholeGrainData[];
  ftTrackLengthData: EarthBankFTTrackLengthData[];
}

export interface EarthBankPaginatedResponse<T> {
  data: T[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

export interface EarthBankDatasetStats {
  totalSamples: number;
  totalFTDatapoints: number;
  totalHeDatapoints: number;
  totalAFTAnalyses: number;
  totalAHeGrains: number;
  ageRangeMa: {
    aftMin: number | null;
    aftMax: number | null;
    aheMin: number | null;
    aheMax: number | null;
  };
  elevationRangeM: {
    min: number | null;
    max: number | null;
  };
}

// =============================================================================
// FILTER TYPES (EarthBank-compatible)
// =============================================================================

export interface EarthBankSampleFilters {
  datasetID?: string;  // UUID
  mineralType?: string;
  lithology?: string;
  minElevationM?: number;
  maxElevationM?: number;
  hasAFT?: boolean;
  hasAHe?: boolean;
}

export interface EarthBankFTDataFilters {
  sampleID?: string;
  minAgeMa?: number;
  maxAgeMa?: number;
  minTrackLengthUm?: number;
  maxTrackLengthUm?: number;
  minDispersionPct?: number;
  maxDispersionPct?: number;
}

export interface EarthBankHeDataFilters {
  sampleID?: string;
  minAgeMa?: number;
  maxAgeMa?: number;
  minEU?: number;
  maxEU?: number;
}

// =============================================================================
// UTILITY TYPES
// =============================================================================

export type DatapointType = 'FT' | 'He';
export type FTMethod = 'EDM' | 'LA-ICP-MS' | 'Population';
export type TrackType = 'TINT' | 'TINCLE' | 'semi-track';
