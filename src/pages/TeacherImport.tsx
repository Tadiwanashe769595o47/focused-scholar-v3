import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, FileText, Image, CheckCircle2, AlertTriangle, UploadCloud } from 'lucide-react';
import { apiUpload } from '../lib/api';
import { useToastStore } from '../stores/toastStore';
import { useDashboardStore } from '../stores/dashboardStore';

export default function TeacherImport() {
  const navigate = useNavigate();
  const { addToast } = useToastStore();
  const subjects = useDashboardStore((state) => state.subjects);
  const [subjectCode, setSubjectCode] = useState('');
  const [questionsFile, setQuestionsFile] = useState<File | null>(null);
  const [diagramFiles, setDiagramFiles] = useState<FileList | null>(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ imported: number; skipped: number; errors: string[] } | null>(null);
  const questionsInputRef = useRef<HTMLInputElement>(null);
  const diagramsInputRef = useRef<HTMLInputElement>(null);

  const handleImport = async () => {
    if (!questionsFile) {
      addToast('Please upload a questions JSON file.', 'error');
      return;
    }

    if (!subjectCode) {
      addToast('Please choose a subject before importing.', 'error');
      return;
    }

    setImporting(true);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('file', questionsFile);
      formData.append('subject_code', subjectCode);

      if (diagramFiles) {
        Array.from(diagramFiles).forEach((file) => formData.append('diagrams', file));
      }

      const response = await apiUpload('/import/import', formData);
      setResult(response);
      addToast(`Imported ${response.imported} questions successfully.`, 'success');
    } catch (error: any) {
      addToast(error.message || 'Import failed.', 'error');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/teacher')} className="text-gray-600 hover:text-gray-900">
              <ChevronLeft className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Teacher Import Workspace</h1>
              <p className="text-sm text-gray-500">Upload question banks and optional diagrams for a subject.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto p-6 space-y-6">
        <div className="grid lg:grid-cols-[1.35fr_0.85fr] gap-6">
          <div className="bg-white rounded-2xl shadow-sm p-6 space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Question Bank Upload</h2>
              <p className="text-sm text-gray-500 mt-1">
                Use the exported `questions.json` from your authoring workflow. Diagram filenames should match the
                `diagram_filename` field inside the JSON.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
              <select
                value={subjectCode}
                onChange={(event) => setSubjectCode(event.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
              >
                <option value="">Choose a subject...</option>
                {subjects.map((subject) => (
                  <option key={subject.code} value={subject.code}>
                    {subject.code} - {subject.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <button
                onClick={() => questionsInputRef.current?.click()}
                className="border-2 border-dashed border-gray-300 rounded-2xl p-6 text-left hover:border-primary transition-colors"
              >
                <FileText className="w-10 h-10 text-gray-500 mb-3" />
                <p className="font-semibold text-gray-900">
                  {questionsFile ? questionsFile.name : 'Upload questions.json'}
                </p>
                <p className="text-sm text-gray-500 mt-1">Required. One JSON file with a `questions` array.</p>
              </button>

              <button
                onClick={() => diagramsInputRef.current?.click()}
                className="border-2 border-dashed border-gray-300 rounded-2xl p-6 text-left hover:border-primary transition-colors"
              >
                <Image className="w-10 h-10 text-gray-500 mb-3" />
                <p className="font-semibold text-gray-900">
                  {diagramFiles?.length ? `${diagramFiles.length} diagram files selected` : 'Upload diagram images'}
                </p>
                <p className="text-sm text-gray-500 mt-1">Optional. Select all supporting images in one go.</p>
              </button>
            </div>

            <input
              ref={questionsInputRef}
              type="file"
              accept=".json,application/json"
              onChange={(event) => setQuestionsFile(event.target.files?.[0] || null)}
              className="hidden"
            />

            <input
              ref={diagramsInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={(event) => setDiagramFiles(event.target.files)}
              className="hidden"
            />

            <button
              onClick={handleImport}
              disabled={importing || !questionsFile || !subjectCode}
              className="w-full py-3 bg-primary text-white rounded-lg font-semibold hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <UploadCloud className="w-5 h-5" />
              {importing ? 'Importing question bank...' : 'Import Questions'}
            </button>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900">Checklist</h2>
              <div className="mt-4 space-y-3 text-sm text-gray-600">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 mt-0.5 text-green-600" />
                  <span>Choose the destination subject code before importing.</span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 mt-0.5 text-green-600" />
                  <span>Keep diagram filenames identical to the JSON metadata.</span>
                </div>
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-4 h-4 mt-0.5 text-amber-600" />
                  <span>Duplicates are skipped automatically and listed in the result log.</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900">Latest Result</h2>
              {!result ? (
                <p className="text-sm text-gray-500 mt-3">No import has been run in this session yet.</p>
              ) : (
                <div className="mt-4 space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-2xl border p-4">
                      <p className="text-xs text-gray-500 uppercase">Imported</p>
                      <p className="text-2xl font-bold text-gray-900 mt-1">{result.imported}</p>
                    </div>
                    <div className="rounded-2xl border p-4">
                      <p className="text-xs text-gray-500 uppercase">Skipped</p>
                      <p className="text-2xl font-bold text-gray-900 mt-1">{result.skipped}</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-gray-900">Messages</p>
                    <div className="mt-2 max-h-56 overflow-y-auto rounded-2xl border bg-gray-50 p-3 space-y-2">
                      {result.errors.length === 0 ? (
                        <p className="text-sm text-gray-500">No warnings or duplicate notices.</p>
                      ) : (
                        result.errors.map((message, index) => (
                          <p key={`${message}-${index}`} className="text-sm text-gray-600">
                            {message}
                          </p>
                        ))
                      )}
                    </div>
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
