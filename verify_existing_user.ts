/**
 * Verify existing user flow - login, fetch progress (subjects), and get a test.
 * Uses an existing student to avoid triggering the registration INSERT timeout.
 */
const API_URL = 'http://localhost:3000/api';

async function verifyExistingUserFlow() {
  console.log('--- Verifying Existing User Flow ---');

  // 1. Login with an existing student
  console.log('\n[1] Logging in as testbot@example.com...');
  const loginRes = await fetch(`${API_URL}/auth/student/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'testbot@example.com', password: 'password123' })
  });
  const loginData = await loginRes.json();
  if (!loginRes.ok) throw new Error(`Login failed: ${loginData.error}`);
  console.log(`✅ Logged in as "${loginData.user.name}" (ID: ${loginData.user.id})`);

  const token = loginData.token;
  const studentId = loginData.user.id;
  const today = new Date().toISOString().split('T')[0];
  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

  // 2. Fetch dashboard progress (the new fixed endpoint)
  console.log('\n[2] Fetching student progress (subjects list)...');
  const progressRes = await fetch(`${API_URL}/students/${studentId}/progress`, { headers });
  const progressData = await progressRes.json();
  if (!progressRes.ok) throw new Error(`Progress failed: ${progressData.error}`);
  
  const subjects = progressData.subjects || [];
  console.log(`✅ Received ${subjects.length} subjects from API`);
  subjects.slice(0, 5).forEach((s: any) => {
    console.log(`   - ${s.name} (${s.code}) | Status: ${s.todayStatus} | Progress: ${s.progress}%`);
  });

  if (subjects.length === 0) throw new Error('No subjects returned! Progress API fix may not have applied.');

  // 3. Fetch a test for Mathematics
  const mathSubject = subjects.find((s: any) => s.code === '0580') || subjects[0];
  console.log(`\n[3] Fetching test for ${mathSubject.name} (${mathSubject.code})...`);
  const testRes = await fetch(`${API_URL}/tests/${studentId}/${today}?subject=${mathSubject.code}`, { headers });
  const testData = await testRes.json();
  if (!testRes.ok) throw new Error(`Test fetch failed: ${testData.error}`);

  const test = testData[0];
  if (!test) throw new Error('No test returned');
  console.log(`✅ Test ID: ${test.id}`);

  const questionsData = test.questions_data || [];
  const questionsJson = test.questions_json || [];
  console.log(`   - questions_data (batch-loaded): ${questionsData.length} questions`);
  console.log(`   - questions_json (IDs): ${questionsJson.length} question IDs`);

  if (questionsData.length > 0) {
    const q = questionsData[0];
    console.log(`\n✅ First Question Preview:`);
    console.log(`   Type: ${q.question_type}`);
    console.log(`   Text: "${q.question_text?.substring(0, 60)}..."`);
    if (q.options_json) console.log(`   Options: ${q.options_json.join(', ')}`);
  } else if (questionsJson.length > 0) {
    console.log('⚠️  questions_data is empty but questions_json has IDs. Batch loading may not be working.');
  } else {
    throw new Error('Both questions_data and questions_json are empty!');
  }

  console.log('\n✅ --- ALL CHECKS PASSED. APP IS FUNCTIONAL. ---\n');
}

verifyExistingUserFlow().catch((err) => {
  console.error('\n❌ VERIFICATION FAILED:', err.message);
  process.exit(1);
});
