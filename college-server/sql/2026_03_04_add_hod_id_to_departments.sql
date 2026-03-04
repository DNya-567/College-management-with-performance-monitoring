-- Add hod_id column to departments table
ALTER TABLE departments ADD COLUMN IF NOT EXISTS hod_id UUID REFERENCES teachers(id) ON DELETE SET NULL;

