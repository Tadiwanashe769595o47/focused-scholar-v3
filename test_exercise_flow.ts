import { supabase } from './server/supabase';
import { generateDailyTest } from './server/services/generator';

async function testExerciseFlow() {
  console.log('--- Starting Exercise Flow Test ---');

  const today = new Date().toISOString().split('T')[0];

  // 1. Create a Test Student
  const studentName = 'TestBot_' + Date.now();
  const pin = '1212';
  const { data: student, error: studentError } = await supabase
    .from('students')
    .insert({ name: studentName, pin: pin, email: 'testbot@example.com' })
    .select()
    .single();

  if (studentError) {
    console.error('Error creating student:', studentError);
    return;
  }
  console.log(`Created student: ${student.name} (ID: ${student.id})`);

  // 2. Generate a Daily Test for Mathematics (0580)
  const subjectCode = '0580';
  const testResult = await generateDailyTest(student.id, subjectCode);
  if (!testResult) {
    console.error('Failed to generate daily test');
    return;
  }
  console.log(`Generated daily test ID: ${testResult.id}`);

  // 3. Fetch the questions for the test
  const { data: testData } = await supabase
    .from('daily_tests')
    .select('questions_json')
    .eq('id', testResult.id)
    .single();

  const questionIds = testData.questions_json;
  console.log(`Test has ${questionIds.length} questions`);

  // 4. Submit answers for each question
  const mockAnswers = [
    { answer: '5', is_correct: 1 },
    { answer: '11', is_correct: 1 },
    { answer: '12', is_correct: 1 },
    { answer: '40', is_correct: 1 }
  ];

  for (let i = 0; i < questionIds.length && i < mockAnswers.length; i++) {
    const qId = questionIds[i];
    const mock = mockAnswers[i];
    
    const { error: answerError } = await supabase
      .from('student_answers')
      .insert({
        daily_test_id: testResult.id,
        question_id: qId,
        question_index: i,
        student_answer: mock.answer,
        is_correct: mock.is_correct,
        marks_awarded: 1,
        time_spent: 30,
        answered_at: new Date().toISOString()
      });

    if (answerError) {
      console.error(`Error submitting answer ${i}:`, answerError);
    } else {
      console.log(`Submitted answer for question ${i}`);
    }
  }

  // 5. Complete the test
  const { error: completeError } = await supabase
    .from('daily_tests')
    .update({ 
      status: 'completed', 
      completed_at: new Date().toISOString() 
    })
    .eq('id', testResult.id);

  if (completeError) {
    console.error('Error completing test:', completeError);
    return;
  }
  console.log('Marked test as completed');

  // 6. Final verification - Check Student History (Wait 1s for trigger)
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  const { data: history } = await supabase
    .from('student_history')
    .select('*')
    .eq('student_id', student.id)
    .eq('date', today)
    .single();

  if (history) {
    console.log('--- TEST SUCCESSFUL ---');
    console.log(`Student Score: ${history.score_percentage}%`);
    console.log(`Correct: ${history.questions_correct}/${history.total_questions}`);
  } else {
    const { data: progress } = await supabase
      .from('topic_progress')
      .select('*')
      .eq('student_id', student.id);
    
    console.log(`Topic Progress entries: ${progress?.length || 0}`);
    if (progress && progress.length > 0) {
      console.log('--- TEST SEMI-SUCCESSFUL (Progress updated) ---');
    } else {
      console.error('No history or progress found.');
    }
  }
}

testExerciseFlow();
