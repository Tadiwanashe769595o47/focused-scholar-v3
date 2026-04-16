import { useOfflineStore, OfflineQuestion } from '../stores/offlineStore';

const DEFAULT_TEST_SIZE = 20;

interface TopicPerformance {
  topic: string;
  timesCorrect: number;
  timesAnswered: number;
  lastAnswerAt: number;
}

// Calculate performance per topic from offline answers
function calculateTopicPerformance(subjectCode: string): TopicPerformance[] {
  const allAnswers = useOfflineStore.getState().progress;
  const topicMap = new Map<string, TopicPerformance>();
  
  // Get today's answers
  const today = new Date().toISOString().split('T')[0];
  const todayAnswers = allAnswers[`${today}_answers`] || [];
  
  // Get all questions for this subject
  const questions = useOfflineStore.getState().getQuestions(subjectCode);
  
  // Build a map of question ID to topic
  const questionTopicMap = new Map<number, string>();
  questions.forEach(q => {
    questionTopicMap.set(q.id, q.topic);
  });
  
  // Calculate performance per topic
  todayAnswers.forEach((answer: any) => {
    const topic = questionTopicMap.get(answer.questionId);
    if (!topic) return;
    
    const existing = topicMap.get(topic);
    if (existing) {
      existing.timesAnswered++;
      if (answer.isCorrect) existing.timesCorrect++;
    } else {
      topicMap.set(topic, {
        topic,
        timesCorrect: answer.isCorrect ? 1 : 0,
        timesAnswered: 1,
        lastAnswerAt: answer.timestamp
      });
    }
  });
  
  return Array.from(topicMap.values());
}

// Get difficulty distribution for a subject
function getDifficultyDistribution(subjectCode: string): { easy: number; medium: number; hard: number } {
  const questions = useOfflineStore.getState().getQuestions(subjectCode);
  
  if (!questions || questions.length === 0) {
    return { easy: 0.3, medium: 0.4, hard: 0.3 };
  }
  
  const easy = questions.filter(q => q.difficulty <= 2).length;
  const medium = questions.filter(q => q.difficulty === 3).length;
  const hard = questions.filter(q => q.difficulty >= 4).length;
  const total = questions.length;
  
  return {
    easy: easy / total,
    medium: medium / total,
    hard: hard / total
  };
}

// Shuffle array with seed for reproducibility per day
function shuffleWithSeed<T>(array: T[], seed: number): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor((seed * 9301 + 49297) % 233280) / 233280 * (i + 1);
    const seed2 = (seed * 9301 + 49297) % 233280;
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

// Get today's seed based on date
function getTodaySeed(): number {
  const today = new Date();
  return today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
}

// Main offline question selector
export function selectQuestionsOffline(
  subjectCode: string,
  testSize: number = DEFAULT_TEST_SIZE
): OfflineQuestion[] {
  const allQuestions = useOfflineStore.getState().getQuestions(subjectCode);
  
  if (!allQuestions || allQuestions.length === 0) {
    console.log(`No offline questions available for ${subjectCode}`);
    return [];
  }
  
  // Get topic performance
  const topicPerformance = calculateTopicPerformance(subjectCode);
  
  // Identify weak topics (less than 60% correct)
  const weakTopics = topicPerformance
    .filter(tp => tp.timesAnswered > 0 && (tp.timesCorrect / tp.timesAnswered) < 0.6)
    .map(tp => tp.topic);
  
  // Get difficulty distribution
  const difficulty = getDifficultyDistribution(subjectCode);
  
  // Categorize questions
  const categorized = {
    weak: [] as OfflineQuestion[],      // From weak topics
    review: [] as OfflineQuestion[],    // Previously seen topics
    new: [] as OfflineQuestion[],        // Never seen topics
    easy: [] as OfflineQuestion[],      // Low difficulty
    hard: [] as OfflineQuestion[]        // High difficulty
  };
  
  const seenTopics = new Set(topicPerformance.map(tp => tp.topic));
  
  allQuestions.forEach(q => {
    if (weakTopics.includes(q.topic)) {
      categorized.weak.push(q);
    } else if (seenTopics.has(q.topic)) {
      categorized.review.push(q);
    } else {
      categorized.new.push(q);
    }
    
    if (q.difficulty <= 2) {
      categorized.easy.push(q);
    } else if (q.difficulty >= 4) {
      categorized.hard.push(q);
    }
  });
  
  // Build selection based on performance
  const selected: OfflineQuestion[] = [];
  const usedIds = new Set<number>();
  
  // Helper to add questions without duplication
  const addQuestions = (questions: OfflineQuestion[], count: number) => {
    const shuffled = shuffleWithSeed(questions, getTodaySeed());
    for (const q of shuffled) {
      if (selected.length >= testSize) break;
      if (!usedIds.has(q.id)) {
        selected.push(q);
        usedIds.add(q.id);
      }
    }
  };
  
  // Algorithm:
  // 1. If weak topics exist, include 40% from them
  // 2. Include 30% from review (topics they've seen)
  // 3. Include 20% new topics
  // 4. Include 10% challenge (hard questions)
  
  const weakCount = Math.floor(testSize * 0.4);
  const reviewCount = Math.floor(testSize * 0.3);
  const newCount = Math.floor(testSize * 0.2);
  const hardCount = testSize - weakCount - reviewCount - newCount;
  
  addQuestions(categorized.weak, weakCount);
  addQuestions(categorized.review, reviewCount);
  addQuestions(categorized.new, newCount);
  addQuestions(categorized.hard, hardCount);
  
  // If still not enough, fill with any remaining
  if (selected.length < testSize) {
    const remaining = allQuestions.filter(q => !usedIds.has(q.id));
    addQuestions(remaining, testSize - selected.length);
  }
  
  // Final shuffle for variety
  const finalShuffle = shuffleWithSeed(selected, getTodaySeed());
  
  console.log(`Offline selection: ${finalShuffle.length} questions`);
  console.log(`Weak topics: ${weakTopics.length}`);
  
  return finalShuffle;
}

// Check if student is making progress
export function getOfflineProgressStats(subjectCode: string) {
  const topicPerformance = calculateTopicPerformance(subjectCode);
  
  const totalAnswered = topicPerformance.reduce((sum, tp) => sum + tp.timesAnswered, 0);
  const totalCorrect = topicPerformance.reduce((sum, tp) => sum + tp.timesCorrect, 0);
  
  const accuracy = totalAnswered > 0 ? (totalCorrect / totalAnswered) * 100 : 0;
  
  // Identify improvement areas
  const improving = topicPerformance.filter(tp => 
    tp.timesAnswered >= 3 && (tp.timesCorrect / tp.timesAnswered) >= 0.7
  );
  
  const needsWork = topicPerformance.filter(tp => 
    tp.timesAnswered >= 2 && (tp.timesCorrect / tp.timesAnswered) < 0.5
  );
  
  return {
    totalAnswered,
    totalCorrect,
    accuracy: Math.round(accuracy),
    topicsCovered: topicPerformance.length,
    improvingTopics: improving.map(t => t.topic),
    needsWorkTopics: needsWork.map(t => t.topic)
  };
}

// Get different questions each day (based on date)
export function getDailyQuestionSet(subjectCode: string, dayOffset: number = 0): OfflineQuestion[] {
  const seed = getTodaySeed() + dayOffset;
  
  const allQuestions = useOfflineStore.getState().getQuestions(subjectCode);
  if (!allQuestions) return [];
  
  const shuffled = shuffleWithSeed(allQuestions, seed);
  return shuffled.slice(0, DEFAULT_TEST_SIZE);
}