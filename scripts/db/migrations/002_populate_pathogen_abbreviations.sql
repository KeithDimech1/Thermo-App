-- Migration: Populate pathogen abbreviations
-- Created: 2025-11-12
-- Purpose: Populate abbreviations based on Assay_Disease_Relationship_Table.md
-- Reference: build-data/documentation/Assay_Disease_Relationship_Table.md

BEGIN;

-- Update abbreviations based on relationship table mappings
UPDATE pathogens SET abbreviation = 'CMV'
WHERE name ILIKE '%cytomegalovirus%' OR scientific_name ILIKE '%cytomegalovirus%';

UPDATE pathogens SET abbreviation = 'CT'
WHERE name ILIKE '%chlamydia trachomatis%' OR scientific_name ILIKE '%chlamydia trachomatis%';

UPDATE pathogens SET abbreviation = 'EBV'
WHERE name ILIKE '%epstein-barr%' OR scientific_name ILIKE '%epstein-barr%';

UPDATE pathogens SET abbreviation = 'HAV'
WHERE (name ILIKE '%hepatitis a%' OR scientific_name ILIKE '%hepatitis a%')
AND NOT (name ILIKE '%hepatitis b%' OR name ILIKE '%hepatitis c%');

UPDATE pathogens SET abbreviation = 'HBV'
WHERE (name ILIKE '%hepatitis b%' OR scientific_name ILIKE '%hepatitis b%')
AND NOT (name ILIKE '%hepatitis c%');

UPDATE pathogens SET abbreviation = 'HCV'
WHERE name ILIKE '%hepatitis c%' OR scientific_name ILIKE '%hepatitis c%';

UPDATE pathogens SET abbreviation = 'HIV'
WHERE name ILIKE '%immunodeficiency%' OR scientific_name ILIKE '%immunodeficiency%'
AND NOT (name ILIKE '%htlv%' OR name ILIKE '%t-cell%');

UPDATE pathogens SET abbreviation = 'HPV'
WHERE name ILIKE '%papillomavirus%' OR scientific_name ILIKE '%papillomavirus%';

UPDATE pathogens SET abbreviation = 'HSV'
WHERE (name ILIKE '%herpes simplex%' OR scientific_name ILIKE '%herpes simplex%')
AND NOT (name ILIKE '%varicella%' OR name ILIKE '%zoster%');

UPDATE pathogens SET abbreviation = 'HTLV'
WHERE name ILIKE '%t-cell lymphotropic%' OR name ILIKE '%htlv%'
OR scientific_name ILIKE '%t-cell lymphotropic%' OR scientific_name ILIKE '%htlv%';

UPDATE pathogens SET abbreviation = 'Measles'
WHERE (name ILIKE '%measles%' OR scientific_name ILIKE '%measles%' OR name ILIKE '%rubeola%')
AND NOT (name ILIKE '%rubella%');

UPDATE pathogens SET abbreviation = 'Mumps'
WHERE name ILIKE '%mumps%' OR scientific_name ILIKE '%mumps%';

UPDATE pathogens SET abbreviation = 'NG'
WHERE name ILIKE '%neisseria gonorrhoeae%' OR name ILIKE '%gonorrhoeae%'
OR scientific_name ILIKE '%neisseria gonorrhoeae%' OR scientific_name ILIKE '%gonorrhoeae%';

UPDATE pathogens SET abbreviation = 'Parvo B19'
WHERE name ILIKE '%parvovirus b19%' OR name ILIKE '%parvo%b19%'
OR scientific_name ILIKE '%parvovirus b19%';

UPDATE pathogens SET abbreviation = 'Rubella'
WHERE name ILIKE '%rubella%' OR scientific_name ILIKE '%rubella%'
AND NOT (name ILIKE '%measles%' OR name ILIKE '%rubeola%');

UPDATE pathogens SET abbreviation = 'SARS-CoV-2'
WHERE name ILIKE '%sars-cov-2%' OR name ILIKE '%coronavirus 2%' OR name ILIKE '%covid%'
OR scientific_name ILIKE '%sars-cov-2%' OR scientific_name ILIKE '%coronavirus 2%';

UPDATE pathogens SET abbreviation = 'Syphilis'
WHERE name ILIKE '%treponema pallidum%' OR name ILIKE '%syphilis%'
OR scientific_name ILIKE '%treponema pallidum%' OR scientific_name ILIKE '%syphilis%';

UPDATE pathogens SET abbreviation = 'Toxoplasma'
WHERE name ILIKE '%toxoplasma%' OR scientific_name ILIKE '%toxoplasma%';

UPDATE pathogens SET abbreviation = 'VZV'
WHERE name ILIKE '%varicella-zoster%' OR name ILIKE '%varicella%zoster%'
OR scientific_name ILIKE '%varicella-zoster%' OR scientific_name ILIKE '%varicella%zoster%';

-- Show results
SELECT
    abbreviation,
    name,
    scientific_name,
    CASE WHEN abbreviation IS NULL THEN '⚠️ MISSING' ELSE '✓' END as status
FROM pathogens
ORDER BY abbreviation NULLS LAST, name;

-- Count statistics
SELECT
    COUNT(*) as total_pathogens,
    COUNT(abbreviation) as with_abbreviations,
    COUNT(*) - COUNT(abbreviation) as missing_abbreviations
FROM pathogens;

COMMIT;
