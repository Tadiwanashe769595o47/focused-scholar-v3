import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../lib/api';
import { ChevronLeft, Bell, BellOff, Check, Trash2, Calendar, Info, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning';
  created_at: string;
  read_at: string | null;
}

export default function Notifications() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    try {
      const data = await apiFetch('/notifications');
      setNotifications(data);
    } catch (err) {
      console.error('Error fetching notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const markAsRead = async (id: string) => {
    try {
      await apiFetch(`/notifications/read/${id}`, { method: 'POST' });
      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, read_at: new Date().toISOString() } : n)
      );
    } catch (err) {
      console.error('Error marking as read:', err);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case 'warning': return <AlertTriangle className="w-5 h-5 text-amber-500" />;
      default: return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4 sticky top-0 z-40">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/dashboard')} 
              className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-all cursor-pointer"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Notifications</h1>
              <p className="text-xs text-gray-500">Stay updated with your latest alerts</p>
            </div>
          </div>
          <div className="bg-primary/10 text-primary px-3 py-1 rounded-full text-tiny font-bold uppercase tracking-tighter">
            {notifications.filter(n => !n.read_at).length} Unread
          </div>
        </div>
      </div>

      <main className="flex-1 max-w-3xl mx-auto w-full p-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 grayscale opacity-50">
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
            <BellOff className="w-16 h-16 mx-auto text-gray-200 mb-4" />
            <h3 className="text-lg font-bold text-gray-900">All caught up!</h3>
            <p className="text-gray-500 mt-1">No new notifications at the moment.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence initial={false}>
              {notifications.map((n) => (
                <motion.div
                  key={n.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className={`relative glass-card p-5 border-l-4 transition-all ${
                    !n.read_at ? 'border-primary bg-white' : 'border-gray-200 bg-gray-50/50 grayscale-[0.5] opacity-80'
                  }`}
                >
                  <div className="flex gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                      !n.read_at ? 'bg-primary/10' : 'bg-gray-200'
                    }`}>
                      {getIcon(n.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className={`font-bold truncate ${!n.read_at ? 'text-gray-900' : 'text-gray-600'}`}>
                          {n.title}
                        </h3>
                        <span className="text-[10px] text-gray-400 font-medium flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {format(new Date(n.created_at), 'dd MMM, HH:mm')}
                        </span>
                      </div>
                      <p className={`text-sm leading-relaxed mb-4 ${!n.read_at ? 'text-gray-600' : 'text-gray-500'}`}>
                        {n.message}
                      </p>
                      {!n.read_at && (
                        <button
                          onClick={() => markAsRead(n.id)}
                          className="flex items-center gap-1.5 text-tiny font-black text-primary uppercase tracking-widest hover:bg-primary/5 px-2 py-1 rounded transition-colors"
                        >
                          <Check className="w-3.2 h-3.2" />
                          Mark as Read
                        </button>
                      )}
                    </div>
                  </div>
                  {!n.read_at && (
                    <div className="absolute top-3 right-3 w-2 h-2 bg-primary rounded-full animate-pulse" />
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </main>
    </div>
  );
}
