import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import LoadingOverlay from '../components/LoadingOverlay';
import { useToastStore } from '../stores/toastStore';
import { useAuthStore } from '../stores/authStore';

export default function AuthCallback() {
  const navigate = useNavigate();
  const finishGoogleAuth = useAuthStore((state) => state.finishGoogleAuth);
  const addToast = useToastStore((state) => state.addToast);
  const [message, setMessage] = useState('Completing your Google sign-in...');

  useEffect(() => {
    let cancelled = false;

    async function completeAuth() {
      const params = new URLSearchParams(window.location.search);
      const token = params.get('token');
      const error = params.get('error');

      if (error) {
        addToast(error, 'error');
        navigate('/login', { replace: true });
        return;
      }

      if (!token) {
        addToast('Google sign-in did not return a session token.', 'error');
        navigate('/login', { replace: true });
        return;
      }

      try {
        await finishGoogleAuth(token);
        if (cancelled) return;

        addToast('Signed in with Google.', 'success');
        navigate('/dashboard', { replace: true });
      } catch (err: any) {
        if (cancelled) return;

        setMessage('Google sign-in failed. Sending you back to login...');
        addToast(err.message || 'Google sign-in failed', 'error');
        navigate('/login', { replace: true });
      }
    }

    completeAuth();

    return () => {
      cancelled = true;
    };
  }, [addToast, finishGoogleAuth, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <LoadingOverlay message={message} />
    </div>
  );
}
