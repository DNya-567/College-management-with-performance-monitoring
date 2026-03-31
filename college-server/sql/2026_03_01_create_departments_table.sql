-- Migration: Create departments table with proper schema
-- Date: 2026-03-01
-- Purpose: Create departments table for organizational structure

CREATE TABLE IF NOT EXISTS departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  hod_id UUID,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Add foreign key constraint after teachers table exists
-- ALTER TABLE departments
--   ADD CONSTRAINT IF NOT EXISTS departments_hod_id_fkey
--   FOREIGN KEY (hod_id) REFERENCES teachers(id) ON DELETE SET NULL;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_departments_hod_id ON departments(hod_id);
CREATE INDEX IF NOT EXISTS idx_departments_name ON departments(name);

