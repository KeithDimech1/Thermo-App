-- ============================================================================
-- IDEA-014: EarthBank Native Schema Migration (CSV-Aligned)
-- Create tables with EXACT field names from transformed EarthBank CSVs
-- This ensures zero translation needed for import/export
-- ============================================================================

-- Enable UUID extension for primary keys
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop old tables if they exist
DROP TABLE IF EXISTS "earthbank_heWholeGrainData" CASCADE;
DROP TABLE IF EXISTS "earthbank_heDatapoints" CASCADE;
DROP TABLE IF EXISTS "earthbank_ftBinnedLengthData" CASCADE;
DROP TABLE IF EXISTS "earthbank_ftTrackLengthData" CASCADE;
DROP TABLE IF EXISTS "earthbank_ftSingleGrainAges" CASCADE;
DROP TABLE IF EXISTS "earthbank_ftCountData" CASCADE;
DROP TABLE IF EXISTS "earthbank_ftDatapoints" CASCADE;
DROP TABLE IF EXISTS "earthbank_samples" CASCADE;

-- ============================================================================
-- 1. SAMPLES TABLE (26 unique fields from 3 datasets)
-- ============================================================================

CREATE TABLE "earthbank_samples" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "sampleID" VARCHAR(255) NOT NULL UNIQUE,
  "IGSN" VARCHAR(20) UNIQUE,
  "latitude" NUMERIC(10, 6),
  "longitude" NUMERIC(10, 6),
  "elevationM" NUMERIC(10, 2),
  "geodeticDatum" VARCHAR(50),
  "verticalDatum" VARCHAR(50),
  "mineral" VARCHAR(100),
  "mineralType" VARCHAR(100),
  "lithology" VARCHAR(100),
  "sampleKind" VARCHAR(100),
  "sampleAgeMa" NUMERIC(10, 2),
  "collector" VARCHAR(255),
  "collectionDate" DATE,
  "collectionYear" INTEGER,
  "datasetID" VARCHAR(100),
  "nAFTGrains" INTEGER,
  "nAHeGrains" INTEGER,
  "quadrangle" VARCHAR(255),
  "faultBlock" VARCHAR(100),
  "igneousAgeMa" NUMERIC(10, 2),
  "igneousAgeErrorMa" NUMERIC(10, 2),
  "project" VARCHAR(255),
  "country" VARCHAR(100),
  "stateProvince" VARCHAR(100),
  "locationDescription" TEXT,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "idx_samples_sampleID" ON "earthbank_samples"("sampleID");
CREATE INDEX "idx_samples_IGSN" ON "earthbank_samples"("IGSN");
CREATE INDEX "idx_samples_location" ON "earthbank_samples"("latitude", "longitude");
CREATE INDEX "idx_samples_datasetID" ON "earthbank_samples"("datasetID");

COMMENT ON TABLE "earthbank_samples" IS 'Sample metadata - exact CSV field names from transformed EarthBank data';

-- ============================================================================
-- 2. FT DATAPOINTS TABLE (30 unique fields from 2 datasets)
-- ============================================================================

CREATE TABLE "earthbank_ftDatapoints" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "datapointName" VARCHAR(255) NOT NULL UNIQUE,
  "sampleID" VARCHAR(255) NOT NULL REFERENCES "earthbank_samples"("sampleID") ON DELETE CASCADE,
  "laboratory" VARCHAR(255),
  "analyst" VARCHAR(255),
  "analysisDate" TIMESTAMP,
  "labNumber" VARCHAR(100),
  "ftMethod" VARCHAR(100),
  "mineralType" VARCHAR(100),
  "nGrains" INTEGER,
  "totalNs" INTEGER,
  "rhoS" NUMERIC(15, 6),
  "uPpm" NUMERIC(10, 2),
  "uPpmStdDev" NUMERIC(10, 2),
  "uConcentration" NUMERIC(10, 2),
  "dPar" NUMERIC(10, 3),
  "dParUncertainty" NUMERIC(10, 3),
  "pChi2" NUMERIC(10, 2),
  "dispersion" NUMERIC(10, 4),
  "pooledAgeMa" NUMERIC(10, 2),
  "pooledAgeUncertainty" NUMERIC(10, 2),
  "centralAgeMa" NUMERIC(10, 2),
  "centralAgeUncertainty" NUMERIC(10, 2),
  "mtl" NUMERIC(10, 3),
  "mtlUncertainty" NUMERIC(10, 3),
  "stdDevMu" NUMERIC(10, 3),
  "nTracks" INTEGER,
  "sigmaP" NUMERIC(10, 4),
  "sigmaPError" NUMERIC(10, 4),
  "zeta" NUMERIC(12, 4),
  "zetaUncertainty" NUMERIC(12, 4),
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "idx_ftDatapoints_datapointName" ON "earthbank_ftDatapoints"("datapointName");
CREATE INDEX "idx_ftDatapoints_sampleID" ON "earthbank_ftDatapoints"("sampleID");
CREATE INDEX "idx_ftDatapoints_centralAgeMa" ON "earthbank_ftDatapoints"("centralAgeMa");
CREATE INDEX "idx_ftDatapoints_pooledAgeMa" ON "earthbank_ftDatapoints"("pooledAgeMa");

COMMENT ON TABLE "earthbank_ftDatapoints" IS 'Fission-track datapoints - exact CSV field names';

-- ============================================================================
-- 3. FT TRACK LENGTH DATA TABLE (8 fields from 1 dataset)
-- ============================================================================

