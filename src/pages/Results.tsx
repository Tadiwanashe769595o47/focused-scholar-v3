import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { apiFetch } from '../lib/api';
import { ChevronLeft, CheckCircle, XCircle, BookOpen, Trophy, Target, Clock } from 'lucide-react';

const SUBJECT_NAMES: Record<string, string> = {
  '0580': 'Mathematics',
  '0610': 'Biology',
  '0620': 'Chemistry',
  '0625': 'Physics',
  '0478': 'Computer Science',
  '0460': 'Geography',
  '0452': 'Accounting',
  '0455': 'Economics',
  '0500': 'English Language',
  '0510': 'English Literature'
};

export default function Results() {
  const { date } = useParams<{ date: string }>();
  const navigate = useNavigate();
  const { user, token } = useAuthStore();
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchResults = async () => {
      if (!user || !token || !date) return;

      try {
        const tests = await apiFetch(`/tests/${user.id}/${date}`);

        const testResults = await Promise.all(
          tests.map(async (test: any) => {
            return apiFetch(`/tests/${test.id}/results`);
          })
        );

        setResults(testResults);
      } catch (err) {
        console.error('Error fetching results:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [date, user, token]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="mt-4 text-gray-600">Loading results...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4 shadow-sm">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <button onClick={() => navigate('/dashboard')} className="text-gray-600 hover:text-gray-900 p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-500" />
            <h1 className="text-xl font-bold text-gray-900">Results</h1>
          </div>
          <span className="text-sm text-gray-500 ml-auto">{date}</span>
        </div>
      </div>

      {/* Results */}
      <div className="max-w-4xl mx-auto p-6">
        {results.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-20 h-20 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Target className="w-10 h-10 text-gray-300" />
            </div>
            <p className="text-gray-500 mb-4">No results found for this date.</p>
            <button
              onClick={() => navigate('/dashboard')}
              className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
            >
              Back to Dashboard
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {results.map((result: any, idx: number) => {
              const totalMarks = result.answers?.reduce((sum: number, a: any) => sum + (a.marks_awarded || 0), 0) || 0;
              const maxMarks = result.answers?.reduce((sum: number, a: any) => sum + (a.questions?.marks || 1), 0) || 1;
              const percentage = Math.round((totalMarks / maxMarks) * 100);
              const subjectName = SUBJECT_NAMES[result.test?.subject_code] || result.test?.subject_code || 'Subject';

              return (
                <div key={idx} className="bg-white rounded-2xl shadow-lg shadow-gray-200/50 overflow-hidden">
                  {/* Subject Header */}
                  <div className="bg-gradient-to-r from-primary to-accent px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                        <BookOpen className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h2 className="text-lg font-bold text-white">{subjectName}</h2>
                        <p className="text-white/80 text-xs">Subject Test</p>
                      </div>
                      <div className={`ml-auto px-4 py-1 rounded-full text-sm font-bold ${
                        percentage >= 80 ? 'bg-green-100 text-green-700' :
                        percentage >= 50 ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {percentage}%
                      </div>
                    </div>
                  </div>

                  {/* Score Cards */}
                  <div className="grid grid-cols-3 gap-4 p-6">
                    <div className="text-center p-4 bg-gray-50 rounded-xl">
                      <div className="w-10 h-10 mx-auto bg-blue-100 rounded-full flex items-center justify-center mb-2">
                        <Target className="w-5 h-5 text-blue-600" />
                      </div>
                      <p className="text-2xl font-bold text-gray-900">{result.answers?.length || 0}</p>
                      <p className="text-xs text-gray-500 uppercase tracking-wider">Questions</p>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-xl">
                      <div className="w-10 h-10 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-2">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      </div>
                      <p className="text-2xl font-bold text-green-600">{totalMarks}</p>
                      <p className="text-xs text-green-600 uppercase tracking-wider">Marks Earned</p>
                    </div>
                    <div className="text-center p-4 bg-purple-50 rounded-xl">
                      <div className="w-10 h-10 mx-auto bg-purple-100 rounded-full flex items-center justify-center mb-2">
                        <Trophy className="w-5 h-5 text-purple-600" />
                      </div>
                      <p className="text-2xl font-bold text-gray-900">{maxMarks}</p>
                      <p className="text-xs text-gray-500 uppercase tracking-wider">Max Marks</p>
                    </div>
                  </div>

                  {/* Answer Review */}
                  <div className="px-6 pb-6">
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">Question Review</h3>
                    <div className="space-y-2">
                      {result.answers?.map((answer: any, aIdx: number) => (
                        <div key={aIdx} className={`p-4 rounded-xl border-2 transition-all ${
                          answer.is_correct ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
                        }`}>
                          <div className="flex items-start gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                              answer.is_correct ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                            }`}>
                              {answer.is_correct ? (
                                <CheckCircle className="w-5 h-5" />
                              ) : (
                                <XCircle className="w-5 h-5" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs font-bold text-gray-400">Q{aIdx + 1}</span>
                                <span className="text-sm font-semibold text-gray-900 truncate">{answer.questions?.topic}</span>
                              </div>
                              {!answer.is_correct && (
                                <div className="mt-2 p-2 bg-white/50 rounded-lg">
                                  <p className="text-xs text-gray-500 mb-1">Your answer: <span className="text-red-600 font-medium">{answer.student_answer || '(no answer)'}</span></p>
                                  <p className="text-xs text-green-600 font-medium">Correct: {answer.questions?.model_answer || answer.questions?.correct_answer}</p>
                                </div>
                              )}
                            </div>
                            <div className="text-right shrink-0">
                              <span className={`text-sm font-bold ${answer.is_correct ? 'text-green-600' : 'text-red-600'}`}>
                                {answer.marks_awarded || 0}/{answer.questions?.marks || 1}
                              </span>
                              <p className="text-xs text-gray-400">marks</p>
                            </div>
                          </div>
                        </div>
                      ))}
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
