// src/pages/LandingPage.jsx
import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import AuthModal from "../components/AuthModal";

function LandingPage() {
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get('redirect') || null;
  // redirect 파라미터 있으면 모달 자동 오픈
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(!!redirectTo);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      {/* 상단 네비게이션 */}
      <header className="flex justify-between items-center px-8 py-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-black text-xl">
            C
          </div>
          <span className="text-2xl font-black tracking-tight text-blue-900">
            Curio
          </span>
        </div>
        <button
          onClick={() => setIsAuthModalOpen(true)}
          className="px-6 py-2.5 text-sm font-bold text-slate-700 bg-white border border-slate-200 rounded-full hover:bg-slate-50 transition shadow-sm"
        >
          로그인
        </button>
      </header>

      {/* 메인 히어로 섹션 */}
      <main className="max-w-7xl mx-auto px-8 pt-16 pb-24 text-center">
        <div className="inline-block px-4 py-1.5 mb-6 text-sm font-bold text-blue-600 bg-blue-100 rounded-full">
          개인화 뉴스레터 및 정보 큐레이션 서비스
        </div>
        <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-tight mb-8">
          정보 과잉 시대,
          <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
            나에게 꼭 필요한 뉴스만
          </span>
        </h1>
        <p className="text-xl text-slate-500 mb-12 max-w-2xl mx-auto leading-relaxed">
          바쁜 일상 속, 수십 개의 기사를 찾을 필요 없습니다.
          <br />
          Curio가 당신의 관심사를 분석해 핵심만 요약해 드립니다.
        </p>

        <div className="flex flex-col sm:flex-row justify-center gap-4">
          {/* 시작하기 버튼들 (누르면 모두 모달이 열립니다) */}
          <button
            onClick={() => setIsAuthModalOpen(true)}
            className="px-8 py-4 text-lg font-bold text-white bg-blue-600 rounded-2xl hover:bg-blue-700 transition shadow-lg shadow-blue-200 hover:-translate-y-1"
          >
            이메일로 시작하기
          </button>
          <button
            onClick={() => setIsAuthModalOpen(true)}
            className="px-8 py-4 text-lg font-bold text-slate-700 bg-white border border-slate-200 rounded-2xl hover:bg-slate-50 transition flex items-center justify-center gap-3 shadow-sm hover:-translate-y-1"
          >
            <span className="text-xl">G</span> Google로 시작
          </button>
        </div>
      </main>

      {/* 기능 소개 카드 3개 (MoSCoW Must-Have 기준) */}
      <section className="bg-white py-24 border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard
              icon="⚡"
              title="AI 3줄 요약"
              desc="바쁜 출퇴근 시간, 긴 기사를 읽을 필요 없이 Claude AI가 작성한 핵심 3줄 요약으로 트렌드를 파악하세요."
            />
            <FeatureCard
              icon="💡"
              title="개인화 인사이트"
              desc="같은 기사라도 내 관심사에 따라 다르게 해석합니다. 이 뉴스가 '나에게 왜 중요한가'를 1줄로 짚어드립니다."
            />
            <FeatureCard
              icon="✉️"
              title="자동 뉴스레터"
              desc="매일 아침, 내가 설정한 시간에 맞춰 나만의 맞춤형 TOP 5 뉴스레터가 이메일로 자동 발송됩니다."
            />
          </div>
        </div>
      </section>

      {/* 분리한 인증 모달 컴포넌트 렌더링 */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        redirectTo={redirectTo}
      />
    </div>
  );
}

// 기능 소개 카드 컴포넌트
function FeatureCard({ icon, title, desc }) {
  return (
    <div className="p-8 rounded-[32px] bg-slate-50 hover:bg-white hover:shadow-xl hover:shadow-slate-200/50 transition duration-300 border border-transparent hover:border-slate-100">
      <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-2xl mb-6 shadow-sm border border-slate-100">
        {icon}
      </div>
      <h3 className="text-xl font-bold mb-4 text-slate-900">{title}</h3>
      <p className="text-slate-500 leading-relaxed">{desc}</p>
    </div>
  );
}

export default LandingPage;
