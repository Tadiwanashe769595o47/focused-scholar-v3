import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { useDashboardStore } from '../stores/dashboardStore';
import { apiFetch } from '../lib/api';
import { ChevronLeft, BookOpen, Search, Filter, Book, Bookmark, Lightbulb, Calculator, Atom, Globe, TrendingUp, DollarSign, Sparkles, Zap, Leaf, FlaskConical, X, LayoutGrid, List } from 'lucide-react';
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
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');

  const loadNotes = (subjectCode: string) => {
    setSelectedSubject(subjectCode);
    setLoading(true);
    try {
      const data = studyContentData.filter(n => n.subject_code === subjectCode);
      setNotes(data);
      setFilteredNotes(data);
      setSelectedTopic(null);
    } catch (err) {
      console.error('Error loading study notes:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let result = notes;
    
    if (selectedTopic) {
      result = result.filter(n => n.topic === selectedTopic);
    }
    
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(n => 
        n.topic.toLowerCase().includes(q) || 
        n.subtopic?.toLowerCase().includes(q) || 
        n.content.toLowerCase().includes(q) ||
        n.key_terms?.some(k => k.toLowerCase().includes(q))
      );
    }
    
    setFilteredNotes(result);
  }, [searchQuery, notes, selectedTopic]);

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
  
  const topics = Array.from(new Set(notes.map(n => n.topic)));

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b px-4 py-3 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => selectedSubject ? setSelectedSubject(null) : navigate('/dashboard')} 
              className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-all"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-lg font-bold text-gray-900">
                {selectedSubject ? `${subjectData?.name} Study Notes` : 'Study Notes'}
              </h1>
              <p className="text-xs text-gray-500">
                {selectedSubject ? `Mastering ${subjectData?.name}` : 'Choose a subject to study'}
              </p>
            </div>
          </div>

          {selectedSubject && (
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search topics, concepts..."
                  className="pl-9 pr-8 py-2 bg-gray-100 border-none rounded-full text-sm focus:ring-2 focus:ring-primary w-48 lg:w-64"
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} className="absolute right-2 top-1/2 -translate-y-1/2">
                    <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <main className="flex-1 max-w-6xl mx-auto w-full p-4">
        {!selectedSubject ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {subjects.map((sub, idx) => (
              <motion.button
                key={sub.code}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                onClick={() => loadNotes(sub.code)}
                className="glass-card p-5 text-left group cursor-pointer"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-lg" style={{ backgroundColor: sub.color }}>
                    <Book className="w-5 h-5" />
                  </div>
                </div>
                <h3 className="font-bold text-gray-900 text-sm">{sub.name}</h3>
                <p className="text-xs text-gray-400">{sub.code}</p>
              </motion.button>
            ))}
          </div>
        ) : loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-gray-500">Loading notes...</p>
          </div>
        ) : filteredNotes.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-gray-200">
            <Search className="w-12 h-12 mx-auto text-gray-300 mb-3" />
            <h3 className="text-lg font-bold text-gray-900">No notes found</h3>
            <p className="text-gray-500 mt-1 mb-4">Try a different search term</p>
            <button onClick={() => {setSearchQuery(''); setSelectedTopic(null);}} className="px-4 py-2 bg-primary text-white rounded-full font-bold text-sm">
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="flex gap-4">
            {/* Sidebar - Topic List */}
            <div className="w-56 shrink-0 hidden lg:block">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 sticky top-20">
                <h3 className="font-bold text-gray-900 text-sm mb-3 px-2">Topics</h3>
                <div className="space-y-1 max-h-[70vh] overflow-y-auto">
                  <button
                    onClick={() => setSelectedTopic(null)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                      !selectedTopic ? 'bg-primary text-white' : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    All Topics ({notes.length})
                  </button>
                  {topics.map(topic => (
                    <button
                      key={topic}
                      onClick={() => setSelectedTopic(topic)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                        selectedTopic === topic ? 'bg-primary text-white' : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      {topic} ({notes.filter(n => n.topic === topic).length})
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 space-y-6 pb-20">
              {/* Mobile Topic Filter */}
              <div className="lg:hidden flex gap-2 overflow-x-auto pb-2">
                <button
                  onClick={() => setSelectedTopic(null)}
                  className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap ${
                    !selectedTopic ? 'bg-primary text-white' : 'bg-white text-gray-600 border'
                  }`}
                >
                  All
                </button>
                {topics.map(topic => (
                  <button
                    key={topic}
                    onClick={() => setSelectedTopic(topic)}
                    className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap ${
                      selectedTopic === topic ? 'bg-primary text-white' : 'bg-white text-gray-600 border'
                    }`}
                  >
                    {topic}
                  </button>
                ))}
              </div>

              {/* Results count */}
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500">
                  Showing {filteredNotes.length} {filteredNotes.length === 1 ? 'note' : 'notes'}
                  {selectedTopic && <span> in <span className="font-semibold">{selectedTopic}</span></span>}
                </p>
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} className="text-sm text-primary hover:underline">
                    Clear search
                  </button>
                )}
              </div>

              {/* Notes Grid */}
              <div className="grid gap-4">
                {filteredNotes.map((note, idx) => (
                  <motion.div 
                    key={note.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: idx * 0.05 }}
                    className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-all"
                  >
                    {note.subtopic && (
                      <div className="flex items-center gap-2 mb-2">
                        <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 text-xs font-semibold">
                          {note.subtopic}
                        </span>
                      </div>
                    )}
                    
                    <h3 className="font-bold text-gray-900 text-lg mb-3">{note.topic}</h3>
                    
                    <div className="text-gray-700 text-sm leading-relaxed space-y-2">
                      {note.content.split('\n').map((para, i) => {
                        const trimmed = para.trim();
                        if (!trimmed) return null;
                        if (trimmed.startsWith('## ')) {
                          return <h4 key={i} className="font-bold text-purple-700 text-base mt-4">{trimmed.replace('## ', '')}</h4>;
                        }
                        if (trimmed.startsWith('### ')) {
                          return <h5 key={i} className="font-semibold text-purple-600 mt-3">{trimmed.replace('### ', '')}</h5>;
                        }
                        if (trimmed.startsWith('**') && trimmed.endsWith('**')) {
                          return <p key={i} className="font-bold text-purple-800">{trimmed.replace(/\*\*/g, '')}</p>;
                        }
                        if (trimmed.startsWith('> ')) {
                          return <blockquote key={i} className="bg-yellow-50 p-3 rounded-lg border-l-4 border-yellow-400 text-gray-600 italic">{trimmed.replace('> ', '')}</blockquote>;
                        }
                        if (trimmed.match(/^[-•] /)) {
                          return <li key={i} className="ml-4 list-disc text-gray-700">{trimmed.replace(/^[-•] /, '')}</li>;
                        }
                        if (trimmed.match(/^\d+\. /)) {
                          return <li key={i} className="ml-4 list-decimal text-gray-700">{trimmed.replace(/^\d+\. /, '')}</li>;
                        }
                        if (trimmed.length < 3 || trimmed.match(/^-+$/) || trimmed.match(/^\*+$/)) return null;
                        return <p key={i} className="text-gray-700">{trimmed}</p>;
                      })}
                    </div>
                    
                    {note.key_terms && note.key_terms.length > 0 && (
                      <div className="mt-4 pt-3 border-t border-gray-100">
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Key Terms</p>
                        <div className="flex flex-wrap gap-2">
                          {note.key_terms.map((term, i) => (
                            <span key={i} className="px-2 py-1 bg-purple-50 text-purple-700 rounded-lg text-xs font-medium">
                              {term}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}