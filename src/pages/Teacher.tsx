import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { useToastStore } from '../stores/toastStore';
import { apiFetch, getApiUrl, apiUpload } from '../lib/api';
import { Users, Activity, BarChart3, UserSearch, Upload, FileText, Image, CheckCircle, XCircle } from 'lucide-react';

export default function Teacher() {
  const navigate = useNavigate();
  const { token, logout } = useAuthStore();
  const { addToast } = useToastStore();
  const [stats, setStats] = useState({ total_students: 0, active_today: 0, tests_generated: 0, average_score: 0 });
  const [students, setStudents] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'students' | 'analytics' | 'import'>('dashboard');
  
  const [questionsFile, setQuestionsFile] = useState<File | null>(null);
  const [diagramFiles, setDiagramFiles] = useState<FileList | null>(null);
  const [subjectCode, setSubjectCode] = useState('');
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{imported: number; skipped: number; errors: string[]} | null>(null);

  const questionsInputRef = useRef<HTMLInputElement>(null);
  const diagramsInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchDashboard = async () => {
      if (!token) return;
      try {
        const data = await apiFetch('/teacher/dashboard');
        setStats(data);
      } catch (err) {
        console.error('Error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, [token]);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const data = await apiFetch(`/teacher/students?search=${search}&limit=50`);
      setStudents(data);
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    if (!questionsFile) {
      addToast('Please upload questions.json', 'error');
      return;
    }
    if (!subjectCode) {
      addToast('Please select a subject', 'error');
      return;
    }

    setImporting(true);
    setImportResult(null);

    try {
      const formData = new FormData();
      formData.append('file', questionsFile);
      formData.append('subject_code', subjectCode);

      if (diagramFiles) {
        for (let i = 0; i < diagramFiles.length; i++) {
          formData.append('diagrams', diagramFiles[i]);
        }
      }

      const result = await apiUpload('/import/import', formData);
      
      setImportResult(result);
      addToast(`Imported ${result.imported} questions`, 'success');
    } catch (err: any) {
      addToast(err.message || 'Import failed', 'error');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-sm">FS</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Teacher Dashboard</h1>
              <p className="text-gray-500 text-sm">Manage students and monitor progress</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/teacher/import')}
              className="px-4 py-2 text-sm text-gray-600 hover:text-primary border rounded-full"
            >
              Open Import Workspace
            </button>
            <button onClick={logout} className="px-4 py-2 text-sm text-gray-600 hover:text-red-500">
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex gap-4 border-b">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`px-4 py-2 font-medium text-sm ${activeTab === 'dashboard' ? 'text-primary border-b-2 border-primary' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <BarChart3 className="w-4 h-4 inline mr-2" /> Dashboard
          </button>
          <button
            onClick={() => { setActiveTab('students'); fetchStudents(); }}
            className={`px-4 py-2 font-medium text-sm ${activeTab === 'students' ? 'text-primary border-b-2 border-primary' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <Users className="w-4 h-4 inline mr-2" /> Students
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-4 py-2 font-medium text-sm ${activeTab === 'analytics' ? 'text-primary border-b-2 border-primary' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <Activity className="w-4 h-4 inline mr-2" /> Analytics
          </button>
          <button
            onClick={() => setActiveTab('import')}
            className={`px-4 py-2 font-medium text-sm ${activeTab === 'import' ? 'text-primary border-b-2 border-primary' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <Upload className="w-4 h-4 inline mr-2" /> Import Questions
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto p-6">
        {activeTab === 'dashboard' && (
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <Users className="w-8 h-8 text-primary mb-3" />
              <p className="text-3xl font-bold text-gray-900">{stats.total_students}</p>
              <p className="text-sm text-gray-500">Total Students</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-6">
              <Activity className="w-8 h-8 text-green-500 mb-3" />
              <p className="text-3xl font-bold text-gray-900">{stats.active_today}</p>
              <p className="text-sm text-gray-500">Active Today</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-6">
              <BarChart3 className="w-8 h-8 text-blue-500 mb-3" />
              <p className="text-3xl font-bold text-gray-900">{stats.tests_generated}</p>
              <p className="text-sm text-gray-500">Tests Today</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-6">
              <UserSearch className="w-8 h-8 text-purple-500 mb-3" />
              <p className="text-3xl font-bold text-gray-900">{stats.average_score}%</p>
              <p className="text-sm text-gray-500">Avg Score (7d)</p>
            </div>
          </div>
        )}

        {activeTab === 'students' && (
          <div>
            <div className="mb-4">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search students..."
                className="w-full max-w-md p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
              />
              <button
                onClick={fetchStudents}
                className="ml-2 px-4 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark"
              >
                Search
              </button>
            </div>

            {loading ? (
              <p className="text-gray-500">Loading students...</p>
            ) : (
              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Streak</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Points</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Active</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {students.map(student => (
                      <tr key={student.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 font-medium text-gray-900">{student.name}</td>
                        <td className="px-6 py-4 text-gray-600">{student.streak_days || 0} days</td>
                        <td className="px-6 py-4 text-gray-600">{student.total_points || 0}</td>
                        <td className="px-6 py-4 text-gray-600">
                          {student.last_active ? new Date(student.last_active).toLocaleDateString() : 'Never'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {students.length === 0 && (
                  <p className="text-center py-8 text-gray-500">No students found.</p>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="bg-white rounded-xl shadow-sm p-8 text-center">
            <Activity className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Analytics Dashboard</h2>
            <p className="text-gray-500">Detailed analytics will appear here as students complete tests.</p>
          </div>
        )}

        {activeTab === 'import' && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-xl shadow-sm p-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Import Questions</h2>
              
              <div className="space-y-6">
                {/* Subject Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Subject Code</label>
                  <select
                    value={subjectCode}
                    onChange={(e) => setSubjectCode(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                  >
                    <option value="">Select subject...</option>
                    <option value="0580">0580 - Mathematics</option>
                    <option value="0610">0610 - Biology</option>
                    <option value="0620">0620 - Chemistry</option>
                    <option value="0625">0625 - Physics</option>
                    <option value="0478">0478 - Computer Science</option>
                    <option value="0460">0460 - Geography</option>
                    <option value="0452">0452 - Accounting</option>
                    <option value="0455">0455 - Economics</option>
                    <option value="0500">0500 - English Lang</option>
                    <option value="0510">0510 - English Lit</option>
                  </select>
                </div>

                {/* Questions File */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Questions JSON File
                  </label>
                  <div
                    onClick={() => questionsInputRef.current?.click()}
                    className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-primary transition-colors"
                  >
                    <FileText className="w-10 h-10 mx-auto text-gray-400 mb-2" />
                    {questionsFile ? (
                      <p className="text-green-600 font-medium">{questionsFile.name}</p>
                    ) : (
                      <>
                        <p className="text-gray-600">Click to upload questions.json</p>
                        <p className="text-sm text-gray-400">Required</p>
                      </>
                    )}
                  </div>
                  <input
                    ref={questionsInputRef}
                    type="file"
                    accept=".json"
                    onChange={(e) => setQuestionsFile(e.target.files?.[0] || null)}
                    className="hidden"
                  />
                </div>

                {/* Diagrams Folder */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Diagram Images (Optional)
                  </label>
                  <p className="text-sm text-gray-500 mb-3">
                    Each question's <code className="text-xs bg-gray-100 px-1 py-0.5 rounded">diagram_filename</code> must match the image filename exactly,
                    for example <code className="text-xs bg-gray-100 px-1 py-0.5 rounded">force-001.png</code>.
                  </p>
                  <div
                    onClick={() => diagramsInputRef.current?.click()}
                    className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-primary transition-colors"
                  >
                    <Image className="w-10 h-10 mx-auto text-gray-400 mb-2" />
                    {diagramFiles && diagramFiles.length > 0 ? (
                      <p className="text-green-600 font-medium">{diagramFiles.length} images selected</p>
                    ) : (
                      <>
                        <p className="text-gray-600">Click to upload diagram images</p>
                        <p className="text-sm text-gray-400">Select all images from /diagrams folder</p>
                      </>
                    )}
                  </div>
                  <input
                    ref={diagramsInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => setDiagramFiles(e.target.files)}
                    className="hidden"
                  />
                </div>

                {/* Import Button */}
                <button
                  onClick={handleImport}
                  disabled={importing || !questionsFile || !subjectCode}
                  className="w-full py-3 bg-primary text-white rounded-lg hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {importing ? (
                    <>Importing...</>
                  ) : (
                    <><Upload className="w-5 h-5" /> Import Questions</>
                  )}
                </button>

                {/* Results */}
                {importResult && (
                  <div className={`rounded-lg p-4 ${importResult.errors.length > 0 ? 'bg-yellow-50 border border-yellow-200' : 'bg-green-50 border border-green-200'}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <span className="font-semibold">Import Complete</span>
                    </div>
                    <p className="text-sm">
                      <strong>{importResult.imported}</strong> questions imported,{' '}
                      <strong>{importResult.skipped}</strong> duplicates skipped
                    </p>
                    {importResult.errors.length > 0 && (
                      <div className="mt-3">
                        <p className="text-sm font-medium text-yellow-700">Errors:</p>
                        <ul className="text-sm text-yellow-600 mt-1">
                          {importResult.errors.slice(0, 5).map((err, i) => (
                            <li key={i}>{err}</li>
                          ))}
                          {importResult.errors.length > 5 && (
                            <li>...and {importResult.errors.length - 5} more</li>
                          )}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
