// src/App.jsx
import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { userApi } from './api/userApi';
import LandingPage from './pages/LandingPage';
import OnboardingPage from './pages/OnboardingPage';
import FeedPage from './pages/FeedPage';
import MyPage from './pages/MyPage';
import SearchPage from './pages/SearchPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import AuthCallbackPage from './pages/AuthCallbackPage';

/**
 * 앱 마운트 시 로그인 상태면 서버에서 다크모드 설정을 가져와 동기화합니다.
 * ThemeProvider 안에서 렌더해야 useTheme()을 쓸 수 있습니다.
 */
function ThemeSyncer() {
  const { syncThemeFromServer } = useTheme();

  useEffect(() => {
    const token = localStorage.getItem('curio_access_token');
    if (!token) return;

    userApi.getMe()
      .then(res => {
        const darkMode = res?.data?.preferences?.dark_mode;
        // 서버에 값이 있을 때만 덮어씀 (null/undefined면 localStorage 값 유지)
        if (darkMode !== null && darkMode !== undefined) {
          syncThemeFromServer(darkMode);
        }
      })
      .catch(() => {
        // 네트워크 오류 등 — localStorage 값 그대로 유지
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}

function App() {
  return (
    <ThemeProvider>
      <ThemeSyncer />
      <Router>
        <Routes>
          {/* 시작 화면 및 인증 */}
          <Route path="/" element={<LandingPage />} />

          {/* 온보딩 및 메인 서비스 */}
          <Route path="/onboarding" element={<OnboardingPage />} />
          <Route path="/feed" element={<FeedPage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/mypage" element={<MyPage />} />

          {/* Google OAuth 콜백 */}
          <Route path="/auth/callback" element={<AuthCallbackPage />} />

          {/* 비밀번호 재설정 관련 */}
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
