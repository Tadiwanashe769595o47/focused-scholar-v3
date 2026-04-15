import { supabase } from '../supabase.js';
import { sendTelegramMessage } from './telegramService.js';

export async function generateDailyReports() {
  console.log('Generating daily reports for all students...');

  const { data: students, error: studentError } = await supabase
    .from('students')
    .select('id, name, parent_email');

  if (studentError || !students) {
    console.error('Error fetching students for reports:', studentError);
    return;
  }

  const today = new Date().toISOString().split('T')[0];

  for (const student of students) {
    await generateStudentReport(student.id, student.name, today);
  }
}

async function generateStudentReport(studentId: number, studentName: string, date: string) {
  // 1. Fetch performance for the day
  const { data: history } = await supabase
    .from('student_history')
    .select('*')
    .eq('student_id', studentId)
    .eq('date', date)
    .single();

  if (!history) {
    console.log(`No performance history found for student ${studentName} on ${date}`);
    return;
  }

  // 2. Fetch weak areas (low score topics)
  const { data: topicProgress } = await supabase
    .from('topic_progress')
    .select('topic, score_percentage, subject_code')
    .eq('student_id', studentId)
    .lt('score_percentage', 60)
    .order('score_percentage', { ascending: true })
    .limit(5);

  // 3. Fetch strong areas
  const { data: strengths } = await supabase
    .from('topic_progress')
    .select('topic, score_percentage')
    .eq('student_id', studentId)
    .gte('score_percentage', 80)
    .order('score_percentage', { ascending: false })
    .limit(3);

  // 4. Format the report
  const emoji = history.score_percentage >= 80 ? '🌟' : history.score_percentage >= 60 ? '📈' : '📚';
  
  let report = `<b>${emoji} Daily Progress Report: ${studentName}</b>\n`;
  report += `Date: ${date}\n\n`;
  
  report += `<b>OVERALL PERFORMANCE</b>\n`;
  report += `• Score: ${history.score_percentage}%\n`;
  report += `• Correct: ${history.questions_correct}/${history.total_questions}\n`;
  report += `• Time Spent: ${Math.round(history.time_spent_seconds / 60)} mins\n\n`;

  if (strengths && strengths.length > 0) {
    report += `<b>💪 STRENGTHS</b>\n`;
    strengths.forEach(s => {
      report += `• ${s.topic} (${Math.round(s.score_percentage)}%)\n`;
    });
    report += `\n`;
  }

  if (topicProgress && topicProgress.length > 0) {
    report += `<b>🔍 CONCEPTS TO MASTER</b>\n`;
    topicProgress.forEach(tp => {
      report += `• ${tp.topic} (${tp.subject_code})\n`;
    });
    report += `<i>Focused practice recommended for these areas.</i>\n\n`;
  }

  report += `<i>Automated by Focused Scholar V3 Research Agent</i>`;

  // 5. Send to Telegram
  const success = await sendTelegramMessage(report);
  if (success) {
    console.log(`Sent report for ${studentName} to Telegram`);
  } else {
    console.error(`Failed to send report for ${studentName}`);
  }
}
