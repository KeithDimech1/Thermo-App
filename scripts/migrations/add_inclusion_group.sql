-- Migration: Add inclusion_group field to track data source
-- Date: 2025-11-11
-- Purpose: Track which dataset each configuration came from:
--   - 'original_curated': From "SEROLOGY to include" (132 rows already in DB)
--   - 'serology_extended': From "SEROLOGY raw data" but NOT in "to include"
--   - 'nat_data': From "NAT raw data"

-- Add inclusion_group column
ALTER TABLE test_configurations
ADD COLUMN inclusion_group VARCHAR(50) DEFAULT 'original_curated';

-- Add comment
COMMENT ON COLUMN test_configurations.inclusion_group IS
'Tracks data source: original_curated (SEROLOGY to include), serology_extended (SEROLOGY raw), nat_data (NAT raw)';

-- Update existing rows to mark as original curated
UPDATE test_configurations
SET inclusion_group = 'original_curated'
WHERE inclusion_group IS NULL;

-- Create index for filtering
CREATE INDEX idx_test_configurations_inclusion_group
ON test_configurations(inclusion_group);

-- Verify the update
SELECT
    inclusion_group,
    COUNT(*) as count,
    test_type
FROM test_configurations
GROUP BY inclusion_group, test_type
ORDER BY inclusion_group, test_type;
