import { useEffect, useState } from 'react';
import { loadOfflineQuestions } from '../lib/loadOfflineQuestions';
import { useOfflineStore } from '../stores/offlineStore';

export function useOfflineQuestions() {
  const [loading, setLoading] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const { isOnline, questions } = useOfflineStore();

  useEffect(() => {
    // Load offline questions on startup
    loadOfflineQuestions();
    setLoading(false);
    setLoaded(true);
  }, []);

  // Get question counts by subject
  const questionCounts = Object.keys(questions).reduce((acc, subject) => {
    acc[subject] = questions[subject]?.length || 0;
    return acc;
  }, {} as Record<string, number>);

  return {
    isOnline,
    loading,
    loaded,
    questionCounts,
    totalQuestions: Object.values(questionCounts).reduce((a, b) => a + b, 0)
  };
}

// Hook to check if we can use offline mode
export function useOfflineMode() {
  const isOnline = useOfflineStore(state => state.isOnline);
  const hasQuestions = useOfflineStore(state => Object.values(state.questions).some(arr => arr && arr.length > 0));
  
  return {
    canWorkOffline: hasQuestions,
    isOnline,
    mode: isOnline ? 'online' : 'offline'
  };
}