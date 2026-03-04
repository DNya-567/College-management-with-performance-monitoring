-- Create semesters table and add semester_id to marks, attendance, class_enrollments
-- Run via: node src/scripts/runMigration.js sql/2026_03_04_create_semesters.sql

-- 1) Semesters table
CREATE TABLE IF NOT EXISTS semesters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  academic_year TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_semesters_is_active ON semesters(is_active);

-- 2) Add semester_id FK to marks (nullable so existing rows survive)
ALTER TABLE marks ADD COLUMN IF NOT EXISTS semester_id UUID REFERENCES semesters(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_marks_semester_id ON marks(semester_id);

-- 3) Add semester_id FK to attendance
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS semester_id UUID REFERENCES semesters(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_attendance_semester_id ON attendance(semester_id);

-- 4) Add semester_id FK to class_enrollments
ALTER TABLE class_enrollments ADD COLUMN IF NOT EXISTS semester_id UUID REFERENCES semesters(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_class_enrollments_semester_id ON class_enrollments(semester_id);

-- 5) Unique constraint on marks: one mark per student+subject+exam_type+class+semester
-- Use a partial index so existing NULL semester rows are not affected
CREATE UNIQUE INDEX IF NOT EXISTS idx_marks_unique_per_semester
  ON marks (student_id, subject_id, exam_type, class_id, semester_id)
  WHERE semester_id IS NOT NULL;

