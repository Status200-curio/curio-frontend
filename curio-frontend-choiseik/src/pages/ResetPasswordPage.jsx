// src/pages/ResetPasswordPage.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, CheckCircle2 } from 'lucide-react';

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (password.length < 8) {
      setErrorMsg('비밀번호는 8자 이상이어야 합니다.');
      return;
    }
    if (password !== passwordConfirm) {
      setErrorMsg('비밀번호가 일치하지 않습니다.');
      return;
    }

    // --- [Mock 로직: 백엔드에 새 비밀번호 저장 API 요청] ---
    console.log("새 비밀번호 저장 완료");
    setIsSuccess(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 font-sans">
      <div className="w-full max-w-md bg-white p-10 rounded-[40px] shadow-xl border border-slate-100">
        
        <div className="text-center mb-8">
          <div className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-6 ${isSuccess ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'}`}>
            {isSuccess ? <CheckCircle2 className="w-7 h-7" /> : <Lock className="w-7 h-7" />}
          </div>
          <h2 className="text-2xl font-black text-slate-900 mb-2">
            {isSuccess ? '변경 완료!' : '새 비밀번호 설정'}
          </h2>
          <p className="text-sm text-slate-500">
            {isSuccess ? '새로운 비밀번호로 안전하게 로그인하세요.' : '앞으로 사용할 새로운 비밀번호를 입력해주세요.'}
          </p>
        </div>

        {!isSuccess ? (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2 ml-1">새 비밀번호</label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required 
                className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition" 
                placeholder="8자 이상 입력"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2 ml-1">비밀번호 확인</label>
              <input 
                type="password" 
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
                required 
                className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition" 
                placeholder="다시 한 번 입력"
              />
            </div>
            
            {errorMsg && <p className="text-red-500 text-sm font-bold text-center">{errorMsg}</p>}

            <button 
              type="submit" 
              className="w-full py-4 mt-2 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 transition shadow-lg shadow-blue-200"
            >
              비밀번호 변경 완료
            </button>
          </form>
        ) : (
          <button 
            onClick={() => navigate('/')}
            className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition shadow-lg"
          >
            로그인 화면으로 돌아가기
          </button>
        )}
      </div>
    </div>
  );
}

export default ResetPasswordPage;