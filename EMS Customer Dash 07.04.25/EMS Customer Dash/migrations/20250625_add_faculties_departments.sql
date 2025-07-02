-- Migration: Add faculties and departments tables and link them to user_profiles

-- Create faculties table
CREATE TABLE IF NOT EXISTS faculties (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE
);

-- Create departments table with foreign key to faculties
CREATE TABLE IF NOT EXISTS departments (
    id SERIAL PRIMARY KEY,
    faculty_id INTEGER NOT NULL REFERENCES faculties(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    UNIQUE(faculty_id, name)
);

-- Add FK columns to user_profiles (if they don't already exist)
ALTER TABLE user_profiles
    ADD COLUMN IF NOT EXISTS faculty_id INTEGER REFERENCES faculties(id),
    ADD COLUMN IF NOT EXISTS department_id INTEGER REFERENCES departments(id);

-- Optional: Remove old free-text columns if you no longer need them
-- ALTER TABLE user_profiles DROP COLUMN faculty;
-- ALTER TABLE user_profiles DROP COLUMN department;

-- Seed example data (optional, adjust as needed)
INSERT INTO faculties (name) VALUES ('Engineering'), ('Humanities'), ('Sciences')
ON CONFLICT (name) DO NOTHING;

INSERT INTO departments (faculty_id, name)
SELECT f.id, d.name
FROM (
    VALUES
        ('Engineering', 'Computer Science'),
        ('Engineering', 'Mechanical Engineering'),
        ('Humanities', 'History'),
        ('Sciences', 'Biology')
) d(faculty_name, name)
JOIN faculties f ON f.name = d.faculty_name
ON CONFLICT (faculty_id, name) DO NOTHING;
