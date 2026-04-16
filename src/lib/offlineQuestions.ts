import { useOfflineStore, OfflineQuestion } from '../stores/offlineStore';

// Default test size
const DEFAULT_TEST_SIZE = 20;

// Offline question selector - works without internet
export function selectQuestionsOffline(
  subjectCode: string, 
  testSize: number = DEFAULT_TEST_SIZE
): OfflineQuestion[] {
  const questions = useOfflineStore.getState().getQuestions(subjectCode);
  
  if (!questions || questions.length === 0) {
    console.log(`No offline questions for ${subjectCode}`);
    return [];
  }

  // Shuffle questions
  const shuffled = [...questions].sort(() => Math.random() - 0.5);
  
  // Get requested number
  return shuffled.slice(0, Math.min(testSize, shuffled.length));
}

// Get random questions for a topic
export function getQuestionsByTopicOffline(
  subjectCode: string, 
  topic: string,
  limit: number = 10
): OfflineQuestion[] {
  const questions = useOfflineStore.getState().getQuestions(subjectCode);
  
  if (!questions) return [];
  
  const topicQuestions = questions.filter(q => 
    q.topic.toLowerCase().includes(topic.toLowerCase())
  );
  
  return topicQuestions.slice(0, limit);
}

// Get weak areas based on past answers
export function getWeakAreasOffline(subjectCode: string): string[] {
  const allAnswers = useOfflineStore.getState().getTodayAnswers();
  
  if (!allAnswers || allAnswers.length === 0) return [];
  
  // Group by correctness
  const correct = allAnswers.filter(a => a.isCorrect);
  const incorrect = allAnswers.filter(a => !a.isCorrect);
  
  // For now, return topics that had wrong answers
  // In a fuller implementation, we'd track question topics
  return ['Practice more questions in this topic'];
}

// Check if offline mode has questions loaded
export function hasOfflineQuestions(subjectCode: string): boolean {
  const questions = useOfflineStore.getState().getQuestions(subjectCode);
  return questions && questions.length > 0;
}

// Get total offline questions count
export function getOfflineQuestionCount(subjectCode?: string): number {
  const state = useOfflineStore.getState();
  
  if (subjectCode) {
    return state.questions[subjectCode]?.length || 0;
  }
  
  // Total across all subjects
  return Object.values(state.questions).reduce(
    (sum, arr) => sum + (arr?.length || 0), 
    0
  );
}

// Save quiz score locally
export function saveOfflineScore(
  subjectCode: string,
  score: { correct: number; total: number; marks: number; maxMarks: number }
): void {
  const today = new Date().toISOString().split('T')[0];
  const existing = useOfflineStore.getState().getProgress(`${today}_scores`) || {};
  
  useOfflineStore.getState().saveProgress(`${today}_scores`, {
    ...existing,
    [subjectCode]: score
  });
}

// Get today's scores
export function getTodayScoresOffline(): Record<string, any> {
  const today = new Date().toISOString().split('T')[0];
  return useOfflineStore.getState().getProgress(`${today}_scores`) || {};
}