import { Router, Request, Response } from 'express';
import { supabase } from '../supabase.js';
import { requireAuth, requireHoliday } from '../middleware/auth.js';

const router = Router();

// Get holiday questions for subject
router.get('/questions/:subject', requireAuth, async (req: Request, res: Response) => {
  const { topic, limit = 100, offset = 0 } = req.query;
  let query = supabase
    .from('holiday_questions')
    .select('*')
    .eq('subject_code', req.params.subject)
    .range(Number(offset), Number(offset) + Number(limit) - 1);

  if (topic) {
    query = query.eq('topic', topic);
  }

  const { data: questions, error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  res.json(questions || []);
});

// Import holiday questions (holiday workspace or teacher)
router.post('/questions/import', requireHoliday, async (req: Request, res: Response) => {
  const { questions, mirror_to_questions } = req.body;
  if (!questions || !Array.isArray(questions)) return res.status(400).json({ error: 'Questions array required' });

  let imported = 0;
  let mirrored = 0;
  const errors: any[] = [];

  for (const q of questions) {
    try {
      const payload = {
        subject_code: q.subject_code,
        topic: q.topic,
        subtopic: q.subtopic || null,
        question_text: q.question_text,
        question_type: q.question_type,
        options_json: q.options || null,
        correct_answer: q.correct_answer,
        model_answer: q.model_answer,
        explanation_json: q.explanation || {},
        key_points_json: q.key_points || [],
        marks: q.marks || 1,
        diagram_url: q.diagram_url || null,
        diagram_type: q.diagram_type || null,
        difficulty: q.difficulty || 1,
        time_estimate: q.time_estimate || 60,
        source: q.source || 'holiday'
      };

      const { error } = await supabase
        .from('holiday_questions')
        .insert(payload);

      if (error) {
        errors.push({ question: q.topic, error: error.message });
        continue;
      }

      imported++;

      const shouldMirror = mirror_to_questions !== false;
      if (shouldMirror) {
        const { error: mirrorError } = await supabase
          .from('questions')
          .insert({ ...payload, source: 'holiday' });

        if (mirrorError) {
          errors.push({ question: q.topic, error: mirrorError.message, stage: 'mirror' });
        } else {
          mirrored++;
        }
      }
    } catch (err: any) {
      errors.push({ question: q.topic, error: err.message });
    }
  }

  res.json({ imported, mirrored, errors, total: questions.length });
});

// Get student holiday work
router.get('/:studentId', requireAuth, async (req: Request, res: Response) => {
  const { data: holiday, error } = await supabase
    .from('holiday_work')
    .select('*')
    .eq('student_id', req.params.studentId)
    .order('due_date', { ascending: true });

  if (error) return res.status(500).json({ error: error.message });
  res.json(holiday);
});

// Assign holiday work
router.post('/assign', requireHoliday, async (req: Request, res: Response) => {
  const { student_id, subject_code, title, questions, due_date, holiday_name } = req.body;

  const { data: result, error } = await supabase
    .from('holiday_work')
    .insert({
      student_id,
      subject_code,
      title,
      questions_json: questions,
      due_date,
      holiday_name: holiday_name || 'Holiday',
      assigned_by: req.user.id
    })
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json({ id: result.id, success: true });
});

// Submit holiday work
router.put('/:id/submit', requireAuth, async (req: Request, res: Response) => {
  const { answers } = req.body;

  const { error } = await supabase
    .from('holiday_work')
    .update({ status: 'submitted', submitted_at: new Date().toISOString(), score_json: JSON.stringify(answers) })
    .eq('id', req.params.id);

  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

export default router;
