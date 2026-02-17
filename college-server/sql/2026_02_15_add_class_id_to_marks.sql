-- Adds class_id to marks and enforces FK to classes.
ALTER TABLE marks
  ADD COLUMN IF NOT EXISTS class_id UUID;

ALTER TABLE marks
  ADD CONSTRAINT IF NOT EXISTS marks_class_id_fkey
  FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_marks_class_id ON marks(class_id);
