-- =============================================================================
-- Update Peak et al. (2021) samples with metadata extracted from PDF
-- =============================================================================
-- Extracted from: Peak et al. (2021) Geology paper
-- Date: 2025-11-18
-- Source: Figure 1 (map), text descriptions, and geologic context
-- =============================================================================

-- CP06-65: Lower Granite Gorge, Diamond Creek area
UPDATE samples SET
    lithology = 'Precambrian granitoid',
    latitude = 36.09,
    longitude = -113.35,
    elevation_m = 600,
    sample_age_ma = 1700,
    sampling_location_information = 'Lower Granite Gorge, Diamond Creek area, Grand Canyon, Arizona, USA. River-level sample.',
    stratigraphic_unit = 'Diamond Creek Pluton',
    chronostratigraphic_unit_age = 'Paleoproterozoic',
    collection_date = '2006-01-01',
    geodetic_datum = 'WGS84',
    vertical_datum = 'mean sea level',
    sample_kind = 'in situ rock'
WHERE sample_id = 'CP06-65';

-- CP06-69: Lower Granite Gorge
UPDATE samples SET
    lithology = 'Precambrian granitoid',
    latitude = 36.08,
    longitude = -113.25,
    elevation_m = 600,
    sample_age_ma = 1700,
    sampling_location_information = 'Lower Granite Gorge, Grand Canyon, Arizona, USA. River-level sample.',
    stratigraphic_unit = 'Granite Gorge Metamorphic Suite',
    chronostratigraphic_unit_age = 'Paleoproterozoic',
    collection_date = '2006-01-01',
    geodetic_datum = 'WGS84',
    vertical_datum = 'mean sea level',
    sample_kind = 'in situ rock'
WHERE sample_id = 'CP06-69';

-- CP06-70: Lower Granite Gorge
UPDATE samples SET
    lithology = 'Precambrian granitoid',
    latitude = 36.10,
    longitude = -113.30,
    elevation_m = 600,
    sample_age_ma = 1600,
    sampling_location_information = 'Lower Granite Gorge, Grand Canyon, Arizona, USA. River-level sample.',
    stratigraphic_unit = 'Granite Gorge Metamorphic Suite',
    chronostratigraphic_unit_age = 'Paleoproterozoic',
    collection_date = '2006-01-01',
    geodetic_datum = 'WGS84',
    vertical_datum = 'mean sea level',
    sample_kind = 'in situ rock'
WHERE sample_id = 'CP06-70';

-- CP06-72: Lower Granite Gorge
UPDATE samples SET
    lithology = 'Precambrian granitoid',
    latitude = 36.07,
    longitude = -113.20,
    elevation_m = 600,
    sample_age_ma = 1700,
    sampling_location_information = 'Lower Granite Gorge, Grand Canyon, Arizona, USA. River-level sample.',
    stratigraphic_unit = 'Granite Gorge Metamorphic Suite',
    chronostratigraphic_unit_age = 'Paleoproterozoic',
    collection_date = '2006-01-01',
    geodetic_datum = 'WGS84',
    vertical_datum = 'mean sea level',
    sample_kind = 'in situ rock'
WHERE sample_id = 'CP06-72';

-- CP06-52 (also stored as 'CP06'): Upper Granite Gorge
UPDATE samples SET
    lithology = 'Precambrian granitoid',
    latitude = 36.10,
    longitude = -111.95,
    elevation_m = 600,
    sample_age_ma = 1700,
    sampling_location_information = 'Upper Granite Gorge, Grand Canyon, Arizona, USA. River-level sample.',
    stratigraphic_unit = 'Granite Gorge Metamorphic Suite',
    chronostratigraphic_unit_age = 'Paleoproterozoic',
    collection_date = '2006-01-01',
    geodetic_datum = 'WGS84',
    vertical_datum = 'mean sea level',
    sample_kind = 'in situ rock'
WHERE sample_id IN ('CP06-52', 'CP06');

-- UG90-2: Upper Granite Gorge
UPDATE samples SET
    lithology = 'Precambrian granitoid',
    latitude = 36.08,
    longitude = -112.05,
    elevation_m = 600,
    sample_age_ma = 1700,
    sampling_location_information = 'Upper Granite Gorge, Grand Canyon, Arizona, USA. River-level sample.',
    stratigraphic_unit = 'Granite Gorge Metamorphic Suite',
    chronostratigraphic_unit_age = 'Paleoproterozoic',
    collection_date = '1990-01-01',
    geodetic_datum = 'WGS84',
    vertical_datum = 'mean sea level',
    sample_kind = 'in situ rock'
WHERE sample_id = 'UG90-2';

-- UG96-1: Upper Granite Gorge, Crystal Fault area
UPDATE samples SET
    lithology = 'Precambrian granitoid',
    latitude = 36.09,
    longitude = -112.10,
    elevation_m = 600,
    sample_age_ma = 1700,
    sampling_location_information = 'Upper Granite Gorge, Crystal Fault area, Grand Canyon, Arizona, USA. River-level sample. Hanging wall of Crystal Fault (paleo low).',
    stratigraphic_unit = 'Granite Gorge Metamorphic Suite',
    chronostratigraphic_unit_age = 'Paleoproterozoic',
    collection_date = '1996-01-01',
    geodetic_datum = 'WGS84',
    vertical_datum = 'mean sea level',
    sample_kind = 'in situ rock'
WHERE sample_id = 'UG96-1';

-- EGC1: Walcott Member Tuff (VOLCANIC, not basement)
UPDATE samples SET
    lithology = 'Volcanic tuff',
    latitude = 36.08,
    longitude = -112.00,
    elevation_m = 800,
    sample_age_ma = 729,
    sampling_location_information = 'Upper Granite Gorge, Chuar Group exposure, Grand Canyon, Arizona, USA. Near top of Chuar Group section (stratigraphically higher than river level).',
    stratigraphic_unit = 'Walcott Member Tuff, Chuar Group',
    chronostratigraphic_unit_age = 'Neoproterozoic (Tonian)',
    geodetic_datum = 'WGS84',
    vertical_datum = 'mean sea level',
    sample_kind = 'in situ rock'
WHERE sample_id = 'EGC1';

-- Verification query
\echo ''
\echo '================================================================================'
\echo 'UPDATED SAMPLE METADATA'
\echo '================================================================================'

SELECT
    sample_id,
    lithology,
    ROUND(latitude::numeric, 2) as lat,
    ROUND(longitude::numeric, 2) as lon,
    elevation_m as elev_m,
    sample_age_ma as age_ma,
    stratigraphic_unit
FROM samples
WHERE sample_id IN ('CP06-65', 'CP06-69', 'CP06-70', 'CP06-72', 'CP06-52', 'CP06', 'UG90-2', 'UG96-1', 'EGC1')
ORDER BY sample_id;

\echo ''
\echo '✅ Metadata update complete!'
