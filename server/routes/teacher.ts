import { Router, Request, Response } from 'express';
import { supabase } from '../supabase.js';
import { requireAuth, requireTeacher } from '../middleware/auth.js';
import { generateDailyReports } from '../services/reportingService.js';

const router = Router();

// Debug: Trigger reports manually
router.post('/debug/trigger-reports', requireTeacher, async (req: Request, res: Response) => {
  try {
    await generateDailyReports();
    res.json({ success: true, message: 'Daily reports triggered successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Teacher dashboard
router.get('/dashboard', requireTeacher, async (req: Request, res: Response) => {
  const today = new Date().toISOString().split('T')[0];

  const { count: totalStudents } = await supabase
    .from('students')
    .select('*', { count: 'exact', head: true });

  const { data: activeStudents } = await supabase
    .from('daily_tests')
    .select('student_id')
    .eq('date', today);
  
  const activeToday = new Set(activeStudents?.map(a => a.student_id)).size || 0;

  const { count: testsToday } = await supabase
    .from('daily_tests')
    .select('*', { count: 'exact', head: true })
    .eq('date', today);

  // Compute avg score from answers directly instead of dead history table
  const { data: answersData } = await supabase
    .from('student_answers')
    .select('marks_awarded, is_correct')
    .gte('answered_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

  let totalMarks = 0;
  let totalPossible = 0;
  answersData?.forEach((a: any) => {
    totalMarks += a.marks_awarded || 0;
    // Assuming 1 mark per question for simplicity if not fetched
    totalPossible += 1; 
  });

  const avgScore = totalPossible > 0 
    ? Math.round((totalMarks / totalPossible) * 100)
    : 0;

  res.json({ 
    total_students: totalStudents || 0, 
    active_today: activeToday, 
    tests_generated: testsToday || 0, 
    average_score: avgScore 
  });
});

// List all students
router.get('/students', requireTeacher, async (req: Request, res: Response) => {
  const { search, limit = 50, offset = 0 } = req.query;
  let query = supabase
    .from('students')
    .select('id, name, streak_days, total_points, last_active')
    .order('last_active', { ascending: false })
    .limit(Number(limit))
    .range(Number(offset), Number(offset) + Number(limit) - 1);

  if (search) {
    query = query.ilike('name', `%${search}%`);
  }

  const { data: students, error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  res.json(students);
});

// Teacher analytics
router.get('/analytics', requireTeacher, async (req: Request, res: Response) => {
  const { data: bySubject } = await supabase
    .from('student_answers')
    .select(`
      marks_awarded,
      questions!inner (marks, subject_code),
      daily_tests!inner (date)
    `)
    .gte('daily_tests.date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);

  // Aggregate by subject
  const subjectMap: Record<string, { total: number; correct: number }> = {};
  bySubject?.forEach((a: any) => {
    const code = a.questions?.subject_code;
    if (!code) return;
    if (!subjectMap[code]) subjectMap[code] = { total: 0, correct: 0 };
    subjectMap[code].total += a.questions?.marks || 1;
    subjectMap[code].correct += a.marks_awarded || 0;
  });

  const bySubjectAgg = Object.entries(subjectMap).map(([code, data]) => ({
    subject_code: code,
    avg_score: data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0
  }));

  // Weak topics
  const { data: byTopic } = await supabase
    .from('student_answers')
    .select(`
      questions!inner (topic, marks),
      marks_awarded
    `)
    .eq('is_correct', 0)
    .limit(100);

  const topicMap: Record<string, number> = {};
  byTopic?.forEach((a: any) => {
    const topic = a.questions?.topic;
    if (topic) topicMap[topic] = (topicMap[topic] || 0) + 1;
  });

  const weakTopics = Object.entries(topicMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([topic, count]) => ({ topic, count }));

  res.json({ by_subject: bySubjectAgg, weak_topics: weakTopics });
});

// Update settings
router.post('/settings', requireTeacher, async (req: Request, res: Response) => {
  const { key, value } = req.body;

  const { error } = await supabase
    .from('settings')
    .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: 'key' });

  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

export default router;
