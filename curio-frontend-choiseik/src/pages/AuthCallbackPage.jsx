// src/pages/AuthCallbackPage.jsx
import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

function AuthCallbackPage() {
  const navigate = useNavigate();
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current) return;
    handled.current = true;

    const params = new URLSearchParams(window.location.search);
    const accessToken = params.get('access_token');
    const refreshToken = params.get('refresh_token');
    const isNewUser = params.get('is_new_user') === 'true';
    const error = params.get('error');

    if (error || !accessToken) {
      navigate('/');
      return;
    }

    localStorage.setItem('curio_access_token', accessToken);
    localStorage.setItem('curio_refresh_token', refreshToken);

    if (isNewUser) {
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
