-- Migration: Create performance optimization indexes
-- Date: 2026-02-25
-- Purpose: Add critical indexes for query performance optimization

-- Marks table indexes
CREATE INDEX IF NOT EXISTS idx_marks_student_id ON marks(student_id);
CREATE INDEX IF NOT EXISTS idx_marks_exam_type ON marks(exam_type);
CREATE INDEX IF NOT EXISTS idx_marks_class_id ON marks(class_id);

-- Attendance table indexes
CREATE INDEX IF NOT EXISTS idx_attendance_student_id ON attendance(student_id);

-- Class enrollments composite indexes
CREATE INDEX IF NOT EXISTS idx_class_enrollments_class_status ON class_enrollments(class_id, status);
CREATE INDEX IF NOT EXISTS idx_class_enrollments_student_status ON class_enrollments(student_id, status);

