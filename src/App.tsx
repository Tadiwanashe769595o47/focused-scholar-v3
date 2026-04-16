import { useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useToastStore } from './stores/toastStore';
import { useAuthStore } from './stores/authStore';
import ToastContainer from './components/ToastContainer';
import AuthCallback from './pages/AuthCallback';
import Login from './pages/Login';
import Register from './pages/Register';
import Onboarding from './pages/Onboarding';
import Dashboard from './pages/Dashboard';
import SubjectTest from './pages/SubjectTest';
import Results from './pages/Results';
import History from './pages/History';
import Homework from './pages/Homework';
import HolidayWork from './pages/HolidayWork';
import HolidaySubjectTest from './pages/HolidaySubjectTest';
import Flashcards from './pages/Flashcards';
import Study from './pages/Study';
import Tutor from './pages/Tutor';
import Settings from './pages/Settings';
import Teacher from './pages/Teacher';
import Reports from './pages/Reports';
import TeacherImport from './pages/TeacherImport';
import HolidayImport from './pages/HolidayImport';
import Notifications from './pages/Notifications';
import ParentDashboard from './pages/ParentDashboard';
import { getRoleHomePath } from './lib/auth';
import { loadOfflineQuestions } from './lib/loadOfflineQuestions';

function ProtectedRoute({ children, allowedTypes }: { children: React.ReactNode; allowedTypes?: string[] }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const userType = useAuthStore((state) => state.user?.type);
  if (!isAuthenticated) return <Navigate to="/login" />;
  if (allowedTypes && userType && !allowedTypes.includes(userType)) {
    return <Navigate to={getRoleHomePath(userType)} replace />;
  }
  return <>{children}</>;
}

export default function App() {
  const needsOnboarding = useAuthStore((state) => state.user?.needsOnboarding);
  const userType = useAuthStore((state) => state.user?.type);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const finishGoogleAuth = useAuthStore((state) => state.finishGoogleAuth);
  const addToast = useToastStore((state) => state.addToast);
  const navigate = useNavigate();

  // Load offline questions on app start
  useEffect(() => {
    loadOfflineQuestions();
  }, []);

  useEffect(() => {
    // Listen for custom protocol Google Auth success
    const api = (window as any).electronAPI;
    if (api && typeof api.onAuthGoogleSuccess === 'function') {
      const removeListener = api.onAuthGoogleSuccess(async (token: string) => {
        try {
          await finishGoogleAuth(token);
          addToast('Signed in with Google!', 'success');
          navigate('/dashboard', { replace: true });
        } catch (err: any) {
          addToast(err.message || 'Google deep-link login failed', 'error');
        }
      });
      return () => removeListener?.();
    }
  }, [finishGoogleAuth, addToast, navigate]);

  return (
    <>
      <ToastContainer />
      <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/auth/callback" element={<AuthCallback />} />
      <Route path="/onboarding" element={<ProtectedRoute allowedTypes={['student']}><Onboarding /></ProtectedRoute>} />
      <Route path="/dashboard" element={
        <ProtectedRoute allowedTypes={['student']}>
          {needsOnboarding ? <Navigate to="/onboarding" /> : <Dashboard />}
        </ProtectedRoute>
      } />
      <Route path="/test/:subjectCode" element={<ProtectedRoute allowedTypes={['student']}><SubjectTest /></ProtectedRoute>} />
      <Route path="/results/:date" element={<ProtectedRoute allowedTypes={['student']}><Results /></ProtectedRoute>} />
      <Route path="/history" element={<ProtectedRoute allowedTypes={['student']}><History /></ProtectedRoute>} />
      <Route path="/notifications" element={<ProtectedRoute allowedTypes={['student']}><Notifications /></ProtectedRoute>} />
      <Route path="/reports" element={<ProtectedRoute allowedTypes={['student']}><Reports /></ProtectedRoute>} />
      <Route path="/homework" element={<ProtectedRoute allowedTypes={['student']}><Homework /></ProtectedRoute>} />
      <Route path="/holiday" element={<ProtectedRoute allowedTypes={['student']}><HolidayWork /></ProtectedRoute>} />
      <Route path="/holiday/subject/:subjectCode" element={<ProtectedRoute allowedTypes={['student']}><HolidaySubjectTest /></ProtectedRoute>} />
      <Route path="/flashcards" element={<ProtectedRoute allowedTypes={['student']}><Flashcards /></ProtectedRoute>} />
      <Route path="/study" element={<ProtectedRoute allowedTypes={['student']}><Study /></ProtectedRoute>} />
      <Route path="/tutor" element={<ProtectedRoute allowedTypes={['student']}><Tutor /></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute allowedTypes={['student']}><Settings /></ProtectedRoute>} />
      <Route path="/teacher" element={<ProtectedRoute allowedTypes={['teacher']}><Teacher /></ProtectedRoute>} />
      <Route path="/teacher/import" element={<ProtectedRoute allowedTypes={['teacher']}><TeacherImport /></ProtectedRoute>} />
      <Route path="/holiday/import" element={<ProtectedRoute allowedTypes={['holiday']}><HolidayImport /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to={isAuthenticated ? getRoleHomePath(userType) : '/login'} replace />} />
    </Routes>
    </>
  );
}
