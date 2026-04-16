import { useOfflineStore, OfflineQuestion } from '../stores/offlineStore';

interface AnswerResult {
  questionId: number;
  selectedAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  marks: number;
  maxMarks: number;
  topic: string;
  difficulty: number;
}

interface TestResult {
  totalQuestions: number;
  correctAnswers: number;
  totalMarks: number;
  maxMarks: number;
  percentage: number;
  answers: AnswerResult[];
  completedAt: number;
}

// Mark all answers in an offline test
export function markOfflineTest(
  questions: OfflineQuestion[],
  answers: Record<number, string>
): TestResult {
  const answerResults: AnswerResult[] = [];
  let totalMarks = 0;
  let maxMarksTotal = 0;
  let correctCount = 0;

  questions.forEach((question) => {
    const selectedAnswer = answers[question.id];
    const correctAnswer = question.correct_answer;
    
    // Determine if correct
    const isCorrect = selectedAnswer === correctAnswer;
    
    // Calculate marks
    const questionMarks = isCorrect ? (question.marks || 1) : 0;
    const questionMaxMarks = question.marks || 1;
    
    totalMarks += questionMarks;
    maxMarksTotal += questionMaxMarks;
    if (isCorrect) correctCount++;

    answerResults.push({
      questionId: question.id,
      selectedAnswer: selectedAnswer || 'No answer',
      correctAnswer,
      isCorrect,
      marks: questionMarks,
      maxMarks: questionMaxMarks,
      topic: question.topic,
      difficulty: question.difficulty
    });
  });

  const percentage = maxMarksTotal > 0 ? Math.round((totalMarks / maxMarksTotal) * 100) : 0;

  // Save to offline store
  const today = new Date().toISOString().split('T')[0];
  useOfflineStore.getState().saveProgress(`${today}_result`, {
    totalQuestions: questions.length,
    correctAnswers: correctCount,
    totalMarks,
    maxMarks: maxMarksTotal,
    percentage,
    completedAt: Date.now()
  });

  return {
    totalQuestions: questions.length,
    correctAnswers: correctCount,
    totalMarks,
    maxMarks: maxMarksTotal,
    percentage,
    answers: answerResults,
    completedAt: Date.now()
  };
}

// Get accuracy by topic (for analytics)
export function getTopicAccuracy(subjectCode: string): Record<string, { correct: number; total: number; percentage: number }> {
  const questions = useOfflineStore.getState().getQuestions(subjectCode);
  const allAnswers = useOfflineStore.getState().getTodayAnswers();
  
  // Build topic map
  const topicMap: Record<string, { correct: number; total: number }> = {};
  
  questions.forEach(q => {
    topicMap[q.topic] = { correct: 0, total: 0 };
  });
  
  // Count answers per topic
  allAnswers.forEach((answer: any) => {
    const question = questions.find(q => q.id === answer.questionId);
    if (question && topicMap[question.topic]) {
      topicMap[question.topic].total++;
      if (answer.isCorrect) {
        topicMap[question.topic].correct++;
      }
    }
  });
  
  // Calculate percentages
  const result: Record<string, { correct: number; total: number; percentage: number }> = {};
  Object.entries(topicMap).forEach(([topic, stats]) => {
    result[topic] = {
      correct: stats.correct,
      total: stats.total,
      percentage: stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0
    };
  });
  
  return result;
}

// Get daily streak
export function getOfflineStreak(): number {
  const progress = useOfflineStore.getState().progress;
  let streak = 0;
  
  // Check last 30 days
  for (let i = 0; i < 30; i++) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    
    const dayAnswers = progress[`${dateStr}_answers`] || [];
    const dayResult = progress[`${dateStr}_result`];
    
    if (dayAnswers.length > 0 || (dayResult && dayResult.percentage > 0)) {
      streak++;
    } else {
      break;
    }
  }
  
  return streak;
}

// Calculate points earned
export function calculatePoints(marks: number, accuracy: number): number {
  // Base points: 10 per mark
  let points = marks * 10;
  
  // Bonus for high accuracy
  if (accuracy >= 90) {
    points = Math.floor(points * 1.5); // 50% bonus
  } else if (accuracy >= 70) {
    points = Math.floor(points * 1.2); // 20% bonus
  }
  
  // Streak bonus
  const streak = getOfflineStreak();
  if (streak >= 7) {
    points = Math.floor(points * 1.3); // 30% bonus for week streak
  } else if (streak >= 3) {
    points = Math.floor(points * 1.1); // 10% bonus for 3-day streak
  }
  
  return points;
}

// Get today's score summary
export function getTodayScoreSummary() {
  const today = new Date().toISOString().split('T')[0];
  const progress = useOfflineStore.getState().progress;
  
  const answers = progress[`${today}_answers`] || [];
  const result = progress[`${today}_result`];
  
  const correct = answers.filter((a: any) => a.isCorrect).length;
  const total = answers.length;
  const percentage = total > 0 ? Math.round((correct / total) * 100) : 0;
  
  return {
    questionsAnswered: total,
    correctAnswers: correct,
    percentage,
    marks: result?.totalMarks || 0,
    maxMarks: result?.maxMarks || 0,
    streak: getOfflineStreak()
  };
}

// Check if user has completed today's test for a subject
export function hasCompletedTodayTest(subjectCode: string): boolean {
  const today = new Date().toISOString().split('T')[0];
  const progress = useOfflineStore.getState().progress;
  const answers = progress[`${today}_answers`] || [];
  
  // Check if they answered at least 20 questions for this subject
  // In a real implementation, we'd filter by subject
  return answers.length >= 20;
}

// Get recommended topics to focus on
export function getRecommendedTopics(subjectCode: string): string[] {
  const topicAccuracy = getTopicAccuracy(subjectCode);
  
  // Sort by accuracy (lowest first) and take top 3
  return Object.entries(topicAccuracy)
    .filter(([_, stats]) => stats.total >= 2) // Only topics with 2+ attempts
    .sort((a, b) => a[1].percentage - b[1].percentage)
    .slice(0, 3)
    .map(([topic]) => topic);
}