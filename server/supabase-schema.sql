-- FOCUSED SCHOLAR V3 - SUPABASE POSTGRESQL SCHEMA
-- Run this in Supabase SQL Editor: https://app.supabase.com/project/bpvwkmkwecjqwjyvtzuh/sql

-- ============================================
-- TABLES
-- ============================================

-- Students
CREATE TABLE IF NOT EXISTS students (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name TEXT NOT NULL,
  pin_hash TEXT NOT NULL,
  email TEXT,
  parent_email TEXT,
  avatar TEXT DEFAULT 'default',
  streak_days INTEGER DEFAULT 0,
  total_points INTEGER DEFAULT 0,
  font_size TEXT DEFAULT 'medium',
  high_contrast INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_active TIMESTAMP WITH TIME ZONE
);

-- Subjects
CREATE TABLE IF NOT EXISTS subjects (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  icon TEXT,
  color TEXT,
  display_order INTEGER DEFAULT 0
);

-- Teacher/Admin accounts
CREATE TABLE IF NOT EXISTS admins (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT DEFAULT 'teacher',
  access_code TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Parents
CREATE TABLE IF NOT EXISTS parents (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  student_id BIGINT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  password_hash TEXT NOT NULL
);

-- Syllabi
CREATE TABLE IF NOT EXISTS syllabi (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  subject_code TEXT NOT NULL REFERENCES subjects(code),
  year INTEGER NOT NULL,
  topics_json JSONB NOT NULL,
  validated INTEGER DEFAULT 0,
  validated_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(subject_code, year)
);

-- Questions bank
CREATE TABLE IF NOT EXISTS questions (
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
  source TEXT DEFAULT 'generated',
  version INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Holiday questions bank (separate fixed set)
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

-- Flashcards
CREATE TABLE IF NOT EXISTS flashcards (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  subject_code TEXT NOT NULL REFERENCES subjects(code),
  topic TEXT NOT NULL,
  front TEXT NOT NULL,
  back TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Student progress per topic
CREATE TABLE IF NOT EXISTS topic_progress (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  student_id BIGINT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  subject_code TEXT NOT NULL REFERENCES subjects(code),
  topic TEXT NOT NULL,
  times_answered INTEGER DEFAULT 0,
  times_correct INTEGER DEFAULT 0,
  last_answer_at TIMESTAMP WITH TIME ZONE,
  score_percentage REAL DEFAULT 0,
  UNIQUE(student_id, subject_code, topic)
);

-- Student question history (for SRS)
CREATE TABLE IF NOT EXISTS student_question_history (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  student_id BIGINT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  question_id BIGINT NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  times_seen INTEGER DEFAULT 0,
  times_correct INTEGER DEFAULT 0,
  last_seen_at TIMESTAMP WITH TIME ZONE,
  next_review_at TIMESTAMP WITH TIME ZONE,
  accuracy_rate REAL DEFAULT 0,
  UNIQUE(student_id, question_id)
);

-- Error patterns
CREATE TABLE IF NOT EXISTS error_patterns (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  student_id BIGINT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  topic TEXT NOT NULL,
  mistake_type TEXT NOT NULL,
  frequency INTEGER DEFAULT 0,
  last_occurred_at TIMESTAMP WITH TIME ZONE,
  suggestion TEXT
);

-- Daily tests
CREATE TABLE IF NOT EXISTS daily_tests (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  student_id BIGINT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  subject_code TEXT NOT NULL REFERENCES subjects(code),
  date TEXT NOT NULL,
  questions_json JSONB NOT NULL,
  current_index INTEGER DEFAULT 0,
  status TEXT DEFAULT 'pending',
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(student_id, subject_code, date)
);

-- Student answers
CREATE TABLE IF NOT EXISTS student_answers (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  daily_test_id BIGINT NOT NULL REFERENCES daily_tests(id) ON DELETE CASCADE,
  question_id BIGINT NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  question_index INTEGER NOT NULL,
  student_answer TEXT,
  is_correct INTEGER DEFAULT 0,
  marks_awarded INTEGER DEFAULT 0,
  time_spent INTEGER DEFAULT 0,
  answered_at TIMESTAMP WITH TIME ZONE
);

-- Student history (daily results)
CREATE TABLE IF NOT EXISTS student_history (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  student_id BIGINT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  total_questions INTEGER DEFAULT 0,
  questions_correct INTEGER DEFAULT 0,
  total_marks INTEGER DEFAULT 0,
  max_marks INTEGER DEFAULT 0,
  time_spent_seconds INTEGER DEFAULT 0,
  subjects_completed_json TEXT,
  improvement_notes_json TEXT,
  score_percentage REAL DEFAULT 0,
  UNIQUE(student_id, date)
);

-- Badges
CREATE TABLE IF NOT EXISTS badges (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT,
  requirement_json TEXT,
  points INTEGER DEFAULT 0,
  category TEXT DEFAULT 'general'
);

-- Student badges
CREATE TABLE IF NOT EXISTS student_badges (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  student_id BIGINT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  badge_id BIGINT NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  notified INTEGER DEFAULT 0,
  UNIQUE(student_id, badge_id)
);

-- Homework
CREATE TABLE IF NOT EXISTS homework (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  student_id BIGINT REFERENCES students(id) ON DELETE SET NULL,
  subject_code TEXT NOT NULL REFERENCES subjects(code),
  title TEXT NOT NULL,
  questions_json JSONB NOT NULL,
  due_date TIMESTAMP WITH TIME ZONE,
  assigned_by BIGINT,
  status TEXT DEFAULT 'assigned',
  submitted_at TIMESTAMP WITH TIME ZONE,
  score_json TEXT
);

-- Holiday work
CREATE TABLE IF NOT EXISTS holiday_work (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  student_id BIGINT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  subject_code TEXT NOT NULL REFERENCES subjects(code),
  title TEXT NOT NULL,
  questions_json JSONB NOT NULL,
  holiday_name TEXT,
  due_date TIMESTAMP WITH TIME ZONE NOT NULL,
  assigned_by BIGINT,
  status TEXT DEFAULT 'assigned',
  submitted_at TIMESTAMP WITH TIME ZONE,
  score_json TEXT
);

-- Mock exams
CREATE TABLE IF NOT EXISTS mock_exams (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  student_id BIGINT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  subject_code TEXT REFERENCES subjects(code),
  date DATE NOT NULL,
  title TEXT,
  time_limit_minutes INTEGER DEFAULT 180,
  status TEXT DEFAULT 'not_started',
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  results_json TEXT,
  grade_boundary TEXT
);

-- Question flags
CREATE TABLE IF NOT EXISTS question_flags (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  student_id BIGINT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  question_id BIGINT NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  flag_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Question versions
CREATE TABLE IF NOT EXISTS question_versions (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  question_id BIGINT NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  version INTEGER DEFAULT 1,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  source TEXT,
  paper_reference TEXT
);

-- Cross-subject links
CREATE TABLE IF NOT EXISTS subject_links (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  subject_a TEXT NOT NULL REFERENCES subjects(code),
  topic_a TEXT NOT NULL,
  subject_b TEXT NOT NULL REFERENCES subjects(code),
  topic_b TEXT NOT NULL,
  link_type TEXT
);

-- App settings
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Study content for subjects
CREATE TABLE IF NOT EXISTS study_content (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  subject_code TEXT NOT NULL REFERENCES subjects(code),
  topic TEXT NOT NULL,
  subtopic TEXT,
  content TEXT NOT NULL,
  key_terms TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Sync queue (offline mode)
CREATE TABLE IF NOT EXISTS sync_queue (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  student_id BIGINT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  data_json JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  synced_at TIMESTAMP WITH TIME ZONE
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_questions_subject ON questions(subject_code);
CREATE INDEX IF NOT EXISTS idx_questions_topic ON questions(subject_code, topic);
CREATE INDEX IF NOT EXISTS idx_holiday_questions_subject ON holiday_questions(subject_code);
CREATE INDEX IF NOT EXISTS idx_holiday_questions_topic ON holiday_questions(subject_code, topic);
CREATE INDEX IF NOT EXISTS idx_daily_tests_student ON daily_tests(student_id, date);
CREATE INDEX IF NOT EXISTS idx_student_history_date ON student_history(student_id, date);
CREATE INDEX IF NOT EXISTS idx_topic_progress_student ON topic_progress(student_id, subject_code);
CREATE INDEX IF NOT EXISTS idx_student_answers_test ON student_answers(daily_test_id);
CREATE INDEX IF NOT EXISTS idx_student_badges_student ON student_badges(student_id);
CREATE INDEX IF NOT EXISTS idx_homework_student ON homework(student_id);
CREATE INDEX IF NOT EXISTS idx_holiday_work_student ON holiday_work(student_id);
CREATE INDEX IF NOT EXISTS idx_study_content_subject ON study_content(subject_code);

-- ============================================
-- SEED DATA - Subjects
-- ============================================
INSERT INTO subjects (code, name, icon, color, display_order) VALUES
('0580', 'Mathematics', 'calculator', '#6366F1', 1),
('0610', 'Biology', 'leaf', '#10B981', 2),
('0620', 'Chemistry', 'flask', '#F59E0B', 3),
('0625', 'Physics', 'zap', '#EF4444', 4),
('0478', 'Computer Science', 'code', '#8B5CF6', 5),
('0460', 'Geography', 'globe', '#06B6D4', 6),
('0452', 'Accounting', 'dollar-sign', '#14B8A6', 7),
('0455', 'Economics', 'trending-up', '#F97316', 8),
('0500', 'English Lang', 'book-open', '#EC4899', 9),
('0510', 'English Lit', 'feather', '#D946EF', 10)
ON CONFLICT (code) DO NOTHING;

-- ============================================
-- SEED DATA - Badges
-- ============================================
INSERT INTO badges (name, description, icon, points, category) VALUES
('First Step', 'Complete your first subject', 'star', 50, 'milestone'),
('Perfect Score', 'Get 100% in any subject', 'target', 100, 'achievement'),
('Bookworm', 'Complete all 10 subjects', 'book', 200, 'milestone'),
('On Fire', '7-day streak', 'flame', 150, 'streak'),
('Champion', '30-day streak', 'trophy', 500, 'streak'),
('King', '100-day streak', 'crown', 1000, 'streak'),
('Quick Learner', 'Finish in under 30 min', 'zap', 75, 'speed'),
('Brain Power', '50% retry questions correct', 'brain', 100, 'improvement'),
('Reading Star', 'Complete English', 'glasses', 100, 'subject'),
('Scientist', 'Complete all sciences', 'flask', 150, 'subject')
ON CONFLICT (name) DO NOTHING;

-- ============================================
-- SEED DATA - Settings
-- ============================================
INSERT INTO settings (key, value) VALUES
('TEACHER_ACCESS_CODE', '123456'),
('HOLIDAY_ACCESS_CODE', '789012'),
('PARENT_ACCESS_CODE', 'parent123'),
('DAILY_TEST_GENERATION_TIME', '00:00')
ON CONFLICT (key) DO NOTHING;

-- ============================================
-- ENABLE ROW LEVEL SECURITY (RLS)
-- ============================================
-- Note: RLS policies should be configured in Supabase dashboard
-- For now, we use service role key which bypasses RLS

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Update student streak on daily activity
CREATE OR REPLACE FUNCTION update_student_streak()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE students 
  SET last_active = NOW(),
      streak_days = streak_days + 1
  WHERE id = NEW.student_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Update topic progress after answer
CREATE OR REPLACE FUNCTION update_topic_progress_fn()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO topic_progress (student_id, subject_code, topic, times_answered, times_correct, last_answer_at, score_percentage)
  SELECT 
    dt.student_id,
    dt.subject_code,
    q.topic,
    1,
    NEW.is_correct,
    NOW(),
    CASE WHEN NEW.is_correct = 1 THEN 100.0 ELSE 0.0 END
  FROM daily_tests dt
  JOIN questions q ON q.id = NEW.question_id
  WHERE dt.id = NEW.daily_test_id
  ON CONFLICT (student_id, subject_code, topic) 
  DO UPDATE SET
    times_answered = topic_progress.times_answered + 1,
    times_correct = topic_progress.times_correct + EXCLUDED.times_correct,
    last_answer_at = NOW(),
    score_percentage = (topic_progress.times_correct + EXCLUDED.times_correct)::REAL / (topic_progress.times_answered + 1) * 100;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- TRIGGERS
-- ============================================
DROP TRIGGER IF EXISTS trigger_update_topic_progress ON student_answers;
CREATE TRIGGER trigger_update_topic_progress
  AFTER INSERT ON student_answers
  FOR EACH ROW
  EXECUTE FUNCTION update_topic_progress_fn();

-- ============================================
-- DISABLE RLS FOR NOW (using service role)
-- ============================================
ALTER TABLE students DISABLE ROW LEVEL SECURITY;
ALTER TABLE subjects DISABLE ROW LEVEL SECURITY;
ALTER TABLE admins DISABLE ROW LEVEL SECURITY;
ALTER TABLE parents DISABLE ROW LEVEL SECURITY;
ALTER TABLE syllabi DISABLE ROW LEVEL SECURITY;
ALTER TABLE questions DISABLE ROW LEVEL SECURITY;
ALTER TABLE holiday_questions DISABLE ROW LEVEL SECURITY;
ALTER TABLE flashcards DISABLE ROW LEVEL SECURITY;
ALTER TABLE topic_progress DISABLE ROW LEVEL SECURITY;
ALTER TABLE student_question_history DISABLE ROW LEVEL SECURITY;
ALTER TABLE error_patterns DISABLE ROW LEVEL SECURITY;
ALTER TABLE daily_tests DISABLE ROW LEVEL SECURITY;
ALTER TABLE student_answers DISABLE ROW LEVEL SECURITY;
ALTER TABLE student_history DISABLE ROW LEVEL SECURITY;
ALTER TABLE badges DISABLE ROW LEVEL SECURITY;
ALTER TABLE student_badges DISABLE ROW LEVEL SECURITY;
ALTER TABLE homework DISABLE ROW LEVEL SECURITY;
ALTER TABLE holiday_work DISABLE ROW LEVEL SECURITY;
ALTER TABLE mock_exams DISABLE ROW LEVEL SECURITY;
ALTER TABLE question_flags DISABLE ROW LEVEL SECURITY;
ALTER TABLE question_versions DISABLE ROW LEVEL SECURITY;
ALTER TABLE subject_links DISABLE ROW LEVEL SECURITY;
ALTER TABLE settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE study_content DISABLE ROW LEVEL SECURITY;
ALTER TABLE sync_queue DISABLE ROW LEVEL SECURITY;
