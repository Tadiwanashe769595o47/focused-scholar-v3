import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { apiFetch } from '../lib/api';
import { ChevronLeft, ChevronRight, Timer, CheckCircle, XCircle, AlertCircle, BookOpen, Sparkles } from 'lucide-react';
import Confetti from 'react-confetti';
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
      if (!user || !token) return;

      const today = new Date().toISOString().split('T')[0];
      const cacheKey = `test_${user.id}_${today}_${subjectCode}`;
      
      // Try local storage first
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        try {
          const test = JSON.parse(cached);
          setTestId(test.id);
          if (test.questions_data && test.questions_data.length > 0) {
            setQuestions(test.questions_data);
            setTimeLeft(QUESTION_TIMERS[test.questions_data[0]?.question_type] || 60);
          }
          setLoading(false);
          // Return early, background fetch can update cache for next time
          return;
        } catch (e) {
          console.error("Cache parse error", e);
        }
      }

      try {
        const tests = await apiFetch(`/tests/${user.id}/${today}?subject=${subjectCode}`);

        if (tests.length > 0) {
          const test = tests[0];
          setTestId(test.id);
          localStorage.setItem(cacheKey, JSON.stringify(test));

          if (test.questions_data && test.questions_data.length > 0) {
            setQuestions(test.questions_data);
            setTimeLeft(QUESTION_TIMERS[test.questions_data[0]?.question_type] || 60);
          }
        }
      } catch (err) {
        console.error('Error fetching test:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchTest();
  }, [subjectCode, user, token]);

  // Timer countdown
  useEffect(() => {
    if (timeLeft <= 0 || showExplanation || completed) return;

    const timer = setTimeout(() => {
      setTimeLeft(timeLeft - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [timeLeft, showExplanation, completed]);

  const currentQuestion = questions[currentIndex];

  const handleSubmitAnswer = useCallback(async () => {
    if (!currentQuestion || !testId || !token || selectedAnswer === null) return;

    setAnswers(prev => ({ ...prev, [currentIndex]: selectedAnswer }));

    // Submit answer to API
    try {
      const result = await apiFetch(`/tests/${testId}/answer`, {
        method: 'POST',
        body: JSON.stringify({
          question_id: currentQuestion.id,
          answer: selectedAnswer,
          time_spent: (QUESTION_TIMERS[currentQuestion.question_type] || 60) - timeLeft
        })
      });
      setIsCorrect(result.is_correct);
      setShowExplanation(true);

      setScore(prev => ({
        ...prev,
        correct: prev.correct + (result.is_correct ? 1 : 0),
        total: prev.total + 1,
        marks: prev.marks + result.marks,
        maxMarks: prev.maxMarks + (currentQuestion.marks || 1)
      }));
    } catch (err) {
      console.error('Error submitting answer:', err);
    }
  }, [currentQuestion, testId, token, timeLeft, selectedAnswer, currentIndex]);

  const nextQuestion = () => {
    if (currentIndex >= questions.length - 1) {
      setCompleted(true);
      return;
    }

    setCurrentIndex(currentIndex + 1);
    setSelectedAnswer(null); // Reset for next question
    setShowExplanation(false);
    setIsCorrect(null);
    setSimplifiedBullets(null);
    setTimeLeft(QUESTION_TIMERS[questions[currentIndex + 1]?.question_type] || 60);
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="mt-4 text-gray-600 font-medium animate-pulse">Preparing your session...</p>
        </div>
      </div>
    );
  }

  // No questions
  if (!questions.length) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="glass-card p-10 text-center max-w-sm">
          <AlertCircle className="w-20 h-20 mx-auto text-gray-300 mb-6" />
          <h2 className="text-2xl font-bold text-gray-900">No Questions Found</h2>
          <p className="text-gray-500 mt-2 mb-8">We couldn't find any questions for this subject today. Try a different subject!</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="w-full px-6 py-3 bg-gradient-to-r from-primary to-accent text-white rounded-xl shadow-lg shadow-primary/25 hover:shadow-xl transition-all font-semibold"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Completed state
  if (completed) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-gray-50 overflow-hidden relative">
        <Confetti width={window.innerWidth} height={window.innerHeight} recycle={false} numberOfPieces={500} />
        <div className="glass-card p-10 max-w-md w-full text-center relative z-10 shadow-2xl scale-100 animate-in fade-in zoom-in duration-500">
          <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center shadow-lg shadow-green-200">
            <CheckCircle className="w-12 h-12 text-white" />
          </div>
          <h2 className="text-3xl font-extrabold text-gray-900 mb-2">Test Complete!</h2>
          <p className="text-gray-600 font-medium mb-8">Awesome job! Here is your final score:</p>

          <div className="bg-white rounded-2xl p-8 mb-8 border-2 border-primary/10 shadow-inner">
            <div className="text-6xl font-black text-primary mb-2">
              {score.marks} <span className="text-2xl text-gray-400 font-bold">/ {score.maxMarks}</span>
            </div>
            <p className="text-gray-500 font-semibold uppercase tracking-widest text-sm">Total Marks</p>
          </div>

          <div className="flex flex-col gap-3">
            <button
              onClick={() => navigate('/dashboard')}
              className="w-full py-4 bg-gradient-to-r from-primary to-accent text-white rounded-xl shadow-xl shadow-primary/30 hover:shadow-2xl hover:-translate-y-1 transition-all font-bold text-lg"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Render question based on type
  const renderQuestion = () => {
    if (!currentQuestion) return null;

    const questionType = currentQuestion.question_type;

    // Multiple Choice Single
    if (questionType === 'multiple_choice_single') {
      const options = currentQuestion.options_json || [];
      return (
        <div className="space-y-4">
          <p className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-2">Select the best answer:</p>
          <div className="grid gap-3">
            {options.map((option: string, idx: number) => {
              const letter = option.charAt(0);
              const isSelected = selectedAnswer === letter;
              return (
                <button
                  key={idx}
                  onClick={() => setSelectedAnswer(letter)}
                  disabled={showExplanation}
                  className={`w-full p-5 text-left border-2 rounded-xl transition-all duration-200 flex items-center gap-4 ${
                    isSelected 
                      ? 'border-primary bg-primary/5 shadow-md shadow-primary/10' 
                      : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50'
                  } disabled:opacity-80`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm ${
                    isSelected ? 'bg-primary text-white' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {letter}
                  </div>
                  <span className={`font-medium ${isSelected ? 'text-gray-900' : 'text-gray-600'}`}>
                    {option.substring(3)}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      );
    }

    // Open Text / Fill Blank
    if (questionType === 'open_text' || questionType === 'fill_blank') {
      return (
        <div className="space-y-4">
          <p className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-2">Type your answer below:</p>
          <div className="flex gap-3">
            <input
              type="text"
              value={selectedAnswer || ''}
              onChange={(e) => setSelectedAnswer(e.target.value)}
              placeholder="Your answer..."
              className="flex-1 p-5 border-2 border-gray-100 rounded-xl focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none text-lg font-medium"
              disabled={showExplanation}
            />
            {!showExplanation && (
              <button
                onClick={handleSubmitAnswer}
                disabled={!selectedAnswer}
                className={`px-8 rounded-xl font-bold transition-all ${
                  selectedAnswer 
                    ? 'bg-primary text-white shadow-lg shadow-primary/25 hover:-translate-y-1' 
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed opacity-50'
                }`}
              >
                Submit
              </button>
            )}
          </div>
        </div>
      );
    }

    // Numerical
    if (questionType === 'numerical') {
      return (
        <div className="space-y-4">
          <p className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-2">Enter the numerical value:</p>
          <div className="flex gap-3">
            <input
              type="number"
              value={selectedAnswer || ''}
              onChange={(e) => setSelectedAnswer(e.target.value)}
              placeholder="0.00"
              className="flex-1 p-5 border-2 border-gray-100 rounded-xl focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none text-lg font-medium"
              disabled={showExplanation}
            />
            {!showExplanation && (
              <button
                onClick={handleSubmitAnswer}
                disabled={!selectedAnswer}
                className={`px-8 rounded-xl font-bold transition-all ${
                  selectedAnswer 
                    ? 'bg-primary text-white shadow-lg shadow-primary/25 hover:-translate-y-1' 
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed opacity-50'
                }`}
              >
                Submit
              </button>
            )}
          </div>
        </div>
      );
    }

    // Default for other types
    return (
      <div className="space-y-4">
        <p className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-2">Provide your response:</p>
        <textarea
          value={selectedAnswer || ''}
          onChange={(e) => setSelectedAnswer(e.target.value)}
          placeholder="Type here..."
          className="w-full p-5 border-2 border-gray-100 rounded-xl focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none min-h-[120px] text-lg font-medium mb-3"
          disabled={showExplanation}
        />
        {!showExplanation && (
          <div className="flex justify-end">
            <button
              onClick={handleSubmitAnswer}
              disabled={!selectedAnswer}
              className={`px-8 py-4 rounded-xl font-bold transition-all ${
                selectedAnswer 
                  ? 'bg-primary text-white shadow-lg shadow-primary/25 hover:-translate-y-1' 
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed opacity-50'
              }`}
            >
              Submit Answer
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4">
        <div className="max-w-4xl mx-auto">
          {/* Subject Title */}
          <div className="flex flex-col items-center justify-center mb-6 py-4">
            <div className="flex items-center gap-3">
              <BookOpen className="w-8 h-8 text-primary" />
              <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
                {SUBJECT_NAMES[subjectCode || ''] || subjectCode}
              </h1>
            </div>
            <div className="mt-2 text-primary font-semibold tracking-widest uppercase text-sm border-b-2 border-primary/20 pb-1">
              Question {currentIndex + 1} of {questions.length}
            </div>
          </div>
          
          <div className="flex justify-between items-center">
            {!showExplanation && (
              <button
                onClick={() => navigate('/dashboard')}
                className="p-2 -ml-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-all"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
            )}
            {showExplanation && (
              <div className="w-10 h-10" /> // Spacer to preserve layout
            )}

            <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-2xl shadow-sm border border-gray-100">
              <Timer className={`w-5 h-5 ${timeLeft < 10 ? 'text-red-500 animate-pulse' : 'text-gray-400'}`} />
              <span className={`font-mono text-xl font-bold tracking-tight ${timeLeft < 10 ? 'text-red-500' : 'text-gray-800'}`}>
                {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
              </span>
            </div>

            <div className="w-10"></div> {/* Spacer for centering */}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="max-w-4xl mx-auto mt-3">
          <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-primary h-full rounded-full transition-all duration-500 ease-out"
              style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Question Content */}
      <div className="max-w-4xl mx-auto p-6 pb-32">
        <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 p-8 md:p-12 mb-6 border border-gray-100">
          {/* Question Text */}
          <div className="mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 leading-tight">
              {currentQuestion?.question_text}
            </h2>
          </div>

          {currentQuestion?.diagram_url && (
            <div className="mb-10 p-2 bg-gray-50 rounded-2xl border-2 border-gray-100 overflow-hidden group">
              <img 
                src={currentQuestion.diagram_url} 
                alt="Question diagram" 
                className="max-w-full mx-auto rounded-xl group-hover:scale-[1.02] transition-transform duration-500" 
              />
            </div>
          )}

          {/* Answer Options */}
          <div className="mb-10">
            {renderQuestion()}
          </div>

          {/* Submit Button (Only shows before answering for M/C or fallback) */}
          {!showExplanation && currentQuestion?.question_type?.startsWith('multiple_choice') && (
            <div className="flex justify-end">
              <button
                onClick={handleSubmitAnswer}
                disabled={selectedAnswer === null}
                className={`group px-8 py-4 rounded-2xl font-bold text-lg flex items-center gap-3 transition-all duration-300 ${
                  selectedAnswer !== null
                    ? 'bg-primary text-white shadow-xl shadow-primary/30 hover:shadow-2xl hover:shadow-primary/40 hover:-translate-y-1'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed opacity-50'
                }`}
              >
                Submit Answer
                <CheckCircle className={`w-6 h-6 ${selectedAnswer !== null ? 'animate-bounce' : ''}`} />
              </button>
            </div>
          )}

          {/* Feedback & Explanation */}
          {showExplanation && (
            <div className={`mt-10 rounded-2xl animate-in fade-in slide-in-from-bottom-4 duration-500 overflow-hidden border-2 ${
              isCorrect ? 'border-green-200' : 'border-red-200'
            }`}>

              {/* Top bar: result + NEXT BUTTON */}
              <div className={`flex items-center justify-between gap-4 p-5 ${
                isCorrect ? 'bg-green-500' : 'bg-red-500'
              }`}>
                <div className="flex items-center gap-3">
                  {isCorrect ? (
                    <CheckCircle className="w-7 h-7 text-white" />
                  ) : (
                    <XCircle className="w-7 h-7 text-white" />
                  )}
                  <div>
                    <h3 className="text-xl font-bold text-white">
                      {isCorrect ? 'Correct! 🎉' : 'Not quite!'}
                    </h3>
                    <p className="text-sm text-white/80">
                      {isCorrect ? 'Great job on this one!' : "Don't worry — let's learn from it."}
                    </p>
                  </div>
                </div>
                <button
                  onClick={nextQuestion}
                  className="shrink-0 px-6 py-3 rounded-xl font-bold text-base flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white border border-white/40 transition-all duration-200"
                >
                  {currentIndex >= questions.length - 1 ? 'Finish' : 'Next'}
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>

              {/* Explanation body */}
              <div className={`p-6 md:p-8 ${ isCorrect ? 'bg-green-50' : 'bg-red-50' }`}>
                {(currentQuestion?.explanation_json || currentQuestion?.explanation) && (
                  <div className="space-y-4 mb-6">
                    {typeof (currentQuestion.explanation_json || currentQuestion.explanation) === 'string' ? (
                      <div className="bg-white/70 p-4 rounded-xl">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Explanation</p>
                        {(currentQuestion.explanation_json || currentQuestion.explanation).split(/(?:\d\.|Step|First|Second|Third|Next|Then|Finally)/i).filter(Boolean).map((part: string, idx: number) => (
                          part.trim() && (
                            <div key={idx} className="flex gap-3 mb-2 animate-in fade-in slide-in-from-left-2" style={{ animationDelay: `${idx * 100}ms` }}>
                              <div className="w-6 h-6 rounded-full bg-primary/20 text-primary text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                                {idx + 1}
                              </div>
                              <p className="text-gray-700 text-sm leading-relaxed">{part.trim()}</p>
                            </div>
                          )
                        ))}
                      </div>
                    ) : (
                      <div className="grid md:grid-cols-2 gap-4">
                        {(currentQuestion.explanation_json || currentQuestion.explanation).why_correct && (
                          <div className="bg-white/70 p-4 rounded-xl">
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Why it&apos;s correct</p>
                            <p className="text-gray-700 text-sm">{(currentQuestion.explanation_json || currentQuestion.explanation).why_correct}</p>
                          </div>
                        )}
                        {(currentQuestion.explanation_json || currentQuestion.explanation).key_understanding && (
                          <div className="bg-white/70 p-4 rounded-xl">
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Key Concept</p>
                            <p className="text-gray-700 text-sm">{(currentQuestion.explanation_json || currentQuestion.explanation).key_understanding}</p>
                          </div>
                        )}
                        {(currentQuestion.explanation_json || currentQuestion.explanation).steps && Array.isArray((currentQuestion.explanation_json || currentQuestion.explanation).steps) && (
                          <div className="md:col-span-2 bg-white/70 p-4 rounded-xl">
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Steps to solve</p>
                            <div className="space-y-2">
                              {(currentQuestion.explanation_json || currentQuestion.explanation).steps.map((step: string, sIdx: number) => (
                                <div key={sIdx} className="flex gap-3">
                                  <div className="w-6 h-6 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center shrink-0">{sIdx + 1}</div>
                                  <p className="text-gray-700 text-sm">{step}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* AI Bite-sized Breakdown */}
                {currentQuestion?.explanation_json && (
                  <div>
                    {!simplifiedBullets && (
                      <button
                        onClick={handleSimplify}
                        disabled={simplifying}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white border border-primary/30 text-primary font-semibold text-sm hover:bg-primary/5 transition-all duration-200 disabled:opacity-60"
                      >
                        <Sparkles className={`w-4 h-4 ${simplifying ? 'animate-spin' : ''}`} />
                        {simplifying ? 'Simplifying...' : '✨ Bite-sized Breakdown'}
                      </button>
                    )}

                    {simplifiedBullets && (
                      <div className="mt-4 bg-white rounded-2xl p-5 border border-primary/20 shadow-sm">
                        <p className="text-xs font-bold text-primary uppercase tracking-widest mb-3 flex items-center gap-2">
                          <Sparkles className="w-3.5 h-3.5" /> Simple Version
                        </p>
                        <ul className="space-y-2">
                          {simplifiedBullets.map((bullet, idx) => (
                            <li key={idx} className="text-gray-800 text-sm font-medium leading-relaxed">{bullet}</li>
                          ))}
                        </ul>
                        <button
                          onClick={() => setSimplifiedBullets(null)}
                          className="mt-3 text-xs text-gray-400 hover:text-gray-600"
                        >
                          Hide
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
