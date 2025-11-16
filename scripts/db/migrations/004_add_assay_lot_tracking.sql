-- Migration: Add assay lot tracking capability
-- Created: 2025-11-12
-- Purpose: Track individual assay reagent lots for QC monitoring (Dimech 2020 study capability)
-- Reference: build-data/documentation/Data_Analysis_Capability_Assessment.md

BEGIN;

-- Create assay_lots table
CREATE TABLE assay_lots (
  id SERIAL PRIMARY KEY,
  assay_id INTEGER NOT NULL REFERENCES assays(id) ON DELETE CASCADE,
  lot_number VARCHAR(50) NOT NULL,
  manufacture_date DATE,
  expiration_date DATE,
  qc_release_date DATE,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  -- Ensure unique lot numbers per assay
  UNIQUE(assay_id, lot_number)
);

-- Indexes for performance
CREATE INDEX idx_assay_lots_assay ON assay_lots(assay_id);
CREATE INDEX idx_assay_lots_lot_number ON assay_lots(lot_number);
CREATE INDEX idx_assay_lots_dates ON assay_lots(expiration_date, manufacture_date);

-- Comments
COMMENT ON TABLE assay_lots IS 'Individual reagent lot numbers for assays - enables lot-to-lot variation tracking';
COMMENT ON COLUMN assay_lots.lot_number IS 'Manufacturer lot number (e.g., 93093LI00, 95367LI00)';
COMMENT ON COLUMN assay_lots.qc_release_date IS 'Date lot was released for use based on QC testing';

-- Add lot_id reference to test_configurations
ALTER TABLE test_configurations
ADD COLUMN assay_lot_id INTEGER REFERENCES assay_lots(id);

-- Index for the new foreign key
CREATE INDEX idx_test_configs_assay_lot ON test_configurations(assay_lot_id);

COMMENT ON COLUMN test_configurations.assay_lot_id IS 'Specific assay lot used for this test configuration (optional for historical data)';

COMMIT;
