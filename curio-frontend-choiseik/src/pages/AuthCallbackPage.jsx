// src/pages/AuthCallbackPage.jsx
import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../api/auth';

function AuthCallbackPage() {
  const navigate = useNavigate();
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current) return;
    handled.current = true;

    const params = new URLSearchParams(window.location.search);
    const access_token = params.get('access_token');
    const refresh_token = params.get('refresh_token');
    const is_new_user = params.get('is_new_user');
    const error = params.get('error');

    if (error || !access_token) {
      navigate('/');
      return;
    }

    localStorage.setItem('curio_access_token', access_token);
    localStorage.setItem('curio_refresh_token', refresh_token);

    if (is_new_user === 'true') {
      navigate('/onboarding');
    } else {
      navigate('/feed');
    }
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-slate-500">로그인 중...</p>
    </div>
  );
}

export default AuthCallbackPage;
