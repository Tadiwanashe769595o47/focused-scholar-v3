import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { apiFetch } from '../lib/api';
import { ChevronLeft, TrendingUp, TrendingDown } from 'lucide-react';
import { format } from 'date-fns';

export default function History() {
  const navigate = useNavigate();
  const { user, token } = useAuthStore();
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      if (!user || !token) return;

      try {
        const data = await apiFetch(`/history/${user.id}?limit=30`);
        setHistory(data);
      } catch (err) {
        console.error('Error fetching history:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [user, token]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="mt-4 text-gray-600">Loading history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative">
      <div className="glass-nav mx-4 mt-4 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <button onClick={() => navigate('/dashboard')} className="text-gray-600 hover:text-gray-900 p-2 rounded-lg hover:bg-gray-100/50 transition-all">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-bold text-gray-900">Study History</h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6">
        {history.length === 0 ? (
          <div className="text-center py-12">
            <div className="glass-card p-8">
              <p className="text-gray-500">No study history yet. Start completing subjects!</p>
              <button
                onClick={() => navigate('/dashboard')}
                className="mt-4 px-6 py-2 bg-gradient-to-r from-primary to-accent text-white rounded-lg shadow-lg shadow-primary/25 hover:shadow-xl transition-all"
              >
                Go to Dashboard
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {history.map((item: any) => {
              const percentage = item.score_percentage || 0;
              const prevPercentage = history[history.indexOf(item) + 1]?.score_percentage || 0;
              const trend = percentage > prevPercentage ? 'up' : percentage < prevPercentage ? 'down' : 'same';

              return (
                <div
                  key={item.id}
                  className="glass-card-border group"
                >
                  <div className="glass-card p-6 hover:shadow-lg transition-all">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {item.date ? format(new Date(item.date), 'EEEE, MMMM d, yyyy') : 'Unknown Date'}
                        </h3>
                        <p className="text-sm text-gray-500 mt-1">
                          {item.questions_correct || 0}/{item.total_questions || 0} correct
                        </p>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className={`text-2xl font-bold ${
                            percentage >= 80 ? 'text-green-600' :
                            percentage >= 50 ? 'text-yellow-600' :
                            'text-red-600'
                          }`}>
                            {percentage}%
                          </div>
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            {trend === 'up' && <TrendingUp className="w-3 h-3 text-green-500" />}
                            {trend === 'down' && <TrendingDown className="w-3 h-3 text-red-500" />}
                            {trend === 'up' ? 'Improved' : trend === 'down' ? 'Declined' : 'Same'}
                          </div>
                        </div>

                        <button
                          onClick={() => navigate(`/results/${item.date}`)}
                          className="px-4 py-2 bg-gradient-to-r from-primary to-accent text-white text-sm rounded-lg shadow-lg shadow-primary/25 hover:shadow-xl transition-all"
                        >
                          View Details
                        </button>
                      </div>

                      {item.time_spent_seconds && (
                        <p className="text-xs text-gray-500 mt-2">
                          Time spent: {Math.floor(item.time_spent_seconds / 60)}m {item.time_spent_seconds % 60}s
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}