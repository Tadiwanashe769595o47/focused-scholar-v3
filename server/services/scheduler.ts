import cron from 'node-cron';
import { generateDailyTest } from './generator.js';
import { generateDailyReports } from './reportingService.js';
import { supabase } from '../supabase.js';

// Internal function to run the student generation loop
async function runGeneration() {
  const today = new Date().toISOString().split('T')[0];
  console.log(`Checking/Generating daily tests for ${today}...`);

  const { data: students } = await supabase.from('students').select('id');
  const { data: subjects } = await supabase.from('subjects').select('code');

  if (!students || !subjects) return;

  let generated = 0;
  for (const student of students) {
    for (const subject of subjects) {
      const result = await generateDailyTest(student.id, subject.code);
      if (result) generated++;
    }
  }
  console.log(`Completed generation: ${generated} tests created.`);
}

export async function catchUpScheduler() {
  console.log('Running catch-up scheduler check...');
  const today = new Date().toISOString().split('T')[0];
  
  // Check if we have any tests for today already
  const { count, error } = await supabase
    .from('daily_tests')
    .select('*', { count: 'exact', head: true })
    .eq('date', today);

  if (!error && (count || 0) === 0) {
    console.log('No tests found for today. Catching up now...');
    await runGeneration();
  } else {
    console.log('Daily tests already exist for today. Skipping catch-up.');
  }
}

export function scheduleTests() {
  // Run catch-up immediately on boot
  catchUpScheduler();

  // Run at midnight every day
  cron.schedule('0 0 * * *', async () => {
    console.log('Generating daily tests (Midnight)...');
    await runGeneration();
  });

  // Run at 9 PM (21:00) every day for performance reporting
  cron.schedule('0 21 * * *', async () => {
    console.log('Generating daily performance reports (9 PM CAT)...');
    try {
      await generateDailyReports();
    } catch (error) {
      console.error('Failed to generate daily reports:', error);
    }
  });

  console.log('Daily test & report scheduler started');
}
