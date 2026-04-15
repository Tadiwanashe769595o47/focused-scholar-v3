import cron from 'node-cron';
import { generateDailyTest } from './generator.js';
import { generateDailyReports } from './reportingService.js';
import { supabase } from '../supabase.js';

export function scheduleTests() {
  // Run at midnight every day
  cron.schedule('0 0 * * *', async () => {
    console.log('Generating daily tests (Midnight)...');

    const { data: students } = await supabase
      .from('students')
      .select('id');

    const { data: subjects } = await supabase
      .from('subjects')
      .select('code');

    let generated = 0;
    for (const student of (students || [])) {
      for (const subject of (subjects || [])) {
        const result = await generateDailyTest(student.id, subject.code);
        if (result) generated++;
      }
    }

    console.log(`Generated ${generated} tests for ${students?.length || 0} students.`);
  });

  // Run at 10 PM every day for performance reporting
  cron.schedule('0 22 * * *', async () => {
    console.log('Generating daily performance reports (10 PM CAT)...');
    try {
      await generateDailyReports();
    } catch (error) {
      console.error('Failed to generate daily reports:', error);
    }
  });

  console.log('Daily test & report scheduler started');
}
