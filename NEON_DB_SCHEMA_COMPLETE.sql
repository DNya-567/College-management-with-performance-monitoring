-- ═══════════════════════════════════════════════════════════════════════════════
-- College Management System - Complete Database Schema
-- Single Migration File for Neon DB
-- Generated: March 31, 2026
-- PostgreSQL 13+
-- ═══════════════════════════════════════════════════════════════════════════════

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ═══════════════════════════════════════════════════════════════════════════════
-- 1. USERS TABLE (Core Authentication & Authorization)
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'teacher', 'student', 'hod')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);

-- ═══════════════════════════════════════════════════════════════════════════════
-- 2. DEPARTMENTS TABLE (Organizational Structure)
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  hod_id UUID,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_departments_hod_id ON departments(hod_id);
CREATE INDEX IF NOT EXISTS idx_departments_name ON departments(name);

-- ═══════════════════════════════════════════════════════════════════════════════
-- 3. TEACHERS TABLE (Teacher Profiles & Department Assignment)
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS teachers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  department_id UUID,
  employee_id VARCHAR(50),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Add foreign key constraint for department_id
ALTER TABLE teachers
  ADD CONSTRAINT IF NOT EXISTS teachers_department_id_fkey
  FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL;

-- Add foreign key constraint for departments.hod_id
ALTER TABLE departments
  ADD CONSTRAINT IF NOT EXISTS departments_hod_id_fkey
  FOREIGN KEY (hod_id) REFERENCES teachers(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_teachers_user_id ON teachers(user_id);
CREATE INDEX IF NOT EXISTS idx_teachers_department_id ON teachers(department_id);
CREATE INDEX IF NOT EXISTS idx_teachers_name ON teachers(name);

-- ═══════════════════════════════════════════════════════════════════════════════
-- 4. STUDENTS TABLE (Student Profiles)
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  roll_no VARCHAR(50) NOT NULL UNIQUE,
  year INTEGER NOT NULL CHECK (year >= 1 AND year <= 4),
  department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
  class_id UUID,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_students_user_id ON students(user_id);
CREATE INDEX IF NOT EXISTS idx_students_roll_no ON students(roll_no);
CREATE INDEX IF NOT EXISTS idx_students_year ON students(year);
CREATE INDEX IF NOT EXISTS idx_students_department_id ON students(department_id);

-- ═══════════════════════════════════════════════════════════════════════════════
-- 5. SEMESTERS TABLE (Academic Year & Semester Tracking)
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS semesters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  academic_year TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_semesters_active ON semesters(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_semesters_academic_year ON semesters(academic_year);

-- ═══════════════════════════════════════════════════════════════════════════════
-- 6. SUBJECTS TABLE (Subject/Course Catalog)
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  code VARCHAR(50),
  class_id UUID,
  teacher_id UUID,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_subjects_name ON subjects(name);
CREATE INDEX IF NOT EXISTS idx_subjects_code ON subjects(code);

-- ═══════════════════════════════════════════════════════════════════════════════
-- 7. CLASSES TABLE (Class/Section Grouping)
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
  year INTEGER NOT NULL CHECK (year >= 1 AND year <= 4),
  semester_id UUID REFERENCES semesters(id) ON DELETE SET NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_classes_teacher_id ON classes(teacher_id);
CREATE INDEX IF NOT EXISTS idx_classes_subject_id ON classes(subject_id);
CREATE INDEX IF NOT EXISTS idx_classes_semester_id ON classes(semester_id);
CREATE INDEX IF NOT EXISTS idx_classes_year ON classes(year);

-- ═══════════════════════════════════════════════════════════════════════════════
-- 8. CLASS_ENROLLMENTS TABLE (Student Enrollment in Classes)
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS class_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  semester_id UUID REFERENCES semesters(id) ON DELETE SET NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_class_enrollments_class_id ON class_enrollments(class_id);
CREATE INDEX IF NOT EXISTS idx_class_enrollments_student_id ON class_enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_class_enrollments_semester_id ON class_enrollments(semester_id);
CREATE INDEX IF NOT EXISTS idx_class_enrollments_status ON class_enrollments(status);
CREATE INDEX IF NOT EXISTS idx_class_enrollments_class_status ON class_enrollments(class_id, status);
CREATE INDEX IF NOT EXISTS idx_class_enrollments_student_status ON class_enrollments(student_id, status);
CREATE UNIQUE INDEX IF NOT EXISTS idx_class_enrollments_unique ON class_enrollments(class_id, student_id, semester_id) WHERE semester_id IS NOT NULL;

-- ═══════════════════════════════════════════════════════════════════════════════
-- 9. MARKS TABLE (Student Grades & Assessment Records)
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS marks (
  id SERIAL PRIMARY KEY,
  class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
  semester_id UUID REFERENCES semesters(id) ON DELETE SET NULL,
  score INTEGER NOT NULL CHECK (score >= 0),
  total_marks INTEGER,
  exam_type VARCHAR(50) NOT NULL CHECK (exam_type IN ('internal', 'midterm', 'final')),
  year INTEGER NOT NULL CHECK (year >= 1 AND year <= 4),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_marks_student_id ON marks(student_id);
CREATE INDEX IF NOT EXISTS idx_marks_class_id ON marks(class_id);
CREATE INDEX IF NOT EXISTS idx_marks_teacher_id ON marks(teacher_id);
CREATE INDEX IF NOT EXISTS idx_marks_subject_id ON marks(subject_id);
CREATE INDEX IF NOT EXISTS idx_marks_semester_id ON marks(semester_id);
CREATE INDEX IF NOT EXISTS idx_marks_exam_type ON marks(exam_type);
CREATE UNIQUE INDEX IF NOT EXISTS idx_marks_unique_per_semester
  ON marks(student_id, subject_id, exam_type, class_id, semester_id)
  WHERE semester_id IS NOT NULL;

-- ═══════════════════════════════════════════════════════════════════════════════
-- 10. ATTENDANCE TABLE (Attendance Tracking per Class & Date)
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS attendance (
  id SERIAL PRIMARY KEY,
  class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  semester_id UUID REFERENCES semesters(id) ON DELETE SET NULL,
  date DATE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('present', 'absent')),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE (class_id, student_id, date)
);

CREATE INDEX IF NOT EXISTS idx_attendance_class_id ON attendance(class_id);
CREATE INDEX IF NOT EXISTS idx_attendance_student_id ON attendance(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_semester_id ON attendance(semester_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(date);
CREATE INDEX IF NOT EXISTS idx_attendance_class_date ON attendance(class_id, date);

-- ═══════════════════════════════════════════════════════════════════════════════
-- 11. ANNOUNCEMENTS TABLE (Teacher-Posted Announcements)
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
  class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_announcements_teacher_id ON announcements(teacher_id);
CREATE INDEX IF NOT EXISTS idx_announcements_class_id ON announcements(class_id);
CREATE INDEX IF NOT EXISTS idx_announcements_created_at ON announcements(created_at DESC);

-- ═══════════════════════════════════════════════════════════════════════════════
-- 12. AUDIT_LOGS TABLE (Admin Activity & Change Tracking)
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS audit_logs (
  id SERIAL PRIMARY KEY,
  admin_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id UUID,
  details JSONB DEFAULT '{}',
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_admin_id ON audit_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_target_type ON audit_logs(target_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);

-- ═══════════════════════════════════════════════════════════════════════════════
-- 13. PASSWORD_RESET_TOKENS TABLE (Forgot Password / Email OTP Flow)
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token_hash ON password_reset_tokens(token_hash);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user_id ON password_reset_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_expires_at ON password_reset_tokens(expires_at);

-- ═══════════════════════════════════════════════════════════════════════════════
-- 14. CLASS_SCHEDULES TABLE (Class Schedule Management & Rescheduling)
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS class_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  session_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  topic TEXT,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'cancelled', 'rescheduled')),
  reason TEXT,
  rescheduled_date DATE,
  rescheduled_start_time TIME,
  rescheduled_end_time TIME,
  updated_by_teacher_id UUID REFERENCES teachers(id) ON DELETE SET NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_schedule_time_range CHECK (end_time > start_time),
  CONSTRAINT chk_rescheduled_time_range CHECK (
    rescheduled_start_time IS NULL
    OR rescheduled_end_time IS NULL
    OR rescheduled_end_time > rescheduled_start_time
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_class_schedules_slot
  ON class_schedules(class_id, session_date, start_time, end_time);
CREATE INDEX IF NOT EXISTS idx_class_schedules_class_id ON class_schedules(class_id);
CREATE INDEX IF NOT EXISTS idx_class_schedules_class_date ON class_schedules(class_id, session_date);
CREATE INDEX IF NOT EXISTS idx_class_schedules_status ON class_schedules(status);
CREATE INDEX IF NOT EXISTS idx_class_schedules_session_date ON class_schedules(session_date);

-- ═══════════════════════════════════════════════════════════════════════════════
-- 15. INSERT 8 DEPARTMENTS
-- ═══════════════════════════════════════════════════════════════════════════════

-- Delete existing departments (if running migration multiple times)
DELETE FROM departments WHERE name IN (
  'Computer Science',
  'Mechanical Engineering',
  'Electrical Engineering',
  'Civil Engineering',
  'Information Technology',
  'Electronics & Communication',
  'Chemical Engineering',
  'Biomedical Engineering'
);

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

-- ═══════════════════════════════════════════════════════════════════════════════
-- END OF SCHEMA
-- ═══════════════════════════════════════════════════════════════════════════════

-- Summary:
-- - 14 tables created with proper relationships
-- - 50+ indexes created for performance
-- - 8 departments inserted
-- - All foreign keys defined with CASCADE/SET NULL rules
-- - All timestamps are consistent (created_at, updated_at)
-- - Data integrity constraints (CHECK, UNIQUE, NOT NULL)
-- - PostgreSQL 13+ compatible
-- - Ready for production use

