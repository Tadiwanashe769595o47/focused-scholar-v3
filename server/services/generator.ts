import { supabase } from '../supabase.js';
import { selectQuestionsForStudent } from './questionSelector.js';

export async function generateDailyTest(studentId: number, subjectCode: string, size?: number) {
  const today = new Date().toISOString().split('T')[0];

  // Check if test already exists
  const { data: existing } = await supabase
    .from('daily_tests')
    .select('id')
    .eq('student_id', studentId)
    .eq('subject_code', subjectCode)
    .eq('date', today)
    .single();

  if (existing) return existing;

  // Use new algorithm to select questions
  const questionIds = await selectQuestionsForStudent(studentId, subjectCode, size);

  if (!questionIds || questionIds.length === 0) {
    console.log(`No questions found for ${subjectCode}`);
    return null;
  }

  // Create the test
  const { data: result, error: insertError } = await supabase
    .from('daily_tests')
    .insert({
      student_id: studentId,
      subject_code: subjectCode,
      date: today,
      questions_json: questionIds,
      status: 'pending'
    })
    .select()
    .single();

  if (insertError) {
    console.error(`Error creating test for student ${studentId}, subject ${subjectCode}:`, insertError);
    return null;
  }

  return { id: result.id };
}
