import { supabase } from '../supabase.js';

const DEFAULT_TEST_SIZE = 20;
const DAYS_TO_TRACK = 30;
const MIN_HISTORY_FOR_ADAPTIVE = 7;

interface Question {
  id: number;
  topic: string;
  difficulty: number;
}

interface StudentTopicScore {
  topic: string;
  times_correct: number;
  times_answered: number;
  last_answer_at: string;
}

export async function selectQuestionsForStudent(studentId: number, subjectCode: string, requestedSize?: number): Promise<number[]> {
  const testSize = requestedSize || DEFAULT_TEST_SIZE;
  const today = new Date().toISOString().split('T')[0];
  const thirtyDaysAgo = new Date(Date.now() - DAYS_TO_TRACK * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const studentHistory = await getStudentHistory(studentId, subjectCode, thirtyDaysAgo);
  const isNewStudent = studentHistory.length === 0;

  // STRICT REPEAT PREVENTION: Fetch IDs from the most recent daily test
  const { data: lastTest } = await supabase
    .from('daily_tests')
    .select('questions_json')
    .eq('student_id', studentId)
    .eq('subject_code', subjectCode)
    .order('date', { ascending: false })
    .limit(1)
    .single();

  const lastTestIds: number[] = lastTest?.questions_json || [];
  const historyIds = studentHistory.map((h: any) => h.question_id);
  const forbiddenIds = new Set([...lastTestIds, ...historyIds]);

  let questions: Question[];

  if (isNewStudent || studentHistory.length < MIN_HISTORY_FOR_ADAPTIVE) {
    console.log(`Selecting for new/low-history student ${studentId} for ${subjectCode}`);
    questions = await selectForNewStudent(subjectCode, testSize);
  } else {
    console.log(`Selecting adaptive for student ${studentId} for ${subjectCode}`);
    questions = await selectForExistingStudent(studentId, subjectCode, studentHistory, testSize);
  }
  
  console.log(`Initial pool size: ${questions.length}`);
  const filteredQuestions = questions.filter(q => !forbiddenIds.has(q.id));
  console.log(`Filtered pool size: ${filteredQuestions.length} (forbidden: ${forbiddenIds.size})`);
  
  const selectedIds = filteredQuestions.slice(0, testSize).map(q => q.id);
  
  if (selectedIds.length < testSize) {
    const additionalNeeded = testSize - selectedIds.length;
    // Attempt with forbiddenIds exclusion
    let additional = await getRandomQuestions(subjectCode, additionalNeeded, Array.from(forbiddenIds));
    
    // FALLBACK: If we still don't have enough, retry WITHOUT the exclusion (recycle questions)
    if (additional.length < additionalNeeded) {
      console.log(`Pool exhausted for ${subjectCode}. Recycling questions...`);
      const recycleNeeded = additionalNeeded - additional.length;
      const alreadyPicked = [...selectedIds, ...additional.map(a => a.id)];
      
      // FIX: In final pass, prioritize questions not in 'alreadyPicked', but if pool is truly small, stop excluding.
      const recycled = await getRandomQuestions(subjectCode, recycleNeeded, alreadyPicked);
      if (recycled.length === 0 && alreadyPicked.length > 0) {
        console.log('Final fallback: ignoring all exclusions to fill test.');
        const finalPass = await getRandomQuestions(subjectCode, recycleNeeded, []);
        additional.push(...finalPass);
      } else {
        additional.push(...recycled);
      }
    }
    
    selectedIds.push(...additional.map(q => q.id));
  }

  // Final trimming. We DO NOT use Set here so that if the subject bank
  // runs out of questions, it successfully recycles questions to reach exact test sizes.
  return selectedIds.slice(0, testSize);
}

async function getStudentHistory(studentId: number, subjectCode: string, fromDate: string) {
  const { data } = await supabase
    .from('student_answers')
    .select('question_id, is_correct, answered_at')
    .eq('student_id', studentId)
    .gte('answered_at', fromDate)
    .order('answered_at', { ascending: false });

  return data || [];
}

async function getTopicPerformance(studentId: number, subjectCode: string): Promise<StudentTopicScore[]> {
  const { data } = await supabase
    .from('topic_progress')
    .select('topic, times_correct, times_answered, last_answer_at')
    .eq('student_id', studentId)
    .eq('subject_code', subjectCode);

  return data || [];
}

async function selectForNewStudent(subjectCode: string, testSize: number): Promise<Question[]> {
  const { data: questions, error } = await supabase
    .from('questions')
    .select('id, topic, difficulty')
    .eq('subject_code', subjectCode)
    .limit(100);

  if (error || !questions) return [];

  const distribution = {
    covered: 0.6,
    preview: 0.3,
    stretch: 0.1
  };

  const coveredTopics = await getCoveredTopics(subjectCode);
  
  const categorized = {
    covered: [] as Question[],
    preview: [] as Question[],
    stretch: [] as Question[]
  };

  for (const q of questions) {
    if (coveredTopics.includes(q.topic)) {
      categorized.covered.push(q);
    } else if ((q.difficulty || 1) >= 4) {
      categorized.stretch.push(q);
    } else {
      categorized.preview.push(q);
    }
  }

  const selected: Question[] = [];
  
  const coveredCount = Math.floor(testSize * distribution.covered);
  const previewCount = Math.floor(testSize * distribution.preview);
  const stretchCount = testSize - coveredCount - previewCount;

  selected.push(...shuffleArray(categorized.covered).slice(0, coveredCount));
  selected.push(...shuffleArray(categorized.preview).slice(0, previewCount));
  selected.push(...shuffleArray(categorized.stretch).slice(0, stretchCount));

  return shuffleArray(selected);
}

async function selectForExistingStudent(studentId: number, subjectCode: string, history: any[], testSize: number): Promise<Question[]> {
  const topicPerformance = await getTopicPerformance(studentId, subjectCode);
  
  const topicScores = new Map<string, number>();
  for (const tp of topicPerformance) {
    const score = tp.times_answered > 0 ? (tp.times_correct / tp.times_answered) * 100 : 0;
    topicScores.set(tp.topic, score);
  }

  const weakTopics = topicPerformance
    .filter(tp => (tp.times_correct / tp.times_answered) < 60)
    .map(tp => tp.topic);

  const topicsNotAttemptedRecently = await getTopicsNotAttemptedRecently(studentId, subjectCode);

  const { data: allQuestions, error } = await supabase
    .from('questions')
    .select('id, topic, difficulty')
    .eq('subject_code', subjectCode)
    .limit(200);

  if (error || !allQuestions) return [];

  const categorized = {
    weak: [] as Question[],
    review: [] as Question[],
    preview: [] as Question[],
    stretch: [] as Question[]
  };

  for (const q of allQuestions) {
    const score = topicScores.get(q.topic) || 0;
    
    if (weakTopics.includes(q.topic)) {
      categorized.weak.push(q);
    } else if (score >= 80 && topicsNotAttemptedRecently.includes(q.topic)) {
      categorized.review.push(q);
    } else if (score < 40) {
      categorized.preview.push(q);
    } else if ((q.difficulty || 1) >= 4) {
      categorized.stretch.push(q);
    } else {
      categorized.preview.push(q);
    }
  }

  const selected: Question[] = [];
  
  selected.push(...shuffleArray(categorized.weak).slice(0, Math.floor(testSize * 0.40)));
  selected.push(...shuffleArray(categorized.review).slice(0, Math.floor(testSize * 0.30)));
  selected.push(...shuffleArray(categorized.preview).slice(0, Math.floor(testSize * 0.20)));
  selected.push(...shuffleArray(categorized.stretch).slice(0, Math.floor(testSize * 0.10)));

  return shuffleArray(selected);
}

async function getCoveredTopics(subjectCode: string): Promise<string[]> {
  const { data } = await supabase
    .from('questions')
    .select('topic')
    .eq('subject_code', subjectCode)
    .limit(50);

  if (!data) return [];
  const unique = [...new Set(data.map(d => d.topic))];
  return unique.slice(0, 25);
}

async function getTopicsNotAttemptedRecently(studentId: number, subjectCode: string): Promise<string[]> {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const { data: answers } = await supabase
    .from('student_answers')
    .select('question_id, answered_at')
    .eq('student_id', studentId)
    .gte('answered_at', thirtyDaysAgo);

  const questionIds = (answers || []).map(a => a.question_id);
  
  if (questionIds.length === 0) {
    const { data: allTopics } = await supabase
      .from('questions')
      .select('topic')
      .eq('subject_code', subjectCode);
    return [...new Set((allTopics || []).map((t: any) => t.topic))];
  }

  const { data: recentQuestions } = await supabase
    .from('questions')
    .select('topic')
    .in('id', questionIds);

  const recentTopics = new Set<string>();
  for (const q of (recentQuestions || [])) {
    recentTopics.add(q.topic);
  }

  const { data: allTopics } = await supabase
    .from('questions')
    .select('topic')
    .eq('subject_code', subjectCode);

  const uniqueTopics = [...new Set((allTopics || []).map((t: any) => t.topic))];
  return uniqueTopics.filter(t => !recentTopics.has(t));
}

async function getRandomQuestions(subjectCode: string, limit: number, excludeIds: number[]): Promise<Question[]> {
  let query = supabase
    .from('questions')
    .select('id, topic, difficulty')
    .eq('subject_code', subjectCode);

  if (excludeIds.length > 0) {
    query = query.not('id', 'in', `(${excludeIds.join(',')})`);
  }

  const { data, error } = await query.limit(limit);

  if (error) {
    console.error('getRandomQuestions error:', error);
    return [];
  }
  if (!data) return [];
  console.log(`getRandomQuestions found ${data.length} questions (limit: ${limit})`);
  return shuffleArray(data);
}

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export async function updateTopicProgress(studentId: number, questionId: number, isCorrect: boolean) {
  const { data: question } = await supabase
    .from('questions')
    .select('topic, subject_code')
    .eq('id', questionId)
    .single();

  if (!question) return;

  const { data: existing } = await supabase
    .from('topic_progress')
    .select('*')
    .eq('student_id', studentId)
    .eq('topic', question.topic)
    .single();

  if (existing) {
    await supabase
      .from('topic_progress')
      .update({
        total_count: existing.total_count + 1,
        correct_count: existing.correct_count + (isCorrect ? 1 : 0),
        score_percentage: ((existing.correct_count + (isCorrect ? 1 : 0)) / (existing.total_count + 1)) * 100,
        last_attempted: new Date().toISOString()
      })
      .eq('student_id', studentId)
      .eq('topic', question.topic);
  } else {
    await supabase
      .from('topic_progress')
      .insert({
        student_id: studentId,
        subject_code: question.subject_code,
        topic: question.topic,
        total_count: 1,
        correct_count: isCorrect ? 1 : 0,
        score_percentage: isCorrect ? 100 : 0,
        last_attempted: new Date().toISOString()
      });
  }
}
