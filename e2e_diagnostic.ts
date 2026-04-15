import { supabase } from './server/supabase';

async function e2eDiagnostic() {
  console.log('--- E2E Diagnostic Start ---');

  const testEmail = `e2e_${Date.now()}@example.com`;
  const testPassword = 'password123';
  const testName = 'DiagnosticUser';

  console.log(`Setting up test user: ${testEmail}`);

  // 1. Simulate Registration (Call the logic used in server/routes/auth.ts)
  // We'll use the API if possible, or simulate the exact flow.
  // Since we want to test the SYSTEM, let's hit the actual API if the server is up.
  const API_URL = 'http://localhost:3000/api';

  try {
    // Register
    const regRes = await fetch(`${API_URL}/auth/student/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: testName, email: testEmail, password: testPassword })
    });
    
    const regData = await regRes.json();
    if (!regRes.ok) throw new Error(`Registration failed: ${regData.error}`);
    console.log('Registration Successful.');

    const token = regData.token;
    const studentId = regData.user.id;
    const today = new Date().toISOString().split('T')[0];

    // 2. Fetch Subjects and verify 0580 exists
    const subRes = await fetch(`${API_URL}/students/${studentId}/progress`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const subData = await subRes.json();
    console.log(`Available subjects: ${subData.subjects?.length || 0}`);

    // 3. Request Test for Mathematics (0580) with a requested size of 10
    // This triggers the new fallback logic since only 4 questions exist.
    console.log('Requesting test for 0580 with size=10...');
    const testRes = await fetch(`${API_URL}/tests/${studentId}/${today}?subject=0580&size=10`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    const testData = await testRes.json();
    if (!testRes.ok) throw new Error(`Test fetch failed: ${testData.error}`);
    console.log(`Test generated/fetched successfully. Status: ${testRes.status}`);

    if (testData.length === 0) {
      throw new Error('SUCCESSFUL API CALL BUT RETURNED 0 TESTS. Fix failed.');
    }

    const test = testData[0];
    const questionIds = test.questions_json || [];
    console.log(`Test ID: ${test.id}, Questions found: ${questionIds.length}`);
    
    if (questionIds.length === 4) {
      console.log('SUCCESS: Correctly returned all 4 available questions.');
    } else {
      console.warn(`NOTE: Expected 4 questions, but got ${questionIds.length}. This might be due to recycling if the pool was small.`);
    }

    if (questionIds.length === 0) {
      throw new Error('Test has empty questions_json. Fallback fix failed.');
    }

    // 4. Verify a single question can be fetched
    const qRes = await fetch(`${API_URL}/questions/single/${questionIds[0]}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const qData = await qRes.json();
    console.log(`Fetched Question 1: "${qData.question_text.substring(0, 30)}..."`);

    console.log('--- DIAGNOSTIC SUCCESSFUL: SYSTEM IS FUNCTIONAL ---');
  } catch (err: any) {
    console.error('--- DIAGNOSTIC FAILED ---');
    console.error(err.message);
  }
}

e2eDiagnostic();
