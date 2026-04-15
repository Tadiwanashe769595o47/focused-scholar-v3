const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://bpvwkmkwecjqwjyvtzuh.supabase.co';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJwdndrbWt3ZWNqcXdqeXZ0enVoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTk1MTQ1MywiZXhwIjoyMDkxNTI3NDUzfQ.PojMj6hps8DNjKQuyHkhuOcwWaLOU8R3M89sxsdKxWs';

const supabase = createClient(supabaseUrl, serviceKey);

const questions = [
  {
    subject_code: '0580',
    topic: 'Algebra',
    question_text: 'Solve for x: 2x + 5 = 15',
    question_type: 'numerical',
    correct_answer: '5',
    model_answer: '2x = 15 - 5 = 10, x = 10/2 = 5',
    explanation_json: { why_correct: 'Subtract 5 from both sides then divide by 2', key_understanding: 'Linear equations need inverse operations' },
    marks: 2,
    difficulty: 1,
    time_estimate: 60
  },
  {
    subject_code: '0580',
    topic: 'Algebra',
    question_text: 'What is the value of x in 3x - 7 = 2x + 4?',
    question_type: 'numerical',
    correct_answer: '11',
    model_answer: '3x - 2x = 4 + 7, x = 11',
    explanation_json: { why_correct: 'Bring like terms together', key_understanding: 'Balance equation by doing same operation to both sides' },
    marks: 2,
    difficulty: 2,
    time_estimate: 60
  },
  {
    subject_code: '0580',
    topic: 'Number',
    question_text: 'Calculate: 144 ÷ 12',
    question_type: 'numerical',
    correct_answer: '12',
    model_answer: '144 divided by 12 equals 12',
    explanation_json: { why_correct: 'Simple division', key_understanding: 'Basic arithmetic' },
    marks: 1,
    difficulty: 1,
    time_estimate: 30
  },
  {
    subject_code: '0580',
    topic: 'Geometry',
    question_text: 'Find the area of a rectangle with length 8cm and width 5cm.',
    question_type: 'numerical',
    correct_answer: '40',
    model_answer: 'Area = length × width = 8 × 5 = 40 cm²',
    explanation_json: { why_correct: 'Formula for rectangle area is length × width', key_understanding: 'Area = length × width' },
    marks: 2,
    difficulty: 1,
    time_estimate: 60
  }
];

async function addQuestions() {
  const { data, error } = await supabase.from('questions').insert(questions).select();
  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Added questions:', data?.length);
  }
}

addQuestions();