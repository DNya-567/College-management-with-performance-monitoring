-- Migration: Add total_marks column to marks table
-- Date: 2026-02-17
-- Purpose: Store total marks for each exam to calculate percentages

ALTER TABLE marks
  ADD COLUMN IF NOT EXISTS total_marks INTEGER;

