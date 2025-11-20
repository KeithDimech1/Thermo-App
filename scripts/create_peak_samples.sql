-- ⚠️ HISTORICAL/DEPRECATED - Uses OLD snake_case schema (IDEA-014)
--
-- This script uses the OLD 'samples' table and has NOT been migrated to the
-- new EarthBank camelCase schema (earthbank_samples).
--
-- Status: If already run, keep as historical record. If needs re-running, update first.
-- See: build-data/ideas/debug/IDEA-014-INDEX.md
--
-- ---
--
-- Create Peak et al. (2021) samples with complete metadata (LEGACY)
-- Run this to add the samples if they don't exist yet

-- First, ensure we have a Peak dataset
INSERT INTO datasets (dataset_name, description, doi, study_area, analyst, laboratory)
VALUES (
    'Peak et al. (2021) - Grand Canyon ZHe',
    'Zircon (U-Th)/He thermochronology revealing pre-Great Unconformity paleotopography in the Grand Canyon region, USA',
    '10.1130/G49116.1',
    'Grand Canyon, Arizona, USA',
    'Peak, B.A.',
    'University of Colorado Boulder'
)
ON CONFLICT (dataset_name) DO NOTHING
RETURNING id;

-- Use the Peak dataset (ID will be returned from above or we'll use the existing one)
\set peak_dataset_id 2

-- Now insert/update all samples with metadata
INSERT INTO samples (
    sample_id, dataset_id, lithology, latitude, longitude, elevation_m,
    sample_age_ma, sampling_location_information, stratigraphic_unit,
    chronostratigraphic_unit_age, collection_date, geodetic_datum,
    vertical_datum, sample_kind, mineral_type
) VALUES
-- Lower Granite Gorge samples
('CP06-65', 2, 'Precambrian granitoid', 36.09, -113.35, 600, 1700,
 'Lower Granite Gorge, Diamond Creek area, Grand Canyon, Arizona, USA. River-level sample.',
 'Diamond Creek Pluton', 'Paleoproterozoic', '2006-01-01', 'WGS84', 'mean sea level', 'in situ rock', 'zircon'),

('CP06-69', 2, 'Precambrian granitoid', 36.08, -113.25, 600, 1700,
 'Lower Granite Gorge, Grand Canyon, Arizona, USA. River-level sample.',
 'Granite Gorge Metamorphic Suite', 'Paleoproterozoic', '2006-01-01', 'WGS84', 'mean sea level', 'in situ rock', 'zircon'),

('CP06-70', 2, 'Precambrian granitoid', 36.10, -113.30, 600, 1600,
 'Lower Granite Gorge, Grand Canyon, Arizona, USA. River-level sample.',
 'Granite Gorge Metamorphic Suite', 'Paleoproterozoic', '2006-01-01', 'WGS84', 'mean sea level', 'in situ rock', 'zircon'),

('CP06-72', 2, 'Precambrian granitoid', 36.07, -113.20, 600, 1700,
 'Lower Granite Gorge, Grand Canyon, Arizona, USA. River-level sample.',
 'Granite Gorge Metamorphic Suite', 'Paleoproterozoic', '2006-01-01', 'WGS84', 'mean sea level', 'in situ rock', 'zircon'),

-- Upper Granite Gorge samples
('CP06-52', 2, 'Precambrian granitoid', 36.10, -111.95, 600, 1700,
 'Upper Granite Gorge, Grand Canyon, Arizona, USA. River-level sample.',
 'Granite Gorge Metamorphic Suite', 'Paleoproterozoic', '2006-01-01', 'WGS84', 'mean sea level', 'in situ rock', 'zircon'),

('UG90-2', 2, 'Precambrian granitoid', 36.08, -112.05, 600, 1700,
 'Upper Granite Gorge, Grand Canyon, Arizona, USA. River-level sample.',
 'Granite Gorge Metamorphic Suite', 'Paleoproterozoic', '1990-01-01', 'WGS84', 'mean sea level', 'in situ rock', 'zircon'),

('UG96-1', 2, 'Precambrian granitoid', 36.09, -112.10, 600, 1700,
 'Upper Granite Gorge, Crystal Fault area, Grand Canyon, Arizona, USA. River-level sample. Hanging wall of Crystal Fault (paleo low).',
 'Granite Gorge Metamorphic Suite', 'Paleoproterozoic', '1996-01-01', 'WGS84', 'mean sea level', 'in situ rock', 'zircon'),

('EGC1', 2, 'Volcanic tuff', 36.08, -112.00, 800, 729,
 'Upper Granite Gorge, Chuar Group exposure, Grand Canyon, Arizona, USA. Near top of Chuar Group section.',
 'Walcott Member Tuff, Chuar Group', 'Neoproterozoic (Tonian)', NULL, 'WGS84', 'mean sea level', 'in situ rock', 'zircon')

ON CONFLICT (sample_id) DO UPDATE SET
    lithology = EXCLUDED.lithology,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    elevation_m = EXCLUDED.elevation_m,
    sample_age_ma = EXCLUDED.sample_age_ma,
    sampling_location_information = EXCLUDED.sampling_location_information,
    stratigraphic_unit = EXCLUDED.stratigraphic_unit,
    chronostratigraphic_unit_age = EXCLUDED.chronostratigraphic_unit_age;

-- Show what we created/updated
SELECT sample_id, lithology, latitude, longitude, elevation_m, sample_age_ma
FROM samples
WHERE sample_id IN ('CP06-65', 'CP06-69', 'CP06-70', 'CP06-72', 'CP06-52', 'UG90-2', 'UG96-1', 'EGC1')
ORDER BY sample_id;
