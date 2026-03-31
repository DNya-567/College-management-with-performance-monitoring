-- Migration: Add class_id column to marks table
-- Date: 2026-02-15
-- Purpose: Associate marks with specific classes

ALTER TABLE marks
  ADD COLUMN IF NOT EXISTS class_id UUID;

-- Add foreign key constraint to classes
ALTER TABLE marks
  ADD CONSTRAINT IF NOT EXISTS marks_class_id_fkey
  FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_marks_class_id ON marks(class_id);
