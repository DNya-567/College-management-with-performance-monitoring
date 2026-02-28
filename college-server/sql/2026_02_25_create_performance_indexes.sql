-- Performance query optimization indexes
-- Run once against your PostgreSQL database

CREATE INDEX IF NOT EXISTS idx_marks_student_id ON marks(student_id);
CREATE INDEX IF NOT EXISTS idx_marks_exam_type ON marks(exam_type);
CREATE INDEX IF NOT EXISTS idx_marks_class_id ON marks(class_id);
CREATE INDEX IF NOT EXISTS idx_attendance_student_id ON attendance(student_id);
CREATE INDEX IF NOT EXISTS idx_class_enrollments_class_status ON class_enrollments(class_id, status);
CREATE INDEX IF NOT EXISTS idx_class_enrollments_student_status ON class_enrollments(student_id, status);

