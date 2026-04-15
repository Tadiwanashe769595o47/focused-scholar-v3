import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { apiFetch } from '../lib/api';
import { ChevronLeft, BookOpen, CheckCircle, Clock, ArrowRight, ClipboardList } from 'lucide-react';
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

export default function Homework() {
  const navigate = useNavigate();
  const { user, token } = useAuthStore();
  const [homework, setHomework] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHomework = async () => {
      if (!user || !token) return;
      try {
        const data = await apiFetch(`/homework/${user.id}`);
        setHomework(data);
      } catch (err) {
        console.error('Error fetching homework:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchHomework();
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
                <ClipboardList className="w-4 h-4 text-primary" />
                Homework
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
            <h1 className="text-2xl font-semibold text-gray-900">Homework</h1>
            <p className="text-gray-500 mt-1">Your assigned work</p>
          </motion.div>

          {homework.length === 0 ? (
            <motion.div variants={itemVariants} className="empty-state">
              <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
                <BookOpen className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-1">No homework yet</h3>
              <p className="text-gray-500 mb-6 text-sm">Your assigned homework will appear here.</p>
              <button
                onClick={() => navigate('/dashboard')}
                className="btn-primary flex items-center gap-2"
              >
                Browse Subjects
                <ArrowRight className="w-4 h-4" />
              </button>
            </motion.div>
          ) : (
            <motion.div variants={itemVariants} className="space-y-3">
              {homework.map((hw: any) => (
                <motion.div
                  key={hw.id}
                  variants={itemVariants}
                  className="glass-card rounded-2xl p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
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
                  {hw.status === 'submitted' && (
                    <div className="flex items-center gap-1.5 text-sm text-success mt-2">
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>Submitted</span>
                    </div>
                  )}
                </motion.div>
              ))}
            </motion.div>
          )}
        </main>
      </motion.div>
    </div>
  );
}