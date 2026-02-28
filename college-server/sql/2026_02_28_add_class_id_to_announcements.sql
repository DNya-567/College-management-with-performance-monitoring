-- Adds class_id to announcements so they are scoped to a specific class.
ALTER TABLE announcements
  ADD COLUMN IF NOT EXISTS class_id UUID REFERENCES classes(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_announcements_class_id ON announcements(class_id);

