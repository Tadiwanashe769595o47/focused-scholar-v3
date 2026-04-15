import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { useDashboardStore } from '../stores/dashboardStore';
import { apiFetch } from '../lib/api';
import { 
  ChevronLeft, BookOpen, Clock, FolderKanban, ArrowRight, 
  CalendarDays, CheckCircle
} from 'lucide-react';
import { motion } from 'framer-motion';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0 }
};

const subjectIcons: Record<string, React.ReactNode> = {
  calculator: <FolderKanban className="w-5 h-5" />,
  leaf: <FolderKanban className="w-5 h-5" />,
  flask: <FolderKanban className="w-5 h-5" />,
  zap: <FolderKanban className="w-5 h-5" />,
  code: <FolderKanban className="w-5 h-5" />,
  globe: <FolderKanban className="w-5 h-5" />,
  'dollar-sign': <FolderKanban className="w-5 h-5" />,
  'trending-up': <FolderKanban className="w-5 h-5" />,
  'book-open': <FolderKanban className="w-5 h-5" />,
  feather: <FolderKanban className="w-5 h-5" />
};

export default function HolidayWork() {
  const navigate = useNavigate();
  const { user, token } = useAuthStore();
  const subjects = useDashboardStore((state) => state.subjects);
  const [holidayWork, setHolidayWork] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHolidayWork = async () => {
      if (!user || !token) return;
      try {
        const data = await apiFetch(`/holiday/${user.id}`);
        setHolidayWork(data);
      } catch (err) {
        console.error('Error fetching holiday work:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchHolidayWork();
  }, [user, token]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Floating Navbar */}
        <motion.div variants={itemVariants} className="navbar-container">
          <nav className="glass rounded-2xl px-1 py-1 flex items-center justify-between">
            <div className="flex items-center gap-1">
              <button
                onClick={() => navigate('/dashboard')}
                className="btn-icon ml-1"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div className="px-3 py-2 text-sm font-medium text-gray-900 flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-primary" />
                Holiday Work
              </div>
            </div>
            <button
              onClick={() => navigate('/dashboard')}
              className="btn-ghost text-sm mr-1"
            >
              Dashboard
            </button>
          </nav>
        </motion.div>

        {/* Main Content */}
        <main className="max-w-2xl mx-auto px-4 pt-24">
          <motion.div variants={itemVariants} className="mb-6">
            <h1 className="text-2xl font-semibold text-gray-900">Holiday Work</h1>
            <p className="text-gray-500 mt-1">Practice sets for each subject</p>
          </motion.div>

          {/* Subject Cards */}
          <motion.div variants={itemVariants} className="mb-8">
            <h2 className="text-sm font-medium text-gray-500 mb-3">Subjects</h2>
            <div className="grid gap-2">
              {subjects.map((subject) => (
                <motion.button
                  key={subject.code}
                  onClick={() => navigate(`/holiday/subject/${subject.code}`)}
                  variants={itemVariants}
                  className="glass-card rounded-2xl p-4 flex items-center gap-4 cursor-pointer text-left w-full"
                >
                  <div
                    className="icon-circle"
                    style={{ backgroundColor: `${subject.color}15`, color: subject.color }}
                  >
                    {subjectIcons[subject.icon] || <BookOpen className="w-5 h-5" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900">{subject.name}</p>
                    <p className="text-sm text-gray-500">{subject.code}</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-400" />
                </motion.button>
              ))}
            </div>
          </motion.div>

          {/* Assigned Work */}
          <motion.div variants={itemVariants}>
            <h2 className="text-sm font-medium text-gray-500 mb-3">Assigned</h2>
            {holidayWork.length === 0 ? (
              <div className="empty-state">
                <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
                  <BookOpen className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-500 text-sm">No holiday work assigned</p>
              </div>
            ) : (
              <div className="space-y-2">
                {holidayWork.map((hw: any) => (
                  <motion.div
                    key={hw.id}
                    variants={itemVariants}
                    className="glass-card rounded-2xl p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">{hw.title}</h3>
                        <p className="text-sm text-gray-500 mt-0.5">{hw.subject_code}</p>
                      </div>
                      <span className={`badge ${
                        hw.status === 'completed' ? 'bg-success/10 text-success' :
                        hw.status === 'submitted' ? 'bg-primary/10 text-primary' :
                        'bg-warning/10 text-warning'
                      }`}>
                        {hw.status}
                      </span>
                    </div>
                    {hw.due_date && (
                      <div className="flex items-center gap-1.5 text-sm text-gray-500 mt-3">
                        <Clock className="w-3.5 h-3.5" />
                        <span>Due {new Date(hw.due_date).toLocaleDateString()}</span>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        </main>
      </motion.div>
    </div>
  );
}