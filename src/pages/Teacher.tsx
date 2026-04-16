import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { useToastStore } from '../stores/toastStore';
import { apiFetch, getApiUrl, apiUpload } from '../lib/api';
import { motion } from 'framer-motion';
import { Users, Activity, BarChart3, UserSearch, Upload, FileText, Image, CheckCircle, XCircle, Megaphone, Send } from 'lucide-react';

export default function Teacher() {
  const navigate = useNavigate();
  const { token, logout } = useAuthStore();
  const { addToast } = useToastStore();
  const [stats, setStats] = useState({ total_students: 0, active_today: 0, tests_generated: 0, average_score: 0 });
  const [students, setStudents] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'students' | 'analytics' | 'import' | 'content'>('dashboard');
  
  const [questionsFile, setQuestionsFile] = useState<File | null>(null);
  const [diagramFiles, setDiagramFiles] = useState<FileList | null>(null);
  const [subjectCode, setSubjectCode] = useState('');
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{imported: number; skipped: number; errors: string[]} | null>(null);
  const [bulkJson, setBulkJson] = useState('');
  const [contentType, setContentType] = useState<'study' | 'flashcards'>('study');
  
  const [showAnnounce, setShowAnnounce] = useState(false);
  const [announcement, setAnnouncement] = useState({ title: '', message: '' });
  const [announcing, setAnnouncing] = useState(false);

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

  const handleBulkImport = async () => {
    if (!bulkJson.trim()) return addToast('Please paste JSON content', 'error');
    setImporting(true);
    try {
      const data = JSON.parse(bulkJson);
      const endpoint = contentType === 'study' ? '/questions/study/import' : '/questions/flashcards/import';
      const bodyKey = contentType === 'study' ? 'content' : 'flashcards';
      
      await apiFetch(endpoint, {
        method: 'POST',
        body: JSON.stringify({ [bodyKey]: data })
      });
      
      addToast(`Imported ${data.length} items successfully`, 'success');
      setBulkJson('');
      
      // Auto-prefill announcement
      setAnnouncement({
        title: `New ${contentType === 'study' ? 'Study Notes' : 'Flashcards'} Available!`,
        message: `I've just uploaded new ${contentType} content. Check them out in your dashboard!`
      });
      setShowAnnounce(true);
    } catch (err: any) {
      addToast(err.message || 'JSON Parse error or Import failure', 'error');
    } finally {
      setImporting(false);
    }
  };

  const handleAnnounce = async () => {
    if (!announcement.title || !announcement.message) return;
    setAnnouncing(true);
    try {
      await apiFetch('/notifications/broadcast', {
        method: 'POST',
        body: JSON.stringify(announcement)
      });
      addToast('Announcement sent to all students!', 'success');
      setShowAnnounce(false);
    } catch (err: any) {
      addToast('Failed to send announcement', 'error');
    } finally {
      setAnnouncing(false);
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
            <Upload className="w-4 h-4 inline mr-2" /> Questions
          </button>
          <button
            onClick={() => setActiveTab('content')}
            className={`px-4 py-2 font-medium text-sm ${activeTab === 'content' ? 'text-primary border-b-2 border-primary' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <FileText className="w-4 h-4 inline mr-2" /> Study/Flashcards
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

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Diagram Images (Optional)
                  </label>
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
                        <p className="text-sm text-gray-400">Select images from /diagrams folder</p>
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

                <button
                  onClick={handleImport}
                  disabled={importing || !questionsFile || !subjectCode}
                  className="w-full py-3 bg-primary text-white rounded-lg hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {importing ? 'Importing...' : 'Import Questions'}
                </button>

                {importResult && (
                  <div className={`rounded-lg p-4 ${importResult.errors.length > 0 ? 'bg-yellow-50 border border-yellow-200' : 'bg-green-50 border border-green-200'}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <span className="font-semibold">Import Complete</span>
                    </div>
                    <p className="text-sm text-gray-700">
                      <strong>{importResult.imported}</strong> imported,{' '}
                      <strong>{importResult.skipped}</strong> skipped
                    </p>
                    {importResult.errors.length > 0 && (
                      <div className="mt-2 text-xs text-yellow-700 max-h-40 overflow-y-auto">
                        <ul className="list-disc ml-4 space-y-1">
                          {importResult.errors.slice(0, 5).map((err, i) => <li key={i}>{err}</li>)}
                          {importResult.errors.length > 5 && <li>...and {importResult.errors.length - 5} more</li>}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'content' && (
          <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-sm p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-2 text-center">Bulk Content Upload</h2>
            <p className="text-sm text-gray-500 text-center mb-8">Paste a JSON array for Study Notes or Flashcards</p>
            
            <div className="flex gap-4 mb-6">
              <button
                onClick={() => setContentType('study')}
                className={`flex-1 p-3 rounded-xl border-2 font-bold transition-all ${contentType === 'study' ? 'border-primary bg-primary/5 text-primary' : 'border-gray-100 text-gray-400'}`}
              >
                Study Notes
              </button>
              <button
                onClick={() => setContentType('flashcards')}
                className={`flex-1 p-3 rounded-xl border-2 font-bold transition-all ${contentType === 'flashcards' ? 'border-primary bg-primary/5 text-primary' : 'border-gray-100 text-gray-400'}`}
              >
                Flashcards
              </button>
            </div>

            <textarea
              value={bulkJson}
              onChange={(e) => setBulkJson(e.target.value)}
              placeholder={`Paste your ${contentType} JSON array here...`}
              className="w-full h-80 p-4 font-mono text-xs bg-gray-50 border rounded-xl focus:ring-2 focus:ring-primary outline-none mb-6"
            />

            <button
              onClick={handleBulkImport}
              disabled={importing || !bulkJson.trim()}
              className="w-full py-4 bg-primary text-white rounded-xl font-bold shadow-lg shadow-primary/20 hover:shadow-xl transition-all disabled:opacity-50"
            >
              {importing ? 'Processing...' : `Import ${contentType === 'study' ? 'Syllabus Notes' : 'Flashcards'}`}
            </button>

            {showAnnounce && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-8 p-6 bg-primary/5 rounded-2xl border-2 border-primary/20"
              >
                <div className="flex items-center gap-3 mb-4">
                  <Megaphone className="w-6 h-6 text-primary" />
                  <h3 className="font-bold text-gray-900">Broadcast to Students</h3>
                </div>
                
                <div className="space-y-4">
                  <input
                    type="text"
                    value={announcement.title}
                    onChange={(e) => setAnnouncement(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Announcement Title"
                    className="w-full p-3 bg-white border rounded-lg focus:ring-2 focus:ring-primary outline-none"
                  />
                  <textarea
                    value={announcement.message}
                    onChange={(e) => setAnnouncement(prev => ({ ...prev, message: e.target.value }))}
                    placeholder="Your message to students..."
                    className="w-full h-24 p-3 bg-white border rounded-lg focus:ring-2 focus:ring-primary outline-none"
                  />
                  <div className="flex gap-3">
                    <button
                      onClick={handleAnnounce}
                      disabled={announcing}
                      className="flex-1 py-3 bg-primary text-white rounded-lg font-bold flex items-center justify-center gap-2"
                    >
                      <Send className="w-4 h-4" />
                      {announcing ? 'Sending...' : 'Send Announcement'}
                    </button>
                    <button
                      onClick={() => setShowAnnounce(false)}
                      className="px-6 py-3 bg-white border text-gray-600 rounded-lg font-bold"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
