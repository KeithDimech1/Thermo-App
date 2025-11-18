-- Migration 007: Add dataset_people_roles junction table
-- Purpose: Create many-to-many relationship between datasets and people (authors)
-- Date: 2025-11-18
-- Follows pattern from sample_people_roles and datapoint_people_roles

-- Create dataset_people_roles junction table
CREATE TABLE IF NOT EXISTS dataset_people_roles (
  id SERIAL PRIMARY KEY,
  dataset_id INTEGER NOT NULL,
  person_id INTEGER NOT NULL,
  role VARCHAR(50) NOT NULL, -- 'author', 'editor', 'corresponding_author', etc.
  author_order INTEGER, -- Optional: track author position (1 = first author, etc.)
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  -- Foreign keys
  CONSTRAINT fk_dataset_people_dataset
    FOREIGN KEY (dataset_id)
    REFERENCES datasets(id)
    ON DELETE CASCADE,

  CONSTRAINT fk_dataset_people_person
    FOREIGN KEY (person_id)
    REFERENCES people(id)
    ON DELETE CASCADE,

  -- Prevent duplicate role assignments
  CONSTRAINT unique_dataset_person_role
    UNIQUE (dataset_id, person_id, role)
);

-- Create indexes for performance
CREATE INDEX idx_dataset_people_dataset ON dataset_people_roles(dataset_id);
CREATE INDEX idx_dataset_people_person ON dataset_people_roles(person_id);
CREATE INDEX idx_dataset_people_role ON dataset_people_roles(role);

-- Add comment
COMMENT ON TABLE dataset_people_roles IS 'Many-to-many relationship between datasets and people (authors, editors, etc.)';
COMMENT ON COLUMN dataset_people_roles.author_order IS 'Position in author list (1 = first author, 2 = second author, etc.)';
