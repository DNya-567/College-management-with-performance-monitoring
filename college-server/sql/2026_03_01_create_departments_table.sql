-- Create departments table if it does not exist.
-- This is used for department-wise HOD scoping.
CREATE TABLE IF NOT EXISTS departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  hod_id UUID REFERENCES teachers(id)
);

-- Seed some common departments if the table is empty
INSERT INTO departments (name)
SELECT unnest(ARRAY['Computer Science', 'Electronics', 'Mechanical', 'Civil', 'Electrical', 'Information Technology'])
WHERE NOT EXISTS (SELECT 1 FROM departments LIMIT 1);

