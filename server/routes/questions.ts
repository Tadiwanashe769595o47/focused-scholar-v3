import { Router, Request, Response } from 'express';
import { supabase } from '../supabase.js';
import { requireAuth, requireTeacher } from '../middleware/auth.js';

const router = Router();

// Get questions for subject
router.get('/:subject', requireAuth, async (req: Request, res: Response) => {
  const { topic, limit = 20, offset = 0 } = req.query;
  let query = supabase
    .from('questions')
    .select('*')
    .eq('subject_code', req.params.subject)
    .range(Number(offset), Number(offset) + Number(limit) - 1);

  if (topic) {
    query = query.eq('topic', topic);
  }

  const { data: questions, error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  res.json(questions);
});

// Get single question
router.get('/single/:id', requireAuth, async (req: Request, res: Response) => {
  const { data: question, error } = await supabase
    .from('questions')
    .select('*')
    .eq('id', req.params.id)
    .single();

  if (error || !question) return res.status(404).json({ error: 'Question not found' });
  res.json(question);
});

// Get topics for subject
router.get('/:subject/topics', requireAuth, async (req: Request, res: Response) => {
  const { data: topics, error } = await supabase
    .from('questions')
    .select('topic')
    .eq('subject_code', req.params.subject)
    .order('topic');

  if (error) return res.status(500).json({ error: error.message });

  // Get unique topics with counts
  const uniqueTopics: Record<string, number> = {};
  topics?.forEach((t: any) => {
    uniqueTopics[t.topic] = (uniqueTopics[t.topic] || 0) + 1;
  });

  const result = Object.entries(uniqueTopics).map(([topic, count]) => ({ topic, count }));
  res.json(result);
});

// Import questions (teacher only)
router.post('/import', requireTeacher, async (req: Request, res: Response) => {
  const { questions } = req.body;
  if (!questions || !Array.isArray(questions)) return res.status(400).json({ error: 'Questions array required' });

  let imported = 0;
  const errors: any[] = [];

  for (const q of questions) {
    try {
      const { error } = await supabase
        .from('questions')
        .insert({
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
          source: q.source || 'generated'
        });

      if (error) {
        errors.push({ question: q.topic, error: error.message });
      } else {
        imported++;
      }
    } catch (err: any) {
      errors.push({ question: q.topic, error: err.message });
    }
  }

  res.json({ imported, errors, total: questions.length });
});

// Update question (teacher only)
router.put('/:id', requireTeacher, async (req: Request, res: Response) => {
  const { question_text, correct_answer, model_answer, explanation, marks, topic } = req.body;
  const updates: any = { version: 1 };
  if (question_text) updates.question_text = question_text;
  if (correct_answer) updates.correct_answer = correct_answer;
  if (model_answer) updates.model_answer = model_answer;
  if (explanation) updates.explanation_json = explanation;
  if (marks) updates.marks = marks;
  if (topic) updates.topic = topic;

  const { error } = await supabase
    .from('questions')
    .update(updates)
    .eq('id', req.params.id);

  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

// Delete question (teacher only)
router.delete('/:id', requireTeacher, async (req: Request, res: Response) => {
  const { error } = await supabase
    .from('questions')
    .delete()
    .eq('id', req.params.id);

  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

// Get flashcards for subject
router.get('/flashcards/:subject', requireAuth, async (req: Request, res: Response) => {
  const { topic } = req.query;
  let query = supabase
    .from('flashcards')
    .select('*')
    .eq('subject_code', req.params.subject);

  if (topic) {
    query = query.eq('topic', topic);
  }

  const { data: flashcards, error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  res.json(flashcards);
});

export default router;
