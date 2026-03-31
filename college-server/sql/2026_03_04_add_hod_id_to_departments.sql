-- Migration: Add hod_id column to departments table
-- Date: 2026-03-04
-- Purpose: Link departments to their Head of Department (HOD)

ALTER TABLE departments ADD COLUMN IF NOT EXISTS hod_id UUID REFERENCES teachers(id) ON DELETE SET NULL;

-- Add foreign key constraint from departments to teachers
ALTER TABLE departments
  ADD CONSTRAINT IF NOT EXISTS departments_hod_id_fkey
  FOREIGN KEY (hod_id) REFERENCES teachers(id) ON DELETE SET NULL;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_departments_hod_id ON departments(hod_id);

