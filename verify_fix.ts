import { supabase } from './server/supabase';
import { generateDailyTest } from './server/services/generator';

async function verifyOnDemandGeneration() {
  console.log('--- Verifying On-Demand Test Generation ---');

  // 1. Find a student
  const { data: student } = await supabase.from('students').select('id').limit(1).single();
  if (!student) {
    console.error('No students found in DB');
    return;
  }
  const studentId = student.id;
  const today = new Date().toISOString().split('T')[0];
  const subjectCode = '0580'; // Mathematics

  console.log(`Testing for Student ${studentId} on ${today} for ${subjectCode}`);

  // 2. Delete any existing test for today to force generation
  await supabase
    .from('daily_tests')
    .delete()
    .eq('student_id', studentId)
    .eq('date', today)
    .eq('subject_code', subjectCode);

  console.log('Cleared existing tests for today.');

  // 3. Simulate the API call (call the logic directly)
  console.log('Simulating API request GET /api/tests/:studentId/:date?subject=0580');
  
  // Logic from routes/tests.ts
  let { data: tests } = await supabase
    .from('daily_tests')
    .select('*')
    .eq('student_id', studentId)
    .eq('date', today)
    .eq('subject_code', subjectCode);

  if (!tests || tests.length === 0) {
    console.log('No test found. Triggering generation...');
    const generated = await generateDailyTest(studentId, subjectCode);
    
    if (generated) {
      console.log('Generation successful! Test ID:', generated.id);
      const { data: finalTests } = await supabase
        .from('daily_tests')
        .select('*')
        .eq('id', generated.id);
      
      if (finalTests && finalTests.length > 0) {
        console.log('SUCCESS: On-demand generation works.');
        console.log('Questions picked:', finalTests[0].questions_json.length);
      }
    } else {
      console.error('FAILED: Generation returned null. (Maybe no questions in DB for this subject?)');
    }
  } else {
    console.log('Test already existed (somehow).');
  }
}

verifyOnDemandGeneration();
