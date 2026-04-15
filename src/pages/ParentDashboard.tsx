import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, BookOpen, CalendarDays, Flame, LogOut, Trophy } from 'lucide-react';
import { apiFetch } from '../lib/api';
import { useAuthStore } from '../stores/authStore';

type StudentProfile = {
  id: number;
  name: string;
  email?: string | null;
  streak_days?: number;
  total_points?: number;
  last_active?: string | null;
};

export default function ParentDashboard() {
  const navigate = useNavigate();
  const { logout } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [student, setStudent] = useState<StudentProfile | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [progress, setProgress] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [homework, setHomework] = useState<any[]>([]);
  const [holidayWork, setHolidayWork] = useState<any[]>([]);

  useEffect(() => {
    const loadDashboard = async () => {
      setLoading(true);
      try {
        const linkedStudent = await apiFetch('/students/linked');
        const studentId = linkedStudent.id;

        const [statsResponse, progressResponse, historyResponse, homeworkResponse, holidayResponse] = await Promise.all([
          apiFetch(`/students/${studentId}/stats`),
          apiFetch(`/students/${studentId}/progress`),
          apiFetch(`/history/${studentId}?limit=6`),
          apiFetch(`/homework/${studentId}`),
          apiFetch(`/holiday/${studentId}`)
        ]);

        setStudent(linkedStudent);
        setStats(statsResponse);
        setProgress(progressResponse.weak_areas || []);
        setHistory(historyResponse || []);
        setHomework(homeworkResponse || []);
        setHolidayWork(holidayResponse || []);
      } catch (error) {
        console.error('Failed to load parent dashboard:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  const averageScore = useMemo(() => {
    if (!history.length) return 0;
    return Math.round(history.reduce((sum, item) => sum + (item.score_percentage || 0), 0) / history.length);
  }, [history]);

  const pendingWork = useMemo(() => {
    const pendingHomework = homework.filter((item) => item.status !== 'completed').length;
    const pendingHoliday = holidayWork.filter((item) => item.status !== 'completed').length;
    return pendingHomework + pendingHoliday;
  }, [holidayWork, homework]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="mt-4 text-gray-600">Loading parent dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/reports')} className="text-gray-600 hover:text-gray-900">
              <ChevronLeft className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Parent Dashboard</h1>
              <p className="text-sm text-gray-500">
                Tracking {student?.name || 'your student'} across recent study sessions and assigned work.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/reports')}
              className="px-4 py-2 text-sm text-gray-600 hover:text-primary border rounded-full"
            >
              Open Full Reports
            </button>
            <button onClick={logout} className="px-4 py-2 text-sm text-gray-600 hover:text-red-500 flex items-center gap-2">
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6 space-y-6">
        <div className="grid md:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <p className="text-sm text-gray-500">Linked Student</p>
            <p className="text-2xl font-bold text-gray-900 mt-2">{student?.name || 'Unavailable'}</p>
            <p className="text-sm text-gray-500 mt-2">{student?.email || 'No email on file'}</p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <div className="flex items-center gap-2 text-orange-500">
              <Flame className="w-5 h-5" />
              <p className="text-sm text-gray-500">Streak</p>
            </div>
            <p className="text-2xl font-bold text-gray-900 mt-2">{stats?.streak ?? student?.streak_days ?? 0} days</p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <div className="flex items-center gap-2 text-primary">
              <Trophy className="w-5 h-5" />
              <p className="text-sm text-gray-500">Points</p>
            </div>
            <p className="text-2xl font-bold text-gray-900 mt-2">{stats?.points ?? student?.total_points ?? 0}</p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <div className="flex items-center gap-2 text-gray-700">
              <CalendarDays className="w-5 h-5" />
              <p className="text-sm text-gray-500">Open Work</p>
            </div>
            <p className="text-2xl font-bold text-gray-900 mt-2">{pendingWork}</p>
            <p className="text-sm text-gray-500 mt-2">{averageScore}% average across recent sessions</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-[1.15fr_0.85fr] gap-6">
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900">Recent Performance</h2>
            <div className="mt-4 space-y-3">
              {history.length === 0 ? (
                <p className="text-sm text-gray-500">No completed sessions recorded yet.</p>
              ) : (
                history.map((entry) => (
                  <div key={entry.id} className="rounded-2xl border p-4 flex items-center justify-between gap-4">
                    <div>
                      <p className="font-semibold text-gray-900">{new Date(entry.date).toLocaleDateString()}</p>
                      <p className="text-sm text-gray-500">
                        {entry.questions_correct || 0}/{entry.total_questions || 0} correct
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-gray-900">{entry.score_percentage || 0}%</p>
                      <p className="text-sm text-gray-500">{Math.round((entry.time_spent_seconds || 0) / 60)} min</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900">Support Priorities</h2>
              <div className="mt-4 space-y-3">
                {progress.length === 0 ? (
                  <p className="text-sm text-gray-500">Weak-area insights will appear after more answered questions.</p>
                ) : (
                  progress.slice(0, 5).map((item) => (
                    <div key={`${item.subject_code}-${item.topic}`} className="rounded-2xl border p-4">
                      <p className="font-semibold text-gray-900">{item.topic}</p>
                      <p className="text-sm text-gray-500 mt-1">{item.subject_code}</p>
                      <p className="text-sm text-gray-500 mt-2">
                        Accuracy: {item.score_percentage || 0}% across {item.times_answered || 0} answers
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900">Upcoming Work</h2>
              <div className="mt-4 space-y-3">
                {[...homework, ...holidayWork]
                  .filter((item) => item.status !== 'completed')
                  .slice(0, 6)
                  .map((item) => (
                    <div key={`${item.id}-${item.title}`} className="rounded-2xl border p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-gray-900">{item.title}</p>
                          <p className="text-sm text-gray-500 mt-1">{item.subject_code}</p>
                        </div>
                        <span className="text-xs text-gray-500">{item.status || 'assigned'}</span>
                      </div>
                      {item.due_date && (
                        <p className="text-sm text-gray-500 mt-3">
                          Due {new Date(item.due_date).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  ))}

                {pendingWork === 0 && (
                  <p className="text-sm text-gray-500">No active homework or holiday work right now.</p>
                )}
              </div>
            </div>

            <button
              onClick={() => navigate('/reports')}
              className="w-full py-3 bg-primary text-white rounded-lg font-semibold hover:bg-primary-dark flex items-center justify-center gap-2"
            >
              <BookOpen className="w-5 h-5" />
              View Detailed Reports
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
