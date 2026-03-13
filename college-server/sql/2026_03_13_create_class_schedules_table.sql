-- Create class_schedules table
-- Supports schedule management, cancellation, and rescheduling by teacher/HOD.

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
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now(),
  CONSTRAINT chk_schedule_time_range CHECK (end_time > start_time),
  CONSTRAINT chk_rescheduled_time_range CHECK (
    rescheduled_start_time IS NULL
    OR rescheduled_end_time IS NULL
    OR rescheduled_end_time > rescheduled_start_time
  )
);

-- Prevent exact duplicate session rows for the same class
CREATE UNIQUE INDEX IF NOT EXISTS uq_class_schedules_slot
  ON class_schedules (class_id, session_date, start_time, end_time);

CREATE INDEX IF NOT EXISTS idx_class_schedules_class_date
  ON class_schedules (class_id, session_date);

CREATE INDEX IF NOT EXISTS idx_class_schedules_status
  ON class_schedules (status);

