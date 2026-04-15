import { useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, CheckCircle2, FileText, RefreshCw, Sparkles } from 'lucide-react';
import { apiFetch } from '../lib/api';
import { useToastStore } from '../stores/toastStore';
import { useDashboardStore } from '../stores/dashboardStore';
import { useAuthStore } from '../stores/authStore';

type HolidayImportResult = {
  imported: number;
  mirrored: number;
  total: number;
  errors: Array<{ question?: string; error: string; stage?: string }>;
};

export default function HolidayImport() {
  const navigate = useNavigate();
  const { logout } = useAuthStore();
  const { addToast } = useToastStore();
  const subjects = useDashboardStore((state) => state.subjects);
  const inputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [rawJson, setRawJson] = useState('');
  const [subjectCode, setSubjectCode] = useState('');
  const [mirrorToQuestions, setMirrorToQuestions] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<HolidayImportResult | null>(null);

  const sourceLabel = useMemo(() => {
    if (selectedFile) return selectedFile.name;
    if (rawJson.trim()) return 'Pasted JSON';
    return 'No source selected yet';
  }, [rawJson, selectedFile]);

  const handleImport = async () => {
    if (!selectedFile && !rawJson.trim()) {
      addToast('Upload a JSON file or paste question JSON first.', 'error');
      return;
    }

    setSubmitting(true);
    setResult(null);

    try {
      const raw = selectedFile ? await selectedFile.text() : rawJson;
      const parsed = JSON.parse(raw);
      const incomingQuestions = Array.isArray(parsed) ? parsed : parsed.questions;

      if (!Array.isArray(incomingQuestions) || incomingQuestions.length === 0) {
        throw new Error('The holiday import payload must contain a non-empty questions array.');
      }

      const questions = incomingQuestions.map((question) => ({
        ...question,
        subject_code: question.subject_code || subjectCode
      }));

      if (questions.some((question) => !question.subject_code)) {
        throw new Error('Each question must include a subject_code or you must choose a fallback subject.');
      }

      const response = await apiFetch('/holiday/questions/import', {
        method: 'POST',
        body: JSON.stringify({
          questions,
          mirror_to_questions: mirrorToQuestions
        })
      });

      setResult(response);
      addToast(`Imported ${response.imported} holiday questions.`, 'success');
    } catch (error: any) {
      addToast(error.message || 'Holiday import failed.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/login')} className="text-gray-600 hover:text-gray-900">
              <ChevronLeft className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Holiday Import Workspace</h1>
              <p className="text-sm text-gray-500">Load curated holiday question sets without entering the teacher dashboard.</p>
            </div>
          </div>
          <button onClick={logout} className="px-4 py-2 text-sm text-gray-600 hover:text-red-500">
            Logout
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto p-6 space-y-6">
        <div className="grid lg:grid-cols-[1.2fr_0.8fr] gap-6">
          <div className="bg-white rounded-2xl shadow-sm p-6 space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Import Source</h2>
              <p className="text-sm text-gray-500 mt-1">
                You can upload a file containing <code className="text-xs bg-gray-100 px-1 py-0.5 rounded">questions</code>
                {' '}or paste the array directly. A fallback subject can be applied to questions that do not already
                include <code className="text-xs bg-gray-100 px-1 py-0.5 rounded">subject_code</code>.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <button
                onClick={() => inputRef.current?.click()}
                className="border-2 border-dashed border-gray-300 rounded-2xl p-6 text-left hover:border-primary transition-colors"
              >
                <FileText className="w-10 h-10 text-gray-500 mb-3" />
                <p className="font-semibold text-gray-900">{selectedFile ? selectedFile.name : 'Upload holiday JSON'}</p>
                <p className="text-sm text-gray-500 mt-1">Optional if you prefer pasting the JSON below.</p>
              </button>

              <div className="rounded-2xl border p-6">
                <p className="text-sm text-gray-500 uppercase">Current Source</p>
                <p className="text-lg font-semibold text-gray-900 mt-2 break-words">{sourceLabel}</p>
                <button
                  onClick={() => {
                    setSelectedFile(null);
                    setRawJson('');
                    setResult(null);
                    if (inputRef.current) inputRef.current.value = '';
                  }}
                  className="mt-4 text-sm text-gray-600 hover:text-gray-900 flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Clear source
                </button>
              </div>
            </div>

            <input
              ref={inputRef}
              type="file"
              accept=".json,application/json"
              onChange={(event) => setSelectedFile(event.target.files?.[0] || null)}
              className="hidden"
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Fallback subject code</label>
              <select
                value={subjectCode}
                onChange={(event) => setSubjectCode(event.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
              >
                <option value="">Leave blank if JSON already contains subject codes</option>
                {subjects.map((subject) => (
                  <option key={subject.code} value={subject.code}>
                    {subject.code} - {subject.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Paste holiday questions JSON</label>
              <textarea
                value={rawJson}
                onChange={(event) => setRawJson(event.target.value)}
                rows={14}
                placeholder='{"questions":[{"subject_code":"0580","topic":"Algebra"}]}'
                className="w-full p-4 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-primary font-mono text-sm"
              />
            </div>

            <label className="flex items-center gap-3 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={mirrorToQuestions}
                onChange={(event) => setMirrorToQuestions(event.target.checked)}
                className="w-4 h-4"
              />
              Mirror imported holiday questions into the main question bank as well
            </label>

            <button
              onClick={handleImport}
              disabled={submitting}
              className="w-full py-3 bg-primary text-white rounded-lg font-semibold hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Sparkles className="w-5 h-5" />
              {submitting ? 'Importing holiday set...' : 'Import Holiday Questions'}
            </button>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900">What This Does</h2>
              <div className="mt-4 space-y-3 text-sm text-gray-600">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 mt-0.5 text-green-600" />
                  <span>Imports directly into the dedicated `holiday_questions` collection.</span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 mt-0.5 text-green-600" />
                  <span>Optionally mirrors the same payload into the main practice question bank.</span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 mt-0.5 text-green-600" />
                  <span>Lets holiday staff work without opening the teacher-only workspace.</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900">Latest Result</h2>
              {!result ? (
                <p className="text-sm text-gray-500 mt-3">No holiday import has been run in this session.</p>
              ) : (
                <div className="mt-4 space-y-4">
                  <div className="grid grid-cols-3 gap-3">
                    <div className="rounded-2xl border p-4">
                      <p className="text-xs text-gray-500 uppercase">Imported</p>
                      <p className="text-2xl font-bold text-gray-900 mt-1">{result.imported}</p>
                    </div>
                    <div className="rounded-2xl border p-4">
                      <p className="text-xs text-gray-500 uppercase">Mirrored</p>
                      <p className="text-2xl font-bold text-gray-900 mt-1">{result.mirrored}</p>
                    </div>
                    <div className="rounded-2xl border p-4">
                      <p className="text-xs text-gray-500 uppercase">Total</p>
                      <p className="text-2xl font-bold text-gray-900 mt-1">{result.total}</p>
                    </div>
                  </div>

                  <div className="max-h-56 overflow-y-auto rounded-2xl border bg-gray-50 p-3 space-y-2">
                    {result.errors.length === 0 ? (
                      <p className="text-sm text-gray-500">No errors reported.</p>
                    ) : (
                      result.errors.map((entry, index) => (
                        <p key={`${entry.error}-${index}`} className="text-sm text-gray-600">
                          {(entry.question || 'Question') + ': ' + entry.error}
                        </p>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
