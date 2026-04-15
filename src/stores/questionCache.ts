import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { apiFetch } from '../lib/api';

interface CachedQuestion {
  id: number;
  subject_code: string;
  topic: string;
  question_text: string;
  question_type: string;
  options_json: any;
  correct_answer: string;
  model_answer: string;
  explanation_json: any;
  key_points_json: any;
  marks: number;
  difficulty: number;
  cached_at: number;
}

interface QuestionCacheState {
  questions: Record<string, CachedQuestion[]>;
  lastFetch: Record<string, number>;
  fetchQuestionsForSubject: (subjectCode: string, forceRefresh?: boolean) => Promise<CachedQuestion[]>;
  getQuestionsForSubject: (subjectCode: string) => CachedQuestion[];
  isCacheValid: (subjectCode: string, maxAgeMs?: number) => boolean;
  clearCache: () => void;
}

const CACHE_MAX_AGE = 24 * 60 * 60 * 1000;

export const useQuestionCache = create<QuestionCacheState>()(
  persist(
    (set, get) => ({
      questions: {},
      lastFetch: {},

      fetchQuestionsForSubject: async (subjectCode: string, forceRefresh = false) => {
        const state = get();
        
        if (!forceRefresh && state.isCacheValid(subjectCode, CACHE_MAX_AGE)) {
          const cached = state.questions[subjectCode];
          if (cached && cached.length > 0) {
            return cached;
          }
        }

        try {
          const questions = await apiFetch(`/questions/${subjectCode}?limit=200`);
          
          const now = Date.now();
          const cachedQuestions: CachedQuestion[] = questions.map((q: any) => ({
            ...q,
            cached_at: now
          }));

          set((state) => ({
            questions: {
              ...state.questions,
              [subjectCode]: cachedQuestions
            },
            lastFetch: {
              ...state.lastFetch,
              [subjectCode]: now
            }
          }));

          return cachedQuestions;
        } catch (error) {
          console.error('Failed to fetch questions:', error);
          return state.questions[subjectCode] || [];
        }
      },

      getQuestionsForSubject: (subjectCode: string) => {
        return get().questions[subjectCode] || [];
      },

      isCacheValid: (subjectCode: string, maxAgeMs = CACHE_MAX_AGE) => {
        const lastFetch = get().lastFetch[subjectCode];
        if (!lastFetch) return false;
        return Date.now() - lastFetch < maxAgeMs;
      },

      clearCache: () => {
        set({ questions: {}, lastFetch: {} });
      }
    }),
    {
      name: 'question-cache',
      partialize: (state) => ({
        questions: state.questions,
        lastFetch: state.lastFetch
      })
    }
  )
);
