import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { useDashboardStore } from '../stores/dashboardStore';
import {
  Calculator, Leaf, Beaker, Zap, Code, Globe, DollarSign,
  TrendingUp, BookOpen, Feather, Settings, BookMarked,
  Trophy, Flame, ClipboardList, Brain, CalendarDays,
  Bell, BellDot,
  LogOut, ArrowRight, Sparkles, Target, Play, RotateCcw, CheckCircle
} from 'lucide-react';
import { motion } from 'framer-motion';

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
  const state = useDashboardStore();
  const subjects = state.subjects || [];
  const streak = state.streak || 0;
  const totalPoints = state.totalPoints || 0;
  const unreadCount = state.unreadNotifications || 0;
  const fetchDashboard = state.fetchDashboard;
  
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
              onClick={() => navigate('/notifications')}
              className="relative p-2 text-gray-500 hover:text-primary rounded-lg hover:bg-gray-100/50 transition-all cursor-pointer"
            >
              {unreadCount > 0 ? (
                <>
                  <BellDot className="w-6 h-6 text-primary animate-bounce-slow" />
                  <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 border-2 border-white rounded-full" />
                </>
              ) : (
                <Bell className="w-6 h-6" />
              )}
            </button>
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
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
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
                  <p className="text-xs text-gray-500">Assignments</p>
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
                  <p className="font-semibold text-gray-900">Holiday</p>
                  <p className="text-xs text-gray-500">Practice</p>
                </div>
              </div>
            </button>
            <button
              onClick={() => navigate('/study')}
              className="glass-card-border group"
            >
              <div className="glass-card flex items-center gap-3 p-4">
                <div className="icon-circle-lg bg-red-100/50">
                  <BookOpen className="w-6 h-6 text-red-600" />
                </div>
                <div className="text-left">
                  <p className="font-semibold text-gray-900">Study</p>
                  <p className="text-xs text-gray-500">Syllabus notes</p>
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
                  <p className="text-xs text-gray-500">Review</p>
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
                  <p className="text-xs text-gray-500">Ask help</p>
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
              <div>
                <h2 className="text-xl font-bold text-gray-900">Today&apos;s Training</h2>
                <p className="text-sm text-gray-500">Complete all subjects to unlock your daily report</p>
              </div>
              {allCompleted ? (
                <motion.button 
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  onClick={() => navigate('/reports')}
                  className="px-6 py-2.5 bg-gradient-to-r from-primary to-accent text-white rounded-full text-sm font-bold shadow-lg shadow-primary/25 hover:shadow-xl transition-all flex items-center gap-2 group"
                >
                  <Trophy className="w-4 h-4 group-hover:rotate-12 transition-transform" />
                  View Final Reports
                  <ArrowRight className="w-4 h-4" />
                </motion.button>
              ) : (
                <div className="flex items-center gap-2 text-sm font-medium text-gray-400 bg-gray-100/50 px-4 py-2 rounded-full">
                  <Target className="w-4 h-4" />
                  {subjects.filter(s => s.todayStatus === 'completed').length} / {subjects.length} Completed
                </div>
              )}
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-5">
              {subjects.map((subject, idx) => {
                const status = subject.todayStatus || 'not_started';
                const isCompleted = status === 'completed';
                const isInProgress = status === 'in_progress';
                
                const buttonConfig = {
                  not_started: { label: 'Start Session', icon: <Play className="w-4 h-4" />, bg: 'from-primary/10 to-primary/20 text-primary border-primary/20' },
                  in_progress: { label: 'Resume', icon: <RotateCcw className="w-4 h-4" />, bg: 'from-yellow-400 to-orange-500 text-white border-transparent shadow-lg shadow-orange-200' },
                  completed: { label: 'Completed', icon: <CheckCircle className="w-4 h-4" />, bg: 'from-green-500 to-emerald-600 text-white border-transparent' }
                }[status];

                return (
                  <motion.button
                    key={subject.code}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    onClick={() => !isCompleted && navigate(`/test/${subject.code}`)}
                    className={`glass-card-border group relative flex flex-col h-full ${isCompleted ? 'cursor-default transition-none' : 'hover:scale-[1.02] active:scale-[0.98]'}`}
                  >
                    <div className="glass-card p-5 flex flex-col h-full text-left relative overflow-hidden">
                      {/* Status Tag */}
                      <div className="absolute top-4 right-4">
                        {isCompleted ? (
                          <div className="bg-green-100 text-green-600 p-1 rounded-full">
                            <CheckCircle className="w-4 h-4" />
                          </div>
                        ) : isInProgress ? (
                          <div className="bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider">
                            In Progress
                          </div>
                        ) : null}
                      </div>

                      <div 
                        className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110 duration-300"
                        style={{ backgroundColor: `${subject.color}15`, color: subject.color }}
                      >
                        {subjectIcons[subject.icon] || <BookOpen className="w-6 h-6" />}
                      </div>

                      <div className="flex-1">
                        <h3 className="font-bold text-gray-900 group-hover:text-primary transition-colors">{subject.name}</h3>
                        <p className="text-xs text-gray-400 font-medium mb-4">{subject.code}</p>
                        
                        {subject.progress > 0 && (
                          <div className="mb-4">
                            <div className="flex justify-between text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                              <span>Today&apos;s Progress</span>
                              <span>{subject.progress}%</span>
                            </div>
                            <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden border border-gray-100">
                              <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${subject.progress}%` }}
                                className="h-full rounded-full"
                                style={{ backgroundColor: subject.color }}
                              />
                            </div>
                          </div>
                        )}
                      </div>

                      <div className={`mt-auto py-2.5 px-4 rounded-xl border-2 font-bold text-xs flex items-center justify-center gap-2 transition-all ${buttonConfig.bg}`}>
                        {buttonConfig.icon}
                        {buttonConfig.label}
                      </div>
                    </div>
                  </motion.button>
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