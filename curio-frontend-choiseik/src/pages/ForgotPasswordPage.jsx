// src/pages/ForgotPasswordPage.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { KeyRound, ChevronLeft, Mail } from 'lucide-react';

function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email.trim()) return;

    // --- [Mock 로직: 실제로는 백엔드에 이메일 발송 API를 요청합니다] ---
    console.log("비밀번호 재설정 이메일 요청:", email);
    setIsSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 font-sans">
      <div className="w-full max-w-md bg-white p-10 rounded-[40px] shadow-xl border border-slate-100 relative">
        <button 
          onClick={() => navigate('/')} 
          className="absolute top-8 left-8 text-slate-400 hover:text-slate-600 transition"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        <div className="text-center mb-8 mt-4">
          <div className="w-14 h-14 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <KeyRound className="w-7 h-7" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 mb-2">비밀번호 찾기</h2>
          <p className="text-sm text-slate-500">
            가입하신 이메일을 입력하시면<br/>비밀번호 재설정 링크를 보내드립니다.
          </p>
        </div>

        {!isSubmitted ? (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2 ml-1">이메일 주소</label>
              <div className="relative">
                <Mail className="absolute left-4 top-4 w-5 h-5 text-slate-400" />
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required 
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition" 
                  placeholder="curio@example.com"
                />
              </div>
            </div>
            <button 
              type="submit" 
              className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 transition shadow-lg shadow-blue-200"
            >
              재설정 링크 받기
            </button>
          </form>
        ) : (
          <div className="text-center bg-blue-50 p-6 rounded-2xl border border-blue-100 animate-slide-up">
            <p className="font-bold text-blue-800 mb-2">이메일이 전송되었습니다!</p>
            <p className="text-sm text-blue-600/80 mb-6">
              메일함에서 재설정 링크를 확인해주세요.<br/>(실제 테스트를 위해 아래 버튼을 누르면 다음 화면으로 넘어갑니다.)
            </p>
            <button 
              onClick={() => navigate('/reset-password')}
              className="w-full py-3 bg-white text-blue-600 border border-blue-200 rounded-xl font-bold hover:bg-blue-50 transition"
            >
              [테스트용] 새 비밀번호 설정 창으로 이동
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default ForgotPasswordPage;