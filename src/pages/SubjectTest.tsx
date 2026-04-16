import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { useDashboardStore } from '../stores/dashboardStore';
import { useOfflineStore } from '../stores/offlineStore';
import { apiFetch } from '../lib/api';
import { selectQuestionsOffline } from '../lib/offlineQuestionSelector';
import { markOfflineTest, calculatePoints, getTodayScoreSummary } from '../lib/offlineMarking';
import { 
  ChevronLeft, 
  ChevronRight, 
  Timer, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  BookOpen, 
  Sparkles, 
  Star,
  Zap,
  Layout,
  Info
} from 'lucide-react';
import Confetti from 'react-confetti';
import SubjectAIChat from '../components/SubjectAIChat';

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

const QUESTION_TIMERS: Record<string, number> = {
  multiple_choice_single: 60,
  multiple_choice_multiple: 90,
  open_text: 120,
  fill_blank: 60,
  matching: 90,
  ordering: 90,
  labeling_diagram: 120,
  table_completion: 180,
  numerical: 90,
  essay: 600,
  spelling: 30
};

export default function SubjectTest() {
  const { subjectCode } = useParams<{ subjectCode: string }>();
  const navigate = useNavigate();
  const { user, token } = useAuthStore();

  const [questions, setQuestions] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<any>(null);
  const [answers, setAnswers] = useState<Record<number, any>>({});
  const [timeLeft, setTimeLeft] = useState(60);
  const [showExplanation, setShowExplanation] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [testId, setTestId] = useState<number | null>(null);
  const [completed, setCompleted] = useState(false);
  const [score, setScore] = useState({ correct: 0, total: 0, marks: 0, maxMarks: 0 });
  const [simplifiedBullets, setSimplifiedBullets] = useState<string[] | null>(null);
  const [simplifying, setSimplifying] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [answeredCount, setAnsweredCount] = useState(0);

  const currentQuestion = questions[currentIndex];

  // Logic to parse explanation into steps and tips
  const explanationData = useMemo(() => {
    if (!currentQuestion) return { steps: [], tip: null };
    
    const raw = currentQuestion.explanation_json || currentQuestion.explanation;
    if (!raw) return { steps: [], tip: null };

    let steps: string[] = [];
    let tip: string | null = null;

    if (typeof raw === 'string') {
      // Split by common step markers
      const parts = raw.split(/(?:\d\.|Step|First|Second|Third|Next|Then|Finally|Tip:|Note:)/i).filter(s => s.trim().length > 5);
      
      // Look for a tip
      const tipLower = raw.toLowerCase();
      const tipIndex = tipLower.indexOf('tip:');
      const noteIndex = tipLower.indexOf('note:');
      const examIndex = tipLower.indexOf('exam tip:');
      
      const index = examIndex !== -1 ? examIndex : (tipIndex !== -1 ? tipIndex : (noteIndex !== -1 ? noteIndex : -1));
      
      if (index !== -1) {
        tip = raw.substring(index).replace(/exam tip:|tip:|note:/i, '').trim();
      }
      
      // Assume parts before tip are steps
      steps = parts.map(p => p.trim()).filter(p => !tip || !p.includes(tip));
      
      // If we still have no steps after filtering, just use the parts
      if (steps.length === 0) steps = parts.map(p => p.trim());
    } else {
      // Handle JSON structure
      steps = raw.steps || (raw.why_correct ? [raw.why_correct] : []);
      tip = raw.key_understanding || raw.exam_tip || null;
    }

    // Fallback tag if no tip
    if (!tip && steps.length > 0) {
      tip = "Read the question carefully and always show your working to gain method marks even if your final answer is wrong!";
    }

    return { steps: steps.slice(0, 5), tip }; // Limit to 5 steps for UI
  }, [currentQuestion]);

  const handleSimplify = async () => {
    const rawExplanation = currentQuestion?.explanation_json || currentQuestion?.explanation;
    if (!rawExplanation) return;
    setSimplifying(true);
    setSimplifiedBullets(null);
    try {
      const explanationText = typeof rawExplanation === 'string'
        ? rawExplanation
        : JSON.stringify(rawExplanation);
      const data = await apiFetch('/tutor/simplify-explanation', {
        method: 'POST',
        body: JSON.stringify({ explanation: explanationText })
      });
      setSimplifiedBullets(data.bullets || []);
    } catch {
      setSimplifiedBullets(['Could not simplify right now. Try the AI Tutor for help!']);
    } finally {
      setSimplifying(false);
    }
  };

  // Fetch test on mount
  useEffect(() => {
    const fetchTest = async () => {
      if (!user?.id || !subjectCode || !token) {
        setLoading(false);
        return;
      }

      const today = new Date().toISOString().split('T')[0];
      const cacheKey = `test_${user.id}_${subjectCode}_${today}`;
      
      // Try local cache first
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        try {
          const test = JSON.parse(cached);
          setTestId(test.id);
          if (test.questions_data && test.questions_data.length > 0) {
            setQuestions(test.questions_data);
            if (test.current_index && test.current_index < test.questions_data.length) {
              setCurrentIndex(test.current_index);
            }
            setTimeLeft(QUESTION_TIMERS[test.questions_data[test.current_index || 0]?.question_type] || 60);
          }
        } catch (e) {
          console.error("Cache parse error", e);
        }
      }

      // Try online API
      let onlineSuccess = false;
      try {
        const tests = await apiFetch(`/tests/${user.id}/${today}?subject=${subjectCode}`);
        if (tests.length > 0) {
          const test = tests[0];
          setTestId(test.id);
          localStorage.setItem(cacheKey, JSON.stringify(test));
          if (test.questions_data && test.questions_data.length > 0) {
            setQuestions(test.questions_data);
            if (test.current_index && test.current_index < test.questions_data.length) {
              setCurrentIndex(test.current_index);
            }
            setTimeLeft(QUESTION_TIMERS[test.questions_data[test.current_index || 0]?.question_type] || 60);
            onlineSuccess = true;
          }
        }
      } catch (err) {
        console.log('Online fetch failed, trying offline questions');
      }

      // Fallback to offline questions
      if (!onlineSuccess) {
        const offlineQuestions = selectQuestionsOffline(subjectCode, 20);
        if (offlineQuestions && offlineQuestions.length > 0) {
          console.log(`Loading ${offlineQuestions.length} offline questions for ${subjectCode}`);
          setQuestions(offlineQuestions);
          setTestId(-1); // Offline mode
          setTimeLeft(QUESTION_TIMERS[offlineQuestions[0]?.question_type] || 60);
        }
      }

      setLoading(false);
    };

    fetchTest();
  }, [subjectCode, user, token]);

  // Timer countdown
  useEffect(() => {
    if (timeLeft <= 0) {
      if (!showExplanation && !completed) {
        if (selectedAnswer !== null) {
          handleSubmitAnswer();
        } else {
          if (currentIndex >= questions.length - 1) {
            setCompleted(true);
          } else {
            setCurrentIndex(prev => prev + 1);
            setSelectedAnswer(null);
            setShowExplanation(false);
            setIsCorrect(null);
            setSimplifiedBullets(null);
          }
        }
      }
      return;
    }
    if (showExplanation || completed) return;

    const timer = setTimeout(() => {
      setTimeLeft(timeLeft - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [timeLeft, showExplanation, completed, selectedAnswer]);

  const handleSubmitAnswer = useCallback(async () => {
    if (!currentQuestion || submitting) return;
    if (selectedAnswer === null || selectedAnswer === undefined || selectedAnswer === '') return;

    const isOfflineMode = testId === -1;

    setSubmitting(true);
    setAnswers(prev => ({ ...prev, [currentIndex]: selectedAnswer }));
    setAnsweredCount(prev => prev + 1);

    // Handle offline mode
    if (isOfflineMode) {
      const isCorrect = selectedAnswer === currentQuestion.correct_answer;
      const marks = isCorrect ? (currentQuestion.marks || 1) : 0;
      
      // Save to offline store with marking
      useOfflineStore.getState().saveAnswer(
        currentQuestion.id, 
        selectedAnswer, 
        isCorrect, 
        marks
      );

      // Calculate points
      const pointsEarned = calculatePoints(marks, isCorrect ? 100 : 0);
      
      // Update score
      setScore(prev => ({
        ...prev,
        correct: prev.correct + (isCorrect ? 1 : 0),
        total: prev.total + 1,
        marks: prev.marks + marks,
        maxMarks: prev.maxMarks + (currentQuestion.marks || 1)
      }));

      setIsCorrect(isCorrect);
      setShowExplanation(true);
      setSubmitting(false);
      return;
    }

    // Online mode - existing code
    if (!testId || !token) return;

    try {
      const result = await apiFetch(`/tests/${testId}/answer`, {
        method: 'POST',
        body: JSON.stringify({
          question_id: currentQuestion.id,
          answer: selectedAnswer,
          time_spent: (QUESTION_TIMERS[currentQuestion.question_type] || 60) - timeLeft
        })
      });

      if (result && typeof result.new_total_points === 'number') {
        const authStore = useAuthStore.getState();
        if (authStore.user) {
           authStore.user.total_points = result.new_total_points;
        }
      }

      if (result && typeof result.is_correct === 'boolean') {
        setIsCorrect(result.is_correct);
        setShowExplanation(true);
      }

      setScore(prev => ({
        ...prev,
        correct: prev.correct + (result.is_correct ? 1 : 0),
        total: prev.total + 1,
        marks: prev.marks + (result.marks || 0),
        maxMarks: prev.maxMarks + (currentQuestion.marks || 1)
      }));

      setTimeout(() => {
        const dashboardStore = useDashboardStore.getState();
        if (dashboardStore.fetchDashboard) dashboardStore.fetchDashboard();
      }, 500);
    } catch (err) {
      console.error('Error submitting answer:', err);
    } finally {
      setSubmitting(false);
    }
  }, [currentQuestion, testId, token, timeLeft, selectedAnswer, currentIndex, submitting]);

  const nextQuestion = () => {
    if (currentIndex >= questions.length - 1) {
      setCompleted(true);
      return;
    }

    setCurrentIndex(currentIndex + 1);
    setSelectedAnswer(null);
    setShowExplanation(false);
    setIsCorrect(null);
    setSimplifiedBullets(null);
    setTimeLeft(QUESTION_TIMERS[questions[currentIndex + 1]?.question_type] || 60);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="mt-4 text-gray-600 font-medium animate-pulse">Initializing Portal Session...</p>
        </div>
      </div>
    );
  }

  if (!questions.length) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="glass-card p-10 text-center max-w-sm">
          <AlertCircle className="w-20 h-20 mx-auto text-gray-300 mb-6" />
          <h2 className="text-2xl font-bold text-gray-900">No Questions Today</h2>
          <p className="text-gray-500 mt-2 mb-8">Your dashboard will refresh with new content soon.</p>
          <button onClick={() => navigate('/dashboard')} className="btn-primary w-full">Back to Dashboard</button>
        </div>
      </div>
    );
  }

  if (completed) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-gray-50 overflow-hidden relative">
        <Confetti width={window.innerWidth} height={window.innerHeight} recycle={false} numberOfPieces={500} />
        <div className="glass-card p-10 max-w-md w-full text-center relative z-10 shadow-2xl animate-page-in">
          <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center shadow-lg shadow-green-200">
            <CheckCircle className="w-12 h-12 text-white" />
          </div>
          <h2 className="text-3xl font-extrabold text-gray-900 mb-2">Session Complete</h2>
          <p className="text-gray-600 font-medium mb-8">Excellent progress. Your points have been updated.</p>

          <div className="bg-white rounded-2xl p-8 mb-8 border-2 border-primary/10 shadow-inner">
            <div className="text-6xl font-black text-primary mb-2">
              {score.marks} <span className="text-2xl text-gray-400 font-bold">/ {score.maxMarks}</span>
            </div>
            <p className="text-gray-500 font-semibold uppercase tracking-widest text-[10px]">Total marks earned</p>
          </div>

          <button onClick={() => navigate('/dashboard')} className="btn-primary w-full py-4 text-lg">Finish Session</button>
        </div>
      </div>
    );
  }

  const renderQuestionOptions = () => {
    if (!currentQuestion) return null;
    const type = currentQuestion.question_type;

    if (type.startsWith('multiple_choice')) {
      const options = currentQuestion.options_json || [];
      return (
        <div className="grid gap-3 mt-6">
          {options.map((option: string, idx: number) => {
            const letter = option.charAt(0);
            const text = option.substring(3);
            const isSelected = selectedAnswer === letter;
            
            let statusClass = 'border-slate-100 hover:border-slate-300 hover:bg-slate-50';
            if (isSelected) statusClass = 'border-primary bg-primary/5 ring-1 ring-primary/20';
            if (showExplanation) {
              const isOptionCorrect = currentQuestion.correct_answer === letter;
              if (isOptionCorrect) statusClass = 'border-success bg-success/10 ring-2 ring-success/20';
              else if (isSelected) statusClass = 'border-error bg-error/10 ring-2 ring-error/20 opacity-90';
              else statusClass = 'border-slate-100 opacity-50';
            }

            return (
              <button
                key={idx}
                onClick={() => !showExplanation && setSelectedAnswer(letter)}
                className={`option-tile ${statusClass}`}
                disabled={showExplanation}
              >
                <div className={`option-tile-circle ${
                  isSelected ? 'bg-primary text-white border-primary' : 'bg-slate-50 text-slate-500 border-slate-200'
                }`}>
                  {letter}
                </div>
                <span className={`font-semibold text-sm ${isSelected ? 'text-slate-900' : 'text-slate-600'}`}>
                  {text}
                </span>
                {showExplanation && currentQuestion.correct_answer === letter && (
                  <CheckCircle className="absolute right-4 w-5 h-5 text-success" />
                )}
                {showExplanation && isSelected && currentQuestion.correct_answer !== letter && (
                  <XCircle className="absolute right-4 w-5 h-5 text-error" />
                )}
              </button>
            );
          })}
        </div>
      );
    }

    return (
      <div className="mt-8">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
          <Zap className="w-3 h-3" /> Input your answer below
        </p>
        <div className="relative group">
          <textarea
            value={selectedAnswer || ''}
            onChange={(e) => setSelectedAnswer(e.target.value)}
            disabled={showExplanation}
            placeholder="Type your response or numerical value..."
            className="w-full p-5 border-2 border-slate-100 rounded-2xl focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none min-h-[140px] text-base font-medium bg-slate-50/50"
          />
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#FDFDFE] pb-24">
      {/* Premium Portal Header */}
      <header className="bg-white border-b border-slate-100 sticky top-0 z-30 transition-all duration-300">
        <div className="max-w-[1400px] mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex flex-col">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="breadcrumb-tag">{SUBJECT_NAMES[subjectCode || ''] || subjectCode} ({subjectCode})</span>
              <ChevronRight className="w-3 h-3 text-slate-300" />
              <span className="breadcrumb-tag text-slate-500">Practice Session</span>
            </div>
            <h1 className="dashboard-title flex items-center gap-3">
              Question {currentIndex + 1}
              <span className={`difficulty-tag ${
                currentQuestion?.difficulty === 'Hard' ? 'difficulty-hard' : 
                currentQuestion?.difficulty === 'Medium' ? 'difficulty-medium' : 'difficulty-easy'
              }`}>
                {currentQuestion?.difficulty || 'Medium'}
              </span>
            </h1>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3 bg-slate-50 px-4 py-2.5 rounded-2xl border border-slate-100">
              <Timer className={`w-4 h-4 ${timeLeft < 15 ? 'text-red-500 animate-pulse' : 'text-slate-400'}`} />
              <span className={`font-mono text-lg font-bold ${timeLeft < 15 ? 'text-red-500' : 'text-slate-700'}`}>
                {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
              </span>
            </div>
            
            <div className="hidden md:flex flex-col items-end">
              <div className="w-32 h-1.5 bg-slate-100 rounded-full overflow-hidden mb-1.5">
                <div 
                  className="h-full bg-primary transition-all duration-1000" 
                  style={{ width: `${(currentIndex / questions.length) * 100}%` }} 
                />
              </div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Progress: {currentIndex + 1} / {questions.length}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Portal Content */}
      <main className="max-w-[1400px] mx-auto p-6 md:p-10">
        <div className="portal-grid">
          
          {/* Question Column */}
          <section className="space-y-6 animate-page-in">
            <div className="glass-card shadow-lg p-8 md:p-10 border-slate-100 min-h-[500px] flex flex-col bg-white">
              <div className="flex items-start justify-between gap-4 mb-6">
                 <div className="space-y-4 flex-1">
                    <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Question ID: FS-{currentQuestion?.id || '0000'}</p>
                    <h2 className="text-xl md:text-2xl font-bold text-slate-800 leading-snug">
                       {currentQuestion?.question_text}
                    </h2>
                 </div>
                 <SubjectAIChat questionText={currentQuestion?.question_text || ''} />
              </div>

              {currentQuestion?.diagram_url && (
                <div className="mb-8 p-4 bg-slate-50 rounded-2xl border border-slate-100 shadow-inner group cursor-zoom-in">
                  <img src={currentQuestion.diagram_url} alt="Question Diagram" className="max-w-full mx-auto rounded-xl group-hover:scale-[1.02] transition-transform duration-500" />
                </div>
              )}

              <div className="mb-auto">
                {renderQuestionOptions()}
              </div>

              {!showExplanation && (
                <div className="mt-10 flex justify-end">
                   <button 
                    onClick={handleSubmitAnswer}
                    disabled={selectedAnswer === null || submitting}
                    className="btn-primary px-10 py-4 text-base flex items-center gap-2 disabled:grayscale disabled:opacity-50"
                   >
                     {submitting ? 'Submitting...' : 'Submit Answer'}
                     <Layout className="w-5 h-5" />
                   </button>
                </div>
              )}
            </div>
          </section>

          {/* Explanation Column */}
          <section className="animate-page-in" style={{ animationDelay: '100ms' }}>
             {!showExplanation ? (
               <div className="h-full flex flex-col items-center justify-center p-12 text-center rounded-[2rem] border-4 border-dashed border-slate-100 bg-slate-50/30">
                  <div className="w-20 h-20 rounded-full bg-white shadow-sm flex items-center justify-center mb-6">
                    <BookOpen className="w-8 h-8 text-slate-300" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-800 mb-2">Detailed Breakdown Awaiting</h3>
                  <p className="text-sm text-slate-500 max-w-[260px] mx-auto leading-relaxed">Submit your solution to unlock the step-by-step masterclass and expert exam tips.</p>
               </div>
             ) : (
               <div className={`h-full flex flex-col p-8 md:p-10 rounded-[2rem] border-2 shadow-2xl transition-all duration-500 ${
                 isCorrect ? 'border-success/20 bg-green-50/30' : 'border-error/20 bg-red-50/30'
               }`}>
                  
                  {/* Status Banner */}
                  <div className={`flex items-center justify-between p-5 rounded-2xl mb-8 shadow-sm ${
                    isCorrect ? 'bg-success text-white' : 'bg-error text-white'
                  }`}>
                    <div className="flex items-center gap-4">
                      {isCorrect ? <CheckCircle className="w-8 h-8" /> : <XCircle className="w-8 h-8" />}
                      <div>
                        <h4 className="font-black text-lg">{isCorrect ? 'PERFECT SCORE! 🎉' : 'LEARNING MOMENT'}</h4>
                        <p className="text-[10px] opacity-90 font-bold uppercase tracking-widest">
                          {isCorrect ? `+${currentQuestion.marks || '1'} marks added` : 'Review the steps carefully below'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-8">
                     <div>
                        <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                          <Layout className="w-3 h-3" /> How to solve it (Step-by-Step)
                        </h5>
                        
                        <div className="space-y-2">
                           {explanationData.steps.map((step, idx) => (
                             <div key={idx} className="step-card">
                                <div className="step-number-circle">{idx + 1}</div>
                                <p className="text-slate-700 text-sm md:text-base leading-relaxed font-medium pt-0.5">
                                  {step}
                                </p>
                             </div>
                           ))}
                        </div>
                     </div>

                     {explanationData.tip && (
                       <div className="exam-tip-container">
                          <h6 className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-3 flex items-center gap-2">
                            <Star className="w-3 h-3 fill-current" /> Expert Exam Tip
                          </h6>
                          <p className="text-amber-900 text-sm italic leading-relaxed font-medium">
                            "{explanationData.tip}"
                          </p>
                       </div>
                     )}

                     {/* AI Feature */}
                     <div className="pt-4">
                        {!simplifiedBullets ? (
                          <button 
                            onClick={handleSimplify}
                            disabled={simplifying}
                            className="w-full py-4 rounded-2xl bg-white border-2 border-primary/10 text-primary font-black text-xs uppercase tracking-widest hover:bg-primary/5 transition-all flex items-center justify-center gap-3 shadow-sm"
                          >
                             <Sparkles className={`w-4 h-4 ${simplifying ? 'animate-spin' : ''}`} />
                             {simplifying ? 'Extracting Wisdom...' : 'Unlock Bite-sized Breakdown'}
                          </button>
                        ) : (
                          <div className="bg-white rounded-3xl p-8 border border-primary/20 shadow-xl animate-in zoom-in duration-300">
                             <div className="flex justify-between items-center mb-6">
                               <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] flex items-center gap-2">
                                 <Sparkles className="w-3.5 h-3.5" /> Core Takeaways
                               </p>
                               <button onClick={() => setSimplifiedBullets(null)} className="text-[10px] font-bold text-slate-400 hover:text-slate-600 uppercase tracking-widest">Hide</button>
                             </div>
                             <ul className="space-y-4">
                               {simplifiedBullets.map((bullet, idx) => (
                                 <li key={idx} className="flex gap-4 text-slate-700 text-sm font-bold leading-relaxed">
                                   <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                                   {bullet}
                                 </li>
                               ))}
                             </ul>
                          </div>
                        )}
                     </div>
                  </div>
               </div>
             )}
          </section>
        </div>
      </main>

      {/* Navigation Footer */}
      <footer className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-md border-t border-slate-100 z-30">
         <div className="max-w-[1400px] mx-auto px-6 py-4 flex items-center justify-between">
            <button 
              onClick={() => navigate('/dashboard')}
              className="text-slate-400 hover:text-slate-900 font-bold text-xs uppercase tracking-widest flex items-center gap-2 transition-colors"
            >
              <XCircle className="w-4 h-4" /> Exit Practice
            </button>

            <div className="flex items-center gap-4">
              {showExplanation && (
                <button 
                  className="hidden md:flex items-center gap-2 px-6 py-3 rounded-xl border-2 border-slate-100 text-slate-500 font-bold text-xs uppercase tracking-widest hover:bg-slate-50 transition-all"
                >
                  <Info className="w-4 h-4" /> View Mark Scheme
                </button>
              )}
              
              <button 
                onClick={showExplanation ? nextQuestion : () => {}}
                disabled={!showExplanation}
                className={`flex items-center gap-2 px-10 py-3 rounded-xl font-black text-xs uppercase tracking-[0.2em] transition-all ${
                  showExplanation 
                    ? 'bg-portal-blue text-white shadow-lg shadow-blue-200 hover:-translate-y-0.5' 
                    : 'bg-slate-100 text-slate-300 cursor-not-allowed'
                }`}
              >
                {currentIndex >= questions.length - 1 ? 'Finish Session' : 'Next Question'}
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
         </div>
      </footer>
    </div>
  );
}
