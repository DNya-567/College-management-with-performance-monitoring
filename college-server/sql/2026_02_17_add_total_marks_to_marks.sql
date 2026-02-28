-- Adds total marks per exam to the marks table.
ALTER TABLE marks
  ADD COLUMN IF NOT EXISTS total_marks INTEGER;

