-- Migration: Add include_in_analysis field to test_configurations
-- Date: 2025-11-11
-- Purpose: Distinguish between curated data (shown by default) and raw data (available but hidden)

-- Add the new field
ALTER TABLE test_configurations
ADD COLUMN include_in_analysis BOOLEAN DEFAULT TRUE;

-- Set TRUE for original_curated data (these should be shown by default)
UPDATE test_configurations
SET include_in_analysis = TRUE
WHERE inclusion_group = 'original_curated';

-- Set FALSE for raw data (available but not shown by default)
UPDATE test_configurations
SET include_in_analysis = FALSE
WHERE inclusion_group IN ('nat_data', 'serology_extended');

-- Add comment to explain the field
COMMENT ON COLUMN test_configurations.include_in_analysis IS
'TRUE = curated data shown by default in analysis. FALSE/NULL = raw data available but not shown by default.';

-- Add index for filtering
CREATE INDEX idx_test_configs_include_in_analysis ON test_configurations(include_in_analysis);
