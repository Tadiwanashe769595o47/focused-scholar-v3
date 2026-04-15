-- RLS POLICIES - Simplified
-- Your app uses SERVICE_ROLE_KEY which bypasses RLS entirely
-- This enables basic security for any direct access

-- Enable RLS on all tables
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE parents ENABLE ROW LEVEL SECURITY;
ALTER TABLE syllabi ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE flashcards ENABLE ROW LEVEL SECURITY;
ALTER TABLE topic_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_question_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE error_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE homework ENABLE ROW LEVEL SECURITY;
ALTER TABLE holiday_work ENABLE ROW LEVEL SECURITY;
ALTER TABLE mock_exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE question_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE question_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE subject_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_queue ENABLE ROW LEVEL SECURITY;

-- Public read for reference tables (no auth needed)
CREATE POLICY "read_subjects" ON subjects FOR SELECT USING (true);
CREATE POLICY "read_questions" ON questions FOR SELECT USING (true);
CREATE POLICY "read_badges" ON badges FOR SELECT USING (true);
CREATE POLICY "read_flashcards" ON flashcards FOR SELECT USING (true);
CREATE POLICY "read_syllabi" ON syllabi FOR SELECT USING (true);
CREATE POLICY "read_settings" ON settings FOR SELECT USING (true);
CREATE POLICY "read_links" ON subject_links FOR SELECT USING (true);

-- Server uses service role key - handles all other operations
-- This is intentional for your architecture