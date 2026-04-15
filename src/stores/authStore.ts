/// <reference types="vite/client" />

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface User {
  id: number;
  name: string;
  email?: string | null;
  username?: string;
  type: 'student' | 'teacher' | 'parent' | 'holiday';
  student_id?: number;
  needsOnboarding?: boolean;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (credentials: any) => Promise<void>;
  register: (data: any) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  finishGoogleAuth: (token: string) => Promise<void>;
  checkOnboardingStatus: () => Promise<boolean>;
  setNeedsOnboarding: (value: boolean) => void;
  logout: () => void;
}

const API_URL = (import.meta as any).env?.DEV ? '/api' : (import.meta as any).env?.VITE_API_URL || 'http://localhost:3000/api';

async function getStudentNeedsOnboarding(token: string): Promise<boolean> {
  try {
    const profileRes = await fetch(`${API_URL}/students/me/profile`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (profileRes.ok) {
      const profile = await profileRes.json();
      return !profile.completed_onboarding;
    }
  } catch {}

  return true;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      login: async (credentials) => {
        const endpoint = credentials.type === 'student' ? '/auth/student/login'
          : credentials.type === 'teacher' ? '/auth/teacher/login'
          : credentials.type === 'holiday' ? '/auth/holiday/login'
          : '/auth/parent/login';

        const res = await fetch(`${API_URL}${endpoint}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(credentials)
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error);

        // Check if student needs onboarding
        let needsOnboarding = true;
        if (credentials.type === 'student') {
          needsOnboarding = await getStudentNeedsOnboarding(data.token);
        }

        set({
          user: { ...data.user, needsOnboarding },
          token: data.token,
          isAuthenticated: true
        });
      },

      register: async (data) => {
        const res = await fetch(`${API_URL}/auth/student/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });

        const response = await res.json();
        if (!res.ok) throw new Error(response.error);

        // New students always need onboarding
        set({
          user: { ...response.user, needsOnboarding: true },
          token: response.token,
          isAuthenticated: true
        });
      },

      loginWithGoogle: async () => {
        window.location.href = `${API_URL}/auth/google`;
      },

      finishGoogleAuth: async (token) => {
        const meRes = await fetch(`${API_URL}/students/me`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        const meData = await meRes.json().catch(() => ({}));
        if (!meRes.ok) {
          throw new Error(meData.error || 'Failed to finish Google sign-in');
        }

        const needsOnboarding = await getStudentNeedsOnboarding(token);

        set({
          user: { ...meData, type: 'student', needsOnboarding },
          token,
          isAuthenticated: true
        });
      },

      checkOnboardingStatus: async () => {
        const { token } = get();
        if (!token) return true;

        try {
          const res = await fetch(`${API_URL}/students/me/profile`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (res.ok) {
            const profile = await res.json();
            const needsOnboarding = !profile.completed_onboarding;
            set((state) => ({ user: state.user ? { ...state.user, needsOnboarding } : null }));
            return needsOnboarding;
          }
        } catch {}
        return true;
      },

      setNeedsOnboarding: (value) =>
        set((state) => ({
          user: state.user ? { ...state.user, needsOnboarding: value } : null
        })),

      logout: () => set({ user: null, token: null, isAuthenticated: false })
    }),
    { name: 'auth-storage' }
  )
);
