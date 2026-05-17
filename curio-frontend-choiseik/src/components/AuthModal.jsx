// src/components/AuthModal.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../api/auth';

function AuthModal({ isOpen, onClose }) {
  const navigate = useNavigate();
  
  // mode: 'select'(초기화면), 'login'(로그인), 'register'(회원가입)
  const [mode, setMode] = useState('select');
  
  // 폼 입력 상태
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  // Google 로그인 핸들러
  const handleGoogleLogin = () => {
    const backendUrl = window.location.hostname === 'localhost'
      ? 'http://localhost:8000'
      : 'https://curio-backend-production.up.railway.app';
    const params = new URLSearchParams({
      client_id: '442522475240-ueeg9kfv037t3ng5imqctsfva2anin98.apps.googleusercontent.com',
      redirect_uri: `${backendUrl}/api/auth/google/callback`,
      response_type: 'code',
      scope: 'email profile',
      access_type: 'offline',
      prompt: 'select_account',
    });
    window.location.href = `https://accounts.google.com/o/oauth2/auth?${params}`;
  };

  // 폼 제출 핸들러
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    try {
      let data;
      if (mode === 'login') {
        data = await authApi.login(email, password);
      } else {
        data = await authApi.register(email, password, name);
      }

      const { access_token, refresh_token, user } = data.data;
      localStorage.setItem('curio_access_token', access_token);
      localStorage.setItem('curio_refresh_token', refresh_token);

      onClose();
      if (!user.is_onboarded) {
        navigate('/onboarding');
      } else {
        navigate('/feed');
      }
    } catch (error) {
      const errorDetail = error.response?.data?.detail || error.response?.data?.message || '오류가 발생했습니다.';
      setErrorMessage(errorDetail);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md p-8 rounded-[32px] shadow-2xl relative animate-slide-up">
        {/* 우측 상단 닫기 버튼 */}
        <button onClick={onClose} className="absolute top-6 right-6 text-2xl text-slate-400 hover:text-slate-600 transition">×</button>

        {/* 로고 및 제목 */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center text-white font-black text-2xl mx-auto mb-4 shadow-lg shadow-blue-200">C</div>
          <h2 className="text-2xl font-black text-slate-900">
            {mode === 'select' ? 'Curio 시작하기' : mode === 'login' ? '로그인' : '회원가입'}
          </h2>
          <p className="text-slate-500 mt-2 text-sm">개인화 AI 뉴스레터 서비스, 큐리오</p>
        </div>

        {/* [모드 1] 소셜 및 이메일 선택 화면 */}
        {mode === 'select' && (
          <div className="space-y-3">
            <button onClick={handleGoogleLogin} className="w-full py-4 bg-white border border-slate-200 text-slate-700 rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-slate-50 transition shadow-sm">
              <span className="text-xl">G</span> Google로 계속하기
            </button>
            <div className="relative py-4 text-center">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200"></div></div>
              <div className="relative inline-block px-4 bg-white text-xs text-slate-400 uppercase tracking-widest">or</div>
            </div>
            <button 
              onClick={() => setMode('login')}
              className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 transition shadow-lg shadow-blue-100"
            >
              이메일로 계속하기
            </button>
            <div className="mt-6 text-center text-sm text-slate-500">
              처음이신가요? <button onClick={() => setMode('register')} className="text-blue-600 font-bold hover:underline">회원가입</button>
            </div>
          </div>
        )}

        {/* [모드 2 & 3] 로그인 / 회원가입 입력 폼 */}
        {(mode === 'login' || mode === 'register') && (
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1 ml-1">이름</label>
                <input 
                  type="text" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  required 
                  className="w-full p-4 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition" 
                  placeholder="홍길동"
                />
              </div>
            )}
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1 ml-1">이메일</label>
              <input 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                required 
                className="w-full p-4 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition" 
                placeholder="email@example.com"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1 ml-1">비밀번호</label>
              <input 
                type="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                required 
                minLength={8}
                className="w-full p-4 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition" 
                placeholder="8자 이상 입력"
              />
            </div>

            {errorMessage && <p className="text-red-500 text-xs font-bold ml-1">{errorMessage}</p>}

            <button type="submit" className="w-full py-4 mt-2 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 transition shadow-lg shadow-blue-200">
              {mode === 'login' ? '로그인' : '회원가입 완료'}
            </button>

            {/* ★ [모드 2: 로그인] 비밀번호 찾기 링크 */}
            {mode === 'login' && (
              <div className="text-center mt-3">
                <button 
                  type="button" 
                  onClick={() => {
                    onClose(); // 모달 닫기
                    navigate('/forgot-password'); // 비밀번호 찾기 페이지로 이동
                  }} 
                  className="text-sm font-bold text-slate-400 hover:text-blue-600 transition"
                >
                  비밀번호를 잊으셨나요?
                </button>
              </div>
            )}

            <div className="pt-4 text-center">
              <button 
                type="button" 
                onClick={() => setMode(mode === 'login' ? 'register' : 'login')} 
                className="text-sm text-slate-500"
              >
                {mode === 'login' ? '계정이 없으신가요?' : '이미 계정이 있으신가요?'} 
                <span className="text-blue-600 font-bold ml-2 hover:underline">
                  {mode === 'login' ? '회원가입' : '로그인'}
                </span>
              </button>
            </div>
            <div className="text-center mt-2">
              <button type="button" onClick={() => setMode('select')} className="text-slate-300 text-xs hover:text-slate-500 transition">
                ← 이전 화면으로
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default AuthModal;