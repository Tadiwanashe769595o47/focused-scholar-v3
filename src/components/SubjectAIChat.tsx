import { useState } from 'react';
import { Sparkles, X, MessageSquare, Send, Book } from 'lucide-react';
import { apiFetch } from '../lib/api';
import { motion, AnimatePresence } from 'framer-motion';

interface SubjectAIChatProps {
  questionText: string;
  context?: string;
}

export default function SubjectAIChat({ questionText, context }: SubjectAIChatProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [definition, setDefinition] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDefine = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch('/tutor/define', {
        method: 'POST',
        body: JSON.stringify({
          word: query,
          context: questionText + (context ? ' ' + context : '')
        })
      });
      setDefinition(data.definition);
    } catch (err: any) {
      setError(err.message || 'Dictionary unavailable');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative inline-block ml-2">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-all text-tiny font-bold group cursor-pointer"
      >
        <Sparkles className="w-3 h-3 group-hover:scale-110 mb-0.5" />
        Help with words
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            className="absolute left-0 bottom-full mb-4 w-72 glass-card p-4 z-50 shadow-2xl border-primary/20"
          >
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <Book className="w-4 h-4 text-primary" />
                <h3 className="text-xs font-bold text-gray-900">Word Meaning Helper</h3>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-gray-100 rounded-full transition-colors cursor-pointer"
              >
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>

            <p className="text-tiny text-gray-500 mb-3 leading-relaxed">
              Don't understand a word or concept? Type it here for a simple definition.
            </p>

            <form onSubmit={handleDefine} className="flex gap-2 mb-4">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="e.g. 'Photosynthesis' or 'Isotopes'"
                className="flex-1 p-2 bg-gray-50 border border-gray-100 rounded-lg text-xs focus:ring-1 focus:ring-primary outline-none"
                autoFocus
              />
              <button
                disabled={loading || !query.trim()}
                type="submit"
                className="p-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50"
              >
                {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </form>

            {error && (
              <div className="p-2 bg-red-50 text-red-600 rounded-lg mb-0 text-tiny">
                {error}
              </div>
            )}

            {definition && (
              <div className="p-3 bg-primary/5 rounded-xl border border-primary/10 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <p className="text-xs font-bold text-primary mb-1 uppercase tracking-wider">Meaning:</p>
                <p className="text-xs text-gray-700 leading-relaxed font-medium">
                  {definition}
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
