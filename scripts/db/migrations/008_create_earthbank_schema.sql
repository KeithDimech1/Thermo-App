-- ============================================================================
-- IDEA-014: EarthBank Native Schema Migration
-- Create tables with exact EarthBank camelCase field names
-- Source: EarthBank templates (Sample v2025-04-16, FT/He Datapoint v2024-11-11)
-- ============================================================================

-- NOTE: PostgreSQL requires double-quotes to preserve camelCase identifiers
-- All table and column names use exact EarthBank technical names

-- ============================================================================
-- 1. SAMPLES TABLE (30 fields from Sample.template.v2025-04-16.xlsx)
-- ============================================================================

CREATE TABLE "earthbank_samples" (
  "id" SERIAL PRIMARY KEY,
  "sampleName" VARCHAR(255) NOT NULL UNIQUE,
  "igsn" VARCHAR(9) UNIQUE,
  "sampleKind" VARCHAR(100),
  "sampleMethod" VARCHAR(100),
  "material" VARCHAR(100),
  "sampleComment" TEXT,
  "latitude" NUMERIC(10, 6),
  "longitude" NUMERIC(10, 6),
  "latLonPrecision" NUMERIC(10, 2),
  "elevationGround" NUMERIC(10, 2),
  "elevationDepthMin" NUMERIC(10, 2),
  "elevationDepthMax" NUMERIC(10, 2),
  "elevationDepthAccuracy" NUMERIC(10, 2),
  "elevationNote" TEXT,
  "locationKind" VARCHAR(100),
  "locationName" VARCHAR(255),
  "locationComment" TEXT,
  "unitName" VARCHAR(255),
  "ageMin" NUMERIC(10, 2),
  "ageMax" NUMERIC(10, 2),
  "unitAgeDescription" TEXT,
  "collectDateMin" DATE,
  "collectDateMax" DATE,
  "person" TEXT,
  "personRole" TEXT,
  "lastKnownArchive" VARCHAR(255),
  "archiveComment" TEXT,
  "funding" TEXT,
  "literature" TEXT,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "idx_earthbank_samples_sampleName" ON "earthbank_samples"("sampleName");
CREATE INDEX "idx_earthbank_samples_igsn" ON "earthbank_samples"("igsn");
CREATE INDEX "idx_earthbank_samples_location" ON "earthbank_samples"("latitude", "longitude");

COMMENT ON TABLE "earthbank_samples" IS 'Sample metadata from EarthBank Sample template v2025-04-16';

-- ============================================================================
-- 2. FT DATAPOINTS TABLE (66 fields from FTDatapoint.template.v2024-11-11.xlsx)
-- ============================================================================

CREATE TABLE "earthbank_ftDatapoints" (
  "id" SERIAL PRIMARY KEY,
  "datapointName" VARCHAR(255) NOT NULL UNIQUE,
  "sampleName" VARCHAR(255) NOT NULL REFERENCES "earthbank_samples"("sampleName") ON DELETE CASCADE,
  "literature" TEXT,
  "laboratory" VARCHAR(255),
  "analyst" VARCHAR(255),
  "analysisDate" TIMESTAMP,
  "mineral" VARCHAR(100),
  "referenceMaterial" VARCHAR(100),
  "batchID" VARCHAR(100),
  "ftCharacterisationMethod" VARCHAR(100),
  "ftAnalyticalSoftware" VARCHAR(100),
  "ftAnalyticalAlgorithm" VARCHAR(100),
  "ftUDeterminationTechnique" VARCHAR(100),
  "etchant" VARCHAR(100),
  "etchingTime" NUMERIC(10, 2),
  "etchingTemp" NUMERIC(10, 2),
  "cfIrradiation" BOOLEAN,
  "noOfGrains" INTEGER,
  "area" NUMERIC(12, 6),
  "rhod" NUMERIC(15, 6),
  "nd" INTEGER,
  "rhoS" NUMERIC(15, 6),
  "ns" INTEGER,
  "rhoi" NUMERIC(15, 6),
  "ni" INTEGER,
  "dosimeter" VARCHAR(100),
  "uCont" NUMERIC(10, 2),
  "uStandardDeviation" NUMERIC(10, 2),
  "uCaRatio" NUMERIC(10, 4),
  "uCaRatioStandardDeviation" NUMERIC(10, 4),
  "dPar" NUMERIC(10, 3),
  "dParStandardError" NUMERIC(10, 3),
  "dParNumTotal" INTEGER,
  "dPer" NUMERIC(10, 3),
  "dPerStandardError" NUMERIC(10, 3),
  "dPerNumTotal" INTEGER,
  "rmr0" NUMERIC(10, 4),
  "rmr0StandardDeviation" NUMERIC(10, 4),
  "rmr0Equation" VARCHAR(100),
  "kParameter" NUMERIC(10, 4),
  "kParameterStandardDeviation" NUMERIC(10, 4),
  "meanAgeMa" NUMERIC(10, 2),
  "meanUncertaintyMa" NUMERIC(10, 2),
  "centralAgeMa" NUMERIC(10, 2),
  "centralAgeUncertaintyMa" NUMERIC(10, 2),
  "pooledAgeMa" NUMERIC(10, 2),
  "pooledAgeUncertaintyMa" NUMERIC(10, 2),
  "popAgeMa" NUMERIC(10, 2),
  "popAgeUncertaintyMa" NUMERIC(10, 2),
  "ageUncertaintyType" VARCHAR(50),
  "chi2pct" NUMERIC(10, 2),
  "dispersion" NUMERIC(10, 4),
  "ftAgeEquation" VARCHAR(100),
  "zetaCalibration" NUMERIC(12, 4),
  "zetaUncertainty" NUMERIC(12, 4),
  "zetaUncertaintyType" VARCHAR(50),
  "etchableRange" NUMERIC(10, 3),
  "lambda" VARCHAR(50),
  "lambdaF" VARCHAR(50),
  "qEfficiencyFactor" NUMERIC(10, 4),
  "irradiationReactor" VARCHAR(100),
  "neutronDose" BIGINT,
  "mtl" NUMERIC(10, 3),
  "nTracks" INTEGER,
  "mtl1se" NUMERIC(10, 3),
  "stdDevMu" NUMERIC(10, 3),
  "ageComment" TEXT,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "idx_ftDatapoints_datapointName" ON "earthbank_ftDatapoints"("datapointName");
CREATE INDEX "idx_ftDatapoints_sampleName" ON "earthbank_ftDatapoints"("sampleName");
CREATE INDEX "idx_ftDatapoints_centralAgeMa" ON "earthbank_ftDatapoints"("centralAgeMa");
CREATE INDEX "idx_ftDatapoints_pooledAgeMa" ON "earthbank_ftDatapoints"("pooledAgeMa");

COMMENT ON TABLE "earthbank_ftDatapoints" IS 'Fission-track datapoints from EarthBank FTDatapoint template v2024-11-11';

-- ============================================================================
-- 3. FT COUNT DATA TABLE (15 fields)
-- ============================================================================

CREATE TABLE "earthbank_ftCountData" (
  "id" SERIAL PRIMARY KEY,
  "datapointName" VARCHAR(255) NOT NULL REFERENCES "earthbank_ftDatapoints"("datapointName") ON DELETE CASCADE,
  "grainName" VARCHAR(100) NOT NULL,
  "area" NUMERIC(12, 6),
  "rhoS" NUMERIC(15, 6),
  "ns" INTEGER,
  "rhoi" NUMERIC(15, 6),
  "ni" INTEGER,
  "dPar" NUMERIC(10, 3),
  "dParUncertainty" NUMERIC(10, 3),
  "dParNum" INTEGER,
  "dPer" NUMERIC(10, 3),
  "dPerUncertainty" NUMERIC(10, 3),
  "dPerNum" INTEGER,
  "uncertaintyType" VARCHAR(50),
  "comment" TEXT,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE("datapointName", "grainName")
);

CREATE INDEX "idx_ftCountData_datapointName" ON "earthbank_ftCountData"("datapointName");

COMMENT ON TABLE "earthbank_ftCountData" IS 'FT grain-by-grain count data from EarthBank FTCountData sheet';

-- ============================================================================
-- 4. FT SINGLE GRAIN AGES TABLE (15 fields)
-- ============================================================================

CREATE TABLE "earthbank_ftSingleGrainAges" (
  "id" SERIAL PRIMARY KEY,
  "datapointName" VARCHAR(255) NOT NULL REFERENCES "earthbank_ftDatapoints"("datapointName") ON DELETE CASCADE,
  "mountID" VARCHAR(100),
  "grainName" VARCHAR(100) NOT NULL,
  "etchingTime" NUMERIC(10, 2),
  "uCont" NUMERIC(10, 2),
  "uUncertainty" NUMERIC(10, 2),
  "uCaRatio" NUMERIC(10, 4),
  "uCaRatioUncertainty" NUMERIC(10, 4),
  "uUncertaintyType" VARCHAR(50),
  "ageMa" NUMERIC(10, 2),
  "ageUncertaintyMa" NUMERIC(10, 2),
  "ageUncertaintyType" VARCHAR(50),
  "rmr0" NUMERIC(10, 4),
  "kParameter" NUMERIC(10, 4),
  "comment" TEXT,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE("datapointName", "grainName")
);

CREATE INDEX "idx_ftSingleGrainAges_datapointName" ON "earthbank_ftSingleGrainAges"("datapointName");

COMMENT ON TABLE "earthbank_ftSingleGrainAges" IS 'FT single grain ages from EarthBank FTSingleGrain sheet';

-- ============================================================================
-- 5. FT TRACK LENGTH DATA TABLE (23 fields)
-- ============================================================================

CREATE TABLE "earthbank_ftTrackLengthData" (
  "id" SERIAL PRIMARY KEY,
  "datapointName" VARCHAR(255) NOT NULL REFERENCES "earthbank_ftDatapoints"("datapointName") ON DELETE CASCADE,
  "mountID" VARCHAR(100),
  "etchingTime" NUMERIC(10, 2),
  "grainName" VARCHAR(100),
  "trackID" VARCHAR(100),
  "trackType" VARCHAR(100),
  "apparentLength" NUMERIC(10, 3),
  "correctedZDepth" NUMERIC(10, 3),
  "trackLength" NUMERIC(10, 3),
  "azimuth" NUMERIC(10, 2),
  "dip" NUMERIC(10, 2),
  "cAxisAngle" NUMERIC(10, 2),
  "cAxisCorrectedLength" NUMERIC(10, 3),
  "dPar" NUMERIC(10, 3),
  "dParUncertainty" NUMERIC(10, 3),
  "dParNum" INTEGER,
  "dPer" NUMERIC(10, 3),
  "dPerUncertainty" NUMERIC(10, 3),
  "dPerNum" INTEGER,
  "uncertaintyType" VARCHAR(50),
  "rmr0" NUMERIC(10, 4),
  "kParameter" NUMERIC(10, 4),
  "comment" TEXT,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "idx_ftTrackLengthData_datapointName" ON "earthbank_ftTrackLengthData"("datapointName");
CREATE INDEX "idx_ftTrackLengthData_trackLength" ON "earthbank_ftTrackLengthData"("trackLength");

COMMENT ON TABLE "earthbank_ftTrackLengthData" IS 'FT track-by-track length measurements from EarthBank FTLengthData sheet';

-- ============================================================================
-- 6. FT BINNED LENGTH DATA TABLE (31 fields)
-- ============================================================================

CREATE TABLE "earthbank_ftBinnedLengthData" (
  "id" SERIAL PRIMARY KEY,
  "datapointName" VARCHAR(255) NOT NULL REFERENCES "earthbank_ftDatapoints"("datapointName") ON DELETE CASCADE,
  "mountID" VARCHAR(100),
  "etchingTime" NUMERIC(10, 2),
  "dParAvg" NUMERIC(10, 3),
  "dParError" NUMERIC(10, 3),
  "dParNumTotal" INTEGER,
  "dPer" NUMERIC(10, 3),
  "dPerError" NUMERIC(10, 3),
  "dPerNumTotal" INTEGER,
  "uncertaintyType" VARCHAR(50),
  "i0x1" INTEGER DEFAULT 0,
  "i1x2" INTEGER DEFAULT 0,
  "i2x3" INTEGER DEFAULT 0,
  "i3x4" INTEGER DEFAULT 0,
  "i4x5" INTEGER DEFAULT 0,
  "i5x6" INTEGER DEFAULT 0,
  "i6x7" INTEGER DEFAULT 0,
  "i7x8" INTEGER DEFAULT 0,
  "i8x9" INTEGER DEFAULT 0,
  "i9x10" INTEGER DEFAULT 0,
  "i10x11" INTEGER DEFAULT 0,
  "i11x12" INTEGER DEFAULT 0,
  "i12x13" INTEGER DEFAULT 0,
  "i13x14" INTEGER DEFAULT 0,
  "i14x15" INTEGER DEFAULT 0,
  "i15x16" INTEGER DEFAULT 0,
  "i16x17" INTEGER DEFAULT 0,
  "i17x18" INTEGER DEFAULT 0,
  "i18x19" INTEGER DEFAULT 0,
  "i19x20" INTEGER DEFAULT 0,
  "comment" TEXT,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE("datapointName")
);

CREATE INDEX "idx_ftBinnedLengthData_datapointName" ON "earthbank_ftBinnedLengthData"("datapointName");

COMMENT ON TABLE "earthbank_ftBinnedLengthData" IS 'FT binned track length histogram from EarthBank FTBinnedLengthData sheet';

-- ============================================================================
-- 7. HE DATAPOINTS TABLE (45 fields from HeDatapoint.template.v2024-11-11.xlsx)
-- ============================================================================

CREATE TABLE "earthbank_heDatapoints" (
  "id" SERIAL PRIMARY KEY,
  "datapointName" VARCHAR(255) NOT NULL UNIQUE,
  "datapackageName" VARCHAR(255),
  "sampleName" VARCHAR(255) NOT NULL REFERENCES "earthbank_samples"("sampleName") ON DELETE CASCADE,
  "literature" TEXT,
  "laboratory" VARCHAR(255),
  "analyst" VARCHAR(255),
  "analysisDate" TIMESTAMP,
  "mineral" VARCHAR(100),
  "mountID" VARCHAR(100),
  "referenceMaterial" VARCHAR(100),
  "batchID" VARCHAR(100),
  "numAliquots" INTEGER,
  "meanUncorrectedHeAge" NUMERIC(10, 2),
  "meanUncorrectedHeAgeUncertainty" NUMERIC(10, 2),
  "meanUncorrectedHeAgeUncertaintyType" VARCHAR(50),
  "weightedMeanUncorrectedHeAge" NUMERIC(10, 2),
  "weightedMeanUncorrectedHeAgeUncertainty" NUMERIC(10, 2),
  "weightedMeanUncorrectedHeAgeUncertaintyType" VARCHAR(50),
  "mswdUncorrected" NUMERIC(10, 4),
  "confidenceInterval95Uncorrected" NUMERIC(10, 2),
  "chi2pctUncorrected" NUMERIC(10, 2),
  "iqrUncorrected" NUMERIC(10, 2),
  "meanCorrectedHeAge" NUMERIC(10, 2),
  "meanCorrectedHeAgeUncertainty" NUMERIC(10, 2),
  "meanCorrectedHeAgeUncertaintyType" VARCHAR(50),
  "weightedMeanCorrectedHeAge" NUMERIC(10, 2),
  "weightedMeanCorrectedHeAgeUncertainty" NUMERIC(10, 2),
  "weightedMeanCorrectedHeAgeUncertaintyType" VARCHAR(50),
  "mswdCorrected" NUMERIC(10, 4),
  "confidenceInterval95Corrected" NUMERIC(10, 2),
  "chi2pctCorrected" NUMERIC(10, 2),
  "iqrCorrected" NUMERIC(10, 2),
  "uncertaintyComment" TEXT,
  "pitMeasuringTechnique" VARCHAR(100),
  "pitVolumeSoftware" VARCHAR(100),
  "insituHeTechnique" VARCHAR(100),
  "insituParentTechnique" VARCHAR(100),
  "grainDimensionEquations" VARCHAR(100),
  "alphaStopDistRef" VARCHAR(255),
  "ftEquation" VARCHAR(100),
  "rSVequation" VARCHAR(100),
  "rFTequation" VARCHAR(100),
  "eUEquation" VARCHAR(100),
  "heAgeEquation" VARCHAR(100),
  "correctedHeAgeMethod" VARCHAR(100),
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "idx_heDatapoints_datapointName" ON "earthbank_heDatapoints"("datapointName");
CREATE INDEX "idx_heDatapoints_sampleName" ON "earthbank_heDatapoints"("sampleName");
CREATE INDEX "idx_heDatapoints_meanCorrectedHeAge" ON "earthbank_heDatapoints"("meanCorrectedHeAge");

COMMENT ON TABLE "earthbank_heDatapoints" IS '(U-Th)/He datapoints from EarthBank HeDatapoint template v2024-11-11';

-- ============================================================================
-- 8. HE WHOLE GRAIN DATA TABLE (75 fields)
-- ============================================================================

CREATE TABLE "earthbank_heWholeGrainData" (
  "id" SERIAL PRIMARY KEY,
  "datapointName" VARCHAR(255) NOT NULL REFERENCES "earthbank_heDatapoints"("datapointName") ON DELETE CASCADE,
  "aliquotID" VARCHAR(100) NOT NULL,
  "aliquotType" VARCHAR(100),
  "numAliquots" INTEGER,
  "crysFrag" VARCHAR(100),
  "aliquotMorphology" VARCHAR(100),
  "aliquotGeometry" VARCHAR(100),
  "aliquotLength" NUMERIC(12, 3),
  "avgAliquotLengthSD" NUMERIC(12, 3),
  "aliquotWidth" NUMERIC(12, 3),
  "avgAliquotWidthSD" NUMERIC(12, 3),
  "aliquotHeight" NUMERIC(12, 3),
  "avgAliquotHeightSD" NUMERIC(12, 3),
  "aliquotSurfaceArea" NUMERIC(15, 3),
  "avgAliquotSurfaceAreaSD" NUMERIC(15, 3),
  "aliquotVolume" NUMERIC(15, 3),
  "avgAliquotVolumeSD" NUMERIC(15, 3),
  "pyrTerminationHeight1" NUMERIC(12, 3),
  "pyrTerminationHeight1SD" NUMERIC(12, 3),
  "pyrTerminationHeight2" NUMERIC(12, 3),
  "pyrTerminationHeight2SD" NUMERIC(12, 3),
  "vsRatio" NUMERIC(10, 4),
  "ft" NUMERIC(10, 4),
  "ftUncertainty" NUMERIC(10, 4),
  "ftUncertaintyType" VARCHAR(50),
  "rSV" NUMERIC(12, 3),
  "rFT" NUMERIC(12, 3),
  "assumedMineralDensity" NUMERIC(10, 4),
  "caContent" NUMERIC(15, 6),
  "caContentUncertainty" NUMERIC(15, 6),
  "caContentUncertaintyType" VARCHAR(50),
  "zrContent" NUMERIC(15, 6),
  "zrContentUncertainty" NUMERIC(15, 6),
  "zrContentUncertaintyType" VARCHAR(50),
  "minChemFormula" VARCHAR(100),
  "aliquotMass" NUMERIC(12, 6),
  "aliquotMassUncertainty" NUMERIC(12, 6),
  "aliquotMassUncertaintyType" VARCHAR(50),
  "he4Amount" NUMERIC(15, 6),
  "he4AmountUncertainty" NUMERIC(15, 6),
  "he4AmountUncertaintyType" VARCHAR(50),
  "he4Concentration" NUMERIC(15, 6),
  "he4ConcentrationUncertainty" NUMERIC(15, 6),
  "he4ConcentrationUncertaintyType" VARCHAR(50),
  "uAmount" NUMERIC(15, 6),
  "uAmountUncertainty" NUMERIC(15, 6),
  "uAmountUncertaintyType" VARCHAR(50),
  "uConcentration" NUMERIC(10, 2),
  "uConcentrationUncertainty" NUMERIC(10, 2),
  "uConcentrationUncertaintyType" VARCHAR(50),
  "thAmount" NUMERIC(15, 6),
  "thAmountUncertainty" NUMERIC(15, 6),
  "thAmountUncertaintyType" VARCHAR(50),
  "thConcentration" NUMERIC(10, 2),
  "thConcentrationUncertainty" NUMERIC(10, 2),
  "thConcentrationUncertaintyType" VARCHAR(50),
  "smAmount" NUMERIC(15, 6),
  "smAmountUncertainty" NUMERIC(15, 6),
  "smAmountUncertaintyType" VARCHAR(50),
  "smConcentration" NUMERIC(10, 2),
  "smConcentrationUncertainty" NUMERIC(10, 2),
  "smConcentrationUncertaintyType" VARCHAR(50),
  "thURatio" NUMERIC(10, 4),
  "eU" NUMERIC(10, 2),
  "eUUncertainty" NUMERIC(10, 2),
  "eUUncertaintyType" VARCHAR(50),
  "uncorrectedHeAge" NUMERIC(10, 2),
  "uncorrectedHeAgeUncertainty" NUMERIC(10, 2),
  "uncorrectedHeAgeUncertaintyType" VARCHAR(50),
  "correctedHeAge" NUMERIC(10, 2),
  "tau" NUMERIC(10, 2),
  "tauUncertaintyType" VARCHAR(50),
  "tauFT" NUMERIC(10, 2),
  "tauFTUncertaintyType" VARCHAR(50),
  "comment" TEXT,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE("datapointName", "aliquotID")
);

CREATE INDEX "idx_heWholeGrainData_datapointName" ON "earthbank_heWholeGrainData"("datapointName");
CREATE INDEX "idx_heWholeGrainData_correctedHeAge" ON "earthbank_heWholeGrainData"("correctedHeAge");
CREATE INDEX "idx_heWholeGrainData_eU" ON "earthbank_heWholeGrainData"("eU");

COMMENT ON TABLE "earthbank_heWholeGrainData" IS 'He whole-grain aliquot data from EarthBank HeWholeGrain sheet';

-- ============================================================================
-- GRANTS (Neon requires explicit permissions)
-- ============================================================================

GRANT ALL ON "earthbank_samples" TO neondb_owner;
GRANT ALL ON "earthbank_ftDatapoints" TO neondb_owner;
GRANT ALL ON "earthbank_ftCountData" TO neondb_owner;
GRANT ALL ON "earthbank_ftSingleGrainAges" TO neondb_owner;
GRANT ALL ON "earthbank_ftTrackLengthData" TO neondb_owner;
GRANT ALL ON "earthbank_ftBinnedLengthData" TO neondb_owner;
GRANT ALL ON "earthbank_heDatapoints" TO neondb_owner;
GRANT ALL ON "earthbank_heWholeGrainData" TO neondb_owner;

GRANT ALL ON SEQUENCE "earthbank_samples_id_seq" TO neondb_owner;
GRANT ALL ON SEQUENCE "earthbank_ftDatapoints_id_seq" TO neondb_owner;
GRANT ALL ON SEQUENCE "earthbank_ftCountData_id_seq" TO neondb_owner;
GRANT ALL ON SEQUENCE "earthbank_ftSingleGrainAges_id_seq" TO neondb_owner;
GRANT ALL ON SEQUENCE "earthbank_ftTrackLengthData_id_seq" TO neondb_owner;
GRANT ALL ON SEQUENCE "earthbank_ftBinnedLengthData_id_seq" TO neondb_owner;
GRANT ALL ON SEQUENCE "earthbank_heDatapoints_id_seq" TO neondb_owner;
GRANT ALL ON SEQUENCE "earthbank_heWholeGrainData_id_seq" TO neondb_owner;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- Summary:
-- Created 8 tables with exact EarthBank camelCase field names
-- Total columns: 30 + 66 + 15 + 15 + 23 + 31 + 45 + 75 = 300 fields
-- All tables use double-quoted identifiers to preserve case
-- Foreign keys link datapoints to samples
-- Indexes on critical search/filter fields
