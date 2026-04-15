import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { useToastStore } from '../stores/toastStore';
import { apiFetch } from '../lib/api';
import { ChevronLeft, Save, User, Mail, Key, Shield, ClipboardList, Users } from 'lucide-react';
import LoadingOverlay from '../components/LoadingOverlay';

export default function Settings() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [parentEmail, setParentEmail] = useState('');
  const [fontSize, setFontSize] = useState('medium');
  const [portalCode, setPortalCode] = useState('');
  const [portalLoading, setPortalLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('Loading settings...');
  const { addToast } = useToastStore();

  useEffect(() => {
    let cancelled = false;

    async function loadSettings() {
      setLoadingMessage('Loading settings...');
      setLoading(true);

      try {
        const student = await apiFetch('/students/me');
        if (cancelled) return;

        setName(student.name || '');
        setEmail(student.email || '');
        setParentEmail(student.parent_email || '');
        setFontSize(student.font_size || 'medium');
      } catch (err: any) {
        if (cancelled) return;

        setError(err.message || 'Failed to load settings');
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadSettings();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleSave = async () => {
    setError('');
    setSuccess('');

    if (!email.trim()) {
      setError('Email is required');
      return;
    }

    setLoading(true);
    setLoadingMessage('Saving settings...');
    try {
      const updates: any = { name, email, font_size: fontSize, parent_email: parentEmail };

      await apiFetch('/students/me', {
        method: 'PUT',
        body: JSON.stringify(updates)
      });

      setSuccess('Settings saved successfully!');
      addToast('Settings saved successfully!', 'success');
    } catch (err: any) {
      setError(err.message);
      addToast(err.message || 'Failed to save settings', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handlePortalAccess = async () => {
    if (!portalCode.trim()) {
      setError('Please enter a portal code');
      return;
    }

    setPortalLoading(true);
    setError('');

    try {
      const response = await apiFetch('/auth/verify-portal-code', {
        method: 'POST',
        body: JSON.stringify({ code: portalCode.trim() })
      });

      addToast(response.message || 'Portal access granted!', 'success');
      setPortalCode('');

      if (response.redirect) {
        navigate(response.redirect);
      }
    } catch (err: any) {
      setError(err.message || 'Invalid portal code');
      addToast(err.message || 'Invalid portal code', 'error');
    } finally {
      setPortalLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative">
      {loading && <LoadingOverlay message={loadingMessage} />}
      <div className="glass-nav mx-4 mt-4 px-6 py-4">
        <div className="max-w-2xl mx-auto flex items-center gap-4">
          <button onClick={() => navigate('/dashboard')} className="text-gray-600 hover:text-gray-900 p-2 rounded-lg hover:bg-gray-100/50 transition-all">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-bold text-gray-900">Settings</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-6">
        {success && (
          <div className="bg-green-50/80 backdrop-blur-sm text-green-700 p-3 rounded-lg mb-4 border border-green-200/50">{success}</div>
        )}
        {error && (
          <div className="bg-red-50/80 backdrop-blur-sm text-red-700 p-3 rounded-lg mb-4 border border-red-200/50">{error}</div>
        )}

        <div className="glass-card p-6 space-y-6">
          <h2 className="text-lg font-semibold text-gray-900">Profile</h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
              <User className="w-4 h-4" /> Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-3 bg-white/60 border border-white/30 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary backdrop-blur-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
              <Mail className="w-4 h-4" /> Login Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Student email"
              className="w-full p-3 bg-white/60 border border-white/30 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary backdrop-blur-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
              <Mail className="w-4 h-4" /> Parent Email
            </label>
            <input
              type="email"
              value={parentEmail}
              onChange={(e) => setParentEmail(e.target.value)}
              placeholder="Parent's email for reports"
              className="w-full p-3 bg-white/60 border border-white/30 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary backdrop-blur-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Font Size</label>
            <select
              value={fontSize}
              onChange={(e) => setFontSize(e.target.value)}
              className="w-full p-3 bg-white/60 border border-white/30 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary backdrop-blur-sm"
            >
              <option value="small">Small</option>
              <option value="medium">Medium</option>
              <option value="large">Large</option>
              <option value="xlarge">Extra Large</option>
            </select>
          </div>

          <button
            onClick={handleSave}
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-primary to-accent text-white rounded-lg font-semibold shadow-lg shadow-primary/25 hover:shadow-xl transition-all flex items-center justify-center gap-2 btn-press disabled:opacity-50"
          >
            <Save className="w-5 h-5" />
            {loading ? 'Saving...' : 'Save Settings'}
          </button>

          <div className="border-t border-gray-200/50 pt-6">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4">
              <Shield className="w-5 h-5" /> Alternative Portal Access
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              Enter a portal code to access teacher, parent, or holiday workspaces without changing your account type.
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                value={portalCode}
                onChange={(e) => setPortalCode(e.target.value.toUpperCase())}
                placeholder="Enter portal code (e.g., TEACHER123)"
                className="flex-1 p-3 bg-white/60 border border-white/30 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary backdrop-blur-sm"
              />
              <button
                onClick={handlePortalAccess}
                disabled={portalLoading || !portalCode.trim()}
                className="px-4 py-3 bg-gray-800 text-white rounded-lg font-semibold hover:bg-gray-900 transition-all flex items-center gap-2 disabled:opacity-50"
              >
                <Key className="w-4 h-4" />
                {portalLoading ? 'Verifying...' : 'Access'}
              </button>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full py-3 bg-red-50/80 backdrop-blur-sm text-red-600 rounded-lg font-semibold hover:bg-red-100/50 transition-all border border-red-200/50"
          >
            Logout
          </button>

          <div className="border-t border-gray-200/50 pt-6 mt-6">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4">
              <ClipboardList className="w-5 h-5" /> Teacher Access
            </h2>
            <button
              onClick={() => navigate('/teacher')}
              className="w-full py-4 bg-gray-900 text-white rounded-xl font-bold hover:bg-black transition-all flex items-center justify-center gap-3 shadow-lg"
            >
              <Users className="w-6 h-6" /> Open Teacher Dashboard
            </button>
            <p className="text-xs text-gray-500 mt-2 text-center">
              Enter the teacher portal to manage questions, imports, and curriculum.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
