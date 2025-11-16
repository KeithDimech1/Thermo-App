-- Add abbreviation column to pathogens table and populate it
-- Executes on production (Neon) database
-- Created: 2025-11-12

BEGIN;

-- Step 1: Add abbreviation column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pathogens' AND column_name = 'abbreviation'
  ) THEN
    ALTER TABLE pathogens ADD COLUMN abbreviation VARCHAR(20) NULL;
    RAISE NOTICE 'Added abbreviation column to pathogens table';
  ELSE
    RAISE NOTICE 'abbreviation column already exists';
  END IF;
END $$;

-- Step 2: Create unique index
CREATE UNIQUE INDEX IF NOT EXISTS idx_pathogens_abbreviation
ON pathogens(abbreviation)
WHERE abbreviation IS NOT NULL;

-- Step 3: Create lookup index
CREATE INDEX IF NOT EXISTS idx_pathogens_abbreviation_lookup
ON pathogens(abbreviation);

-- Step 4: Update existing pathogens with abbreviations
UPDATE pathogens SET abbreviation = 'CMV' WHERE name ILIKE '%cytomegalovirus%';
UPDATE pathogens SET abbreviation = 'CT' WHERE name ILIKE '%chlamydia trachomatis%';
UPDATE pathogens SET abbreviation = 'EBV' WHERE name ILIKE '%epstein-barr%';
UPDATE pathogens SET abbreviation = 'HAV' WHERE name ILIKE '%hepatitis a%' AND name NOT ILIKE '%hepatitis b%' AND name NOT ILIKE '%hepatitis c%';
UPDATE pathogens SET abbreviation = 'HBV' WHERE name ILIKE '%hepatitis b%';
UPDATE pathogens SET abbreviation = 'HCV' WHERE name ILIKE '%hepatitis c%';
UPDATE pathogens SET abbreviation = 'HIV' WHERE name ILIKE '%immunodeficiency%';
UPDATE pathogens SET abbreviation = 'HPV' WHERE name ILIKE '%papillomavirus%';
UPDATE pathogens SET abbreviation = 'HSV' WHERE name ILIKE '%herpes simplex%';
UPDATE pathogens SET abbreviation = 'HTLV' WHERE name ILIKE '%t-cell lymphotropic%' OR name ILIKE '%t lymphotropic%';
UPDATE pathogens SET abbreviation = 'Measles' WHERE name ILIKE '%measles%' AND name NOT ILIKE '%rubella%';
UPDATE pathogens SET abbreviation = 'Mumps' WHERE name ILIKE '%mumps%';
UPDATE pathogens SET abbreviation = 'NG' WHERE name ILIKE '%neisseria gonorrhoeae%' OR name ILIKE '%gonorrhea%';
UPDATE pathogens SET abbreviation = 'Parvo B19' WHERE name ILIKE '%parvovirus b19%' OR name ILIKE '%parvo b19%';
UPDATE pathogens SET abbreviation = 'Rubella' WHERE name ILIKE '%rubella%';
UPDATE pathogens SET abbreviation = 'SARS-CoV-2' WHERE name ILIKE '%sars-cov-2%' OR name ILIKE '%coronavirus 2%' OR name ILIKE '%covid%';
UPDATE pathogens SET abbreviation = 'Syphilis' WHERE name ILIKE '%treponema pallidum%' OR name ILIKE '%syphilis%';
UPDATE pathogens SET abbreviation = 'Toxoplasma' WHERE name ILIKE '%toxoplasma%';
UPDATE pathogens SET abbreviation = 'VZV' WHERE name ILIKE '%varicella-zoster%' OR name ILIKE '%varicella zoster%';

-- Step 5: Show results
SELECT id, name, abbreviation, scientific_name
FROM pathogens
ORDER BY abbreviation NULLS LAST, name;

COMMIT;
