import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { useDashboardStore } from '../stores/dashboardStore';
import {
  Calculator, Leaf, Beaker, Zap, Code, Globe, DollarSign,
  TrendingUp, BookOpen, Feather, Settings, BookMarked,
  Trophy, Flame, ClipboardList, Brain, CalendarDays,
  LogOut, ArrowRight, Sparkles, Target, Play, RotateCcw, CheckCircle
} from 'lucide-react';

const subjectIcons: Record<string, React.ReactNode> = {
  calculator: <Calculator className="w-6 h-6" />,
  leaf: <Leaf className="w-6 h-6" />,
  flask: <Beaker className="w-6 h-6" />,
  zap: <Zap className="w-6 h-6" />,
  code: <Code className="w-6 h-6" />,
  globe: <Globe className="w-6 h-6" />,
  'dollar-sign': <DollarSign className="w-6 h-6" />,
  'trending-up': <TrendingUp className="w-6 h-6" />,
  'book-open': <BookOpen className="w-6 h-6" />,
  feather: <Feather className="w-6 h-6" />
};

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { subjects, streak, totalPoints, fetchDashboard } = useDashboardStore();
  
  const allCompleted = subjects.length > 0 && subjects.every(s => (s.todayStatus || 'not_started') === 'completed');

  useEffect(() => {
    fetchDashboard();
    const interval = setInterval(() => {
      fetchDashboard();
    }, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen relative">
      {/* Top Bar */}
      <div className="glass-nav mx-4 mt-4 px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-xl flex items-center justify-center shadow-lg shadow-primary/25">
              <span className="text-white font-bold">FS</span>
            </div>
            <div>
              <h1 className="font-semibold text-gray-900">Focused Scholar</h1>
              <p className="text-xs text-gray-500">{user?.name}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-gray-700 glass-card px-3 py-1.5 rounded-lg">
              <Flame className="w-5 h-5 text-orange-500" />
              <span className="font-semibold">{streak}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-700 glass-card px-3 py-1.5 rounded-lg">
              <Trophy className="w-5 h-5 text-yellow-500" />
              <span className="font-semibold">{totalPoints}</span>
            </div>
            <button
              onClick={() => { logout(); navigate('/login'); }}
              className="p-2 text-gray-500 hover:text-red-500 rounded-lg hover:bg-gray-100/50 transition-all"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid - Everything visible at once */}
      <div className="p-6">
        <div className="max-w-6xl mx-auto">
          {/* Quick Actions Row */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <button
              onClick={() => navigate('/homework')}
              className="glass-card-border group"
            >
              <div className="glass-card flex items-center gap-3 p-4">
                <div className="icon-circle-lg bg-blue-100/50">
                  <ClipboardList className="w-6 h-6 text-blue-600" />
                </div>
                <div className="text-left">
                  <p className="font-semibold text-gray-900">Homework</p>
                  <p className="text-xs text-gray-500">View assignments</p>
                </div>
              </div>
            </button>
            <button
              onClick={() => navigate('/holiday')}
              className="glass-card-border group"
            >
              <div className="glass-card flex items-center gap-3 p-4">
                <div className="icon-circle-lg bg-green-100/50">
                  <CalendarDays className="w-6 h-6 text-green-600" />
                </div>
                <div className="text-left">
                  <p className="font-semibold text-gray-900">Holiday Work</p>
                  <p className="text-xs text-gray-500">Practice sets</p>
                </div>
              </div>
            </button>
            <button
              onClick={() => navigate('/flashcards')}
              className="glass-card-border group"
            >
              <div className="glass-card flex items-center gap-3 p-4">
                <div className="icon-circle-lg bg-purple-100/50">
                  <BookMarked className="w-6 h-6 text-purple-600" />
                </div>
                <div className="text-left">
                  <p className="font-semibold text-gray-900">Flashcards</p>
                  <p className="text-xs text-gray-500">Review topics</p>
                </div>
              </div>
            </button>
            <button
              onClick={() => navigate('/tutor')}
              className="glass-card-border group"
            >
              <div className="glass-card flex items-center gap-3 p-4">
                <div className="icon-circle-lg bg-indigo-100/50">
                  <Sparkles className="w-6 h-6 text-indigo-600" />
                </div>
                <div className="text-left">
                  <p className="font-semibold text-gray-900">AI Tutor</p>
                  <p className="text-xs text-gray-500">Get help</p>
                </div>
              </div>
            </button>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="stat-card stat-card-streak glass-card">
              <p className="text-sm opacity-90">Current Streak</p>
              <p className="text-4xl font-bold mt-1">{streak}</p>
              <p className="text-sm opacity-75 mt-1">days in a row</p>
            </div>
            <div className="stat-card stat-card-progress glass-card">
              <p className="text-sm opacity-90">Total Points</p>
              <p className="text-4xl font-bold mt-1">{totalPoints}</p>
              <p className="text-sm opacity-75 mt-1">keep earning more</p>
            </div>
            <div className="stat-card stat-card-points glass-card">
              <p className="text-sm opacity-90">Subjects</p>
              <p className="text-4xl font-bold mt-1">{subjects.length}</p>
              <p className="text-sm opacity-75 mt-1">available to study</p>
            </div>
          </div>

          {/* Subjects Grid - All visible */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Your Subjects</h2>
              {allCompleted && (
                <button 
                  onClick={() => navigate('/reports')}
                  className="text-sm font-bold text-primary hover:underline flex items-center gap-2 animate-bounce-subtle"
                >
                  View Final Reports →
                </button>
              )}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {subjects.map((subject) => {
                const status = subject.todayStatus || 'not_started';
                const buttonConfig = {
                  not_started: { label: 'Start', icon: <Play className="w-4 h-4" />, bg: 'from-primary to-accent' },
                  in_progress: { label: 'Continue', icon: <RotateCcw className="w-4 h-4" />, bg: 'from-yellow-500 to-orange-500' },
                  completed: { label: 'Finished', icon: <CheckCircle className="w-4 h-4" />, bg: 'from-green-500 to-emerald-500' }
                }[status];

                return (
                  <button
                    key={subject.code}
                    onClick={() => status !== 'completed' && navigate(`/test/${subject.code}`)}
                    disabled={status === 'completed'}
                    className={`glass-card-border group ${status === 'completed' ? 'opacity-70 grayscale-[0.5] cursor-not-allowed' : ''}`}
                  >
                    <div className="glass-card p-5 text-left relative overflow-hidden">
                      {status === 'completed' && (
                        <div className="absolute top-2 right-2">
                          <CheckCircle className="w-5 h-5 text-green-500" />
                        </div>
                      )}
                      <div 
                        className="icon-circle mb-3"
                        style={{ backgroundColor: `${subject.color}20` }}
                      >
                        <span style={{ color: subject.color }}>
                          {subjectIcons[subject.icon] || <BookOpen className="w-6 h-6" />}
                        </span>
                      </div>
                      <p className="font-semibold text-gray-900">{subject.name}</p>
                      <p className="text-sm text-gray-500">{subject.code}</p>
                      {subject.progress > 0 && (
                        <div className="mt-3">
                          <div className="flex justify-between text-xs text-gray-500 mb-1">
                            <span>Progress</span>
                            <span>{subject.progress}%</span>
                          </div>
                          <div className="h-1.5 rounded-full bg-gray-200/50 overflow-hidden">
                            <div 
                              className="h-full rounded-full transition-all"
                              style={{ width: `${subject.progress}%`, background: `linear-gradient(90deg, ${subject.color}, ${subject.color}99)` }}
                            />
                          </div>
                        </div>
                      )}
                      <div className={`mt-4 py-2 px-3 rounded-lg bg-gradient-to-r ${status === 'completed' ? 'from-gray-400 to-gray-500' : buttonConfig.bg} text-white text-sm font-medium flex items-center justify-center gap-2 shadow-lg`}>
                        {status === 'completed' ? <CheckCircle className="w-4 h-4" /> : buttonConfig.icon}
                        {status === 'completed' ? 'Completed' : buttonConfig.label}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Bottom Row - History & Settings */}
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => navigate('/history')}
              className="glass-card-border group"
            >
              <div className="glass-card p-5 flex items-center gap-4">
                <div className="icon-circle-lg bg-gray-100/50">
                  <Brain className="w-6 h-6 text-gray-600" />
                </div>
                <div className="flex-1 text-left">
                  <p className="font-semibold text-gray-900">History</p>
                  <p className="text-sm text-gray-500">View past sessions</p>
                </div>
                <ArrowRight className="w-5 h-5 text-gray-400 group-hover:translate-x-1 transition-transform" />
              </div>
            </button>
            <button
              onClick={() => navigate('/settings')}
              className="glass-card-border group"
            >
              <div className="glass-card p-5 flex items-center gap-4">
                <div className="icon-circle-lg bg-gray-100/50">
                  <Settings className="w-6 h-6 text-gray-600" />
                </div>
                <div className="flex-1 text-left">
                  <p className="font-semibold text-gray-900">Settings</p>
                  <p className="text-sm text-gray-500">Account & preferences</p>
                </div>
                <ArrowRight className="w-5 h-5 text-gray-400 group-hover:translate-x-1 transition-transform" />
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}