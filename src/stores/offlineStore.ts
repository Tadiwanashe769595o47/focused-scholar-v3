import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface OfflineQuestion {
  id: number;
  subject_code: string;
  topic: string;
  sub_topic: string;
  difficulty: number;
  question_type: string;
  question_text: string;
  options?: string[];
  correct_answer: string;
  marks: number;
  explanation?: string;
  exam_tips?: string;
  exam_series?: string;
  paper?: string;
}

interface OfflineDataState {
  questions: Record<string, OfflineQuestion[]>;
  progress: Record<string, any>;
  lastSync: number;
  isOnline: boolean;
  
  setOnline: (status: boolean) => void;
  saveQuestions: (subjectCode: string, questions: OfflineQuestion[]) => void;
  getQuestions: (subjectCode: string) => OfflineQuestion[];
  saveProgress: (subjectCode: string, data: any) => void;
  getProgress: (subjectCode: string) => any;
  saveAnswer: (questionId: number, answer: string, isCorrect: boolean, marks: number) => void;
  getTodayAnswers: () => any[];
  clearDayProgress: () => void;
}

export const useOfflineStore = create<OfflineDataState>()(
  persist(
    (set, get) => ({
      questions: {},
      progress: {},
      lastSync: 0,
      isOnline: navigator.onLine,

      setOnline: (status) => set({ isOnline: status }),

      saveQuestions: (subjectCode, questions) => set((state) => ({
        questions: {
          ...state.questions,
          [subjectCode]: questions
        }
      })),

      getQuestions: (subjectCode) => {
        const state = get();
        return state.questions[subjectCode] || [];
      },

      saveProgress: (subjectCode, data) => set((state) => ({
        progress: {
          ...state.progress,
          [subjectCode]: {
            ...state.progress[subjectCode],
            ...data,
            lastUpdated: Date.now()
          }
        }
      })),

      getProgress: (subjectCode) => {
        const state = get();
        return state.progress[subjectCode] || {};
      },

      saveAnswer: (questionId, answer, isCorrect, marks) => {
        const today = new Date().toISOString().split('T')[0];
        set((state) => ({
          progress: {
            ...state.progress,
            [`${today}_answers`]: [
              ...(state.progress[`${today}_answers`] || []),
              { questionId, answer, isCorrect, marks, timestamp: Date.now() }
            ]
          }
        }));
      },

      getTodayAnswers: () => {
        const state = get();
        const today = new Date().toISOString().split('T')[0];
        return state.progress[`${today}_answers`] || [];
      },

      clearDayProgress: () => {
        const today = new Date().toISOString().split('T')[0];
        set((state) => ({
          progress: {
            ...state.progress,
            [`${today}_answers`]: []
          }
        }));
      }
    }),
    {
      name: 'offline-storage',
      partialize: (state) => ({
        questions: state.questions,
        progress: state.progress,
        lastSync: state.lastSync
      })
    }
  )
);

// Listen for online/offline events
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => useOfflineStore.getState().setOnline(true));
  window.addEventListener('offline', () => useOfflineStore.getState().setOnline(false));
}