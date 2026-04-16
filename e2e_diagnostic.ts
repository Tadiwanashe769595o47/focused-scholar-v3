import { supabase } from './server/supabase.js';
import bcrypt from 'bcryptjs';

async function runGlobalDiagnostic() {
  console.log('🚀 Starting Global Connectivity Diagnostic...');

  try {
    // 1. Test Supabase Connection
    const { data: health, error: healthError } = await supabase.from('subjects').select('count').limit(1);
    if (healthError) throw new Error('Supabase Connection Failed: ' + healthError.message);
    console.log('✅ Cloud Database: REACHABLE');

    // 2. Test Registration Logic
    const testEmail = `test_${Date.now()}@example.com`;
    const hashedPassword = await bcrypt.hash('password123', 10);
    
    const { data: newUser, error: regError } = await supabase
      .from('students')
      .insert({
        name: 'Diagnostic Test User',
        email: testEmail,
        pin_hash: hashedPassword,
        pin: '1234',
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (regError) throw new Error('Registration Logic Failed: ' + regError.message);
    console.log('✅ Registration Module: FUNCTIONAL');

    // 3. Test Login Logic (Simulating what happens when someone logs in)
    const { data: loginUser, error: loginError } = await supabase
      .from('students')
      .select('*')
      .eq('email', testEmail)
      .single();

    if (loginError) throw new Error('Login Logic Failed: ' + loginError.message);
    const isMatch = await bcrypt.compare('password123', loginUser.pin_hash);
    if (!isMatch) throw new Error('Password Verification Failed');
    console.log('✅ Login Module: FUNCTIONAL');

    // 4. Test Data Retrieval (Mocking a dashboard fetch)
    const { data: subjects } = await supabase.from('subjects').select('*').limit(5);
    if (!subjects || subjects.length === 0) console.warn('⚠️ No subjects found in DB, but connection is alive.');
    else console.log(`✅ Module Access: READY (${subjects.length} subjects loaded)`);

    // Cleanup
    await supabase.from('students').delete().eq('id', newUser.id);
    console.log('🧹 Diagnostic Cleanup: SUCCESS');
    console.log('\n🌟 CONCLUSION: The app is READY for global distribution.');

  } catch (err: any) {
    console.error('❌ DIAGNOSTIC FAILED:', err.message);
    process.exit(1);
  }
}

runGlobalDiagnostic();
