import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { apiFetch } from '../lib/api';

type SubjectStatus = 'not_started' | 'in_progress' | 'completed';

interface Subject {
  code: string;
  name: string;
  color: string;
  icon: string;
  progress: number;
  todayStatus?: SubjectStatus;
}

interface DashboardState {
  subjects: Subject[];
  streak: number;
  totalPoints: number;
  todayScore: { answered: number; correct: number; percentage: number };
  lastFetch: number;
  fetchDashboard: () => Promise<void>;
}

export const useDashboardStore = create<DashboardState>()(
  persist(
    (set, get) => ({
      subjects: [
        { code: '0580', name: 'Mathematics', color: '#6366F1', icon: 'calculator', progress: 0, todayStatus: 'not_started' },
        { code: '0610', name: 'Biology', color: '#10B981', icon: 'leaf', progress: 0, todayStatus: 'not_started' },
        { code: '0620', name: 'Chemistry', color: '#F59E0B', icon: 'flask', progress: 0, todayStatus: 'not_started' },
        { code: '0625', name: 'Physics', color: '#EF4444', icon: 'zap', progress: 0, todayStatus: 'not_started' },
        { code: '0478', name: 'Computer Science', color: '#8B5CF6', icon: 'code', progress: 0, todayStatus: 'not_started' },
        { code: '0460', name: 'Geography', color: '#06B6D4', icon: 'globe', progress: 0, todayStatus: 'not_started' },
        { code: '0452', name: 'Accounting', color: '#14B8A6', icon: 'dollar-sign', progress: 0, todayStatus: 'not_started' },
        { code: '0455', name: 'Economics', color: '#F97316', icon: 'trending-up', progress: 0, todayStatus: 'not_started' },
        { code: '0500', name: 'English Lang', color: '#EC4899', icon: 'book-open', progress: 0, todayStatus: 'not_started' },
        { code: '0510', name: 'English Lit', color: '#D946EF', icon: 'feather', progress: 0, todayStatus: 'not_started' }
      ],
      streak: 0,
      totalPoints: 0,
      todayScore: { answered: 0, correct: 0, percentage: 0 },
      lastFetch: 0,

      fetchDashboard: async () => {
        try {
          const authState = JSON.parse(localStorage.getItem('auth-storage') || '{}');
          const token = authState?.state?.token;
          const user = authState?.state?.user;

          if (!token || !user) return;

          const today = new Date().toISOString().split('T')[0];
          const [statsRes, progressRes] = await Promise.all([
            apiFetch(`/students/${user.id}/stats`),
            apiFetch(`/students/${user.id}/progress`)
          ]);

          const updatedSubjects = progressRes.subjects?.map((sub: any) => ({
            code: sub.code,
            name: sub.name,
            color: sub.color || '#6366F1',
            icon: sub.icon || 'book-open',
            progress: sub.progress || 0,
            todayStatus: sub.todayStatus || 'not_started'
          })) || [];

          const existingCodes = new Set(updatedSubjects.map((s: Subject) => s.code));
          const defaultSubjects = [
            { code: '0580', name: 'Mathematics', color: '#6366F1', icon: 'calculator', progress: 0, todayStatus: 'not_started' as SubjectStatus },
            { code: '0610', name: 'Biology', color: '#10B981', icon: 'leaf', progress: 0, todayStatus: 'not_started' as SubjectStatus },
            { code: '0620', name: 'Chemistry', color: '#F59E0B', icon: 'flask', progress: 0, todayStatus: 'not_started' as SubjectStatus },
            { code: '0625', name: 'Physics', color: '#EF4444', icon: 'zap', progress: 0, todayStatus: 'not_started' as SubjectStatus },
            { code: '0478', name: 'Computer Science', color: '#8B5CF6', icon: 'code', progress: 0, todayStatus: 'not_started' as SubjectStatus },
            { code: '0460', name: 'Geography', color: '#06B6D4', icon: 'globe', progress: 0, todayStatus: 'not_started' as SubjectStatus },
            { code: '0452', name: 'Accounting', color: '#14B8A6', icon: 'dollar-sign', progress: 0, todayStatus: 'not_started' as SubjectStatus },
            { code: '0455', name: 'Economics', color: '#F97316', icon: 'trending-up', progress: 0, todayStatus: 'not_started' as SubjectStatus },
            { code: '0500', name: 'English Lang', color: '#EC4899', icon: 'book-open', progress: 0, todayStatus: 'not_started' as SubjectStatus },
            { code: '0510', name: 'English Lit', color: '#D946EF', icon: 'feather', progress: 0, todayStatus: 'not_started' as SubjectStatus }
          ];

          defaultSubjects.forEach(sub => {
            if (!existingCodes.has(sub.code)) {
              updatedSubjects.push(sub);
            }
          });

          set({ 
            subjects: updatedSubjects, 
            streak: statsRes.streak || 0, 
            totalPoints: statsRes.points || 0,
            lastFetch: Date.now()
          });
        } catch (err) {
          console.error('Dashboard fetch error:', err);
        }
      }
    }),
    {
      name: 'dashboard-storage',
      partialize: (state) => ({
        subjects: state.subjects,
        streak: state.streak,
        totalPoints: state.totalPoints,
        todayScore: state.todayScore,
        lastFetch: state.lastFetch
      })
    }
  )
);