CREATE TABLE "earthbank_ftTrackLengthData" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "datapointName" VARCHAR(255) NOT NULL REFERENCES "earthbank_ftDatapoints"("datapointName") ON DELETE CASCADE,
  "sampleID" VARCHAR(255),
  "grainName" VARCHAR(100),
  "trackID" VARCHAR(100),
  "trackType" VARCHAR(100),
  "lengthUm" NUMERIC(10, 3),
  "cAxisAngleDeg" NUMERIC(10, 2),
  "dPar" NUMERIC(10, 3),
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "idx_ftTrackLengthData_datapointName" ON "earthbank_ftTrackLengthData"("datapointName");
CREATE INDEX "idx_ftTrackLengthData_lengthUm" ON "earthbank_ftTrackLengthData"("lengthUm");

COMMENT ON TABLE "earthbank_ftTrackLengthData" IS 'FT track-by-track length measurements - exact CSV field names';

-- ============================================================================
-- 4. HE DATAPOINTS TABLE (11 fields from 1 dataset)
-- ============================================================================

CREATE TABLE "earthbank_heDatapoints" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "datapointName" VARCHAR(255) NOT NULL UNIQUE,
  "sampleID" VARCHAR(255) NOT NULL REFERENCES "earthbank_samples"("sampleID") ON DELETE CASCADE,
  "ftMethod" VARCHAR(100),
  "laboratory" VARCHAR(255),
  "analyst" VARCHAR(255),
  "analysisDate" TIMESTAMP,
  "nGrains" INTEGER,
  "meanCorrectedAgeMa" NUMERIC(10, 2),
  "meanCorrectedAgeUncertainty" NUMERIC(10, 2),
  "meanUncorrectedAgeMa" NUMERIC(10, 2),
  "notes" TEXT,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "idx_heDatapoints_datapointName" ON "earthbank_heDatapoints"("datapointName");
CREATE INDEX "idx_heDatapoints_sampleID" ON "earthbank_heDatapoints"("sampleID");
CREATE INDEX "idx_heDatapoints_meanCorrectedAgeMa" ON "earthbank_heDatapoints"("meanCorrectedAgeMa");

COMMENT ON TABLE "earthbank_heDatapoints" IS '(U-Th)/He datapoints - exact CSV field names';

-- ============================================================================
-- 5. HE WHOLE GRAIN DATA TABLE (36 unique fields from 2 datasets)
-- ============================================================================

CREATE TABLE "earthbank_heWholeGrainData" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "datapointName" VARCHAR(255) NOT NULL REFERENCES "earthbank_heDatapoints"("datapointName") ON DELETE CASCADE,
  "sampleID" VARCHAR(255),
  "grainName" VARCHAR(100) NOT NULL,
  "correctedHeAge" NUMERIC(10, 2),
  "correctedHeAgeUncertainty" NUMERIC(10, 2),
  "uncorrectedHeAge" NUMERIC(10, 2),
  "uncorrectedHeAgeUncertainty" NUMERIC(10, 2),
  "ft" NUMERIC(10, 4),
  "ftU238" NUMERIC(10, 4),
  "ftU235" NUMERIC(10, 4),
  "ftTh232" NUMERIC(10, 4),
  "ftSm147" NUMERIC(10, 4),
  "he4Concentration" NUMERIC(15, 6),
  "he4ConcentrationUncertainty" NUMERIC(15, 6),
  "heNmolG" NUMERIC(15, 6),
  "heNmolGUncertainty" NUMERIC(15, 6),
  "uConcentration" NUMERIC(10, 2),
  "uConcentrationUncertainty" NUMERIC(10, 2),
  "uNg" NUMERIC(15, 6),
  "uNgUncertainty" NUMERIC(15, 6),
  "thConcentration" NUMERIC(10, 2),
  "thConcentrationUncertainty" NUMERIC(10, 2),
  "thNg" NUMERIC(15, 6),
  "thNgUncertainty" NUMERIC(15, 6),
  "smConcentration" NUMERIC(10, 2),
  "smConcentrationUncertainty" NUMERIC(10, 2),
  "smNg" NUMERIC(15, 6),
  "smNgUncertainty" NUMERIC(15, 6),
  "eU" NUMERIC(10, 2),
  "eUUncertainty" NUMERIC(10, 2),
  "rsUm" NUMERIC(12, 3),
  "massMg" NUMERIC(12, 6),
  "geometry" VARCHAR(100),
  "lengthUm" NUMERIC(12, 3),
  "widthUm" NUMERIC(12, 3),
  "numPits" INTEGER,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE("datapointName", "grainName")
);

CREATE INDEX "idx_heWholeGrainData_datapointName" ON "earthbank_heWholeGrainData"("datapointName");
CREATE INDEX "idx_heWholeGrainData_correctedHeAge" ON "earthbank_heWholeGrainData"("correctedHeAge");
CREATE INDEX "idx_heWholeGrainData_eU" ON "earthbank_heWholeGrainData"("eU");

COMMENT ON TABLE "earthbank_heWholeGrainData" IS 'He whole-grain aliquot data - exact CSV field names';

-- ============================================================================
-- GRANTS (Neon requires explicit permissions)
-- ============================================================================

GRANT ALL ON "earthbank_samples" TO neondb_owner;
GRANT ALL ON "earthbank_ftDatapoints" TO neondb_owner;
GRANT ALL ON "earthbank_ftTrackLengthData" TO neondb_owner;
GRANT ALL ON "earthbank_heDatapoints" TO neondb_owner;
GRANT ALL ON "earthbank_heWholeGrainData" TO neondb_owner;

-- ============================================================================
-- MIGRATION COMPLETE - CSV-ALIGNED SCHEMA
-- ============================================================================

-- Summary:
-- Created 5 tables with exact CSV field names (no translation needed)
-- Total columns: 26 + 30 + 8 + 11 + 36 = 111 fields
-- All primary keys: UUID (globally unique)
-- All foreign keys reference sampleID (natural key)
-- Field names match transformed EarthBank CSVs exactly
