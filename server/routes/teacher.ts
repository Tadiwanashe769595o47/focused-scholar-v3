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

  const { count: activeToday } = await supabase
    .from('student_history')
    .select('*', { count: 'exact', head: true })
    .eq('date', today);

  const { count: testsToday } = await supabase
    .from('daily_tests')
    .select('*', { count: 'exact', head: true })
    .eq('date', today);

  const { data: avgData } = await supabase
    .from('student_history')
    .select('score_percentage')
    .gte('date', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);

  const avgScore = avgData?.length 
    ? Math.round(avgData.reduce((sum: number, h: any) => sum + (h.score_percentage || 0), 0) / avgData.length)
    : 0;

  res.json({ 
    total_students: totalStudents || 0, 
    active_today: activeToday || 0, 
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
