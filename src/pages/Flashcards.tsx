import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { useDashboardStore } from '../stores/dashboardStore';
import { apiFetch } from '../lib/api';
import { ChevronLeft, BookOpen, Check, X, RotateCcw, Shuffle, Sparkles, ThumbsUp, ThumbsDown } from 'lucide-react';
import { flashcardsData } from '../data/flashcardsContent';

export default function Flashcards() {
  const navigate = useNavigate();
  const { token, user } = useAuthStore();
  const subjects = useDashboardStore((state) => state.subjects);
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [flashcards, setFlashcards] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [loading, setLoading] = useState(false);
  const [shuffled, setShuffled] = useState(false);
  const [knownCards, setKnownCards] = useState<Set<number>>(new Set());
  const [learningCards, setLearningCards] = useState<Set<number>>(new Set());

  const loadFlashcards = (subjectCode: string) => {
    setSelectedSubject(subjectCode);
    setLoading(true);
    setShuffled(false);
    setKnownCards(new Set());
    setLearningCards(new Set());
    try {
      const data = flashcardsData.filter(f => f.subject_code === subjectCode);
      setFlashcards(data);
      setCurrentIndex(0);
      setFlipped(false);
    } catch (err) {
      console.error('Error loading flashcards:', err);
    } finally {
      setLoading(false);
    }
  };

  const shuffleCards = () => {
    const shuffled = [...flashcardsData.filter(f => f.subject_code === selectedSubject)];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    setFlashcards(shuffled);
    setCurrentIndex(0);
    setFlipped(false);
    setShuffled(true);
  };

  const handleKnown = () => {
    setKnownCards(prev => new Set([...prev, currentIndex]));
    if (currentIndex < flashcards.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setFlipped(false);
    }
  };

  const handleLearning = () => {
    setLearningCards(prev => new Set([...prev, currentIndex]));
    if (currentIndex < flashcards.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setFlipped(false);
    }
  };

  const restartCards = () => {
    setCurrentIndex(0);
    setFlipped(false);
    setKnownCards(new Set());
    setLearningCards(new Set());
  };

  const currentCard = flashcards[currentIndex];
  const progress = flashcards.length > 0 ? Math.round(((knownCards.size + learningCards.size) / flashcards.length) * 100) : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <button onClick={() => navigate('/dashboard')} className="text-gray-600 hover:text-gray-900">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-bold text-gray-900">Flashcards</h1>
          {selectedSubject && (
            <button onClick={() => setSelectedSubject(null)} className="ml-auto text-sm text-primary hover:underline">
              Change Subject
            </button>
          )}
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6">
        {!selectedSubject ? (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Choose a Subject</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {subjects.map(subject => (
                <button
                  key={subject.code}
                  onClick={() => loadFlashcards(subject.code)}
                  className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-all card-hover text-left"
                  style={{ borderTop: `4px solid ${subject.color}` }}
                >
                  <BookOpen className="w-8 h-8 mb-3" style={{ color: subject.color }} />
                  <p className="font-semibold text-gray-900">{subject.name}</p>
                  <p className="text-sm text-gray-500">{subject.code}</p>
                </button>
              ))}
            </div>
          </div>
        ) : loading ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto border-4 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="mt-4 text-gray-600">Loading flashcards...</p>
          </div>
        ) : flashcards.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500">No flashcards available for this subject.</p>
            <button onClick={() => setSelectedSubject(null)} className="mt-4 px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark">
              Choose Another Subject
            </button>
          </div>
        ) : currentCard ? (
          <div>
            {/* Progress Bar */}
            <div className="mb-6">
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>Progress: {knownCards.size + learningCards.size} / {flashcards.length}</span>
                <span className="flex gap-4">
                  <span className="flex items-center gap-1"><ThumbsUp className="w-4 h-4 text-green-500" /> {knownCards.size}</span>
                  <span className="flex items-center gap-1"><ThumbsDown className="w-4 h-4 text-red-500" /> {learningCards.size}</span>
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-green-400 to-primary h-2 rounded-full transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            {/* Card Counter */}
            <div className="text-sm text-gray-500 mb-4">
              Card {currentIndex + 1} of {flashcards.length}
            </div>

            {/* Flashcard with 3D Flip */}
            <div className="relative w-full h-80 perspective-1000 mb-6">
              <div
                onClick={() => setFlipped(!flipped)}
                className={`w-full h-full relative preserve-3d transition-transform duration-500 cursor-pointer ${flipped ? 'rotate-y-180' : ''}`}
                style={{
                  transformStyle: 'preserve-3d',
                  transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
                }}
              >
                {/* Front */}
                <div 
                  className="absolute inset-0 bg-white rounded-2xl shadow-lg p-8 flex flex-col items-center justify-center backface-hidden"
                  style={{ backfaceVisibility: 'hidden' }}
                >
                  <div className="text-sm text-gray-500 mb-4">{currentCard.topic}</div>
                  <p className="text-xl font-semibold text-gray-900 text-center">{currentCard.front}</p>
                  <p className="text-sm text-gray-400 mt-6">Click to reveal answer</p>
                </div>

                {/* Back */}
                <div 
                  className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5 rounded-2xl shadow-lg p-8 flex flex-col items-center justify-center backface-hidden"
                  style={{ 
                    backfaceVisibility: 'hidden',
                    transform: 'rotateY(180deg)'
                  }}
                >
                  <div className="text-sm text-primary font-semibold mb-4">Answer</div>
                  <p className="text-xl font-semibold text-gray-900 text-center">{currentCard.back}</p>
                  <p className="text-sm text-gray-400 mt-6">Click to see question</p>
                </div>
              </div>
            </div>

            {/* Controls */}
            <div className="flex justify-between items-center">
              <button
                onClick={() => { setCurrentIndex(Math.max(0, currentIndex - 1)); setFlipped(false); }}
                disabled={currentIndex === 0}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg disabled:opacity-50 hover:bg-gray-300"
              >
                Previous
              </button>

              {/* Know / Learning Buttons */}
              <div className="flex gap-3">
                <button 
                  onClick={handleLearning}
                  className="flex items-center gap-2 px-4 py-3 bg-red-100 text-red-600 rounded-xl hover:bg-red-200 transition-all"
                >
                  <X className="w-5 h-5" />
                  <span className="font-medium">Still Learning</span>
                </button>
                <button 
                  onClick={handleKnown}
                  className="flex items-center gap-2 px-4 py-3 bg-green-100 text-green-600 rounded-xl hover:bg-green-200 transition-all"
                >
                  <Check className="w-5 h-5" />
                  <span className="font-medium">Got It!</span>
                </button>
              </div>

              <button
                onClick={() => { setCurrentIndex(Math.min(flashcards.length - 1, currentIndex + 1)); setFlipped(false); }}
                disabled={currentIndex === flashcards.length - 1}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg disabled:opacity-50 hover:bg-gray-300"
              >
                Next
              </button>
            </div>

            {/* Bottom Actions */}
            <div className="flex justify-center gap-4 mt-6">
              <button 
                onClick={restartCards}
                className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900"
              >
                <RotateCcw className="w-4 h-4" />
                Restart
              </button>
              <button 
                onClick={shuffleCards}
                className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900"
              >
                <Shuffle className="w-4 h-4" />
                Shuffle
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}