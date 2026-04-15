import { Router, Request, Response } from 'express';
import { supabase } from '../supabase.js';
import { requireAuth, requireTeacher } from '../middleware/auth.js';

const router = Router();

// Get student homework
router.get('/:studentId', requireAuth, async (req: Request, res: Response) => {
  const { data: homework, error } = await supabase
    .from('homework')
    .select('*')
    .or(`student_id.eq.${req.params.studentId},student_id.is.null`)
    .order('due_date', { ascending: true });

  if (error) return res.status(500).json({ error: error.message });
  res.json(homework);
});

// Assign homework (teacher only)
router.post('/assign', requireTeacher, async (req: Request, res: Response) => {
  const { student_id, subject_code, title, questions, due_date } = req.body;

  const { data: result, error } = await supabase
    .from('homework')
    .insert({
      student_id: student_id || null,
      subject_code,
      title,
      questions_json: questions,
      due_date,
      assigned_by: req.user.id
    })
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json({ id: result.id, success: true });
});

// Submit homework
router.put('/:id/submit', requireAuth, async (req: Request, res: Response) => {
  const { answers } = req.body;

  const { error } = await supabase
    .from('homework')
    .update({ status: 'submitted', submitted_at: new Date().toISOString(), score_json: JSON.stringify(answers) })
    .eq('id', req.params.id);

  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

export default router;
