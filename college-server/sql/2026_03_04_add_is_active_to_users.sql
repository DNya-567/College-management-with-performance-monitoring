-- Migration: Add is_active column to users table
-- Date: 2026-03-04
-- Purpose: Support account deactivation and user status tracking

ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);

