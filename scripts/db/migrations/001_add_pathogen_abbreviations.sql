-- Migration: Add abbreviation column to pathogens table
-- Created: 2025-11-12
-- Purpose: Enable disease abbreviation lookup (CMV, HIV, HCV, etc.)

BEGIN;

-- Add abbreviation column
ALTER TABLE pathogens
ADD COLUMN abbreviation VARCHAR(20) NULL;

-- Create unique index to prevent duplicate abbreviations
CREATE UNIQUE INDEX idx_pathogens_abbreviation
ON pathogens(abbreviation)
WHERE abbreviation IS NOT NULL;

-- Create lookup index for fast queries by abbreviation
CREATE INDEX idx_pathogens_abbreviation_lookup
ON pathogens(abbreviation);

COMMIT;
