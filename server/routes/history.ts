import { Router, Request, Response } from 'express';
import { supabase } from '../supabase.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// Get student history
router.get('/:studentId', requireAuth, async (req: Request, res: Response) => {
  const { limit = 30 } = req.query;
  const { data: history, error } = await supabase
    .from('student_history')
    .select('*')
    .eq('student_id', req.params.studentId)
    .order('date', { ascending: false })
    .limit(Number(limit));

  if (error) return res.status(500).json({ error: error.message });
  res.json(history);
});

// Get specific day history
router.get('/:studentId/:date', requireAuth, async (req: Request, res: Response) => {
  const { data: history, error } = await supabase
    .from('student_history')
    .select('*')
    .eq('student_id', req.params.studentId)
    .eq('date', req.params.date)
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json(history || null);
});

// Generate report
router.post('/:studentId/report', requireAuth, async (req: Request, res: Response) => {
  const { date } = req.body;

  const { data: student } = await supabase
    .from('students')
    .select('name')
    .eq('id', req.params.studentId)
    .single();

  const { data: history } = await supabase
    .from('student_history')
    .select('*')
    .eq('student_id', req.params.studentId)
    .eq('date', date)
    .single();

  const { data: errors } = await supabase
    .from('student_answers')
    .select('questions (topic)')
    .eq('daily_test_id', function() {
      return supabase
        .from('daily_tests')
        .select('id')
        .eq('student_id', req.params.studentId)
        .eq('date', date);
    })
    .eq('is_correct', 0);

  // Count errors by topic
  const topicErrors: Record<string, number> = {};
  errors?.forEach((e: any) => {
    const topic = e.questions?.topic;
    if (topic) topicErrors[topic] = (topicErrors[topic] || 0) + 1;
  });

  const improvementNotes = Object.entries(topicErrors)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([topic, count]) => ({ topic, suggestion: `Focus on ${topic} - appeared ${count} times` }));

  res.json({
    student: student?.name,
    date,
    score: history?.total_marks || 0,
    max: history?.max_marks || 0,
    percentage: history?.score_percentage || 0,
    improvements: improvementNotes
  });
});

export default router;
