import questions0580 from '../data/offlineQuestions_0580.json';
import questions0610 from '../data/offlineQuestions_0610.json';
import questions0620 from '../data/offlineQuestions_0620.json';
import questions0625 from '../data/offlineQuestions_0625.json';

export const offlineQuestionsData = {
  '0580': questions0580,
  '0610': questions0610,
  '0620': questions0620,
  '0625': questions0625,
};

export function loadOfflineQuestions() {
  const store = useOfflineStore.getState();
  
  // Load all bundled questions into offline store
  Object.entries(offlineQuestionsData).forEach(([subjectCode, questions]) => {
    if (!store.getQuestions(subjectCode).length) {
      console.log(`Loading ${questions.length} offline questions for ${subjectCode}`);
      store.saveQuestions(subjectCode, questions as any);
    }
  });
  
  const total = Object.values(offlineQuestionsData).reduce((sum, arr) => sum + (arr as any[]).length, 0);
  console.log(`Total offline questions loaded: ${total}`);
}

export { useOfflineStore };