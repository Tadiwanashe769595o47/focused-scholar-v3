-- Add holiday_questions table for fixed holiday work sets

CREATE TABLE IF NOT EXISTS holiday_questions (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  subject_code TEXT NOT NULL REFERENCES subjects(code),
  topic TEXT NOT NULL,
  subtopic TEXT,
  question_text TEXT NOT NULL,
  question_type TEXT NOT NULL,
  options_json JSONB,
  correct_answer TEXT NOT NULL,
  model_answer TEXT NOT NULL,
  explanation_json JSONB NOT NULL,
  key_points_json JSONB,
  marks INTEGER DEFAULT 1,
  diagram_url TEXT,
  diagram_type TEXT,
  difficulty INTEGER DEFAULT 1,
  time_estimate INTEGER DEFAULT 60,
  source TEXT DEFAULT 'holiday',
  version INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_holiday_questions_subject ON holiday_questions(subject_code);
CREATE INDEX IF NOT EXISTS idx_holiday_questions_topic ON holiday_questions(subject_code, topic);
