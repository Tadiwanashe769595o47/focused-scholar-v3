import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { apiFetch } from '../lib/api';
import { ChevronLeft, ChevronRight, Timer, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

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

const normalizeAnswer = (value: any) => {
  if (Array.isArray(value)) {
    return value.map((v) => String(v).trim().toLowerCase()).sort().join('|');
  }
  return String(value ?? '').trim().toLowerCase();
};

export default function HolidaySubjectTest() {
  const { subjectCode } = useParams<{ subjectCode: string }>();
  const navigate = useNavigate();
  const { token } = useAuthStore();

  const [questions, setQuestions] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [showExplanation, setShowExplanation] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [completed, setCompleted] = useState(false);
  const [score, setScore] = useState({ correct: 0, total: 0, marks: 0, maxMarks: 0 });

  useEffect(() => {
    const fetchHolidayQuestions = async () => {
      if (!token || !subjectCode) return;
      try {
        const data = await apiFetch(`/holiday/questions/${subjectCode}`);
        setQuestions(data || []);
        if (data?.length) {
          setTimeLeft(QUESTION_TIMERS[data[0]?.question_type] || 60);
        }
      } catch (err) {
        console.error('Error fetching holiday questions:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchHolidayQuestions();
  }, [subjectCode, token]);

  useEffect(() => {
    if (timeLeft <= 0 || showExplanation || completed) return;
    const timer = setTimeout(() => {
      setTimeLeft(timeLeft - 1);
    }, 1000);
    return () => clearTimeout(timer);
  }, [timeLeft, showExplanation, completed]);

  const currentQuestion = questions[currentIndex];

  const evaluateAnswer = (answer: any, question: any) => {
    const normalizedAnswer = normalizeAnswer(answer);
    const normalizedCorrect = normalizeAnswer(question?.correct_answer);
    return normalizedAnswer === normalizedCorrect;
  };

  const handleAnswer = useCallback((answer: any) => {
    if (!currentQuestion) return;
    const correct = evaluateAnswer(answer, currentQuestion);
    setIsCorrect(correct);
    setShowExplanation(true);
    setScore((prev) => ({
      correct: prev.correct + (correct ? 1 : 0),
      total: prev.total + 1,
      marks: prev.marks + (correct ? (currentQuestion.marks || 1) : 0),
      maxMarks: prev.maxMarks + (currentQuestion.marks || 1)
    }));
  }, [currentQuestion]);

  const nextQuestion = () => {
    if (currentIndex >= questions.length - 1) {
      setCompleted(true);
      return;
    }
    setCurrentIndex(currentIndex + 1);
    setShowExplanation(false);
    setIsCorrect(null);
    setTimeLeft(QUESTION_TIMERS[questions[currentIndex + 1]?.question_type] || 60);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="mt-4 text-gray-600">Loading holiday questions...</p>
        </div>
      </div>
    );
  }

  if (!questions.length) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h2 className="text-xl font-semibold text-gray-900">No Holiday Questions Yet</h2>
          <p className="text-gray-500 mt-2">Ask your teacher to upload the holiday set for this subject.</p>
          <button
            onClick={() => navigate('/holiday')}
            className="mt-4 px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark"
          >
            Back to Holiday Work
          </button>
        </div>
      </div>
    );
  }

  if (completed) {
    const percentage = score.maxMarks > 0 ? Math.round((score.marks / score.maxMarks) * 100) : 0;
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center animate-scale-in">
          <div className="w-20 h-20 mx-auto mb-6 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Holiday Set Complete!</h2>
          <p className="text-gray-500 mb-6">Great effort. Here is your score:</p>

          <div className="bg-gray-50 rounded-xl p-6 mb-6">
            <div className="text-5xl font-bold text-primary mb-2">{percentage}%</div>
            <p className="text-gray-600">{score.correct}/{score.total} correct</p>
            <p className="text-gray-600">{score.marks}/{score.maxMarks} marks</p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => navigate('/holiday')}
              className="flex-1 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark"
            >
              Holiday Work
            </button>
            <button
              onClick={() => navigate('/dashboard')}
              className="flex-1 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
            >
              Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  const renderQuestion = () => {
    if (!currentQuestion) return null;
    const questionType = currentQuestion.question_type;

    if (questionType === 'multiple_choice_single') {
      const options = currentQuestion.options_json || [];
      return (
        <div className="space-y-3">
          {options.map((option: string, idx: number) => (
            <button
              key={idx}
              onClick={() => handleAnswer(option.charAt(0))}
              disabled={showExplanation}
              className="w-full p-4 text-left border-2 rounded-lg hover:border-primary hover:bg-indigo-50 transition-all disabled:opacity-50"
            >
              <span className="font-semibold mr-2">{option.charAt(0)}.</span>
              {option.substring(3)}
            </button>
          ))}
        </div>
      );
    }

    if (questionType === 'open_text' || questionType === 'fill_blank' || questionType === 'numerical') {
      return (
        <div>
          <input
            type={questionType === 'numerical' ? 'number' : 'text'}
            placeholder="Type your answer..."
            className="w-full p-4 border-2 rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleAnswer((e.target as HTMLInputElement).value);
              }
            }}
            disabled={showExplanation}
          />
          <p className="text-sm text-gray-500 mt-2">Press Enter to submit</p>
        </div>
      );
    }

    return (
      <div className="p-4 bg-gray-100 rounded-lg">
        <p className="text-gray-600 text-center">Answer type: {questionType}</p>
        <input
          type="text"
          placeholder="Type your answer..."
          className="w-full p-4 border-2 rounded-lg mt-3 focus:border-primary"
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleAnswer((e.target as HTMLInputElement).value);
            }
          }}
          disabled={showExplanation}
        />
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b px-6 py-4">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <button onClick={() => navigate('/holiday')} className="text-gray-600 hover:text-gray-900">
            <ChevronLeft className="w-6 h-6" />
          </button>

          <div className="flex items-center gap-2">
            <Timer className={`w-5 h-5 ${timeLeft < 10 ? 'text-red-500' : 'text-gray-600'}`} />
            <span className={`font-mono text-xl font-bold ${timeLeft < 10 ? 'text-red-500' : 'text-gray-900'}`}>
              {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
            </span>
          </div>

          <div className="text-sm text-gray-600">
            Question {currentIndex + 1} of {questions.length}
          </div>
        </div>

        <div className="max-w-4xl mx-auto mt-3">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
            />
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-xl shadow-sm p-8 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            {currentQuestion?.question_text}
          </h2>

          {currentQuestion?.diagram_url && (
            <div className="mb-6">
              <img src={currentQuestion.diagram_url} alt="Question diagram" className="max-w-full rounded-lg" />
            </div>
          )}

          {renderQuestion()}

          {showExplanation && (
            <div className={`mt-6 p-4 rounded-lg ${isCorrect ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
              <div className="flex items-center gap-2 mb-2">
                {isCorrect ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-600" />
                )}
                <span className="font-semibold">{isCorrect ? 'Correct!' : 'Not quite'}</span>
              </div>

              {currentQuestion?.explanation_json && (
                <div className="text-sm space-y-2">
                  {typeof currentQuestion.explanation_json === 'string' ? (
                    <p>{currentQuestion.explanation_json}</p>
                  ) : (
                    <>
                      {currentQuestion.explanation_json.why_correct && (
                        <p><strong>Why correct:</strong> {currentQuestion.explanation_json.why_correct}</p>
                      )}
                      {currentQuestion.explanation_json.key_understanding && (
                        <p><strong>Key point:</strong> {currentQuestion.explanation_json.key_understanding}</p>
                      )}
                    </>
                  )}
                </div>
              )}

              <button
                onClick={nextQuestion}
                className="mt-4 px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark flex items-center gap-2"
              >
                {currentIndex >= questions.length - 1 ? 'Finish Set' : 'Next Question'}
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
