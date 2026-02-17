-- Adds attendance tracking per class and student.
CREATE TABLE IF NOT EXISTS attendance (
  id SERIAL PRIMARY KEY,
  class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('present', 'absent')),
  UNIQUE (class_id, student_id, date)
);

CREATE INDEX IF NOT EXISTS idx_attendance_class_id ON attendance(class_id);
CREATE INDEX IF NOT EXISTS idx_attendance_class_date ON attendance(class_id, date);
