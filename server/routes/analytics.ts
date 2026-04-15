import { Router, Request, Response } from 'express';
import { supabase } from '../supabase.js';
import { requireAuth, requireTeacher } from '../middleware/auth.js';

const router = Router();

// Overview stats
router.get('/overview', requireTeacher, async (req: Request, res: Response) => {
  const today = new Date().toISOString().split('T')[0];

  const { count: total_students } = await supabase
    .from('students')
    .select('*', { count: 'exact', head: true });

  const { count: total_questions } = await supabase
    .from('questions')
    .select('*', { count: 'exact', head: true });

  const { count: tests_today } = await supabase
    .from('daily_tests')
    .select('*', { count: 'exact', head: true })
    .eq('date', today);

  const { data: todayHistory } = await supabase
    .from('student_history')
    .select('score_percentage')
    .eq('date', today);

  const avgCompletion = todayHistory?.length
    ? Math.round(todayHistory.reduce((sum: number, h: any) => sum + (h.score_percentage || 0), 0) / todayHistory.length)
    : 0;

  res.json({
    total_students: total_students || 0,
    total_questions: total_questions || 0,
    tests_today: tests_today || 0,
    avg_completion: avgCompletion
  });
});

// Individual student analytics
router.get('/student/:id', requireTeacher, async (req: Request, res: Response) => {
  const { data: progress, error: progressError } = await supabase
    .from('student_history')
    .select('date, score_percentage, total_questions')
    .eq('student_id', req.params.id)
    .order('date', { ascending: false })
    .limit(30);

  if (progressError) return res.status(500).json({ error: progressError.message });

  const { data: weakAreas, error: weakError } = await supabase
    .from('student_answers')
    .select('questions!inner (topic)')
    .eq('is_correct', 0)
    .eq('daily_tests.student_id', req.params.id)
    .limit(50);

  if (weakError) return res.status(500).json({ error: weakError.message });

  // Aggregate weak areas
  const weakMap: Record<string, number> = {};
  weakAreas?.forEach((a: any) => {
    const topic = a.questions?.topic;
    if (topic) weakMap[topic] = (weakMap[topic] || 0) + 1;
  });

  const weakAreasAgg = Object.entries(weakMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([topic, wrong]) => ({ topic, wrong }));

  res.json({ progress, weak_areas: weakAreasAgg });
});

export default router;
