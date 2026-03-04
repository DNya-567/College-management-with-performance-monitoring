-- Add is_active column to users table for account deactivation
-- Run this in pgAdmin or via psql

ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Set all existing users to active
UPDATE users SET is_active = true WHERE is_active IS NULL;

