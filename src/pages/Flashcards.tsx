import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { useDashboardStore } from '../stores/dashboardStore';
import { apiFetch } from '../lib/api';
import { ChevronLeft, BookOpen, Check, X } from 'lucide-react';

export default function Flashcards() {
  const navigate = useNavigate();
  const { token } = useAuthStore();
  const subjects = useDashboardStore((state) => state.subjects);
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [flashcards, setFlashcards] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [loading, setLoading] = useState(false);

  const loadFlashcards = async (subjectCode: string) => {
    setSelectedSubject(subjectCode);
    setLoading(true);
    try {
      const data = await apiFetch(`/questions/flashcards/${subjectCode}`);
      setFlashcards(data);
      setCurrentIndex(0);
      setFlipped(false);
    } catch (err) {
      console.error('Error loading flashcards:', err);
    } finally {
      setLoading(false);
    }
  };

  const currentCard = flashcards[currentIndex];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <button onClick={() => navigate('/dashboard')} className="text-gray-600 hover:text-gray-900">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-bold text-gray-900">Flashcards</h1>
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
            <div className="text-sm text-gray-500 mb-4">
              Card {currentIndex + 1} of {flashcards.length}
            </div>

            {/* Flashcard */}
            <div
              onClick={() => setFlipped(!flipped)}
              className="bg-white rounded-2xl shadow-lg p-8 min-h-64 cursor-pointer hover:shadow-xl transition-all mb-6"
            >
              <div className="text-center">
                <p className="text-sm text-gray-500 mb-4">{currentCard.topic}</p>
                <p className="text-xl font-semibold text-gray-900">
                  {flipped ? currentCard.back : currentCard.front}
                </p>
                <p className="text-sm text-gray-400 mt-4">Click to {flipped ? 'see question' : 'see answer'}</p>
              </div>
            </div>

            {/* Controls */}
            <div className="flex justify-between items-center">
              <button
                onClick={() => { setCurrentIndex(Math.max(0, currentIndex - 1)); setFlipped(false); }}
                disabled={currentIndex === 0}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg disabled:opacity-50"
              >
                Previous
              </button>

              <div className="flex gap-2">
                <button className="p-3 bg-red-100 text-red-600 rounded-full hover:bg-red-200">
                  <X className="w-5 h-5" />
                </button>
                <button className="p-3 bg-green-100 text-green-600 rounded-full hover:bg-green-200">
                  <Check className="w-5 h-5" />
                </button>
              </div>

              <button
                onClick={() => { setCurrentIndex(Math.min(flashcards.length - 1, currentIndex + 1)); setFlipped(false); }}
                disabled={currentIndex === flashcards.length - 1}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
