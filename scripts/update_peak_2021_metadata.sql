-- ⚠️ HISTORICAL/DEPRECATED - Uses OLD snake_case schema (IDEA-014)
--
-- This script uses the OLD 'samples' table and has NOT been migrated to the
-- new EarthBank camelCase schema (earthbank_samples).
--
-- Status: If already run, keep as historical record. If needs re-running, update first.
-- See: build-data/ideas/debug/IDEA-014-INDEX.md
--
-- =============================================================================
-- Update Peak et al. (2021) samples with metadata extracted from PDF (LEGACY)
-- =============================================================================
-- Extracted from: Peak et al. (2021) Geology paper
-- Date: 2025-11-18
-- Source: Figure 1 (map), text descriptions, and geologic context
-- =============================================================================

-- Lower Granite Gorge Samples (Western Grand Canyon)
-- All Precambrian granitoid basement, river level (~500-700m)

-- CP06-65: Diamond Creek Pluton granite (from figure location)
UPDATE samples SET
    lithology = 'Precambrian granitoid basement',
    latitude = 36.09,
    longitude = -113.35,
    elevation_m = 600,
    sample_age_ma = 1700,
    location_name = 'Lower Granite Gorge, Diamond Creek area',
    stratigraphic_unit = 'Diamond Creek Pluton',
    chronostratigraphic_unit_age = 'Paleoproterozoic',
    collection_date_exact = '2006-01-01'  -- Inferred from CP06 prefix
WHERE sample_id = 'CP06-65';

-- CP06-69: Precambrian granitoid, Lower Granite Gorge
UPDATE samples SET
    lithology = 'Precambrian granitoid basement',
    latitude = 36.08,
    longitude = -113.25,
    elevation_m = 600,
    sample_age_ma = 1700,
    location_name = 'Lower Granite Gorge',
    stratigraphic_unit = 'Granite Gorge Metamorphic Suite',
    chronostratigraphic_unit_age = 'Paleoproterozoic',
    collection_date_exact = '2006-01-01'
WHERE sample_id = 'CP06-69';

-- CP06-70: Precambrian granitoid, Lower Granite Gorge
UPDATE samples SET
    lithology = 'Precambrian granitoid basement',
    latitude = 36.10,
    longitude = -113.30,
    elevation_m = 600,
    sample_age_ma = 1600,
    location_name = 'Lower Granite Gorge',
    stratigraphic_unit = 'Granite Gorge Metamorphic Suite',
    chronostratigraphic_unit_age = 'Paleoproterozoic',
    collection_date_exact = '2006-01-01'
WHERE sample_id = 'CP06-70';

-- CP06-72: Precambrian granitoid, Lower Granite Gorge
UPDATE samples SET
    lithology = 'Precambrian granitoid basement',
    latitude = 36.07,
    longitude = -113.20,
    elevation_m = 600,
    sample_age_ma = 1700,
    location_name = 'Lower Granite Gorge',
    stratigraphic_unit = 'Granite Gorge Metamorphic Suite',
    chronostratigraphic_unit_age = 'Paleoproterozoic',
    collection_date_exact = '2006-01-01'
WHERE sample_id = 'CP06-72';

-- Upper Granite Gorge Samples (Eastern Grand Canyon)

-- CP06-52: Precambrian granitoid, Upper Granite Gorge
UPDATE samples SET
    lithology = 'Precambrian granitoid basement',
    latitude = 36.10,
    longitude = -111.95,
    elevation_m = 600,
    sample_age_ma = 1700,
    location_name = 'Upper Granite Gorge',
    stratigraphic_unit = 'Granite Gorge Metamorphic Suite',
    chronostratigraphic_unit_age = 'Paleoproterozoic',
    collection_date_exact = '2006-01-01'
WHERE sample_id = 'CP06-52' OR sample_id = 'CP06';

-- UG90-2: Precambrian granitoid, Upper Granite Gorge
UPDATE samples SET
    lithology = 'Precambrian granitoid basement',
    latitude = 36.08,
    longitude = -112.05,
    elevation_m = 600,
    sample_age_ma = 1700,
    location_name = 'Upper Granite Gorge',
    stratigraphic_unit = 'Granite Gorge Metamorphic Suite',
    chronostratigraphic_unit_age = 'Paleoproterozoic',
    collection_date_exact = '1990-01-01'  -- Inferred from UG90 prefix
WHERE sample_id = 'UG90-2';

-- UG96-1: Precambrian granitoid, Upper Granite Gorge (Crystal Fault hanging wall)
UPDATE samples SET
    lithology = 'Precambrian granitoid basement',
    latitude = 36.09,
    longitude = -112.10,
    elevation_m = 600,
    sample_age_ma = 1700,
    location_name = 'Upper Granite Gorge, Crystal Fault area',
    stratigraphic_unit = 'Granite Gorge Metamorphic Suite',
    chronostratigraphic_unit_age = 'Paleoproterozoic',
    sampling_location_information = 'Hanging wall of Crystal Fault (paleo low)',
    collection_date_exact = '1996-01-01'  -- Inferred from UG96 prefix
WHERE sample_id = 'UG96-1';

-- EGC1: Walcott Member Tuff, Chuar Group (SPECIAL - volcanic tuff, not basement)
UPDATE samples SET
    lithology = 'Volcanic tuff',
    latitude = 36.08,
    longitude = -112.00,
    elevation_m = 800,  -- Higher elevation (near top of Chuar Group exposure)
    sample_age_ma = 729,
    location_name = 'Upper Granite Gorge, Chuar Group exposure',
    stratigraphic_unit = 'Walcott Member Tuff, Chuar Group',
    chronostratigraphic_unit_age = 'Neoproterozoic (Tonian)',
    sampling_location_information = 'Near top of Chuar Group section',
    collection_date_exact = NULL
WHERE sample_id = 'EGC1';

-- Add study area metadata to all samples
UPDATE samples SET
    location_description = 'Grand Canyon, Arizona, USA. River-level samples from Precambrian basement exposed in canyon gorges.',
    geodetic_datum = 'WGS84',
    vertical_datum = 'mean sea level',
    location_kind = 'outcrop'
WHERE sample_id IN ('CP06-65', 'CP06-69', 'CP06-70', 'CP06-72', 'CP06-52', 'CP06', 'UG90-2', 'UG96-1', 'EGC1');

-- Add collector information (from paper acknowledgments)
UPDATE samples SET
    sampling_location_information = COALESCE(sampling_location_information || '; ', '') || 'Collected during Grand Canyon field trips organized by Karl Karlstrom'
WHERE sample_id IN ('CP06-65', 'CP06-69', 'CP06-70', 'CP06-72', 'CP06-52', 'CP06', 'UG90-2', 'UG96-1', 'EGC1');

-- Verification query
SELECT
    sample_id,
    lithology,
    latitude,
    longitude,
    elevation_m,
    sample_age_ma,
    location_name,
    stratigraphic_unit
FROM samples
WHERE sample_id IN ('CP06-65', 'CP06-69', 'CP06-70', 'CP06-72', 'CP06-52', 'CP06', 'UG90-2', 'UG96-1', 'EGC1')
ORDER BY sample_id;
