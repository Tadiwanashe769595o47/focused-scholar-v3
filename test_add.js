require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const questions = [
  { subject_code: '0580', topic: 'Algebra', question_text: 'Solve for x: 2x + 5 = 15', question_type: 'numerical', correct_answer: '5', model_answer: '2x = 15 - 5 = 10, x = 5', explanation_json: { why_correct: 'Subtract 5 then divide by 2' }, marks: 2, difficulty: 1, time_estimate: 60 },
  { subject_code: '0580', topic: 'Algebra', question_text: 'What is x in 3x - 7 = 2x + 4?', question_type: 'numerical', correct_answer: '11', model_answer: '3x - 2x = 4 + 7, x = 11', explanation_json: { why_correct: 'Bring like terms together' }, marks: 2, difficulty: 2, time_estimate: 60 },
  { subject_code: '0580', topic: 'Number', question_text: 'Calculate: 144 ÷ 12', question_type: 'numerical', correct_answer: '12', model_answer: '144 divided by 12', explanation_json: { why_correct: 'Simple division' }, marks: 1, difficulty: 1, time_estimate: 30 },
  { subject_code: '0580', topic: 'Geometry', question_text: 'Find area of rectangle 8cm x 5cm', question_type: 'numerical', correct_answer: '40', model_answer: 'Area = 8 × 5 = 40 cm²', explanation_json: { why_correct: 'Length × Width' }, marks: 2, difficulty: 1, time_estimate: 60 }
];

async function addQuestions() {
  const { data, error } = await supabase.from('questions').insert(questions).select();
  if (error) {
    console.log('Error:', error.message);
  } else {
    console.log('Added', data?.length, 'questions to database');
  }
}

addQuestions();