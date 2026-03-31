-- Migration: Add class_id column to announcements table
-- Date: 2026-02-28
-- Purpose: Associate announcements with specific classes instead of just teachers

ALTER TABLE announcements
  ADD COLUMN IF NOT EXISTS class_id UUID REFERENCES classes(id) ON DELETE CASCADE;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_announcements_class_id ON announcements(class_id);

