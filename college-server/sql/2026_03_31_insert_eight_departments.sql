-- Migration: Insert 8 departments
-- Date: 2026-03-31
-- Description: Add 8 departments for student, teacher, and HOD registration

-- Delete existing departments (if any)
DELETE FROM departments;

-- Insert 8 departments
INSERT INTO departments (name) VALUES
  ('Computer Science'),
  ('Mechanical Engineering'),
  ('Electrical Engineering'),
  ('Civil Engineering'),
  ('Information Technology'),
  ('Electronics & Communication'),
  ('Chemical Engineering'),
  ('Biomedical Engineering');

-- Verify insertion
SELECT id, name FROM departments ORDER BY name ASC;

