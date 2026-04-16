import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { useDashboardStore } from '../stores/dashboardStore';
import { apiFetch } from '../lib/api';
import { ChevronLeft, BookOpen, Search, Filter, Book, Bookmark, Lightbulb, Calculator, Atom, Globe, TrendingUp, DollarSign, Sparkles, Zap, Leaf, FlaskConical } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { studyContentData, StudyNote } from '../data/studyContent';

export default function Study() {
  const navigate = useNavigate();
  const subjects = useDashboardStore((state) => state.subjects);
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [notes, setNotes] = useState<StudyNote[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredNotes, setFilteredNotes] = useState<StudyNote[]>([]);

  const loadNotes = (subjectCode: string) => {
    setSelectedSubject(subjectCode);
    setLoading(true);
    try {
      const data = studyContentData.filter(n => n.subject_code === subjectCode);
      setNotes(data);
      setFilteredNotes(data);
    } catch (err) {
      console.error('Error loading study notes:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredNotes(notes);
      return;
    }
    const q = searchQuery.toLowerCase();
    setFilteredNotes(notes.filter(n => 
      n.topic.toLowerCase().includes(q) || 
      n.subtopic?.toLowerCase().includes(q) || 
      n.content.toLowerCase().includes(q)
    ));
  }, [searchQuery, notes]);

  const getSubjectIcon = (subjectCode: string) => {
    switch(subjectCode) {
      case '0580': return <Calculator className="w-6 h-6" />;
      case '0610': return <Leaf className="w-6 h-6" />;
      case '0620': return <FlaskConical className="w-6 h-6" />;
      case '0625': return <Zap className="w-6 h-6" />;
      case '0452': return <DollarSign className="w-6 h-6" />;
      case '0455': return <TrendingUp className="w-6 h-6" />;
      case '0460': return <Globe className="w-6 h-6" />;
      case '0450': return <Lightbulb className="w-6 h-6" />;
      case '0500': return <Book className="w-6 h-6" />;
      default: return <BookOpen className="w-6 h-6" />;
    }
  };

  const subjectData = subjects.find(s => s.code === selectedSubject);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => selectedSubject ? setSelectedSubject(null) : navigate('/dashboard')} 
              className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-all cursor-pointer"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Study Notes</h1>
              <p className="text-xs text-gray-500">
                {selectedSubject ? `Mastering ${subjectData?.name}` : 'Revision guides and topic summaries'}
              </p>
            </div>
          </div>

          {selectedSubject && (
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search topics..."
                className="pl-10 pr-4 py-2 bg-gray-100 border-none rounded-full text-sm focus:ring-2 focus:ring-primary w-64"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            </div>
          )}
        </div>
      </div>

      <main className="flex-1 max-w-5xl mx-auto w-full p-6">
        {!selectedSubject ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {subjects.map((sub, idx) => (
              <motion.button
                key={sub.code}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                onClick={() => loadNotes(sub.code)}
                className="glass-card p-6 text-left group cursor-pointer"
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg" style={{ backgroundColor: sub.color }}>
                    <Book className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">{sub.name}</h3>
                    <p className="text-xs text-gray-400">{sub.code}</p>
                  </div>
                </div>
                <p className="text-sm text-gray-500 line-clamp-2 mb-4 leading-relaxed">
                  Deep dive into core syllabus notes and key terminology for this subject.
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-tiny font-bold text-primary uppercase tracking-widest">Explore Notes</span>
                  <Bookmark className="w-4 h-4 text-gray-200 group-hover:text-primary transition-colors" />
                </div>
              </motion.button>
            ))}
          </div>
        ) : loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-gray-500 animate-pulse">Organising syllabus content...</p>
          </div>
        ) : filteredNotes.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
            <BookOpen className="w-16 h-16 mx-auto text-gray-200 mb-4" />
            <h3 className="text-lg font-bold text-gray-900">No notes found</h3>
            <p className="text-gray-500 mt-1">We haven't uploaded notes for this subject yet. Check back soon!</p>
            <button onClick={() => setSelectedSubject(null)} className="mt-6 px-6 py-2 bg-primary text-white rounded-full font-bold">
              Choose Another Subject
            </button>
          </div>
        ) : (
          <div className="space-y-8 pb-20">
            {/* Group by topic */}
            {Array.from(new Set(filteredNotes.map(n => n.topic))).map(topic => (
              <div key={topic} className="space-y-4">
                <motion.h2 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="text-lg font-black text-gray-900 flex items-center gap-3 border-b-2 border-gray-100 pb-2"
                >
                  <span className="text-2xl">{getSubjectIcon(selectedSubject || '')}</span>
                  <span className="bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">{topic}</span>
                </motion.h2>
                <div className="grid gap-6">
                  {filteredNotes.filter(n => n.topic === topic).map((note, idx) => (
                    <motion.div 
                      key={note.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-lg transition-all group relative overflow-hidden"
                    >
                      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-purple-400 to-pink-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                      {note.subtopic && (
                        <div className="flex items-center gap-2 mb-3">
                          <Sparkles className="w-4 h-4 text-yellow-500" />
                          <span className="inline-block px-3 py-1 rounded-full bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 text-tiny font-bold uppercase tracking-tighter">
                            {note.subtopic}
                          </span>
                        </div>
                      )}
                      <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed text-base space-y-3">
                        {note.content.split('\n').map((para, i) => {
                          const trimmed = para.trim();
                          if (!trimmed) return null;
                          if (trimmed.startsWith('###')) {
                            return <h4 key={i} className="font-bold text-purple-700 mt-4">{trimmed.replace('### ', '')}</h4>;
                          }
                          if (trimmed.startsWith('**') && trimmed.endsWith('**')) {
                            return <p key={i} className="font-bold text-purple-800">{trimmed.replace(/\*\*/g, '')}</p>;
                          }
                          if (trimmed.startsWith('>')) {
                            return <p key={i} className="bg-yellow-50 p-3 rounded-lg border-l-4 border-yellow-400 italic text-gray-600">{trimmed.replace('> ', '')}</p>;
                          }
                          if (trimmed.startsWith('|')) return null;
                          return <p key={i} className="text-gray-700">{trimmed}</p>;
                        })}
                      </div>
                      
                      {note.key_terms && note.key_terms.length > 0 && (
                        <div className="mt-6 pt-4 border-t border-gray-50">
                          <p className="text-tiny font-bold text-purple-600 uppercase tracking-widest mb-3 flex items-center gap-2">
                            <Sparkles className="w-3 h-3" /> Key Terms
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {note.key_terms.map((term, i) => (
                              <motion.span 
                                key={i}
                                whileHover={{ scale: 1.05 }}
                                className="px-3 py-1 bg-gradient-to-r from-purple-50 to-pink-50 text-purple-700 rounded-lg text-xs font-medium border border-purple-100 hover:border-purple-300 cursor-pointer transition-colors"
                              >
                                {term}
                              </motion.span>
                            ))}
                          </div>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
