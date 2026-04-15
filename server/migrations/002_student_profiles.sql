-- Onboarding profiles for students
CREATE TABLE IF NOT EXISTS student_profiles (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  student_id BIGINT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  grade TEXT,
  school TEXT,
  target_grade TEXT,
  exam_board TEXT DEFAULT 'Cambridge',
  study_hours_per_week INTEGER,
  weakest_subject TEXT,
  learning_style TEXT,
  exam_year INTEGER,
  goals_json JSONB,
  completed_onboarding BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(student_id)
);

CREATE INDEX IF NOT EXISTS idx_student_profiles_student ON student_profiles(student_id);
