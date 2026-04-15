import { Router, Request, Response } from 'express';
import { supabase } from '../supabase.js';
import { requireAuth } from '../middleware/auth.js';
import { generateDailyTest } from '../services/generator.js';

const router = Router();

// Get daily tests for student
router.get('/:studentId/:date', requireAuth, async (req: Request, res: Response) => {
  const { subject, size } = req.query;
  const { studentId, date } = req.params;

  let query = supabase
    .from('daily_tests')
    .select('*')
    .eq('student_id', studentId)
    .eq('date', date);

  if (subject) {
    query = query.eq('subject_code', subject);
  }

  const { data: tests, error } = await query;
  
  if (error) return res.status(500).json({ error: error.message });

  const enrichTestsWithQuestions = async (testsList: any[]) => {
    return Promise.all(testsList.map(async (test) => {
      if (test.questions_json && test.questions_json.length > 0) {
        const { data: questions } = await supabase
          .from('questions')
          .select('*')
          .in('id', test.questions_json);
        
        // Sort questions to match the original order in questions_json
        const questionsMap = new Map(questions?.map(q => [q.id, q]));
        const sortedQuestions = test.questions_json
          .map((id: number) => questionsMap.get(id))
          .filter(Boolean);
          
        return { ...test, questions_data: sortedQuestions };
      }
      return test;
    }));
  };

  // If no tests found and a subject is specified, try to generate one on the fly
  if ((!tests || tests.length === 0) && subject) {
    console.log(`No test found for ${studentId} on ${date} for ${subject}. Generating (size: ${size || 'default'})...`);
    const generated = await generateDailyTest(Number(studentId), subject as string, size ? Number(size) : undefined);
    
    if (generated) {
      // Fetch the newly generated test
      const { data: newTests, error: fetchError } = await supabase
        .from('daily_tests')
        .select('*')
        .eq('id', generated.id);
        
      if (fetchError) return res.status(500).json({ error: fetchError.message });
      const enriched = await enrichTestsWithQuestions(newTests || []);
      return res.json(enriched);
    }
  }

  const enriched = await enrichTestsWithQuestions(tests || []);
  res.json(enriched || []);
});

// Generate daily tests
router.post('/generate', requireAuth, async (req: Request, res: Response) => {
  const { data: students, error: studentsError } = await supabase
    .from('students')
    .select('id');

  if (studentsError) return res.status(500).json({ error: studentsError.message });

  const { data: subjects, error: subjectsError } = await supabase
    .from('subjects')
    .select('code');

  if (subjectsError) return res.status(500).json({ error: subjectsError.message });

  for (const student of (students || [])) {
    for (const subject of (subjects || [])) {
      await generateDailyTest(student.id, subject.code);
    }
  }

  res.json({ success: true, students: students?.length || 0, subjects: subjects?.length || 0 });
});

// Submit answer
router.post('/:testId/answer', requireAuth, async (req: Request, res: Response) => {
  const { question_id, answer, time_spent } = req.body;

  // Get the question
  const { data: question, error: questionError } = await supabase
    .from('questions')
    .select('*')
    .eq('id', question_id)
    .single();

  if (questionError || !question) return res.status(404).json({ error: 'Question not found' });

  // Check answer
  const isCorrect = answer?.toString().toLowerCase().trim() === question.correct_answer?.toString().toLowerCase().trim();
  const marks = isCorrect ? question.marks || 1 : 0;

  // Get test
  const { data: test, error: testError } = await supabase
    .from('daily_tests')
    .select('*')
    .eq('id', req.params.testId)
    .single();

  if (testError || !test) return res.status(404).json({ error: 'Test not found' });

  const currentIndex = (test.current_index || 0) + 1;
  const questions = test.questions_json || [];

  // Insert answer
  const { error: answerError } = await supabase
    .from('student_answers')
    .insert({
      daily_test_id: req.params.testId,
      question_id,
      question_index: test.current_index,
      student_answer: answer,
      is_correct: isCorrect ? 1 : 0,
      marks_awarded: marks,
      time_spent: time_spent || 0,
      answered_at: new Date().toISOString()
    });

  if (answerError) return res.status(500).json({ error: answerError.message });

  // Update test index
  await supabase
    .from('daily_tests')
    .update({ current_index: currentIndex })
    .eq('id', req.params.testId);

  // Check if test is complete
  if (currentIndex >= questions.length) {
    await supabase
      .from('daily_tests')
      .update({ status: 'completed', completed_at: new Date().toISOString() })
      .eq('id', req.params.testId);

    // Update student points
    const { data: student } = await supabase
      .from('students')
      .select('total_points')
      .eq('id', req.user.id)
      .single();

    if (student) {
      await supabase
        .from('students')
        .update({ total_points: (student.total_points || 0) + marks * 10 })
        .eq('id', req.user.id);
    }
  }

  res.json({ is_correct: isCorrect, marks, explanation: question.explanation_json });
});

// Get test results
router.get('/:testId/results', requireAuth, async (req: Request, res: Response) => {
  const { data: test, error } = await supabase
    .from('daily_tests')
    .select('*')
    .eq('id', req.params.testId)
    .single();

  if (error || !test) return res.status(404).json({ error: 'Test not found' });

  const { data: answers, error: answersError } = await supabase
    .from('student_answers')
    .select('*, questions (topic, question_type, correct_answer, model_answer, explanation_json)')
    .eq('daily_test_id', req.params.testId)
    .order('question_index');

  if (answersError) return res.status(500).json({ error: answersError.message });

  const totalMarks = answers?.reduce((sum: number, a: any) => sum + (a.marks_awarded || 0), 0) || 0;
  res.json({ test, answers, total_marks: totalMarks });
});

export default router;
